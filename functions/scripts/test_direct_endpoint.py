"""
Direct test of staging endpoint to verify response completeness
"""
import requests
import json

URL = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat/stream"

print("Testing pricing query directly...")
print("=" * 80)

params = {
    "message": "What are your pricing plans?",
    "page_context": "pricing"
}

try:
    response = requests.get(URL, params=params, stream=True, timeout=60)
    print(f"Status: {response.status_code}")
    print("-" * 80)

    full_content = ""
    chunk_count = 0

    for line in response.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            print(f"RAW LINE: {repr(line_str)}")

            if line_str.startswith("data:"):
                chunk_count += 1
                try:
                    data_str = line_str[5:].strip()
                    if data_str == "[DONE]":
                        break

                    data = json.loads(data_str)
                    if data.get("type") == "content":
                        chunk = data.get("chunk", "")
                        full_content += chunk
                        print(f"  → Content chunk {chunk_count}: {repr(chunk)}")
                except json.JSONDecodeError as e:
                    print(f"  → JSON error: {e}")

    print("-" * 80)
    print(f"FINAL CONTENT ({len(full_content)} chars, {len(full_content.split())} words):")
    print(full_content)
    print("-" * 80)

    if len(full_content.split()) < 50:
        print(f"❌ FAILED: Only {len(full_content.split())} words")
    else:
        print(f"✅ PASSED: {len(full_content.split())} words")

except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
