import pytest
from src.ai_agent.marketing.rag_quality_metrics import RAGQualityMetrics

def test_mrr_first_relevant():
    metrics = RAGQualityMetrics()
    results = [{"document_id": "doc1"}, {"document_id": "doc2"}, {"document_id": "doc3"}]
    # relevant_doc_ids is a set or list of IDs considered relevant
    mrr = metrics.calculate_mrr(results, ["doc1"])
    assert mrr == 1.0  # First result is relevant

def test_mrr_second_relevant():
    metrics = RAGQualityMetrics()
    results = [{"document_id": "doc1"}, {"document_id": "doc2"}, {"document_id": "doc3"}]
    mrr = metrics.calculate_mrr(results, ["doc2"])
    assert mrr == 0.5  # Second result

def test_mrr_none_relevant():
    metrics = RAGQualityMetrics()
    results = [{"document_id": "doc1"}, {"document_id": "doc2"}]
    mrr = metrics.calculate_mrr(results, ["doc3"])
    assert mrr == 0.0

def test_ndcg_perfect():
    metrics = RAGQualityMetrics()
    results = [{"document_id": "a"}, {"document_id": "b"}, {"document_id": "c"}]
    relevance_scores = {"a": 3.0, "b": 2.0, "c": 1.0}  # Perfect order
    ndcg = metrics.calculate_ndcg(results, relevance_scores, k=3)
    assert ndcg == 1.0

def test_ndcg_unordered():
    metrics = RAGQualityMetrics()
    results = [{"document_id": "c"}, {"document_id": "a"}, {"document_id": "b"}]
    relevance_scores = {"a": 3.0, "b": 2.0, "c": 1.0}
    # Ideal: a(3), b(2), c(1)
    # Actual: c(1), a(3), b(2)
    ndcg = metrics.calculate_ndcg(results, relevance_scores, k=3)
    assert ndcg < 1.0
    assert ndcg > 0.0
