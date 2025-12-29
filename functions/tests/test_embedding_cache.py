from src.rag.embedding_service import EmbeddingService

class FakeRedis:
    def __init__(self):
        self.store = {}
        self._info = {
            'used_memory_human': '1K',
            'connected_clients': 1,
            'total_commands_processed': 3,
            'keyspace_hits': 1,
            'keyspace_misses': 0,
        }
    def get(self, key):
        return self.store.get(key)
    def setex(self, key, ttl, value):
        self.store[key] = value
    def info(self):
        return self._info
    def keys(self, pattern):
        # simple: return all keys for test
        return list(self.store.keys())
    def delete(self, *keys):
        for k in keys:
            self.store.pop(k, None)


def test_cache_read_write_and_stats():
    svc = EmbeddingService(provider='google', api_key='dummy')
    svc.redis_client = FakeRedis()

    text = 'cache me'
    model = 'text-embedding-004'
    emb = [0.1] * 768

    assert svc._get_cached_embedding(text, model) is None
    svc._cache_embedding(text, model, emb)
    cached = svc._get_cached_embedding(text, model)
    assert cached == emb

    stats = svc.get_cache_stats()
    assert stats['cache_available'] is True
    assert 'used_memory' in stats


def test_clear_cache():
    svc = EmbeddingService(provider='google', api_key='dummy')
    svc.redis_client = FakeRedis()

    text = 'to clear'
    model = 'text-embedding-004'
    emb = [0.2] * 768

    svc._cache_embedding(text, model, emb)
    assert svc._get_cached_embedding(text, model) == emb

    assert svc.clear_cache() is True
    # After clear, cache miss
    assert svc._get_cached_embedding(text, model) is None

