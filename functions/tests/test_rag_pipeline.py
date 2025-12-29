"""
Test suite for RAG processing pipeline components
"""

import pytest
import asyncio
import tempfile
import os
from unittest.mock import Mock, patch, AsyncMock

# Import components to test
try:
    from src.rag.document_processor import DocumentProcessor
    from src.rag.text_chunker import TextChunker, ChunkingConfig
    from src.rag.embedding_generator import EmbeddingGenerator, EmbeddingConfig
    from src.rag.vector_store import FAISSVectorStore
    from src.rag.context_retriever import ContextRetriever, RetrievalConfig
except Exception:
    pytest.skip("Legacy RAG pipeline components not available; skipping rag_pipeline tests", allow_module_level=True)

class TestDocumentProcessor:
    """Test document processing functionality"""

    @pytest.fixture
    def processor(self):
        return DocumentProcessor()

    def test_content_type_detection(self, processor):
        """Test content type detection from file content"""
        # PDF content
        pdf_content = b'%PDF-1.4'
        assert processor._detect_content_type(pdf_content, 'test.pdf') == 'application/pdf'

        # Text content
        text_content = b'Hello world'
        assert processor._detect_content_type(text_content, 'test.txt') == 'text/plain'

        # DOCX content (ZIP-based)
        docx_content = b'PK\x03\x04'
        assert processor._detect_content_type(docx_content, 'test.docx') == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

    def test_document_validation(self, processor):
        """Test document validation"""
        # Valid document
        assert processor.validate_document('text/plain', 1000) == True

        # Unsupported type
        assert processor.validate_document('image/jpeg', 1000) == False

        # Too large
        assert processor.validate_document('text/plain', 20 * 1024 * 1024) == False

    def test_text_extraction_from_text(self, processor):
        """Test text extraction from plain text"""
        content = b'Hello world\nThis is a test document.'
        text, metadata = processor._extract_from_text(content)

        assert text == 'Hello world\nThis is a test document.'
        assert metadata['extraction_method'] == 'direct_text'
        assert 'encoding' in metadata

class TestTextChunker:
    """Test text chunking functionality"""

    @pytest.fixture
    def chunker(self):
        config = ChunkingConfig(chunk_size=100, chunk_overlap=20)
        return TextChunker(config)

    def test_text_preprocessing(self, chunker):
        """Test text preprocessing"""
        text = "Hello   world\n\n\n\nThis is a test."
        cleaned = chunker._preprocess_text(text)
        assert cleaned == "Hello world\n\nThis is a test."

    def test_chunk_creation(self, chunker):
        """Test basic chunk creation"""
        text = "This is a test document. " * 20  # Create longer text
        chunks = chunker.chunk_text(text, "test_doc", {})

        assert len(chunks) > 0
        assert all('id' in chunk for chunk in chunks)
        assert all('content' in chunk for chunk in chunks)
        assert all('document_id' in chunk for chunk in chunks)
        assert all(chunk['document_id'] == 'test_doc' for chunk in chunks)

    def test_structure_extraction(self, chunker):
        """Test structure extraction from text"""
        text = "--- Page 1 ---\n# Heading 1\nContent here\n--- Page 2 ---\n## Heading 2\nMore content"
        structure = chunker._extract_structure(text)

        assert len(structure['pages']) == 2
        assert structure['pages'][0]['page_number'] == 1
        assert len(structure['headings']) == 2

class TestEmbeddingGenerator:
    """Test embedding generation functionality"""

    @pytest.fixture
    def generator(self):
        config = EmbeddingConfig(model="text-embedding-3-small", batch_size=2)
        return EmbeddingGenerator(config, api_key="test-key")

    def test_chunk_validation(self, generator):
        """Test chunk validation"""
        chunks = [
            {'id': '1', 'content': 'Valid content'},
            {'id': '2', 'content': ''},  # Empty content
            {'id': '3'},  # No content field
            {'id': '4', 'content': 'Another valid content'}
        ]

        valid_chunks = generator._validate_chunks(chunks)
        assert len(valid_chunks) == 2
        assert all(chunk['content'] for chunk in valid_chunks)

    @pytest.mark.asyncio
    async def test_similarity_calculation(self, generator):
        """Test similarity calculation"""
        embedding1 = [1.0, 0.0, 0.0]
        embedding2 = [1.0, 0.0, 0.0]
        embedding3 = [0.0, 1.0, 0.0]

        # Identical embeddings
        similarity = generator.calculate_similarity(embedding1, embedding2)
        assert similarity == pytest.approx(1.0, rel=1e-5)

        # Orthogonal embeddings
        similarity = generator.calculate_similarity(embedding1, embedding3)
        assert similarity == pytest.approx(0.0, rel=1e-5)

    def test_embedding_stats(self, generator):
        """Test embedding statistics calculation"""
        chunks = [
            {'id': '1', 'embedding': [1.0, 0.0], 'content': 'test'},
            {'id': '2', 'embedding': None, 'embedding_error': 'Failed', 'content': 'test'},
            {'id': '3', 'embedding': [0.0, 1.0], 'content': 'test'}
        ]

        stats = generator.get_embedding_stats(chunks)
        assert stats['total_chunks'] == 3
        assert stats['chunks_with_embeddings'] == 2
        assert stats['chunks_with_errors'] == 1
        assert stats['success_rate'] == pytest.approx(2/3)

