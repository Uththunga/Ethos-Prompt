# Deploy Marketing API to Cloud Run - Staging
# This deploys the FastAPI backend with all our fixes

$PROJECT_ID = "rag-prompt-library-staging"
$SERVICE_NAME = "marketing-api"
$REGION = "australia-southeast1"

Write-Host "🚀 Deploying Marketing API to Cloud Run..." -ForegroundColor Cyan

# Step 1: Build and submit to Cloud Build
Write-Host "`n📦 Building Docker image..." -ForegroundColor Yellow
cd functions

gcloud builds submit `
  --tag gcr.io/$PROJECT_ID/$SERVICE_NAME `
  --project=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Step 2: Deploy to Cloud Run
Write-Host "`n🚢 Deploying to Cloud Run..." -ForegroundColor Yellow

gcloud run deploy $SERVICE_NAME `
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --memory 2Gi `
  --cpu 2 `
  --timeout 300 `
  --max-instances 10 `
  --set-env-vars "USE_GRANITE_LLM=true,ENVIRONMENT=staging,WARMUP_CROSS_ENCODER=true,WARMUP_LLM_INFERENCE=false" `
  --project=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Deployment successful!" -ForegroundColor Green

# Step 3: Get the service URL
Write-Host "`n📍 Getting service URL..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME `
  --region=$REGION `
  --project=$PROJECT_ID `
  --format="value(status.url)"

Write-Host "`n🎉 Marketing API deployed!" -ForegroundColor Green
Write-Host "URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "`nTest with:" -ForegroundColor Yellow
Write-Host "curl $SERVICE_URL/health" -ForegroundColor White
