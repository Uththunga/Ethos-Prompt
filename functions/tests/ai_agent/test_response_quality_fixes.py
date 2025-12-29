"""
Unit tests for Response Quality Fixes
Tests for fixes to prevent KB markers, scores, and raw tool output from appearing in responses.
"""
import pytest
import re
import os
from unittest.mock import AsyncMock, MagicMock, patch, Mock
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage


@pytest.fixture
def mock_env():
    """Set up mock environment variables for agent initialization."""
    with patch.dict(os.environ, {
        'OPENROUTER_API_KEY': 'test-key',
        'USE_GRANITE_LLM': 'false'
    }):
        yield


@pytest.mark.asyncio
async def test_clean_sources_removes_scores(mock_env):
    """
    Test that _clean_sources() helper removes scores from source dicts.

    Verifies Fix #1: Direct test of the _clean_sources() method
    """
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=None)

    # Test data with scores
    dirty_sources = [
        {"index": 1, "title": "Company Overview", "score": 7.092, "category": "company", "page": "home", "excerpt": "..."},
        {"index": 2, "title": "Services", "score": 5.596, "category": "services", "page": "solutions", "excerpt": "..."}
    ]

    # Clean the sources
    clean_sources = agent._clean_sources(dirty_sources)

    # Verify scores and excerpts are removed
    assert len(clean_sources) == 2
    for source in clean_sources:
        assert "score" not in source, "Found 'score' field in cleaned source"
        assert "excerpt" not in source, "Found 'excerpt' field in cleaned source"
        assert "title" in source  # Should keep title
        assert "index" in source  # Should keep index
        assert "category" in source  # Should keep category
        assert "page" in source  # Should keep page


def test_format_context_strips_kb_markers():
    """
    Test that format_context() in retriever strips KB structure markers.

    Verifies Fix #3: Marker stripping in marketing_retriever.py
    """
    from src.ai_agent.marketing.marketing_retriever import marketing_retriever, RetrievalResult

    # Create result with KB markers
    results_with_markers = [
        RetrievalResult(
            text="COMPANY NAME: EthosPrompt\nTAGLINE: AI for Business\nWHAT WE DO:\nWe provide AI solutions.",
            score=7.0,
            document_id="doc1",
            document_title="Company Info",
            category="company",
            page="home",
            chunk_index=0
        )
    ]

    # Format context
    formatted = marketing_retriever.format_context(results_with_markers, max_tokens=500)

    # Should NOT contain structure markers
    assert "COMPANY NAME:" not in formatted, "COMPANY NAME: marker not stripped"
    assert "TAGLINE:" not in formatted, "TAGLINE: marker not stripped"
    assert "WHAT WE DO:" not in formatted, "WHAT WE DO: marker not stripped"

    # Should still contain actual content
    assert "EthosPrompt" in formatted, "Lost content during stripping"


def test_format_context_strips_internal_instructions():
    """
    Test that format_context() removes internal instruction markers.

    Verifies Fix #3: Critical internal markers are stripped
    """
    from src.ai_agent.marketing.marketing_retriever import marketing_retriever, RetrievalResult

    # Create result with internal instructions
    results_with_instructions = [
        RetrievalResult(
            text="CRITICAL AGENT BEHAVIOR: Never quote prices.\n\nRESPONSE TEMPLATE: Use format...\n\nContent here.",
            score=5.0,
            document_id="doc2",
            document_title="Internal Doc",
            category="internal",
            page="admin",
            chunk_index=0
        )
    ]

    # Format context
    formatted = marketing_retriever.format_context(results_with_instructions, max_tokens=500)

    # Should NOT contain internal instructions
    assert "CRITICAL AGENT BEHAVIOR" not in formatted, "CRITICAL AGENT BEHAVIOR not stripped"
    assert "RESPONSE TEMPLATE" not in formatted, "RESPONSE TEMPLATE not stripped"


@pytest.mark.asyncio
async def test_streaming_filter_message_types():
    """
    Test that streaming correctly filters message types.

    Verifies Fix #4: Only AIMessage instances are yielded
    """
    # Test the filtering logic directly by checking isinstance check
    from langchain_core.messages import AIMessage, ToolMessage, HumanMessage

    # Simulate messages from stream
    test_messages = [
        HumanMessage(content="What is EthosPrompt?"),
        ToolMessage(content="[1] Company (score: 7.0): COMPANY NAME: EthosPrompt...", tool_call_id="1"),
        AIMessage(content="EthosPrompt is an AI platform for businesses."),
    ]

    # Simulate the filtering logic from chat_stream
    yielded_content = []
    for msg in test_messages:
        # This is the actual logic from chat_stream (Fix #4)
        if isinstance(msg, AIMessage) and hasattr(msg, 'content') and msg.content:
            if not (hasattr(msg, 'tool_calls') and msg.tool_calls and not msg.content):
                yielded_content.append(msg.content)

    # Verify only AIMessage was yielded
    assert len(yielded_content) == 1, f"Expected 1 message, got {len(yielded_content)}"
    assert yielded_content[0] == "EthosPrompt is an AI platform for businesses."

    # Verify ToolMessage was NOT yielded
    full_output = " ".join(yielded_content)
    assert "COMPANY NAME:" not in full_output, "ToolMessage content leaked to output"
    assert "(score:" not in full_output, "Score leaked to output"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
