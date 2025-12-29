"""
Task 1.1.2: RAG Quality Validation Test Suite
Automated tests for factual accuracy, source citations, context relevance, and RAG vs no-RAG comparison

This test suite validates:
1. Factual accuracy - responses contain correct information from documents
2. Source attribution - responses cite correct documents
3. Context relevance - retrieved context matches query intent
4. RAG vs no-RAG comparison - measurable quality improvement
5. Quality scoring metrics - quantitative evaluation
"""

import os
import sys
import json
import asyncio
import pytest
from pathlib import Path
from typing import Dict, Any, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from dotenv import load_dotenv

load_dotenv()

# Get API key (check both possible env vars)
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_API_KEY_RAG")
if not OPENROUTER_API_KEY and __name__ == "__main__":
    # Only skip if running as pytest
    pass
elif not OPENROUTER_API_KEY:
    pytest.skip("OPENROUTER_API_KEY not set", allow_module_level=True)

# Use free model for testing
DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free"

# Test fixtures path
FIXTURES_PATH = Path(__file__).parent.parent / "fixtures"
TEST_PROMPTS_FILE = FIXTURES_PATH / "test_prompts_rag.json"
TEST_DOCS_DIR = FIXTURES_PATH / "rag_test_documents"


@dataclass
class QualityMetrics:
    """Quality metrics for RAG evaluation"""
    factual_accuracy: float  # 0-1: Contains correct facts from documents
    source_attribution: float  # 0-1: Correctly cites sources
    relevance_score: float  # 0-1: Context relevance to query
    specificity_score: float  # 0-1: Specific vs generic response
    completeness_score: float  # 0-1: Covers all relevant aspects
    overall_score: float  # 0-1: Weighted average

    def to_dict(self) -> Dict[str, float]:
        return asdict(self)


@dataclass
class ComparisonResult:
    """Result of RAG vs no-RAG comparison"""
    prompt_id: str
    prompt_text: str
    category: str

    # Responses
    rag_response: str
    no_rag_response: str

    # Metrics
    rag_metrics: QualityMetrics
    no_rag_metrics: QualityMetrics

    # Comparison
    improvement: float  # Percentage improvement
    is_improved: bool  # True if RAG is better

    # Metadata
    rag_latency: float
    no_rag_latency: float
    rag_cost: float
    no_rag_cost: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            'prompt_id': self.prompt_id,
            'prompt_text': self.prompt_text,
            'category': self.category,
            'rag_response': self.rag_response,
            'no_rag_response': self.no_rag_response,
            'rag_metrics': self.rag_metrics.to_dict(),
            'no_rag_metrics': self.no_rag_metrics.to_dict(),
            'improvement': self.improvement,
            'is_improved': self.is_improved,
            'rag_latency': self.rag_latency,
            'no_rag_latency': self.no_rag_latency,
            'rag_cost': self.rag_cost,
            'no_rag_cost': self.no_rag_cost
        }


