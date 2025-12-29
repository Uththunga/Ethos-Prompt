# Configure Firebase Functions for Staging Environment
# RAG Prompt Library - Staging Setup Script
# 
# This script configures Firebase Functions environment variables for the staging project
# Run this after creating the staging Firebase project

param(
    [Parameter(Mandatory=$false)]
    [string]$OpenRouterApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "rag-prompt-library-staging"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Firebase Functions Staging Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is available
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = & npx firebase-tools --version 2>&1
    Write-Host "✓ Firebase CLI found: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Firebase CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "  Run: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Verify project exists
Write-Host "Verifying Firebase project..." -ForegroundColor Yellow
try {
    $projects = & npx firebase-tools projects:list 2>&1
    if ($projects -match $ProjectId) {
        Write-Host "✓ Project '$ProjectId' found" -ForegroundColor Green
    } else {
        Write-Host "✗ Project '$ProjectId' not found in your Firebase projects" -ForegroundColor Red
        Write-Host "  Please create the project first or check your Firebase authentication" -ForegroundColor Yellow
        Write-Host "  Run: npx firebase-tools login" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "✗ Error checking Firebase projects" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Get OpenRouter API key if not provided
if ([string]::IsNullOrWhiteSpace($OpenRouterApiKey)) {
    Write-Host "OpenRouter API Key Required" -ForegroundColor Yellow
    Write-Host "Get your API key from: https://openrouter.ai/keys" -ForegroundColor Cyan
    Write-Host ""
    $OpenRouterApiKey = Read-Host "Enter your OpenRouter API key (sk-or-v1-...)"
    
    if ([string]::IsNullOrWhiteSpace($OpenRouterApiKey)) {
        Write-Host "✗ OpenRouter API key is required" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Configuration Summary:" -ForegroundColor Cyan
Write-Host "  Project ID: $ProjectId" -ForegroundColor White
Write-Host "  OpenRouter API Key: $($OpenRouterApiKey.Substring(0, 15))..." -ForegroundColor White
Write-Host "  Environment: staging" -ForegroundColor White
Write-Host "  CORS Origins: https://rag-prompt-library-staging.web.app, https://rag-prompt-library-staging.firebaseapp.com" -ForegroundColor White
Write-Host "  Rate Limit: 100 requests/minute, 2000 requests/hour" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Proceed with configuration? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Configuration cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Configuring Firebase Functions..." -ForegroundColor Yellow
Write-Host ""

# Set OpenRouter API key
Write-Host "Setting openrouter.api_key..." -ForegroundColor Cyan
try {
    & npx firebase-tools functions:config:set `
        "openrouter.api_key=$OpenRouterApiKey" `
        --project $ProjectId
    Write-Host "✓ openrouter.api_key configured" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to set openrouter.api_key" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Set app environment
Write-Host "Setting app.environment..." -ForegroundColor Cyan
try {
    & npx firebase-tools functions:config:set `
        "app.environment=staging" `
        --project $ProjectId
    Write-Host "✓ app.environment configured" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to set app.environment" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Set CORS allowed origins
Write-Host "Setting cors.allowed_origins..." -ForegroundColor Cyan
try {
    & npx firebase-tools functions:config:set `
        "cors.allowed_origins=https://rag-prompt-library-staging.web.app,https://rag-prompt-library-staging.firebaseapp.com" `
        --project $ProjectId
    Write-Host "✓ cors.allowed_origins configured" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to set cors.allowed_origins" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Set rate limiting
Write-Host "Setting rate_limit.requests_per_minute..." -ForegroundColor Cyan
try {
    & npx firebase-tools functions:config:set `
        "rate_limit.requests_per_minute=100" `
        --project $ProjectId
    Write-Host "✓ rate_limit.requests_per_minute configured" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to set rate_limit.requests_per_minute" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

Write-Host "Setting rate_limit.requests_per_hour..." -ForegroundColor Cyan
try {
    & npx firebase-tools functions:config:set `
        "rate_limit.requests_per_hour=2000" `
        --project $ProjectId
    Write-Host "✓ rate_limit.requests_per_hour configured" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to set rate_limit.requests_per_hour" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verifying Configuration..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $config = & npx firebase-tools functions:config:get --project $ProjectId 2>&1
    Write-Host $config
    Write-Host ""
    Write-Host "✓ Configuration complete!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to verify configuration" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Update frontend/.env.staging with Firebase config values" -ForegroundColor White
Write-Host "2. Deploy Firestore rules: npx firebase-tools deploy --only firestore:rules --project $ProjectId" -ForegroundColor White
Write-Host "3. Deploy Firestore indexes: npx firebase-tools deploy --only firestore:indexes --project $ProjectId" -ForegroundColor White
Write-Host "4. Deploy Functions: npx firebase-tools deploy --only functions --project $ProjectId" -ForegroundColor White
Write-Host "5. Deploy Hosting: npm run deploy:staging" -ForegroundColor White
Write-Host ""
Write-Host "See docs/CRITICAL_GAPS_TEAM_WORKFLOW.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

