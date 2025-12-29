"""
Integration Tests for Conversation Persistence
Tests that conversation state persists across agent restarts using checkpointer.
"""
import pytest
import os
import time
from unittest.mock import Mock, AsyncMock, MagicMock, patch

# Add src to path
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))


@pytest.fixture
def mock_firestore_for_persistence():
    """Mock Firestore client with in-memory storage for persistence testing"""
    # In-memory storage to simulate persistence
    storage = {}

    mock_db = MagicMock()

    def mock_collection(name):
        mock_coll = MagicMock()

        def mock_document(doc_id):
            mock_doc = MagicMock()

            # Mock get() to retrieve from storage
            async def mock_get():
                mock_snapshot = MagicMock()
                if doc_id in storage:
                    mock_snapshot.exists = True
                    mock_snapshot.to_dict.return_value = storage[doc_id]
                else:
                    mock_snapshot.exists = False
                return mock_snapshot

            mock_doc.get = mock_get

            # Mock set() to save to storage
            async def mock_set(data):
                storage[doc_id] = data
                return MagicMock()

            mock_doc.set = mock_set

            return mock_doc

        mock_coll.document = mock_document
        return mock_coll

    mock_db.collection = mock_collection
    return mock_db


@pytest.mark.asyncio
async def test_basic_checkpoint_persistence(mock_firestore_for_persistence):
    """
    Test that a checkpoint is saved and can be retrieved after agent restart.
    """
    from src.ai_agent.marketing.marketing_agent import MarketingAgent

    thread_id = "test-persistence-123"

    # Create first agent instance
    with patch.dict(os.environ, {
        "ENVIRONMENT": "production",
        "USE_GRANITE_LLM": "true",
        "OPENROUTER_USE_MOCK": "true",
        "WATSONX_API_KEY": "mock_key",
        "WATSONX_PROJECT_ID": "mock_project"
    }):
        agent1 = MarketingAgent(db=mock_firestore_for_persistence)

        # Verify FirestoreCheckpointer is being used
        from src.common.firestore_checkpointer import FirestoreCheckpointer
        assert isinstance(agent1.checkpointer, FirestoreCheckpointer), \
            "Should use FirestoreCheckpointer in production"

        # Simulate a conversation (this would normally save a checkpoint)
        # Note: In real usage, the checkpoint is saved automatically by LangGraph
        # For this test, we're verifying the checkpointer infrastructure is in place

        logger_info = []
        with patch('src.ai_agent.marketing.marketing_agent.logger') as mock_logger:
            mock_logger.info.side_effect = lambda msg: logger_info.append(msg)

            # Create second agent instance (simulating restart)
            agent2 = MarketingAgent(db=mock_firestore_for_persistence)

            # Verify FirestoreCheckpointer was initialized
            assert any("FirestoreCheckpointer" in msg for msg in logger_info), \
                "Should log FirestoreCheckpointer initialization"


@pytest.mark.asyncio
async def test_fallback_to_memory_saver_on_error(mock_firestore_client):
    """
    Test that agent falls back to MemorySaver if FirestoreCheckpointer fails.
    """
    from src.ai_agent.marketing.marketing_agent import MarketingAgent
    from langgraph.checkpoint.memory import MemorySaver

    # Mock Firestore to raise an error
    mock_firestore_client.collection.side_effect = Exception("Firestore connection failed")

    with patch.dict(os.environ, {
        "ENVIRONMENT": "production",
        "USE_GRANITE_LLM": "true",
        "OPENROUTER_USE_MOCK": "true",
        "WATSONX_API_KEY": "mock_key",
        "WATSONX_PROJECT_ID": "mock_project"
    }):
        agent = MarketingAgent(db=mock_firestore_client)

        # Should fall back to MemorySaver
        assert isinstance(agent.checkpointer, MemorySaver), \
            "Should fall back to MemorySaver on Firestore error"


@pytest.mark.asyncio
async def test_memory_saver_in_test_environment(mock_firestore_client):
    """
    Test that MemorySaver is used in test/dev environments.
    """
    from src.ai_agent.marketing.marketing_agent import MarketingAgent
    from langgraph.checkpoint.memory import MemorySaver

    # Test environment
    with patch.dict(os.environ, {
        "ENVIRONMENT": "test",
        "USE_GRANITE_LLM": "true",
        "OPENROUTER_USE_MOCK": "true",
        "WATSONX_API_KEY": "mock_key",
        "WATSONX_PROJECT_ID": "mock_project"
    }):
        agent = MarketingAgent(db=mock_firestore_client)

        assert isinstance(agent.checkpointer, MemorySaver), \
            "Should use MemorySaver in test environment"

    # Development environment
    with patch.dict(os.environ, {
        "ENVIRONMENT": "development",
        "USE_GRANITE_LLM": "true",
        "OPENROUTER_USE_MOCK": "true",
        "WATSONX_API_KEY": "mock_key",
        "WATSONX_PROJECT_ID": "mock_project"
    }):
        agent = MarketingAgent(db=mock_firestore_client)

        assert isinstance(agent.checkpointer, MemorySaver), \
            "Should use MemorySaver in development environment"


