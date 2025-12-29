# Deploy timestamp: 2024-12-02T14:00:00Z - Context Optimization v1.0
from firebase_functions import https_fn, firestore_fn, storage_fn, options
from firebase_admin import initialize_app, firestore, storage
import json
import os
import asyncio
from typing import Any, Dict, List
import logging
from datetime import datetime, timezone

# Import RAG components
from src.rag.document_processor import DocumentProcessor, DocumentProcessingPipeline
from src.rag.chunking_strategies import chunking_manager, ChunkingManager
from src.rag.embedding_service import embedding_service, EmbeddingService
from src.rag.vector_store import get_vector_store, VectorStore
from src.rag.context_retriever import context_retriever, ContextRetriever, RetrievalContext
from src.rag.cache_manager import intelligent_response_cache

# Import LLM components
from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from src.llm.token_counter import TokenCounter

# Import error handling and retry logic
from src.error_handling import (
    handle_error, log_error, AppError, ValidationError,
    APIError, TimeoutError as AppTimeoutError, RAGError,
    init_sentry
)
from src.retry_logic import retry_async, API_RETRY_CONFIG, retry_with_timeout

# Import streaming handler
from src.streaming_handler import StreamingResponseHandler, SimpleStreamCollector, stream_to_firestore
import uuid

# Import cost tracker
from src.llm.cost_tracker import CostTracker, CostEntry
from decimal import Decimal

# Initialize Firebase Admin
initialize_app()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Sentry for error tracking
init_sentry()

# Initialize RAG components (using global instances from modules)
# document_processor, chunking_manager, embedding_service are already initialized
# vector_store uses lazy initialization via get_vector_store()
# context_retriever is already initialized

# Initialize vector store (lazy initialization after Firebase is ready)
vector_store = get_vector_store(firestore_client=firestore.client())

# Initialize LLM components
# Get API key from environment (required)
openrouter_api_key = os.environ.get('OPENROUTER_API_KEY')
if not openrouter_api_key:
    logger.error("OPENROUTER_API_KEY environment variable is not set")
    raise ValueError("OPENROUTER_API_KEY environment variable is required")

openrouter_config = OpenRouterConfig(
    api_key=openrouter_api_key,
    model="meta-llama/llama-3.2-11b-vision-instruct"
)
token_counter = TokenCounter(model=openrouter_config.model)

