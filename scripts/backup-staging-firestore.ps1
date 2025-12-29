# ============================================================================
# Backup Staging Firestore Database
# ============================================================================
# This script exports all Firestore collections from rag-prompt-library-staging
# to Google Cloud Storage for backup purposes.
#
# Usage:
#   .\scripts\backup-staging-firestore.ps1
#   .\scripts\backup-staging-firestore.ps1 -BucketName "my-custom-bucket"
#
# Prerequisites:
#   - Google Cloud SDK (gcloud) installed
#   - Authenticated with gcloud (run: gcloud auth login)
#   - GCS bucket exists (or script will attempt to create one)
# ============================================================================

param(
    [string]$BucketName = "rag-prompt-library-staging-backups",
    [string]$ProjectId = "rag-prompt-library-staging"
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
Write-Host "  STAGING FIRESTORE BACKUP SCRIPT" -ForegroundColor Magenta
Write-Host "============================================================================" -ForegroundColor Magenta
Write-Host ""

# Check if gcloud is installed
Write-Info "Checking for gcloud CLI..."
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Success "gcloud CLI found: $gcloudVersion"
} catch {
    Write-Error-Custom "gcloud CLI not found. Please install Google Cloud SDK first."
    Write-Info "Download from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Verify project exists and is accessible
Write-Info "Verifying access to project: $ProjectId"
try {
    $projectInfo = gcloud projects describe $ProjectId --format="value(projectId)" 2>&1
    if ($projectInfo -eq $ProjectId) {
        Write-Success "Project verified: $ProjectId"
    } else {
        throw "Project verification failed"
    }
} catch {
    Write-Error-Custom "Cannot access project: $ProjectId"
    Write-Info "Please ensure you are authenticated and have access to this project."
    Write-Info "Run: gcloud auth login"
    exit 1
}

# ============================================================================
# GCS Bucket setup
# ============================================================================

Write-Host ""
Write-Info "Checking GCS bucket: gs://$BucketName"

# Check if bucket exists
$bucketExists = $false
try {
    $bucketCheck = gsutil ls -b "gs://$BucketName" 2>&1
    if ($LASTEXITCODE -eq 0) {
        $bucketExists = $true
        Write-Success "Bucket exists: gs://$BucketName"
    }
} catch {
    # Bucket doesn't exist
}

# Create bucket if it doesn't exist
if (-not $bucketExists) {
    Write-Warning-Custom "Bucket does not exist. Creating: gs://$BucketName"
    try {
        $createBucket = gsutil mb -p $ProjectId -l australia-southeast1 "gs://$BucketName" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Bucket created successfully: gs://$BucketName"
        } else {
            throw "Failed to create bucket: $createBucket"
        }
    } catch {
        Write-Error-Custom "Failed to create GCS bucket: $_"
        Write-Info "Please create the bucket manually or specify an existing bucket."
        Write-Info "Run: gsutil mb -p $ProjectId -l australia-southeast1 gs://$BucketName"
        exit 1
    }
}

# ============================================================================
# Backup configuration
# ============================================================================

# Generate timestamp-based backup folder name
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFolder = "backup-$timestamp"
$backupPath = "gs://$BucketName/$backupFolder"

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Info "Backup Configuration:"
Write-Host "  Project ID    : $ProjectId" -ForegroundColor White
Write-Host "  Bucket        : gs://$BucketName" -ForegroundColor White
Write-Host "  Backup Folder : $backupFolder" -ForegroundColor White
Write-Host "  Full Path     : $backupPath" -ForegroundColor White
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""

# Confirmation
$confirmation = Read-Host "Proceed with backup? (Y/N)"
if ($confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Info "Backup cancelled by user."
    exit 0
}

# ============================================================================
# Export Firestore to GCS
# ============================================================================

Write-Host ""
Write-Progress-Custom "Starting Firestore export..."
Write-Info "This may take several minutes depending on database size..."
Write-Host ""

$startTime = Get-Date

