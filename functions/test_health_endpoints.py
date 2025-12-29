#!/usr/bin/env python3
"""
Simple health endpoint test script
"""
import asyncio
import aiohttp
import time
import sys
from datetime import datetime

async def test_health_endpoints():
    """Test health endpoints if server is running"""
    base_url = "http://localhost:8080"
    
    endpoints = [
        "/health",
        "/health/detailed", 
        "/health/ready"
    ]
    
    print(f"Testing health endpoints at {base_url}")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        for endpoint in endpoints:
            url = f"{base_url}{endpoint}"
            try:
                start_time = time.time()
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    end_time = time.time()
                    response_time = (end_time - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        print(f"✅ {endpoint}")
                        print(f"   Status: {response.status}")
                        print(f"   Response time: {response_time:.2f}ms")
                        print(f"   Data: {data}")
                    else:
                        print(f"❌ {endpoint}")
                        print(f"   Status: {response.status}")
                        print(f"   Response time: {response_time:.2f}ms")
                        
            except asyncio.TimeoutError:
                print(f"⏰ {endpoint} - Timeout")
            except aiohttp.ClientConnectorError:
                print(f"🔌 {endpoint} - Connection failed (server not running?)")
            except Exception as e:
                print(f"❌ {endpoint} - Error: {e}")
            
            print()

def test_core_components():
    """Test core components without server"""
    print("Testing Core Components")
    print("=" * 50)
    
    # Test AI Service
    try:
        from src.ai_service import ai_service
        print("✅ AI Service - Import successful")
    except Exception as e:
        print(f"❌ AI Service - Import failed: {e}")
    
    # Test LLM Manager
    try:
        from src.llm.llm_manager import LLMManager
        manager = LLMManager()
        providers = manager.get_available_providers()
        print(f"✅ LLM Manager - Created successfully, providers: {len(providers)}")
    except Exception as e:
        print(f"❌ LLM Manager - Failed: {e}")
    
    # Test Template Engine
    try:
        from src.llm.template_engine import TemplateEngine
        engine = TemplateEngine()
        result = engine.render("Hello {{name}}!", {"name": "Test"})
        print(f"✅ Template Engine - Test: {result}")
    except Exception as e:
        print(f"❌ Template Engine - Failed: {e}")
    
    # Test Rate Limiter
    try:
        from src.llm.rate_limiter import RateLimiter, RateLimit
        limiter = RateLimiter()
        rate_limit = RateLimit(requests_per_minute=10, requests_per_hour=100, requests_per_day=1000)
        result = limiter.check_rate_limit('test_user', rate_limit)
        print(f"✅ Rate Limiter - Test: {result.allowed}")
    except Exception as e:
        print(f"❌ Rate Limiter - Failed: {e}")
    
    # Test Cost Tracker
    try:
        from src.llm.cost_tracker import CostTracker
        tracker = CostTracker()
        tracker.track_usage('openai', 'gpt-3.5-turbo', 100, 50)
        print("✅ Cost Tracker - Usage tracking successful")
    except Exception as e:
        print(f"❌ Cost Tracker - Failed: {e}")

async def main():
    """Main test function"""
    print(f"RAG Prompt Library - Component Validation")
    print(f"Time: {datetime.now().isoformat()}")
    print("=" * 60)
    print()
    
    # Test core components first
    test_core_components()
    print()
    
    # Test health endpoints if server is running
    await test_health_endpoints()
    
    print("=" * 60)
    print("Validation complete!")

if __name__ == "__main__":
    asyncio.run(main())
