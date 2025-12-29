#!/usr/bin/env python3
"""
Reflection Mechanism Evaluator
Measures the impact and frequency of the self-correction loop
"""

import asyncio
import json
import logging
import sys
import os
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List

# Add project root to path (one level up from scripts)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# Add src to path to support direct imports (e.g. from rag import ...)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from src.ai_agent.marketing.marketing_agent import get_marketing_agent
from evaluation.evaluator import MarketingAgentEvaluator

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ReflectionEvaluator(MarketingAgentEvaluator):
    """Extends standard evaluator to track reflection metrics"""

    async def evaluate_single(self, test_case: Dict[str, Any]) -> Dict[str, Any]:
        # Run standard evaluation
        result = await super().evaluate_single(test_case)

        # Extract reflection metrics from metadata
        # We need to access the last response from the agent to get metadata
        # Since super().evaluate_single doesn't return the raw response, we need to re-run or modify
        # But wait, evaluate_single calls agent.chat() internally.
        # Let's override evaluate_single to capture metadata

        query = test_case["query"]
        response_dict = await self.agent.chat(
            message=query,
            context={
                "page_context": "reflection_eval",
                "conversation_id": f"ref_eval_{test_case['id']}"
            }
        )

        metadata = response_dict.get("metadata", {})
        iteration_count = metadata.get("iteration_count", 0)
        reflection_feedback = metadata.get("reflection_feedback")

        # Add reflection metrics to result
        result["iteration_count"] = iteration_count
        result["triggered_reflection"] = iteration_count > 0
        result["reflection_feedback"] = reflection_feedback

        return result

    def _aggregate_metrics(self) -> Dict[str, Any]:
        aggregated = super()._aggregate_metrics()

        if not self.results:
            return aggregated

        total_tests = len(self.results)
        reflection_triggered = sum(1 for r in self.results if r.get("triggered_reflection", False))
        reflection_rate = reflection_triggered / total_tests if total_tests > 0 else 0.0

        avg_iterations = sum(r.get("iteration_count", 0) for r in self.results) / total_tests

        aggregated["reflection_metrics"] = {
            "reflection_rate": round(reflection_rate, 2),
            "total_reflections": reflection_triggered,
            "avg_iterations": round(avg_iterations, 2)
        }

        return aggregated

async def run_reflection_eval(limit: int = 10):
    print(f"\n🚀 Starting Reflection Evaluation (limit={limit})...")

    agent = get_marketing_agent()
    dataset_path = "evaluation/golden_dataset.json"

    evaluator = ReflectionEvaluator(agent, dataset_path)
    results = await evaluator.evaluate_all(limit=limit)

    print("\n📊 REFLECTION METRICS")
    print("=" * 60)
    metrics = results.get("reflection_metrics", {})
    print(f"Reflection Rate: {metrics.get('reflection_rate', 0) * 100:.1f}%")
    print(f"Total Reflections: {metrics.get('total_reflections', 0)}")
    print(f"Avg Iterations: {metrics.get('avg_iterations', 0)}")
    print("=" * 60)

    # Save results
    output_dir = Path("evaluation/reflection_results")
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(output_dir / "reflection_metrics.json", 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n✓ Results saved to {output_dir}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=10, help="Number of test cases to run")
    args = parser.parse_args()

    asyncio.run(run_reflection_eval(limit=args.limit))
