import os
import asyncio
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("run_kb_indexing_staging")

async def main(force_reindex: bool = False):
    # Target STAGING Firestore (no emulator)
    os.environ.setdefault('GOOGLE_CLOUD_PROJECT', 'rag-prompt-library-staging')
    # Ensure zero-cost
    os.environ.setdefault('OPENROUTER_USE_MOCK', 'true')
    os.environ.setdefault('ENVIRONMENT', 'staging')

    # Use google-cloud-firestore directly; requires ADC or service account via GOOGLE_APPLICATION_CREDENTIALS
    from google.cloud import firestore as gfs

    project = os.environ['GOOGLE_CLOUD_PROJECT']
    logger.info("Connecting to Firestore (project=%s)...", project)
    try:
        db = gfs.Client(project=project)
        logger.info("Connected to Firestore (STAGING)")
    except Exception as e:
        logger.error("Failed to initialize Firestore client. %s", e)
        raise

    from src.ai_agent.marketing.kb_indexer import initialize_marketing_kb

    logger.info("Indexing marketing knowledge base (force_reindex=%s)...", force_reindex)
    results = await initialize_marketing_kb(db, force_reindex=force_reindex)

    logger.info(
        "Indexing complete: %s indexed, %s skipped, %s chunks, %s vectors, %.2fs",
        results.get('indexed_documents'),
        results.get('skipped_documents'),
        results.get('total_chunks'),
        results.get('total_vectors'),
        results.get('processing_time'),
    )

    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    force = ('--force' in os.sys.argv) or ('-f' in os.sys.argv)
    asyncio.run(main(force))

