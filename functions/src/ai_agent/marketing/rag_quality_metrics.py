"""
RAG Quality Metrics System
Measures retrieval quality using MRR and NDCG
"""

import logging
import math
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class RAGQualityMetrics:
    """
    Calculate and track RAG retrieval quality metrics.

    Implements:
    - MRR (Mean Reciprocal Rank): 1/rank of first relevant result
    - NDCG (Normalized Discounted Cumulative Gain): Quality-weighted ranking
    """

    def __init__(self, db: Any = None):
        """
        Initialize metrics calculator.

        Args:
            db: Firestore client for persistence
        """
        self.db = db

    def calculate_mrr(
        self,
        results: List[Dict[str, Any]],
        relevant_doc_ids: List[str]
    ) -> float:
        """
        Calculate Mean Reciprocal Rank.

        MRR = 1 / rank of first relevant document

        Args:
            results: List of retrieval results (ordered by rank)
            relevant_doc_ids: List of relevant document IDs

        Returns:
            MRR score (0.0-1.0, higher is better)
        """
        try:
            for rank, result in enumerate(results, start=1):
                doc_id = result.get('id') or result.get('doc_id') or result.get('document_id')
                if doc_id in relevant_doc_ids:
                    mrr = 1.0 / rank
                    logger.debug(f"First relevant doc at rank {rank}, MRR={mrr:.4f}")
                    return mrr

            # No relevant results found
            logger.debug("No relevant results found, MRR=0.0")
            return 0.0

        except Exception as e:
            logger.error(f"Error calculating MRR: {e}")
            return 0.0

    def calculate_ndcg(
        self,
        results: List[Dict[str, Any]],
        relevance_scores: Dict[str, float],
        k: int = 5
    ) -> float:
        """
        Calculate Normalized Discounted Cumulative Gain at k.

        NDCG@k = DCG@k / IDCG@k
        DCG = sum(relevance_i / log2(i + 1)) for i in [1..k]
        IDCG = DCG of ideal ranking (sorted by relevance)

        Args:
            results: List of retrieval results (ordered by rank)
            relevance_scores: Dict mapping doc_id to relevance score (0-3)
            k: Cutoff rank (default: 5)

        Returns:
            NDCG score (0.0-1.0, higher is better)
        """
        try:
            # Extract relevance scores for retrieved docs
            retrieved_relevances = []
            for i, result in enumerate(results[:k]):
                doc_id: Optional[str] = result.get('id') or result.get('doc_id') or result.get('document_id')
                relevance = relevance_scores.get(doc_id, 0.0) if doc_id else 0.0
                retrieved_relevances.append(relevance)

            # Calculate DCG (Discounted Cumulative Gain)
            dcg = sum(
                rel / math.log2(i + 2)  # i+2 because enumerate starts at 0
                for i, rel in enumerate(retrieved_relevances)
            )

            # Calculate IDCG (Ideal DCG - sorted by relevance)
            ideal_relevances = sorted(relevance_scores.values(), reverse=True)[:k]
            idcg = sum(
                rel / math.log2(i + 2)
                for i, rel in enumerate(ideal_relevances)
            )

            # Normalize
            if idcg == 0:
                logger.debug("IDCG is 0, returning NDCG=0.0")
                return 0.0

            ndcg = dcg / idcg
            logger.debug(f"NDCG@{k}={ndcg:.4f} (DCG={dcg:.4f}, IDCG={idcg:.4f})")
            return ndcg

        except Exception as e:
            logger.error(f"Error calculating NDCG: {e}")
            return 0.0

    async def log_retrieval_quality(
        self,
        query: str,
        results: List[Dict[str, Any]],
        relevance_labels: Optional[Dict[str, float]] = None,
        conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Log retrieval quality metrics to Firestore.

        Args:
            query: Search query
            results: Retrieval results
            relevance_labels: Optional manual relevance labels (0-3)
            conversation_id: Optional conversation ID

        Returns:
            Quality metrics dict
        """
        if not self.db:
            logger.debug("Firestore not configured, skipping quality logging")
            return {}

        try:
            # Calculate metrics if labels provided
            mrr = None
            ndcg = None

            if relevance_labels:
                # MRR: find relevant docs (score >= 2)
                relevant_ids = [
                    doc_id for doc_id, score in relevance_labels.items()
                    if score >= 2.0
                ]
                if relevant_ids:
                    mrr = self.calculate_mrr(results, relevant_ids)

                # NDCG
                ndcg = self.calculate_ndcg(results, relevance_labels, k=5)

            # Build quality record
            quality_record = {
                "query": query,
                "results": [
                    {
                        "doc_id": r.get('id') or r.get('doc_id') or r.get('document_id'),
                        "score": r.get('score', 0.0),
                        "rank": i + 1
                    }
                    for i, r in enumerate(results[:10])
                ],
                "relevance_labels": relevance_labels or {},
                "mrr": mrr,
                "ndcg_at_5": ndcg,
                "conversation_id": conversation_id,
                "timestamp": datetime.now(timezone.utc),
                "labeled": relevance_labels is not None
            }

            # Store in Firestore (sync call wrapped for async context)
            import asyncio
            doc_ref = await asyncio.to_thread(
                self.db.collection("retrieval_quality").add,
                quality_record
            )
            logger.info(f"Logged retrieval quality: MRR={mrr}, NDCG@5={ndcg}")

            return {
                "id": doc_ref[1].id,
                "mrr": mrr,
                "ndcg_at_5": ndcg
            }

        except Exception as e:
            logger.error(f"Error logging retrieval quality: {e}")
            return {}

    async def get_quality_trends(
        self,
        days: int = 30,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get quality metric trends over time.

        Args:
            days: Number of days to analyze
            category: Optional category filter

        Returns:
            Trend data dict
        """
        if not self.db:
            logger.warning("Firestore not configured, cannot get trends")
            return {}

        try:
            # Query recent quality records
            from datetime import timedelta
            start_date = datetime.now(timezone.utc) - timedelta(days=days)

            query_ref = self.db.collection("retrieval_quality").where(
                "timestamp", ">=", start_date
            ).where(
                "labeled", "==", True  # Only labeled queries
            )

            snapshot = await query_ref.get()

            # Aggregate metrics
            mrr_scores = []
            ndcg_scores = []

            for doc in snapshot:
                data = doc.to_dict()
                if data.get("mrr") is not None:
                    mrr_scores.append(data["mrr"])
                if data.get("ndcg_at_5") is not None:
                    ndcg_scores.append(data["ndcg_at_5"])

            if not mrr_scores and not ndcg_scores:
                return {
                    "avg_mrr": None,
                    "avg_ndcg": None,
                    "sample_size": 0,
                    "message": "No labeled data available"
                }

            avg_mrr = sum(mrr_scores) / len(mrr_scores) if mrr_scores else None
            avg_ndcg = sum(ndcg_scores) / len(ndcg_scores) if ndcg_scores else None

            return {
                "avg_mrr": round(avg_mrr, 4) if avg_mrr else None,
                "avg_ndcg": round(avg_ndcg, 4) if avg_ndcg else None,
                "sample_size": len(snapshot),
                "period_days": days
            }

        except Exception as e:
            logger.error(f"Error getting quality trends: {e}")
            return {}


# Convenience function for integration
async def log_rag_quality(
    query: str,
    results: List[Dict[str, Any]],
    relevance_labels: Optional[Dict[str, float]] = None,
    db: Any = None
) -> Dict[str, Any]:
    """
    Convenience function to log RAG quality metrics.

    Args:
        query: Search query
        results: Retrieval results
        relevance_labels: Optional relevance labels
        db: Firestore client

    Returns:
        Quality metrics
    """
    metrics = RAGQualityMetrics(db)
    return await metrics.log_retrieval_quality(query, results, relevance_labels)
