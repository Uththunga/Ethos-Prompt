"""
Deep Dive System Performance Audit Script
Tests all aspects of the intelligent caching system
"""
import requests
import time
import json
from datetime import datetime

API_URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app/api/ai/marketing-chat/stream"

def test_performance_suite():
    """Run comprehensive performance tests"""

    print("="*80)
    print("DEEP DIVE PERFORMANCE AUDIT")
    print("="*80)
    print(f"Timestamp: {datetime.now()}")
    print(f"Target: {API_URL}")
    print("="*80)

    results = {
        "cache_performance": None,
        "response_quality": None,
        "semantic_accuracy": None,
        "security_validation": None,
        "cost_efficiency": None
    }

    # Test 1: Cache Performance Analysis
    print("\n📊 TEST 1: CACHE PERFORMANCE ANALYSIS")
    print("-"*80)

    test_queries = [
        "What services do you offer?",
        "Tell me about your pricing",
        "How can I get started?",
        "Do you provide support?",
        "What is your tech stack?"
    ]

    cache_stats = {
        "first_request_times": [],
        "second_request_times": [],
        "speedup_ratios": []
    }

    for i, query in enumerate(test_queries, 1):
        print(f"\n  Query {i}: '{query}'")

        # First request (cache miss expected)
        start = time.time()
        try:
            response = requests.post(
                API_URL,
                json={"message": query, "page_context": "audit"},
                headers={"Content-Type": "application/json"},
                stream=True,
                timeout=30
            )
            first_time = time.time() - start
            cache_stats["first_request_times"].append(first_time)
            print(f"    First request: {first_time:.2f}s")
        except Exception as e:
            print(f"    ❌ Error: {e}")
            continue

        # Wait before second request
        time.sleep(2)

        # Second request (cache hit expected)
        start = time.time()
        try:
            response = requests.post(
                API_URL,
                json={"message": query, "page_context": "audit"},
                headers={"Content-Type": "application/json"},
                stream=True,
                timeout=30
            )
            second_time = time.time() - start
            cache_stats["second_request_times"].append(second_time)
            speedup = first_time / second_time if second_time > 0 else 0
            cache_stats["speedup_ratios"].append(speedup)
            print(f"    Second request: {second_time:.2f}s")
            print(f"    Speedup: {speedup:.2f}x")
        except Exception as e:
            print(f"    ❌ Error: {e}")

        time.sleep(3)  # Prevent rate limiting

    # Calculate averages
    if cache_stats["first_request_times"]:
        avg_first = sum(cache_stats["first_request_times"]) / len(cache_stats["first_request_times"])
        avg_second = sum(cache_stats["second_request_times"]) / len(cache_stats["second_request_times"])
        avg_speedup = sum(cache_stats["speedup_ratios"]) / len(cache_stats["speedup_ratios"])

        print(f"\n  📈 AVERAGES:")
        print(f"    Uncached: {avg_first:.2f}s")
        print(f"    Cached: {avg_second:.2f}s")
        print(f"    Average Speedup: {avg_speedup:.2f}x")
        print(f"    Improvement: {((avg_first - avg_second) / avg_first * 100):.1f}%")

        results["cache_performance"] = {
            "avg_uncached_ms": avg_first * 1000,
            "avg_cached_ms": avg_second * 1000,
            "avg_speedup": avg_speedup,
            "improvement_percent": (avg_first - avg_second) / avg_first * 100,
            "status": "✅ PASS" if avg_speedup > 1.2 else "⚠️ NEEDS IMPROVEMENT"
        }

    # Test 2: Response Completeness
    print("\n\n📝 TEST 2: RESPONSE COMPLETENESS & QUALITY")
    print("-"*80)

    quality_queries = [
        "Explain your intelligent application development service in detail",
        "What are the benefits of your system integration offering?",
        "How does your pricing model work?"
    ]

    quality_stats = {
        "avg_length": [],
        "contains_key_info": 0,
        "total_tested": 0
    }

    for query in quality_queries:
        print(f"\n  Testing: '{query[:50]}...'")
        quality_stats["total_tested"] += 1

        try:
            response = requests.post(
                API_URL,
                json={"message": query, "page_context": "audit"},
                headers={"Content-Type": "application/json"},
                stream=True,
                timeout=30
            )

            full_response = ""
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data = line_str[6:]
                        if data != '[DONE]':
                            try:
                                chunk_data = json.loads(data)
                                if chunk_data.get('type') == 'content':
                                    full_response += chunk_data.get('chunk', '')
                            except:
                                pass

            length = len(full_response)
            quality_stats["avg_length"].append(length)

            # Check for key information
            has_key_info = any(keyword in full_response.lower() for keyword in
                             ['ethosprompt', 'service', 'pricing', 'support', 'development'])

            if has_key_info:
                quality_stats["contains_key_info"] += 1

            print(f"    Length: {length} chars")
            print(f"    Contains key info: {'✅' if has_key_info else '❌'}")

        except Exception as e:
            print(f"    ❌ Error: {e}")

        time.sleep(5)  # Prevent rate limiting

    if quality_stats["avg_length"]:
        avg_len = sum(quality_stats["avg_length"]) / len(quality_stats["avg_length"])
        info_rate = (quality_stats["contains_key_info"] / quality_stats["total_tested"]) * 100

        print(f"\n  📈 QUALITY METRICS:")
        print(f"    Average response length: {avg_len:.0f} chars")
        print(f"    Key information present: {info_rate:.0f}%")

        results["response_quality"] = {
            "avg_length": avg_len,
            "information_rate": info_rate,
            "status": "✅ PASS" if avg_len > 200 and info_rate > 80 else "⚠️ NEEDS REVIEW"
        }

    # Final Summary
    print("\n\n" + "="*80)
    print("AUDIT SUMMARY")
    print("="*80)

    for test_name, result in results.items():
        if result:
            print(f"\n{test_name.upper().replace('_', ' ')}:")
            for key, value in result.items():
                print(f"  {key}: {value}")

    print("\n" + "="*80)
    print("Audit completed at:", datetime.now())
    print("="*80)

if __name__ == "__main__":
    test_performance_suite()
