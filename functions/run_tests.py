#!/usr/bin/env python3
"""
Test runner for AI/ML services
"""
import unittest
import sys
import os
import coverage

def run_tests_with_coverage():
    """Run tests with coverage reporting"""
    
    # Initialize coverage
    cov = coverage.Coverage(source=['src'])
    cov.start()
    
    try:
        # Discover and run tests
        loader = unittest.TestLoader()
        start_dir = os.path.join(os.path.dirname(__file__), 'tests')
        suite = loader.discover(start_dir, pattern='test_*.py')
        
        # Run tests
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        # Stop coverage
        cov.stop()
        cov.save()
        
        # Generate coverage report
        print("\n" + "="*50)
        print("COVERAGE REPORT")
        print("="*50)
        cov.report()
        
        # Generate HTML coverage report
        try:
            cov.html_report(directory='htmlcov')
            print(f"\nHTML coverage report generated in: htmlcov/index.html")
        except Exception as e:
            print(f"Could not generate HTML report: {e}")
        
        # Return success/failure
        return result.wasSuccessful()
        
    except Exception as e:
        print(f"Error running tests: {e}")
        return False
    finally:
        cov.stop()

def run_tests_simple():
    """Run tests without coverage (fallback)"""
    try:
        # Discover and run tests
        loader = unittest.TestLoader()
        start_dir = os.path.join(os.path.dirname(__file__), 'tests')
        suite = loader.discover(start_dir, pattern='test_*.py')
        
        # Run tests
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        return result.wasSuccessful()
        
    except Exception as e:
        print(f"Error running tests: {e}")
        return False

if __name__ == '__main__':
    print("Running AI/ML Service Tests")
    print("="*50)
    
    # Try to run with coverage, fallback to simple if coverage not available
    try:
        import coverage
        success = run_tests_with_coverage()
    except ImportError:
        print("Coverage not available, running simple tests...")
        success = run_tests_simple()
    
    if success:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed!")
        sys.exit(1)
