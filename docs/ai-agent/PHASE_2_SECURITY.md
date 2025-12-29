# Phase 2: Security and Authentication Model

**Date**: October 17, 2025  
**Project**: EthosPrompt - Molē AI Agent Phase 2  
**Status**: Security Model Defined

---

## 🔐 SECURITY OVERVIEW

The Prompt Library Agent implements defense-in-depth security with multiple layers:
1. **Authentication**: Firebase Auth token validation
2. **Authorization**: User-scoped data access
3. **Input Validation**: Pydantic schema validation
4. **Rate Limiting**: Per-user request throttling
5. **Audit Logging**: Comprehensive request logging

---

## 🎫 AUTHENTICATION FLOW

### Firebase Auth Token Validation

```python
from firebase_admin import auth
from firebase_functions import https_fn

async def validate_auth_token(request) -> dict:
    """
    Validate Firebase Auth token and extract user context
    
    Returns:
        dict with user_id, email, and claims
    
    Raises:
        https_fn.HttpsError: If token is invalid or missing
    """
    # Extract token from Authorization header
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Missing or invalid Authorization header"
        )
    
    token = auth_header.split('Bearer ')[1]
    
    try:
        # Verify token with Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)
        
        return {
            'user_id': decoded_token['uid'],
            'email': decoded_token.get('email'),
            'email_verified': decoded_token.get('email_verified', False),
            'claims': decoded_token
        }
    except auth.InvalidIdTokenError:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="Authentication token has expired"
        )
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Authentication failed"
        )
```

### Token Lifecycle
- **Generation**: Client obtains token via Firebase Auth SDK
- **Storage**: Client stores token in memory (not localStorage for security)
- **Transmission**: Sent in Authorization header as `Bearer <token>`
- **Validation**: Server validates on every request
- **Expiry**: Tokens expire after 1 hour
- **Refresh**: Client automatically refreshes tokens

---

## 🔒 AUTHORIZATION MODEL

### User-Scoped Data Access

**Principle**: Users can ONLY access their own data

```python
# ✅ CORRECT: Filter by user_id
prompts_ref = db.collection('prompts').where('userId', '==', user_id)

# ❌ WRONG: No user filter (security vulnerability)
prompts_ref = db.collection('prompts')
```

### Data Access Patterns

#### 1. Read Operations
```python
async def get_user_prompts(user_id: str):
    """Get prompts for authenticated user only"""
    prompts_ref = db.collection('prompts') \
        .where('userId', '==', user_id) \
        .order_by('createdAt', direction=firestore.Query.DESCENDING)
    
    return [doc.to_dict() for doc in prompts_ref.stream()]
```

#### 2. Write Operations
```python
async def create_prompt(user_id: str, prompt_data: dict):
    """Create prompt with user_id enforcement"""
    # Always set userId from authenticated token, never from client
    prompt_data['userId'] = user_id
    prompt_data['createdAt'] = firestore.SERVER_TIMESTAMP
    
    doc_ref = db.collection('prompts').document()
    doc_ref.set(prompt_data)
    
    return doc_ref.id
```

#### 3. Update Operations
```python
async def update_prompt(user_id: str, prompt_id: str, updates: dict):
    """Update prompt with ownership verification"""
    doc_ref = db.collection('prompts').document(prompt_id)
    doc = doc_ref.get()
    
    # Verify ownership
    if not doc.exists:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.NOT_FOUND,
            message="Prompt not found"
        )
    
    if doc.to_dict().get('userId') != user_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="You don't have permission to update this prompt"
        )
    
    # Prevent userId modification
    updates.pop('userId', None)
    updates['updatedAt'] = firestore.SERVER_TIMESTAMP
    
    doc_ref.update(updates)
```

#### 4. Delete Operations
```python
async def delete_prompt(user_id: str, prompt_id: str):
    """Delete prompt with ownership verification"""
    doc_ref = db.collection('prompts').document(prompt_id)
    doc = doc_ref.get()
    
    # Verify ownership
    if not doc.exists:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.NOT_FOUND,
            message="Prompt not found"
        )
    
    if doc.to_dict().get('userId') != user_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
            message="You don't have permission to delete this prompt"
        )
    
    doc_ref.delete()
```

