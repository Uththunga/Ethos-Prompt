"""
RAG Pipeline Orchestrator - Central coordination for document processing and query handling
"""
import logging
import asyncio
import uuid
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from enum import Enum

# Import RAG components
from .document_processor import document_processing_pipeline, ProcessingStatus, DocumentProcessingJob
from .vector_store import vector_store, VectorSearchResult
from .conversation_memory import conversation_memory, ConversationContext, MessageRole
from .query_expansion import query_expansion_engine
from .response_synthesis import response_synthesis_engine
from .response_validator import response_validator
from .context_retriever import context_retriever, RetrievalContext

# Import LLM components
from ..llm.llm_manager import LLMManager, ProviderType, LLMResponse

logger = logging.getLogger(__name__)

class PipelineStatus(Enum):
    IDLE = "idle"
    PROCESSING = "processing"
    QUERYING = "querying"
    ERROR = "error"

@dataclass
class RAGQuery:
    query: str
    user_id: str
    conversation_id: Optional[str] = None
    max_context_tokens: int = 4000
    provider: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1000
    include_sources: bool = True
    rerank_results: bool = True

@dataclass
class RAGResponse:
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

@dataclass
class DocumentProcessingRequest:
    file_content: bytes
    filename: str
    file_type: str
    user_id: str
    metadata: Optional[Dict[str, Any]] = None

