"""
Data Drift Monitoring System
Tracks query distribution changes over time to detect shifts in user behavior
"""

import logging
import hashlib
import math
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict

logger = logging.getLogger(__name__)


class DataDriftMonitor:
    """
    Monitor query distribution drift to detect changes in user behavior.

    Uses KL divergence to compare current query distribution against baseline.
    Triggers alerts when drift exceeds threshold.
    """

    def __init__(self, db: Any = None):
        """
        Initialize drift monitor.

        Args:
            db: Firestore client for persistence
        """
        self.db = db
        self.query_categories = [
            "pricing",
            "services",
            "technical",
            "consultation",
            "general"
        ]

    async def track_query(
        self,
        query: str,
        conversation_id: str,
        embedding: Optional[List[float]] = None
    ) -> None:
        """
        Track a query for drift detection.

        Args:
            query: User query text
            conversation_id: Conversation identifier
            embedding: Optional pre-computed embedding (will compute if not provided)
        """
        if not self.db:
            logger.debug("Firestore not configured, skipping drift tracking")
            return

        try:
            # SEC-002 FIX: Redact PII before storing query
            try:
                from ..security.pii_detector import redact_pii_from_text
                safe_query = redact_pii_from_text(query)
            except ImportError:
                # If PII detector not available, hash the query for privacy
                safe_query = f"[query_hash:{hashlib.sha256(query.encode()).hexdigest()[:8]}]"
                logger.warning("PII detector not available, using hash instead")

            # Classify query category (use original for classification accuracy)
            category = self._classify_query(query)

            # Generate query ID
            query_id = hashlib.sha256(
                f"{query}{datetime.now(timezone.utc).isoformat()}".encode()
            ).hexdigest()[:16]

            # Store query metadata with PII-safe text
            query_doc = {
                "query_text": safe_query,  # Use redacted/safe query
                "category": category,
                "conversation_id": conversation_id,
                "timestamp": datetime.now(timezone.utc),
                "embedding": embedding  # Can be None
            }

            # CODE-003 FIX: Use asyncio.to_thread for sync Firestore call in async method
            import asyncio
            await asyncio.to_thread(
                self.db.collection("query_embeddings").document(query_id).set,
                query_doc
            )

            logger.debug(f"Tracked query: category={category}, id={query_id}")

        except Exception as e:
            logger.error(f"Error tracking query for drift: {e}")

    def _classify_query(self, query: str) -> str:
        """
        Classify query into category using keyword matching.

        Args:
            query: Query text

        Returns:
            Category name
        """
        query_lower = query.lower()

        # Pricing keywords
        if any(word in query_lower for word in ["price", "cost", "pricing", "quote", "$", "pay"]):
            return "pricing"

        # Services keywords
        if any(word in query_lower for word in ["service", "solution", "offer", "integration", "assistant", "app"]):
            return "services"

        # Technical keywords
        if any(word in query_lower for word in ["api", "rag", "embed", "technical", "architecture", "how does", "integrate"]):
            return "technical"

        # Consultation keywords
        if any(word in query_lower for word in ["consultation", "demo", "schedule", "meeting", "contact", "talk"]):
            return "consultation"

        return "general"

    async def compute_distribution(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, float]:
        """
        Compute query category distribution for a time period.

        Args:
            start_date: Period start
            end_date: Period end

        Returns:
            Distribution dict {category: probability}
        """
        if not self.db:
            logger.warning("Firestore not configured, returning empty distribution")
            return {}

        try:
            # Query Firestore for queries in time range
            queries_ref = self.db.collection("query_embeddings")
            query_snapshot = await queries_ref.where(
                "timestamp", ">=", start_date
            ).where(
                "timestamp", "<=", end_date
            ).get()

            # Count by category
            category_counts: Dict[str, int] = defaultdict(int)
            total = 0

            for doc in query_snapshot:
                data = doc.to_dict()
                category = data.get("category", "general")
                category_counts[category] += 1
                total += 1

            if total == 0:
                logger.warning(f"No queries found between {start_date} and {end_date}")
                return {cat: 0.0 for cat in self.query_categories}

            # Compute probabilities
            distribution = {
                cat: category_counts.get(cat, 0) / total
                for cat in self.query_categories
            }

            logger.info(f"Computed distribution for {total} queries: {distribution}")
            return distribution

        except Exception as e:
            logger.error(f"Error computing distribution: {e}")
            return {}

    def calculate_kl_divergence(
        self,
        baseline_dist: Dict[str, float],
        current_dist: Dict[str, float]
    ) -> float:
        """
        Calculate KL divergence between two distributions.

        KL(P||Q) = sum(P(i) * log(P(i) / Q(i)))

        Args:
            baseline_dist: Baseline distribution P
            current_dist: Current distribution Q

        Returns:
            KL divergence value (0 = identical, higher = more different)
        """
        try:
            kl_div = 0.0
            epsilon = 1e-10  # Avoid log(0)

            for category in self.query_categories:
                p = baseline_dist.get(category, 0.0) + epsilon
                q = current_dist.get(category, 0.0) + epsilon

                kl_div += p * math.log(p / q)

            return kl_div

        except Exception as e:
            logger.error(f"Error calculating KL divergence: {e}")
            return 0.0

    async def detect_drift(
        self,
        threshold: float = 0.2,
        lookback_days: int = 30
    ) -> Dict[str, Any]:
        """
        Detect distribution drift compared to baseline.

        Args:
            threshold: KL divergence threshold for drift alert
            lookback_days: Days to use as baseline period

        Returns:
            Drift report dict
        """
        if not self.db:
            logger.warning("Firestore not configured, cannot detect drift")
            return {"drift_detected": False, "reason": "No database"}

        try:
            now = datetime.now(timezone.utc)

            # Baseline: lookback_days ago to 7 days ago
            baseline_start = now - timedelta(days=lookback_days)
            baseline_end = now - timedelta(days=7)

            # Current: last 7 days
            current_start = now - timedelta(days=7)
            current_end = now

            # Compute distributions
            baseline_dist = await self.compute_distribution(baseline_start, baseline_end)
            current_dist = await self.compute_distribution(current_start, current_end)

            if not baseline_dist or not current_dist:
                return {
                    "drift_detected": False,
                    "reason": "Insufficient data",
                    "baseline_period": f"{baseline_start.date()} to {baseline_end.date()}",
                    "current_period": f"{current_start.date()} to {current_end.date()}"
                }

            # Calculate KL divergence
            kl_div = self.calculate_kl_divergence(baseline_dist, current_dist)

            drift_detected = kl_div > threshold

            # Identify shifted categories
            shifts = []
            for cat in self.query_categories:
                baseline_pct = baseline_dist.get(cat, 0.0) * 100
                current_pct = current_dist.get(cat, 0.0) * 100
                diff = current_pct - baseline_pct

                if abs(diff) > 5.0:  # >5% change
                    shifts.append({
                        "category": cat,
                        "baseline_pct": round(baseline_pct, 1),
                        "current_pct": round(current_pct, 1),
                        "change": round(diff, 1)
                    })

            report = {
                "drift_detected": drift_detected,
                "kl_divergence": round(kl_div, 4),
                "threshold": threshold,
                "baseline_distribution": {k: round(v * 100, 1) for k, v in baseline_dist.items()},
                "current_distribution": {k: round(v * 100, 1) for k, v in current_dist.items()},
                "category_shifts": shifts,
                "baseline_period": f"{baseline_start.date()} to {baseline_end.date()}",
                "current_period": f"{current_start.date()} to {current_end.date()}",
                "timestamp": now.isoformat()
            }

            # Store drift report
            if drift_detected:
                week_id = now.strftime("%Y-W%W")
                await self.db.collection("drift_reports").document(week_id).set(report)
                logger.warning(f"⚠️ DRIFT DETECTED: KL={kl_div:.4f} > {threshold}")
            else:
                logger.info(f"✓ No drift detected: KL={kl_div:.4f} <= {threshold}")

            return report

        except Exception as e:
            logger.error(f"Error detecting drift: {e}")
            return {"drift_detected": False, "error": str(e)}


# Convenience function for easy integration
async def track_query_for_drift(
    query: str,
    conversation_id: str,
    db: Any = None
) -> None:
    """
    Convenience function to track a query.

    Args:
        query: User query text
        conversation_id: Conversation ID
        db: Firestore client
    """
    monitor = DataDriftMonitor(db)
    await monitor.track_query(query, conversation_id)
