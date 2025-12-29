# Rollback script for zen-home migration
param(
    [switch]$Force
)

Write-Host "Starting migration rollback..." -ForegroundColor Yellow

if (-not $Force) {
    $confirm = Read-Host "This will revert all migration changes. Continue? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Rollback cancelled." -ForegroundColor Green
        exit 0
    }
}

try {
    # Stop any running processes
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force
    
    Write-Host "Restoring configuration files..." -ForegroundColor Yellow
    
    # Restore configuration files
    if (Test-Path "migration-backups\package.json.backup") {
        Copy-Item "migration-backups\package.json.backup" "frontend\package.json" -Force
        Write-Host "  ✓ Restored package.json" -ForegroundColor Green
    }
    
    if (Test-Path "migration-backups\tailwind.config.js.backup") {
        Copy-Item "migration-backups\tailwind.config.js.backup" "frontend\tailwind.config.js" -Force
        Write-Host "  ✓ Restored tailwind.config.js" -ForegroundColor Green
    }
    
    if (Test-Path "migration-backups\tsconfig.json.backup") {
        Copy-Item "migration-backups\tsconfig.json.backup" "frontend\tsconfig.json" -Force
        Write-Host "  ✓ Restored tsconfig.json" -ForegroundColor Green
    }
    
    if (Test-Path "migration-backups\tsconfig.app.json.backup") {
        Copy-Item "migration-backups\tsconfig.app.json.backup" "frontend\tsconfig.app.json" -Force
        Write-Host "  ✓ Restored tsconfig.app.json" -ForegroundColor Green
    }
    
    if (Test-Path "migration-backups\vite.config.ts.backup") {
        Copy-Item "migration-backups\vite.config.ts.backup" "frontend\vite.config.ts" -Force
        Write-Host "  ✓ Restored vite.config.ts" -ForegroundColor Green
    }
    
    Write-Host "Removing migration directories..." -ForegroundColor Yellow
    
    # Remove marketing directories
    Remove-Item "frontend\src\pages\marketing" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "frontend\src\components\marketing" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "frontend\public\assets\marketing" -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "  ✓ Removed marketing directories" -ForegroundColor Green
    
    # Reinstall original dependencies
    Write-Host "Reinstalling original dependencies..." -ForegroundColor Yellow
    Set-Location "frontend"
    
    # Clean install
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue
    
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Dependencies reinstalled successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to reinstall dependencies" -ForegroundColor Red
    }
    
    Set-Location ".."
    
    Write-Host "Rollback completed successfully!" -ForegroundColor Green
    Write-Host "You can now test the application to ensure it's working correctly." -ForegroundColor Cyan
    
} catch {
    Write-Host "Error during rollback: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Manual intervention may be required." -ForegroundColor Yellow
    exit 1
}