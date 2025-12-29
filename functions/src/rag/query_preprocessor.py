"""
Query Preprocessor for Enhanced Search Capabilities
"""
import logging
import re
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass
from datetime import datetime

from spellchecker import SpellChecker
import nltk
from nltk.corpus import wordnet
from nltk.tokenize import word_tokenize

from .text_preprocessing import text_preprocessor

# Download required NLTK data
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

logger = logging.getLogger(__name__)

@dataclass
class EnhancedQuery:
    """Enhanced query with preprocessing results"""
    original: str
    corrected: str
    tokens: List[str]
    expanded_tokens: List[str]
    intent: str
    metadata: Dict[str, Any]

class QueryPreprocessor:
    """
    Advanced query preprocessing with spell correction,
    expansion, and intent classification
    """

    def __init__(self):
        """Initialize query preprocessor"""
        self.spell_checker = SpellChecker()
        if text_preprocessor is None:
            raise RuntimeError("TextPreprocessor failed to initialize")
        self.text_preprocessor = text_preprocessor

        # Domain-specific synonyms
        self.domain_synonyms = {
            # AI/ML terms
            'ai': ['artificial intelligence', 'machine intelligence'],
            'ml': ['machine learning', 'automated learning'],
            'nlp': ['natural language processing', 'text processing', 'language ai'],
            'neural network': ['deep learning', 'neural net', 'deep neural network'],
            'model': ['algorithm', 'system', 'framework'],

            # Document terms
            'document': ['file', 'text', 'content', 'paper'],
            'pdf': ['document', 'file', 'paper'],
            'text': ['content', 'document', 'information'],

            # Search terms
            'search': ['find', 'query', 'retrieve', 'lookup'],
            'similar': ['like', 'related', 'resembling', 'analogous'],
            'relevant': ['pertinent', 'applicable', 'related'],

            # Technical terms
            'api': ['interface', 'endpoint', 'service'],
            'function': ['method', 'procedure', 'routine'],
            'database': ['db', 'data store', 'repository'],
            'code': ['program', 'script', 'source'],

            # Action terms
            'create': ['generate', 'make', 'produce'],
            'update': ['modify', 'change', 'edit'],
            'delete': ['remove', 'erase', 'eliminate'],
            'analyze': ['examine', 'study', 'investigate'],
        }

        # Intent patterns
        self.intent_patterns = {
            'factual': [
                r'what is', r'how (does|do|can)', r'explain', r'define',
                r'tell me about', r'describe', r'who is', r'when'
            ],
            'procedural': [
                r'how to', r'steps to', r'guide for', r'tutorial',
                r'instructions', r'process for'
            ],
            'comparative': [
                r'compare', r'versus', r'vs', r'difference between',
                r'better', r'best', r'worst', r'pros and cons'
            ],
            'exploratory': [
                r'explore', r'discover', r'find', r'search for',
                r'looking for', r'seeking', r'need information'
            ],
            'specific': [
                r'exact', r'specific', r'precisely', r'exactly',
                r'particular', r'named', r'identified'
            ]
        }

        logger.info("Query preprocessor initialized")

    def correct_spelling(self, query: str) -> Tuple[str, bool]:
        """
        Correct spelling errors in query

        Args:
            query: Original query string

        Returns:
            Tuple of (corrected query, was_corrected)
        """
        words = query.split()
        corrected_words = []
        was_corrected = False

        for word in words:
            # Skip very short words, numbers, and special terms
            if len(word) <= 2 or word.isdigit() or word.lower() in self.domain_synonyms:
                corrected_words.append(word)
                continue

            # Check if word is misspelled
            if word.lower() not in self.spell_checker:
                # Get the most likely correction
                correction = self.spell_checker.correction(word.lower())
                if correction and correction != word.lower():
                    corrected_words.append(correction)
                    was_corrected = True
                    logger.debug(f"Spell correction: {word} -> {correction}")
                else:
                    corrected_words.append(word)
            else:
                corrected_words.append(word)

        corrected_query = " ".join(corrected_words)
        return corrected_query, was_corrected

    def expand_query(self, query: str, tokens: List[str]) -> List[str]:
        """
        Expand query with synonyms and related terms

        Args:
            query: Original or corrected query
            tokens: Preprocessed query tokens

        Returns:
            Expanded token list
        """
        expanded_tokens = tokens.copy()

        # Check domain-specific synonyms
        for token in tokens:
            if token in self.domain_synonyms:
                # Add domain-specific synonyms
                for synonym in self.domain_synonyms[token][:2]:  # Limit to 2 synonyms
                    synonym_tokens = self.text_preprocessor.preprocess_query(synonym)
                    expanded_tokens.extend(synonym_tokens)

        # Check for multi-word terms in the query
        for term, synonyms in self.domain_synonyms.items():
            if ' ' in term and term in query.lower():
                # Add synonyms for multi-word terms
                for synonym in synonyms[:1]:  # Limit to 1 synonym for multi-word terms
                    synonym_tokens = self.text_preprocessor.preprocess_query(synonym)
                    expanded_tokens.extend(synonym_tokens)

        # Add WordNet synonyms for important terms
        for token in tokens:
            # Skip very short words and common terms
            if len(token) <= 3:
                continue

            # Get WordNet synonyms
            wordnet_synonyms = set()
            for syn in wordnet.synsets(token)[:2]:  # Limit to first 2 synsets
                for lemma in syn.lemmas()[:1]:  # Limit to first lemma
                    synonym = lemma.name().lower().replace('_', ' ')
                    if synonym != token and len(synonym) > 3:
                        wordnet_synonyms.add(synonym)

            # Add top 2 synonyms
            for synonym in list(wordnet_synonyms)[:2]:
                synonym_tokens = self.text_preprocessor.preprocess_query(synonym)
                expanded_tokens.extend(synonym_tokens)

        # Remove duplicates while preserving order
        seen = set()
        unique_expanded = []
        for token in expanded_tokens:
            if token not in seen:
                seen.add(token)
                unique_expanded.append(token)

        return unique_expanded

    def classify_intent(self, query: str) -> str:
        """
        Classify query intent

        Args:
            query: Query string

        Returns:
            Intent classification
        """
        query_lower = query.lower()

        # Check patterns for each intent
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    return intent

        # Default to exploratory if no patterns match
        return "exploratory"

    def extract_metadata(self, query: str) -> Dict[str, Any]:
        """
        Extract metadata from query

        Args:
            query: Query string

        Returns:
            Metadata dictionary
        """
        metadata = {
            "length": len(query),
            "word_count": len(query.split()),
            "has_question": "?" in query,
            "entities": []
        }

        # Extract entities
        try:
            entities = self.text_preprocessor.extract_entities(query)
            metadata["entities"] = entities
        except Exception as e:
            logger.warning(f"Error extracting entities: {e}")

        return metadata

    async def preprocess_query(self, query: str) -> EnhancedQuery:
        """
        Comprehensive query preprocessing

        Args:
            query: Original query string

        Returns:
            Enhanced query object
        """
        # Apply spell correction
        corrected_query, was_corrected = self.correct_spelling(query)

        # Tokenize and preprocess
        tokens = self.text_preprocessor.preprocess_query(corrected_query)

        # Expand query
        expanded_tokens = self.expand_query(corrected_query, tokens)

        # Classify intent
        intent = self.classify_intent(corrected_query)

        # Extract metadata
        metadata = self.extract_metadata(corrected_query)
        metadata["was_corrected"] = was_corrected
        metadata["original_token_count"] = len(tokens)
        metadata["expanded_token_count"] = len(expanded_tokens)
        metadata["intent"] = intent

        # Create enhanced query
        enhanced_query = EnhancedQuery(
            original=query,
            corrected=corrected_query,
            tokens=tokens,
            expanded_tokens=expanded_tokens,
            intent=intent,
            metadata=metadata
        )

        return enhanced_query


# Global instance for use across the application
query_preprocessor = QueryPreprocessor()
