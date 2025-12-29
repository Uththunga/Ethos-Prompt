"""
Common base types for AI agents.
Minimal implementation to support MarketingAgent runtime.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional, Protocol, TypedDict
from abc import ABC, abstractmethod

# Public type used across agents
AgentResponse = Dict[str, Any]

class SupportsChat(Protocol):
    async def chat(self, message: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse: ...

class BaseAgent(ABC):
    """Lightweight base class for agents.
    Subclasses should initialize their own LLMs, tools, and state.
    """
    def __init__(self) -> None:
        self.name: str = self.__class__.__name__
        self.llm: Any = None
        self.db: Any = None

    @abstractmethod
    def _define_tools(self) -> List[Any]:
        """Return list of tool callables for the agent."""
        raise NotImplementedError

    async def chat(self, message: str, context: Optional[Dict[str, Any]] = None) -> AgentResponse:  # pragma: no cover
        """Optional convenience method; subclasses can override with concrete impl."""
        raise NotImplementedError("Subclasses must implement chat() or chat_stream().")
