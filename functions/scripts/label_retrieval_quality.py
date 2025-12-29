"""
Manual labeling interface for RAG retrieval quality
Allows team to label relevance of retrieval results
"""

import asyncio
import json
import logging
import sys
import os
from pathlib import Path
from typing import List, Dict, Any

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ai_agent.marketing.rag_quality_metrics import RAGQualityMetrics

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def load_unlabeled_queries(db: Any, limit: int = 10) -> List[Dict]:
    """Load unlabeled retrieval queries from Firestore"""
    try:
        query_ref = db.collection("retrieval_quality").where(
            "labeled", "==", False
        ).limit(limit)

        snapshot = await query_ref.get()

        queries = []
        for doc in snapshot:
            data = doc.to_dict()
            data['id'] = doc.id
            queries.append(data)

        return queries

    except Exception as e:
        logger.error(f"Error loading queries: {e}")
        return []


def display_query_for_labeling(query_data: Dict) -> None:
    """Display query and results for manual labeling"""
    print("\n" + "=" * 70)
    print(f"QUERY: {query_data['query']}")
    print("=" * 70)
    print("\nRETRIEVAL RESULTS:")
    print("-" * 70)

    for i, result in enumerate(query_data.get('results', []), start=1):
        print(f"\n[{i}] Doc ID: {result.get('doc_id', 'unknown')}")
        print(f"    Score: {result.get('score', 0.0):.4f}")
        print(f"    Rank: {result.get('rank', i)}")

    print("\n" + "=" * 70)


def get_relevance_labels(results: List[Dict]) -> Dict[str, float]:
    """
    Prompt user to label relevance of each result.

    Relevance scale:
    0 = Not relevant
    1 = Somewhat relevant
    2 = Relevant
    3 = Highly relevant
    """
    print("\nPlease rate each result's relevance (0-3):")
    print("  0 = Not relevant")
    print("  1 = Somewhat relevant")
    print("  2 = Relevant")
    print("  3 = Highly relevant")
    print("  s = Skip this query")
    print("")

    labels = {}

    for i, result in enumerate(results, start=1):
        doc_id = result.get('doc_id', 'unknown')

        while True:
            try:
                rating = input(f"Rate result [{i}] (Doc: {doc_id[:12]}...): ").strip().lower()

                if rating == 's':
                    return None  # Skip this query

                rating_num = float(rating)
                if 0 <= rating_num <= 3:
                    labels[doc_id] = rating_num
                    break
                else:
                    print("  Error: Please enter 0, 1, 2, 3, or 's'")
            except ValueError:
                print("  Error: Please enter a number or 's'")

    return labels


async def save_labels(db: Any, query_id: str, labels: Dict[str, float]) -> None:
    """Save relevance labels to Firestore"""
    try:
        # Update query record with labels
        await db.collection("retrieval_quality").document(query_id).update({
            "relevance_labels": labels,
            "labeled": True,
            "labeled_at": asyncio.get_event_loop().time()
        })

        # Calculate and store metrics
        metrics_calc = RAGQualityMetrics(db)
        query_ref = await db.collection("retrieval_quality").document(query_id).get()
        query_data = query_ref.to_dict()

        # Calculate MRR
        relevant_ids = [doc_id for doc_id, score in labels.items() if score >= 2.0]
        mrr = metrics_calc.calculate_mrr(query_data['results'], relevant_ids)

        # Calculate NDCG
        ndcg = metrics_calc.calculate_ndcg(query_data['results'], labels, k=5)

        # Update with metrics
        await db.collection("retrieval_quality").document(query_id).update({
            "mrr": mrr,
            "ndcg_at_5": ndcg
        })

        print(f"\n✓ Saved labels (MRR={mrr:.4f}, NDCG@5={ndcg:.4f})")

    except Exception as e:
        logger.error(f"Error saving labels: {e}")


async def run_labeling_session(limit: int = 10):
    """Run interactive labeling session"""
    print("\n🏷️  RAG Quality Labeling Tool")
    print("=" * 70)

    # Initialize Firestore
    try:
        from firebase_admin import firestore, initialize_app
        try:
            initialize_app()
        except ValueError:
            pass
        db = firestore.client()
    except Exception as e:
        print(f"\n❌ Error: Could not initialize Firestore: {e}")
        print("This tool requires Firebase Admin credentials.")
        return

    # Load unlabeled queries
    print(f"\nLoading {limit} unlabeled queries...")
    queries = await load_unlabeled_queries(db, limit)

    if not queries:
        print("\n✓ No unlabeled queries found. Great job!")
        return

    print(f"Found {len(queries)} queries to label.\n")

    # Label each query
    labeled_count = 0
    skipped_count = 0

    for i, query_data in enumerate(queries, start=1):
        print(f"\n\nQuery {i}/{len(queries)}")
        display_query_for_labeling(query_data)

        labels = get_relevance_labels(query_data.get('results', []))

        if labels is None:
            print("  ⏭️  Skipped")
            skipped_count += 1
            continue

        await save_labels(db, query_data['id'], labels)
        labeled_count += 1

        # Ask if user wants to continue
        if i < len(queries):
            cont = input("\nContinue to next query? (y/n): ").strip().lower()
            if cont != 'y':
                break

    print("\n" + "=" * 70)
    print("SESSION SUMMARY")
    print("=" * 70)
    print(f"Labeled: {labeled_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Total: {len(queries)}")
    print("")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Label RAG retrieval quality")
    parser.add_argument("--limit", type=int, default=10, help="Number of queries to label")
    args = parser.parse_args()

    asyncio.run(run_labeling_session(limit=args.limit))
