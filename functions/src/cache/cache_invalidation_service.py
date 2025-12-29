"""
Cache Invalidation Service
Handles TTL-based and event-based cache invalidation across all cache layers
"""
import logging
import asyncio
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass
from enum import Enum

from .ttl_config import DataType, CacheLayer, get_ttl_policy, get_ttl
from .firebase_cache import FirebaseCache
from ..rag.cache_manager import LRUCache, RedisCache

logger = logging.getLogger(__name__)

class InvalidationReason(Enum):
    """Reasons for cache invalidation"""
    TTL_EXPIRED = "ttl_expired"
    MANUAL = "manual"
    DATA_UPDATED = "data_updated"
    DATA_DELETED = "data_deleted"
    DEPENDENCY_CHANGED = "dependency_changed"
    FORCED_REFRESH = "forced_refresh"
    ERROR_RECOVERY = "error_recovery"

@dataclass
class InvalidationEvent:
    """Cache invalidation event"""
    data_type: DataType
    key: str
    reason: InvalidationReason
    timestamp: datetime
    metadata: Dict[str, Any]
    affected_layers: List[CacheLayer]

class CacheInvalidationService:
    """
    Unified cache invalidation service
    Handles TTL-based and event-based invalidation across all cache layers
    """
    
    def __init__(self):
        self.memory_cache = LRUCache(max_size=1000, max_memory_mb=100)
        self.firestore_cache = FirebaseCache()
        self.redis_cache = None  # Initialize if Redis is available
        
        # Invalidation tracking
        self.invalidation_history: List[InvalidationEvent] = []
        self.max_history_size = 1000
        
        # Background task for periodic cleanup
        self.cleanup_task = None
        self.cleanup_interval = 300  # 5 minutes
        
        logger.info("Cache invalidation service initialized")
    
    # =========================================================================
    # TTL-BASED INVALIDATION
    # =========================================================================
    
    async def set_with_ttl(
        self,
        key: str,
        value: Any,
        data_type: DataType,
        layers: Optional[List[CacheLayer]] = None
    ) -> bool:
        """
        Set value in cache with appropriate TTL based on data type
        
        Args:
            key: Cache key
            value: Value to cache
            data_type: Type of data (determines TTL)
            layers: Cache layers to use (default: all available)
        
        Returns:
            True if successful
        """
        if layers is None:
            layers = [CacheLayer.MEMORY, CacheLayer.FIRESTORE]
        
        policy = get_ttl_policy(data_type)
        success = True
        
        # Set in memory cache
        if CacheLayer.MEMORY in layers and policy.memory_ttl:
            try:
                self.memory_cache.put(key, value, ttl_seconds=policy.memory_ttl)
                logger.debug(f"Cached {key} in memory with TTL {policy.memory_ttl}s")
            except Exception as e:
                logger.error(f"Failed to cache {key} in memory: {e}")
                success = False
        
        # Set in Firestore cache
        if CacheLayer.FIRESTORE in layers and policy.firestore_ttl:
            try:
                await self.firestore_cache.set(key, value, ttl_seconds=policy.firestore_ttl)
                logger.debug(f"Cached {key} in Firestore with TTL {policy.firestore_ttl}s")
            except Exception as e:
                logger.error(f"Failed to cache {key} in Firestore: {e}")
                success = False
        
        # Set in Redis cache (if available)
        if CacheLayer.REDIS in layers and self.redis_cache and policy.redis_ttl:
            try:
                self.redis_cache.put(key, value, ttl_seconds=policy.redis_ttl)
                logger.debug(f"Cached {key} in Redis with TTL {policy.redis_ttl}s")
            except Exception as e:
                logger.error(f"Failed to cache {key} in Redis: {e}")
                success = False
        
        return success
    
    async def get_with_fallback(
        self,
        key: str,
        data_type: DataType,
        fetch_fn: Optional[callable] = None
    ) -> Optional[Any]:
        """
        Get value from cache with multi-layer fallback
        
        Args:
            key: Cache key
            data_type: Type of data
            fetch_fn: Function to fetch fresh data if cache miss
        
        Returns:
            Cached value or freshly fetched value
        """
        policy = get_ttl_policy(data_type)
        
        # Try memory cache first
        if policy.memory_ttl:
            value = self.memory_cache.get(key)
            if value is not None:
                logger.debug(f"Memory cache hit for {key}")
                return value
        
        # Try Firestore cache
        if policy.firestore_ttl:
            value = await self.firestore_cache.get(key)
            if value is not None:
                logger.debug(f"Firestore cache hit for {key}")
                # Populate memory cache
                if policy.memory_ttl:
                    self.memory_cache.put(key, value, ttl_seconds=policy.memory_ttl)
                return value
        
        # Try Redis cache (if available)
        if self.redis_cache and policy.redis_ttl:
            value = self.redis_cache.get(key)
            if value is not None:
                logger.debug(f"Redis cache hit for {key}")
                # Populate higher-level caches
                if policy.memory_ttl:
                    self.memory_cache.put(key, value, ttl_seconds=policy.memory_ttl)
                return value
        
        # Cache miss - fetch fresh data if function provided
        if fetch_fn:
            logger.debug(f"Cache miss for {key}, fetching fresh data")
            try:
                value = await fetch_fn() if asyncio.iscoroutinefunction(fetch_fn) else fetch_fn()
                if value is not None:
                    # Cache the fresh data
                    await self.set_with_ttl(key, value, data_type)
                return value
            except Exception as e:
                logger.error(f"Failed to fetch fresh data for {key}: {e}")
                # Return stale data if policy allows
                if policy.cache_on_error:
                    logger.warning(f"Returning stale data for {key} due to fetch error")
                    # Try to get stale data from any cache
                    return await self._get_stale_data(key)
                return None
        
        return None
    
    async def _get_stale_data(self, key: str) -> Optional[Any]:
        """Get stale data from any cache layer (ignoring TTL)"""
        # This would require modifying cache implementations to support
        # getting expired data - for now, return None
        return None
    
    # =========================================================================
    # MANUAL INVALIDATION
    # =========================================================================
    
    async def invalidate(
        self,
        key: str,
        data_type: DataType,
        reason: InvalidationReason = InvalidationReason.MANUAL,
        layers: Optional[List[CacheLayer]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Manually invalidate a cache key across specified layers
        
        Args:
            key: Cache key to invalidate
            data_type: Type of data
            reason: Reason for invalidation
            layers: Cache layers to invalidate (default: all)
            metadata: Additional metadata about invalidation
        
        Returns:
            True if successful
        """
        if layers is None:
            layers = [CacheLayer.MEMORY, CacheLayer.FIRESTORE]
        
        if metadata is None:
            metadata = {}
        
        success = True
        
        # Invalidate memory cache
        if CacheLayer.MEMORY in layers:
            try:
                # LRUCache doesn't have delete method, so we'll clear the key
                if key in self.memory_cache.cache:
                    del self.memory_cache.cache[key]
                logger.debug(f"Invalidated {key} from memory cache")
            except Exception as e:
                logger.error(f"Failed to invalidate {key} from memory: {e}")
                success = False
        
        # Invalidate Firestore cache
        if CacheLayer.FIRESTORE in layers:
            try:
                await self.firestore_cache.delete(key)
                logger.debug(f"Invalidated {key} from Firestore cache")
            except Exception as e:
                logger.error(f"Failed to invalidate {key} from Firestore: {e}")
                success = False
        
        # Invalidate Redis cache (if available)
        if CacheLayer.REDIS in layers and self.redis_cache:
            try:
                self.redis_cache.delete(key)
                logger.debug(f"Invalidated {key} from Redis cache")
            except Exception as e:
                logger.error(f"Failed to invalidate {key} from Redis: {e}")
                success = False
        
        # Record invalidation event
        event = InvalidationEvent(
            data_type=data_type,
            key=key,
            reason=reason,
            timestamp=datetime.now(timezone.utc),
            metadata=metadata,
            affected_layers=layers
        )
        self._record_invalidation(event)
        
        return success
    
    async def invalidate_pattern(
        self,
        pattern: str,
        data_type: DataType,
        reason: InvalidationReason = InvalidationReason.MANUAL
    ) -> int:
        """
        Invalidate all keys matching a pattern
        
        Args:
            pattern: Key pattern (e.g., "user:*", "prompt:123:*")
            data_type: Type of data
            reason: Reason for invalidation
        
        Returns:
            Number of keys invalidated
        """
        count = 0
        
        # Invalidate from memory cache
        keys_to_delete = [
            key for key in self.memory_cache.cache.keys()
            if self._matches_pattern(key, pattern)
        ]
        for key in keys_to_delete:
            await self.invalidate(key, data_type, reason, [CacheLayer.MEMORY])
            count += 1
        
        # Note: Firestore and Redis pattern matching would require
        # additional implementation
        
        logger.info(f"Invalidated {count} keys matching pattern {pattern}")
        return count
    
    def _matches_pattern(self, key: str, pattern: str) -> bool:
        """Check if key matches pattern (simple wildcard matching)"""
        if '*' not in pattern:
            return key == pattern
        
        # Convert pattern to regex-like matching
        parts = pattern.split('*')
        if not key.startswith(parts[0]):
            return False
        if not key.endswith(parts[-1]):
            return False
        
        return True
    
    # =========================================================================
    # PERIODIC CLEANUP
    # =========================================================================
    
    async def start_cleanup_task(self):
        """Start background task for periodic cache cleanup"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self._cleanup_loop())
            logger.info("Started cache cleanup task")
    
    async def stop_cleanup_task(self):
        """Stop background cleanup task"""
        if self.cleanup_task:
            self.cleanup_task.cancel()
            try:
                await self.cleanup_task
            except asyncio.CancelledError:
                pass
            self.cleanup_task = None
            logger.info("Stopped cache cleanup task")
    
    async def _cleanup_loop(self):
        """Background loop for periodic cache cleanup"""
        while True:
            try:
                await asyncio.sleep(self.cleanup_interval)
                await self._cleanup_expired_entries()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
    
    async def _cleanup_expired_entries(self):
        """Clean up expired entries from all cache layers"""
        logger.debug("Running cache cleanup")
        
        # Memory cache cleanup (handled by LRUCache automatically)
        # Firestore cleanup (handled by get() method)
        # Redis cleanup (handled by Redis TTL)
        
        # Trim invalidation history
        if len(self.invalidation_history) > self.max_history_size:
            self.invalidation_history = self.invalidation_history[-self.max_history_size:]
    
    # =========================================================================
    # MONITORING & STATS
    # =========================================================================
    
    def _record_invalidation(self, event: InvalidationEvent):
        """Record invalidation event for monitoring"""
        self.invalidation_history.append(event)
        if len(self.invalidation_history) > self.max_history_size:
            self.invalidation_history.pop(0)
    
    def get_invalidation_stats(self) -> Dict[str, Any]:
        """Get invalidation statistics"""
        total = len(self.invalidation_history)
        by_reason = {}
        by_data_type = {}
        
        for event in self.invalidation_history:
            reason_key = event.reason.value
            by_reason[reason_key] = by_reason.get(reason_key, 0) + 1
            
            type_key = event.data_type.value
            by_data_type[type_key] = by_data_type.get(type_key, 0) + 1
        
        return {
            'total_invalidations': total,
            'by_reason': by_reason,
            'by_data_type': by_data_type,
            'memory_cache_stats': self.memory_cache.get_stats(),
        }

# Global instance
cache_invalidation_service = CacheInvalidationService()

