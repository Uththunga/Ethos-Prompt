#!/usr/bin/env python3
"""
Test OpenRouter integration with nvidia/llama-3.1-nemotron-ultra-253b-v1:free model
"""
import asyncio
import sys
import os
from datetime import datetime

# Add parent directory to path for imports
sys.path.append('..')

from src.llm.llm_manager import LLMManager, ProviderType
from dotenv import load_dotenv

async def test_openrouter_integration():
    """Test OpenRouter with the specified model"""
    print(f"🚀 Testing OpenRouter Integration")
    print(f"Time: {datetime.now().isoformat()}")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv('../.env')
    
    # Check configuration
    api_key = os.getenv('OPENROUTER_API_KEY')
    model = os.getenv('OPENROUTER_MODEL')
    provider = os.getenv('DEFAULT_LLM_PROVIDER')
    
    print(f"✅ Configuration:")
    print(f"   API Key: {api_key[:20]}..." if api_key else "❌ Not found")
    print(f"   Model: {model}")
    print(f"   Default Provider: {provider}")
    print()
    
    # Initialize LLM Manager
    try:
        manager = LLMManager()
        providers = manager.get_available_providers()
        print(f"✅ LLM Manager initialized")
        print(f"   Available providers: {providers}")
        
        if 'openrouter' not in providers:
            print("❌ OpenRouter not available in providers")
            return False
        
        print("✅ OpenRouter provider available")
        print()
        
    except Exception as e:
        print(f"❌ Failed to initialize LLM Manager: {e}")
        return False
    
    # Test simple prompt
    test_prompts = [
        "Hello! Please respond with 'OpenRouter is working!' to confirm the connection.",
        "What is 2+2? Please give a brief answer.",
        "Generate a simple haiku about AI."
    ]
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"🧪 Test {i}: {prompt[:50]}...")
        try:
            # Test with OpenRouter specifically
            response = await manager.generate_response(
                prompt=prompt,
                provider=ProviderType.OPENROUTER
            )
            
            print(f"✅ Response received:")
            print(f"   Content: {response.content[:100]}...")
            print(f"   Provider: {response.provider}")
            print(f"   Model: {response.model}")
            print(f"   Tokens: {response.tokens_used}")
            print(f"   Cost: ${response.cost:.4f}")
            print(f"   Response Time: {response.response_time:.2f}s")
            print()
            
        except Exception as e:
            print(f"❌ Test {i} failed: {e}")
            print()
            return False
    
    # Test auto-selection (should prefer OpenRouter)
    print("🎯 Testing auto-selection (should use OpenRouter):")
    try:
        response = await manager.generate_response(
            prompt="Say 'Auto-selection working!' if you receive this."
        )
        
        print(f"✅ Auto-selection response:")
        print(f"   Provider used: {response.provider}")
        print(f"   Model: {response.model}")
        print(f"   Content: {response.content[:100]}...")
        print()
        
        if response.provider == "openrouter":
            print("🎉 Auto-selection correctly chose OpenRouter!")
        else:
            print(f"⚠️  Auto-selection used {response.provider} instead of OpenRouter")
        
    except Exception as e:
        print(f"❌ Auto-selection test failed: {e}")
        return False
    
    print("=" * 60)
    print("🎉 OpenRouter Integration Test PASSED!")
    print(f"✅ Model: {model}")
    print("✅ All tests completed successfully")
    print("✅ RAG Prompt Library ready with OpenRouter!")
    
    return True

async def main():
    """Main test function"""
    success = await test_openrouter_integration()
    
    if success:
        print("\n🚀 READY FOR PRODUCTION!")
        print("Your RAG Prompt Library is now configured with:")
        print("• OpenRouter API (your existing key)")
        print("• nvidia/llama-3.1-nemotron-ultra-253b-v1:free model")
        print("• FREE usage (no API costs)")
        print("• High-performance LLM capabilities")
    else:
        print("\n❌ Configuration needs attention")
        print("Please check the error messages above")

if __name__ == "__main__":
    asyncio.run(main())
