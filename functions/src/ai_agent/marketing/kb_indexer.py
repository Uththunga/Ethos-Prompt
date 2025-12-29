"""
Marketing Knowledge Base Indexer
Processes and indexes marketing content for RAG retrieval
"""
import logging
import asyncio
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from datetime import datetime, timezone
import hashlib

from .marketing_kb_content import get_all_kb_documents
from src.rag.chunking_strategies import SemanticChunking
from src.rag.embedding_service import embedding_service
from src.rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)

class MarketingKBIndexer:
    """
    Indexes marketing knowledge base content for RAG retrieval.

    Uses specialized chunking strategy for marketing content:
    - Chunk size: 64 tokens (maximize granularity for short marketing copy)
    - Overlap: 20 tokens (ensure continuity)
    - Preserve semantic boundaries (paragraphs, sections)
    """

    def __init__(self, db=None) -> Any:
        self.db = db
        self.collection_name = "marketing_kb_vectors_v2"

        # Marketing-specific chunking strategy
        # Using SemanticChunking with 64 tokens and 20 overlap (target ~40–60 chunks total)
        self.chunking_strategy = SemanticChunking(
            chunk_size=64,
            overlap=20,
            min_chunk_size=40,
            respect_paragraphs=True
        )

        logger.info("Marketing KB Indexer initialized")

    async def index_all_documents(self, force_reindex: bool = False) -> Dict[str, Any]:
        """
        Index all marketing KB documents.

        Args:
            force_reindex: If True, reindex even if already indexed

        Returns:
            Dict with indexing results
        """
        logger.info("Starting marketing KB indexing...")

        start_time = datetime.now(timezone.utc)
        documents = get_all_kb_documents(self.db)  # Not async, don't await

        results = {
            "total_documents": len(documents),
            "indexed_documents": 0,
            "skipped_documents": 0,
            "total_chunks": 0,
            "total_vectors": 0,
            "errors": [],
            "processing_time": 0.0
        }

        for doc in documents:
            try:
                # Check if already indexed (unless force_reindex)
                if not force_reindex and await self._is_indexed(doc["id"]):
                    logger.info(f"Skipping already indexed document: {doc['id']}")
                    results["skipped_documents"] += 1
                    continue

                # Process and index document
                doc_results = await self._index_document(doc)

                results["indexed_documents"] += 1
                results["total_chunks"] += doc_results["chunks"]
                results["total_vectors"] += doc_results["vectors"]

                logger.info(
                    f"Indexed document '{doc['id']}': "
                    f"{doc_results['chunks']} chunks, {doc_results['vectors']} vectors"
                )

            except Exception as e:
                logger.error(f"Error indexing document '{doc['id']}': {e}")
                results["errors"].append({
                    "document_id": doc["id"],
                    "error": str(e)
                })

        end_time = datetime.now(timezone.utc)
        results["processing_time"] = (end_time - start_time).total_seconds()

        logger.info(
            f"Marketing KB indexing complete: "
            f"{results['indexed_documents']} indexed, "
            f"{results['skipped_documents']} skipped, "
            f"{results['total_chunks']} chunks, "
            f"{results['total_vectors']} vectors, "
            f"{results['processing_time']:.2f}s"
        )

        return results

    async def _index_document(self, doc: Dict[str, Any]) -> Dict[str, int]:
        """
        Index a single document.

        Args:
            doc: Document dict with id, title, content, metadata

        Returns:
            Dict with chunks and vectors count
        """
        # Combine title and content for chunking
        # Granite 4.0 / Anthropic Contextual Retrieval: Add document context prefix
        category = doc.get('metadata', {}).get('category', 'general')
        subcategory = doc.get('metadata', {}).get('subcategory', '')
        context_prefix = f"[Document: {doc['title']} | Category: {category}"
        if subcategory:
            context_prefix += f" | Topic: {subcategory}"
        context_prefix += "]\n\n"

        full_text = f"{context_prefix}{doc['title']}\n\n{doc['content']}"

        # Chunk the document using SemanticChunking
        chunking_result = self.chunking_strategy.chunk(
            full_text,
            metadata={
                'document_id': doc['id'],
                'title': doc['title'],
                **doc.get('metadata', {})
            }
        )

        logger.info(f"Document '{doc['id']}' chunked into {chunking_result.total_chunks} chunks")

        # Extract chunk texts for embedding
        chunk_texts = [chunk.content for chunk in chunking_result.chunks]

        # Generate embeddings using batch processing (force 768-d Google shape)
        batch_result = await embedding_service.generate_batch_embeddings(chunk_texts, model="text-embedding-004")
        embeddings = [result.embedding for result in batch_result.results]

        # Prepare vectors for storage
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunking_result.chunks, embeddings)):
            vector_id = self._generate_vector_id(doc["id"], i)

            vectors.append({
                "id": vector_id,
                "embedding": embedding,
                "metadata": {
                    "document_id": doc["id"],
                    "document_title": doc["title"],
                    "chunk_index": i,
                    "chunk_text": chunk.content,
                    "chunk_start": chunk.start_index,
                    "chunk_end": chunk.end_index,
                    "token_count": chunk.token_count,
                    "category": doc["metadata"].get("category", "general"),
                    "subcategory": doc["metadata"].get("subcategory", ""),
                    "tier": doc["metadata"].get("tier", 5),
                    "priority": doc["metadata"].get("priority", "medium"),
                    "offering_type": doc["metadata"].get("offering_type", ""),
                    "topic": doc["metadata"].get("topic", ""),
                    "page": doc["metadata"].get("page", "unknown"),
                    "indexed_at": datetime.now(timezone.utc).isoformat(),
                    "source": "marketing_kb"
                }
            })

        # Store vectors in vector store
        vs = get_vector_store(firestore_client=self.db)
        vs.connect_to_index(self.collection_name)
        tuple_vectors = [
            (v["id"], v["embedding"], v["metadata"]) for v in vectors
        ]
        vs.upsert_vectors(
            vectors=tuple_vectors,
            namespace="system"
        )

        # Mark document as indexed
        await self._mark_indexed(doc["id"], chunking_result.total_chunks, len(vectors))

        return {
            "chunks": chunking_result.total_chunks,
            "vectors": len(vectors)
        }

    async def _is_indexed(self, doc_id: str) -> bool:
        """Check if document is already indexed"""
        if not self.db:
            return False

        try:
            doc_ref = self.db.collection("marketing_kb_index").document(doc_id)
            doc_snapshot = doc_ref.get()
            return doc_snapshot.exists
        except Exception as e:
            logger.warning(f"Error checking index status for '{doc_id}': {e}")
            return False

    async def _mark_indexed(self, doc_id: str, chunks: int, vectors: int) -> Any:
        """Mark document as indexed in Firestore"""
        if not self.db:
            return

        try:
            doc_ref = self.db.collection("marketing_kb_index").document(doc_id)
            doc_ref.set({
                "document_id": doc_id,
                "chunks": chunks,
                "vectors": vectors,
                "indexed_at": datetime.now(timezone.utc),
                "status": "indexed"
            })
        except Exception as e:
            logger.error(f"Error marking document '{doc_id}' as indexed: {e}")

    def _generate_vector_id(self, doc_id: str, chunk_index: int) -> str:
        """Generate unique vector ID"""
        raw_id = f"marketing_kb_{doc_id}_chunk_{chunk_index}"
        return hashlib.md5(raw_id.encode()).hexdigest()

    async def search_kb(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search the marketing knowledge base.

        Args:
            query: Search query
            top_k: Number of results to return
            category_filter: Optional category filter

        Returns:
            List of search results with text and metadata
        """
        # Generate query embedding
        batch = await embedding_service.generate_batch_embeddings([query], model="text-embedding-004")
        query_embedding = (batch.results[0].embedding if getattr(batch, 'results', None) else [])

        # Build metadata filter
        metadata_filter = {"source": "marketing_kb"}
        if category_filter:
            metadata_filter["category"] = category_filter

        # Search vector store
        vs = get_vector_store(firestore_client=self.db)
        vs.connect_to_index(self.collection_name)
        results = vs.search(
            query_vector=query_embedding,
            top_k=top_k,
            namespace="system",
            filter_dict=metadata_filter,
            include_metadata=True
        )

        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "text": result.metadata.get("chunk_text", ""),
                "score": result.score,
                "document_id": result.metadata.get("document_id", ""),
                "document_title": result.metadata.get("document_title", ""),
                "category": result.metadata.get("category", ""),
                "page": result.metadata.get("page", ""),
                "chunk_index": result.metadata.get("chunk_index", 0)
            })

        return formatted_results

    async def clear_index(self) -> Any:
        """Clear all indexed marketing KB content (for testing/reindexing)"""
        logger.warning("Clearing marketing KB index...")

        if self.db:
            # Clear index tracking
            index_docs = self.db.collection("marketing_kb_index").stream()
            for doc in index_docs:
                doc.reference.delete()

        # Clear vectors (implementation depends on vector store)
        # This is a placeholder - actual implementation depends on vector store API
        logger.info("Marketing KB index cleared")


# Global instance
marketing_kb_indexer = MarketingKBIndexer()


async def initialize_marketing_kb(db=None, force_reindex: bool = False) -> Any:
    """
    Initialize and index marketing knowledge base.

    Args:
        db: Firestore database instance
        force_reindex: If True, reindex all documents

    Returns:
        Indexing results
    """
    marketing_kb_indexer.db = db
    results = await marketing_kb_indexer.index_all_documents(force_reindex)
    return results
