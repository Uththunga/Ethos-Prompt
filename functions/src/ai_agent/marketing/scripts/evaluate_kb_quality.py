"""
Knowledge Base Quality Evaluation Script
Measures Recall@5 and MRR (Mean Reciprocal Rank) on a golden dataset
"""
import asyncio
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple
import sys
import os

# Add functions/src to path
project_root = Path(__file__).parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root / "functions" / "src"))

from ai_agent.marketing.marketing_retriever import marketing_retriever

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_golden_dataset(dataset_path: str) -> List[Dict[str, Any]]:
    """Load golden dataset from JSON file"""
    with open(dataset_path, 'r') as f:
        return json.load(f)


async def evaluate_retrieval(query: str, expected_doc_id: str, category: Optional[str] = None, top_k: int = 5) -> Dict[str, Any]:
    """
    Evaluate a single query against expected document

    Returns:
        - found: Whether expected doc was in results
        - rank: Position of expected doc (1-indexed), 0 if not found
        - reciprocal_rank: 1/rank if found, else 0
        - top_score: Score of the top result
        - expected_score: Score of the expected doc if found
    """
    results = await marketing_retriever.retrieve(
        query=query,
        top_k=top_k,
        category_filter=category,
        use_hybrid=True
    )

    # Find expected doc in results
    found = False
    rank = 0
    expected_score = 0.0

    for i, result in enumerate(results, 1):
        if result.document_id == expected_doc_id:
            found = True
            rank = i
            expected_score = result.score
            break

    reciprocal_rank = 1 / rank if found else 0
    top_score = results[0].score if results else 0

    return {
        "query": query,
        "expected_doc_id": expected_doc_id,
        "found": found,
        "rank": rank,
        "reciprocal_rank": reciprocal_rank,
        "top_score": top_score,
        "expected_score": expected_score,
        "num_results": len(results)
    }


async def run_evaluation(dataset_path: Optional[str] = None, top_k: int = 5) -> Dict[str, Any]:
    """
    Run full evaluation on golden dataset

    Returns:
        - recall_at_k: Percentage of queries where expected doc was in top-k
        - mrr: Mean Reciprocal Rank across all queries
        - results: Detailed results per query
    """
    if dataset_path is None:
        dataset_path = Path(__file__).parent / "golden_dataset.json"

    logger.info(f"Loading golden dataset from {dataset_path}")
    dataset = load_golden_dataset(str(dataset_path))

    logger.info(f"Evaluating {len(dataset)} queries...")

    results = []
    for item in dataset:
        result = await evaluate_retrieval(
            query=item["query"],
            expected_doc_id=item["expected_doc_id"],
            category=item.get("category"),
            top_k=top_k
        )
        results.append(result)

        status = "✓" if result["found"] else "✗"
        logger.info(f"{status} {item['query'][:50]}... | Rank: {result['rank']}, Score: {result['expected_score']:.3f}")

    # Calculate metrics
    recall = sum(1 for r in results if r["found"]) / len(results)
    mrr = sum(r["reciprocal_rank"] for r in results) / len(results)

    # Find failures
    failures = [r for r in results if not r["found"]]

    logger.info("\n" + "="*80)
    logger.info(f"EVALUATION RESULTS (Top-{top_k})")
    logger.info("="*80)
    logger.info(f"Total Queries: {len(results)}")
    logger.info(f"Successful Retrievals: {len(results) - len(failures)}")
    logger.info(f"Failed Retrievals: {len(failures)}")
    logger.info(f"Recall@{top_k}: {recall:.2%}")
    logger.info(f"MRR (Mean Reciprocal Rank): {mrr:.3f}")
    logger.info("="*80)

    if failures:
        logger.warning(f"\n{len(failures)} Failed Queries:")
        for f in failures:
            logger.warning(f"  - {f['query'][:60]}... (expected: {f['expected_doc_id']})")

    return {
        "recall_at_k": recall,
        "mrr": mrr,
        "total_queries": len(results),
        "successful": len(results) - len(failures),
        "failed": len(failures),
        "results": results
    }


async def main():
    """Main evaluation entry point"""
    try:
        # Initialize retriever (in case not initialized)
        marketing_retriever.db = None

        # Run evaluation
        evaluation = await run_evaluation(top_k=5)

        # Save results
        output_path = Path(__file__).parent / "evaluation_results.json"
        with open(output_path, 'w') as f:
            json.dump(evaluation, f, indent=2)

        logger.info(f"\nResults saved to: {output_path}")

        # Exit with error code if quality is below threshold
        if evaluation["recall_at_k"] < 0.80:
            logger.error(f"\n⚠️ QUALITY GATE FAILED: Recall@5 ({evaluation['recall_at_k']:.2%}) < 80%")
            sys.exit(1)
        else:
            logger.info(f"\n✅ QUALITY GATE PASSED: Recall@5 ({evaluation['recall_at_k']:.2%}) >= 80%")
            sys.exit(0)

    except Exception as e:
        logger.error(f"Evaluation failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

