"""
Task Queue Abstraction for Document Processing
- Default: In-memory asyncio queue (for dev/tests)
- Optional: Pub/Sub backend (placeholder; requires google-cloud-pubsub)
"""
from __future__ import annotations
import asyncio
from typing import Optional, Any, Dict
import logging

logger = logging.getLogger(__name__)

try:
    from google.cloud import pubsub_v1  # type: ignore
    PUBSUB_AVAILABLE = True
except Exception:
    PUBSUB_AVAILABLE = False


class TaskQueueBackend:
    async def enqueue(self, payload: Dict[str, Any]) -> None:
        raise NotImplementedError

    async def dequeue(self) -> Optional[Dict[str, Any]]:
        raise NotImplementedError


class InMemoryTaskQueue(TaskQueueBackend):
    def __init__(self, maxsize: int = 0) -> None:
        self._queue: asyncio.Queue[Dict[str, Any]] = asyncio.Queue(maxsize=maxsize)

    async def enqueue(self, payload: Dict[str, Any]) -> None:
        await self._queue.put(payload)

    async def dequeue(self) -> Optional[Dict[str, Any]]:
        try:
            return await self._queue.get()
        except asyncio.CancelledError:
            return None


class PubSubTaskQueue(TaskQueueBackend):
    def __init__(self, project_id: str, topic: str) -> None:
        if not PUBSUB_AVAILABLE:
            raise RuntimeError("google-cloud-pubsub not installed")
        self._publisher = pubsub_v1.PublisherClient()
        self._topic_path = self._publisher.topic_path(project_id, topic)

    async def enqueue(self, payload: Dict[str, Any]) -> None:
        data = (payload.get("data") or "").encode("utf-8")
        future = self._publisher.publish(self._topic_path, data=data, **{
            k: str(v) for k, v in payload.items() if k != "data"
        })
        await asyncio.get_event_loop().run_in_executor(None, future.result)

    async def dequeue(self) -> Optional[Dict[str, Any]]:
        # Dequeue is handled by Pub/Sub subscription callbacks in real deployments.
        logger.warning("PubSubTaskQueue does not support dequeue(); use subscription callback.")
        return None


def get_task_queue(config: Optional[Dict[str, Any]] = None) -> TaskQueueBackend:
    cfg = config or {}
    backend = cfg.get("backend", "memory")
    if backend == "pubsub":
        return PubSubTaskQueue(cfg["project_id"], cfg["topic"])  # may raise if lib missing
    return InMemoryTaskQueue(maxsize=cfg.get("maxsize", 0))

