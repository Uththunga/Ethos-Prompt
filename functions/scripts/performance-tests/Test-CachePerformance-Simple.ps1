# Simple Cache Performance Test - Working Version
# Tests cache effectiveness with identical and similar queries

$ErrorActionPreference = "Continue"
$baseUrl = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat/stream"

Write-Host "`n==================================================================" -ForegroundColor Cyan
Write-Host "  MARKETING AGENT - CACHE PERFORMANCE TEST" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Identical Query (Cache Hit Test)
Write-Host "[TEST 1] IDENTICAL QUERY CACHING" -ForegroundColor Yellow
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

$query = "What are your pricing plans?"
$encodedQuery = [System.Uri]::EscapeDataString($query)
$url = $baseUrl + "?message=" + $encodedQuery + "&page_context=pricing"

$cacheResults = @()
$iterations = 5

Write-Host "Running same query $iterations times to test caching..." -ForegroundColor White
Write-Host ""

for ($i = 1; $i -le $iterations; $i++) {
    Write-Host "  Request $i/$iterations... " -NoNewline

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 60 -UseBasicParsing
        $sw.Stop()

        $timeMs = $sw.ElapsedMilliseconds
        $isCached = if ($i -gt 1) { "WARM" } else { "COLD" }

        Write-Host "${timeMs}ms [$isCached]" -ForegroundColor $(if ($i -eq 1) { "Yellow" } else { "Cyan" })

        $cacheResults += @{
            Request = $i
            TimeMs = $timeMs
            Type = $isCached
        }

    } catch {
        $sw.Stop()
        Write-Host "ERROR" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 800
}

# Analyze cache performance
Write-Host ""
Write-Host "  Cache Analysis:" -ForegroundColor Cyan

$firstRequest = $cacheResults[0].TimeMs
$subsequentTimes = ($cacheResults[1..($cacheResults.Count-1)] | ForEach-Object { $_.TimeMs })

if ($subsequentTimes.Count -gt 0) {
    $avgSubsequent = ($subsequentTimes | Measure-Object -Average).Average
    $speedup = [Math]::Round($firstRequest / $avgSubsequent, 2)
    $improvement = [Math]::Round((1 - $avgSubsequent / $firstRequest) * 100, 1)

    Write-Host "    First request (cold): ${firstRequest}ms" -ForegroundColor White
    Write-Host "    Avg subsequent (cached): " -NoNewline
    Write-Host ([Math]::Round($avgSubsequent, 0)) -NoNewline -ForegroundColor White
    Write-Host "ms"
    Write-Host "    Speedup: ${speedup}x faster" -ForegroundColor Green
    Write-Host "    Improvement: ${improvement}%" -ForegroundColor Green

    if ($improvement -gt 50) {
        Write-Host ""
        Write-Host "    [EXCELLENT] Cache is highly effective" -ForegroundColor Green
    } elseif ($improvement -gt 20) {
        Write-Host ""
        Write-Host "    [GOOD] Cache is working" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "    [WARNING] Cache may not be active" -ForegroundColor Red
    }
}

# Test 2: Different Queries (Cache Miss Baseline)
Write-Host ""
Write-Host ""
Write-Host "[TEST 2] CACHE MISS BASELINE" -ForegroundColor Yellow
Write-Host "-----------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

$uniqueQueries = @(
    "What services do you offer?",
    "How does the Smart Assistant work?",
    "Tell me about system integration"
)

Write-Host "Testing unique queries to establish baseline..." -ForegroundColor White
Write-Host ""

$missResults = @()

foreach ($q in $uniqueQueries) {
    Write-Host "  Query: '$q'" -NoNewline

    $enc = [System.Uri]::EscapeDataString($q)
    $missUrl = $baseUrl + "?message=" + $enc + "&page_context=unknown"

    $sw = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        $response = Invoke-WebRequest -Uri $missUrl -Method Get -TimeoutSec 60 -UseBasicParsing
        $sw.Stop()

        $timeMs = $sw.ElapsedMilliseconds
        Write-Host " -> ${timeMs}ms" -ForegroundColor White

        $missResults += $timeMs

    } catch {
        $sw.Stop()
        Write-Host " -> ERROR" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 800
}

# Summary
Write-Host ""
Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  CACHE PERFORMANCE SUMMARY" -ForegroundColor Green
Write-Host "==================================================================" -ForegroundColor Green
Write-Host ""

$avgMissTime = ($missResults | Measure-Object -Average).Average

Write-Host "Cached vs Uncached:" -ForegroundColor Cyan
Write-Host "  Cached (avg): " -NoNewline
Write-Host ([Math]::Round($avgSubsequent, 0)) -NoNewline -ForegroundColor Green
Write-Host "ms"
Write-Host "  Uncached (avg): " -NoNewline
Write-Host ([Math]::Round($avgMissTime, 0)) -NoNewline -ForegroundColor White
Write-Host "ms"

$cacheEffectiveness = [Math]::Round((1 - $avgSubsequent / $avgMissTime) * 100, 1)
Write-Host ""
Write-Host "Cache Effectiveness: ${cacheEffectiveness}% faster" -ForegroundColor Green

# Save results
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$resultsDir = "test-results\performance"
New-Item -ItemType Directory -Force -Path $resultsDir | Out-Null
$resultsPath = Join-Path $resultsDir "cache_performance_${timestamp}.json"

@{
    CacheTest = $cacheResults
    MissTest = $missResults
    Summary = @{
        CachedAvg = $avgSubsequent
        UncachedAvg = $avgMissTime
        Effectiveness = $cacheEffectiveness
    }
} | ConvertTo-Json -Depth 10 | Out-File $resultsPath

Write-Host ""
Write-Host "Results saved to: $resultsPath" -ForegroundColor Green
Write-Host ""
