"""
Smoke test script for staging deployment verification
Tests that the marketing agent is responding with complete responses
"""
import requests
import json
import time

# Staging API endpoint
STAGING_API_BASE = "https://marketing-api-857724136585.australia-southeast1.run.app"
STAGING_STREAM_URL = f"{STAGING_API_BASE}/api/ai/marketing-chat/stream"

def test_streaming_response(query, min_words=50, page_context="unknown"):
    """Test streaming response for a single query"""
    print(f"\n📝 Query: {query}")
    print("-" * 80)

    # Build URL with query params for GET request
    url = f"{STAGING_STREAM_URL}?message={requests.utils.quote(query)}&page_context={requests.utils.quote(page_context)}"

    try:
        response = requests.get(url, stream=True, timeout=60)

        if response.status_code != 200:
            print(f"❌ FAIL: HTTP {response.status_code}")
            return {
                "query": query,
                "status": "FAIL",
                "error": f"HTTP {response.status_code}"
            }

        # Collect streamed content
        full_content = ""
        chunks = []

        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith("data:"):
                    try:
                        json_data = json.loads(line_str[5:])
                        chunk = json_data.get("chunk", "")
                        full_content += chunk
                        chunks.append(chunk)
                    except json.JSONDecodeError:
                        # Handle non-JSON lines or malformed JSON
                        pass

        char_count = len(full_content)
        word_count = len(full_content.split())
        chunk_count = len(chunks)

        # Verify completeness
        is_complete = char_count >= 200 and word_count >= min_words

        if is_complete:
            print(f"✅ PASS: Response is complete ({word_count} words)")
            status = "PASS"
        else:
            print(f"❌ FAIL: Response too short ({word_count} words, expected >{min_words})")
            print(f"   Content preview: {full_content[:200]}...")
            status = "FAIL"

        # Check for truncation indicators
        if full_content and not full_content.strip()[-1] in ['.', '!', '?', ':']:
            print(f"⚠️  WARNING: Response may be cut off (ends with '{full_content.strip()[-1]}')")

        return {
            "query": query,
            "status": status,
            "char_count": char_count,
            "word_count": word_count,
            "chunk_count": chunk_count
        }

    except Exception as e:
        print(f"❌ FAIL: {type(e).__name__}: {e}")
        return {
            "query": query,
            "status": "ERROR",
            "error": str(e)
        }


def test_streaming_completeness():
    """Test that streaming responses are complete"""
    print("=" * 80)
    print("SMOKE TEST: Marketing Agent Streaming Completeness")
    print("=" * 80)

    test_cases = [
        {
            "query": "Tell me about your pricing plans",
            "min_words": 50,
            "page_context": "pricing",
            "description": "Original Query + Pricing Context"
        },
        {
            "query": "What are your pricing plans?",
            "min_words": 50,
            "page_context": "unknown",
            "description": "New Query + Unknown Context"
        },
        {
            "query": "What are your pricing plans?",
            "min_words": 50,
            "page_context": "pricing",
            "description": "New Query + Pricing Context (Reproduces Failure)"
        }
    ]

    results = []

    for test in test_cases:
        result = test_streaming_response(
            test["query"],
            test["min_words"],
            test["page_context"]
        )
        results.append(result)

    # Summary
    print("\n\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    passed = sum(1 for r in results if r.get("status") == "PASS")
    total = len(results)

    for result in results:
        status_icon = "✅" if result.get("status") == "PASS" else "❌"
        print(f"{status_icon} {result['query'][:50]}... - {result.get('status')}")
        if result.get('word_count'):
            print(f"   Words: {result['word_count']}, Chunks: {result['chunk_count']}")

    print(f"\n📊 Results: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 SUCCESS: All tests passed! Marketing agent is delivering complete responses.")
        return True
    else:
        print("\n❌ FAILURE: Some tests failed. Review the issues above.")
        return False


if __name__ == "__main__":
    success = test_streaming_completeness()
    exit(0 if success else 1)
