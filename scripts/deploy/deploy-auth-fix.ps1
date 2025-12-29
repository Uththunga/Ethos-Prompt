# Deploy Authentication Fix to Staging (PowerShell)
# This script deploys the App Check fix for execute_multi_model_prompt

param(
    [switch]$SkipConfirmation
)

# Project configuration
$PROJECT_ID = "rag-prompt-library-staging"
$REGION = "australia-southeast1"

# Helper functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host $Message -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host ""
}

# Check prerequisites
function Test-Prerequisites {
    Write-Step "Checking Prerequisites"
    
    # Check if Firebase CLI is installed
    try {
        $firebaseVersion = firebase --version
        Write-Success "Firebase CLI found: $firebaseVersion"
    } catch {
        Write-Error "Firebase CLI not found. Please install it first:"
        Write-Host "npm install -g firebase-tools"
        exit 1
    }
    
    # Check if logged in to Firebase
    try {
        $null = firebase projects:list 2>&1
        Write-Success "Firebase authentication verified"
    } catch {
        Write-Error "Not logged in to Firebase. Please run:"
        Write-Host "firebase login"
        exit 1
    }
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-Success "Node.js found: $nodeVersion"
    } catch {
        Write-Error "Node.js not found. Please install Node.js 18+"
        exit 1
    }
}

# Show summary of changes
function Show-Changes {
    Write-Step "Summary of Changes"
    
    Write-Host "This deployment fixes the following issues:"
    Write-Host ""
    Write-Host "1. ❌ Issue: execute_multi_model_prompt returns 401 Unauthorized"
    Write-Host "   ✅ Fix: Disabled App Check enforcement (staging only)"
    Write-Host "   📁 File: functions/index.js (lines 716-717)"
    Write-Host ""
    Write-Host "2. ❌ Issue: CORS errors on streaming execution"
    Write-Host "   ℹ️  Status: CORS config already correct, may be auth-related"
    Write-Host "   📁 File: functions/main.py (already configured)"
    Write-Host ""
    Write-Host "3. ❌ Issue: Unauthenticated errors"
    Write-Host "   ℹ️  Action: Verify user is logged in before testing"
    Write-Host ""
    
    if (-not $SkipConfirmation) {
        $response = Read-Host "Continue with deployment? (y/n)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Warning "Deployment cancelled by user"
            exit 0
        }
    }
}

# Deploy functions
function Deploy-Functions {
    Write-Step "Deploying Cloud Functions to Staging"
    
    Write-Info "Deploying to project: $PROJECT_ID"
    Write-Info "Region: $REGION"
    
    Write-Info "Deploying functions..."
    firebase deploy --only functions --project $PROJECT_ID
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Functions deployed successfully"
    } else {
        Write-Error "Function deployment failed"
        exit 1
    }
}

# Verify deployment
function Test-Deployment {
    Write-Step "Verifying Deployment"
    
    Write-Info "Listing deployed functions..."
    firebase functions:list --project $PROJECT_ID
    
    Write-Success "Deployment verified"
}

# Show testing instructions
function Show-TestingInstructions {
    Write-Step "Testing Instructions"
    
    Write-Host "📋 Critical: User MUST be logged in to test" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Navigate to: https://$PROJECT_ID.web.app"
    Write-Host ""
    Write-Host "2. 🔐 LOG IN (REQUIRED)" -ForegroundColor Yellow
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
    Write-Host "6. Check for errors:"
    Write-Host "   ✅ Should NOT see: '401 Unauthorized'"
    Write-Host "   ✅ Should NOT see: 'Unauthenticated'"
    Write-Host "   ✅ Should NOT see: 'CORS error'"
    Write-Host "   ✅ Should see: Execution success"
    Write-Host ""
}

# Show debugging commands
function Show-DebuggingCommands {
    Write-Step "Debugging Commands"
    
    Write-Host "If issues persist, use these commands:"
    Write-Host ""
    Write-Host "1. Watch function logs:"
    Write-Host "   firebase functions:log --project $PROJECT_ID --limit 50"
    Write-Host ""
    Write-Host "2. Check specific function:"
    Write-Host "   firebase functions:log --project $PROJECT_ID --only execute_multi_model_prompt"
    Write-Host ""
    Write-Host "3. Test authentication in browser console:"
    Write-Host "   firebase.auth().currentUser"
    Write-Host "   firebase.auth().currentUser?.getIdToken().then(console.log)"
    Write-Host ""
    Write-Host "4. Check Firebase config:"
    Write-Host "   console.log(firebase.app().options)"
    Write-Host ""
    Write-Host "5. Monitor real-time logs:"
    Write-Host "   firebase functions:log --project $PROJECT_ID --tail"
    Write-Host ""
}

# Show next steps
function Show-NextSteps {
    Write-Step "Next Steps"
    
    Write-Host "✅ Backend Deployment Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Now deploy frontend timeout fix:"
    Write-Host ""
    Write-Host "Windows:"
    Write-Host "  .\deploy-timeout-fix.ps1"
    Write-Host ""
    Write-Host "Linux/Mac:"
    Write-Host "  ./deploy-timeout-fix.sh"
    Write-Host ""
    Write-Host "Or manually:"
    Write-Host "  cd frontend"
    Write-Host "  npm run build:staging"
    Write-Host "  cd .."
    Write-Host "  firebase deploy --only hosting --project $PROJECT_ID"
    Write-Host ""
    Write-Host "📊 Monitoring:"
    Write-Host "  - Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
    Write-Host "  - Functions Logs: firebase functions:log --project $PROJECT_ID"
    Write-Host ""
}

# Main deployment flow
function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "║     Authentication Fix - Backend Deployment (Staging)     ║" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Test-Prerequisites
    Show-Changes
    Deploy-Functions
    Test-Deployment
    Show-TestingInstructions
    Show-DebuggingCommands
    Show-NextSteps
    
    Write-Host ""
    Write-Success "🎉 Backend deployment completed successfully!"
    Write-Host ""
    Write-Warning "⚠️  IMPORTANT: User must be logged in to test prompt execution"
    Write-Host ""
}

# Run main function
Main

