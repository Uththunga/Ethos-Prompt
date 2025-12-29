"""
Integration test for marketing agent response completeness
Tests that the agent delivers complete responses with sources and follow-up questions
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch


@pytest.mark.asyncio
async def test_marketing_agent_response_completeness(mock_firestore_client):
    """Test that responses are complete and not truncated"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)

    # Test with question that requires comprehensive answer
    response = await agent.chat(
        message="What services does EthosPrompt offer?",
        context={"page_context": "services", "conversation_id": "test123"}
    )

    # Verify response structure
    assert "response" in response, "Response should have 'response' field"
    assert "sources" in response, "Response should have 'sources' field"
    assert "suggested_questions" in response, "Response should have 'suggested_questions' field"
    assert "metadata" in response, "Response should have 'metadata' field"

    # Verify response is complete (not truncated)
    response_text = response["response"]
    char_count = len(response_text)
    word_count = len(response_text.split())

    assert char_count > 200, (
        f"Response too short: {char_count} chars (expected >200). "
        f"Possible truncation. Response: '{response_text[:100]}...'"
    )
    assert word_count > 50, (
        f"Response too short: {word_count} words (expected >50). "
        f"Possible truncation."
    )

    # Verify follow-up questions are included
    suggested_questions = response["suggested_questions"]
    assert len(suggested_questions) >= 2, (
        f"Should have at least 2 follow-up questions, got {len(suggested_questions)}"
    )
    assert all(isinstance(q, str) and len(q) > 10 for q in suggested_questions), (
        "Follow-up questions should be meaningful strings"
    )

    # Verify metadata includes expected fields
    metadata = response["metadata"]
    assert "agent" in metadata, "Metadata should include 'agent' field"
    assert "model" in metadata, "Metadata should include 'model' field"
    assert "timestamp" in metadata, "Metadata should include 'timestamp' field"


@pytest.mark.asyncio
async def test_marketing_agent_complex_query(mock_firestore_client):
    """Test that complex queries get adequate response length"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)

    # Complex technical question
    response = await agent.chat(
        message="How does the RAG technology work and what are the key features?",
        context={"page_context": "product", "conversation_id": "test456"}
    )

    response_text = response["response"]
    word_count = len(response_text.split())

    # Complex queries should get  comprehensive responses
    assert word_count > 80, (
        f"Complex query response too short: {word_count} words (expected >80)"
    )

    # Should not be cut off mid-sentence
    last_char = response_text.strip()[-1] if response_text.strip() else ""
    assert last_char in ['.', '!', '?', ':'], (
        f"Response appears cut off, ends with: '{last_char}'"
    )


@pytest.mark.asyncio
async def test_marketing_agent_token_usage_tracking(mock_firestore_client):
    """Test that token usage is tracked correctly"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    agent = MarketingAgent(db=mock_firestore_client)

    response = await agent.chat(
        message="Tell me about EthosPrompt",
        context={"page_context": "homepage", "conversation_id": "test789"}
    )

    # Verify metadata includes token usage if available
    metadata = response["metadata"]
    if "token_usage" in metadata and metadata["token_usage"]:
        token_usage = metadata["token_usage"]

        # Verify structure
        assert "total_tokens" in token_usage, "Token usage should include total_tokens"
        assert isinstance(token_usage["total_tokens"], int), "Total tokens should be integer"

        # Verify reasonable token counts
        total_tokens = token_usage["total_tokens"]
        assert total_tokens > 0, "Total tokens should be greater than 0"
        assert total_tokens < 10000, (
            f"Total tokens suspiciously high: {total_tokens} (possible error)"
        )
