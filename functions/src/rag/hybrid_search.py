"""
Hybrid Search - Combine semantic and keyword search with Reciprocal Rank Fusion
Enhanced for Phase 3 with BM25 integration and advanced query processing
"""
import logging
import re
import math
from typing import Dict, Any, List, Optional, Tuple, Set
from dataclasses import dataclass
from collections import defaultdict, Counter

try:
    from rank_bm25 import BM25Okapi
    BM25_AVAILABLE = True
except ImportError:
    BM25_AVAILABLE = False
    logging.warning("rank_bm25 not available, using fallback TF-IDF implementation")

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    from nltk.stem import PorterStemmer
    NLTK_AVAILABLE = True
except ImportError:
    NLTK_AVAILABLE = False
    logging.warning("NLTK not available, using basic text processing")

try:
    from spellchecker import SpellChecker
    SPELLCHECKER_AVAILABLE = True
except ImportError:
    SPELLCHECKER_AVAILABLE = False
    logging.warning("SpellChecker not available, spell correction disabled")

from .semantic_search import semantic_search_engine, SearchQuery, SearchResult, SearchResponse
from ..cache import cache

logger = logging.getLogger(__name__)

@dataclass
class KeywordSearchResult:
    chunk_id: str
    content: str
    score: float
    metadata: Dict[str, Any]
    matched_terms: List[str]
    term_frequencies: Dict[str, int]

@dataclass
class HybridSearchResult:
    chunk_id: str
    content: str
    semantic_score: float
    keyword_score: float
    hybrid_score: float
    rank: int
    metadata: Dict[str, Any]
    matched_terms: Optional[List[str]] = None
    fusion_method: str = "rrf"

