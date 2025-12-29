# ============================================================================
# Performance Report Generator
# ============================================================================
# Generates comprehensive markdown report from test results
# ============================================================================

param(
    [string]$ResultsFile
)

if (-not $ResultsFile -or -not (Test-Path $ResultsFile)) {
    Write-Host "❌ Error: Results file not found" -ForegroundColor Red
    exit 1
}

$results = Get-Content $ResultsFile | ConvertFrom-Json
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$reportContent = @"
# Marketing Agent Performance Test Report

**Generated:** $timestamp
**Environment:** Staging
**Test Suite:** Comprehensive Performance Analysis

---

## Executive Summary

This report presents detailed performance analysis of the Marketing Agent in the staging environment.

## Test Results Overview

"@

# Add test results
foreach ($result in $results) {
    $status = if ($result.Status -eq "PASS") { "✅ PASSED" } else { "❌ FAILED" }
    $reportContent += @"

### $($result.Test)
**Status:** $status

"@

    if ($result.Status -eq "PASS" -and $result.Result) {
        # Add specific metrics based on test type
        $reportContent += "**Metrics:** Available in detailed JSON results`n`n"
    }
}

$reportContent += @"

---

## Performance Recommendations

Based on the test results, consider the following optimizations:

1. **Set Cloud Run min instances = 1** to eliminate cold starts
2. **Increase memory to 1 GB** for better performance
3. **Enable cache warming** for common queries
4. **Monitor P95 latency** - target < 3 seconds

---

**Report Location:** ``$ResultsFile``
"@

# Save markdown report
$reportPath = $ResultsFile -replace '\.json$', '_report.md'
$reportContent | Out-File $reportPath

Write-Host "`n✅ Performance report generated: $reportPath`n" -ForegroundColor Green
