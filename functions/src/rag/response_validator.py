"""
Response Quality Validation - Comprehensive response quality assessment and validation
"""
import logging
import re
import json
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    is_valid: bool
    confidence_score: float
    quality_metrics: Dict[str, float]
    issues: List[str]
    suggestions: List[str]
    metadata: Dict[str, Any]

@dataclass
class QualityMetrics:
    relevance: float
    accuracy: float
    completeness: float
    coherence: float
    clarity: float
    factual_consistency: float
    source_attribution: float
    overall_score: float

class ResponseValidator:
    """
    Comprehensive response quality validation and assessment
    """

    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager

        # Quality thresholds
        self.quality_thresholds = {
            'minimum_acceptable': 0.6,
            'good_quality': 0.75,
            'excellent_quality': 0.9
        }

        # Validation rules
        self.validation_rules = {
            'min_length': 10,
            'max_length': 5000,
            'min_sentences': 1,
            'max_repetition_ratio': 0.3,
            'min_source_coverage': 0.4,
            'max_hallucination_indicators': 3
        }

        # Quality weights for overall score calculation
        self.quality_weights = {
            'relevance': 0.25,
            'accuracy': 0.20,
            'completeness': 0.15,
            'coherence': 0.15,
            'clarity': 0.10,
            'factual_consistency': 0.10,
            'source_attribution': 0.05
        }

        # Hallucination indicators
        self.hallucination_indicators = [
            r'\b(I think|I believe|probably|maybe|might be|could be)\b',
            r'\b(according to my knowledge|as far as I know)\b',
            r'\b(it seems|appears to be|looks like)\b',
            r'\b(I\'m not sure|uncertain|unclear)\b'
        ]

        # Factual consistency patterns
        self.inconsistency_patterns = [
            r'\b(but|however|although|despite)\s+.*\b(but|however|although|despite)\b',
            r'\b(yes|true|correct)\s+.*\b(no|false|incorrect)\b',
            r'\b(always|never)\s+.*\b(sometimes|occasionally)\b'
        ]

    async def validate_response(
        self,
        response: str,
        query: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        conversation_context: Optional[List[str]] = None
    ) -> ValidationResult:
        """
        Comprehensive response validation
        """
        try:
            # Basic validation checks
            basic_issues = self._check_basic_requirements(response)

            # Calculate quality metrics
            quality_metrics = await self._calculate_quality_metrics(
                response, query, sources, conversation_context
            )

            # Check for specific issues
            content_issues = self._check_content_quality(response, sources)
            consistency_issues = self._check_factual_consistency(response)
            hallucination_issues = self._check_hallucination_indicators(response)

            # Combine all issues
            all_issues = basic_issues + content_issues + consistency_issues + hallucination_issues

            # Calculate overall confidence
            confidence_score = self._calculate_confidence_score(quality_metrics, len(all_issues))

            # Determine if response is valid
            is_valid = (
                confidence_score >= self.quality_thresholds['minimum_acceptable'] and
                len(all_issues) <= 3
            )

            # Generate suggestions
            suggestions = self._generate_suggestions(quality_metrics, all_issues)

            return ValidationResult(
                is_valid=is_valid,
                confidence_score=confidence_score,
                quality_metrics=quality_metrics.__dict__,
                issues=all_issues,
                suggestions=suggestions,
                metadata={
                    'validation_time': datetime.now().isoformat(),
                    'response_length': len(response),
                    'source_count': len(sources) if sources else 0,
                    'has_conversation_context': bool(conversation_context)
                }
            )

        except Exception as e:
            logger.error(f"Response validation failed: {e}")
            return ValidationResult(
                is_valid=False,
                confidence_score=0.0,
                quality_metrics={},
                issues=[f"Validation error: {str(e)}"],
                suggestions=["Please try regenerating the response"],
                metadata={'error': str(e)}
            )

    def _check_basic_requirements(self, response: str) -> List[str]:
        """Check basic response requirements"""
        issues = []

        # Length checks
        if len(response) < self.validation_rules['min_length']:
            issues.append(f"Response too short (minimum {self.validation_rules['min_length']} characters)")

        if len(response) > self.validation_rules['max_length']:
            issues.append(f"Response too long (maximum {self.validation_rules['max_length']} characters)")

        # Sentence count
        sentences = [s.strip() for s in response.split('.') if s.strip()]
        if len(sentences) < self.validation_rules['min_sentences']:
            issues.append("Response should contain at least one complete sentence")

        # Check for excessive repetition
        words = response.lower().split()
        if len(words) > 0:
            # Count words in generated response
            word_counts: Dict[str, int] = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1

            max_repetition = max(word_counts.values()) / len(words)
            if max_repetition > self.validation_rules['max_repetition_ratio']:
                issues.append("Response contains excessive word repetition")

        # Check for empty or placeholder content
        if not response.strip() or response.strip().lower() in ['none', 'n/a', 'not available']:
            issues.append("Response appears to be empty or placeholder content")

        return issues

    async def _calculate_quality_metrics(
        self,
        response: str,
        query: str,
        sources: Optional[List[Dict[str, Any]]] = None,
        conversation_context: Optional[List[str]] = None
    ) -> QualityMetrics:
        """Calculate comprehensive quality metrics"""

        # Relevance: How well does the response address the query
        relevance = self._calculate_relevance(response, query)

        # Accuracy: Based on source alignment and factual consistency
        accuracy = self._calculate_accuracy(response, sources)

        # Completeness: How thoroughly the query is answered
        completeness = self._calculate_completeness(response, query, sources)

        # Coherence: Logical flow and structure
        coherence = self._calculate_coherence(response)

        # Clarity: Readability and understandability
        clarity = self._calculate_clarity(response)

        # Factual consistency: Internal consistency of facts
        factual_consistency = self._calculate_factual_consistency(response)

        # Source attribution: How well sources are referenced
        source_attribution = self._calculate_source_attribution(response, sources)

        # Calculate overall score
        overall_score = (
            relevance * self.quality_weights['relevance'] +
            accuracy * self.quality_weights['accuracy'] +
            completeness * self.quality_weights['completeness'] +
            coherence * self.quality_weights['coherence'] +
            clarity * self.quality_weights['clarity'] +
            factual_consistency * self.quality_weights['factual_consistency'] +
            source_attribution * self.quality_weights['source_attribution']
        )

        return QualityMetrics(
            relevance=relevance,
            accuracy=accuracy,
            completeness=completeness,
            coherence=coherence,
            clarity=clarity,
            factual_consistency=factual_consistency,
            source_attribution=source_attribution,
            overall_score=overall_score
        )

    def _calculate_relevance(self, response: str, query: str) -> float:
        """Calculate relevance score between response and query"""
        query_terms = set(re.findall(r'\b\w+\b', query.lower()))
        response_terms = set(re.findall(r'\b\w+\b', response.lower()))

        if not query_terms:
            return 0.0

        # Calculate term overlap
        overlap = len(query_terms.intersection(response_terms))
        relevance = overlap / len(query_terms)

        # Boost score if response directly addresses query intent
        if any(indicator in response.lower() for indicator in ['answer', 'solution', 'result']):
            relevance = min(1.0, relevance + 0.1)

        return relevance

    def _calculate_accuracy(self, response: str, sources: Optional[List[Dict[str, Any]]] = None) -> float:
        """Calculate accuracy based on source alignment"""
        if not sources:
            return 0.5  # Neutral score when no sources available

        # Extract key facts from sources
        source_facts = set()
        for source in sources:
            content = source.get('content', '')
            # Simple fact extraction (in production, use more sophisticated NLP)
            facts = re.findall(r'\b[A-Z][a-z]+\s+(?:is|are|was|were|has|have)\s+\w+', content)
            source_facts.update(facts)

        # Check how many source facts are reflected in the response
        response_lower = response.lower()
        supported_facts = sum(1 for fact in source_facts if fact.lower() in response_lower)

        if not source_facts:
            return 0.7  # Default score when no extractable facts

        return supported_facts / len(source_facts)

    def _calculate_completeness(self, response: str, query: str, sources: Optional[List[Dict[str, Any]]] = None) -> float:
        """Calculate completeness of the response"""
        # Check if response addresses different aspects of the query
        query_aspects = []

        # Identify question words and aspects
        if 'what' in query.lower():
            query_aspects.append('definition')
        if 'how' in query.lower():
            query_aspects.append('process')
        if 'why' in query.lower():
            query_aspects.append('reason')
        if 'when' in query.lower():
            query_aspects.append('time')
        if 'where' in query.lower():
            query_aspects.append('location')

        if not query_aspects:
            query_aspects = ['general']

        # Check if response addresses these aspects
        addressed_aspects = 0
        response_lower = response.lower()

        for aspect in query_aspects:
            if aspect == 'definition' and any(word in response_lower for word in ['is', 'are', 'means', 'refers']):
                addressed_aspects += 1
            elif aspect == 'process' and any(word in response_lower for word in ['step', 'process', 'method', 'way']):
                addressed_aspects += 1
            elif aspect == 'reason' and any(word in response_lower for word in ['because', 'due to', 'reason', 'cause']):
                addressed_aspects += 1
            elif aspect == 'time' and any(word in response_lower for word in ['when', 'time', 'date', 'period']):
                addressed_aspects += 1
            elif aspect == 'location' and any(word in response_lower for word in ['where', 'location', 'place', 'at']):
                addressed_aspects += 1
            elif aspect == 'general':
                addressed_aspects += 1

        return addressed_aspects / len(query_aspects)

    def _calculate_coherence(self, response: str) -> float:
        """Calculate coherence and logical flow"""
        sentences = [s.strip() for s in response.split('.') if s.strip()]

        if len(sentences) <= 1:
            return 1.0  # Single sentence is coherent by default

        # Check for transition words and logical connectors
        transition_words = ['however', 'therefore', 'furthermore', 'additionally', 'moreover', 'consequently', 'thus', 'hence']
        transitions_found = sum(1 for sentence in sentences for word in transition_words if word in sentence.lower())

        # Check for consistent tense usage
        past_tense_indicators = len(re.findall(r'\b\w+ed\b|\bwas\b|\bwere\b', response))
        present_tense_indicators = len(re.findall(r'\bis\b|\bare\b|\bhas\b|\bhave\b', response))

        tense_consistency = 1.0
        if past_tense_indicators > 0 and present_tense_indicators > 0:
            total_indicators = past_tense_indicators + present_tense_indicators
            dominant_tense = max(past_tense_indicators, present_tense_indicators)
            tense_consistency = dominant_tense / total_indicators

        # Combine metrics
        transition_score = min(1.0, transitions_found / max(1, len(sentences) - 1))
        coherence = (transition_score * 0.4) + (tense_consistency * 0.6)

        return coherence

    def _calculate_clarity(self, response: str) -> float:
        """Calculate clarity and readability"""
        words = re.findall(r'\b\w+\b', response)
        sentences = [s.strip() for s in response.split('.') if s.strip()]

        if not words or not sentences:
            return 0.0

        # Average sentence length (optimal is around 15-20 words)
        avg_sentence_length = len(words) / len(sentences)
        length_score = 1.0 - abs(avg_sentence_length - 17.5) / 17.5
        length_score = max(0.0, min(1.0, length_score))

        # Average word length (shorter words are generally clearer)
        avg_word_length = sum(len(word) for word in words) / len(words)
        word_score = 1.0 - (avg_word_length - 5) / 10  # Optimal around 5 characters
        word_score = max(0.0, min(1.0, word_score))

        # Check for jargon and complex terms
        complex_words = [word for word in words if len(word) > 12]
        complexity_penalty = len(complex_words) / len(words)

        clarity = (length_score * 0.4) + (word_score * 0.4) + ((1 - complexity_penalty) * 0.2)

        return clarity

    def _calculate_factual_consistency(self, response: str) -> float:
        """Check for internal factual consistency"""
        # Look for contradictory statements
        contradictions = 0

        for pattern in self.inconsistency_patterns:
            matches = re.findall(pattern, response, re.IGNORECASE)
            contradictions += len(matches)

        # Penalty for contradictions
        consistency_score = max(0.0, 1.0 - (contradictions * 0.2))

        return consistency_score

    def _calculate_source_attribution(self, response: str, sources: Optional[List[Dict[str, Any]]] = None) -> float:
        """Calculate how well sources are attributed"""
        if not sources:
            return 1.0  # No penalty if no sources provided

        # Look for source references in the response
        source_indicators = ['according to', 'based on', 'source', 'document', 'reference']
        attribution_found = any(indicator in response.lower() for indicator in source_indicators)

        # Check if specific source information is mentioned
        source_names = [source.get('metadata', {}).get('filename', '') for source in sources]
        source_names = [name for name in source_names if name]

        specific_attribution = any(name.lower() in response.lower() for name in source_names)

        if specific_attribution:
            return 1.0
        elif attribution_found:
            return 0.7
        else:
            return 0.3

    def _check_content_quality(self, response: str, sources: Optional[List[Dict[str, Any]]] = None) -> List[str]:
        """Check for content quality issues"""
        issues = []

        # Check for vague or non-committal language
        vague_patterns = [
            r'\b(might|could|possibly|perhaps|maybe)\b',
            r'\b(some|many|few|several)\s+(?:people|experts|studies)\b',
            r'\b(it depends|varies|different)\b'
        ]

        vague_count = sum(len(re.findall(pattern, response, re.IGNORECASE)) for pattern in vague_patterns)
        if vague_count > 3:
            issues.append("Response contains excessive vague or non-committal language")

        # Check for source coverage
        if sources:
            source_content = ' '.join([source.get('content', '') for source in sources])
            source_terms = set(re.findall(r'\b\w+\b', source_content.lower()))
            response_terms = set(re.findall(r'\b\w+\b', response.lower()))

            if source_terms:
                coverage = len(source_terms.intersection(response_terms)) / len(source_terms)
                if coverage < self.validation_rules['min_source_coverage']:
                    issues.append("Response doesn't adequately utilize provided sources")

        return issues

    def _check_factual_consistency(self, response: str) -> List[str]:
        """Check for factual consistency issues"""
        issues = []

        # Check for contradictory statements
        for pattern in self.inconsistency_patterns:
            if re.search(pattern, response, re.IGNORECASE):
                issues.append("Response contains potentially contradictory statements")
                break

        return issues

    def _check_hallucination_indicators(self, response: str) -> List[str]:
        """Check for potential hallucination indicators"""
        issues = []

        hallucination_count = 0
        for pattern in self.hallucination_indicators:
            matches = re.findall(pattern, response, re.IGNORECASE)
            hallucination_count += len(matches)

        if hallucination_count > self.validation_rules['max_hallucination_indicators']:
            issues.append("Response contains indicators of potential hallucination or uncertainty")

        return issues

    def _calculate_confidence_score(self, quality_metrics: QualityMetrics, issue_count: int) -> float:
        """Calculate overall confidence score"""
        # Start with quality-based score
        base_score = quality_metrics.overall_score

        # Apply penalty for issues
        issue_penalty = min(0.5, issue_count * 0.1)
        confidence = base_score - issue_penalty

        return max(0.0, min(1.0, confidence))

    def _generate_suggestions(self, quality_metrics: QualityMetrics, issues: List[str]) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []

        # Quality-based suggestions
        if quality_metrics.relevance < 0.7:
            suggestions.append("Improve relevance by addressing the query more directly")

        if quality_metrics.completeness < 0.7:
            suggestions.append("Provide a more complete answer covering all aspects of the question")

        if quality_metrics.clarity < 0.7:
            suggestions.append("Improve clarity by using simpler language and shorter sentences")

        if quality_metrics.source_attribution < 0.5:
            suggestions.append("Better attribute information to sources")

        # Issue-based suggestions
        if any("repetition" in issue for issue in issues):
            suggestions.append("Reduce word repetition for better readability")

        if any("short" in issue for issue in issues):
            suggestions.append("Expand the response with more detailed information")

        if any("vague" in issue for issue in issues):
            suggestions.append("Use more specific and definitive language")

        return suggestions

    def get_quality_report(self, validation_result: ValidationResult) -> Dict[str, Any]:
        """Generate a comprehensive quality report"""
        quality_level = "Poor"
        if validation_result.confidence_score >= self.quality_thresholds['excellent_quality']:
            quality_level = "Excellent"
        elif validation_result.confidence_score >= self.quality_thresholds['good_quality']:
            quality_level = "Good"
        elif validation_result.confidence_score >= self.quality_thresholds['minimum_acceptable']:
            quality_level = "Acceptable"

        return {
            'overall_quality': quality_level,
            'confidence_score': validation_result.confidence_score,
            'is_valid': validation_result.is_valid,
            'quality_breakdown': validation_result.quality_metrics,
            'issues_found': len(validation_result.issues),
            'issues': validation_result.issues,
            'suggestions': validation_result.suggestions,
            'validation_metadata': validation_result.metadata
        }

# Global instance
response_validator = ResponseValidator()
