# ============================================================================
# Verify Execution Visibility in Staging UI
# ============================================================================
# This script verifies that execution data appears correctly in all three
# UI locations:
#   1. /dashboard/executions - Execution History list
#   2. /dashboard - Recent Activity section
#   3. Profile panel - Execution count
#
# Usage:
#   .\scripts\verify-execution-visibility.ps1
#   .\scripts\verify-execution-visibility.ps1 -Headless $false
#
# Prerequisites:
#   - Node.js installed
#   - Playwright installed (script will install if missing)
#   - Test data exists in Firestore (run create-test-data.ps1 first)
# ============================================================================

param(
    [string]$BaseUrl = "https://rag-prompt-library-staging.web.app",
    [bool]$Headless = $true,
    [string]$OutputDir = "test-results"
)

# Color output functions
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Error-Custom { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Warning-Custom { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Progress-Custom { param($Message) Write-Host "[PROGRESS] $Message" -ForegroundColor Blue }

# ============================================================================
# Pre-flight checks
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Magenta
Write-Host "  EXECUTION VISIBILITY VERIFICATION SCRIPT" -ForegroundColor Magenta
Write-Host "============================================================================" -ForegroundColor Magenta
Write-Host ""

# Check if Node.js is installed
Write-Info "Checking for Node.js..."
try {
    $nodeVersion = node --version 2>&1
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error-Custom "Node.js not found. Please install Node.js first."
    Write-Info "Download from: https://nodejs.org/"
    exit 1
}

# ============================================================================
# Install Playwright if needed
# ============================================================================

Write-Info "Checking for Playwright..."

$playwrightInstalled = $false
try {
    $npmList = npm list -g playwright --depth=0 2>&1
    if ($npmList -match "playwright@") {
        $playwrightInstalled = $true
        Write-Success "Playwright already installed"
    }
} catch {
    # Not installed
}

if (-not $playwrightInstalled) {
    Write-Warning-Custom "Playwright not found. Installing..."
    Write-Info "This may take a few minutes..."
    try {
        npm install -g playwright 2>&1 | Out-Null
        npx playwright install chromium 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Playwright installed successfully"
        } else {
            throw "Playwright installation failed"
        }
    } catch {
        Write-Error-Custom "Failed to install Playwright: $_"
        Write-Info "Please install manually: npm install -g playwright && npx playwright install chromium"
        exit 1
    }
}

# ============================================================================
# Create output directory
# ============================================================================

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Info "Created output directory: $OutputDir"
}

# ============================================================================
# Create Playwright test script
# ============================================================================

Write-Progress-Custom "Generating verification test script..."

$testScript = @"
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = '$BaseUrl';
const HEADLESS = $($Headless.ToString().ToLower());
const OUTPUT_DIR = '$OutputDir';

