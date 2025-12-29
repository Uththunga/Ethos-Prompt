param(
  [switch]$WithCoverage = $true,
  [switch]$StartEmulators = $false
)

$ErrorActionPreference = 'Stop'

# Repo root (one level up from scripts/)
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

# Logs directory
$logsDir = Join-Path $Root 'test-logs'
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

function Write-Header($text) {
  Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Append-Summary($name, $logPath) {
  $summaryPath = Join-Path $logsDir 'summary.txt'
  if (-not (Test-Path $summaryPath)) { New-Item -ItemType File -Path $summaryPath | Out-Null }
  $content = Get-Content -Raw -ErrorAction SilentlyContinue $logPath
  $line = ''
  if ($content) {
    # Try to find a pytest summary line
    $m = [regex]::Match($content, "(?im)^(?<passed>\\d+) passed(?:, (?<failed>\\d+) failed)?(?:, (?<skipped>\\d+) skipped)?")
    if ($m.Success) {
      $p = $m.Groups['passed'].Value; $f = $m.Groups['failed'].Value; $s = $m.Groups['skipped'].Value
      if (-not $f) { $f = '0' }; if (-not $s) { $s = '0' }
      $line = "${name}: ${p} passed, ${f} failed, ${s} skipped"
    } else {
      # Try Playwright summary
      $pm = [regex]::Match($content, "(?im)^(?<passed>\\d+) passed.*$")
      if ($pm.Success) {
        $p = $pm.Groups['passed'].Value
        $line = "${name}: ${p} passed"
      } else {
        $line = "${name}: (see log)"
      }
    }
  } else {
    $line = "${name}: (no log content)"
  }
  Add-Content -Path $summaryPath -Value $line
}

# Ensure zero-billing OpenRouter
$env:OPENROUTER_USE_MOCK = 'true'
$env:OPENROUTER_API_KEY = 'test'

# Optional: start emulators (best-effort)
if ($StartEmulators) {
  Write-Header 'Starting Firebase emulators (best-effort)'
  Start-Process -FilePath 'npx' -ArgumentList '-y firebase-tools emulators:start --only firestore,auth,functions,storage' -WindowStyle Minimized | Out-Null
  Start-Sleep -Seconds 8
}

# 1) Backend unit tests (subset)
Write-Header 'Backend unit tests (subset)'
Push-Location (Join-Path $Root 'functions')
$backendUnitLog = Join-Path $logsDir 'backend_unit.log'
$backendUnitCmd = 'pytest tests/test_document_extractors.py tests/test_embedding_service_basics.py -q'
if (Test-Path 'tests/test_rag_chunking.py') { $backendUnitCmd += ' tests/test_rag_chunking.py' }
if ($WithCoverage) { $backendUnitCmd += ' --cov=src --cov-report=html --cov-report=term' }
cmd /c "$backendUnitCmd" 2>&1 | Tee-Object -FilePath $backendUnitLog
$backendUnitExit = $LASTEXITCODE
Pop-Location
Append-Summary 'Backend Unit' $backendUnitLog

# 2) Backend integration (subset, mock mode)
Write-Header 'Backend integration tests (subset, mock mode)'
Push-Location (Join-Path $Root 'functions')
$backendIntLog = Join-Path $logsDir 'backend_integration.log'
$backendIntCmd = 'pytest tests/integration -q -k "not test_100_prompts"'
cmd /c "$backendIntCmd" 2>&1 | Tee-Object -FilePath $backendIntLog
$backendIntExit = $LASTEXITCODE
Pop-Location
Append-Summary 'Backend Integration' $backendIntLog

# 3) Frontend E2E (Playwright)
Write-Header 'Frontend E2E (Playwright)'
$env:VITE_E2E_MODE = 'true'
$env:VITE_ENABLE_EMULATORS = 'true'
$env:VITE_SHOW_DEV_OVERLAYS = 'false'
Push-Location (Join-Path $Root 'frontend')
$e2eLog = Join-Path $logsDir 'e2e.log'
cmd /c "npx playwright test rag-flow.spec.ts --reporter=list" 2>&1 | Tee-Object -FilePath $e2eLog
$e2eExit = $LASTEXITCODE
Pop-Location
Append-Summary 'Frontend E2E' $e2eLog

# Final summary
Write-Header 'Final Summary'
$summaryPath = Join-Path $logsDir 'summary.txt'
Get-Content $summaryPath | ForEach-Object { Write-Host $_ }

# Exit code reflects any failure
if ($backendUnitExit -ne 0 -or $backendIntExit -ne 0 -or $e2eExit -ne 0) {
  Write-Host "One or more test stages failed." -ForegroundColor Red
  exit 1
} else {
  Write-Host "All test stages completed successfully." -ForegroundColor Green
  exit 0
}