class RAGPipeline:
    """
    Unified RAG Pipeline Orchestrator
    
    Coordinates all RAG operations including:
    - Document processing and indexing
    - Query expansion and retrieval
    - Response synthesis and validation
    - Conversation memory management
    """
    
    def __init__(self, db=None):
        self.db = db
        self.status = PipelineStatus.IDLE
        self.llm_manager = LLMManager()
        
        # Initialize components
        self._initialize_components()
        
        # Performance tracking
        self.metrics = {
            'documents_processed': 0,
            'queries_handled': 0,
            'average_response_time': 0.0,
            'error_count': 0
        }
        
        logger.info("RAG Pipeline initialized successfully")
    
    def _initialize_components(self):
        """Initialize all RAG components"""
        try:
            # Set database reference for components that need it
            if self.db:
                conversation_memory.db = self.db
                document_processing_pipeline.db = self.db
                vector_store.db = self.db
                
            logger.info("RAG components initialized")
        except Exception as e:
            logger.error(f"Error initializing RAG components: {e}")
            self.status = PipelineStatus.ERROR
            raise
    
    async def process_document(self, request: DocumentProcessingRequest) -> DocumentProcessingJob:
        """
        Orchestrate document processing pipeline
        
        Flow: extract -> chunk -> embed -> store
        """
        self.status = PipelineStatus.PROCESSING
        start_time = datetime.now(timezone.utc)
        
        try:
            logger.info(f"Starting document processing for {request.filename}")
            
            # Create processing job
            job = await document_processing_pipeline.process_document(
                file_content=request.file_content,
                filename=request.filename,
                file_type=request.file_type,
                user_id=request.user_id,
                metadata=request.metadata or {}
            )
            
            # Update metrics
            self.metrics['documents_processed'] += 1
            processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            
            logger.info(f"Document processing completed in {processing_time:.2f}s")
            return job
            
        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            self.metrics['error_count'] += 1
            raise
        finally:
            self.status = PipelineStatus.IDLE
    
    async def query(self, rag_query: RAGQuery) -> RAGResponse:
        """
        Orchestrate RAG query pipeline
        
        Flow: expand -> search -> synthesize -> validate
        """
        self.status = PipelineStatus.QUERYING
        start_time = datetime.now(timezone.utc)
        query_id = str(uuid.uuid4())
        
        try:
            logger.info(f"Processing RAG query: {rag_query.query[:100]}...")
            
            # Step 1: Query expansion
            expanded_queries = await query_expansion_engine.expand_query(
                query=rag_query.query,
                user_id=rag_query.user_id,
                conversation_id=rag_query.conversation_id
            )
            
            # Step 2: Retrieve context
            retrieval_context = await context_retriever.retrieve_context(
                queries=expanded_queries,
                user_id=rag_query.user_id,
                max_tokens=rag_query.max_context_tokens,
                rerank=rag_query.rerank_results
            )
            
            # Step 3: Get conversation context if available
            conversation_context = None
            if rag_query.conversation_id:
                conversation_context = await conversation_memory.get_conversation_context(
                    conversation_id=rag_query.conversation_id,
                    user_id=rag_query.user_id
                )
            
            # Step 4: Synthesize response
            synthesis_result = await response_synthesis_engine.synthesize_response(
                query=rag_query.query,
                context=retrieval_context,
                conversation_context=conversation_context,
                provider=rag_query.provider,
                temperature=rag_query.temperature,
                max_tokens=rag_query.max_tokens
            )
            
            # Step 5: Validate response
            validation_result = await response_validator.validate_response(
                query=rag_query.query,
                response=synthesis_result.response,
                context=retrieval_context,
                user_id=rag_query.user_id
            )
            
            # Step 6: Update conversation memory
            if rag_query.conversation_id:
                await conversation_memory.add_message(
                    conversation_id=rag_query.conversation_id,
                    user_id=rag_query.user_id,
                    role=MessageRole.USER,
                    content=rag_query.query
                )
                
                await conversation_memory.add_message(
                    conversation_id=rag_query.conversation_id,
                    user_id=rag_query.user_id,
                    role=MessageRole.ASSISTANT,
                    content=synthesis_result.response
                )
            
            # Prepare response
            processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            
            response = RAGResponse(
                response=synthesis_result.response,
                sources=retrieval_context.sources if rag_query.include_sources else [],
                conversation_id=rag_query.conversation_id or str(uuid.uuid4()),
                query_id=query_id,
                provider=synthesis_result.provider,
                model=synthesis_result.model,
                tokens_used=synthesis_result.tokens_used,
                processing_time=processing_time,
                confidence_score=validation_result.confidence_score,
                metadata={
                    'expanded_queries': expanded_queries,
                    'context_chunks': len(retrieval_context.chunks),
                    'validation_passed': validation_result.is_valid,
                    'validation_issues': validation_result.issues
                }
            )
            
            # Update metrics
            self.metrics['queries_handled'] += 1
            self._update_average_response_time(processing_time)
            
            logger.info(f"RAG query completed in {processing_time:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            self.metrics['error_count'] += 1
            raise
        finally:
            self.status = PipelineStatus.IDLE

    def _update_average_response_time(self, new_time: float):
        """Update running average of response times"""
        current_avg = self.metrics['average_response_time']
        query_count = self.metrics['queries_handled']

        if query_count == 1:
            self.metrics['average_response_time'] = new_time
        else:
            # Calculate running average
            self.metrics['average_response_time'] = (
                (current_avg * (query_count - 1) + new_time) / query_count
            )

    async def get_document_status(self, job_id: str, user_id: str) -> Optional[DocumentProcessingJob]:
        """Get status of document processing job"""
        try:
            return await document_processing_pipeline.get_job_status(job_id, user_id)
        except Exception as e:
            logger.error(f"Error getting document status: {e}")
            return None

    async def search_documents(self, query: str, user_id: str, limit: int = 10) -> List[VectorSearchResult]:
        """Search documents using semantic search"""
        try:
            return await vector_store.search(
                query=query,
                user_id=user_id,
                limit=limit
            )
        except Exception as e:
            logger.error(f"Error searching documents: {e}")
            return []

    async def get_conversation_history(self, conversation_id: str, user_id: str) -> Optional[ConversationContext]:
        """Get conversation history"""
        try:
            return await conversation_memory.get_conversation_context(
                conversation_id=conversation_id,
                user_id=user_id
            )
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return None

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete conversation and its history"""
        try:
            return await conversation_memory.delete_conversation(
                conversation_id=conversation_id,
                user_id=user_id
            )
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            return False

    def get_system_status(self) -> Dict[str, Any]:
        """Get system status and metrics"""
        return {
            'status': self.status.value,
            'metrics': self.metrics,
            'components': {
                'llm_manager': self.llm_manager.get_status() if hasattr(self.llm_manager, 'get_status') else 'active',
                'vector_store': vector_store.get_status() if hasattr(vector_store, 'get_status') else 'active',
                'conversation_memory': 'active',
                'document_processor': 'active'
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

    def get_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get usage statistics for a user"""
        # This would typically query the database for user-specific stats
        # For now, return basic metrics
        return {
            'user_id': user_id,
            'total_queries': self.metrics['queries_handled'],
            'total_documents': self.metrics['documents_processed'],
            'average_response_time': self.metrics['average_response_time'],
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

# Create global instance
rag_pipeline = RAGPipeline()