---

## 🚦 RATE LIMITING STRATEGY

### Configuration
- **Limit**: 100 requests per hour per authenticated user
- **Window**: Sliding window (not fixed)
- **Storage**: Firestore (conversation metadata)
- **Response**: HTTP 429 with Retry-After header

### Implementation

```python
from datetime import datetime, timedelta
from typing import Optional

class RateLimiter:
    """Per-user rate limiter"""
    
    def __init__(self, db, limit: int = 100, window_hours: int = 1):
        self.db = db
        self.limit = limit
        self.window_hours = window_hours
    
    async def check_rate_limit(self, user_id: str) -> tuple[bool, Optional[int]]:
        """
        Check if user has exceeded rate limit
        
        Returns:
            (is_allowed, retry_after_seconds)
        """
        # Get user's request history
        cutoff_time = datetime.utcnow() - timedelta(hours=self.window_hours)
        
        requests_ref = self.db.collection('rate_limits') \
            .document(user_id) \
            .collection('requests') \
            .where('timestamp', '>=', cutoff_time)
        
        request_count = len(list(requests_ref.stream()))
        
        if request_count >= self.limit:
            # Calculate retry-after
            oldest_request = requests_ref.order_by('timestamp').limit(1).get()
            if oldest_request:
                oldest_time = oldest_request[0].to_dict()['timestamp']
                retry_after = int((oldest_time + timedelta(hours=self.window_hours) - datetime.utcnow()).total_seconds())
                return False, max(retry_after, 60)  # Minimum 60 seconds
            return False, 3600  # Default 1 hour
        
        # Log this request
        self.db.collection('rate_limits') \
            .document(user_id) \
            .collection('requests') \
            .add({'timestamp': firestore.SERVER_TIMESTAMP})
        
        return True, None
    
    async def cleanup_old_requests(self, user_id: str):
        """Clean up old request records"""
        cutoff_time = datetime.utcnow() - timedelta(hours=self.window_hours * 2)
        
        old_requests = self.db.collection('rate_limits') \
            .document(user_id) \
            .collection('requests') \
            .where('timestamp', '<', cutoff_time) \
            .stream()
        
        for doc in old_requests:
            doc.reference.delete()
```

### Rate Limit Response

```python
@https_fn.on_request(cors=options.CorsOptions(cors_origins="*", cors_methods=["post"]))
async def prompt_library_chat(req: https_fn.Request) -> https_fn.Response:
    # Authenticate
    user_context = await validate_auth_token(req)
    user_id = user_context['user_id']
    
    # Check rate limit
    rate_limiter = RateLimiter(db)
    is_allowed, retry_after = await rate_limiter.check_rate_limit(user_id)
    
    if not is_allowed:
        return https_fn.Response(
            status=429,
            headers={
                'Retry-After': str(retry_after),
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': str(int(datetime.utcnow().timestamp()) + retry_after)
            },
            response=json.dumps({
                'error': 'Rate limit exceeded',
                'message': f'Too many requests. Please try again in {retry_after} seconds.',
                'retry_after': retry_after
            })
        )
    
    # Process request...
```

---

## 🛡️ INPUT VALIDATION

### Pydantic Schema Validation

All inputs are validated using Pydantic schemas (defined in `tool_schemas.py`):

