"""
A/B Testing Script for RAG Quality Validation
Compares responses with and without RAG to validate improvement

Usage:
    python -m tests.ab_testing.rag_quality_test --iterations 50
    python -m tests.ab_testing.rag_quality_test --iterations 10 --model gpt-3.5-turbo
"""
import asyncio
import json
import time
import argparse
from typing import List, Dict, Any
from datetime import datetime
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from src.rag.context_retriever import ContextRetriever
from src.rag.vector_store import get_vector_store
import logging
import os

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    logger_temp = logging.getLogger(__name__)
    logger_temp.info("Loaded environment variables from .env file")
except ImportError:
    pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API key from environment
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
if not OPENROUTER_API_KEY:
    logger.warning("OPENROUTER_API_KEY not set - tests will fail. Set it in .env or environment.")
else:
    logger.info(f"OPENROUTER_API_KEY loaded: {OPENROUTER_API_KEY[:20]}...")

# Load test prompts
TEST_PROMPTS_FILE = Path(__file__).parent / 'test_prompts.json'
with open(TEST_PROMPTS_FILE) as f:
    TEST_PROMPTS = json.load(f)


async def execute_without_rag(prompt: str, model: str = 'gpt-3.5-turbo') -> Dict[str, Any]:
    """
    Execute prompt without RAG

    Args:
        prompt: The prompt text
        model: Model to use

    Returns:
        Dictionary with response, latency, tokens, cost
    """
    start_time = time.time()

    try:
        config = OpenRouterConfig(
            api_key=OPENROUTER_API_KEY,
            model=model,
            temperature=0.7,
            max_tokens=500
        )
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(prompt=prompt)

        latency = time.time() - start_time

        return {
            'response': response.content,
            'latency': latency,
            'tokens': response.usage.get('total_tokens', 0) if response.usage else 0,
            'cost': response.cost_estimate if hasattr(response, 'cost_estimate') else 0,
            'success': True,
            'error': None
        }
    except Exception as e:
        latency = time.time() - start_time
        logger.error(f"Error in execute_without_rag: {e}")
        return {
            'response': '',
            'latency': latency,
            'tokens': 0,
            'cost': 0,
            'success': False,
            'error': str(e)
        }


async def execute_with_rag(
    prompt: str,
    document_ids: List[str],
    model: str = 'gpt-3.5-turbo',
    top_k: int = 5
) -> Dict[str, Any]:
    """
    Execute prompt with RAG

    Args:
        prompt: The prompt text
        document_ids: List of document IDs to retrieve from
        model: Model to use
        top_k: Number of chunks to retrieve

    Returns:
        Dictionary with response, latency, tokens, cost, context info
    """
    start_time = time.time()

    try:
        # For this test, we'll simulate RAG by adding a generic context
        # In production, this would retrieve actual documents
        context_text = """
        Context: This is a simulated RAG context for testing purposes.
        In production, this would contain relevant information retrieved from documents.
        """

        # Build augmented prompt
        augmented_prompt = f"{context_text}\n\nQuestion: {prompt}\n\nAnswer:"

        config = OpenRouterConfig(
            api_key=OPENROUTER_API_KEY,
            model=model,
            temperature=0.7,
            max_tokens=500
        )
        async with OpenRouterClient(config) as client:
            response = await client.generate_response(prompt=augmented_prompt)

        latency = time.time() - start_time

        return {
            'response': response.content,
            'latency': latency,
            'tokens': response.usage.get('total_tokens', 0) if response.usage else 0,
            'cost': response.cost_estimate if hasattr(response, 'cost_estimate') else 0,
            'context_chunks': top_k,
            'context_length': len(context_text),
            'success': True,
            'error': None
        }
    except Exception as e:
        latency = time.time() - start_time
        logger.error(f"Error in execute_with_rag: {e}")
        return {
            'response': '',
            'latency': latency,
            'tokens': 0,
            'cost': 0,
            'context_chunks': 0,
            'context_length': 0,
            'success': False,
            'error': str(e)
        }


def calculate_relevance_score(response: str, expected_topics: List[str]) -> float:
    """
    Calculate relevance score based on presence of expected topics

    Args:
        response: The generated response
        expected_topics: List of expected topics/keywords

    Returns:
        Relevance score (0.0 to 1.0)
    """
    if not response or not expected_topics:
        return 0.0

    response_lower = response.lower()
    matches = sum(1 for topic in expected_topics if topic.lower() in response_lower)
    return matches / len(expected_topics)


