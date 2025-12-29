"""
Unit Tests for Marketing Agent Workflow Nodes
Tests reflection logic, hallucination detection, and brand voice validation
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from typing import Dict, Any, List


@pytest.fixture
def mock_llm():
    """Mock LLM for testing"""
    llm = AsyncMock()
    return llm


@pytest.fixture
def mock_state():
    """Create a mock agent state"""
    return {
        "messages": [],
        "tools_output": [],
        "iteration_count": 0
    }


@pytest.mark.asyncio
async def test_reflection_catches_forbidden_words():
    """Test reflection node catches forbidden brand voice words"""
    from src.ai_agent.marketing.workflow_nodes import reflection_node

    # Create state with a response containing "delve"
    mock_message = Mock()
    mock_message.content = "Let's delve into EthosPrompt's features. You might also want to know:\n1. What is pricing?\n2. How to start?\n3. What integrations?"

    state = {
        "messages": [mock_message],
        "tools_output": [],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=None)

    # Should fail validation due to "delve"
    assert result["validation_passed"] is False
    assert "delve" in result["reflection_feedback"].lower()


@pytest.mark.asyncio
async def test_reflection_catches_missing_follow_up():
    """Test reflection catches missing follow-up questions"""
    from src.ai_agent.marketing.workflow_nodes import reflection_node

    mock_message = Mock()
    mock_message.content = "EthosPrompt offers great services for business automation."

    state = {
        "messages": [mock_message],
        "tools_output": [],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=None)

    # Should fail due to missing follow-up questions
    assert result["validation_passed"] is False
    assert "follow-up" in result["reflection_feedback"].lower()


@pytest.mark.asyncio
async def test_reflection_catches_response_too_long():
    """Test reflection catches overly long responses"""
    from src.ai_agent.marketing.workflow_nodes import reflection_node

    mock_message = Mock()
    # Create a response that's way too long (>2500 chars)
    mock_message.content = "x" * 3000 + "\n\nYou might also want to know:\n1. Test\n2. Test\n3. Test"

    state = {
        "messages": [mock_message],
        "tools_output": [],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=None)

    assert result["validation_passed"] is False
    assert "too long" in result["reflection_feedback"].lower()


@pytest.mark.asyncio
async def test_reflection_catches_hallucinated_prices():
    """Test reflection detects prices not in tools output"""
    from src.ai_agent.marketing.workflow_nodes import reflection_node

    mock_message = Mock()
    mock_message.content = "Our pricing starts at $5,000 per month. You might also want to know:\n1. Features\n2. Support\n3. Integrations"

    state = {
        "messages": [mock_message],
        "tools_output": [{"results": [{"content": "No pricing information here"}]}],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=None)

    # Should detect hallucinated price
    assert result["validation_passed"] is False
    assert "$5,000" in result["reflection_feedback"]


@pytest.mark.asyncio
async def test_reflection_passes_valid_response():
    """Test reflection passes a well-formed response"""
    from src.ai_agent.marketing.workflow_nodes import reflection_node

    mock_message = Mock()
    mock_message.content = """EthosPrompt offers Smart Business Assistant, System Integration, and Intelligent Applications.

These solutions help businesses automate workflows and improve customer service.

You might also want to know:
1. What are the pricing options?
2. How do I get started?
3. What integrations are available?"""

    state = {
        "messages": [mock_message],
        "tools_output": [{"results": [{"content": "Smart Business Assistant, System Integration"}]}],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=None)

    # Should pass validation
    assert result["validation_passed"] is True
    assert result["confidence_score"] == 0.9


@pytest.mark.asyncio
async def test_reflection_max_iterations_accepts_flawed_response():
    """Test reflection accepts response after max iterations"""
    from src.ai_agent.marketing.workflow_nodes import reflection_node

    mock_message = Mock()
    mock_message.content = "Short response without follow-up questions"

    state = {
        "messages": [mock_message],
        "tools_output": [],
        "iteration_count": 3  # Max iterations reached
    }

    result = await reflection_node(state, llm=None)

    # Should accept despite issues
    assert result["next_action"] == "end"
    assert "max retries" in result["reflection_feedback"].lower()


@pytest.mark.asyncio
async def test_llm_node_requests_tools():
    """Test LLM node correctly identifies tool call requests"""
    from src.ai_agent.marketing.workflow_nodes import llm_node

    mock_llm = AsyncMock()
    mock_response = Mock()
    mock_response.tool_calls = [
        {"name": "search_kb", "args": {"query": "pricing"}, "id": "call_1"}
    ]
    mock_llm.ainvoke.return_value = mock_response

    state = {
        "messages": [Mock()],
        "iteration_count": 0
    }

    result = await llm_node(state, llm=mock_llm)

    assert result["next_action"] == "tools"
    assert len(result["tool_calls_pending"]) == 1
    assert result["iteration_count"] == 1


@pytest.mark.asyncio
async def test_tool_executor_handles_errors():
    """Test tool executor gracefully handles tool errors"""
    from src.ai_agent.marketing.workflow_nodes import tool_executor_node

    # Create a mock tool that raises an error
    mock_tool = AsyncMock()
    mock_tool.name = "search_kb"
    mock_tool.ainvoke.side_effect = Exception("Tool failed")

    state = {
        "tool_calls_pending": [
            {"name": "search_kb", "args": {"query": "test"}, "id": "call_1"}
        ],
        "tools_output": []
    }

    result = await tool_executor_node(state, tools=[mock_tool])

    # Should return error message in tool result
    assert len(result["messages"]) == 1
    assert "Error executing tool" in result["messages"][0].content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
