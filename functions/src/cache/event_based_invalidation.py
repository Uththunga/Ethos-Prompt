"""
Event-Based Cache Invalidation
Handles cache invalidation triggered by data mutations using Firestore triggers and pub/sub
"""
import logging
import asyncio
from typing import Dict, Any, List, Optional, Set, Callable
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum

from .cache_invalidation_service import cache_invalidation_service, InvalidationReason
from .ttl_config import DataType

logger = logging.getLogger(__name__)

class EventType(Enum):
    """Types of data mutation events"""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    BATCH_UPDATE = "batch_update"

@dataclass
class InvalidationRule:
    """Rule for cache invalidation based on events"""
    event_type: EventType
    collection: str
    data_type: DataType
    key_pattern: str  # Pattern to generate cache key from document
    invalidate_dependencies: bool = True
    dependency_patterns: Optional[List[str]] = None  # Patterns for dependent cache keys
    
    def __post_init__(self):
        if self.dependency_patterns is None:
            self.dependency_patterns = []

class EventBasedInvalidationService:
    """
    Service for event-driven cache invalidation
    Listens to Firestore changes and invalidates related caches
    """
    
    def __init__(self):
        self.rules: Dict[str, List[InvalidationRule]] = {}
        self.event_handlers: Dict[str, List[Callable]] = {}
        self.invalidation_queue: asyncio.Queue = asyncio.Queue()
        self.worker_task: Optional[asyncio.Task] = None
        self.is_running = False
        
        # Register default rules
        self._register_default_rules()
        
        logger.info("Event-based invalidation service initialized")
    
    # =========================================================================
    # RULE REGISTRATION
    # =========================================================================
    
    def _register_default_rules(self):
        """Register default invalidation rules for common collections"""
        
        # User collection rules
        self.register_rule(InvalidationRule(
            event_type=EventType.UPDATE,
            collection="users",
            data_type=DataType.USER_PROFILE,
            key_pattern="user:{doc_id}:profile",
            invalidate_dependencies=True,
            dependency_patterns=[
                "user:{doc_id}:preferences",
                "user:{doc_id}:sessions:*"
            ]
        ))
        
        # Prompt collection rules
        self.register_rule(InvalidationRule(
            event_type=EventType.UPDATE,
            collection="prompts",
            data_type=DataType.PROMPT_CONTENT,
            key_pattern="prompt:{doc_id}",
            invalidate_dependencies=True,
            dependency_patterns=[
                "prompt:{doc_id}:metadata",
                "prompt:{doc_id}:executions:*",
                "user:{user_id}:prompts:*"
            ]
        ))
        
        self.register_rule(InvalidationRule(
            event_type=EventType.DELETE,
            collection="prompts",
            data_type=DataType.PROMPT_CONTENT,
            key_pattern="prompt:{doc_id}",
            invalidate_dependencies=True,
            dependency_patterns=[
                "prompt:{doc_id}:*",
                "user:{user_id}:prompts:*"
            ]
        ))
        
        # Document collection rules
        self.register_rule(InvalidationRule(
            event_type=EventType.UPDATE,
            collection="documents",
            data_type=DataType.DOCUMENT_CONTENT,
            key_pattern="document:{doc_id}",
            invalidate_dependencies=True,
            dependency_patterns=[
                "document:{doc_id}:chunks:*",
                "document:{doc_id}:embeddings:*",
                "document:{doc_id}:metadata",
                "user:{user_id}:documents:*"
            ]
        ))
        
        self.register_rule(InvalidationRule(
            event_type=EventType.DELETE,
            collection="documents",
            data_type=DataType.DOCUMENT_CONTENT,
            key_pattern="document:{doc_id}",
            invalidate_dependencies=True,
            dependency_patterns=[
                "document:{doc_id}:*",
                "user:{user_id}:documents:*",
                "vector_index:*"  # Invalidate vector index
            ]
        ))
        
        # Execution collection rules
        self.register_rule(InvalidationRule(
            event_type=EventType.CREATE,
            collection="executions",
            data_type=DataType.PROMPT_EXECUTIONS,
            key_pattern="execution:{doc_id}",
            invalidate_dependencies=True,
            dependency_patterns=[
                "prompt:{prompt_id}:executions:*",
                "user:{user_id}:executions:*",
                "analytics:executions:*"
            ]
        ))
        
        # Model performance rules
        self.register_rule(InvalidationRule(
            event_type=EventType.CREATE,
            collection="model_performance",
            data_type=DataType.MODEL_PERFORMANCE,
            key_pattern="model:{model_id}:performance",
            invalidate_dependencies=True,
            dependency_patterns=[
                "model:{model_id}:stats:*",
                "analytics:models:*"
            ]
        ))
        
        logger.info(f"Registered {len(self.rules)} default invalidation rules")
    
    def register_rule(self, rule: InvalidationRule):
        """Register a cache invalidation rule"""
        key = f"{rule.collection}:{rule.event_type.value}"
        if key not in self.rules:
            self.rules[key] = []
        self.rules[key].append(rule)
        logger.debug(f"Registered rule: {key} -> {rule.key_pattern}")
    
    def register_event_handler(self, collection: str, handler: Callable):
        """Register custom event handler for a collection"""
        if collection not in self.event_handlers:
            self.event_handlers[collection] = []
        self.event_handlers[collection].append(handler)
        logger.debug(f"Registered event handler for collection: {collection}")
    
    # =========================================================================
    # EVENT PROCESSING
    # =========================================================================
    
    async def handle_firestore_event(
        self,
        event_type: EventType,
        collection: str,
        doc_id: str,
        data: Dict[str, Any],
        old_data: Optional[Dict[str, Any]] = None
    ):
        """
        Handle Firestore document change event
        
        Args:
            event_type: Type of event (create, update, delete)
            collection: Firestore collection name
            doc_id: Document ID
            data: New document data
            old_data: Old document data (for updates)
        """
        logger.info(f"Handling {event_type.value} event for {collection}/{doc_id}")
        
        # Get applicable rules
        rule_key = f"{collection}:{event_type.value}"
        rules = self.rules.get(rule_key, [])
        
        if not rules:
            logger.debug(f"No rules found for {rule_key}")
            return
        
        # Process each rule
        for rule in rules:
            try:
                await self._process_rule(rule, doc_id, data, old_data)
            except Exception as e:
                logger.error(f"Error processing rule {rule.key_pattern}: {e}")
        
        # Call custom event handlers
        handlers = self.event_handlers.get(collection, [])
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event_type, doc_id, data, old_data)
                else:
                    handler(event_type, doc_id, data, old_data)
            except Exception as e:
                logger.error(f"Error in custom event handler: {e}")
    
    async def _process_rule(
        self,
        rule: InvalidationRule,
        doc_id: str,
        data: Dict[str, Any],
        old_data: Optional[Dict[str, Any]]
    ):
        """Process a single invalidation rule"""
        # Generate cache key from pattern
        cache_key = self._generate_key(rule.key_pattern, doc_id, data)
        
        # Invalidate primary cache key
        await cache_invalidation_service.invalidate(
            key=cache_key,
            data_type=rule.data_type,
            reason=InvalidationReason.DATA_UPDATED if rule.event_type == EventType.UPDATE else InvalidationReason.DATA_DELETED,
            metadata={
                'collection': rule.collection,
                'doc_id': doc_id,
                'event_type': rule.event_type.value
            }
        )
        
        logger.debug(f"Invalidated cache key: {cache_key}")
        
        # Invalidate dependencies
        if rule.invalidate_dependencies and rule.dependency_patterns:
            for pattern in rule.dependency_patterns:
                dep_pattern = self._generate_key(pattern, doc_id, data)
                count = await cache_invalidation_service.invalidate_pattern(
                    pattern=dep_pattern,
                    data_type=rule.data_type,
                    reason=InvalidationReason.DEPENDENCY_CHANGED
                )
                logger.debug(f"Invalidated {count} dependent keys matching: {dep_pattern}")
    
    def _generate_key(self, pattern: str, doc_id: str, data: Dict[str, Any]) -> str:
        """Generate cache key from pattern and document data"""
        key = pattern.replace("{doc_id}", doc_id)
        
        # Replace other placeholders from document data
        for field, value in data.items():
            placeholder = f"{{{field}}}"
            if placeholder in key:
                key = key.replace(placeholder, str(value))
        
        return key
    
    # =========================================================================
    # QUEUE-BASED PROCESSING
    # =========================================================================
    
    async def queue_invalidation(
        self,
        event_type: EventType,
        collection: str,
        doc_id: str,
        data: Dict[str, Any],
        old_data: Optional[Dict[str, Any]] = None
    ):
        """Queue an invalidation event for async processing"""
        await self.invalidation_queue.put({
            'event_type': event_type,
            'collection': collection,
            'doc_id': doc_id,
            'data': data,
            'old_data': old_data,
            'timestamp': datetime.now(timezone.utc)
        })
    
    async def start_worker(self):
        """Start background worker to process invalidation queue"""
        if self.is_running:
            logger.warning("Worker already running")
            return
        
        self.is_running = True
        self.worker_task = asyncio.create_task(self._worker_loop())
        logger.info("Started invalidation worker")
    
    async def stop_worker(self):
        """Stop background worker"""
        if not self.is_running:
            return
        
        self.is_running = False
        if self.worker_task:
            self.worker_task.cancel()
            try:
                await self.worker_task
            except asyncio.CancelledError:
                pass
            self.worker_task = None
        
        logger.info("Stopped invalidation worker")
    
    async def _worker_loop(self):
        """Background loop to process invalidation queue"""
        logger.info("Invalidation worker started")
        
        while self.is_running:
            try:
                # Get event from queue with timeout
                event = await asyncio.wait_for(
                    self.invalidation_queue.get(),
                    timeout=1.0
                )
                
                # Process event
                await self.handle_firestore_event(
                    event_type=event['event_type'],
                    collection=event['collection'],
                    doc_id=event['doc_id'],
                    data=event['data'],
                    old_data=event.get('old_data')
                )
                
                self.invalidation_queue.task_done()
                
            except asyncio.TimeoutError:
                # No events in queue, continue
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in worker loop: {e}")
                await asyncio.sleep(1)  # Prevent tight loop on errors
        
        logger.info("Invalidation worker stopped")
    
    # =========================================================================
    # BATCH OPERATIONS
    # =========================================================================
    
    async def handle_batch_update(
        self,
        collection: str,
        updates: List[Dict[str, Any]]
    ):
        """Handle batch update events efficiently"""
        logger.info(f"Handling batch update for {collection}: {len(updates)} documents")
        
        # Group by data type for efficient invalidation
        keys_by_type: Dict[DataType, Set[str]] = {}
        
        for update in updates:
            doc_id = update.get('doc_id')
            data = update.get('data', {})
            
            # Get applicable rules
            rule_key = f"{collection}:{EventType.UPDATE.value}"
            rules = self.rules.get(rule_key, [])
            
            for rule in rules:
                cache_key = self._generate_key(rule.key_pattern, doc_id, data)
                
                if rule.data_type not in keys_by_type:
                    keys_by_type[rule.data_type] = set()
                keys_by_type[rule.data_type].add(cache_key)
        
        # Invalidate all keys by type
        for data_type, keys in keys_by_type.items():
            for key in keys:
                await cache_invalidation_service.invalidate(
                    key=key,
                    data_type=data_type,
                    reason=InvalidationReason.DATA_UPDATED,
                    metadata={'batch': True, 'collection': collection}
                )
        
        logger.info(f"Batch invalidation complete: {sum(len(keys) for keys in keys_by_type.values())} keys")

# Global instance
event_based_invalidation_service = EventBasedInvalidationService()


