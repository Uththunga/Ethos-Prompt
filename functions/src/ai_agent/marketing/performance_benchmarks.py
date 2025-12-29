import time
import requests
import statistics
import concurrent.futures
import json
import logging
from typing import List, Dict, Any
from datetime import datetime

# Configuration
SERVICE_URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app"
ENDPOINT = f"{SERVICE_URL}/api/ai/marketing-chat"
NUM_REQUESTS = 10
CONCURRENT_REQUESTS = 5

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

COMPLEX_QUERIES = [
    "Compare the specific benefits of the Smart Business Assistant vs System Integration services, citing at least 3 differences.",
    "Explain the detailed pricing model differences between a standard consultation and a custom enterprise project.",
    "What are the technical prerequisites for deploying an Intelligent Application, and how does your team handle security compliance?",
    "Create a step-by-step implementation plan for a healthcare company wanting to use your RAG services.",
    "Analyze the ROI of using EthosPrompt for a marketing team of 20 people based on your efficiency metrics."
]

def measure_request(request_id: int, query: Optional[str] = None) -> Dict[str, Any]:
    """Sends a request and benchmarks the timing."""
    if query is None:
        query = "What is the pricing model for your services?"

    payload = {
        "message": query,
        "thread_id": f"benchmark_thread_{request_id}_{int(time.time())}"
    }

    start_time = time.time()
    try:
        response = requests.post(ENDPOINT, json=payload, timeout=60)
        end_time = time.time()

        latency = end_time - start_time
        status_code = response.status_code

        # Calculate approximate tokens (very rough estimate)
        content_length = len(response.text)
        approx_tokens = content_length / 4

        return {
            "request_id": request_id,
            "latency": latency,
            "status_code": status_code,
            "approx_tokens": approx_tokens,
            "success": 200 <= status_code < 300,
            "error": None if 200 <= status_code < 300 else f"Status: {status_code}"
        }
    except Exception as e:
        end_time = time.time()
        return {
            "request_id": request_id,
            "latency": end_time - start_time,
            "status_code": 0,
            "approx_tokens": 0,
            "success": False,
            "error": str(e)
        }

def run_benchmark(concurrency=1, queries: Optional[List[str]] = None):
    logger.info(f"Starting benchmark with concurrency {concurrency}...")
    results = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as executor:
        if queries:
            futures = [executor.submit(measure_request, i, queries[i % len(queries)]) for i in range(len(queries))]
        else:
            futures = [executor.submit(measure_request, i) for i in range(NUM_REQUESTS)]

        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())

    return results

def analyze_results(results: List[Dict[str, Any]], title="BENCHMARK RESULTS"):
    successful_results = [r for r in results if r["success"]]
    failed_results = [r for r in results if not r["success"]]

    print("\n" + "="*40)
    print(f" {title}")
    print("="*40)

    if not successful_results:
        print("All requests failed.")
        if failed_results:
            print("\nFailures:")
            for fail in failed_results:
                print(f"- Request {fail['request_id']}: {fail['error']}")
        return

    latencies = [r["latency"] for r in successful_results]
    tokens = [r["approx_tokens"] for r in successful_results]

    avg_latency = statistics.mean(latencies)
    median_latency = statistics.median(latencies)
    max_latency = max(latencies)
    min_latency = min(latencies)

    print(f"Total Requests:      {len(results)}")
    print(f"Successful:          {len(successful_results)}")
    print(f"Failed:              {len(failed_results)}")
    print("-" * 40)
    print(f"Avg Latency:         {avg_latency:.4f} sec")
    print(f"Median Latency:      {median_latency:.4f} sec")
    print(f"Min Latency:         {min_latency:.4f} sec")
    print(f"Max Latency:         {max_latency:.4f} sec")
    print("-" * 40)
    print(f"Approx Tokens/Req:   {statistics.mean(tokens):.1f}")

    if failed_results:
        print("\nFailures:")
        for fail in failed_results:
            print(f"- Request {fail['request_id']}: {fail['error']}")

if __name__ == "__main__":
    print(f"Benchmarking Service: {SERVICE_URL}")
    print("Warmup Request...")
    measure_request(0)
    time.sleep(1)

    print(f"\nRunning Standard Latency Test ({NUM_REQUESTS} requests, sequential)...")
    seq_results = run_benchmark(concurrency=1)
    analyze_results(seq_results, "STANDARD LATENCY RESULTS")

    print(f"\nRunning Complex Query Test ({len(COMPLEX_QUERIES)} requests, sequential)...")
    complex_results = run_benchmark(concurrency=1, queries=COMPLEX_QUERIES)
    analyze_results(complex_results, "COMPLEX QUERY RESULTS")

    print(f"\nRunning Load Test ({NUM_REQUESTS} requests, {CONCURRENT_REQUESTS} concurrent)...")
    conc_results = run_benchmark(concurrency=CONCURRENT_REQUESTS)
    analyze_results(conc_results, "LOAD TEST RESULTS")


