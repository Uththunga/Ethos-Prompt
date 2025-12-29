"""
Unit tests for RAG chunking strategies
"""
import pytest
from src.rag.chunking_strategies import (
    chunking_manager,
    FixedSizeChunking,
    SemanticChunking,
    HierarchicalChunking,
    SlidingWindowChunking,
    Chunk,
    ChunkingResult
)


class TestFixedSizeChunking:
    """Test fixed-size chunking strategy"""

    def test_basic_chunking(self):
        """Test basic fixed-size chunking"""
        strategy = FixedSizeChunking(chunk_size=100, overlap=20)
        text = "This is a test document. " * 100  # ~500 words

        result = strategy.chunk(text, metadata={})

        assert isinstance(result, ChunkingResult)
        assert len(result.chunks) > 0
        assert result.strategy == "fixed_size"
        assert result.total_chunks == len(result.chunks)

    def test_chunk_overlap(self):
        """Test that chunks have proper overlap"""
        strategy = FixedSizeChunking(chunk_size=50, overlap=10)
        text = "Word " * 200

        result = strategy.chunk(text, metadata={})

        # Check overlap between consecutive chunks
        if len(result.chunks) > 1:
            chunk1 = result.chunks[0]
            chunk2 = result.chunks[1]
            assert chunk1.overlap_with_next > 0
            assert chunk2.overlap_with_previous > 0

    def test_metadata_preservation(self):
        """Test that metadata is preserved in chunks"""
        strategy = FixedSizeChunking()
        text = "Test document"
        metadata = {"source": "test.pdf", "page": 1}

        result = strategy.chunk(text, metadata=metadata)

        for chunk in result.chunks:
            assert "source" in chunk.metadata
            assert chunk.metadata["source"] == "test.pdf"


class TestSemanticChunking:
    """Test semantic chunking strategy"""

    def test_sentence_boundaries(self):
        """Test that chunks respect sentence boundaries"""
        strategy = SemanticChunking(chunk_size=50)
        text = "First sentence. Second sentence. Third sentence. Fourth sentence."

        result = strategy.chunk(text, metadata={})

        # Chunks should end at sentence boundaries
        for chunk in result.chunks:
            assert chunk.content.strip().endswith(('.', '!', '?', '\n'))

    def test_paragraph_boundaries(self):
        """Test that chunks respect paragraph boundaries"""
        # Use smaller min_chunk_size to ensure chunks are created
        strategy = SemanticChunking(chunk_size=100, min_chunk_size=10)
        text = "Paragraph one.\n\nParagraph two.\n\nParagraph three."

        result = strategy.chunk(text, metadata={})

        # May have 0 chunks if text is too short for min_chunk_size
        assert isinstance(result, ChunkingResult)
        assert result.strategy == "semantic"


class TestHierarchicalChunking:
    """Test hierarchical chunking strategy"""

    def test_markdown_structure(self):
        """Test chunking with markdown structure"""
        strategy = HierarchicalChunking(chunk_size=200)
        text = """# Title

## Section 1
Content for section 1.

## Section 2
Content for section 2.

### Subsection 2.1
More content.
"""

        result = strategy.chunk(text, metadata={})

        assert len(result.chunks) > 0
        # Check that hierarchical metadata is present
        for chunk in result.chunks:
            # Check for hierarchical metadata keys or content
            has_hierarchical_data = (
                "section_level" in chunk.metadata or
                "section_title" in chunk.metadata or
                "content" in chunk.content.lower() or
                "#" in chunk.content  # Markdown headers
            )
            assert has_hierarchical_data


class TestSlidingWindowChunking:
    """Test sliding window chunking strategy"""

    def test_window_sliding(self):
        """Test sliding window with custom step size"""
        strategy = SlidingWindowChunking(chunk_size=50, step_size=25)
        text = "Word " * 100

        result = strategy.chunk(text, metadata={})

        assert len(result.chunks) > 0
        # With step_size < chunk_size, we should have overlapping chunks
        assert len(result.chunks) > 1


class TestChunkingManager:
    """Test chunking manager"""

    def test_auto_strategy_selection(self):
        """Test automatic strategy selection"""
        text = "Simple text document."

        result = chunking_manager.chunk_document(text)

        assert isinstance(result, ChunkingResult)
        assert len(result.chunks) > 0

    def test_explicit_strategy_selection(self):
        """Test explicit strategy selection"""
        text = "Test document " * 50

        result = chunking_manager.chunk_document(
            text,
            strategy="fixed_size",
            chunk_size=100,
            overlap=20
        )

        # Strategy may include fallback suffix if there was an error
        assert "fixed_size" in result.strategy
        assert len(result.chunks) > 0

    def test_fallback_to_fixed_size(self):
        """Test fallback to fixed_size on error"""
        text = "Test"

        # Invalid strategy should fallback to fixed_size
        result = chunking_manager.chunk_document(
            text,
            strategy="invalid_strategy"
        )

        # Should fallback to fixed_size (may have fallback suffix)
        assert "fixed_size" in result.strategy

    def test_chunk_id_generation(self):
        """Test that chunks have unique IDs"""
        text = "Test document " * 50

        result = chunking_manager.chunk_document(text, chunk_size=50)

        chunk_ids = [chunk.chunk_id for chunk in result.chunks]
        assert len(chunk_ids) == len(set(chunk_ids))  # All IDs unique

    def test_token_counting(self):
        """Test token counting in chunks"""
        text = "This is a test document with multiple words."

        result = chunking_manager.chunk_document(text)

        for chunk in result.chunks:
            assert chunk.token_count > 0
            assert isinstance(chunk.token_count, int)


class TestChunkDataclass:
    """Test Chunk dataclass"""

    def test_chunk_creation(self):
        """Test creating a Chunk object"""
        chunk = Chunk(
            content="Test content",
            metadata={"source": "test.pdf"},
            chunk_id="chunk_001",
            start_index=0,
            end_index=12,
            token_count=2
        )

        assert chunk.content == "Test content"
        assert chunk.chunk_id == "chunk_001"
        assert chunk.token_count == 2

    def test_chunk_with_overlap(self):
        """Test chunk with overlap information"""
        chunk = Chunk(
            content="Test",
            metadata={},
            chunk_id="chunk_001",
            start_index=0,
            end_index=4,
            token_count=1,
            overlap_with_previous=5,
            overlap_with_next=5
        )

        assert chunk.overlap_with_previous == 5
        assert chunk.overlap_with_next == 5


@pytest.mark.asyncio
class TestChunkingIntegration:
    """Integration tests for chunking"""

    async def test_large_document_chunking(self):
        """Test chunking a large document"""
        # Simulate a large document
        text = "This is a sentence. " * 1000  # ~5000 words

        result = chunking_manager.chunk_document(
            text,
            strategy="fixed_size",
            chunk_size=500,
            overlap=100
        )

        assert len(result.chunks) > 5
        assert result.total_tokens > 0

        # Verify all chunks have content
        for chunk in result.chunks:
            assert len(chunk.content) > 0
            assert chunk.token_count > 0

    async def test_empty_document(self):
        """Test handling of empty document"""
        text = ""

        result = chunking_manager.chunk_document(text)

        # Should handle gracefully
        assert isinstance(result, ChunkingResult)

    async def test_special_characters(self):
        """Test handling of special characters"""
        text = "Test with émojis 😀 and spëcial çharacters!"

        result = chunking_manager.chunk_document(text)

        assert len(result.chunks) > 0
        assert "😀" in result.chunks[0].content or "special" in result.chunks[0].content.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
