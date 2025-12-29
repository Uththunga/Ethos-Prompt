"""
Document Processor - Main RAG document processing pipeline with status tracking
"""
import logging
import asyncio
import uuid
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from enum import Enum

# Import our RAG components
from .document_extractors import document_processor, ExtractionResult
from .chunking_strategies import chunking_manager, ChunkingResult
from .embedding_service import embedding_service, BatchEmbeddingResult
from .vector_store import vector_store

logger = logging.getLogger(__name__)

class ProcessingStatus(Enum):
    PENDING = "pending"
    EXTRACTING = "extracting"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class ProcessingStep:
    step_name: str
    status: ProcessingStatus
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class DocumentProcessingJob:
    job_id: str
    user_id: str
    document_id: str
    filename: str
    file_size: int
    status: ProcessingStatus
    created_at: datetime
    updated_at: datetime
    steps: List[ProcessingStep]
    total_chunks: int = 0
    total_tokens: int = 0
    processing_time: float = 0.0
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class DocumentProcessingPipeline:
    """
    Main document processing pipeline with status tracking
    """

    def __init__(self, firestore_client=None):
        self.db = firestore_client
        self.status_callbacks: List[Callable] = []
        self.webhook_urls: List[str] = []

        # Processing configuration
        self.config = {
            'chunk_size': 1000,
            'chunk_overlap': 200,
            'embedding_model': 'text-embedding-004',  # Google's text embedding model
            'vector_namespace': 'documents',
            'batch_size': 50
        }

    def add_status_callback(self, callback: Callable[[DocumentProcessingJob], None]):
        """Add callback for status updates"""
        self.status_callbacks.append(callback)
    def add_status_webhook(self, url: str):
        """Register an HTTP webhook to receive status updates (best-effort)."""
        if url and url not in self.webhook_urls:
            self.webhook_urls.append(url)


    def _notify_status_update(self, job: DocumentProcessingJob):
        """Notify all callbacks and webhooks of status update (best-effort)."""
        for callback in self.status_callbacks:
            try:
                callback(job)
            except Exception as e:
                logger.warning(f"Status callback failed: {e}")
        # Fire webhooks (non-blocking best-effort)
        if self.webhook_urls:
            payload = {
                "job_id": job.job_id,
                "status": job.status.value,
                "document_id": job.document_id,
                "user_id": job.user_id,
                "updated_at": job.updated_at.isoformat(),
            }
            try:
                import threading, json
                import requests  # type: ignore

                def _post(url: str, data: dict):
                    try:
                        requests.post(url, json=data, timeout=3)
                    except Exception as ex:
                        logger.debug(f"Webhook post failed to {url}: {ex}")

                for url in self.webhook_urls:
                    threading.Thread(target=_post, args=(url, payload), daemon=True).start()
            except Exception as e:
                logger.debug(f"Webhook notification setup failed: {e}")

    def _update_job_status(
        self,
        job: DocumentProcessingJob,
        status: ProcessingStatus,
        step_name: Optional[str] = None,
        error: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Update job status and save to Firestore"""
        job.status = status
        job.updated_at = datetime.now(timezone.utc)

        if error:
            job.error_message = error

        # Update current step
        if step_name:
            current_step = None
            for step in job.steps:
                if step.step_name == step_name:
                    current_step = step
                    break

            if current_step:
                current_step.status = status
                if status == ProcessingStatus.FAILED and error:
                    current_step.error = error
                if status in [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED]:
                    current_step.end_time = datetime.now(timezone.utc)
                    if current_step.start_time:
                        current_step.duration = (current_step.end_time - current_step.start_time).total_seconds()
                if metadata:
                    current_step.metadata = {**(current_step.metadata or {}), **metadata}

        # Save to Firestore
        self._save_job_status(job)

        # Notify callbacks
        self._notify_status_update(job)

    def _save_job_status(self, job: DocumentProcessingJob):
        """Save job status to Firestore"""
        if not self.db:
            return

        try:
            job_data = asdict(job)

            # Convert datetime objects to ISO strings
            job_data['created_at'] = job.created_at.isoformat()
            job_data['updated_at'] = job.updated_at.isoformat()

            # Convert step datetimes
            for step_data in job_data['steps']:
                if step_data['start_time']:
                    step_data['start_time'] = step_data['start_time'].isoformat()
                if step_data['end_time']:
                    step_data['end_time'] = step_data['end_time'].isoformat()
                step_data['status'] = step_data['status'].value

            job_data['status'] = job.status.value

            # Save to Firestore
            doc_ref = self.db.collection('document_processing_jobs').document(job.job_id)
            doc_ref.set(job_data)

        except Exception as e:
            logger.error(f"Failed to save job status: {e}")

    def create_processing_job(
        self,
        user_id: str,
        document_id: str,
        filename: str,
        file_size: int
    ) -> DocumentProcessingJob:
        """Create a new document processing job"""
        job_id = str(uuid.uuid4())

        # Define processing steps
        steps = [
            ProcessingStep("extraction", ProcessingStatus.PENDING),
            ProcessingStep("chunking", ProcessingStatus.PENDING),
            ProcessingStep("embedding", ProcessingStatus.PENDING),
            ProcessingStep("indexing", ProcessingStatus.PENDING)
        ]

        job = DocumentProcessingJob(
            job_id=job_id,
            user_id=user_id,
            document_id=document_id,
            filename=filename,
            file_size=file_size,
            status=ProcessingStatus.PENDING,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            steps=steps,
            metadata={}
        )

        # Save initial job
        self._save_job_status(job)

        logger.info(f"Created processing job {job_id} for document {document_id}")
        return job

    async def process_document(
        self,
        job: DocumentProcessingJob,
        file_content: bytes,
        processing_config: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Process document through the full RAG pipeline"""
        config = {**self.config, **(processing_config or {})}
        start_time = datetime.now(timezone.utc)

        try:
            # Step 1: Document Extraction
            self._update_job_status(job, ProcessingStatus.EXTRACTING, "extraction")
            job.steps[0].start_time = datetime.now(timezone.utc)

            extraction_result = document_processor.process_document(
                file_content,
                job.filename
            )

            if not extraction_result.success:
                self._update_job_status(
                    job, ProcessingStatus.FAILED, "extraction",
                    f"Extraction failed: {extraction_result.error}"
                )
                return False

            self._update_job_status(
                job, ProcessingStatus.COMPLETED, "extraction",
                metadata={
                    'extracted_chars': len(extraction_result.document.content),
                    'file_type': extraction_result.document.file_type,
                    'extraction_time': extraction_result.document.extraction_time
                }
            )

            # Step 2: Text Chunking
            self._update_job_status(job, ProcessingStatus.CHUNKING, "chunking")
            job.steps[1].start_time = datetime.now(timezone.utc)

            chunking_result = chunking_manager.chunk_document(
                extraction_result.document.content,
                strategy=config.get('chunking_strategy'),
                metadata={
                    'document_id': job.document_id,
                    'filename': job.filename,
                    'user_id': job.user_id
                },
                chunk_size=config['chunk_size'],
                overlap=config['chunk_overlap']
            )

            job.total_chunks = chunking_result.total_chunks
            job.total_tokens = chunking_result.total_tokens

            self._update_job_status(
                job, ProcessingStatus.COMPLETED, "chunking",
                metadata={
                    'total_chunks': chunking_result.total_chunks,
                    'total_tokens': chunking_result.total_tokens,
                    'strategy_used': chunking_result.strategy_used
                }
            )

            # Step 3: Generate Embeddings
            self._update_job_status(job, ProcessingStatus.EMBEDDING, "embedding")
            job.steps[2].start_time = datetime.now(timezone.utc)

            chunk_texts = [chunk.content for chunk in chunking_result.chunks]
            embedding_result = await embedding_service.generate_batch_embeddings(
                chunk_texts,
                model=config['embedding_model']
            )

            if embedding_result.error_count > 0:
                logger.warning(f"Embedding errors: {embedding_result.errors}")

            self._update_job_status(
                job, ProcessingStatus.COMPLETED, "embedding",
                metadata={
                    'embeddings_generated': embedding_result.success_count,
                    'embedding_errors': embedding_result.error_count,
                    'total_embedding_tokens': embedding_result.total_tokens,
                    'embedding_time': embedding_result.total_time
                }
            )

            # Step 4: Index in Vector Store
            self._update_job_status(job, ProcessingStatus.INDEXING, "indexing")
            job.steps[3].start_time = datetime.now(timezone.utc)

            # Prepare vectors for indexing
            vectors = []
            for chunk, embedding_result in zip(chunking_result.chunks, embedding_result.results):
                if embedding_result:  # Skip failed embeddings
                    vector_metadata = {
                        **chunk.metadata,
                        'content': chunk.content,
                        'document_id': job.document_id,
                        'user_id': job.user_id,
                        'filename': job.filename,
                        'chunk_index': chunk.metadata.get('chunk_index', 0),
                        'token_count': chunk.token_count
                    }

                    vectors.append((
                        chunk.chunk_id,
                        embedding_result.embedding,
                        vector_metadata
                    ))

            # Index vectors
            if vectors and vector_store.is_available():
                success = vector_store.upsert_vectors(
                    vectors,
                    namespace=config['vector_namespace']
                )

                if not success:
                    self._update_job_status(
                        job, ProcessingStatus.FAILED, "indexing",
                        "Failed to index vectors in vector store"
                    )
                    return False
            else:
                logger.warning("Vector store not available or no vectors to index")

            self._update_job_status(
                job, ProcessingStatus.COMPLETED, "indexing",
                metadata={
                    'vectors_indexed': len(vectors),
                    'vector_namespace': config['vector_namespace']
                }
            )

            # Mark job as completed
            job.processing_time = (datetime.now(timezone.utc) - start_time).total_seconds()
            self._update_job_status(job, ProcessingStatus.COMPLETED)

            logger.info(f"Document processing completed for job {job.job_id}")
            return True

        except Exception as e:
            error_msg = f"Document processing failed: {str(e)}"
            logger.error(error_msg)
            self._update_job_status(job, ProcessingStatus.FAILED, error=error_msg)
            return False

    def get_job_status(self, job_id: str) -> Optional[DocumentProcessingJob]:
        """Get job status from Firestore"""
        if not self.db:
            return None

        try:
            doc_ref = self.db.collection('document_processing_jobs').document(job_id)
            doc = doc_ref.get()

            if not doc.exists:
                return None

            job_data = doc.to_dict()

            # Convert back to DocumentProcessingJob
            # This is a simplified conversion - in production you'd want proper deserialization
            return job_data

        except Exception as e:
            logger.error(f"Failed to get job status: {e}")
            return None

    def get_user_jobs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get processing jobs for a user"""
        if not self.db:
            return []

        try:
            query = self.db.collection('document_processing_jobs')\
                          .where('user_id', '==', user_id)\
                          .order_by('created_at', direction='DESCENDING')\
                          .limit(limit)

            jobs = []
            for doc in query.stream():
                jobs.append(doc.to_dict())

            return jobs

        except Exception as e:
            logger.error(f"Failed to get user jobs: {e}")
            return []

# Global instance
document_processing_pipeline = DocumentProcessingPipeline()

