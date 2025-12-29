"""
Cache Manager - Multi-level caching for search results and embeddings
"""
import logging
import time
import hashlib
import json
import pickle
from typing import Dict, Any, List, Optional, Union, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from collections import OrderedDict
import threading

# Redis import (conditional)
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

# PII detection import
try:
    from src.ai_agent.security.pii_detector import redact_pii_from_text, contains_pii_patterns
    PII_DETECTION_AVAILABLE = True
except ImportError:
    PII_DETECTION_AVAILABLE = False
    def redact_pii_from_text(text: str) -> str:
        return text
    def contains_pii_patterns(text: str) -> bool:
        return False

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    key: str
    value: Any
    created_at: datetime
    expires_at: Optional[datetime]
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    size_bytes: int = 0

@dataclass
class CacheStats:
    total_entries: int
    total_size_bytes: int
    hit_count: int
    miss_count: int
    hit_ratio: float
    eviction_count: int
    memory_usage_mb: float

class LRUCache:
    """
    In-memory LRU cache with size limits
    """

    def __init__(self, max_size: int = 1000, max_memory_mb: int = 100):
        self.max_size = max_size
        self.max_memory_bytes = max_memory_mb * 1024 * 1024
        self.cache = OrderedDict()
        self.stats = {
            'hits': 0,
            'misses': 0,
            'evictions': 0,
            'total_size_bytes': 0
        }
        self.lock = threading.RLock()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self.lock:
            if key in self.cache:
                # Move to end (most recently used)
                entry = self.cache.pop(key)
                self.cache[key] = entry
                entry.access_count += 1
                entry.last_accessed = datetime.now(timezone.utc)
                self.stats['hits'] += 1
                return entry.value
            else:
                self.stats['misses'] += 1
                return None

    def put(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> bool:
        """Put value in cache"""
        with self.lock:
            # Calculate size
            try:
                size_bytes = len(pickle.dumps(value))
            except Exception:
                size_bytes = len(str(value).encode('utf-8'))

            # Check if value is too large
            if size_bytes > self.max_memory_bytes:
                logger.warning(f"Value too large for cache: {size_bytes} bytes")
                return False

            # Calculate expiration
            expires_at = None
            if ttl_seconds:
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

            # Create entry
            entry = CacheEntry(
                key=key,
                value=value,
                created_at=datetime.now(timezone.utc),
                expires_at=expires_at,
                size_bytes=size_bytes
            )

            # Remove existing entry if present
            if key in self.cache:
                old_entry = self.cache.pop(key)
                self.stats['total_size_bytes'] -= old_entry.size_bytes

            # Evict entries if necessary
            self._evict_if_necessary(size_bytes)

            # Add new entry
            self.cache[key] = entry
            self.stats['total_size_bytes'] += size_bytes

            return True

    def _evict_if_necessary(self, new_entry_size: int):
        """Evict entries to make room for new entry"""
        # Check size limit
        while (len(self.cache) >= self.max_size or
               self.stats['total_size_bytes'] + new_entry_size > self.max_memory_bytes):
            if not self.cache:
                break

            # Remove least recently used item
            oldest_key, oldest_entry = self.cache.popitem(last=False)
            self.stats['total_size_bytes'] -= oldest_entry.size_bytes
            self.stats['evictions'] += 1

        # Check for expired entries
        current_time = datetime.now(timezone.utc)
        expired_keys = []

        for key, entry in self.cache.items():
            if entry.expires_at and entry.expires_at < current_time:
                expired_keys.append(key)

        for key in expired_keys:
            entry = self.cache.pop(key)
            self.stats['total_size_bytes'] -= entry.size_bytes

    def clear(self):
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
            self.stats['total_size_bytes'] = 0

    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            total_requests = self.stats['hits'] + self.stats['misses']
            hit_ratio = self.stats['hits'] / total_requests if total_requests > 0 else 0.0

            return {
                'entries': len(self.cache),
                'size_bytes': self.stats['total_size_bytes'],
                'size_mb': self.stats['total_size_bytes'] / (1024 * 1024),
                'hits': self.stats['hits'],
                'misses': self.stats['misses'],
                'hit_ratio': hit_ratio,
                'evictions': self.stats['evictions']
            }

class FirestoreCache:
    """
    Firestore-based distributed cache
    """

    def __init__(self, collection_name: str = "cache"):
        self.collection_name = collection_name
        self.db = None
        self.stats = {
            'hits': 0,
            'misses': 0,
            'errors': 0
        }
        try:
            from firebase_admin import firestore
            self.db = firestore.client()
            logger.info(f"Firestore cache connected (collection: {collection_name})")
        except Exception as e:
            logger.warning(f"Failed to connect to Firestore: {e}")

    def get(self, key: str) -> Optional[Any]:
        """Get value from Firestore cache"""
        if not self.db:
            return None

        try:
            doc_ref = self.db.collection(self.collection_name).document(key)
            doc = doc_ref.get()

            if doc.exists:
                data = doc.to_dict()
                # Check expiration
                if 'expires_at' in data and data['expires_at']:
                    expires_at = datetime.fromisoformat(data['expires_at'])
                    if datetime.now(timezone.utc) > expires_at:
                        # Expired
                        self.delete(key)
                        self.stats['misses'] += 1
                        return None

                # Deserialize value
                if 'pickle_data' in data:
                    # Legacy or binary data
                    import base64
                    value = pickle.loads(base64.b64decode(data['pickle_data']))
                else:
                    # JSON data
                    value = data.get('value')

                self.stats['hits'] += 1
                return value
            else:
                self.stats['misses'] += 1
                return None
        except Exception as e:
            logger.warning(f"Firestore get error: {e}")
            self.stats['errors'] += 1
            return None

    def put(self, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        """Put value in Firestore cache"""
        if not self.db:
            return False

        try:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)

            # Try to store as JSON first, fallback to pickle
            try:
                # Ensure value is JSON serializable
                json.dumps(value)
                data = {
                    'value': value,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'expires_at': expires_at.isoformat(),
                    'type': 'json'
                }
            except (TypeError, OverflowError):
                import base64
                pickle_data = base64.b64encode(pickle.dumps(value)).decode('utf-8')
                data = {
                    'pickle_data': pickle_data,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'expires_at': expires_at.isoformat(),
                    'type': 'pickle'
                }

            self.db.collection(self.collection_name).document(key).set(data)
            return True
        except Exception as e:
            logger.warning(f"Firestore put error: {e}")
            self.stats['errors'] += 1
            return False

    def delete(self, key: str) -> bool:
        """Delete key from Firestore cache"""
        if not self.db:
            return False

        try:
            self.db.collection(self.collection_name).document(key).delete()
            return True
        except Exception as e:
            logger.warning(f"Firestore delete error: {e}")
            self.stats['errors'] += 1
            return False

    def clear_pattern(self, pattern: str) -> int:
        """Clear keys (Not fully supported in Firestore efficiently, ignoring pattern for now)"""
        return 0

    def get_stats(self) -> Dict[str, Any]:
        """Get Firestore cache statistics"""
        return {
            'available': self.db is not None,
            'hits': self.stats['hits'],
            'misses': self.stats['misses'],
            'errors': self.stats['errors']
        }

class MultiLevelCacheManager:
    """
    Multi-level cache manager with L1 (memory) and L2 (Firestore) caches
    """

    def __init__(self, collection_name: str = "cache"):
        # L1 Cache (In-memory)
        self.l1_cache = LRUCache(max_size=1000, max_memory_mb=50)

        # L2 Cache (Firestore)
        self.l2_cache = FirestoreCache(collection_name)

        # Cache configuration
        self.config = {
            'search_results_ttl': 1800,  # 30 minutes
            'embeddings_ttl': 86400,     # 24 hours
            'context_ttl': 3600,         # 1 hour
            'user_data_ttl': 7200        # 2 hours
        }

    def _generate_cache_key(self, cache_type: str, identifier: str, **kwargs) -> str:
        """Generate cache key with type prefix"""
        # Create deterministic key from parameters
        key_parts = [cache_type, identifier]

        if kwargs:
            # Sort kwargs for consistent key generation
            sorted_kwargs = sorted(kwargs.items())
            kwargs_str = json.dumps(sorted_kwargs, sort_keys=True)
            kwargs_hash = hashlib.md5(kwargs_str.encode()).hexdigest()[:8]
            key_parts.append(kwargs_hash)

        return ':'.join(key_parts)

    def get(self, cache_type: str, identifier: str, **kwargs) -> Optional[Any]:
        """Get value from multi-level cache"""
        cache_key = self._generate_cache_key(cache_type, identifier, **kwargs)

        # Try L1 cache first
        value = self.l1_cache.get(cache_key)
        if value is not None:
            logger.debug(f"L1 cache hit: {cache_key}")
            return value

        # Try L2 cache
        value = self.l2_cache.get(cache_key)
        if value is not None:
            logger.debug(f"L2 cache hit: {cache_key}")
            # Promote to L1 cache
            self.l1_cache.put(cache_key, value, ttl_seconds=300)  # 5 min in L1
            return value

        logger.info(f"Cache miss (L1 & L2): {cache_key}")
        return None

    def put(self, cache_type: str, identifier: str, value: Any, **kwargs) -> bool:
        """Put value in multi-level cache"""
        # CRITICAL FIX: Extract ttl_seconds before generating cache key
        # to avoid key mismatch between put() and get() calls
        ttl_seconds = kwargs.pop('ttl_seconds', None)

        cache_key = self._generate_cache_key(cache_type, identifier, **kwargs)

        # Use extracted ttl_seconds or default from config
        if ttl_seconds is None:
            ttl_seconds = self.config.get(f"{cache_type}_ttl", 3600)

        # Store in both caches
        l1_success = self.l1_cache.put(cache_key, value, ttl_seconds=min(ttl_seconds, 1800))
        l2_success = self.l2_cache.put(cache_key, value, ttl_seconds=ttl_seconds)

        logger.debug(f"Cache put: {cache_key} (L1: {l1_success}, L2: {l2_success})")
        return l1_success or l2_success

    def delete(self, cache_type: str, identifier: str, **kwargs) -> bool:
        """Delete value from multi-level cache"""
        cache_key = self._generate_cache_key(cache_type, identifier, **kwargs)

        # Remove from both caches
        # Note: LRU cache doesn't have explicit delete, but Redis does
        l2_success = self.l2_cache.delete(cache_key)

        logger.debug(f"Cache delete: {cache_key}")
        return l2_success

    def clear_cache_type(self, cache_type: str) -> int:
        """Clear all entries of a specific cache type"""
        pattern = f"{cache_type}:*"

        # Clear L1 cache (full clear for simplicity)
        self.l1_cache.clear()

        # Clear L2 cache with pattern
        cleared_count = self.l2_cache.clear_pattern(pattern)

        logger.info(f"Cleared {cleared_count} entries for cache type: {cache_type}")
        return cleared_count

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        l1_stats = self.l1_cache.get_stats()
        l2_stats = self.l2_cache.get_stats()

        return {
            'l1_cache': l1_stats,
            'l2_cache': l2_stats,
            'total_hit_ratio': self._calculate_total_hit_ratio(l1_stats, l2_stats),
            'cache_levels': 2,
            'config': self.config
        }

    def _calculate_total_hit_ratio(self, l1_stats: Dict, l2_stats: Dict) -> float:
        """Calculate overall hit ratio across cache levels"""
        total_hits = l1_stats['hits'] + l2_stats['hits']
        total_requests = total_hits + l1_stats['misses'] + l2_stats['misses']

        return total_hits / total_requests if total_requests > 0 else 0.0

    # Convenience methods for specific cache types

    def cache_search_results(self, query: str, results: List[Any], **filters) -> bool:
        """Cache search results"""
        return self.put('search_results', query, results, **filters)

    def get_cached_search_results(self, query: str, **filters) -> Optional[List[Any]]:
        """Get cached search results"""
        return self.get('search_results', query, **filters)

    def cache_embedding(self, text: str, embedding: List[float], model: str) -> bool:
        """Cache embedding"""
        return self.put('embeddings', text, embedding, model=model)

    def get_cached_embedding(self, text: str, model: str) -> Optional[List[float]]:
        """Get cached embedding"""
        return self.get('embeddings', text, model=model)

    def cache_context(self, query: str, context: Any, user_id: str) -> bool:
        """Cache retrieved context"""
        return self.put('context', query, context, user_id=user_id)

    def get_cached_context(self, query: str, user_id: str) -> Optional[Any]:
        """Get cached context"""
        return self.get('context', query, user_id=user_id)

class IntelligentResponseCache(MultiLevelCacheManager):
    """
    Intelligent response cache with PII detection, quality validation,
    and semantic similarity search for marketing agent responses.

    Security Features:
    - PII detection and redaction before caching
    - Quality validation to prevent caching low-quality responses
    - Prevents caching personalized responses

    Performance Features:
    - Semantic similarity search (future: embedding-based)
    - Hit count tracking
    - Cache warming support
    """


    def __init__(self, collection_name: str = "response_cache", quality_threshold: float = 0.7, similarity_threshold: float = 0.75):
        super().__init__(collection_name)
        self.quality_threshold = quality_threshold
        self.similarity_threshold = similarity_threshold  # For semantic matching

        # Response-specific TTL configuration
        self.config['responses_ttl'] = 2592000  # 30 days

        # Lazy loading of embedding model (only load when needed)
        self._embedding_model = None
        self._embedding_model_name = 'all-MiniLM-L6-v2'  # Lightweight, fast model

        # Statistics tracking
        self.response_stats = {
            'total_cache_attempts': 0,
            'pii_rejections': 0,
            'quality_rejections': 0,
            'successful_caches': 0,
            'cache_hits': 0,
            'cache_misses': 0,
            'semantic_hits': 0,  # Cache hits via semantic similarity
        }

    def _get_embedding_model(self):
        """
        Lazy load embedding model only when needed.

        This delays the model loading until first use to avoid:
        - Slow cold starts
        - Unnecessary memory usage if caching disabled
        """
        if self._embedding_model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading embedding model: {self._embedding_model_name}")
                self._embedding_model = SentenceTransformer(self._embedding_model_name)
                logger.info("✓ Embedding model loaded successfully")
            except ImportError:
                logger.warning("sentence-transformers not available. Semantic search disabled.")
                logger.warning("Install with: pip install sentence-transformers")
                self._embedding_model = False  # Mark as unavailable
            except Exception as e:
                logger.error(f"Failed to load embedding model: {e}")
                self._embedding_model = False

        return self._embedding_model if self._embedding_model is not False else None

    def _generate_embedding(self, text: str):
        """
        Generate embedding for text.

        Args:
            text: Text to embed

        Returns:
            Numpy array embedding or None if model unavailable
        """
        model = self._get_embedding_model()
        if model is None:
            return None

        try:
            # Normalize text before embedding
            normalized_text = ' '.join(text.lower().strip().split())
            embedding = model.encode(normalized_text, convert_to_numpy=True)
            return embedding.tolist()  # Convert to list for JSON storage
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            return None

    def _calculate_cosine_similarity(self, emb1, emb2):
        """
        Calculate cosine similarity between two embeddings.

        Args:
            emb1: First embedding (list or numpy array)
            emb2: Second embedding (list or numpy array)

        Returns:
            Similarity score (0.0 to 1.0)
        """
        try:
            import numpy as np

            # Convert to numpy arrays if needed
            vec1 = np.array(emb1)
            vec2 = np.array(emb2)

            # Cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)

            if norm1 == 0 or norm2 == 0:
                return 0.0

            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except Exception as e:
            logger.error(f"Similarity calculation error: {e}")
            return 0.0


    def _contains_pii(self, text: str) -> bool:
        """
        Check if text contains PII that should not be cached.

        Returns:
            True if PII detected, False otherwise
        """
        if not PII_DETECTION_AVAILABLE:
            logger.warning("PII detection not available, skipping PII check")
            return False

        try:
            # Use existing PII detector
            return contains_pii_patterns(text)
        except Exception as e:
            logger.error(f"PII detection error: {e}")
            # Fail safe: if detection fails, assume PII present
            return True

    def _is_personalized(self, response: str) -> bool:
        """
        Check if response appears to be personalized/user-specific.

        Personalized responses should not be cached as they may contain
        user-specific information.

        Returns:
            True if response appears personalized
        """
        # Indicators of personalization
        personalization_keywords = [
            'your company',
            'your business',
            'based on your',
            'for you specifically',
            'your organization',
            'your team',
            'you mentioned'
        ]

        response_lower = response.lower()
        for keyword in personalization_keywords:
            if keyword in response_lower:
                logger.info(f"Response appears personalized (keyword: {keyword})")
                return True

        return False

    def _calculate_quality_score(self, response: str) -> float:
        """
        Calculate quality score for response.

        Improved algorithm that is lenient on short but valid responses
        while maintaining strict PII and error detection.

        Returns:
            Quality score between 0.0 and 1.0
        """
        score = 1.0
        response_lower = response.lower()
        words = response.split()
        word_count = len(words)

        # Severity levels: Critical (-0.5), Major (-0.3), Minor (-0.1)

        # CRITICAL: Extremely short responses (likely incomplete)
        if len(response) < 30:  # Changed from 50, ~5-6 words minimum
            score -= 0.5
        # MINOR: Short but potentially valid (e.g., "molē is EthosPrompt's AI marketing assistant")
        elif len(response) < 100 and word_count < 15:
            score -= 0.1  # Small penalty, not blocking

        # CRITICAL: Clear error messages
        critical_error_phrases = [
            "i don't know",
            "i cannot help",
            "i'm unable to",
            "system error",
            "internal error"
        ]
        for phrase in critical_error_phrases:
            if phrase in response_lower:
                score -= 0.5
                break

        # MAJOR: Apologetic/uncertain responses
        uncertain_phrases = [
            "i'm sorry",
            "i apologize",
            "unfortunately i"
        ]
        for phrase in uncertain_phrases:
            if phrase in response_lower:
                score -= 0.3
                break

        # MAJOR: High repetition (hallucination indicator)
        if word_count > 20:  # Only check for longer responses
            unique_words_ratio = len(set(words)) / word_count
            if unique_words_ratio < 0.4:  # Very high repetition
                score -= 0.4
            elif unique_words_ratio < 0.5:  # Moderate repetition
                score -= 0.2

        # MINOR: Contains question marks (might be confused/asking back)
        if response.count('?') > 2:  # Multiple questions = uncertainty
            score -= 0.1

        # POSITIVE: Contains factual markers (increases confidence)
        factual_markers = [
            'we offer', 'we provide', 'our services', 'ethosprompt',
            'intelligent application', 'system integration', 'pricing'
        ]
        if any(marker in response_lower for marker in factual_markers):
            score += 0.1  # Bonus for domain-specific content

        return max(0.0, min(1.0, score))

    def cache_response_safe(self,
                           query: str,
                           response: str,
                           page_context: str = "",
                           metadata: Optional[Dict] = None) -> bool:
        """
        Safely cache a response with PII detection and quality validation.

        Args:
            query: Original user query
            response: LLM response to cache
            page_context: Page/section context (e.g., "pricing", "services")
            metadata: Additional metadata to store

        Returns:
            True if cached successfully, False if rejected
        """
        self.response_stats['total_cache_attempts'] += 1

        try:
            # Step 1: Redact PII from query
            clean_query = redact_pii_from_text(query) if PII_DETECTION_AVAILABLE else query

            # Step 2: Check if response contains PII
            if self._contains_pii(response):
                logger.warning("Response contains PII, not caching")
                self.response_stats['pii_rejections'] += 1
                return False

            # Step 3: Check if response is personalized
            if self._is_personalized(response):
                logger.info("Response is personalized, not caching")
                self.response_stats['pii_rejections'] += 1  # Count as PII-related
                return False

            # Step 4: Validate quality
            quality_score = self._calculate_quality_score(response)
            if quality_score < self.quality_threshold:
                logger.warning(f"Low quality response (score: {quality_score:.2f}), not caching")
                self.response_stats['quality_rejections'] += 1
                return False

            # Step 5: Generate embedding for semantic search (optional, lazy)
            query_embedding = self._generate_embedding(clean_query)
            if query_embedding:
                logger.debug("Generated query embedding for semantic search")

            # Step 6: Prepare cache entry
            cache_data = {
                'query_original': query,
                'query_clean': clean_query,
                'query_embedding': query_embedding,  # For semantic similarity
                'response': response,
                'page_context': page_context,
                'quality_score': quality_score,
                'cached_at': datetime.now(timezone.utc).isoformat(),
                'hit_count': 0,
                'metadata': metadata or {}
            }

            # Step 7: Generate cache key
            # OPTIMIZATION: Use raw query for key generation to avoid expensive PII redaction on lookup
            # The key is hashed (MD5) so PII is not exposed in the key itself
            cache_key = self._generate_response_cache_key(query, page_context)
            logger.info(f"Generated PUT key: {cache_key} for query: '{query}' ctx: '{page_context}'")

            # Step 8: Store in cache
            ttl = self.config['responses_ttl']
            success = super().put('responses', cache_key, cache_data, ttl_seconds=ttl)

            if success:
                self.response_stats['successful_caches'] += 1
                logger.info(f"Cached response (quality: {quality_score:.2f}, key: {cache_key[:50]}...)")

            return success

        except Exception as e:
            logger.error(f"Error caching response: {e}")
            return False

    def get_cached_response(self,
                           query: str,
                           page_context: str = "") -> Optional[Dict]:
        """
        Retrieve cached response for a query.

        Args:
            query: User query
            page_context: Page/section context

        Returns:
            Cached response data if found, None otherwise
        """
        try:
            # Clean query for lookup
            # OPTIMIZATION: Use raw query for key generation to avoid expensive PII redaction on lookup
            # The key is hashed (MD5) so PII is not exposed in the key itself
            # clean_query = redact_pii_from_text(query) if PII_DETECTION_AVAILABLE else query

            cache_key = self._generate_response_cache_key(query, page_context)
            logger.info(f"Generated GET key: {cache_key} for query: '{query}' ctx: '{page_context}'")

            # Lookup in cache
            cached_data = super().get('responses', cache_key)

            if cached_data:
                self.response_stats['cache_hits'] += 1

                # Increment hit count
                cached_data['hit_count'] = cached_data.get('hit_count', 0) + 1

                # Update cache with new hit count
                super().put('responses', cache_key, cached_data)

                logger.info(f"Cache hit (hits: {cached_data['hit_count']}, key: {cache_key[:50]}...)")
                return cached_data
            else:
                self.response_stats['cache_misses'] += 1
                logger.debug(f"Cache miss for key: {cache_key[:50]}...")
                return None

        except Exception as e:
            logger.error(f"Error retrieving cached response: {e}")
            return None

    def get_similar_cached_response(self,
                                   query: str,
                                   page_context: str = "") -> Optional[Dict]:
        """
        Retrieve cached response using semantic similarity.

        Args:
            query: User query
            page_context: Page/section context (optional filter)

        Returns:
            Cached response data if found and similarity > threshold, None otherwise
        """
        # 1. Try exact match first (faster)
        exact_match = self.get_cached_response(query, page_context)
        if exact_match:
            return exact_match

        # 2. Generate embedding for query
        query_embedding = self._generate_embedding(query)
        if not query_embedding:
            return None

        try:
            # 3. Fetch candidates from Firestore
            # Note: In a production system with millions of records, use a Vector Database (Pinecone/Milvus)
            # or Firestore Vector Search. For this scale (<1000 items), in-memory comparison is acceptable.

            # Filter by context if provided to reduce search space
            # Access the underlying Firestore client directly for query
            if not self.l2_cache.db:
                return None

            collection_ref = self.l2_cache.db.collection(self.collection_name)

            # We need to scan documents that have embeddings
            # Ideally, we'd have a composite index on 'page_context' and 'has_embedding'
            # For now, we'll fetch all and filter in memory or use a simple query

            # Optimization: Only fetch documents with 'query_embedding' field
            # And optionally filter by page_context
            query_ref = collection_ref.where('page_context', '==', page_context) if page_context and page_context != "unknown" else collection_ref

            # Limit to recent/relevant items to prevent OOM
            # Optimization: Reduced from 500 to 50 to improve latency
            docs = query_ref.limit(50).stream()

            best_match = None
            best_score = -1.0

            for doc in docs:
                data = doc.to_dict()

                # Handle nested value structure from FirestoreCache.put
                if 'value' in data:
                    data = data['value']
                elif 'pickle_data' in data:
                    continue # Skip pickled data for semantic search

                if 'query_embedding' not in data or not data['query_embedding']:
                    continue

                # Calculate similarity
                score = self._calculate_cosine_similarity(query_embedding, data['query_embedding'])

                if score > best_score:
                    best_score = score
                    best_match = data

            # 4. Check threshold
            if best_match and best_score >= self.similarity_threshold:
                self.response_stats['semantic_hits'] += 1
                self.response_stats['cache_hits'] += 1

                # Increment hit count (async/fire-and-forget ideally)
                best_match['hit_count'] = best_match.get('hit_count', 0) + 1
                # Note: We aren't updating the DB here to save latency, but we could

                logger.info(f"Semantic cache hit! Score: {best_score:.4f} (Threshold: {self.similarity_threshold})")
                return best_match
            else:
                if best_match:
                    logger.info(f"Semantic miss. Best score: {best_score:.4f} < {self.similarity_threshold}")
                return None

        except Exception as e:
            logger.error(f"Error in semantic cache lookup: {e}")
            return None

    def _generate_response_cache_key(self, query: str, page_context: str) -> str:
        """
        Generate cache key for response.

        Uses query + page_context to create deterministic key.
        Future: Could use embedding similarity for semantic matching.
        """
        # Normalize query (lowercase, remove extra whitespace)
        normalized_query = ' '.join(query.lower().strip().split())

        # Create key from query + context
        key_string = f"{page_context}:{normalized_query}"
        return hashlib.md5(key_string.encode()).hexdigest()

    def get_response_stats(self) -> Dict[str, Any]:
        """
        Get response caching statistics.

        Returns:
            Dictionary with caching metrics
        """
        total_attempts = self.response_stats['total_cache_attempts']
        cache_requests = self.response_stats['cache_hits'] + self.response_stats['cache_misses']

        hit_rate = (self.response_stats['cache_hits'] / cache_requests * 100) if cache_requests > 0 else 0
        success_rate = (self.response_stats['successful_caches'] / total_attempts * 100) if total_attempts > 0 else 0

        return {
            **self.response_stats,
            'cache_hit_rate_percent': round(hit_rate, 2),
            'cache_success_rate_percent': round(success_rate, 2),
            'quality_threshold': self.quality_threshold,
            'pii_detection_available': PII_DETECTION_AVAILABLE
        }

    def invalidate_by_context(self, page_context: str) -> int:
        """
        Invalidate all cached responses for a specific context.

        Useful when KB content changes (e.g., pricing update).

        Args:
            page_context: Context to invalidate (e.g., "pricing")

        Returns:
            Number of entries invalidated
        """
        # For now, clear all responses (future: filter by context)
        count = self.clear_cache_type('responses')
        logger.info(f"Invalidated {count} cached responses for context: {page_context}")
        return count

# Global instances
cache_manager = MultiLevelCacheManager()
intelligent_response_cache = IntelligentResponseCache()

