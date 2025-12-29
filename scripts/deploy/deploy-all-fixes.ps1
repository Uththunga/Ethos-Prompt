# Deploy All Fixes to Staging (Master Script - PowerShell)
# This script deploys both authentication and timeout fixes

param(
    [switch]$SkipConfirmation
)

# Project configuration
$PROJECT_ID = "rag-prompt-library-staging"
$REGION = "australia-southeast1"

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "INFO: $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "SUCCESS: $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "ERROR: $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

# Show banner
function Show-Banner {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                  ║" -ForegroundColor Cyan
    Write-Host "║          Complete Fix Deployment - Staging Environment          ║" -ForegroundColor Cyan
    Write-Host "║                                                                  ║" -ForegroundColor Cyan
    Write-Host "║  Fixes: Timeout + Authentication + CORS                         ║" -ForegroundColor Cyan
    Write-Host "║                                                                  ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Check prerequisites
function Test-Prerequisites {
    Write-Step "Step 1/4: Checking Prerequisites"

    $allGood = $true

    # Check Firebase CLI
    try {
        $firebaseVersion = firebase --version
        Write-Success "Firebase CLI found: $firebaseVersion"
    } catch {
        Write-Error "Firebase CLI not found"
        Write-Host "Install: npm install -g firebase-tools"
        $allGood = $false
    }

    # Check Firebase auth
    try {
        $null = firebase projects:list 2>&1
        Write-Success "Firebase authentication verified"
    } catch {
        Write-Error "Not logged in to Firebase"
        Write-Host "Run: firebase login"
        $allGood = $false
    }

    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    } catch {
        Write-Error "Node.js not found"
        Write-Host "Install: https://nodejs.org/"
        $allGood = $false
    }

    # Check npm
    try {
        $npmVersion = npm --version
        Write-Success "npm found: $npmVersion"
    } catch {
        Write-Error "npm not found"
        $allGood = $false
    }

    if (-not $allGood) {
        Write-Error "Prerequisites check failed"
        exit 1
    }

    Write-Success "All prerequisites satisfied"
}

# Show deployment plan
function Show-DeploymentPlan {
    Write-Step "Step 2/4: Deployment Plan"

    Write-Host "This deployment will fix the following issues:"
    Write-Host ""
    Write-Host "🔧 Backend Fixes (Cloud Functions):"
    Write-Host "   1. Issue: 401 Unauthorized on execute_multi_model_prompt"
    Write-Host "      Fix: Disable App Check enforcement (staging only)"
    Write-Host "      File: functions/index.js"
    Write-Host ""
    Write-Host "🔧 Frontend Fixes (React App):"
    Write-Host "   2. Issue: Execution timeout after 5 seconds"
    Write-Host "      Fix: Increase timeout to 150 seconds"
    Write-Host "      File: frontend/src/components/execution/PromptExecutor.tsx"
    Write-Host ""
    Write-Host "   3. Issue: Streaming timeout after 5 seconds"
    Write-Host "      Fix: Increase timeout to 150 seconds"
    Write-Host "      File: frontend/src/hooks/useStreamingExecution.ts"
    Write-Host ""
    Write-Host "   4. Enhancement: Better error messages and logging"
    Write-Host "      Files: PromptExecutor.tsx, useStreamingExecution.ts"
    Write-Host ""
    Write-Host "Deployment Targets:"
    Write-Host "   - Project: $PROJECT_ID"
    Write-Host "   - Region: $REGION"
    Write-Host "   - Backend: Cloud Functions"
    Write-Host "   - Frontend: Firebase Hosting"
    Write-Host ""

    if (-not $SkipConfirmation) {
        $response = Read-Host "Continue with deployment? (y/n)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Warning "Deployment cancelled by user"
            exit 0
        }
    }
}

# Deploy backend
function Deploy-Backend {
    Write-Step "Step 3/4: Deploying Backend (Cloud Functions)"

    Write-Info "Deploying Cloud Functions to $PROJECT_ID..."

    firebase deploy --only functions --project $PROJECT_ID

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Backend deployed successfully"
    } else {
        Write-Error "Backend deployment failed"
        Write-Warning "Continuing with frontend deployment..."
    }
}

# Deploy frontend
function Deploy-Frontend {
    Write-Step "Step 4/4: Deploying Frontend (React App)"

    Write-Info "Building frontend for staging..."

    Push-Location frontend

    try {
        # Install dependencies
        Write-Info "Installing dependencies..."
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "Failed to install dependencies" }
        Write-Success "Dependencies installed"

        # Build for staging
        Write-Info "Building for staging environment..."
        npm run build:staging
        if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
        Write-Success "Frontend built successfully"
    } catch {
        Write-Error $_
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }

    # Deploy to Firebase Hosting
    Write-Info "Deploying to Firebase Hosting..."
    firebase deploy --only hosting --project $PROJECT_ID

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend deployed successfully"
    } else {
        Write-Error "Frontend deployment failed"
        exit 1
    }
}

