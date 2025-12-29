#!/usr/bin/env python3
"""Performance validation test for Phase 1 deployment readiness"""

import requests
import time
import os
from dotenv import load_dotenv

def main():
    load_dotenv()
    
    print('=== Performance Validation Test ===')
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print('❌ No API key found')
        return False
    
    # Test API response time
    print('🔄 Testing API response time...')
    start_time = time.time()
    
    try:
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'google/gemma-2-9b-it:free',
                'messages': [{'role': 'user', 'content': 'Hello, respond briefly'}],
                'max_tokens': 20
            },
            timeout=10
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        if response.status_code == 200:
            if response_time < 2.0:
                print(f'✅ API Response Time: {response_time:.2f}s (< 2s target)')
                return True
            else:
                print(f'⚠️ API Response Time: {response_time:.2f}s (> 2s target)')
                return False
        else:
            print(f'❌ API Request Failed: HTTP {response.status_code}')
            return False
            
    except Exception as e:
        print(f'❌ Performance test failed: {str(e)}')
        return False

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
