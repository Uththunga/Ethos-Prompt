# Deploy Timeout Fix to Staging (PowerShell)
# This script deploys the prompt execution timeout fix to the staging environment

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
        $null = firebase --version
        Write-Success "Firebase CLI found"
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
    
    # Check if npm is installed
    try {
        $npmVersion = npm --version
        Write-Success "npm found: $npmVersion"
    } catch {
        Write-Error "npm not found. Please install npm"
        exit 1
    }
}

# Show summary of changes
function Show-Changes {
    Write-Step "Summary of Changes"
    
    Write-Host "This deployment includes the following fixes:"
    Write-Host ""
    Write-Host "1. Frontend Watchdog Timer Fix"
    Write-Host "   - File: frontend/src/components/execution/PromptExecutor.tsx"
    Write-Host "   - Change: 5s → 150s timeout (staging)"
    Write-Host "   - Impact: Prevents false-positive timeouts"
    Write-Host ""
    Write-Host "2. Streaming Execution Timeout Fix"
    Write-Host "   - File: frontend/src/hooks/useStreamingExecution.ts"
    Write-Host "   - Change: 5s → 150s timeout (staging)"
    Write-Host "   - Impact: Consistent timeout across all execution modes"
    Write-Host ""
    Write-Host "3. Enhanced Error Handling"
    Write-Host "   - Better error messages for users"
    Write-Host "   - Comprehensive logging for debugging"
    Write-Host "   - Model performance suggestions"
    Write-Host ""
    
    if (-not $SkipConfirmation) {
        $response = Read-Host "Continue with deployment? (y/n)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Warning "Deployment cancelled by user"
            exit 0
        }
    }
}

# Build frontend
function Build-Frontend {
    Write-Step "Building Frontend for Staging"
    
    Push-Location frontend
    
    try {
        Write-Info "Installing dependencies..."
        npm ci
        if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
        Write-Success "Dependencies installed"
        
        Write-Info "Building frontend with staging configuration..."
        npm run build:staging
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
        Write-Success "Frontend built successfully"
    } catch {
        Write-Error "Build failed: $_"
        Pop-Location
        exit 1
    } finally {
        Pop-Location
    }
}

# Deploy to Firebase Hosting
function Deploy-Hosting {
    Write-Step "Deploying to Firebase Hosting (Staging)"
    
    Write-Info "Deploying to project: $PROJECT_ID"
    firebase deploy --only hosting --project $PROJECT_ID
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend deployed successfully"
        Write-Host ""
        Write-Success "Deployment URL: https://$PROJECT_ID.web.app"
    } else {
        Write-Error "Deployment failed"
        exit 1
    }
}

# Verify deployment
function Test-Deployment {
    Write-Step "Verifying Deployment"
    
    $url = "https://$PROJECT_ID.web.app"
    
    Write-Info "Checking if site is accessible..."
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Success "Site is accessible"
        }
    } catch {
        Write-Warning "Site may not be fully deployed yet. Please check manually."
    }
    
    Write-Host ""
    Write-Info "Please verify the fix by:"
    Write-Host "1. Navigate to: $url/dashboard/prompts/KIcc8OOyJhcoQh5oZzCU/execute"
    Write-Host "2. Execute the prompt"
    Write-Host "3. Check browser console for logs:"
    Write-Host "   - 🚀 Starting prompt execution"
    Write-Host "   - ✅ Prompt execution completed successfully"
    Write-Host "   - 🏁 Execution finished"
    Write-Host "4. Verify execution completes without timeout"
}

# Show next steps
function Show-NextSteps {
    Write-Step "Next Steps"
    
    Write-Host "✅ Deployment Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Testing Checklist:"
    Write-Host ""
    Write-Host "1. Test Normal Execution:"
    Write-Host "   - URL: https://$PROJECT_ID.web.app/dashboard/prompts/KIcc8OOyJhcoQh5oZzCU/execute"
    Write-Host "   - Expected: Completes in 10-20 seconds"
    Write-Host "   - Check: No timeout errors"
    Write-Host ""
    Write-Host "2. Test Slow Model:"
    Write-Host "   - Select: Llama 3.3 70B or similar"
    Write-Host "   - Expected: Completes in 30-60 seconds"
    Write-Host "   - Check: No false-positive timeouts"
    Write-Host ""
    Write-Host "3. Monitor Logs:"
    Write-Host "   - Browser Console: Check for execution logs"
    Write-Host "   - Firebase Functions: firebase functions:log --project $PROJECT_ID"
    Write-Host ""
    Write-Host "4. Report Issues:"
    Write-Host "   - If timeouts still occur, check PROMPT_EXECUTION_TIMEOUT_FIX_REPORT.md"
    Write-Host "   - Collect browser console logs"
    Write-Host "   - Note execution time and model used"
    Write-Host ""
    Write-Host "📊 Monitoring:"
    Write-Host "   - Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
    Write-Host "   - Functions Logs: firebase functions:log --project $PROJECT_ID"
    Write-Host ""
}

# Main deployment flow
function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "║     Prompt Execution Timeout Fix - Staging Deployment     ║" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    Test-Prerequisites
    Show-Changes
    Build-Frontend
    Deploy-Hosting
    Test-Deployment
    Show-NextSteps
    
    Write-Host ""
    Write-Success "🎉 Deployment completed successfully!"
    Write-Host ""
}

# Run main function
Main

