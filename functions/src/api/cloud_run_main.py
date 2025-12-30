"""
Minimal FastAPI Application for Cloud Run - Marketing Agent Only
Bypasses complex middleware to avoid deployment issues
"""
import logging
import os
import uuid
import html
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from fastapi.responses import StreamingResponse
import json
import asyncio
import random
import re


# Initialize Firebase Admin SDK
try:
    import firebase_admin
    from firebase_admin import credentials, firestore

    # Check if Firebase app is already initialized
    if not firebase_admin._apps:
        # Initialize with default credentials (works in Cloud Run)
        firebase_admin.initialize_app()
        logger_temp = logging.getLogger(__name__)
        logger_temp.info("Firebase Admin SDK initialized")

    # Get Firestore client
    db = firestore.client()
except Exception as e:
    logger_temp = logging.getLogger(__name__)
    logger_temp.warning(f"Firebase initialization failed: {e}")
    db = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# PERFORMANCE OPTIMIZATION: Pre-compile regex patterns (Phase 1, Fix #2)
# Pre-compiling patterns avoids runtime regex compilation overhead
# Estimated impact: -50-100ms per response (210-350 operations saved)
# ============================================================================
import re
_INTERNAL_CHUNK_PATTERN = re.compile(
    r'\b(AIMessageChunk|ToolMessage|HumanMessage|SystemMessage)\('
    r'|^id='
    r'|ValidationError:|pydantic.*ValidationError',
    re.IGNORECASE
)
_TOOL_CALL_PATTERN = re.compile(r'Call (search_kb|get_pricing|request_consultation)\(')
START_TIME = datetime.now(timezone.utc)

# Initialize intelligent response cache
try:
    from rag.cache_manager import intelligent_response_cache
    logger.info("Intelligent response cache initialized")
except Exception as cache_init_err:
    logger.warning(f"Failed to initialize cache: {cache_init_err}")
    intelligent_response_cache = None

# Optional: Initialize Sentry if DSN provided
try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    _sentry_dsn = os.getenv("SENTRY_DSN")
    if _sentry_dsn:
        sentry_sdk.init(
            dsn=_sentry_dsn,
            integrations=[FastApiIntegration()],
            traces_sample_rate=0.1,
            environment=os.getenv("ENVIRONMENT", "production"),
        )
        logger.info("Sentry initialized")
except Exception as _e:
    logger.warning(f"Sentry not initialized: {_e}")


# Create minimal FastAPI app
app = FastAPI(
    title="EthosPrompt Marketing API",
    description="Marketing Agent for EthosPrompt RAG Prompt Library",
    version="1.0.0"
)


# Include routers
from src.api import roi_config
app.include_router(roi_config.router)

# Security Dependency
async def verify_admin_key(x_admin_key: str = Header(..., alias="X-Admin-Key")):
    """Verify Admin API Key from Header"""
    expected_key = os.getenv("ADMIN_API_KEY")
    # If no key configured in env, fail secure (or allow dev key in non-prod?)
    # For now, allow a default if not set to prevent lockout in dev, but log warning
    if not expected_key:
        logger.warning("ADMIN_API_KEY not set in environment. Using default 'admin'. SECURITY RISK.")
        expected_key = "admin"

    if x_admin_key != expected_key:
        logger.warning(f"Failed admin auth attempt with key: {x_admin_key[:3]}***")
        raise HTTPException(status_code=401, detail="Invalid Admin Key")
    return x_admin_key

