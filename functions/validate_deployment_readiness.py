#!/usr/bin/env python3
"""
Deployment Readiness Validation Script
Validates that functions are ready for production deployment
"""

import os
import sys
import json
import importlib.util
from datetime import datetime
from typing import Dict, Any, List

class DeploymentValidator:
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
    
    def validate_file_structure(self) -> bool:
        """Validate required files exist"""
        print("\n🔍 Validating File Structure...")
        
        required_files = [
            'main.py',
            'requirements.txt',
            '../firebase.json'
        ]
        
        optional_files = [
            'src/__init__.py',
            'src/ai_service.py',
            'src/rag/__init__.py'
        ]
        
        all_valid = True
        
        for file_path in required_files:
            if os.path.exists(file_path):
                self.log_result(f"Required File: {file_path}", True)
            else:
                self.log_result(f"Required File: {file_path}", False, 
                              {'error': f'File not found: {file_path}'})
                all_valid = False
        
        for file_path in optional_files:
            if os.path.exists(file_path):
                self.log_result(f"Optional File: {file_path}", True)
            else:
                self.log_result(f"Optional File: {file_path}", True, 
                              {'note': f'Optional file not found: {file_path}'})
        
        return all_valid
    
    def validate_python_syntax(self) -> bool:
        """Validate Python syntax of main files"""
        print("\n🔍 Validating Python Syntax...")
        
        python_files = [
            'main.py'
        ]
        
        # Add src files if they exist
        if os.path.exists('src'):
            for root, dirs, files in os.walk('src'):
                for file in files:
                    if file.endswith('.py'):
                        python_files.append(os.path.join(root, file))
        
        all_valid = True
        
        for file_path in python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    compile(f.read(), file_path, 'exec')
                self.log_result(f"Syntax Check: {file_path}", True)
            except SyntaxError as e:
                self.log_result(f"Syntax Check: {file_path}", False, 
                              {'error': f'Syntax error: {e}'})
                all_valid = False
            except Exception as e:
                self.log_result(f"Syntax Check: {file_path}", False, 
                              {'error': f'Error reading file: {e}'})
                all_valid = False
        
        return all_valid
    
    def validate_imports(self) -> bool:
        """Validate critical imports"""
        print("\n🔍 Validating Critical Imports...")
        
        critical_imports = [
            'firebase_functions',
            'firebase_admin',
            'flask'
        ]
        
        all_valid = True
        
        for module_name in critical_imports:
            try:
                importlib.import_module(module_name)
                self.log_result(f"Import: {module_name}", True)
            except ImportError as e:
                self.log_result(f"Import: {module_name}", False, 
                              {'error': f'Import error: {e}'})
                all_valid = False
        
        return all_valid
    
    def validate_requirements(self) -> bool:
        """Validate requirements.txt"""
        print("\n🔍 Validating Requirements...")
        
        try:
            with open('requirements.txt', 'r') as f:
                requirements = f.read().strip().split('\n')
            
            # Filter out empty lines and comments
            requirements = [req.strip() for req in requirements if req.strip() and not req.startswith('#')]
            
            essential_packages = [
                'firebase-functions',
                'firebase-admin',
                'flask',
                'google-generativeai',
                'openai'
            ]
            
            found_packages = []
            for req in requirements:
                package_name = req.split('==')[0].split('>=')[0].split('<=')[0].strip()
                found_packages.append(package_name)
            
            all_found = True
            for package in essential_packages:
                if any(package in found for found in found_packages):
                    self.log_result(f"Package: {package}", True)
                else:
                    self.log_result(f"Package: {package}", False, 
                                  {'error': f'Package not found in requirements.txt'})
                    all_found = False
            
            self.log_result("Requirements File", True, {
                'total_packages': len(requirements),
                'essential_found': all_found
            })
            
            return all_found
            
        except Exception as e:
            self.log_result("Requirements File", False, {'error': str(e)})
            return False
    
    def validate_firebase_config(self) -> bool:
        """Validate Firebase configuration"""
        print("\n🔍 Validating Firebase Configuration...")
        
        try:
            with open('../firebase.json', 'r') as f:
                config = json.load(f)
            
            # Check functions configuration
            if 'functions' in config:
                functions_config = config['functions']
                if isinstance(functions_config, list) and len(functions_config) > 0:
                    func_config = functions_config[0]
                    
                    # Check source directory
                    if func_config.get('source') == 'functions':
                        self.log_result("Firebase Functions Source", True)
                    else:
                        self.log_result("Firebase Functions Source", False, 
                                      {'error': 'Source should be "functions"'})
                        return False
                    
                    # Check runtime
                    if func_config.get('runtime') == 'python311':
                        self.log_result("Firebase Functions Runtime", True)
                    else:
                        self.log_result("Firebase Functions Runtime", False, 
                                      {'error': 'Runtime should be "python311"'})
                        return False
                    
                else:
                    self.log_result("Firebase Functions Config", False, 
                                  {'error': 'Functions configuration not found'})
                    return False
            else:
                self.log_result("Firebase Functions Config", False, 
                              {'error': 'Functions section not found in firebase.json'})
                return False
            
            # Check hosting configuration
            if 'hosting' in config:
                self.log_result("Firebase Hosting Config", True)
            else:
                self.log_result("Firebase Hosting Config", True, 
                              {'note': 'Hosting configuration not found (optional)'})
            
            return True
            
        except Exception as e:
            self.log_result("Firebase Configuration", False, {'error': str(e)})
            return False
    
    def validate_environment_setup(self) -> bool:
        """Validate environment setup"""
        print("\n🔍 Validating Environment Setup...")
        
        # Check if we're in the functions directory
        if os.path.basename(os.getcwd()) == 'functions':
            self.log_result("Working Directory", True, {'directory': 'functions'})
        else:
            self.log_result("Working Directory", False, 
                          {'error': 'Should be run from functions directory'})
            return False
        
        # Check Python version
        python_version = sys.version_info
        if python_version.major == 3 and python_version.minor >= 8:
            self.log_result("Python Version", True, 
                          {'version': f'{python_version.major}.{python_version.minor}.{python_version.micro}'})
        else:
            self.log_result("Python Version", False, 
                          {'error': f'Python 3.8+ required, found {python_version.major}.{python_version.minor}'})
            return False
        
        return True
    
    def generate_report(self) -> Dict[str, Any]:
        """Generate deployment readiness report"""
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
                'deployment_ready': failed_tests == 0
            },
            'results': self.results
        }
        
        return report

def main():
    """Main validation function"""
    print("🚀 Deployment Readiness Validation")
    print("=" * 50)
    
    validator = DeploymentValidator()
    
    # Run all validation tests
    env_valid = validator.validate_environment_setup()
    files_valid = validator.validate_file_structure()
    syntax_valid = validator.validate_python_syntax()
    imports_valid = validator.validate_imports()
    requirements_valid = validator.validate_requirements()
    firebase_valid = validator.validate_firebase_config()
    
    # Generate report
    report = validator.generate_report()
    
    print(f"\n📊 Deployment Readiness Summary:")
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Passed: {report['summary']['passed_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Success Rate: {report['summary']['success_rate']}%")
    
    # Save detailed report
    with open('deployment_readiness_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Detailed report saved to: deployment_readiness_report.json")
    
    if report['summary']['deployment_ready']:
        print("\n✅ Deployment readiness validation PASSED - Ready for deployment!")
        return 0
    else:
        print("\n❌ Deployment readiness validation FAILED - Issues need to be resolved")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
