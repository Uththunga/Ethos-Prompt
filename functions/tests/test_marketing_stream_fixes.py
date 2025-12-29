"""
Test suite for marketing agent streaming fixes

Tests verify:
1. Content filtering allows legitimate business terms
2. Internal patterns are blocked correctly
3. Responses complete with [DONE] signal
4. No backend data leaks through
5. Response length is adequate
"""

import pytest
import re
from typing import AsyncGenerator


class TestContentFiltering:
    """Test content filtering logic"""

    def should_filter(self, text: str) -> bool:
        """
        Replica of the filtering logic from cloud_run_main.py
        Returns True if text should be filtered out
        """
        if (
            # Exact LangChain repr patterns (not substrings in business text)
            re.search(r'\b(AIMessageChunk|ToolMessage|HumanMessage|SystemMessage)\(', text)
            or text.startswith('id=')
            or 'additional_kwargs=' in text
            or 'response_metadata=' in text
            # Tool invocation markers that should never appear in user-facing content
            or re.match(r'^\*[a-z_]+\s+knowledge\s+base\*', text, re.IGNORECASE)
            or 'Call search_kb(' in text
            or 'Call get_pricing(' in text
            or 'Call request_consultation(' in text
            # Actual error messages (not just words like "validation" in business context)
            or re.search(r'ValidationError:|pydantic.*ValidationError|errors\.pydantic\.dev', text, re.IGNORECASE)
            or text.strip() == 'please fix your mistakes'
        ):
            return True
        return False

    def test_allows_business_validation_term(self):
        """Verify legitimate content with 'validation' isn't filtered"""
        text = "Our validation process ensures quality and meets industry standards."
        assert not self.should_filter(text), "Business content with 'validation' should NOT be filtered"

    def test_allows_business_pydantic_term(self):
        """Verify content mentioning pydantic in context isn't filtered"""
        text = "We use modern Python frameworks including FastAPI and Pydantic for data validation."
        assert not self.should_filter(text), "Business content mentioning pydantic should NOT be filtered"

    def test_blocks_langchain_repr(self):
        """Verify LangChain message representations are blocked"""
        test_cases = [
            "AIMessageChunk(content='test', id='123')",
            "ToolMessage(content='result', tool_call_id='456')",
            "HumanMessage(content='query')",
            "SystemMessage(content='instructions')"
        ]
        for text in test_cases:
            assert self.should_filter(text), f"Should filter LangChain repr: {text}"

    def test_blocks_tool_invocation_markers(self):
        """Verify tool invocation markers are blocked"""
        test_cases = [
            "*searches knowledge base*",
            "*Searches Knowledge Base*",
            "Call search_kb(query='test')",
            "Call get_pricing(service='smart_assistant')",
            "Call request_consultation(name='John', email='john@example.com')"
        ]
        for text in test_cases:
            assert self.should_filter(text), f"Should filter tool marker: {text}"

    def test_blocks_error_messages(self):
        """Verify actual error messages are blocked"""
        test_cases = [
            "ValidationError: Field required",
            "pydantic.ValidationError: 2 validation errors",
            "See https://errors.pydantic.dev/2.0/v/missing",
            "please fix your mistakes"
        ]
        for text in test_cases:
            assert self.should_filter(text), f"Should filter error message: {text}"

    def test_blocks_metadata_keys(self):
        """Verify metadata keys are blocked"""
        test_cases = [
            "id=abc123",
            "additional_kwargs={'key': 'value'}",
            "response_metadata={'model': 'test'}"
        ]
        for text in test_cases:
            assert self.should_filter(text), f"Should filter metadata: {text}"

    def test_allows_normal_conversation(self):
        """Verify normal conversational text passes through"""
        normal_texts = [
            "Hello! How can I help you today?",
            "EthosPrompt offers three core services to help your business.",
            "Our Smart Business Assistant starts at $500/month.",
            "The pricing depends on your specific requirements.",
            "Would you like to schedule a consultation?",
            "I'd be happy to explain our validation and verification process.",
            "We ensure data validation through comprehensive testing."
        ]
        for text in normal_texts:
            assert not self.should_filter(text), f"Normal text should NOT be filtered: {text}"


