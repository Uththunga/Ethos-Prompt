# Deploy Phase 2 Backend (Cloud Functions) to Staging
Write-Host "Deploying Phase 2 Backend to Staging..." -ForegroundColor Cyan

# Switch to staging project
Write-Host "`nSwitching to staging project..." -ForegroundColor Cyan
npx firebase use rag-prompt-library-staging

# Deploy only functions
Write-Host "`nDeploying Cloud Functions..." -ForegroundColor Cyan
npx firebase deploy --only functions --project rag-prompt-library-staging

Write-Host "`nBackend deployment complete!" -ForegroundColor Green
