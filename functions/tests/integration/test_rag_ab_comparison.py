"""
Task 1.1.3: Execute A/B Testing with Real Documents
Run each test prompt twice (with/without RAG), collect execution metadata,
perform quality review, calculate improvement rate (target: 80%+)

This script:
1. Loads test prompts from test_prompts_rag.json
2. Executes each prompt with RAG enabled
3. Executes each prompt without RAG
4. Compares responses using quality metrics
5. Calculates improvement rate
6. Generates detailed comparison report
"""

import os
import sys
import json
import asyncio
import time
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime
from dataclasses import dataclass, asdict

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from dotenv import load_dotenv

load_dotenv()

# Import quality evaluator
sys.path.insert(0, str(Path(__file__).parent))
from test_rag_quality_validation import RAGQualityEvaluator, QualityMetrics, ComparisonResult

# Get API key
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_API_KEY_RAG")
if not OPENROUTER_API_KEY:
    print("❌ Error: OPENROUTER_API_KEY not set in environment")
    sys.exit(1)

# Use free model for testing
DEFAULT_MODEL = "google/gemini-2.0-flash-exp:free"

# Test fixtures path
FIXTURES_PATH = Path(__file__).parent.parent / "fixtures"
TEST_PROMPTS_FILE = FIXTURES_PATH / "test_prompts_rag.json"
TEST_DOCS_DIR = FIXTURES_PATH / "rag_test_documents"
RESULTS_DIR = Path(__file__).parent.parent.parent / "docs"
RESULTS_DIR.mkdir(exist_ok=True)


@dataclass
class ExecutionMetadata:
    """Metadata for a single execution"""
    execution_id: str
    prompt_id: str
    prompt_text: str
    response: str
    model: str
    rag_enabled: bool
    latency: float
    tokens_used: int
    cost: float
    timestamp: str
    error: str = None


