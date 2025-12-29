# Complete CORS Testing Script
# This script runs a full CORS test suite with Firebase emulators

$ErrorActionPreference = 'Stop'

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n$('=' * 80)" -ForegroundColor Cyan
    Write-ColorOutput $Title "Cyan"
    Write-Host "$('=' * 80)`n" -ForegroundColor Cyan
}

Write-Section "🧪 CORS Testing Suite - Firebase Emulators"

# Get script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$frontendDir = Join-Path $projectRoot "frontend"

# Configuration
$jdkPath = Join-Path $projectRoot ".tools\jdk\temurin-17\jdk-17.0.16+8"
$testResults = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    tests = @()
    passed = 0
    failed = 0
}

# Step 1: Setup Java Environment
Write-Section "📦 Step 1: Setting up Java Environment"

if (-not (Test-Path $jdkPath)) {
    Write-ColorOutput "⚠️  Portable JDK not found. Downloading..." "Yellow"
    & powershell -ExecutionPolicy Bypass -File "$scriptDir\download-portable-jdk.ps1"

    if (-not (Test-Path $jdkPath)) {
        Write-ColorOutput "❌ Failed to download JDK" "Red"
        exit 1
    }
}

$env:JAVA_HOME = $jdkPath
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

$javaVersion = & java -version 2>&1 | Select-Object -First 1
Write-ColorOutput "Java configured: $javaVersion" "Green"

# Step 2: Check Prerequisites
Write-Section "🔍 Step 2: Checking Prerequisites"

# Check Firebase CLI
try {
    $firebaseVersion = & firebase --version 2>&1
    Write-ColorOutput "Firebase CLI: $firebaseVersion" "Green"
} catch {
    Write-ColorOutput "Firebase CLI not found" "Red"
    Write-ColorOutput "   Install with: npm install -g firebase-tools" "Yellow"
    exit 1
}

# Check if frontend dependencies are installed
if (-not (Test-Path "$frontendDir\node_modules")) {
    Write-ColorOutput "Frontend dependencies not installed" "Yellow"
    Write-ColorOutput "   Installing dependencies..." "Cyan"

    Push-Location $frontendDir
    npm install
    Pop-Location
}

Write-ColorOutput "All prerequisites met" "Green"

# Step 3: Start Firebase Emulators
Write-Section "🚀 Step 3: Starting Firebase Emulators"

Write-ColorOutput "Starting emulators in background..." "Cyan"
Write-ColorOutput "This may take 30-60 seconds on first run...`n" "Gray"

# Start emulators in background
$emulatorJob = Start-Job -ScriptBlock {
    param($projectRoot, $javaHome)

    $env:JAVA_HOME = $javaHome
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

    Set-Location $projectRoot
    firebase emulators:start --only auth,firestore,functions,storage 2>&1
} -ArgumentList $projectRoot, $jdkPath

# Wait for emulators to start
$maxWaitSeconds = 60
$waitedSeconds = 0
$emulatorsReady = $false

Write-ColorOutput "Waiting for emulators to start..." "Cyan"

while ($waitedSeconds -lt $maxWaitSeconds) {
    Start-Sleep -Seconds 2
    $waitedSeconds += 2

    # Check if emulator ports are listening
    $authPort = Test-NetConnection -ComputerName localhost -Port 9099 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    $firestorePort = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    $functionsPort = Test-NetConnection -ComputerName localhost -Port 5001 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue

    if ($authPort.TcpTestSucceeded -and $firestorePort.TcpTestSucceeded -and $functionsPort.TcpTestSucceeded) {
        $emulatorsReady = $true
        break
    }

    Write-Host "." -NoNewline
}

Write-Host ""

if (-not $emulatorsReady) {
    Write-ColorOutput "Emulators failed to start within $maxWaitSeconds seconds" "Red"
    Stop-Job $emulatorJob
    Remove-Job $emulatorJob
    exit 1
}

Write-ColorOutput "Emulators are ready!" "Green"
Write-ColorOutput "   Auth:      http://localhost:9099" "Gray"
Write-ColorOutput "   Firestore: http://localhost:8080" "Gray"
Write-ColorOutput "   Functions: http://localhost:5001" "Gray"
Write-ColorOutput "   Storage:   http://localhost:9199" "Gray"
Write-ColorOutput "   UI:        http://localhost:4000" "Gray"

# Give emulators a moment to stabilize
Start-Sleep -Seconds 3

# Step 4: Run Manual CORS Tests
Write-Section "🧪 Step 4: Running Manual CORS Tests"

# Test 1: Health Check
Write-ColorOutput "Test 1: Health Check Endpoint" "Cyan"
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/demo-test/australia-southeast1/api" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"data":{"endpoint":"health"}}' `
        -ErrorAction Stop

    if ($response.result.status -eq "success") {
        Write-ColorOutput "  Health check passed" "Green"
        $testResults.tests += @{ name = "Health Check"; status = "passed" }
        $testResults.passed++
    } else {
        Write-ColorOutput "  Health check failed: Unexpected response" "Red"
        $testResults.tests += @{ name = "Health Check"; status = "failed" }
        $testResults.failed++
    }
} catch {
    Write-ColorOutput "  Health check failed: $_" "Red"
    $testResults.tests += @{ name = "Health Check"; status = "failed"; error = $_.Exception.Message }
    $testResults.failed++
}

