"""
Deep Dive Test Suite for Marketing Agent
Tests various scenarios to ensure robustness and completeness.
"""
import requests
import json
import time
import sys

BASE_URL = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat/stream"

def run_test(name, message, page_context="homepage", expected_min_words=20):
    print(f"\n🧪 TEST: {name}")
    print(f"   Query: {message}")
    print("-" * 60)

    params = {
        "message": message,
        "page_context": page_context
    }

    start_time = time.time()
    full_content = ""
    chunk_count = 0
    tool_calls = 0

    try:
        response = requests.get(BASE_URL, params=params, stream=True, timeout=60)

        if response.status_code != 200:
            print(f"❌ HTTP ERROR: {response.status_code}")
            return False

        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith("data:"):
                    try:
                        data_str = line_str[5:].strip()
                        if data_str == "[DONE]":
                            break

                        data = json.loads(data_str)

                        if data.get("type") == "content":
                            chunk = data.get("chunk", "")
                            full_content += chunk
                            chunk_count += 1
                            # print(f"   chunk: {chunk[:20]}...")

                        if data.get("type") == "error":
                            print(f"❌ STREAM ERROR: {data.get('message')}")
                            return False

                    except json.JSONDecodeError:
                        pass

        duration = time.time() - start_time
        word_count = len(full_content.split())

        print(f"   ⏱️ Duration: {duration:.2f}s")
        print(f"   📝 Words: {word_count}")
        print(f"   📦 Chunks: {chunk_count}")
        print(f"   📄 Content Preview: {full_content[:100]}...")

        if word_count < expected_min_words:
            print(f"❌ FAILED: Response too short (<{expected_min_words} words)")
            print(f"   Full content: {full_content}")
            return False

        print("✅ PASSED")
        return True

    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return False

def main():
    print("🚀 STARTING DEEP DIVE TESTS")
    print("=" * 60)

    tests = [
        {
            "name": "Basic Greeting (No Tools)",
            "message": "Hello, who are you?",
            "context": "homepage",
            "min_words": 10
        },
        {
            "name": "General Knowledge (KB Search)",
            "message": "What services does EthosPrompt offer?",
            "context": "services",
            "min_words": 50
        },
        {
            "name": "Pricing Query (Tool: get_pricing)",
            "message": "What are your pricing plans?",
            "context": "pricing",
            "min_words": 50
        },
        {
            "name": "Specific Pricing (Tool: get_pricing)",
            "message": "How much does the Business Assistant cost?",
            "context": "pricing",
            "min_words": 30
        },
        {
            "name": "Consultation Request (Tool: request_consultation)",
            "message": "I want to book a consultation",
            "context": "contact",
            "min_words": 20
        }
    ]

    passed = 0
    failed = 0

    for t in tests:
        if run_test(t["name"], t["message"], t["context"], t["min_words"]):
            passed += 1
        else:
            failed += 1

    print("\n" + "=" * 60)
    print(f"📊 SUMMARY: {passed} Passed, {failed} Failed")
    print("=" * 60)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