class EnhancedBM25SearchEngine:
    """
    Enhanced BM25-based search engine with advanced text processing
    Phase 3 implementation with spell correction and query expansion
    """

    def __init__(self):
        # Initialize text processing components
        self.stop_words = self._initialize_stopwords()
        self.stemmer = PorterStemmer() if NLTK_AVAILABLE else None
        self.spell_checker = SpellChecker() if SPELLCHECKER_AVAILABLE else None

        # BM25 parameters
        self.k1 = 1.5  # Term frequency saturation parameter
        self.b = 0.75  # Length normalization parameter

        # Document storage and indexing
        self.documents = []  # List of document texts
        self.document_metadata = []  # List of document metadata
        self.bm25_index = None
        self.document_index = {}  # Legacy support

        # Query expansion synonyms (basic implementation)
        self.synonyms = {
            'ai': ['artificial intelligence', 'machine learning', 'ml'],
            'ml': ['machine learning', 'artificial intelligence', 'ai'],
            'nlp': ['natural language processing', 'text processing'],
            'api': ['application programming interface', 'endpoint'],
            'db': ['database', 'data store'],
            'ui': ['user interface', 'frontend'],
            'ux': ['user experience', 'usability']
        }

    def _initialize_stopwords(self):
        """Initialize stopwords with fallback"""
        if NLTK_AVAILABLE:
            try:
                nltk.download('stopwords', quiet=True)
                nltk.download('punkt', quiet=True)
                return set(stopwords.words('english'))
            except:
                pass

        # Fallback stopwords
        return {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
            'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
            'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have',
            'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if',
            'or', 'can', 'could', 'would', 'should', 'may', 'might', 'must'
        }

    def preprocess_text(self, text: str) -> List[str]:
        """Advanced text preprocessing with stemming and normalization"""
        if not text:
            return []

        # Convert to lowercase and remove special characters
        text = re.sub(r'[^\w\s]', ' ', text.lower())

        # Tokenize
        if NLTK_AVAILABLE:
            try:
                tokens = word_tokenize(text)
            except:
                tokens = text.split()
        else:
            tokens = text.split()

        # Remove stopwords and short tokens
        tokens = [token for token in tokens
                 if token not in self.stop_words and len(token) > 2]

        # Apply stemming if available
        if self.stemmer:
            tokens = [self.stemmer.stem(token) for token in tokens]

        return tokens

    def correct_spelling(self, query: str) -> str:
        """Correct spelling in query if spell checker is available"""
        if not self.spell_checker:
            return query

        try:
            words = query.split()
            corrected_words = []

            for word in words:
                # Only correct if word is misspelled and not too short
                if len(word) > 3 and word.lower() not in self.spell_checker:
                    correction = self.spell_checker.correction(word.lower())
                    if correction and correction != word.lower():
                        corrected_words.append(correction)
                        logger.info(f"Spell correction: {word} -> {correction}")
                    else:
                        corrected_words.append(word)
                else:
                    corrected_words.append(word)

            return ' '.join(corrected_words)
        except Exception as e:
            logger.warning(f"Spell correction failed: {e}")
            return query

    def expand_query(self, query: str) -> str:
        """Expand query with synonyms and related terms"""
        words = query.lower().split()
        expanded_words = list(words)  # Start with original words

        for word in words:
            if word in self.synonyms:
                # Add synonyms but limit to avoid query explosion
                synonyms_to_add = self.synonyms[word][:2]  # Max 2 synonyms per word
                expanded_words.extend(synonyms_to_add)

        return ' '.join(expanded_words)

    def index_documents(self, documents: List[Dict[str, Any]]):
        """Index documents for BM25 search"""
        self.documents = []
        self.document_metadata = []

        # Process documents
        processed_docs = []
        for doc in documents:
            content = doc.get('content', '')
            self.documents.append(content)
            self.document_metadata.append(doc)

            # Preprocess for BM25
            processed_content = self.preprocess_text(content)
            processed_docs.append(processed_content)

        # Create BM25 index
        if BM25_AVAILABLE and processed_docs:
            try:
                self.bm25_index = BM25Okapi(processed_docs)
                logger.info(f"BM25 index created with {len(processed_docs)} documents")
            except Exception as e:
                logger.error(f"Failed to create BM25 index: {e}")
                self.bm25_index = None
        else:
            logger.warning("BM25 not available, using fallback search")
            self.bm25_index = None

    def search(self, query: str, top_k: int = 10) -> List[KeywordSearchResult]:
        """Enhanced BM25 search with query processing"""
        if not self.documents:
            return []

        # Step 1: Spell correction
        corrected_query = self.correct_spelling(query)

        # Step 2: Query expansion
        expanded_query = self.expand_query(corrected_query)

        # Step 3: Preprocess query
        processed_query = self.preprocess_text(expanded_query)

        if not processed_query:
            return []

        # Step 4: BM25 search
        if self.bm25_index:
            try:
                scores = self.bm25_index.get_scores(processed_query)

                # Get top results
                doc_scores = [(i, score) for i, score in enumerate(scores)]
                doc_scores.sort(key=lambda x: x[1], reverse=True)

                results = []
                for i, (doc_idx, score) in enumerate(doc_scores[:top_k]):
                    if score > 0:  # Only include relevant results
                        # Find matched terms
                        doc_tokens = self.preprocess_text(self.documents[doc_idx])
                        matched_terms = list(set(processed_query) & set(doc_tokens))

                        result = KeywordSearchResult(
                            chunk_id=self.document_metadata[doc_idx].get('id', f'doc_{doc_idx}'),
                            content=self.documents[doc_idx],
                            score=float(score),
                            metadata=self.document_metadata[doc_idx],
                            matched_terms=matched_terms,
                            term_frequencies=Counter(doc_tokens)
                        )
                        results.append(result)

                return results

            except Exception as e:
                logger.error(f"BM25 search failed: {e}")
                return self._fallback_search(processed_query, top_k)
        else:
            return self._fallback_search(processed_query, top_k)

    def _fallback_search(self, processed_query: List[str], top_k: int) -> List[KeywordSearchResult]:
        """Fallback TF-IDF search when BM25 is not available"""
        results = []

        for i, doc in enumerate(self.documents):
            doc_tokens = self.preprocess_text(doc)

            # Simple TF-IDF scoring
            score = 0
            matched_terms = []

            for term in processed_query:
                if term in doc_tokens:
                    tf = doc_tokens.count(term) / len(doc_tokens) if doc_tokens else 0
                    # Simple IDF approximation
                    idf = math.log(len(self.documents) / (1 + sum(1 for d in self.documents if term in self.preprocess_text(d))))
                    score += tf * idf
                    matched_terms.append(term)

            if score > 0:
                result = KeywordSearchResult(
                    chunk_id=self.document_metadata[i].get('id', f'doc_{i}'),
                    content=doc,
                    score=score,
                    metadata=self.document_metadata[i],
                    matched_terms=matched_terms,
                    term_frequencies=Counter(doc_tokens)
                )
                results.append(result)

        # Sort by score and return top_k
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:top_k]