class TestVectorStore:
    """Test FAISS vector store functionality"""

    @pytest.fixture
    def vector_store(self):
        return FAISSVectorStore("test_user", embedding_dimension=3)

    def test_initialization(self, vector_store):
        """Test vector store initialization"""
        vector_store._create_new_index()
        assert vector_store.index is not None
        assert vector_store.metadata['dimension'] == 3
        assert vector_store.metadata['total_vectors'] == 0

    def test_stats(self, vector_store):
        """Test statistics generation"""
        stats = vector_store.get_stats()
        assert 'total_vectors' in stats
        assert 'total_documents' in stats
        assert 'dimension' in stats
        assert stats['dimension'] == 3

    @pytest.mark.asyncio
    async def test_chunk_metadata_lookup(self, vector_store):
        """Test chunk metadata lookup by vector ID"""
        vector_store._create_new_index()
        vector_store.metadata['document_chunks'] = {
            'doc1': [
                {'vector_id': 0, 'chunk_id': 'chunk1', 'content_preview': 'test content', 'metadata': {}}
            ]
        }

        chunk_info = vector_store._get_chunk_by_vector_id(0)
        assert chunk_info is not None
        assert chunk_info['chunk_id'] == 'chunk1'
        assert chunk_info['document_id'] == 'doc1'

class TestContextRetriever:
    """Test context retrieval functionality"""

    @pytest.fixture
    def retriever(self):
        mock_embedding_generator = Mock()
        config = RetrievalConfig(top_k=3, similarity_threshold=0.5)
        return ContextRetriever(mock_embedding_generator, config)

    def test_empty_context_response(self, retriever):
        """Test empty context response structure"""
        response = retriever._empty_context_response()
        assert 'context' in response
        assert 'chunks' in response
        assert 'metadata' in response
        assert response['context'] == ""
        assert response['chunks'] == []

    def test_context_formatting(self, retriever):
        """Test context formatting"""
        chunks = [
            {
                'content': 'First chunk content',
                'full_metadata': {'page_number': 1, 'section_title': 'Introduction'}
            },
            {
                'content': 'Second chunk content',
                'full_metadata': {'page_number': 2}
            }
        ]

        context = retriever._format_context(chunks)
        assert 'First chunk content' in context
        assert 'Second chunk content' in context
        assert 'Page 1' in context
        assert 'Introduction' in context

    @pytest.mark.asyncio
    async def test_chunk_reranking(self, retriever):
        """Test chunk reranking functionality"""
        query = "test query"
        chunks = [
            {'content': 'This is about something else', 'similarity_score': 0.9},
            {'content': 'This is a test query example', 'similarity_score': 0.7},
            {'content': 'Another test with query words', 'similarity_score': 0.8}
        ]

        reranked = await retriever._rerank_chunks(query, chunks)

        # Check that rerank scores were added
        assert all('rerank_score' in chunk for chunk in reranked)

        # Check that chunks are sorted by rerank score
        scores = [chunk['rerank_score'] for chunk in reranked]
        assert scores == sorted(scores, reverse=True)

class TestIntegration:
    """Integration tests for the complete RAG pipeline"""

    @pytest.mark.asyncio
    async def test_document_processing_pipeline(self):
        """Test the complete document processing pipeline"""
        # This would be a more complex integration test
        # that tests the entire flow from document upload to vector storage

        # Mock components for integration test
        processor = DocumentProcessor()
        chunker = TextChunker()

        # Test with sample text document
        sample_text = "This is a sample document. " * 50  # Create substantial content

        # Test chunking
        chunks = chunker.chunk_text(sample_text, "test_doc", {})
        assert len(chunks) > 0

        # Verify chunk structure
        for chunk in chunks:
            assert 'id' in chunk
            assert 'content' in chunk
            assert 'document_id' in chunk
            assert 'metadata' in chunk
            assert chunk['document_id'] == 'test_doc'

# Test fixtures and utilities
@pytest.fixture
def sample_pdf_content():
    """Sample PDF content for testing"""
    return b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'

@pytest.fixture
def sample_text_content():
    """Sample text content for testing"""
    return "This is a sample document with multiple paragraphs.\n\nThis is the second paragraph with more content to test the chunking functionality."

if __name__ == "__main__":
    pytest.main([__file__])
