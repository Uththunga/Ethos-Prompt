import os
import json
import logging
from typing import Dict, List

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("verify_kb_staging")


def init_firestore():
    # STAGING (no emulator). Requires ADC or GOOGLE_APPLICATION_CREDENTIALS
    from google.cloud import firestore as gfs
    project = os.environ.get('GOOGLE_CLOUD_PROJECT') or 'rag-prompt-library-staging'
    return gfs.Client(project=project)


def sample_documents(db, collection: str, limit: int = 3):
    docs = list(db.collection(collection).limit(limit).stream())
    samples = []
    for d in docs:
        data = d.to_dict() or {}
        meta = data.get('metadata', {})
        samples.append({
            'id': d.id,
            'embedding_len': len(data.get('embedding', []) or []),
            'document_id': meta.get('document_id'),
            'category': meta.get('category'),
            'chunk_index': meta.get('chunk_index'),
            'page': meta.get('page'),
            'chunk_text_sample': (meta.get('chunk_text') or '')[:120]
        })
    return samples


async def run_retrieval_tests(db):
    from src.ai_agent.marketing.kb_indexer import MarketingKBIndexer

    idx = MarketingKBIndexer(db=db)

    queries = [
        "What services does EthosPrompt offer?",
        "How does your RAG work?",
        "What is the pricing?",
        "How do I get started?",
    ]

    results: Dict[str, List[Dict[str, str]]] = {}
    for q in queries:
        search = await idx.search_kb(q, top_k=5)
        results[q] = [
            {
                'score': round(float(item.get('score', 0.0)), 4),
                'document_id': item.get('document_id'),
                'category': item.get('category'),
                'text': (item.get('text') or '')[:140]
            }
            for item in search
        ]
    return results


def main():
    os.environ.setdefault('GOOGLE_CLOUD_PROJECT', 'rag-prompt-library-staging')
    os.environ.setdefault('OPENROUTER_USE_MOCK', 'true')
    os.environ.setdefault('ENVIRONMENT', 'staging')

    db = init_firestore()

    col = 'marketing_kb_vectors'
    count = len(list(db.collection(col).stream()))

    payload = {
        'collection_count': count,
        'samples': sample_documents(db, col, limit=3),
    }

    # Run retrieval tests
    import asyncio
    retrieval = asyncio.run(run_retrieval_tests(db))
    payload['retrieval'] = retrieval

    print(json.dumps(payload, indent=2))


if __name__ == '__main__':
    main()
