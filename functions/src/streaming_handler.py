"""
Streaming Response Handler
Task 1.6: Implement Streaming Response Support

This module provides streaming response handling for Firebase Cloud Functions.
Since Firebase Cloud Functions (2nd gen) don't natively support SSE streaming,
we implement a chunked response approach.
"""

import logging
import asyncio
import json
from typing import Dict, Any, AsyncIterator, Optional
from datetime import datetime, timezone
from firebase_admin import firestore

logger = logging.getLogger(__name__)


class StreamingResponseHandler:
    """
    Handler for streaming responses in Firebase Cloud Functions

    Note: Firebase Cloud Functions 2nd gen don't support true SSE streaming.
    This implementation uses a polling-based approach where:
    1. Client initiates execution (returns execution_id)
    2. Client polls for chunks using execution_id
    3. Server stores chunks in Firestore as they're generated
    4. Client retrieves chunks incrementally
    """

    def __init__(self, firestore_client):
        self.db = firestore_client

    async def create_streaming_execution(
        self,
        user_id: str,
        prompt_id: str,
        execution_id: str
    ) -> Dict[str, Any]:
        """
        Create a streaming execution record in Firestore

        Args:
            user_id: User ID
            prompt_id: Prompt ID
            execution_id: Unique execution ID

        Returns:
            Execution metadata
        """
        execution_ref = (
            self.db.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        execution_data = {
            'status': 'streaming',
            'chunks': [],
            'total_chunks': 0,
            'started_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'completed': False
        }

        execution_ref.set(execution_data)

        return {
            'execution_id': execution_id,
            'status': 'streaming',
            'message': 'Streaming execution started'
        }

    async def append_chunk(
        self,
        user_id: str,
        prompt_id: str,
        execution_id: str,
        chunk_content: str,
        chunk_index: int,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Append a chunk to the streaming execution

        Args:
            user_id: User ID
            prompt_id: Prompt ID
            execution_id: Execution ID
            chunk_content: Content of the chunk
            chunk_index: Index of the chunk
            metadata: Optional metadata
        """
        execution_ref = (
            self.db.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        chunk_data = {
            'index': chunk_index,
            'content': chunk_content,
            'timestamp': datetime.now(timezone.utc),
            'metadata': metadata or {}
        }

        # Update execution with new chunk
        execution_ref.update({
            'chunks': firestore.ArrayUnion([chunk_data]),
            'total_chunks': chunk_index + 1,
            'updated_at': datetime.now(timezone.utc)
        })

    async def complete_streaming_execution(
        self,
        user_id: str,
        prompt_id: str,
        execution_id: str,
        final_metadata: Dict[str, Any]
    ):
        """
        Mark streaming execution as complete

        Args:
            user_id: User ID
            prompt_id: Prompt ID
            execution_id: Execution ID
            final_metadata: Final execution metadata
        """
        execution_ref = (
            self.db.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        execution_ref.update({
            'status': 'completed',
            'completed': True,
            'completed_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'metadata': final_metadata
        })

    async def mark_cancelled(
        self,
        user_id: str,
        prompt_id: str,
        execution_id: str,
        reason: Optional[str] = None
    ) -> None:
        """
        Mark streaming execution as cancelled
        """
        execution_ref = (
            self.db.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        execution_ref.update({
            'status': 'cancelled',
            'completed': False,
            'cancelled_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
            'cancel_reason': reason or 'client_cancelled'
        })

    async def is_cancelled(
        self,
        user_id: str,
        prompt_id: str,
        execution_id: str,
    ) -> bool:
        """
        Check if the execution is marked as cancelled
        """
        execution_ref = (
            self.db.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )
        doc = execution_ref.get()
        if not doc.exists:
            return False
        data = doc.to_dict()
        return data.get('status') == 'cancelled'
    async def get_execution_chunks(
        self,
        user_id: str,
        prompt_id: str,
        execution_id: str,
        from_index: int = 0
    ) -> Dict[str, Any]:
        """
        Get chunks from a streaming execution

        Args:
            user_id: User ID
            prompt_id: Prompt ID
            execution_id: Execution ID
            from_index: Start index for chunks

        Returns:
            Execution data with chunks
        """
        execution_ref = (
            self.db.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        execution_doc = execution_ref.get()

        if not execution_doc.exists:
            return {
                'error': True,
                'message': 'Execution not found'
            }

        execution_data = execution_doc.to_dict()
        all_chunks = execution_data.get('chunks', [])

        # Filter chunks from specified index
        new_chunks = [
            chunk for chunk in all_chunks
            if chunk.get('index', 0) >= from_index
        ]

        return {
            'execution_id': execution_id,
            'status': execution_data.get('status', 'unknown'),
            'completed': execution_data.get('completed', False),
            'total_chunks': execution_data.get('total_chunks', 0),
            'chunks': new_chunks,
            'metadata': execution_data.get('metadata', {})
        }


class SimpleStreamCollector:
    """
    Simple collector for streaming responses
    Used when we want to collect the full response from a stream
    """

    def __init__(self):
        self.chunks = []
        self.full_content = ""
        self.metadata = {}

    def add_chunk(self, content: str, metadata: Optional[Dict[str, Any]] = None):
        """Add a chunk to the collector"""
        self.chunks.append(content)
        self.full_content += content
        if metadata:
            self.metadata.update(metadata)

    def get_full_response(self) -> Dict[str, Any]:
        """Get the complete response"""
        return {
            'content': self.full_content,
            'chunks': self.chunks,
            'total_chunks': len(self.chunks),
            'metadata': self.metadata
        }


async def stream_to_firestore(
    stream_iterator: AsyncIterator,
    user_id: str,
    prompt_id: str,
    execution_id: str,
    firestore_client,
    on_complete: Optional[callable] = None
):
    """
    Stream chunks to Firestore as they're generated

    Args:
        stream_iterator: Async iterator yielding chunks
        user_id: User ID
        prompt_id: Prompt ID
        execution_id: Execution ID
        firestore_client: Firestore client
        on_complete: Optional callback when streaming completes
    """
    handler = StreamingResponseHandler(firestore_client)

    # Create streaming execution
    await handler.create_streaming_execution(user_id, prompt_id, execution_id)

    chunk_index = 0
    full_content = ""

    try:
        async for chunk in stream_iterator:
            # Check for client cancellation before appending next chunk
            try:
                exec_ref = (
                    firestore_client.collection('users')
                    .document(user_id)
                    .collection('prompts')
                    .document(prompt_id)
                    .collection('executions')
                    .document(execution_id)
                )
                exec_doc = exec_ref.get()
                if exec_doc.exists:
                    exec_data = exec_doc.to_dict()
                    if exec_data.get('status') == 'cancelled':
                        logger.info(f"Execution {execution_id} marked as cancelled. Stopping stream.")
                        # Do not mark completed; partial chunks already saved
                        return
            except Exception as _:
                # If status check fails, continue streaming to avoid breaking user experience
                pass

            # Append chunk to Firestore
            await handler.append_chunk(
                user_id,
                prompt_id,
                execution_id,
                chunk.content,
                chunk_index,
                metadata={
                    'finish_reason': chunk.finish_reason,
                    'model': chunk.model
                }
            )

            full_content += chunk.content
            chunk_index += 1

            # Log progress
            if chunk_index % 10 == 0:
                logger.info(f"Streamed {chunk_index} chunks for execution {execution_id}")

        # Mark as complete
        final_metadata = {
            'total_chunks': chunk_index,
            'total_length': len(full_content),
            'completed_at': datetime.now(timezone.utc).isoformat()
        }

        await handler.complete_streaming_execution(
            user_id,
            prompt_id,
            execution_id,
            final_metadata
        )

        # Call completion callback if provided
        if on_complete:
            on_complete(full_content, final_metadata)

        logger.info(f"Streaming completed for execution {execution_id}: {chunk_index} chunks")

    except Exception as e:
        logger.error(f"Error during streaming: {str(e)}")

        # Mark execution as failed
        execution_ref = (
            firestore_client.collection('users')
            .document(user_id)
            .collection('prompts')
            .document(prompt_id)
            .collection('executions')
            .document(execution_id)
        )

        execution_ref.update({
            'status': 'failed',
            'error': str(e),
            'updated_at': datetime.now(timezone.utc)
        })

        raise
