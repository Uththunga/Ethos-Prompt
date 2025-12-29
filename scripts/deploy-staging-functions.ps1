# Deploy Functions to Staging Environment
# This script deploys the updated Cloud Functions with all CRUD operations

Write-Host "🚀 Deploying Cloud Functions to Staging Environment" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
try {
    $null = firebase --version
} catch {
    Write-Host "❌ Firebase CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
try {
    $null = firebase projects:list 2>&1
} catch {
    Write-Host "❌ Not logged in to Firebase. Please login first:" -ForegroundColor Red
    Write-Host "firebase login" -ForegroundColor Yellow
    exit 1
}

# Switch to staging project
Write-Host "📋 Switching to staging project..." -ForegroundColor Yellow
firebase use staging

# Verify project
Write-Host "✅ Switched to staging project" -ForegroundColor Green
Write-Host ""

# List functions that will be deployed
Write-Host "📦 Functions to be deployed:" -ForegroundColor Yellow
Write-Host "  - create_prompt (CRUD)"
Write-Host "  - get_prompt (CRUD) ⭐ NEW" -ForegroundColor Green
Write-Host "  - update_prompt (CRUD) ⭐ NEW" -ForegroundColor Green
Write-Host "  - delete_prompt (CRUD) ⭐ NEW" -ForegroundColor Green
Write-Host "  - list_prompts (CRUD) ⭐ NEW" -ForegroundColor Green
Write-Host "  - search_prompts (CRUD) ⭐ NEW" -ForegroundColor Green
Write-Host "  - get_prompt_versions (CRUD) ⭐ NEW" -ForegroundColor Green
Write-Host "  - restore_prompt_version (CRUD) ⭐ NEW" -ForegroundColor Green
Write-Host "  - generate_prompt (AI)"
Write-Host "  - execute_multi_model_prompt (AI)"
Write-Host "  - api (Main API)"
Write-Host "  - httpApi (HTTP API)"
Write-Host ""

# Confirm deployment
$confirmation = Read-Host "🤔 Deploy to staging? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "⚠️  Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

# Deploy functions
Write-Host ""
Write-Host "🚀 Deploying functions..." -ForegroundColor Yellow
firebase deploy --only functions

# Check deployment status
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Verify functions in Firebase Console:"
    Write-Host "     https://console.firebase.google.com/project/rag-prompt-library-staging/functions"
    Write-Host ""
    Write-Host "  2. Test the application:"
    Write-Host "     https://rag-prompt-library-staging.web.app/dashboard/prompts"
    Write-Host ""
    Write-Host "  3. Test CRUD operations:"
    Write-Host "     - Create a new prompt ✅"
    Write-Host "     - View prompt details ✅ (should work now!)" -ForegroundColor Green
    Write-Host "     - Edit the prompt ✅"
    Write-Host "     - Delete the prompt ✅"
    Write-Host "     - Search prompts ✅"
    Write-Host ""
    Write-Host "🎉 All done!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the error messages above for details."
    exit 1
}

