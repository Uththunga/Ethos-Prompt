# ============================================================================
# Latency Breakdown Analysis
# ============================================================================
# Detailed breakdown of latency components: DNS, TCP, TLS, TTFB, Download
# ============================================================================

param(
    [string]$Environment = "staging",
    [int]$Iterations = 5
)

$STAGING_API_BASE = "https://marketing-api-857724136585.australia-southeast1.run.app"
$STREAM_URL = "$STAGING_API_BASE/api/ai/marketing-chat/stream"

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  LATENCY BREAKDOWN ANALYSIS" -ForegroundColor Cyan
Write-Host "  Detailed timing of request/response phases" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$testQuery = "What are your pricing plans?"
$encodedQuery = [System.Web.HttpUtility]::UrlEncode($testQuery)
$url = "$STREAM_URL?message=$encodedQuery`&page_context=pricing"

$results = @()

for ($i = 1; $i -le $Iterations; $i++) {
    Write-Host "`n═══ Iteration $i/$Iterations ═══" -ForegroundColor Yellow

    # Phase 1: DNS Resolution
    Write-Host "  ⏱  DNS Resolution... " -NoNewline
    $dnsStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $dnsResult = Resolve-DnsName -Name "marketing-api-857724136585.australia-southeast1.run.app" -Type A -ErrorAction Stop
        $dnsStopwatch.Stop()
        $dnsTime = $dnsStopwatch.ElapsedMilliseconds
        Write-Host "${dnsTime}ms" -ForegroundColor Green
    } catch {
        $dnsStopwatch.Stop()
        Write-Host "FAILED" -ForegroundColor Red
        $dnsTime = 0
    }

    # Phase 2: Full HTTP Request (with detailed timing)
    Write-Host "  ⏱  HTTP Request Breakdown:" -ForegroundColor Cyan

    $totalStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $ttfbStopwatch = [System.Diagnostics.Stopwatch]::StartNew()

    try {
        # Create web request with detailed tracking
        $request = [System.Net.HttpWebRequest]::Create($url)
        $request.Method = "GET"
        $request.Timeout = 60000

        # Measure TTFB (Time To First Byte)
        $response = $request.GetResponse()
        $ttfbStopwatch.Stop()
        $ttfb = $ttfbStopwatch.ElapsedMilliseconds

        Write-Host "      → TTFB (Time To First Byte): ${ttfb}ms" -ForegroundColor White

        # Measure content download time
        $downloadStopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $stream = $response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $content = $reader.ReadToEnd()
        $downloadStopwatch.Stop()
        $downloadTime = $downloadStopwatch.ElapsedMilliseconds

        $reader.Close()
        $stream.Close()
        $response.Close()

        $totalStopwatch.Stop()
        $totalTime = $totalStopwatch.ElapsedMilliseconds

        Write-Host "      → Content Download: ${downloadTime}ms" -ForegroundColor White
        Write-Host "      → Total Request: ${totalTime}ms" -ForegroundColor White

        # Parse content to analyze streaming chunks
        $lines = $content -split "`n"
        $chunks = @()
        $firstChunkTime = $null

        foreach ($line in $lines) {
            if ($line.StartsWith("data:")) {
                $chunks += $line
            }
        }

        # Estimate processing time
        $processingTime = $totalTime - $ttfb - $downloadTime
        if ($processingTime -lt 0) { $processingTime = 0 }

        Write-Host "`n  📊 Breakdown:" -ForegroundColor Cyan
        Write-Host "      DNS Resolution:     ${dnsTime}ms    ($(([Math]::Round($dnsTime/$totalTime*100,1)))%)" -ForegroundColor White
        Write-Host "      TTFB:              ${ttfb}ms    ($(([Math]::Round($ttfb/$totalTime*100,1)))%)" -ForegroundColor White
        Write-Host "      Content Download:   ${downloadTime}ms    ($(([Math]::Round($downloadTime/$totalTime*100,1)))%)" -ForegroundColor White
        Write-Host "      Processing:         ${processingTime}ms    ($(([Math]::Round($processingTime/$totalTime*100,1)))%)" -ForegroundColor White
        Write-Host "      ─────────────────────────────────" -ForegroundColor Gray
        Write-Host "      TOTAL:              ${totalTime}ms" -ForegroundColor Green

        $results += @{
            Iteration = $i
            DnsMs = $dnsTime
            TtfbMs = $ttfb
            DownloadMs = $downloadTime
            ProcessingMs = $processingTime
            TotalMs = $totalTime
            ChunkCount = $chunks.Count
            HttpStatus = [int]$response.StatusCode
        }

    } catch {
        $totalStopwatch.Stop()
        Write-Host "      ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red

        $results += @{
            Iteration = $i
            Error = $_.Exception.Message
        }
    }

    Start-Sleep -Milliseconds 1000
}

