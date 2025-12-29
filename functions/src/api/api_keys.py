"""
Custom API Key Management
RAG Prompt Library - User API Key Storage and Validation

Endpoints:
- save_api_key: Save user's custom OpenRouter API key
- get_api_key: Retrieve user's API key (masked)
- validate_api_key: Test API key validity
- delete_api_key: Remove user's API key
- list_api_keys: List all user's API keys (masked)
"""

from firebase_functions import https_fn, options
from firebase_admin import firestore
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import logging
import hashlib
import base64
import os

try:
    import aiohttp
    AIOHTTP_AVAILABLE = True
except ImportError:
    AIOHTTP_AVAILABLE = False

logger = logging.getLogger(__name__)
db = firestore.client()


# =============================================================================
# ENCRYPTION HELPERS
# =============================================================================

def encrypt_api_key(api_key: str, user_id: str) -> str:
    """
    Simple encryption for API keys using base64 and user-specific salt
    Note: For production, use proper encryption like Google Cloud KMS

    Args:
        api_key: The API key to encrypt
        user_id: User ID for salt

    Returns:
        Encrypted API key
    """
    # Create a simple XOR cipher with user_id as key
    # In production, use proper encryption (KMS, Fernet, etc.)
    salt = hashlib.sha256(user_id.encode()).digest()
    encrypted = bytearray()

    for i, char in enumerate(api_key.encode()):
        encrypted.append(char ^ salt[i % len(salt)])

    return base64.b64encode(bytes(encrypted)).decode()


def decrypt_api_key(encrypted_key: str, user_id: str) -> str:
    """
    Decrypt API key

    Args:
        encrypted_key: Encrypted API key
        user_id: User ID for salt

    Returns:
        Decrypted API key
    """
    salt = hashlib.sha256(user_id.encode()).digest()
    encrypted_bytes = base64.b64decode(encrypted_key.encode())
    decrypted = bytearray()

    for i, byte in enumerate(encrypted_bytes):
        decrypted.append(byte ^ salt[i % len(salt)])

    return bytes(decrypted).decode()


def mask_api_key(api_key: str) -> str:
    """
    Mask API key for display

    Args:
        api_key: Full API key

    Returns:
        Masked key (e.g., "sk-...xyz")
    """
    if len(api_key) <= 8:
        return "***"
    return f"{api_key[:3]}...{api_key[-4:]}"