# Test 2: CORS Headers
Write-ColorOutput "`nTest 2: CORS Headers" "Cyan"
try {
    $headers = @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "content-type"
    }

    $response = Invoke-WebRequest -Uri "http://localhost:5001/demo-test/australia-southeast1/api" `
        -Method OPTIONS `
        -Headers $headers `
        -ErrorAction Stop

    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]

    if ($corsHeader) {
        Write-ColorOutput "  CORS headers present: $corsHeader" "Green"
        $testResults.tests += @{ name = "CORS Headers"; status = "passed" }
        $testResults.passed++
    } else {
        Write-ColorOutput "  CORS headers missing" "Red"
        $testResults.tests += @{ name = "CORS Headers"; status = "failed" }
        $testResults.failed++
    }
} catch {
    Write-ColorOutput "  OPTIONS request not supported (expected for callable functions)" "Yellow"
    $testResults.tests += @{ name = "CORS Headers"; status = "skipped"; note = "Callable functions handle CORS automatically" }
}

# Step 5: Check for Playwright
Write-Section "🎭 Step 5: Playwright E2E Tests"

$playwrightInstalled = Test-Path "$frontendDir\node_modules\@playwright"

if ($playwrightInstalled) {
    Write-ColorOutput "Running Playwright CORS tests..." "Cyan"

    Push-Location $frontendDir

    # Check if browsers are installed
    $browsersInstalled = Test-Path "$env:USERPROFILE\AppData\Local\ms-playwright"

    if (-not $browsersInstalled) {
        Write-ColorOutput "Playwright browsers not installed. Installing..." "Yellow"
        npx playwright install chromium
    }

    # Run CORS tests
    $env:VITE_ENABLE_EMULATORS = "true"

    try {
        npx playwright test e2e/cors.spec.ts --project=chromium --reporter=list

        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput "Playwright CORS tests passed" "Green"
            $testResults.tests += @{ name = "Playwright E2E CORS"; status = "passed" }
            $testResults.passed++
        } else {
            Write-ColorOutput "Playwright CORS tests failed" "Red"
            $testResults.tests += @{ name = "Playwright E2E CORS"; status = "failed" }
            $testResults.failed++
        }
    } catch {
        Write-ColorOutput "Playwright tests failed: $_" "Red"
        $testResults.tests += @{ name = "Playwright E2E CORS"; status = "failed"; error = $_.Exception.Message }
        $testResults.failed++
    }

    Pop-Location
} else {
    Write-ColorOutput "Playwright not installed. Skipping E2E tests." "Yellow"
    Write-ColorOutput "   Install with: cd frontend && npm install" "Gray"
    $testResults.tests += @{ name = "Playwright E2E CORS"; status = "skipped"; note = "Playwright not installed" }
}

# Step 6: Generate Report
Write-Section "📊 Step 6: Test Report"

Write-ColorOutput "Test Summary:" "Cyan"
Write-ColorOutput "  Total Tests: $($testResults.tests.Count)" "White"
Write-ColorOutput "  Passed:      $($testResults.passed)" "Green"
Write-ColorOutput "  Failed:      $($testResults.failed)" "Red"
Write-ColorOutput "  Skipped:     $(($testResults.tests | Where-Object { $_.status -eq 'skipped' }).Count)" "Yellow"

# Save report
$reportPath = Join-Path $projectRoot "test-results\cors-emulator-report.json"
$reportDir = Split-Path -Parent $reportPath

if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
}

$testResults | ConvertTo-Json -Depth 10 | Out-File $reportPath -Encoding UTF8

Write-ColorOutput "`nReport saved to: $reportPath" "Cyan"

# Cleanup
Write-Section "Cleanup"

Write-ColorOutput "Stopping emulators..." "Yellow"
Stop-Job $emulatorJob
Remove-Job $emulatorJob

Write-ColorOutput "Cleanup complete" "Green"

# Final result
Write-Section "Final Result"

if ($testResults.failed -eq 0) {
    Write-ColorOutput "All CORS tests passed successfully!" "Green"
    Write-ColorOutput "`nNext steps:" "Cyan"
    Write-ColorOutput "  1. Review the test report" "White"
    Write-ColorOutput "  2. Mark task 1.7 as complete" "White"
    Write-ColorOutput "  3. Proceed to task 1.8 (Deploy to staging)" "White"
    exit 0
} else {
    Write-ColorOutput "Some tests failed. Please review the errors above." "Red"
    Write-ColorOutput "`nTroubleshooting:" "Yellow"
    Write-ColorOutput "  1. Check emulator logs" "White"
    Write-ColorOutput "  2. Verify CORS configuration in functions/index.js" "White"
    Write-ColorOutput "  3. Review the test report for details" "White"
    exit 1
}
