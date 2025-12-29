"""
Marketing Agent State Definition
State schema for LangGraph StateGraph workflow
"""

from typing import Annotated, Any, Callable, Dict, List, Optional, Tuple, TypedDict, Union
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class MarketingAgentState(TypedDict):
    """
    State for Marketing Agent workflow

    This state is managed by LangGraph and persisted via checkpointer.
    The 'messages' field uses add_messages reducer for automatic message threading.
    """

    # Message history (LangGraph manages threading with add_messages reducer)
    messages: Annotated[List[BaseMessage], add_messages]

    # Tool execution tracking
    tools_output: List[Dict[str, Any]]
    tool_calls_pending: List[Dict[str, Any]]

    # Workflow control
    next_action: str  # "llm" | "tools" | "reflect" | "end"
    iteration_count: int
    max_iterations: int

    # Quality & validation
    confidence_score: float
    validation_passed: bool
    reflection_feedback: Optional[str]

    # Metadata for context
    conversation_id: str
    page_context: str
    user_id: Optional[str]
    variant: str  # A/B test variant
