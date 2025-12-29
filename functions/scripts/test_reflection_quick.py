#!/usr/bin/env python3
"""
Quick reflection test with verbose logging
"""

import asyncio
import os
import logging

# Set up verbose logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Enable mock mode
os.environ["OPENROUTER_USE_MOCK"] = "true"

async def test_reflection():
    from src.ai_agent.marketing.marketing_agent import get_marketing_agent

    agent = get_marketing_agent()

    print("\n🧪 Testing reflection mechanism with mock LLM...")
    print("=" * 60)

    response = await agent.chat(
        message="What are your pricing plans?",
        context={"page_context": "test", "conversation_id": "reflection_test"}
    )

    print("\n📊 Response Metadata:")
    print(f"  Iteration Count: {response['metadata'].get('iteration_count', 0)}")
    print(f"  Reflection Feedback: {response['metadata'].get('reflection_feedback')}")
    print(f"\n📝 Response: {response['response'][:200]}...")

if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.abspath('.'))
    sys.path.insert(0, os.path.abspath('src'))

    asyncio.run(test_reflection())
