"""
Marketing Knowledge Base Initialization Script
Run this to index marketing content for the first time or to reindex
"""
from typing import Dict, Any, List, Optional, Union
import asyncio
import logging
import sys
from firebase_admin import initialize_app, firestore

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def main(force_reindex: bool = False) -> Any:
    """
    Initialize marketing knowledge base.
    
    Args:
        force_reindex: If True, reindex all documents even if already indexed
    """
    logger.info("=" * 60)
    logger.info("Marketing Knowledge Base Initialization")
    logger.info("=" * 60)
    
    # Initialize Firebase
    try:
        initialize_app()
        db = firestore.client()
        logger.info("✓ Firebase initialized")
    except Exception as e:
        logger.error(f"✗ Failed to initialize Firebase: {e}")
        return 1
    
    # Import after Firebase is initialized
    from .kb_indexer import initialize_marketing_kb
    
    # Index marketing KB
    try:
        logger.info("\nIndexing marketing knowledge base...")
        results = await initialize_marketing_kb(db, force_reindex=force_reindex)
        
        logger.info("\n" + "=" * 60)
        logger.info("Indexing Results:")
        logger.info("=" * 60)
        logger.info(f"Total documents: {results['total_documents']}")
        logger.info(f"Indexed documents: {results['indexed_documents']}")
        logger.info(f"Skipped documents: {results['skipped_documents']}")
        logger.info(f"Total chunks: {results['total_chunks']}")
        logger.info(f"Total vectors: {results['total_vectors']}")
        logger.info(f"Processing time: {results['processing_time']:.2f}s")
        
        if results['errors']:
            logger.warning(f"\nErrors encountered: {len(results['errors'])}")
            for error in results['errors']:
                logger.warning(f"  - {error['document_id']}: {error['error']}")
        
        logger.info("\n✓ Marketing KB initialization complete!")
        return 0
        
    except Exception as e:
        logger.error(f"\n✗ Failed to index marketing KB: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    force_reindex = "--force" in sys.argv or "-f" in sys.argv
    
    if force_reindex:
        logger.info("Force reindex mode enabled")
    
    exit_code = asyncio.run(main(force_reindex))
    sys.exit(exit_code)

