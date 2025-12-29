#!/usr/bin/env bash
# Simple deployment script using npx firebase

set -e

PROJECT_ID="rag-prompt-library-staging"

echo "========================================="
echo "Deploying All Fixes to Staging"
echo "========================================="
echo ""

# Step 1: Deploy Backend
echo "Step 1/2: Deploying Backend (Cloud Functions)..."
echo ""
npx firebase deploy --only functions --project $PROJECT_ID

echo ""
echo "✅ Backend deployed successfully"
echo ""

# Step 2: Build and Deploy Frontend
echo "Step 2/2: Building and Deploying Frontend..."
echo ""

cd frontend
echo "Installing dependencies..."
npm ci

echo ""
echo "Building for staging..."
npm run build:staging

cd ..

echo ""
echo "Deploying to Firebase Hosting..."
npx firebase deploy --only hosting --project $PROJECT_ID

echo ""
echo "✅ Frontend deployed successfully"
echo ""

echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Navigate to: https://$PROJECT_ID.web.app"
echo "2. LOG IN (required!)"
echo "3. Test prompt execution"
echo ""

