#!/usr/bin/env python3
"""
Simple Cache Warming - Manual Approach
Warm cache by making repeated API calls to common queries
"""

import requests
import time
import json
from datetime import datetime

# Staging endpoint
BASE_URL = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat/stream"

# Top 20 most common queries (from FAQ library)
TOP_QUERIES = [
    # Pricing (highest volume)
    ("What are your pricing plans?", "pricing"),
    ("How much do your services cost?", "pricing"),
    ("Can I get a quote?", "pricing"),
    ("What payment methods do you accept?", "pricing"),

    # Services
    ("What services do you offer?", "services"),
    ("Tell me about your core services", "services"),
    ("What can EthosPrompt help me with?", "services"),

    # Getting Started
    ("How do I get started?", "getting_started"),
    ("Can I schedule a demo?", "getting_started"),
    ("What is the onboarding process?", "getting_started"),

    # AI Capabilities
    ("What AI capabilities do you offer?", "ai_capabilities"),
    ("How does your AI agent work?", "ai_capabilities"),
    ("What LLM models do you use?", "ai_capabilities"),

    # Integration
    ("How does system integration work?", "integration"),
    ("What systems can you integrate with?", "integration"),

    # Security
    ("How secure is your platform?", "security"),
    ("Do you comply with GDPR?", "security"),

    # Support
    ("What support do you provide?", "support"),
    ("Do you provide 24/7 support?", "support"),

    # Performance
    ("How fast is your platform?", "performance"),
]

def warm_cache(queries, throttle_ms=2000):
    """Warm cache by calling API for each query"""
    print("=" * 60)
    print("🔥 MANUAL CACHE WARMING")
    print("=" * 60)
    print(f"Queries to process: {len(queries)}")
    print(f"Throttle: {throttle_ms}ms between requests")
    print()

    results = []

    for i, (query, page_context) in enumerate(queries, 1):
        try:
            print(f"[{i}/{len(queries)}] Processing: {query[:50]}...")

            # Build URL
            import urllib.parse
            encoded_query = urllib.parse.quote(query)
            url = f"{BASE_URL}?message={encoded_query}&page_context={page_context}"

            # Make request
            start_time = time.time()
            response = requests.get(url, timeout=60)
            elapsed = time.time() - start_time

            if response.status_code == 200:
                # Parse response
                content_length = len(response.text)
                print(f"    ✅ Success ({elapsed:.2f}s, {content_length} chars)")
                results.append({
                    "query": query,
                    "status": "success",
                    "elapsed_seconds": elapsed,
                    "content_length": content_length
                })
            else:
                print(f"    ❌ Error: HTTP {response.status_code}")
                results.append({
                    "query": query,
                    "status": "error",
                    "http_status": response.status_code
                })

            # Throttle
            time.sleep(throttle_ms / 1000)

        except Exception as e:
            print(f"    ❌ Exception: {str(e)}")
            results.append({
                "query": query,
                "status": "exception",
                "error": str(e)
            })

    # Summary
    print()
    print("=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)

    success_count = sum(1 for r in results if r["status"] == "success")
    error_count = len(results) - success_count

    print(f"Total queries: {len(results)}")
    print(f"Successful: {success_count}")
    print(f"Errors: {error_count}")

    if success_count > 0:
        avg_time = sum(r.get("elapsed_seconds", 0) for r in results if r["status"] == "success") / success_count
        print(f"Avg response time: {avg_time:.2f}s")

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"cache_warming_results_{timestamp}.json"

    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nResults saved to: {output_file}")
    print()
    print("✅ Cache warming complete!")
    print("Note: Cached responses will be instant on subsequent requests")

if __name__ == "__main__":
    warm_cache(TOP_QUERIES, throttle_ms=2000)
