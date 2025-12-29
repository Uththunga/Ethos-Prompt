import requests
import json

URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app/api/ai/marketing-chat/stream"

print(f"Testing URL: {URL}")

try:
    response = requests.post(
        URL,
        json={
            "message": "Hello",
            "conversationId": "debug-test"
        },
        headers={"Content-Type": "application/json"},
        timeout=60
    )

    print(f"\nStatus Code: {response.status_code}")
    print("\nHeaders:")
    for k, v in response.headers.items():
        print(f"{k}: {v}")

    print("\nBody Preview (first 500 chars):")
    print(response.text[:500])

except Exception as e:
    print(f"\nError: {e}")
