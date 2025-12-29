"""
Example: Integrating Monitoring into Marketing Agent

This file demonstrates how to integrate the monitoring system
into the marketing agent endpoints.
"""

from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from prometheus_client import make_asgi_app
from src.common.monitoring import AgentMonitoring, track_request
from src.ai_agent.marketing.marketing_agent import get_marketing_agent

app = FastAPI()

# Mount Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# Initialize monitoring
mon = AgentMonitoring(service="marketing-api", environment="production")


# ============================================================================
# Example 1: Manual Monitoring
# ============================================================================

@app.post("/api/ai/marketing-chat")
async def marketing_chat(request: Request):
    """Example with manual monitoring"""
    # Extract context
    body = await request.json()
    message = body.get("message")
    page_context = body.get("pageContext", "unknown")

    # Start monitoring
    ctx = mon.start_request(agent_type="marketing", page_context=page_context)

    try:
        # Get agent
        agent = get_marketing_agent()

        # Process request (this would be actual agent logic)
        response = await agent.chat(message, context={"page_context": page_context})

        # Record business metrics
        mon.record_business_metrics(
            agent_type="marketing",
            conversation_id=body.get("conversationId", "unknown"),
            token_usage=response.get("metadata", {}).get("token_usage"),
            estimated_cost_usd=response.get("metadata", {}).get("cost"),
            tool_calls=response.get("metadata", {}).get("tool_calls", 0),
            page_context=page_context,
            model_name=response.get("metadata", {}).get("model")
        )

        # End monitoring (success)
        mon.end_request(ctx, success=True, extra_metadata={
            "response_length": len(response.get("response", "")),
            "tools_used": response.get("metadata", {}).get("tools_used", [])
        })

        return response

    except Exception as e:
        # Record error
        mon.record_error(
            agent_type="marketing",
            error_type=type(e).__name__,
            details=str(e),
            page_context=page_context
        )

        # End monitoring (failure)
        mon.end_request(ctx, success=False)

        raise


# ============================================================================
# Example 2: Decorator-Based Monitoring (Recommended)
# ============================================================================

@app.post("/api/ai/marketing-chat-v2")
@track_request(agent_type="marketing")
async def marketing_chat_v2(request: Request):
    """Example with decorator-based monitoring (cleaner)"""
    body = await request.json()
    message = body.get("message")
    context = {"page_context": body.get("pageContext", "unknown")}

    # Get agent
    agent = get_marketing_agent()

    # Process request - monitoring handled by decorator
    response = await agent.chat(message, context=context)

    # Optionally record business metrics manually
    if response.get("metadata"):
        mon.record_business_metrics(
            agent_type="marketing",
            conversation_id=body.get("conversationId", "unknown"),
            token_usage=response["metadata"].get("token_usage"),
            estimated_cost_usd=response["metadata"].get("cost"),
            tool_calls=response["metadata"].get("tool_calls", 0),
            page_context=context["page_context"],
            model_name=response["metadata"].get("model")
        )

    return response


# ============================================================================
# Example 3: Streaming with Monitoring
# ============================================================================

@app.post("/api/ai/marketing-chat/stream")
async def marketing_chat_stream(request: Request):
    """Example with streaming and monitoring"""
    body = await request.json()
    message = body.get("message")
    page_context = body.get("pageContext", "unknown")

    # Start monitoring
    ctx = mon.start_request(agent_type="marketing", page_context=page_context)

    async def generate_stream():
        try:
            agent = get_marketing_agent()

            async for chunk in agent.generate_stream(message, context={"page_context": page_context}):
                yield f"data: {chunk}\n\n"

            # End monitoring (success)
            mon.end_request(ctx, success=True)

        except Exception as e:
            # Record error
            mon.record_error(
                agent_type="marketing",
                error_type=type(e).__name__,
                details=str(e),
                page_context=page_context
            )

            # End monitoring (failure)
            mon.end_request(ctx, success=False)

            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(generate_stream(), media_type="text/event-stream")


# ============================================================================
# Example 4: Tool Usage Monitoring
# ============================================================================

def monitor_tool_execution(tool_name: str, agent_type: str = "marketing"):
    """Decorator for monitoring individual tool executions"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            import time
            start = time.time()

            try:
                result = await func(*args, **kwargs)
                duration_ms = int((time.time() - start) * 1000)

                # Record tool usage
                mon.record_tool_usage(
                    agent_type=agent_type,
                    tool_name=tool_name,
                    duration_ms=duration_ms,
                    success=True
                )

                return result

            except Exception as e:
                duration_ms = int((time.time() - start) * 1000)

                # Record tool failure
                mon.record_tool_usage(
                    agent_type=agent_type,
                    tool_name=tool_name,
                    duration_ms=duration_ms,
                    success=False
                )

                raise

        return wrapper
    return decorator


# Example usage in tool definition
@monitor_tool_execution(tool_name="search_kb")
async def search_kb_monitored(query: str):
    """KB search with monitoring"""
    # Actual search logic here
    pass


# ============================================================================
# Health Check with Metrics
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "marketing-api",
        "monitoring": "enabled" if mon.prometheus_enabled else "log-based-only"
    }


# ============================================================================
# Usage Instructions
# ============================================================================

"""
To use this monitoring system:

1. Install prometheus-client:
   pip install prometheus-client

2. Add to your FastAPI app:
   from prometheus_client import make_asgi_app
   metrics_app = make_asgi_app()
   app.mount("/metrics", metrics_app)

3. Use monitoring in your endpoints:
   - Option A: Manual (see Example 1)
   - Option B: Decorator (see Example 2) - RECOMMENDED

4. Access metrics:
   - Prometheus format: http://localhost:8080/metrics
   - Logs: Cloud Logging (structured JSON)

5. Set up alerting:
   - Use alerting_config.py definitions
   - Create policies in GCP Monitoring
   - Configure notification channels

6. View dashboard:
   - Import dashboard_config from alerting_config.py
   - Create in GCP Monitoring > Dashboards
"""
