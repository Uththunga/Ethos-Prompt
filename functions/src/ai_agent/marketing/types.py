"""
Type definitions for Marketing Agent
Provides TypedDict classes and type aliases for better type safety.
"""
from typing import Any, Callable, Dict, List, Optional, Tuple, TypedDict, Union
from typing_extensions import NotRequired


class AgentMetadata(TypedDict):
    """Metadata included in agent responses"""
    agent: str
    page_context: str
    model: str
    timestamp: str
    response_length: int
    token_usage: Optional[Dict[str, int]]
    estimated_cost_usd: Optional[float]
    tool_calls: int


class SourceCitation(TypedDict):
    """Source citation for retrieved documents"""
    index: int
    title: str
    score: float
    url: NotRequired[str]
    category: NotRequired[str]


class RetrievalResult(TypedDict):
    """Result from knowledge base retrieval"""
    content: str
    metadata: Dict[str, Any]
    score: float
    doc_id: str


class ToolOutput(TypedDict):
    """Output from a tool execution"""
    tool_name: str
    result: Any
    error: NotRequired[str]





class AgentContext(TypedDict, total=False):
    """Context passed to agent chat methods"""
    conversation_id: str
    page_context: str
    user_id: Optional[str]
    metadata: Optional[Dict[str, Any]]


class TokenUsage(TypedDict):
    """Token usage statistics"""
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class CheckpointConfig(TypedDict):
    """Configuration for checkpointing"""
    configurable: Dict[str, str]


class ABTestConfig(TypedDict):
    """A/B test variant configuration"""
    temperature: float
    max_tokens: int
    system_prompt_version: str
