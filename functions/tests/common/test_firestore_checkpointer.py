"""
Tests for FirestoreCheckpointer
"""
import pytest
import pickle
import base64
import sys
import os
from unittest.mock import AsyncMock, MagicMock

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))

from common.firestore_checkpointer import FirestoreCheckpointer

@pytest.fixture
def mock_firestore_client():
    client = MagicMock() # Client itself is sync, methods might be async
    collection = MagicMock()
    document = MagicMock()

    # collection() and document() are sync
    client.collection.return_value = collection
    collection.document.return_value = document

    # get() and set() are async
    doc_snapshot = MagicMock()
    doc_snapshot.exists = False

    # Configure get() to be awaitable
    async_get = AsyncMock(return_value=doc_snapshot)
    document.get = async_get

    # Configure set() to be awaitable
    async_set = AsyncMock()
    document.set = async_set

    return client

@pytest.mark.asyncio
async def test_aput_saves_checkpoint(mock_firestore_client):
    """Test that aput serializes and saves checkpoint"""
    checkpointer = FirestoreCheckpointer(mock_firestore_client)

    config = {"configurable": {"thread_id": "test_thread"}}
    checkpoint = {"v": 1, "id": "chk_1", "channel_values": {"messages": []}}
    metadata = {"source": "test"}

    await checkpointer.aput(config, checkpoint, metadata, {})

    # Verify Firestore call
    mock_firestore_client.collection.assert_called_with("agent_checkpoints")
    mock_firestore_client.collection().document.assert_called_with("test_thread")

    # Verify data format
    call_args = mock_firestore_client.collection().document().set.call_args
    assert call_args is not None
    data = call_args[0][0]

    assert "checkpoint" in data
    assert "metadata" in data
    assert data["thread_id"] == "test_thread"

    # Verify serialization
    deserialized_checkpoint = pickle.loads(base64.b64decode(data["checkpoint"]))
    assert deserialized_checkpoint == checkpoint

@pytest.mark.asyncio
async def test_aget_retrieves_checkpoint(mock_firestore_client):
    """Test that aget retrieves and deserializes checkpoint"""
    checkpointer = FirestoreCheckpointer(mock_firestore_client)

    # Setup mock data
    original_checkpoint = {"v": 1, "id": "chk_1", "channel_values": {"messages": ["hello"]}}
    original_metadata = {"source": "test"}

    serialized_checkpoint = base64.b64encode(pickle.dumps(original_checkpoint)).decode("utf-8")
    serialized_metadata = base64.b64encode(pickle.dumps(original_metadata)).decode("utf-8")

    doc_snapshot = MagicMock()
    doc_snapshot.exists = True
    doc_snapshot.to_dict.return_value = {
        "checkpoint": serialized_checkpoint,
        "metadata": serialized_metadata,
        "thread_id": "test_thread"
    }

    mock_firestore_client.collection().document().get.return_value = doc_snapshot

    config = {"configurable": {"thread_id": "test_thread"}}
    tuple_result = await checkpointer.aget_tuple(config)

    assert tuple_result is not None
    assert tuple_result.checkpoint == original_checkpoint
    assert tuple_result.metadata == original_metadata
    assert tuple_result.config["configurable"]["thread_id"] == "test_thread"

@pytest.mark.asyncio
async def test_aget_returns_none_if_not_found(mock_firestore_client):
    """Test that aget returns None if document doesn't exist"""
    checkpointer = FirestoreCheckpointer(mock_firestore_client)

    doc_snapshot = MagicMock()
    doc_snapshot.exists = False
    mock_firestore_client.collection().document().get.return_value = doc_snapshot

    config = {"configurable": {"thread_id": "non_existent"}}
    result = await checkpointer.aget_tuple(config)

    assert result is None
