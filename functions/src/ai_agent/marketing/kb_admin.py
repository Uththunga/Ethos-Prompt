"""
Knowledge Base Admin Script
Manage KB content in Firestore
"""
import logging
import asyncio
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class KBAdmin:
    """Admin interface for Marketing Knowledge Base"""

    def __init__(self, db) -> Any:
        self.db = db
        self.collection_name = "marketing_kb_content"

    async def add_document(self, doc_id: str, title: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Add a new document"""
        if not self.db:
            return False

        try:
            doc_ref = self.db.collection(self.collection_name).document(doc_id)
            doc = await doc_ref.get()

            if doc.exists:
                logger.warning(f"Document {doc_id} already exists. Use update_document instead.")
                return False

            data = {
                "id": doc_id,
                "title": title,
                "content": content,
                "metadata": metadata or {},
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "version": 1
            }

            await doc_ref.set(data)
            logger.info(f"Document {doc_id} added successfully")
            return True

        except Exception as e:
            logger.error(f"Error adding document {doc_id}: {e}")
            return False

    async def update_document(self, doc_id: str, updates: Dict[str, Any]) -> bool:
        """Update an existing document"""
        if not self.db:
            return False

        try:
            doc_ref = self.db.collection(self.collection_name).document(doc_id)
            doc = await doc_ref.get()

            if not doc.exists:
                logger.warning(f"Document {doc_id} not found")
                return False

            updates["updated_at"] = datetime.now(timezone.utc)
            # Increment version if content changed
            if "content" in updates:
                current_version = doc.to_dict().get("version", 1)
                updates["version"] = current_version + 1

            await doc_ref.update(updates)
            logger.info(f"Document {doc_id} updated successfully")
            return True

        except Exception as e:
            logger.error(f"Error updating document {doc_id}: {e}")
            return False

    async def delete_document(self, doc_id: str) -> bool:
        """Delete a document"""
        if not self.db:
            return False

        try:
            await self.db.collection(self.collection_name).document(doc_id).delete()
            logger.info(f"Document {doc_id} deleted successfully")
            return True
        except Exception as e:
            logger.error(f"Error deleting document {doc_id}: {e}")
            return False

    async def list_documents(self) -> List[Dict[str, Any]]:
        """List all documents"""
        if not self.db:
            return []

        try:
            docs = await self.db.collection(self.collection_name).stream()
            return [doc.to_dict() for doc in docs]
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []

    async def get_document(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific document"""
        if not self.db:
            return None

        try:
            doc = await self.db.collection(self.collection_name).document(doc_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting document {doc_id}: {e}")
            return None

