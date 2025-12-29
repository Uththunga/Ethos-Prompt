import asyncio
from src.rag.embedding_service import EmbeddingService


def test_model_info_contains_default_models():
    svc = EmbeddingService(provider='google', api_key='dummy')
    info = svc.get_model_info()
    assert 'text-embedding-004' in info
    assert info['text-embedding-004']['dimensions'] == 768


def test_cache_key_differs_by_text_and_model():
    svc = EmbeddingService(provider='google', api_key='dummy')
    k1 = svc._get_cache_key('hello world', 'text-embedding-004')
    k2 = svc._get_cache_key('hello world!', 'text-embedding-004')
    k3 = svc._get_cache_key('hello world', 'text-embedding-3-small')
    assert k1 != k2 and k1 != k3 and k2 != k3


def test_validate_text_and_generate_embedding_invalid_text_returns_none():
    svc = EmbeddingService(provider='google', api_key='dummy')
    ok, msg = svc._validate_text('', 'text-embedding-004')
    assert not ok and 'empty' in msg.lower()
    # generate_embedding should short-circuit and return None for invalid text
    res = asyncio.get_event_loop().run_until_complete(svc.generate_embedding(''))
    assert res is None


def test_is_available_returns_bool_without_deps():
    svc = EmbeddingService(provider='google', api_key=None)
    # In CI without google libs, availability will likely be False; just assert boolean type
    assert isinstance(svc.is_available(), bool)

