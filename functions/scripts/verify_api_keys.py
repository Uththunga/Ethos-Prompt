#!/usr/bin/env python3
"""
API Key Verification Script
Task 1.1: Environment Setup & API Key Verification

This script verifies that all required API keys are configured correctly
and can successfully connect to their respective services.

Usage:
    python scripts/verify_api_keys.py
"""

import os
import sys
import json
import requests
from dotenv import load_dotenv
from typing import Dict, Tuple

# Load environment variables from .env file
load_dotenv()

# ANSI color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


def print_header(text: str):
    """Print a formatted header."""
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}{text.center(60)}{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}\n")


def print_success(text: str):
    """Print success message."""
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text: str):
    """Print error message."""
    print(f"{RED}✗ {text}{RESET}")


def print_warning(text: str):
    """Print warning message."""
    print(f"{YELLOW}⚠ {text}{RESET}")


def print_info(text: str):
    """Print info message."""
    print(f"{BLUE}ℹ {text}{RESET}")


def check_env_variable(var_name: str) -> Tuple[bool, str]:
    """Check if an environment variable is set."""
    value = os.getenv(var_name)
    if not value:
        return False, f"Environment variable {var_name} is not set"
    if value.startswith("your-") or value.endswith("-here"):
        return False, f"Environment variable {var_name} contains placeholder value"
    return True, value


