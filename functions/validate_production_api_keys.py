#!/usr/bin/env python3
"""
Production API Key Validation Script
Validates all API keys and configurations before production deployment
"""

import os
import sys
import asyncio
import aiohttp
import time
import json
from datetime import datetime
from typing import Dict, Any, List

class ProductionAPIValidator:
    def __init__(self):
        self.results = []
        self.start_time = time.time()
        
    def log_result(self, test_name: str, success: bool, details: Dict[str, Any] = None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details and not success:
            print(f"   Error: {details.get('error', 'Unknown error')}")
    
    def validate_environment_variables(self) -> bool:
        """Validate required environment variables"""
        print("\n🔍 Validating Environment Variables...")
        
        required_vars = [
            'GOOGLE_API_KEY',
            'OPENROUTER_API_KEY'
        ]
        
        optional_vars = [
            'OPENAI_API_KEY',
            'PRODUCTION_SITE_URL',
            'ENVIRONMENT_MODE'
        ]
        
        all_valid = True
        
        for var in required_vars:
            value = os.getenv(var)
            if not value:
                self.log_result(f"Environment Variable: {var}", False, 
                              {'error': f'{var} is required but not set'})
                all_valid = False
            else:
                # Validate format
                if var == 'GOOGLE_API_KEY' and not value.startswith('AIza'):
                    self.log_result(f"Environment Variable: {var}", False,
                                  {'error': 'Google API key should start with "AIza"'})
                    all_valid = False
                elif var == 'OPENROUTER_API_KEY' and not value.startswith('sk-or-v1'):
                    self.log_result(f"Environment Variable: {var}", False,
                                  {'error': 'OpenRouter API key should start with "sk-or-v1"'})
                    all_valid = False
                else:
                    self.log_result(f"Environment Variable: {var}", True,
                                  {'length': len(value), 'prefix': value[:10] + '...'})
        
        for var in optional_vars:
            value = os.getenv(var)
            if value:
                self.log_result(f"Optional Variable: {var}", True,
                              {'configured': True, 'value': value[:20] + '...' if len(value) > 20 else value})
            else:
                self.log_result(f"Optional Variable: {var}", True,
                              {'configured': False, 'note': 'Optional variable not set'})
        
        return all_valid
    
    async def test_google_api(self) -> bool:
        """Test Google AI Platform API connectivity"""
        print("\n🧪 Testing Google API Connectivity...")
        
        api_key = os.getenv('GOOGLE_API_KEY')
        if not api_key:
            self.log_result("Google API Test", False, {'error': 'API key not configured'})
            return False
        
        try:
            # Test with a simple embedding request
            url = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent"
            
            headers = {
                'Content-Type': 'application/json',
                'x-goog-api-key': api_key
            }
            
            payload = {
                'model': 'models/embedding-001',
                'content': {
                    'parts': [{'text': 'Production API test'}]
                }
            }
            
            start_time = time.time()
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, headers=headers, timeout=30) as response:
                    latency = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        embedding = data.get('embedding', {}).get('values', [])
                        
                        self.log_result("Google API Test", True, {
                            'status_code': response.status,
                            'latency_ms': round(latency, 2),
                            'embedding_dimensions': len(embedding),
                            'api_version': 'v1beta'
                        })
                        return True
                    else:
                        error_text = await response.text()
                        self.log_result("Google API Test", False, {
                            'status_code': response.status,
                            'error': error_text,
                            'latency_ms': round(latency, 2)
                        })
                        return False
                        
        except Exception as e:
            self.log_result("Google API Test", False, {'error': str(e)})
            return False
    
    async def test_openrouter_api(self) -> bool:
        """Test OpenRouter API connectivity"""
        print("\n🧪 Testing OpenRouter API Connectivity...")
        
        api_key = os.getenv('OPENROUTER_API_KEY')
        if not api_key:
            self.log_result("OpenRouter API Test", False, {'error': 'API key not configured'})
            return False
        
        try:
            # Test with a simple request to get models
            url = "https://openrouter.ai/api/v1/models"
            
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            start_time = time.time()
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=30) as response:
                    latency = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        models = data.get('data', [])
                        
                        self.log_result("OpenRouter API Test", True, {
                            'status_code': response.status,
                            'latency_ms': round(latency, 2),
                            'available_models': len(models),
                            'api_accessible': True
                        })
                        return True
                    else:
                        error_text = await response.text()
                        self.log_result("OpenRouter API Test", False, {
                            'status_code': response.status,
                            'error': error_text,
                            'latency_ms': round(latency, 2)
                        })
                        return False
                        
        except Exception as e:
            self.log_result("OpenRouter API Test", False, {'error': str(e)})
            return False
    
    async def test_openai_api(self) -> bool:
        """Test OpenAI API connectivity (optional)"""
        print("\n🧪 Testing OpenAI API Connectivity (Optional)...")
        
        api_key = os.getenv('OPENAI_API_KEY')
        if not api_key:
            self.log_result("OpenAI API Test", True, {'note': 'Optional API key not configured'})
            return True
        
        try:
            url = "https://api.openai.com/v1/models"
            
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            start_time = time.time()
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers, timeout=30) as response:
                    latency = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        models = data.get('data', [])
                        
                        self.log_result("OpenAI API Test", True, {
                            'status_code': response.status,
                            'latency_ms': round(latency, 2),
                            'available_models': len(models)
                        })
                        return True
                    else:
                        error_text = await response.text()
                        self.log_result("OpenAI API Test", False, {
                            'status_code': response.status,
                            'error': error_text,
                            'latency_ms': round(latency, 2)
                        })
                        return False
                        
        except Exception as e:
            self.log_result("OpenAI API Test", False, {'error': str(e)})
            return False
    
    def validate_firebase_config(self) -> bool:
        """Validate Firebase configuration"""
        print("\n🔍 Validating Firebase Configuration...")
        
        try:
            # Check if firebase.json exists
            if os.path.exists('../firebase.json'):
                self.log_result("Firebase Config File", True, {'file': 'firebase.json found'})
            else:
                self.log_result("Firebase Config File", False, {'error': 'firebase.json not found'})
                return False
            
            # Check if functions directory exists
            if os.path.exists('.'):
                self.log_result("Functions Directory", True, {'path': 'functions/'})
            else:
                self.log_result("Functions Directory", False, {'error': 'functions directory not found'})
                return False
            
            # Check requirements.txt
            if os.path.exists('requirements.txt'):
                with open('requirements.txt', 'r') as f:
                    requirements = f.read()
                    self.log_result("Requirements File", True, {
                        'file': 'requirements.txt found',
                        'lines': len(requirements.split('\n'))
                    })
            else:
                self.log_result("Requirements File", False, {'error': 'requirements.txt not found'})
                return False
            
            return True
            
        except Exception as e:
            self.log_result("Firebase Config Validation", False, {'error': str(e)})
            return False
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate validation report"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': round(time.time() - self.start_time, 2),
            'summary': {
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': failed_tests,
                'success_rate': round((passed_tests / total_tests) * 100, 2) if total_tests > 0 else 0
            },
            'results': self.results,
            'production_ready': failed_tests == 0
        }
        
        return report

async def main():
    """Main validation function"""
    print("🔑 Production API Key Validation")
    print("=" * 50)
    
    validator = ProductionAPIValidator()
    
    # Run all validation tests
    env_valid = validator.validate_environment_variables()
    firebase_valid = validator.validate_firebase_config()
    google_valid = await validator.test_google_api()
    openrouter_valid = await validator.test_openrouter_api()
    openai_valid = await validator.test_openai_api()
    
    # Generate report
    report = validator.generate_report()
    
    print(f"\n📊 Validation Summary:")
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Passed: {report['summary']['passed_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Success Rate: {report['summary']['success_rate']}%")
    print(f"Duration: {report['duration_seconds']}s")
    
    # Save detailed report
    with open('production_api_validation_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: production_api_validation_report.json")
    
    if report['production_ready']:
        print("\n✅ Production API validation PASSED - Ready for deployment!")
        return 0
    else:
        print("\n❌ Production API validation FAILED - Issues need to be resolved")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
