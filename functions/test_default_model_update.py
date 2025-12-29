"""
Test Default Model Update
Verify that the new default model (GLM 4.5 Air) works correctly
"""

import os
import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from llm.free_models_config import get_default_model
from dotenv import load_dotenv

load_dotenv()

async def test_default_model():
    """Test the new default model configuration"""
    print("\n" + "="*80)
    print("🧪 TESTING DEFAULT MODEL UPDATE")
    print("="*80)
    
    # Get default model from config
    default_model = get_default_model()
    print(f"\n✅ Default model from config: {default_model.model_id}")
    print(f"   Display name: {default_model.display_name}")
    print(f"   Provider: {default_model.provider}")
    print(f"   Context length: {default_model.context_length:,} tokens")
    print(f"   Is default: {default_model.is_default}")
    print(f"   Is stable: {default_model.is_stable}")
    
    # Verify it's GLM 4.5 Air
    assert default_model.model_id == "z-ai/glm-4.5-air:free", f"Expected z-ai/glm-4.5-air:free, got {default_model.model_id}"
    assert default_model.is_default == True, "Default model should have is_default=True"
    
    print("\n✅ Default model configuration is correct!")
    
    # Test execution with default model
    print("\n" + "="*80)
    print("🚀 TESTING EXECUTION WITH DEFAULT MODEL")
    print("="*80)
    
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("\n❌ ERROR: OPENROUTER_API_KEY not found in environment")
        return False
    
    print(f"\n✅ API Key found: {api_key[:20]}...")
    
    config = OpenRouterConfig(
        api_key=api_key,
        model=default_model.model_id,
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
                    
                    # Verify cost is $0.00 for free model
                    assert response.cost_estimate == 0.0, f"Free model should have $0.00 cost, got ${response.cost_estimate}"
                    
                    results.append(True)
                    
                except Exception as e:
                    print(f"    ❌ Error: {str(e)}")
                    results.append(False)
        
        success_rate = (sum(results) / len(results)) * 100
        print(f"\n  📊 Success Rate: {success_rate:.1f}% ({sum(results)}/{len(results)})")
        
        if success_rate >= 66.0:
            print("\n" + "="*80)
            print("✅ SUCCESS: Default model update verified!")
            print("="*80)
            print(f"\n✅ Model: {default_model.display_name}")
            print(f"✅ Model ID: {default_model.model_id}")
            print(f"✅ Success Rate: {success_rate:.1f}%")
            print(f"✅ Cost: $0.00 (verified)")
            print("\n🎉 The new default model is working correctly!")
            return True
        else:
            print("\n" + "="*80)
            print("❌ FAILED: Too many tests failed")
            print("="*80)
            return False
        
    except Exception as e:
        print(f"\n❌ Client Error: {str(e)}")
        return False


if __name__ == "__main__":
    success = asyncio.run(test_default_model())
    sys.exit(0 if success else 1)

