"""
Firestore Collection Setup Script
Creates and configures the agent_checkpoints collection for conversation persistence.

Usage:
    python -m src.ai_agent.marketing.scripts.setup_firestore_collection
"""
from typing import Dict, Any, List, Optional, Union
import os
import sys
import logging
from google.cloud import firestore  # type: ignore[misc]
from google.cloud.firestore_v1 import FieldFilter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def setup_agent_checkpoints_collection() -> Any:
    """
    Set up the agent_checkpoints Firestore collection.

    Creates the collection and verifies it's accessible.
    Note: Firestore creates collections automatically on first write,
    but this script verifies connectivity and permissions.
    """
    try:
        # Initialize Firestore client
        project_id = os.getenv("FIRESTORE_PROJECT_ID") or os.getenv("GCP_PROJECT")
        if not project_id:
            logger.error("❌ FIRESTORE_PROJECT_ID or GCP_PROJECT environment variable not set")
            return False

        logger.info(f"Connecting to Firestore project: {project_id}")
        db = firestore.Client(project=project_id)

        # Collection name
        collection_name = "agent_checkpoints"
        collection_ref = db.collection(collection_name)

        # Test write to verify collection is accessible
        test_doc_ref = collection_ref.document("_setup_test")
        test_doc_ref.set({
            "test": True,
            "created_at": firestore.SERVER_TIMESTAMP,
            "message": "Setup verification document"
        })
        logger.info(f"✓ Successfully wrote test document to {collection_name}")

        # Verify read access
        test_doc = test_doc_ref.get()
        if test_doc.exists:
            logger.info(f"✓ Successfully read test document from {collection_name}")

        # Clean up test document
        test_doc_ref.delete()
        logger.info(f"✓ Cleaned up test document")

        # Log collection info
        logger.info(f"""
╔══════════════════════════════════════════════════════════════╗
║  Firestore Collection Setup Complete                         ║
╠══════════════════════════════════════════════════════════════╣
║  Collection: {collection_name:<45} ║
║  Project:    {project_id:<45} ║
║  Status:     Ready for use                                   ║
╠══════════════════════════════════════════════════════════════╣
║  Next Steps:                                                 ║
║  1. Deploy agent with ENVIRONMENT=production                 ║
║  2. Checkpoints will be automatically saved to this collection║
║  3. Monitor Firestore console for checkpoint documents       ║
╚══════════════════════════════════════════════════════════════╝
        """)

        # Note about indexes
        logger.info("""
📝 Index Configuration:
   Firestore automatically creates indexes for single-field queries.
   For the agent_checkpoints collection, the following queries are supported:
   - Query by thread_id (automatic index)
   - Query by created_at (automatic index)

   If you need composite indexes (e.g., thread_id + created_at), create them via:
   - Firestore Console: https://console.cloud.google.com/firestore/indexes
   - Or via firestore.indexes file in your project
        """)

        return True

    except Exception as e:
        logger.error(f"❌ Failed to set up Firestore collection: {e}")
        logger.error(f"   Make sure you have:")
        logger.error(f"   1. Set FIRESTORE_PROJECT_ID or GCP_PROJECT environment variable")
        logger.error(f"   2. Authenticated with GCP (gcloud auth application-default login)")
        logger.error(f"   3. Enabled Firestore API in your GCP project")
        logger.error(f"   4. Have appropriate IAM permissions (Firestore User or Owner)")
        return False


def verify_collection_access() -> Any:
    """
    Verify that the agent_checkpoints collection is accessible.
    """
    try:
        project_id = os.getenv("FIRESTORE_PROJECT_ID") or os.getenv("GCP_PROJECT")
        if not project_id:
            logger.error("❌ Project ID not configured")
            return False

        db = firestore.Client(project=project_id)
        collection_ref = db.collection("agent_checkpoints")

        # Try to list documents (limit to 1 for efficiency)
        docs = list(collection_ref.limit(1).stream())

        logger.info(f"✓ Collection 'agent_checkpoints' is accessible")
        logger.info(f"  Current document count: {len(docs)} (showing first 1)")

        return True

    except Exception as e:
        logger.error(f"❌ Failed to access collection: {e}")
        return False


if __name__ == "__main__":
    logger.info("=" * 70)
    logger.info("Firestore Agent Checkpoints Collection Setup")
    logger.info("=" * 70)

    # Run setup
    success = setup_agent_checkpoints_collection()

    if success:
        logger.info("\n✅ Setup completed successfully!")

        # Verify access
        logger.info("\nVerifying collection access...")
        verify_collection_access()

        sys.exit(0)
    else:
        logger.error("\n❌ Setup failed. Please check the error messages above.")
        sys.exit(1)
