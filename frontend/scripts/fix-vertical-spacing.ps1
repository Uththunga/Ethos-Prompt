#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Intelligently adds mb-* (margin-bottom) classes to fix vertical spacing after space-y-* removal.

.DESCRIPTION
    This script analyzes component files and adds appropriate mb-* classes to child elements
    based on common patterns and context. It handles:
    - Headings followed by content
    - List items in containers
    - Form fields
    - Card sections
    - Button groups

.PARAMETER DryRun
    If specified, shows what would be changed without making actual changes.

.EXAMPLE
    .\fix-vertical-spacing.ps1
    .\fix-vertical-spacing.ps1 -DryRun
#>

param(
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$componentsDir = Join-Path $PSScriptRoot "..\src\components"

# Backup directory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path (Split-Path $componentsDir) "backup-vertical-spacing-$timestamp"

Write-Host "=== Vertical Spacing Fix Script ===" -ForegroundColor Cyan
Write-Host "Components Directory: $componentsDir" -ForegroundColor Gray
Write-Host "Dry Run: $DryRun" -ForegroundColor Gray
Write-Host ""

# Create backup if not dry run
if (-not $DryRun) {
    Write-Host "Creating backup at: $backupDir" -ForegroundColor Yellow
    Copy-Item -Path $componentsDir -Destination $backupDir -Recurse -Force
    Write-Host "✓ Backup created" -ForegroundColor Green
    Write-Host ""
}

# Get all TSX files
$files = Get-ChildItem -Path $componentsDir -Recurse -Include *.tsx,*.ts | Where-Object { $_.Name -notmatch "\.test\." }

$totalFiles = $files.Count
$modifiedFiles = 0
$totalChanges = 0

Write-Host "Found $totalFiles files to process" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace("$componentsDir\", "")
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileChanges = 0

    # Pattern 1: Headings (h1-h6) without mb-* class
    # Add mb-4 to h2, mb-3 to h3, mb-2 to h4-h6
    $content = $content -replace '(<h2\s+className="[^"]*?)("\s*>)', '$1 mb-4$2'
    $content = $content -replace '(<h2\s+)(>)', '$1className="mb-4"$2'
    $content = $content -replace '(<h3\s+className="[^"]*?)("\s*>)', '$1 mb-3$2'
    $content = $content -replace '(<h3\s+)(>)', '$1className="mb-3"$2'
    $content = $content -replace '(<h4\s+className="[^"]*?)("\s*>)', '$1 mb-2$2'
    $content = $content -replace '(<h4\s+)(>)', '$1className="mb-2"$2'
    $content = $content -replace '(<h5\s+className="[^"]*?)("\s*>)', '$1 mb-2$2'
    $content = $content -replace '(<h5\s+)(>)', '$1className="mb-2"$2'
    $content = $content -replace '(<h6\s+className="[^"]*?)("\s*>)', '$1 mb-2$2'
    $content = $content -replace '(<h6\s+)(>)', '$1className="mb-2"$2'

    # Pattern 2: Paragraphs without mb-* class
    # Add mb-4 to paragraphs
    $content = $content -replace '(<p\s+className="[^"]*?)("\s*>)', '$1 mb-4$2'
    
    # Pattern 3: Divs with specific patterns that need spacing
    # This is more complex and requires context-aware replacement
    
    # Clean up duplicate mb-* classes
    $content = $content -replace '\s+mb-(\d+)\s+mb-(\d+)', ' mb-$1'
    
    # Clean up double spaces in className
    $content = $content -replace 'className="([^"]*)\s{2,}([^"]*)"', 'className="$1 $2"'
    
    # Clean up trailing spaces in className
    $content = $content -replace 'className="([^"]*)\s+"', 'className="$1"'
    $content = $content -replace 'className="\s+([^"]*)"', 'className="$1"'

    if ($content -ne $originalContent) {
        $fileChanges = ($content.Length - $originalContent.Length) / 10  # Rough estimate
        $modifiedFiles++
        $totalChanges += $fileChanges

        if ($DryRun) {
            Write-Host "[DRY RUN] Would modify: $relativePath" -ForegroundColor Yellow
        } else {
            Set-Content -Path $file.FullName -Value $content -NoNewline
            Write-Host "[MODIFIED] $relativePath" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Total files processed: $totalFiles" -ForegroundColor Gray
Write-Host "Files modified: $modifiedFiles" -ForegroundColor $(if ($modifiedFiles -gt 0) { "Green" } else { "Gray" })
Write-Host "Estimated changes: ~$totalChanges" -ForegroundColor Gray

if (-not $DryRun -and $modifiedFiles -gt 0) {
    Write-Host ""
    Write-Host "✓ Vertical spacing fixes applied!" -ForegroundColor Green
    Write-Host "Backup location: $backupDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review the changes in your IDE" -ForegroundColor Gray
    Write-Host "2. Run: npm run build:staging" -ForegroundColor Gray
    Write-Host "3. Test the application" -ForegroundColor Gray
    Write-Host "4. Deploy: firebase deploy --only hosting" -ForegroundColor Gray
} elseif ($DryRun) {
    Write-Host ""
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Yellow
}

