import requests
import json
import sys
import time

STAGING_URL = "https://marketing-api-857724136585.australia-southeast1.run.app"

def test_health():
    print(f"Testing health endpoint: {STAGING_URL}/health")
    try:
        response = requests.get(f"{STAGING_URL}/health", timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f"✅ Health check passed: {data}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_chat():
    print(f"\nTesting chat endpoint: {STAGING_URL}/api/ai/marketing-chat")
    payload = {
        "message": "My email is test@example.com. What are your services?",
        "conversation_id": "testVerification123456",  # Valid Firestore-style ID (20 chars alphanumeric)
        "page_context": "homepage"
    }

    try:
        response = requests.post(
            f"{STAGING_URL}/api/ai/marketing-chat",
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()

        if data.get("success"):
            print(f"✅ Chat request successful")
            print(f"Response: {data.get('response')[:100]}...")
            return True
        else:
            print(f"❌ Chat request failed: {data}")
            return False

    except Exception as e:
        print(f"❌ Chat request failed with error: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Status code: {e.response.status_code}")
            print(f"Response text: {e.response.text}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Staging Verification...")

    if not test_health():
        sys.exit(1)

    time.sleep(1)

    if not test_chat():
        sys.exit(1)

    print("\n✅ All verification tests passed!")
