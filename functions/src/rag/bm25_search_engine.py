"""
Enhanced BM25 Search Engine with NLTK Integration and Query Enhancement
"""
import asyncio
import logging
import math
import re
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime

import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.tokenize import word_tokenize
from spellchecker import SpellChecker

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

logger = logging.getLogger(__name__)

@dataclass
class SearchResult:
    """Search result with relevance scoring"""
    document_id: str
    content: str
    score: float
    metadata: Dict[str, Any]
    search_method: str = "bm25"
    highlights: Optional[List[str]] = None

@dataclass
class Document:
    """Document structure for indexing"""
    id: str
    content: str
    metadata: Dict[str, Any]
    tokens: Optional[List[str]] = None

class EnhancedBM25SearchEngine:
    """
    Advanced BM25 search engine with spell correction, query expansion,
    and intelligent preprocessing
    """

    def __init__(self, k1: float = 1.2, b: float = 0.75, epsilon: float = 0.25):
        """
        Initialize BM25 search engine

        Args:
            k1: Controls term frequency saturation point
            b: Controls how much document length normalizes tf values
            epsilon: Floor value for IDF to prevent negative values
        """
        self.k1 = k1
        self.b = b
        self.epsilon = epsilon

        # Initialize NLTK components
        self.stemmer = PorterStemmer()
        self.stop_words = set(stopwords.words('english'))
        self.spell_checker = SpellChecker()

        # Document storage and indexing
        self.documents: Dict[str, Document] = {}
        self.inverted_index: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.document_frequencies: Dict[str, int] = defaultdict(int)
        self.document_lengths: Dict[str, int] = {}
        self.average_document_length: float = 0.0
        self.total_documents: int = 0

        # TF-IDF fallback components
        self.tf_idf_index: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))

        logger.info("Enhanced BM25 Search Engine initialized")

    def _preprocess_text(self, text: str) -> List[str]:
        """
        Advanced text preprocessing with NLTK

        Args:
            text: Raw text to preprocess

        Returns:
            List of processed tokens
        """
        # Convert to lowercase and tokenize
        tokens = word_tokenize(text.lower())

        # Remove non-alphabetic tokens and stopwords
        tokens = [
            self.stemmer.stem(token)
            for token in tokens
            if token.isalpha() and token not in self.stop_words and len(token) > 2
        ]

        return tokens

    def _correct_spelling(self, query: str) -> str:
        """
        Correct spelling errors in query

        Args:
            query: Original query string

        Returns:
            Spell-corrected query
        """
        words = query.split()
        corrected_words = []

        for word in words:
            # Check if word is misspelled
            if word.lower() not in self.spell_checker:
                # Get the most likely correction
                correction = self.spell_checker.correction(word.lower())
                if correction and correction != word.lower():
                    corrected_words.append(correction)
                    logger.debug(f"Spell correction: {word} -> {correction}")
                else:
                    corrected_words.append(word)
            else:
                corrected_words.append(word)

        return " ".join(corrected_words)

    def _expand_query(self, tokens: List[str]) -> List[str]:
        """
        Expand query with synonyms and related terms

        Args:
            tokens: Original query tokens

        Returns:
            Expanded token list
        """
        expanded_tokens = tokens.copy()

        # Simple synonym expansion (can be enhanced with WordNet or custom dictionary)
        synonym_map = {
            'ai': ['artificial', 'intelligence', 'machine', 'learning'],
            'ml': ['machine', 'learning', 'algorithm'],
            'nlp': ['natural', 'language', 'processing', 'text'],
            'api': ['interface', 'endpoint', 'service'],
            'data': ['information', 'dataset', 'content'],
            'search': ['find', 'query', 'retrieve', 'lookup'],
            'document': ['file', 'text', 'content', 'paper'],
        }

        for token in tokens:
            if token in synonym_map:
                # Add synonyms with lower weight
                expanded_tokens.extend(synonym_map[token][:2])  # Limit to 2 synonyms

        return expanded_tokens

    async def index_documents(self, documents: List[Document]) -> None:
        """
        Index documents for BM25 search

        Args:
            documents: List of documents to index
        """
        logger.info(f"Indexing {len(documents)} documents...")

        # Clear existing index
        self.documents.clear()
        self.inverted_index.clear()
        self.document_frequencies.clear()
        self.document_lengths.clear()
        self.tf_idf_index.clear()

        total_length = 0

        for doc in documents:
            # Preprocess document content
            tokens = self._preprocess_text(doc.content)
            doc.tokens = tokens

            # Store document
            self.documents[doc.id] = doc

            # Calculate document length
            doc_length = len(tokens)
            self.document_lengths[doc.id] = doc_length
            total_length += doc_length

            # Build inverted index
            token_counts = Counter(tokens)
            for token, count in token_counts.items():
                self.inverted_index[token][doc.id] = count

            # Update document frequencies
            unique_tokens = set(tokens)
            for token in unique_tokens:
                self.document_frequencies[token] += 1

        # Calculate average document length
        self.total_documents = len(documents)
        self.average_document_length = total_length / self.total_documents if self.total_documents > 0 else 0

        # Build TF-IDF fallback index
        await self._build_tfidf_index()

        logger.info(f"Indexing complete. {self.total_documents} documents indexed.")

    async def _build_tfidf_index(self) -> None:
        """Build TF-IDF index as fallback"""
        for doc_id, doc in self.documents.items():
            doc_length = self.document_lengths[doc_id]
            token_counts = Counter(doc.tokens)

            for token, tf in token_counts.items():
                # Calculate TF-IDF score
                tf_normalized = tf / doc_length
                df = self.document_frequencies[token]
                idf = math.log(self.total_documents / (df + 1))

                self.tf_idf_index[token][doc_id] = tf_normalized * idf

    def _calculate_bm25_score(self, query_tokens: List[str], doc_id: str) -> float:
        """
        Calculate BM25 score for a document given query tokens

        Args:
            query_tokens: Preprocessed query tokens
            doc_id: Document ID to score

        Returns:
            BM25 relevance score
        """
        score = 0.0
        doc_length = self.document_lengths[doc_id]

        for token in query_tokens:
            if token in self.inverted_index and doc_id in self.inverted_index[token]:
                # Term frequency in document
                tf = self.inverted_index[token][doc_id]

                # Document frequency
                df = self.document_frequencies[token]

                # Inverse document frequency
                idf = math.log((self.total_documents - df + 0.5) / (df + 0.5))
                idf = max(self.epsilon, idf)  # Apply epsilon floor

                # BM25 formula
                numerator = tf * (self.k1 + 1)
                denominator = tf + self.k1 * (1 - self.b + self.b * (doc_length / self.average_document_length))

                score += idf * (numerator / denominator)

        return score

    def _calculate_tfidf_score(self, query_tokens: List[str], doc_id: str) -> float:
        """
        Calculate TF-IDF score as fallback

        Args:
            query_tokens: Preprocessed query tokens
            doc_id: Document ID to score

        Returns:
            TF-IDF relevance score
        """
        score = 0.0

        for token in query_tokens:
            if token in self.tf_idf_index and doc_id in self.tf_idf_index[token]:
                score += self.tf_idf_index[token][doc_id]

        return score

    def _generate_highlights(self, content: str, query_tokens: List[str], max_highlights: int = 3) -> List[str]:
        """
        Generate text highlights for search results

        Args:
            content: Document content
            query_tokens: Query tokens to highlight
            max_highlights: Maximum number of highlights

        Returns:
            List of highlighted text snippets
        """
        highlights = []
        content_lower = content.lower()

        for token in query_tokens[:max_highlights]:
            # Find token in content (simple approach)
            start_idx = content_lower.find(token)
            if start_idx != -1:
                # Extract context around the token
                start = max(0, start_idx - 50)
                end = min(len(content), start_idx + len(token) + 50)
                snippet = content[start:end].strip()

                # Highlight the token
                highlighted = snippet.replace(token, f"**{token}**")
                highlights.append(highlighted)

        return highlights

    async def search(self, query: str, top_k: int = 10, use_spell_correction: bool = True,
                    use_query_expansion: bool = True) -> List[SearchResult]:
        """
        Perform BM25 search with enhancements

        Args:
            query: Search query
            top_k: Number of top results to return
            use_spell_correction: Whether to apply spell correction
            use_query_expansion: Whether to expand query with synonyms

        Returns:
            List of search results sorted by relevance
        """
        if not query.strip():
            return []

        if self.total_documents == 0:
            logger.warning("No documents indexed for search")
            return []

        start_time = datetime.now()

        # Apply spell correction if enabled
        if use_spell_correction:
            corrected_query = self._correct_spelling(query)
            if corrected_query != query:
                logger.info(f"Query corrected: '{query}' -> '{corrected_query}'")
                query = corrected_query

        # Preprocess query
        query_tokens = self._preprocess_text(query)

        # Apply query expansion if enabled
        if use_query_expansion:
            expanded_tokens = self._expand_query(query_tokens)
            if len(expanded_tokens) > len(query_tokens):
                logger.debug(f"Query expanded: {len(query_tokens)} -> {len(expanded_tokens)} tokens")
                query_tokens = expanded_tokens

        if not query_tokens:
            logger.warning("No valid tokens in query after preprocessing")
            return []

        # Calculate scores for all documents
        doc_scores = []

        for doc_id in self.documents:
            try:
                # Try BM25 scoring first
                bm25_score = self._calculate_bm25_score(query_tokens, doc_id)

                # Use TF-IDF as fallback if BM25 score is very low
                if bm25_score < 0.1:
                    tfidf_score = self._calculate_tfidf_score(query_tokens, doc_id)
                    score = max(bm25_score, tfidf_score * 0.5)  # Weight TF-IDF lower
                else:
                    score = bm25_score

                if score > 0:
                    doc_scores.append((doc_id, score))

            except Exception as e:
                logger.error(f"Error scoring document {doc_id}: {e}")
                continue

        # Sort by score and take top_k
        doc_scores.sort(key=lambda x: x[1], reverse=True)
        top_docs = doc_scores[:top_k]

        # Create search results
        results = []
        for doc_id, score in top_docs:
            doc = self.documents[doc_id]
            highlights = self._generate_highlights(doc.content, query_tokens)

            result = SearchResult(
                document_id=doc_id,
                content=doc.content,
                score=score,
                metadata=doc.metadata,
                search_method="bm25",
                highlights=highlights
            )
            results.append(result)

        # Log search performance
        search_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"BM25 search completed in {search_time:.3f}s. "
                   f"Query: '{query}' -> {len(results)} results")

        return results

    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the search index

        Returns:
            Dictionary with index statistics
        """
        return {
            "total_documents": self.total_documents,
            "total_tokens": len(self.inverted_index),
            "average_document_length": self.average_document_length,
            "index_size_mb": len(str(self.inverted_index)) / (1024 * 1024),
            "parameters": {
                "k1": self.k1,
                "b": self.b,
                "epsilon": self.epsilon
            }
        }

    async def add_document(self, document: Document) -> None:
        """
        Add a single document to the index

        Args:
            document: Document to add
        """
        # Preprocess document
        tokens = self._preprocess_text(document.content)
        document.tokens = tokens

        # Add to documents
        self.documents[document.id] = document

        # Update document length
        doc_length = len(tokens)
        self.document_lengths[document.id] = doc_length

        # Update inverted index
        token_counts = Counter(tokens)
        for token, count in token_counts.items():
            self.inverted_index[token][document.id] = count

        # Update document frequencies
        unique_tokens = set(tokens)
        for token in unique_tokens:
            self.document_frequencies[token] += 1

        # Update totals
        self.total_documents += 1
        total_length = sum(self.document_lengths.values())
        self.average_document_length = total_length / self.total_documents

        # Update TF-IDF index for this document
        for token, tf in token_counts.items():
            tf_normalized = tf / doc_length
            df = self.document_frequencies[token]
            idf = math.log(self.total_documents / (df + 1))
            self.tf_idf_index[token][document.id] = tf_normalized * idf

        logger.debug(f"Document {document.id} added to index")

    async def remove_document(self, document_id: str) -> bool:
        """
        Remove a document from the index

        Args:
            document_id: ID of document to remove

        Returns:
            True if document was removed, False if not found
        """
        if document_id not in self.documents:
            return False

        doc = self.documents[document_id]

        # Remove from inverted index and update document frequencies
        for token in set(doc.tokens or []):
            if token in self.inverted_index and document_id in self.inverted_index[token]:
                del self.inverted_index[token][document_id]
                self.document_frequencies[token] -= 1

                # Remove token entirely if no documents contain it
                if self.document_frequencies[token] == 0:
                    del self.document_frequencies[token]
                    del self.inverted_index[token]

            # Remove from TF-IDF index
            if token in self.tf_idf_index and document_id in self.tf_idf_index[token]:
                del self.tf_idf_index[token][document_id]

        # Remove document
        del self.documents[document_id]
        del self.document_lengths[document_id]

        # Update totals
        self.total_documents -= 1
        if self.total_documents > 0:
            total_length = sum(self.document_lengths.values())
            self.average_document_length = total_length / self.total_documents
        else:
            self.average_document_length = 0.0

        logger.debug(f"Document {document_id} removed from index")
        return True


# Global instance for use across the application
bm25_search_engine = EnhancedBM25SearchEngine()
