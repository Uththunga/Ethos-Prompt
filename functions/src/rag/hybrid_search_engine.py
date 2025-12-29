"""
Hybrid Search Engine - Orchestrates Semantic + Keyword Search with Intelligent Fusion
"""
import asyncio
import logging
import time
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from .bm25_search_engine import bm25_search_engine, SearchResult as BM25SearchResult, Document
from .semantic_search import SemanticSearchEngine, SearchQuery as SemanticSearchQuery
from .result_fusion import reciprocal_rank_fusion, FusionResult
from .fusion_algorithms import adaptive_fusion
from .query_enhancement import query_enhancement_pipeline, EnhancedQueryResult
from .query_preprocessor import query_preprocessor

logger = logging.getLogger(__name__)

class SearchType(Enum):
    """Search type enumeration"""
    SEMANTIC = "semantic"
    KEYWORD = "keyword"
    HYBRID = "hybrid"

@dataclass
class SearchMetrics:
    """Search performance metrics"""
    total_time: float
    semantic_time: float
    keyword_time: float
    fusion_time: float
    enhancement_time: float
    total_results: int
    semantic_results: int
    keyword_results: int
    fusion_algorithm: str
    query_enhanced: bool

@dataclass
class HybridSearchResult:
    """Hybrid search result with comprehensive metadata"""
    document_id: str
    content: str
    score: float
    semantic_score: float
    keyword_score: float
    fused_score: float
    metadata: Dict[str, Any]
    search_methods: List[str]
    highlights: List[str]
    confidence: float
    rank: int
    search_type: str = "hybrid"

@dataclass
class HybridSearchResponse:
    """Complete hybrid search response"""
    results: List[HybridSearchResult]
    query_info: Dict[str, Any]
    metrics: SearchMetrics
    enhanced_query: Optional[EnhancedQueryResult]
    total_results: int
    search_type: str
    fusion_algorithm: str

