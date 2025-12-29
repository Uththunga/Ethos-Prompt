# ============================================================================
# Response Time Performance Test
# ============================================================================
# Measures end-to-end response times for marketing agent queries
# ============================================================================

param(
    [string]$Environment = "staging",
    [int]$Iterations = 10
)

$STAGING_API_BASE = "https://marketing-api-857724136585.australia-southeast1.run.app"
$STREAM_URL = "$STAGING_API_BASE/api/ai/marketing-chat/stream"

# Test queries (diverse set)
$testQueries = @(
    @{Query="What are your pricing plans?"; Category="pricing"; MinWords=50},
    @{Query="Tell me about your services"; Category="services"; MinWords=50},
    @{Query="How does the Smart Business Assistant work?"; Category="technical"; MinWords=60},
    @{Query="I want to request a consultation"; Category="consultation"; MinWords=30},
    @{Query="What makes your Intelligent Applications unique?"; Category="services"; MinWords=60}
)

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  RESPONSE TIME PERFORMANCE TEST" -ForegroundColor Cyan
Write-Host "  Iterations per query: $Iterations" -ForegroundColor Cyan
Write-Host "  Total tests: $($testQueries.Count * $Iterations)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$allResults = @()

foreach ($testQuery in $testQueries) {
    Write-Host "`nTesting: $($testQuery.Query)" -ForegroundColor Yellow
    Write-Host "─────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

    $queryResults = @()

    for ($i = 1; $i -le $Iterations; $i++) {
        Write-Host "  Iteration $i/$Iterations... " -NoNewline

        # Build URL
        $encodedQuery = [System.Web.HttpUtility]::UrlEncode($testQuery.Query)
        # Build URL with query params for GET request
        $url = "$STREAM_URL?message=$encodedQuery`&page_context=$($testQuery.Category)"

        # Measure response time
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

        try {
            $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 60
            $stopwatch.Stop()

            # Parse SSE response
            $content = $response.Content
            $lines = $content -split "`n"
            $fullText = ""
            $chunkCount = 0

            foreach ($line in $lines) {
                if ($line.StartsWith("data:")) {
                    $dataStr = $line.Substring(5).Trim()
                    if ($dataStr -ne "[DONE]" -and $dataStr -ne "") {
                        try {
                            $data = $dataStr | ConvertFrom-Json
                            if ($data.type -eq "content") {
                                $fullText += $data.chunk
                                $chunkCount++
                            }
                        } catch {
                            # Skip malformed JSON
                        }
                    }
                }
            }

            $wordCount = ($fullText -split '\s+').Count
            $charCount = $fullText.Length
            $responseTimeMs = $stopwatch.ElapsedMilliseconds

            # Validate response
            $isComplete = $wordCount -ge $testQuery.MinWords
            $status = if ($isComplete) { "✅" } else { "❌" }

            Write-Host "$status ${responseTimeMs}ms ($wordCount words)" -ForegroundColor $(if ($isComplete) { "Green" } else { "Red" })

            $queryResults += @{
                Iteration = $i
                ResponseTimeMs = $responseTimeMs
                WordCount = $wordCount
                CharCount = $charCount
                ChunkCount = $chunkCount
                IsComplete = $isComplete
                HttpStatus = $response.StatusCode
            }

        } catch {
            $stopwatch.Stop()
            Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red

            $queryResults += @{
                Iteration = $i
                ResponseTimeMs = $stopwatch.ElapsedMilliseconds
                Error = $_.Exception.Message
                IsComplete = $false
            }
        }

        # Small delay between requests to avoid rate limiting
        Start-Sleep -Milliseconds 200
    }

    # Calculate statistics for this query
    $successfulResults = $queryResults | Where-Object { $_.IsComplete -eq $true }

    if ($successfulResults.Count -gt 0) {
        $responseTimes = $successfulResults | ForEach-Object { $_.ResponseTimeMs }
        $avgTime = ($responseTimes | Measure-Object -Average).Average
        $minTime = ($responseTimes | Measure-Object -Minimum).Minimum
        $maxTime = ($responseTimes | Measure-Object -Maximum).Maximum
        $p50 = $responseTimes | Sort-Object | Select-Object -Index ([Math]::Floor($responseTimes.Count * 0.5))
        $p95 = $responseTimes | Sort-Object | Select-Object -Index ([Math]::Floor($responseTimes.Count * 0.95))

        Write-Host "`n  Statistics:" -ForegroundColor Cyan
        Write-Host "    Avg: ${avgTime}ms  |  Min: ${minTime}ms  |  Max: ${maxTime}ms" -ForegroundColor White
        Write-Host "    P50: ${p50}ms  |  P95: ${p95}ms" -ForegroundColor White
        Write-Host "    Success rate: $($successfulResults.Count)/$($queryResults.Count) ($([Math]::Round($successfulResults.Count / $queryResults.Count * 100, 1))%)" -ForegroundColor White
    } else {
        Write-Host "`n  ❌ All iterations failed for this query" -ForegroundColor Red
    }

    $allResults += @{
        Query = $testQuery.Query
        Category = $testQuery.Category
        Results = $queryResults
        Statistics = @{
            AvgTimeMs = $avgTime
            MinTimeMs = $minTime
            MaxTimeMs = $maxTime
            P50Ms = $p50
            P95Ms = $p95
            SuccessRate = if ($queryResults.Count -gt 0) { $successfulResults.Count / $queryResults.Count } else { 0 }
        }
    }
}