try {
    # Run gcloud firestore export
    $exportCommand = "gcloud firestore export `"$backupPath`" --project=$ProjectId 2>&1"
    Write-Info "Running: gcloud firestore export $backupPath --project=$ProjectId"

    $exportOutput = Invoke-Expression $exportCommand

    if ($LASTEXITCODE -eq 0) {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds

        Write-Host ""
        Write-Success "Firestore export completed successfully!"
        Write-Info "Duration: $([math]::Round($duration, 2)) seconds"
        Write-Host ""
    } else {
        throw "Export failed with exit code: $LASTEXITCODE`nOutput: $exportOutput"
    }
} catch {
    Write-Error-Custom "Firestore export failed: $_"
    Write-Info "Please check your permissions and try again."
    exit 1
}

# ============================================================================
# Verify backup
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Progress-Custom "Verifying backup..."
Write-Host ""

try {
    # List files in backup folder
    $listCommand = "gsutil ls -r `"$backupPath`" 2>&1"
    $backupFiles = Invoke-Expression $listCommand

    if ($LASTEXITCODE -eq 0) {
        # Count files
        $fileCount = ($backupFiles | Where-Object { $_ -match "\.overall_export_metadata$|\.export_metadata$" }).Count

        if ($fileCount -gt 0) {
            Write-Success "Backup verification successful!"
            Write-Info "Found $fileCount metadata file(s) in backup"
        } else {
            Write-Warning-Custom "Backup folder exists but metadata files not found"
            Write-Info "This may be normal if the database was empty"
        }
    } else {
        Write-Warning-Custom "Could not verify backup files: $backupFiles"
    }
} catch {
    Write-Warning-Custom "Backup verification failed: $_"
    Write-Info "Backup may still be valid. Check GCS console to verify."
}

# ============================================================================
# Display backup information
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Green
Write-Success "BACKUP COMPLETE"
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Info "Backup Details:"
Write-Host "  Location: $backupPath" -ForegroundColor Cyan
Write-Host "  Timestamp: $timestamp" -ForegroundColor Cyan
Write-Host ""
Write-Info "View backup in GCS Console:"
Write-Host "  https://console.cloud.google.com/storage/browser/$BucketName/$backupFolder?project=$ProjectId" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# Restore instructions
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Yellow
Write-Info "HOW TO RESTORE FROM THIS BACKUP:"
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  WARNING: Restore will OVERWRITE existing Firestore data!" -ForegroundColor Red
Write-Host ""
Write-Host "1. Using gcloud CLI:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   gcloud firestore import `"$backupPath`" --project=$ProjectId" -ForegroundColor White
Write-Host ""
Write-Host "2. Using Firebase Console:" -ForegroundColor Cyan
Write-Host "   a. Go to: https://console.firebase.google.com/project/$ProjectId/firestore" -ForegroundColor White
Write-Host "   b. Click 'Import/Export' tab" -ForegroundColor White
Write-Host "   c. Click 'Import data'" -ForegroundColor White
Write-Host "   d. Select bucket: gs://$BucketName" -ForegroundColor White
Write-Host "   e. Select folder: $backupFolder" -ForegroundColor White
Write-Host "   f. Click 'Import'" -ForegroundColor White
Write-Host ""
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host ""

# ============================================================================
# List all backups
# ============================================================================

Write-Info "Listing all backups in bucket..."
Write-Host ""

try {
    $allBackups = gsutil ls "gs://$BucketName/" 2>&1 | Where-Object { $_ -match "backup-\d{8}-\d{6}" }

    if ($allBackups) {
        Write-Host "Available backups:" -ForegroundColor Cyan
        foreach ($backup in $allBackups) {
            $backupName = $backup -replace "gs://$BucketName/", "" -replace "/$", ""
            if ($backupName -eq $backupFolder) {
                Write-Host "  • $backupName (CURRENT)" -ForegroundColor Green
            } else {
                Write-Host "  • $backupName" -ForegroundColor White
            }
        }
    } else {
        Write-Info "No other backups found in bucket"
    }
} catch {
    Write-Warning-Custom "Could not list backups: $_"
}

Write-Host ""
Write-Success "Backup script completed successfully!"
Write-Host ""

exit 0