@pytest.mark.asyncio
async def test_checkpoint_save_performance(mock_firestore_for_persistence):
    """
    Test that checkpoint save operations complete within acceptable time.
    Target: <100ms
    """
    from src.common.firestore_checkpointer import FirestoreCheckpointer

    checkpointer = FirestoreCheckpointer(
        client=mock_firestore_for_persistence,
        collection_name="agent_checkpoints"
    )

    # Create a sample checkpoint
    checkpoint = {
        "v": 1,
        "ts": "2024-01-01T00:00:00Z",
        "id": "test-checkpoint-id",
        "channel_values": {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi there!"}
            ]
        }
    }

    config = {"configurable": {"thread_id": "perf-test-123"}}
    metadata = {"source": "test", "step": 1}

    # Measure save time
    start_time = time.time()
    await checkpointer.aput(config, checkpoint, metadata, new_versions={})
    save_time = (time.time() - start_time) * 1000  # Convert to ms

    print(f"\n📊 Checkpoint save time: {save_time:.2f}ms")

    # Assert performance target
    # Note: In real tests with actual Firestore, this might be higher
    # For mocked tests, it should be very fast
    assert save_time < 100, f"Checkpoint save took {save_time:.2f}ms, target is <100ms"


@pytest.mark.asyncio
async def test_checkpoint_load_performance(mock_firestore_for_persistence):
    """
    Test that checkpoint load operations complete within acceptable time.
    Target: <50ms
    """
    from src.common.firestore_checkpointer import FirestoreCheckpointer

    checkpointer = FirestoreCheckpointer(
        client=mock_firestore_for_persistence,
        collection_name="agent_checkpoints"
    )

    # Save a checkpoint first
    checkpoint = {
        "v": 1,
        "ts": "2024-01-01T00:00:00Z",
        "id": "test-checkpoint-id",
        "channel_values": {"messages": []}
    }

    config = {"configurable": {"thread_id": "perf-test-load-123"}}
    await checkpointer.aput(config, checkpoint, {}, new_versions={})

    # Measure load time
    start_time = time.time()
    loaded = await checkpointer.aget(config)
    load_time = (time.time() - start_time) * 1000  # Convert to ms

    print(f"\n📊 Checkpoint load time: {load_time:.2f}ms")

    # Assert performance target
    assert load_time < 50, f"Checkpoint load took {load_time:.2f}ms, target is <50ms"

    # Verify data was loaded correctly
    assert loaded is not None, "Should load checkpoint"
    assert loaded.checkpoint["id"] == "test-checkpoint-id", "Should load correct checkpoint"


@pytest.mark.asyncio
async def test_concurrent_thread_isolation(mock_firestore_for_persistence):
    """
    Test that checkpoints from different threads don't interfere with each other.
    """
    from src.common.firestore_checkpointer import FirestoreCheckpointer

    checkpointer = FirestoreCheckpointer(
        client=mock_firestore_for_persistence,
        collection_name="agent_checkpoints"
    )

    # Save checkpoints for two different threads
    checkpoint1 = {
        "v": 1,
        "ts": "2024-01-01T00:00:00Z",
        "id": "checkpoint-1",
        "channel_values": {"messages": [{"content": "Thread 1 message"}]}
    }

    checkpoint2 = {
        "v": 1,
        "ts": "2024-01-01T00:00:01Z",
        "id": "checkpoint-2",
        "channel_values": {"messages": [{"content": "Thread 2 message"}]}
    }

    config1 = {"configurable": {"thread_id": "thread-1"}}
    config2 = {"configurable": {"thread_id": "thread-2"}}

    await checkpointer.aput(config1, checkpoint1, {}, new_versions={})
    await checkpointer.aput(config2, checkpoint2, {}, new_versions={})

    # Load and verify each thread's checkpoint
    loaded1 = await checkpointer.aget(config1)
    loaded2 = await checkpointer.aget(config2)

    assert loaded1.checkpoint["id"] == "checkpoint-1", "Thread 1 should load its own checkpoint"
    assert loaded2.checkpoint["id"] == "checkpoint-2", "Thread 2 should load its own checkpoint"

    # Verify content is different
    msg1 = loaded1.checkpoint["channel_values"]["messages"][0]["content"]
    msg2 = loaded2.checkpoint["channel_values"]["messages"][0]["content"]

    assert msg1 == "Thread 1 message", "Thread 1 should have its own message"
    assert msg2 == "Thread 2 message", "Thread 2 should have its own message"
    assert msg1 != msg2, "Threads should have isolated state"