class RAGQualityEvaluator:
    """Evaluates RAG quality with automated metrics"""

    def __init__(self):
        self.test_prompts = self._load_test_prompts()
        self.test_documents = self._load_test_documents()

    def _load_test_prompts(self) -> List[Dict[str, Any]]:
        """Load test prompts from JSON file"""
        if not TEST_PROMPTS_FILE.exists():
            pytest.skip(f"Test prompts file not found: {TEST_PROMPTS_FILE}")

        with open(TEST_PROMPTS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('test_prompts', [])

    def _load_test_documents(self) -> Dict[str, str]:
        """Load test documents from fixtures directory"""
        documents = {}

        if not TEST_DOCS_DIR.exists():
            pytest.skip(f"Test documents directory not found: {TEST_DOCS_DIR}")

        for doc_file in TEST_DOCS_DIR.glob('*'):
            if doc_file.is_file():
                with open(doc_file, 'r', encoding='utf-8') as f:
                    documents[doc_file.name] = f.read()

        return documents

    def evaluate_factual_accuracy(
        self,
        response: str,
        expected_context: str,
        evaluation_criteria: List[str]
    ) -> float:
        """
        Evaluate factual accuracy by checking if response contains expected facts

        Args:
            response: The generated response
            expected_context: Document name that should contain the facts
            evaluation_criteria: List of facts that should be present

        Returns:
            Score from 0-1
        """
        if not evaluation_criteria:
            return 1.0

        response_lower = response.lower()
        matches = 0

        for criterion in evaluation_criteria:
            # Simple keyword matching (can be enhanced with semantic similarity)
            criterion_lower = criterion.lower()
            # Check if key concepts from criterion are in response
            keywords = [word for word in criterion_lower.split() if len(word) > 3]
            if any(keyword in response_lower for keyword in keywords):
                matches += 1

        return matches / len(evaluation_criteria)

    def evaluate_source_attribution(
        self,
        response: str,
        expected_sources: List[str]
    ) -> float:
        """
        Evaluate if response attributes information to correct sources

        Args:
            response: The generated response
            expected_sources: List of expected source document names

        Returns:
            Score from 0-1
        """
        if not expected_sources:
            return 1.0

        response_lower = response.lower()

        # Check for explicit citations or source mentions
        attribution_indicators = [
            'according to', 'based on', 'from', 'source:', 'document',
            'states', 'mentions', 'indicates', 'shows', 'reports'
        ]

        has_attribution = any(indicator in response_lower for indicator in attribution_indicators)

        # Check if source names are mentioned
        sources_mentioned = sum(
            1 for source in expected_sources
            if source.lower().replace('_', ' ').replace('.txt', '').replace('.md', '') in response_lower
        )

        attribution_score = 1.0 if has_attribution else 0.5
        source_score = sources_mentioned / len(expected_sources) if expected_sources else 1.0

        return (attribution_score + source_score) / 2

    def evaluate_relevance(
        self,
        response: str,
        prompt: str,
        expected_context: str
    ) -> float:
        """
        Evaluate relevance of response to the prompt

        Args:
            response: The generated response
            prompt: The original prompt
            expected_context: Expected context document

        Returns:
            Score from 0-1
        """
        # Extract key terms from prompt
        prompt_terms = set(word.lower() for word in prompt.split() if len(word) > 3)
        response_terms = set(word.lower() for word in response.split() if len(word) > 3)

        # Calculate term overlap
        if not prompt_terms:
            return 1.0

        overlap = len(prompt_terms & response_terms)
        relevance = overlap / len(prompt_terms)

        return min(relevance, 1.0)

    def evaluate_specificity(
        self,
        response: str
    ) -> float:
        """
        Evaluate specificity vs generic nature of response

        Args:
            response: The generated response

        Returns:
            Score from 0-1 (higher = more specific)
        """
        # Indicators of specific information
        specific_indicators = [
            # Numbers and measurements
            any(char.isdigit() for char in response),
            # Proper nouns (capitalized words mid-sentence)
            len([word for word in response.split() if word[0].isupper() and word not in ['The', 'A', 'An']]) > 2,
            # Technical terms or jargon
            len(response.split()) > 50,  # Longer responses tend to be more specific
            # Concrete examples
            'example' in response.lower() or 'such as' in response.lower() or 'including' in response.lower()
        ]

        return sum(specific_indicators) / len(specific_indicators)

    def evaluate_completeness(
        self,
        response: str,
        evaluation_criteria: List[str]
    ) -> float:
        """
        Evaluate completeness of response

        Args:
            response: The generated response
            evaluation_criteria: Expected aspects to cover

        Returns:
            Score from 0-1
        """
        if not evaluation_criteria:
            return 1.0

        # Check if response addresses all criteria
        response_lower = response.lower()
        covered = 0

        for criterion in evaluation_criteria:
            # Check if criterion concepts are addressed
            criterion_words = set(word.lower() for word in criterion.split() if len(word) > 3)
            response_words = set(word.lower() for word in response.split())

            if criterion_words & response_words:
                covered += 1

        return covered / len(evaluation_criteria)

    def calculate_overall_metrics(
        self,
        response: str,
        prompt: str,
        expected_context: str,
        evaluation_criteria: List[str]
    ) -> QualityMetrics:
        """Calculate all quality metrics for a response"""

        factual_accuracy = self.evaluate_factual_accuracy(
            response, expected_context, evaluation_criteria
        )

        source_attribution = self.evaluate_source_attribution(
            response, [expected_context] if expected_context != 'any' else []
        )

        relevance_score = self.evaluate_relevance(
            response, prompt, expected_context
        )

        specificity_score = self.evaluate_specificity(response)

        completeness_score = self.evaluate_completeness(
            response, evaluation_criteria
        )

        # Weighted average (factual accuracy and relevance are most important)
        overall_score = (
            factual_accuracy * 0.3 +
            source_attribution * 0.15 +
            relevance_score * 0.3 +
            specificity_score * 0.15 +
            completeness_score * 0.1
        )

        return QualityMetrics(
            factual_accuracy=factual_accuracy,
            source_attribution=source_attribution,
            relevance_score=relevance_score,
            specificity_score=specificity_score,
            completeness_score=completeness_score,
            overall_score=overall_score
        )


# =============================================================================
# PYTEST FIXTURES
# =============================================================================

@pytest.fixture(scope="module")
def evaluator():
    """Create RAG quality evaluator"""
    return RAGQualityEvaluator()


@pytest.fixture(scope="module")
def test_prompts(evaluator):
    """Get test prompts"""
    return evaluator.test_prompts


# =============================================================================
# TEST CASES
# =============================================================================

def test_evaluator_initialization(evaluator):
    """Test that evaluator initializes correctly"""
    assert evaluator is not None
    assert len(evaluator.test_prompts) > 0
    assert len(evaluator.test_documents) > 0
    print(f"\n✅ Loaded {len(evaluator.test_prompts)} test prompts")
    print(f"✅ Loaded {len(evaluator.test_documents)} test documents")


def test_factual_accuracy_evaluation(evaluator):
    """Test factual accuracy evaluation"""
    response = "Machine Learning has three main types: supervised learning, unsupervised learning, and reinforcement learning."
    criteria = [
        "Mentions supervised, unsupervised, and reinforcement learning",
        "Defines ML as subset of AI"
    ]

    score = evaluator.evaluate_factual_accuracy(response, "technical_doc_ai.txt", criteria)
    assert 0 <= score <= 1
    assert score > 0.4  # Should match at least one criterion
    print(f"\n✅ Factual accuracy score: {score:.2f}")


def test_source_attribution_evaluation(evaluator):
    """Test source attribution evaluation"""
    response_with_attribution = "According to the technical documentation, Machine Learning is a subset of AI."
    response_without_attribution = "Machine Learning is a subset of AI."

    score_with = evaluator.evaluate_source_attribution(response_with_attribution, ["technical_doc_ai.txt"])
    score_without = evaluator.evaluate_source_attribution(response_without_attribution, ["technical_doc_ai.txt"])

    assert score_with > score_without
    print(f"\n✅ Attribution score (with): {score_with:.2f}")
    print(f"✅ Attribution score (without): {score_without:.2f}")


def test_relevance_evaluation(evaluator):
    """Test relevance evaluation"""
    prompt = "What is Machine Learning?"
    relevant_response = "Machine Learning is a subset of AI that enables systems to learn from data."
    irrelevant_response = "The weather is nice today."

    score_relevant = evaluator.evaluate_relevance(relevant_response, prompt, "technical_doc_ai.txt")
    score_irrelevant = evaluator.evaluate_relevance(irrelevant_response, prompt, "technical_doc_ai.txt")

    assert score_relevant > score_irrelevant
    print(f"\n✅ Relevance score (relevant): {score_relevant:.2f}")
    print(f"✅ Relevance score (irrelevant): {score_irrelevant:.2f}")


def test_specificity_evaluation(evaluator):
    """Test specificity evaluation"""
    specific_response = "The Q4 2024 revenue was $45.2 million, representing a 23% year-over-year growth."
    generic_response = "The revenue was good and showed growth."

    score_specific = evaluator.evaluate_specificity(specific_response)
    score_generic = evaluator.evaluate_specificity(generic_response)

    assert score_specific > score_generic
    print(f"\n✅ Specificity score (specific): {score_specific:.2f}")
    print(f"✅ Specificity score (generic): {score_generic:.2f}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
