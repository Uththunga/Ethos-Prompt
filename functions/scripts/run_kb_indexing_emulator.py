import os
import asyncio
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("run_kb_indexing_emulator")

async def main(force_reindex: bool = False):
    # Ensure emulator env
    os.environ.setdefault('GOOGLE_CLOUD_PROJECT', 'rag-prompt-library-staging')
    os.environ.setdefault('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8080')
    os.environ.setdefault('OPENROUTER_USE_MOCK', 'true')
    os.environ.setdefault('ENVIRONMENT', 'staging')

    # Use google-cloud-firestore directly to avoid admin credential requirements
    from google.cloud import firestore as gfs

    logger.info("Connecting to Firestore emulator...")
    db = gfs.Client(project=os.environ['GOOGLE_CLOUD_PROJECT'])
    logger.info("Connected to Firestore emulator (project=%s)", os.environ['GOOGLE_CLOUD_PROJECT'])

    from src.ai_agent.marketing.kb_indexer import initialize_marketing_kb

    logger.info("Indexing marketing knowledge base (force_reindex=%s)...", force_reindex)
    results = await initialize_marketing_kb(db, force_reindex=force_reindex)

    logger.info("Indexing complete: %s indexed, %s skipped, %s chunks, %s vectors, %.2fs",
                results.get('indexed_documents'), results.get('skipped_documents'),
                results.get('total_chunks'), results.get('total_vectors'),
                results.get('processing_time'))

    print(results)

if __name__ == '__main__':
    force = ('--force' in os.sys.argv) or ('-f' in os.sys.argv)
    asyncio.run(main(force))

