# Simple Response Time Test - Working Version
# Measures response times for marketing agent

$ErrorActionPreference = "Continue"
$baseUrl = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat/stream"

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  MARKETING AGENT - RESPONSE TIME TEST" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

$testCases = @(
    @{Query="What are your pricing plans?"; Context="pricing"},
    @{Query="Tell me about your services"; Context="services"},
    @{Query="How does the Smart Assistant work?"; Context="technical"}
)

$allResults = @()

foreach ($test in $testCases) {
    Write-Host "Testing: $($test.Query)" -ForegroundColor Yellow
    Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray

    $iterations = 3
    $results = @()

    for ($i = 1; $i -le $iterations; $i++) {
        Write-Host "  Iteration $i/$iterations... " -NoNewline

        # Encode query
        $encodedQuery = [System.Uri]::EscapeDataString($test.Query)

        # Build URL using -join to avoid interpolation issues
        $url = $baseUrl + "?message=" + $encodedQuery + "&page_context=" + $test.Context

        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

        try {
            $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 60 -UseBasicParsing
            $stopwatch.Stop()

            # Parse response
            $content = $response.Content
            $words = ($content -split '\s+').Count
            $chars = $content.Length
            $timeMs = $stopwatch.ElapsedMilliseconds

            $status = if ($words -ge 50) { "PASS" } else { "INCOMPLETE" }
            $icon = if ($status -eq "PASS") { "[OK]" } else { "[!]" }

            Write-Host "$icon ${timeMs}ms ($words words)" -ForegroundColor Green

            $results += @{
                Iteration = $i
                TimeMs = $timeMs
                Words = $words
                Chars = $chars
                Status = $status
            }

        } catch {
            $stopwatch.Stop()
            Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
            $results += @{
                Iteration = $i
                TimeMs = $stopwatch.ElapsedMilliseconds
                Error = $_.Exception.Message
                Status = "FAILED"
            }
        }

        Start-Sleep -Milliseconds 500
    }

    # Calculate statistics
    $successful = $results | Where-Object { $_.Status -eq "PASS" }

    if ($successful.Count -gt 0) {
        $times = $successful | ForEach-Object { $_.TimeMs }
        $avgTime = ($times | Measure-Object -Average).Average
        $minTime = ($times | Measure-Object -Minimum).Minimum
        $maxTime = ($times | Measure-Object -Maximum).Maximum

        Write-Host ""
        Write-Host "  Statistics:" -ForegroundColor Cyan
        Write-Host "    Avg: " -NoNewline
        Write-Host ([Math]::Round($avgTime, 0)) -NoNewline -ForegroundColor White
        Write-Host "ms  |  Min: " -NoNewline
        Write-Host "${minTime}ms" -NoNewline -ForegroundColor White
        Write-Host "  |  Max: " -NoNewline
        Write-Host "${maxTime}ms" -ForegroundColor White
        Write-Host "    Success: $($successful.Count)/$($results.Count)" -ForegroundColor Green
    }

    $allResults += @{
        Query = $test.Query
        Results = $results
    }

    Write-Host ""
}

# Overall summary
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  OVERALL SUMMARY" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""

$allSuccessful = $allResults | ForEach-Object { $_.Results | Where-Object { $_.Status -eq "PASS" } }

if ($allSuccessful.Count -gt 0) {
    $allTimes = $allSuccessful | ForEach-Object { $_.TimeMs }
    $overallAvg = ($allTimes | Measure-Object -Average).Average
    $overallMin = ($allTimes | Measure-Object -Minimum).Minimum
    $overallMax = ($allTimes | Measure-Object -Maximum).Maximum

    # Calculate percentiles
    $sorted = $allTimes | Sort-Object
    $p50 = $sorted[[Math]::Floor($sorted.Count * 0.5)]
    $p95 = $sorted[[Math]::Floor($sorted.Count * 0.95)]

    Write-Host "Total successful requests: $($allSuccessful.Count)" -ForegroundColor White
    Write-Host ""
    Write-Host "Response Times:" -ForegroundColor Cyan
    Write-Host "  Average: " -NoNewline
    Write-Host ([Math]::Round($overallAvg, 0)) -NoNewline -ForegroundColor White
    Write-Host "ms"
    Write-Host "  Minimum: ${overallMin}ms" -ForegroundColor White
    Write-Host "  Maximum: ${overallMax}ms" -ForegroundColor White
    Write-Host ""
    Write-Host "Percentiles:" -ForegroundColor Cyan
    Write-Host "  P50 (median): ${p50}ms" -ForegroundColor White
    Write-Host "  P95: ${p95}ms" -ForegroundColor White

    Write-Host ""
    Write-Host "Performance Assessment:" -ForegroundColor Cyan
    if ($p95 -lt 3000) {
        Write-Host "  [EXCELLENT] P95 under 3 seconds" -ForegroundColor Green
    } elseif ($p95 -lt 5000) {
        Write-Host "  [GOOD] P95 under 5 seconds" -ForegroundColor Yellow
    } else {
        Write-Host "  [NEEDS IMPROVEMENT] P95 over 5 seconds" -ForegroundColor Red
    }
}

# Save results
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$resultsDir = "test-results\performance"
New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null
$resultsPath = Join-Path $resultsDir "response_time_${timestamp}.json"

$allResults | ConvertTo-Json -Depth 10 | Out-File $resultsPath

Write-Host ""
Write-Host "Results saved to: $resultsPath" -ForegroundColor Green
Write-Host ""
