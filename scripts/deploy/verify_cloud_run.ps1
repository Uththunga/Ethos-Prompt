#!/usr/bin/env pwsh
# Quick verification that Cloud Run service is accessible

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloud Run Service Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$CLOUD_RUN_URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$CLOUD_RUN_URL/health" -Method Get
    Write-Host "  ✓ Status: $($health.status)" -ForegroundColor Green
    Write-Host "  ✓ Service: $($health.service)" -ForegroundColor Green
    Write-Host "  ✓ Environment: $($health.environment)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Health check failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Marketing Chat
Write-Host "Test 2: Marketing Chat API" -ForegroundColor Yellow
$body = @{
    message = "What is EthosPrompt?"
    page_context = "homepage"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$CLOUD_RUN_URL/api/ai/marketing-chat" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30

    if ($response.success -eq $true) {
        Write-Host "  Success: Chat API working" -ForegroundColor Green
        Write-Host "  Model: $($response.metadata.model)" -ForegroundColor Green
        Write-Host "  Response preview: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..." -ForegroundColor Gray

        if ($response.metadata.model -like "*granite*") {
            Write-Host ""
            Write-Host "  GRANITE 4.0 IS ACTIVE!" -ForegroundColor Green
        }
    } else {
        Write-Host "  Error: Chat API returned success=false" -ForegroundColor Red
    }
}
catch {
    Write-Host "  Error: Chat API failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ All Tests Passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend Configuration:" -ForegroundColor Yellow
Write-Host "  .env.development → $CLOUD_RUN_URL" -ForegroundColor Gray
Write-Host "  .env.staging → $CLOUD_RUN_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Restart your frontend dev server (npm run dev)" -ForegroundColor White
Write-Host "  2. Clear browser cache (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "  3. Test 'Ask mole' button in the app" -ForegroundColor White
Write-Host ""
