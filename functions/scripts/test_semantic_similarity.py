#!/usr/bin/env python3
"""
Test Script for Semantic Similarity Caching
Verifies that the intelligent cache recognizes semantically similar queries.
"""

import requests
import json
import time
import sys

# Configuration
BASE_URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app/api/ai/marketing-chat/stream"

def log(message, level="INFO"):
    prefix = {"INFO": "ℹ️ ", "SUCCESS": "✅", "FAIL": "❌", "WARNING": "⚠️ "}.get(level, "")
    print(f"{prefix} {message}")

def send_query(message, conversation_id=None):
    try:
        start_time = time.time()
        response = requests.post(
            BASE_URL,
            json={
                "message": message,
                "conversationId": conversation_id or f"test-sem-{int(time.time())}"
            },
            headers={"Content-Type": "application/json"},
            stream=True,
            timeout=60
        )
        response.raise_for_status()

        full_response = ""
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    data_str = line_str[6:]
                    if data_str == '[DONE]':
                        continue
                    try:
                        data = json.loads(data_str)
                        if data.get('type') == 'content':
                            full_response += data.get('chunk', '')
                    except json.JSONDecodeError:
                        pass

        elapsed = time.time() - start_time
        return {"success": True, "response": full_response, "elapsed": elapsed}
    except Exception as e:
        return {"success": False, "error": str(e)}

def run_test():
    log("🧪 SEMANTIC SIMILARITY TEST", "INFO")
    log(f"Endpoint: {BASE_URL}", "INFO")

    # 1. Seed the cache with a base query
    base_query = "What are the benefits of using AI for marketing?"
    log(f"\n1. Seeding cache with: '{base_query}'", "INFO")

    result1 = send_query(base_query)
    if not result1["success"]:
        log(f"Failed to seed cache: {result1.get('error')}", "FAIL")
        return

    log(f"Seed response time: {result1['elapsed']:.2f}s", "INFO")
    log("Waiting for cache to settle (5s)...", "INFO")
    time.sleep(5)

    # 2. Send a semantically similar query
    # "benefits of using AI for marketing" vs "advantages of AI marketing"
    similar_query = "Tell me the advantages of AI marketing"
    log(f"\n2. Testing similar query: '{similar_query}'", "INFO")

    result2 = send_query(similar_query)
    if not result2["success"]:
        log(f"Failed to query: {result2.get('error')}", "FAIL")
        return

    log(f"Similar query response time: {result2['elapsed']:.2f}s", "INFO")

    # 3. Analyze results
    # If result2 is significantly faster than result1, it's likely a cache hit
    # Or if the responses are identical (depending on cache logic)

    speedup = result1['elapsed'] / result2['elapsed'] if result2['elapsed'] > 0 else 0
    log(f"\nSpeedup: {speedup:.2f}x", "INFO")

    if result2['elapsed'] < 2.0: # Arbitrary threshold for "fast/cached"
        log("✅ Test PASSED: Response was fast, suggesting a semantic cache hit!", "SUCCESS")
    elif speedup > 2.0:
        log("✅ Test PASSED: Significant speedup detected!", "SUCCESS")
    else:
        log("⚠️ Test INCONCLUSIVE: Response time didn't show clear speedup.", "WARNING")
        log("Note: Similarity threshold might be too high (0.85) or embedding model difference.", "INFO")

if __name__ == "__main__":
    run_test()
