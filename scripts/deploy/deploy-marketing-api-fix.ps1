# Deploy Marketing API with Hybrid Search Fix
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Marketing API - Hybrid Search Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nDeploying to Cloud Run..." -ForegroundColor Yellow
Write-Host "Project: rag-prompt-library-staging" -ForegroundColor Gray
Write-Host "Region: australia-southeast1" -ForegroundColor Gray
Write-Host "Service: marketing-api" -ForegroundColor Gray

# Deploy with existing environment variables
gcloud run deploy marketing-api `
  --source ./functions `
  --region australia-southeast1 `
  --project rag-prompt-library-staging `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars="OPENROUTER_USE_MOCK=false,OPENROUTER_MODEL=z-ai/glm-4.5-air:free,ENVIRONMENT=staging"

Write-Host "`nDeployment complete!" -ForegroundColor Green
