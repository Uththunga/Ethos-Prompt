"""
Integration tests for Phase 3 features
Tests drift tracking, RAG quality logging, and PII redaction in agent workflow
"""
import pytest
import asyncio
from unittest.mock import AsyncMock, Mock, MagicMock, patch
import logging


@pytest.mark.asyncio
async def test_drift_tracking_in_chat_flow():
    """Verify drift tracking happens during normal chat"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    # Mock Firestore
    mock_db = Mock()
    mock_db.collection = Mock(return_value=Mock(
        document=Mock(return_value=Mock(
            set=AsyncMock()
        ))
    ))

    agent = MarketingAgent(db=mock_db, openrouter_api_key="test_key")

    # Mock agent.ainvoke to avoid actual LLM call
    agent.agent.ainvoke = AsyncMock(return_value={
        "messages": [Mock(content="Test response")]
    })

    response = await agent.chat(
        message="What are your pricing plans?",
        context={"conversation_id": "test_drift", "page_context": "pricing"}
    )

    # Verify drift monitor was called (check Firestore writes)
    assert mock_db.collection.called, "Firestore should be accessed for drift tracking"


@pytest.mark.asyncio
async def test_rag_quality_logging_in_retrieval():
    """Verify RAG quality is logged after retrieval"""
    from src.ai_agent.marketing.marketing_retriever import marketing_retriever

    # Mock Firestore
    mock_db = Mock()
    mock_db.collection = Mock(return_value=Mock(
        add=AsyncMock(return_value=(None, Mock(id="test_id")))
    ))

    # Temporarily replace retriever's db and quality_metrics
    original_db = marketing_retriever.db
    marketing_retriever.db = mock_db
    marketing_retriever.quality_metrics.db = mock_db

    try:
        # Mock the actual search to avoid dependencies
        with patch.object(marketing_retriever, '_semantic_search', new_callable=AsyncMock) as mock_search:
            from src.ai_agent.marketing.marketing_retriever import RetrievalResult
            mock_search.return_value = [
                RetrievalResult(
                    text="Test content",
                    score=0.9,
                    document_id="doc1",
                    document_title="Test Doc",
                    category="test",
                    page="1",
                    chunk_index=0
                )
            ]

            results = await marketing_retriever.retrieve(query="test query", top_k=5, use_hybrid=False)

            # Verify quality logging happened
            assert mock_db.collection.called, "Firestore should be accessed for quality logging"
    finally:
        # Restore original db
        marketing_retriever.db = original_db


@pytest.mark.asyncio
async def test_pii_redaction_in_logs(caplog):
    """Verify PII is redacted from logs"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent
    from src.ai_agent.security.pii_detector import PRESIDIO_AVAILABLE

    if not PRESIDIO_AVAILABLE:
        pytest.skip("Presidio not installed, skipping PII test")

    with caplog.at_level(logging.INFO):
        mock_db = Mock()
        mock_db.collection = Mock(return_value=Mock(
            document=Mock(return_value=Mock(set=AsyncMock()))
        ))

        agent = MarketingAgent(db=mock_db, openrouter_api_key="test_key")

        # Mock agent.ainvoke
        agent.agent.ainvoke = AsyncMock(return_value={
            "messages": [Mock(content="Thank you for your inquiry")]
        })

        # Send message with PII
        await agent.chat(
            message="My email is john.doe@example.com",
            context={"conversation_id": "pii_test", "page_context": "test"}
        )

        # Check logs don't contain raw email (may be redacted)
        log_text = caplog.text
        # If Presidio is working, email should be redacted
        if "john.doe@example.com" in log_text:
            assert "[REDACTED]" in log_text, "PII should be redacted if detected"


@pytest.mark.asyncio
async def test_all_phase3_features_non_blocking():
    """Verify Phase 3 features don't block agent on errors"""
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    # Mock Firestore that fails
    mock_db = Mock()
    mock_db.collection = Mock(side_effect=Exception("Firestore error"))

    agent = MarketingAgent(db=mock_db, openrouter_api_key="test_key")

    # Mock agent.ainvoke
    agent.agent.ainvoke = AsyncMock(return_value={
        "messages": [Mock(content="Test response despite errors")]
    })

    # Should not raise despite Firestore errors
    response = await agent.chat(
        message="Test query",
        context={"conversation_id": "error_test", "page_context": "test"}
    )

    assert response is not None, "Agent should work despite Phase 3 errors"
    assert "response" in response, "Response should still be generated"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
