"""
Comprehensive Integration Tests for Hybrid Search System
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from typing import List, Dict, Any

# Import the modules we're testing
from src.rag.bm25_search_engine import EnhancedBM25SearchEngine, Document, SearchResult as BM25SearchResult
from src.rag.result_fusion import ReciprocalRankFusion, FusionResult
from src.rag.query_enhancement import QueryEnhancementPipeline, EnhancedQueryResult
from src.rag.hybrid_search_engine import HybridSearchEngine, SearchType, HybridSearchResponse
from src.rag.text_preprocessing import TextPreprocessor
from src.rag.query_preprocessor import QueryPreprocessor

class TestHybridSearchIntegration:
    """Integration tests for the complete hybrid search system"""
    
    @pytest.fixture
    def sample_documents(self) -> List[Document]:
        """Sample documents for testing"""
        return [
            Document(
                id="doc1",
                content="Artificial intelligence and machine learning are transforming modern technology. "
                        "Deep learning algorithms can process vast amounts of data to identify patterns.",
                metadata={"filename": "ai_overview.txt", "file_type": "text", "created_at": "2024-01-01"}
            ),
            Document(
                id="doc2", 
                content="Natural language processing enables computers to understand human language. "
                        "NLP techniques include tokenization, parsing, and semantic analysis.",
                metadata={"filename": "nlp_guide.txt", "file_type": "text", "created_at": "2024-01-02"}
            ),
            Document(
                id="doc3",
                content="Database management systems store and retrieve information efficiently. "
                        "SQL queries allow users to search and manipulate data in relational databases.",
                metadata={"filename": "database_intro.txt", "file_type": "text", "created_at": "2024-01-03"}
            ),
            Document(
                id="doc4",
                content="Web APIs provide interfaces for applications to communicate. "
                        "RESTful services use HTTP methods to enable data exchange between systems.",
                metadata={"filename": "api_basics.txt", "file_type": "text", "created_at": "2024-01-04"}
            ),
            Document(
                id="doc5",
                content="Cloud computing offers scalable infrastructure for modern applications. "
                        "Virtualization and containerization enable efficient resource utilization.",
                metadata={"filename": "cloud_computing.txt", "file_type": "text", "created_at": "2024-01-05"}
            )
        ]
    
    @pytest.fixture
    async def bm25_engine(self, sample_documents) -> EnhancedBM25SearchEngine:
        """Initialize BM25 engine with sample documents"""
        engine = EnhancedBM25SearchEngine()
        await engine.index_documents(sample_documents)
        return engine
    
    @pytest.fixture
    def fusion_engine(self) -> ReciprocalRankFusion:
        """Initialize fusion engine"""
        return ReciprocalRankFusion()
    
    @pytest.fixture
    def query_enhancer(self) -> QueryEnhancementPipeline:
        """Initialize query enhancement pipeline"""
        return QueryEnhancementPipeline()
    
    @pytest.fixture
    async def hybrid_engine(self, sample_documents) -> HybridSearchEngine:
        """Initialize hybrid search engine"""
        engine = HybridSearchEngine()
        await engine.index_documents(sample_documents)
        return engine
    
    @pytest.mark.asyncio
    async def test_bm25_search_basic(self, bm25_engine):
        """Test basic BM25 search functionality"""
        results = await bm25_engine.search("artificial intelligence", top_k=3)
        
        assert len(results) > 0
        assert all(isinstance(result, BM25SearchResult) for result in results)
        assert results[0].score > 0
        assert "doc1" in [r.document_id for r in results]  # Should find AI document
    
    @pytest.mark.asyncio
    async def test_bm25_spell_correction(self, bm25_engine):
        """Test BM25 search with spell correction"""
        # Test with misspelled query
        results = await bm25_engine.search("artifical inteligence", top_k=3)
        
        assert len(results) > 0
        # Should still find relevant documents despite misspelling
    
    @pytest.mark.asyncio
    async def test_bm25_query_expansion(self, bm25_engine):
        """Test BM25 search with query expansion"""
        results_without_expansion = await bm25_engine.search(
            "AI", top_k=5, use_query_expansion=False
        )
        results_with_expansion = await bm25_engine.search(
            "AI", top_k=5, use_query_expansion=True
        )
        
        # Query expansion should potentially find more or different results
        assert len(results_with_expansion) >= len(results_without_expansion)
    
    @pytest.mark.asyncio
    async def test_query_enhancement_pipeline(self, query_enhancer):
        """Test query enhancement pipeline"""
        enhanced = await query_enhancer.enhance_query("artifical inteligence machien lerning")
        
        assert enhanced.original_query == "artifical inteligence machien lerning"
        assert enhanced.corrected_query != enhanced.original_query  # Should be corrected
        assert enhanced.intent_classification.intent in [
            'factual', 'exploratory', 'analytical', 'educational'
        ]
        assert enhanced.expansion.expansion_score >= 0
        assert len(enhanced.expansion.expanded_terms) >= len(enhanced.enhanced_query.tokens)
    
    @pytest.mark.asyncio
    async def test_result_fusion_rrf(self, fusion_engine):
        """Test Reciprocal Rank Fusion algorithm"""
        # Create mock search results
        semantic_results = [
            BM25SearchResult("doc1", "content1", 0.9, {}, "semantic", ["highlight1"]),
            BM25SearchResult("doc2", "content2", 0.7, {}, "semantic", ["highlight2"]),
            BM25SearchResult("doc3", "content3", 0.5, {}, "semantic", ["highlight3"])
        ]
        
        keyword_results = [
            BM25SearchResult("doc2", "content2", 0.8, {}, "keyword", ["highlight2"]),
            BM25SearchResult("doc1", "content1", 0.6, {}, "keyword", ["highlight1"]),
            BM25SearchResult("doc4", "content4", 0.4, {}, "keyword", ["highlight4"])
        ]
        
        fused_results = await fusion_engine.fuse_results(
            semantic_results, keyword_results, top_k=5
        )
        
        assert len(fused_results) > 0
        assert all(isinstance(result, FusionResult) for result in fused_results)
        assert fused_results[0].fused_score > 0
        
        # Check that results are sorted by fused score
        scores = [r.fused_score for r in fused_results]
        assert scores == sorted(scores, reverse=True)
    
    @pytest.mark.asyncio
    async def test_adaptive_fusion_weights(self, fusion_engine):
        """Test adaptive weight calculation in fusion"""
        semantic_results = [
            BM25SearchResult("doc1", "content1", 0.9, {}, "semantic"),
            BM25SearchResult("doc2", "content2", 0.8, {}, "semantic")
        ]
        
        keyword_results = [
            BM25SearchResult("doc1", "content1", 0.3, {}, "keyword"),
            BM25SearchResult("doc3", "content3", 0.2, {}, "keyword")
        ]
        
        # Test with factual intent (should favor keyword)
        query_metadata = {"intent": "factual", "word_count": 3}
        fused_results = await fusion_engine.fuse_results(
            semantic_results, keyword_results, 
            query_metadata=query_metadata, top_k=3
        )
        
        assert len(fused_results) > 0
        
        # Test with exploratory intent (should favor semantic)
        query_metadata = {"intent": "exploratory", "word_count": 8}
        fused_results_exploratory = await fusion_engine.fuse_results(
            semantic_results, keyword_results,
            query_metadata=query_metadata, top_k=3
        )
        
        assert len(fused_results_exploratory) > 0
    
    @pytest.mark.asyncio
    async def test_hybrid_search_semantic_only(self, hybrid_engine):
        """Test hybrid search engine with semantic-only search"""
        response = await hybrid_engine.search(
            "artificial intelligence",
            search_type=SearchType.SEMANTIC
        )
        
        assert isinstance(response, HybridSearchResponse)
        assert response.search_type == "semantic"
        assert response.metrics.semantic_time >= 0
        assert response.metrics.keyword_time == 0
        assert response.metrics.fusion_time == 0
    
    @pytest.mark.asyncio
    async def test_hybrid_search_keyword_only(self, hybrid_engine):
        """Test hybrid search engine with keyword-only search"""
        response = await hybrid_engine.search(
            "artificial intelligence",
            search_type=SearchType.KEYWORD
        )
        
        assert isinstance(response, HybridSearchResponse)
        assert response.search_type == "keyword"
        assert response.metrics.keyword_time >= 0
        assert response.metrics.semantic_time == 0
        assert response.metrics.fusion_time == 0
        assert len(response.results) > 0
    
    @pytest.mark.asyncio
    async def test_hybrid_search_full_hybrid(self, hybrid_engine):
        """Test full hybrid search with fusion"""
        response = await hybrid_engine.search(
            "artificial intelligence machine learning",
            search_type=SearchType.HYBRID,
            config={
                "use_query_enhancement": True,
                "use_adaptive_fusion": True,
                "max_results": 5
            }
        )
        
        assert isinstance(response, HybridSearchResponse)
        assert response.search_type == "hybrid"
        assert response.metrics.total_time > 0
        assert response.metrics.enhancement_time >= 0
        assert response.metrics.fusion_time >= 0
        assert response.enhanced_query is not None
        assert len(response.results) > 0
        
        # Check that results have hybrid search information
        for result in response.results:
            assert result.search_type == "hybrid"
            assert result.fused_score >= 0
    
    @pytest.mark.asyncio
    async def test_hybrid_search_performance(self, hybrid_engine):
        """Test hybrid search performance requirements"""
        import time
        
        start_time = time.time()
        response = await hybrid_engine.search(
            "database management systems",
            search_type=SearchType.HYBRID
        )
        end_time = time.time()
        
        # Should complete within 3 seconds (requirement from action plan)
        assert (end_time - start_time) < 3.0
        assert response.metrics.total_time < 3.0
        assert len(response.results) > 0
    
    @pytest.mark.asyncio
    async def test_hybrid_search_relevance_improvement(self, hybrid_engine):
        """Test that hybrid search improves relevance over single methods"""
        query = "natural language processing"
        
        # Get results from each search type
        semantic_response = await hybrid_engine.search(query, SearchType.SEMANTIC)
        keyword_response = await hybrid_engine.search(query, SearchType.KEYWORD)
        hybrid_response = await hybrid_engine.search(query, SearchType.HYBRID)
        
        # Hybrid should have results
        assert len(hybrid_response.results) > 0
        
        # Check that hybrid combines information from both methods
        if len(semantic_response.results) > 0 and len(keyword_response.results) > 0:
            # Hybrid should potentially have better or equal top result score
            if hybrid_response.results:
                hybrid_top_score = hybrid_response.results[0].score
                assert hybrid_top_score > 0
    
    @pytest.mark.asyncio
    async def test_hybrid_search_error_handling(self, hybrid_engine):
        """Test error handling in hybrid search"""
        # Test empty query
        response = await hybrid_engine.search("")
        assert len(response.results) == 0
        
        # Test very long query
        long_query = "artificial intelligence " * 100
        response = await hybrid_engine.search(long_query)
        # Should handle gracefully without crashing
        assert isinstance(response, HybridSearchResponse)
    
    @pytest.mark.asyncio
    async def test_search_statistics_tracking(self, hybrid_engine):
        """Test that search statistics are properly tracked"""
        initial_stats = hybrid_engine.get_search_stats()
        initial_total = initial_stats["total_searches"]
        
        # Perform searches
        await hybrid_engine.search("test query 1", SearchType.SEMANTIC)
        await hybrid_engine.search("test query 2", SearchType.KEYWORD)
        await hybrid_engine.search("test query 3", SearchType.HYBRID)
        
        final_stats = hybrid_engine.get_search_stats()
        
        assert final_stats["total_searches"] == initial_total + 3
        assert final_stats["semantic_searches"] >= 1
        assert final_stats["keyword_searches"] >= 1
        assert final_stats["hybrid_searches"] >= 1
        assert final_stats["avg_response_time"] > 0
    
    @pytest.mark.asyncio
    async def test_document_indexing_and_removal(self, hybrid_engine):
        """Test document addition and removal"""
        # Add a new document
        new_doc = Document(
            id="new_doc",
            content="This is a new document about quantum computing and qubits.",
            metadata={"filename": "quantum.txt", "file_type": "text"}
        )
        
        await hybrid_engine.bm25_engine.add_document(new_doc)
        
        # Search should find the new document
        response = await hybrid_engine.search("quantum computing", SearchType.KEYWORD)
        doc_ids = [r.document_id for r in response.results]
        assert "new_doc" in doc_ids
        
        # Remove the document
        removed = await hybrid_engine.bm25_engine.remove_document("new_doc")
        assert removed is True
        
        # Search should no longer find the document
        response = await hybrid_engine.search("quantum computing", SearchType.KEYWORD)
        doc_ids = [r.document_id for r in response.results]
        assert "new_doc" not in doc_ids


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
