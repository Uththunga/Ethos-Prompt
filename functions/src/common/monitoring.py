"""
Production Monitoring with Prometheus Metrics
Provides comprehensive observability for Marketing Agent
"""
import logging
import os
import time
from typing import Any, Dict, Optional
from functools import wraps
import asyncio

logger = logging.getLogger(__name__)

# Try to import Prometheus client (optional dependency)
PROMETHEUS_AVAILABLE = False
try:
    from prometheus_client import Counter, Histogram, Gauge, Info
    PROMETHEUS_AVAILABLE = True
except ImportError:
    logger.warning("prometheus_client not available. Install with: pip install prometheus-client")

# ============================================================================
# Prometheus Metrics Definitions
# ============================================================================

if PROMETHEUS_AVAILABLE:
    # Request metrics
    REQUEST_COUNT = Counter(
        'marketing_agent_requests_total',
        'Total number of marketing agent requests',
        ['agent_type', 'page_context', 'status']
    )

    REQUEST_DURATION = Histogram(
        'marketing_agent_request_duration_seconds',
        'Marketing agent request duration in seconds',
        ['agent_type', 'page_context'],
        buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0)
    )

    # Error metrics
    ERROR_COUNT = Counter(
        'marketing_agent_errors_total',
        'Total number of marketing agent errors',
        ['agent_type', 'error_type', 'page_context']
    )

    # Tool usage metrics
    TOOL_CALLS = Counter(
        'marketing_agent_tool_calls_total',
        'Total number of tool calls',
        ['agent_type', 'tool_name', 'status']
    )

    TOOL_DURATION = Histogram(
        'marketing_agent_tool_duration_seconds',
        'Tool execution duration in seconds',
        ['agent_type', 'tool_name'],
        buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0)
    )

    # Token usage metrics
    TOKEN_USAGE = Counter(
        'marketing_agent_tokens_total',
        'Total tokens used',
        ['agent_type', 'token_type', 'model']  # token_type: prompt, completion
    )

    # Cost metrics
    ESTIMATED_COST = Counter(
        'marketing_agent_cost_usd_total',
        'Estimated API cost in USD',
        ['agent_type', 'model']
    )

    # Active requests gauge
    ACTIVE_REQUESTS = Gauge(
        'marketing_agent_active_requests',
        'Number of currently active requests',
        ['agent_type']
    )

    # Agent info
    AGENT_INFO = Info(
        'marketing_agent',
        'Marketing agent version and configuration'
    )

    # Set agent info
    AGENT_INFO.info({
        'version': '1.0.0',
        'environment': os.getenv('ENVIRONMENT', 'unknown'),
        'llm_provider': 'granite' if os.getenv('USE_GRANITE_LLM', 'false').lower() == 'true' else 'openrouter'
    })


