import os
import json
from typing import Any, Dict, List

# Ensure emulator env vars are set externally
# Expected: FIRESTORE_EMULATOR_HOST, GOOGLE_CLOUD_PROJECT, OPENROUTER_USE_MOCK

def init_firestore():
    # Use google-cloud-firestore directly to avoid credential requirements with emulator
    from google.cloud import firestore as gfs
    project = os.environ.get('GOOGLE_CLOUD_PROJECT') or 'rag-prompt-library-staging'
    return gfs.Client(project=project)


def get_embedding_length(embedding_field: Any) -> int:
    """Return the length of the embedding regardless of Vector/List shape."""
    try:
        # google.cloud.firestore_v1.vector.Vector
        if hasattr(embedding_field, 'to_map_value'):
            mv = embedding_field.to_map_value()
            return len(list(mv.values()))
        # Plain list
        if isinstance(embedding_field, list):
            return len(embedding_field)
    except Exception:
        pass
    return -1


def get_embedding_list(embedding_field: Any) -> List[float]:
    try:
        if hasattr(embedding_field, 'to_map_value'):
            mv = embedding_field.to_map_value()
            return list(mv.values())
        if isinstance(embedding_field, list):
            return embedding_field
    except Exception:
        pass
    return []


def verify_collection_structure(db):
    col = db.collection('marketing_kb_vectors')
    docs = list(col.limit(3).stream())
    samples = []
    for d in docs:
        data = d.to_dict() or {}
        md = data.get('metadata', {})
        samples.append({
            'id': d.id,
            'embedding_len': get_embedding_length(data.get('embedding')),
            'document_id': md.get('document_id'),
            'category': md.get('category'),
            'chunk_index': md.get('chunk_index'),
            'page': md.get('page'),
            'chunk_text_sample': (md.get('chunk_text') or '')[:120]
        })
    # Count all docs (expected 40-60)
    total = sum(1 for _ in db.collection('marketing_kb_vectors').stream())
    return total, samples


async def run_retrieval_tests(db):
    from src.ai_agent.marketing.kb_indexer import MarketingKBIndexer

    idx = MarketingKBIndexer(db=db)

    queries = [
        "What services does EthosPrompt offer?",
        "How does your RAG work?",
        "What is the pricing?",
        "How do I get started?",
    ]

    all_results: Dict[str, List[Dict[str, Any]]] = {}
    for q in queries:
        results = await idx.search_kb(q, top_k=5)
        # Simplify payload for printing
        simplified = []
        for r in results:
            simplified.append({
                'score': round(float(r.get('score', 0.0)), 4),
                'document_id': r.get('document_id') or (r.get('metadata', {}) or {}).get('document_id'),
                'category': r.get('category') or (r.get('metadata', {}) or {}).get('category'),
                'text': (r.get('text') or '')[:140]
            })
        all_results[q] = simplified
    return all_results


async def main():
    db = init_firestore()
    total, samples = verify_collection_structure(db)
    retrieval = await run_retrieval_tests(db)

    print(json.dumps({
        'collection_count': total,
        'samples': samples,
        'retrieval': retrieval
    }, indent=2))


if __name__ == '__main__':
    import asyncio
    # Ensure emulator env defaults (do not override if already set)
    os.environ.setdefault('GOOGLE_CLOUD_PROJECT', 'rag-prompt-library-staging')
    os.environ.setdefault('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8080')
    os.environ.setdefault('OPENROUTER_USE_MOCK', 'true')
    asyncio.run(main())