def verify_openrouter_api() -> bool:
    """Verify OpenRouter API key by making a test request."""
    print_header("Verifying OpenRouter API")
    
    # Check if API key is set
    success, api_key = check_env_variable("OPENROUTER_API_KEY")
    if not success:
        print_error(api_key)
        print_info("Set OPENROUTER_API_KEY in functions/.env file")
        return False
    
    print_success(f"API key found: {api_key[:20]}...")
    
    # Test API connection with a simple request
    print_info("Testing API connection...")
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://react-app-000730.web.app",
        "X-Title": "Prompt Library Dashboard"
    }
    
    payload = {
        "model": "openai/gpt-3.5-turbo",
        "messages": [
            {"role": "user", "content": "Hello! This is a test message. Please respond with 'API connection successful'."}
        ],
        "max_tokens": 50
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            message = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            print_success(f"API connection successful!")
            print_info(f"Test response: {message[:100]}...")
            
            # Display usage information
            usage = data.get("usage", {})
            if usage:
                print_info(f"Tokens used - Prompt: {usage.get('prompt_tokens', 0)}, "
                          f"Completion: {usage.get('completion_tokens', 0)}, "
                          f"Total: {usage.get('total_tokens', 0)}")
            
            return True
        elif response.status_code == 401:
            print_error("Authentication failed - Invalid API key")
            print_info("Please check your OPENROUTER_API_KEY in .env file")
            return False
        elif response.status_code == 429:
            print_error("Rate limit exceeded")
            print_info("Your API key is valid but rate limited. This is acceptable for verification.")
            return True  # Key is valid, just rate limited
        else:
            print_error(f"API request failed with status code: {response.status_code}")
            print_info(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Request timed out after 30 seconds")
        print_info("Check your internet connection or try again later")
        return False
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {str(e)}")
        return False


def verify_google_embeddings_api() -> bool:
    """Verify Google Embeddings API key."""
    print_header("Verifying Google Embeddings API")
    
    # Check if API key is set
    success, api_key = check_env_variable("GOOGLE_EMBEDDINGS_API_KEY")
    if not success:
        print_error(api_key)
        print_info("Set GOOGLE_EMBEDDINGS_API_KEY in functions/.env file")
        return False
    
    print_success(f"API key found: {api_key[:20]}...")
    
    # Test API connection
    print_info("Testing API connection...")
    
    # Google Embeddings API endpoint
    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "models/text-embedding-004",
        "content": {
            "parts": [{
                "text": "This is a test message for embedding generation."
            }]
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            embedding = data.get("embedding", {}).get("values", [])
            print_success(f"API connection successful!")
            print_info(f"Generated embedding with {len(embedding)} dimensions")
            return True
        elif response.status_code == 400:
            print_error("Bad request - Check API configuration")
            print_info(f"Response: {response.text[:200]}")
            return False
        elif response.status_code == 403:
            print_error("Authentication failed - Invalid API key or API not enabled")
            print_info("Please check your GOOGLE_EMBEDDINGS_API_KEY and ensure the API is enabled in Google Cloud Console")
            return False
        else:
            print_error(f"API request failed with status code: {response.status_code}")
            print_info(f"Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print_error("Request timed out after 30 seconds")
        return False
    except requests.exceptions.RequestException as e:
        print_error(f"Request failed: {str(e)}")
        return False


def verify_firebase_config() -> bool:
    """Verify Firebase configuration."""
    print_header("Verifying Firebase Configuration")
    
    # Check Firebase project ID
    success, project_id = check_env_variable("FIREBASE_PROJECT_ID")
    if not success:
        print_error(project_id)
        print_info("Set FIREBASE_PROJECT_ID in functions/.env file")
        return False
    
    print_success(f"Firebase Project ID: {project_id}")
    
    # Check if firebase.json exists
    if os.path.exists("../firebase.json"):
        print_success("firebase.json found")
        
        # Read and validate firebase.json
        try:
            with open("../firebase.json", "r") as f:
                config = json.load(f)
                
            if "functions" in config:
                print_success("Functions configuration found in firebase.json")
                
                # Check region
                functions_config = config.get("functions", {})
                if isinstance(functions_config, list):
                    functions_config = functions_config[0] if functions_config else {}
                
                region = functions_config.get("region", "us-central1")
                print_info(f"Functions region: {region}")
                
                if region != "australia-southeast1":
                    print_warning(f"Functions region is {region}, but project uses australia-southeast1")
                    print_info("Consider updating firebase.json to match project region")
            else:
                print_warning("Functions configuration not found in firebase.json")
                
        except json.JSONDecodeError:
            print_error("firebase.json is not valid JSON")
            return False
        except Exception as e:
            print_error(f"Error reading firebase.json: {str(e)}")
            return False
    else:
        print_error("firebase.json not found in project root")
        return False
    
    return True


def check_dependencies() -> bool:
    """Check if required Python packages are installed."""
    print_header("Checking Python Dependencies")
    
    required_packages = [
        "requests",
        "python-dotenv",
        "firebase-admin",
        "firebase-functions"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace("-", "_"))
            print_success(f"{package} is installed")
        except ImportError:
            print_error(f"{package} is NOT installed")
            missing_packages.append(package)
    
    if missing_packages:
        print_warning(f"\nMissing packages: {', '.join(missing_packages)}")
        print_info("Install missing packages with: pip install " + " ".join(missing_packages))
        return False
    
    return True


def main():
    """Main verification function."""
    print_header("API Key Verification - Task 1.1")
    print_info("This script will verify all required API keys and configurations")
    
    results = {
        "Dependencies": check_dependencies(),
        "Firebase Config": verify_firebase_config(),
        "OpenRouter API": verify_openrouter_api(),
        "Google Embeddings API": verify_google_embeddings_api()
    }
    
    # Print summary
    print_header("Verification Summary")
    
    all_passed = True
    for check, passed in results.items():
        if passed:
            print_success(f"{check}: PASSED")
        else:
            print_error(f"{check}: FAILED")
            all_passed = False
    
    print("\n" + "=" * 60 + "\n")
    
    if all_passed:
        print_success("✓ All verifications passed! You're ready to proceed to Task 1.2")
        print_info("\nNext steps:")
        print_info("1. Mark Task 1.1 as COMPLETE in the task list")
        print_info("2. Start Task 1.2: Audit Current Execution Implementation")
        print_info("3. Review functions/main.py and functions/src/ai_service.py")
        return 0
    else:
        print_error("✗ Some verifications failed. Please fix the issues above before proceeding.")
        print_info("\nCommon fixes:")
        print_info("1. Ensure all API keys are set in functions/.env")
        print_info("2. Install missing Python packages: pip install -r requirements.txt")
        print_info("3. Check that API keys are valid and not placeholder values")
        return 1


if __name__ == "__main__":
    sys.exit(main())

