# ============================================================================
# Cache Performance Test
# ============================================================================
# Tests intelligent caching system performance and hit rates
# ============================================================================

param(
    [string]$Environment = "staging",
    [int]$Iterations = 5
)

$STAGING_API_BASE = "https://marketing-api-857724136585.australia-southeast1.run.app"
$STREAM_URL = "$STAGING_API_BASE/api/ai/marketing-chat/stream"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  CACHE PERFORMANCE TEST" -ForegroundColor Cyan
Write-Host "  Testing intelligent response caching effectiveness" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

# Test 1: Identical Query Caching
Write-Host "`n📋 Test 1: IDENTICAL QUERY CACHING" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$identicalQuery = "What are your pricing plans?"
$results = @()

Write-Host "Running identical query $Iterations times to measure cache effectiveness...`n" -ForegroundColor White

for ($i = 1; $i -le $Iterations; $i++) {
    Write-Host "  Request $i/$Iterations... " -NoNewline

    $url = "$STREAM_URL?message=$([System.Web.HttpUtility]::UrlEncode($identicalQuery))`&page_context=pricing"

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 60
        $stopwatch.Stop()

        $responseTime = $stopwatch.ElapsedMilliseconds

        # Check for cache indicator in response
        $isCached = $false
        if ($response.Content -match "cache.*hit" -or $response.Content -match "cached") {
            $isCached = $true
        }

        $icon = if ($isCached) { "⚡" } else { "🔄" }
        $color = if ($isCached) { "Cyan" } else { "White" }
        Write-Host "$icon ${responseTime}ms $(if ($isCached) { '(CACHED)' } else { '(FRESH)' })" -ForegroundColor $color

        $results += @{
            Request = $i
            ResponseTimeMs = $responseTime
            IsCached = $isCached
        }

    } catch {
        $stopwatch.Stop()
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 500
}

# Analyze cache performance
Write-Host "`n  Cache Analysis:" -ForegroundColor Cyan

$firstRequest = $results[0].ResponseTimeMs
$subsequentRequests = $results[1..($results.Count-1)] | ForEach-Object { $_.ResponseTimeMs }

if ($subsequentRequests.Count -gt 0) {
    $avgSubsequent = ($subsequentRequests | Measure-Object -Average).Average
    $speedup = [Math]::Round($firstRequest / $avgSubsequent, 2)
    $improvement = [Math]::Round((1 - $avgSubsequent / $firstRequest) * 100, 1)

    Write-Host "    First request (cold): ${firstRequest}ms" -ForegroundColor White
    Write-Host "    Avg subsequent (warm): ${avgSubsequent}ms" -ForegroundColor White
    Write-Host "    Speedup: ${speedup}x faster" -ForegroundColor Green
    Write-Host "    Improvement: ${improvement}% faster" -ForegroundColor Green
}

# Test 2: Similar Query Caching (Semantic Similarity)
Write-Host "`n`n📋 Test 2: SEMANTIC SIMILARITY CACHING" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$similarQueries = @(
    "What are your pricing plans?",
    "Tell me about your pricing",
    "How much does it cost?",
    "What do you charge?",
    "What are the prices?"
)

Write-Host "Testing similar queries to measure semantic cache matching...`n" -ForegroundColor White

$similarityResults = @()

for ($i = 0; $i -lt $similarQueries.Count; $i++) {
    $query = $similarQueries[$i]
    Write-Host "  Query $($i+1)/$($similarQueries.Count): '$query'" -NoNewline

    $url = "$STREAM_URL?message=$([System.Web.HttpUtility]::UrlEncode($query))`&page_context=pricing"

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 60
        $stopwatch.Stop()

        $responseTime = $stopwatch.ElapsedMilliseconds
        Write-Host " → ${responseTime}ms" -ForegroundColor White

        $similarityResults += @{
            Query = $query
            ResponseTimeMs = $responseTime
        }

    } catch {
        $stopwatch.Stop()
        Write-Host " → ERROR" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 500
}

