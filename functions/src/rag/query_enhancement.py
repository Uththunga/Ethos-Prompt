"""
Query Enhancement Pipeline with Spell Correction, Expansion, and Intent Classification
"""
import logging
import re
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass
from datetime import datetime
import asyncio

from spellchecker import SpellChecker
import nltk
from nltk.corpus import wordnet

from .query_preprocessor import query_preprocessor, EnhancedQuery
from .text_preprocessing import text_preprocessor

logger = logging.getLogger(__name__)

@dataclass
class QueryExpansion:
    """Query expansion result"""
    original_terms: List[str]
    expanded_terms: List[str]
    synonyms: Dict[str, List[str]]
    related_terms: List[str]
    expansion_score: float

@dataclass
class IntentClassification:
    """Intent classification result"""
    intent: str
    confidence: float
    sub_intent: Optional[str]
    reasoning: str

@dataclass
class EnhancedQueryResult:
    """Complete query enhancement result"""
    original_query: str
    corrected_query: str
    enhanced_query: EnhancedQuery
    expansion: QueryExpansion
    intent_classification: IntentClassification
    processing_time: float
    metadata: Dict[str, Any]

class QueryEnhancementPipeline:
    """
    Comprehensive query enhancement pipeline with spell correction,
    expansion, and intent classification
    """

    def __init__(self):
        """Initialize query enhancement pipeline"""
        self.query_preprocessor = query_preprocessor
        self.text_preprocessor = text_preprocessor
        self.spell_checker = SpellChecker()

        # Enhanced intent patterns with confidence scoring
        self.intent_patterns: Dict[str, Dict[str, Any]] = {
            'factual': {
                'patterns': [
                    r'what is', r'what are', r'define', r'definition of',
                    r'explain', r'describe', r'tell me about',
                    r'who is', r'who are', r'when', r'where', r'why',
                    r'how does', r'how do', r'how can'
                ],
                'keywords': ['definition', 'explanation', 'meaning', 'concept'],
                'confidence_boost': 0.2
            },
            'procedural': {
                'patterns': [
                    r'how to', r'steps to', r'guide for', r'tutorial',
                    r'instructions', r'process for', r'method to',
                    r'way to', r'procedure'
                ],
                'keywords': ['steps', 'guide', 'tutorial', 'instructions', 'process'],
                'confidence_boost': 0.3
            },
            'comparative': {
                'patterns': [
                    r'compare', r'versus', r'vs', r'difference between',
                    r'better than', r'best', r'worst', r'pros and cons',
                    r'advantages', r'disadvantages'
                ],
                'keywords': ['compare', 'versus', 'difference', 'better', 'best'],
                'confidence_boost': 0.25
            },
            'exploratory': {
                'patterns': [
                    r'explore', r'discover', r'find', r'search for',
                    r'looking for', r'seeking', r'need information',
                    r'learn about', r'understand'
                ],
                'keywords': ['explore', 'discover', 'find', 'learn'],
                'confidence_boost': 0.1
            },
            'specific': {
                'patterns': [
                    r'exact', r'specific', r'precisely', r'exactly',
                    r'particular', r'named', r'identified',
                    r'show me', r'give me'
                ],
                'keywords': ['exact', 'specific', 'particular', 'precise'],
                'confidence_boost': 0.2
            },
            'analytical': {
                'patterns': [
                    r'analyze', r'analysis', r'examine', r'study',
                    r'investigate', r'research', r'evaluate',
                    r'assess', r'review'
                ],
                'keywords': ['analyze', 'analysis', 'examine', 'study'],
                'confidence_boost': 0.2
            }
        }

        # Domain-specific term expansion
        self.domain_expansions = {
            'technology': {
                'ai': ['artificial intelligence', 'machine intelligence', 'cognitive computing'],
                'ml': ['machine learning', 'automated learning', 'statistical learning'],
                'nlp': ['natural language processing', 'text processing', 'language ai'],
                'api': ['application programming interface', 'web service', 'endpoint'],
                'database': ['data store', 'repository', 'data warehouse'],
            },
            'business': {
                'roi': ['return on investment', 'profitability', 'investment return'],
                'kpi': ['key performance indicator', 'metric', 'performance measure'],
                'crm': ['customer relationship management', 'customer management'],
                'erp': ['enterprise resource planning', 'business system'],
            },
            'academic': {
                'research': ['study', 'investigation', 'analysis', 'examination'],
                'methodology': ['approach', 'method', 'technique', 'procedure'],
                'hypothesis': ['theory', 'assumption', 'proposition'],
                'analysis': ['examination', 'evaluation', 'assessment'],
            }
        }

        logger.info("Query enhancement pipeline initialized")

    def _advanced_spell_correction(self, query: str) -> Tuple[str, Dict[str, str]]:
        """
        Advanced spell correction with context awareness

        Args:
            query: Original query

        Returns:
            Tuple of (corrected_query, corrections_made)
        """
        words = query.split()
        corrected_words = []
        corrections = {}

        for i, word in enumerate(words):
            # Skip very short words, numbers, and technical terms
            if len(word) <= 2 or word.isdigit():
                corrected_words.append(word)
                continue

            # Check if word is in technical terms (preserve them)
            word_lower = word.lower()
            is_technical = any(
                word_lower in expansions
                for expansions in self.domain_expansions.values()
            )

            if is_technical:
                corrected_words.append(word)
                continue

            # Check spelling
            if word_lower not in self.spell_checker:
                # Get candidates
                candidates = self.spell_checker.candidates(word_lower)

                if candidates:
                    # Use context to select best candidate
                    best_candidate = self._select_best_candidate(
                        word_lower, candidates, words, i
                    )

                    if best_candidate and best_candidate != word_lower:
                        corrected_words.append(best_candidate)
                        corrections[word] = best_candidate
                        logger.debug(f"Spell correction: {word} -> {best_candidate}")
                    else:
                        corrected_words.append(word)
                else:
                    corrected_words.append(word)
            else:
                corrected_words.append(word)

        corrected_query = " ".join(corrected_words)
        return corrected_query, corrections

    def _select_best_candidate(self, word: str, candidates: Set[str],
                              context_words: List[str], position: int) -> str:
        """
        Select best spelling correction candidate using context

        Args:
            word: Original word
            candidates: Spelling candidates
            context_words: All words in query
            position: Position of word in query

        Returns:
            Best candidate
        """
        if not candidates:
            return word

        # If only one candidate, use it
        if len(candidates) == 1:
            return list(candidates)[0]

        # Score candidates based on context
        candidate_scores = {}

        for candidate in candidates:
            score = 0.0

            # Check if candidate appears in domain expansions
            for domain_terms in self.domain_expansions.values():
                if candidate in domain_terms:
                    score += 2
                    break

            # Check context similarity (simple approach)
            for context_word in context_words:
                if context_word.lower() != word and len(context_word) > 2:
                    # Simple character overlap scoring
                    overlap = len(set(candidate) & set(context_word.lower()))
                    score += overlap * 0.1

            candidate_scores[candidate] = score

        # Return candidate with highest score
        best_candidate = max(candidate_scores.items(), key=lambda x: x[1])[0]
        return best_candidate

    def _expand_query_terms(self, tokens: List[str], query: str) -> QueryExpansion:
        """
        Expand query terms with synonyms and related terms

        Args:
            tokens: Query tokens
            query: Original query

        Returns:
            Query expansion result
        """
        expanded_terms = tokens.copy()
        synonyms = {}
        related_terms = []

        # Domain-specific expansion
        for token in tokens:
            token_lower = token.lower()

            # Check domain expansions
            for domain, expansions in self.domain_expansions.items():
                if token_lower in expansions:
                    domain_synonyms = expansions[token_lower][:2]  # Limit to 2
                    synonyms[token] = domain_synonyms
                    expanded_terms.extend(domain_synonyms)
                    break

        # WordNet expansion for non-technical terms
        for token in tokens:
            if token not in synonyms and len(token) > 3:
                wordnet_synonyms = []

                # Get WordNet synonyms
                for syn in wordnet.synsets(token)[:2]:  # Limit to 2 synsets
                    for lemma in syn.lemmas()[:1]:  # Limit to 1 lemma per synset
                        synonym = lemma.name().lower().replace('_', ' ')
                        if synonym != token and len(synonym) > 2:
                            wordnet_synonyms.append(synonym)

                if wordnet_synonyms:
                    synonyms[token] = wordnet_synonyms
                    expanded_terms.extend(wordnet_synonyms)

        # Add related terms based on query context
        query_lower = query.lower()

        # Technology context
        if any(term in query_lower for term in ['ai', 'ml', 'algorithm', 'data', 'tech']):
            related_terms.extend(['technology', 'digital', 'automated'])

        # Business context
        if any(term in query_lower for term in ['business', 'company', 'market', 'sales']):
            related_terms.extend(['commercial', 'enterprise', 'corporate'])

        # Academic context
        if any(term in query_lower for term in ['research', 'study', 'analysis', 'paper']):
            related_terms.extend(['academic', 'scholarly', 'scientific'])

        # Calculate expansion score
        original_count = len(tokens)
        expanded_count = len(expanded_terms)
        expansion_score = (expanded_count - original_count) / original_count if original_count > 0 else 0

        return QueryExpansion(
            original_terms=tokens,
            expanded_terms=expanded_terms,
            synonyms=synonyms,
            related_terms=related_terms,
            expansion_score=expansion_score
        )

    def _classify_intent_advanced(self, query: str) -> IntentClassification:
        """
        Advanced intent classification with confidence scoring

        Args:
            query: Query string

        Returns:
            Intent classification result
        """
        query_lower = query.lower()
        intent_scores = {}

        # Score each intent
        for intent, config in self.intent_patterns.items():
            score = 0.0
            matched_patterns = []

            # Check patterns
            for pattern in config['patterns']:
                if re.search(pattern, query_lower):
                    score += 1
                    matched_patterns.append(pattern)

            # Check keywords
            for keyword in config['keywords']:
                if keyword in query_lower:
                    score += 0.5

            # Apply confidence boost
            if score > 0:
                score += config['confidence_boost']

            intent_scores[intent] = score

        # Find best intent
        if not intent_scores or max(intent_scores.values()) == 0:
            return IntentClassification(
                intent="exploratory",
                confidence=0.5,
                sub_intent=None,
                reasoning="No specific patterns matched, defaulting to exploratory"
            )

        best_intent = max(intent_scores.items(), key=lambda x: x[1])
        intent_name = best_intent[0]
        raw_score = best_intent[1]

        # Normalize confidence
        max_possible_score = len(self.intent_patterns[intent_name]['patterns']) + \
                           len(self.intent_patterns[intent_name]['keywords']) * 0.5 + \
                           self.intent_patterns[intent_name]['confidence_boost']

        confidence = min(1.0, raw_score / max_possible_score)

        # Determine sub-intent
        sub_intent = None
        if intent_name == "factual" and "definition" in query_lower:
            sub_intent = "definition"
        elif intent_name == "procedural" and "tutorial" in query_lower:
            sub_intent = "tutorial"
        elif intent_name == "comparative" and "best" in query_lower:
            sub_intent = "recommendation"

        reasoning = f"Matched patterns with score {raw_score:.2f}"

        return IntentClassification(
            intent=intent_name,
            confidence=confidence,
            sub_intent=sub_intent,
            reasoning=reasoning
        )

    async def enhance_query(self, query: str) -> EnhancedQueryResult:
        """
        Comprehensive query enhancement

        Args:
            query: Original query string

        Returns:
            Enhanced query result
        """
        start_time = datetime.now()

        # Step 1: Advanced spell correction
        corrected_query, corrections = self._advanced_spell_correction(query)

        # Step 2: Basic preprocessing
        enhanced_query = await self.query_preprocessor.preprocess_query(corrected_query)

        # Step 3: Advanced query expansion
        expansion = self._expand_query_terms(enhanced_query.tokens, corrected_query)

        # Step 4: Advanced intent classification
        intent_classification = self._classify_intent_advanced(corrected_query)

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()

        # Compile metadata
        metadata = {
            "corrections_made": corrections,
            "expansion_ratio": expansion.expansion_score,
            "intent_confidence": intent_classification.confidence,
            "processing_time": processing_time,
            "enhancement_features": {
                "spell_correction": len(corrections) > 0,
                "query_expansion": expansion.expansion_score > 0,
                "intent_classification": intent_classification.confidence > 0.7
            }
        }

        result = EnhancedQueryResult(
            original_query=query,
            corrected_query=corrected_query,
            enhanced_query=enhanced_query,
            expansion=expansion,
            intent_classification=intent_classification,
            processing_time=processing_time,
            metadata=metadata
        )

        logger.info(f"Query enhanced in {processing_time:.3f}s: "
                   f"'{query}' -> intent: {intent_classification.intent} "
                   f"(confidence: {intent_classification.confidence:.2f})")

        return result


# Global instance for use across the application
query_enhancement_pipeline = QueryEnhancementPipeline()
