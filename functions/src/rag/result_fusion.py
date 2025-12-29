"""
Result Fusion Algorithms for Hybrid Search
"""
import logging
import math
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    """Search result with relevance scoring"""
    document_id: str
    content: str
    score: float
    metadata: Dict[str, Any]
    search_method: str
    highlights: Optional[List[str]] = None
    rank: int = 0

@dataclass
class FusionResult:
    """Result of fusion algorithm"""
    document_id: str
    content: str
    fused_score: float
    semantic_score: float
    keyword_score: float
    metadata: Dict[str, Any]
    search_methods: List[str]
    highlights: List[str]
    confidence: float
    rank: int = 0

class ReciprocalRankFusion:
    """
    Reciprocal Rank Fusion (RRF) algorithm for combining
    multiple search result rankings
    """

    def __init__(self, k: int = 60, adaptive_weights: bool = True):
        """
        Initialize RRF algorithm

        Args:
            k: RRF parameter (typically 60)
            adaptive_weights: Whether to use adaptive weighting
        """
        self.k = k
        self.adaptive_weights = adaptive_weights

        logger.info(f"RRF initialized with k={k}, adaptive_weights={adaptive_weights}")

    def _calculate_rrf_score(self, rank: int) -> float:
        """
        Calculate RRF score for a given rank

        Args:
            rank: Document rank (1-based)

        Returns:
            RRF score
        """
        return 1.0 / (self.k + rank)

    def _calculate_adaptive_weights(self, semantic_results: List[SearchResult],
                                  keyword_results: List[SearchResult],
                                  query_metadata: Optional[Dict[str, Any]] = None) -> Tuple[float, float]:
        """
        Calculate adaptive weights based on result characteristics

        Args:
            semantic_results: Semantic search results
            keyword_results: Keyword search results
            query_metadata: Query metadata for weight adjustment

        Returns:
            Tuple of (semantic_weight, keyword_weight)
        """
        # Default weights
        semantic_weight = 0.7
        keyword_weight = 0.3

        if not self.adaptive_weights:
            return semantic_weight, keyword_weight

        # Adjust based on result quality
        semantic_avg_score = statistics.mean([r.score for r in semantic_results]) if semantic_results else 0
        keyword_avg_score = statistics.mean([r.score for r in keyword_results]) if keyword_results else 0

        # Adjust based on query characteristics
        if query_metadata:
            intent = query_metadata.get('intent', 'exploratory')
            word_count = query_metadata.get('word_count', 0)

            # Factual queries benefit more from keyword search
            if intent == 'factual':
                keyword_weight += 0.1
                semantic_weight -= 0.1

            # Exploratory queries benefit more from semantic search
            elif intent == 'exploratory':
                semantic_weight += 0.1
                keyword_weight -= 0.1

            # Short queries often benefit from keyword search
            if word_count <= 3:
                keyword_weight += 0.05
                semantic_weight -= 0.05

            # Long queries benefit from semantic search
            elif word_count >= 8:
                semantic_weight += 0.05
                keyword_weight -= 0.05

        # Adjust based on relative result quality
        if semantic_avg_score > 0 and keyword_avg_score > 0:
            total_score = semantic_avg_score + keyword_avg_score
            quality_ratio = semantic_avg_score / total_score

            # Adjust weights based on quality ratio
            semantic_weight = 0.5 + (quality_ratio - 0.5) * 0.4
            keyword_weight = 1.0 - semantic_weight

        # Ensure weights are within reasonable bounds
        semantic_weight = max(0.2, min(0.8, semantic_weight))
        keyword_weight = 1.0 - semantic_weight

        return semantic_weight, keyword_weight

    def _detect_duplicates(self, results: List[SearchResult],
                          similarity_threshold: float = 0.9) -> Dict[str, List[str]]:
        """
        Detect duplicate documents across result sets

        Args:
            results: All search results
            similarity_threshold: Threshold for duplicate detection

        Returns:
            Dictionary mapping canonical doc_id to list of duplicates
        """
        duplicates = defaultdict(list)
        processed = set()

        for i, result1 in enumerate(results):
            if result1.document_id in processed:
                continue

            group = [result1.document_id]

            for j, result2 in enumerate(results[i+1:], i+1):
                if result2.document_id in processed:
                    continue

                # Simple duplicate detection based on document ID
                # In practice, this could use content similarity
                if result1.document_id == result2.document_id:
                    group.append(result2.document_id)
                    processed.add(result2.document_id)

            if len(group) > 1:
                canonical_id = group[0]  # Use first as canonical
                duplicates[canonical_id] = group[1:]

            processed.add(result1.document_id)

        return duplicates

    def _calculate_confidence(self, semantic_score: float, keyword_score: float,
                            semantic_rank: int, keyword_rank: int) -> float:
        """
        Calculate confidence score for fused result

        Args:
            semantic_score: Semantic search score
            keyword_score: Keyword search score
            semantic_rank: Rank in semantic results
            keyword_rank: Rank in keyword results

        Returns:
            Confidence score (0-1)
        """
        # Base confidence from scores
        score_confidence = (semantic_score + keyword_score) / 2

        # Rank-based confidence (lower ranks = higher confidence)
        max_rank = max(semantic_rank, keyword_rank) if semantic_rank > 0 and keyword_rank > 0 else 100
        rank_confidence = 1.0 / (1.0 + math.log(max_rank))

        # Agreement confidence (both methods found the document)
        agreement_confidence = 1.0 if semantic_rank > 0 and keyword_rank > 0 else 0.7

        # Combined confidence
        confidence = (score_confidence * 0.4 + rank_confidence * 0.3 + agreement_confidence * 0.3)

        return min(1.0, confidence)

    async def fuse_results(self, semantic_results: List[SearchResult],
                          keyword_results: List[SearchResult],
                          alpha: Optional[float] = None,
                          query_metadata: Optional[Dict[str, Any]] = None,
                          top_k: int = 10) -> List[FusionResult]:
        """
        Fuse semantic and keyword search results using RRF

        Args:
            semantic_results: Results from semantic search
            keyword_results: Results from keyword search
            alpha: Manual weight for semantic results (overrides adaptive)
            query_metadata: Query metadata for adaptive weighting
            top_k: Number of top results to return

        Returns:
            List of fused results sorted by relevance
        """
        if not semantic_results and not keyword_results:
            return []

        # Calculate weights
        if alpha is not None:
            semantic_weight = alpha
            keyword_weight = 1.0 - alpha
        else:
            semantic_weight, keyword_weight = self._calculate_adaptive_weights(
                semantic_results, keyword_results, query_metadata
            )

        logger.debug(f"Fusion weights: semantic={semantic_weight:.3f}, keyword={keyword_weight:.3f}")

        # Create rank mappings
        semantic_ranks = {result.document_id: i + 1 for i, result in enumerate(semantic_results)}
        keyword_ranks = {result.document_id: i + 1 for i, result in enumerate(keyword_results)}

        # Create score mappings
        semantic_scores = {result.document_id: result.score for result in semantic_results}
        keyword_scores = {result.document_id: result.score for result in keyword_results}

        # Get all unique documents
        all_doc_ids = set(semantic_ranks.keys()) | set(keyword_ranks.keys())

        # Calculate fused scores
        fused_results = []

        for doc_id in all_doc_ids:
            # Get ranks (0 if not found in that result set)
            semantic_rank = semantic_ranks.get(doc_id, 0)
            keyword_rank = keyword_ranks.get(doc_id, 0)

            # Calculate RRF scores
            semantic_rrf = self._calculate_rrf_score(semantic_rank) if semantic_rank > 0 else 0
            keyword_rrf = self._calculate_rrf_score(keyword_rank) if keyword_rank > 0 else 0

            # Calculate weighted fusion score
            fused_score = semantic_weight * semantic_rrf + keyword_weight * keyword_rrf

            # Get original scores
            semantic_score = semantic_scores.get(doc_id, 0.0)
            keyword_score = keyword_scores.get(doc_id, 0.0)

            # Calculate confidence
            confidence = self._calculate_confidence(
                semantic_score, keyword_score, semantic_rank, keyword_rank
            )

            # Get document content and metadata
            doc_content = ""
            doc_metadata = {}
            doc_highlights = []
            search_methods = []

            # Find the document in either result set
            for result in semantic_results:
                if result.document_id == doc_id:
                    doc_content = result.content
                    doc_metadata = result.metadata
                    doc_highlights.extend(result.highlights or [])
                    search_methods.append("semantic")
                    break

            for result in keyword_results:
                if result.document_id == doc_id:
                    if not doc_content:  # Only set if not already set
                        doc_content = result.content
                        doc_metadata = result.metadata
                    doc_highlights.extend(result.highlights or [])
                    if "keyword" not in search_methods:
                        search_methods.append("keyword")
                    break

            # Remove duplicate highlights
            doc_highlights = list(set(doc_highlights))

            # Create fusion result
            fusion_result = FusionResult(
                document_id=doc_id,
                content=doc_content,
                fused_score=fused_score,
                semantic_score=semantic_score,
                keyword_score=keyword_score,
                metadata=doc_metadata,
                search_methods=search_methods,
                highlights=doc_highlights,
                confidence=confidence
            )

            fused_results.append(fusion_result)

        # Sort by fused score
        fused_results.sort(key=lambda x: x.fused_score, reverse=True)

        # Add ranks
        for i, fusion_res in enumerate(fused_results):
            fusion_res.rank = i + 1

        # Return top_k results
        top_results = fused_results[:top_k]

        logger.info(f"Fused {len(semantic_results)} semantic + {len(keyword_results)} keyword results "
                   f"-> {len(top_results)} final results")

        return top_results


# Global instance for use across the application
reciprocal_rank_fusion = ReciprocalRankFusion()
