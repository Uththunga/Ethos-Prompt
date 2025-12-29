#!/usr/bin/env python3
"""
Weekly Drift Analysis Cron Job
Detects query distribution drift and sends alerts
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


async def analyze_drift():
    """Run weekly drift analysis"""
    try:
        # Initialize Firebase
        try:
            from firebase_admin import firestore, initialize_app
            try:
                initialize_app()
            except ValueError:
                pass  # Already initialized

            db = firestore.client()
            logger.info("Firestore initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Firestore: {e}")
            return

        # Import drift monitor
        from src.ai_agent.marketing.data_drift_monitor import DataDriftMonitor

        monitor = DataDriftMonitor(db)

        # Detect drift
        logger.info("Running drift detection...")
        report = await monitor.detect_drift(threshold=0.2, lookback_days=30)

        # Print report
        print("\n" + "="*70)
        print("DRIFT ANALYSIS REPORT")
        print("="*70)
        print(f"Timestamp: {report.get('timestamp')}")
        print(f"Drift Detected: {report.get('drift_detected')}")
        print(f"KL Divergence: {report.get('kl_divergence')}")
        print(f"Threshold: {report.get('threshold')}")
        print(f"\nBaseline Period: {report.get('baseline_period')}")
        print(f"Current Period: {report.get('current_period')}")

        print("\nBaseline Distribution:")
        for cat, pct in report.get('baseline_distribution', {}).items():
            print(f"  {cat}: {pct}%")

        print("\nCurrent Distribution:")
        for cat, pct in report.get('current_distribution', {}).items():
            print(f"  {cat}: {pct}%")

        if report.get('category_shifts'):
            print("\nSignificant Shifts:")
            for shift in report['category_shifts']:
                print(f"  {shift['category']}: {shift['baseline_pct']}% → {shift['current_pct']}% ({shift['change']:+.1f}%)")

        print("="*70 + "\n")

        # Send alert if drift detected
        if report.get("drift_detected"):
            logger.warning("⚠️ DRIFT DETECTED")
            # TODO: Send Slack/Email alert
            # Example: send_slack_alert(report)
        else:
            logger.info("✓ No drift detected")

    except Exception as e:
        logger.error(f"Error in drift analysis: {e}", exc_info=True)


if __name__ == "__main__":
    asyncio.run(analyze_drift())
