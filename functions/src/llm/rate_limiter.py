"""
Rate Limiter - Sliding window rate limiting with Redis backend
"""
import time
import json
import logging
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import hashlib

# Cache imports
try:
    from ..cache import cache
    CACHE_AVAILABLE = True
except ImportError:
    CACHE_AVAILABLE = False

# Redis import (conditional)
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class RateLimit:
    requests_per_minute: int
    requests_per_hour: int
    requests_per_day: int
    burst_limit: Optional[int] = None  # Maximum requests in a short burst
    burst_window: int = 10   # Burst window in seconds

@dataclass
class RateLimitResult:
    allowed: bool
    remaining_requests: int
    reset_time: datetime
    retry_after: Optional[int] = None
    limit_type: str = "minute"

class RateLimiter:
    """
    Sliding window rate limiter with Redis backend
    """
    
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_client = None
        self.local_cache = {}  # Fallback for when external cache is not available
        self.use_external_cache = False

        # Try Firebase cache first
        if CACHE_AVAILABLE:
            try:
                # Test cache connection
                health = cache.health_check()
                if health.get('status') == 'healthy':
                    self.use_external_cache = True
                    logger.info(f"Using {health.get('backend', 'external')} cache for rate limiting")
                else:
                    logger.warning(f"External cache unhealthy: {health.get('error')}")
            except Exception as e:
                logger.warning(f"Failed to initialize external cache: {e}")

        # Fallback to Redis if Firebase not available
        if not self.use_external_cache and REDIS_AVAILABLE and redis_url:
            try:
                self.redis_client = redis.from_url(redis_url, decode_responses=True)
                # Test connection
                self.redis_client.ping()
                logger.info("Redis connection established for rate limiting")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis: {e}. Using local cache fallback.")
                self.redis_client = None

        if not self.use_external_cache and not self.redis_client:
            logger.info("Using local memory cache for rate limiting")
    
    async def check_rate_limit(
        self,
        user_id: str,
        rate_limit: RateLimit,
        endpoint: str = "default"
    ) -> RateLimitResult:
        """
        Check if request is within rate limits
        """
        current_time = time.time()
        
        # Create unique key for this user/endpoint combination
        key_base = f"rate_limit:{user_id}:{endpoint}"
        
        # Check different time windows
        minute_result = await self._check_window(key_base, "minute", 60, rate_limit.requests_per_minute, current_time)
        if not minute_result.allowed:
            return minute_result

        hour_result = await self._check_window(key_base, "hour", 3600, rate_limit.requests_per_hour, current_time)
        if not hour_result.allowed:
            return hour_result

        day_result = await self._check_window(key_base, "day", 86400, rate_limit.requests_per_day, current_time)
        if not day_result.allowed:
            return day_result
        
        # Check burst limit if specified
        if rate_limit.burst_limit:
            burst_result = await self._check_window(
                key_base, "burst", rate_limit.burst_window,
                rate_limit.burst_limit, current_time
            )
            if not burst_result.allowed:
                return burst_result
        
        # All checks passed, increment counters
        self._increment_counters(key_base, current_time)
        
        return RateLimitResult(
            allowed=True,
            remaining_requests=min(
                minute_result.remaining_requests,
                hour_result.remaining_requests,
                day_result.remaining_requests
            ),
            reset_time=min(minute_result.reset_time, hour_result.reset_time, day_result.reset_time),
            limit_type="allowed"
        )
    
    async def _check_window(
        self,
        key_base: str,
        window_type: str,
        window_seconds: int,
        limit: int,
        current_time: float
    ) -> RateLimitResult:
        """
        Check rate limit for a specific time window
        """
        key = f"{key_base}:{window_type}"
        window_start = current_time - window_seconds
        
        if self.use_external_cache:
            return await self._check_window_external(key, window_start, current_time, limit, window_type, window_seconds)
        elif self.redis_client:
            return self._check_window_redis(key, window_start, current_time, limit, window_type, window_seconds)
        else:
            return self._check_window_local(key, window_start, current_time, limit, window_type, window_seconds)
    
    def _check_window_redis(
        self, 
        key: str, 
        window_start: float, 
        current_time: float, 
        limit: int, 
        window_type: str, 
        window_seconds: int
    ) -> RateLimitResult:
        """
        Check rate limit using Redis sliding window
        """
        try:
            pipe = self.redis_client.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Count current entries
            pipe.zcard(key)
            
            # Set expiration
            pipe.expire(key, window_seconds + 1)
            
            results = pipe.execute()
            current_count = results[1]
            
            remaining = max(0, limit - current_count)
            reset_time = datetime.fromtimestamp(current_time + window_seconds)
            
            if current_count >= limit:
                return RateLimitResult(
                    allowed=False,
                    remaining_requests=0,
                    reset_time=reset_time,
                    retry_after=int(window_seconds),
                    limit_type=window_type
                )
            
            return RateLimitResult(
                allowed=True,
                remaining_requests=remaining,
                reset_time=reset_time,
                limit_type=window_type
            )
            
        except Exception as e:
            logger.error(f"Redis rate limit check failed: {e}")
            # Fallback to local cache
            return self._check_window_local(key, window_start, current_time, limit, window_type, window_seconds)

    async def _check_window_external(
        self,
        key: str,
        window_start: float,
        current_time: float,
        limit: int,
        window_type: str,
        window_seconds: int
    ) -> RateLimitResult:
        """
        Check rate limit using external cache (Firebase/etc)
        """
        try:
            # Get current count
            current_count = await cache.get(key) or 0

            # Check if we're over the limit
            if current_count >= limit:
                reset_time = datetime.fromtimestamp(current_time + window_seconds)
                return RateLimitResult(
                    allowed=False,
                    remaining_requests=0,
                    reset_time=reset_time,
                    retry_after=int(window_seconds),
                    limit_type=window_type
                )

            # Increment counter
            new_count = await cache.increment(key, 1, window_seconds)
            remaining = max(0, limit - new_count)
            reset_time = datetime.fromtimestamp(current_time + window_seconds)

            return RateLimitResult(
                allowed=True,
                remaining_requests=remaining,
                reset_time=reset_time,
                limit_type=window_type
            )

        except Exception as e:
            logger.error(f"External cache rate limit check failed: {e}")
            # Fallback to local cache
            return self._check_window_local(key, window_start, current_time, limit, window_type, window_seconds)

    def _check_window_local(
        self, 
        key: str, 
        window_start: float, 
        current_time: float, 
        limit: int, 
        window_type: str, 
        window_seconds: int
    ) -> RateLimitResult:
        """
        Check rate limit using local cache (fallback)
        """
        if key not in self.local_cache:
            self.local_cache[key] = []
        
        # Remove old entries
        self.local_cache[key] = [
            timestamp for timestamp in self.local_cache[key] 
            if timestamp > window_start
        ]
        
        current_count = len(self.local_cache[key])
        remaining = max(0, limit - current_count)
        reset_time = datetime.fromtimestamp(current_time + window_seconds)
        
        if current_count >= limit:
            return RateLimitResult(
                allowed=False,
                remaining_requests=0,
                reset_time=reset_time,
                retry_after=int(window_seconds),
                limit_type=window_type
            )
        
        return RateLimitResult(
            allowed=True,
            remaining_requests=remaining,
            reset_time=reset_time,
            limit_type=window_type
        )
    
    def _increment_counters(self, key_base: str, current_time: float):
        """
        Increment rate limit counters for all windows
        """
        windows = [
            ("minute", 60),
            ("hour", 3600),
            ("day", 86400),
            ("burst", 10)
        ]
        
        for window_type, window_seconds in windows:
            key = f"{key_base}:{window_type}"
            
            if self.redis_client:
                try:
                    pipe = self.redis_client.pipeline()
                    pipe.zadd(key, {str(current_time): current_time})
                    pipe.expire(key, window_seconds + 1)
                    pipe.execute()
                except Exception as e:
                    logger.error(f"Failed to increment Redis counter: {e}")
                    # Fallback to local cache
                    if key not in self.local_cache:
                        self.local_cache[key] = []
                    self.local_cache[key].append(current_time)
            else:
                if key not in self.local_cache:
                    self.local_cache[key] = []
                self.local_cache[key].append(current_time)
    
    def get_rate_limit_status(self, user_id: str, endpoint: str = "default") -> Dict[str, Any]:
        """
        Get current rate limit status for a user
        """
        current_time = time.time()
        key_base = f"rate_limit:{user_id}:{endpoint}"
        
        status = {}
        windows = [
            ("minute", 60),
            ("hour", 3600),
            ("day", 86400)
        ]
        
        for window_type, window_seconds in windows:
            key = f"{key_base}:{window_type}"
            window_start = current_time - window_seconds
            
            if self.redis_client:
                try:
                    self.redis_client.zremrangebyscore(key, 0, window_start)
                    count = self.redis_client.zcard(key)
                except Exception:
                    count = 0
            else:
                if key in self.local_cache:
                    self.local_cache[key] = [
                        timestamp for timestamp in self.local_cache[key] 
                        if timestamp > window_start
                    ]
                    count = len(self.local_cache[key])
                else:
                    count = 0
            
            status[window_type] = {
                "current_count": count,
                "window_start": datetime.fromtimestamp(window_start).isoformat(),
                "window_end": datetime.fromtimestamp(current_time).isoformat()
            }
        
        return status
    
    def reset_rate_limit(self, user_id: str, endpoint: str = "default"):
        """
        Reset rate limit for a user (admin function)
        """
        key_base = f"rate_limit:{user_id}:{endpoint}"
        
        windows = ["minute", "hour", "day", "burst"]
        
        for window_type in windows:
            key = f"{key_base}:{window_type}"
            
            if self.redis_client:
                try:
                    self.redis_client.delete(key)
                except Exception as e:
                    logger.error(f"Failed to reset Redis rate limit: {e}")
            
            if key in self.local_cache:
                del self.local_cache[key]
        
        logger.info(f"Rate limit reset for user {user_id}, endpoint {endpoint}")

# Default rate limits for different user tiers
DEFAULT_RATE_LIMITS = {
    "free": RateLimit(
        requests_per_minute=10,
        requests_per_hour=100,
        requests_per_day=1000,
        burst_limit=5,
        burst_window=10
    ),
    "pro": RateLimit(
        requests_per_minute=60,
        requests_per_hour=1000,
        requests_per_day=10000,
        burst_limit=20,
        burst_window=10
    ),
    "enterprise": RateLimit(
        requests_per_minute=300,
        requests_per_hour=10000,
        requests_per_day=100000,
        burst_limit=100,
        burst_window=10
    )
}

# Global instance
rate_limiter = RateLimiter()

