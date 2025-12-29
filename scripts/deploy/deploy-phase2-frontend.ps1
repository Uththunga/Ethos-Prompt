# Deploy Phase 2 Frontend to Staging
Write-Host "Deploying Phase 2 Frontend to Staging..." -ForegroundColor Cyan

# Navigate to frontend directory
Write-Host "`nNavigating to frontend directory..." -ForegroundColor Cyan
Set-Location frontend

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Cyan
npm ci

# Build frontend using Vite's staging mode so .env.staging is applied
Write-Host "`nBuilding frontend (staging mode)..." -ForegroundColor Cyan
npm run build:staging

# Return to root directory
Set-Location ..

# Deploy hosting
Write-Host "`nDeploying to Firebase Hosting..." -ForegroundColor Cyan
npx firebase deploy --only hosting --project rag-prompt-library-staging

Write-Host "`nFrontend deployment complete!" -ForegroundColor Green
Write-Host "Staging URL: https://rag-prompt-library-staging.web.app" -ForegroundColor Cyan
