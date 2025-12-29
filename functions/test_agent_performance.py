"""
Marketing Agent Performance Test Suite
Tests Australian communication optimization and overall agent performance.

Run: python test_agent_performance.py
"""

import asyncio
import aiohttp
import time
import statistics
from datetime import datetime
from typing import Dict, List, Any
import json

# Configuration
API_URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app/api/ai/marketing-chat"
HEALTH_URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app/health"

# Test Cases
TEST_CASES = [
    # Australian Exit Signals - should return NO follow-up questions
    {"name": "Exit: Cheers", "message": "Cheers, that's all!", "page_context": "pricing", "expect_no_followups": True},
    {"name": "Exit: No worries", "message": "No worries, got it", "page_context": "services", "expect_no_followups": True},
    {"name": "Exit: Thanks", "message": "Thanks, that's perfect", "page_context": "homepage", "expect_no_followups": True},
    {"name": "Exit: Too easy", "message": "Too easy, legend!", "page_context": "product", "expect_no_followups": True},

    # Regular queries - response should be concise
    {"name": "Simple: Greeting", "message": "Hi there!", "page_context": "homepage", "max_words": 50},
    {"name": "Simple: Services", "message": "What services do you offer?", "page_context": "services", "max_words": 150},
    {"name": "Medium: Pricing", "message": "How much does this cost?", "page_context": "pricing", "max_words": 150},
    {"name": "Complex: Integration", "message": "Can you integrate with Salesforce, HubSpot, and our custom ERP system?", "page_context": "solutions", "max_words": 200},
]

class PerformanceMetrics:
    def __init__(self):
        self.latencies: List[float] = []
        self.word_counts: List[int] = []
        self.results: List[Dict] = []
        self.errors: List[str] = []

    def add_result(self, test_name: str, latency: float, word_count: int,
                   followup_count: int, success: bool, details: str = ""):
        self.latencies.append(latency)
        self.word_counts.append(word_count)
        self.results.append({
            "test": test_name,
            "latency": latency,
            "words": word_count,
            "followups": followup_count,
            "success": success,
            "details": details
        })

    def add_error(self, test_name: str, error: str):
        self.errors.append(f"{test_name}: {error}")

    def get_summary(self) -> Dict:
        if not self.latencies:
            return {"error": "No successful tests"}

        sorted_latencies = sorted(self.latencies)
        n = len(sorted_latencies)

        return {
            "total_tests": len(self.results) + len(self.errors),
            "successful": len(self.results),
            "failed": len(self.errors),
            "latency": {
                "avg": statistics.mean(self.latencies),
                "median": statistics.median(self.latencies),
                "p95": sorted_latencies[int(n * 0.95)] if n > 1 else sorted_latencies[0],
                "p99": sorted_latencies[int(n * 0.99)] if n > 1 else sorted_latencies[0],
                "min": min(self.latencies),
                "max": max(self.latencies),
            },
            "word_count": {
                "avg": statistics.mean(self.word_counts),
                "min": min(self.word_counts),
                "max": max(self.word_counts),
            }
        }


async def check_health(session: aiohttp.ClientSession) -> bool:
    """Check if API is healthy"""
    try:
        async with session.get(HEALTH_URL) as response:
            data = await response.json()
            return data.get("status") == "healthy"
    except Exception as e:
        print(f"Health check failed: {e}")
        return False


async def run_test(session: aiohttp.ClientSession, test_case: Dict, metrics: PerformanceMetrics):
    """Run a single test case"""
    test_name = test_case["name"]
    payload = {
        "message": test_case["message"],
        "page_context": test_case["page_context"]
    }

    start_time = time.time()
    try:
        async with session.post(API_URL, json=payload) as response:
            latency = time.time() - start_time

            if response.status != 200:
                metrics.add_error(test_name, f"HTTP {response.status}")
                return

            data = await response.json()

            if not data.get("success"):
                metrics.add_error(test_name, "API returned success=false")
                return

            response_text = data.get("response", "")
            word_count = len(response_text.split())
            followups = data.get("suggested_questions", [])
            followup_count = len(followups) if followups else 0

            # Evaluate test expectations
            success = True
            details = []

            # Check exit signal behavior
            if test_case.get("expect_no_followups"):
                if followup_count > 0:
                    success = False
                    details.append(f"Expected no followups, got {followup_count}")
                else:
                    details.append("✓ No followups (exit signal respected)")

            # Check word count limits
            max_words = test_case.get("max_words")
            if max_words and word_count > max_words:
                success = False
                details.append(f"Too verbose: {word_count} words (max: {max_words})")
            elif max_words:
                details.append(f"✓ {word_count} words (limit: {max_words})")

            metrics.add_result(
                test_name, latency, word_count, followup_count,
                success, "; ".join(details)
            )

    except Exception as e:
        metrics.add_error(test_name, str(e))


