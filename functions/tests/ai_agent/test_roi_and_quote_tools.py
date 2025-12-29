"""
Unit tests for ROI Calculator and Quotation Starter tools.
"""
import sys
from unittest.mock import MagicMock

# Mock heavy modules BEFORE importing MarketingAgent
# We match the import paths used in the application (assuming functions/src is in PYTHONPATH)
mock_retriever_module = MagicMock()
sys.modules['ai_agent.marketing.marketing_retriever'] = mock_retriever_module
sys.modules['ai_agent.marketing.kb_indexer'] = MagicMock()

# Mock RAG modules
sys.modules['rag.hybrid_search_engine'] = MagicMock()
sys.modules['rag.bm25_search_engine'] = MagicMock()
sys.modules['rag.embedding_service'] = MagicMock()

# Mock Google Cloud
sys.modules['google.cloud'] = MagicMock()
sys.modules['google.cloud.firestore'] = MagicMock()

# Mock LLM
sys.modules['llm.watsonx_client'] = MagicMock()
sys.modules['llm.secret_manager_helper'] = MagicMock()

# Mock LangGraph (critical for agent initialization)
mock_langgraph = MagicMock()
mock_langgraph_prebuilt = MagicMock()
mock_langgraph_checkpoint = MagicMock()
mock_langgraph_checkpoint_memory = MagicMock()
sys.modules['langgraph'] = mock_langgraph
sys.modules['langgraph.prebuilt'] = mock_langgraph_prebuilt
sys.modules['langgraph.checkpoint'] = mock_langgraph_checkpoint
sys.modules['langgraph.checkpoint.memory'] = mock_langgraph_checkpoint_memory

import pytest
from unittest.mock import MagicMock, patch
# Import relative to test execution? pytest adds src/ to path.
from ai_agent.marketing.marketing_agent import MarketingAgent

@pytest.fixture
def agent():
    with patch('ai_agent.marketing.marketing_agent.MarketingAgent._initialize_llm') as mock_llm_init, \
         patch('langgraph.prebuilt.create_react_agent') as mock_create_agent, \
         patch('ai_agent.marketing.marketing_agent.get_config') as mock_get_config:

        # Mock config
        mock_config = MagicMock()
        mock_config.temperature = 0.7
        mock_config.max_tokens = 400
        mock_get_config.return_value = mock_config

        # Initialize agent
        agent = MarketingAgent(db=None)

        return agent

@pytest.mark.skip(reason="Integration test - requires full LangGraph environment")
@pytest.mark.asyncio
async def test_calculate_roi_tool_ecommerce(agent):
    """Test ROI calculator for E-commerce scenario"""
    tools = {t.name: t for t in agent.tools}
    calculate_roi = tools['calculate_roi']

    result = await calculate_roi.ainvoke({
        "business_type": "E-commerce",
        "monthly_visitors": 10000,
        "conversion_rate": 2.0,
        "order_value": 100,
        "maintenance_costs": 3000,
        "current_platform": "Shopify"
    })

    assert "**ROI Analysis for E-commerce Business:**" in result
    assert "Cost Savings: $1,200/month" in result
    assert "Revenue Growth: $30,000/month" in result

    assert "Estimated Implementation: $8,000" in result
    assert "Payback Period: 0.3 months" in result
    assert "3-Year ROI: 13940%" in result

@pytest.mark.skip(reason="Integration test - requires full LangGraph environment")
@pytest.mark.asyncio
async def test_calculate_roi_tool_zeros(agent):
    """Test ROI calculator with zero values"""
    tools = {t.name: t for t in agent.tools}
    calculate_roi = tools['calculate_roi']

    result = await calculate_roi.ainvoke({
        "business_type": "Other",
        "monthly_visitors": 0,
        "maintenance_costs": 0,
        "current_platform": "WordPress"
    })

    assert "ROI Analysis" in result
    assert "Payback Period: 0.0 months" in result

@pytest.mark.skip(reason="Integration test - requires full LangGraph environment")
@pytest.mark.asyncio
async def test_start_quotation_tool(agent):
    """Test start_quotation tool generates reference and formatted output"""
    tools = {t.name: t for t in agent.tools}
    start_quotation = tools['start_quotation']

    result = await start_quotation.ainvoke({
        "service_type": "smart-assistant",
        "company_name": "TestCorp",
        "email": "test@test.com",
        "project_description": "We need a bot"
    })

    assert "**Quotation Request Started!** Reference: QR-" in result
    assert "Service: Smart Assistant" in result
    assert "Company: TestCorp" in result

@pytest.mark.skip(reason="Integration test - requires full LangGraph environment")
@pytest.mark.asyncio
async def test_start_quotation_validation(agent):
    """Test start_quotation validation for invalid service"""
    tools = {t.name: t for t in agent.tools}
    start_quotation = tools['start_quotation']

    result = await start_quotation.ainvoke({
        "service_type": "invalid-service",
        "company_name": "TestCorp",
        "email": "test@test.com",
        "project_description": "We need a bot"
    })

    assert "Please specify one of our services" in result
