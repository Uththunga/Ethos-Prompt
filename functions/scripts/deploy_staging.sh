#!/bin/bash
# Deploy to Firebase Staging Environment
# Task 1.11: Deploy to Staging & Validate

set -e  # Exit on error

echo "🚀 Starting deployment to staging..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
echo "📋 Checking Firebase authentication..."
firebase login:list || {
    echo "❌ Not logged in to Firebase. Please run:"
    echo "   firebase login"
    exit 1
}

# Check current project
echo "📋 Current Firebase project:"
firebase use

echo ""
read -p "Is this the correct project? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the correct project with: firebase use <project-id>"
    exit 1
fi

# Run tests before deploying
echo ""
echo "🧪 Running tests before deployment..."
cd "$(dirname "$0")/.."
python -m pytest tests/test_error_handling.py tests/test_cost_tracker.py -v --tb=short || {
    echo "❌ Tests failed. Fix tests before deploying."
    exit 1
}

echo ""
echo "✅ Tests passed!"

# Build frontend (if needed)
echo ""
echo "🔨 Building frontend..."
cd ../frontend
npm run build || {
    echo "❌ Frontend build failed."
    exit 1
}

echo ""
echo "✅ Frontend built successfully!"

# Deploy to Firebase
echo ""
echo "🚀 Deploying to Firebase..."
cd ..
firebase deploy --only hosting,functions || {
    echo "❌ Deployment failed."
    exit 1
}

echo ""
echo "✅ Deployment successful!"

# Get deployment URL
echo ""
echo "📍 Deployment URLs:"
firebase hosting:channel:list

echo ""
echo "🎉 Staging deployment complete!"
echo ""
echo "Next steps:"
echo "1. Test the staging environment"
echo "2. Run end-to-end tests"
echo "3. Monitor logs: firebase functions:log"
echo "4. Check for errors in Firebase Console"

