#!/bin/bash

# OpenRouter API Configuration Script for Firebase Functions
# RAG Prompt Library - Automated Setup

set -e

echo "🚀 Configuring OpenRouter API for Firebase Functions..."
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Keys (these should be set as environment variables for security)
OPENROUTER_API_KEY_PROMPT="REDACTED_API_KEY"
OPENROUTER_API_KEY_RAG="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"

# Models
PROMPT_MODEL="nvidia/llama-3.1-nemotron-ultra-253b-v1:free"
RAG_MODEL="nvidia/llama-3.1-nemotron-ultra-253b-v1:free"

echo -e "${BLUE}📋 Configuration Summary:${NC}"
echo "  • Prompt Generation API Key: ${OPENROUTER_API_KEY_PROMPT:0:20}..."
echo "  • RAG Processing API Key: ${OPENROUTER_API_KEY_RAG:0:20}..."
echo "  • Prompt Model: $PROMPT_MODEL"
echo "  • RAG Model: $RAG_MODEL"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Please install it first:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Firebase. Please login first:${NC}"
    echo "firebase login"
    exit 1
fi

# Set Firebase project
echo -e "${BLUE}🔧 Setting Firebase project...${NC}"
firebase use rag-prompt-library

# Configure Firebase Functions environment variables
echo -e "${BLUE}🔑 Setting Firebase Functions environment variables...${NC}"

firebase functions:config:set \
  openrouter.api_key="$OPENROUTER_API_KEY_PROMPT" \
  openrouter.api_key_rag="$OPENROUTER_API_KEY_RAG" \
  openrouter.prompt_model="$PROMPT_MODEL" \
  openrouter.rag_model="$RAG_MODEL"

echo -e "${GREEN}✅ Environment variables configured successfully!${NC}"

# Display current configuration
echo -e "${BLUE}📊 Current Firebase Functions configuration:${NC}"
firebase functions:config:get

# Create local .env file for development
echo -e "${BLUE}📝 Creating local .env file for development...${NC}"
cat > functions/.env << EOF
# OpenRouter API Configuration for Local Development
# Generated on $(date)

OPENROUTER_API_KEY=$OPENROUTER_API_KEY_PROMPT
OPENROUTER_API_KEY_RAG=$OPENROUTER_API_KEY_RAG
PROMPT_GENERATION_MODEL=$PROMPT_MODEL
RAG_PROCESSING_MODEL=$RAG_MODEL
PYTHON_ENV=development

# Firebase Admin SDK will use default credentials in local development
# Make sure to set GOOGLE_APPLICATION_CREDENTIALS if needed
EOF

echo -e "${GREEN}✅ Local .env file created at functions/.env${NC}"

# Install Python dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
cd functions
pip install -r requirements.txt
cd ..

echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"

# Test configuration
echo -e "${BLUE}🧪 Testing configuration...${NC}"

# Create a simple test script
cat > functions/test_config.py << 'EOF'
import os
import sys

def test_config():
    """Test OpenRouter API configuration"""
    print("🧪 Testing OpenRouter API Configuration...")
    
    # Check environment variables
    api_key = os.environ.get('OPENROUTER_API_KEY')
    api_key_rag = os.environ.get('OPENROUTER_API_KEY_RAG')
    
    if api_key:
        print(f"✅ OPENROUTER_API_KEY: {api_key[:20]}...")
    else:
        print("❌ OPENROUTER_API_KEY not found")
        return False
    
    if api_key_rag:
        print(f"✅ OPENROUTER_API_KEY_RAG: {api_key_rag[:20]}...")
    else:
        print("❌ OPENROUTER_API_KEY_RAG not found")
        return False
    
    # Test API connection
    try:
        import requests
        
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://rag-prompt-library.web.app',
            'X-Title': 'RAG Prompt Library'
        }
        
        # Test with a simple request
        response = requests.get(
            'https://openrouter.ai/api/v1/models',
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ OpenRouter API connection successful")
            models = response.json()
            
            # Check if our models are available
            model_ids = [model['id'] for model in models.get('data', [])]
            
            prompt_model = "nvidia/llama-3.1-nemotron-ultra-253b-v1:free"
            if prompt_model in model_ids:
                print(f"✅ Model available: {prompt_model}")
            else:
                print(f"⚠️  Model not found: {prompt_model}")
            
            return True
        else:
            print(f"❌ API connection failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {str(e)}")
        return False

if __name__ == "__main__":
    # Load environment variables from .env file
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("⚠️  python-dotenv not installed, using system environment variables")
    
    success = test_config()
    sys.exit(0 if success else 1)
EOF

# Run the test
echo -e "${BLUE}🔍 Running configuration test...${NC}"
cd functions
python test_config.py
cd ..

# Clean up test file
rm functions/test_config.py

echo ""
echo -e "${GREEN}🎉 OpenRouter API configuration completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Deploy functions: firebase deploy --only functions"
echo "2. Test prompt generation in Firebase Console"
echo "3. Upload a document to test RAG functionality"
echo "4. Monitor usage in OpenRouter dashboard"
echo ""
echo -e "${YELLOW}⚠️  Security Reminder:${NC}"
echo "• Never commit API keys to version control"
echo "• Add functions/.env to .gitignore"
echo "• Monitor API usage and costs regularly"
echo "• Rotate API keys every 90 days"
echo ""
echo -e "${GREEN}✅ Configuration complete! Your RAG Prompt Library is ready to use NVIDIA Llama 3.1 Nemotron Ultra 253B! 🚀${NC}"
