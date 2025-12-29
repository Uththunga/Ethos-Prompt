"""
GDPR Compliance Module for Cache Management

Task 1.2.3: GDPR compliance features implementation
Provides endpoints and utilities for user data access and deletion rights.
"""
import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class GDPRCacheManager:
    """
    Manages GDPR compliance for cached user data.

    Provides functionality for:
    - User data access (GDPR Art. 15)
    - User data deletion (GDPR Art. 17 - Right to be Forgotten)
    - User data export (GDPR Art. 20 - Data Portability)
    """

    def __init__(self, cache):
        """
        Initialize GDPR manager with cache instance.

        Args:
            cache: IntelligentResponseCache instance
        """
        self.cache = cache

    async def get_user_cached_data(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieve all cached data for a specific user.

        Implements GDPR Art. 15 (Right to Access).

        Args:
            user_id: Unique user identifier

        Returns:
            Dictionary containing user's cached queries and responses
        """
        try:
            logger.info(f"GDPR: Retrieving cached data for user_id: {user_id}")

            user_data = {
                "user_id": user_id,
                "export_date": datetime.now(timezone.utc).isoformat(),
                "cached_responses": [],
                "total_entries": 0
            }

            # Firestore implementation for cache lookup
            if hasattr(self.cache, 'db') and self.cache.db is not None:
                from google.cloud import firestore

                # Query cache collection for user's data
                cache_ref = self.cache.db.collection('response_cache')
                docs = cache_ref.where('user_id', '==', user_id).stream()

                for doc in docs:
                    doc_data = doc.to_dict()
                    # Sanitize sensitive fields before export
                    sanitized = {
                        'id': doc.id,
                        'query_hash': doc_data.get('query_hash', ''),
                        'created_at': doc_data.get('created_at', ''),
                        'service': doc_data.get('service', ''),
                        'response_preview': str(doc_data.get('response', ''))[:200] + '...' if doc_data.get('response') else ''
                    }
                    user_data['cached_responses'].append(sanitized)
                    user_data['total_entries'] += 1
            else:
                logger.warning("GDPR: Firestore not available for cache lookup")

            logger.info(f"GDPR: Retrieved {user_data['total_entries']} entries for user_id: {user_id}")
            return user_data

        except Exception as e:
            logger.error(f"GDPR: Error retrieving data for user_id {user_id}: {str(e)}", exc_info=True)
            raise

    async def delete_user_cached_data(self, user_id: str) -> Dict[str, Any]:
        """
        Delete all cached data for a specific user.

        Implements GDPR Art. 17 (Right to be Forgotten).

        Args:
            user_id: Unique user identifier

        Returns:
            Dictionary containing deletion status and count
        """
        try:
            logger.info(f"GDPR: Deleting cached data for user_id: {user_id}")

            deleted_count = 0

            # Firestore implementation for cache deletion
            if hasattr(self.cache, 'db') and self.cache.db is not None:
                # Query cache collection for user's data
                cache_ref = self.cache.db.collection('response_cache')
                docs = cache_ref.where('user_id', '==', user_id).stream()

                # Delete each document
                batch = self.cache.db.batch()
                batch_size = 0

                for doc in docs:
                    batch.delete(doc.reference)
                    deleted_count += 1
                    batch_size += 1

                    # Firestore batch limit is 500
                    if batch_size >= 400:
                        batch.commit()
                        batch = self.cache.db.batch()
                        batch_size = 0

                # Commit remaining deletes
                if batch_size > 0:
                    batch.commit()
            else:
                logger.warning("GDPR: Firestore not available for cache deletion")

            result = {
                "user_id": user_id,
                "status": "deleted",
                "deleted_entries": deleted_count,
                "deletion_date": datetime.now(timezone.utc).isoformat()
            }

            logger.info(f"GDPR: Deleted {deleted_count} entries for user_id: {user_id}")
            return result

        except Exception as e:
            logger.error(f"GDPR: Error deleting data for user_id {user_id}: {str(e)}", exc_info=True)
            raise

    async def export_user_data_json(self, user_id: str) -> str:
        """
        Export user's cached data in JSON format.

        Implements GDPR Art. 20 (Right to Data Portability).

        Args:
            user_id: Unique user identifier

        Returns:
            JSON string of user's cached data
        """
        import json

        try:
            user_data = await self.get_user_cached_data(user_id)
            return json.dumps(user_data, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"GDPR: Error exporting data for user_id {user_id}: {str(e)}", exc_info=True)
            raise

    async def check_user_consent(self, user_id: str) -> bool:
        """
        Check if user has consented to caching.

        Args:
            user_id: Unique user identifier

        Returns:
            True if user consents to caching, False otherwise
        """
        try:
            # Firestore implementation for consent checking
            if hasattr(self.cache, 'db') and self.cache.db is not None:
                user_doc = self.cache.db.collection('users').document(user_id).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    # Default to True if field not set (opt-out model)
                    return user_data.get('cache_consent', True)

            # Default: assume consent if Firestore unavailable
            return True

        except Exception as e:
            logger.error(f"GDPR: Error checking consent for user_id {user_id}: {str(e)}", exc_info=True)
            # Fail safe: if error checking consent, don't cache
            return False

    async def set_user_consent(self, user_id: str, consent: bool) -> bool:
        """
        Set user's caching consent.

        Args:
            user_id: Unique user identifier
            consent: True to enable caching, False to disable

        Returns:
            True if consent was successfully updated
        """
        try:
            logger.info(f"GDPR: Setting cache consent for user_id {user_id} to: {consent}")

            # Firestore implementation for consent storage
            if hasattr(self.cache, 'db') and self.cache.db is not None:
                self.cache.db.collection('users').document(user_id).set({
                    'cache_consent': consent,
                    'consent_updated_at': datetime.now(timezone.utc)
                }, merge=True)
                logger.info(f"GDPR: Consent updated for user_id: {user_id}")
                return True
            else:
                logger.warning("GDPR: Firestore not available for consent storage")
                return False

        except Exception as e:
            logger.error(f"GDPR: Error setting consent for user_id {user_id}: {str(e)}", exc_info=True)
            return False
            return False


# Helper functions for FastAPI endpoints

async def verify_user_authentication(request) -> Optional[str]:
    """
    Verify user is authenticated and extract user_id.

    Args:
        request: FastAPI Request object

    Returns:
        User ID if authenticated, None otherwise
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "")

    try:
        # Firebase Admin SDK token verification
        from firebase_admin import auth
        decoded_token = auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        return None


def verify_admin_authentication(request) -> bool:
    """
    Verify request is from an admin user.

    Args:
        request: FastAPI Request object

    Returns:
        True if admin, False otherwise
    """
    # TODO: Implement actual admin verification
    # For Firebase Auth:
    # - Verify user is authenticated
    # - Check user has admin role/claim
    # - Or verify request has admin API key

    api_key = request.headers.get("X-Admin-API-Key", "")
    expected_key = os.getenv("ADMIN_API_KEY", "")

    if not expected_key:
        logger.warning("ADMIN_API_KEY not configured")
        return False

    return api_key == expected_key
