"""
Firestore Checkpointer for LangGraph
Persists agent state to Google Cloud Firestore.
"""
import pickle
import base64
import logging
from typing import Any, AsyncIterator, Dict, Optional, Tuple
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple

logger = logging.getLogger(__name__)

class FirestoreCheckpointer(BaseCheckpointSaver):
    """
    A checkpoint saver that stores checkpoints in Google Cloud Firestore.
    Uses pickle + base64 to serialize complex objects (like LangChain messages)
    that Firestore doesn't natively support.
    """

    def __init__(self, client: Any, collection_name: str = "agent_checkpoints"):
        """
        Initialize the Firestore checkpointer.

        Args:
            client: google.cloud.firestore.AsyncClient instance
            collection_name: Name of the Firestore collection to store checkpoints
        """
        super().__init__()
        self.client = client
        self.collection_name = collection_name

    def _serialize_checkpoint(self, checkpoint: Checkpoint) -> str:
        """Serialize checkpoint to base64 encoded pickle string"""
        return base64.b64encode(pickle.dumps(checkpoint)).decode("utf-8")

    def _deserialize_checkpoint(self, data: str) -> Checkpoint:
        """Deserialize checkpoint from base64 encoded pickle string"""
        return pickle.loads(base64.b64decode(data.encode("utf-8")))

    def _serialize_metadata(self, metadata: CheckpointMetadata) -> str:
        """Serialize metadata to base64 encoded pickle string"""
        return base64.b64encode(pickle.dumps(metadata)).decode("utf-8")

    def _deserialize_metadata(self, data: str) -> CheckpointMetadata:
        """Deserialize metadata from base64 encoded pickle string"""
        return pickle.loads(base64.b64decode(data.encode("utf-8")))

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        """
        Get a checkpoint tuple from Firestore.

        Args:
            config: RunnableConfig containing thread_id

        Returns:
            CheckpointTuple or None if not found
        """
        thread_id = config["configurable"]["thread_id"]
        doc_ref = self.client.collection(self.collection_name).document(thread_id)

        try:
            doc = await doc_ref.get()
            if not doc.exists:
                return None

            data = doc.to_dict()
            if not data or "checkpoint" not in data:
                return None

            checkpoint = self._deserialize_checkpoint(data["checkpoint"])
            metadata = self._deserialize_metadata(data["metadata"]) if "metadata" in data else {}

            # Parent config is optional/derived
            parent_config = None
            if "parent_config" in data and data["parent_config"]:
                 # Simplified reconstruction if needed, usually just thread_id
                 pass

            return CheckpointTuple(config, checkpoint, metadata, parent_config)

        except Exception as e:
            logger.error(f"Error retrieving checkpoint for thread {thread_id}: {e}")
            return None

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: Dict[str, Any],
    ) -> RunnableConfig:
        """
        Save a checkpoint to Firestore.

        Args:
            config: RunnableConfig containing thread_id
            checkpoint: The checkpoint to save
            metadata: Metadata associated with the checkpoint
            new_versions: New versions of keys (unused in simple implementation)

        Returns:
            RunnableConfig with updated configuration
        """
        thread_id = config["configurable"]["thread_id"]
        doc_ref = self.client.collection(self.collection_name).document(thread_id)

        try:
            data = {
                "checkpoint": self._serialize_checkpoint(checkpoint),
                "metadata": self._serialize_metadata(metadata),
                "thread_id": thread_id,
                "updated_at": self.client.SERVER_TIMESTAMP
            }

            await doc_ref.set(data, merge=True)
            logger.debug(f"Saved checkpoint for thread {thread_id}")

            return {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": config["configurable"].get("checkpoint_ns", ""),
                    "checkpoint_id": checkpoint["id"],
                }
            }

        except Exception as e:
            logger.error(f"Error saving checkpoint for thread {thread_id}: {e}")
            return config

    async def alist(
        self,
        config: RunnableConfig,
        *,
        filter: Optional[Dict[str, Any]] = None,
        before: Optional[RunnableConfig] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[CheckpointTuple]:
        """List checkpoints (Not fully implemented for this MVP)"""
        # Minimal implementation to satisfy abstract base class if needed
        # For now, we only support getting the latest by thread_id
        if False:
            yield
