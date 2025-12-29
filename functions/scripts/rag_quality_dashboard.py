#!/usr/bin/env python3
"""
RAG Quality Dashboard
Generates weekly quality report from labeled data
"""
import asyncio
import logging
import sys
import os
from datetime import datetime

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def generate_report():
    """Generate RAG quality report"""
    try:
        # Initialize Firebase
        try:
            from firebase_admin import firestore, initialize_app
            try:
                initialize_app()
            except ValueError:
                pass

            db = firestore.client()
            logger.info("Firestore initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Firestore: {e}")
            return

        # Import quality metrics
        from src.ai_agent.marketing.rag_quality_metrics import RAGQualityMetrics

        metrics = RAGQualityMetrics(db)

        # Get trends
        logger.info("Calculating quality trends...")
        trends = await metrics.get_quality_trends(days=30)

        # Print report
        print("\n" + "="*70)
        print("RAG QUALITY REPORT (Last 30 Days)")
        print("="*70)
        print(f"Timestamp: {datetime.now().isoformat()}")
        print(f"Sample Size: {trends.get('sample_size', 0)} labeled queries")
        print(f"Period: {trends.get('period_days', 30)} days")
        print()

        if trends.get('sample_size', 0) > 0:
            print("METRICS:")
            print(f"  Avg MRR (Mean Reciprocal Rank): {trends.get('avg_mrr', 'N/A')}")
            print(f"  Avg NDCG@5: {trends.get('avg_ndcg', 'N/A')}")
            print()
            print("INTERPRETATION:")
            print("  MRR: 1.0 = perfect (first result always relevant)")
            print("       0.5 = relevant result typically at rank 2")
            print("  NDCG@5: 1.0 = perfect ranking of top 5 results")
            print("          >0.8 = excellent")
            print("          >0.6 = good")
            print()

            # Quality assessment
            avg_mrr = trends.get('avg_mrr')
            avg_ndcg = trends.get('avg_ndcg')

            if avg_mrr and avg_ndcg:
                if avg_mrr > 0.8 and avg_ndcg > 0.8:
                    print("✅ STATUS: Excellent retrieval quality")
                elif avg_mrr > 0.6 and avg_ndcg > 0.6:
                    print("⚠️  STATUS: Good quality, room for improvement")
                else:
                    print("❌ STATUS: Poor quality, needs attention")
        else:
            print("⚠️  NO DATA: No labeled queries found")
            print("   Run: python scripts/label_retrieval_quality.py --limit 10")

        print("="*70 + "\n")

    except Exception as e:
        logger.error(f"Error generating report: {e}", exc_info=True)


if __name__ == "__main__":
    asyncio.run(generate_report())
