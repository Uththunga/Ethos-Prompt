"""
Redis Connection Manager with Connection Pooling
"""
import logging
import asyncio
from typing import Optional, Any, Dict
import redis
import redis.asyncio as aioredis
from redis.connection import ConnectionPool
from contextlib import asynccontextmanager
import json
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RedisManager:
    """Redis connection manager with pooling and error handling"""
    
    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        max_connections: int = 20,
        retry_on_timeout: bool = True,
        socket_timeout: int = 30,
        socket_connect_timeout: int = 30,
        health_check_interval: int = 30
    ):
        self.redis_url = redis_url
        self.max_connections = max_connections
        self.retry_on_timeout = retry_on_timeout
        self.socket_timeout = socket_timeout
        self.socket_connect_timeout = socket_connect_timeout
        self.health_check_interval = health_check_interval
        
        # Connection pools
        self._sync_pool: Optional[ConnectionPool] = None
        self._async_pool: Optional[aioredis.ConnectionPool] = None
        
        # Clients
        self._sync_client: Optional[redis.Redis] = None
        self._async_client: Optional[aioredis.Redis] = None
        
        # Health check
        self._last_health_check = None
        self._is_healthy = False
        
        logger.info(f"Redis manager initialized for {redis_url}")
    
    def get_sync_client(self) -> redis.Redis:
        """Get synchronous Redis client"""
        if not self._sync_client:
            self._sync_pool = ConnectionPool.from_url(
                self.redis_url,
                max_connections=self.max_connections,
                retry_on_timeout=self.retry_on_timeout,
                socket_timeout=self.socket_timeout,
                socket_connect_timeout=self.socket_connect_timeout
            )
            self._sync_client = redis.Redis(connection_pool=self._sync_pool)
        
        return self._sync_client
    
    async def get_async_client(self) -> aioredis.Redis:
        """Get asynchronous Redis client"""
        if not self._async_client:
            self._async_pool = aioredis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=self.max_connections,
                retry_on_timeout=self.retry_on_timeout,
                socket_timeout=self.socket_timeout,
                socket_connect_timeout=self.socket_connect_timeout
            )
            self._async_client = aioredis.Redis(connection_pool=self._async_pool)
        
        return self._async_client
    
    async def health_check(self) -> bool:
        """Check Redis health"""
        try:
            client = await self.get_async_client()
            await client.ping()
            self._is_healthy = True
            self._last_health_check = datetime.utcnow()
            return True
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            self._is_healthy = False
            return False
    
    def is_healthy(self) -> bool:
        """Check if Redis is healthy (cached result)"""
        if not self._last_health_check:
            return False
        
        # Check if health check is recent
        if datetime.utcnow() - self._last_health_check > timedelta(seconds=self.health_check_interval):
            # Health check is stale, assume unhealthy
            return False
        
        return self._is_healthy
    
    async def set_with_ttl(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value with TTL"""
        try:
            client = await self.get_async_client()
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await client.setex(key, ttl, value)
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value from Redis"""
        try:
            client = await self.get_async_client()
            value = await client.get(key)
            if value is None:
                return default
            
            # Try to parse as JSON
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value.decode('utf-8') if isinstance(value, bytes) else value
                
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return default
    
    async def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        try:
            client = await self.get_async_client()
            result = await client.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            client = await self.get_async_client()
            result = await client.exists(key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis exists error: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1, ttl: Optional[int] = None) -> Optional[int]:
        """Increment counter"""
        try:
            client = await self.get_async_client()
            result = await client.incrby(key, amount)
            if ttl and result == amount:  # First time setting
                await client.expire(key, ttl)
            return result
        except Exception as e:
            logger.error(f"Redis increment error: {e}")
            return None
    
    async def get_hash(self, key: str, field: Optional[str] = None) -> Any:
        """Get hash field or entire hash"""
        try:
            client = await self.get_async_client()
            if field:
                value = await client.hget(key, field)
                if value:
                    try:
                        return json.loads(value)
                    except (json.JSONDecodeError, TypeError):
                        return value.decode('utf-8') if isinstance(value, bytes) else value
                return None
            else:
                hash_data = await client.hgetall(key)
                result = {}
                for k, v in hash_data.items():
                    try:
                        result[k.decode('utf-8')] = json.loads(v)
                    except (json.JSONDecodeError, TypeError):
                        result[k.decode('utf-8')] = v.decode('utf-8') if isinstance(v, bytes) else v
                return result
        except Exception as e:
            logger.error(f"Redis hash get error: {e}")
            return None
    
    async def set_hash(self, key: str, field: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set hash field"""
        try:
            client = await self.get_async_client()
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await client.hset(key, field, value)
            if ttl:
                await client.expire(key, ttl)
            return True
        except Exception as e:
            logger.error(f"Redis hash set error: {e}")
            return False
    
    async def cache_function_result(
        self,
        cache_key: str,
        func,
        *args,
        ttl: int = 300,
        **kwargs
    ) -> Any:
        """Cache function result"""
        # Try to get cached result
        cached_result = await self.get(cache_key)
        if cached_result is not None:
            logger.debug(f"Cache hit for {cache_key}")
            return cached_result
        
        # Execute function
        if asyncio.iscoroutinefunction(func):
            result = await func(*args, **kwargs)
        else:
            result = func(*args, **kwargs)
        
        # Cache result
        await self.set_with_ttl(cache_key, result, ttl)
        logger.debug(f"Cache miss for {cache_key}, result cached")
        
        return result
    
    @asynccontextmanager
    async def pipeline(self):
        """Context manager for Redis pipeline"""
        try:
            client = await self.get_async_client()
            pipe = client.pipeline()
            yield pipe
            await pipe.execute()
        except Exception as e:
            logger.error(f"Redis pipeline error: {e}")
            raise
    
    async def close(self):
        """Close Redis connections"""
        try:
            if self._async_client:
                await self._async_client.close()
            if self._sync_client:
                self._sync_client.close()
            if self._async_pool:
                await self._async_pool.disconnect()
            if self._sync_pool:
                self._sync_pool.disconnect()
            logger.info("Redis connections closed")
        except Exception as e:
            logger.error(f"Error closing Redis connections: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get connection pool statistics"""
        stats = {
            "is_healthy": self.is_healthy(),
            "last_health_check": self._last_health_check.isoformat() if self._last_health_check else None,
            "max_connections": self.max_connections,
            "redis_url": self.redis_url.split('@')[-1] if '@' in self.redis_url else self.redis_url  # Hide credentials
        }
        
        if self._sync_pool:
            stats["sync_pool"] = {
                "created_connections": self._sync_pool.created_connections,
                "available_connections": len(self._sync_pool._available_connections),
                "in_use_connections": len(self._sync_pool._in_use_connections)
            }
        
        return stats

# Global Redis manager instance
redis_manager: Optional[RedisManager] = None

def get_redis_manager() -> Optional[RedisManager]:
    """Get global Redis manager instance"""
    return redis_manager

def initialize_redis(redis_url: str = "redis://localhost:6379", **kwargs) -> RedisManager:
    """Initialize global Redis manager"""
    global redis_manager
    redis_manager = RedisManager(redis_url, **kwargs)
    return redis_manager

