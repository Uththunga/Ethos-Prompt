# Setup IBM Granite API Keys in Google Cloud Secret Manager
# PowerShell script for Windows users

Write-Host "🔐 Setting up IBM Granite API keys in Google Cloud Secret Manager" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ gcloud CLI not found. Please install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Get current project
$PROJECT_ID = gcloud config get-value project 2>$null
if ([string]::IsNullOrEmpty($PROJECT_ID)) {
    Write-Host "❌ No active project. Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Prompt for credentials
Write-Host "Please enter your IBM watsonx.ai credentials:" -ForegroundColor Yellow
Write-Host ""
$WATSONX_API_KEY = Read-Host "IBM Cloud API Key" -AsSecureString
$WATSONX_API_KEY_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($WATSONX_API_KEY))

$WATSONX_PROJECT_ID = Read-Host "watsonx.ai Project ID"
Write-Host ""

if ([string]::IsNullOrEmpty($WATSONX_API_KEY_PLAIN) -or [string]::IsNullOrEmpty($WATSONX_PROJECT_ID)) {
    Write-Host "❌ Both credentials are required!" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Step 1: Enabling Secret Manager API..." -ForegroundColor Cyan
gcloud services enable secretmanager.googleapis.com
Write-Host "✅ Secret Manager API enabled" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Step 2: Creating secrets..." -ForegroundColor Cyan

# Create or update watsonx-api-key secret
$secretExists = gcloud secrets describe watsonx-api-key 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Updating existing watsonx-api-key secret..." -ForegroundColor Yellow
    $WATSONX_API_KEY_PLAIN | gcloud secrets versions add watsonx-api-key --data-file=-
} else {
    Write-Host "  Creating watsonx-api-key secret..." -ForegroundColor Yellow
    $WATSONX_API_KEY_PLAIN | gcloud secrets create watsonx-api-key --data-file=- --replication-policy="automatic"
}

# Create or update watsonx-project-id secret
$secretExists = gcloud secrets describe watsonx-project-id 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Updating existing watsonx-project-id secret..." -ForegroundColor Yellow
    $WATSONX_PROJECT_ID | gcloud secrets versions add watsonx-project-id --data-file=-
} else {
    Write-Host "  Creating watsonx-project-id secret..." -ForegroundColor Yellow
    $WATSONX_PROJECT_ID | gcloud secrets create watsonx-project-id --data-file=- --replication-policy="automatic"
}

Write-Host "✅ Secrets created" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Step 3: Granting access to service account..." -ForegroundColor Cyan

# Get project number
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"

# Cloud Run service account
$CLOUD_RUN_SA = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

# Grant access to watsonx-api-key
gcloud secrets add-iam-policy-binding watsonx-api-key `
    --member="serviceAccount:$CLOUD_RUN_SA" `
    --role="roles/secretmanager.secretAccessor" `
    --quiet

# Grant access to watsonx-project-id
gcloud secrets add-iam-policy-binding watsonx-project-id `
    --member="serviceAccount:$CLOUD_RUN_SA" `
    --role="roles/secretmanager.secretAccessor" `
    --quiet

Write-Host "✅ Permissions granted to: $CLOUD_RUN_SA" -ForegroundColor Green
Write-Host ""

Write-Host "🔧 Step 4: Updating Cloud Run service..." -ForegroundColor Cyan

# Prompt for service name and region
$SERVICE_NAME = Read-Host "Cloud Run service name [marketing-api]"
if ([string]::IsNullOrEmpty($SERVICE_NAME)) { $SERVICE_NAME = "marketing-api" }

$REGION = Read-Host "Cloud Run region [us-central1]"
if ([string]::IsNullOrEmpty($REGION)) { $REGION = "us-central1" }

# Update Cloud Run service
$serviceExists = gcloud run services describe $SERVICE_NAME --region=$REGION 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Updating $SERVICE_NAME in $REGION..." -ForegroundColor Yellow

    gcloud run services update $SERVICE_NAME `
        --update-secrets=WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest `
        --set-env-vars="USE_GRANITE_LLM=true" `
        --region=$REGION `
        --quiet

    Write-Host "✅ Cloud Run service updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  Service $SERVICE_NAME not found in $REGION" -ForegroundColor Yellow
    Write-Host "   You'll need to deploy your service first, then run:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   gcloud run services update $SERVICE_NAME ``" -ForegroundColor White
    Write-Host "     --update-secrets=WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest ``" -ForegroundColor White
    Write-Host "     --set-env-vars=`"USE_GRANITE_LLM=true`" ``" -ForegroundColor White
    Write-Host "     --region=$REGION" -ForegroundColor White
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Secrets created:" -ForegroundColor Green
Write-Host "  ✅ watsonx-api-key"
Write-Host "  ✅ watsonx-project-id"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Deploy your Cloud Run service (if not already deployed)"
Write-Host "  2. Test the marketing chat"
Write-Host "  3. Check logs: gcloud logging read 'textPayload=~`"Granite`"' --limit=10"
Write-Host ""
Write-Host "To view secrets:" -ForegroundColor Cyan
Write-Host "  gcloud secrets list"
Write-Host ""
Write-Host "To update a secret:" -ForegroundColor Cyan
Write-Host "  echo 'NEW_VALUE' | gcloud secrets versions add watsonx-api-key --data-file=-"
Write-Host ""

# Clear sensitive data
$WATSONX_API_KEY_PLAIN = $null
[System.GC]::Collect()