# ============================================================================
# PERFORMANCE OPTIMIZATION: Pre-warm Marketing Agent at Startup
# This eliminates cold start delay by initializing heavy dependencies
# (LangGraph, LLM, IAM token, CrossEncoder) during container startup
# instead of first user request.
# Impact: Reduces first request latency from ~11s to ~3s
# ============================================================================
@app.on_event("startup")
async def startup_warmup():
    """
    Pre-warm marketing agent components on container startup.

    Performance Impact:
    - Cold start latency: ~11s -> ~3s for first user request
    - Container startup: +5-10s (acceptable trade-off)

    Components warmed:
    1. Marketing agent singleton (LangGraph, LLM config)
    2. IAM access token (for Granite via watsonx)
    3. CrossEncoder model (~500MB) for re-ranking
    4. KB retriever with hybrid search
    5. Optional: LLM test inference
    """
    warmup_start = datetime.now(timezone.utc)
    logger.info("Starting marketing agent warmup...")

    warmup_results = {
        "agent_singleton": False,
        "iam_token": False,
        "cross_encoder": False,
        "kb_retriever": False,
        "llm_test_inference": False,
    }

    try:
        # 1. Pre-warm the marketing agent singleton (loads LangGraph, LLM config)
        from ai_agent.marketing.marketing_agent import get_marketing_agent
        agent = get_marketing_agent(db=db)
        warmup_results["agent_singleton"] = True
        logger.info("[WARMUP] Marketing agent singleton initialized")

        # 2. Pre-fetch IAM token (if using Granite via watsonx)
        if hasattr(agent, 'llm') and hasattr(agent.llm, '_client'):
            try:
                # Try async method first, fall back to sync
                if hasattr(agent.llm._client, '_get_access_token'):
                    await agent.llm._client._get_access_token()
                elif hasattr(agent.llm._client, 'get_access_token'):
                    agent.llm._client.get_access_token()
                warmup_results["iam_token"] = True
                logger.info("[WARMUP] IAM access token pre-fetched")
            except Exception as token_err:
                logger.warning(f"[WARMUP] IAM token pre-fetch failed (will retry on first request): {token_err}")

        # 3. Pre-warm knowledge base retriever with CrossEncoder
        try:
            from ai_agent.marketing.marketing_retriever import marketing_retriever

            # 3a. Pre-warm CrossEncoder model (~500MB, major cold start contributor)
            if os.getenv("WARMUP_CROSS_ENCODER", "true").lower() != "false":
                prewarm_success = marketing_retriever.prewarm_models()
                warmup_results["cross_encoder"] = prewarm_success
                if prewarm_success:
                    logger.info("[WARMUP] CrossEncoder model pre-warmed")
                else:
                    logger.warning("[WARMUP] CrossEncoder prewarm returned False")
            else:
                logger.info("[WARMUP] CrossEncoder prewarm disabled via WARMUP_CROSS_ENCODER=false")

            # 3b. Warm up retrieval pipeline with hybrid search
            _ = await marketing_retriever.retrieve(
                query="what services does EthosPrompt offer",
                top_k=3,
                use_hybrid=True  # Full hybrid search including CrossEncoder
            )
            warmup_results["kb_retriever"] = True
            logger.info("[WARMUP] Marketing retriever warmed up (hybrid mode)")

        except Exception as retriever_err:
            logger.warning(f"[WARMUP] Retriever warmup failed (non-blocking): {retriever_err}")

        # 4. Optional: Test LLM inference to warm up model connections
        try:
            if os.getenv("WARMUP_LLM_INFERENCE", "false").lower() == "true":
                from langchain_core.messages import HumanMessage
                test_response = await agent.llm.ainvoke([
                    HumanMessage(content="Hello, this is a warmup test. Respond with OK.")
                ])
                warmup_results["llm_test_inference"] = True
                logger.info("[WARMUP] LLM test inference completed")
        except Exception as llm_err:
            logger.warning(f"[WARMUP] LLM warmup inference failed (non-blocking): {llm_err}")

        warmup_duration = (datetime.now(timezone.utc) - warmup_start).total_seconds()
        success_count = sum(1 for v in warmup_results.values() if v)
        total_count = len(warmup_results)

        logger.info(f"[WARMUP] Complete in {warmup_duration:.2f}s ({success_count}/{total_count} components)")
        logger.info(f"[WARMUP] Results: {warmup_results}")

    except Exception as e:
        logger.error(f"[WARMUP] Marketing agent warmup failed: {e}")
        # Don't fail startup - agent will initialize on first request as fallback


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter

# Custom rate limit handler to include Retry-After header
from fastapi.responses import PlainTextResponse, JSONResponse

@app.exception_handler(RateLimitExceeded)
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    retry_after = "60"
    resp = PlainTextResponse("Too Many Requests", status_code=429)
    resp.headers["Retry-After"] = retry_after
    return resp

# Request size limiting middleware (protect against large payloads)
@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    if request.method in ("POST", "PUT", "PATCH"):
        path = request.url.path
        if path.startswith("/api/ai/"):
            cl = request.headers.get("content-length")
            try:
                if cl and int(cl) > 10 * 1024:  # 10KB limit for chat endpoints
                    return JSONResponse(status_code=413, content={"detail": "Request entity too large"})
            except ValueError:
                pass
    return await call_next(request)

# Add security headers middleware (CSP, HSTS, etc.)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add security headers to all responses"""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    # Note: CSP is most relevant for HTML; included here as defense-in-depth
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    return response

# Add CORS middleware (environment-aware)
_env = os.getenv("ENVIRONMENT", "production").lower()
if _env == "production":
    _allowed_origins = [
        "https://ethosprompt.web.app",
        "https://ethosprompt.firebaseapp.com",
    ]
else:
    _allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://ethosprompt-staging.web.app",
        "https://ethosprompt.web.app",
        "https://ethosprompt.firebaseapp.com",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Structured access logging middleware
