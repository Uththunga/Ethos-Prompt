import asyncio
from src.rag.semantic_search import SemanticSearchEngine, SearchQuery
from src.rag.vector_store import VectorSearchResult


def _run(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


class FakeEmbeddingResult:
    def __init__(self, embedding, model='text-embedding-004'):
        self.embedding = embedding
        self.dimensions = len(embedding)
        self.tokens_used = 10
        self.cached = False
        self.model = model


def test_semantic_search_engine_smoke(monkeypatch):
    engine = SemanticSearchEngine()

    async def fake_generate_embedding(text, model=None):
        return FakeEmbeddingResult([1.0, 0.0, 0.0])

    class VS:
        def search(self, query_vector, top_k, namespace=None, filter_dict=None, include_metadata=True):
            return [
                VectorSearchResult(chunk_id='c1', content='alpha', score=0.95, metadata={}),
                VectorSearchResult(chunk_id='c2', content='beta', score=0.90, metadata={}),
            ]

    # Patch dependencies on the instance
    monkeypatch.setattr(engine, 'embedding_service', type('S', (), {'generate_embedding': fake_generate_embedding})())
    monkeypatch.setattr(engine, 'vector_store', VS())

    query = SearchQuery(text='alpha test', top_k=2, rerank=False)
    resp = _run(engine.search(query))

    assert resp.total_results >= 1
    assert resp.results[0].content in ('alpha', 'beta')
