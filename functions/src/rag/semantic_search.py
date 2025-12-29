"""
Semantic Search - Advanced search capabilities with Pinecone integration
"""
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone
import math

from .vector_store import vector_store, VectorSearchResult
from .embedding_service import embedding_service

logger = logging.getLogger(__name__)

@dataclass
class SearchQuery:
    text: str
    filters: Optional[Dict[str, Any]] = None
    top_k: int = 10
    namespace: Optional[str] = None
    include_metadata: bool = True
    rerank: bool = True
    hybrid_search: bool = False

@dataclass
class SearchResult:
    chunk_id: str
    content: str
    score: float
    metadata: Dict[str, Any]
    rank: int
    search_type: str = "semantic"
    rerank_score: Optional[float] = None

@dataclass
class SearchResponse:
    query: str
    results: List[SearchResult]
    total_results: int
    search_time: float
    embedding_time: float
    vector_search_time: float
    rerank_time: float
    metadata: Dict[str, Any]

class SemanticSearchEngine:
    """
    Advanced semantic search engine with ranking and filtering
    """
    
    def __init__(self):
        self.vector_store = vector_store
        self.embedding_service = embedding_service
        
        # Search configuration
        self.config = {
            'default_top_k': 10,
            'max_top_k': 100,
            'similarity_threshold': 0.7,
            'rerank_top_k': 50,  # Get more results for reranking
            'diversity_threshold': 0.9,  # For result diversification
            'boost_factors': {
                'recent': 1.2,  # Boost recent documents
                'user_documents': 1.1,  # Boost user's own documents
                'high_quality': 1.15  # Boost high-quality content
            }
        }
    
    async def search(self, query: SearchQuery) -> SearchResponse:
        """
        Perform semantic search with optional reranking
        """
        start_time = time.time()
        
        # Validate query
        if not query.text or not query.text.strip():
            return SearchResponse(
                query=query.text,
                results=[],
                total_results=0,
                search_time=0.0,
                embedding_time=0.0,
                vector_search_time=0.0,
                rerank_time=0.0,
                metadata={'error': 'Empty query'}
            )
        
        # Generate query embedding
        embedding_start = time.time()
        embedding_result = await self.embedding_service.generate_embedding(query.text)
        embedding_time = time.time() - embedding_start
        
        if not embedding_result:
            return SearchResponse(
                query=query.text,
                results=[],
                total_results=0,
                search_time=time.time() - start_time,
                embedding_time=embedding_time,
                vector_search_time=0.0,
                rerank_time=0.0,
                metadata={'error': 'Failed to generate query embedding'}
            )
        
        # Perform vector search
        vector_search_start = time.time()
        
        # Adjust top_k for reranking
        search_top_k = query.top_k
        if query.rerank and search_top_k < self.config['rerank_top_k']:
            search_top_k = min(self.config['rerank_top_k'], self.config['max_top_k'])
        
        vector_results = self.vector_store.search(
            query_vector=embedding_result.embedding,
            top_k=search_top_k,
            namespace=query.namespace,
            filter_dict=query.filters,
            include_metadata=query.include_metadata
        )
        
        vector_search_time = time.time() - vector_search_start
        
        # Convert to SearchResult objects
        search_results = []
        for i, result in enumerate(vector_results):
            search_result = SearchResult(
                chunk_id=result.chunk_id,
                content=result.content,
                score=result.score,
                metadata=result.metadata,
                rank=i + 1,
                search_type="semantic"
            )
            search_results.append(search_result)
        
        # Apply post-processing
        search_results = self._apply_score_boosting(search_results, query)
        search_results = self._filter_by_similarity_threshold(search_results)
        
        # Rerank results if requested
        rerank_time = 0.0
        if query.rerank and len(search_results) > 1:
            rerank_start = time.time()
            search_results = await self._rerank_results(query.text, search_results)
            rerank_time = time.time() - rerank_start
        
        # Apply diversity filtering
        search_results = self._apply_diversity_filtering(search_results)
        
        # Limit to requested top_k
        search_results = search_results[:query.top_k]
        
        # Update ranks
        for i, result in enumerate(search_results):
            result.rank = i + 1
        
        total_time = time.time() - start_time
        
        return SearchResponse(
            query=query.text,
            results=search_results,
            total_results=len(search_results),
            search_time=total_time,
            embedding_time=embedding_time,
            vector_search_time=vector_search_time,
            rerank_time=rerank_time,
            metadata={
                'embedding_model': embedding_result.model,
                'embedding_dimensions': embedding_result.dimensions,
                'similarity_threshold': self.config['similarity_threshold'],
                'reranked': query.rerank,
                'filters_applied': query.filters is not None
            }
        )
    
    def _apply_score_boosting(self, results: List[SearchResult], query: SearchQuery) -> List[SearchResult]:
        """
        Apply score boosting based on various factors
        """
        for result in results:
            boost_factor = 1.0
            metadata = result.metadata
            
            # Boost recent documents
            if 'created_at' in metadata:
                try:
                    created_at = datetime.fromisoformat(metadata['created_at'])
                    days_old = (datetime.now(timezone.utc) - created_at).days
                    if days_old < 7:  # Recent documents
                        boost_factor *= self.config['boost_factors']['recent']
                except Exception:
                    pass
            
            # Boost user's own documents (if user context available)
            if 'user_id' in metadata and 'query_user_id' in (query.filters or {}):
                if metadata['user_id'] == query.filters['query_user_id']:
                    boost_factor *= self.config['boost_factors']['user_documents']
            
            # Boost high-quality content
            if 'quality_score' in metadata:
                try:
                    quality_score = float(metadata['quality_score'])
                    if quality_score > 0.8:
                        boost_factor *= self.config['boost_factors']['high_quality']
                except Exception:
                    pass
            
            # Apply boost
            result.score *= boost_factor
        
        # Re-sort by boosted scores
        results.sort(key=lambda x: x.score, reverse=True)
        return results
    
    def _filter_by_similarity_threshold(self, results: List[SearchResult]) -> List[SearchResult]:
        """
        Filter results by similarity threshold
        """
        threshold = self.config['similarity_threshold']
        return [result for result in results if result.score >= threshold]
    
    async def _rerank_results(self, query: str, results: List[SearchResult]) -> List[SearchResult]:
        """
        Rerank results using cross-encoder or other reranking methods
        """
        # Simple reranking based on text similarity and metadata
        # In production, you might use a cross-encoder model
        
        for result in results:
            rerank_score = self._calculate_rerank_score(query, result)
            result.rerank_score = rerank_score
        
        # Sort by rerank score
        results.sort(key=lambda x: x.rerank_score or x.score, reverse=True)
        return results
    
    def _calculate_rerank_score(self, query: str, result: SearchResult) -> float:
        """
        Calculate rerank score based on various factors
        """
        base_score = result.score
        
        # Text-based features
        content = result.content.lower()
        query_lower = query.lower()
        
        # Exact phrase match bonus
        if query_lower in content:
            base_score *= 1.2
        
        # Query term frequency
        query_terms = query_lower.split()
        term_matches = sum(1 for term in query_terms if term in content)
        term_ratio = term_matches / len(query_terms) if query_terms else 0
        base_score *= (1 + term_ratio * 0.1)
        
        # Content length penalty (very short or very long content)
        content_length = len(result.content)
        if content_length < 50:
            base_score *= 0.9
        elif content_length > 2000:
            base_score *= 0.95
        
        # Metadata-based features
        metadata = result.metadata
        
        # Title/header match bonus
        if 'title' in metadata:
            title = metadata['title'].lower()
            if any(term in title for term in query_terms):
                base_score *= 1.15
        
        # Document type preferences
        if 'file_type' in metadata:
            file_type = metadata['file_type']
            if file_type in ['pdf', 'docx']:  # Prefer structured documents
                base_score *= 1.05
        
        return base_score
    
    def _apply_diversity_filtering(self, results: List[SearchResult]) -> List[SearchResult]:
        """
        Apply diversity filtering to avoid too similar results
        """
        if len(results) <= 1:
            return results
        
        diverse_results = [results[0]]  # Always include top result
        
        for result in results[1:]:
            # Check similarity with already selected results
            is_diverse = True
            for selected in diverse_results:
                similarity = self._calculate_content_similarity(result.content, selected.content)
                if similarity > self.config['diversity_threshold']:
                    is_diverse = False
                    break
            
            if is_diverse:
                diverse_results.append(result)
        
        return diverse_results
    
    def _calculate_content_similarity(self, content1: str, content2: str) -> float:
        """
        Calculate simple content similarity (Jaccard similarity)
        """
        words1 = set(content1.lower().split())
        words2 = set(content2.lower().split())
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def get_search_suggestions(self, partial_query: str, limit: int = 5) -> List[str]:
        """
        Get search suggestions based on partial query
        """
        # Simple implementation - in production you might use a dedicated suggestion service
        suggestions = []
        
        # Common search patterns
        common_queries = [
            "how to", "what is", "best practices", "tutorial", "guide",
            "example", "implementation", "setup", "configuration", "troubleshooting"
        ]
        
        partial_lower = partial_query.lower()
        for pattern in common_queries:
            if pattern.startswith(partial_lower) or partial_lower in pattern:
                suggestions.append(f"{partial_query} {pattern}")
        
        return suggestions[:limit]
    
    def get_search_analytics(self, user_id: Optional[str] = None, days: int = 30) -> Dict[str, Any]:
        """
        Get search analytics and metrics
        """
        # This would typically query a search analytics database
        # For now, return mock analytics
        return {
            'total_searches': 150,
            'avg_results_per_search': 8.5,
            'avg_search_time': 0.25,
            'top_queries': [
                'machine learning tutorial',
                'python best practices',
                'API documentation',
                'database setup guide',
                'authentication implementation'
            ],
            'search_success_rate': 0.92,
            'user_satisfaction': 4.2,
            'period_days': days
        }

# Global instance
semantic_search_engine = SemanticSearchEngine()