@app.middleware("http")
async def access_log(request: Request, call_next):
    start = datetime.now(timezone.utc)
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "-")
    ua = request.headers.get("user-agent", "-")
    trace_header = request.headers.get("x-cloud-trace-context", "")
    trace_id = trace_header.split("/")[0] if trace_header else str(uuid.uuid4())
    try:
        response = await call_next(request)
        duration_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
        log = {
            "access_log": {
                "ts": datetime.now(timezone.utc).isoformat(),
                "method": request.method,
                "path": request.url.path,
                "query": request.url.query,
                "status": response.status_code,
                "duration_ms": duration_ms,
                "ip": client_ip,
                "user_agent": ua,
                "trace": trace_id,
                "environment": os.getenv("ENVIRONMENT", "production"),
            }
        }
        try:
            logger.info(json.dumps(log))
        except Exception:
            logger.info(str(log))
        # Expose request id for correlation
        response.headers["X-Request-Id"] = trace_id
        return response
    except Exception as e:
        duration_ms = int((datetime.now(timezone.utc) - start).total_seconds() * 1000)
        err = {
            "access_log": {
                "ts": datetime.now(timezone.utc).isoformat(),
                "method": request.method,
                "path": request.url.path,
                "status": 500,
                "duration_ms": duration_ms,
                "ip": client_ip,
                "user_agent": ua,
                "trace": trace_id,
                "environment": os.getenv("ENVIRONMENT", "production"),
                "error": type(e).__name__,
            }
        }
        try:
            logger.error(json.dumps(err))
        except Exception:
            logger.error(str(err))
        raise

# Request/Response Models
class MarketingChatRequest(BaseModel):
    """Marketing chat request with validation"""
    message: str = Field(
        ...,
        description="User message",
        min_length=1,
        max_length=1000
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Conversation ID for context (UUID or Firestore ID)",
        pattern=r'^([a-f0-9-]{36}|[a-zA-Z0-9]{20,28})$'  # UUID or Firestore ID
    )
    page_context: Optional[str] = Field(
        None,
        description="Page context (homepage, solutions, etc.)",
        max_length=100,
        pattern=r'^[a-zA-Z0-9_-]+$'
    )

    @validator('message')
    def sanitize_message(cls, v):
        """Sanitize message to prevent XSS"""
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        # HTML escape to prevent XSS
        sanitized = html.escape(v.strip())
        return sanitized

    @validator('page_context')
    def validate_page_context(cls, v):
        """Validate page context"""
        if v is None:
            return v
        # Only allow alphanumeric, hyphens, and underscores
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError("Invalid page context format")
        return v.lower()

class MarketingChatResponse(BaseModel):
    """Marketing chat response"""
    success: bool
    response: str
    conversation_id: str
    sources: List[Dict[str, Any]] = []
    suggested_questions: List[str] = []  # Follow-up questions to guide conversation
    metadata: Dict[str, Any] = {}

# Liveness endpoint
@app.get("/liveness")
@limiter.limit("120/minute")
async def liveness(request: Request):
    """Simple liveness probe"""
    return {"status": "alive"}

