#!/bin/bash

# Fix Firebase Storage CORS Configuration
# This script applies CORS settings to Firebase Storage bucket

set -e

echo "🔧 Fixing Firebase Storage CORS Configuration..."

# Check if gsutil is installed
if ! command -v gsutil &> /dev/null; then
    echo "❌ Error: gsutil is not installed or not in PATH"
    echo "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Error: Firebase CLI is not installed"
    echo "Please install Firebase CLI: npm install -g firebase-tools"
    exit 1
fi

# Get the current Firebase project
PROJECT_ID=$(firebase use --json | jq -r '.result.project // empty')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No Firebase project selected"
    echo "Please run: firebase use <project-id>"
    exit 1
fi

echo "📋 Current Firebase project: $PROJECT_ID"

# Construct the bucket name
BUCKET_NAME="${PROJECT_ID}.appspot.com"

echo "🪣 Storage bucket: gs://$BUCKET_NAME"

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
    echo "❌ Error: cors.json file not found in current directory"
    exit 1
fi

echo "📄 Found cors.json configuration file"

# Validate cors.json format
if ! jq empty cors.json 2>/dev/null; then
    echo "❌ Error: cors.json is not valid JSON"
    exit 1
fi

echo "✅ cors.json is valid JSON"

# Apply CORS configuration to the bucket
echo "🚀 Applying CORS configuration to Firebase Storage bucket..."

if gsutil cors set cors.json gs://$BUCKET_NAME; then
    echo "✅ CORS configuration applied successfully!"
else
    echo "❌ Failed to apply CORS configuration"
    echo "Please ensure you have the necessary permissions for the bucket"
    exit 1
fi

# Verify the CORS configuration
echo "🔍 Verifying CORS configuration..."
echo "Current CORS settings for gs://$BUCKET_NAME:"
gsutil cors get gs://$BUCKET_NAME

echo ""
echo "🎉 Firebase Storage CORS configuration has been fixed!"
echo ""
echo "📝 What was done:"
echo "   • Updated cors.json with comprehensive origin and header support"
echo "   • Applied CORS configuration to Firebase Storage bucket: gs://$BUCKET_NAME"
echo "   • Added support for localhost development environments"
echo "   • Included all necessary HTTP methods and headers"
echo ""
echo "🔄 You may need to:"
echo "   • Clear your browser cache"
echo "   • Wait a few minutes for the changes to propagate"
echo "   • Redeploy your application if needed"
echo ""
echo "✨ PDF uploads should now work without CORS errors!"
