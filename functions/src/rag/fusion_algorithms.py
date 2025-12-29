"""
Additional Fusion Algorithms for Hybrid Search
"""
import logging
import math
import statistics
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

from .result_fusion import SearchResult, FusionResult

logger = logging.getLogger(__name__)

class CombSUMFusion:
    """
    CombSUM fusion algorithm - combines normalized scores
    """
    
    def __init__(self):
        """Initialize CombSUM fusion"""
        logger.info("CombSUM fusion initialized")
    
    def _normalize_scores(self, results: List[SearchResult]) -> Dict[str, float]:
        """
        Normalize scores to 0-1 range
        
        Args:
            results: Search results to normalize
            
        Returns:
            Dictionary mapping doc_id to normalized score
        """
        if not results:
            return {}
        
        scores = [result.score for result in results]
        min_score = min(scores)
        max_score = max(scores)
        
        if max_score == min_score:
            return {result.document_id: 1.0 for result in results}
        
        normalized = {}
        for result in results:
            normalized_score = (result.score - min_score) / (max_score - min_score)
            normalized[result.document_id] = normalized_score
        
        return normalized
    
    async def fuse_results(self, semantic_results: List[SearchResult],
                          keyword_results: List[SearchResult],
                          semantic_weight: float = 0.7,
                          top_k: int = 10) -> List[FusionResult]:
        """
        Fuse results using CombSUM algorithm
        
        Args:
            semantic_results: Semantic search results
            keyword_results: Keyword search results
            semantic_weight: Weight for semantic results
            top_k: Number of top results to return
            
        Returns:
            List of fused results
        """
        # Normalize scores
        semantic_normalized = self._normalize_scores(semantic_results)
        keyword_normalized = self._normalize_scores(keyword_results)
        
        keyword_weight = 1.0 - semantic_weight
        
        # Get all unique documents
        all_doc_ids = set(semantic_normalized.keys()) | set(keyword_normalized.keys())
        
        fused_results = []
        
        for doc_id in all_doc_ids:
            semantic_score = semantic_normalized.get(doc_id, 0.0)
            keyword_score = keyword_normalized.get(doc_id, 0.0)
            
            # CombSUM: weighted sum of normalized scores
            fused_score = semantic_weight * semantic_score + keyword_weight * keyword_score
            
            # Find document content
            doc_content = ""
            doc_metadata = {}
            search_methods = []
            
            for result in semantic_results:
                if result.document_id == doc_id:
                    doc_content = result.content
                    doc_metadata = result.metadata
                    search_methods.append("semantic")
                    break
            
            for result in keyword_results:
                if result.document_id == doc_id:
                    if not doc_content:
                        doc_content = result.content
                        doc_metadata = result.metadata
                    if "keyword" not in search_methods:
                        search_methods.append("keyword")
                    break
            
            fusion_result = FusionResult(
                document_id=doc_id,
                content=doc_content,
                fused_score=fused_score,
                semantic_score=semantic_score,
                keyword_score=keyword_score,
                metadata=doc_metadata,
                search_methods=search_methods,
                highlights=[],
                confidence=fused_score
            )
            
            fused_results.append(fusion_result)
        
        # Sort and return top_k
        fused_results.sort(key=lambda x: x.fused_score, reverse=True)
        return fused_results[:top_k]


class BordaCountFusion:
    """
    Borda Count fusion algorithm - rank-based voting
    """
    
    def __init__(self):
        """Initialize Borda Count fusion"""
        logger.info("Borda Count fusion initialized")
    
    async def fuse_results(self, semantic_results: List[SearchResult],
                          keyword_results: List[SearchResult],
                          top_k: int = 10) -> List[FusionResult]:
        """
        Fuse results using Borda Count algorithm
        
        Args:
            semantic_results: Semantic search results
            keyword_results: Keyword search results
            top_k: Number of top results to return
            
        Returns:
            List of fused results
        """
        # Create rank mappings
        semantic_ranks = {result.document_id: len(semantic_results) - i 
                         for i, result in enumerate(semantic_results)}
        keyword_ranks = {result.document_id: len(keyword_results) - i 
                        for i, result in enumerate(keyword_results)}
        
        # Get all unique documents
        all_doc_ids = set(semantic_ranks.keys()) | set(keyword_ranks.keys())
        
        fused_results = []
        
        for doc_id in all_doc_ids:
            # Borda Count: sum of ranks
            borda_score = semantic_ranks.get(doc_id, 0) + keyword_ranks.get(doc_id, 0)
            
            # Find document content
            doc_content = ""
            doc_metadata = {}
            search_methods = []
            
            for result in semantic_results:
                if result.document_id == doc_id:
                    doc_content = result.content
                    doc_metadata = result.metadata
                    search_methods.append("semantic")
                    break
            
            for result in keyword_results:
                if result.document_id == doc_id:
                    if not doc_content:
                        doc_content = result.content
                        doc_metadata = result.metadata
                    if "keyword" not in search_methods:
                        search_methods.append("keyword")
                    break
            
            fusion_result = FusionResult(
                document_id=doc_id,
                content=doc_content,
                fused_score=borda_score,
                semantic_score=semantic_ranks.get(doc_id, 0),
                keyword_score=keyword_ranks.get(doc_id, 0),
                metadata=doc_metadata,
                search_methods=search_methods,
                highlights=[],
                confidence=borda_score / (len(semantic_results) + len(keyword_results))
            )
            
            fused_results.append(fusion_result)
        
        # Sort and return top_k
        fused_results.sort(key=lambda x: x.fused_score, reverse=True)
        return fused_results[:top_k]