class HybridSearchEngine:
    """
    Main hybrid search engine that orchestrates semantic and keyword search
    with intelligent fusion and query enhancement
    """

    def __init__(self):
        """Initialize hybrid search engine"""
        self.bm25_engine = bm25_search_engine
        self.semantic_engine = SemanticSearchEngine()
        self.fusion_engine = reciprocal_rank_fusion
        self.adaptive_fusion = adaptive_fusion
        self.query_enhancer = query_enhancement_pipeline
        self.query_preprocessor = query_preprocessor

        # Search configuration
        self.default_config = {
            "semantic_weight": 0.7,
            "keyword_weight": 0.3,
            "use_adaptive_fusion": True,
            "use_query_enhancement": True,
            "max_results": 10,
            "enable_spell_correction": True,
            "enable_query_expansion": True,
            "fusion_algorithm": "adaptive"  # "rrf", "combsum", "borda", "adaptive"
        }

        # Performance tracking
        self.search_stats = {
            "total_searches": 0,
            "semantic_searches": 0,
            "keyword_searches": 0,
            "hybrid_searches": 0,
            "avg_response_time": 0.0,
            "avg_results_count": 0.0
        }

        logger.info("Hybrid search engine initialized")

    async def index_documents(self, documents: List[Document]) -> None:
        """
        Index documents for both semantic and keyword search

        Args:
            documents: List of documents to index
        """
        logger.info(f"Indexing {len(documents)} documents for hybrid search...")

        # Index for BM25 keyword search
        await self.bm25_engine.index_documents(documents)

        # Note: Semantic search indexing would be handled by the existing vector store
        # This is just for BM25 indexing

        logger.info("Document indexing completed")

    async def _perform_semantic_search(self, query: str, namespace: Optional[str] = None, filters: Optional[Dict[str, Any]] = None, top_k: int = 10) -> Tuple[List[BM25SearchResult], float]:
        """
        Perform semantic search using the integrated semantic search engine

        Args:
            query: Search query
            namespace: User namespace for filtering
            filters: Additional metadata filters
            top_k: Number of results to return

        Returns:
            Tuple of (results, search_time)
        """
        start_time = time.time()

        # Create semantic search query
        semantic_query = SemanticSearchQuery(
            text=query,
            filters=filters,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True,
            rerank=True,
            hybrid_search=False
        )

        # Perform semantic search
        search_response = await self.semantic_engine.search(semantic_query)

        # Convert semantic search results to BM25SearchResult format for fusion
        semantic_results = []
        for result in search_response.results:
            bm25_result = BM25SearchResult(
                document_id=result.chunk_id,
                content=result.content,
                score=result.score,
                metadata=result.metadata,
                rank=result.rank,
                highlights=[]
            )
            semantic_results.append(bm25_result)

        search_time = time.time() - start_time
        return semantic_results, search_time

    async def _perform_keyword_search(self, query: str, enhanced_query: Optional[EnhancedQueryResult] = None,
                                    top_k: int = 10) -> Tuple[List[BM25SearchResult], float]:
        """
        Perform BM25 keyword search

        Args:
            query: Search query
            enhanced_query: Enhanced query result
            top_k: Number of results to return

        Returns:
            Tuple of (results, search_time)
        """
        start_time = time.time()

        # Use enhanced query if available
        search_query = query
        if enhanced_query:
            search_query = enhanced_query.corrected_query

        # Perform BM25 search
        keyword_results = await self.bm25_engine.search(
            query=search_query,
            top_k=top_k,
            use_spell_correction=False,  # Already done in enhancement
            use_query_expansion=True
        )

        search_time = time.time() - start_time
        return keyword_results, search_time

    async def _fuse_results(self, semantic_results: List[BM25SearchResult],
                           keyword_results: List[BM25SearchResult],
                           enhanced_query: Optional[EnhancedQueryResult] = None,
                           config: Optional[Dict[str, Any]] = None) -> Tuple[List[FusionResult], float, str]:
        """
        Fuse semantic and keyword search results

        Args:
            semantic_results: Semantic search results
            keyword_results: Keyword search results
            enhanced_query: Enhanced query result
            config: Search configuration

        Returns:
            Tuple of (fused_results, fusion_time, algorithm_used)
        """
        start_time = time.time()

        if not config:
            config = self.default_config

        # Prepare query metadata for fusion
        query_metadata = {}
        if enhanced_query:
            query_metadata = {
                "intent": enhanced_query.intent_classification.intent,
                "confidence": enhanced_query.intent_classification.confidence,
                "word_count": len(enhanced_query.original_query.split()),
                "enhanced": True
            }

        # Select fusion algorithm
        fusion_algorithm = config.get("fusion_algorithm", "adaptive")

        if fusion_algorithm == "adaptive" and config.get("use_adaptive_fusion", True):
            fused_results = await self.adaptive_fusion.fuse_results(
                semantic_results=semantic_results,
                keyword_results=keyword_results,
                query_metadata=query_metadata,
                top_k=config.get("max_results", 10)
            )
            algorithm_used = "adaptive"
        else:
            # Use RRF as default
            alpha = config.get("semantic_weight", 0.7)
            fused_results = await self.fusion_engine.fuse_results(
                semantic_results=semantic_results,
                keyword_results=keyword_results,
                alpha=alpha,
                query_metadata=query_metadata,
                top_k=config.get("max_results", 10)
            )
            algorithm_used = "rrf"

        fusion_time = time.time() - start_time
        return fused_results, fusion_time, algorithm_used

    async def _enhance_query(self, query: str, config: Optional[Dict[str, Any]] = None) -> Tuple[Optional[EnhancedQueryResult], float]:
        """
        Enhance query with spell correction, expansion, and intent classification

        Args:
            query: Original query
            config: Search configuration

        Returns:
            Tuple of (enhanced_query, enhancement_time)
        """
        if not config:
            config = self.default_config

        if not config.get("use_query_enhancement", True):
            return None, 0.0

        start_time = time.time()

        enhanced_query = await self.query_enhancer.enhance_query(query)

        enhancement_time = time.time() - start_time
        return enhanced_query, enhancement_time

    def _convert_fusion_to_hybrid_results(self, fusion_results: List[FusionResult]) -> List[HybridSearchResult]:
        """
        Convert fusion results to hybrid search results

        Args:
            fusion_results: Fusion results

        Returns:
            List of hybrid search results
        """
        hybrid_results = []

        for i, result in enumerate(fusion_results):
            hybrid_result = HybridSearchResult(
                document_id=result.document_id,
                content=result.content,
                score=result.fused_score,
                semantic_score=result.semantic_score,
                keyword_score=result.keyword_score,
                fused_score=result.fused_score,
                metadata=result.metadata,
                search_methods=result.search_methods,
                highlights=result.highlights,
                confidence=result.confidence,
                rank=i + 1,
                search_type="hybrid"
            )
            hybrid_results.append(hybrid_result)

        return hybrid_results

    async def search(self, query: str, search_type: SearchType = SearchType.HYBRID,
                    config: Optional[Dict[str, Any]] = None) -> HybridSearchResponse:
        """
        Perform hybrid search with intelligent orchestration

        Args:
            query: Search query
            search_type: Type of search to perform
            config: Search configuration

        Returns:
            Hybrid search response
        """
        start_time = time.time()

        if not config:
            config = self.default_config.copy()

        # Update search statistics
        self.search_stats["total_searches"] += 1

        # Step 1: Query enhancement
        enhanced_query, enhancement_time = await self._enhance_query(query, config)

        # Step 2: Perform searches based on type
        semantic_results = []
        keyword_results = []
        semantic_time = 0.0
        keyword_time = 0.0

        if search_type in [SearchType.SEMANTIC, SearchType.HYBRID]:
            semantic_results, semantic_time = await self._perform_semantic_search(
                query, config.get("max_results", 10)
            )
            self.search_stats["semantic_searches"] += 1

        if search_type in [SearchType.KEYWORD, SearchType.HYBRID]:
            keyword_results, keyword_time = await self._perform_keyword_search(
                query, enhanced_query, config.get("max_results", 10)
            )
            self.search_stats["keyword_searches"] += 1

        # Step 3: Fusion (only for hybrid search)
        fusion_time = 0.0
        algorithm_used = "none"

        if search_type == SearchType.HYBRID:
            fused_results, fusion_time, algorithm_used = await self._fuse_results(
                semantic_results, keyword_results, enhanced_query, config
            )
            final_results = self._convert_fusion_to_hybrid_results(fused_results)
            self.search_stats["hybrid_searches"] += 1

        elif search_type == SearchType.SEMANTIC:
            # Convert semantic results to hybrid format
            final_results = [
                HybridSearchResult(
                    document_id=result.document_id,
                    content=result.content,
                    score=result.score,
                    semantic_score=result.score,
                    keyword_score=0.0,
                    fused_score=result.score,
                    metadata=result.metadata,
                    search_methods=["semantic"],
                    highlights=result.highlights or [],
                    confidence=result.score,
                    rank=i + 1,
                    search_type="semantic"
                )
                for i, result in enumerate(semantic_results)
            ]

        else:  # KEYWORD
            # Convert keyword results to hybrid format
            final_results = [
                HybridSearchResult(
                    document_id=result.document_id,
                    content=result.content,
                    score=result.score,
                    semantic_score=0.0,
                    keyword_score=result.score,
                    fused_score=result.score,
                    metadata=result.metadata,
                    search_methods=["keyword"],
                    highlights=result.highlights or [],
                    confidence=result.score,
                    rank=i + 1,
                    search_type="keyword"
                )
                for i, result in enumerate(keyword_results)
            ]

        # Calculate total time
        total_time = time.time() - start_time

        # Create metrics
        metrics = SearchMetrics(
            total_time=total_time,
            semantic_time=semantic_time,
            keyword_time=keyword_time,
            fusion_time=fusion_time,
            enhancement_time=enhancement_time,
            total_results=len(final_results),
            semantic_results=len(semantic_results),
            keyword_results=len(keyword_results),
            fusion_algorithm=algorithm_used,
            query_enhanced=enhanced_query is not None
        )

        # Update average statistics
        self._update_search_stats(total_time, len(final_results))

        # Prepare query info
        query_info = {
            "original_query": query,
            "search_type": search_type.value,
            "enhanced": enhanced_query is not None
        }

        if enhanced_query:
            query_info.update({
                "corrected_query": enhanced_query.corrected_query,
                "intent": enhanced_query.intent_classification.intent,
                "intent_confidence": enhanced_query.intent_classification.confidence,
                "expansion_score": enhanced_query.expansion.expansion_score
            })

        # Create response
        response = HybridSearchResponse(
            results=final_results,
            query_info=query_info,
            metrics=metrics,
            enhanced_query=enhanced_query,
            total_results=len(final_results),
            search_type=search_type.value,
            fusion_algorithm=algorithm_used
        )

        logger.info(f"Hybrid search completed in {total_time:.3f}s: "
                   f"'{query}' -> {len(final_results)} results "
                   f"(type: {search_type.value}, algorithm: {algorithm_used})")

        return response

    def _update_search_stats(self, response_time: float, results_count: int) -> None:
        """Update search statistics"""
        total_searches = self.search_stats["total_searches"]

        # Update average response time
        current_avg = self.search_stats["avg_response_time"]
        self.search_stats["avg_response_time"] = (
            (current_avg * (total_searches - 1) + response_time) / total_searches
        )

        # Update average results count
        current_avg_results = self.search_stats["avg_results_count"]
        self.search_stats["avg_results_count"] = (
            (current_avg_results * (total_searches - 1) + results_count) / total_searches
        )

    def get_search_stats(self) -> Dict[str, Any]:
        """Get search engine statistics"""
        return self.search_stats.copy()

    def get_index_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return {
            "bm25_stats": self.bm25_engine.get_index_stats(),
            "search_stats": self.get_search_stats()
        }


# Global instance for use across the application
hybrid_search_engine = HybridSearchEngine()