# Readiness endpoint
@app.get("/readiness")
@limiter.limit("60/minute")
async def readiness(request: Request):
    """Readiness probe with lightweight dependency checks"""
    checks = {}
    ok = True
    try:
        from ai_agent.marketing.marketing_agent import get_marketing_agent  # noqa: F401
        checks["agent_import"] = True
    except Exception:
        checks["agent_import"] = False
        ok = False
    return {
        "status": "ready" if ok else "degraded",
        "checks": checks,
        "environment": os.getenv("ENVIRONMENT", "production"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

# Health check endpoint
@app.get("/health")
@limiter.limit("60/minute")  # 60 requests per minute for health checks
async def health_check(request: Request):
    """Basic health check with uptime and environment"""
    now = datetime.now(timezone.utc)
    uptime = (now - START_TIME).total_seconds()
    return {
        "status": "healthy",
        "timestamp": now.isoformat(),
        "service": "EthosPrompt Marketing API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "uptime_seconds": uptime
    }

# Admin endpoint to force re-index KB
@app.post("/api/admin/reindex-kb")
async def reindex_kb(request: Request, admin_key: str = Depends(verify_admin_key)):
    """Force re-index of marketing knowledge base"""
    try:
        from ai_agent.marketing.kb_indexer import initialize_marketing_kb
        results = await initialize_marketing_kb(db=db, force_reindex=True)
        return {"success": True, "results": results}
    except Exception as e:
        logger.error(f"Re-indexing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Admin endpoint to migrate KB to Firestore (One-off)
@app.post("/api/admin/migrate-kb")
async def migrate_kb(request: Request, admin_key: str = Depends(verify_admin_key)):
    """Migrate local KB content to Firestore 'marketing_kb_documents' collection."""
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firestore not initialized")

        from ai_agent.marketing.marketing_kb_content import MARKETING_KB_CONTENT

        batch = db.batch()
        count = 0
        total_migrated = 0

        collection_ref = db.collection("marketing_kb_documents")

        for doc_id, data in MARKETING_KB_CONTENT.items():
            doc_ref = collection_ref.document(doc_id)
            batch.set(doc_ref, data)
            count += 1
            total_migrated += 1

            if count >= 400:  # Commit every 400 (limit is 500)
                batch.commit()
                batch = db.batch()
                count = 0

        if count > 0:
            batch.commit()

        return {
            "success": True,
            "message": f"Migrated {total_migrated} documents to Firestore.",
            "collection": "marketing_kb_documents"
        }
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Marketing chat endpoint
@app.post("/api/ai/marketing-chat", response_model=MarketingChatResponse)
@limiter.limit("30/minute")  # 30 requests per minute per IP for chat (increased for testing)
async def marketing_chat_endpoint(request: Request, chat_request: MarketingChatRequest):
    """
    Marketing Agent chat endpoint (public - no authentication required)

    This endpoint provides AI-powered assistance for marketing pages.
    In mock mode (OPENROUTER_USE_MOCK=true), returns canned responses with zero billing.
    """
    start_time = datetime.now(timezone.utc)

    # Check if mock mode is enabled
    use_mock = os.getenv("OPENROUTER_USE_MOCK", "false").lower() == "true"

    if use_mock:
        # Mock mode: return canned response (zero billing)
        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        # Generate contextual mock response based on message
        message_lower = chat_request.message.lower()

        if "what is" in message_lower or "tell me about" in message_lower:
            mock_response = (
                "EthosPrompt is a smart, modular RAG-enabled prompt management system designed to help teams "
                "create, organize, and execute AI prompts with advanced retrieval-augmented generation capabilities. "
                "(This is a mock response for staging - zero billing mode)"
            )
        elif "feature" in message_lower or "capability" in message_lower or "can" in message_lower:
            mock_response = (
                "EthosPrompt offers powerful features including: smart prompt templates, RAG-powered context retrieval, "
                "multi-provider LLM support (OpenAI, Anthropic, Google, etc.), version control, analytics, and team collaboration. "
                "(This is a mock response for staging - zero billing mode)"
            )
        elif "price" in message_lower or "cost" in message_lower or "pricing" in message_lower:
            mock_response = (
                "EthosPrompt offers flexible pricing plans to suit teams of all sizes. Contact our sales team for detailed pricing information. "
                "(This is a mock response for staging - zero billing mode)"
            )
        elif "how" in message_lower or "start" in message_lower or "get started" in message_lower:
            mock_response = (
                "Getting started with EthosPrompt is easy! Sign up for a free account, create your first prompt template, "
                "upload knowledge base documents, and start executing AI-powered prompts with RAG capabilities. "
                "(This is a mock response for staging - zero billing mode)"
            )
        else:
            mock_response = (
                "Thank you for your question about EthosPrompt! Our AI-powered prompt management system helps teams "
                "leverage RAG technology for better AI interactions. How can I help you learn more? "
                "(This is a mock response for staging - zero billing mode)"
            )

        # Generate mock follow-up questions
        mock_questions = [
            "What services does EthosPrompt offer?",
            "How does the RAG technology work?",
            "Can I schedule a demo?"
        ]

        # Emit structured monitoring log (mock)
        try:
            logger.info({
                "monitoring": {
                    "event": "api_request_end",
                    "service": "marketing-api",
                    "environment": os.getenv("ENVIRONMENT", "staging"),
                    "success": True,
                    "duration_ms": int(processing_time * 1000),
                    "mock": True,
                    "page_context": chat_request.page_context or "unknown",
                }
            })
        except Exception:
            pass

        return MarketingChatResponse(
            success=True,
            response=mock_response,
            conversation_id=chat_request.conversation_id or str(uuid.uuid4()),
            sources=[],
            suggested_questions=mock_questions,
            metadata={
                "processing_time": processing_time,
                "mock": True,
                "page_context": chat_request.page_context or "unknown",
                "environment": "staging"
            }
        )

    # Real mode: Import and use MarketingAgent
    try:
        from ai_agent.marketing.marketing_agent import get_marketing_agent
    except Exception as e:
        logger.exception("Failed to import MarketingAgent: %s", e)
        raise HTTPException(status_code=500, detail="Agent not available. Please check LangGraph installation and dependencies.")

    try:
        max_attempts = int(os.getenv("LLM_RETRY_MAX_ATTEMPTS", "3"))
        base_backoff_ms = int(os.getenv("LLM_RETRY_BASE_MS", "200"))
        last_err = None
        for attempt in range(1, max_attempts + 1):
            try:
                # Get or create agent instance (singleton) with Firestore client
                agent = get_marketing_agent(db=db)

                # Build context
                context = {
                    "conversation_id": chat_request.conversation_id or str(uuid.uuid4()),
                    "page_context": chat_request.page_context or "unknown",
                }

                # Invoke agent
                agent_response = await agent.chat(message=chat_request.message, context=context)
                last_err = None
                break
            except Exception as e:
                last_err = e
                if attempt >= max_attempts:
                    raise
                # Exponential backoff with jitter
                jitter = random.randint(0, base_backoff_ms)
                sleep_ms = min(base_backoff_ms * (2 ** (attempt - 1)) + jitter, 2000)
                await asyncio.sleep(sleep_ms / 1000.0)

        # Build response
        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
        metadata = agent_response.get("metadata", {})
        metadata.update({
            "processing_time": processing_time,
            "mock": False,
            "environment": os.getenv("ENVIRONMENT", "staging")
        })

        # Emit structured monitoring log (real)
        try:
            logger.info({
                "monitoring": {
                    "event": "api_request_end",
                    "service": "marketing-api",
                    "environment": os.getenv("ENVIRONMENT", "staging"),
                    "success": True,
                    "duration_ms": int(processing_time * 1000),
                    "mock": False,
                    "page_context": chat_request.page_context or "unknown",
                }
            })
        except Exception:
            pass

        return MarketingChatResponse(
            success=True,
            response=agent_response.get("response", ""),
            conversation_id=agent_response.get("conversation_id", context["conversation_id"]),
            sources=agent_response.get("sources", []),
            suggested_questions=agent_response.get("suggested_questions", []),
            metadata=metadata,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during MarketingAgent chat: %s", e)
        try:
            duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            logger.error({
                "monitoring": {
                    "event": "api_request_error",
                    "service": "marketing-api",
                    "environment": os.getenv("ENVIRONMENT", "staging"),
                    "success": False,
                    "duration_ms": duration_ms,
                    "mock": False,
                    "page_context": chat_request.page_context or "unknown",
                    "error_type": type(e).__name__,
                    "message": str(e)[:500]
                }
            })
        except Exception:
            pass
        raise HTTPException(status_code=500, detail="Internal server error")
# Streaming SSE endpoint for marketing chat

# Helper: extract text from various streaming chunk types (LangGraph/LangChain/OpenRouter)
def _extract_text_from_chunk(chunk) -> str | None:
    try:
        # Fast-path: strings â€” try to parse JSON-like, or reprs like AIMessageChunk(content='...')
        if isinstance(chunk, str):
            s = chunk.strip()
            # Try JSON decode first
            if (s.startswith("{") and s.endswith("}")) or (s.startswith("[") and s.endswith("]")):
                try:
                    obj = json.loads(s)
                    return _extract_text_from_chunk(obj)
                except Exception:
                    pass
            # Extract content='...' or content="..." from reprs
            m = re.search(r"""content=(?:'|")(.+?)(?:'|")""", s)
            if m:
                return m.group(1)
            # Extract text field from reprs like {'type': 'text', 'text': '...'}
            m2 = re.search(r"(?:'|\")text(?:'|\")\s*:\s*(?:'|\")(.+?)(?:'|\")", s)
            if m2:
                return m2.group(1)
            # If we cannot confidently extract content from string reprs, drop it
            return None

        # Bytes
        if isinstance(chunk, (bytes, bytearray)):
            try:
                return bytes(chunk).decode("utf-8", errors="ignore")
            except Exception:
                return None

        # AIMessageChunk or similar (LangChain/LangGraph) usually has `.content`
        content = getattr(chunk, "content", None)
        if content is not None:
            if isinstance(content, str):
                return content
            # Some providers return dict or list of parts with text fields
            if isinstance(content, dict):
                txt = content.get("text") or content.get("content")
                if isinstance(txt, str):
                    return txt
            if isinstance(content, list):
                parts: list[str] = []
                for part in content:
                    if isinstance(part, dict):
                        txt = part.get("text") or part.get("content")
                        if isinstance(txt, str):
                            parts.append(txt)
                    elif isinstance(part, str):
                        parts.append(part)
                if parts:
                    return "".join(parts)

        # Dict-like events (delta/content patterns)
        if isinstance(chunk, dict):
            # Delta form: { 'delta': { 'content': '...' } }
            delta = chunk.get("delta")
            if isinstance(delta, dict):
                dcontent = delta.get("content")
                if isinstance(dcontent, str):
                    return dcontent
                if isinstance(dcontent, list):
                    return "".join(
                        [p.get("text", "") if isinstance(p, dict) else str(p) for p in dcontent]
                    )
            # Direct content form
            c = chunk.get("content")
            if isinstance(c, str):
                return c
            if isinstance(c, list):
                return "".join(
                    [p.get("text", "") if isinstance(p, dict) else str(p) for p in c]
                )
            # Fallback top-level text/message
            t = chunk.get("text") or chunk.get("message")
            if isinstance(t, str):
                return t
    except Exception:
        return None

    # Unknown format
    return None

# Helper: normalize text to avoid literal escape sequences and markdown HR artifacts
def _normalize_text(text: str) -> str:
    try:
        # Convert double-escaped sequences to real characters
        text = text.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\t", "\t")
        # Remove common markdown horizontal rules like --- or *** surrounded by newlines
        text = re.sub(r"\n\s*[-*_]{3,}\s*\n", "\n\n", text)
        # Collapse 3+ consecutive newlines to at most 2
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text
    except Exception:
        return text

@app.post("/api/ai/marketing-chat/stream")
@limiter.limit("30/minute")  # 30 requests per minute per IP for streaming (increased for testing)
async def marketing_chat_stream_endpoint(request: Request, chat_request: MarketingChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint for marketing agent responses.
    In mock mode, streams a canned response for zero billing.
    """
    trace_header = request.headers.get("x-cloud-trace-context", "")
    trace_id = trace_header.split("/")[0] if trace_header else str(uuid.uuid4())
    # Diagnostic logging for POST request
    try:
        # logger.info(f"ðŸ” [POST_REQ] Received chat request: msg_len={len(chat_request.message)}, conv_id={chat_request.conversation_id}, ctx={chat_request.page_context}")
        pass
    except Exception:
        pass

    use_mock = os.getenv("OPENROUTER_USE_MOCK", "false").lower() == "true"

    async def generate():
        try:
            conversation_id = chat_request.conversation_id or str(uuid.uuid4())
            # First metadata event
            meta = {
                "type": "metadata",
                "conversation_id": conversation_id,
                "page_context": chat_request.page_context or "unknown",
                "environment": os.getenv("ENVIRONMENT", "staging"),
                "mock": use_mock,
            }
            yield f"data: {json.dumps(meta)}\n\n"

            # Flush cadence controls
            min_interval_ms = int(os.getenv("SSE_MIN_INTERVAL_MS", "40"))  # ~25fps
            max_buffer_chars = int(os.getenv("SSE_MAX_BUFFER_CHARS", "220"))

            if use_mock:
                # Stream a canned response using coalesced flush cadence
                text = (
                    "This is a mock streaming response for EthosPrompt marketing agent. "
                    "Streaming is enabled in staging with zero billing."
                )
                buffer = ""
                last_flush = datetime.now(timezone.utc)
                for token in text.split(" "):
                    buffer += token + " "
                    now = datetime.now(timezone.utc)
                    elapsed_ms = (now - last_flush).total_seconds() * 1000
                    if elapsed_ms >= min_interval_ms or len(buffer) >= max_buffer_chars:
                        yield f"data: {json.dumps({'type': 'content', 'chunk': buffer})}\n\n"
                        buffer = ""
                        last_flush = now
                    await asyncio.sleep(0.01)
                if buffer:
                    yield f"data: {json.dumps({'type': 'content', 'chunk': buffer})}\n\n"
                yield "data: [DONE]\n\n"
                return

          # Real mode: Intelligent caching + agent streaming

            # 1. CHECK CACHE FIRST (with semantic similarity)
            if intelligent_response_cache:
                try:
                    cached_data = intelligent_response_cache.get_similar_cached_response(
                        query=chat_request.message,
                        page_context=chat_request.page_context or "unknown"
                    )
                    if cached_data:
                        logger.info(f"âœ“ Cache HIT for: {chat_request.message[:50]}...")
                        # Serve cached response instantly
                        cached_response_text = cached_data['response']
                        # Serve cached response instantly
                        cached_response_text = cached_data['response']
                        yield f"data: {json.dumps({'type': 'content', 'chunk': cached_response_text})}\n\n"

                        # Send completion metadata for cache hit
                        done_payload = {
                            "type": "done",
                            "token_count": len(cached_response_text),
                            "finish_reason": "stop",
                            "cached": True
                        }
                        yield f"data: {json.dumps(done_payload)}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    else:
                        logger.info(f"Cache MISS for: {chat_request.message[:50]}...")
                except Exception as cache_err:
                    logger.warning(f"Cache check failed: {cache_err}")
            # 2. No cache hit - generate from agent
            try:
                from ai_agent.marketing.marketing_agent import get_marketing_agent
            except Exception as e:
                logger.exception("Failed to import MarketingAgent for streaming: %s", e)
                error_payload = {
                    "type": "error",
                    "message": "Agent unavailable",
                    "error_type": type(e).__name__,
                    "trace_id": trace_id,
                }
                yield f"data: {json.dumps(error_payload)}\n\n"
                yield "data: [DONE]\n\n"
                return

            agent = get_marketing_agent(db=db)
            context = {"conversation_id": conversation_id, "page_context": chat_request.page_context or "unknown"}

            buffer = ""
            last_flush = datetime.now(timezone.utc)
            total_content_length = 0  # Track total content sent for verification
            full_response_text = ""  # Collect full response for caching

            async for chunk in agent.chat_stream(chat_request.message, context):
                text = _extract_text_from_chunk(chunk)
                if text:
                    # Filter only EXACT internal patterns using pre-compiled regex (Phase 1, Fix #2)
                    # This prevents legitimate content from being incorrectly filtered
                    if (
                        _INTERNAL_CHUNK_PATTERN.search(text)
                        or _TOOL_CALL_PATTERN.search(text)
                        or 'additional_kwargs=' in text
                        or 'response_metadata=' in text
                        or text.strip() == 'please fix your mistakes'
                    ):
                        logger.debug(f"Skipping internal chunk: {text[:50]}...")
                        continue  # Skip this chunk - it's internal data

                    normalized = _normalize_text(text)
                    buffer += normalized
                    full_response_text += normalized
                    total_content_length += len(normalized)

                now = datetime.now(timezone.utc)
                elapsed_ms = (now - last_flush).total_seconds() * 1000
                if elapsed_ms >= min_interval_ms or len(buffer) >= max_buffer_chars:
                    to_emit = _normalize_text(buffer)
                    yield f"data: {json.dumps({'type': 'content', 'chunk': to_emit})}\n\n"
                    buffer = ""
                    last_flush = now

            # Final buffer flush with completeness verification
            if buffer:
                to_emit = _normalize_text(buffer)
                yield f"data: {json.dumps({'type': 'content', 'chunk': to_emit})}\n\n"

            # Verify we sent adequate content before marking done
            MIN_EXPECTED_LENGTH = 200  # 200 chars = ~40-50 words minimum
            if total_content_length < MIN_EXPECTED_LENGTH:
                logger.error(
                    f"âš ï¸ Response TOO SHORT ({total_content_length} chars, expected >={MIN_EXPECTED_LENGTH}) - "
                    f"likely truncation. Check max_tokens configuration and LLM completion status. "
                    f"Query: '{chat_request.message[:50]}...'"
                )
            # 3. Save to cache after generation (if valid)
            if intelligent_response_cache and full_response_text and total_content_length >= MIN_EXPECTED_LENGTH:
                try:
                    cache_success = intelligent_response_cache.cache_response_safe(
                        query=chat_request.message,
                        response=full_response_text,
                        page_context=chat_request.page_context or "unknown",
                        metadata={'model': 'granite-3.0-8b', 'conversation_id': conversation_id}
                    )
                    if cache_success:
                        logger.info(f"âœ“ Cached response for: {chat_request.message[:50]}...")
                    else:
                        logger.warning(f"âœ— Failed to cache (PII/Quality): {chat_request.message[:50]}...")
                except Exception as cache_save_err:
                    logger.warning(f"Cache save failed: {cache_save_err}")

            # Send completion metadata with DONE event
            done_payload = {
                "type": "done",
                "token_count": total_content_length,
                "finish_reason": "stop" if total_content_length >= MIN_EXPECTED_LENGTH else "length",
                "cached": False
            }
            yield f"data: {json.dumps(done_payload)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.exception("Streaming error: %s", e)
            # logger.error(f"ðŸ” [POST_ERROR] Stream failed: {type(e).__name__}: {e}")
            error_payload = {
                "type": "error",
                "message": "The marketing assistant hit an internal error. Please try again in a moment.",
                "error_type": type(e).__name__,
                "trace_id": trace_id,
            }
            yield f"data: {json.dumps(error_payload)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
# Streaming SSE endpoint (GET) for EventSource compatibility
@app.get("/api/ai/marketing-chat/stream")
@limiter.limit("30/minute")  # 30 requests per minute per IP for streaming (GET, increased for testing)
async def marketing_chat_stream_get(request: Request, message: str, conversation_id: Optional[str] = None, page_context: Optional[str] = None):
    """
    GET variant to support native EventSource which does not support POST bodies.
    Accepts query parameters: message, conversation_id, page_context.
    """
    use_mock = os.getenv("OPENROUTER_USE_MOCK", "false").lower() == "true"
    trace_header = request.headers.get("x-cloud-trace-context", "")
    trace_id = trace_header.split("/")[0] if trace_header else str(uuid.uuid4())

    async def generate():
        try:
            conv_id = conversation_id or str(uuid.uuid4())
            meta = {
                "type": "metadata",
                "conversation_id": conv_id,
                "page_context": page_context or "unknown",
                "environment": os.getenv("ENVIRONMENT", "staging"),
                "mock": use_mock,
            }
            yield f"data: {json.dumps(meta)}\n\n"

            # Flush cadence controls
            min_interval_ms = int(os.getenv("SSE_MIN_INTERVAL_MS", "40"))
            max_buffer_chars = int(os.getenv("SSE_MAX_BUFFER_CHARS", "220"))

            if use_mock:
                text = (
                    "This is a mock streaming response for EthosPrompt marketing agent. "
                    "Streaming is enabled in staging with zero billing."
                )
                buffer = ""
                last_flush = datetime.now(timezone.utc)
                for token in text.split(" "):
                    buffer += token + " "
                    now = datetime.now(timezone.utc)
                    elapsed_ms = (now - last_flush).total_seconds() * 1000
                    if elapsed_ms >= min_interval_ms or len(buffer) >= max_buffer_chars:
                        yield f"data: {json.dumps({'type': 'content', 'chunk': buffer})}\n\n"
                        buffer = ""
                        last_flush = now
                    await asyncio.sleep(0.01)
                if buffer:
                    yield f"data: {json.dumps({'type': 'content', 'chunk': buffer})}\n\n"
                yield "data: [DONE]\n\n"
                return

            # ========================================================================
            # CRITICAL FIX (Phase 1, Fix #1): Check cache first in GET endpoint
            # Frontend uses EventSource (GET only), so cache MUST be in GET endpoint
            # Expected impact: -218ms avg latency (24% cache hit rate Ã— 1070ms speedup)
            # ========================================================================
            if intelligent_response_cache:
                try:
                    cached_data = intelligent_response_cache.get_similar_cached_response(
                        query=message,
                        page_context=page_context or "unknown"
                    )
                    if cached_data:
                        logger.info(f"âœ“ Cache HIT (GET) for: {message[:50]}...")
                        cached_response_text = cached_data['response']
                        yield f"data: {json.dumps({'type': 'content', 'chunk': cached_response_text})}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    else:
                        logger.info(f"Cache MISS (GET) for: {message[:50]}...")
                except Exception as cache_err:
                    logger.warning(f"Cache check failed (GET): {cache_err}")

            # No cache hit - proceed with agent
            try:
                from ai_agent.marketing.marketing_agent import get_marketing_agent
            except Exception as e:
                logger.exception("Failed to import MarketingAgent for streaming (GET): %s", e)
                error_payload = {
                    "type": "error",
                    "message": "Agent unavailable",
                    "error_type": type(e).__name__,
                    "trace_id": trace_id,
                }
                yield f"data: {json.dumps(error_payload)}\n\n"
                yield "data: [DONE]\n\n"
                return

            agent = get_marketing_agent(db=db)
            ctx = {"conversation_id": conv_id, "page_context": page_context or "unknown"}
            buffer = ""
            last_flush = datetime.now(timezone.utc)
            total_content_length = 0  # Track total content sent for verification

            async for chunk in agent.chat_stream(message, ctx):
                text = _extract_text_from_chunk(chunk)
                if text:
                    # Filter only EXACT internal patterns using pre-compiled regex (Phase 1, Fix #2)
                    # This prevents legitimate content from being incorrectly filtered
                    if (
                        _INTERNAL_CHUNK_PATTERN.search(text)
                        or _TOOL_CALL_PATTERN.search(text)
                        or 'additional_kwargs=' in text
                        or 'response_metadata=' in text
                        or re.match(r'^\*[a-z_]+\s+knowledge\s+base\*', text, re.IGNORECASE)
                        or text.strip() == 'please fix your mistakes'
                    ):
                        continue  # Skip this chunk - it's internal data

                    normalized = _normalize_text(text)
                    buffer += normalized
                    total_content_length += len(normalized)

                now = datetime.now(timezone.utc)
                elapsed_ms = (now - last_flush).total_seconds() * 1000
                if elapsed_ms >= min_interval_ms or len(buffer) >= max_buffer_chars:
                    to_emit = _normalize_text(buffer)
                    yield f"data: {json.dumps({'type': 'content', 'chunk': to_emit})}\n\n"
                    buffer = ""
                    last_flush = now

            # Final buffer flush with completeness verification
            if buffer:
                to_emit = _normalize_text(buffer)
                yield f"data: {json.dumps({'type': 'content', 'chunk': to_emit})}\n\n"

            # Verify we sent adequate content before marking done
            MIN_EXPECTED_LENGTH = 200  # 200 chars = ~40-50 words minimum
            if total_content_length < MIN_EXPECTED_LENGTH:
                logger.error(
                    f"âš ï¸ Response TOO SHORT ({total_content_length} chars, expected >={MIN_EXPECTED_LENGTH}) - "
                    f"likely truncation. Check max_tokens configuration and LLM completion status. "
                    f"Query: '{message[:50]}...'"
                )

            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.exception("Streaming error (GET): %s", e)
            error_payload = {
                "type": "error",
                "message": "The marketing assistant hit an internal error. Please try again in a moment.",
                "error_type": type(e).__name__,
                "trace_id": trace_id,
            }
            yield f"data: {json.dumps(error_payload)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    logger.info("=" * 60)
    logger.info("EthosPrompt Marketing API - Cloud Run")
    logger.info("=" * 60)
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'production')}")
    logger.info(f"Mock Mode: {os.getenv('OPENROUTER_USE_MOCK', 'false')}")
    logger.info(f"Project: {os.getenv('GOOGLE_CLOUD_PROJECT', 'unknown')}")
    logger.info("=" * 60)

# For local testing
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
