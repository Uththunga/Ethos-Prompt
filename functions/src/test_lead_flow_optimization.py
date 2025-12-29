"""
Quick Test - Marketing Agent Lead Flow Optimization
Tests the updated agent for brevity and lead-generating follow-up questions
"""
import asyncio
import os
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Set Granite LLM
os.environ["USE_GRANITE_LLM"] = "true"

from ai_agent.marketing.marketing_agent import get_marketing_agent

async def test_lead_flow():
    print("=" * 70)
    print("MARKETING AGENT - LEAD FLOW OPTIMIZATION TEST")
    print("=" * 70)
    print()
    print("Testing: Simple, clear, short responses with 3 strategic questions")
    print()

    agent = get_marketing_agent()

    # Test scenarios
    test_cases = [
        {
            "query": "What is EthosPrompt?",
            "expected": "Brief answer, 3 questions about needs/challenges"
        },
        {
            "query": "How much does your Smart Business Assistant cost?",
            "expected": "Brief pricing, 3 questions about timeline/budget/use case"
        },
        {
            "query": "Can you help with AI integration?",
            "expected": "Brief yes with benefits, 3 questions qualifying interest"
        }
    ]

    for i, test in enumerate(test_cases, 1):
        print(f"\n{'=' * 70}")
        print(f"TEST {i}: {test['query']}")
        print(f"Expected: {test['expected']}")
        print("=" * 70)

        try:
            response = await agent.chat(
                message=test['query'],
                context={"page_context": "homepage", "conversation_id": f"test_{i}"}
            )

            response_text = response['response']
            questions = response['suggested_questions']
            word_count = len(response_text.split())

            print(f"\n📝 RESPONSE ({word_count} words):")
            print(response_text)

            print(f"\n💡 FOLLOW-UP QUESTIONS ({len(questions)}):")
            for j, q in enumerate(questions, 1):
                print(f"  {j}. {q}")

            # Validation
            print(f"\n✅ VALIDATION:")
            brevity_pass = 50 <= word_count <= 150  # Allow some flexibility
            questions_pass = len(questions) == 3
            has_followup_section = "You might also want to know:" in response_text or len(questions) == 3

            print(f"  Brevity (50-150 words): {'✓' if brevity_pass else '✗'} ({word_count} words)")
            print(f"  3 Questions: {'✓' if questions_pass else '✗'} ({len(questions)} questions)")
            print(f"  Lead Flow: {'✓' if has_followup_section else '✗'}")

            if brevity_pass and questions_pass and has_followup_section:
                print(f"\n🎉 TEST {i} PASSED!")
            else:
                print(f"\n⚠️ TEST {i} NEEDS IMPROVEMENT")

        except Exception as e:
            print(f"\n❌ TEST {i} FAILED: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n{'=' * 70}")
    print("TEST COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_lead_flow())
