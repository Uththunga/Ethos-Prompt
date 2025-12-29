"""
Scheduled script to run weekly drift analysis
Should be triggered by Cloud Scheduler or cron
"""

import asyncio
import logging
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.ai_agent.marketing.data_drift_monitor import DataDriftMonitor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def run_weekly_drift_analysis():
    """Run weekly drift analysis and send alerts if needed"""
    logger.info("🔍 Starting weekly drift analysis...")

    # Initialize Firestore (production will have this configured)
    try:
        from firebase_admin import firestore, initialize_app
        try:
            initialize_app()
        except ValueError:
            # Already initialized
            pass
        db = firestore.client()
    except Exception as e:
        logger.error(f"Failed to initialize Firestore: {e}")
        logger.warning("Running in dry-run mode without database")
        db = None

    # Run drift detection
    monitor = DataDriftMonitor(db)
    report = await monitor.detect_drift(threshold=0.2, lookback_days=30)

    # Print results
    print("\n" + "=" * 60)
    print("DRIFT DETECTION REPORT")
    print("=" * 60)
    print(f"Timestamp: {report.get('timestamp', 'N/A')}")
    print(f"Baseline Period: {report.get('baseline_period', 'N/A')}")
    print(f"Current Period: {report.get('current_period', 'N/A')}")
    print(f"\nKL Divergence: {report.get('kl_divergence', 0.0)}")
    print(f"Threshold: {report.get('threshold', 0.2)}")
    print(f"Drift Detected: {'⚠️ YES' if report.get('drift_detected') else '✓ NO'}")

    if report.get('baseline_distribution'):
        print("\nDistributions:")
        print("Category       Baseline  Current   Change")
        print("-" * 50)
        baseline = report['baseline_distribution']
        current = report['current_distribution']
        for cat in sorted(baseline.keys()):
            b_pct = baseline.get(cat, 0.0)
            c_pct = current.get(cat, 0.0)
            change = c_pct - b_pct
            arrow = "↑" if change > 0 else "↓" if change < 0 else "→"
            print(f"{cat:12s}   {b_pct:5.1f}%    {c_pct:5.1f}%   {arrow} {abs(change):4.1f}%")

    if report.get('category_shifts'):
        print("\nSignificant Shifts (>5%):")
        for shift in report['category_shifts']:
            print(f"  - {shift['category']}: {shift['change']:+.1f}% "
                  f"({shift['baseline_pct']:.1f}% → {shift['current_pct']:.1f}%)")

    print("=" * 60 + "\n")

    # Send alerts if drift detected
    if report.get('drift_detected'):
        await send_drift_alert(report)

    return report


async def send_drift_alert(report: dict):
    """
    Send drift alert notification.

    TODO: Integrate with actual notification service (Slack, Email, etc.)

    Args:
        report: Drift detection report
    """
    logger.warning("⚠️ DRIFT ALERT TRIGGERED")
    logger.warning(f"KL Divergence: {report.get('kl_divergence')}")
    logger.warning(f"Significant shifts: {len(report.get('category_shifts', []))}")

    # TODO: Send to Slack
    # slack_webhook = os.getenv("SLACK_WEBHOOK_URL")
    # if slack_webhook:
    #     await send_slack_notification(slack_webhook, report)

    # TODO: Send email
    # email_list = os.getenv("DRIFT_ALERT_EMAILS", "").split(",")
    # if email_list:
    #     await send_email_notification(email_list, report)

    print("\n🔔 ALERT: Drift detected! (Notifications not configured)")


if __name__ == "__main__":
    asyncio.run(run_weekly_drift_analysis())