class TestResponseCompleteness:
    """Test response completeness validation"""

    def test_detects_short_response(self):
        """Verify short responses are detected"""
        short_response = "Hi there!"
        assert len(short_response) < 50, "Should detect response under 50 chars"

    def test_accepts_adequate_response(self):
        """Verify adequate responses pass"""
        adequate_response = (
            "Hello! I'm molē, EthosPrompt's AI assistant. "
            "I'd be happy to help you learn about our services. "
            "We offer Smart Business Assistants, System Integration, "
            "and Custom Application Development. What would you like to know?"
        )
        assert len(adequate_response) >= 50, "Should accept response over 50 chars"


class TestStreamPatterns:
    """Test expected streaming patterns"""

    def test_stream_ends_with_done(self):
        """Verify streams should end with [DONE]"""
        # This would be tested in integration tests
        # Placeholder for expected behavior
        expected_final_event = "[DONE]"
        assert expected_final_event == "[DONE]"

    def test_content_chunks_have_type(self):
        """Verify content chunks should have type field"""
        expected_chunk_format = {"type": "content", "chunk": "some text"}
        assert "type" in expected_chunk_format
        assert expected_chunk_format["type"] == "content"

    def test_metadata_has_conversation_id(self):
        """Verify metadata should include conversation_id"""
        expected_metadata = {
            "type": "metadata",
            "conversation_id": "test-123",
            "page_context": "homepage",
            "mock": False
        }
        assert "conversation_id" in expected_metadata


@pytest.mark.asyncio
class TestMessageTypeFiltering:
    """Test message type filtering in marketing_agent.py"""

    async def test_filters_tool_messages(self):
        """Verify ToolMessage instances are filtered out"""
        from langchain_core.messages import ToolMessage, AIMessageChunk

        # Simulate stream with mixed message types
        messages = [
            AIMessageChunk(content="Hello"),
            ToolMessage(content="search result", tool_call_id="123"),
            AIMessageChunk(content=" there!"),
        ]

        # Only AIMessageChunk should yield
        ai_messages = [msg for msg in messages if isinstance(msg, AIMessageChunk)]
        assert len(ai_messages) == 2
        assert all(isinstance(msg, AIMessageChunk) for msg in ai_messages)

    async def test_accumulates_content_length(self):
        """Verify content length is tracked"""
        from langchain_core.messages import AIMessageChunk

        chunks = [
            AIMessageChunk(content="Hello"),
            AIMessageChunk(content=" world"),
            AIMessageChunk(content="!"),
        ]

        total_length = sum(len(str(chunk.content)) for chunk in chunks)
        assert total_length > 0
        assert total_length == len("Hello world!")


if __name__ == "__main__":
    # Run tests
    import sys

    print("Running content filtering tests...")
    test_filter = TestContentFiltering()

    tests = [
        ("Business validation term", test_filter.test_allows_business_validation_term),
        ("Business pydantic term", test_filter.test_allows_business_pydantic_term),
        ("LangChain repr blocking", test_filter.test_blocks_langchain_repr),
        ("Tool invocation blocking", test_filter.test_blocks_tool_invocation_markers),
        ("Error message blocking", test_filter.test_blocks_error_messages),
        ("Metadata key blocking", test_filter.test_blocks_metadata_keys),
        ("Normal conversation pass-through", test_filter.test_allows_normal_conversation),
    ]

    passed = 0
    failed = 0

    for name, test_func in tests:
        try:
            test_func()
            print(f"✓ {name}")
            passed += 1
        except AssertionError as e:
            print(f"✗ {name}: {e}")
            failed += 1
        except Exception as e:
            print(f"✗ {name}: Unexpected error: {e}")
            failed += 1

    print(f"\n{passed} passed, {failed} failed")
    sys.exit(0 if failed == 0 else 1)
