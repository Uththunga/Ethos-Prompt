"""
Marketing Agent Workflow Graph
Defines the StateGraph workflow for the marketing agent
"""

import logging
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from langgraph.graph import StateGraph, END
from .agent_state import MarketingAgentState
from .workflow_nodes import llm_node, tool_executor_node, reflection_node
from .config import MarketingAgentConfig, get_config

logger = logging.getLogger(__name__)


def create_marketing_workflow(
    llm: Any,
    tools: List[Any],
    checkpointer: Any,
    config: Optional[MarketingAgentConfig] = None
) -> Any:
    """
    Create Marketing Agent workflow as StateGraph

    This replaces the deprecated create_react_agent pattern with a custom
    StateGraph that provides:
    - Explicit control over reasoning loop
    - Reflection/self-correction capability
    - Better observability and debugging
    - Future-proof (LangGraph V1.0+ compatible)

    Args:
        llm: Language model instance
        tools: List of LangChain tools
        checkpointer: Checkpoint saver for conversation persistence
        config: Agent configuration (optional, will load default if None)

    Returns:
        Compiled LangGraph workflow
    """
    # Load config if not provided
    if config is None:
        config = get_config()

    # Initialize StateGraph
    workflow = StateGraph(MarketingAgentState)

    # Bind dependencies to nodes
    from functools import partial
    llm_node_bound = partial(llm_node, llm=llm)
    tool_node_bound = partial(tool_executor_node, tools=tools)
    reflection_node_bound = partial(reflection_node, llm=llm, config=config)  # ← Pass config!

    # Add nodes
    workflow.add_node("llm", llm_node_bound)
    workflow.add_node("tools", tool_node_bound)
    workflow.add_node("reflect", reflection_node_bound)

    # Set entry point
    workflow.set_entry_point("llm")

    # Define routing logic
    def route_after_llm(state: MarketingAgentState) -> str:
        """
        Route after LLM node based on state

        Returns:
            Next node name or END
        """
        next_action = state.get("next_action", "end")

        # Safety: Check max iterations to prevent infinite loops
        if state.get("iteration_count", 0) >= state.get("max_iterations", 10):
            logger.warning(f"Max iterations ({state.get('max_iterations')}) reached, ending workflow")
            return END

        # Route based on next_action
        if next_action == "tools":
            return "tools"
        elif next_action == "reflect":
            return "reflect"
        else:
            return END

    # Add conditional edges from LLM
    workflow.add_conditional_edges(
        "llm",
        route_after_llm,
        {
            "tools": "tools",
            "reflect": "reflect",
            END: END
        }
    )

    # Tools always return to LLM with results
    workflow.add_edge("tools", "llm")

    # Reflection routing
    def route_after_reflection(state: MarketingAgentState) -> str:
        """
        Route after reflection node

        Returns:
            "llm" for regeneration or END if validated
        """
        if state.get("validation_passed", False):
            logger.info("Validation passed, ending workflow")
            return END
        else:
            # Check iteration limit
            if state.get("iteration_count", 0) >= state.get("max_iterations", 10):
                logger.warning("Max iterations reached during reflection, ending anyway")
                return END

            logger.info("Validation failed, regenerating response")
            return "llm"

    workflow.add_conditional_edges(
        "reflect",
        route_after_reflection,
        {
            "llm": "llm",
            END: END
        }
    )

    # Compile workflow with checkpointer
    compiled = workflow.compile(checkpointer=checkpointer)

    logger.info("✓ Marketing workflow compiled successfully")

    # Optional: Generate visualization for debugging
    try:
        compiled.get_graph().draw_mermaid_png(output_file_path="marketing_workflow.png")
        logger.info("✓ Workflow visualization saved to marketing_workflow.png")
    except Exception as e:
        logger.debug(f"Could not generate workflow visualization: {e}")

    return compiled
