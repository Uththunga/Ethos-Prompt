"""
Reprocess Document Endpoint
- Clears previous processing artifacts (best-effort)
- Resets Firestore status and queues document for reprocessing
"""
from typing import Dict, Any
from firebase_functions import https_fn, options
from firebase_admin import firestore
import logging

from ..rag.document_processor import DocumentProcessingPipeline, ProcessingStatus

logger = logging.getLogger(__name__)
_db = firestore.client()


@https_fn.on_call(
    region="australia-southeast1",
    timeout_sec=300,
    cors=options.CorsOptions(cors_origins="*", cors_methods=["POST"]),
)
def reprocess_document(req: https_fn.CallableRequest) -> Dict[str, Any]:
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated",
        )

    document_id = req.data.get("documentId")
    if not document_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="documentId is required",
        )

    try:
        doc_ref = _db.collection("documents").document(document_id)
        snap = doc_ref.get()
        if not snap.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND, message="Document not found"
            )
        doc = snap.to_dict()

        # Ownership check
        if doc.get("userId") != req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED, message="Access denied"
            )

        # Best-effort cleanup: clear stats and processing fields
        updates = {
            "status": ProcessingStatus.PENDING.value,
            "stats": {"totalChunks": 0, "totalTokens": 0, "processingTime": 0.0},
            "processing": {
                "status": ProcessingStatus.PENDING.value,
                "startedAt": None,
                "completedAt": None,
                "error": None,
                "currentStep": None,
                "totalSteps": 4,
                "percentage": 0,
                "reprocessRequestedAt": firestore.SERVER_TIMESTAMP,
            },
            "updatedAt": firestore.SERVER_TIMESTAMP,
        }
        doc_ref.update(updates)

        # TODO: delete vectors from vector store if supported
        # TODO: delete old chunk/embedding records if stored separately

        # Queue reprocessing - for now just record queuedAt and let background pick it up
        doc_ref.update({"processing.queuedAt": firestore.SERVER_TIMESTAMP})

        # Optional: trigger directly if you have a task queue mechanism
        try:
            pipeline = DocumentProcessingPipeline(firestore_client=_db)
            # Register a webhook if provided
            webhook = req.data.get("webhookUrl")
            if webhook:
                pipeline.add_status_webhook(webhook)
            # NOTE: actual async processing should be kicked via Cloud Tasks/Pub/Sub
            logger.info(
                f"Reprocess requested for document {document_id}. Processing will be triggered separately."
            )
        except Exception as ex:
            logger.debug(f"Pipeline init during reprocess was skipped: {ex}")

        return {"success": True, "documentId": document_id, "message": "Reprocessing queued"}

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error reprocessing document: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to reprocess document: {str(e)}",
        )

