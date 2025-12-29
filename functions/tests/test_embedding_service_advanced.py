import asyncio
from typing import List
import types

from src.rag.embedding_service import EmbeddingService


def _run(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


async def _fake_google_embed(text: str, model: str):
    # Return a 768-dim non-zero vector and a token count
    return [0.1] * 768, 42


def test_rate_limit_invokes_sleep_for_back_to_back_calls(monkeypatch):
    svc = EmbeddingService(provider='google', api_key='dummy')
    svc.rate_limit_rps = 1.0  # 1 request per second

    # capture sleeps
    sleeps: List[float] = []

    async def fake_sleep(t):
        sleeps.append(t)
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep, raising=True)
    monkeypatch.setattr(svc, "_generate_google_embedding", _fake_google_embed, raising=True)

    # First call: no prior wait expected
    _run(svc.generate_embedding("hello", model="text-embedding-004"))
    # Second immediate call should request a positive sleep via limiter
    _run(svc.generate_embedding("world", model="text-embedding-004"))

    assert any(s > 0 for s in sleeps)


def test_validate_embedding_dimensions_and_nonzero():
    svc = EmbeddingService(provider='google', api_key='dummy')
    ok = svc.validate_embedding([0.1] * 768, model="text-embedding-004")
    bad = svc.validate_embedding([0.0] * 10, model="text-embedding-004")
    assert ok["ok"] is True and ok["length"] == 768
    assert bad["ok"] is False and bad["expected"] == 768


def test_estimate_cost_for_texts_uses_model_pricing():
    svc = EmbeddingService(provider='google', api_key='dummy')
    texts = ["a" * 4000, "b" * 2000]  # ~1000 + 500 tokens
    cost = svc.estimate_cost_for_texts(texts, model="text-embedding-004")
    # With cost_per_1k_tokens=1e-5, expected ~0.000015
    assert 0.0 < cost < 0.00005


def test_batch_embeddings_mixed_cache(monkeypatch):
    svc = EmbeddingService(provider='google', api_key='dummy')

    # First text cached, second uncached
    def fake_get_cached(text, model):
        return [0.2] * 768 if text == "cached" else None

    cached_writes = []
    def fake_cache(text, model, emb):
        cached_writes.append((text, len(emb)))

    monkeypatch.setattr(svc, "_get_cached_embedding", fake_get_cached, raising=True)
    monkeypatch.setattr(svc, "_cache_embedding", fake_cache, raising=True)
    monkeypatch.setattr(svc, "_generate_google_embedding", _fake_google_embed, raising=True)

    res = _run(svc.generate_batch_embeddings(["cached", "fresh"], model="text-embedding-004"))
    assert len(res.results) == 2
    # One cached, one not
    assert sum(1 for r in res.results if r.cached) == 1
    assert sum(1 for r in res.results if not r.cached) == 1
    # Cache should be written for uncached
    assert any(t == "fresh" and l == 768 for (t, l) in cached_writes)

