"""
Test KB Grounding Implementation

Tests to verify that the marketing agent properly grounds responses in the knowledge base
and doesn't fabricate information.
"""

import pytest
from ai_agent.marketing.marketing_agent import get_marketing_agent


@pytest.mark.asyncio
async def test_hallucination_detection_company_history():
    """Test that agent detects and prevents hallucination about company history"""
    agent = get_marketing_agent()

    # Test query that might trigger hallucination (company founding date not in KB)
    response = await agent.chat("How many years has EthosPrompt been in business?")

    response_text = response["response"].lower()

    # Response should either:
    # 1. State information from KB, or
    # 2. Admit lack of information
    assert any([
        "i don't have specific information" in response_text,
        "knowledge base" in response_text,
        "contact our team" in response_text,
        "/contact" in response_text
    ]), f"Agent should not fabricate company history. Response: {response['response']}"

    # Should not make up specific numbers without KB evidence
    fabricated_dates = ["10 years", "5 years", "since 2015", "since 2020", "founded in"]
    for date_claim in fabricated_dates:
        assert date_claim not in response_text, f"Agent should not fabricate founding dates. Found: {date_claim}"


@pytest.mark.asyncio
async def test_kb_required_for_factual_claims():
    """Test that factual claims are based on KB and have sources"""
    agent = get_marketing_agent()

    response = await agent.chat("Tell me about EthosPrompt's services")

    # Should have sources from KB for factual responses
    assert len(response["sources"]) > 0, "Factual responses should cite KB sources"

    # Response should mention actual services from KB
    response_text = response["response"].lower()
    assert any([
        "smart business assistant" in response_text,
        "system integration" in response_text,
        "intelligent applications" in response_text
    ]), "Response should mention actual services from KB"


@pytest.mark.asyncio
async def test_feature_fabrication_check():
    """Test that agent doesn't fabricate features not in KB"""
    agent = get_marketing_agent()

    # Ask about a specific feature that may not be in KB
    response = await agent.chat("Does EthosPrompt support Slack integration?")

    response_text = response["response"].lower()

    # Agent should either:
    # 1. Confirm if it's in KB with evidence, or
    # 2. Say they don't have specific information
    if "slack" in response_text:
        # If mentioning Slack, should have KB sources to back it up
        assert len(response["sources"]) > 0, "Claims about integrations should have KB sources"
    else:
        # Otherwise, should admit lack of information
        assert any([
            "i don't have specific information" in response_text,
            "contact" in response_text,
            "team" in response_text
        ]), "Should acknowledge when information isn't in KB"


@pytest.mark.asyncio
async def test_pricing_hallucination():
    """Test that agent refuses to guess prices and uses quotation system"""
    agent = get_marketing_agent()

    response = await agent.chat("Is the Smart Business Assistant under $5,000?")

    response_text = response["response"].lower()

    # Should NOT make up specific price claims
    price_claims = ["$2,999", "$4,999", "under $5,000", "over $10,000", "starting at"]
    for claim in price_claims:
        if claim in response_text:
            pytest.fail(f"Agent should not make specific price claims. Found: {claim}")

    # Should guide to Custom Quotation System or contact
    assert any([
        "quotation" in response_text,
        "quote" in response_text,
        "contact" in response_text,
        "/contact" in response_text
    ]), "Should guide to quotation system for pricing questions"


@pytest.mark.asyncio
async def test_timeline_fabrication():
    """Test that agent doesn't fabricate implementation timelines"""
    agent = get_marketing_agent()

    response = await agent.chat("How long does implementation take?")

    response_text = response["response"]

    # If specific timelines are mentioned, they should be from KB
    if "week" in response_text.lower() or "month" in response_text.lower():
        # Should have sources to back up timeline claims
        assert len(response["sources"]) > 0, "Timeline claims should be grounded in KB"

    # Should not make overly specific claims without KB backing
    fabricated_timelines = ["exactly 2 weeks", "precisely 30 days", "guaranteed within"]
    for timeline in fabricated_timelines:
        assert timeline.lower() not in response_text.lower(), \
            f"Should not make overly specific timeline claims. Found: {timeline}"


@pytest.mark.asyncio
async def test_kb_grounding_score_logging():
    """Test that KB grounding scores are being logged"""
    agent = get_marketing_agent()

    # Make a query that should use KB
    response = await agent.chat("What does EthosPrompt specialize in?")

    # Response should have been generated successfully
    assert response["response"], "Should generate a response"
    assert len(response["response"]) > 50, "Response should be substantial"

    # Metadata should exist
    assert "metadata" in response, "Response should have metadata"

    # This test mainly ensures the grounding logic runs without errors
    # Actual grounding score is logged internally and monitored


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "-s"])