# Initialize cost tracker
cost_tracker = CostTracker(firestore_client=firestore.client())

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=["*"],  # Admin function, restrict in production
        cors_methods=["POST", "OPTIONS"]
    ),
    region="australia-southeast1"
)
def initialize_marketing_kb_function(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Initialize Marketing Knowledge Base
    Admin-only function to index marketing content into Firestore
    """
    # Verify authentication (admin only)
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    # Admin role check using Firebase Auth custom claims
    token = req.auth.token
    is_admin = token.get('admin', False) or token.get('role') == 'admin'

    # Also allow specific admin emails as fallback
    admin_emails = os.environ.get('ADMIN_EMAILS', '').split(',')
    is_admin_email = req.auth.token.get('email', '') in admin_emails

    if not is_admin and not is_admin_email:
        raise https_fn.HttpsError(
            'permission-denied',
            'This function requires admin privileges'
        )

    try:
        from src.ai_agent.marketing.kb_indexer import initialize_marketing_kb

        logger.info("Starting marketing KB initialization...")

        # Get force_reindex parameter
        force_reindex = req.data.get('force_reindex', False)

        # Run async initialization
        db = firestore.client()
        results = asyncio.run(initialize_marketing_kb(db, force_reindex=force_reindex))

        logger.info(f"Marketing KB initialization complete: {results}")

        return {
            'success': True,
            'results': results,
            'message': f"Indexed {results['indexed_documents']} documents with {results['total_vectors']} vectors"
        }

    except Exception as e:
        logger.error(f"Failed to initialize marketing KB: {e}", exc_info=True)
        raise https_fn.HttpsError('internal', f'Failed to initialize marketing KB: {str(e)}')

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def execute_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Execute a prompt with optional RAG context"""
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # Validate inputs
        prompt_id = req.data.get('promptId')
        inputs = req.data.get('inputs', {})
        use_rag = req.data.get('useRag', False)
        rag_query = req.data.get('ragQuery', '')
        document_ids = req.data.get('documentIds', [])

        if not prompt_id:
            raise ValidationError('promptId is required', field='promptId')

        # Get prompt from Firestore
        db = firestore.client()
        prompt_ref = db.collection('users').document(req.auth.uid).collection('prompts').document(prompt_id)
        prompt_doc = prompt_ref.get()

        if not prompt_doc.exists:
            raise https_fn.HttpsError('not-found', 'Prompt not found')

        prompt_data = prompt_doc.to_dict()

        # Run async execution with timeout (60 seconds default)
        timeout_seconds = req.data.get('timeout', 60)
        result = asyncio.run(_execute_prompt_with_timeout(
            req.auth.uid, prompt_data, inputs, use_rag, rag_query, document_ids, timeout_seconds
        ))

        # Save execution to Firestore
        execution_ref = prompt_ref.collection('executions').document()
        execution_ref.set({
            'inputs': inputs,
            'outputs': result,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'useRag': use_rag,
            'ragQuery': rag_query if use_rag else None,
            'documentIds': document_ids if use_rag else None,
            'status': 'completed' if not result.get('error') else 'failed',
            'error': result.get('error') if result.get('error') else None
        })

        return result

    except AppError as e:
        # Handle application errors with proper categorization
        log_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise e.to_https_error()

    except Exception as e:
        # Handle unexpected errors
        logger.error(f"Unexpected error executing prompt: {str(e)}", exc_info=True)
        error_dict = handle_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise https_fn.HttpsError('internal', error_dict['message'], error_dict)

async def _execute_prompt_with_timeout(
    user_id: str, prompt_data: Dict, inputs: Dict,
    use_rag: bool, rag_query: str, document_ids: List[str],
    timeout_seconds: int = 60
) -> Dict[str, Any]:
    """Execute prompt with timeout wrapper"""
    try:
        result = await asyncio.wait_for(
            _execute_prompt_async(user_id, prompt_data, inputs, use_rag, rag_query, document_ids),
            timeout=timeout_seconds
        )
        return result
    except asyncio.TimeoutError:
        logger.error(f"Prompt execution timed out after {timeout_seconds} seconds")
        raise AppTimeoutError(
            f"Execution timed out after {timeout_seconds} seconds",
            timeout_seconds=timeout_seconds
        )


@retry_async(config=API_RETRY_CONFIG)
async def _execute_prompt_async(user_id: str, prompt_data: Dict, inputs: Dict,
                               use_rag: bool, rag_query: str, document_ids: List[str]) -> Dict[str, Any]:
    """Async prompt execution implementation with OpenRouter LLM and retry logic"""
    start_time = datetime.now(timezone.utc)
    context = ""
    context_metadata = {}

    try:
        prompt_content = prompt_data.get('content', '')
        prompt_title = prompt_data.get('title', 'Untitled')

        # Replace variables in prompt
        for var_name, var_value in inputs.items():
            placeholder = f"{{{var_name}}}"
            prompt_content = prompt_content.replace(placeholder, str(var_value))

        # Retrieve RAG context if requested
        if use_rag and rag_query:
            logger.info(f"Retrieving RAG context for query: {rag_query}")
            try:
                # Build RetrievalContext for context retriever
                retrieval_ctx = RetrievalContext(
                    query=rag_query,
                    user_id=user_id,
                    document_filters={'document_ids': document_ids} if document_ids else None,
                    max_tokens=4000,
                    min_relevance_score=0.7,
                    use_hybrid_search=True,
                    rerank_results=True
                )
                retrieved_context = await context_retriever.retrieve_context(retrieval_ctx)
                context = retrieved_context.formatted_context
                context_metadata = retrieved_context.metadata
            except Exception as rag_error:
                logger.error(f"RAG context retrieval failed: {str(rag_error)}")
                raise RAGError(f"Failed to retrieve context: {str(rag_error)}", stage="retrieval")

        # Create system prompt for better responses
        system_prompt = f"""You are an AI assistant helping with the prompt titled "{prompt_title}".
Provide helpful, accurate, and well-structured responses. If context information is provided, use it to enhance your response while being clear about what information comes from the context versus your general knowledge."""

        # Generate response using OpenRouter
        try:
            async with OpenRouterClient(openrouter_config) as llm_client:
                if context:
                    # Use context-enhanced generation
                    llm_response = await llm_client.generate_with_context(
                        prompt=prompt_content,
                        context=context,
                        system_prompt=system_prompt
                    )
                else:
                    # Standard generation without context
                    llm_response = await llm_client.generate_response(
                        prompt=prompt_content,
                        system_prompt=system_prompt
                    )
        except Exception as api_error:
            logger.error(f"OpenRouter API call failed: {str(api_error)}")
            raise APIError(f"AI service error: {str(api_error)}")

        # Calculate execution time
        execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()

        # Track cost
        try:
            cost_entry = CostEntry(
                user_id=user_id,
                provider="openrouter",
                model=llm_response.model,
                tokens_used=llm_response.usage.get('total_tokens', 0),
                cost=Decimal(str(llm_response.cost_estimate)),
                timestamp=datetime.now(timezone.utc),
                request_id=str(uuid.uuid4()),
                endpoint="execute_prompt",
                metadata={
                    'prompt_tokens': llm_response.usage.get('prompt_tokens', 0),
                    'completion_tokens': llm_response.usage.get('completion_tokens', 0),
                    'use_rag': use_rag,
                    'execution_time': execution_time
                }
            )
            await cost_tracker.track_cost_async(cost_entry)
            logger.info(f"Cost tracked: ${llm_response.cost_estimate:.6f}")
        except Exception as cost_error:
            logger.error(f"Failed to track cost: {str(cost_error)}")
            # Don't fail execution if cost tracking fails

        # Prepare result
        result = {
            'output': llm_response.content,
            'context': context,
            'metadata': {
                'model': llm_response.model,
                'executionTime': execution_time,
                'tokensUsed': llm_response.usage.get('total_tokens', 0),
                'promptTokens': llm_response.usage.get('prompt_tokens', 0),
                'completionTokens': llm_response.usage.get('completion_tokens', 0),
                'cost': llm_response.cost_estimate,
                'finishReason': llm_response.finish_reason,
                'useRag': use_rag,
                'contextMetadata': context_metadata,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        }

        logger.info(f"Successfully executed prompt with {llm_response.usage.get('total_tokens', 0)} tokens in {execution_time:.2f}s, cost: ${llm_response.cost_estimate:.6f}")
        return result

    except (AppError, APIError, RAGError, AppTimeoutError):
        # Re-raise application errors
        raise

    except Exception as e:
        logger.error(f"Unexpected error in async prompt execution: {str(e)}", exc_info=True)
        # Return error response for unexpected errors
        execution_time = (datetime.now(timezone.utc) - start_time).total_seconds()
        return {
            'error': True,
            'output': f"Error executing prompt: {str(e)}",
            'context': context,
            'metadata': {
                'model': openrouter_config.model,
                'executionTime': execution_time,
                'tokensUsed': 0,
                'cost': 0,
                'error': str(e),
                'useRag': use_rag,
                'contextMetadata': context_metadata,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        }


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def execute_prompt_streaming(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Start a streaming prompt execution
    Returns execution_id for polling chunks
    """
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # Validate inputs
        prompt_id = req.data.get('promptId')
        inputs = req.data.get('inputs', {})
        use_rag = req.data.get('useRag', False)
        rag_query = req.data.get('ragQuery', '')
        document_ids = req.data.get('documentIds', [])

        if not prompt_id:
            raise ValidationError('promptId is required', field='promptId')

        # Generate unique execution ID
        execution_id = str(uuid.uuid4())

        # Get prompt from Firestore
        db = firestore.client()
        prompt_ref = db.collection('users').document(req.auth.uid).collection('prompts').document(prompt_id)
        prompt_doc = prompt_ref.get()

        if not prompt_doc.exists:
            raise https_fn.HttpsError('not-found', 'Prompt not found')

        prompt_data = prompt_doc.to_dict()

        # Start async streaming execution (non-blocking)
        asyncio.create_task(_execute_prompt_streaming_async(
            req.auth.uid, prompt_id, execution_id, prompt_data, inputs, use_rag, rag_query, document_ids
        ))

        # Return execution ID immediately
        return {
            'execution_id': execution_id,
            'status': 'streaming',
            'message': 'Streaming execution started. Poll /get_execution_chunks for updates.'
        }

    except AppError as e:
        log_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise e.to_https_error()

    except Exception as e:
        logger.error(f"Unexpected error starting streaming execution: {str(e)}", exc_info=True)
        error_dict = handle_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise https_fn.HttpsError('internal', error_dict['message'], error_dict)


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def get_execution_chunks(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get chunks from a streaming execution
    Client polls this endpoint to get new chunks
    """
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        execution_id = req.data.get('executionId')
        prompt_id = req.data.get('promptId')
        from_index = req.data.get('fromIndex', 0)

        if not execution_id or not prompt_id:
            raise ValidationError('executionId and promptId are required')

        # Get chunks from Firestore
        db = firestore.client()
        handler = StreamingResponseHandler(db)

        result = asyncio.run(handler.get_execution_chunks(
            req.auth.uid,
            prompt_id,
            execution_id,
            from_index
        ))

        return result

    except AppError as e:
        log_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise e.to_https_error()

    except Exception as e:
        logger.error(f"Error getting execution chunks: {str(e)}", exc_info=True)
        error_dict = handle_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise https_fn.HttpsError('internal', error_dict['message'], error_dict)


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def cancel_streaming_execution(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Cancel an in-progress streaming execution.
    Marks the execution document as cancelled so the streamer can stop early.
    """
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        execution_id = req.data.get('executionId')
        prompt_id = req.data.get('promptId')
        reason = req.data.get('reason', 'client_cancelled')

        if not execution_id or not prompt_id:
            raise ValidationError('executionId and promptId are required')

        db = firestore.client()
        execution_ref = (
            db.collection('users')
            .document(req.auth.uid)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        # Update status to cancelled; streamer checks this and exits
        execution_ref.update({
            'status': 'cancelled',
            'completed': False,
            'cancelled_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'cancel_reason': reason
        })

        return {
            'execution_id': execution_id,
            'status': 'cancelled',
            'success': True
        }

    except AppError as e:
        log_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise e.to_https_error()

    except Exception as e:
        logger.error(f"Error cancelling execution: {str(e)}", exc_info=True)
        error_dict = handle_error(e, context={'user_id': req.auth.uid if req.auth else None})
        raise https_fn.HttpsError('internal', error_dict['message'], error_dict)


async def _execute_prompt_streaming_async(
    user_id: str,
    prompt_id: str,
    execution_id: str,
    prompt_data: Dict,
    inputs: Dict,
    use_rag: bool,
    rag_query: str,
    document_ids: List[str]
):
    """
    Async streaming execution implementation
    Streams chunks to Firestore as they're generated
    """
    start_time = datetime.now(timezone.utc)
    context = ""
    context_metadata = {}

    try:
        prompt_content = prompt_data.get('content', '')
        prompt_title = prompt_data.get('title', 'Untitled')

        # Replace variables in prompt
        for var_name, var_value in inputs.items():
            placeholder = f"{{{var_name}}}"
            prompt_content = prompt_content.replace(placeholder, str(var_value))

        # Retrieve RAG context if requested
        if use_rag and rag_query:
            logger.info(f"Retrieving RAG context for streaming execution: {execution_id}")
            try:
                # Build RetrievalContext for context retriever
                retrieval_ctx = RetrievalContext(
                    query=rag_query,
                    user_id=user_id,
                    document_filters={'document_ids': document_ids} if document_ids else None,
                    max_tokens=4000,
                    min_relevance_score=0.7,
                    use_hybrid_search=True,
                    rerank_results=True
                )
                retrieved_context = await context_retriever.retrieve_context(retrieval_ctx)
                context = retrieved_context.formatted_context
                context_metadata = retrieved_context.metadata
            except Exception as rag_error:
                logger.error(f"RAG context retrieval failed: {str(rag_error)}")

        # Create system prompt
        system_prompt = f"""You are an AI assistant helping with the prompt titled "{prompt_title}".
Provide helpful, accurate, and well-structured responses. If context information is provided, use it to enhance your response while being clear about what information comes from the context versus your general knowledge."""

        # Generate streaming response
        db = firestore.client()
        collector = SimpleStreamCollector()

        async with OpenRouterClient(openrouter_config) as llm_client:
            stream = llm_client.generate_response_stream(
                prompt=prompt_content,
                system_prompt=system_prompt,
                context=context if context else None
            )

            # Stream to Firestore
            await stream_to_firestore(
                stream,
                user_id,
                prompt_id,
                execution_id,
                db
            )

        logger.info(f"Streaming execution completed: {execution_id}")

    except Exception as e:
        logger.error(f"Error in streaming execution: {str(e)}", exc_info=True)

        # Mark execution as failed
        db = firestore.client()
        execution_ref = (
            db.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        execution_ref.update({
            'status': 'failed',
            'error': str(e),
            'updated_at': datetime.now(timezone.utc)
        })


@firestore_fn.on_document_created(document="rag_documents/{doc_id}")
def process_document(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Process uploaded documents for RAG"""
    try:
        doc_data = event.data.to_dict()
        doc_id = event.params['doc_id']

        logger.info(f"Processing document: {doc_id}")

        # Run async processing
        asyncio.run(_process_document_async(doc_id, doc_data))

    except Exception as e:
        logger.error(f"Error in document processing trigger: {str(e)}")
        # Update document status to failed
        db = firestore.client()
        doc_ref = db.collection('rag_documents').document(doc_id)
        doc_ref.update({
            'status': 'failed',
            'error': str(e),
            'processedAt': firestore.SERVER_TIMESTAMP
        })

async def _process_document_async(doc_id: str, doc_data: Dict):
    """Async document processing implementation"""
    db = firestore.client()
    doc_ref = db.collection('rag_documents').document(doc_id)

    try:
        # Update status to processing
        doc_ref.update({
            'status': 'processing',
            'processingStartedAt': firestore.SERVER_TIMESTAMP
        })

        # Extract file information from document data
        file_path = doc_data.get('filePath')
        file_name = doc_data.get('fileName', 'unknown')
        mime_type = doc_data.get('mimeType')
        user_id = doc_data.get('uploadedBy')

        if not file_path:
            raise ValueError("No file path found in document data")

        # Download file from Firebase Storage
        logger.info(f"Downloading file from storage: {file_path}")
        bucket = storage.bucket()
        blob = bucket.blob(file_path)
        file_content = blob.download_as_bytes()

        # Use DocumentProcessingPipeline for end-to-end processing
        logger.info(f"Processing document {doc_id} with DocumentProcessingPipeline")
        from src.rag.document_processor import DocumentProcessingJob, ProcessingStatus

        # Create processing job
        job = DocumentProcessingJob(
            document_id=doc_id,
            user_id=user_id or 'unknown',
            file_name=file_name,
            mime_type=mime_type,
            file_size=len(file_content),
            status=ProcessingStatus.PENDING
        )

        # Initialize pipeline
        db = firestore.client()
        pipeline = DocumentProcessingPipeline(firestore_client=db)

        # Process document (extraction, chunking, embedding, indexing)
        success = await pipeline.process_document(
            job=job,
            file_content=file_content,
            processing_config={
                'chunk_size': 1000,
                'chunk_overlap': 200,
                'embedding_model': 'text-embedding-004',  # Google
                'vector_namespace': user_id or 'default',
                'batch_size': 50
            }
        )

        if not success:
            raise ValueError("Document processing pipeline failed")

        # Update document status in Firestore
        doc_ref.update({
            'status': 'completed',
            'processedAt': firestore.SERVER_TIMESTAMP,
            'processingMetadata': {
                'pipeline': 'DocumentProcessingPipeline',
                'embedding_model': 'text-embedding-004',
                'vector_store': 'firestore'
            }
        })

        logger.info(f"Successfully processed document {doc_id} using DocumentProcessingPipeline")

    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {str(e)}")
        doc_ref.update({
            'status': 'failed',
            'error': str(e),
            'processedAt': firestore.SERVER_TIMESTAMP
        })
        raise

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def test_openrouter_connection(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Test OpenRouter API connection and model info"""
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # Run async test
        result = asyncio.run(_test_openrouter_async())
        return result

    except Exception as e:
        logger.error(f"Error testing OpenRouter connection: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

async def _test_openrouter_async() -> Dict[str, Any]:
    """Async OpenRouter connection test"""
    try:
        async with OpenRouterClient(openrouter_config) as llm_client:
            # Test API key validation
            is_valid = await llm_client.validate_api_key()

            if not is_valid:
                return {
                    'status': 'error',
                    'message': 'Invalid API key',
                    'apiKeyValid': False
                }

            # Test simple generation
            test_response = await llm_client.generate_response(
                prompt="Say 'Hello from OpenRouter!' and nothing else.",
                system_prompt="You are a test assistant. Respond exactly as requested."
            )

            return {
                'status': 'success',
                'message': 'OpenRouter connection successful',
                'apiKeyValid': True,
                'testResponse': test_response.content,
                'model': test_response.model,
                'tokensUsed': test_response.usage.get('total_tokens', 0),
                'responseTime': test_response.response_time,
                'cost': test_response.cost_estimate
            }

    except Exception as e:
        logger.error(f"OpenRouter test error: {str(e)}")
        return {
            'status': 'error',
            'message': f'Connection test failed: {str(e)}',
            'apiKeyValid': False
        }

@https_fn.on_request()
def health(req):
    """Health check endpoint"""
    return {'status': 'healthy', 'region': 'australia-southeast1', 'timestamp': firestore.SERVER_TIMESTAMP}

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def get_available_models(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Get available models from OpenRouter"""
    try:
        # Enhanced model list with proper structure for ModelSelector
        models = {
            "nvidia/nemotron-nano-9b-v2:free": {
                "key": "nvidia/nemotron-nano-9b-v2:free",
                "provider": "openrouter",
                "model_name": "nvidia/nemotron-nano-9b-v2:free",
                "display_name": "Nemotron Nano 9B V2 (Free)",
                "description": "Free NVIDIA compact language model",
                "cost_per_1k_tokens": 0.0,
                "context_window": 131072,
                "configured": True
            },
            "google/gemma-3-27b-it:free": {
                "key": "google/gemma-3-27b-it:free",
                "provider": "openrouter",
                "model_name": "google/gemma-3-27b-it:free",
                "display_name": "Gemma 3 27B IT (Free)",
                "description": "Free Google instruction-tuned language model",
                "cost_per_1k_tokens": 0.0,
                "context_window": 131072,
                "configured": True
            },
            "meta-llama/llama-3.3-70b-instruct:free": {
                "key": "meta-llama/llama-3.3-70b-instruct:free",
                "provider": "openrouter",
                "model_name": "meta-llama/llama-3.3-70b-instruct:free",
                "display_name": "Llama 3.3 70B Instruct (Free)",
                "description": "Free Meta large instruction-tuned model",
                "cost_per_1k_tokens": 0.0,
                "context_window": 131072,
                "configured": True
            },
            "mistralai/mistral-7b-instruct:free": {
                "key": "mistralai/mistral-7b-instruct:free",
                "provider": "openrouter",
                "model_name": "mistralai/mistral-7b-instruct:free",
                "display_name": "Mistral 7B Instruct (Free)",
                "description": "Free Mistral instruction-tuned model",
                "cost_per_1k_tokens": 0.0,
                "context_window": 131072,
                "configured": True
            },
            "meta-llama/llama-3.2-3b-instruct:free": {
                "key": "meta-llama/llama-3.2-3b-instruct:free",
                "provider": "openrouter",
                "model_name": "meta-llama/llama-3.2-3b-instruct:free",
                "display_name": "Llama 3.2 3B Instruct (Free)",
                "description": "Smaller, faster free model",
                "cost_per_1k_tokens": 0.0,
                "context_window": 131072,
                "configured": True
            },
            "meta-llama/llama-3.1-8b-instruct:free": {
                "key": "meta-llama/llama-3.1-8b-instruct:free",
                "provider": "openrouter",
                "model_name": "meta-llama/llama-3.1-8b-instruct:free",
                "display_name": "Llama 3.1 8B Instruct (Free)",
                "description": "Balanced performance and speed",
                "cost_per_1k_tokens": 0.0,
                "context_window": 131072,
                "configured": True
            },
            "gpt-3.5-turbo": {
                "key": "gpt-3.5-turbo",
                "provider": "openai",
                "model_name": "gpt-3.5-turbo",
                "display_name": "GPT-3.5 Turbo",
                "description": "Fast and efficient OpenAI model",
                "cost_per_1k_tokens": 0.002,
                "context_window": 16385,
                "configured": False  # Requires OpenAI API key
            },
            "gpt-4": {
                "key": "gpt-4",
                "provider": "openai",
                "model_name": "gpt-4",
                "display_name": "GPT-4",
                "description": "Most capable OpenAI model",
                "cost_per_1k_tokens": 0.03,
                "context_window": 8192,
                "configured": False  # Requires OpenAI API key
            }
        }

        # Check which API keys are configured
        api_keys_status = {
            "openrouter": bool(os.environ.get('OPENROUTER_API_KEY')),
            "openai": bool(os.environ.get('OPENAI_API_KEY')),
            "anthropic": bool(os.environ.get('ANTHROPIC_API_KEY')),
            "cohere": bool(os.environ.get('COHERE_API_KEY'))
        }

        return {
            'success': True,
            'models': models,
            'apiKeysConfigured': api_keys_status,
            'default_model': 'nvidia/nemotron-nano-9b-v2:free'
        }

    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'models': {},
            'apiKeysConfigured': {}
        }

# =============================================================================
# API KEY MANAGEMENT FUNCTIONS
# =============================================================================

# Import API key management functions
from src.api.api_keys import (
    encrypt_api_key, decrypt_api_key, mask_api_key,
    validate_api_key_with_openrouter
)

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def save_api_key(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Save encrypted user API key to Firestore"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        api_key = req.data.get('apiKey')
        key_name = req.data.get('keyName', 'Default')
        provider = req.data.get('provider', 'openrouter')

        if not api_key:
            raise https_fn.HttpsError('invalid-argument', 'API key is required')

        user_id = req.auth.uid
        db = firestore.client()

        # Encrypt the API key
        encrypted_key = encrypt_api_key(api_key, user_id)

        # Save to Firestore
        key_doc = {
            'userId': user_id,
            'provider': provider,
            'keyName': key_name,
            'encryptedKey': encrypted_key,
            'maskedKey': mask_api_key(api_key),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'lastUsedAt': None,
            'isActive': True,
            'usageCount': 0
        }

        doc_ref = db.collection('user_api_keys').add(key_doc)

        logger.info(f"API key saved for user {user_id}")

        return {
            'success': True,
            'message': 'API key saved successfully',
            'keyId': doc_ref[1].id
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error saving API key: {str(e)}")
        raise https_fn.HttpsError('internal', f'Failed to save API key: {str(e)}')


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def validate_api_key(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Validate API key with OpenRouter"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        api_key = req.data.get('apiKey')

        if not api_key:
            raise https_fn.HttpsError('invalid-argument', 'API key is required')

        # Validate with OpenRouter
        is_valid, message = asyncio.run(validate_api_key_with_openrouter(api_key))

        return {
            'success': True,
            'isValid': is_valid,
            'message': message
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error validating API key: {str(e)}")
        raise https_fn.HttpsError('internal', f'Failed to validate API key: {str(e)}')


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def list_api_keys(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """List user's API keys (masked)"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        user_id = req.auth.uid
        db = firestore.client()

        # Query user's API keys
        keys_ref = db.collection('user_api_keys').where('userId', '==', user_id).where('isActive', '==', True)
        keys = keys_ref.stream()

        api_keys = []
        for key in keys:
            key_data = key.to_dict()
            api_keys.append({
                'keyId': key.id,
                'keyName': key_data.get('keyName'),
                'provider': key_data.get('provider'),
                'maskedKey': key_data.get('maskedKey'),
                'createdAt': key_data.get('createdAt'),
                'lastUsedAt': key_data.get('lastUsedAt'),
                'usageCount': key_data.get('usageCount', 0)
            })

        return {
            'success': True,
            'keys': api_keys
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}")
        raise https_fn.HttpsError('internal', f'Failed to list API keys: {str(e)}')


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def delete_api_key(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Delete (soft delete) user's API key"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        key_id = req.data.get('keyId')

        if not key_id:
            raise https_fn.HttpsError('invalid-argument', 'Key ID is required')

        user_id = req.auth.uid
        db = firestore.client()

        # Verify ownership and soft delete
        key_ref = db.collection('user_api_keys').document(key_id)
        key_doc = key_ref.get()

        if not key_doc.exists:
            raise https_fn.HttpsError('not-found', 'API key not found')

        key_data = key_doc.to_dict()
        if key_data.get('userId') != user_id:
            raise https_fn.HttpsError('permission-denied', 'Not authorized to delete this key')

        # Soft delete
        key_ref.update({
            'isActive': False,
            'deletedAt': firestore.SERVER_TIMESTAMP
        })

        logger.info(f"API key {key_id} deleted for user {user_id}")

        return {
            'success': True,
            'message': 'API key deleted successfully'
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key: {str(e)}")
        raise https_fn.HttpsError('internal', f'Failed to delete API key: {str(e)}')


# =============================================================================
# API ROUTER
# =============================================================================

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",  # Added for emulator testing
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",  # Added for emulator testing
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def api(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """API router function that handles multiple endpoints"""
    try:
        data = req.data
        endpoint = data.get('endpoint', 'health')

        logger.info(f"API router called with endpoint: {endpoint}")

        if endpoint == 'health':
            # Health endpoint doesn't require authentication
            return {
                'status': 'success',
                'message': 'API is working',
                'region': 'australia-southeast1',
                'timestamp': firestore.SERVER_TIMESTAMP,
                'user_id': req.auth.uid if req.auth else None
            }

        # All other endpoints require authentication
        if not req.auth:
            raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

        if endpoint == 'execute_prompt':
            # Route to execute_prompt function
            logger.info(f"Routing to execute_prompt for user: {req.auth.uid}")
            return execute_prompt(req)

        elif endpoint == 'test_openrouter_connection':
            # Route to test_openrouter_connection function
            logger.info(f"Routing to test_openrouter_connection for user: {req.auth.uid}")
            return test_openrouter_connection(req)

        elif endpoint == 'get_available_models':
            # Route to get_available_models function
            logger.info(f"Routing to get_available_models for user: {req.auth.uid}")
            return get_available_models(req)

        else:
            logger.warning(f"Unknown endpoint requested: {endpoint}")
            raise https_fn.HttpsError('invalid-argument', f'Unknown endpoint: {endpoint}')

    except https_fn.HttpsError:
        # Re-raise HttpsError as-is
        raise
    except Exception as e:
        logger.error(f"Error in API router: {str(e)}")
        raise https_fn.HttpsError('internal', f'API router error: {str(e)}')


# =============================================================================
# PROMPT CRUD OPERATIONS
# =============================================================================
# Import prompt service for CRUD operations
from src.api.prompt_service import (
    PromptService,
    CreatePromptRequest,
    UpdatePromptRequest,
    SearchPromptsRequest,
    PromptVariable
)
from pydantic import ValidationError as PydanticValidationError

# Initialize prompt service
prompt_service_instance = PromptService(firestore.client())

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def create_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Create a new prompt"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        data = req.data

        # Convert variables to PromptVariable objects
        variables = []
        for var in data.get('variables', []):
            variables.append(PromptVariable(**var))

        # Create request object
        prompt_request = CreatePromptRequest(
            title=data.get('title'),
            content=data.get('content'),
            description=data.get('description'),
            category=data.get('category'),
            tags=data.get('tags', []),
            variables=variables,
            is_public=data.get('is_public', False),
            model=data.get('model'),
            temperature=data.get('temperature', 0.7),
            max_tokens=data.get('max_tokens', 2000)
        )

        # Create prompt using service
        created_prompt = asyncio.run(
            prompt_service_instance.create_prompt(
                user_id=req.auth.uid,
                prompt_data=prompt_request
            )
        )

        logger.info(f"Created prompt {created_prompt['promptId']} for user {req.auth.uid}")

        return {
            'success': True,
            'promptId': created_prompt['promptId'],
            'prompt': created_prompt
        }

    except PydanticValidationError as e:
        error_messages = []
        for error in e.errors():
            field = ' -> '.join(str(loc) for loc in error['loc'])
            error_messages.append(f"{field}: {error['msg']}")
        raise https_fn.HttpsError('invalid-argument', f"Validation error: {'; '.join(error_messages)}")

    except ValueError as e:
        raise https_fn.HttpsError('already-exists', str(e))

    except Exception as e:
        logger.error(f"Error creating prompt: {str(e)}")
        raise https_fn.HttpsError('internal', f'Failed to create prompt: {str(e)}')


# =============================================================================
# MARKETING AGENT STREAMING
# =============================================================================
from src.ai_agent.marketing.marketing_agent import get_marketing_agent

@https_fn.on_request(
    region="australia-southeast1",
    cors=options.CorsOptions(cors_origins=["*"], cors_methods=["POST", "OPTIONS"]),
    timeout_sec=300,
    memory=512
)
def marketing_chat_stream(req: https_fn.Request) -> https_fn.Response:
    """
    Streaming endpoint for Marketing Agent with intelligent caching
    """
    # Handle OPTIONS
    if req.method == "OPTIONS":
        return https_fn.Response(status=204)

    try:
        data = req.get_json(silent=True) or {}
        message = data.get("message")
        conversation_id = data.get("conversationId")

        if not message:
             return https_fn.Response("Message is required", status=400)

        agent = get_marketing_agent()

        # Generator for streaming
        def generate():
            # Create a new event loop for this request
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            full_response_text = ""
            cache_hit = False

            try:
                # 1. Check Cache First
                cached_data = intelligent_response_cache.get_cached_response(
                    query=message,
                    page_context="marketing_chat"
                )

                if cached_data:
                    logger.info(f"✓ Cache HIT for: {message[:50]}...")
                    # Serve entire cached response at once
                    yield f"data: {json.dumps({'type': 'content', 'chunk': cached_data['response']})}\\n\\n"
                    cache_hit = True
                    return

                # 2. Cache Miss - Generate Response
                logger.info(f"Cache MISS for: {message[:50]}...")
                async_gen = agent.chat_stream(message, {"conversation_id": conversation_id})

                while True:
                    try:
                        chunk = loop.run_until_complete(async_gen.__anext__())
                        full_response_text += chunk
                        # Format as SSE
                        yield f"data: {json.dumps({'type': 'content', 'chunk': chunk})}\\n\\n"
                    except StopAsyncIteration:
                        break

                # 3. Save to Cache After Generation
                if not cache_hit and full_response_text:
                    cache_success = intelligent_response_cache.cache_response_safe(
                        query=message,
                        response=full_response_text,
                        page_context="marketing_chat",
                        metadata={'model': 'granite-3.0-8b', 'conversation_id': conversation_id}
                    )
                    if cache_success:
                        logger.info(f"✓ Cached response for: {message[:50]}...")
                    else:
                        logger.warning(f"✗ Failed to cache (PII/Quality): {message[:50]}...")

            except Exception as e:
                logger.error(f"Error in stream: {e}")
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\\n\\n"
            finally:
                loop.close()

        return https_fn.Response(
            generate(),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no"
            }
        )

    except Exception as e:
        logger.error(f"Error in marketing_chat_stream: {e}")
        return https_fn.Response(str(e), status=500)
