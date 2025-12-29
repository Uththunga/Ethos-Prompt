# Manual Granite Deployment Script
# Since secrets already exist, we just need to configure Cloud Run

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "IBM Granite 4.0 - Manual Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "rag-prompt-library-staging"
$SERVICE_NAME = "marketing-api"
$REGION = "australia-southeast1"

Write-Host "Project: $PROJECT_ID" -ForegroundColor Green
Write-Host "Service: $SERVICE_NAME" -ForegroundColor Green
Write-Host "Region: $REGION" -ForegroundColor Green
Write-Host ""

# Check if gcloud is available
$gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue

if (-not $gcloudCmd) {
    Write-Host "❌ gcloud CLI not found in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run these commands manually in Google Cloud Shell:" -ForegroundColor Yellow
    Write-Host "(Go to: https://console.cloud.google.com/?cloudshell=true)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "# 1. Get project number" -ForegroundColor Cyan
    Write-Host "PROJECT_NUMBER=`$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')" -ForegroundColor White
    Write-Host "CLOUD_RUN_SA=`"`${PROJECT_NUMBER}-compute@developer.gserviceaccount.com`"" -ForegroundColor White
    Write-Host ""
    Write-Host "# 2. Grant permissions to secrets" -ForegroundColor Cyan
    Write-Host "gcloud secrets add-iam-policy-binding watsonx-api-key ``" -ForegroundColor White
    Write-Host "  --member=`"serviceAccount:`$CLOUD_RUN_SA`" ``" -ForegroundColor White
    Write-Host "  --role=`"roles/secretmanager.secretAccessor`" ``" -ForegroundColor White
    Write-Host "  --project=$PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "gcloud secrets add-iam-policy-binding watsonx-project-id ``" -ForegroundColor White
    Write-Host "  --member=`"serviceAccount:`$CLOUD_RUN_SA`" ``" -ForegroundColor White
    Write-Host "  --role=`"roles/secretmanager.secretAccessor`" ``" -ForegroundColor White
    Write-Host "  --project=$PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "# 3. Update Cloud Run service" -ForegroundColor Cyan
    Write-Host "gcloud run services update $SERVICE_NAME ``" -ForegroundColor White
    Write-Host "  --update-secrets=WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest ``" -ForegroundColor White
    Write-Host "  --set-env-vars=`"USE_GRANITE_LLM=true`" ``" -ForegroundColor White
    Write-Host "  --region=$REGION ``" -ForegroundColor White
    Write-Host "  --project=$PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Alternative: Use Google Cloud Console" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to Secret Manager:" -ForegroundColor Yellow
    Write-Host "   https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "2. For each secret (watsonx-api-key, watsonx-project-id):" -ForegroundColor Yellow
    Write-Host "   - Click the secret name" -ForegroundColor White
    Write-Host "   - Go to 'Permissions' tab" -ForegroundColor White
    Write-Host "   - Click 'Grant Access'" -ForegroundColor White
    Write-Host "   - Add principal: [PROJECT_NUMBER]-compute@developer.gserviceaccount.com" -ForegroundColor White
    Write-Host "   - Role: Secret Manager Secret Accessor" -ForegroundColor White
    Write-Host "   - Click 'Save'" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Go to Cloud Run:" -ForegroundColor Yellow
    Write-Host "   https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/revisions?project=$PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Click 'Edit & Deploy New Revision'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "5. Under 'Variables & Secrets':" -ForegroundColor Yellow
    Write-Host "   - Add Environment Variable:" -ForegroundColor White
    Write-Host "     Name: USE_GRANITE_LLM" -ForegroundColor White
    Write-Host "     Value: true" -ForegroundColor White
    Write-Host ""
    Write-Host "   - Add Secret Reference:" -ForegroundColor White
    Write-Host "     Secret: watsonx-api-key" -ForegroundColor White
    Write-Host "     Reference method: Exposed as environment variable" -ForegroundColor White
    Write-Host "     Name: WATSONX_API_KEY" -ForegroundColor White
    Write-Host ""
    Write-Host "   - Add Secret Reference:" -ForegroundColor White
    Write-Host "     Secret: watsonx-project-id" -ForegroundColor White
    Write-Host "     Reference method: Exposed as environment variable" -ForegroundColor White
    Write-Host "     Name: WATSONX_PROJECT_ID" -ForegroundColor White
    Write-Host ""
    Write-Host "6. Click 'Deploy'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "After deployment, run:" -ForegroundColor Yellow
    Write-Host "  .\test-marketing-api.ps1" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    
    exit 1
}

# If gcloud is available, proceed with automated deployment
Write-Host "✅ gcloud CLI found" -ForegroundColor Green
Write-Host ""

# Set project
Write-Host "Setting project..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

# Get project number
Write-Host "Getting project number..." -ForegroundColor Cyan
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
$CLOUD_RUN_SA = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

Write-Host "Service Account: $CLOUD_RUN_SA" -ForegroundColor Green
Write-Host ""

# Grant permissions
Write-Host "Granting permissions to secrets..." -ForegroundColor Cyan

Write-Host "  - watsonx-api-key..." -ForegroundColor Yellow
gcloud secrets add-iam-policy-binding watsonx-api-key `
  --member="serviceAccount:$CLOUD_RUN_SA" `
  --role="roles/secretmanager.secretAccessor" `
  --project=$PROJECT_ID `
  --quiet

Write-Host "  - watsonx-project-id..." -ForegroundColor Yellow
gcloud secrets add-iam-policy-binding watsonx-project-id `
  --member="serviceAccount:$CLOUD_RUN_SA" `
  --role="roles/secretmanager.secretAccessor" `
  --project=$PROJECT_ID `
  --quiet

Write-Host "✅ Permissions granted" -ForegroundColor Green
Write-Host ""

# Update Cloud Run service
Write-Host "Updating Cloud Run service..." -ForegroundColor Cyan

gcloud run services update $SERVICE_NAME `
  --update-secrets=WATSONX_API_KEY=watsonx-api-key:latest,WATSONX_PROJECT_ID=watsonx-project-id:latest `
  --set-env-vars="USE_GRANITE_LLM=true" `
  --region=$REGION `
  --project=$PROJECT_ID `
  --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing the API..." -ForegroundColor Cyan
    Write-Host ""
    
    # Run test
    & "$PSScriptRoot\test-marketing-api.ps1"
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ Deployment Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    exit 1
}

