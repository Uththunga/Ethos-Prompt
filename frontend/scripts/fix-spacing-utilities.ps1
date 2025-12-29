# Automated Spacing Utilities Fix Script
# This script replaces all space-x-* and space-y-* utilities with working alternatives

param(
    [switch]$DryRun = $false,
    [switch]$Backup = $true
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Split-Path -Parent $scriptDir
$srcDir = Join-Path $frontendDir "src"
$componentsDir = Join-Path $srcDir "components"

Write-Host "=== Automated Spacing Utilities Fix Script ===" -ForegroundColor Cyan
Write-Host "Target Directory: $componentsDir" -ForegroundColor Yellow
Write-Host "Dry Run: $DryRun" -ForegroundColor Yellow
Write-Host "Create Backup: $Backup" -ForegroundColor Yellow
Write-Host ""

# Statistics
$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    SpaceXReplaced = 0
    SpaceYReplaced = 0
    TotalReplacements = 0
}

# Create backup directory if needed
if ($Backup -and -not $DryRun) {
    $backupDir = Join-Path $frontendDir "backup-spacing-fix-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "Backup directory created: $backupDir" -ForegroundColor Green
}

# Get all TypeScript/JavaScript files in components directory
$files = Get-ChildItem -Path $componentsDir -Recurse -Include *.tsx,*.ts,*.jsx,*.js

Write-Host "Found $($files.Count) files to process..." -ForegroundColor Cyan
Write-Host ""

foreach ($file in $files) {
    $stats.FilesProcessed++
    $relativePath = $file.FullName.Replace($componentsDir + "\", "")
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    $originalContent = $content
    $fileModified = $false
    
    # Track replacements for this file
    $fileReplacements = @{
        SpaceX = 0
        SpaceY = 0
    }
    
    # Replace space-x-* with gap-*
    # Pattern: space-x-(\d+) -> gap-$1
    $spaceXPattern = 'space-x-(\d+)'
    $spaceXMatches = [regex]::Matches($content, $spaceXPattern)
    
    foreach ($match in $spaceXMatches) {
        $oldValue = $match.Value
        $number = $match.Groups[1].Value
        $newValue = "gap-$number"
        $content = $content -replace [regex]::Escape($oldValue), $newValue
        $fileReplacements.SpaceX++
        $stats.SpaceXReplaced++
    }
    
    # Replace space-y-* with mb-* (more complex - needs context awareness)
    # For now, we'll do a simple replacement and note that manual review may be needed
    # Pattern: space-y-(\d+) -> Note: This requires adding mb-* to children
    $spaceYPattern = 'space-y-(\d+)'
    $spaceYMatches = [regex]::Matches($content, $spaceYPattern)
    
    # For space-y, we'll remove it and add a comment for manual review
    foreach ($match in $spaceYMatches) {
        $oldValue = $match.Value
        $number = $match.Groups[1].Value
        
        # Strategy: Remove space-y-* and add a comment
        # The developer will need to add mb-* to child elements manually
        # But we can try to be smart about it
        
        # Find the className containing space-y-*
        $classNamePattern = "className=[`"']([^`"']*$oldValue[^`"']*)[`"']"
        $classNameMatch = [regex]::Match($content, $classNamePattern)
        
        if ($classNameMatch.Success) {
            $fullClassName = $classNameMatch.Groups[1].Value
            # Remove space-y-* from the className
            $newClassName = $fullClassName -replace [regex]::Escape($oldValue), ""
            # Clean up extra spaces
            $newClassName = $newClassName -replace '\s+', ' '
            $newClassName = $newClassName.Trim()
            
            # Replace in content
            $oldClassNameAttr = "className=`"$fullClassName`""
            $newClassNameAttr = "className=`"$newClassName`""
            $content = $content.Replace($oldClassNameAttr, $newClassNameAttr)
            
            # Also handle single quotes
            $oldClassNameAttr = "className='$fullClassName'"
            $newClassNameAttr = "className='$newClassName'"
            $content = $content.Replace($oldClassNameAttr, $newClassNameAttr)
            
            $fileReplacements.SpaceY++
            $stats.SpaceYReplaced++
        }
    }
    
    # Check if file was modified
    if ($content -ne $originalContent) {
        $fileModified = $true
        $stats.FilesModified++
        $stats.TotalReplacements += ($fileReplacements.SpaceX + $fileReplacements.SpaceY)
        
        Write-Host "[$($stats.FilesProcessed)/$($files.Count)] $relativePath" -ForegroundColor Yellow
        if ($fileReplacements.SpaceX -gt 0) {
            Write-Host "  - Replaced $($fileReplacements.SpaceX) space-x-* with gap-*" -ForegroundColor Green
        }
        if ($fileReplacements.SpaceY -gt 0) {
            Write-Host "  - Removed $($fileReplacements.SpaceY) space-y-* (manual review needed)" -ForegroundColor Magenta
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

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Files Processed: $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "Files Modified: $($stats.FilesModified)" -ForegroundColor Yellow
Write-Host "space-x-* Replaced: $($stats.SpaceXReplaced)" -ForegroundColor Green
Write-Host "space-y-* Removed: $($stats.SpaceYReplaced)" -ForegroundColor Magenta
Write-Host "Total Replacements: $($stats.TotalReplacements)" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host ""
    Write-Host "DRY RUN - No files were modified" -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Changes applied successfully!" -ForegroundColor Green
    if ($Backup) {
        Write-Host "Backup created at: $backupDir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "IMPORTANT: space-y-* utilities have been removed." -ForegroundColor Red
Write-Host "You need to manually add mb-* classes to child elements." -ForegroundColor Red
Write-Host "Review the modified files and add appropriate margin-bottom classes." -ForegroundColor Red

