# Simple Deployment Script

$PROJECT_ID = "rag-prompt-library-staging"

Write-Host "Starting deployment to $PROJECT_ID..."

# Deploy Backend
Write-Host "Deploying Cloud Functions..."
firebase deploy --only functions --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend deployment failed!" -ForegroundColor Red
    # Continue anyway as requested? No, usually stop. But the original script continued.
} else {
    Write-Host "Backend deployed successfully." -ForegroundColor Green
}

# Deploy Frontend
Write-Host "Building Frontend..."
Push-Location frontend
npm ci
npm run build:staging
Pop-Location

Write-Host "Deploying Hosting..."
firebase deploy --only hosting --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend deployment failed!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Frontend deployed successfully." -ForegroundColor Green
}

Write-Host "Deployment Complete!"
