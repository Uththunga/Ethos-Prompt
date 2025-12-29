#!/bin/bash

# Deploy Fixed Firebase Functions Script
# This script ensures the proper deployment of the real LLM integration

echo "🚀 Deploying Fixed Firebase Functions with Real LLM Integration"
echo "=============================================================="

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo "❌ Error: functions directory not found."
    exit 1
fi

# Navigate to functions directory
cd functions

echo "📦 Installing dependencies..."
npm install

# Check if OpenAI package is installed
if ! npm list openai > /dev/null 2>&1; then
    echo "📦 Installing OpenAI package..."
    npm install openai@^4.20.1
fi

# Set environment variables for Firebase Functions
echo "🔧 Setting up environment variables..."

# Check if OPENROUTER_API_KEY is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "⚠️  Warning: OPENROUTER_API_KEY environment variable not set."
    echo "   Using default API key from code. For production, set your own API key:"
    echo "   firebase functions:config:set openrouter.api_key=\"your-api-key-here\""
else
    echo "✅ OPENROUTER_API_KEY found in environment"
    firebase functions:config:set openrouter.api_key="$OPENROUTER_API_KEY"
fi

# Navigate back to project root
cd ..

echo "🚀 Deploying functions to Firebase..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo ""
    echo "🎉 Fixed Issues:"
    echo "   ✅ Replaced mock responses with real OpenRouter LLM integration"
    echo "   ✅ Added proper token counting and cost calculation"
    echo "   ✅ Implemented error handling and response validation"
    echo "   ✅ Added support for multiple free models"
    echo ""
    echo "🔧 Next Steps:"
    echo "   1. Test the execute_prompt endpoint"
    echo "   2. Verify token counts are now > 0"
    echo "   3. Check that real responses are generated"
    echo "   4. Monitor execution logs for any issues"
    echo ""
    echo "🧪 Test Command:"
    echo "   Use the frontend to execute a prompt, or test via Firebase console"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
