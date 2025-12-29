"""
Firestore Triggers for Cache Invalidation
Cloud Functions that listen to Firestore changes and trigger cache invalidation
"""
import logging
from typing import Any, Dict
from firebase_functions import firestore_fn, options
from firebase_admin import firestore

from ..cache.event_based_invalidation import event_based_invalidation_service, EventType

logger = logging.getLogger(__name__)

# =============================================================================
# USER TRIGGERS
# =============================================================================

@firestore_fn.on_document_updated(
    document="users/{userId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_user_updated(event: firestore_fn.Event[firestore_fn.Change[firestore_fn.DocumentSnapshot]]):
    """Trigger when user document is updated"""
    try:
        doc_id = event.params["userId"]
        new_data = event.data.after.to_dict() if event.data.after else {}
        old_data = event.data.before.to_dict() if event.data.before else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.UPDATE,
            collection="users",
            doc_id=doc_id,
            data=new_data,
            old_data=old_data
        )
        
        logger.info(f"User cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in user update trigger: {e}")

# =============================================================================
# PROMPT TRIGGERS
# =============================================================================

@firestore_fn.on_document_created(
    document="prompts/{promptId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_prompt_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Trigger when prompt is created"""
    try:
        doc_id = event.params["promptId"]
        data = event.data.to_dict() if event.data else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.CREATE,
            collection="prompts",
            doc_id=doc_id,
            data=data
        )
        
        logger.info(f"Prompt created cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in prompt create trigger: {e}")

@firestore_fn.on_document_updated(
    document="prompts/{promptId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_prompt_updated(event: firestore_fn.Event[firestore_fn.Change[firestore_fn.DocumentSnapshot]]):
    """Trigger when prompt is updated"""
    try:
        doc_id = event.params["promptId"]
        new_data = event.data.after.to_dict() if event.data.after else {}
        old_data = event.data.before.to_dict() if event.data.before else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.UPDATE,
            collection="prompts",
            doc_id=doc_id,
            data=new_data,
            old_data=old_data
        )
        
        logger.info(f"Prompt cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in prompt update trigger: {e}")

@firestore_fn.on_document_deleted(
    document="prompts/{promptId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_prompt_deleted(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Trigger when prompt is deleted"""
    try:
        doc_id = event.params["promptId"]
        data = event.data.to_dict() if event.data else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.DELETE,
            collection="prompts",
            doc_id=doc_id,
            data=data
        )
        
        logger.info(f"Prompt deleted cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in prompt delete trigger: {e}")

# =============================================================================
# DOCUMENT TRIGGERS
# =============================================================================

@firestore_fn.on_document_updated(
    document="documents/{documentId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_document_updated(event: firestore_fn.Event[firestore_fn.Change[firestore_fn.DocumentSnapshot]]):
    """Trigger when document is updated"""
    try:
        doc_id = event.params["documentId"]
        new_data = event.data.after.to_dict() if event.data.after else {}
        old_data = event.data.before.to_dict() if event.data.before else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.UPDATE,
            collection="documents",
            doc_id=doc_id,
            data=new_data,
            old_data=old_data
        )
        
        logger.info(f"Document cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in document update trigger: {e}")

@firestore_fn.on_document_deleted(
    document="documents/{documentId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_document_deleted(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Trigger when document is deleted"""
    try:
        doc_id = event.params["documentId"]
        data = event.data.to_dict() if event.data else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.DELETE,
            collection="documents",
            doc_id=doc_id,
            data=data
        )
        
        logger.info(f"Document deleted cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in document delete trigger: {e}")

# =============================================================================
# EXECUTION TRIGGERS
# =============================================================================

@firestore_fn.on_document_created(
    document="executions/{executionId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_execution_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Trigger when execution is created"""
    try:
        doc_id = event.params["executionId"]
        data = event.data.to_dict() if event.data else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.CREATE,
            collection="executions",
            doc_id=doc_id,
            data=data
        )
        
        logger.info(f"Execution created cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in execution create trigger: {e}")

# =============================================================================
# MODEL PERFORMANCE TRIGGERS
# =============================================================================

@firestore_fn.on_document_created(
    document="model_performance/{performanceId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_model_performance_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Trigger when model performance record is created"""
    try:
        doc_id = event.params["performanceId"]
        data = event.data.to_dict() if event.data else {}
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=EventType.CREATE,
            collection="model_performance",
            doc_id=doc_id,
            data=data
        )
        
        logger.info(f"Model performance cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in model performance trigger: {e}")

# =============================================================================
# ANALYTICS TRIGGERS
# =============================================================================

@firestore_fn.on_document_written(
    document="analytics/{metricId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_analytics_written(event: firestore_fn.Event[firestore_fn.Change[firestore_fn.DocumentSnapshot] | firestore_fn.DocumentSnapshot]):
    """Trigger when analytics document is written (created or updated)"""
    try:
        doc_id = event.params["metricId"]
        
        # Handle both Change and DocumentSnapshot types
        if hasattr(event.data, 'after'):
            # It's a Change object (update)
            data = event.data.after.to_dict() if event.data.after else {}
            event_type = EventType.UPDATE
        else:
            # It's a DocumentSnapshot (create)
            data = event.data.to_dict() if event.data else {}
            event_type = EventType.CREATE
        
        await event_based_invalidation_service.handle_firestore_event(
            event_type=event_type,
            collection="analytics",
            doc_id=doc_id,
            data=data
        )
        
        logger.info(f"Analytics cache invalidated: {doc_id}")
    except Exception as e:
        logger.error(f"Error in analytics trigger: {e}")

# =============================================================================
# BATCH OPERATION TRIGGERS
# =============================================================================

@firestore_fn.on_document_created(
    document="batch_operations/{batchId}",
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1
)
async def on_batch_operation_completed(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Trigger when batch operation is completed"""
    try:
        doc_id = event.params["batchId"]
        data = event.data.to_dict() if event.data else {}
        
        # Extract batch operation details
        collection = data.get('collection')
        updates = data.get('updates', [])
        
        if collection and updates:
            await event_based_invalidation_service.handle_batch_update(
                collection=collection,
                updates=updates
            )
            
            logger.info(f"Batch operation cache invalidated: {doc_id}, {len(updates)} updates")
    except Exception as e:
        logger.error(f"Error in batch operation trigger: {e}")

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def register_custom_handlers():
    """Register custom event handlers for specific business logic"""
    
    # Example: Custom handler for prompt updates
    async def on_prompt_update_custom(event_type, doc_id, data, old_data):
        """Custom logic when prompt is updated"""
        # Check if prompt was published
        if data.get('status') == 'published' and old_data.get('status') != 'published':
            logger.info(f"Prompt {doc_id} was published, invalidating marketplace cache")
            # Invalidate marketplace cache
            from ..cache.cache_invalidation_service import cache_invalidation_service, InvalidationReason
            from ..cache.ttl_config import DataType
            
            await cache_invalidation_service.invalidate_pattern(
                pattern="marketplace:prompts:*",
                data_type=DataType.PROMPT_CONTENT,
                reason=InvalidationReason.DEPENDENCY_CHANGED
            )
    
    event_based_invalidation_service.register_event_handler(
        collection="prompts",
        handler=on_prompt_update_custom
    )
    
    logger.info("Custom event handlers registered")

# Initialize custom handlers
register_custom_handlers()