```python
from pydantic import ValidationError
from .tool_schemas import CreatePromptInput

async def create_prompt_tool(user_id: str, **kwargs):
    """Create prompt with validated input"""
    try:
        # Validate input
        validated_input = CreatePromptInput(**kwargs)
        
        # Use validated data
        prompt_data = {
            'userId': user_id,  # From auth token, not client
            'title': validated_input.title,
            'content': validated_input.content,
            'tags': validated_input.tags,
            'category': validated_input.category.value,
            'description': validated_input.description,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'version': 1
        }
        
        # Create in Firestore
        doc_ref = db.collection('prompts').document()
        doc_ref.set(prompt_data)
        
        return CreatePromptOutput(
            success=True,
            prompt_id=doc_ref.id,
            message=f"Prompt '{validated_input.title}' created successfully",
            prompt_data=prompt_data
        )
        
    except ValidationError as e:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message=f"Invalid input: {str(e)}"
        )
```

---

## 📝 AUDIT LOGGING

### Request Logging

```python
import logging
import json

logger = logging.getLogger(__name__)

async def log_request(user_id: str, endpoint: str, request_data: dict, response_data: dict, duration_ms: int):
    """Log all requests for audit trail"""
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'endpoint': endpoint,
        'request_size': len(json.dumps(request_data)),
        'response_size': len(json.dumps(response_data)),
        'duration_ms': duration_ms,
        'success': response_data.get('success', False)
    }
    
    # Log to Cloud Logging
    logger.info(f"API Request: {json.dumps(log_entry)}")
    
    # Store in Firestore for analytics
    db.collection('audit_logs').add(log_entry)
```

### Security Event Logging

```python
async def log_security_event(event_type: str, user_id: str, details: dict):
    """Log security-related events"""
    event = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,  # 'auth_failure', 'rate_limit', 'permission_denied'
        'user_id': user_id,
        'details': details
    }
    
    logger.warning(f"Security Event: {json.dumps(event)}")
    db.collection('security_events').add(event)
```

---

## 🔥 FIRESTORE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Prompts collection
    match /prompts/{promptId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.keys().hasAll(['title', 'content', 'userId']);
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == resource.data.userId;  // Prevent userId change
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Executions collection
    match /executions/{executionId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;  // Executions are immutable
    }
    
    // Conversations collection (agent chat history)
    match /conversations/{conversationId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == resource.data.userId;
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Rate limits (server-side only)
    match /rate_limits/{userId}/{document=**} {
      allow read, write: if false;  // Only server can access
    }
    
    // Audit logs (server-side only)
    match /audit_logs/{logId} {
      allow read, write: if false;  // Only server can access
    }
  }
}
```

---

## 🎯 SECURITY CHECKLIST

### Authentication
- [x] Validate Firebase Auth tokens on every request
- [x] Extract user_id from token, never trust client
- [x] Return 401 for invalid/missing tokens
- [x] Handle token expiry gracefully
- [x] Implement token refresh on client

### Authorization
- [x] Filter all Firestore queries by user_id
- [x] Verify ownership before updates/deletes
- [x] Prevent userId modification in updates
- [x] Never allow cross-user data access
- [x] Implement Firestore security rules

### Input Validation
- [x] Validate all inputs with Pydantic schemas
- [x] Sanitize user-provided content
- [x] Limit input sizes (max lengths)
- [x] Validate data types and formats
- [x] Return clear validation error messages

### Rate Limiting
- [x] Implement per-user rate limiting
- [x] Track requests in Firestore
- [x] Return 429 with Retry-After header
- [x] Log rate limit violations
- [x] Clean up old rate limit records

### Audit Logging
- [x] Log all API requests
- [x] Log security events
- [x] Include user_id in all logs
- [x] Store logs in Firestore and Cloud Logging
- [x] Monitor logs for suspicious activity

---

## 📊 SECURITY MONITORING

### Metrics to Track
1. **Authentication Failures**: Failed token validations
2. **Rate Limit Violations**: Users hitting rate limits
3. **Permission Denials**: Unauthorized access attempts
4. **Unusual Activity**: Spikes in requests, errors

### Alerts to Configure
- High authentication failure rate (>5% of requests)
- Repeated rate limit violations from same user
- Permission denial spikes
- Unusual request patterns

---

**Document Version**: 1.0  
**Created**: October 17, 2025  
**Status**: Complete  
**Next**: Task 2.1.5 - Dashboard Context Schema

