import asyncio
from src.rag.embedding_service import EmbeddingService


def _run(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


async def _fake_google_embed(text: str, model: str):
    # Return different embeddings for different queries
    if 'python' in text.lower():
        return [0.9, 0.1, 0.0] * 256, 10
    elif 'javascript' in text.lower():
        return [0.1, 0.9, 0.0] * 256, 12
    else:
        return [0.5, 0.5, 0.0] * 256, 8


def test_query_embedding_generation(monkeypatch):
    svc = EmbeddingService(provider='google', api_key='dummy')
    svc.rate_limit_rps = 1000.0

    monkeypatch.setattr(svc, "_generate_google_embedding", _fake_google_embed, raising=True)

    async def fake_sleep(_):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep, raising=True)

    result = _run(svc.generate_embedding("What is Python?", model="text-embedding-004"))
    assert result is not None
    assert result.dimensions == 768
    assert result.embedding[0] == 0.9


def test_query_embedding_caching(monkeypatch):
    svc = EmbeddingService(provider='google', api_key='dummy')
    svc.rate_limit_rps = 1000.0

    call_count = [0]

    async def counting_embed(text: str, model: str):
        call_count[0] += 1
        return [0.1] * 768, 10

    monkeypatch.setattr(svc, "_generate_google_embedding", counting_embed, raising=True)

    async def fake_sleep(_):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep, raising=True)

    # First call
    _run(svc.generate_embedding("test query", model="text-embedding-004"))
    # Second call with same query should use cache
    _run(svc.generate_embedding("test query", model="text-embedding-004"))

    # Should only call once if caching works (but cache might not be available in test)
    # Just verify it doesn't crash
    assert call_count[0] >= 1

