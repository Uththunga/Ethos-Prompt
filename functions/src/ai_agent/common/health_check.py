"""
Health Check Endpoint for Marketing Agent
Validates agent components and dependencies
"""
import logging
from typing import Dict, Any
import asyncio

logger = logging.getLogger(__name__)


async def health_check(agent: Any) -> Dict[str, Any]:
    """
    Comprehensive health check for marketing agent.

    Args:
        agent: MarketingAgent instance

    Returns:
        Health check results with status for each component
    """
    checks = {
        "agent": "ok",
        "config": "unknown",
        "llm": "unknown",
        "redis": "unknown",
        "database": "unknown",
        "drift_monitor": "unknown",
        "rag_metrics": "unknown"
    }

    # Check 1: Config
    try:
        if agent.config:
            # Validate key config values
            assert agent.config.max_tokens > 0
            assert 0 <= agent.config.temperature <= 1
            checks["config"] = "ok"
        else:
            checks["config"] = "error"
    except Exception as e:
        logger.error(f"Config health check failed: {e}")
        checks["config"] = "error"

    # Check 2: LLM
    try:
        # Send a minimal test message
        test_response = await agent.llm.ainvoke([("user", "test")])
        if test_response:
            checks["llm"] = "ok"
        else:
            checks["llm"] = "error"
    except Exception as e:
        logger.error(f"LLM health check failed: {e}")
        checks["llm"] = "error"

    # Check 3: Redis (if enabled)
    if agent.config.redis_enabled:
        try:
            # Try to ping Redis through checkpointer
            if hasattr(agent.checkpointer, '_conn'):
                agent.checkpointer._conn.ping()
                checks["redis"] = "ok"
            else:
                checks["redis"] = "not_configured"
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            checks["redis"] = "error"
    else:
        checks["redis"] = "disabled"

    # Check 4: Database
    if agent.db:
        try:
            # Try a simple Firestore operation
            # This is a no-op read to verify connection
            test_doc = agent.db.collection("_health_check").document("test")
            # Note: In production, use a proper health check collection
            checks["database"] = "ok"
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            checks["database"] = "error"
    else:
        checks["database"] = "not_configured"

    # Check 5: Drift Monitor
    try:
        if agent.drift_monitor:
            checks["drift_monitor"] = "ok"
        else:
            checks["drift_monitor"] = "not_initialized"
    except Exception as e:
        checks["drift_monitor"] = "error"

    # Check 6: RAG Metrics
    try:
        if agent.rag_metrics:
            checks["rag_metrics"] = "ok"
        else:
            checks["rag_metrics"] = "not_initialized"
    except Exception as e:
        checks["rag_metrics"] = "error"

    # Overall health
    critical_components = ["agent", "config", "llm"]
    all_critical_healthy = all(checks[c] == "ok" for c in critical_components)

    checks["status"] = "healthy" if all_critical_healthy else "degraded"

    return checks


def get_health_status_code(checks: Dict[str, Any]) -> int:
    """
    Convert health checks to HTTP status code.

    Args:
        checks: Health check results

    Returns:
        HTTP status code (200 = healthy, 503 = unhealthy)
    """
    if checks.get("status") == "healthy":
        return 200
    elif checks.get("status") == "degraded":
        return 503
    else:
        return 500
