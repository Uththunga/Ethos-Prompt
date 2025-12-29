"""
Unit tests for streaming handler
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime, timezone
from src.streaming_handler import (
    StreamingResponseHandler, SimpleStreamCollector, stream_to_firestore
)


class TestStreamingResponseHandler:
    """Test StreamingResponseHandler"""
    
    @pytest.mark.asyncio
    async def test_create_streaming_execution(self):
        """Test creating streaming execution"""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref
        
        handler = StreamingResponseHandler(mock_db)
        
        result = await handler.create_streaming_execution(
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123"
        )
        
        assert result["execution_id"] == "exec-123"
        assert result["status"] == "streaming"
    
    @pytest.mark.asyncio
    async def test_append_chunk(self):
        """Test appending chunk"""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref
        
        handler = StreamingResponseHandler(mock_db)
        
        await handler.append_chunk(
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123",
            chunk_content="Hello",
            chunk_index=0,
            metadata={"test": True}
        )
        
        # Verify update was called
        mock_doc_ref.update.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_complete_streaming_execution(self):
        """Test completing streaming execution"""
        mock_db = MagicMock()
        mock_doc_ref = MagicMock()
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref
        
        handler = StreamingResponseHandler(mock_db)
        
        await handler.complete_streaming_execution(
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123",
            final_metadata={"total_chunks": 10}
        )
        
        # Verify update was called
        mock_doc_ref.update.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_execution_chunks(self):
        """Test getting execution chunks"""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "status": "streaming",
            "completed": False,
            "total_chunks": 5,
            "chunks": [
                {"index": 0, "content": "Hello"},
                {"index": 1, "content": " world"},
                {"index": 2, "content": "!"}
            ]
        }
        
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref
        
        handler = StreamingResponseHandler(mock_db)
        
        result = await handler.get_execution_chunks(
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123",
            from_index=0
        )
        
        assert result["status"] == "streaming"
        assert result["total_chunks"] == 5
        assert len(result["chunks"]) == 3
    
    @pytest.mark.asyncio
    async def test_get_execution_chunks_not_found(self):
        """Test getting chunks for non-existent execution"""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = False
        
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref
        
        handler = StreamingResponseHandler(mock_db)
        
        result = await handler.get_execution_chunks(
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123"
        )
        
        assert result["error"] is True
        assert "not found" in result["message"].lower()
    
    @pytest.mark.asyncio
    async def test_get_execution_chunks_with_from_index(self):
        """Test getting chunks from specific index"""
        mock_db = MagicMock()
        mock_doc = MagicMock()
        mock_doc.exists = True
        mock_doc.to_dict.return_value = {
            "status": "streaming",
            "completed": False,
            "total_chunks": 5,
            "chunks": [
                {"index": 0, "content": "Hello"},
                {"index": 1, "content": " world"},
                {"index": 2, "content": "!"},
                {"index": 3, "content": " How"},
                {"index": 4, "content": " are you?"}
            ]
        }
        
        mock_doc_ref = MagicMock()
        mock_doc_ref.get.return_value = mock_doc
        mock_db.collection.return_value.document.return_value.collection.return_value.document.return_value.collection.return_value.document.return_value = mock_doc_ref
        
        handler = StreamingResponseHandler(mock_db)
        
        result = await handler.get_execution_chunks(
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123",
            from_index=2
        )
        
        # Should only return chunks from index 2 onwards
        assert len(result["chunks"]) == 3
        assert result["chunks"][0]["index"] == 2


class TestSimpleStreamCollector:
    """Test SimpleStreamCollector"""
    
    def test_collector_initialization(self):
        """Test collector initialization"""
        collector = SimpleStreamCollector()
        
        assert collector.chunks == []
        assert collector.full_content == ""
        assert collector.metadata == {}
    
    def test_add_chunk(self):
        """Test adding chunk"""
        collector = SimpleStreamCollector()
        
        collector.add_chunk("Hello")
        collector.add_chunk(" world")
        
        assert len(collector.chunks) == 2
        assert collector.full_content == "Hello world"
    
    def test_add_chunk_with_metadata(self):
        """Test adding chunk with metadata"""
        collector = SimpleStreamCollector()
        
        collector.add_chunk("Hello", metadata={"model": "gpt-3.5"})
        collector.add_chunk(" world", metadata={"tokens": 5})
        
        assert collector.metadata["model"] == "gpt-3.5"
        assert collector.metadata["tokens"] == 5
    
    def test_get_full_response(self):
        """Test getting full response"""
        collector = SimpleStreamCollector()
        
        collector.add_chunk("Hello")
        collector.add_chunk(" world")
        collector.add_chunk("!")
        
        response = collector.get_full_response()
        
        assert response["content"] == "Hello world!"
        assert response["total_chunks"] == 3
        assert len(response["chunks"]) == 3


class TestStreamToFirestore:
    """Test stream_to_firestore function"""
    
    @pytest.mark.asyncio
    async def test_stream_to_firestore_success(self):
        """Test streaming to Firestore successfully"""
        mock_db = MagicMock()
        
        # Mock stream iterator
        class MockChunk:
            def __init__(self, content, finish_reason=None, model="gpt-3.5"):
                self.content = content
                self.finish_reason = finish_reason
                self.model = model
        
        async def mock_stream():
            yield MockChunk("Hello")
            yield MockChunk(" world")
            yield MockChunk("!", finish_reason="stop")
        
        completion_called = False
        
        def on_complete(content, metadata):
            nonlocal completion_called
            completion_called = True
            assert content == "Hello world!"
        
        await stream_to_firestore(
            stream_iterator=mock_stream(),
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123",
            firestore_client=mock_db,
            on_complete=on_complete
        )
        
        assert completion_called
    
    @pytest.mark.asyncio
    async def test_stream_to_firestore_error(self):
        """Test streaming to Firestore with error"""
        mock_db = MagicMock()
        
        # Mock stream iterator that raises error
        async def mock_stream():
            yield MagicMock(content="Hello", finish_reason=None, model="gpt-3.5")
            raise Exception("Stream error")
        
        with pytest.raises(Exception, match="Stream error"):
            await stream_to_firestore(
                stream_iterator=mock_stream(),
                user_id="user-123",
                prompt_id="prompt-123",
                execution_id="exec-123",
                firestore_client=mock_db
            )


class TestStreamingEdgeCases:
    """Test edge cases"""
    
    @pytest.mark.asyncio
    async def test_empty_stream(self):
        """Test with empty stream"""
        mock_db = MagicMock()
        
        async def empty_stream():
            return
            yield  # Make it a generator
        
        await stream_to_firestore(
            stream_iterator=empty_stream(),
            user_id="user-123",
            prompt_id="prompt-123",
            execution_id="exec-123",
            firestore_client=mock_db
        )
        
        # Should complete without error
    
    def test_collector_with_empty_chunks(self):
        """Test collector with empty chunks"""
        collector = SimpleStreamCollector()
        
        collector.add_chunk("")
        collector.add_chunk("")
        
        response = collector.get_full_response()
        
        assert response["content"] == ""
        assert response["total_chunks"] == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

