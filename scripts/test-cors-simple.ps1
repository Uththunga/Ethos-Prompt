# Simple CORS Testing Script for Firebase Emulators
# This script tests CORS functionality with Firebase emulators

param(
    [switch]$SkipPlaywright
)

$ErrorActionPreference = 'Stop'

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CORS Testing Suite - Firebase Emulators" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$frontendDir = Join-Path $projectRoot "frontend"
$jdkPath = Join-Path $projectRoot ".tools\jdk\temurin-17\jdk-17.0.16+8"

# Setup Java
Write-Host "Setting up Java environment..." -ForegroundColor Cyan

if (-not (Test-Path $jdkPath)) {
    Write-Host "Downloading portable JDK..." -ForegroundColor Yellow
    & powershell -ExecutionPolicy Bypass -File "$scriptDir\download-portable-jdk.ps1"
}

$env:JAVA_HOME = $jdkPath
$env:PATH = "$jdkPath\bin;$env:PATH"

try {
    $javaOutput = & java -version 2>&1
    Write-Host "Java: OK" -ForegroundColor Green
} catch {
    Write-Host "Java: $javaOutput" -ForegroundColor Green
}

# Check Firebase CLI
Write-Host "`nChecking Firebase CLI..." -ForegroundColor Cyan
try {
    $firebaseVersion = npx firebase --version
    Write-Host "Firebase CLI: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Firebase CLI not found" -ForegroundColor Red
    Write-Host "Install with: npm install firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Start emulators
Write-Host "`nStarting Firebase Emulators..." -ForegroundColor Cyan
Write-Host "This may take 30-60 seconds...`n" -ForegroundColor Gray

$emulatorJob = Start-Job -ScriptBlock {
    param($root, $java)
    $env:JAVA_HOME = $java
    $env:PATH = "$java\bin;$env:PATH"
    Set-Location $root
    npx firebase emulators:start --only auth,firestore,functions,storage 2>&1
} -ArgumentList $projectRoot, $jdkPath

# Wait for emulators
$maxWait = 60
$waited = 0
$ready = $false

Write-Host "Waiting for emulators..." -ForegroundColor Cyan

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds 2
    $waited += 2

    $authReady = Test-NetConnection -ComputerName localhost -Port 9099 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    $firestoreReady = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    $functionsReady = Test-NetConnection -ComputerName localhost -Port 5001 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue

    if ($authReady.TcpTestSucceeded -and $firestoreReady.TcpTestSucceeded -and $functionsReady.TcpTestSucceeded) {
        $ready = $true
        break
    }

    Write-Host "." -NoNewline
}

Write-Host ""

if (-not $ready) {
    Write-Host "ERROR: Emulators failed to start" -ForegroundColor Red
    Stop-Job $emulatorJob
    Remove-Job $emulatorJob
    exit 1
}

Write-Host "Emulators are ready!" -ForegroundColor Green
Write-Host "  Auth:      http://localhost:9099" -ForegroundColor Gray
Write-Host "  Firestore: http://localhost:8080" -ForegroundColor Gray
Write-Host "  Functions: http://localhost:5001" -ForegroundColor Gray
Write-Host "  UI:        http://localhost:4000" -ForegroundColor Gray

Start-Sleep -Seconds 3

# Test 1: Health Check
Write-Host "`nTest 1: Health Check" -ForegroundColor Cyan

# Try different project IDs
$projectIds = @("rag-prompt-library", "demo-test", "react-app-000730")
$testPassed = $false

foreach ($projectId in $projectIds) {
    try {
        $url = "http://localhost:5001/$projectId/australia-southeast1/api"
        $response = Invoke-RestMethod -Uri $url `
            -Method POST `
            -ContentType "application/json" `
            -Body '{"data":{"endpoint":"health"}}' `
            -ErrorAction Stop

        if ($response.result.status -eq "success") {
            Write-Host "  PASS: Health check successful (project: $projectId)" -ForegroundColor Green
            $testPassed = $true
            $workingProjectId = $projectId
            break
        }
    } catch {
        # Try next project ID
    }
}

if (-not $testPassed) {
    Write-Host "  FAIL: Could not connect to any project ID" -ForegroundColor Red
}

# Test 2: Available Models (if Test 1 passed)
if ($testPassed) {
    Write-Host "`nTest 2: Get Available Models" -ForegroundColor Cyan
    try {
        $url = "http://localhost:5001/$workingProjectId/australia-southeast1/api"
        $response = Invoke-RestMethod -Uri $url `
            -Method POST `
            -ContentType "application/json" `
            -Body '{"data":{"endpoint":"get_available_models"}}' `
            -ErrorAction Stop

        if ($response.result.models) {
            Write-Host "  PASS: Retrieved $($response.result.models.Count) models" -ForegroundColor Green
        } else {
            Write-Host "  FAIL: No models returned" -ForegroundColor Red
        }
    } catch {
        Write-Host "  FAIL: $_" -ForegroundColor Red
    }
} else {
    Write-Host "`nTest 2: Get Available Models - SKIPPED (Test 1 failed)" -ForegroundColor Yellow
}

# Test 3: Playwright E2E (if not skipped)
if (-not $SkipPlaywright) {
    Write-Host "`nTest 3: Playwright E2E CORS Tests" -ForegroundColor Cyan

    $playwrightInstalled = Test-Path "$frontendDir\node_modules\@playwright"

    if ($playwrightInstalled) {
        Push-Location $frontendDir

        $browsersInstalled = Test-Path "$env:USERPROFILE\AppData\Local\ms-playwright"
        if (-not $browsersInstalled) {
            Write-Host "  Installing Playwright browsers..." -ForegroundColor Yellow
            npx playwright install chromium
        }

        $env:VITE_ENABLE_EMULATORS = "true"

        Write-Host "  Running E2E tests..." -ForegroundColor Cyan
        npx playwright test e2e/cors.spec.ts --project=chromium --reporter=list

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PASS: Playwright tests passed" -ForegroundColor Green
        } else {
            Write-Host "  FAIL: Playwright tests failed" -ForegroundColor Red
        }

        Pop-Location
    } else {
        Write-Host "  SKIP: Playwright not installed" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nTest 3: Playwright E2E CORS Tests - SKIPPED" -ForegroundColor Yellow
}

# Cleanup
Write-Host "`nCleaning up..." -ForegroundColor Cyan
Stop-Job $emulatorJob
Remove-Job $emulatorJob

Write-Host "`nDone!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Review test results above" -ForegroundColor White
Write-Host "  2. If all tests passed, mark task 1.7 as complete" -ForegroundColor White
Write-Host "  3. Proceed to task 1.8 (Deploy to staging)" -ForegroundColor White
