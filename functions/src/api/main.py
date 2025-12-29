"""
FastAPI Main Application - REST API for RAG Prompt Library
"""
import logging
import asyncio
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Import our components
from ..rag.rag_pipeline import rag_pipeline, RAGQuery, DocumentProcessingRequest
from ..auth.auth_middleware import verify_token_async
from .exceptions import (
    APIError, AuthenticationError, ValidationError, LLMProviderError,
    DocumentProcessingError, create_error_response, handle_llm_provider_errors,
    handle_document_processing_errors
)
from .middleware import (
    RequestLoggingMiddleware, RateLimitMiddleware, CacheMiddleware, CompressionMiddleware
)
from .redis_manager import initialize_redis, get_redis_manager
from ..config import settings
from ..cache import get_cache_health, get_cache_backend

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="RAG Prompt Library API",
    description="Advanced RAG system with multi-provider LLM support",
    version="1.0.0"
)

# Initialize Redis for caching and rate limiting
redis_manager = None
try:
    redis_manager = initialize_redis(
        redis_url=settings.redis_url,
        max_connections=settings.redis_max_connections,
        socket_timeout=settings.redis_timeout
    )
    logger.info("Redis initialized for performance optimization")
except Exception as e:
    logger.warning(f"Redis initialization failed: {e}. Performance features disabled.")

# Add performance middleware (order matters - last added is executed first)
app.add_middleware(CompressionMiddleware)
app.add_middleware(RequestLoggingMiddleware)

if redis_manager:
    app.add_middleware(
        CacheMiddleware,
        redis_client=redis_manager.get_sync_client(),
        default_ttl=300
    )
    app.add_middleware(
        RateLimitMiddleware,
        redis_client=redis_manager.get_sync_client(),
        requests_per_minute=settings.rate_limit_requests
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class ChatRequest(BaseModel):
    query: str = Field(..., description="User query")
    provider: Optional[str] = Field(None, description="LLM provider (openai, anthropic, etc.)")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Response creativity")
    max_tokens: int = Field(1000, ge=1, le=4000, description="Maximum response tokens")

class RAGChatRequest(BaseModel):
    query: str = Field(..., description="User query")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for context")
    max_context_tokens: int = Field(4000, ge=100, le=8000, description="Maximum context tokens")
    provider: Optional[str] = Field(None, description="LLM provider")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="Response creativity")
    max_tokens: int = Field(1000, ge=1, le=4000, description="Maximum response tokens")
    include_sources: bool = Field(True, description="Include source documents")
    rerank_results: bool = Field(True, description="Rerank search results")

class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    limit: int = Field(10, ge=1, le=50, description="Maximum results")

# Marketing Agent Request/Response Models
class MarketingChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for persistence")
    page_context: Optional[str] = Field(None, description="Current page context (homepage, solutions, etc.)")

class MarketingChatResponse(BaseModel):
    success: bool
    response: str
    conversation_id: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None

# Prompt Library Agent Request/Response Models
class PromptLibraryChatRequest(BaseModel):
    message: str = Field(..., description="User message")
    conversation_id: Optional[str] = Field(None, description="Conversation ID for persistence")
    dashboard_context: Optional[Dict[str, Any]] = Field(None, description="Dashboard context (page, selected prompt, etc.)")
    stream: bool = Field(False, description="Whether to stream the response")

class PromptLibraryChatResponse(BaseModel):
    success: bool
    response: Optional[str] = None
    conversation_id: str
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    error: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    provider: str
    model: str
    tokens_used: int
    processing_time: float
    conversation_id: Optional[str] = None
    error: Optional[str] = None

class RAGChatResponse(BaseModel):
    success: bool
    response: str
    sources: List[Dict[str, Any]]
    conversation_id: str
    query_id: str
    provider: str
    model: str
    tokens_used: int
    processing_time: float
    confidence_score: float
    metadata: Dict[str, Any]
    error: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    success: bool
    job_id: str
    message: str
    error: Optional[str] = None

class SearchResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
    total_results: int
    processing_time: float
    error: Optional[str] = None

# Authentication dependency
async def get_current_user(authorization: str = Header(None)) -> Dict[str, Any]:
    """Verify JWT token and return user info"""
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing or invalid authorization header")

    token = authorization.split(" ")[1]
    try:
        user_info = await verify_token_async(token)
        return user_info
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise AuthenticationError("Invalid or expired token")

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "RAG Prompt Library API"
    }

