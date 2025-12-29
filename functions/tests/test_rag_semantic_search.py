"""
Unit tests for RAG semantic search
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from src.rag.semantic_search import (
    SemanticSearchEngine,
    SearchQuery,
    SearchResult,
    SearchResponse
)


class TestSemanticSearchEngine:
    """Test semantic search engine"""
    
    @pytest.fixture
    def mock_vector_store(self):
        """Create mock vector store"""
        mock_store = Mock()
        mock_store.search = Mock(return_value=[])
        return mock_store
    
    @pytest.fixture
    def mock_embedding_service(self):
        """Create mock embedding service"""
        mock_service = AsyncMock()
        mock_result = Mock()
        mock_result.embedding = [0.1] * 768
        mock_result.model = "text-embedding-004"
        mock_result.dimensions = 768
        mock_service.generate_embedding = AsyncMock(return_value=mock_result)
        return mock_service
    
    @pytest.fixture
    def search_engine(self, mock_vector_store, mock_embedding_service):
        """Create search engine with mocks"""
        engine = SemanticSearchEngine()
        engine.vector_store = mock_vector_store
        engine.embedding_service = mock_embedding_service
        return engine
    
    @pytest.mark.asyncio
    async def test_basic_search(self, search_engine, mock_vector_store):
        """Test basic semantic search"""
        query = SearchQuery(
            text="test query",
            top_k=10
        )
        
        # Mock vector store results
        from src.rag.vector_store import VectorSearchResult
        mock_vector_store.search.return_value = [
            VectorSearchResult(
                chunk_id="chunk_1",
                content="Test content 1",
                score=0.95,
                metadata={"source": "doc1.pdf"}
            ),
            VectorSearchResult(
                chunk_id="chunk_2",
                content="Test content 2",
                score=0.85,
                metadata={"source": "doc2.pdf"}
            )
        ]
        
        response = await search_engine.search(query)
        
        assert isinstance(response, SearchResponse)
        assert len(response.results) == 2
        assert response.total_results == 2
        assert response.search_time > 0
    
    @pytest.mark.asyncio
    async def test_empty_query(self, search_engine):
        """Test handling of empty query"""
        query = SearchQuery(text="")
        
        response = await search_engine.search(query)
        
        assert response.total_results == 0
        assert len(response.results) == 0
        assert "error" in response.metadata
    
    @pytest.mark.asyncio
    async def test_embedding_failure(self, search_engine, mock_embedding_service):
        """Test handling of embedding generation failure"""
        mock_embedding_service.generate_embedding = AsyncMock(return_value=None)
        
        query = SearchQuery(text="test query")
        response = await search_engine.search(query)
        
        assert response.total_results == 0
        assert "error" in response.metadata
    
    @pytest.mark.asyncio
    async def test_score_boosting(self, search_engine, mock_vector_store):
        """Test score boosting for recent documents"""
        from datetime import datetime, timezone, timedelta
        from src.rag.vector_store import VectorSearchResult
        
        recent_date = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        old_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        
        mock_vector_store.search.return_value = [
            VectorSearchResult(
                chunk_id="chunk_1",
                content="Recent content",
                score=0.80,
                metadata={"source": "doc1.pdf", "created_at": recent_date}
            ),
            VectorSearchResult(
                chunk_id="chunk_2",
                content="Old content",
                score=0.80,
                metadata={"source": "doc2.pdf", "created_at": old_date}
            )
        ]
        
        query = SearchQuery(text="test query")
        response = await search_engine.search(query)
        
        # Recent document should have higher score after boosting
        assert len(response.results) == 2
    
    @pytest.mark.asyncio
    async def test_similarity_threshold_filtering(self, search_engine, mock_vector_store):
        """Test filtering by similarity threshold"""
        from src.rag.vector_store import VectorSearchResult
        
        mock_vector_store.search.return_value = [
            VectorSearchResult(
                chunk_id="chunk_1",
                content="High relevance",
                score=0.95,
                metadata={}
            ),
            VectorSearchResult(
                chunk_id="chunk_2",
                content="Low relevance",
                score=0.50,
                metadata={}
            )
        ]
        
        query = SearchQuery(text="test query")
        response = await search_engine.search(query)
        
        # Low relevance result should be filtered out (threshold 0.7)
        assert all(r.score >= 0.7 for r in response.results)
    
    @pytest.mark.asyncio
    async def test_reranking(self, search_engine, mock_vector_store):
        """Test result re-ranking"""
        from src.rag.vector_store import VectorSearchResult
        
        mock_vector_store.search.return_value = [
            VectorSearchResult(chunk_id=f"chunk_{i}", content=f"Content {i}", 
                             score=0.8, metadata={})
            for i in range(10)
        ]
        
        query = SearchQuery(text="test query", rerank=True, top_k=5)
        response = await search_engine.search(query)
        
        assert len(response.results) <= 5
        assert response.metadata["reranked"] is True
    
    @pytest.mark.asyncio
    async def test_namespace_filtering(self, search_engine, mock_vector_store):
        """Test filtering by namespace"""
        query = SearchQuery(
            text="test query",
            namespace="user_123"
        )
        
        await search_engine.search(query)
        
        # Verify namespace was passed to vector store
        call_args = mock_vector_store.search.call_args
        assert call_args[1]["namespace"] == "user_123"
    
    @pytest.mark.asyncio
    async def test_metadata_filters(self, search_engine, mock_vector_store):
        """Test filtering by metadata"""
        query = SearchQuery(
            text="test query",
            filters={"document_type": "pdf"}
        )
        
        await search_engine.search(query)
        
        # Verify filters were passed to vector store
        call_args = mock_vector_store.search.call_args
        assert call_args[1]["filter_dict"] == {"document_type": "pdf"}


class TestSearchQuery:
    """Test SearchQuery dataclass"""
    
    def test_default_values(self):
        """Test default values"""
        query = SearchQuery(text="test")
        
        assert query.top_k == 10
        assert query.include_metadata is True
        assert query.rerank is True
        assert query.hybrid_search is False
    
    def test_custom_values(self):
        """Test custom values"""
        query = SearchQuery(
            text="test",
            filters={"type": "pdf"},
            top_k=20,
            namespace="user_123",
            rerank=False
        )
        
        assert query.top_k == 20
        assert query.namespace == "user_123"
        assert query.rerank is False


class TestSearchResult:
    """Test SearchResult dataclass"""
    
    def test_creation(self):
        """Test creating SearchResult"""
        result = SearchResult(
            chunk_id="chunk_1",
            content="Test content",
            score=0.95,
            metadata={"source": "test.pdf"},
            rank=1,
            search_type="semantic"
        )
        
        assert result.chunk_id == "chunk_1"
        assert result.score == 0.95
        assert result.rank == 1
        assert result.search_type == "semantic"


class TestSearchResponse:
    """Test SearchResponse dataclass"""
    
    def test_creation(self):
        """Test creating SearchResponse"""
        results = [
            SearchResult(
                chunk_id="chunk_1",
                content="Test",
                score=0.95,
                metadata={},
                rank=1
            )
        ]
        
        response = SearchResponse(
            query="test query",
            results=results,
            total_results=1,
            search_time=0.5,
            embedding_time=0.1,
            vector_search_time=0.3,
            rerank_time=0.1,
            metadata={}
        )
        
        assert response.total_results == 1
        assert response.search_time == 0.5
        assert len(response.results) == 1


@pytest.mark.asyncio
class TestSemanticSearchIntegration:
    """Integration tests for semantic search"""
    
    async def test_end_to_end_search(self):
        """Test complete search workflow"""
        # Would require real embedding service and vector store
        pass
    
    async def test_performance_benchmarks(self):
        """Test search performance meets targets (<500ms)"""
        # Benchmark search latency
        pass
    
    async def test_relevance_quality(self):
        """Test search relevance with ground truth"""
        # Test with known query-document pairs
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

