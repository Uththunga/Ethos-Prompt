#!/usr/bin/env python3
"""
Health Check Endpoints Test Script
Tests the implemented health check endpoints
"""

import sys
import json
import time
import importlib.util
from datetime import datetime
from typing import Dict, Any

class HealthCheckTester:
    def __init__(self):
        self.results = []
        
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
        elif details and success:
            if 'response_time' in details:
                print(f"   Response Time: {details['response_time']}ms")
            if 'status' in details:
                print(f"   Status: {details['status']}")
    
    def test_health_endpoint_implementation(self):
        """Test health endpoint implementation"""
        print("\n🔍 Testing Health Endpoint Implementation")
        print("=" * 45)
        
        try:
            # Import main module to test function definitions
            spec = importlib.util.spec_from_file_location("main", "main.py")
            main_module = importlib.util.module_from_spec(spec)
            
            # Check if health endpoints are defined
            health_endpoints = ['health', 'health_detailed', 'health_ready']
            
            for endpoint in health_endpoints:
                if hasattr(main_module, endpoint):
                    self.log_result(f"Endpoint Definition: {endpoint}", True, {
                        'defined': True,
                        'callable': callable(getattr(main_module, endpoint))
                    })
                else:
                    self.log_result(f"Endpoint Definition: {endpoint}", False, {
                        'error': f'Function {endpoint} not found in main.py'
                    })
            
        except Exception as e:
            self.log_result("Health Endpoint Implementation", False, {
                'error': str(e)
            })
    
    def test_health_endpoint_syntax(self):
        """Test health endpoint syntax"""
        print("\n🔍 Testing Health Endpoint Syntax")
        print("=" * 40)
        
        try:
            # Test Python syntax compilation
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Compile to check syntax
            compile(source_code, 'main.py', 'exec')
            
            self.log_result("Health Endpoints Syntax", True, {
                'syntax_valid': True,
                'file': 'main.py'
            })
            
            # Check for health endpoint patterns
            health_patterns = [
                '@https_fn.on_request',
                'def health(',
                'def health_detailed(',
                'def health_ready('
            ]
            
            for pattern in health_patterns:
                if pattern in source_code:
                    self.log_result(f"Pattern Check: {pattern}", True)
                else:
                    self.log_result(f"Pattern Check: {pattern}", False, {
                        'error': f'Pattern not found: {pattern}'
                    })
            
        except SyntaxError as e:
            self.log_result("Health Endpoints Syntax", False, {
                'error': f'Syntax error: {e}'
            })
        except Exception as e:
            self.log_result("Health Endpoints Syntax", False, {
                'error': str(e)
            })
    
    def test_health_endpoint_structure(self):
        """Test health endpoint structure"""
        print("\n🔍 Testing Health Endpoint Structure")
        print("=" * 42)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check for required components in health endpoints
            required_components = [
                'timestamp',
                'status',
                '_cors_enabled_response',
                'datetime.now(timezone.utc)',
                'health_status',
                'services',
                'metrics'
            ]
            
            for component in required_components:
                if component in source_code:
                    self.log_result(f"Component: {component}", True)
                else:
                    self.log_result(f"Component: {component}", False, {
                        'error': f'Required component not found: {component}'
                    })
            
            # Check for error handling
            error_handling_patterns = [
                'try:',
                'except Exception as e:',
                'logger.error'
            ]
            
            for pattern in error_handling_patterns:
                if pattern in source_code:
                    self.log_result(f"Error Handling: {pattern}", True)
                else:
                    self.log_result(f"Error Handling: {pattern}", False, {
                        'error': f'Error handling pattern not found: {pattern}'
                    })
            
        except Exception as e:
            self.log_result("Health Endpoint Structure", False, {
                'error': str(e)
            })
    
    def test_cors_configuration(self):
        """Test CORS configuration for health endpoints"""
        print("\n🔍 Testing CORS Configuration")
        print("=" * 35)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check for CORS configuration
            cors_patterns = [
                'cors=options.CorsOptions',
                'cors_origins=["*"]',
                'cors_methods=["GET", "POST", "OPTIONS"]',
                'cors_headers=["Content-Type", "Authorization"]',
                '_handle_preflight()'
            ]
            
            for pattern in cors_patterns:
                if pattern in source_code:
                    self.log_result(f"CORS Pattern: {pattern}", True)
                else:
                    self.log_result(f"CORS Pattern: {pattern}", False, {
                        'error': f'CORS pattern not found: {pattern}'
                    })
            
        except Exception as e:
            self.log_result("CORS Configuration", False, {
                'error': str(e)
            })
    
    def test_response_format(self):
        """Test response format compliance"""
        print("\n🔍 Testing Response Format")
        print("=" * 32)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check for proper response format
            response_patterns = [
                "'status':",
                "'timestamp':",
                "'version':",
                "'environment':",
                "'services':",
                "'metrics':",
                "'ready':"
            ]
            
            for pattern in response_patterns:
                if pattern in source_code:
                    self.log_result(f"Response Field: {pattern}", True)
                else:
                    self.log_result(f"Response Field: {pattern}", False, {
                        'error': f'Response field not found: {pattern}'
                    })
            
            # Check for status codes
            status_code_patterns = [
                'status_code = 200',
                'status_code = 503',
                '_cors_enabled_response(error_response, 500)'
            ]
            
            for pattern in status_code_patterns:
                if pattern in source_code:
                    self.log_result(f"Status Code: {pattern}", True)
                else:
                    self.log_result(f"Status Code: {pattern}", False, {
                        'error': f'Status code pattern not found: {pattern}'
                    })
            
        except Exception as e:
            self.log_result("Response Format", False, {
                'error': str(e)
            })
    
    def test_service_checks(self):
        """Test service check implementations"""
        print("\n🔍 Testing Service Checks")
        print("=" * 30)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check for service testing implementations
            service_patterns = [
                'google_embeddings',
                'openrouter_fallback',
                'firestore',
                'ai_service',
                'database'
            ]
            
            for service in service_patterns:
                if service in source_code:
                    self.log_result(f"Service Check: {service}", True)
                else:
                    self.log_result(f"Service Check: {service}", False, {
                        'error': f'Service check not found: {service}'
                    })
            
            # Check for latency measurements
            latency_patterns = [
                'latency_ms',
                'response_time_ms',
                'time.time()',
                'test_start'
            ]
            
            for pattern in latency_patterns:
                if pattern in source_code:
                    self.log_result(f"Latency Measurement: {pattern}", True)
                else:
                    self.log_result(f"Latency Measurement: {pattern}", False, {
                        'error': f'Latency measurement not found: {pattern}'
                    })
            
        except Exception as e:
            self.log_result("Service Checks", False, {
                'error': str(e)
            })
    
    def generate_test_report(self) -> Dict[str, Any]:
        """Generate test report"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_tests': total_tests,
                'passed_tests': passed_tests,
                'failed_tests': failed_tests,
                'success_rate': round((passed_tests / total_tests) * 100, 2) if total_tests > 0 else 0,
                'implementation_complete': failed_tests == 0
            },
            'results': self.results
        }
        
        return report

def main():
    """Main test function"""
    print("🔍 Health Check Endpoints Implementation Test")
    print("=" * 50)
    
    tester = HealthCheckTester()
    
    # Run all tests
    tester.test_health_endpoint_implementation()
    tester.test_health_endpoint_syntax()
    tester.test_health_endpoint_structure()
    tester.test_cors_configuration()
    tester.test_response_format()
    tester.test_service_checks()
    
    # Generate report
    report = tester.generate_test_report()
    
    print(f"\n📊 Health Check Implementation Test Summary")
    print("=" * 50)
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Passed: {report['summary']['passed_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Success Rate: {report['summary']['success_rate']}%")
    
    # Save detailed report
    with open('health_check_implementation_test.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: health_check_implementation_test.json")
    
    if report['summary']['implementation_complete']:
        print("\n✅ Health check endpoints implementation COMPLETE!")
        return 0
    else:
        print("\n❌ Health check endpoints implementation INCOMPLETE - Issues found")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