class RAGABTester:
    """A/B testing for RAG vs no-RAG comparison"""

    def __init__(self):
        self.evaluator = RAGQualityEvaluator()
        self.results: List[ComparisonResult] = []
        self.executions: List[ExecutionMetadata] = []

    async def execute_prompt_simple(
        self,
        prompt: str,
        rag_enabled: bool = False,
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Simple prompt execution using OpenRouter API

        Args:
            prompt: The prompt text
            rag_enabled: Whether RAG is enabled
            context: Context to inject (if RAG enabled)

        Returns:
            Execution result with response and metadata
        """
        import aiohttp

        start_time = time.time()

        # Build the full prompt
        if rag_enabled and context:
            full_prompt = f"""Context Information:
{context}

Based on the above context, please answer the following question:
{prompt}

Provide a detailed answer using information from the context."""
        else:
            full_prompt = prompt

        # Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": DEFAULT_MODEL,
            "messages": [
                {"role": "user", "content": full_prompt}
            ],
            "max_tokens": 500,
            "temperature": 0.7
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        return {
                            "success": False,
                            "error": f"API error {response.status}: {error_text}",
                            "latency": time.time() - start_time
                        }

                    data = await response.json()
                    latency = time.time() - start_time

                    return {
                        "success": True,
                        "response": data["choices"][0]["message"]["content"],
                        "tokens_used": data.get("usage", {}).get("total_tokens", 0),
                        "cost": 0.0,  # Free model
                        "latency": latency,
                        "model": DEFAULT_MODEL
                    }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "latency": time.time() - start_time
            }

    def get_context_for_prompt(self, prompt_data: Dict[str, Any]) -> str:
        """Get relevant context for a prompt"""
        expected_context = prompt_data.get("expected_context", "")

        if expected_context == "any" or expected_context == "none":
            return ""

        # Load relevant documents
        context_parts = []

        if expected_context == "all":
            # Use all documents
            for doc_name, doc_content in self.evaluator.test_documents.items():
                context_parts.append(f"=== {doc_name} ===\n{doc_content[:2000]}")
        else:
            # Use specific documents
            doc_names = expected_context.split(",")
            for doc_name in doc_names:
                doc_name = doc_name.strip()
                if doc_name in self.evaluator.test_documents:
                    content = self.evaluator.test_documents[doc_name]
                    context_parts.append(f"=== {doc_name} ===\n{content[:2000]}")

        return "\n\n".join(context_parts)

    async def run_ab_test(self, prompt_data: Dict[str, Any]) -> ComparisonResult:
        """Run A/B test for a single prompt"""
        prompt_id = prompt_data["id"]
        prompt_text = prompt_data["prompt"]
        category = prompt_data["category"]
        evaluation_criteria = prompt_data.get("evaluation_criteria", [])
        expected_context = prompt_data.get("expected_context", "")

        print(f"\n[TEST] {prompt_data['title']}")
        print(f"   Category: {category}")
        print(f"   Prompt: {prompt_text[:80]}...")

        # Get context for RAG
        context = self.get_context_for_prompt(prompt_data)

        # Execute WITHOUT RAG
        print("   [EXEC] Executing without RAG...")
        no_rag_result = await self.execute_prompt_simple(prompt_text, rag_enabled=False)
        await asyncio.sleep(1)  # Rate limiting

        # Execute WITH RAG
        print("   [EXEC] Executing with RAG...")
        rag_result = await self.execute_prompt_simple(prompt_text, rag_enabled=True, context=context)
        await asyncio.sleep(1)  # Rate limiting

        # Check for errors
        if not no_rag_result.get("success"):
            print(f"   [ERROR] No-RAG execution failed: {no_rag_result.get('error')}")
            return None
        if not rag_result.get("success"):
            print(f"   [ERROR] RAG execution failed: {rag_result.get('error')}")
            return None

        # Extract responses
        no_rag_response = no_rag_result["response"]
        rag_response = rag_result["response"]

        print("   [OK] Responses received")
        print(f"      No-RAG: {len(no_rag_response)} chars")
        print(f"      RAG: {len(rag_response)} chars")

        # Calculate quality metrics
        no_rag_metrics = self.evaluator.calculate_overall_metrics(
            no_rag_response, prompt_text, expected_context, evaluation_criteria
        )

        rag_metrics = self.evaluator.calculate_overall_metrics(
            rag_response, prompt_text, expected_context, evaluation_criteria
        )

        # Calculate improvement
        improvement = ((rag_metrics.overall_score - no_rag_metrics.overall_score) /
                      max(no_rag_metrics.overall_score, 0.01)) * 100
        is_improved = rag_metrics.overall_score > no_rag_metrics.overall_score

        print("   [METRICS] Quality Scores:")
        print(f"      No-RAG: {no_rag_metrics.overall_score:.3f}")
        print(f"      RAG: {rag_metrics.overall_score:.3f}")
        print(f"      Improvement: {improvement:+.1f}%")

        # Create comparison result
        result = ComparisonResult(
            prompt_id=prompt_id,
            prompt_text=prompt_text,
            category=category,
            rag_response=rag_response,
            no_rag_response=no_rag_response,
            rag_metrics=rag_metrics,
            no_rag_metrics=no_rag_metrics,
            improvement=improvement,
            is_improved=is_improved,
            rag_latency=rag_result["latency"],
            no_rag_latency=no_rag_result["latency"],
            rag_cost=rag_result["cost"],
            no_rag_cost=no_rag_result["cost"]
        )

        return result

    async def run_all_tests(self, limit: int = None):
        """Run A/B tests for all prompts"""
        prompts = self.evaluator.test_prompts

        if limit:
            prompts = prompts[:limit]

        print(f"\n{'='*80}")
        print("Starting A/B Testing")
        print(f"{'='*80}")
        print(f"Total prompts: {len(prompts)}")
        print(f"Model: {DEFAULT_MODEL}")
        print(f"{'='*80}\n")

        for i, prompt_data in enumerate(prompts, 1):
            print(f"\n[{i}/{len(prompts)}] ", end="")

            try:
                result = await self.run_ab_test(prompt_data)
                if result:
                    self.results.append(result)
            except Exception as e:
                print(f"   ❌ Error: {e}")
                continue

        print(f"\n{'='*80}")
        print("Testing Complete")
        print(f"{'='*80}\n")

    def calculate_statistics(self) -> Dict[str, Any]:
        """Calculate overall statistics"""
        if not self.results:
            return {}

        total = len(self.results)
        improved = sum(1 for r in self.results if r.is_improved)
        improvement_rate = (improved / total) * 100

        avg_improvement = sum(r.improvement for r in self.results) / total
        avg_rag_score = sum(r.rag_metrics.overall_score for r in self.results) / total
        avg_no_rag_score = sum(r.no_rag_metrics.overall_score for r in self.results) / total

        avg_rag_latency = sum(r.rag_latency for r in self.results) / total
        avg_no_rag_latency = sum(r.no_rag_latency for r in self.results) / total

        return {
            "total_tests": total,
            "improved_count": improved,
            "improvement_rate": improvement_rate,
            "avg_improvement": avg_improvement,
            "avg_rag_score": avg_rag_score,
            "avg_no_rag_score": avg_no_rag_score,
            "avg_rag_latency": avg_rag_latency,
            "avg_no_rag_latency": avg_no_rag_latency,
            "target_met": improvement_rate >= 80.0
        }

    def generate_report(self):
        """Generate detailed comparison report"""
        stats = self.calculate_statistics()

        report_path = RESULTS_DIR / "RAG_AB_TEST_RESULTS.json"

        report_data = {
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "model": DEFAULT_MODEL,
                "total_prompts": len(self.results)
            },
            "statistics": stats,
            "results": [r.to_dict() for r in self.results]
        }

        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)

        print(f"\n[REPORT] Saved to: {report_path}")

        return stats


async def main():
    """Main execution function"""
    tester = RAGABTester()

    # Run tests (limit to 10 for quick testing, remove limit for full run)
    await tester.run_all_tests(limit=10)

    # Generate report
    stats = tester.generate_report()

    # Print summary
    if stats:
        print(f"\n{'='*80}")
        print("FINAL RESULTS")
        print(f"{'='*80}")
        print(f"Total Tests: {stats['total_tests']}")
        print(f"Improved with RAG: {stats['improved_count']} ({stats['improvement_rate']:.1f}%)")
        print(f"Average Improvement: {stats['avg_improvement']:+.1f}%")
        print(f"Average RAG Score: {stats['avg_rag_score']:.3f}")
        print(f"Average No-RAG Score: {stats['avg_no_rag_score']:.3f}")
        print(f"Average RAG Latency: {stats['avg_rag_latency']:.2f}s")
        print(f"Average No-RAG Latency: {stats['avg_no_rag_latency']:.2f}s")
        print(f"\n[TARGET] 80%+ improvement: {'MET' if stats['target_met'] else 'NOT MET'}")
        print(f"{'='*80}\n")
    else:
        print("\n[ERROR] No successful tests completed. Check API key and connectivity.")


if __name__ == "__main__":
    asyncio.run(main())
