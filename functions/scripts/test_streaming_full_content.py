import requests
import json
import time
import sys

STAGING_URL = "https://marketing-api-857724136585.australia-southeast1.run.app"

def test_streaming_content():
    print(f"🚀 Testing streaming endpoint: {STAGING_URL}/api/ai/marketing-chat/stream")

    params = {
        "message": "What is EthosPrompt?",
        "conversation_id": "testVerificationFullContent",
        "page_context": "homepage"
    }

    try:
        response = requests.get(
            f"{STAGING_URL}/api/ai/marketing-chat/stream",
            params=params,
            stream=True,
            timeout=120
        )
        response.raise_for_status()

        full_content = ""
        print("\n--- STREAM START ---\n")

        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data: "):
                    data_str = decoded_line[6:]
                    if data_str == "[DONE]":
                        print("\n--- STREAM END ---")
                        break

                    try:
                        data = json.loads(data_str)
                        if data.get("type") == "content":
                            chunk = data.get("chunk", "")
                            sys.stdout.write(chunk)
                            sys.stdout.flush()
                            full_content += chunk
                        elif data.get("type") == "error":
                            print(f"\n❌ Error received: {data}")
                    except json.JSONDecodeError:
                        pass

        print(f"\n\n✅ Total length: {len(full_content)} chars")
        print(f"Last 50 chars: {full_content[-50:]}")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")

if __name__ == "__main__":
    test_streaming_content()
