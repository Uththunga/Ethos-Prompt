# ============================================================================
# Marketing Agent Performance Test Suite - Main Runner
# ============================================================================
# Purpose: Comprehensive performance testing and analysis
# Author: Macahan (Granite Agent)
# Date: 2025-11-30
# ============================================================================

param(
    [string]$Environment = "staging",
    [int]$Iterations = 10,
    [switch]$Verbose,
    [switch]$GenerateReport
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Configuration
$STAGING_API_BASE = "https://marketing-api-857724136585.australia-southeast1.run.app"
$RESULTS_DIR = "test-results/performance"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"

# Color output functions
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-Error-Custom { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-Warning-Custom { Write-Host "⚠️  $args" -ForegroundColor Yellow }

# Create results directory
New-Item -ItemType Directory -Force -Path $RESULTS_DIR | Out-Null

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    MARKETING AGENT PERFORMANCE TEST SUITE                            ║" -ForegroundColor Cyan
Write-Host "║    Environment: $Environment                                          " -ForegroundColor Cyan
Write-Host "║    Iterations: $Iterations                                            " -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Test Suite Components
$tests = @(
    @{Name="Response Time Test"; Script=".\Test-ResponseTime.ps1"; Critical=$true},
    @{Name="Throughput Test"; Script=".\Test-Throughput.ps1"; Critical=$true},
    @{Name="Cache Performance Test"; Script=".\Test-CachePerformance.ps1"; Critical=$false},
    @{Name="Load Test"; Script=".\Test-LoadStress.ps1"; Critical=$false},
    @{Name="Latency Analysis"; Script=".\Test-LatencyBreakdown.ps1"; Critical=$true}
)

$results = @()

foreach ($test in $tests) {
    Write-Host "`n═══════════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "  Running: $($test.Name)" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════════`n" -ForegroundColor Yellow

    try {
        $testResult = & $test.Script -Environment $Environment -Iterations $Iterations

        $results += @{
            Test = $test.Name
            Status = "PASS"
            Result = $testResult
            Critical = $test.Critical
        }

        Write-Success "$($test.Name) completed successfully"
    }
    catch {
        $results += @{
            Test = $test.Name
            Status = "FAIL"
            Error = $_.Exception.Message
            Critical = $test.Critical
        }

        if ($test.Critical) {
            Write-Error-Custom "$($test.Name) FAILED (CRITICAL): $($_.Exception.Message)"
        } else {
            Write-Warning-Custom "$($test.Name) FAILED (Non-critical): $($_.Exception.Message)"
        }
    }
}

# Generate Summary Report
Write-Host "`n`n"
Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║    TEST SUITE SUMMARY                                                ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

$passed = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
$criticalFailed = ($results | Where-Object { $_.Status -eq "FAIL" -and $_.Critical }).Count

Write-Host "Total Tests: $($results.Count)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "Critical Failures: $criticalFailed" -ForegroundColor $(if ($criticalFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

foreach ($result in $results) {
    $icon = if ($result.Status -eq "PASS") { "✅" } else { "❌" }
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "$icon $($result.Test)" -ForegroundColor $color
}

# Generate detailed report if requested
if ($GenerateReport) {
    Write-Host "`n"
    Write-Info "Generating detailed performance report..."

    $reportPath = "$RESULTS_DIR\performance_report_$TIMESTAMP.json"
    $results | ConvertTo-Json -Depth 10 | Out-File $reportPath

    Write-Success "Report saved to: $reportPath"

    # Generate markdown summary
    & .\Generate-PerformanceReport.ps1 -ResultsFile $reportPath
}

# Exit with appropriate code
if ($criticalFailed -gt 0) {
    Write-Host "`n"
    Write-Error-Custom "CRITICAL FAILURES DETECTED - Test suite failed"
    exit 1
} elseif ($failed -gt 0) {
    Write-Host "`n"
    Write-Warning-Custom "Some tests failed, but no critical failures"
    exit 0
} else {
    Write-Host "`n"
    Write-Success "All tests passed successfully! 🎉"
    exit 0
}
