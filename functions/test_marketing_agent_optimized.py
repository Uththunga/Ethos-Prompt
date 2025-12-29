"""
Test script for optimized Marketing Agent
Tests response length, tone, and follow-up questions
"""
import asyncio
import os
import sys
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.ai_agent.marketing.marketing_agent import get_marketing_agent

# Test queries covering different page contexts
TEST_QUERIES = [
    {
        "message": "What is EthosPrompt?",
        "page_context": "homepage",
        "expected_topics": ["services", "platform", "AI", "prompts"]
    },
    {
        "message": "How can EthosPrompt help my business?",
        "page_context": "solutions",
        "expected_topics": ["business", "solutions", "benefits"]
    },
    {
        "message": "What are your pricing plans?",
        "page_context": "pricing",
        "expected_topics": ["pricing", "plans", "cost"]
    },
    {
        "message": "How does the RAG technology work?",
        "page_context": "product",
        "expected_topics": ["RAG", "retrieval", "technology"]
    },
    {
        "message": "How do I get started?",
        "page_context": "onboarding",
        "expected_topics": ["start", "setup", "onboarding"]
    },
    {
        "message": "What integrations are available?",
        "page_context": "technical",
        "expected_topics": ["integrations", "API", "connect"]
    }
]

# Success criteria
TARGET_WORD_COUNT_MIN = 80
TARGET_WORD_COUNT_MAX = 180
TARGET_FOLLOW_UP_QUESTIONS = 3


async def test_marketing_agent():
    """Test the optimized marketing agent"""
    print("=" * 80)
    print("MARKETING AGENT OPTIMIZATION TEST")
    print("=" * 80)
    print()
    
    # Initialize agent
    print("Initializing Marketing Agent...")
    try:
        agent = get_marketing_agent()
        print(f"✅ Agent initialized: {agent.name}")
        print(f"   Model: {agent.llm.model_name}")
        print(f"   Temperature: {agent.llm.temperature}")
        print(f"   Max Tokens: {agent.llm.max_tokens}")
        print()
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        return
    
    # Run tests
    results = []
    
    for i, test_case in enumerate(TEST_QUERIES, 1):
        print(f"\n{'=' * 80}")
        print(f"TEST {i}/{len(TEST_QUERIES)}: {test_case['page_context'].upper()}")
        print(f"{'=' * 80}")
        print(f"Query: {test_case['message']}")
        print()
        
        try:
            # Send message
            start_time = datetime.now()
            response = await agent.chat(
                message=test_case['message'],
                context={
                    "conversation_id": f"test-{i}",
                    "page_context": test_case['page_context']
                }
            )
            elapsed_time = (datetime.now() - start_time).total_seconds()
            
            # Extract response details
            response_text = response.get("response", "")
            word_count = len(response_text.split())
            suggested_questions = response.get("suggested_questions", [])
            sources = response.get("sources", [])
            metadata = response.get("metadata", {})
            
            # Print response
            print(f"Response ({word_count} words, {elapsed_time:.2f}s):")
            print("-" * 80)
            print(response_text)
            print("-" * 80)
            print()
            
            # Print follow-up questions
            print(f"Follow-up Questions ({len(suggested_questions)}):")
            for j, question in enumerate(suggested_questions, 1):
                print(f"  {j}. {question}")
            print()
            
            # Print sources
            if sources:
                print(f"Sources ({len(sources)}):")
                for source in sources[:3]:
                    print(f"  - {source.get('title', 'Unknown')} (score: {source.get('score', 0):.2f})")
                print()
            
            # Evaluate success criteria
            checks = {
                "word_count_in_range": TARGET_WORD_COUNT_MIN <= word_count <= TARGET_WORD_COUNT_MAX,
                "has_follow_up_questions": len(suggested_questions) >= TARGET_FOLLOW_UP_QUESTIONS,
                "response_not_empty": len(response_text) > 0,
                "conversational_tone": any(word in response_text.lower() for word in ["you", "your", "we", "our", "help"]),
                "no_excessive_jargon": response_text.count("leverage") + response_text.count("synergy") + response_text.count("paradigm") < 2
            }
            
            # Print evaluation
            print("Evaluation:")
            for check, passed in checks.items():
                status = "✅" if passed else "❌"
                print(f"  {status} {check.replace('_', ' ').title()}")
            
            # Store result
            results.append({
                "test_case": test_case,
                "word_count": word_count,
                "follow_up_count": len(suggested_questions),
                "elapsed_time": elapsed_time,
                "checks": checks,
                "passed": all(checks.values())
            })
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
            results.append({
                "test_case": test_case,
                "error": str(e),
                "passed": False
            })
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print()
    
    passed_tests = sum(1 for r in results if r.get("passed", False))
    total_tests = len(results)
    
    print(f"Tests Passed: {passed_tests}/{total_tests}")
    print()
    
    # Word count statistics
    word_counts = [r["word_count"] for r in results if "word_count" in r]
    if word_counts:
        avg_word_count = sum(word_counts) / len(word_counts)
        min_word_count = min(word_counts)
        max_word_count = max(word_counts)
        
        print(f"Word Count Statistics:")
        print(f"  Average: {avg_word_count:.1f} words")
        print(f"  Min: {min_word_count} words")
        print(f"  Max: {max_word_count} words")
        print(f"  Target: {TARGET_WORD_COUNT_MIN}-{TARGET_WORD_COUNT_MAX} words")
        print()
    
    # Follow-up questions statistics
    follow_up_counts = [r["follow_up_count"] for r in results if "follow_up_count" in r]
    if follow_up_counts:
        avg_follow_up = sum(follow_up_counts) / len(follow_up_counts)
        print(f"Follow-up Questions:")
        print(f"  Average: {avg_follow_up:.1f} questions")
        print(f"  Target: {TARGET_FOLLOW_UP_QUESTIONS} questions")
        print()
    
    # Performance statistics
    elapsed_times = [r["elapsed_time"] for r in results if "elapsed_time" in r]
    if elapsed_times:
        avg_time = sum(elapsed_times) / len(elapsed_times)
        print(f"Performance:")
        print(f"  Average response time: {avg_time:.2f}s")
        print()
    
    # Overall result
    if passed_tests == total_tests:
        print("✅ ALL TESTS PASSED!")
    else:
        print(f"⚠️  {total_tests - passed_tests} test(s) failed")
    
    print()
    print("=" * 80)


if __name__ == "__main__":
    # Set environment variables for testing
    if not os.getenv("OPENROUTER_API_KEY"):
        print("❌ OPENROUTER_API_KEY environment variable not set")
        print("   Please set it before running tests")
        sys.exit(1)
    
    # Run tests
    asyncio.run(test_marketing_agent())

