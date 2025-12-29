"""
Enhanced Metrics Tracking for Marketing Agent
Phase 1 Recommendation #17: Enhanced metrics dashboard

Tracks comprehensive performance, quality, and business metrics:
- Performance: p50/p95/p99 latency, token usage
- Quality: validation pass rate, response word count
- Business: consultation conversion rate, KB category usage
"""

import time
import logging
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from collections import defaultdict
from datetime import datetime

logger = logging.getLogger(__name__)


class MetricsTracker:
    """
    Lightweight metrics tracker for marketing agent.
    Tracks performance, quality, and business metrics in-memory.

    In production, integrate with Prometheus/Cloud Monitoring.
    """

    def __init__(self) -> None:
        self.metrics: Dict[str, List[float]] = defaultdict(list)
        self.counters: Dict[str, int] = defaultdict(int)

    def record_latency(self, endpoint: str, latency_ms: float) -> Any:
        """Record request latency"""
        self.metrics[f"latency_{endpoint}"].append(latency_ms)

    def record_token_usage(self, input_tokens: int, output_tokens: int) -> Any:
        """Record token usage"""
        self.counters["total_input_tokens"] += input_tokens
        self.counters["total_output_tokens"] += output_tokens
        self.metrics["input_tokens"].append(input_tokens)
        self.metrics["output_tokens"].append(output_tokens)

    def record_validation(self, passed: bool, word_count: int, question_count: int) -> Any:
        """Record validation results"""
        self.counters["validation_total"] += 1
        if passed:
            self.counters["validation_passed"] += 1
        self.metrics["response_word_count"].append(word_count)
        self.metrics["follow_up_question_count"].append(question_count)

    def record_tool_call(self, tool_name: str, success: bool) -> Any:
        """Record tool call metrics"""
        self.counters[f"tool_call_{tool_name}"] += 1
        if success:
            self.counters[f"tool_success_{tool_name}"] += 1

    def record_kb_category(self, category: str) -> Any:
        """Record KB category access"""
        self.counters[f"kb_category_{category}"] += 1

    def record_consultation_request(self) -> Any:
        """Record consultation request (business metric)"""
        self.counters["consultation_requests"] += 1

    def get_percentile(self, metric_name: str, percentile: float) -> Optional[float]:
        """Calculate percentile for a metric"""
        values = self.metrics.get(metric_name, [])
        if not values:
            return None
        sorted_values = sorted(values)
        index = int(len(sorted_values) * (percentile / 100.0))
        return sorted_values[min(index, len(sorted_values) - 1)]

    def get_validation_pass_rate(self) -> float:
        """Get validation pass rate percentage"""
        total = self.counters.get("validation_total", 0)
        if total == 0:
            return 100.0
        passed = self.counters.get("validation_passed", 0)
        return (passed / total) * 100.0

    def get_summary(self) -> Dict[str, Any]:
        """Get metrics summary"""
        return {
            "performance": {
                "latency_p50": self.get_percentile("latency_chat", 50),
                "latency_p95": self.get_percentile("latency_chat", 95),
                "latency_p99": self.get_percentile("latency_chat", 99),
                "total_requests": len(self.metrics.get("latency_chat", [])),
            },
            "quality": {
                "validation_pass_rate": self.get_validation_pass_rate(),
                "avg_word_count": sum(self.metrics.get("response_word_count", [0])) / max(len(self.metrics.get("response_word_count", [1])), 1),
                "avg_questions": sum(self.metrics.get("follow_up_question_count", [0])) / max(len(self.metrics.get("follow_up_question_count", [1])), 1),
            },
            "tokens": {
                "total_input": self.counters.get("total_input_tokens", 0),
                "total_output": self.counters.get("total_output_tokens", 0),
                "avg_input": sum(self.metrics.get("input_tokens", [0])) / max(len(self.metrics.get("input_tokens", [1])), 1),
                "avg_output": sum(self.metrics.get("output_tokens", [0])) / max(len(self.metrics.get("output_tokens", [1])), 1),
            },
            "business": {
                "consultation_requests": self.counters.get("consultation_requests", 0),
                "conversion_rate": self._calculate_conversion_rate(),
            },
            "tool_usage": self._get_tool_stats(),
            "kb_categories": self._get_kb_category_stats(),
        }

    def _calculate_conversion_rate(self) -> float:
        """Calculate consultation conversion rate"""
        total_requests = len(self.metrics.get("latency_chat", []))
        if total_requests == 0:
            return 0.0
        consultations = self.counters.get("consultation_requests", 0)
        return (consultations / total_requests) * 100.0

    def _get_tool_stats(self) -> Dict[str, Dict[str, float]]:
        """Get tool call statistics"""
        tools: Dict[str, Dict[str, float]] = {}
        for key, count in self.counters.items():
            if key.startswith("tool_call_"):
                tool_name = key.replace("tool_call_", "")
                success_count = self.counters.get(f"tool_success_{tool_name}", 0)
                tools[tool_name] = {
                    "calls": float(count),
                    "success": float(success_count),
                    "success_rate": (success_count / count * 100.0) if count > 0 else 0.0
                }
        return tools

    def _get_kb_category_stats(self) -> Dict[str, int]:
        """Get KB category access statistics"""
        categories = {}
        for key, count in self.counters.items():
            if key.startswith("kb_category_"):
                category = key.replace("kb_category_", "")
                categories[category] = count
        return categories

    def log_summary(self) -> Any:
        """Log metrics summary to logger"""
        summary = self.get_summary()
        logger.info("=== Marketing Agent Metrics Summary ===")
        logger.info(f"Performance: {summary['performance']}")
        logger.info(f"Quality: {summary['quality']}")
        logger.info(f"Tokens: {summary['tokens']}")
        logger.info(f"Business: {summary['business']}")
        logger.info(f"Tool Usage: {summary['tool_usage']}")
        logger.info(f"KB Categories: {summary['kb_categories']}")


# Global metrics tracker instance
_metrics_tracker = MetricsTracker()


def get_metrics_tracker() -> MetricsTracker:
    """Get global metrics tracker instance"""
    return _metrics_tracker
