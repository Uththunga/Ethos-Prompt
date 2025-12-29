import asyncio
import pytest

from src.rag.task_queue import InMemoryTaskQueue, get_task_queue


@pytest.mark.asyncio
async def test_inmemory_queue_enqueue_dequeue():
    q = InMemoryTaskQueue()
    payload = {"job_id": "abc", "data": "hello"}
    await q.enqueue(payload)
    out = await asyncio.wait_for(q.dequeue(), timeout=1)
    assert out == payload


def test_get_task_queue_default():
    q = get_task_queue()
    assert isinstance(q, InMemoryTaskQueue)

