"""
Prompt Version Manager
Manages prompt versions in Firestore with performance tracking and rollback capability
"""

from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class PromptVersionManager:
    """
    Manage prompt versions in Firestore

    Features:
    - Version registration with SHA256 hash
    - Active version management
    - Performance metrics tracking
    - Rollback capability
    - Deprecation support

    NOTE: Uses synchronous Firestore API intentionally because this is an
    admin/utility class not called in the request hot path. Methods are
    called during deployment or manual admin operations.
    """

    def __init__(self, db: Any) -> None:
        """
        Initialize version manager

        Args:
            db: Firestore client
        """
        self.db = db
        self.collection = "prompt_versions"

    def register_version(
        self,
        prompt_template: str,
        few_shot_examples: List[Dict],
        metadata: Dict[str, Any]
    ) -> str:
        """
        Register new prompt version

        Args:
            prompt_template: System prompt template
            few_shot_examples: List of few-shot example dicts
            metadata: Version metadata (major, minor, patch, description, etc.)

        Returns:
            version_id (e.g., "v1.2.3-abc123")
        """
        # Generate version hash from content
        content = json.dumps({
            "template": prompt_template,
            "examples": few_shot_examples
        }, sort_keys=True)

        version_hash = hashlib.sha256(content.encode()).hexdigest()[:8]

        # Construct semantic version
        major = metadata.get('major', 1)
        minor = metadata.get('minor', 0)
        patch = metadata.get('patch', 0)
        version_id = f"v{major}.{minor}.{patch}-{version_hash}"

        # Store in Firestore
        doc_ref = self.db.collection(self.collection).document(version_id)
        doc_ref.set({
            "version_id": version_id,
            "prompt_template": prompt_template,
            "few_shot_examples": few_shot_examples,
            "metadata": {
                **metadata,
                "major": major,
                "minor": minor,
                "patch": patch,
                "hash": version_hash
            },
            "created_at": datetime.now(timezone.utc),
            "active": False,
            "performance_metrics": {},
            "deprecated_at": None,
            "deprecation_reason": None
        })

        logger.info(f"✓ Registered prompt version: {version_id}")
        return version_id

    def set_active_version(self, version_id: str) -> None:
        """
        Set a version as active (deactivates all others)

        Args:
            version_id: Version to activate
        """
        # Verify version exists
        doc = self.db.collection(self.collection).document(version_id).get()
        if not doc.exists:
            raise ValueError(f"Version {version_id} not found")

        # Deactivate all versions
        versions = self.db.collection(self.collection).where("active", "==", True).stream()
        for v in versions:
            v.reference.update({"active": False})

        # Activate new version
        self.db.collection(self.collection).document(version_id).update({
            "active": True,
            "activated_at": datetime.now(timezone.utc)
        })

        logger.info(f"✓ Activated prompt version: {version_id}")

    def get_active_version(self) -> Optional[Dict[str, Any]]:
        """
        Get current active prompt version

        Returns:
            Version document dict or None
        """
        active = self.db.collection(self.collection).where("active", "==", True).limit(1).stream()

        for doc in active:
            return doc.to_dict()

        return None

    def get_version(self, version_id: str) -> Optional[Dict[str, Any]]:
        """
        Get specific version by ID

        Args:
            version_id: Version identifier

        Returns:
            Version document dict or None
        """
        doc = self.db.collection(self.collection).document(version_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    def list_versions(self, include_deprecated: bool = False) -> List[Dict[str, Any]]:
        """
        List all prompt versions

        Args:
            include_deprecated: Include deprecated versions

        Returns:
            List of version dicts, sorted by created_at descending
        """
        query = self.db.collection(self.collection)

        if not include_deprecated:
            query = query.where("deprecated_at", "==", None)

        versions = query.order_by("created_at", direction="DESCENDING").stream()

        return [v.to_dict() for v in versions]

    def log_performance(self, version_id: str, metrics: Dict[str, float]) -> Any:
        """
        Log performance metrics for a version

        Args:
            version_id: Version to track
            metrics: Performance metrics dict (e.g., eval_score, reflection_rate)
        """
        timestamp = datetime.now(timezone.utc).isoformat()

        self.db.collection(self.collection).document(version_id).update({
            f"performance_metrics.{timestamp}": metrics
        })

        logger.info(f"✓ Logged metrics for {version_id}: {metrics}")

    def deprecate_version(self, version_id: str, reason: str) -> Any:
        """
        Mark a version as deprecated

        Args:
            version_id: Version to deprecate
            reason: Deprecation reason
        """
        self.db.collection(self.collection).document(version_id).update({
            "deprecated_at": datetime.now(timezone.utc),
            "deprecation_reason": reason,
            "active": False
        })

        logger.info(f"✓ Deprecated version {version_id}: {reason}")

    def compare_versions(self, version_a: str, version_b: str) -> Dict[str, Any]:
        """
        Compare two versions' performance

        Args:
            version_a: First version ID
            version_b: Second version ID

        Returns:
            Comparison report
        """
        v_a = self.get_version(version_a)
        v_b = self.get_version(version_b)

        if not v_a or not v_b:
            raise ValueError("One or both versions not found")

        # Get average metrics
        metrics_a = v_a.get("performance_metrics", {})
        metrics_b = v_b.get("performance_metrics", {})

        def avg_metric(metrics_dict, key) -> Any:
            values = [m.get(key, 0) for m in metrics_dict.values() if isinstance(m, dict)]
            return sum(values) / len(values) if values else 0

        comparison = {
            "version_a": version_a,
            "version_b": version_b,
            "avg_eval_score_a": avg_metric(metrics_a, "eval_score"),
            "avg_eval_score_b": avg_metric(metrics_b, "eval_score"),
            "avg_reflection_rate_a": avg_metric(metrics_a, "reflection_rate"),
            "avg_reflection_rate_b": avg_metric(metrics_b, "reflection_rate"),
            "sample_count_a": len(metrics_a),
            "sample_count_b": len(metrics_b)
        }

        return comparison


# Global instance (initialized when db is available)
_version_manager = None


def get_version_manager(db) -> Any:
    """
    Get or create global version manager instance

    Args:
        db: Firestore client

    Returns:
        PromptVersionManager instance
    """
    global _version_manager

    if _version_manager is None:
        _version_manager = PromptVersionManager(db)

    return _version_manager