# Analyze semantic caching
if ($similarityResults.Count -gt 1) {
    Write-Host "`n  Semantic Cache Analysis:" -ForegroundColor Cyan

    $firstSemantic = $similarityResults[0].ResponseTimeMs
    $otherSemantic = $similarityResults[1..($similarityResults.Count-1)] | ForEach-Object { $_.ResponseTimeMs }
    $avgOther = ($otherSemantic | Measure-Object -Average).Average

    Write-Host "    First query: ${firstSemantic}ms" -ForegroundColor White
    Write-Host "    Avg similar queries: ${avgOther}ms" -ForegroundColor White

    if ($avgOther -lt $firstSemantic * 0.7) {
        Write-Host "    ✅ Semantic caching appears to be working (30%+ improvement)" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  Similar response times - semantic caching may not be active" -ForegroundColor Yellow
    }
}

# Test 3: Cache Busting (Different Queries)
Write-Host "`n`n📋 Test 3: CACHE MISS BASELINE" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────────" -ForegroundColor Gray

$uniqueQueries = @(
    "What services do you offer?",
    "How does the Smart Assistant work?",
    "Tell me about system integration",
    "What makes Intelligent Applications unique?",
    "How can I request a consultation?"
)

Write-Host "Testing unique queries to establish cache miss baseline...`n" -ForegroundColor White

$missResults = @()

foreach ($query in $uniqueQueries) {
    Write-Host "  Testing: '$query'" -NoNewline

    $url = "$STREAM_URL?message=$([System.Web.HttpUtility]::UrlEncode($query))`&page_context=unknown"

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -TimeoutSec 60
        $stopwatch.Stop()

        $responseTime = $stopwatch.ElapsedMilliseconds
        Write-Host " → ${responseTime}ms" -ForegroundColor White

        $missResults += @{
            Query = $query
            ResponseTimeMs = $responseTime
        }

    } catch {
        $stopwatch.Stop()
        Write-Host " → ERROR" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 500
}

# Final Summary
Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  CACHE PERFORMANCE SUMMARY" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$avgCacheMiss = ($missResults | ForEach-Object { $_.ResponseTimeMs } | Measure-Object -Average).Average

Write-Host "Identical Query Performance:" -ForegroundColor Cyan
Write-Host "  First (cold): ${firstRequest}ms" -ForegroundColor White
Write-Host "  Subsequent (warm): ${avgSubsequent}ms" -ForegroundColor White
Write-Host "  Speedup: ${speedup}x" -ForegroundColor Green

Write-Host "`nCache Miss Baseline:" -ForegroundColor Cyan
Write-Host "  Avg unique query: ${avgCacheMiss}ms" -ForegroundColor White

Write-Host "`nCache Effectiveness:" -ForegroundColor Cyan
$cacheEffectiveness = [Math]::Round((1 - $avgSubsequent / $avgCacheMiss) * 100, 1)
Write-Host "  Cached vs Uncached: ${cacheEffectiveness}% faster" -ForegroundColor Green

if ($cacheEffectiveness -gt 50) {
    Write-Host "`n  ✅ EXCELLENT cache performance" -ForegroundColor Green
} elseif ($cacheEffectiveness -gt 20) {
    Write-Host "`n  ✅ GOOD cache performance" -ForegroundColor Yellow
} else {
    Write-Host "`n  ⚠️  Cache may need optimization" -ForegroundColor Red
}

# Save results
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$resultsPath = "test-results/performance/cache_performance_$timestamp.json"
$allCacheResults = @{
    IdenticalQueryTest = @{
        Results = $results
        FirstRequest = $firstRequest
        AvgSubsequent = $avgSubsequent
        Speedup = $speedup
    }
    SemanticSimilarityTest = @{
        Results = $similarityResults
    }
    CacheMissTest = @{
        Results = $missResults
        AvgMiss = $avgCacheMiss
    }
    Summary = @{
        CacheEffectiveness = $cacheEffectiveness
    }
}

New-Item -ItemType Directory -Force -Path "test-results/performance" | Out-Null
$allCacheResults | ConvertTo-Json -Depth 10 | Out-File $resultsPath

Write-Host "`n✅ Results saved to: $resultsPath`n" -ForegroundColor Green

return $allCacheResults
