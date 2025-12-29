"""
AI Service - Main service integrating LLM, template engine, rate limiting, and cost tracking
"""
import os
import logging
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid

# Import our custom modules
from .llm.llm_manager import llm_manager, ProviderType, LLMResponse
from .llm.template_engine import template_engine, TemplateValidationResult
from .llm.rate_limiter import rate_limiter, DEFAULT_RATE_LIMITS, RateLimitResult
from .llm.cost_tracker import cost_tracker, CostEntry

# Import RAG components
from .rag.document_processor import document_processing_pipeline
from .rag.semantic_search import semantic_search_engine, SearchQuery
from .rag.hybrid_search import hybrid_search_engine
from .rag.context_retriever import context_retriever, RetrievalContext
from .rag.conversation_memory import conversation_memory, MessageRole
from .rag.query_expansion import query_expansion_engine
from .rag.cache_manager import cache_manager
from .rag.search_analytics import search_analytics

logger = logging.getLogger(__name__)

class AIService:
    """
    Main AI service that orchestrates all AI/ML functionality
    """
    
    def __init__(self, firestore_client=None):
        self.db = firestore_client

        # Core LLM components
        self.llm_manager = llm_manager
        self.template_engine = template_engine
        self.rate_limiter = rate_limiter
        self.cost_tracker = cost_tracker

        # RAG components
        self.document_processor = document_processing_pipeline
        self.semantic_search = semantic_search_engine
        self.hybrid_search = hybrid_search_engine
        self.context_retriever = context_retriever
        self.conversation_memory = conversation_memory
        self.query_expansion = query_expansion_engine
        self.cache_manager = cache_manager
        self.search_analytics = search_analytics

        # Initialize components with Firestore client
        if self.db:
            self.cost_tracker.db = self.db
            self.document_processor.db = self.db
            self.conversation_memory.db = self.db
            self.search_analytics.db = self.db

            # Set LLM manager for components that need it
            self.conversation_memory.llm_manager = self.llm_manager
            self.query_expansion.llm_manager = self.llm_manager
    
    async def generate_prompt_response(
        self,
        user_id: str,
        prompt_template: str,
        variables: Optional[Dict[str, Any]] = None,
        provider: Optional[str] = None,
        user_tier: str = "free",
        endpoint: str = "generate_prompt"
    ) -> Dict[str, Any]:
        """
        Generate AI response for a prompt with full pipeline processing
        """
        request_id = str(uuid.uuid4())
        start_time = datetime.now(timezone.utc)
        
        try:
            # 1. Rate limiting check
            rate_limit = DEFAULT_RATE_LIMITS.get(user_tier, DEFAULT_RATE_LIMITS["free"])
            rate_result = self.rate_limiter.check_rate_limit(user_id, rate_limit, endpoint)
            
            if not rate_result.allowed:
                return {
                    "success": False,
                    "error": "Rate limit exceeded",
                    "rate_limit": {
                        "retry_after": rate_result.retry_after,
                        "reset_time": rate_result.reset_time.isoformat(),
                        "limit_type": rate_result.limit_type
                    }
                }
            
            # 2. Cost limit check
            cost_status = self.cost_tracker.check_cost_limits(user_id, user_tier)
            if not cost_status["within_limits"]:
                return {
                    "success": False,
                    "error": "Cost limit exceeded",
                    "cost_limits": cost_status
                }
            
            # 3. Template processing
            variables = variables or {}
            
            # Validate template
            validation_result = self.template_engine.validate_template(prompt_template, variables)
            if not validation_result.is_valid:
                return {
                    "success": False,
                    "error": "Template validation failed",
                    "validation_errors": validation_result.errors,
                    "missing_variables": validation_result.missing_variables
                }
            
            # Render template
            rendered_prompt = self.template_engine.render(prompt_template, variables)
            
            # 4. LLM generation
            provider_type = None
            if provider:
                try:
                    provider_type = ProviderType(provider.lower())
                except ValueError:
                    logger.warning(f"Invalid provider: {provider}")
            
            llm_response = await self.llm_manager.generate_response(
                rendered_prompt, 
                provider=provider_type
            )
            
            # 5. Cost tracking
            cost_entry = self.cost_tracker.track_usage(
                user_id=user_id,
                provider=llm_response.provider,
                model=llm_response.model,
                input_tokens=llm_response.metadata.get("prompt_tokens", 0),
                output_tokens=llm_response.metadata.get("completion_tokens", 0),
                request_id=request_id,
                endpoint=endpoint,
                metadata={
                    "template_variables": list(variables.keys()),
                    "template_complexity": self.template_engine.get_template_info(prompt_template)["complexity_score"],
                    "user_tier": user_tier
                }
            )
            
            # 6. Prepare response
            end_time = datetime.now(timezone.utc)
            total_time = (end_time - start_time).total_seconds()
            
            return {
                "success": True,
                "response": llm_response.content,
                "metadata": {
                    "request_id": request_id,
                    "provider": llm_response.provider,
                    "model": llm_response.model,
                    "tokens_used": llm_response.tokens_used,
                    "cost": float(cost_entry.cost),
                    "response_time": llm_response.response_time,
                    "total_time": total_time,
                    "template_info": self.template_engine.get_template_info(prompt_template),
                    "rate_limit_remaining": rate_result.remaining_requests
                },
                "usage": {
                    "tokens": llm_response.tokens_used,
                    "cost": float(cost_entry.cost),
                    "provider": llm_response.provider,
                    "model": llm_response.model
                }
            }
            
        except Exception as e:
            logger.error(f"Error in generate_prompt_response: {e}")
            return {
                "success": False,
                "error": str(e),
                "request_id": request_id
            }
    
    async def validate_prompt_template(
        self,
        template: str,
        variables: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Validate a prompt template
        """
        try:
            variables = variables or {}
            
            # Template validation
            validation_result = self.template_engine.validate_template(template, variables)
            
            # Template info
            template_info = self.template_engine.get_template_info(template)
            
            # Test render with sample data
            test_variables = {}
            for var in template_info["variables"]:
                test_variables[var] = f"sample_{var}"
            
            try:
                test_render = self.template_engine.render(template, test_variables)
                render_success = True
                render_error = None
            except Exception as e:
                render_success = False
                render_error = str(e)
                test_render = None
            
            return {
                "valid": validation_result.is_valid,
                "validation": {
                    "errors": validation_result.errors,
                    "warnings": validation_result.warnings,
                    "missing_variables": validation_result.missing_variables,
                    "unused_variables": validation_result.unused_variables
                },
                "template_info": template_info,
                "test_render": {
                    "success": render_success,
                    "error": render_error,
                    "output": test_render,
                    "test_variables": test_variables
                }
            }
            
        except Exception as e:
            logger.error(f"Error validating template: {e}")
            return {
                "valid": False,
                "error": str(e)
            }
    
    def get_user_usage_stats(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get comprehensive usage statistics for a user
        """
        try:
            # Cost breakdown
            cost_breakdown = self.cost_tracker.get_cost_breakdown(user_id, days)
            
            # Rate limit status
            rate_status = self.rate_limiter.get_rate_limit_status(user_id)
            
            # Cost limit status
            cost_limits = self.cost_tracker.check_cost_limits(user_id)
            
            return {
                "user_id": user_id,
                "period_days": days,
                "cost_breakdown": cost_breakdown,
                "rate_limits": rate_status,
                "cost_limits": cost_limits,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting user usage stats: {e}")
            return {
                "error": str(e),
                "user_id": user_id
            }
    
    def get_system_status(self) -> Dict[str, Any]:
        """
        Get overall system status
        """
        try:
            # LLM provider status
            provider_status = self.llm_manager.get_provider_status()
            available_providers = self.llm_manager.get_available_providers()
            
            # System health
            health_status = {
                "llm_providers": len(available_providers) > 0,
                "template_engine": True,  # Always available
                "rate_limiter": True,     # Always available
                "cost_tracker": self.cost_tracker.db is not None
            }
            
            return {
                "status": "healthy" if all(health_status.values()) else "degraded",
                "providers": {
                    "available": available_providers,
                    "status": provider_status
                },
                "services": health_status,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system status: {e}")
            return {
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def test_provider_connection(self, provider: str) -> Dict[str, Any]:
        """
        Test connection to a specific provider
        """
        try:
            provider_type = ProviderType(provider.lower())
            
            # Simple test prompt
            test_prompt = "Hello! Please respond with 'Connection test successful.'"
            
            response = await self.llm_manager.generate_response(
                test_prompt,
                provider=provider_type
            )
            
            return {
                "success": True,
                "provider": provider,
                "model": response.model,
                "response": response.content,
                "tokens_used": response.tokens_used,
                "response_time": response.response_time,
                "cost": response.cost
            }
            
        except Exception as e:
            logger.error(f"Error testing provider {provider}: {e}")
            return {
                "success": False,
                "provider": provider,
                "error": str(e)
            }

    # RAG Methods

    async def upload_document(
        self,
        user_id: str,
        file_content: bytes,
        filename: str,
        file_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Upload and process a document for RAG
        """
        try:
            document_id = f"doc_{user_id}_{int(datetime.now().timestamp())}"

            # Create processing job
            job = self.document_processor.create_processing_job(
                user_id=user_id,
                document_id=document_id,
                filename=filename,
                file_size=len(file_content)
            )

            # Start processing in background
            asyncio.create_task(
                self.document_processor.process_document(job, file_content)
            )

            return {
                "success": True,
                "job_id": job.job_id,
                "document_id": document_id,
                "status": "processing",
                "message": "Document upload started"
            }

        except Exception as e:
            logger.error(f"Error uploading document: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def search_documents(
        self,
        user_id: str,
        query: str,
        search_type: str = "hybrid",
        filters: Optional[Dict[str, Any]] = None,
        top_k: int = 10,
        use_cache: bool = True
    ) -> Dict[str, Any]:
        """
        Search documents using RAG
        """
        try:
            start_time = datetime.now()

            # Check cache first
            if use_cache:
                cached_results = self.cache_manager.get_cached_search_results(
                    query, user_id=user_id, search_type=search_type, **filters or {}
                )
                if cached_results:
                    return {
                        "success": True,
                        "results": cached_results,
                        "total_results": len(cached_results),
                        "search_time": 0.0,
                        "cached": True,
                        "metadata": {"search_type": search_type}
                    }

            # Expand query
            expanded_query = await self.query_expansion.expand_query(query)

            # Perform search
            search_query = SearchQuery(
                text=expanded_query.expanded_query,
                filters=filters,
                top_k=top_k
            )

            if search_type == "hybrid":
                response = await self.hybrid_search.search(search_query)
            else:
                response = await self.semantic_search.search(search_query)

            # Convert results to dict format
            results = []
            for result in response.results:
                results.append({
                    "chunk_id": result.chunk_id,
                    "content": result.content,
                    "score": result.score,
                    "metadata": result.metadata,
                    "rank": result.rank
                })

            # Cache results
            if use_cache:
                self.cache_manager.cache_search_results(
                    query, results, user_id=user_id, search_type=search_type, **filters or {}
                )

            # Record analytics
            self.search_analytics.record_search_metrics(
                query=query,
                user_id=user_id,
                search_type=search_type,
                results=response.results,
                search_time=response.search_time
            )

            search_time = (datetime.now() - start_time).total_seconds()

            return {
                "success": True,
                "results": results,
                "total_results": len(results),
                "search_time": search_time,
                "cached": False,
                "metadata": {
                    "search_type": search_type,
                    "query_expansion": {
                        "original": query,
                        "expanded": expanded_query.expanded_query,
                        "expansion_terms": expanded_query.expansion_terms
                    },
                    "embedding_time": response.embedding_time,
                    "vector_search_time": response.vector_search_time
                }
            }

        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def generate_rag_response(
        self,
        user_id: str,
        query: str,
        conversation_id: Optional[str] = None,
        max_context_tokens: int = 4000,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate AI response using RAG
        """
        try:
            start_time = datetime.now()

            # Create or get conversation
            if not conversation_id:
                conversation_id = await self.conversation_memory.create_conversation(user_id, query)
            else:
                await self.conversation_memory.add_message(
                    conversation_id, MessageRole.USER, query
                )

            # Get conversation context
            messages, summary = await self.conversation_memory.get_conversation_context(
                conversation_id, max_tokens=1000
            )

            # Retrieve relevant context
            retrieval_context = RetrievalContext(
                query=query,
                user_id=user_id,
                conversation_history=[{"role": msg.role.value, "content": msg.content} for msg in messages],
                max_tokens=max_context_tokens,
                use_hybrid_search=True
            )

            context_result = await self.context_retriever.retrieve_context(retrieval_context)

            # Build enhanced prompt
            context_text = ""
            if context_result.chunks:
                context_text = "\n\n".join([
                    f"Source: {chunk.source_document}\n{chunk.content}"
                    for chunk in context_result.chunks[:5]
                ])

            enhanced_prompt = f"""Based on the following context information, please answer the user's question.

Context:
{context_text}

Conversation Summary: {summary or "No previous conversation"}

User Question: {query}

Please provide a helpful and accurate response based on the context provided. If the context doesn't contain enough information to answer the question, please say so and suggest what additional information might be needed."""

            # Generate response
            provider_type = None
            if provider:
                try:
                    provider_type = ProviderType(provider.lower())
                except ValueError:
                    logger.warning(f"Invalid provider: {provider}")

            llm_response = await self.llm_manager.generate_response(
                enhanced_prompt,
                provider=provider_type
            )

            # Add assistant response to conversation
            await self.conversation_memory.add_message(
                conversation_id, MessageRole.ASSISTANT, llm_response.content
            )

            # Track usage
            cost_entry = self.cost_tracker.track_usage(
                user_id=user_id,
                provider=llm_response.provider,
                model=llm_response.model,
                input_tokens=llm_response.metadata.get('prompt_tokens', 0),
                output_tokens=llm_response.metadata.get('completion_tokens', 0)
            )

            total_time = (datetime.now() - start_time).total_seconds()

            return {
                "success": True,
                "response": llm_response.content,
                "conversation_id": conversation_id,
                "metadata": {
                    "provider": llm_response.provider,
                    "model": llm_response.model,
                    "tokens_used": llm_response.tokens_used,
                    "cost": float(cost_entry.cost),
                    "response_time": total_time,
                    "context_chunks": len(context_result.chunks),
                    "context_tokens": context_result.total_tokens,
                    "retrieval_time": context_result.retrieval_time
                },
                "sources": [
                    {
                        "document": chunk.source_document,
                        "relevance_score": chunk.relevance_score,
                        "content_preview": chunk.content[:200] + "..." if len(chunk.content) > 200 else chunk.content
                    }
                    for chunk in context_result.chunks[:3]
                ]
            }

        except Exception as e:
            logger.error(f"Error generating RAG response: {e}")
            return {
                "success": False,
                "error": str(e)
            }

# Global instance
ai_service = AIService()

