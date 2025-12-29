#!/bin/bash

# Setup Secret Manager for Staging Environment
# Project: rag-prompt-library-staging
# Purpose: Configure OPENROUTER_API_KEY secret for Cloud Functions

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="rag-prompt-library-staging"
PROJECT_NUMBER="857724136585"
SECRET_NAME="OPENROUTER_API_KEY"

echo -e "${CYAN}========================================"
echo -e "Secret Manager Setup for Staging"
echo -e "========================================${NC}"
echo ""

# Step 1: Authenticate
echo -e "${YELLOW}Step 1: Authenticating with Google Cloud...${NC}"
echo -e "${GRAY}This will open a browser window for authentication.${NC}"
echo ""
gcloud auth login

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Authentication failed. Please try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

# Step 2: Set project
echo -e "${YELLOW}Step 2: Setting active project to $PROJECT_ID...${NC}"
gcloud config set project $PROJECT_ID

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to set project. Please check project ID.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Project set successfully${NC}"
echo ""

# Step 3: Enable Secret Manager API
echo -e "${YELLOW}Step 3: Enabling Secret Manager API...${NC}"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Failed to enable API. It may already be enabled.${NC}"
else
    echo -e "${GREEN}✅ Secret Manager API enabled${NC}"
fi
echo ""

# Step 4: Check if secret already exists
echo -e "${YELLOW}Step 4: Checking if secret already exists...${NC}"
EXISTING_SECRET=$(gcloud secrets list --project=$PROJECT_ID --filter="name:$SECRET_NAME" --format="value(name)" 2>/dev/null || echo "")

if [ ! -z "$EXISTING_SECRET" ]; then
    echo -e "${YELLOW}⚠️  Secret '$SECRET_NAME' already exists!${NC}"
    echo ""
    read -p "Do you want to add a new version? (y/n): " response
    
    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo ""
        echo -e "${CYAN}Please enter your OpenRouter API key (it will be hidden):${NC}"
        read -s API_KEY
        echo ""
        
        # Validate key format
        if [[ ! $API_KEY =~ ^sk-or-v1- ]]; then
            echo -e "${RED}❌ Invalid API key format. OpenRouter keys should start with 'sk-or-v1-'${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}Adding new version to existing secret...${NC}"
        echo -n "$API_KEY" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Failed to add new secret version${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✅ New secret version added successfully${NC}"
    else
        echo -e "${GRAY}Skipping secret creation. Using existing secret.${NC}"
    fi
else
    # Step 5: Create new secret
    echo -e "${YELLOW}Secret does not exist. Creating new secret...${NC}"
    echo ""
    echo -e "${CYAN}Please enter your OpenRouter API key (it will be hidden):${NC}"
    echo -e "${GRAY}Format: sk-or-v1-...${NC}"
    read -s API_KEY
    echo ""
    
    # Validate key format
    if [[ ! $API_KEY =~ ^sk-or-v1- ]]; then
        echo -e "${RED}❌ Invalid API key format. OpenRouter keys should start with 'sk-or-v1-'${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Creating secret '$SECRET_NAME'...${NC}"
    echo -n "$API_KEY" | gcloud secrets create $SECRET_NAME --data-file=- --replication-policy="automatic" --project=$PROJECT_ID
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to create secret${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Secret created successfully${NC}"
fi

echo ""

# Step 6: Grant access to service account
echo -e "${YELLOW}Step 5: Granting access to Cloud Functions service account...${NC}"
SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
echo -e "${GRAY}Service Account: $SERVICE_ACCOUNT${NC}"

gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Failed to grant access. The binding may already exist.${NC}"
else
    echo -e "${GREEN}✅ Service account access granted${NC}"
fi

echo ""

# Step 7: Verify configuration
echo -e "${YELLOW}Step 6: Verifying configuration...${NC}"
echo ""

echo -e "${GRAY}Listing secrets:${NC}"
gcloud secrets list --project=$PROJECT_ID

echo ""
echo -e "${GRAY}Checking IAM policy:${NC}"
gcloud secrets get-iam-policy $SECRET_NAME --project=$PROJECT_ID

echo ""
echo -e "${CYAN}========================================"
echo -e "✅ Secret Manager Setup Complete!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}Summary:${NC}"
echo -e "  ${NC}• Project: $PROJECT_ID"
echo -e "  ${NC}• Secret: $SECRET_NAME"
echo -e "  ${NC}• Service Account: $SERVICE_ACCOUNT"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "  ${NC}1. Deploy Firestore rules and indexes"
echo -e "  ${NC}2. Deploy Cloud Functions (will automatically use this secret)"
echo -e "  ${NC}3. Deploy frontend to hosting"
echo -e "  ${NC}4. Run smoke tests"
echo ""
echo -e "${YELLOW}To verify the secret value (be careful - this will display it):${NC}"
echo -e "${GRAY}  gcloud secrets versions access latest --secret='$SECRET_NAME' --project=$PROJECT_ID${NC}"
echo ""

