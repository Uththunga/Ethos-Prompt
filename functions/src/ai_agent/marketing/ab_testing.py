"""
A/B Testing Infrastructure for Marketing Agent
Phase 3 Recommendation #14: A/B Testing

Provides variant assignment, configuration management, and metrics tracking
for testing optimization hypotheses.
"""

import hashlib
import logging
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class Variant(Enum):
    """A/B test variant identifiers"""
    CONTROL = "control"          # Baseline configuration
    VARIANT_A = "variant_a"      # Test variation A
    VARIANT_B = "variant_b"      # Test variation B
    VARIANT_C = "variant_c"      # Test variation C (optional)


@dataclass
class VariantConfig:
    """Configuration for a specific variant"""
    variant: Variant
    temperature: float
    max_tokens: int
    top_k: int
    description: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "variant": self.variant.value,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_k": self.top_k,
            "description": self.description
        }


# Pre-configured variant settings
VARIANT_CONFIGS = {
    Variant.CONTROL: VariantConfig(
        variant=Variant.CONTROL,
        temperature=0.6,
        max_tokens=400,
        top_k=5,
        description="Baseline: Current production settings"
    ),
    Variant.VARIANT_A: VariantConfig(
        variant=Variant.VARIANT_A,
        temperature=0.8,
        max_tokens=400,
        top_k=5,
        description="Higher temperature for more creative responses"
    ),
    Variant.VARIANT_B: VariantConfig(
        variant=Variant.VARIANT_B,
        temperature=0.6,
        max_tokens=600,
        top_k=7,
        description="Longer responses with more retrieval context"
    ),
    Variant.VARIANT_C: VariantConfig(
        variant=Variant.VARIANT_C,
        temperature=0.5,
        max_tokens=350,
        top_k=5,
        description="More deterministic, slightly shorter responses"
    ),
}


class ABTestManager:
    """
    Manages A/B test variant assignment and metrics tracking.
    """

    def __init__(
        self,
        enabled: bool = False,
        control_percentage: int = 50,
        variant_a_percentage: int = 25,
        variant_b_percentage: int = 25,
        variant_c_percentage: int = 0
    ) -> Any:
        """
        Initialize A/B test manager.

        Args:
            enabled: Whether A/B testing is enabled
            control_percentage: % of traffic for control (0-100)
            variant_a_percentage: % of traffic for variant A
            variant_b_percentage: % of traffic for variant B
            variant_c_percentage: % of traffic for variant C
        """
        self.enabled = enabled
        self.control_pct = control_percentage
        self.variant_a_pct = variant_a_percentage
        self.variant_b_pct = variant_b_percentage
        self.variant_c_pct = variant_c_percentage

        # Validate percentages sum to 100
        total = control_percentage + variant_a_percentage + variant_b_percentage + variant_c_percentage
        if total != 100:
            raise ValueError(f"Variant percentages must sum to 100, got {total}")

    def assign_variant(self, user_id: str) -> Variant:
        """
        Assign a variant to a user based on consistent hashing.

        Args:
            user_id: Unique user identifier (or session ID)

        Returns:
            Assigned variant
        """
        if not self.enabled:
            return Variant.CONTROL

        # Use consistent hashing for stable assignment
        hash_val = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
        bucket = hash_val % 100  # 0-99

        # Assign based on percentage ranges
        if bucket < self.control_pct:
            return Variant.CONTROL
        elif bucket < self.control_pct + self.variant_a_pct:
            return Variant.VARIANT_A
        elif bucket < self.control_pct + self.variant_a_pct + self.variant_b_pct:
            return Variant.VARIANT_B
        else:
            return Variant.VARIANT_C

    def get_config(self, variant: Variant) -> VariantConfig:
        """Get configuration for a variant"""
        return VARIANT_CONFIGS[variant]

    def log_variant_assignment(self, user_id: str, variant: Variant, conversation_id: str) -> Any:
        """Log variant assignment for analytics"""
        logger.info({
            "event": "ab_test_assignment",
            "user_id": user_id,
            "conversation_id": conversation_id,
            "variant": variant.value,
            "config": self.get_config(variant).to_dict()
        })


class ABTestMetrics:
    """
    Tracks metrics per variant for A/B test analysis.
    """

    def __init__(self) -> None:
        self.metrics_by_variant: Dict[Variant, List[Dict[str, Any]]] = {variant: [] for variant in Variant}

    def record_interaction(
        self,
        variant: Variant,
        response_word_count: int,
        validation_passed: bool,
        follow_up_question_count: int,
        latency_ms: float,
        tool_calls: int,
        user_continued: bool  # Did user send another message?
    ) -> Any:
        """
        Record interaction metrics for a variant.

        Args:
            variant: Which variant this interaction used
            response_word_count: Word count of response
            validation_passed: Whether validation passed
            follow_up_question_count: Number of follow-up questions
            latency_ms: Response latency in milliseconds
            tool_calls: Number of tool calls made
            user_continued: Whether user continued conversation
        """
        metrics = {
            "word_count": response_word_count,
            "validation_passed": validation_passed,
            "follow_up_questions": follow_up_question_count,
            "latency_ms": latency_ms,
            "tool_calls": tool_calls,
            "user_continued": user_continued
        }

        self.metrics_by_variant[variant].append(metrics)

        logger.info({
            "event": "ab_test_metrics",
            "variant": variant.value,
            "metrics": metrics
        })

    def get_summary(self) -> Dict[str, Dict[str, Any]]:
        """
        Get summary statistics for each variant.

        Returns:
            Dict with variant -> stats mapping
        """
        summary = {}

        for variant, metrics_list in self.metrics_by_variant.items():
            if not metrics_list:
                summary[variant.value] = {"sample_size": 0}
                continue

            n = len(metrics_list)
            summary[variant.value] = {
                "sample_size": n,
                "avg_word_count": sum(m["word_count"] for m in metrics_list) / n,
                "validation_pass_rate": sum(m["validation_passed"] for m in metrics_list) / n * 100,
                "avg_follow_up_questions": sum(m["follow_up_questions"] for m in metrics_list) / n,
                "avg_latency_ms": sum(m["latency_ms"] for m in metrics_list) / n,
                "avg_tool_calls": sum(m["tool_calls"] for m in metrics_list) / n,
                "engagement_rate": sum(m["user_continued"] for m in metrics_list) / n * 100
            }

        return summary


# Global A/B test manager (disabled by default)
_ab_test_manager = ABTestManager(enabled=False)
_ab_test_metrics = ABTestMetrics()


def get_ab_test_manager() -> ABTestManager:
    """Get global A/B test manager instance"""
    return _ab_test_manager


def get_ab_test_metrics() -> ABTestMetrics:
    """Get global A/B test metrics tracker"""
    return _ab_test_metrics


def enable_ab_testing(
    control_pct: int = 50,
    variant_a_pct: int = 25,
    variant_b_pct: int = 25
) -> Any:
    """
    Enable A/B testing with specified traffic split.

    Args:
        control_pct: Control group percentage
        variant_a_pct: Variant A percentage
        variant_b_pct: Variant B percentage
    """
    global _ab_test_manager
    _ab_test_manager = ABTestManager(
        enabled=True,
        control_percentage=control_pct,
        variant_a_percentage=variant_a_pct,
        variant_b_percentage=variant_b_pct
    )
    logger.info(f"A/B testing enabled: Control={control_pct}%, A={variant_a_pct}%, B={variant_b_pct}%")