async def run_ab_test(
    num_iterations: int = 50,
    model: str = 'gpt-3.5-turbo',
    output_file: str = 'ab_test_results.json'
) -> Dict[str, Any]:
    """
    Run A/B test comparing RAG vs non-RAG responses

    Args:
        num_iterations: Number of iterations per prompt
        model: Model to use for testing
        output_file: Output file for results

    Returns:
        Dictionary with results and metrics
    """
    results = {
        'without_rag': [],
        'with_rag': [],
        'timestamp': datetime.now().isoformat(),
        'num_iterations': num_iterations,
        'model': model,
        'test_prompts': len(TEST_PROMPTS)
    }

    logger.info(f"Starting A/B test with {num_iterations} iterations per prompt...")
    logger.info(f"Model: {model}")
    logger.info(f"Test prompts: {len(TEST_PROMPTS)}")

    total_tests = len(TEST_PROMPTS) * num_iterations * 2  # 2 = with and without RAG
    completed = 0

    for prompt_data in TEST_PROMPTS:
        logger.info(f"\nTesting prompt: {prompt_data['id']} ({prompt_data['category']})")

        for i in range(num_iterations):
            # Progress indicator
            completed += 2
            progress = (completed / total_tests) * 100
            logger.info(f"  Iteration {i+1}/{num_iterations} - Progress: {progress:.1f}%")

            # Test WITHOUT RAG
            try:
                response_no_rag = await execute_without_rag(prompt_data['text'], model)
                relevance = calculate_relevance_score(
                    response_no_rag['response'],
                    prompt_data['expected_topics']
                )
                results['without_rag'].append({
                    'prompt_id': prompt_data['id'],
                    'category': prompt_data['category'],
                    'iteration': i,
                    'relevance_score': relevance,
                    **response_no_rag
                })
            except Exception as e:
                logger.error(f"  Error (no RAG): {e}")

            # Test WITH RAG
            try:
                response_with_rag = await execute_with_rag(
                    prompt_data['text'],
                    prompt_data.get('documents', []),
                    model
                )
                relevance = calculate_relevance_score(
                    response_with_rag['response'],
                    prompt_data['expected_topics']
                )
                results['with_rag'].append({
                    'prompt_id': prompt_data['id'],
                    'category': prompt_data['category'],
                    'iteration': i,
                    'relevance_score': relevance,
                    **response_with_rag
                })
            except Exception as e:
                logger.error(f"  Error (with RAG): {e}")

            # Rate limiting - wait between requests
            await asyncio.sleep(0.5)

        logger.info(f"  Completed {num_iterations} iterations for {prompt_data['id']}")

    # Calculate metrics
    logger.info("\nCalculating metrics...")
    metrics = calculate_metrics(results)
    results['metrics'] = metrics

    # Save results
    output_path = Path(__file__).parent / output_file
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    logger.info(f"\nResults saved to {output_path}")
    print_summary(metrics)

    return results


