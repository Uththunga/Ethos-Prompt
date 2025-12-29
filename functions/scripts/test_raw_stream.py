"""
Additional streaming test - raw endpoint test without parsing
Tests the raw streaming output to debug format issues
"""
import requests

STAGING_STREAM_URL = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat/stream"

print("Testing raw streaming output...")
print("=" * 80)

query = "What are your pricing plans?"
url = f"{STAGING_STREAM_URL}?message={requests.utils.quote(query)}"

print(f"Query: {query}")
print(f"URL: {url}")
print("-" * 80)

try:
    response = requests.get(url, stream=True, timeout=60)
    print(f"Status: {response.status_code}")
    print("-" * 80)
    print("RAW STREAM OUTPUT:")
    print("-" * 80)

    for line in response.iter_lines():
        if line:
            print(repr(line.decode('utf-8')))

    print("-" * 80)
    print("Stream complete")

except Exception as e:
    print(f"ERROR: {e}")