// Test results
const results = {
  timestamp: new Date().toISOString(),
  baseUrl: BASE_URL,
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

function addResult(name, passed, message, details = {}) {
  results.tests.push({ name, passed, message, details });
  results.summary.total++;
  if (passed) {
    results.summary.passed++;
    console.log(\`✅ \${name}: PASSED\`);
  } else {
    results.summary.failed++;
    console.error(\`❌ \${name}: FAILED - \${message}\`);
  }
}

async function captureConsoleLogs(page, testName) {
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    // Capture only our debug logs
    if (text.includes('[ExecutionHistory]') ||
        text.includes('[analyticsService]') ||
        text.includes('[ProfilePanel]') ||
        text.includes('[useDashboardData]')) {
      logs.push(text);
      console.log(\`  📝 \${text}\`);
    }
  });
  return logs;
}

async function runTests() {
  console.log('🚀 Starting execution visibility verification...');
  console.log('Base URL:', BASE_URL);
  console.log('Headless:', HEADLESS);
  console.log('');

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // ========================================================================
    // Test 1: Execution History Page
    // ========================================================================
    console.log('============================================================================');
    console.log('Test 1: Execution History Page (/dashboard/executions)');
    console.log('============================================================================');

    const executionLogs = await captureConsoleLogs(page, 'ExecutionHistory');

    await page.goto(\`\${BASE_URL}/dashboard/executions\`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '1-execution-history.png'), fullPage: true });

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Check if execution list is visible and populated
    const executionListExists = await page.locator('[data-testid="execution-list"], .execution-item, table tbody tr').count() > 0;
    const noDataMessage = await page.locator('text=/no executions found/i').count();

    if (executionListExists && noDataMessage === 0) {
      addResult('Execution History - List Populated', true, 'Execution list contains items');
    } else if (noDataMessage > 0) {
      addResult('Execution History - List Populated', false, 'Shows "No executions found" message');
    } else {
      addResult('Execution History - List Populated', false, 'Execution list not found or empty');
    }

    // Check statistics
    const statsText = await page.textContent('body');
    const hasStats = /\d+\s+(total\s+)?executions?/i.test(statsText);
    addResult('Execution History - Statistics Visible', hasStats, hasStats ? 'Statistics found' : 'Statistics not found');

    console.log('');

    // ========================================================================
    // Test 2: Dashboard Recent Activity
    // ========================================================================
    console.log('============================================================================');
    console.log('Test 2: Dashboard Recent Activity (/dashboard)');
    console.log('============================================================================');

    const dashboardLogs = await captureConsoleLogs(page, 'Dashboard');

    await page.goto(\`\${BASE_URL}/dashboard\`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUTPUT_DIR, '2-dashboard.png'), fullPage: true });

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Check Recent Activity section
    const recentActivityExists = await page.locator('[data-testid="recent-activity"], .recent-activity, text=/recent activity/i').count() > 0;
    const activityItems = await page.locator('[data-testid="activity-item"], .activity-item, .recent-activity-item').count();

    if (recentActivityExists && activityItems > 0) {
      addResult('Dashboard - Recent Activity Populated', true, \`Found \${activityItems} activity item(s)\`);
    } else if (recentActivityExists) {
      addResult('Dashboard - Recent Activity Populated', false, 'Recent Activity section exists but is empty');
    } else {
      addResult('Dashboard - Recent Activity Populated', false, 'Recent Activity section not found');
    }

    console.log('');

    // ========================================================================
    // Test 3: Profile Panel Execution Count
    // ========================================================================
    console.log('============================================================================');
    console.log('Test 3: Profile Panel Execution Count');
    console.log('============================================================================');

    const profileLogs = await captureConsoleLogs(page, 'Profile');

    // Stay on dashboard and open profile panel
    // Look for profile button/icon (adjust selector based on your UI)
    const profileButton = page.locator('[data-testid="profile-button"], button:has-text("Profile"), [aria-label="Profile"]').first();
    const profileButtonExists = await profileButton.count() > 0;

    if (profileButtonExists) {
      await profileButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '3-profile-panel.png'), fullPage: true });

      // Check for execution count in profile
      const profileText = await page.textContent('body');
      const executionCountMatch = profileText.match(/executions?[:\s]+(\d+)/i);

      if (executionCountMatch) {
        const count = parseInt(executionCountMatch[1]);
        if (count > 0) {
          addResult('Profile Panel - Execution Count', true, \`Execution count: \${count}\`);
        } else {
          addResult('Profile Panel - Execution Count', false, 'Execution count is 0');
        }
      } else {
        addResult('Profile Panel - Execution Count', false, 'Execution count not found in profile');
      }
    } else {
      addResult('Profile Panel - Execution Count', false, 'Profile button not found');
    }

    console.log('');

    // ========================================================================
    // Save console logs
    // ========================================================================
    const allLogs = [...executionLogs, ...dashboardLogs, ...profileLogs];
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'console-logs.txt'),
      allLogs.join('\n'),
      'utf8'
    );

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    addResult('Test Execution', false, error.message);
  } finally {
    await browser.close();
  }

  // ========================================================================
  // Generate report
  // ========================================================================
  console.log('============================================================================');
  console.log('TEST SUMMARY');
  console.log('============================================================================');
  console.log('');
  console.log(\`Total Tests : \${results.summary.total}\`);
  console.log(\`Passed      : \${results.summary.passed}\`);
  console.log(\`Failed      : \${results.summary.failed}\`);
  console.log('');

  // Save JSON report
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'test-report.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );

  console.log(\`📊 Full report saved to: \${OUTPUT_DIR}/test-report.json\`);
  console.log(\`📸 Screenshots saved to: \${OUTPUT_DIR}/\`);
  console.log(\`📝 Console logs saved to: \${OUTPUT_DIR}/console-logs.txt\`);
  console.log('');

  // Exit with appropriate code
  if (results.summary.failed > 0) {
    console.log('❌ VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ VERIFICATION PASSED');
    process.exit(0);
  }
}

runTests();
"@

# Save the test script
$testScriptPath = Join-Path $env:TEMP "verify-execution-visibility-temp.js"
$testScript | Out-File -FilePath $testScriptPath -Encoding UTF8

Write-Success "Verification test script generated"

# ============================================================================
# Run verification tests
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Progress-Custom "Running verification tests..."
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

try {
    node $testScriptPath
    $exitCode = $LASTEXITCODE

    Write-Host ""

    if ($exitCode -eq 0) {
        Write-Success "All verification tests passed!"
    } else {
        Write-Error-Custom "Some verification tests failed. Check the report for details."
    }

} catch {
    Write-Error-Custom "Failed to run verification tests: $_"
    Remove-Item $testScriptPath -ErrorAction SilentlyContinue
    exit 1
} finally {
    Remove-Item $testScriptPath -ErrorAction SilentlyContinue
}

# ============================================================================
# Display results
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Info "Test Results Location:"
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Report      : $OutputDir\test-report.json" -ForegroundColor White
Write-Host "  Screenshots : $OutputDir\" -ForegroundColor White
Write-Host "  Console Logs: $OutputDir\console-logs.txt" -ForegroundColor White
Write-Host ""

# Try to open the report
if (Test-Path "$OutputDir\test-report.json") {
    Write-Info "Opening test report..."
    try {
        $report = Get-Content "$OutputDir\test-report.json" | ConvertFrom-Json

        Write-Host "Test Results:" -ForegroundColor Cyan
        foreach ($test in $report.tests) {
            $icon = if ($test.passed) { "✅" } else { "❌" }
            $color = if ($test.passed) { "Green" } else { "Red" }
            Write-Host "  $icon $($test.name): $($test.message)" -ForegroundColor $color
        }
        Write-Host ""
    } catch {
        Write-Warning-Custom "Could not parse test report"
    }
}

Write-Host ""
exit $exitCode
