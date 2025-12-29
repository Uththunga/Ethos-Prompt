"""
Test Script for IBM Granite 4.0 H-Small Integration
Run this to verify watsonx.ai connectivity and Granite model access
"""
import asyncio
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from llm.watsonx_client import WatsonxGraniteClient, WatsonxGraniteLangChain


async def test_watsonx_client():
    """Test direct watsonx.ai client."""
    print("\n" + "="*60)
    print("TEST 1: Direct watsonx.ai Client")
    print("="*60)

    try:
        model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
        client = WatsonxGraniteClient(
            model_id=model_id,
            temperature=0.6,
            max_tokens=200
        )

        print("✓ Client initialized successfully")
        print(f"  Model: {client.model_id}")
        print(f"  Temperature: {client.temperature}")
        print(f"  Max Tokens: {client.max_tokens}")

        # Test generation
        print("\n🔄 Testing text generation...")
        start_time = datetime.now()

        result = await client.generate(
            prompt="What are the key features of IBM Granite 4.0 models? Explain in 2-3 sentences."
        )

        duration = (datetime.now() - start_time).total_seconds()

        print(f"\n✓ Generation successful ({duration:.2f}s)")
        print(f"\n📝 Response:\n{result['text']}")
        print(f"\n📊 Usage:")
        print(f"  - Prompt tokens: {result['usage']['prompt_tokens']}")
        print(f"  - Completion tokens: {result['usage']['completion_tokens']}")
        print(f"  - Total tokens: {result['usage']['total_tokens']}")
        print(f"  - Duration: {result['duration_ms']}ms")

        await client.close()
        return True

    except ValueError as e:
        print(f"\n❌ Configuration Error: {e}")
        print("\n💡 Make sure to set these environment variables:")
        print("   - WATSONX_API_KEY")
        print("   - WATSONX_PROJECT_ID")
        return False
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


async def test_langchain_wrapper():
    """Test LangChain-compatible wrapper."""
    print("\n" + "="*60)
    print("TEST 2: LangChain-Compatible Wrapper")
    print("="*60)

    try:
        model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
        llm = WatsonxGraniteLangChain(
            model=model_id,
            temperature=0.6,
            max_tokens=200
        )

        print("✓ LangChain wrapper initialized successfully")
        print(f"  Model: {llm.model_name}")

        # Test with chat messages
        print("\n🔄 Testing chat completion...")
        start_time = datetime.now()

        messages = [
            {"role": "system", "content": "You are a helpful AI assistant."},
            {"role": "user", "content": "Explain what IBM Granite models are in one sentence."}
        ]

        response = await llm.ainvoke(messages)

        duration = (datetime.now() - start_time).total_seconds()

        print(f"\n✓ Chat completion successful ({duration:.2f}s)")
        print(f"\n📝 Response:\n{response.content}")
        print(f"\n📊 Metadata:")
        print(f"  - Model: {response.response_metadata['model']}")
        print(f"  - Usage: {response.response_metadata['usage']}")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return False


async def test_streaming():
    """Test streaming responses."""
    print("\n" + "="*60)
    print("TEST 3: Streaming Responses")
    print("="*60)

    try:
        model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
        llm = WatsonxGraniteLangChain(
            model=model_id,
            temperature=0.6,
            max_tokens=150,
            streaming=True
        )

        print("✓ Streaming client initialized")

        print("\n🔄 Testing streaming generation...")
        print("\n📝 Streamed response:")
        print("-" * 60)

        messages = [
            {"role": "user", "content": "List 3 benefits of using AI in business. Be concise."}
        ]

        chunk_count = 0
        async for chunk in llm.astream(messages):
            print(chunk.content, end='', flush=True)
            chunk_count += 1

        print("\n" + "-" * 60)
        print(f"\n✓ Streaming successful ({chunk_count} chunks)")

        return True

    except Exception as e:
        print(f"\n❌ Streaming Error: {e}")
        print("Note: Streaming may not be available in all watsonx.ai regions")
        return False


async def test_marketing_agent():
    """Test the actual marketing agent with Granite."""
    print("\n" + "="*60)
    print("TEST 4: Marketing Agent Integration")
    print("="*60)

    try:
        # Enable Granite for this test
        os.environ["USE_GRANITE_LLM"] = "true"

        from ai_agent.marketing.marketing_agent import get_marketing_agent

        agent = get_marketing_agent()

        print("✓ Marketing agent initialized")
        print(f"  LLM: {agent.llm.model_name if hasattr(agent.llm, 'model_name') else 'Granite 4.0 H-Small'}")

        # Test chat
        print("\n🔄 Testing marketing chat...")
        start_time = datetime.now()

        response = await agent.chat(
            message="What is EthosPrompt?",
            context={"page_context": "homepage"}
        )

        duration = (datetime.now() - start_time).total_seconds()

        print(f"\n✓ Chat successful ({duration:.2f}s)")
        print(f"\n📝 Response:\n{response['response'][:300]}...")
        print(f"\n💡 Suggested Questions:")
        for i, q in enumerate(response['suggested_questions'], 1):
            print(f"  {i}. {q}")

        print(f"\n📊 Metadata:")
        print(f"  - Model: {response['metadata'].get('model', 'N/A')}")
        print(f"  - Page Context: {response['metadata'].get('page_context')}")
        print(f"  - Token Usage: {response['metadata'].get('token_usage', 'N/A')}")

        return True

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_environment():
    """Check if environment variables are set."""
    print("\n" + "="*60)
    print("ENVIRONMENT CHECK")
    print("="*60)

    required_vars = {
        "WATSONX_API_KEY": "IBM Cloud API Key",
        "WATSONX_PROJECT_ID": "watsonx.ai Project ID"
    }

    all_set = True
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
            print(f"✓ {var}: {masked}")
        else:
            print(f"❌ {var}: NOT SET ({description})")
            all_set = False

    optional_vars = {
        "USE_GRANITE_LLM": "Enable Granite LLM",
        "OPENROUTER_API_KEY": "OpenRouter API Key (fallback)"
    }

    print("\nOptional:")
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            print(f"✓ {var}: {value}")
        else:
            print(f"  {var}: Not set ({description})")

    return all_set


async def main():
    """Run all tests."""
    print("\n" + "█"*60)
    print("IBM GRANITE 4.0 H-SMALL - INTEGRATION TEST SUITE")
    print("█"*60)

    # Check environment
    env_ok = check_environment()

    if not env_ok:
        print("\n⚠️  Missing required environment variables!")
        print("\nTo fix, create a .env file or set:")
        print("  export WATSONX_API_KEY='your-api-key'")
        print("  export WATSONX_PROJECT_ID='your-project-id'")
        print("\nSee GRANITE_INTEGRATION_GUIDE.md for details.")
        return

    # Run tests
    results = {
        "Basic Client": await test_watsonx_client(),
        "LangChain Wrapper": await test_langchain_wrapper(),
        "Streaming": await test_streaming(),
        "Marketing Agent": await test_marketing_agent()
    }

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    for test_name, passed in results.items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{status}: {test_name}")

    total = len(results)
    passed = sum(results.values())

    print(f"\nResults: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 All tests passed! Granite 4.0 H-Small is ready to use.")
    elif passed >= total - 1:
        print("\n✅ Almost there! Minor issues to resolve.")
    else:
        print("\n⚠️  Multiple failures detected. Check configuration and logs.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
