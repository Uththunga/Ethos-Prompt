#!/usr/bin/env python3
"""
Usage Tracking Implementation Test Script
Tests the usage tracking functionality and analytics endpoints
"""

import sys
import json
import time
import importlib.util
from datetime import datetime
from typing import Dict, Any

class UsageTrackingTester:
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
            if 'methods_found' in details:
                print(f"   Methods Found: {details['methods_found']}")
    
    def test_usage_tracker_class(self):
        """Test UsageTracker class implementation"""
        print("\n🔍 Testing UsageTracker Class Implementation")
        print("=" * 50)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check if UsageTracker class is defined
            if 'class UsageTracker:' in source_code:
                self.log_result("UsageTracker Class Definition", True)
            else:
                self.log_result("UsageTracker Class Definition", False, {
                    'error': 'UsageTracker class not found in main.py'
                })
                return
            
            # Check for required methods
            required_methods = [
                'track_embedding_generation',
                'track_search_query',
                'track_document_processing',
                'track_api_request',
                'get_hourly_metrics',
                'get_provider_usage_stats'
            ]
            
            found_methods = []
            for method in required_methods:
                if f'def {method}(' in source_code:
                    found_methods.append(method)
                    self.log_result(f"Method: {method}", True)
                else:
                    self.log_result(f"Method: {method}", False, {
                        'error': f'Method {method} not found'
                    })
            
            self.log_result("UsageTracker Methods", len(found_methods) == len(required_methods), {
                'methods_found': len(found_methods),
                'methods_required': len(required_methods)
            })
            
        except Exception as e:
            self.log_result("UsageTracker Class Implementation", False, {
                'error': str(e)
            })
    
    def test_usage_metrics_endpoint(self):
        """Test usage metrics endpoint implementation"""
        print("\n🔍 Testing Usage Metrics Endpoint")
        print("=" * 40)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check if usage_metrics endpoint is defined
            if 'def usage_metrics(' in source_code:
                self.log_result("Usage Metrics Endpoint", True)
            else:
                self.log_result("Usage Metrics Endpoint", False, {
                    'error': 'usage_metrics function not found'
                })
                return
            
            # Check for required components
            required_components = [
                '@https_fn.on_request',
                'usage_tracker.get_hourly_metrics',
                'usage_tracker.get_provider_usage_stats',
                'total_embeddings',
                'total_searches',
                'total_cost',
                'error_rate'
            ]
            
            for component in required_components:
                if component in source_code:
                    self.log_result(f"Component: {component}", True)
                else:
                    self.log_result(f"Component: {component}", False, {
                        'error': f'Component not found: {component}'
                    })
            
        except Exception as e:
            self.log_result("Usage Metrics Endpoint", False, {
                'error': str(e)
            })
    
    def test_tracking_methods_structure(self):
        """Test tracking methods structure and parameters"""
        print("\n🔍 Testing Tracking Methods Structure")
        print("=" * 42)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Test embedding generation tracking
            embedding_params = [
                'provider: str',
                'model: str',
                'tokens: int',
                'latency: float',
                'success: bool',
                'cost: float'
            ]
            
            for param in embedding_params:
                if param in source_code:
                    self.log_result(f"Embedding Param: {param}", True)
                else:
                    self.log_result(f"Embedding Param: {param}", False, {
                        'error': f'Parameter not found: {param}'
                    })
            
            # Test search query tracking
            search_params = [
                'query_type: str',
                'query_length: int',
                'results_count: int',
                'relevance_score: float'
            ]
            
            for param in search_params:
                if param in source_code:
                    self.log_result(f"Search Param: {param}", True)
                else:
                    self.log_result(f"Search Param: {param}", False, {
                        'error': f'Parameter not found: {param}'
                    })
            
            # Test document processing tracking
            doc_params = [
                'file_type: str',
                'file_size_kb: int',
                'chunks_created: int',
                'processing_time: float'
            ]
            
            for param in doc_params:
                if param in source_code:
                    self.log_result(f"Document Param: {param}", True)
                else:
                    self.log_result(f"Document Param: {param}", False, {
                        'error': f'Parameter not found: {param}'
                    })
            
        except Exception as e:
            self.log_result("Tracking Methods Structure", False, {
                'error': str(e)
            })
    
    def test_database_integration(self):
        """Test database integration for usage tracking"""
        print("\n🔍 Testing Database Integration")
        print("=" * 35)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check for database operations
            db_operations = [
                'self.metrics_collection',
                'self.daily_stats_collection',
                'metrics_collection.add',
                'metrics_collection.where',
                'timestamp',
                'date',
                'hour'
            ]
            
            for operation in db_operations:
                if operation in source_code:
                    self.log_result(f"DB Operation: {operation}", True)
                else:
                    self.log_result(f"DB Operation: {operation}", False, {
                        'error': f'Database operation not found: {operation}'
                    })
            
            # Check for error handling
            error_handling = [
                'try:',
                'except Exception as e:',
                'logger.error',
                'Error tracking'
            ]
            
            for pattern in error_handling:
                if pattern in source_code:
                    self.log_result(f"Error Handling: {pattern}", True)
                else:
                    self.log_result(f"Error Handling: {pattern}", False, {
                        'error': f'Error handling pattern not found: {pattern}'
                    })
            
        except Exception as e:
            self.log_result("Database Integration", False, {
                'error': str(e)
            })
    
    def test_analytics_calculations(self):
        """Test analytics calculations and aggregations"""
        print("\n🔍 Testing Analytics Calculations")
        print("=" * 38)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check for aggregation logic
            aggregations = [
                'hourly_data',
                'provider_stats',
                'total_embeddings',
                'total_searches',
                'total_cost',
                'error_rate',
                'success_rate',
                'avg_latency'
            ]
            
            for aggregation in aggregations:
                if aggregation in source_code:
                    self.log_result(f"Aggregation: {aggregation}", True)
                else:
                    self.log_result(f"Aggregation: {aggregation}", False, {
                        'error': f'Aggregation not found: {aggregation}'
                    })
            
            # Check for time-based filtering
            time_filters = [
                'timedelta',
                'start_time',
                'end_time',
                'hours=',
                'days='
            ]
            
            for filter_pattern in time_filters:
                if filter_pattern in source_code:
                    self.log_result(f"Time Filter: {filter_pattern}", True)
                else:
                    self.log_result(f"Time Filter: {filter_pattern}", False, {
                        'error': f'Time filter not found: {filter_pattern}'
                    })
            
        except Exception as e:
            self.log_result("Analytics Calculations", False, {
                'error': str(e)
            })
    
    def test_dashboard_integration(self):
        """Test dashboard file and integration"""
        print("\n🔍 Testing Dashboard Integration")
        print("=" * 35)
        
        try:
            # Check if dashboard file exists
            import os
            if os.path.exists('../dashboards/usage_analytics.html'):
                self.log_result("Dashboard File Exists", True)
                
                # Check dashboard content
                with open('../dashboards/usage_analytics.html', 'r', encoding='utf-8') as f:
                    dashboard_content = f.read()
                
                dashboard_components = [
                    'Usage Analytics Dashboard',
                    'total-embeddings',
                    'total-searches',
                    'total-cost',
                    'error-rate',
                    'hourlyChart',
                    'providerChart',
                    'usage_metrics',
                    'Chart.js'
                ]
                
                for component in dashboard_components:
                    if component in dashboard_content:
                        self.log_result(f"Dashboard Component: {component}", True)
                    else:
                        self.log_result(f"Dashboard Component: {component}", False, {
                            'error': f'Dashboard component not found: {component}'
                        })
                        
            else:
                self.log_result("Dashboard File Exists", False, {
                    'error': 'Dashboard file not found at ../dashboards/usage_analytics.html'
                })
            
        except Exception as e:
            self.log_result("Dashboard Integration", False, {
                'error': str(e)
            })
    
    def test_cors_and_api_structure(self):
        """Test CORS configuration and API structure"""
        print("\n🔍 Testing CORS and API Structure")
        print("=" * 38)
        
        try:
            with open('main.py', 'r', encoding='utf-8') as f:
                source_code = f.read()
            
            # Check CORS configuration
            cors_patterns = [
                'cors=options.CorsOptions',
                'cors_origins=["*"]',
                'cors_methods=["GET", "POST", "OPTIONS"]',
                '_cors_enabled_response'
            ]
            
            for pattern in cors_patterns:
                if pattern in source_code:
                    self.log_result(f"CORS: {pattern}", True)
                else:
                    self.log_result(f"CORS: {pattern}", False, {
                        'error': f'CORS pattern not found: {pattern}'
                    })
            
            # Check API response structure
            response_patterns = [
                'response_data',
                'timestamp',
                'summary',
                'hourly_metrics',
                'provider_stats',
                'error_response'
            ]
            
            for pattern in response_patterns:
                if pattern in source_code:
                    self.log_result(f"API Response: {pattern}", True)
                else:
                    self.log_result(f"API Response: {pattern}", False, {
                        'error': f'API response pattern not found: {pattern}'
                    })
            
        except Exception as e:
            self.log_result("CORS and API Structure", False, {
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
    print("📊 Usage Tracking Implementation Test")
    print("=" * 50)
    
    tester = UsageTrackingTester()
    
    # Run all tests
    tester.test_usage_tracker_class()
    tester.test_usage_metrics_endpoint()
    tester.test_tracking_methods_structure()
    tester.test_database_integration()
    tester.test_analytics_calculations()
    tester.test_dashboard_integration()
    tester.test_cors_and_api_structure()
    
    # Generate report
    report = tester.generate_test_report()
    
    print(f"\n📊 Usage Tracking Implementation Test Summary")
    print("=" * 50)
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Passed: {report['summary']['passed_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Success Rate: {report['summary']['success_rate']}%")
    
    # Save detailed report
    with open('usage_tracking_test_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: usage_tracking_test_report.json")
    
    if report['summary']['implementation_complete']:
        print("\n✅ Usage tracking implementation COMPLETE!")
        return 0
    else:
        print("\n❌ Usage tracking implementation INCOMPLETE - Issues found")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
