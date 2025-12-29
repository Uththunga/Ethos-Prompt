"""
Batch Document Processor (lightweight)
Provides a simple concurrency-limited batch processor for documents.
In production, prefer Cloud Tasks or Pub/Sub for robust queuing.
"""
from __future__ import annotations
import asyncio
from typing import Iterable, List, Dict, Any, Optional
import logging

from .document_processor import DocumentProcessingPipeline, DocumentProcessingJob

logger = logging.getLogger(__name__)


class BatchProcessor:
    def __init__(self, pipeline: DocumentProcessingPipeline, *, max_concurrency: int = 3):
        self.pipeline = pipeline
        self.semaphore = asyncio.Semaphore(max_concurrency)

    async def _process_one(self, job: DocumentProcessingJob, file_content: bytes, config: Optional[Dict[str, Any]] = None) -> bool:
        async with self.semaphore:
            return await self.pipeline.process_document(job, file_content, processing_config=config)

    async def process_many(self, items: Iterable[Dict[str, Any]], *, config: Optional[Dict[str, Any]] = None) -> List[bool]:
        tasks = []
        for item in items:
            job: DocumentProcessingJob = item["job"]
            content: bytes = item["content"]
            tasks.append(asyncio.create_task(self._process_one(job, content, config)))
        results = await asyncio.gather(*tasks, return_exceptions=True)
        out: List[bool] = []
        for r in results:
            if isinstance(r, Exception):
                logger.error(f"Batch item failed: {r}")
                out.append(False)
            else:
                out.append(bool(r))
        return out

