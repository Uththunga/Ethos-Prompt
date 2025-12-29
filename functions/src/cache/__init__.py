"""
Cache module - Unified interface for different cache backends
"""
import os
import logging
from typing import Optional, Any, Dict, Union
from .firebase_cache import firebase_cache, FirebaseCache, FIREBASE_AVAILABLE

logger = logging.getLogger(__name__)

class LocalMemoryCache:
    """
    Simple in-memory cache fallback
    """
    def __init__(self):
        self._cache = {}
        self._counters = {}

    async def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Set value in memory (TTL ignored for simplicity)"""
        self._cache[key] = value
        return True

    async def get(self, key: str) -> Optional[Any]:
        """Get value from memory"""
        return self._cache.get(key)

    async def delete(self, key: str) -> bool:
        """Delete from memory"""
        if key in self._cache:
            del self._cache[key]
        if key in self._counters:
            del self._counters[key]
        return True

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        return key in self._cache

    async def increment(self, key: str, amount: int = 1, ttl_seconds: int = 3600) -> int:
        """Increment counter"""
        current = self._counters.get(key, 0)
        new_value = current + amount
        self._counters[key] = new_value
        return new_value

    async def cleanup_expired(self) -> int:
        """No-op for memory cache"""
        return 0

    def health_check(self) -> Dict[str, Any]:
        """Memory cache health"""
        return {
            "status": "healthy",
            "backend": "local_memory",
            "entries": len(self._cache),
            "counters": len(self._counters)
        }

class CacheManager:
    """
    Unified cache manager that automatically selects the best available backend
    """
    def __init__(self):
        self.backend: Union[FirebaseCache, LocalMemoryCache] = LocalMemoryCache()
        self._initialize_backend()

    def _initialize_backend(self):
        """Initialize the best available cache backend"""
        cache_backend = os.getenv('CACHE_BACKEND', 'auto').lower()

        if cache_backend == 'firebase' or (cache_backend == 'auto' and FIREBASE_AVAILABLE):
            # Try Firebase first
            try:
                health = firebase_cache.health_check()
                if health.get('status') == 'healthy':
                    self.backend = firebase_cache
                    logger.info("Using Firebase Firestore cache backend")
                    return
                else:
                    logger.warning(f"Firebase cache unhealthy: {health.get('error')}")
            except Exception as e:
                logger.warning(f"Firebase cache initialization failed: {e}")

        # Fallback to local memory
        self.backend = LocalMemoryCache()
        logger.info("Using local memory cache backend")

    async def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Set a value with TTL"""
        return await self.backend.set(key, value, ttl_seconds)

    async def get(self, key: str) -> Optional[Any]:
        """Get a value"""
        return await self.backend.get(key)

    async def delete(self, key: str) -> bool:
        """Delete a key"""
        return await self.backend.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        return await self.backend.exists(key)

    async def increment(self, key: str, amount: int = 1, ttl_seconds: int = 3600) -> int:
        """Increment a counter"""
        return await self.backend.increment(key, amount, ttl_seconds)

    async def cleanup_expired(self) -> int:
        """Clean up expired entries"""
        return await self.backend.cleanup_expired()

    def health_check(self) -> Dict[str, Any]:
        """Get cache health status"""
        return self.backend.health_check()

    def get_backend_type(self) -> str:
        """Get the current backend type"""
        if hasattr(self.backend, 'db') and self.backend.db:
            return "firebase_firestore"
        else:
            return "local_memory"

# Global cache instance
cache = CacheManager()

# Convenience functions
async def set_cache(key: str, value: Any, ttl_seconds: int = 3600) -> bool:
    """Set cache value"""
    return await cache.set(key, value, ttl_seconds)

async def get_cache(key: str) -> Optional[Any]:
    """Get cache value"""
    return await cache.get(key)

async def delete_cache(key: str) -> bool:
    """Delete cache value"""
    return await cache.delete(key)

async def cache_exists(key: str) -> bool:
    """Check if cache key exists"""
    return await cache.exists(key)

async def increment_cache(key: str, amount: int = 1, ttl_seconds: int = 3600) -> int:
    """Increment cache counter"""
    return await cache.increment(key, amount, ttl_seconds)

def get_cache_health() -> Dict[str, Any]:
    """Get cache health status"""
    return cache.health_check()

def get_cache_backend() -> str:
    """Get current cache backend type"""
    return cache.get_backend_type()
