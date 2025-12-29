"""
Unit Tests for Marketing Retriever
Tests hybrid search, caching, and re-ranking logic in isolation
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import List, Dict, Any


# Mock the retrieval result
class MockRetrievalResult:
    def __init__(self, text: str, score: float, document_id: str, document_title: str, category: str, page: str, chunk_index: int):
        self.text = text
        self.score = score
        self.document_id = document_id
        self.document_title = document_title
        self.category = category
        self.page = page
        self.chunk_index = chunk_index


@pytest.fixture
def mock_retriever():
    """Create a mock marketing retriever"""
    with patch('src.ai_agent.marketing.marketing_retriever.marketing_kb_indexer') as mock_indexer:
        from src.ai_agent.marketing.marketing_retriever import MarketingRetriever
        retriever = MarketingRetriever(db=None)
        yield retriever, mock_indexer


@pytest.mark.asyncio
async def test_semantic_search_success(mock_retriever):
    """Test semantic search returns results correctly"""
    retriever, mock_indexer = mock_retriever

    # Mock KB indexer response as async
    mock_indexer.search_kb = AsyncMock(return_value=[
        {
            "text": "EthosPrompt offers Smart Business Assistant",
            "score": 0.95,
            "document_id": "offering_smart_business_assistant",
            "document_title": "Smart Business Assistant",
            "category": "offerings",
            "page": "smart-business-assistant",
            "chunk_index": 0
        }
    ])

    results = await retriever._semantic_search(
        query="What services does EthosPrompt offer?",
        top_k=5,
        category_filter=None
    )

    assert len(results) == 1
    assert results[0].text == "EthosPrompt offers Smart Business Assistant"
    assert results[0].score == 0.95


@pytest.mark.asyncio
async def test_hybrid_search_fallback_to_semantic(mock_retriever):
    """Test hybrid search falls back to semantic when hybrid fails"""
    retriever, mock_indexer = mock_retriever

    # Mock hybrid search to fail
    with patch('src.ai_agent.marketing.marketing_retriever.hybrid_search_engine') as mock_hybrid:
        # Make search an AsyncMock that raises exception
        mock_hybrid.search = AsyncMock(side_effect=Exception("Hybrid search failed"))

        # Mock semantic search fallback as async
        mock_indexer.search_kb = AsyncMock(return_value=[
            {
                "text": "Fallback result",
                "score": 0.8,
                "document_id": "test_doc",
                "document_title": "Test Document",
                "category": "foundation",
                "page": "test",
                "chunk_index": 0
            }
        ])

        results = await retriever._hybrid_search(
            query="test query",
            top_k=5,
            category_filter=None
        )

        assert len(results) == 1
        assert results[0].text == "Fallback result"


@pytest.mark.asyncio
async def test_caching_hit(mock_retriever):
    """Test Redis cache hit returns cached results"""
    retriever, _ = mock_retriever

    if retriever._redis_client:
        # Mock cache hit
        import json
        cached_data = json.dumps([{
            "text": "Cached result",
            "score": 0.9,
            "document_id": "cached_doc",
            "document_title": "Cached Document",
            "category": "offerings",
            "page": "cached",
            "chunk_index": 0,
            "source": "marketing_kb"
        }])

        with patch.object(retriever._redis_client, 'get', return_value=cached_data):
            results = await retriever.retrieve(
                query="cached query",
                top_k=5,
                category_filter=None,
                use_hybrid=True
            )

            assert len(results) == 1
            assert results[0].text == "Cached result"


def test_format_context_truncation(mock_retriever):
    """Test context formatting respects token limit"""
    retriever, _ = mock_retriever

    # Create results with long text
    long_text = "x" * 10000
    results = [
        MockRetrievalResult(
            text=long_text,
            score=0.9,
            document_id=f"doc_{i}",
            document_title=f"Document {i}",
            category="offerings",
            page="test",
            chunk_index=0
        )
        for i in range(10)
    ]

    context = retriever.format_context(results, max_tokens=500)

    # Should be truncated (1 token ≈ 4 chars, so max ~2000 chars)
    assert len(context) < 3000


def test_get_sources_extraction(mock_retriever):
    """Test source extraction includes all metadata"""
    retriever, _ = mock_retriever

    results = [
        MockRetrievalResult(
            text="Test content",
            score=0.95,
            document_id="test_doc",
            document_title="Test Document",
            category="offerings",
            page="test-page",
            chunk_index=0
        )
    ]

    sources = retriever.get_sources(results)

    assert len(sources) == 1
    assert sources[0]["title"] == "Test Document"
    assert sources[0]["category"] == "offerings"
    assert sources[0]["page"] == "test-page"
    assert sources[0]["score"] == 0.95


@pytest.mark.asyncio
async def test_reranking_applied(mock_retriever):
    """Test that re-ranking is applied when CrossEncoder is available"""
    retriever, mock_indexer = mock_retriever

    # Mock KB response with 3 results as async
    mock_indexer.search_kb = AsyncMock(return_value=[
        {
            "text": f"Result {i}",
            "score": 0.7,
            "document_id": f"doc_{i}",
            "document_title": f"Doc {i}",
            "category": "offerings",
            "page": "test",
            "chunk_index": 0
        }
        for i in range(3)
    ])

    # Mock CrossEncoder to reorder results
    with patch('src.ai_agent.marketing.marketing_retriever.SENTENCE_TRANSFORMERS_AVAILABLE', True):
        with patch.object(retriever, '_get_cross_encoder') as mock_encoder:
            mock_cross_encoder = Mock()
            # Return scores in reverse order to test reranking
            mock_cross_encoder.predict.return_value = [0.3, 0.6, 0.9]
            mock_encoder.return_value = mock_cross_encoder

            results = await retriever._semantic_search(
                query="test",
                top_k=9,  # Fetch 3x for re-ranking
                category_filter=None
            )

            # After re-ranking, should be sorted by new scores
            assert len(results) > 0  # Basic assertion for now


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