class ReciprocalRankFusion:
    """
    Reciprocal Rank Fusion (RRF) algorithm for combining search results
    Phase 3 implementation for hybrid search
    """

    def __init__(self, k: int = 60):
        """
        Initialize RRF with parameter k
        k=60 is the standard value used in literature
        """
        self.k = k

    def fuse_results(
        self,
        semantic_results: List[SearchResult],
        keyword_results: List[KeywordSearchResult],
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3
    ) -> List[HybridSearchResult]:
        """
        Fuse semantic and keyword search results using RRF

        Args:
            semantic_results: Results from semantic search
            keyword_results: Results from keyword/BM25 search
            semantic_weight: Weight for semantic search (0.0 to 1.0)
            keyword_weight: Weight for keyword search (0.0 to 1.0)

        Returns:
            List of fused hybrid search results
        """
        # Normalize weights
        total_weight = semantic_weight + keyword_weight
        if total_weight > 0:
            semantic_weight /= total_weight
            keyword_weight /= total_weight

        # Create document score maps
        semantic_scores = {}
        keyword_scores = {}
        all_doc_ids = set()

        # Process semantic results
        for rank, result in enumerate(semantic_results, 1):
            doc_id = result.chunk_id
            rrf_score = 1.0 / (self.k + rank)
            semantic_scores[doc_id] = {
                'rrf_score': rrf_score,
                'original_score': result.score,
                'rank': rank,
                'result': result
            }
            all_doc_ids.add(doc_id)

        # Process keyword results
        for rank, result in enumerate(keyword_results, 1):
            doc_id = result.chunk_id
            rrf_score = 1.0 / (self.k + rank)
            keyword_scores[doc_id] = {
                'rrf_score': rrf_score,
                'original_score': result.score,
                'rank': rank,
                'result': result
            }
            all_doc_ids.add(doc_id)

        # Combine scores using weighted RRF
        hybrid_results = []

        for doc_id in all_doc_ids:
            semantic_data = semantic_scores.get(doc_id, {})
            keyword_data = keyword_scores.get(doc_id, {})

            # Calculate weighted RRF score
            semantic_rrf = semantic_data.get('rrf_score', 0.0)
            keyword_rrf = keyword_data.get('rrf_score', 0.0)

            hybrid_score = (semantic_weight * semantic_rrf +
                          keyword_weight * keyword_rrf)

            # Get the best available result object
            if semantic_data and 'result' in semantic_data:
                base_result = semantic_data['result']
                content = base_result.content
                metadata = base_result.metadata
            elif keyword_data and 'result' in keyword_data:
                base_result = keyword_data['result']
                content = base_result.content
                metadata = base_result.metadata
            else:
                continue  # Skip if no result data

            # Create hybrid result
            hybrid_result = HybridSearchResult(
                chunk_id=doc_id,
                content=content,
                semantic_score=semantic_data.get('original_score', 0.0),
                keyword_score=keyword_data.get('original_score', 0.0),
                hybrid_score=hybrid_score,
                rank=0,  # Will be set after sorting
                metadata=metadata,
                matched_terms=keyword_data.get('result', {}).matched_terms if keyword_data else [],
                fusion_method="rrf"
            )

            hybrid_results.append(hybrid_result)

        # Sort by hybrid score and assign ranks
        hybrid_results.sort(key=lambda x: x.hybrid_score, reverse=True)
        for i, result in enumerate(hybrid_results, 1):
            result.rank = i

        return hybrid_results

    def adaptive_fusion(
        self,
        semantic_results: List[SearchResult],
        keyword_results: List[KeywordSearchResult],
        query: str
    ) -> List[HybridSearchResult]:
        """
        Adaptive fusion that adjusts weights based on query characteristics
        """
        # Analyze query to determine optimal weights
        query_length = len(query.split())
        has_technical_terms = any(term in query.lower() for term in
                                ['api', 'function', 'class', 'method', 'variable'])
        has_quotes = '"' in query

        # Adjust weights based on query characteristics
        if has_quotes or query_length <= 3:
            # Short queries or exact phrases favor keyword search
            semantic_weight = 0.4
            keyword_weight = 0.6
        elif has_technical_terms:
            # Technical queries benefit from both approaches
            semantic_weight = 0.6
            keyword_weight = 0.4
        elif query_length > 10:
            # Long queries favor semantic search
            semantic_weight = 0.8
            keyword_weight = 0.2
        else:
            # Default balanced approach
            semantic_weight = 0.7
            keyword_weight = 0.3

        logger.info(f"Adaptive fusion weights - Semantic: {semantic_weight}, Keyword: {keyword_weight}")

        return self.fuse_results(
            semantic_results,
            keyword_results,
            semantic_weight,
            keyword_weight
        )


