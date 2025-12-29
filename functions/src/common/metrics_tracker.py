"""
Advanced Metrics Tracker for Marketing Agent
Extends base monitoring with detailed latency, validation, and business metrics
"""
import logging
import time
from typing import Any, Dict, Optional, List
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from src.common.monitoring import AgentMonitoring, PROMETHEUS_AVAILABLE

if PROMETHEUS_AVAILABLE:
    from prometheus_client import Histogram, Counter, Gauge

logger = logging.getLogger(__name__)


# ============================================================================
# Additional Prometheus Metrics
# ============================================================================

if PROMETHEUS_AVAILABLE:
    # Validation metrics
    VALIDATION_ERRORS = Counter(
        'marketing_agent_validation_errors_total',
        'Total validation errors',
        ['agent_type', 'validation_type', 'field']
    )

    # Latency breakdown metrics
    LLM_LATENCY = Histogram(
        'marketing_agent_llm_latency_seconds',
        'LLM call latency',
        ['agent_type', 'model'],
        buckets=(0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 30.0)
    )

    KB_RETRIEVAL_LATENCY = Histogram(
        'marketing_agent_kb_retrieval_latency_seconds',
        'KB retrieval latency',
        ['agent_type', 'category'],
        buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.0)
    )

    # Response quality metrics
    RESPONSE_LENGTH = Histogram(
        'marketing_agent_response_length_chars',
        'Response length in characters',
        ['agent_type'],
        buckets=(50, 100, 200, 500, 1000, 2000, 5000)
    )

    # User engagement metrics
    CONVERSATION_TURNS = Histogram(
        'marketing_agent_conversation_turns',
        'Number of turns in conversation',
        ['agent_type'],
        buckets=(1, 2, 3, 5, 10, 20, 50)
    )

    # Cache metrics
    CACHE_HITS = Counter(
        'marketing_agent_cache_hits_total',
        'Cache hits',
        ['agent_type', 'cache_type']
    )

    CACHE_MISSES = Counter(
        'marketing_agent_cache_misses_total',
        'Cache misses',
        ['agent_type', 'cache_type']
    )


# ============================================================================
# Metric Types
# ============================================================================

class MetricType(Enum):
    """Types of metrics to track"""
    LATENCY = "latency"
    VALIDATION = "validation"
    QUALITY = "quality"
    ENGAGEMENT = "engagement"
    CACHE = "cache"
    BUSINESS = "business"


@dataclass
class LatencyMetrics:
    """Latency breakdown metrics"""
    total_ms: int = 0
    llm_ms: int = 0
    kb_retrieval_ms: int = 0
    tool_execution_ms: int = 0
    validation_ms: int = 0

    def to_dict(self) -> Dict[str, int]:
        return {
            "total_ms": self.total_ms,
            "llm_ms": self.llm_ms,
            "kb_retrieval_ms": self.kb_retrieval_ms,
            "tool_execution_ms": self.tool_execution_ms,
            "validation_ms": self.validation_ms
        }


@dataclass
class ValidationMetrics:
    """Validation metrics"""
    total_validations: int = 0
    validation_errors: int = 0
    validation_warnings: int = 0
    error_types: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_validations": self.total_validations,
            "validation_errors": self.validation_errors,
            "validation_warnings": self.validation_warnings,
            "error_types": self.error_types
        }


@dataclass
class QualityMetrics:
    """Response quality metrics"""
    response_length_chars: int = 0
    response_length_tokens: int = 0
    sources_cited: int = 0
    tool_calls_made: int = 0
    fallback_used: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "response_length_chars": self.response_length_chars,
            "response_length_tokens": self.response_length_tokens,
            "sources_cited": self.sources_cited,
            "tool_calls_made": self.tool_calls_made,
            "fallback_used": self.fallback_used
        }


# ============================================================================
# Advanced Metrics Tracker
# ============================================================================