class AgentMonitoring:
    """
    Comprehensive monitoring for Marketing Agent with Prometheus metrics
    and Cloud Logging structured logs.

    Supports both Prometheus metrics (when available) and log-based metrics.
    """

    def __init__(self, service: str, environment: str = "unknown") -> None:
        self.service = service
        self.environment = environment
        self.prometheus_enabled = PROMETHEUS_AVAILABLE

        if self.prometheus_enabled:
            logger.info("Prometheus metrics enabled")
        else:
            logger.info("Using log-based metrics only (Prometheus not available)")

    def start_request(self, agent_type: str, page_context: Optional[str] = None) -> Dict[str, Any]:
        """Start tracking a request"""
        ctx = {
            "_start": time.time(),
            "agent_type": agent_type,
            "page_context": page_context or "unknown",
        }

        # Increment active requests gauge
        if self.prometheus_enabled:
            ACTIVE_REQUESTS.labels(agent_type=agent_type).inc()

        # Emit structured log
        logger.info({
            "monitoring": {
                "event": "agent_request_start",
                "service": self.service,
                "environment": self.environment,
                "agent_type": agent_type,
                "page_context": ctx["page_context"],
            }
        })

        return ctx

    def end_request(
        self,
        ctx: Dict[str, Any],
        success: bool,
        extra_metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """End tracking a request"""
        duration_seconds = time.time() - ctx.get("_start", time.time())
        duration_ms = int(duration_seconds * 1000)

        agent_type = ctx.get("agent_type", "unknown")
        page_context = ctx.get("page_context", "unknown")
        status = "success" if success else "error"

        # Update Prometheus metrics
        if self.prometheus_enabled:
            REQUEST_COUNT.labels(
                agent_type=agent_type,
                page_context=page_context,
                status=status
            ).inc()

            REQUEST_DURATION.labels(
                agent_type=agent_type,
                page_context=page_context
            ).observe(duration_seconds)

            ACTIVE_REQUESTS.labels(agent_type=agent_type).dec()

        # Emit structured log
        payload = {
            "monitoring": {
                "event": "agent_request_end",
                "service": self.service,
                "environment": self.environment,
                "agent_type": agent_type,
                "page_context": page_context,
                "success": success,
                "duration_ms": duration_ms,
            }
        }

        if extra_metadata:
            payload["monitoring"]["metadata"] = extra_metadata

        logger.info(payload)

    def record_error(
        self,
        agent_type: str,
        error_type: str,
        details: Optional[str] = None,
        page_context: Optional[str] = None
    ) -> None:
        """Record an error"""
        # Update Prometheus metrics
        if self.prometheus_enabled:
            ERROR_COUNT.labels(
                agent_type=agent_type,
                error_type=error_type,
                page_context=page_context or "unknown"
            ).inc()

        # Emit structured log
        logger.error({
            "monitoring": {
                "event": "agent_error",
                "service": self.service,
                "environment": self.environment,
                "agent_type": agent_type,
                "page_context": page_context or "unknown",
                "error_type": error_type,
                "details": (details or "")[:5000],
            }
        })

    def record_tool_usage(
        self,
        agent_type: str,
        tool_name: str,
        duration_ms: int,
        success: bool,
        page_context: Optional[str] = None
    ) -> None:
        """Record tool usage"""
        duration_seconds = duration_ms / 1000.0
        status = "success" if success else "error"

        # Update Prometheus metrics
        if self.prometheus_enabled:
            TOOL_CALLS.labels(
                agent_type=agent_type,
                tool_name=tool_name,
                status=status
            ).inc()

            TOOL_DURATION.labels(
                agent_type=agent_type,
                tool_name=tool_name
            ).observe(duration_seconds)

        # Emit structured log
        logger.info({
            "monitoring": {
                "event": "agent_tool_usage",
                "service": self.service,
                "environment": self.environment,
                "agent_type": agent_type,
                "tool_name": tool_name,
                "duration_ms": duration_ms,
                "success": success,
                "page_context": page_context or "unknown",
            }
        })

    def record_business_metrics(
        self,
        agent_type: str,
        conversation_id: str,
        message_count: int = 1,
        token_usage: Optional[Dict[str, int]] = None,
        estimated_cost_usd: Optional[float] = None,
        tool_calls: Optional[int] = None,
        page_context: Optional[str] = None,
        model_name: Optional[str] = None,
    ) -> None:
        """Record business metrics"""
        # Update Prometheus metrics
        if self.prometheus_enabled and token_usage:
            # Record prompt tokens
            if "prompt_tokens" in token_usage:
                TOKEN_USAGE.labels(
                    agent_type=agent_type,
                    token_type="prompt",
                    model=model_name or "unknown"
                ).inc(token_usage["prompt_tokens"])

            # Record completion tokens
            if "completion_tokens" in token_usage:
                TOKEN_USAGE.labels(
                    agent_type=agent_type,
                    token_type="completion",
                    model=model_name or "unknown"
                ).inc(token_usage["completion_tokens"])

        if self.prometheus_enabled and estimated_cost_usd is not None:
            ESTIMATED_COST.labels(
                agent_type=agent_type,
                model=model_name or "unknown"
            ).inc(estimated_cost_usd)

        # Emit structured log
        payload = {
            "monitoring": {
                "event": "business_metrics",
                "service": self.service,
                "environment": self.environment,
                "agent_type": agent_type,
                "conversation_id": conversation_id,
                "message_count": message_count,
                "page_context": page_context or "unknown",
            }
        }

        if token_usage:
            payload["monitoring"]["token_usage"] = token_usage
            payload["monitoring"]["total_tokens"] = token_usage.get("total_tokens", 0)

        if estimated_cost_usd is not None:
            payload["monitoring"]["estimated_cost_usd"] = estimated_cost_usd

        if tool_calls is not None:
            payload["monitoring"]["tool_calls"] = tool_calls

        if model_name:
            payload["monitoring"]["model_name"] = model_name

        logger.info(payload)


# ============================================================================
# Monitoring Decorators
# ============================================================================

def track_request(agent_type: str = "marketing"):
    """
    Decorator to automatically track request metrics

    Usage:
        @track_request(agent_type="marketing")
        async def my_handler(request):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            mon = AgentMonitoring(service="marketing-api", environment=os.getenv("ENVIRONMENT", "unknown"))

            # Extract page_context from kwargs if available
            page_context = kwargs.get("page_context") or kwargs.get("context", {}).get("page_context")

            ctx = mon.start_request(agent_type=agent_type, page_context=page_context)

            try:
                result = await func(*args, **kwargs)
                mon.end_request(ctx, success=True)
                return result
            except Exception as e:
                mon.record_error(
                    agent_type=agent_type,
                    error_type=type(e).__name__,
                    details=str(e),
                    page_context=page_context
                )
                mon.end_request(ctx, success=False)
                raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            mon = AgentMonitoring(service="marketing-api", environment=os.getenv("ENVIRONMENT", "unknown"))

            page_context = kwargs.get("page_context") or kwargs.get("context", {}).get("page_context")

            ctx = mon.start_request(agent_type=agent_type, page_context=page_context)

            try:
                result = func(*args, **kwargs)
                mon.end_request(ctx, success=True)
                return result
            except Exception as e:
                mon.record_error(
                    agent_type=agent_type,
                    error_type=type(e).__name__,
                    details=str(e),
                    page_context=page_context
                )
                mon.end_request(ctx, success=False)
                raise

        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator
