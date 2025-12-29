#!/usr/bin/env python3
"""
Deployment script for Execute Button Fix
Helps verify the deployment is ready and provides deployment commands
"""

import os
import json
import subprocess
from datetime import datetime

def check_file_exists(filepath, description):
    """Check if a required file exists"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} - NOT FOUND")
        return False

def check_function_in_file(filepath, function_name):
    """Check if a function exists in a Python file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            if f"def {function_name}(" in content:
                print(f"✅ Function '{function_name}' found in {filepath}")
                return True
            else:
                print(f"❌ Function '{function_name}' NOT found in {filepath}")
                return False
    except Exception as e:
        print(f"❌ Error checking {filepath}: {e}")
        return False

def check_firebase_cli():
    """Check if Firebase CLI is installed"""
    try:
        result = subprocess.run(['firebase', '--version'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print(f"✅ Firebase CLI installed: {result.stdout.strip()}")
            return True
        else:
            print("❌ Firebase CLI not working properly")
            return False
    except subprocess.TimeoutExpired:
        print("❌ Firebase CLI command timed out")
        return False
    except FileNotFoundError:
        print("❌ Firebase CLI not installed")
        print("   Install with: npm install -g firebase-tools")
        return False
    except Exception as e:
        print(f"❌ Error checking Firebase CLI: {e}")
        return False

def check_firebase_project():
    """Check if Firebase project is configured"""
    try:
        if os.path.exists('.firebaserc'):
            with open('.firebaserc', 'r') as f:
                config = json.load(f)
                project = config.get('projects', {}).get('default')
                if project:
                    print(f"✅ Firebase project configured: {project}")
                    return True
        print("❌ Firebase project not configured")
        print("   Run: firebase use --add")
        return False
    except Exception as e:
        print(f"❌ Error checking Firebase project: {e}")
        return False

def main():
    print("🚀 Execute Button Fix - Deployment Readiness Check")
    print("=" * 60)
    print(f"📅 Check started at: {datetime.now().isoformat()}")
    print()
    
    # Change to functions directory
    if os.path.exists('functions'):
        os.chdir('functions')
        print("📁 Changed to functions directory")
    else:
        print("❌ Functions directory not found")
        return False
    
    checks_passed = 0
    total_checks = 0
    
    print("\n🔍 Checking Required Files...")
    print("-" * 40)
    
    # Check main.py exists
    total_checks += 1
    if check_file_exists('main.py', 'Main functions file'):
        checks_passed += 1
    
    # Check requirements.txt exists
    total_checks += 1
    if check_file_exists('requirements.txt', 'Requirements file'):
        checks_passed += 1
    
    print("\n🔍 Checking Function Implementation...")
    print("-" * 40)
    
    # Check if api function exists
    total_checks += 1
    if check_function_in_file('main.py', 'api'):
        checks_passed += 1
    
    # Check if execute_prompt function exists
    total_checks += 1
    if check_function_in_file('main.py', 'execute_prompt'):
        checks_passed += 1
    
    print("\n🔍 Checking Deployment Tools...")
    print("-" * 40)
    
    # Check Firebase CLI
    total_checks += 1
    if check_firebase_cli():
        checks_passed += 1
    
    # Go back to root directory for Firebase project check
    os.chdir('..')
    
    # Check Firebase project configuration
    total_checks += 1
    if check_firebase_project():
        checks_passed += 1
    
    print("\n" + "=" * 60)
    print("📊 DEPLOYMENT READINESS SUMMARY")
    print("=" * 60)
    
    print(f"✅ Checks passed: {checks_passed}/{total_checks}")
    
    if checks_passed == total_checks:
        print("\n🎉 ALL CHECKS PASSED! Ready for deployment.")
        print("\n📋 Deployment Commands:")
        print("-" * 30)
        print("1. Deploy Firebase Functions:")
        print("   firebase deploy --only functions")
        print()
        print("2. Or deploy specific function:")
        print("   firebase deploy --only functions:api")
        print()
        print("3. Check deployment status:")
        print("   firebase functions:log")
        print()
        print("4. Test the fix:")
        print("   Open: frontend/execute-button-test.html")
        print("   Or test in your app's Execute button")
        
    else:
        print(f"\n⚠️  {total_checks - checks_passed} checks failed. Fix issues before deploying.")
        print("\n🔧 Common fixes:")
        if not check_file_exists('functions/main.py', ''):
            print("   - Ensure main.py exists in functions directory")
        print("   - Install Firebase CLI: npm install -g firebase-tools")
        print("   - Configure project: firebase use --add")
        print("   - Login to Firebase: firebase login")
    
    print(f"\n📅 Check completed at: {datetime.now().isoformat()}")
    return checks_passed == total_checks

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)