# PowerShell Script to Delete Duplicate Images
# This script removes duplicate images from assets/images directory
# while keeping unique subdirectories (workflow/ and apps/)

$ErrorActionPreference = "Stop"
$baseDir = "frontend/public/assets/images"

Write-Host "[DELETE] Starting Duplicate Image Cleanup..." -ForegroundColor Cyan
Write-Host ""

# Counter for tracking
$deletedFiles = 0
$deletedDirs = 0
$totalSize = 0

# Function to delete file and track stats
function Remove-FileWithStats {
    param($filePath)

    if (Test-Path $filePath) {
        $size = (Get-Item $filePath).Length
        Remove-Item $filePath -Force
        $script:deletedFiles++
        $script:totalSize += $size
        Write-Host "  [OK] Deleted: $filePath" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] Not found: $filePath" -ForegroundColor Yellow
    }
}

# Function to delete directory
function Remove-DirectoryWithStats {
    param($dirPath)

    if (Test-Path $dirPath) {
        $fileCount = (Get-ChildItem $dirPath -Recurse -File).Count
        Remove-Item $dirPath -Recurse -Force
        $script:deletedDirs++
        Write-Host "  [OK] Deleted directory: $dirPath ($fileCount files)" -ForegroundColor Green
    } else {
        Write-Host "  [SKIP] Not found: $dirPath" -ForegroundColor Yellow
    }
}

Write-Host "[STEP 1] Deleting root-level duplicate images..." -ForegroundColor Yellow

# Root level duplicates (42 files)
$rootDuplicates = @(
    "ai 3 1.png",
    "ai-communication-illustration.jpg",
    "ai-workflow-diagram.png",
    "ai-workflow-diagram.svg",
    "ai-workflow-diagram-optimized.svg",
    "ai-workflow-diagram-original.svg",
    "ai-workflow-illustration.jpg",
    "App Logos.png",
    "background-grid-pattern.png",
    "banner-background.jpg",
    "bot.png",
    "botsolution.png",
    "brain-icon.png",
    "brain-white.svg",
    "brain.svg",
    "CAS.png",
    "check-icon.png",
    "digitaltransformation.png",
    "ethos-logo.png",
    "ethosbrain.svg",
    "ethosbrain-optimized.svg",
    "ethosbrain-original.svg",
    "footer-background.jpg",
    "Group 200.png",
    "Group 282.png",
    "Group 287.svg",
    "Group 287 - Copy.svg",
    "Group 2881.svg",
    "Group 288.png",
    "Group hero.png",
    "image 25.png",
    "integration-background.jpg",
    "integration-background.png",
    "integrationapp.png",
    "Mole.png",
    "mole1.png",
    "moleicon.png",
    "prompting-illustration.jpg",
    "promptmole.png",
    "service-comparison.jpg",
    "social-icons.png",
    "sysrem-integration.png",
    "techniques-hero-image.jpg"
)

foreach ($file in $rootDuplicates) {
    $filePath = Join-Path $baseDir $file
    Remove-FileWithStats $filePath
}

Write-Host ""
Write-Host "[STEP 2] Deleting duplicate subdirectories..." -ForegroundColor Yellow

# Delete entire subdirectories
$subdirsToDelete = @(
    "basics",
    "prompting-guide",
    "techniques"
)

foreach ($dir in $subdirsToDelete) {
    $dirPath = Join-Path $baseDir $dir
    Remove-DirectoryWithStats $dirPath
}

Write-Host ""
Write-Host "[VERIFY] Checking unique directories are preserved..." -ForegroundColor Yellow

# Verify workflow and apps directories still exist
$workflowDir = Join-Path $baseDir "workflow"
$appsDir = Join-Path $baseDir "apps"

if (Test-Path $workflowDir) {
    $workflowCount = (Get-ChildItem $workflowDir -File).Count
    Write-Host "  [OK] workflow/ directory preserved ($workflowCount files)" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] workflow/ directory not found!" -ForegroundColor Red
}

if (Test-Path $appsDir) {
    $appsCount = (Get-ChildItem $appsDir -File).Count
    Write-Host "  [OK] apps/ directory preserved ($appsCount files)" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] apps/ directory not found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "[SUMMARY] CLEANUP SUMMARY" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Files Deleted: $deletedFiles" -ForegroundColor White
Write-Host "  Directories Deleted: $deletedDirs" -ForegroundColor White
Write-Host "  Space Freed: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SUCCESS] Cleanup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run 'npm run build' to verify build still works" -ForegroundColor White
Write-Host "  2. Test the application locally" -ForegroundColor White
Write-Host "  3. Commit changes to git" -ForegroundColor White