# =============================================================================
# SAVE API KEY
# =============================================================================

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins="*",
        cors_methods=["POST"]
    )
)
def save_api_key(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Save user's custom OpenRouter API key

    Args:
        api_key: OpenRouter API key
        key_name: Optional name for the key (e.g., "Personal", "Work")
        provider: Provider name (default: "openrouter")

    Returns:
        Success status and key ID
    """
    # Authentication check
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    data = req.data
    api_key = data.get('apiKey')
    key_name = data.get('keyName', 'Default')
    provider = data.get('provider', 'openrouter')

    if not api_key:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="API key is required"
        )

    # Validate API key format
    if not api_key.startswith('sk-'):
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="Invalid API key format"
        )

    try:
        user_id = req.auth.uid

        # Encrypt the API key
        encrypted_key = encrypt_api_key(api_key, user_id)

        # Store in Firestore
        key_doc = {
            'userId': user_id,
            'provider': provider,
            'keyName': key_name,
            'encryptedKey': encrypted_key,
            'maskedKey': mask_api_key(api_key),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'lastUsedAt': None,
            'isActive': True,
            'usageCount': 0
        }

        # Check if user already has a key with this name
        existing_keys = db.collection('user_api_keys')\
            .where('userId', '==', user_id)\
            .where('keyName', '==', key_name)\
            .where('provider', '==', provider)\
            .where('isActive', '==', True)\
            .limit(1)\
            .get()

        if len(list(existing_keys)) > 0:
            # Update existing key
            key_id = list(existing_keys)[0].id
            db.collection('user_api_keys').document(key_id).update({
                'encryptedKey': encrypted_key,
                'maskedKey': mask_api_key(api_key),
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
        else:
            # Create new key
            doc_ref = db.collection('user_api_keys').add(key_doc)
            key_id = doc_ref[1].id

        logger.info(f"Saved API key for user {user_id}")

        return {
            'success': True,
            'keyId': key_id,
            'maskedKey': mask_api_key(api_key),
            'message': 'API key saved successfully'
        }

    except Exception as e:
        logger.error(f"Error saving API key: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Failed to save API key"
        )


# =============================================================================
# GET API KEY
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def get_api_key(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get user's API key (returns decrypted key for internal use)

    Args:
        key_id: Optional specific key ID
        provider: Provider name (default: "openrouter")

    Returns:
        API key information
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    data = req.data
    key_id = data.get('keyId')
    provider = data.get('provider', 'openrouter')
    user_id = req.auth.uid

    try:
        if key_id:
            # Get specific key
            key_doc = db.collection('user_api_keys').document(key_id).get()
            if not key_doc.exists:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.NOT_FOUND,
                    message="API key not found"
                )

            key_data = key_doc.to_dict()
            if key_data['userId'] != user_id:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                    message="Access denied"
                )
        else:
            # Get user's active key for provider
            keys = db.collection('user_api_keys')\
                .where('userId', '==', user_id)\
                .where('provider', '==', provider)\
                .where('isActive', '==', True)\
                .order_by('createdAt', direction=firestore.Query.DESCENDING)\
                .limit(1)\
                .get()

            keys_list = list(keys)
            if len(keys_list) == 0:
                return {
                    'success': False,
                    'hasKey': False,
                    'message': 'No API key found'
                }

            key_data = keys_list[0].to_dict()
            key_id = keys_list[0].id

        # Decrypt the key
        decrypted_key = decrypt_api_key(key_data['encryptedKey'], user_id)

        return {
            'success': True,
            'hasKey': True,
            'keyId': key_id,
            'apiKey': decrypted_key,  # Only returned for internal use
            'maskedKey': key_data['maskedKey'],
            'keyName': key_data['keyName'],
            'provider': key_data['provider'],
            'createdAt': key_data['createdAt'],
            'lastUsedAt': key_data.get('lastUsedAt'),
            'usageCount': key_data.get('usageCount', 0)
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error retrieving API key: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Failed to retrieve API key"
        )


# =============================================================================
# VALIDATE API KEY
# =============================================================================

@https_fn.on_call(
    region="australia-southeast1",
    timeout_sec=30,
    cors=options.CorsOptions(
        cors_origins="*",
        cors_methods=["POST"]
    )
)
def validate_api_key(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Validate an API key by making a test request to OpenRouter

    Args:
        api_key: API key to validate

    Returns:
        Validation result
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    if not AIOHTTP_AVAILABLE:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
            message="HTTP client not available"
        )

    data = req.data
    api_key = data.get('apiKey')

    if not api_key:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="API key is required"
        )

    async def test_key():
        """Test the API key with a minimal request"""
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                }

                # Make a minimal test request
                payload = {
                    'model': 'openai/gpt-3.5-turbo',
                    'messages': [{'role': 'user', 'content': 'test'}],
                    'max_tokens': 5
                }

                async with session.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=20)
                ) as response:
                    if response.status == 200:
                        return True, "API key is valid"
                    elif response.status == 401:
                        return False, "Invalid API key"
                    elif response.status == 429:
                        return False, "Rate limit exceeded"
                    else:
                        error_text = await response.text()
                        return False, f"Validation failed: {error_text[:100]}"

        except asyncio.TimeoutError:
            return False, "Request timed out"
        except Exception as e:
            logger.error(f"Error validating API key: {str(e)}")
            return False, f"Validation error: {str(e)}"

    # Run async validation
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    is_valid, message = loop.run_until_complete(test_key())
    loop.close()

    return {
        'success': True,
        'isValid': is_valid,
        'message': message
    }


# =============================================================================
# DELETE API KEY
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def delete_api_key(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Delete user's API key

    Args:
        key_id: ID of the key to delete

    Returns:
        Success status
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    data = req.data
    key_id = data.get('keyId')

    if not key_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="Key ID is required"
        )

    try:
        user_id = req.auth.uid

        # Get the key
        key_doc = db.collection('user_api_keys').document(key_id).get()

        if not key_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="API key not found"
            )

        key_data = key_doc.to_dict()

        # Check ownership
        if key_data['userId'] != user_id:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Access denied"
            )

        # Soft delete (mark as inactive)
        db.collection('user_api_keys').document(key_id).update({
            'isActive': False,
            'deletedAt': firestore.SERVER_TIMESTAMP
        })

        logger.info(f"Deleted API key {key_id} for user {user_id}")

        return {
            'success': True,
            'message': 'API key deleted successfully'
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error deleting API key: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Failed to delete API key"
        )


# =============================================================================
# LIST API KEYS
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def list_api_keys(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    List all user's API keys (masked)

    Returns:
        List of API keys with masked values
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    try:
        user_id = req.auth.uid

        # Get all active keys for user
        keys = db.collection('user_api_keys')\
            .where('userId', '==', user_id)\
            .where('isActive', '==', True)\
            .order_by('createdAt', direction=firestore.Query.DESCENDING)\
            .get()

        keys_list = []
        for key_doc in keys:
            key_data = key_doc.to_dict()
            keys_list.append({
                'keyId': key_doc.id,
                'keyName': key_data['keyName'],
                'provider': key_data['provider'],
                'maskedKey': key_data['maskedKey'],
                'createdAt': key_data['createdAt'],
                'lastUsedAt': key_data.get('lastUsedAt'),
                'usageCount': key_data.get('usageCount', 0)
            })

        return {
            'success': True,
            'keys': keys_list,
            'count': len(keys_list)
        }

    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Failed to list API keys"
        )
