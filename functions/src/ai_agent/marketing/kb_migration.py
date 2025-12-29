"""
Knowledge Base Migration Script
Migrates hardcoded KB content to Firestore collection
"""
import logging
import asyncio
import os
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

# Import content
from src.ai_agent.marketing.marketing_kb_content import MARKETING_KB_CONTENT

logger = logging.getLogger(__name__)

async def migrate_kb_content(db) -> Any:
    """
    Migrate KB content to Firestore

    Args:
        db: Firestore client
    """
    if not db:
        logger.error("Firestore client not provided")
        return False

    collection_ref = db.collection("marketing_kb_content")

    logger.info(f"Starting migration of {len(MARKETING_KB_CONTENT)} documents...")

    count = 0
    updated = 0

    for doc_id, doc_data in MARKETING_KB_CONTENT.items():
        try:
            # Prepare document data
            firestore_doc = {
                "id": doc_id,
                "title": doc_data["title"],
                "content": doc_data["content"],
                "metadata": doc_data["metadata"],
                "updated_at": datetime.now(timezone.utc),
                "source": "migration_script",
                "version": 1
            }

            # Check if exists
            doc_ref = collection_ref.document(doc_id)
            doc_snap = await doc_ref.get()

            if doc_snap.exists:
                # Update if content changed (simple check)
                existing = doc_snap.to_dict()
                if existing.get("content") != doc_data["content"]:
                    await doc_ref.set(firestore_doc, merge=True)
                    logger.info(f"Updated document: {doc_id}")
                    updated += 1
                else:
                    logger.info(f"Skipped existing document: {doc_id}")
            else:
                # Create new
                await doc_ref.set(firestore_doc)
                logger.info(f"Created document: {doc_id}")
                count += 1

        except Exception as e:
            logger.error(f"Error migrating document {doc_id}: {e}")

    logger.info(f"Migration complete: {count} created, {updated} updated")
    return True

if __name__ == "__main__":
    # This block allows running as standalone script if needed
    # (Requires setting up Firestore client manually)
    pass
