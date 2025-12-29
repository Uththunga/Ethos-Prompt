#!/bin/bash
# Setup IBM Granite API Keys in Google Cloud Secret Manager
# Run this script to securely store watsonx.ai credentials

set -e  # Exit on error

echo "🔐 Setting up IBM Granite API keys in Google Cloud Secret Manager"
echo "=================================================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Get current project
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No active project. Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "📋 Project: $PROJECT_ID"
echo ""

# Prompt for credentials
echo "Please enter your IBM watsonx.ai credentials:"
echo ""
read -sp "IBM Cloud API Key: " WATSONX_API_KEY
echo ""
read -p "watsonx.ai Project ID: " WATSONX_PROJECT_ID
echo ""

if [ -z "$WATSONX_API_KEY" ] || [ -z "$WATSONX_PROJECT_ID" ]; then
    echo "❌ Both credentials are required!"
    exit 1
fi

echo ""
echo "🔧 Step 1: Enabling Secret Manager API..."
gcloud services enable secretmanager.googleapis.com

echo "✅ Secret Manager API enabled"
echo ""

echo "🔧 Step 2: Creating secrets..."

# Create or update watsonx-api-key secret
if gcloud secrets describe watsonx-api-key &>/dev/null; then
    echo "  Updating existing watsonx-api-key secret..."
    echo -n "$WATSONX_API_KEY" | gcloud secrets versions add watsonx-api-key --data-file=-
else
    echo "  Creating watsonx-api-key secret..."
    echo -n "$WATSONX_API_KEY" | gcloud secrets create watsonx-api-key \
        --data-file=- \
        --replication-policy="automatic"
fi

# Create or update watsonx-project-id secret
if gcloud secrets describe watsonx-project-id &>/dev/null; then
    echo "  Updating existing watsonx-project-id secret..."
    echo -n "$WATSONX_PROJECT_ID" | gcloud secrets versions add watsonx-project-id --data-file=-
else
    echo "  Creating watsonx-project-id secret..."
    echo -n "$WATSONX_PROJECT_ID" | gcloud secrets create watsonx-project-id \
        --data-file=- \
        --replication-policy="automatic"
fi

echo "✅ Secrets created"
echo ""

echo "🔧 Step 3: Granting access to service account..."

# Get project number
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# Cloud Run service account
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to watsonx-api-key
gcloud secrets add-iam-policy-binding watsonx-api-key \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

# Grant access to watsonx-project-id
gcloud secrets add-iam-policy-binding watsonx-project-id \
    --member="serviceAccount:${CLOUD_RUN_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet

echo "✅ Permissions granted to: $CLOUD_RUN_SA"
echo ""

echo "🔧 Step 4: Updating Cloud Run service..."

# Prompt for service name and region
read -p "Cloud Run service name [marketing-api]: " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-marketing-api}

read -p "Cloud Run region [us-central1]: " REGION
REGION=${REGION:-us-central1}

# Update Cloud Run service
if gcloud run services describe $SERVICE_NAME --region=$REGION &>/dev/null; then
    echo "  Updating $SERVICE_NAME in $REGION..."

    gcloud run services update $SERVICE_NAME \
        --update-secrets=WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest \
        --set-env-vars="USE_GRANITE_LLM=true" \
        --region=$REGION \
        --quiet

    echo "✅ Cloud Run service updated"
else
    echo "⚠️  Service $SERVICE_NAME not found in $REGION"
    echo "   You'll need to deploy your service first, then run:"
    echo ""
    echo "   gcloud run services update $SERVICE_NAME \\"
    echo "     --update-secrets=WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest \\"
    echo "     --set-env-vars=\"USE_GRANITE_LLM=true\" \\"
    echo "     --region=$REGION"
fi

echo ""
echo "=================================================================="
echo "🎉 Setup Complete!"
echo "=================================================================="
echo ""
echo "Secrets created:"
echo "  ✅ watsonx-api-key"
echo "  ✅ watsonx-project-id"
echo ""
echo "Next steps:"
echo "  1. Deploy your Cloud Run service (if not already deployed)"
echo "  2. Test the marketing chat"
echo "  3. Check logs: gcloud logging read 'textPayload=~\"Granite\"' --limit=10"
echo ""
echo "To view secrets:"
echo "  gcloud secrets list"
echo ""
echo "To update a secret:"
echo "  echo -n 'NEW_VALUE' | gcloud secrets versions add watsonx-api-key --data-file=-"
echo ""
