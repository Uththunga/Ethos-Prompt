# ============================================================================
# Load & Stress Test
# ============================================================================
# Simulates high load to test agent stability and rate limiting
# ============================================================================

param(
    [string]$Environment = "staging",
    [int]$Duration = 30,  # seconds
    [int]$RampUpTime = 5  # seconds
)

$STAGING_API_BASE = "https://marketing-api-857724136585.australia-southeast1.run.app"
$STREAM_URL = "$STAGING_API_BASE/api/ai/marketing-chat/stream"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
Write-Host "  LOAD & STRESS TEST - ⚠️  HIGH LOAD WARNING" -ForegroundColor Red
Write-Host "  Duration: ${Duration}s | Ramp-up: ${RampUpTime}s" -ForegroundColor Red
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Red

$queries = @(
    "What are your pricing plans?",
    "Tell me about services",
    "How does it work?",
    "Request consultation",
    "What features?"
)

$results = @()
$startTime = Get-Date
$endTime = $startTime.AddSeconds($Duration)
$requestCount = 0
$successCount = 0
$errorCount = 0
$rateLimitCount = 0

Write-Host "🚀 Starting load test...`n" -ForegroundColor Yellow

while ((Get-Date) -lt $endTime) {
    $requestCount++
    $query = $queries[$requestCount % $queries.Count]
    $url = "$STREAM_URL?message=$([System.Web.HttpUtility]::UrlEncode($query))`&page_context=unknown"

    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 10 -ErrorAction Stop
        $sw.Stop()

        if ($response.StatusCode -eq 200) {
            $successCount++
            Write-Host "  ✅ Request $requestCount : ${sw.ElapsedMilliseconds}ms" -ForegroundColor Green
        }

        $results += @{
            RequestNum = $requestCount
            Success = $true
            ResponseMs = $sw.ElapsedMilliseconds
            Status = $response.StatusCode
        }

    } catch {
        $sw.Stop()

        if ($_.Exception.Message -match "429|Rate limit") {
            $rateLimitCount++
            Write-Host "  ⚠️  Request $requestCount : RATE LIMITED" -ForegroundColor Yellow
        } else {
            $errorCount++
            Write-Host "  ❌ Request $requestCount : ERROR" -ForegroundColor Red
        }

        $results += @{
            RequestNum = $requestCount
            Success = $false
            ResponseMs = $sw.ElapsedMilliseconds
            Error = $_.Exception.Message
        }
    }

    # Small delay
    Start-Sleep -Milliseconds 100
}

# Summary
Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  LOAD TEST RESULTS" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$actualDuration = ((Get-Date) - $startTime).TotalSeconds
$requestsPerSec = $requestCount / $actualDuration

Write-Host "Requests: $requestCount total" -ForegroundColor White
Write-Host "Successful: $successCount" -ForegroundColor Green
Write-Host "Errors: $errorCount" -ForegroundColor Red
Write-Host "Rate Limited: $rateLimitCount" -ForegroundColor Yellow
Write-Host "Duration: $([Math]::Round($actualDuration, 1))s" -ForegroundColor White
Write-Host "Throughput: $([Math]::Round($requestsPerSec, 2)) req/sec`n" -ForegroundColor Cyan

# Save results
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path "test-results/performance" | Out-Null
@{
    Results = $results
    Summary = @{
        TotalRequests = $requestCount
        Successful = $successCount
        Errors = $errorCount
        RateLimited = $rateLimitCount
        ThroughputReqSec = $requestsPerSec
    }
} | ConvertTo-Json -Depth 10 | Out-File "test-results/performance/load_test_$timestamp.json"

Write-Host "✅ Results saved`n" -ForegroundColor Green
