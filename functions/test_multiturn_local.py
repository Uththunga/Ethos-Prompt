"""Test multi-turn conversation locally"""
import asyncio
import os
os.environ['USE_GRANITE_LLM'] = 'true'

async def test():
    from src.ai_agent.marketing.marketing_agent import get_marketing_agent
    try:
        agent = get_marketing_agent()
        print('Agent initialized')

        # First message
        result1 = await agent.chat('Hi there', {'conversation_id': 'test-local-123', 'page_context': 'homepage'})
        print(f"Turn 1 OK: {result1['response'][:80]}...")
        conv_id = result1.get('conversation_id', 'test-local-123')
        print(f'Conv ID: {conv_id}')

        # Second message with same conversation_id
        result2 = await agent.chat('Tell me about services', {'conversation_id': conv_id, 'page_context': 'services'})
        print(f"Turn 2 OK: {result2['response'][:80]}...")

        print("\n=== SUCCESS: Multi-turn works locally! ===")

    except Exception as e:
        print(f'ERROR: {type(e).__name__}: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
