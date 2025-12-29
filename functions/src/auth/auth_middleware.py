"""
Authentication Middleware - Firebase Auth integration
"""
import logging
from functools import wraps
from flask import request, jsonify, g
import firebase_admin
from firebase_admin import auth

logger = logging.getLogger(__name__)

def require_auth(f):
    """
    Decorator to require Firebase authentication
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the authorization header
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                'success': False,
                'error': 'Authorization header is required'
            }), 401
        
        # Extract the token
        try:
            # Expected format: "Bearer <token>"
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({
                'success': False,
                'error': 'Invalid authorization header format'
            }), 401
        
        try:
            # Verify the Firebase ID token
            decoded_token = auth.verify_id_token(token)
            user_id = decoded_token['uid']
            
            # Add user info to request context
            request.user_id = user_id
            request.user_email = decoded_token.get('email')
            request.user_claims = decoded_token
            
            # Store in Flask's g object for easy access
            g.user_id = user_id
            g.user_email = decoded_token.get('email')
            g.user_claims = decoded_token
            
            return f(*args, **kwargs)
            
        except auth.InvalidIdTokenError:
            return jsonify({
                'success': False,
                'error': 'Invalid authentication token'
            }), 401
        except auth.ExpiredIdTokenError:
            return jsonify({
                'success': False,
                'error': 'Authentication token has expired'
            }), 401
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return jsonify({
                'success': False,
                'error': 'Authentication failed'
            }), 401
    
    return decorated_function

def optional_auth(f):
    """
    Decorator for optional authentication (user info available if authenticated)
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the authorization header
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                # Extract and verify token
                token = auth_header.split(' ')[1]
                decoded_token = auth.verify_id_token(token)
                
                # Add user info to request context
                request.user_id = decoded_token['uid']
                request.user_email = decoded_token.get('email')
                request.user_claims = decoded_token
                
                g.user_id = decoded_token['uid']
                g.user_email = decoded_token.get('email')
                g.user_claims = decoded_token
                
            except Exception as e:
                logger.warning(f"Optional auth failed: {e}")
                # Continue without authentication
                request.user_id = None
                request.user_email = None
                request.user_claims = None
                
                g.user_id = None
                g.user_email = None
                g.user_claims = None
        else:
            # No auth header provided
            request.user_id = None
            request.user_email = None
            request.user_claims = None
            
            g.user_id = None
            g.user_email = None
            g.user_claims = None
        
        return f(*args, **kwargs)
    
    return decorated_function

def admin_required(f):
    """
    Decorator to require admin privileges
    """
    @wraps(f)
    @require_auth
    def decorated_function(*args, **kwargs):
        # Check if user has admin claim
        user_claims = getattr(request, 'user_claims', {})
        
        if not user_claims.get('admin', False):
            return jsonify({
                'success': False,
                'error': 'Admin privileges required'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user():
    """
    Get current authenticated user info
    """
    return {
        'user_id': getattr(g, 'user_id', None),
        'email': getattr(g, 'user_email', None),
        'claims': getattr(g, 'user_claims', {})
    }

def is_authenticated():
    """
    Check if current request is authenticated
    """
    return getattr(g, 'user_id', None) is not None

def has_permission(permission: str):
    """
    Check if current user has specific permission
    """
    user_claims = getattr(g, 'user_claims', {})
    permissions = user_claims.get('permissions', [])
    
    return permission in permissions or user_claims.get('admin', False)

async def verify_token_async(token: str) -> dict:
    """
    Async version of token verification for FastAPI
    """
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(token)
        return {
            'uid': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'claims': decoded_token
        }
    except auth.InvalidIdTokenError:
        raise AuthError('Invalid authentication token')
    except auth.ExpiredIdTokenError:
        raise AuthError('Authentication token has expired')
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        raise AuthError('Authentication failed')

class AuthError(Exception):
    """Custom authentication error"""
    def __init__(self, message, status_code=401):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)
