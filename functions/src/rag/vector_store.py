"""
Vector Store - Google Cloud Firestore Vector Search integration
Uses Firestore native vector search capabilities for semantic search
Region: australia-southeast1 (matching Firebase Functions)
"""
import os
import logging
import time
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import json
from datetime import datetime, timezone

# Firebase/Firestore imports
try:
    from firebase_admin import firestore
    from google.cloud.firestore_v1.base_vector_query import DistanceMeasure
    from google.cloud.firestore_v1.vector import Vector
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Firestore vector search not available - install firebase-admin>=6.0.0")

logger = logging.getLogger(__name__)

@dataclass
class VectorSearchResult:
    chunk_id: str
    content: str
    score: float
    metadata: Dict[str, Any]

@dataclass
class VectorStats:
    total_vectors: int
    index_size: int
    dimensions: int
    metric: str
    namespace_stats: Dict[str, int]

class VectorStore:
    """
    Google Cloud Firestore vector store for semantic search

    Uses Firestore's native vector search capabilities with:
    - Collection: vector_embeddings
    - Region: australia-southeast1
    - Distance metric: COSINE (default for text embeddings)
    - Dimensions: 768 (Google text-embedding-004)
    """

    def __init__(self, firestore_client=None, project_id: Optional[str] = None, region: Optional[str] = None):
        """
        Initialize Google Cloud Firestore vector store

        Args:
            firestore_client: Existing Firestore client (optional)
            project_id: Google Cloud project ID (defaults to GOOGLE_CLOUD_PROJECT env var)
            region: Google Cloud region (defaults to australia-southeast1)
        """
        self.project_id = project_id or os.getenv('GOOGLE_CLOUD_PROJECT', 'react-app-000730')
        self.region = region or os.getenv('GOOGLE_CLOUD_REGION', 'australia-southeast1')

        # Initialize Firestore client
        if firestore_client:
            self.db = firestore_client
        elif FIRESTORE_AVAILABLE:
            self.db = firestore.client()
        else:
            self.db = None
            logger.error("Firestore not available - cannot initialize vector store")

        # Configuration
        self.default_dimensions = 768  # Google text-embedding-004
        self.default_metric = 'cosine'
        self.collection_name = 'vector_embeddings'

        # Index configuration
        self.index_config = {
            'dimensions': self.default_dimensions,
            'distance_measure': DistanceMeasure.COSINE if FIRESTORE_AVAILABLE else 'cosine',
            'region': self.region
        }

        if self.db:
            logger.info(f"Google Cloud Firestore vector store initialized (project: {self.project_id}, region: {self.region})")
        else:
            logger.warning("Firestore vector store not available")

    def create_index(
        self,
        index_name: Optional[str] = None,
        dimensions: Optional[int] = None,
        metric: Optional[str] = None,
        spec: Any = None
    ) -> bool:
        """
        Create vector search index in Firestore

        Note: Firestore vector indexes are created automatically when you add
        vector fields. This method ensures the collection exists and is configured.

        Args:
            index_name: Collection name (defaults to 'vector_embeddings')
            dimensions: Vector dimensions (defaults to 768 for Google embeddings)
            metric: Distance metric (defaults to 'cosine')
            spec: Additional configuration (unused for Firestore)

        Returns:
            True if successful
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return False

        collection_name = index_name or self.collection_name
        dimensions = dimensions or self.default_dimensions
        metric = metric or self.default_metric

        try:
            # Create collection metadata document
            metadata_ref = self.db.collection(collection_name).document('_metadata')
            metadata_ref.set({
                'dimensions': dimensions,
                'metric': metric,
                'created_at': firestore.SERVER_TIMESTAMP,
                'region': self.region,
                'project_id': self.project_id,
                'index_type': 'firestore_vector_search'
            })

            logger.info(f"Firestore vector collection '{collection_name}' initialized (dimensions: {dimensions}, metric: {metric})")
            return True

        except Exception as e:
            logger.error(f"Failed to create vector collection '{collection_name}': {e}")
            return False

    def connect_to_index(self, index_name: Optional[str] = None) -> bool:
        """
        Connect to Firestore vector collection

        Args:
            index_name: Collection name (defaults to 'vector_embeddings')

        Returns:
            True if successful
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return False

        collection_name = index_name or self.collection_name

        try:
            # Verify collection exists by checking metadata
            metadata_ref = self.db.collection(collection_name).document('_metadata')
            metadata_doc = metadata_ref.get()

            if not metadata_doc.exists:
                logger.warning(f"Collection '{collection_name}' metadata not found, creating...")
                self.create_index(collection_name)

            self.collection_name = collection_name
            logger.info(f"Connected to Firestore vector collection '{collection_name}'")
            return True

        except Exception as e:
            logger.error(f"Failed to connect to collection '{collection_name}': {e}")
            return False

    def _calculate_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors

        Args:
            vec1: First vector
            vec2: Second vector

        Returns:
            Cosine similarity score (0-1, higher is more similar)
        """
        try:
            # Convert to numpy arrays for efficient computation
            v1 = np.array(vec1)
            v2 = np.array(vec2)

            # Calculate cosine similarity
            dot_product = np.dot(v1, v2)
            norm_v1 = np.linalg.norm(v1)
            norm_v2 = np.linalg.norm(v2)

            if norm_v1 == 0 or norm_v2 == 0:
                return 0.0

            similarity = dot_product / (norm_v1 * norm_v2)

            # Convert to distance score (1 - cosine_distance)
            # Firestore returns distance, we want similarity
            return float(max(0.0, min(1.0, similarity)))

        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {e}")
            return 0.0

    def upsert_vectors(
        self,
        vectors: List[Tuple[str, List[float], Dict[str, Any]]],
        namespace: Optional[str] = None,
        batch_size: int = 500
    ) -> bool:
        """
        Upsert vectors to Firestore collection

        Args:
            vectors: List of (chunk_id, embedding, metadata) tuples
            namespace: User ID or namespace for isolation (stored in metadata)
            batch_size: Batch size for Firestore writes (max 500)

        Returns:
            True if successful
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return False

        collection_ref = self.db.collection(self.collection_name)

        try:
            # Process in batches (Firestore limit: 500 operations per batch)
            batch_size = min(batch_size, 500)
            total_batches = (len(vectors) + batch_size - 1) // batch_size

            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]

                # Create Firestore batch
                firestore_batch = self.db.batch()

                for vector_id, embedding, metadata in batch:
                    doc_ref = collection_ref.document(vector_id)

                    # Prepare document data
                    # Use plain list for embeddings when running against Firestore emulator
                    # to avoid unsupported Vector serialization/queries.
                    use_vector_wrapper = os.getenv('FIRESTORE_EMULATOR_HOST') in (None, '', False)
                    embedding_field = Vector(embedding) if use_vector_wrapper else embedding

                    doc_data = {
                        'embedding': embedding_field,
                        'metadata': metadata,
                        'namespace': namespace or 'default',
                        'created_at': firestore.SERVER_TIMESTAMP,
                        'dimensions': len(embedding)
                    }

                    # Add content to document for easy retrieval
                    if 'content' in metadata:
                        doc_data['content'] = metadata['content']

                    firestore_batch.set(doc_ref, doc_data, merge=True)

                # Commit batch
                firestore_batch.commit()

                logger.debug(f"Upserted batch {i//batch_size + 1}/{total_batches}")

            logger.info(f"Successfully upserted {len(vectors)} vectors to Firestore")
            return True

        except Exception as e:
            logger.error(f"Failed to upsert vectors to Firestore: {e}")
            return False

    def search(
        self,
        query_vector: List[float],
        top_k: int = 10,
        namespace: Optional[str] = None,
        filter_dict: Optional[Dict[str, Any]] = None,
        include_metadata: bool = True
    ) -> List[VectorSearchResult]:
        """
        Search for similar vectors using Firestore vector search

        Args:
            query_vector: Query embedding vector
            top_k: Number of results to return
            namespace: User ID or namespace filter
            filter_dict: Additional metadata filters
            include_metadata: Whether to include metadata (always True for Firestore)

        Returns:
            List of VectorSearchResult objects sorted by similarity
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return []

        collection_ref = self.db.collection(self.collection_name)

        try:
            # Build base query
            query = collection_ref

            # Apply namespace filter
            if namespace:
                query = query.where('namespace', '==', namespace)

            # Apply additional filters
            if filter_dict:
                for field, value in filter_dict.items():
                    if field != 'namespace':  # Already filtered
                        query = query.where(f'metadata.{field}', '==', value)

            # Firestore vector search using find_nearest when available (not in emulator)
            # Note: Emulator does not support vector search; use manual cosine similarity there.
            use_emulator = bool(os.getenv('FIRESTORE_EMULATOR_HOST'))
            if not use_emulator:
                try:
                    vector_query = query.find_nearest(
                        vector_field='embedding',
                        query_vector=Vector(query_vector),
                        distance_measure=DistanceMeasure.COSINE,
                        limit=top_k
                    )
                    docs = vector_query.get()
                except AttributeError:
                    # Fall back to manual similarity if client doesn't support vector search
                    use_emulator = True
            if use_emulator:
                logger.warning("Using manual cosine similarity (emulator/no vector index)")
                all_docs = query.limit(1000).stream()  # Limit to prevent excessive reads

                # Calculate similarities manually
                similarities = []
                for doc in all_docs:
                    doc_data = doc.to_dict()
                    if 'embedding' in doc_data:
                        embedding_vector = doc_data['embedding']
                        # Handle Vector object
                        if hasattr(embedding_vector, 'to_map_value'):
                            embedding_list = list(embedding_vector.to_map_value().values())
                        else:
                            embedding_list = embedding_vector

                        similarity = self._calculate_cosine_similarity(query_vector, embedding_list)
                        similarities.append((doc, similarity))

                # Sort by similarity and take top_k
                similarities.sort(key=lambda x: x[1], reverse=True)
                docs = [doc for doc, _ in similarities[:top_k]]

            # Format results
            results = []
            for doc in docs:
                doc_data = doc.to_dict()

                # Calculate similarity score
                if 'embedding' in doc_data:
                    embedding_vector = doc_data['embedding']
                    if hasattr(embedding_vector, 'to_map_value'):
                        embedding_list = list(embedding_vector.to_map_value().values())
                    else:
                        embedding_list = embedding_vector
                    raw = self._calculate_cosine_similarity(query_vector, embedding_list)
                    # Map cosine [-1,1] -> [0,1] for human-friendly scoring in emulator/tests
                    score = max(0.0, min(1.0, 0.5 * (raw + 1.0)))
                else:
                    score = 0.0

                result = VectorSearchResult(
                    chunk_id=doc.id,
                    content=doc_data.get('content', doc_data.get('metadata', {}).get('content', '')),
                    score=score,
                    metadata=doc_data.get('metadata', {})
                )
                results.append(result)

            logger.debug(f"Found {len(results)} similar vectors in Firestore")
            return results

        except Exception as e:
            logger.error(f"Firestore vector search failed: {e}")
            return []

    def delete_vectors(
        self,
        vector_ids: List[str],
        namespace: Optional[str] = None
    ) -> bool:
        """
        Delete vectors from Firestore collection

        Args:
            vector_ids: List of document IDs to delete
            namespace: Namespace filter (optional, for verification)

        Returns:
            True if successful
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return False

        collection_ref = self.db.collection(self.collection_name)

        try:
            # Delete in batches (Firestore limit: 500 operations per batch)
            batch_size = 500
            for i in range(0, len(vector_ids), batch_size):
                batch_ids = vector_ids[i:i + batch_size]

                firestore_batch = self.db.batch()

                for vector_id in batch_ids:
                    doc_ref = collection_ref.document(vector_id)
                    firestore_batch.delete(doc_ref)

                firestore_batch.commit()

            logger.info(f"Deleted {len(vector_ids)} vectors from Firestore")
            return True

        except Exception as e:
            logger.error(f"Failed to delete vectors from Firestore: {e}")
            return False

    def delete_namespace(self, namespace: str) -> bool:
        """
        Delete all vectors in a namespace

        Args:
            namespace: Namespace to delete

        Returns:
            True if successful
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return False

        collection_ref = self.db.collection(self.collection_name)

        try:
            # Query all documents in namespace
            query = collection_ref.where('namespace', '==', namespace)
            docs = query.stream()

            # Delete in batches
            batch_size = 500
            batch = self.db.batch()
            count = 0

            for doc in docs:
                batch.delete(doc.reference)
                count += 1

                if count % batch_size == 0:
                    batch.commit()
                    batch = self.db.batch()

            # Commit remaining
            if count % batch_size != 0:
                batch.commit()

            logger.info(f"Deleted {count} vectors in namespace '{namespace}' from Firestore")
            return True

        except Exception as e:
            logger.error(f"Failed to delete namespace '{namespace}' from Firestore: {e}")
            return False

    def get_index_stats(self, namespace: Optional[str] = None) -> Optional[VectorStats]:
        """
        Get Firestore collection statistics

        Args:
            namespace: Optional namespace to filter stats

        Returns:
            VectorStats object with collection statistics
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return None

        collection_ref = self.db.collection(self.collection_name)

        try:
            # Query documents
            if namespace:
                query = collection_ref.where('namespace', '==', namespace)
            else:
                query = collection_ref

            # Count documents (limit to prevent excessive reads)
            docs = query.limit(10000).stream()

            total_vectors = 0
            namespace_counts = {}
            dimensions_set = set()

            for doc in docs:
                total_vectors += 1
                doc_data = doc.to_dict()

                # Track namespace counts
                doc_namespace = doc_data.get('namespace', 'default')
                namespace_counts[doc_namespace] = namespace_counts.get(doc_namespace, 0) + 1

                # Track dimensions
                if 'dimensions' in doc_data:
                    dimensions_set.add(doc_data['dimensions'])

            # Get metadata for dimensions
            metadata_doc = collection_ref.document('_metadata').get()
            if metadata_doc.exists:
                metadata = metadata_doc.to_dict()
                dimensions = metadata.get('dimensions', self.default_dimensions)
                metric = metadata.get('metric', self.default_metric)
            else:
                dimensions = list(dimensions_set)[0] if dimensions_set else self.default_dimensions
                metric = self.default_metric

            return VectorStats(
                total_vectors=total_vectors,
                index_size=total_vectors,  # Approximate
                dimensions=dimensions,
                metric=metric,
                namespace_stats=namespace_counts
            )

        except Exception as e:
            logger.error(f"Failed to get Firestore collection stats: {e}")
            return None

    def list_indexes(self) -> List[str]:
        """
        List all vector collections in Firestore

        Returns:
            List of collection names
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return []

        try:
            # List collections (this is a simplified version)
            # In practice, you'd maintain a registry of vector collections
            return [self.collection_name]
        except Exception as e:
            logger.error(f"Failed to list collections: {e}")
            return []

    def delete_index(self, index_name: Optional[str] = None) -> bool:
        """
        Delete a Firestore vector collection

        Args:
            index_name: Collection name to delete (defaults to current collection)

        Returns:
            True if successful
        """
        if not self.db:
            logger.error("Firestore client not initialized")
            return False

        collection_name = index_name or self.collection_name
        collection_ref = self.db.collection(collection_name)

        try:
            # Delete all documents in collection
            docs = collection_ref.limit(10000).stream()

            batch_size = 500
            batch = self.db.batch()
            count = 0

            for doc in docs:
                batch.delete(doc.reference)
                count += 1

                if count % batch_size == 0:
                    batch.commit()
                    batch = self.db.batch()

            # Commit remaining
            if count % batch_size != 0:
                batch.commit()

            logger.info(f"Deleted collection '{collection_name}' with {count} documents")
            return True

        except Exception as e:
            logger.error(f"Failed to delete collection '{collection_name}': {e}")
            return False

    def is_available(self) -> bool:
        """Check if Firestore vector store is available and configured"""
        return FIRESTORE_AVAILABLE and self.db is not None

    def get_connection_info(self) -> Dict[str, Any]:
        """Get Firestore connection information"""
        return {
            'firestore_available': FIRESTORE_AVAILABLE,
            'client_initialized': self.db is not None,
            'collection_name': self.collection_name,
            'project_id': self.project_id,
            'region': self.region,
            'dimensions': self.default_dimensions,
            'metric': self.default_metric
        }

# Global instance (lazy initialization to avoid Firebase init issues in tests)
_vector_store_instance = None

def get_vector_store(firestore_client=None) -> VectorStore:
    """
    Get or create vector store instance (lazy initialization)

    This pattern allows tests to provide mock Firestore clients and avoids
    initializing Firebase at module import time.

    Args:
        firestore_client: Optional Firestore client for testing

    Returns:
        VectorStore instance
    """
    global _vector_store_instance

    if _vector_store_instance is None:
        _vector_store_instance = VectorStore(firestore_client=firestore_client)

    return _vector_store_instance

# For backward compatibility (will be None until first use)
# Use get_vector_store() instead
vector_store = None

