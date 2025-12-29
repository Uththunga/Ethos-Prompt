"""
Marketing Knowledge Base Retriever
Implements hybrid search (semantic + BM25) for marketing content
"""
import logging
import os
from typing import Any, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass

from .kb_indexer import marketing_kb_indexer
from .rag_quality_metrics import RAGQualityMetrics  # Phase 3
from src.rag.hybrid_search_engine import hybrid_search_engine, SearchType
from src.rag.bm25_search_engine import bm25_search_engine
from src.rag.embedding_service import embedding_service

# Phase 2 Rec #7: Re-ranking
try:
    from sentence_transformers import CrossEncoder
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

# Phase 2 Rec #9: Caching - Using TTLCache (zero cost, in-memory)
from cachetools import TTLCache
import json
import hashlib

logger = logging.getLogger(__name__)

@dataclass
class RetrievalResult:
    """Result from marketing KB retrieval"""
    text: str
    score: float
    document_id: str
    document_title: str
    category: str
    page: str
    chunk_index: int
    source: str = "marketing_kb"

class MarketingRetriever:
    """
    Retrieves relevant marketing content using hybrid search.

    Combines:
    - Semantic search (70% weight): Vector similarity for conceptual matching
    - BM25 keyword search (30% weight): Exact term matching

    Optimized for marketing queries about:
    - Company information and services
    - Pricing and plans
    - Features and capabilities
    - Getting started and support
    """

    def __init__(self, db=None) -> Any:
        self.db = db
        self.semantic_weight = 0.7
        self.bm25_weight = 0.3

        # Initialize Re-ranker (Lazy load)
        self._cross_encoder = None

        # Initialize TTL Cache (zero cost, uses instance memory)
        # 100 items max, 1 hour TTL - sufficient for marketing KB
        self._cache = TTLCache(maxsize=100, ttl=3600)
        logger.info("TTLCache initialized (maxsize=100, ttl=1h)")

        # Initialize RAG Quality Metrics (Phase 3)
        self.quality_metrics = RAGQualityMetrics(db=db)

        logger.info("Marketing Retriever initialized")

    def prewarm_models(self) -> bool:
        """
        PERF-002 FIX: Pre-warm heavy models at startup to avoid cold start latency.

        Call this during application initialization (e.g., in main.py or startup hook)
        to load the ~500MB CrossEncoder model before first request.

        Environment Variables:
            WARMUP_CROSS_ENCODER: Set to 'false' to disable CrossEncoder prewarming

        Returns:
            True if models loaded successfully, False otherwise
        """
        # Check if prewarming is disabled via environment variable
        if os.getenv("WARMUP_CROSS_ENCODER", "true").lower() == "false":
            logger.info("CrossEncoder prewarm disabled via WARMUP_CROSS_ENCODER=false")
            return True  # Return True since this is intentional, not a failure

        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            logger.info("CrossEncoder not available (sentence-transformers not installed)")
            return True  # Not a failure, just not available

        try:
            logger.info("Loading CrossEncoder model for re-ranking (~500MB)...")
            encoder = self._get_cross_encoder()
            if encoder:
                logger.info("CrossEncoder pre-warmed successfully")
                return True
            return False
        except Exception as e:
            logger.warning(f"CrossEncoder prewarm failed: {e}")
            return False

    def _get_cross_encoder(self) -> Optional[Any]:
        """Lazy load CrossEncoder model"""
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            return None

        if self._cross_encoder is None:
            try:
                logger.info("Loading CrossEncoder model for re-ranking...")
                self._cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            except Exception as e:
                logger.error(f"Failed to load CrossEncoder: {e}")
                return None
        return self._cross_encoder

    def _get_cache_key(self, query: str, top_k: int, category_filter: Optional[str]) -> str:
        """Generate cache key for query"""
        # SEC-004 FIX: Use SHA-256 instead of MD5 (MD5 is cryptographically broken)
        query_hash = hashlib.sha256(query.encode()).hexdigest()[:16]
        return f"marketing_rag:{query_hash}:{top_k}:{category_filter or 'all'}"

    def _get_adaptive_top_k(self, query: str) -> int:
        """
        Calculate optimal top_k based on query complexity.

        Granite 4.0 Optimized: 128K context allows more retrieval.
        Simple queries need less context, complex ones need more.
        """
        word_count = len(query.split())

        if word_count <= 8:
            return 4  # Simple query (was 3)
        elif word_count >= 15:
            return 7  # Complex query (was 5) - Granite handles more
        else:
            return 5  # Medium query (was 4)

    async def retrieve(
        self,
        query: str,
        top_k: Optional[int] = None,  # Changed to Optional
        category_filter: Optional[str] = None,
        use_hybrid: bool = True
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant marketing content for a query.

        Args:
            query: User query
            top_k: Number of results to return (if None, uses adaptive)
            category_filter: Optional category filter (foundation/offerings/support/engagement/differentiation)
            use_hybrid: If True, use hybrid search; if False, semantic only

        Returns:
            List of RetrievalResult objects
        """
        # SEC-003 FIX: Validate category filter against whitelist
        VALID_CATEGORIES = {"foundation", "offerings", "support", "engagement", "differentiation", None}
        if category_filter not in VALID_CATEGORIES:
            logger.warning(f"Invalid category filter '{category_filter}', ignoring")
            category_filter = None

        # Phase 2: Adaptive Top-K
        if top_k is None:
            top_k = self._get_adaptive_top_k(query)

        logger.info(f"Retrieving marketing content for query: '{query[:50]}...' (top_k={top_k})")

        # 1. Check Cache (Rec #9) - Using TTLCache (zero cost)
        cache_key = self._get_cache_key(query, top_k, category_filter)
        if cache_key in self._cache:
            logger.info("Cache HIT for query")
            return self._cache[cache_key]

        # 2. Retrieve Candidates (Fetch more for re-ranking)
        # If re-ranking is enabled, fetch 3x candidates to re-rank
        fetch_k = top_k * 3 if SENTENCE_TRANSFORMERS_AVAILABLE else top_k

        if use_hybrid:
            results = await self._hybrid_search(query, fetch_k, category_filter)
        else:
            results = await self._semantic_search(query, fetch_k, category_filter)

        # 3. Re-rank Results (Rec #7)
        cross_encoder = self._get_cross_encoder()
        if cross_encoder and len(results) > 0:
            try:
                logger.info(f"Re-ranking {len(results)} results...")
                # Prepare pairs for cross-encoder
                pairs = [[query, r.text] for r in results]
                scores = cross_encoder.predict(pairs)

                # Update scores and sort
                for i, result in enumerate(results):
                    result.score = float(scores[i])

                # Sort by new score descending
                results.sort(key=lambda x: x.score, reverse=True)

                # Trim to requested top_k
                results = results[:top_k]
                logger.info("Re-ranking complete")
            except Exception as e:
                logger.error(f"Re-ranking failed: {e}")
                results = results[:top_k]  # Fallback to original order
        else:
            results = results[:top_k]

        logger.info(f"Retrieved {len(results)} results")

        # 4. Update Cache (Rec #9) - TTLCache auto-expires after 1 hour
        if results:
            self._cache[cache_key] = results
            logger.debug(f"Cached {len(results)} results (cache size: {len(self._cache)})")

        # 5. Log Retrieval Quality (Phase 3)
        try:
            await self.quality_metrics.log_retrieval_quality(
                query=query,
                results=[
                    {"doc_id": r.document_id, "score": r.score, "id": r.document_id}
                    for r in results
                ],
                relevance_labels=None,  # Manual labeling later
                conversation_id=None
            )
        except Exception as e:
            logger.warning(f"Quality logging failed (non-critical): {e}")

        return results

    async def _semantic_search(
        self,
        query: str,
        top_k: int,
        category_filter: Optional[str]
    ) -> List[RetrievalResult]:
        """Semantic search using vector similarity"""
        results = await marketing_kb_indexer.search_kb(
            query=query,
            top_k=top_k,
            category_filter=category_filter
        )

        return [
            RetrievalResult(
                text=r["text"],
                score=r["score"],
                document_id=r["document_id"],
                document_title=r["document_title"],
                category=r["category"],
                page=r["page"],
                chunk_index=r["chunk_index"]
            )
            for r in results
        ]

    async def _hybrid_search(
        self,
        query: str,
        top_k: int,
        category_filter: Optional[str]
    ) -> List[RetrievalResult]:
        """
        Hybrid search combining semantic and BM25.

        Uses existing hybrid_search_engine from RAG pipeline.
        """
        try:
            # Use existing hybrid search engine
            # Updated to match current HybridSearchEngine.search signature
            # Use existing hybrid search engine
            # Updated to match current HybridSearchEngine.search signature
            hybrid_results = await hybrid_search_engine.search(
                query=query,
                config={
                    "max_results": top_k,
                    "use_adaptive_fusion": True,
                    "fusion_algorithm": "adaptive"
                },
                search_mode=SearchType.HYBRID
            )

            # Convert HybridSearchResult to RetrievalResult
            return [
                RetrievalResult(
                    text=r.content,
                    score=r.hybrid_score,
                    document_id=r.metadata.get("document_id", r.chunk_id),
                    document_title=r.metadata.get("document_title", ""),
                    category=r.metadata.get("category", ""),
                    page=r.metadata.get("page", ""),
                    chunk_index=r.metadata.get("chunk_index", 0)
                )
                for r in hybrid_results
            ]

        except Exception as e:
            logger.error(f"Hybrid search failed, falling back to semantic: {e}")
            return await self._semantic_search(query, top_k, category_filter)

    def format_context(
        self,
        results: List[RetrievalResult],
        max_tokens: int = 1500,  # CONTEXT OPTIMIZATION: Reduced from 4000 to 1500
        max_chunk_chars: int = 500,  # CONTEXT OPTIMIZATION: Truncate long chunks
        compact: bool = True  # CONTEXT OPTIMIZATION: Use compact format by default
    ) -> str:
        """
        Format retrieval results into context string for LLM.

        Context Optimization (v2):
        - Reduced default max_tokens from 4000 to 1500 (~300 token savings)
        - Added chunk truncation (500 chars max per result)
        - Compact format removes verbose metadata

        Args:
            results: List of retrieval results
            max_tokens: Maximum tokens for context (default: 1500)
            max_chunk_chars: Maximum characters per chunk (default: 500)
            compact: Use compact formatting (default: True)

        Returns:
            Formatted context string
        """
        if not results:
            return ""

        context_parts = []
        total_chars = 0
        max_chars = max_tokens * 4  # Rough approximation: 1 token ≈ 4 chars

        for i, result in enumerate(results, 1):
            # Truncate long text chunks to save context space
            text = result.text

            # FIX #3: Internal notes are now handled by KB structure (internal_notes field)
            # So we don't need fragile regex stripping of instructions here.
            # We also KEEP headers (e.g. "WHAT WE DO:") as they provide valuable structure for the LLM.

            # Clean up any extra whitespace
            text = re.sub(r'\n{3,}', '\n\n', text).strip()

            if len(text) > max_chunk_chars:
                text = text[:max_chunk_chars].rsplit(' ', 1)[0] + "..."

            if compact:
                # COMPACT FORMAT: [N] Title: Content (no extra newlines)
                part = f"[{i}] {result.document_title}: {text}\n"
            else:
                # VERBOSE FORMAT: Full source citation with newlines
                part = f"[Source {i}] {result.document_title}\n{text}\n\n"

            if total_chars + len(part) > max_chars:
                break

            context_parts.append(part)
            total_chars += len(part)

        context = "".join(context_parts)

        logger.info(f"Formatted context: {len(context_parts)} sources, ~{total_chars} chars (compact={compact})")

        return context

    def get_sources(self, results: List[RetrievalResult]) -> List[Dict[str, Any]]:
        """
        Extract source citations from results.

        Args:
            results: List of retrieval results

        Returns:
            List of source dicts for response metadata
        """
        sources = []

        for i, result in enumerate(results, 1):
            sources.append({
                "index": i,
                "title": result.document_title,
                "category": result.category,
                "page": result.page,
                "score": round(result.score, 3),
                "excerpt": result.text[:200] + "..." if len(result.text) > 200 else result.text
            })

        return sources


# Global instance
marketing_retriever = MarketingRetriever()
