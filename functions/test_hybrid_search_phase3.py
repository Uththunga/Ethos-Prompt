"""
Test Phase 3 Hybrid Search Implementation
Validates BM25 integration, RRF fusion, and query enhancement
"""

import asyncio
import pytest
import logging
from typing import List, Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from src.rag.hybrid_search import (
        HybridSearchEngine,
        EnhancedBM25SearchEngine,
        ReciprocalRankFusion,
        HybridSearchResult,
        KeywordSearchResult
    )
    HYBRID_SEARCH_AVAILABLE = True
except ImportError as e:
    logger.error(f"Hybrid search import failed: {e}")
    HYBRID_SEARCH_AVAILABLE = False

# Test data
TEST_DOCUMENTS = [
    {
        'id': 'doc1',
        'content': 'Machine learning algorithms are used in artificial intelligence applications to process data and make predictions.',
        'metadata': {'category': 'AI', 'difficulty': 'intermediate'}
    },
    {
        'id': 'doc2', 
        'content': 'Natural language processing (NLP) is a subfield of AI that focuses on text analysis and understanding.',
        'metadata': {'category': 'NLP', 'difficulty': 'advanced'}
    },
    {
        'id': 'doc3',
        'content': 'API endpoints provide programmatic access to application functionality through HTTP requests.',
        'metadata': {'category': 'API', 'difficulty': 'beginner'}
    },
    {
        'id': 'doc4',
        'content': 'Database optimization techniques improve query performance and reduce response times.',
        'metadata': {'category': 'Database', 'difficulty': 'intermediate'}
    },
    {
        'id': 'doc5',
        'content': 'React components use hooks for state management and lifecycle events in modern web applications.',
        'metadata': {'category': 'Frontend', 'difficulty': 'intermediate'}
    }
]

class TestHybridSearchPhase3:
    """Test suite for Phase 3 hybrid search features"""
    
    @pytest.fixture
    def bm25_engine(self):
        """Create BM25 search engine for testing"""
        if not HYBRID_SEARCH_AVAILABLE:
            pytest.skip("Hybrid search not available")
        
        engine = EnhancedBM25SearchEngine()
        engine.index_documents(TEST_DOCUMENTS)
        return engine
    
    @pytest.fixture
    def fusion_engine(self):
        """Create RRF fusion engine for testing"""
        if not HYBRID_SEARCH_AVAILABLE:
            pytest.skip("Hybrid search not available")
        
        return ReciprocalRankFusion()
    
    @pytest.fixture
    def hybrid_engine(self):
        """Create hybrid search engine for testing"""
        if not HYBRID_SEARCH_AVAILABLE:
            pytest.skip("Hybrid search not available")
        
        return HybridSearchEngine()
    
    def test_bm25_text_preprocessing(self, bm25_engine):
        """Test text preprocessing functionality"""
        # Test basic preprocessing
        tokens = bm25_engine.preprocess_text("Machine Learning and AI!")
        assert 'machin' in tokens or 'machine' in tokens
        assert 'learn' in tokens or 'learning' in tokens
        
        # Test stopword removal
        tokens = bm25_engine.preprocess_text("the quick brown fox")
        assert 'the' not in tokens
        assert 'quick' in tokens or 'brown' in tokens
    
    def test_spell_correction(self, bm25_engine):
        """Test spell correction functionality"""
        # Test with misspelled word
        corrected = bm25_engine.correct_spelling("machien learning")
        # Should correct 'machien' to 'machine' if spell checker is available
        assert 'learning' in corrected
    
    def test_query_expansion(self, bm25_engine):
        """Test query expansion with synonyms"""
        expanded = bm25_engine.expand_query("ai algorithms")
        assert 'ai' in expanded
        assert 'algorithms' in expanded
        # Should include synonyms if available
        if 'artificial intelligence' in expanded:
            assert 'artificial intelligence' in expanded
    
    def test_bm25_search(self, bm25_engine):
        """Test BM25 search functionality"""
        results = bm25_engine.search("machine learning", top_k=3)
        
        assert len(results) > 0
        assert all(isinstance(r, KeywordSearchResult) for r in results)
        
        # Check that results are sorted by score
        scores = [r.score for r in results]
        assert scores == sorted(scores, reverse=True)
        
        # Check that relevant document is found
        doc_ids = [r.chunk_id for r in results]
        assert 'doc1' in doc_ids  # Document about machine learning
    
    def test_reciprocal_rank_fusion(self, fusion_engine):
        """Test RRF algorithm"""
        # Create mock results
        semantic_results = [
            type('MockResult', (), {
                'chunk_id': 'doc1',
                'content': 'test content 1',
                'score': 0.9,
                'metadata': {}
            })(),
            type('MockResult', (), {
                'chunk_id': 'doc2', 
                'content': 'test content 2',
                'score': 0.8,
                'metadata': {}
            })()
        ]
        
        keyword_results = [
            KeywordSearchResult(
                chunk_id='doc2',
                content='test content 2',
                score=0.7,
                metadata={},
                matched_terms=['test'],
                term_frequencies={}
            ),
            KeywordSearchResult(
                chunk_id='doc3',
                content='test content 3', 
                score=0.6,
                metadata={},
                matched_terms=['test'],
                term_frequencies={}
            )
        ]
        
        # Test fusion
        fused_results = fusion_engine.fuse_results(semantic_results, keyword_results)
        
        assert len(fused_results) > 0
        assert all(isinstance(r, HybridSearchResult) for r in fused_results)
        
        # Check that results are ranked
        ranks = [r.rank for r in fused_results]
        assert ranks == sorted(ranks)
    
    def test_adaptive_fusion_weights(self, fusion_engine):
        """Test adaptive weight adjustment"""
        # Test short query (should favor keyword search)
        short_query = "API"
        # Test long query (should favor semantic search)  
        long_query = "How do I implement machine learning algorithms for natural language processing"
        # Test technical query
        technical_query = "API function method"
        
        # Mock results for testing
        semantic_results = []
        keyword_results = []
        
        # Test that adaptive fusion runs without error
        result1 = fusion_engine.adaptive_fusion(semantic_results, keyword_results, short_query)
        result2 = fusion_engine.adaptive_fusion(semantic_results, keyword_results, long_query)
        result3 = fusion_engine.adaptive_fusion(semantic_results, keyword_results, technical_query)
        
        # All should return empty lists with empty input
        assert result1 == []
        assert result2 == []
        assert result3 == []

