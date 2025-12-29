import logging
from typing import Any, List, Optional, Union, Dict
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.language_models import BaseChatModel
from langchain_core.outputs import ChatResult, ChatGeneration
from pydantic import Field, PrivateAttr

logger = logging.getLogger(__name__)

class MockLLM(BaseChatModel):
    """
    Mock LLM for testing and evaluation without API costs.
    Returns predefined responses based on input keywords.
    """

    _request_counts: Dict[int, int] = PrivateAttr(default_factory=dict)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # self._request_counts is initialized by PrivateAttr

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Sync generation (not used in async agent but required by abstract class)"""
        raise NotImplementedError("Use ainvoke for async generation")

    async def _agenerate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Async generation of mock response"""
        last_message = messages[-1].content
        if isinstance(last_message, str):
            query = last_message.lower()
        else:
            query = str(last_message).lower()

        # Track request count for this query to simulate refinement
        # Simple hash of query to track iterations
        query_hash = hash(query[:50])
        self._request_counts[query_hash] = self._request_counts.get(query_hash, 0) + 1
        is_first_attempt = self._request_counts[query_hash] == 1

        logger.info(f"MockLLM received query (attempt {self._request_counts[query_hash]}): {query[:50]}...")

        # Default response (intentionally without follow-ups on first attempt)
        content = "This is a mock response from EthosPrompt AI."

        # Context-aware responses
        if "price" in query or "cost" in query or "pricing" in query:
            content = """Our pricing is customized based on your specific needs to ensure you only pay for what you use.

To get an accurate quote, please share:
- Your name & email
- Project type (Smart Assistant, Integration, or Application)
- Rough budget range

I can connect you with our team for a free consultation to discuss pricing in detail."""

        elif "service" in query or "solution" in query:
            content = """We offer:
- Intelligent Applications
- System Integration
- Smart Business Assistant"""

        elif "verify" in query and "context" in query:
            # For verification prompts
            content = "SUPPORTED"

        # ALWAYS add follow-up questions on second+ attempts (after reflection)
        # But NEVER on first attempt (to trigger reflection)
        if not is_first_attempt and content != "SUPPORTED":
            content += """

You might also want to know:
1. What integration options are available?
2. How do I get started?
3. Can I schedule a consultation?"""

        # Simulate hallucination for testing reflection (if specifically requested)
        if "hallucinate" in query and is_first_attempt:
             content = "We recently acquired Google. The price is $500."

        return ChatResult(generations=[ChatGeneration(message=AIMessage(content=content))])

    @property
    def _llm_type(self) -> str:
        return "mock-llm"

    def bind_tools(self, tools: Any, **kwargs: Any) -> Any:
        """Mock bind_tools to return self (ignoring tools)"""
        return self

    @property
    def model_name(self) -> str:
        return "mock-llm-v1"