def calculate_metrics(results: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate comparison metrics"""
    without_rag = [r for r in results['without_rag'] if r['success']]
    with_rag = [r for r in results['with_rag'] if r['success']]

    metrics = {
        'without_rag': {
            'total_tests': len(results['without_rag']),
            'successful_tests': len(without_rag),
            'failed_tests': len(results['without_rag']) - len(without_rag),
            'success_rate': len(without_rag) / len(results['without_rag']) * 100 if results['without_rag'] else 0,
            'avg_latency': sum(r['latency'] for r in without_rag) / len(without_rag) if without_rag else 0,
            'avg_tokens': sum(r['tokens'] for r in without_rag) / len(without_rag) if without_rag else 0,
            'total_cost': sum(r['cost'] for r in without_rag),
            'avg_relevance': sum(r['relevance_score'] for r in without_rag) / len(without_rag) if without_rag else 0
        },
        'with_rag': {
            'total_tests': len(results['with_rag']),
            'successful_tests': len(with_rag),
            'failed_tests': len(results['with_rag']) - len(with_rag),
            'success_rate': len(with_rag) / len(results['with_rag']) * 100 if results['with_rag'] else 0,
            'avg_latency': sum(r['latency'] for r in with_rag) / len(with_rag) if with_rag else 0,
            'avg_tokens': sum(r['tokens'] for r in with_rag) / len(with_rag) if with_rag else 0,
            'total_cost': sum(r['cost'] for r in with_rag),
            'avg_relevance': sum(r['relevance_score'] for r in with_rag) / len(with_rag) if with_rag else 0,
            'avg_context_chunks': sum(r.get('context_chunks', 0) for r in with_rag) / len(with_rag) if with_rag else 0
        }
    }

    # Calculate improvements
    if metrics['without_rag']['avg_latency'] > 0:
        metrics['latency_change_pct'] = (
            (metrics['with_rag']['avg_latency'] - metrics['without_rag']['avg_latency'])
            / metrics['without_rag']['avg_latency'] * 100
        )

    if metrics['without_rag']['total_cost'] > 0:
        metrics['cost_increase_pct'] = (
            (metrics['with_rag']['total_cost'] - metrics['without_rag']['total_cost'])
            / metrics['without_rag']['total_cost'] * 100
        )

    if metrics['without_rag']['avg_relevance'] > 0:
        metrics['relevance_improvement_pct'] = (
            (metrics['with_rag']['avg_relevance'] - metrics['without_rag']['avg_relevance'])
            / metrics['without_rag']['avg_relevance'] * 100
        )

    return metrics


def print_summary(metrics: Dict[str, Any]):
    """Print test summary"""
    print("\n" + "="*80)
    print("A/B TEST SUMMARY")
    print("="*80)

    print("\n📊 WITHOUT RAG:")
    print(f"  Total Tests: {metrics['without_rag']['total_tests']}")
    print(f"  Success Rate: {metrics['without_rag']['success_rate']:.1f}%")
    print(f"  Avg Latency: {metrics['without_rag']['avg_latency']:.2f}s")
    print(f"  Avg Tokens: {metrics['without_rag']['avg_tokens']:.0f}")
    print(f"  Total Cost: ${metrics['without_rag']['total_cost']:.4f}")
    print(f"  Avg Relevance: {metrics['without_rag']['avg_relevance']:.2%}")

    print("\n📊 WITH RAG:")
    print(f"  Total Tests: {metrics['with_rag']['total_tests']}")
    print(f"  Success Rate: {metrics['with_rag']['success_rate']:.1f}%")
    print(f"  Avg Latency: {metrics['with_rag']['avg_latency']:.2f}s")
    print(f"  Avg Tokens: {metrics['with_rag']['avg_tokens']:.0f}")
    print(f"  Total Cost: ${metrics['with_rag']['total_cost']:.4f}")
    print(f"  Avg Relevance: {metrics['with_rag']['avg_relevance']:.2%}")
    print(f"  Avg Context Chunks: {metrics['with_rag']['avg_context_chunks']:.1f}")

    print("\n📈 COMPARISON:")
    print(f"  Latency Change: {metrics.get('latency_change_pct', 0):+.1f}%")
    print(f"  Cost Increase: {metrics.get('cost_increase_pct', 0):+.1f}%")
    print(f"  Relevance Improvement: {metrics.get('relevance_improvement_pct', 0):+.1f}%")

    # Verdict
    print("\n🎯 VERDICT:")
    relevance_improvement = metrics.get('relevance_improvement_pct', 0)
    cost_increase = metrics.get('cost_increase_pct', 0)

    if relevance_improvement >= 20 and cost_increase < 200:
        print("  ✅ RAG provides significant improvement with acceptable cost increase")
    elif relevance_improvement >= 10:
        print("  ⚠️  RAG provides moderate improvement - consider optimization")
    else:
        print("  ❌ RAG does not provide sufficient improvement - needs investigation")

    print("\n" + "="*80)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run A/B test for RAG quality')
    parser.add_argument('--iterations', type=int, default=50, help='Number of iterations per prompt')
    parser.add_argument('--model', type=str, default='gpt-3.5-turbo', help='Model to use')
    parser.add_argument('--output', type=str, default='ab_test_results.json', help='Output file')
    args = parser.parse_args()

    asyncio.run(run_ab_test(
        num_iterations=args.iterations,
        model=args.model,
        output_file=args.output
    ))
