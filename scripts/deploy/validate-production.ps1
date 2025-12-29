# Production Validation Script
# Validates all deployments in production environment
# Date: 2025-10-19

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRODUCTION VALIDATION - EthosPrompt" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$productionProject = "rag-prompt-library"
$region = "australia-southeast1"
$testsPassed = 0
$testsFailed = 0

# Test 1: Verify httpApi Node.js 20 Runtime
Write-Host "`n[Test 1/6] Verifying httpApi Node.js 20 Runtime..." -ForegroundColor Yellow
try {
    $runtime = gcloud functions describe httpApi --project $productionProject --gen2 --region $region --format="value(buildConfig.runtime)"
    $runtime = $runtime.Trim()

    if ($runtime -eq "nodejs20") {
        Write-Host "  ✓ Runtime: $runtime" -ForegroundColor Green
        $testsPassed++
    } else {
        Write-Host "  ✗ Runtime: $runtime - expected nodejs20" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Verify httpApi Health Check
Write-Host "`n[Test 2/6] Testing httpApi Health Check..." -ForegroundColor Yellow
try {
    $url = "https://httpapi-743998930129.australia-southeast1.run.app/health"
    $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30

    if ($response.status -eq "healthy") {
        Write-Host "  ✓ Health check passed" -ForegroundColor Green
        Write-Host "  Status: $($response.status)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  ✗ Health check failed: $($response.status)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Verify marketing-api Environment Variables
Write-Host "`n[Test 3/6] Verifying marketing-api Environment Variables..." -ForegroundColor Yellow
try {
    $envVars = gcloud run services describe marketing-api --project $productionProject --region $region --format="yaml(spec.template.spec.containers[0].env)"
    $envVarsStr = $envVars -join "`n"

    if (($envVarsStr -match "OPENROUTER_USE_MOCK") -and ($envVarsStr -match "false") -and ($envVarsStr -match "ENVIRONMENT") -and ($envVarsStr -match "production")) {
        Write-Host "  ✓ Environment variables correct" -ForegroundColor Green
        Write-Host "  OPENROUTER_USE_MOCK: false" -ForegroundColor Gray
        Write-Host "  ENVIRONMENT: production" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  ✗ Environment variables incorrect" -ForegroundColor Red
        Write-Host $envVarsStr -ForegroundColor Gray
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 4: Test marketing-api Health Check
Write-Host "`n[Test 4/6] Testing marketing-api Health Check..." -ForegroundColor Yellow
try {
    $url = "https://marketing-api-743998930129.australia-southeast1.run.app/health"
    $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 30

    if ($response.status -eq "healthy") {
        Write-Host "  ✓ Health check passed" -ForegroundColor Green
        Write-Host "  Status: $($response.status)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  ✗ Health check failed: $($response.status)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 5: Test marketing-api Chat (Real Mode)
Write-Host "`n[Test 5/6] Testing marketing-api Chat - Real Mode..." -ForegroundColor Yellow
try {
    $url = "https://marketing-api-743998930129.australia-southeast1.run.app/api/ai/marketing-chat"
    $uuid = [guid]::NewGuid().ToString()

    $body = @{
        message = "What is EthosPrompt?"
        conversation_id = $uuid
        page_context = "homepage"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60

    if ($response.success -and ($response.response -notmatch "MOCK_RESPONSE")) {
        Write-Host "  ✓ Chat test passed - Real mode" -ForegroundColor Green
        Write-Host "  Response length: $($response.response.Length) characters" -ForegroundColor Gray
        Write-Host "  Mock mode: False" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  ✗ Chat test failed or still in mock mode" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Test 6: Verify Frontend Deployment
Write-Host "`n[Test 6/6] Verifying Frontend Deployment..." -ForegroundColor Yellow
try {
    $url = "https://rag-prompt-library.web.app"
    $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 30 -UseBasicParsing

    if ($response.StatusCode -eq 200) {
        Write-Host "  ✓ Frontend accessible" -ForegroundColor Green
        Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor Gray
        $testsPassed++
    } else {
        Write-Host "  ✗ Frontend not accessible: $($response.StatusCode)" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $testsFailed++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VALIDATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$totalTests = $testsPassed + $testsFailed
if ($totalTests -gt 0) {
    $passRate = [math]::Round(($testsPassed / $totalTests) * 100, 2)
} else {
    $passRate = 0
}

$passColor = if ($testsFailed -eq 0) { "Green" } else { "Yellow" }
$failColor = if ($testsFailed -eq 0) { "Green" } else { "Red" }

Write-Host "`nTests Passed: $testsPassed/$totalTests ($passRate%)" -ForegroundColor $passColor
Write-Host "Tests Failed: $testsFailed/$totalTests" -ForegroundColor $failColor

if ($testsFailed -eq 0) {
    Write-Host "`n✅ All validation tests passed!" -ForegroundColor Green
    Write-Host "Production deployment is successful and operational." -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Please review the errors above." -ForegroundColor Yellow
    Write-Host "Check logs and redeploy if necessary." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
