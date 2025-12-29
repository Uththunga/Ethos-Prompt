"""
Firebase Cache Service - Redis replacement using Firestore
"""
import os
import json
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import asyncio
from concurrent.futures import ThreadPoolExecutor

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    from google.cloud.firestore import Client
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

logger = logging.getLogger(__name__)

class FirebaseCache:
    """
    Firebase Firestore-based cache service
    Provides Redis-like functionality using Firestore
    """

    def __init__(self):
        self.db = None
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            if not FIREBASE_AVAILABLE:
                logger.warning("Firebase Admin SDK not available")
                return

            # Check if Firebase app is already initialized
            if not firebase_admin._apps:
                # Try to initialize with service account key
                service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_PATH')
                project_id = os.getenv('FIREBASE_PROJECT_ID', 'demo-rag-prompt-library')

                if service_account_path and os.path.exists(service_account_path):
                    # Use service account key file
                    cred = credentials.Certificate(service_account_path)
                    firebase_admin.initialize_app(cred, {
                        'projectId': project_id
                    })
                else:
                    # Use default credentials (for local development)
                    try:
                        cred = credentials.ApplicationDefault()
                        firebase_admin.initialize_app(cred, {
                            'projectId': project_id
                        })
                    except Exception:
                        # Fallback: Initialize without credentials for testing
                        logger.warning("Using Firebase emulator or default project")
                        firebase_admin.initialize_app(options={
                            'projectId': project_id
                        })

            # Get Firestore client
            self.db = firestore.client()
            logger.info("Firebase cache initialized successfully")

        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self.db = None

    def _run_async(self, coro):
        """Run async function in thread pool"""
        try:
            loop = asyncio.get_event_loop()
            return loop.run_until_complete(coro)
        except RuntimeError:
            # No event loop running, create new one
            return asyncio.run(coro)

    async def set(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Set a value with TTL"""
        if not self.db:
            return False

        try:
            expires_at = datetime.now() + timedelta(seconds=ttl_seconds)

            doc_data = {
                'key': key,
                'value': json.dumps(value) if not isinstance(value, str) else value,
                'created_at': firestore.SERVER_TIMESTAMP,
                'expires_at': expires_at,
                'ttl_seconds': ttl_seconds
            }

            # Use thread pool for Firestore operations
            db = self.db
            def _set_doc():
                doc_ref = db.collection('cache').document(key)
                doc_ref.set(doc_data)
                return True

            result = await asyncio.get_event_loop().run_in_executor(
                self.executor, _set_doc
            )

            logger.debug(f"Cached key: {key} with TTL: {ttl_seconds}s")
            return result

        except Exception as e:
            logger.error(f"Failed to set cache key {key}: {e}")
            return False

    async def get(self, key: str) -> Optional[Any]:
        """Get a value, return None if expired or not found"""
        if not self.db:
            return None

        try:
            db = self.db
            def _get_doc():
                doc_ref = db.collection('cache').document(key)
                doc = doc_ref.get()

                if not doc.exists:
                    return None

                data = doc.to_dict()

                # Check if expired
                if data.get('expires_at') and data['expires_at'] < datetime.now():
                    # Delete expired document
                    doc_ref.delete()
                    return None

                # Return the value
                value = data.get('value')
                try:
                    # Try to parse as JSON
                    return json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    # Return as string if not JSON
                    return value

            result = await asyncio.get_event_loop().run_in_executor(
                self.executor, _get_doc
            )

            if result is not None:
                logger.debug(f"Cache hit for key: {key}")
            else:
                logger.debug(f"Cache miss for key: {key}")

            return result

        except Exception as e:
            logger.error(f"Failed to get cache key {key}: {e}")
            return None

    async def delete(self, key: str) -> bool:
        """Delete a key"""
        if not self.db:
            return False

        try:
            db = self.db
            def _delete_doc():
                doc_ref = db.collection('cache').document(key)
                doc_ref.delete()
                return True

            result = await asyncio.get_event_loop().run_in_executor(
                self.executor, _delete_doc
            )

            logger.debug(f"Deleted cache key: {key}")
            return result

        except Exception as e:
            logger.error(f"Failed to delete cache key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """Check if key exists and is not expired"""
        result = await self.get(key)
        return result is not None

    async def increment(self, key: str, amount: int = 1, ttl_seconds: int = 3600) -> int:
        """Increment a counter, create if doesn't exist"""
        if not self.db:
            return amount

        try:
            db = self.db
            def _increment_doc():
                doc_ref = db.collection('cache').document(key)
                doc = doc_ref.get()

                current_value = 0
                if doc.exists:
                    data = doc.to_dict()
                    # Check if expired
                    if data.get('expires_at') and data['expires_at'] < datetime.now():
                        current_value = 0
                    else:
                        try:
                            current_value = int(json.loads(data.get('value', '0')))
                        except (json.JSONDecodeError, ValueError, TypeError):
                            current_value = 0

                new_value = current_value + amount
                expires_at = datetime.now() + timedelta(seconds=ttl_seconds)

                doc_ref.set({
                    'key': key,
                    'value': json.dumps(new_value),
                    'created_at': firestore.SERVER_TIMESTAMP,
                    'expires_at': expires_at,
                    'ttl_seconds': ttl_seconds
                })

                return new_value

            result = await asyncio.get_event_loop().run_in_executor(
                self.executor, _increment_doc
            )

            logger.debug(f"Incremented key {key} by {amount}, new value: {result}")
            return result

        except Exception as e:
            logger.error(f"Failed to increment key {key}: {e}")
            return amount

    async def cleanup_expired(self) -> int:
        """Clean up expired cache entries"""
        if not self.db:
            return 0

        try:
            db = self.db
            def _cleanup():
                now = datetime.now()
                expired_docs = db.collection('cache').where('expires_at', '<', now).limit(100).get()

                count = 0
                for doc in expired_docs:
                    doc.reference.delete()
                    count += 1

                return count

            result = await asyncio.get_event_loop().run_in_executor(
                self.executor, _cleanup
            )

            if result > 0:
                logger.info(f"Cleaned up {result} expired cache entries")

            return result

        except Exception as e:
            logger.error(f"Failed to cleanup expired entries: {e}")
            return 0

    def health_check(self) -> Dict[str, Any]:
        """Check Firebase connection health"""
        try:
            if not self.db:
                return {
                    "status": "unhealthy",
                    "error": "Firebase not initialized"
                }

            # Try a simple read operation
            test_doc = self.db.collection('cache').document('health_check').get()

            return {
                "status": "healthy",
                "backend": "firebase_firestore",
                "project_id": os.getenv('FIREBASE_PROJECT_ID', 'unknown'),
                "connection": "active"
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "backend": "firebase_firestore",
                "error": str(e)
            }

# Global cache instance
firebase_cache = FirebaseCache()