class MetricsTracker:
    """
    Advanced metrics tracker for Marketing Agent

    Tracks detailed metrics beyond basic monitoring:
    - Latency breakdown (LLM, KB, tools, validation)
    - Validation errors and warnings
    - Response quality metrics
    - User engagement metrics
    - Cache performance
    """

    def __init__(self, agent_type: str = "marketing"):
        self.agent_type = agent_type
        self.base_monitoring = AgentMonitoring(
            service="marketing-api",
            environment="production"
        )
        self.prometheus_enabled = PROMETHEUS_AVAILABLE

        # Current request metrics
        self.current_latency = LatencyMetrics()
        self.current_validation = ValidationMetrics()
        self.current_quality = QualityMetrics()

    # ========================================================================
    # Latency Tracking
    # ========================================================================

    def track_llm_latency(self, duration_ms: int, model: str = "unknown"):
        """Track LLM call latency"""
        self.current_latency.llm_ms += duration_ms

        if self.prometheus_enabled:
            LLM_LATENCY.labels(
                agent_type=self.agent_type,
                model=model
            ).observe(duration_ms / 1000.0)

        logger.info({
            "metric": "llm_latency",
            "agent_type": self.agent_type,
            "model": model,
            "duration_ms": duration_ms
        })

    def track_kb_retrieval_latency(self, duration_ms: int, category: str = "unknown"):
        """Track KB retrieval latency"""
        self.current_latency.kb_retrieval_ms += duration_ms

        if self.prometheus_enabled:
            KB_RETRIEVAL_LATENCY.labels(
                agent_type=self.agent_type,
                category=category
            ).observe(duration_ms / 1000.0)

        logger.info({
            "metric": "kb_retrieval_latency",
            "agent_type": self.agent_type,
            "category": category,
            "duration_ms": duration_ms
        })

    def track_tool_latency(self, tool_name: str, duration_ms: int):
        """Track tool execution latency"""
        self.current_latency.tool_execution_ms += duration_ms

        # Use base monitoring for tool tracking
        self.base_monitoring.record_tool_usage(
            agent_type=self.agent_type,
            tool_name=tool_name,
            duration_ms=duration_ms,
            success=True
        )

    def track_validation_latency(self, duration_ms: int):
        """Track validation latency"""
        self.current_latency.validation_ms += duration_ms

        logger.info({
            "metric": "validation_latency",
            "agent_type": self.agent_type,
            "duration_ms": duration_ms
        })

    # ========================================================================
    # Validation Tracking
    # ========================================================================

    def track_validation_error(
        self,
        validation_type: str,
        field: str,
        error_message: str
    ):
        """Track validation error"""
        self.current_validation.total_validations += 1
        self.current_validation.validation_errors += 1

        # Track error type
        if validation_type not in self.current_validation.error_types:
            self.current_validation.error_types[validation_type] = 0
        self.current_validation.error_types[validation_type] += 1

        if self.prometheus_enabled:
            VALIDATION_ERRORS.labels(
                agent_type=self.agent_type,
                validation_type=validation_type,
                field=field
            ).inc()

        logger.warning({
            "metric": "validation_error",
            "agent_type": self.agent_type,
            "validation_type": validation_type,
            "field": field,
            "error_message": error_message
        })

    def track_validation_success(self, validation_type: str):
        """Track successful validation"""
        self.current_validation.total_validations += 1

        logger.debug({
            "metric": "validation_success",
            "agent_type": self.agent_type,
            "validation_type": validation_type
        })

    # ========================================================================
    # Quality Tracking
    # ========================================================================

    def track_response_quality(
        self,
        response_text: str,
        token_count: Optional[int] = None,
        sources_cited: int = 0,
        tool_calls: int = 0,
        fallback_used: bool = False
    ):
        """Track response quality metrics"""
        self.current_quality.response_length_chars = len(response_text)
        self.current_quality.response_length_tokens = token_count or 0
        self.current_quality.sources_cited = sources_cited
        self.current_quality.tool_calls_made = tool_calls
        self.current_quality.fallback_used = fallback_used

        if self.prometheus_enabled:
            RESPONSE_LENGTH.labels(
                agent_type=self.agent_type
            ).observe(len(response_text))

        logger.info({
            "metric": "response_quality",
            "agent_type": self.agent_type,
            "response_length_chars": len(response_text),
            "response_length_tokens": token_count,
            "sources_cited": sources_cited,
            "tool_calls": tool_calls,
            "fallback_used": fallback_used
        })

    # ========================================================================
    # Engagement Tracking
    # ========================================================================

    def track_conversation_turn(self, conversation_id: str, turn_number: int):
        """Track conversation engagement"""
        if self.prometheus_enabled:
            CONVERSATION_TURNS.labels(
                agent_type=self.agent_type
            ).observe(turn_number)

        logger.info({
            "metric": "conversation_turn",
            "agent_type": self.agent_type,
            "conversation_id": conversation_id,
            "turn_number": turn_number
        })

    # ========================================================================
    # Cache Tracking
    # ========================================================================

    def track_cache_hit(self, cache_type: str = "response"):
        """Track cache hit"""
        if self.prometheus_enabled:
            CACHE_HITS.labels(
                agent_type=self.agent_type,
                cache_type=cache_type
            ).inc()

        logger.info({
            "metric": "cache_hit",
            "agent_type": self.agent_type,
            "cache_type": cache_type
        })

    def track_cache_miss(self, cache_type: str = "response"):
        """Track cache miss"""
        if self.prometheus_enabled:
            CACHE_MISSES.labels(
                agent_type=self.agent_type,
                cache_type=cache_type
            ).inc()

        logger.info({
            "metric": "cache_miss",
            "agent_type": self.agent_type,
            "cache_type": cache_type
        })

    # ========================================================================
    # Summary & Reporting
    # ========================================================================

    def get_request_summary(self) -> Dict[str, Any]:
        """Get summary of current request metrics"""
        return {
            "latency": self.current_latency.to_dict(),
            "validation": self.current_validation.to_dict(),
            "quality": self.current_quality.to_dict()
        }

    def reset_request_metrics(self):
        """Reset metrics for new request"""
        self.current_latency = LatencyMetrics()
        self.current_validation = ValidationMetrics()
        self.current_quality = QualityMetrics()

    def log_request_summary(self, conversation_id: str):
        """Log comprehensive request summary"""
        summary = self.get_request_summary()

        logger.info({
            "event": "request_summary",
            "agent_type": self.agent_type,
            "conversation_id": conversation_id,
            "metrics": summary
        })


# ============================================================================
# Context Manager for Request Tracking
# ============================================================================

class TrackRequest:
    """
    Context manager for tracking request metrics

    Usage:
        tracker = MetricsTracker()
        with TrackRequest(tracker, conversation_id="123"):
            # Do work
            tracker.track_llm_latency(500, "granite")
            tracker.track_validation_success("input")
    """

    def __init__(self, tracker: MetricsTracker, conversation_id: str):
        self.tracker = tracker
        self.conversation_id = conversation_id
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        self.tracker.reset_request_metrics()
        return self.tracker

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Calculate total duration
        if self.start_time:
            duration_ms = int((time.time() - self.start_time) * 1000)
            self.tracker.current_latency.total_ms = duration_ms

        # Log summary
        self.tracker.log_request_summary(self.conversation_id)

        return False  # Don't suppress exceptions
