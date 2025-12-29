#!/usr/bin/env python3
"""
Comprehensive Test Runner for RAG Prompt Library
"""
import subprocess
import sys
import json
import time
from datetime import datetime
import os

def run_command(command, description):
    """Run a command and return the result"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(command)}")
    print(f"{'='*60}")
    
    start_time = time.time()
    result = subprocess.run(command, capture_output=True, text=True)
    end_time = time.time()
    
    duration = end_time - start_time
    
    print(f"Duration: {duration:.2f} seconds")
    print(f"Return code: {result.returncode}")
    
    if result.stdout:
        print(f"\nSTDOUT:\n{result.stdout}")
    
    if result.stderr:
        print(f"\nSTDERR:\n{result.stderr}")
    
    return result, duration

def generate_test_report():
    """Generate comprehensive test report"""
    print("\n" + "="*80)
    print("RAG PROMPT LIBRARY - COMPREHENSIVE TEST REPORT")
    print("="*80)
    print(f"Generated: {datetime.now().isoformat()}")
    print(f"Python: {sys.version}")
    print(f"Working Directory: {os.getcwd()}")
    
    total_start_time = time.time()
    results = {}
    
    # Test categories to run
    test_categories = [
        {
            "name": "Unit Tests",
            "command": [sys.executable, "-m", "pytest", "tests/test_llm_core.py", "-v"],
            "description": "Core LLM functionality tests"
        },
        {
            "name": "Integration Tests", 
            "command": [sys.executable, "-m", "pytest", "tests/test_api_integration.py", "-v"],
            "description": "API integration tests"
        },
        {
            "name": "Functional Validation",
            "command": [sys.executable, "-m", "pytest", "tests/test_functional_validation.py", "-v"],
            "description": "End-to-end functional requirements validation"
        },
        {
            "name": "Performance Validation",
            "command": [sys.executable, "-m", "pytest", "tests/test_performance_validation.py", "-v"],
            "description": "Performance requirements validation"
        },
        {
            "name": "Quality Validation",
            "command": [sys.executable, "-m", "pytest", "tests/test_quality_validation.py", "-v"],
            "description": "Quality requirements validation"
        },
        {
            "name": "Test Coverage Analysis",
            "command": [
                sys.executable, "-m", "pytest", 
                "--cov=src", 
                "--cov-report=term-missing",
                "--cov-report=html",
                "--cov-report=json",
                "--cov-fail-under=80",
                "tests/"
            ],
            "description": "Comprehensive test coverage analysis"
        }
    ]
    
    # Run each test category
    for category in test_categories:
        result, duration = run_command(category["command"], category["description"])
        
        results[category["name"]] = {
            "success": result.returncode == 0,
            "duration": duration,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "description": category["description"]
        }
    
    total_duration = time.time() - total_start_time
    
    # Generate summary report
    print("\n" + "="*80)
    print("TEST EXECUTION SUMMARY")
    print("="*80)
    
    successful_tests = 0
    failed_tests = 0
    
    for name, result in results.items():
        status = "✅ PASSED" if result["success"] else "❌ FAILED"
        print(f"{status} | {name:<25} | {result['duration']:>8.2f}s | {result['description']}")
        
        if result["success"]:
            successful_tests += 1
        else:
            failed_tests += 1
    
    print(f"\nTotal Tests: {len(results)}")
    print(f"Passed: {successful_tests}")
    print(f"Failed: {failed_tests}")
    print(f"Success Rate: {(successful_tests/len(results)*100):.1f}%")
    print(f"Total Duration: {total_duration:.2f} seconds")
    
    # Coverage analysis
    try:
        if os.path.exists("coverage.json"):
            with open("coverage.json", "r") as f:
                coverage_data = json.load(f)
                total_coverage = coverage_data["totals"]["percent_covered"]
                print(f"Test Coverage: {total_coverage:.1f}%")
                
                if total_coverage >= 90:
                    print("✅ Coverage target (≥90%) achieved")
                else:
                    print(f"⚠️  Coverage target not met: {total_coverage:.1f}% < 90%")
    except Exception as e:
        print(f"Could not read coverage data: {e}")
    
    # Detailed failure analysis
    if failed_tests > 0:
        print("\n" + "="*80)
        print("FAILURE ANALYSIS")
        print("="*80)
        
        for name, result in results.items():
            if not result["success"]:
                print(f"\n❌ {name} FAILED:")
                print(f"Duration: {result['duration']:.2f}s")
                if result["stderr"]:
                    print(f"Error Output:\n{result['stderr']}")
                if result["stdout"]:
                    print(f"Standard Output:\n{result['stdout']}")
    
    # Recommendations
    print("\n" + "="*80)
    print("RECOMMENDATIONS")
    print("="*80)
    
    if failed_tests == 0:
        print("🎉 All tests passed! The system is ready for production.")
        print("\nNext steps:")
        print("1. Deploy to staging environment")
        print("2. Run end-to-end tests in staging")
        print("3. Perform security audit")
        print("4. Deploy to production")
    else:
        print("⚠️  Some tests failed. Address the following before deployment:")
        print("\n1. Fix failing tests")
        print("2. Re-run test suite")
        print("3. Verify all critical functionality")
        print("4. Check error handling and logging")
    
    # Performance recommendations
    print("\nPerformance Optimization:")
    print("1. Monitor response times in production")
    print("2. Set up Redis for caching and rate limiting")
    print("3. Configure proper connection pooling")
    print("4. Implement monitoring and alerting")
    
    # Security recommendations
    print("\nSecurity Checklist:")
    print("1. Verify all API keys are properly secured")
    print("2. Enable HTTPS in production")
    print("3. Configure proper CORS settings")
    print("4. Set up rate limiting")
    print("5. Enable audit logging")
    
    return results, successful_tests == len(results)

def main():
    """Main test runner"""
    print("Starting comprehensive test suite for RAG Prompt Library...")
    
    # Check if we're in the right directory
    if not os.path.exists("src"):
        print("Error: src directory not found. Please run from the functions directory.")
        sys.exit(1)
    
    # Install test dependencies if needed
    print("Checking test dependencies...")
    try:
        import pytest
        import coverage
        print("✅ Test dependencies available")
    except ImportError as e:
        print(f"❌ Missing test dependencies: {e}")
        print("Installing test dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pytest", "pytest-cov", "pytest-asyncio", "coverage"])
    
    # Run the comprehensive test suite
    results, all_passed = generate_test_report()
    
    # Exit with appropriate code
    if all_passed:
        print("\n🎉 All tests passed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Check the report above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