class AdaptiveFusion:
    """
    Adaptive fusion that selects the best algorithm based on query characteristics
    """
    
    def __init__(self):
        """Initialize adaptive fusion"""
        self.rrf_fusion = None  # Will be imported to avoid circular imports
        self.combsum_fusion = CombSUMFusion()
        self.borda_fusion = BordaCountFusion()
        
        logger.info("Adaptive fusion initialized")
    
    def _select_algorithm(self, query_metadata: Dict[str, Any],
                         semantic_results: List[SearchResult],
                         keyword_results: List[SearchResult]) -> str:
        """
        Select the best fusion algorithm based on characteristics
        
        Args:
            query_metadata: Query metadata
            semantic_results: Semantic search results
            keyword_results: Keyword search results
            
        Returns:
            Algorithm name ('rrf', 'combsum', 'borda')
        """
        # Default to RRF
        algorithm = "rrf"
        
        # Consider query characteristics
        intent = query_metadata.get('intent', 'exploratory')
        word_count = query_metadata.get('word_count', 0)
        
        # Consider result characteristics
        semantic_count = len(semantic_results)
        keyword_count = len(keyword_results)
        
        # Use CombSUM for balanced result sets with good score distributions
        if abs(semantic_count - keyword_count) <= 3 and semantic_count > 5:
            semantic_scores = [r.score for r in semantic_results]
            keyword_scores = [r.score for r in keyword_results]
            
            if (statistics.stdev(semantic_scores) > 0.1 and 
                statistics.stdev(keyword_scores) > 0.1):
                algorithm = "combsum"
        
        # Use Borda Count for ranking-focused queries
        elif intent in ['comparative', 'specific'] and semantic_count > 3 and keyword_count > 3:
            algorithm = "borda"
        
        # Use RRF for most other cases (default)
        else:
            algorithm = "rrf"
        
        logger.debug(f"Selected fusion algorithm: {algorithm}")
        return algorithm
    
    async def fuse_results(self, semantic_results: List[SearchResult],
                          keyword_results: List[SearchResult],
                          query_metadata: Optional[Dict[str, Any]] = None,
                          top_k: int = 10) -> List[FusionResult]:
        """
        Adaptively fuse results using the best algorithm
        
        Args:
            semantic_results: Semantic search results
            keyword_results: Keyword search results
            query_metadata: Query metadata for algorithm selection
            top_k: Number of top results to return
            
        Returns:
            List of fused results
        """
        if not query_metadata:
            query_metadata = {}
        
        # Select algorithm
        algorithm = self._select_algorithm(query_metadata, semantic_results, keyword_results)
        
        # Apply selected algorithm
        if algorithm == "combsum":
            return await self.combsum_fusion.fuse_results(
                semantic_results, keyword_results, top_k=top_k
            )
        elif algorithm == "borda":
            return await self.borda_fusion.fuse_results(
                semantic_results, keyword_results, top_k=top_k
            )
        else:  # Default to RRF
            # Import here to avoid circular imports
            from .result_fusion import reciprocal_rank_fusion
            return await reciprocal_rank_fusion.fuse_results(
                semantic_results, keyword_results, 
                query_metadata=query_metadata, top_k=top_k
            )


# Global instances
combsum_fusion = CombSUMFusion()
borda_fusion = BordaCountFusion()
adaptive_fusion = AdaptiveFusion()

