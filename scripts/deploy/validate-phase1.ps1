# Phase 1 Validation Tests - Marketing Agent
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Validation Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$url = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat"
$results = @()

# Test 1: Homepage Context
Write-Host "`n[Test 1/3] Homepage Context Test" -ForegroundColor Yellow
$body1 = @{
    message = "What services does EthosPrompt offer?"
    page_context = "homepage"
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $response1 = Invoke-RestMethod -Uri $url -Method Post -Body $body1 -ContentType "application/json" -TimeoutSec 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    $test1Result = @{
        Test = "Homepage Context"
        Success = $response1.success
        Mock = $response1.metadata.mock
        ResponseTime = [math]::Round($duration, 2)
        ResponseLength = $response1.response.Length
        HasSources = ($response1.sources.Count -gt 0)
        HasSuggestions = ($response1.suggested_questions.Count -gt 0)
    }

    Write-Host "  ✓ Success: $($test1Result.Success)" -ForegroundColor Green
    Write-Host "  ✓ Mock Mode: $($test1Result.Mock)" -ForegroundColor $(if($test1Result.Mock -eq $false){"Green"}else{"Red"})
    Write-Host "  ✓ Response Time: $($test1Result.ResponseTime)s" -ForegroundColor $(if($test1Result.ResponseTime -lt 30){"Green"}else{"Yellow"})
    Write-Host "  ✓ Response Length: $($test1Result.ResponseLength) chars" -ForegroundColor Green

    $results += $test1Result
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $results += @{Test = "Homepage Context"; Success = $false; Error = $_.Exception.Message}
}

Start-Sleep -Seconds 2

# Test 2: Solutions Page Context
Write-Host "`n[Test 2/3] Solutions Page Context Test" -ForegroundColor Yellow
$body2 = @{
    message = "Tell me about your RAG capabilities"
    page_context = "solutions_page"
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $response2 = Invoke-RestMethod -Uri $url -Method Post -Body $body2 -ContentType "application/json" -TimeoutSec 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    $test2Result = @{
        Test = "Solutions Page Context"
        Success = $response2.success
        Mock = $response2.metadata.mock
        ResponseTime = [math]::Round($duration, 2)
        ResponseLength = $response2.response.Length
        HasSources = ($response2.sources.Count -gt 0)
        HasSuggestions = ($response2.suggested_questions.Count -gt 0)
    }

    Write-Host "  ✓ Success: $($test2Result.Success)" -ForegroundColor Green
    Write-Host "  ✓ Mock Mode: $($test2Result.Mock)" -ForegroundColor $(if($test2Result.Mock -eq $false){"Green"}else{"Red"})
    Write-Host "  ✓ Response Time: $($test2Result.ResponseTime)s" -ForegroundColor $(if($test2Result.ResponseTime -lt 30){"Green"}else{"Yellow"})
    Write-Host "  ✓ Response Length: $($test2Result.ResponseLength) chars" -ForegroundColor Green

    $results += $test2Result
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $results += @{Test = "Solutions Page Context"; Success = $false; Error = $_.Exception.Message}
}

Start-Sleep -Seconds 2

# Test 3: Pricing Query
Write-Host "`n[Test 3/3] Pricing Query Test" -ForegroundColor Yellow
$body3 = @{
    message = "How much does the Intelligent Applications service cost?"
    page_context = "pricing"
} | ConvertTo-Json

try {
    $startTime = Get-Date
    $response3 = Invoke-RestMethod -Uri $url -Method Post -Body $body3 -ContentType "application/json" -TimeoutSec 30
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds

    $test3Result = @{
        Test = "Pricing Query"
        Success = $response3.success
        Mock = $response3.metadata.mock
        ResponseTime = [math]::Round($duration, 2)
        ResponseLength = $response3.response.Length
        HasSources = ($response3.sources.Count -gt 0)
        HasSuggestions = ($response3.suggested_questions.Count -gt 0)
    }

    Write-Host "  ✓ Success: $($test3Result.Success)" -ForegroundColor Green
    Write-Host "  ✓ Mock Mode: $($test3Result.Mock)" -ForegroundColor $(if($test3Result.Mock -eq $false){"Green"}else{"Red"})
    Write-Host "  ✓ Response Time: $($test3Result.ResponseTime)s" -ForegroundColor $(if($test3Result.ResponseTime -lt 30){"Green"}else{"Yellow"})
    Write-Host "  ✓ Response Length: $($test3Result.ResponseLength) chars" -ForegroundColor Green

    $results += $test3Result
} catch {
    Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    $results += @{Test = "Pricing Query"; Success = $false; Error = $_.Exception.Message}
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Validation Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.Success -eq $true }).Count
$totalTests = $results.Count
$avgResponseTime = ($results | Where-Object { $_.ResponseTime } | Measure-Object -Property ResponseTime -Average).Average

Write-Host "`nTests Passed: $successCount/$totalTests" -ForegroundColor $(if($successCount -eq $totalTests){"Green"}else{"Yellow"})
Write-Host "Average Response Time: $([math]::Round($avgResponseTime, 2))s" -ForegroundColor Green
Write-Host "All in Real Mode: $(($results | Where-Object { $_.Mock -eq $false }).Count -eq $totalTests)" -ForegroundColor $(if(($results | Where-Object { $_.Mock -eq $false }).Count -eq $totalTests){"Green"}else{"Red"})

Write-Host "`nPhase 1 Validation Complete!" -ForegroundColor Green
