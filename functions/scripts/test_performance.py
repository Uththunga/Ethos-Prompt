#!/usr/bin/env python3
"""
Performance profiling script for marketing agent streaming endpoint.
Measures TTFT (time to first token), total latency, and token generation rate.
"""

import httpx
import time
import json
from typing import Dict, List

STAGING_URL = "https://marketing-api-857724136585.australia-southeast1.run.app"

def profile_query(query: str, page_context: str = "pricing") -> Dict:
    """Profile a single query and return detailed metrics."""

    url = f"{STAGING_URL}/api/ai/marketing-chat/stream"
    params = {
        "message": query,
        "page_context": page_context
    }

    metrics = {
        "query": query,
        "start_time": None,
        "ttft": None,  # Time to first token
        "first_chunk_time": None,
        "last_chunk_time": None,
        "total_time": None,
        "chunks_received": 0,
        "total_chars": 0,
        "chunks": [],
        "metadata": None
    }

    print(f"\n{'='*80}")
    print(f"Testing: {query[:50]}...")
    print(f"{'='*80}")

    try:
        start = time.time()
        metrics["start_time"] = start

        with httpx.stream("GET", url, params=params, timeout=60.0) as response:
            if response.status_code != 200:
                print(f"❌ Error: HTTP {response.status_code}")
                return metrics

            for line in response.iter_lines():
                if not line or not line.startswith("data: "):
                    continue

                data_str = line[6:]  # Remove "data: " prefix

                if data_str == "[DONE]":
                    metrics["last_chunk_time"] = time.time()
                    break

                try:
                    data = json.loads(data_str)

                    # Track metadata
                    if data.get("type") == "metadata":
                        metrics["metadata"] = data
                        continue

                    # Track content chunks
                    if data.get("type") == "content":
                        chunk_time = time.time()

                        # First chunk = TTFT
                        if metrics["ttft"] is None:
                            metrics["ttft"] = chunk_time - start
                            metrics["first_chunk_time"] = chunk_time
                            print(f"⏱️  TTFT: {metrics['ttft']:.2f}s")

                        chunk_text = data.get("chunk", "")
                        metrics["chunks_received"] += 1
                        metrics["total_chars"] += len(chunk_text)
                        metrics["chunks"].append({
                            "time": chunk_time - start,
                            "text": chunk_text[:50]
                        })

                except json.JSONDecodeError:
                    continue

        metrics["total_time"] = time.time() - start

        # Calculate derived metrics
        if metrics["ttft"] and metrics["last_chunk_time"]:
            generation_time = metrics["last_chunk_time"] - metrics["first_chunk_time"]
            if generation_time > 0:
                chars_per_sec = metrics["total_chars"] / generation_time
                metrics["chars_per_sec"] = chars_per_sec

        # Print summary
        print(f"\n📊 Performance Metrics:")
        print(f"   TTFT (Time to First Token): {metrics['ttft']:.2f}s")
        print(f"   Total Time: {metrics['total_time']:.2f}s")
        print(f"   Chunks Received: {metrics['chunks_received']}")
        print(f"   Total Characters: {metrics['total_chars']}")
        if "chars_per_sec" in metrics:
            print(f"   Generation Speed: {metrics['chars_per_sec']:.1f} chars/sec")

        # Identify bottleneck
        if metrics["ttft"] and metrics["total_time"]:
            ttft_percent = (metrics["ttft"] / metrics["total_time"]) * 100
            print(f"\n🔍 Bottleneck Analysis:")
            print(f"   Time before first chunk: {metrics['ttft']:.2f}s ({ttft_percent:.1f}%)")
            print(f"   Time generating chunks: {metrics['total_time'] - metrics['ttft']:.2f}s ({100-ttft_percent:.1f}%)")

            if ttft_percent > 70:
                print(f"   ⚠️  BOTTLENECK: Cold start / LLM initialization (>{ttft_percent:.0f}% of time)")
            elif ttft_percent > 50:
                print(f"   ⚠️  BOTTLENECK: Network latency / Tool execution")
            else:
                print(f"   ⚠️  BOTTLENECK: Slow token generation")

    except Exception as e:
        print(f"❌ Error: {e}")

    return metrics


def main():
    print("🚀 MARKETING AGENT PERFORMANCE PROFILING")
    print("="*80)

    test_queries = [
        ("Hello, who are you?", "home"),
        ("What services does EthosPrompt offer?", "services"),
        ("What are your pricing plans?", "pricing"),
    ]

    all_metrics = []

    for query, context in test_queries:
        metrics = profile_query(query, context)
        all_metrics.append(metrics)
        time.sleep(2)  # Brief pause between tests

    # Overall summary
    print(f"\n{'='*80}")
    print("📈 OVERALL SUMMARY")
    print(f"{'='*80}")

    avg_ttft = sum(m["ttft"] for m in all_metrics if m["ttft"]) / len([m for m in all_metrics if m["ttft"]])
    avg_total = sum(m["total_time"] for m in all_metrics if m["total_time"]) / len([m for m in all_metrics if m["total_time"]])

    print(f"Average TTFT: {avg_ttft:.2f}s")
    print(f"Average Total Time: {avg_total:.2f}s")

    # Identify consistent issues
    high_ttft_count = sum(1 for m in all_metrics if m.get("ttft", 0) > 5)
    if high_ttft_count > 0:
        print(f"\n⚠️  {high_ttft_count}/{len(all_metrics)} queries had TTFT > 5s")
        print("   Likely causes:")
        print("   - Cold start (Cloud Run instance warming up)")
        print("   - Watsonx API latency")
        print("   - Agent initialization overhead")

if __name__ == "__main__":
    main()
