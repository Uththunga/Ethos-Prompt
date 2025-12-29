"""
Authentication Middleware
Firebase Auth token validation for protected endpoints
"""

from firebase_admin import auth
from firebase_functions import https_fn
from typing import Dict, Any
import logging

from .models import UserContext, ErrorResponse

logger = logging.getLogger(__name__)


async def validate_auth_token(request: https_fn.Request) -> UserContext:
    """
    Validate Firebase Auth token and extract user context
    
    Args:
        request: Firebase Functions request object
    
    Returns:
        UserContext with user_id, email, and claims
    
    Raises:
        https_fn.HttpsError: If token is invalid or missing
    """
    # Extract token from Authorization header
    auth_header = request.headers.get('Authorization')
    
    if not auth_header:
        logger.warning("Missing Authorization header")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Missing Authorization header"
        )
    
    if not auth_header.startswith('Bearer '):
        logger.warning(f"Invalid Authorization header format: {auth_header[:20]}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Invalid Authorization header format. Expected 'Bearer <token>'"
        )
    
    token = auth_header.split('Bearer ')[1]
    
    try:
        # Verify token with Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)
        
        user_context = UserContext(
            user_id=decoded_token['uid'],
            email=decoded_token.get('email'),
            email_verified=decoded_token.get('email_verified', False),
            claims=decoded_token
        )
        
        logger.info(f"Authenticated user: {user_context.user_id}")
        return user_context
        
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid ID token: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError as e:
        logger.warning(f"Expired ID token: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Authentication token has expired. Please sign in again."
        )
    except auth.RevokedIdTokenError as e:
        logger.warning(f"Revoked ID token: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Authentication token has been revoked. Please sign in again."
        )
    except Exception as e:
        logger.error(f"Token validation error: {e}", exc_info=True)
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Authentication failed"
        )


def require_auth(func):
    """
    Decorator to require authentication for an endpoint
    
    Usage:
        @require_auth
        async def my_endpoint(req: https_fn.Request, user_context: UserContext):
            # user_context is automatically injected
            pass
    """
    async def wrapper(req: https_fn.Request, *args, **kwargs):
        user_context = await validate_auth_token(req)
        return await func(req, user_context, *args, **kwargs)
    
    return wrapper

