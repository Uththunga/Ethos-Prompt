"""
Quick Test - Send a message to IBM Granite 4.0
"""
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from llm.watsonx_client import WatsonxGraniteLangChain

async def test():
    print("=" * 60)
    print("IBM Granite 4.0 - Message Test")
    print("=" * 60)

    model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
    print(f"\nModel: {model_id}")

    llm = WatsonxGraniteLangChain(
        model=model_id,
        temperature=0.7,
        max_tokens=300
    )

    print("Status: Ready\n")

    message = "What is IBM Granite? Explain in 2-3 sentences."
    print(f"Question: {message}\n")
    print("Waiting for response...")
    print("-" * 60)

    messages = [{"role": "user", "content": message}]
    response = await llm.ainvoke(messages)

    print("\nRESPONSE:")
    print(response.content)
    print("-" * 60)

    print(f"\nModel: {response.response_metadata['model']}")
    usage = response.response_metadata['usage']
    print(f"Tokens Used: {usage['total_tokens']} (prompt: {usage['prompt_tokens']}, completion: {usage['completion_tokens']})")

    print("\n" + "=" * 60)
    print("SUCCESS! Model is working correctly!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test())
