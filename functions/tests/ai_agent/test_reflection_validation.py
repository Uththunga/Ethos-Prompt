import pytest
from unittest.mock import AsyncMock, MagicMock
from src.ai_agent.marketing.workflow_nodes import verify_claims, reflection_node
from src.ai_agent.marketing.agent_state import MarketingAgentState
from langchain_core.messages import AIMessage, HumanMessage

@pytest.mark.asyncio
async def test_verify_claims_supported():
    """Test verify_claims when claims are supported"""
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = AIMessage(content="SUPPORTED")

    response = "The sky is blue."
    context = "The sky is blue."

    issues = await verify_claims(response, context, mock_llm)
    assert len(issues) == 0

@pytest.mark.asyncio
async def test_verify_claims_unsupported():
    """Test verify_claims when claims are unsupported"""
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = AIMessage(content="- The sky is green\n- The grass is blue")

    response = "The sky is green and grass is blue."
    context = "The sky is blue and grass is green."

    issues = await verify_claims(response, context, mock_llm)
    assert len(issues) == 2
    assert "Unsupported claim: The sky is green" in issues[0]
    assert "Unsupported claim: The grass is blue" in issues[1]

@pytest.mark.asyncio
async def test_reflection_node_with_hallucination():
    """Test reflection_node detects hallucinations via LLM"""
    mock_llm = AsyncMock()
    # Mock verify_claims response via LLM
    mock_llm.ainvoke.return_value = AIMessage(content="- Price is $500")

    state = {
        "messages": [AIMessage(content="The price is $500.")],
        "tools_output": [{"results": [{"content": "Price is $100"}]}],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=mock_llm)

    assert result["validation_passed"] is False
    assert "Unsupported claim: Price is $500" in result["reflection_feedback"]
    assert result["next_action"] == "llm"

@pytest.mark.asyncio
async def test_reflection_node_pass():
    """Test reflection_node passes valid response"""
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = AIMessage(content="SUPPORTED")

    state = {
        "messages": [AIMessage(content="The price is $100. You might also want to know about our plans. Please contact us for a consultation.")],
        "tools_output": [{"results": [{"content": "Price is $100"}]}],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=mock_llm)

    assert result["validation_passed"] is True
    assert result["next_action"] == "end"

@pytest.mark.asyncio
async def test_reflection_node_formatting_check():
    """Test reflection_node detects formatting issues"""
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = AIMessage(content="SUPPORTED")

    # Long response without bullet points
    long_text = "This is a very long paragraph " * 20

    state = {
        "messages": [AIMessage(content=long_text)],
        "tools_output": [],
        "iteration_count": 0
    }

    result = await reflection_node(state, llm=mock_llm)

    assert result["validation_passed"] is False
    assert "Formatting issue" in result["reflection_feedback"]
