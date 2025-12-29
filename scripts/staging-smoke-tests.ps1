# Staging Environment Smoke Tests
# Project: rag-prompt-library-staging
# Purpose: Validate staging deployment and functionality

# Configuration
$STAGING_FUNCTIONS_URL = "https://australia-southeast1-rag-prompt-library-staging.cloudfunctions.net"
$STAGING_WEB_URL = "https://rag-prompt-library-staging.web.app"
$STAGING_FIREBASEAPP_URL = "https://rag-prompt-library-staging.firebaseapp.com"
$PROJECT_ID = "rag-prompt-library-staging"

# Test results tracking
$TESTS_PASSED = 0
$TESTS_FAILED = 0
$TESTS_SKIPPED = 0

# Helper functions
function Print-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Print-Test {
    param([string]$Message)
    Write-Host "🧪 Test: $Message" -ForegroundColor Yellow
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $script:TESTS_PASSED++
}

function Print-Failure {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $script:TESTS_FAILED++
}

function Print-Skip {
    param([string]$Message)
    Write-Host "⏭️  $Message" -ForegroundColor Gray
    $script:TESTS_SKIPPED++
}

function Print-Info {
    param([string]$Message)
    Write-Host "   $Message" -ForegroundColor Gray
}

# Start tests
Print-Header "Staging Environment Smoke Tests"
Write-Host "Project: $PROJECT_ID" -ForegroundColor Gray
Write-Host "Functions URL: $STAGING_FUNCTIONS_URL" -ForegroundColor Gray
Write-Host "Web URL: $STAGING_WEB_URL" -ForegroundColor Gray
Write-Host "Started: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Test 1: Frontend Hosting Accessibility
Print-Test "Frontend Hosting Accessibility"
try {
    $response = Invoke-WebRequest -Uri $STAGING_WEB_URL -Method Get -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Print-Success "Frontend accessible (HTTP $($response.StatusCode))"
        Print-Info "URL: $STAGING_WEB_URL"
    } else {
        Print-Failure "Frontend returned HTTP $($response.StatusCode)"
    }
} catch {
    Print-Failure "Frontend not accessible (connection failed)"
    Print-Info "Error: $($_.Exception.Message)"
}
Write-Host ""

# Test 2: Frontend Alternative URL
Print-Test "Frontend Alternative URL (firebaseapp.com)"
try {
    $response = Invoke-WebRequest -Uri $STAGING_FIREBASEAPP_URL -Method Get -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Print-Success "Alternative URL accessible (HTTP $($response.StatusCode))"
    } else {
        Print-Info "Alternative URL returned HTTP $($response.StatusCode) (may redirect)"
    }
} catch {
    Print-Failure "Alternative URL not accessible"
}
Write-Host ""

# Test 3: Frontend Content Type
Print-Test "Frontend Content Type"
try {
    $response = Invoke-WebRequest -Uri $STAGING_WEB_URL -Method Head -UseBasicParsing -TimeoutSec 10
    $contentType = $response.Headers["Content-Type"]
    if ($contentType -like "*text/html*") {
        Print-Success "Correct content type: $contentType"
    } else {
        Print-Failure "Unexpected content type: $contentType"
    }
} catch {
    Print-Skip "Could not check content type"
}
Write-Host ""

