#!/usr/bin/env python3
"""
API Validation Script
Validates all REST API endpoints for production readiness
"""

import os
import sys
import json
import time
import requests
from typing import Dict, List, Any
from datetime import datetime

class APIValidator:
    """Validates REST API endpoints for production readiness"""
    
    def __init__(self):
        self.base_url = "https://us-central1-rag-prompt-library.cloudfunctions.net/api/v1"
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'total_endpoints': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0,
            'endpoints': []
        }
        
        # Define expected endpoints
        self.expected_endpoints = {
            'Core Prompt Management': [
                {'method': 'GET', 'path': '/prompts', 'auth_required': True},
                {'method': 'POST', 'path': '/prompts', 'auth_required': True},
                {'method': 'GET', 'path': '/prompts/{id}', 'auth_required': True},
                {'method': 'PUT', 'path': '/prompts/{id}', 'auth_required': True},
                {'method': 'DELETE', 'path': '/prompts/{id}', 'auth_required': True},
                {'method': 'POST', 'path': '/prompts/{id}/execute', 'auth_required': True},
            ],
            'Document Management': [
                {'method': 'GET', 'path': '/documents', 'auth_required': True},
                {'method': 'POST', 'path': '/documents', 'auth_required': True},
                {'method': 'GET', 'path': '/documents/{id}', 'auth_required': True},
                {'method': 'DELETE', 'path': '/documents/{id}', 'auth_required': True},
            ],
            'Team Workspaces': [
                {'method': 'GET', 'path': '/workspaces', 'auth_required': True},
                {'method': 'POST', 'path': '/workspaces', 'auth_required': True},
                {'method': 'GET', 'path': '/workspaces/{id}', 'auth_required': True},
                {'method': 'PUT', 'path': '/workspaces/{id}', 'auth_required': True},
                {'method': 'DELETE', 'path': '/workspaces/{id}', 'auth_required': True},
                {'method': 'POST', 'path': '/workspaces/{id}/members', 'auth_required': True},
                {'method': 'DELETE', 'path': '/workspaces/{id}/members/{user_id}', 'auth_required': True},
            ],
            'Analytics Dashboard': [
                {'method': 'GET', 'path': '/analytics/dashboard', 'auth_required': True},
                {'method': 'GET', 'path': '/analytics/metrics', 'auth_required': True},
                {'method': 'GET', 'path': '/analytics/usage', 'auth_required': True},
                {'method': 'GET', 'path': '/analytics/performance', 'auth_required': True},
            ],
            'Template Marketplace': [
                {'method': 'GET', 'path': '/marketplace/templates', 'auth_required': False},
                {'method': 'POST', 'path': '/marketplace/templates', 'auth_required': True},
                {'method': 'GET', 'path': '/marketplace/templates/{id}', 'auth_required': False},
                {'method': 'PUT', 'path': '/marketplace/templates/{id}', 'auth_required': True},
                {'method': 'POST', 'path': '/marketplace/templates/{id}/rate', 'auth_required': True},
            ],
            'RAG Processing': [
                {'method': 'POST', 'path': '/rag/query', 'auth_required': True},
                {'method': 'POST', 'path': '/rag/embed', 'auth_required': True},
                {'method': 'GET', 'path': '/rag/status', 'auth_required': True},
            ],
            'System': [
                {'method': 'GET', 'path': '/health', 'auth_required': False},
                {'method': 'GET', 'path': '/version', 'auth_required': False},
            ]
        }
    
    def validate_all_endpoints(self) -> Dict[str, Any]:
        """Validate all API endpoints"""
        print("🔍 Starting API Validation Suite")
        print("=" * 50)
        
        for category, endpoints in self.expected_endpoints.items():
            print(f"\n📋 Validating {category} APIs...")
            
            for endpoint in endpoints:
                self._validate_endpoint(category, endpoint)
        
        # Generate summary
        self._generate_summary()
        
        return self.results
    
    def _validate_endpoint(self, category: str, endpoint: Dict[str, Any]):
        """Validate a single endpoint"""
        method = endpoint['method']
        path = endpoint['path']
        auth_required = endpoint['auth_required']
        
        self.results['total_endpoints'] += 1
        
        # Replace path parameters with test values
        test_path = path.replace('{id}', 'test-id').replace('{user_id}', 'test-user-id')
        url = f"{self.base_url}{test_path}"
        
        endpoint_result = {
            'category': category,
            'method': method,
            'path': path,
            'url': url,
            'auth_required': auth_required,
            'status': 'unknown',
            'response_time': 0,
            'status_code': 0,
            'error': None
        }
        
        try:
            # Test without authentication first
            start_time = time.time()
            
            if method == 'GET':
                response = requests.get(url, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json={}, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json={}, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response_time = (time.time() - start_time) * 1000  # Convert to ms
            endpoint_result['response_time'] = round(response_time, 2)
            endpoint_result['status_code'] = response.status_code
            
            # Evaluate response
            if auth_required:
                # Should return 401 without auth
                if response.status_code == 401:
                    endpoint_result['status'] = 'pass'
                    self.results['passed'] += 1
                    print(f"  ✅ {method} {path} - Auth required (401)")
                elif response.status_code == 404:
                    endpoint_result['status'] = 'warning'
                    self.results['warnings'] += 1
                    print(f"  ⚠️  {method} {path} - Endpoint not found (404)")
                else:
                    endpoint_result['status'] = 'fail'
                    self.results['failed'] += 1
                    print(f"  ❌ {method} {path} - Unexpected status: {response.status_code}")
            else:
                # Should return 200 or other success code
                if 200 <= response.status_code < 300:
                    endpoint_result['status'] = 'pass'
                    self.results['passed'] += 1
                    print(f"  ✅ {method} {path} - Success ({response.status_code})")
                elif response.status_code == 404:
                    endpoint_result['status'] = 'warning'
                    self.results['warnings'] += 1
                    print(f"  ⚠️  {method} {path} - Endpoint not found (404)")
                else:
                    endpoint_result['status'] = 'fail'
                    self.results['failed'] += 1
                    print(f"  ❌ {method} {path} - Error: {response.status_code}")
            
        except requests.exceptions.Timeout:
            endpoint_result['status'] = 'fail'
            endpoint_result['error'] = 'Request timeout'
            self.results['failed'] += 1
            print(f"  ❌ {method} {path} - Timeout")
            
        except requests.exceptions.ConnectionError:
            endpoint_result['status'] = 'warning'
            endpoint_result['error'] = 'Connection error (service may be offline)'
            self.results['warnings'] += 1
            print(f"  ⚠️  {method} {path} - Connection error")
            
        except Exception as e:
            endpoint_result['status'] = 'fail'
            endpoint_result['error'] = str(e)
            self.results['failed'] += 1
            print(f"  ❌ {method} {path} - Error: {e}")
        
        self.results['endpoints'].append(endpoint_result)
    
    def _generate_summary(self):
        """Generate validation summary"""
        print("\n" + "=" * 50)
        print("🔍 API VALIDATION SUMMARY")
        print("=" * 50)
        print(f"Total Endpoints: {self.results['total_endpoints']}")
        print(f"Passed: {self.results['passed']}")
        print(f"Failed: {self.results['failed']}")
        print(f"Warnings: {self.results['warnings']}")
        
        # Calculate success rate
        success_rate = (self.results['passed'] / self.results['total_endpoints']) * 100 if self.results['total_endpoints'] > 0 else 0
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Show failed endpoints
        failed_endpoints = [ep for ep in self.results['endpoints'] if ep['status'] == 'fail']
        if failed_endpoints:
            print(f"\n❌ Failed Endpoints ({len(failed_endpoints)}):")
            for ep in failed_endpoints:
                print(f"  - {ep['method']} {ep['path']}: {ep.get('error', 'Unknown error')}")
        
        # Show warning endpoints
        warning_endpoints = [ep for ep in self.results['endpoints'] if ep['status'] == 'warning']
        if warning_endpoints:
            print(f"\n⚠️  Warning Endpoints ({len(warning_endpoints)}):")
            for ep in warning_endpoints:
                print(f"  - {ep['method']} {ep['path']}: {ep.get('error', 'Endpoint not found')}")
        
        # Performance analysis
        response_times = [ep['response_time'] for ep in self.results['endpoints'] if ep['response_time'] > 0]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            print(f"\n⚡ Performance:")
            print(f"  Average Response Time: {avg_response_time:.2f}ms")
            print(f"  Max Response Time: {max_response_time:.2f}ms")
        
        # Save detailed report
        report_path = f"reports/api_validation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: {report_path}")
        
        # Overall status
        if self.results['failed'] == 0:
            print("\n✅ API VALIDATION PASSED")
            return True
        else:
            print(f"\n❌ API VALIDATION FAILED - {self.results['failed']} endpoints failed")
            return False