@app.get("/health/detailed")
async def detailed_health():
    """Detailed system health check"""
    try:
        system_status = rag_pipeline.get_system_status()
        cache_health = get_cache_health()

        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "system": system_status,
            "cache": {
                "backend": get_cache_backend(),
                "health": cache_health
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

@app.get("/health/ready")
async def readiness_check():
    """Readiness probe for deployment"""
    try:
        # Check if critical components are ready
        system_status = rag_pipeline.get_system_status()
        if system_status['status'] == 'error':
            raise Exception("RAG pipeline in error state")

        return {"status": "ready", "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )

# Core API endpoints
@app.post("/api/ai/chat", response_model=ChatResponse)
@handle_llm_provider_errors
async def chat_endpoint(
    request: ChatRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Basic AI chat endpoint without RAG"""
    start_time = datetime.now(timezone.utc)

    # Validate input
    if not request.query.strip():
        raise ValidationError("Query cannot be empty")

    try:
        # Use LLM manager directly for basic chat
        from ..llm.llm_manager import LLMManager
        llm_manager = LLMManager()

        response = await llm_manager.generate_response(
            prompt=request.query,
            provider=request.provider,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )

        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        return ChatResponse(
            success=True,
            response=response.content,
            provider=response.provider,
            model=response.model,
            tokens_used=response.tokens_used,
            processing_time=processing_time,
            conversation_id=str(uuid.uuid4())
        )

    except (LLMProviderError, ValidationError, AuthenticationError):
        # Re-raise custom exceptions to be handled by exception handlers
        raise
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}")
        raise LLMProviderError(f"Chat service temporarily unavailable: {str(e)}")

@app.post("/api/ai/rag-chat", response_model=RAGChatResponse)
async def rag_chat_endpoint(
    request: RAGChatRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """RAG-powered chat endpoint"""
    start_time = datetime.now(timezone.utc)

    try:
        # Create RAG query
        rag_query = RAGQuery(
            query=request.query,
            user_id=user['uid'],
            conversation_id=request.conversation_id,
            max_context_tokens=request.max_context_tokens,
            provider=request.provider,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            include_sources=request.include_sources,
            rerank_results=request.rerank_results
        )

        # Process with RAG pipeline
        response = await rag_pipeline.query(rag_query)

        return RAGChatResponse(
            success=True,
            response=response.response,
            sources=response.sources,
            conversation_id=response.conversation_id,
            query_id=response.query_id,
            provider=response.provider,
            model=response.model,
            tokens_used=response.tokens_used,
            processing_time=response.processing_time,
            confidence_score=response.confidence_score,
            metadata=response.metadata
        )

    except Exception as e:
        logger.error(f"RAG chat endpoint error: {e}")
        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        return RAGChatResponse(
            success=False,
            response="",
            sources=[],
            conversation_id=request.conversation_id or str(uuid.uuid4()),
            query_id=str(uuid.uuid4()),
            provider="",
            model="",
            tokens_used=0,
            processing_time=processing_time,
            confidence_score=0.0,
            metadata={},
            error=str(e)
        )

@app.post("/api/ai/upload-document", response_model=DocumentUploadResponse)
@handle_document_processing_errors
async def upload_document_endpoint(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Upload and process document for RAG"""
    # Validate file
    if not file.filename:
        raise ValidationError("No file provided")

    # Check file size (10MB limit)
    file_content = await file.read()
    if len(file_content) > 10 * 1024 * 1024:
        raise ValidationError("File too large (max 10MB)")

    if len(file_content) == 0:
        raise ValidationError("File is empty")

    # Determine file type
    file_extension = file.filename.split('.')[-1].lower()
    allowed_types = ['txt', 'pdf', 'docx', 'md']
    if file_extension not in allowed_types:
        raise ValidationError(
            f"Unsupported file type '{file_extension}'. Supported: {', '.join(allowed_types)}"
        )

    try:
        # Create processing request
        processing_request = DocumentProcessingRequest(
            file_content=file_content,
            filename=file.filename,
            file_type=file_extension,
            user_id=user['uid']
        )

        # Process document
        job = await rag_pipeline.process_document(processing_request)

        return DocumentUploadResponse(
            success=True,
            job_id=job.job_id,
            message=f"Document '{file.filename}' uploaded and processing started"
        )

    except (ValidationError, DocumentProcessingError):
        # Re-raise custom exceptions
        raise
    except Exception as e:
        logger.error(f"Unexpected error in document upload: {e}")
        raise DocumentProcessingError(f"Document upload failed: {str(e)}")

@app.post("/api/ai/marketing-chat", response_model=MarketingChatResponse)
async def marketing_chat_endpoint(request: MarketingChatRequest):
    """
    Marketing Agent chat endpoint (public - no authentication required)

    This endpoint powers the molē marketing assistant on public-facing pages.
    """
    start_time = datetime.now(timezone.utc)

    # Validate input
    if not request.message.strip():
        raise ValidationError("Message cannot be empty")

    try:
        # Import marketing agent
        from ..ai_agent.marketing.marketing_agent import get_marketing_agent
        from firebase_admin import firestore

        # Get Firestore client
        db = firestore.client()

        # Get OpenRouter API key from environment
        import os
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")

        # Mock mode short-circuit to guarantee zero billing in staging
        use_mock = os.getenv("OPENROUTER_USE_MOCK", "false").lower() == "true"
        if use_mock:
            processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            return MarketingChatResponse(
                success=True,
                response="EthosPrompt is a smart, modular RAG-enabled prompt management system. (mock response)",
                conversation_id=request.conversation_id or str(uuid.uuid4()),
                sources=[],
                metadata={
                    "processing_time": processing_time,
                    "mock": True,
                    "page_context": request.page_context or "unknown"
                }
            )


        # Initialize agent
        agent = get_marketing_agent(db=db, openrouter_api_key=openrouter_api_key)

        # Prepare context
        context = {
            "conversation_id": request.conversation_id or str(uuid.uuid4()),
            "page_context": request.page_context or "unknown"
        }

        # Chat with agent
        logger.info(f"Marketing chat: '{request.message[:50]}...' (page: {context['page_context']})")

        response = await agent.chat(
            message=request.message,
            context=context
        )

        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        # Add processing time to metadata
        response['metadata']['processing_time'] = processing_time

        return MarketingChatResponse(
            success=True,
            response=response['response'],
            conversation_id=response['conversation_id'],
            sources=response.get('sources', []),
            metadata=response.get('metadata', {})
        )

    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Marketing chat endpoint error: {e}")
        import traceback
        traceback.print_exc()

        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        return MarketingChatResponse(
            success=False,
            response="I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
            conversation_id=request.conversation_id or str(uuid.uuid4()),
            sources=[],
            metadata={"processing_time": processing_time},
            error=str(e)
        )

@app.post("/api/ai/prompt-library-chat", response_model=PromptLibraryChatResponse)
async def prompt_library_chat_endpoint(
    request: PromptLibraryChatRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Prompt Library Agent chat endpoint (authenticated users only)

    This endpoint powers the molē assistant in the authenticated dashboard.
    Provides context-aware assistance for prompt engineering tasks.
    """
    start_time = datetime.now(timezone.utc)

    try:
        from firebase_admin import firestore
        from ..ai_agent.prompt_library.prompt_library_agent import PromptLibraryAgent

        # Get Firestore client
        db = firestore.client()

        # Get user ID from authenticated user
        user_id = user['uid']

        # Initialize agent for this user
        agent = PromptLibraryAgent(
            user_id=user_id,
            db=db,
            model="x-ai/grok-2-1212:free",  # Free model for testing
            temperature=0.1,  # Low temperature for deterministic behavior
            max_tokens=2000
        )

        # Chat with agent
        logger.info(f"Prompt library chat: user={user_id}, message='{request.message[:50]}...'")

        response = await agent.chat(
            message=request.message,
            conversation_id=request.conversation_id,
            dashboard_context=request.dashboard_context
        )

        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        # Add processing time to metadata
        if response.get('metadata'):
            response['metadata']['processing_time'] = processing_time

        return PromptLibraryChatResponse(
            success=response['success'],
            response=response.get('response'),
            conversation_id=response['conversation_id'],
            metadata=response.get('metadata', {}),
            error=response.get('error')
        )

    except AuthenticationError:
        raise
    except Exception as e:
        logger.error(f"Prompt library chat endpoint error: {e}")
        import traceback
        traceback.print_exc()

        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        return PromptLibraryChatResponse(
            success=False,
            response=None,
            conversation_id=request.conversation_id or str(uuid.uuid4()),
            metadata={"processing_time": processing_time},
            error=str(e)
        )

@app.post("/api/ai/search-documents", response_model=SearchResponse)
async def search_documents_endpoint(
    request: SearchRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Search documents using semantic search"""
    start_time = datetime.now(timezone.utc)

    try:
        # Search documents
        results = await rag_pipeline.search_documents(
            query=request.query,
            user_id=user['uid'],
            limit=request.limit
        )

        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                'chunk_id': result.chunk_id,
                'content': result.content,
                'score': result.score,
                'metadata': result.metadata
            })

        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        return SearchResponse(
            success=True,
            results=formatted_results,
            total_results=len(formatted_results),
            processing_time=processing_time
        )

    except Exception as e:
        logger.error(f"Document search error: {e}")
        processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        return SearchResponse(
            success=False,
            results=[],
            total_results=0,
            processing_time=processing_time,
            error=str(e)
        )

# System endpoints
@app.get("/api/ai/system-status")
async def system_status_endpoint(user: Dict[str, Any] = Depends(get_current_user)):
    """Get system status and metrics"""
    try:
        status = rag_pipeline.get_system_status()
        return {"success": True, "data": status}
    except Exception as e:
        logger.error(f"System status error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/ai/usage-stats")
async def usage_stats_endpoint(user: Dict[str, Any] = Depends(get_current_user)):
    """Get usage statistics for the current user"""
    try:
        stats = rag_pipeline.get_usage_stats(user['uid'])
        return {"success": True, "data": stats}
    except Exception as e:
        logger.error(f"Usage stats error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/ai/conversations")
async def get_conversations_endpoint(user: Dict[str, Any] = Depends(get_current_user)):
    """Get user's conversation list"""
    try:
        # This would typically query the database for user conversations
        # For now, return empty list
        return {
            "success": True,
            "data": {
                "conversations": [],
                "total": 0
            }
        }
    except Exception as e:
        logger.error(f"Get conversations error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.delete("/api/ai/conversations/{conversation_id}")
async def delete_conversation_endpoint(
    conversation_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        success = await rag_pipeline.delete_conversation(conversation_id, user['uid'])

        if success:
            return {"success": True, "message": "Conversation deleted successfully"}
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Conversation not found"}
            )
    except Exception as e:
        logger.error(f"Delete conversation error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

@app.get("/api/ai/document-status/{job_id}")
async def document_status_endpoint(
    job_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get document processing status"""
    try:
        job_status = await rag_pipeline.get_document_status(job_id, user['uid'])

        if job_status:
            return {
                "success": True,
                "data": {
                    "job_id": job_status.job_id,
                    "status": job_status.status.value,
                    "filename": job_status.filename,
                    "created_at": job_status.created_at.isoformat(),
                    "updated_at": job_status.updated_at.isoformat(),
                    "total_chunks": job_status.total_chunks,
                    "steps": [
                        {
                            "step_name": step.step_name,
                            "status": step.status.value,
                            "duration": step.duration,
                            "error": step.error
                        }
                        for step in job_status.steps
                    ]
                }
            }
        else:
            return JSONResponse(
                status_code=404,
                content={"success": False, "error": "Job not found"}
            )
    except Exception as e:
        logger.error(f"Document status error: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

# Exception handlers
@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    """Handle custom API errors"""
    return create_error_response(exc, request)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle FastAPI HTTP exceptions"""
    return create_error_response(exc, request)

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors"""
    return create_error_response(exc, request)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions"""
    from ..config import settings
    include_traceback = settings.debug
    return create_error_response(exc, request, include_traceback)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting RAG Prompt Library API...")

    # Initialize RAG pipeline with database
    try:
        # Set up database connection if needed
        rag_pipeline.db = None  # This would be set to actual DB client
        logger.info("RAG pipeline initialized")
    except Exception as e:
        logger.error(f"Failed to initialize RAG pipeline: {e}")

    # Health check Redis
    if redis_manager:
        try:
            await redis_manager.health_check()
            logger.info("Redis health check passed")
        except Exception as e:
            logger.warning(f"Redis health check failed: {e}")

    logger.info("API startup completed")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down RAG Prompt Library API...")

    # Close Redis connections
    if redis_manager:
        try:
            await redis_manager.close()
            logger.info("Redis connections closed")
        except Exception as e:
            logger.error(f"Error closing Redis: {e}")

    logger.info("API shutdown completed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8080,
        log_level=settings.log_level.lower(),
        access_log=True
    )
