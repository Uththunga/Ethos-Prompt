import asyncio
from typing import List

from src.rag.embedding_service import EmbeddingService


def _run(coro):
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)


class DummyUsage:
    def __init__(self, total_tokens: int):
        self.total_tokens = total_tokens


class DummyData:
    def __init__(self, embedding_len: int):
        self.embedding = [0.1] * embedding_len


class DummyResponse:
    def __init__(self, n: int, embedding_len: int, total_tokens: int):
        self.data = [DummyData(embedding_len) for _ in range(n)]
        self.usage = DummyUsage(total_tokens)


class FailingOnceEmbeddings:
    def __init__(self, response):
        self._response = response
        self._calls = 0

    def create(self, input: List[str], model: str):  # noqa: A002
        self._calls += 1
        if self._calls == 1:
            raise RuntimeError("Transient failure")
        return self._response


class DummyOpenAIClient:
    def __init__(self, response):
        self.embeddings = FailingOnceEmbeddings(response)


def test_openai_batch_retry_and_process(monkeypatch):
    # Create a service configured for openai provider
    svc = EmbeddingService(provider='openai', api_key='dummy')
    svc.rate_limit_rps = 1000.0  # effectively no real wait

    # Patch the openai client with our dummy
    response = DummyResponse(n=2, embedding_len=1536, total_tokens=200)
    svc.openai_client = DummyOpenAIClient(response)

    # Avoid actual sleeping during retry backoff
    sleeps = []

    async def fake_sleep(t):
        sleeps.append(t)
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep, raising=True)

    texts = ["hello", "world"]
    res = _run(svc.generate_batch_embeddings(texts, model='text-embedding-3-small'))

    assert len(res.results) == 2
    # Should have slept at least once due to retry
    assert any(s >= svc.retry_delay for s in sleeps)
    # Embeddings should be of expected sizes and not cached
    assert all(r.dimensions in (768, 1536) for r in res.results)
    assert all(r.cached is False for r in res.results)

