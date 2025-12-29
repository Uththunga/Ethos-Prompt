# Deploy script for marketing-api Cloud Run service
# This script builds and deploys the Python code in functions/ to Cloud Run

$ErrorActionPreference = "Stop"

$SERVICE_NAME = "marketing-api"
$REGION = "australia-southeast1"
$SOURCE_DIR = "functions"

Write-Host "========================================================"
Write-Host "Deploying $SERVICE_NAME to Cloud Run ($REGION)..."
Write-Host "========================================================"

# Check if gcloud is in PATH
if (Get-Command "gcloud" -ErrorAction SilentlyContinue) {
    $GCLOUD_CMD = "gcloud"
} else {
    Write-Host "⚠️  gcloud not found in PATH. Searching common locations..." -ForegroundColor Yellow

    $COMMON_PATHS = @(
        "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "$env:ProgramFiles\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd",
        "${env:ProgramFiles(x86)}\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
    )

    foreach ($path in $COMMON_PATHS) {
        if (Test-Path $path) {
            $GCLOUD_CMD = $path
            Write-Host "✅ Found gcloud at: $path" -ForegroundColor Green
            break
        }
    }

    if (-not $GCLOUD_CMD) {
        Write-Error "Error: gcloud CLI is not installed or not in PATH. Please install Google Cloud SDK."
        exit 1
    }
}

# Navigate to functions directory
Set-Location $SOURCE_DIR

# Get current project
$PROJECT_ID = & $GCLOUD_CMD config get-value project
Write-Host "Project ID: $PROJECT_ID"

# Deploy to Cloud Run with IBM Granite 4.0 H-Small
# Environment variables:
# - USE_GRANITE_LLM: Enable Granite instead of OpenRouter
# - WATSONX_MODEL_ID: Granite model to use
# - WATSONX_PROJECT_ID: IBM watsonx.ai project ID
# Secrets (from Secret Manager):
# - watsonx-api-key: IBM Cloud API key

Write-Host "Configuring IBM Granite 4.0 H-Small..." -ForegroundColor Cyan
$WATSONX_MODEL_ID = "ibm/granite-4-h-small"
$WATSONX_PROJECT_ID = "4db5cbf0-9084-48bf-9f7e-03bc2d6f0ce7"

Write-Host "  Model: $WATSONX_MODEL_ID" -ForegroundColor Gray
Write-Host "  Project: $WATSONX_PROJECT_ID" -ForegroundColor Gray
Write-Host ""

& $GCLOUD_CMD run deploy "$SERVICE_NAME" `
  --source . `
  --region "$REGION" `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars "USE_GRANITE_LLM=true,ENVIRONMENT=staging,WATSONX_MODEL_ID=$WATSONX_MODEL_ID,MARKETING_AGENT_MAX_TOKENS=1500" `
  --update-secrets "WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest" `
  --project "$PROJECT_ID"

if ($LASTEXITCODE -eq 0) {
    Write-Host "========================================================"
    Write-Host "Deployment Successful!"
    Write-Host "========================================================"
    Write-Host "To verify, test the Cloud Run URL provided in the output above."
} else {
    Write-Host "========================================================"
    Write-Host "Deployment Failed!"
    Write-Host "========================================================"
    exit 1
}
