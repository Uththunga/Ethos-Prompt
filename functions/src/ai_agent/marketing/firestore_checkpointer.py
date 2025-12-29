"""
Firestore Checkpoint Saver for LangGraph

Implements persistent state management using Firestore.
Enables conversation history to survive Cloud Run instance restarts.

Phase 5 Implementation - State Management
"""
import logging
from typing import Any, Dict, Iterator, List, Optional, Tuple
from datetime import datetime, timezone
import json

logger = logging.getLogger(__name__)

# Check if LangGraph checkpoint interfaces are available
try:
    from langgraph.checkpoint.base import BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple
    LANGGRAPH_CHECKPOINT_AVAILABLE = True
except ImportError:
    LANGGRAPH_CHECKPOINT_AVAILABLE = False
    # Define stub classes for type hints
    class BaseCheckpointSaver:
        pass
    class Checkpoint:
        pass
    class CheckpointMetadata:
        pass


class FirestoreCheckpointer(BaseCheckpointSaver):
    """
    Firestore-based checkpoint saver for LangGraph agents.

    Stores conversation checkpoints in Firestore for:
    - Cross-session persistence (survives Cloud Run restarts)
    - Multi-instance consistency (shared state across pods)
    - Automatic TTL cleanup via Firestore TTL policies

    Collection structure:
        agent_checkpoints/{thread_id}/checkpoints/{checkpoint_id}

    NOTE: Uses synchronous Firestore API intentionally because LangGraph's
    BaseCheckpointSaver interface is synchronous. This is called infrequently
    (once per conversation turn) so the blocking is acceptable.

    Usage:
        from firestore_checkpointer import FirestoreCheckpointer

        checkpointer = FirestoreCheckpointer(db=firestore.client())
        agent = create_react_agent(..., checkpointer=checkpointer)
    """

    def __init__(
        self,
        db,
        collection_name: str = "agent_checkpoints",
        ttl_days: int = 7
    ):
        """
        Initialize Firestore checkpointer.

        Args:
            db: Firestore client instance
            collection_name: Root collection for checkpoints
            ttl_days: Days before automatic cleanup (requires Firestore TTL policy)
        """
        if not LANGGRAPH_CHECKPOINT_AVAILABLE:
            raise ImportError(
                "LangGraph checkpoint interfaces not available. "
                "Install with: pip install langgraph>=0.2.0"
            )

        super().__init__()
        self.db = db
        self.collection_name = collection_name
        self.ttl_days = ttl_days
        logger.info(f"FirestoreCheckpointer initialized (collection={collection_name}, ttl={ttl_days}d)")

    def _get_checkpoint_ref(self, thread_id: str, checkpoint_id: str):
        """Get Firestore document reference for a checkpoint."""
        return (
            self.db.collection(self.collection_name)
            .document(thread_id)
            .collection("checkpoints")
            .document(checkpoint_id)
        )

    def _get_thread_ref(self, thread_id: str):
        """Get Firestore document reference for thread metadata."""
        return self.db.collection(self.collection_name).document(thread_id)

    def get(
        self,
        config: Dict[str, Any]
    ) -> Optional[Checkpoint]:
        """
        Get the latest checkpoint for a thread.

        Args:
            config: Configuration dict with 'configurable' containing 'thread_id'

        Returns:
            Latest Checkpoint or None if not found
        """
        try:
            thread_id = config.get("configurable", {}).get("thread_id")
            if not thread_id:
                return None

            # Get latest checkpoint
            checkpoints_ref = (
                self.db.collection(self.collection_name)
                .document(thread_id)
                .collection("checkpoints")
                .order_by("created_at", direction="DESCENDING")
                .limit(1)
            )

            docs = list(checkpoints_ref.stream())
            if not docs:
                logger.debug(f"No checkpoint found for thread {thread_id}")
                return None

            doc = docs[0]
            data = doc.to_dict()

            # Deserialize checkpoint
            checkpoint = Checkpoint(
                v=data.get("v", 1),
                ts=data.get("ts"),
                channel_values=json.loads(data.get("channel_values", "{}")),
                channel_versions=json.loads(data.get("channel_versions", "{}")),
                versions_seen=json.loads(data.get("versions_seen", "{}"))
            )

            logger.debug(f"Loaded checkpoint {doc.id} for thread {thread_id}")
            return checkpoint

        except Exception as e:
            logger.error(f"Error getting checkpoint: {e}")
            return None

    def put(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: Optional[CheckpointMetadata] = None
    ) -> Dict[str, Any]:
        """
        Save a checkpoint.

        Args:
            config: Configuration dict with 'configurable' containing 'thread_id'
            checkpoint: Checkpoint to save (dict in LangGraph v0.2+)
            metadata: Optional metadata

        Returns:
            Updated config with checkpoint ID
        """
        try:
            thread_id = config.get("configurable", {}).get("thread_id")
            if not thread_id:
                raise ValueError("thread_id is required in config.configurable")

            # LangGraph v0.2+ passes checkpoint as dict, older versions as object
            # Handle both formats for compatibility
            if isinstance(checkpoint, dict):
                cp_ts = checkpoint.get("ts", "")
                cp_v = checkpoint.get("v", 1)
                cp_channel_values = checkpoint.get("channel_values", {})
                cp_channel_versions = checkpoint.get("channel_versions", {})
                cp_versions_seen = checkpoint.get("versions_seen", {})
            else:
                cp_ts = getattr(checkpoint, "ts", "")
                cp_v = getattr(checkpoint, "v", 1)
                cp_channel_values = getattr(checkpoint, "channel_values", {})
                cp_channel_versions = getattr(checkpoint, "channel_versions", {})
                cp_versions_seen = getattr(checkpoint, "versions_seen", {})

            # Generate checkpoint ID
            checkpoint_id = f"cp_{cp_ts}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

            # Calculate TTL
            from datetime import timedelta
            ttl_timestamp = datetime.now(timezone.utc) + timedelta(days=self.ttl_days)

            # Serialize and save
            doc_ref = self._get_checkpoint_ref(thread_id, checkpoint_id)
            doc_ref.set({
                "v": cp_v,
                "ts": cp_ts,
                "channel_values": json.dumps(cp_channel_values, default=str),
                "channel_versions": json.dumps(cp_channel_versions, default=str),
                "versions_seen": json.dumps(cp_versions_seen, default=str),
                "created_at": datetime.now(timezone.utc),
                "ttl": ttl_timestamp,
                "metadata": metadata if isinstance(metadata, dict) else (metadata.__dict__ if metadata else {})
            })

            # Update thread metadata
            thread_ref = self._get_thread_ref(thread_id)
            thread_ref.set({
                "latest_checkpoint": checkpoint_id,
                "updated_at": datetime.now(timezone.utc),
            }, merge=True)

            logger.debug(f"Saved checkpoint {checkpoint_id} for thread {thread_id}")

            return {
                **config,
                "configurable": {
                    **config.get("configurable", {}),
                    "checkpoint_id": checkpoint_id
                }
            }

        except Exception as e:
            logger.error(f"Error saving checkpoint: {e}")
            raise

    def list(
        self,
        config: Dict[str, Any],
        *,
        before: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None
    ) -> Iterator[Tuple[Checkpoint, CheckpointMetadata]]:
        """
        List checkpoints for a thread.

        Args:
            config: Configuration dict with thread_id
            before: Optional config to list checkpoints before
            limit: Maximum number to return

        Yields:
            Tuples of (Checkpoint, CheckpointMetadata)
        """
        try:
            thread_id = config.get("configurable", {}).get("thread_id")
            if not thread_id:
                return

            query = (
                self.db.collection(self.collection_name)
                .document(thread_id)
                .collection("checkpoints")
                .order_by("created_at", direction="DESCENDING")
            )

            if limit:
                query = query.limit(limit)

            for doc in query.stream():
                data = doc.to_dict()
                checkpoint = Checkpoint(
                    v=data.get("v", 1),
                    ts=data.get("ts"),
                    channel_values=json.loads(data.get("channel_values", "{}")),
                    channel_versions=json.loads(data.get("channel_versions", "{}")),
                    versions_seen=json.loads(data.get("versions_seen", "{}"))
                )
                metadata = CheckpointMetadata(**data.get("metadata", {}))
                yield (checkpoint, metadata)

        except Exception as e:
            logger.error(f"Error listing checkpoints: {e}")
            return

    # ================================================================
    # ASYNC METHODS (Required by LangGraph ainvoke)
    # ================================================================

    async def aget_tuple(self, config: Dict[str, Any]) -> Optional[CheckpointTuple]:
        """
        Async version of get() that returns CheckpointTuple.
        Required by LangGraph's ainvoke().

        Args:
            config: Configuration dict with 'configurable' containing 'thread_id'

        Returns:
            CheckpointTuple or None if not found
        """
        import asyncio
        try:
            # Run sync get() in thread pool
            checkpoint = await asyncio.to_thread(self.get, config)
            if checkpoint is None:
                return None

            thread_id = config.get("configurable", {}).get("thread_id")
            checkpoint_id = f"latest_{thread_id}"

            # Return proper CheckpointTuple namedtuple (LangGraph v0.2+ requirement)
            return CheckpointTuple(
                config={
                    "configurable": {
                        **config.get("configurable", {}),
                        "checkpoint_id": checkpoint_id
                    }
                },
                checkpoint=checkpoint,
                metadata=CheckpointMetadata() if not isinstance(checkpoint, dict) else {},
                parent_config=None,
                pending_writes=None
            )

        except Exception as e:
            logger.error(f"Error in aget_tuple: {e}")
            return None

    async def aput(
        self,
        config: Dict[str, Any],
        checkpoint: Checkpoint,
        metadata: Optional[CheckpointMetadata] = None,
        new_versions: Optional[Dict[str, Any]] = None  # LangGraph v0.2+ compatibility
    ) -> Dict[str, Any]:
        """
        Async version of put().
        Required by LangGraph's ainvoke().

        Args:
            config: Configuration dict
            checkpoint: Checkpoint to save
            metadata: Optional metadata
            new_versions: Channel version updates (LangGraph v0.2+)

        Returns:
            Updated config with checkpoint ID
        """
        import asyncio
        try:
            # Run sync put() in thread pool (new_versions not used in Firestore storage)
            return await asyncio.to_thread(self.put, config, checkpoint, metadata)
        except Exception as e:
            logger.error(f"Error in aput: {e}")
            raise

    async def aput_writes(
        self,
        config: Dict[str, Any],
        writes: List[Tuple[str, Any]],
        task_id: str
    ) -> None:
        """
        Async method to store pending writes (LangGraph v0.2+ requirement).

        This method is called to persist intermediate channel writes before
        the checkpoint is finalized. For simplicity, we store these as part
        of the thread's pending writes document.

        Args:
            config: Configuration dict with thread_id
            writes: List of (channel_name, value) tuples to write
            task_id: Identifier for the current task
        """
        import asyncio
        try:
            thread_id = config.get("configurable", {}).get("thread_id")
            if not thread_id:
                logger.warning("aput_writes called without thread_id, skipping")
                return

            # Store pending writes in a subcollection
            def _store_writes():
                writes_ref = (
                    self.db.collection(self.collection_name)
                    .document(thread_id)
                    .collection("pending_writes")
                    .document(task_id)
                )
                writes_ref.set({
                    "writes": json.dumps([(ch, str(val)) for ch, val in writes], default=str),
                    "task_id": task_id,
                    "created_at": datetime.now(timezone.utc)
                })

            await asyncio.to_thread(_store_writes)
            logger.debug(f"Stored {len(writes)} pending writes for task {task_id}")

        except Exception as e:
            logger.error(f"Error in aput_writes: {e}")
            # Don't raise - writes are not critical for basic operation


def get_firestore_checkpointer(db, collection_name: str = "agent_checkpoints") -> Optional[FirestoreCheckpointer]:
    """
    Factory function to create FirestoreCheckpointer.

    Args:
        db: Firestore client
        collection_name: Collection for checkpoints

    Returns:
        FirestoreCheckpointer instance (or None if LangGraph not available)
    """
    if not LANGGRAPH_CHECKPOINT_AVAILABLE:
        logger.warning("LangGraph checkpoint interfaces not available - using MemorySaver")
        return None

    if db is None:
        logger.warning("Firestore db not provided - using MemorySaver fallback")
        return None

    try:
        checkpointer = FirestoreCheckpointer(db=db, collection_name=collection_name)
        logger.info("✓ FirestoreCheckpointer enabled for conversation persistence")
        return checkpointer
    except Exception as e:
        logger.error(f"Failed to create FirestoreCheckpointer: {e} - using MemorySaver fallback")
        return None