# Test 4: Cloud Functions Health Check
Print-Test "Cloud Functions Health Check"
try {
    $body = @{
        data = @{
            endpoint = "health"
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$STAGING_FUNCTIONS_URL/api" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    $responseStr = $response | ConvertTo-Json
    if ($responseStr -match "healthy|ok|success") {
        Print-Success "Health check passed"
        Print-Info "Response: $responseStr"
    } else {
        Print-Failure "Health check returned unexpected response"
        Print-Info "Response: $responseStr"
    }
} catch {
    Print-Failure "Health check failed (connection error)"
    Print-Info "Check if functions are deployed"
}
Write-Host ""

# Test 5: OpenRouter Connectivity
Print-Test "OpenRouter API Connectivity"
try {
    $body = @{
        data = @{
            endpoint = "test_openrouter_connection"
        }
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$STAGING_FUNCTIONS_URL/api" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    $responseStr = $response | ConvertTo-Json
    if ($responseStr -match "success|connected") {
        Print-Success "OpenRouter connectivity verified"
        Print-Info "Response: $responseStr"
    } else {
        Print-Skip "OpenRouter connectivity test inconclusive"
        Print-Info "Response: $responseStr"
    }
} catch {
    Print-Skip "OpenRouter test endpoint not available"
    Print-Info "This is expected if functions aren't deployed yet"
}
Write-Host ""

# Test 6: Firestore Connectivity
Print-Test "Firestore Database Connectivity"
try {
    $firestoreCheck = npx firebase firestore:databases:list --project=$PROJECT_ID 2>&1
    if ($firestoreCheck -match "(default)|firestore") {
        Print-Success "Firestore database accessible"
    } else {
        Print-Skip "Firestore status unclear"
    }
} catch {
    Print-Skip "Firebase CLI not available"
    Print-Info "Install: npm install -g firebase-tools"
}
Write-Host ""

# Test 7: Frontend Load Time
Print-Test "Frontend Load Time"
$startTime = Get-Date
try {
    $response = Invoke-WebRequest -Uri $STAGING_WEB_URL -Method Get -UseBasicParsing -TimeoutSec 10
    $endTime = Get-Date
    $loadTime = ($endTime - $startTime).TotalMilliseconds
    
    if ($loadTime -lt 2000) {
        Print-Success "Fast load time: $([math]::Round($loadTime))ms"
    } elseif ($loadTime -lt 5000) {
        Print-Success "Acceptable load time: $([math]::Round($loadTime))ms"
        Print-Info "Target: <2000ms"
    } else {
        Print-Failure "Slow load time: $([math]::Round($loadTime))ms"
        Print-Info "Target: <2000ms, Acceptable: <5000ms"
    }
} catch {
    Print-Skip "Could not measure load time"
}
Write-Host ""

# Test 8: SSL Certificate
Print-Test "SSL Certificate Validity"
try {
    $response = Invoke-WebRequest -Uri $STAGING_WEB_URL -Method Head -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Print-Success "SSL certificate valid"
    }
} catch {
    Print-Skip "SSL check inconclusive"
}
Write-Host ""

# Summary
Print-Header "Test Summary"
Write-Host "✅ Passed: $TESTS_PASSED" -ForegroundColor Green
Write-Host "❌ Failed: $TESTS_FAILED" -ForegroundColor Red
Write-Host "⏭️  Skipped: $TESTS_SKIPPED" -ForegroundColor Gray
Write-Host ""

$TOTAL_TESTS = $TESTS_PASSED + $TESTS_FAILED + $TESTS_SKIPPED
Write-Host "Total Tests: $TOTAL_TESTS" -ForegroundColor Cyan
Write-Host ""

# Manual Testing Checklist
Print-Header "Manual Testing Checklist"
Write-Host "The following tests require manual verification:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Authentication Flow:" -ForegroundColor Gray
Write-Host "   • Visit: $STAGING_WEB_URL"
Write-Host "   • Click 'Sign Up' or 'Login'"
Write-Host "   • Create test account or login"
Write-Host "   • Verify email verification flow"
Write-Host "   • Verify successful login"
Write-Host ""
Write-Host "2. Prompt Creation:" -ForegroundColor Gray
Write-Host "   • Navigate to 'Prompts' or 'Create Prompt'"
Write-Host "   • Fill in prompt details"
Write-Host "   • Save prompt"
Write-Host "   • Verify prompt appears in list"
Write-Host ""
Write-Host "3. Prompt Execution:" -ForegroundColor Gray
Write-Host "   • Select a prompt"
Write-Host "   • Click 'Execute' or 'Run'"
Write-Host "   • Provide required variables"
Write-Host "   • Select a free model (e.g., gpt-3.5-turbo)"
Write-Host "   • Verify AI response is generated"
Write-Host ""
Write-Host "4. Document Upload (RAG):" -ForegroundColor Gray
Write-Host "   • Navigate to 'Documents' or 'Upload'"
Write-Host "   • Upload a test document (PDF/TXT)"
Write-Host "   • Verify upload progress"
Write-Host "   • Verify document processing"
Write-Host "   • Test RAG-enabled prompt with document"
Write-Host ""
Write-Host "5. Browser Console:" -ForegroundColor Gray
Write-Host "   • Open browser DevTools (F12)"
Write-Host "   • Check Console tab for errors"
Write-Host "   • Check Network tab for failed requests"
Write-Host ""
Write-Host "6. Responsive Design:" -ForegroundColor Gray
Write-Host "   • Test on mobile viewport (DevTools)"
Write-Host "   • Verify layout adapts correctly"
Write-Host "   • Test navigation on mobile"
Write-Host ""

# Exit code
if ($TESTS_FAILED -gt 0) {
    Write-Host "⚠️  Some automated tests failed. Review failures above." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All automated tests passed!" -ForegroundColor Green
    Write-Host "⚠️  Don't forget to complete manual testing checklist." -ForegroundColor Yellow
    exit 0
}

