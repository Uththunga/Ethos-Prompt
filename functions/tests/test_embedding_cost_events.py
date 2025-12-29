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
    return [0.1] * 768, 42


def test_cost_event_emitted_on_single_embedding(monkeypatch):
    svc = EmbeddingService(provider='google', api_key='dummy')
    svc.rate_limit_rps = 1000.0

    events = []

    def capture_event(event_type, data):
        events.append((event_type, data))

    svc.set_cost_handler(capture_event)
    monkeypatch.setattr(svc, "_generate_google_embedding", _fake_google_embed, raising=True)

    async def fake_sleep(_):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep, raising=True)

    _run(svc.generate_embedding("hello", model="text-embedding-004"))

    assert len(events) == 1
    assert events[0][0] == 'embedding_generated'
    assert 'cost' in events[0][1]
    assert events[0][1]['tokens'] == 42


def test_cost_event_emitted_on_batch_embeddings(monkeypatch):
    svc = EmbeddingService(provider='google', api_key='dummy')
    svc.rate_limit_rps = 1000.0

    events = []

    def capture_event(event_type, data):
        events.append((event_type, data))

    svc.set_cost_handler(capture_event)
    monkeypatch.setattr(svc, "_generate_google_embedding", _fake_google_embed, raising=True)

    async def fake_sleep(_):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep, raising=True)

    _run(svc.generate_batch_embeddings(["hello", "world"], model="text-embedding-004"))

    # Batch path emits per-item events inside generate_embedding calls + 1 batch event
    # But in batch path we call _generate_google_embedding directly, not generate_embedding
    # So we only get the batch event
    assert len(events) >= 1
    batch_events = [e for e in events if e[0] == 'batch_embeddings_generated']
    assert len(batch_events) == 1
    assert 'total_cost' in batch_events[0][1]
    assert batch_events[0][1]['success_count'] == 2