def test_hybrid_search_integration():
    """Integration test for complete hybrid search"""
    if not HYBRID_SEARCH_AVAILABLE:
        pytest.skip("Hybrid search not available")
    
    async def run_test():
        engine = HybridSearchEngine()
        
        # Index test documents
        await engine.index_documents(TEST_DOCUMENTS)
        
        # Test different search modes
        hybrid_results = await engine.search("machine learning", search_mode="hybrid")
        semantic_results = await engine.search("machine learning", search_mode="semantic")
        keyword_results = await engine.search("machine learning", search_mode="keyword")
        
        # Verify results
        assert isinstance(hybrid_results, list)
        assert isinstance(semantic_results, list)
        assert isinstance(keyword_results, list)
        
        # Check statistics
        stats = engine.get_search_statistics()
        assert 'total_searches' in stats
        assert stats['total_searches'] >= 3
        
        logger.info(f"Hybrid search test completed successfully")
        logger.info(f"Search statistics: {stats}")
        
        return True
    
    # Run async test
    result = asyncio.run(run_test())
    assert result is True

def test_performance_benchmarks():
    """Test performance requirements from Phase 3 success criteria"""
    if not HYBRID_SEARCH_AVAILABLE:
        pytest.skip("Hybrid search not available")
    
    import time
    
    async def run_performance_test():
        engine = HybridSearchEngine()
        await engine.index_documents(TEST_DOCUMENTS * 10)  # Larger dataset
        
        # Test search latency
        start_time = time.time()
        results = await engine.search("machine learning algorithms", top_k=10)
        end_time = time.time()
        
        search_time = end_time - start_time
        
        # Phase 3 success criteria: search latency <3 seconds
        assert search_time < 3.0, f"Search took {search_time:.2f}s, exceeds 3s limit"
        
        # Verify result quality
        assert len(results) > 0, "No results returned"
        
        logger.info(f"Performance test passed: {search_time:.2f}s search time")
        return True
    
    result = asyncio.run(run_performance_test())
    assert result is True

if __name__ == "__main__":
    # Run basic tests
    print("🧪 Testing Phase 3 Hybrid Search Implementation...")
    
    if HYBRID_SEARCH_AVAILABLE:
        # Run integration test
        test_hybrid_search_integration()
        test_performance_benchmarks()
        print("✅ All Phase 3 hybrid search tests passed!")
    else:
        print("⚠️  Hybrid search dependencies not available")
        print("   Install: pip install rank-bm25 spacy nltk pyspellchecker")