# Overall summary
Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  OVERALL RESPONSE TIME SUMMARY" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$allSuccessful = $allResults | ForEach-Object { $_.Results | Where-Object { $_.IsComplete -eq $true } }
$allResponseTimes = $allSuccessful | ForEach-Object { $_.ResponseTimeMs }

if ($allResponseTimes.Count -gt 0) {
    $overallAvg = ($allResponseTimes | Measure-Object -Average).Average
    $overallMin = ($allResponseTimes | Measure-Object -Minimum).Minimum
    $overallMax = ($allResponseTimes | Measure-Object -Maximum).Maximum
    $overallP50 = $allResponseTimes | Sort-Object | Select-Object -Index ([Math]::Floor($allResponseTimes.Count * 0.5))
    $overallP95 = $allResponseTimes | Sort-Object | Select-Object -Index ([Math]::Floor($allResponseTimes.Count * 0.95))
    $overallP99 = $allResponseTimes | Sort-Object | Select-Object -Index ([Math]::Floor($allResponseTimes.Count * 0.99))

    Write-Host "Total successful requests: $($allSuccessful.Count)" -ForegroundColor White
    Write-Host "Average response time: ${overallAvg}ms" -ForegroundColor White
    Write-Host "Min response time: ${overallMin}ms" -ForegroundColor White
    Write-Host "Max response time: ${overallMax}ms" -ForegroundColor White
    Write-Host "`nPercentiles:" -ForegroundColor Cyan
    Write-Host "  P50 (median): ${overallP50}ms" -ForegroundColor White
    Write-Host "  P95: ${overallP95}ms" -ForegroundColor White
    Write-Host "  P99: ${overallP99}ms" -ForegroundColor White

    # Performance assessment
    Write-Host "`nPerformance Assessment:" -ForegroundColor Cyan
    if ($overallP95 -lt 3000) {
        Write-Host "  ✅ EXCELLENT - P95 under 3 seconds" -ForegroundColor Green
    } elseif ($overallP95 -lt 5000) {
        Write-Host "  ✅ GOOD - P95 under 5 seconds" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ NEEDS IMPROVEMENT - P95 over 5 seconds" -ForegroundColor Red
    }
}

# Save detailed results
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$resultsPath = "test-results/performance/response_time_$timestamp.json"
New-Item -ItemType Directory -Force -Path "test-results/performance" | Out-Null
$allResults | ConvertTo-Json -Depth 10 | Out-File $resultsPath

Write-Host "`n✅ Results saved to: $resultsPath`n" -ForegroundColor Green

return $allResults
