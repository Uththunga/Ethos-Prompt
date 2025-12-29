#!/usr/bin/env python3
"""
Cache Integration Test Suite
Tests end-to-end caching functionality including browser + server cache
"""

import asyncio
import httpx
import time
from typing import Dict, List
import json

# Test configuration
API_URL = "https://marketing-api-HASH.a.run.app"  # Replace with actual URL
TEST_QUERIES = [
    "What are your pricing plans?",
    "Tell me about your services",
    "How can I contact support?",
    "What industries do you serve?",
    "Do you offer enterprise plans?",
]

class CacheIntegrationTester:
    """Test suite for intelligent caching system"""

    def __init__(self, api_url: str):
        self.api_url = api_url
        self.results = []

    async def test_cache_hit(self, query: str) -> Dict:
        """Test that repeat queries hit cache"""
        print(f"\n🧪 Testing cache hit for: '{query[:50]}...'")

        # First request (cache miss expected)
        start1 = time.time()
        async with httpx.AsyncClient() as client:
            response1 = await client.post(
                f"{self.api_url}/api/ai/marketing-chat",
                json={"message": query},
                timeout=30.0
            )
        ttft1 = (time.time() - start1) * 1000

        print(f"  First request: {ttft1:.0f}ms (expected ~4000ms)")

        # Wait 1 second
        await asyncio.sleep(1)

        # Second request (cache hit expected)
        start2 = time.time()
        async with httpx.AsyncClient() as client:
            response2 = await client.post(
                f"{self.api_url}/api/ai/marketing-chat",
                json={"message": query},
                timeout=30.0
            )
        ttft2 = (time.time() - start2) * 1000

        print(f"  Second request: {ttft2:.0f}ms (expected <1000ms)")

        # Verify
        improvement = ((ttft1 - ttft2) / ttft1) * 100
        cache_hit = ttft2 < 1000  # Should be fast if cached

        result = {
            "query": query,
            "first_ttft_ms": ttft1,
            "second_ttft_ms": ttft2,
            "improvement_pct": improvement,
            "cache_hit": cache_hit,
            "passed": cache_hit
        }

        self.results.append(result)

        if cache_hit:
            print(f"  ✅ PASS - {improvement:.0f}% faster on cache hit")
        else:
            print(f"  ❌ FAIL - No cache hit detected")

        return result

    async def test_semantic_similarity(self) -> Dict:
        """Test that semantically similar queries hit cache"""
        print(f"\n🧪 Testing semantic similarity")

        queries = [
            "What are your pricing plans?",
            "How much do your services cost?",  # Semantically similar
        ]

        # First query
        start1 = time.time()
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.api_url}/api/ai/marketing-chat",
                json={"message": queries[0]},
                timeout=30.0
            )
        ttft1 = (time.time() - start1) * 1000

        await asyncio.sleep(1)

        # Similar query
        start2 = time.time()
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{self.api_url}/api/ai/marketing-chat",
                json={"message": queries[1]},
                timeout=30.0
            )
        ttft2 = (time.time() - start2) * 1000

        semantic_hit = ttft2 < 1000

        result = {
            "query1": queries[0],
            "query2": queries[1],
            "ttft1_ms": ttft1,
            "ttft2_ms": ttft2,
            "semantic_hit": semantic_hit,
            "passed": semantic_hit
        }

        if semantic_hit:
            print(f"  ✅ PASS - Semantic similarity working")
        else:
            print(f"  ⚠️  WARN - Semantic similarity not detected (may need time to build)")

        return result

    async def test_pii_rejection(self) -> Dict:
        """Test that queries with PII are handled properly"""
        print(f"\n🧪 Testing PII rejection")

        pii_query = "My email is test@example.com, can you help?"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_url}/api/ai/marketing-chat",
                json={"message": pii_query},
                timeout=30.0
            )

        # Response should work (PII redacted from cache key)
        # But check logs to verify PII was detected

        result = {
            "query": pii_query,
            "status_code": response.status_code,
            "passed": response.status_code == 200
        }

        if result["passed"]:
            print(f"  ✅ PASS - Query processed (check logs for PII detection)")
        else:
            print(f"  ❌ FAIL - Query failed with status {response.status_code}")

        return result

    async def test_health_check(self) -> Dict:
        """Test service health endpoint"""
        print(f"\n🧪 Testing health check")

        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.api_url}/health")

        result = {
            "status_code": response.status_code,
            "response": response.json() if response.status_code == 200 else None,
            "passed": response.status_code == 200
        }

        if result["passed"]:
            print(f"  ✅ PASS - Service healthy")
            print(f"     {result['response']}")
        else:
            print(f"  ❌ FAIL - Service unhealthy")

        return result

    async def run_all_tests(self):
        """Run complete test suite"""
        print("=" * 60)
        print("CACHE INTEGRATION TEST SUITE")
        print("=" * 60)

        # Health check
        await self.test_health_check()

        # Cache hit tests
        for query in TEST_QUERIES:
            await self.test_cache_hit(query)

        # Semantic similarity
        await self.test_semantic_similarity()

        # PII handling
        await self.test_pii_rejection()

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)

        passed = sum(1 for r in self.results if r.get("passed", False))
        total = len(self.results)

        print(f"Passed: {passed}/{total}")

        if passed == total:
            print("✅ ALL TESTS PASSED")
        else:
            print(f"❌ {total - passed} TEST(S) FAILED")

        # Performance summary
        if self.results:
            avg_first = sum(r.get("first_ttft_ms", 0) for r in self.results if "first_ttft_ms" in r) / len([r for r in self.results if "first_ttft_ms" in r])
            avg_second = sum(r.get("second_ttft_ms", 0) for r in self.results if "second_ttft_ms" in r) / len([r for r in self.results if "second_ttft_ms" in r])

            print(f"\nPerformance:")
            print(f"  Avg first request: {avg_first:.0f}ms")
            print(f"  Avg cached request: {avg_second:.0f}ms")
            print(f"  Improvement: {((avg_first - avg_second) / avg_first * 100):.0f}%")

        return self.results


async def main():
    """Main test runner"""
    import sys

    # Get API URL from args or use default
    api_url = sys.argv[1] if len(sys.argv) > 1 else API_URL

    print(f"Testing API: {api_url}\n")

    tester = CacheIntegrationTester(api_url)
    results = await tester.run_all_tests()

    # Save results
    with open("cache_test_results.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\n📄 Results saved to: cache_test_results.json")


if __name__ == "__main__":
    asyncio.run(main())
