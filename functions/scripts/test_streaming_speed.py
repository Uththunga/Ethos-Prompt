#!/usr/bin/env python3
"""
Test streaming endpoint to demonstrate response speed
"""
import requests
import json
import time
from datetime import datetime

STAGING_URL = "https://marketing-api-857724136585.australia-southeast1.run.app"

def test_streaming_speed():
    """Test the streaming endpoint and measure time to first token"""
    endpoint = f"{STAGING_URL}/api/ai/marketing-chat/stream"

    # Use GET with query parameters (EventSource compatible)
    params = {
        "message": "What are the three main services offered by EthosPrompt?",
        "conversation_id": "a1b2c3d4-e5f6-a890-abcd-ef123456789c",
        "page_context": "services"
    }

    print(f"🚀 Testing streaming endpoint: {endpoint}")
    print(f"📝 Question: {params['message']}\n")

    start_time = time.time()
    first_token_time = None
    chunks_received = 0
    total_content = ""

    try:
        response = requests.get(endpoint, params=params, stream=True, timeout=30)
        response.raise_for_status()

        print("📡 Receiving stream...")
        print("-" * 80)

        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')

                # Skip comments and empty lines
                if line_str.startswith(':') or not line_str.strip():
                    continue

                # Parse SSE data
                if line_str.startswith('data: '):
                    data_str = line_str[6:]  # Remove 'data: ' prefix

                    # Check for done signal
                    if data_str == '[DONE]':
                        break

                    try:
                        data = json.loads(data_str)

                        # First token timing
                        if first_token_time is None and data.get('type') == 'content':
                            first_token_time = time.time()
                            ttft = (first_token_time - start_time) * 1000  # Time to first token in ms
                            print(f"\n⚡ First token received in {ttft:.0f}ms\n")

                        # Display content chunks
                        if data.get('type') == 'content':
                            chunk = data.get('chunk', '')
                            total_content += chunk
                            print(chunk, end='', flush=True)
                            chunks_received += 1

                        # Display metadata
                        elif data.get('type') == 'metadata':
                            print(f"📊 Metadata: {data}")

                    except json.JSONDecodeError:
                        pass

        end_time = time.time()
        total_time = (end_time - start_time) * 1000

        print("\n" + "-" * 80)
        print(f"\n✅ Stream complete!")
        print(f"⏱️  Total time: {total_time:.0f}ms ({total_time/1000:.2f}s)")
        if first_token_time:
            print(f"⚡ Time to first token: {(first_token_time - start_time) * 1000:.0f}ms")
        print(f"📦 Chunks received: {chunks_received}")
        print(f"📝 Total content length: {len(total_content)} characters")

        if chunks_received > 0:
            avg_chunk_time = total_time / chunks_received
            print(f"📊 Average time per chunk: {avg_chunk_time:.0f}ms")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Status: {e.response.status_code}")
            print(f"Response: {e.response.text}")

if __name__ == "__main__":
    test_streaming_speed()
