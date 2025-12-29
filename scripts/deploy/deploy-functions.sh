#!/bin/bash

# Deploy Firebase Functions with AI Integration
# This script deploys the updated Firebase Functions to australia-southeast1 region

echo "🚀 Deploying Firebase Functions with AI Integration..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

echo "📋 Current Firebase project:"
firebase use

echo ""
echo "🔧 Installing Python dependencies..."
cd functions
pip install -r requirements.txt

echo ""
echo "🔍 Checking Python syntax..."
python -m py_compile main.py
if [ $? -ne 0 ]; then
    echo "❌ Python syntax errors found. Please fix them before deploying."
    exit 1
fi

echo ""
echo "✅ Python syntax check passed!"

cd ..

echo ""
echo "🌏 Deploying to australia-southeast1 region..."
echo "This may take several minutes..."

# Verify region configuration before deployment
echo "🔍 Verifying Australia region configuration..."
if grep -q "australia-southeast1" functions/main.py; then
    echo "✅ Functions configured for australia-southeast1"
else
    echo "❌ Functions not configured for Australia region"
    exit 1
fi

# Deploy only functions (not hosting) to Australia region
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firebase Functions deployed successfully!"
    echo ""
    echo "📋 Deployed functions:"
    echo "• execute_prompt - Main prompt execution with AI integration"
    echo "• test_openrouter_connection - Test OpenRouter API connection"
    echo "• execute_prompt_http - HTTP endpoint for CORS bypass"
    echo "• validate_template - Template validation"
    echo "• get_usage_stats - User usage statistics"
    echo "• get_system_status - System health status"
    echo "• test_provider - Test AI provider connections"
    echo "• ai_chat - AI chat functionality"
    echo "• rag_chat - RAG-enabled chat"
    echo "• upload_document - Document upload for RAG"
    echo "• search_documents - Document search"
    echo ""
    echo "🔗 Functions are available at:"
    echo "https://australia-southeast1-[PROJECT-ID].cloudfunctions.net/"
    echo ""
    echo "🧪 Next steps:"
    echo "1. Test the AI integration using the frontend"
    echo "2. Check function logs: firebase functions:log"
    echo "3. Monitor function performance in Firebase Console"
else
    echo ""
    echo "❌ Deployment failed! Check the error messages above."
    echo ""
    echo "🔧 Troubleshooting tips:"
    echo "1. Check your Firebase project permissions"
    echo "2. Verify Python dependencies are correctly installed"
    echo "3. Check function syntax and imports"
    echo "4. Review Firebase Functions quotas and limits"
    exit 1
fi
