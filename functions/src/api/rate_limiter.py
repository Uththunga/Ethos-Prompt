"""
Rate Limiting Middleware
Per-user rate limiting for API endpoints
"""

from firebase_admin import firestore
from firebase_functions import https_fn
from datetime import datetime, timedelta
from typing import Optional, Tuple
import logging

from .models import RateLimitInfo

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Per-user rate limiter using Firestore for state storage
    """
    
    def __init__(
        self,
        db: firestore.Client,
        limit: int = 100,
        window_hours: int = 1
    ):
        """
        Initialize rate limiter
        
        Args:
            db: Firestore client
            limit: Maximum requests per window
            window_hours: Time window in hours
        """
        self.db = db
        self.limit = limit
        self.window_hours = window_hours
    
    async def check_rate_limit(self, user_id: str) -> Tuple[bool, Optional[RateLimitInfo]]:
        """
        Check if user has exceeded rate limit
        
        Args:
            user_id: User ID to check
        
        Returns:
            Tuple of (is_allowed, rate_limit_info)
            - is_allowed: True if request should be allowed
            - rate_limit_info: Rate limit information (None if allowed)
        """
        try:
            # Get user's rate limit document
            rate_limit_ref = self.db.collection('rate_limits').document(user_id)
            rate_limit_doc = rate_limit_ref.get()
            
            now = datetime.utcnow()
            window_start = now - timedelta(hours=self.window_hours)
            
            if not rate_limit_doc.exists:
                # First request - create document
                rate_limit_ref.set({
                    'userId': user_id,
                    'requests': [{
                        'timestamp': now,
                        'count': 1
                    }],
                    'createdAt': now,
                    'updatedAt': now
                })
                
                return True, None
            
            # Get existing data
            data = rate_limit_doc.to_dict()
            requests = data.get('requests', [])
            
            # Filter requests within the window
            recent_requests = [
                r for r in requests
                if isinstance(r.get('timestamp'), datetime) and r['timestamp'] >= window_start
            ]
            
            # Count total requests in window
            total_requests = sum(r.get('count', 1) for r in recent_requests)
            
            if total_requests >= self.limit:
                # Rate limit exceeded
                oldest_request = min(recent_requests, key=lambda r: r['timestamp'])
                reset_at = oldest_request['timestamp'] + timedelta(hours=self.window_hours)
                retry_after = int((reset_at - now).total_seconds())
                
                rate_limit_info = RateLimitInfo(
                    limit=self.limit,
                    remaining=0,
                    reset_at=reset_at,
                    retry_after=max(retry_after, 60)  # Minimum 60 seconds
                )
                
                logger.warning(f"Rate limit exceeded for user {user_id}: {total_requests}/{self.limit}")
                return False, rate_limit_info
            
            # Add this request
            recent_requests.append({
                'timestamp': now,
                'count': 1
            })
            
            # Update document
            rate_limit_ref.update({
                'requests': recent_requests,
                'updatedAt': now
            })
            
            # Calculate remaining
            remaining = self.limit - (total_requests + 1)
            
            logger.info(f"Rate limit check passed for user {user_id}: {total_requests + 1}/{self.limit}")
            return True, None
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}", exc_info=True)
            # On error, allow the request (fail open)
            return True, None
    
    async def cleanup_old_requests(self, user_id: str):
        """
        Clean up old request records to prevent document bloat
        
        Args:
            user_id: User ID to clean up
        """
        try:
            rate_limit_ref = self.db.collection('rate_limits').document(user_id)
            rate_limit_doc = rate_limit_ref.get()
            
            if not rate_limit_doc.exists:
                return
            
            data = rate_limit_doc.to_dict()
            requests = data.get('requests', [])
            
            # Keep only requests from the last 2 windows
            cutoff = datetime.utcnow() - timedelta(hours=self.window_hours * 2)
            recent_requests = [
                r for r in requests
                if isinstance(r.get('timestamp'), datetime) and r['timestamp'] >= cutoff
            ]
            
            if len(recent_requests) < len(requests):
                rate_limit_ref.update({
                    'requests': recent_requests,
                    'updatedAt': datetime.utcnow()
                })
                logger.info(f"Cleaned up {len(requests) - len(recent_requests)} old requests for user {user_id}")
                
        except Exception as e:
            logger.error(f"Error cleaning up rate limit data: {e}")


async def check_rate_limit(
    user_id: str,
    db: firestore.Client,
    limit: int = 100,
    window_hours: int = 1
) -> Tuple[bool, Optional[RateLimitInfo]]:
    """
    Convenience function to check rate limit
    
    Args:
        user_id: User ID to check
        db: Firestore client
        limit: Maximum requests per window
        window_hours: Time window in hours
    
    Returns:
        Tuple of (is_allowed, rate_limit_info)
    """
    rate_limiter = RateLimiter(db, limit, window_hours)
    return await rate_limiter.check_rate_limit(user_id)


def create_rate_limit_error(rate_limit_info: RateLimitInfo) -> https_fn.HttpsError:
    """
    Create a rate limit exceeded error
    
    Args:
        rate_limit_info: Rate limit information
    
    Returns:
        HttpsError with 429 status
    """
    return https_fn.HttpsError(
        code=https_fn.FunctionsErrorCode.RESOURCE_EXHAUSTED,
        message=f"Rate limit exceeded. Try again in {rate_limit_info.retry_after} seconds.",
        details={
            'limit': rate_limit_info.limit,
            'remaining': rate_limit_info.remaining,
            'reset_at': rate_limit_info.reset_at.isoformat(),
            'retry_after': rate_limit_info.retry_after
        }
    )