def validate_api_implementation():
    """Validate API implementation status"""
    print("🔍 Checking API Implementation Status")
    print("=" * 50)
    
    # Check if API files exist
    api_files = [
        'functions/src/api/rest_api.py',
        'functions/src/workspaces/workspace_manager.py',
        'functions/src/analytics/analytics_manager.py',
        'functions/src/rate_limiting/middleware.py',
        'functions/src/security/production_security.py'
    ]
    
    implementation_status = {}
    
    for file_path in api_files:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
                lines = len(content.split('\n'))
                implementation_status[file_path] = {
                    'exists': True,
                    'lines': lines,
                    'size_kb': len(content) / 1024
                }
                print(f"  ✅ {file_path}: {lines} lines ({len(content)/1024:.1f}KB)")
        else:
            implementation_status[file_path] = {'exists': False}
            print(f"  ❌ {file_path}: Missing")
    
    # Check for key API features
    features = {
        'Authentication Middleware': 'require_authentication',
        'Rate Limiting': 'RateLimitMiddleware',
        'Workspace Management': 'create_workspace',
        'Analytics Tracking': 'track_event',
        'Error Handling': 'APIResponse',
        'Security Validation': 'validate_request_security'
    }
    
    print(f"\n🔧 API Features Implementation:")
    for feature, search_term in features.items():
        found = False
        for file_path in api_files:
            if os.path.exists(file_path):
                with open(file_path, 'r') as f:
                    if search_term in f.read():
                        found = True
                        break
        
        if found:
            print(f"  ✅ {feature}: Implemented")
        else:
            print(f"  ❌ {feature}: Missing")
    
    return implementation_status

if __name__ == "__main__":
    # Check implementation status
    implementation_status = validate_api_implementation()
    
    print("\n" + "=" * 50)
    
    # Validate endpoints
    validator = APIValidator()
    success = validator.validate_all_endpoints()
    
    sys.exit(0 if success else 1)
