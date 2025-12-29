# Install Google Cloud SDK and Deploy Granite
# This script automates the entire process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IBM Granite 4.0 - Automated Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "rag-prompt-library-staging"
$SERVICE_NAME = "marketing-api"
$REGION = "australia-southeast1"

# Check if gcloud is already installed
$gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue

if ($gcloudCmd) {
    Write-Host "✅ gcloud CLI already installed" -ForegroundColor Green
    Write-Host "Location: $($gcloudCmd.Source)" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "❌ gcloud CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Google Cloud SDK..." -ForegroundColor Yellow
    Write-Host ""
    
    # Download Google Cloud SDK installer
    $installerUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
    $installerPath = "$env:TEMP\GoogleCloudSDKInstaller.exe"
    
    Write-Host "Downloading installer..." -ForegroundColor Cyan
    try {
        Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
        Write-Host "✅ Download complete" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "Starting installer..." -ForegroundColor Cyan
        Write-Host "Please follow the installation wizard:" -ForegroundColor Yellow
        Write-Host "  1. Click 'Next' through the installation" -ForegroundColor White
        Write-Host "  2. Accept the default installation location" -ForegroundColor White
        Write-Host "  3. Check 'Start Google Cloud SDK Shell' at the end" -ForegroundColor White
        Write-Host "  4. In the SDK Shell, run: gcloud init" -ForegroundColor White
        Write-Host "  5. Login and select project: $PROJECT_ID" -ForegroundColor White
        Write-Host ""
        
        # Start the installer
        Start-Process -FilePath $installerPath -Wait
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Installation Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: After gcloud init completes:" -ForegroundColor Yellow
        Write-Host "1. Close this PowerShell window" -ForegroundColor White
        Write-Host "2. Open a NEW PowerShell window" -ForegroundColor White
        Write-Host "3. Run this script again: .\install-gcloud-and-deploy.ps1" -ForegroundColor White
        Write-Host ""
        
        exit 0
    } catch {
        Write-Host "❌ Failed to download installer: $_" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install manually:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
        Write-Host "2. Download and run the Windows installer" -ForegroundColor White
        Write-Host "3. Run: gcloud init" -ForegroundColor White
        Write-Host "4. Then run this script again" -ForegroundColor White
        exit 1
    }
}

# Verify gcloud is configured
Write-Host "Verifying gcloud configuration..." -ForegroundColor Cyan

try {
    $currentProject = gcloud config get-value project 2>$null
    
    if ($currentProject -ne $PROJECT_ID) {
        Write-Host "⚠️  Current project: $currentProject" -ForegroundColor Yellow
        Write-Host "Setting project to: $PROJECT_ID" -ForegroundColor Cyan
        gcloud config set project $PROJECT_ID
    } else {
        Write-Host "✅ Project configured: $PROJECT_ID" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ gcloud not authenticated" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: gcloud auth login" -ForegroundColor Yellow
    Write-Host "Then run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Granite Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get project number
Write-Host "Getting project details..." -ForegroundColor Cyan
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>$null

if (-not $PROJECT_NUMBER) {
    Write-Host "❌ Failed to get project number" -ForegroundColor Red
    Write-Host "Please ensure you have access to project: $PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

$CLOUD_RUN_SA = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
Write-Host "✅ Service Account: $CLOUD_RUN_SA" -ForegroundColor Green
Write-Host ""

# Grant permissions to secrets
Write-Host "Granting Secret Manager permissions..." -ForegroundColor Cyan

Write-Host "  → watsonx-api-key..." -ForegroundColor Yellow
gcloud secrets add-iam-policy-binding watsonx-api-key `
  --member="serviceAccount:$CLOUD_RUN_SA" `
  --role="roles/secretmanager.secretAccessor" `
  --project=$PROJECT_ID `
  --quiet 2>&1 | Out-Null

Write-Host "  → watsonx-project-id..." -ForegroundColor Yellow
gcloud secrets add-iam-policy-binding watsonx-project-id `
  --member="serviceAccount:$CLOUD_RUN_SA" `
  --role="roles/secretmanager.secretAccessor" `
  --project=$PROJECT_ID `
  --quiet 2>&1 | Out-Null

Write-Host "✅ Permissions granted" -ForegroundColor Green
Write-Host ""

# Update Cloud Run service
Write-Host "Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "  Service: $SERVICE_NAME" -ForegroundColor Gray
Write-Host "  Region: $REGION" -ForegroundColor Gray
Write-Host ""

$updateResult = gcloud run services update $SERVICE_NAME `
  --update-secrets=WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest `
  --set-env-vars="USE_GRANITE_LLM=true" `
  --region=$REGION `
  --project=$PROJECT_ID `
  --quiet 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Deployment Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing the API..." -ForegroundColor Cyan
    Write-Host ""
    
    # Wait a moment for the service to update
    Start-Sleep -Seconds 5
    
    # Run test
    if (Test-Path ".\test-marketing-api.ps1") {
        & ".\test-marketing-api.ps1"
    } else {
        Write-Host "⚠️  Test script not found: .\test-marketing-api.ps1" -ForegroundColor Yellow
        Write-Host "Please test manually at:" -ForegroundColor Yellow
        Write-Host "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat" -ForegroundColor White
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Deployment Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $updateResult -ForegroundColor White
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. You have permissions to update Cloud Run services" -ForegroundColor White
    Write-Host "  2. The service exists: $SERVICE_NAME" -ForegroundColor White
    Write-Host "  3. The secrets exist: watsonx-api-key, watsonx-project-id" -ForegroundColor White
    exit 1
}

