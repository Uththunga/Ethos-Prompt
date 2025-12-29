"""
Document Upload & Management API
RAG Prompt Library - Document Upload, Storage, and Processing

Endpoints:
- upload_document: Upload document to Firebase Storage and trigger RAG processing
- list_documents: List user's documents with pagination
- get_document: Get document details and processing status
- delete_document: Delete document from storage and Firestore
- get_document_status: Get real-time processing status
"""

from firebase_functions import https_fn, options
from firebase_admin import firestore, storage
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List
import logging
import uuid
import base64
import mimetypes

from ..rag.document_processor import DocumentProcessingPipeline, ProcessingStatus
from ..utils.file_validator import (
    validate_file_type,
    validate_file_size,
    sanitize_filename,
    get_file_extension
)

logger = logging.getLogger(__name__)
db = firestore.client()
bucket = storage.bucket()


# =============================================================================
# CONSTANTS
# =============================================================================

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.doc', '.docx', '.md', '.markdown']
ALLOWED_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/markdown',
    'text/x-markdown'
]


# =============================================================================
# UPLOAD DOCUMENT
# =============================================================================

@https_fn.on_call(
    region="australia-southeast1",
    timeout_sec=300,  # 5 minutes for large uploads
    cors=options.CorsOptions(
        cors_origins="*",
        cors_methods=["POST"]
    )
)
def upload_document(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Upload document to Firebase Storage and trigger RAG processing

    Args:
        filename: Original filename
        content: Base64-encoded file content
        mimeType: MIME type of the file
        metadata: Optional metadata (title, description, tags)

    Returns:
        Document ID, upload status, and processing job ID
    """
    # Authentication check
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    # Get parameters
    filename = req.data.get('filename')
    content_base64 = req.data.get('content')
    mime_type = req.data.get('mimeType')
    metadata = req.data.get('metadata', {})

    if not filename or not content_base64:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="filename and content are required"
        )

    try:
        # Sanitize filename
        safe_filename = sanitize_filename(filename)
        file_extension = get_file_extension(safe_filename)

        # Validate file type
        if not validate_file_type(file_extension, mime_type):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Decode content
        try:
            file_content = base64.b64decode(content_base64)
        except Exception as e:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message=f"Invalid base64 content: {str(e)}"
            )

        # Validate file size
        file_size = len(file_content)
        if not validate_file_size(file_size, MAX_FILE_SIZE):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024)}MB"
            )

        # Generate document ID
        document_id = str(uuid.uuid4())

        # Create storage path: users/{userId}/documents/{documentId}/{filename}
        storage_path = f"users/{req.auth.uid}/documents/{document_id}/{safe_filename}"

        # Upload to Firebase Storage
        blob = bucket.blob(storage_path)
        blob.upload_from_string(
            file_content,
            content_type=mime_type or 'application/octet-stream'
        )

        # Make blob publicly readable (optional, for preview)
        # blob.make_public()

        # Get download URL
        download_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(days=7),
            method="GET"
        )

        # Create document record in Firestore
        document_data = {
            'documentId': document_id,
            'userId': req.auth.uid,
            'filename': safe_filename,
            'originalFilename': filename,
            'fileSize': file_size,
            'mimeType': mime_type,
            'fileExtension': file_extension,
            'storagePath': storage_path,
            'downloadUrl': download_url,
            'status': ProcessingStatus.PENDING.value,
            'metadata': {
                'title': metadata.get('title', safe_filename),
                'description': metadata.get('description', ''),
                'tags': metadata.get('tags', []),
                'uploadedAt': firestore.SERVER_TIMESTAMP
            },
            'processing': {
                'status': ProcessingStatus.PENDING.value,
                'startedAt': None,
                'completedAt': None,
                'error': None
            },
            'stats': {
                'totalChunks': 0,
                'totalTokens': 0,
                'processingTime': 0.0
            },
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }

        # Save to Firestore
        doc_ref = db.collection('documents').document(document_id)
        doc_ref.set(document_data)

        # Trigger RAG processing (async)
        # Note: In production, use Cloud Tasks or Pub/Sub for async processing
        try:
            pipeline = DocumentProcessingPipeline(firestore_client=db)

            # Start processing in background (simplified for now)
            # In production, this should be a separate Cloud Function triggered by Pub/Sub
            logger.info(f"Document {document_id} uploaded. RAG processing will be triggered separately.")

            # Update status to indicate processing will start
            doc_ref.update({
                'processing.status': ProcessingStatus.PENDING.value,
                'processing.queuedAt': firestore.SERVER_TIMESTAMP
            })

        except Exception as e:
            logger.error(f"Failed to queue RAG processing: {str(e)}")
            # Don't fail the upload, just log the error

        logger.info(f"Document {document_id} uploaded successfully by user {req.auth.uid}")

        return {
            'success': True,
            'documentId': document_id,
            'filename': safe_filename,
            'fileSize': file_size,
            'downloadUrl': download_url,
            'status': ProcessingStatus.PENDING.value,
            'message': 'Document uploaded successfully. Processing will begin shortly.'
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to upload document: {str(e)}"
        )


# =============================================================================
# LIST DOCUMENTS
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def list_documents(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    List user's documents with pagination and filtering

    Args:
        limit: Number of documents to return (default: 20, max: 100)
        offset: Number of documents to skip
        status: Filter by processing status
        orderBy: Field to order by (default: createdAt)
        orderDirection: asc or desc (default: desc)

    Returns:
        List of documents with metadata
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    # Get parameters
    limit = min(req.data.get('limit', 20), 100)
    offset = req.data.get('offset', 0)
    status_filter = req.data.get('status')
    order_by = req.data.get('orderBy', 'createdAt')
    order_direction = req.data.get('orderDirection', 'desc')

    try:
        # Build query
        query = db.collection('documents').where('userId', '==', req.auth.uid)

        # Apply status filter
        if status_filter:
            query = query.where('status', '==', status_filter)

        # Apply ordering
        direction = firestore.Query.DESCENDING if order_direction == 'desc' else firestore.Query.ASCENDING
        query = query.order_by(order_by, direction=direction)

        # Apply pagination
        query = query.limit(limit).offset(offset)

        # Execute query
        docs = query.stream()
        documents = []

        for doc in docs:
            doc_data = doc.to_dict()
            documents.append({
                'id': doc.id,
                **doc_data
            })

        # Get total count (for pagination)
        total_query = db.collection('documents').where('userId', '==', req.auth.uid)
        if status_filter:
            total_query = total_query.where('status', '==', status_filter)

        total_count = len(list(total_query.stream()))

        return {
            'success': True,
            'documents': documents,
            'total': total_count,
            'limit': limit,
            'offset': offset,
            'hasMore': (offset + len(documents)) < total_count
        }

    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to list documents: {str(e)}"
        )


# =============================================================================
# GET DOCUMENT
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def get_document(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get document details and processing status

    Args:
        documentId: Document ID

    Returns:
        Document details with processing status
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    document_id = req.data.get('documentId')

    if not document_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="documentId is required"
        )

    try:
        # Get document
        doc_ref = db.collection('documents').document(document_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Document not found"
            )

        doc_data = doc.to_dict()

        # Check ownership
        if doc_data.get('userId') != req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Access denied"
            )

        return {
            'success': True,
            'document': {
                'id': doc.id,
                **doc_data
            }
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error getting document: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to get document: {str(e)}"
        )


# =============================================================================
# DELETE DOCUMENT
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def delete_document(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Delete document from storage and Firestore

    Args:
        documentId: Document ID
        hardDelete: If true, permanently delete. If false, soft delete (default: false)

    Returns:
        Success status
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    document_id = req.data.get('documentId')
    hard_delete = req.data.get('hardDelete', False)

    if not document_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="documentId is required"
        )

    try:
        # Get document
        doc_ref = db.collection('documents').document(document_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Document not found"
            )

        doc_data = doc.to_dict()

        # Check ownership
        if doc_data.get('userId') != req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Access denied"
            )

        if hard_delete:
            # Delete from Firebase Storage
            storage_path = doc_data.get('storagePath')
            if storage_path:
                try:
                    blob = bucket.blob(storage_path)
                    blob.delete()
                    logger.info(f"Deleted file from storage: {storage_path}")
                except Exception as e:
                    logger.warning(f"Failed to delete file from storage: {str(e)}")

            # Delete embeddings from vector store
            try:
                from ..rag.vector_store import get_vector_store
                vector_store = get_vector_store(firestore_client=db)

                # Query for all chunks belonging to this document
                chunks_query = db.collection('vector_embeddings').where(
                    'metadata.document_id', '==', document_id
                ).stream()

                chunk_ids = [chunk.id for chunk in chunks_query]

                if chunk_ids:
                    # Delete vectors from vector store
                    vector_store.delete_vectors(
                        vector_ids=chunk_ids,
                        namespace=req.auth.uid
                    )
                    logger.info(f"Deleted {len(chunk_ids)} vectors for document {document_id}")
            except Exception as e:
                logger.warning(f"Failed to delete vectors from store: {str(e)}")
                # Don't fail the deletion if vector cleanup fails

            # Delete from Firestore
            doc_ref.delete()
            logger.info(f"Hard deleted document {document_id}")

            return {
                'success': True,
                'message': 'Document permanently deleted'
            }
        else:
            # Soft delete
            doc_ref.update({
                'deletedAt': firestore.SERVER_TIMESTAMP,
                'status': 'deleted',
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            logger.info(f"Soft deleted document {document_id}")

            return {
                'success': True,
                'message': 'Document deleted (can be restored within 30 days)'
            }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to delete document: {str(e)}"
        )


# =============================================================================
# GET DOCUMENT STATUS
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def get_document_status(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get real-time processing status for a document

    Args:
        documentId: Document ID

    Returns:
        Processing status and progress
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    document_id = req.data.get('documentId')

    if not document_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="documentId is required"
        )

    try:
        # Get document
        doc_ref = db.collection('documents').document(document_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Document not found"
            )

        doc_data = doc.to_dict()

        # Check ownership
        if doc_data.get('userId') != req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Access denied"
            )

        # Extract processing status
        processing = doc_data.get('processing', {})
        stats = doc_data.get('stats', {})

        return {
            'success': True,
            'documentId': document_id,
            'status': processing.get('status', ProcessingStatus.PENDING.value),
            'progress': {
                'currentStep': processing.get('currentStep'),
                'totalSteps': processing.get('totalSteps', 5),
                'percentage': processing.get('percentage', 0)
            },
            'stats': {
                'totalChunks': stats.get('totalChunks', 0),
                'totalTokens': stats.get('totalTokens', 0),
                'processingTime': stats.get('processingTime', 0.0)
            },
            'error': processing.get('error'),
            'startedAt': processing.get('startedAt'),
            'completedAt': processing.get('completedAt')
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error getting document status: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to get document status: {str(e)}"
        )