# Calculate averages
Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  AVERAGE LATENCY BREAKDOWN" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Green

$successful = $results | Where-Object { -not $_.Error }

if ($successful.Count -gt 0) {
    $avgDns = ($successful | ForEach-Object { $_.DnsMs } | Measure-Object -Average).Average
    $avgTtfb = ($successful | ForEach-Object { $_.TtfbMs } | Measure-Object -Average).Average
    $avgDownload = ($successful | ForEach-Object { $_.DownloadMs } | Measure-Object -Average).Average
    $avgProcessing = ($successful | ForEach-Object { $_.ProcessingMs } | Measure-Object -Average).Average
    $avgTotal = ($successful | ForEach-Object { $_.TotalMs } | Measure-Object -Average).Average

    Write-Host "Average Breakdown (across $($successful.Count) successful requests):" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  DNS Resolution:     ${avgDns}ms    ($(([Math]::Round($avgDns/$avgTotal*100,1)))%)" -ForegroundColor White
    Write-Host "  TTFB:              ${avgTtfb}ms    ($(([Math]::Round($avgTtfb/$avgTotal*100,1)))%)" -ForegroundColor White
    Write-Host "  Content Download:   ${avgDownload}ms    ($(([Math]::Round($avgDownload/$avgTotal*100,1)))%)" -ForegroundColor White
    Write-Host "  Processing:         ${avgProcessing}ms    ($(([Math]::Round($avgProcessing/$avgTotal*100,1)))%)" -ForegroundColor White
    Write-Host "  ─────────────────────────────────" -ForegroundColor Gray
    Write-Host "  TOTAL:              ${avgTotal}ms    (100%)" -ForegroundColor Green

    # Recommendations
    Write-Host "`n`n📝 Performance Insights:" -ForegroundColor Cyan

    if ($avgTtfb -gt 2000) {
        Write-Host "  ⚠️  High TTFB (${avgTtfb}ms) - Consider:" -ForegroundColor Yellow
        Write-Host "      • Increasing Cloud Run min instances to avoid cold starts" -ForegroundColor White
        Write-Host "      • Optimizing LLM API latency" -ForegroundColor White
        Write-Host "      • Enabling request caching" -ForegroundColor White
    } else {
        Write-Host "  ✅ Good TTFB (${avgTtfb}ms)" -ForegroundColor Green
    }

    if ($avgDownload -gt 1000) {
        Write-Host "`n  ⚠️  High download time (${avgDownload}ms) - Consider:" -ForegroundColor Yellow
        Write-Host "      • Response compression (gzip)" -ForegroundColor White
        Write-Host "      • Reducing response size" -ForegroundColor White
        Write-Host "      • CDN for static content" -ForegroundColor White
    } else {
        Write-Host "`n  ✅ Good download time (${avgDownload}ms)" -ForegroundColor Green
    }

    if ($avgDns -gt 100) {
        Write-Host "`n  ⚠️  High DNS resolution (${avgDns}ms) - Consider:" -ForegroundColor Yellow
        Write-Host "      • Using DNS caching" -ForegroundColor White
        Write-Host "      • Consider CDN with edge DNS" -ForegroundColor White
    } else {
        Write-Host "`n  ✅ Good DNS resolution (${avgDns}ms)" -ForegroundColor Green
    }
}

# Save results
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$resultsPath = "test-results/performance/latency_breakdown_$timestamp.json"
New-Item -ItemType Directory -Force -Path "test-results/performance" | Out-Null

$summary = @{
    Iterations = $results
    Averages = @{
        DnsMs = $avgDns
        TtfbMs = $avgTtfb
        DownloadMs = $avgDownload
        ProcessingMs = $avgProcessing
        TotalMs = $avgTotal
    }
}

$summary | ConvertTo-Json -Depth 10 | Out-File $resultsPath

Write-Host "`n✅ Results saved to: $resultsPath`n" -ForegroundColor Green

return $summary
