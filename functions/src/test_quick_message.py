"""
Quick Test - Send a message to IBM Granite 4.0 and see the response
"""
import asyncio
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

from llm.watsonx_client import WatsonxGraniteLangChain

async def test_message():
    print("=" * 60)
    print("IBM Granite 4.0 - Quick Message Test")
    print("=" * 60)
    print()

    # Initialize model
    model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
    print(f"Initializing model: {model_id}")

    llm = WatsonxGraniteLangChain(
        model=model_id,
        temperature=0.7,
        max_tokens=300
    )

    print("✓ Model ready")
    print()

    # Test message
    message = "What is IBM Granite? Explain in 2-3 sentences."
    print(f"💬 Sending message:")
    print(f"   '{message}'")
    print()
    print("⏳ Waiting for response...")
    print("-" * 60)

    # Send message
    messages = [{"role": "user", "content": message}]
    response = await llm.ainvoke(messages)

    print()
    print("-" * 60)
    print("✅ Response received:")
    print()
    print(response.content)
    print()
    print("-" * 60)
    print()
    print("📊 Metadata:")
    print(f"  Model: {response.response_metadata['model']}")
    print(f"  Tokens: {response.response_metadata['usage']}")
    print()
    print("=" * 60)
    print("✅ Test Complete - Model is responding correctly!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_message())
