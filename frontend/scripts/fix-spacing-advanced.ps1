# Advanced Automated Spacing Utilities Fix Script
# This script intelligently replaces space-x-* and space-y-* utilities

param(
    [switch]$DryRun = $false,
    [switch]$Backup = $true,
    [string]$TargetDir = ""
)

$ErrorActionPreference = "Stop"

# Determine target directory
if ($TargetDir) {
    $componentsDir = $TargetDir
} else {
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $frontendDir = Split-Path -Parent $scriptDir
    $srcDir = Join-Path $frontendDir "src"
    $componentsDir = Join-Path $srcDir "components"
}

Write-Host "=== Advanced Spacing Utilities Fix Script ===" -ForegroundColor Cyan
Write-Host "Target Directory: $componentsDir" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host "Create Backup: $Backup" -ForegroundColor Yellow
Write-Host ""

# Statistics
$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    SpaceXReplaced = 0
    SpaceYRemoved = 0
    TotalReplacements = 0
    Errors = 0
}

$changeLog = @()

# Create backup directory if needed
if ($Backup -and -not $DryRun) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupDir = Join-Path (Split-Path -Parent $componentsDir) "backup-spacing-fix-$timestamp"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "Backup directory created: $backupDir" -ForegroundColor Green
    Write-Host ""
}

# Get all TypeScript/JavaScript files
$files = Get-ChildItem -Path $componentsDir -Recurse -Include *.tsx,*.ts,*.jsx,*.js

Write-Host "Found $($files.Count) files to process..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $stats.FilesProcessed++
    $relativePath = $file.FullName.Replace($componentsDir + "\", "")

    try {
        # Read file content
        $content = Get-Content -Path $file.FullName -Raw
        $originalContent = $content
        $fileModified = $false

        # Track replacements for this file
        $fileChanges = @()

        # ===== FIX 1: Replace space-x-* with gap-* =====
        $spaceXPattern = '\bspace-x-(\d+)\b'
        $spaceXMatches = [regex]::Matches($content, $spaceXPattern)

        if ($spaceXMatches.Count -gt 0) {
            foreach ($match in $spaceXMatches) {
                $oldValue = $match.Value
                $number = $match.Groups[1].Value
                $newValue = "gap-$number"
                $content = $content -replace "\b$oldValue\b", $newValue
                $fileChanges += "  [OK] Replaced '$oldValue' with '$newValue'"
                $stats.SpaceXReplaced++
            }
        }

        # ===== FIX 2: Remove space-y-* =====
        # We'll remove space-y-* from className and add a TODO comment
        $spaceYPattern = '\bspace-y-(\d+)\b'
        $spaceYMatches = [regex]::Matches($content, $spaceYPattern)

        if ($spaceYMatches.Count -gt 0) {
            foreach ($match in $spaceYMatches) {
                $oldValue = $match.Value
                $number = $match.Groups[1].Value

                # Remove space-y-* from className
                # Handle both double and single quotes
                $content = $content -replace "\s+$oldValue\b", ""
                $content = $content -replace "\b$oldValue\s+", ""
                $content = $content -replace "\b$oldValue\b", ""

                $fileChanges += "  [WARN] Removed '$oldValue' - Add mb-$number to child elements"
                $stats.SpaceYRemoved++
            }
        }

        # Clean up empty className attributes
        $content = $content -replace 'className=["''][\s]*["'']', ''
        $content = $content -replace 'className=\{["''][\s]*["'']\}', ''

        # Check if file was modified
        if ($content -ne $originalContent) {
            $fileModified = $true
            $stats.FilesModified++
            $stats.TotalReplacements += $fileChanges.Count

            Write-Host "[$($stats.FilesProcessed)/$($files.Count)] $relativePath" -ForegroundColor Yellow
            foreach ($change in $fileChanges) {
                Write-Host $change -ForegroundColor $(if ($change -match "\[OK\]") { "Green" } else { "Magenta" })
            }

            $changeLog += @{
                File = $relativePath
                Changes = $fileChanges
            }

            if (-not $DryRun) {
                # Create backup if enabled
                if ($Backup) {
                    $backupPath = Join-Path $backupDir $relativePath
                    $backupParent = Split-Path -Parent $backupPath
                    if (-not (Test-Path $backupParent)) {
                        New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
                    }
                    Copy-Item -Path $file.FullName -Destination $backupPath -Force
                }

                # Write modified content
                Set-Content -Path $file.FullName -Value $content -NoNewline
            }
        }
    }
    catch {
        $stats.Errors++
        Write-Host "ERROR processing $relativePath : $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Files Processed: $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "Files Modified: $($stats.FilesModified)" -ForegroundColor Yellow
Write-Host "space-x-* → gap-*: $($stats.SpaceXReplaced)" -ForegroundColor Green
Write-Host "space-y-* Removed: $($stats.SpaceYRemoved)" -ForegroundColor Magenta
Write-Host "Total Changes: $($stats.TotalReplacements)" -ForegroundColor Cyan
Write-Host "Errors: $($stats.Errors)" -ForegroundColor $(if ($stats.Errors -gt 0) { "Red" } else { "Green" })

if ($DryRun) {
    Write-Host ""
    Write-Host "=== DRY RUN - No files were modified ===" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "=== Changes Applied Successfully! ===" -ForegroundColor Green
    if ($Backup) {
        Write-Host "Backup created at: $backupDir" -ForegroundColor Green
    }

    # Save change log
    $logPath = Join-Path (Split-Path -Parent $componentsDir) "spacing-fix-changelog-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    $changeLog | ForEach-Object {
        "File: $($_.File)" | Out-File -FilePath $logPath -Append
        $_.Changes | ForEach-Object { "  $_" | Out-File -FilePath $logPath -Append }
        "" | Out-File -FilePath $logPath -Append
    }
    Write-Host "Change log saved to: $logPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Review files where space-y-* was removed (marked with WARN)" -ForegroundColor Yellow
Write-Host "2. Add mb-* classes to child elements as needed" -ForegroundColor Yellow
Write-Host "3. Test the application thoroughly" -ForegroundColor Yellow
Write-Host "4. Run npm run build:staging to verify" -ForegroundColor Yellow
Write-Host "5. Deploy to staging for testing" -ForegroundColor Yellow