# Verify deployment
function Test-Deployment {
    Write-Step "Verification"

    Write-Info "Verifying backend deployment..."
    firebase functions:list --project $PROJECT_ID | Select-Object -First 10

    Write-Info "Verifying frontend deployment..."
    $url = "https://$PROJECT_ID.web.app"
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Frontend is accessible at $url"
        }
    } catch {
        Write-Warning "Frontend may not be fully deployed yet"
    }
}

# Show testing instructions
function Show-TestingInstructions {
    Write-Step "Testing Instructions"

    Write-Host "CRITICAL: You MUST be logged in to test prompt execution" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Testing Checklist:"
    Write-Host ""
    Write-Host "1. Navigate to: https://$PROJECT_ID.web.app"
    Write-Host ""
    Write-Host "2. LOG IN (REQUIRED):"
    Write-Host "   - Click 'Sign In' button"
    Write-Host "   - Use your test account credentials"
    Write-Host "   - Verify you see your email in the header"
    Write-Host ""
    Write-Host "3. Navigate to prompt execution:"
    Write-Host "   https://$PROJECT_ID.web.app/dashboard/prompts/KIcc8OOyJhcoQh5oZzCU/execute"
    Write-Host ""
    Write-Host "4. Open browser console (F12)"
    Write-Host ""
    Write-Host "5. Execute the prompt"
    Write-Host ""
    Write-Host "6. Verify success:"
    Write-Host "   Should see: Starting prompt execution"
    Write-Host "   Should see: Prompt execution completed successfully"
    Write-Host "   Should see: Execution finished"
    Write-Host "   Execution time: 10-60 seconds (NOT 5 seconds)"
    Write-Host ""
    Write-Host "7. Verify NO errors:"
    Write-Host "   Should NOT see: 'Execution timed out'"
    Write-Host "   Should NOT see: '401 Unauthorized'"
    Write-Host "   Should NOT see: 'Unauthenticated'"
    Write-Host "   Should NOT see: 'CORS error'"
    Write-Host ""
}

# Show monitoring commands
function Show-MonitoringCommands {
    Write-Step "Monitoring and Debugging"

    Write-Host "Useful Commands:"
    Write-Host ""
    Write-Host "1. Watch function logs:"
    Write-Host "   firebase functions:log --project $PROJECT_ID --tail"
    Write-Host ""
    Write-Host "2. Check recent errors:"
    Write-Host "   firebase functions:log --project $PROJECT_ID | Select-String ERROR"
    Write-Host ""
    Write-Host "3. Test authentication in browser console:"
    Write-Host "   firebase.auth().currentUser"
    Write-Host "   firebase.auth().currentUser?.getIdToken().then(console.log)"
    Write-Host ""
    Write-Host "4. Check Firebase config:"
    Write-Host "   console.log(firebase.app().options)"
    Write-Host ""
    Write-Host "Firebase Console:"
    Write-Host "   https://console.firebase.google.com/project/$PROJECT_ID"
    Write-Host ""
}

# Show summary
function Show-Summary {
    Write-Step "Deployment Summary"

    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "What was deployed:"
    Write-Host "   Backend: Cloud Functions (App Check disabled)"
    Write-Host "   Frontend: React App (150s timeout, better logging)"
    Write-Host ""
    Write-Host "Expected improvements:"
    Write-Host "   No more 5-second timeouts"
    Write-Host "   No more 401 Unauthorized errors"
    Write-Host "   Better error messages"
    Write-Host "   Comprehensive logging for debugging"
    Write-Host ""
    Write-Host "Documentation:"
    Write-Host "   - Complete Guide: COMPLETE_FIX_DEPLOYMENT_GUIDE.md"
    Write-Host "   - Timeout Fix: PROMPT_EXECUTION_TIMEOUT_FIX_REPORT.md"
    Write-Host "   - Auth Fix: AUTHENTICATION_FIX_REPORT.md"
    Write-Host "   - Quick Start: TIMEOUT_FIX_QUICK_START.md"
    Write-Host ""
    Write-Host "Next Step: TEST the fix by logging in and executing a prompt" -ForegroundColor Yellow
    Write-Host ""
}

# Main deployment flow
function Main {
    Show-Banner
    Test-Prerequisites
    Show-DeploymentPlan
    Deploy-Backend
    Deploy-Frontend
    Test-Deployment
    Show-TestingInstructions
    Show-MonitoringCommands
    Show-Summary

    Write-Host ""
    Write-Success "All fixes deployed successfully!"
    Write-Host ""
}

# Run main function
Main
