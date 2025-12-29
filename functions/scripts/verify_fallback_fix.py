import sys
import os
import asyncio
import logging

# Add functions directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.abspath(os.path.join(current_dir, '../src'))
print(f"Adding to path: {src_path}")
sys.path.append(src_path)

# Mock config to avoid needing full environment
class MockConfig:
    max_input_length = 1000
    kb_error_message = "Error"
    temperature = 0.7
    max_tokens = 500
    model_name = "mock-model"

# Mock logger
logging.basicConfig(level=logging.INFO)

async def test_fallback_logic():
    print("\n=== Testing Fallback Logic ===\n")

    # Import the agent class (we'll just test the static method logic if possible,
    # or instantiate with mocks)
    try:
        from ai_agent.marketing.marketing_agent import MarketingAgent

        # Create a dummy agent instance (we only need the helper methods)
        # We can bypass __init__ complexity by creating a bare object and attaching methods
        # or just instantiating with None/Mocks if the class allows it.
        # Looking at the code, __init__ does some heavy lifting.
        # Let's try to just import the class and use the method if it was static,
        # but it's an instance method.

        # Better approach: We can subclass or just instantiate with minimal mocks.
        # However, the class requires DB and API keys.
        # Let's just copy the logic we want to test or try to instantiate with mocks.

        # Actually, let's just test the _generate_fallback_questions method directly
        # by creating a partial mock.

        agent = MarketingAgent.__new__(MarketingAgent)

        # Test Case 1: Homepage context, generic query (should NOT have pricing)
        print("Test 1: Homepage context, generic query ('Hello')")
        questions = agent._generate_fallback_questions("homepage", "Hello")
        print(f"Questions: {questions}")
        has_pricing = any("price" in q.lower() or "cost" in q.lower() or "plan" in q.lower() for q in questions)
        if not has_pricing:
            print("✅ PASS: No pricing questions found")
        else:
            print("❌ FAIL: Pricing questions found!")

        # Test Case 2: Funding query (should have company/mission questions)
        print("\nTest 2: Funding query ('How are you funded?')")
        questions = agent._generate_fallback_questions("homepage", "How are you funded?")
        print(f"Questions: {questions}")
        has_mission = any("mission" in q.lower() or "team" in q.lower() for q in questions)
        if has_mission:
            print("✅ PASS: Relevant mission/team questions found")
        else:
            print("❌ FAIL: Relevant questions NOT found!")

        # Test Case 3: Pricing query (should HAVE pricing questions)
        print("\nTest 3: Pricing query ('How much does it cost?')")
        questions = agent._generate_fallback_questions("homepage", "How much does it cost?")
        print(f"Questions: {questions}")
        has_pricing = any("price" in q.lower() or "plan" in q.lower() for q in questions)
        if has_pricing:
            print("✅ PASS: Pricing questions found")
        else:
            print("❌ FAIL: Pricing questions NOT found!")

        # Test Case 4: Extraction Logic (Mocking response text)
        print("\nTest 4: Extraction Logic")
        response_text = """Here is the answer.

        You might want to know:
        1. Question A
        2. Question B
        3. Question C"""

        extracted = agent._extract_follow_up_questions(response_text)
        print(f"Extracted: {extracted}")
        if len(extracted) == 3 and extracted[0] == "Question A":
             print("✅ PASS: Extraction worked with 'You might want to know:' prefix")
        else:
             print("❌ FAIL: Extraction failed")

    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_fallback_logic())