async def run_performance_tests():
    """Run all performance tests"""
    print("=" * 70)
    print("MARKETING AGENT PERFORMANCE TEST SUITE")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"API: {API_URL}")
    print("=" * 70)

    metrics = PerformanceMetrics()

    async with aiohttp.ClientSession() as session:
        # Health check
        print("\n🏥 Health Check...")
        if not await check_health(session):
            print("❌ API is not healthy. Aborting tests.")
            return
        print("✅ API is healthy\n")

        # Run tests
        print("🧪 Running Tests...\n")
        for i, test_case in enumerate(TEST_CASES, 1):
            print(f"  [{i}/{len(TEST_CASES)}] {test_case['name']}...", end=" ", flush=True)
            await run_test(session, test_case, metrics)

            # Get last result
            if metrics.results and metrics.results[-1]["test"] == test_case["name"]:
                result = metrics.results[-1]
                status = "✅" if result["success"] else "⚠️"
                print(f"{status} {result['latency']:.2f}s, {result['words']} words")
            else:
                print("❌ Failed")

            # Small delay between tests
            await asyncio.sleep(0.5)

    # Print summary
    summary = metrics.get_summary()

    print("\n" + "=" * 70)
    print("PERFORMANCE SUMMARY")
    print("=" * 70)

    print(f"\n📊 Test Results: {summary['successful']}/{summary['total_tests']} passed")

    print(f"\n⏱️ Latency (seconds):")
    print(f"   Average: {summary['latency']['avg']:.3f}s")
    print(f"   Median:  {summary['latency']['median']:.3f}s")
    print(f"   P95:     {summary['latency']['p95']:.3f}s")
    print(f"   P99:     {summary['latency']['p99']:.3f}s")
    print(f"   Range:   {summary['latency']['min']:.3f}s - {summary['latency']['max']:.3f}s")

    print(f"\n📝 Response Length (words):")
    print(f"   Average: {summary['word_count']['avg']:.0f} words")
    print(f"   Range:   {summary['word_count']['min']} - {summary['word_count']['max']} words")

    # Detailed results
    print("\n" + "-" * 70)
    print("DETAILED RESULTS")
    print("-" * 70)

    for result in metrics.results:
        status = "✅" if result["success"] else "❌"
        print(f"\n{status} {result['test']}")
        print(f"   Latency: {result['latency']:.2f}s | Words: {result['words']} | Followups: {result['followups']}")
        if result['details']:
            print(f"   Details: {result['details']}")

    if metrics.errors:
        print("\n❌ ERRORS:")
        for error in metrics.errors:
            print(f"   {error}")

    # Performance grade
    print("\n" + "=" * 70)
    pass_rate = summary['successful'] / summary['total_tests'] * 100
    avg_latency = summary['latency']['avg']
    avg_words = summary['word_count']['avg']

    if pass_rate >= 90 and avg_latency < 5 and avg_words < 100:
        grade = "A - Excellent"
    elif pass_rate >= 80 and avg_latency < 10 and avg_words < 150:
        grade = "B - Good"
    elif pass_rate >= 70 and avg_latency < 15:
        grade = "C - Acceptable"
    else:
        grade = "D - Needs Improvement"

    print(f"OVERALL GRADE: {grade}")
    print("=" * 70)

    return {
        "summary": summary,
        "results": metrics.results,
        "errors": metrics.errors,
        "grade": grade
    }


if __name__ == "__main__":
    asyncio.run(run_performance_tests())
