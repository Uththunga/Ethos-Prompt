"""
Quick OpenRouter API Test
Tests basic connectivity and free models
"""

import os
import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from llm.free_models_config import FREE_MODELS_PRIMARY, get_stable_models

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

async def test_single_model(model_id: str, model_name: str):
    """Test a single model"""
    print(f"\n{'='*80}")
    print(f"Testing: {model_name}")
    print(f"Model ID: {model_id}")
    print(f"{'='*80}")

    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ ERROR: OPENROUTER_API_KEY not found in environment")
        return False

    print(f"✅ API Key found: {api_key[:20]}...")

    config = OpenRouterConfig(
        api_key=api_key,
        model=model_id,
        max_tokens=100,
        temperature=0.7,
        timeout=30
    )

    test_prompts = [
        "What is 2+2?",
        "Name three colors.",
        "What is the capital of France?"
    ]

    results = []

    try:
        async with OpenRouterClient(config) as client:
            for i, prompt in enumerate(test_prompts, 1):
                print(f"\n  Test {i}/3: {prompt}")
                try:
                    response = await client.generate_response(
                        prompt=prompt,
                        system_prompt="You are a helpful assistant. Be concise."
                    )

                    print(f"    ✅ Response: {response.content[:100]}...")
                    print(f"    📊 Tokens: {response.usage['total_tokens']}")
                    print(f"    💰 Cost: ${response.cost_estimate:.6f}")
                    print(f"    ⏱️  Time: {response.response_time:.2f}s")

                    results.append(True)

                except Exception as e:
                    print(f"    ❌ Error: {str(e)}")
                    results.append(False)

        success_rate = (sum(results) / len(results)) * 100
        print(f"\n  📊 Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")

        return success_rate >= 66.0  # At least 2/3 should pass

    except Exception as e:
        print(f"\n❌ Client Error: {str(e)}")
        return False


async def main():
    """Main test function"""
    print("\n" + "="*80)
    print("🚀 OPENROUTER FREE MODELS QUICK TEST")
    print("="*80)

    # Test primary free models (only those confirmed working)
    models_to_test = [
        ("x-ai/grok-4-fast:free", "Grok 4 Fast (Free)"),
        ("deepseek/deepseek-v3:free", "DeepSeek V3 (Free)"),
        ("z-ai/glm-4.5-air:free", "GLM 4.5 Air (Free)"),
        ("microsoft/mai-ds-r1:free", "Microsoft MAI-DS-R1 (Free)"),
        ("qwen/qwen3-coder-480b-a35b-instruct:free", "Qwen3 Coder 480B (Free)"),
        ("mistralai/mistral-7b-instruct:free", "Mistral 7B Instruct (Free)"),
        ("qwen/qwen-2.5-7b-instruct:free", "Qwen 2.5 7B Instruct (Free)"),
    ]

    results = []
    for model_id, model_name in models_to_test:
        success = await test_single_model(model_id, model_name)
        results.append((model_name, success))

    # Summary
    print("\n" + "="*80)
    print("📊 FINAL RESULTS")
    print("="*80)

    for model_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} - {model_name}")

    total_passed = sum(1 for _, success in results if success)
    overall_success = (total_passed / len(results)) * 100

    print(f"\n  Overall Success Rate: {overall_success:.1f}% ({total_passed}/{len(results)})")
    print("="*80)

    if overall_success >= 66.0:
        print("\n✅ SUCCESS: OpenRouter API is working with free models!")
        return 0
    else:
        print("\n❌ FAILED: Too many models failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
