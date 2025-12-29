from src.rag.embedding_service import EmbeddingService

def test_estimate_batch_cost_rough_bounds():
    svc = EmbeddingService(provider='google', api_key='dummy')
    texts = ["a" * 4000, "b" * 8000, "c" * 2000]  # ~1000 + 2000 + 500 tokens
    cost = svc.estimate_batch_cost(texts, model='text-embedding-004')
    # With cost_per_1k_tokens=1e-5, expected around 0.000035
    assert 0.0 < cost < 0.0001

