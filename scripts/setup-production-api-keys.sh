#!/bin/bash
# Production API Key Setup Script
# This script configures production API keys for the RAG application

set -e  # Exit on any error

echo "🔑 Setting up Production API Keys for RAG Application"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Validate environment variables
print_info "Validating environment variables..."

if [ -z "$GOOGLE_API_KEY" ]; then
    print_warning "GOOGLE_API_KEY not set. This is required for Google embeddings."
    read -p "Enter your Google API Key: " GOOGLE_API_KEY
    if [ -z "$GOOGLE_API_KEY" ]; then
        print_error "Google API Key is required"
        exit 1
    fi
fi

if [ -z "$OPENROUTER_API_KEY" ]; then
    print_warning "OPENROUTER_API_KEY not set. This is required for fallback."
    read -p "Enter your OpenRouter API Key: " OPENROUTER_API_KEY
    if [ -z "$OPENROUTER_API_KEY" ]; then
        print_error "OpenRouter API Key is required"
        exit 1
    fi
fi

# Optional: OpenAI API Key for additional fallback
if [ -z "$OPENAI_API_KEY" ]; then
    print_warning "OPENAI_API_KEY not set (optional for additional fallback)"
    read -p "Enter your OpenAI API Key (optional, press Enter to skip): " OPENAI_API_KEY
fi

# Set production site URL
if [ -z "$PRODUCTION_SITE_URL" ]; then
    PRODUCTION_SITE_URL="https://your-app.web.app"
    print_warning "Using default production URL: $PRODUCTION_SITE_URL"
    read -p "Enter your production site URL (or press Enter for default): " USER_URL
    if [ ! -z "$USER_URL" ]; then
        PRODUCTION_SITE_URL="$USER_URL"
    fi
fi

print_info "Configuring Firebase Functions environment variables..."

# Configure Google API Key
firebase functions:config:set google.api_key="$GOOGLE_API_KEY"
print_status "Google API key configured"

# Configure OpenRouter API Key
firebase functions:config:set openrouter.api_key="$OPENROUTER_API_KEY"
firebase functions:config:set openrouter.site_url="$PRODUCTION_SITE_URL"
firebase functions:config:set openrouter.app_name="RAG-Production"
print_status "OpenRouter API configuration completed"

# Configure OpenAI API Key if provided
if [ ! -z "$OPENAI_API_KEY" ]; then
    firebase functions:config:set openai.api_key="$OPENAI_API_KEY"
    print_status "OpenAI API key configured"
fi

# Set production environment flag
firebase functions:config:set environment.mode="production"
firebase functions:config:set environment.debug="false"
print_status "Production environment flags set"

# Verify configuration
print_info "Verifying configuration..."
firebase functions:config:get

print_status "Production API keys configuration completed successfully!"

# Test API connectivity
print_info "Testing API connectivity..."

cd functions

# Test Google API
if python3 -c "
import os
import sys
sys.path.append('src')
try:
    from rag.embedding_service import EmbeddingService
    service = EmbeddingService()
    result = service.test_google_api()
    print('✅ Google API connectivity: OK')
except Exception as e:
    print(f'❌ Google API connectivity: {e}')
    sys.exit(1)
" 2>/dev/null; then
    print_status "Google API connectivity test passed"
else
    print_warning "Google API connectivity test failed - will test after deployment"
fi

# Test OpenRouter API
if python3 -c "
import os
import sys
sys.path.append('src')
try:
    from rag.embedding_service import EmbeddingService
    service = EmbeddingService()
    result = service.test_openrouter_api()
    print('✅ OpenRouter API connectivity: OK')
except Exception as e:
    print(f'❌ OpenRouter API connectivity: {e}')
    sys.exit(1)
" 2>/dev/null; then
    print_status "OpenRouter API connectivity test passed"
else
    print_warning "OpenRouter API connectivity test failed - will test after deployment"
fi

cd ..

echo ""
print_status "🎉 Production API key setup completed successfully!"
echo ""
print_info "Next steps:"
echo "1. Deploy functions to production: firebase deploy --only functions"
echo "2. Test production endpoints"
echo "3. Verify health checks"
echo ""
print_warning "Security reminder:"
echo "- API keys are stored securely in Firebase Functions config"
echo "- Never commit API keys to version control"
echo "- Monitor API usage and set up billing alerts"
echo ""
