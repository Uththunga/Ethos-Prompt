"""
FastAPI Middleware for Performance Optimization
"""
import time
import uuid
import logging
from typing import Callable, Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
import redis
import asyncio
from datetime import datetime, timedelta
import json

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request logging and timing"""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent")
            }
        )
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Add headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        # Log response
        logger.info(
            f"Request completed: {response.status_code} in {process_time:.3f}s",
            extra={
                "request_id": request_id,
                "status_code": response.status_code,
                "process_time": process_time
            }
        )
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app, redis_client=None, requests_per_minute: int = 60):
        super().__init__(app)
        self.redis_client = redis_client
        self.requests_per_minute = requests_per_minute
        self.window_size = 60  # 1 minute window
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not self.redis_client:
            # Skip rate limiting if Redis is not available
            return await call_next(request)
        
        # Get client identifier (IP or user ID if authenticated)
        client_id = self._get_client_id(request)
        
        # Check rate limit
        if await self._is_rate_limited(client_id):
            from .exceptions import RateLimitError
            raise RateLimitError(
                f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute.",
                details={"limit": self.requests_per_minute, "window": self.window_size}
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = await self._get_remaining_requests(client_id)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + self.window_size)
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting"""
        # Try to get user ID from request state (if authenticated)
        if hasattr(request.state, "user_id") and request.state.user_id:
            return f"user:{request.state.user_id}"
        
        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        return f"ip:{client_ip}"
    
    async def _is_rate_limited(self, client_id: str) -> bool:
        """Check if client is rate limited"""
        try:
            key = f"rate_limit:{client_id}"
            current_time = int(time.time())
            window_start = current_time - self.window_size
            
            # Use Redis sorted set to track requests in time window
            pipe = self.redis_client.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Count current requests
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(key, self.window_size)
            
            results = pipe.execute()
            current_requests = results[1]
            
            return current_requests >= self.requests_per_minute
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Allow request if Redis fails
            return False
    
    async def _get_remaining_requests(self, client_id: str) -> int:
        """Get remaining requests for client"""
        try:
            key = f"rate_limit:{client_id}"
            current_time = int(time.time())
            window_start = current_time - self.window_size
            
            # Count requests in current window
            current_requests = self.redis_client.zcount(key, window_start, current_time)
            return max(0, self.requests_per_minute - current_requests)
            
        except Exception as e:
            logger.error(f"Error getting remaining requests: {e}")
            return self.requests_per_minute

class CacheMiddleware(BaseHTTPMiddleware):
    """Response caching middleware"""
    
    def __init__(self, app, redis_client=None, default_ttl: int = 300):
        super().__init__(app)
        self.redis_client = redis_client
        self.default_ttl = default_ttl
        self.cacheable_methods = {"GET"}
        self.cacheable_paths = {
            "/api/ai/system-status",
            "/api/ai/usage-stats",
            "/health",
            "/health/detailed"
        }
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Only cache GET requests for specific paths
        if (request.method not in self.cacheable_methods or 
            request.url.path not in self.cacheable_paths or
            not self.redis_client):
            return await call_next(request)
        
        # Generate cache key
        cache_key = self._generate_cache_key(request)
        
        # Try to get cached response
        cached_response = await self._get_cached_response(cache_key)
        if cached_response:
            logger.debug(f"Cache hit for {request.url.path}")
            response = Response(
                content=cached_response["content"],
                status_code=cached_response["status_code"],
                headers=cached_response["headers"]
            )
            response.headers["X-Cache"] = "HIT"
            return response
        
        # Process request
        response = await call_next(request)
        
        # Cache successful responses
        if response.status_code == 200:
            await self._cache_response(cache_key, response)
            response.headers["X-Cache"] = "MISS"
        
        return response
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key for request"""
        # Include user ID if authenticated for user-specific caching
        user_id = getattr(request.state, "user_id", "anonymous")
        query_string = str(request.query_params) if request.query_params else ""
        return f"cache:{request.url.path}:{user_id}:{hash(query_string)}"
    
    async def _get_cached_response(self, cache_key: str) -> Dict[str, Any]:
        """Get cached response"""
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
        return None
    
    async def _cache_response(self, cache_key: str, response: Response):
        """Cache response"""
        try:
            # Read response body
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            
            # Prepare cache data
            cache_data = {
                "content": body.decode("utf-8"),
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "cached_at": datetime.utcnow().isoformat()
            }
            
            # Store in cache
            self.redis_client.setex(
                cache_key,
                self.default_ttl,
                json.dumps(cache_data)
            )
            
            # Recreate response body iterator
            response.body_iterator = self._create_body_iterator(body)
            
        except Exception as e:
            logger.error(f"Cache storage error: {e}")
    
    def _create_body_iterator(self, body: bytes):
        """Create body iterator from bytes"""
        async def generate():
            yield body
        return generate()

class CompressionMiddleware(BaseHTTPMiddleware):
    """Response compression middleware"""
    
    def __init__(self, app, minimum_size: int = 1024):
        super().__init__(app)
        self.minimum_size = minimum_size
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        
        # Check if client accepts gzip
        accept_encoding = request.headers.get("accept-encoding", "")
        if "gzip" not in accept_encoding.lower():
            return response
        
        # Check content type
        content_type = response.headers.get("content-type", "")
        if not any(ct in content_type for ct in ["application/json", "text/", "application/javascript"]):
            return response
        
        # Get response body
        body = b""
        async for chunk in response.body_iterator:
            body += chunk
        
        # Compress if body is large enough
        if len(body) >= self.minimum_size:
            import gzip
            compressed_body = gzip.compress(body)
            
            # Update headers
            response.headers["content-encoding"] = "gzip"
            response.headers["content-length"] = str(len(compressed_body))
            
            # Create new response with compressed body
            response.body_iterator = self._create_body_iterator(compressed_body)
        else:
            # Recreate original body iterator
            response.body_iterator = self._create_body_iterator(body)
        
        return response
    
    def _create_body_iterator(self, body: bytes):
        """Create body iterator from bytes"""
        async def generate():
            yield body
        return generate()
