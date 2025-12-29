#!/bin/bash

# Deploy the new upload function to Firebase
# This script deploys only the upload_document_via_function to avoid CORS issues

set -e

echo "🚀 Deploying Firebase Function for Document Upload..."

# Check if Firebase CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npm/npx is not installed"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo "❌ Error: firebase.json not found. Please run this script from the project root."
    exit 1
fi

# Check if functions directory exists
if [ ! -d "functions" ]; then
    echo "❌ Error: functions directory not found"
    exit 1
fi

echo "📋 Current Firebase project:"
npx firebase use

echo "🔧 Installing function dependencies..."
cd functions
pip install -r requirements.txt
cd ..

echo "🚀 Deploying upload function..."
npx firebase deploy --only functions:upload_document_via_function

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Test the new upload function in your application"
    echo "   2. Update your frontend to use DocumentUploadFunction component"
    echo "   3. Monitor function logs for any issues"
    echo ""
    echo "🔍 To view function logs:"
    echo "   npx firebase functions:log --only upload_document_via_function"
    echo ""
    echo "✨ The new upload method should bypass CORS issues!"
else
    echo "❌ Function deployment failed"
    exit 1
fi
