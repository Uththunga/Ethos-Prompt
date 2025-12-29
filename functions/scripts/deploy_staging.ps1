# Deploy to Firebase Staging Environment (PowerShell)
# Task 1.11: Deploy to Staging & Validate

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment to staging..." -ForegroundColor Green
Write-Host ""

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
} catch {
    Write-Host "❌ Firebase CLI not found. Please install it:" -ForegroundColor Red
    Write-Host "   npm install -g firebase-tools"
    exit 1
}

# Check if logged in
Write-Host "📋 Checking Firebase authentication..." -ForegroundColor Cyan
try {
    firebase login:list
} catch {
    Write-Host "❌ Not logged in to Firebase. Please run:" -ForegroundColor Red
    Write-Host "   firebase login"
    exit 1
}

# Check current project
Write-Host "📋 Current Firebase project:" -ForegroundColor Cyan
firebase use

Write-Host ""
$confirm = Read-Host "Is this the correct project? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Please set the correct project with: firebase use <project-id>"
    exit 1
}

# Run tests before deploying
Write-Host ""
Write-Host "🧪 Running tests before deployment..." -ForegroundColor Cyan
Set-Location (Split-Path $PSScriptRoot -Parent)
try {
    py -m pytest tests/test_error_handling.py tests/test_cost_tracker.py -v --tb=short
} catch {
    Write-Host "❌ Tests failed. Fix tests before deploying." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Tests passed!" -ForegroundColor Green

# Build frontend (if needed)
Write-Host ""
Write-Host "🔨 Building frontend..." -ForegroundColor Cyan
Set-Location ../frontend
try {
    npm run build
} catch {
    Write-Host "❌ Frontend build failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Frontend built successfully!" -ForegroundColor Green

# Deploy to Firebase
Write-Host ""
Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Cyan
Set-Location ..
try {
    firebase deploy --only hosting,functions
} catch {
    Write-Host "❌ Deployment failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green

# Get deployment URL
Write-Host ""
Write-Host "📍 Deployment URLs:" -ForegroundColor Cyan
firebase hosting:channel:list

Write-Host ""
Write-Host "🎉 Staging deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Test the staging environment"
Write-Host "2. Run end-to-end tests"
Write-Host "3. Monitor logs: firebase functions:log"
Write-Host "4. Check for errors in Firebase Console"