class HybridSearchEngine:
    """
    Main Hybrid Search Engine combining semantic and keyword search
    Phase 3 implementation with advanced features and Firebase Firestore caching
    """

    def __init__(self):
        self.semantic_search = semantic_search_engine
        self.keyword_search = EnhancedBM25SearchEngine()
        self.fusion_engine = ReciprocalRankFusion()

        # Firebase Firestore caching for performance optimization
        self.cache = cache

        # Performance tracking
        self.search_stats = {
            'total_searches': 0,
            'semantic_only': 0,
            'keyword_only': 0,
            'hybrid': 0,
            'avg_response_time': 0.0,
            'cache_hits': 0,
            'cache_misses': 0
        }

    async def index_documents(self, documents: List[Dict[str, Any]]):
        """Index documents for both semantic and keyword search"""
        try:
            # Index for keyword search
            self.keyword_search.index_documents(documents)

            # Index for semantic search (if needed)
            # Note: semantic search may already be indexed
            logger.info(f"Indexed {len(documents)} documents for hybrid search")

        except Exception as e:
            logger.error(f"Failed to index documents: {e}")
            raise

    async def search(
        self,
        query: str,
        top_k: int = 10,
        search_mode: str = "hybrid",  # "hybrid", "semantic", "keyword"
        adaptive_weights: bool = True
    ) -> List[HybridSearchResult]:
        """
        Perform hybrid search combining semantic and keyword approaches with Firebase caching

        Args:
            query: Search query
            top_k: Number of results to return
            search_mode: Search strategy ("hybrid", "semantic", "keyword")
            adaptive_weights: Whether to use adaptive weight adjustment

        Returns:
            List of hybrid search results
        """
        import time
        import hashlib
        start_time = time.time()

        # Generate cache key
        cache_key = f"hybrid_search:{hashlib.md5(f'{query}:{top_k}:{search_mode}:{adaptive_weights}'.encode()).hexdigest()}"

        try:
            self.search_stats['total_searches'] += 1

            # Try cache first
            cached_results = await self.cache.get(cache_key)
            if cached_results:
                self.search_stats['cache_hits'] += 1
                logger.debug(f"Cache hit for query: {query[:50]}...")
                return cached_results

            self.search_stats['cache_misses'] += 1

            # Perform search
            if search_mode == "semantic":
                results = await self._semantic_only_search(query, top_k)
            elif search_mode == "keyword":
                results = await self._keyword_only_search(query, top_k)
            else:
                results = await self._hybrid_search(query, top_k, adaptive_weights)

            # Cache results for 30 minutes
            await self.cache.set(cache_key, results, ttl_seconds=1800)

            return results

        except Exception as e:
            logger.error(f"Hybrid search failed: {e}")
            # Fallback to semantic search
            return await self._semantic_only_search(query, top_k)

        finally:
            # Update performance stats
            elapsed_time = time.time() - start_time
            self.search_stats['avg_response_time'] = (
                (self.search_stats['avg_response_time'] * (self.search_stats['total_searches'] - 1) + elapsed_time) /
                self.search_stats['total_searches']
            )

    async def _hybrid_search(
        self,
        query: str,
        top_k: int,
        adaptive_weights: bool
    ) -> List[HybridSearchResult]:
        """Perform full hybrid search"""
        self.search_stats['hybrid'] += 1

        # Get semantic results
        semantic_query = SearchQuery(
            text=query,
            top_k=top_k * 2  # Get more results for better fusion
        )

        semantic_response = await self.semantic_search.search(semantic_query)
        semantic_results = semantic_response.results if semantic_response else []

        # Get keyword results
        keyword_results = self.keyword_search.search(query, top_k * 2)

        # Fuse results
        if adaptive_weights:
            hybrid_results = self.fusion_engine.adaptive_fusion(
                semantic_results, keyword_results, query
            )
        else:
            hybrid_results = self.fusion_engine.fuse_results(
                semantic_results, keyword_results
            )

        return hybrid_results[:top_k]

    async def _semantic_only_search(self, query: str, top_k: int) -> List[HybridSearchResult]:
        """Semantic search only"""
        self.search_stats['semantic_only'] += 1

        semantic_query = SearchQuery(text=query, top_k=top_k)
        semantic_response = await self.semantic_search.search(semantic_query)

        if not semantic_response or not semantic_response.results:
            return []

        # Convert to hybrid results
        hybrid_results = []
        for i, result in enumerate(semantic_response.results, 1):
            hybrid_result = HybridSearchResult(
                chunk_id=result.chunk_id,
                content=result.content,
                semantic_score=result.score,
                keyword_score=0.0,
                hybrid_score=result.score,
                rank=i,
                metadata=result.metadata,
                matched_terms=[],
                fusion_method="semantic_only"
            )
            hybrid_results.append(hybrid_result)

        return hybrid_results

    async def _keyword_only_search(self, query: str, top_k: int) -> List[HybridSearchResult]:
        """Keyword search only"""
        self.search_stats['keyword_only'] += 1

        keyword_results = self.keyword_search.search(query, top_k)

        # Convert to hybrid results
        hybrid_results = []
        for i, result in enumerate(keyword_results, 1):
            hybrid_result = HybridSearchResult(
                chunk_id=result.chunk_id,
                content=result.content,
                semantic_score=0.0,
                keyword_score=result.score,
                hybrid_score=result.score,
                rank=i,
                metadata=result.metadata,
                matched_terms=result.matched_terms,
                fusion_method="keyword_only"
            )
            hybrid_results.append(hybrid_result)

        return hybrid_results

    def get_search_statistics(self) -> Dict[str, Any]:
        """Get search performance statistics"""
        return {
            **self.search_stats,
            'keyword_search_available': BM25_AVAILABLE,
            'nlp_features_available': NLTK_AVAILABLE,
            'spell_correction_available': SPELLCHECKER_AVAILABLE
        }


# Global hybrid search engine instance
hybrid_search_engine = HybridSearchEngine()

