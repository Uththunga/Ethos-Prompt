#!/bin/bash

# Deploy Functions to Staging Environment
# This script deploys the updated Cloud Functions with all CRUD operations

set -e  # Exit on error

echo "🚀 Deploying Cloud Functions to Staging Environment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found. Please install it first:${NC}"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Firebase. Please login first:${NC}"
    echo "firebase login"
    exit 1
fi

# Switch to staging project
echo -e "${YELLOW}📋 Switching to staging project...${NC}"
firebase use staging

# Verify project
CURRENT_PROJECT=$(firebase use | grep "Now using" | awk '{print $4}' || echo "unknown")
echo -e "${GREEN}✅ Current project: $CURRENT_PROJECT${NC}"
echo ""

# List functions that will be deployed
echo -e "${YELLOW}📦 Functions to be deployed:${NC}"
echo "  - create_prompt (CRUD)"
echo "  - get_prompt (CRUD) ⭐ NEW"
echo "  - update_prompt (CRUD) ⭐ NEW"
echo "  - delete_prompt (CRUD) ⭐ NEW"
echo "  - list_prompts (CRUD) ⭐ NEW"
echo "  - search_prompts (CRUD) ⭐ NEW"
echo "  - get_prompt_versions (CRUD) ⭐ NEW"
echo "  - restore_prompt_version (CRUD) ⭐ NEW"
echo "  - generate_prompt (AI)"
echo "  - execute_multi_model_prompt (AI)"
echo "  - api (Main API)"
echo "  - httpApi (HTTP API)"
echo ""

# Confirm deployment
read -p "🤔 Deploy to staging? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Deployment cancelled${NC}"
    exit 0
fi

# Deploy functions
echo ""
echo -e "${YELLOW}🚀 Deploying functions...${NC}"
firebase deploy --only functions

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "  1. Verify functions in Firebase Console:"
    echo "     https://console.firebase.google.com/project/rag-prompt-library-staging/functions"
    echo ""
    echo "  2. Test the application:"
    echo "     https://rag-prompt-library-staging.web.app/dashboard/prompts"
    echo ""
    echo "  3. Test CRUD operations:"
    echo "     - Create a new prompt ✅"
    echo "     - View prompt details ✅ (should work now!)"
    echo "     - Edit the prompt ✅"
    echo "     - Delete the prompt ✅"
    echo "     - Search prompts ✅"
    echo ""
    echo -e "${GREEN}🎉 All done!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Check the error messages above for details."
    exit 1
fi

