import logging
import os
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class AgentMonitoring:
    """
    Lightweight monitoring helper that emits structured Cloud Logging entries.
    These logs can be used to create Logs-based Metrics and Alerting policies
    without introducing new runtime dependencies in Cloud Run.

    Usage:
        mon = AgentMonitoring(service="marketing-api", environment=os.getenv("ENVIRONMENT", "unknown"))
        ctx = mon.start_request(agent_type="marketing", page_context="homepage")
        try:
            # ... do work ...
            mon.end_request(ctx, success=True)
        except Exception as e:
            mon.record_error(agent_type="marketing", error_type=type(e).__name__, details=str(e))
            mon.end_request(ctx, success=False)
            raise
    """

    def __init__(self, service: str, environment: str = "unknown") -> None:
        self.service = service
        self.environment = environment

    def start_request(self, agent_type: str, page_context: Optional[str] = None) -> Dict[str, Any]:
        ctx = {
            "_start": time.time(),
            "agent_type": agent_type,
            "page_context": page_context or "unknown",
        }
        # Emit a start log (info)
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

    def end_request(self, ctx: Dict[str, Any], success: bool, extra_metadata: Optional[Dict[str, Any]] = None) -> None:
        duration_ms = int((time.time() - ctx.get("_start", time.time())) * 1000)
        payload = {
            "monitoring": {
                "event": "agent_request_end",
                "service": self.service,
                "environment": self.environment,
                "agent_type": ctx.get("agent_type", "unknown"),
                "page_context": ctx.get("page_context", "unknown"),
                "success": success,
                "duration_ms": duration_ms,
            }
        }
        if extra_metadata:
            payload["monitoring"]["metadata"] = extra_metadata
        logger.info(payload)

    def record_error(self, agent_type: str, error_type: str, details: Optional[str] = None, page_context: Optional[str] = None) -> None:
        logger.error({
            "monitoring": {
                "event": "agent_error",
                "service": self.service,
                "environment": self.environment,
                "agent_type": agent_type,
                "page_context": page_context or "unknown",
                "error_type": error_type,
                "details": (details or "")[:5000],  # avoid excessively large logs
            }
        })

    def record_tool_usage(self, agent_type: str, tool_name: str, duration_ms: int, success: bool, page_context: Optional[str] = None) -> None:
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
        """
        Record business metrics for analytics and cost tracking.

        Args:
            agent_type: Type of agent (marketing, support, etc.)
            conversation_id: Unique conversation identifier
            message_count: Number of messages in this interaction (default: 1)
            token_usage: Dict with 'prompt_tokens', 'completion_tokens', 'total_tokens'
            estimated_cost_usd: Estimated API cost in USD
            tool_calls: Number of tool calls made
            page_context: Page context (homepage, pricing, etc.)
            model_name: LLM model name used
        """
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
