import asyncio

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
    def __init__(self, embedding_len: int, total_tokens: int):
        self.data = [DummyData(embedding_len)]
        self.usage = DummyUsage(total_tokens)


class SingleEmbeddings:
    def __init__(self, response):
        self._response = response

    def create(self, input, model: str):  # noqa: A002
        # For single-call path we expect input to be a str
        return self._response


class DummyOpenAIClient:
    def __init__(self, response):
        self.embeddings = SingleEmbeddings(response)


def test_openai_single_generate_embedding(monkeypatch):
    svc = EmbeddingService(provider='openai', api_key='dummy')
    svc.rate_limit_rps = 1000.0

    response = DummyResponse(embedding_len=1536, total_tokens=100)
    svc.openai_client = DummyOpenAIClient(response)

    # Ensure no real sleep
    async def fake_sleep(_):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep, raising=True)

    res = _run(svc.generate_embedding("hello world", model='text-embedding-3-small'))
    assert res is not None
    assert res.dimensions in (768, 1536)
    assert res.cached is False

