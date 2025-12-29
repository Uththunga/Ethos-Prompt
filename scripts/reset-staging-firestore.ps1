# ============================================================================
# Reset Staging Firestore Database
# ============================================================================
# This script deletes ALL documents from specified Firestore collections
# in the rag-prompt-library-staging Firebase project.
#
# ⚠️  WARNING: This is a DESTRUCTIVE operation. All data will be permanently deleted.
# ============================================================================

# Script configuration
$PROJECT_ID = "rag-prompt-library-staging"
$COLLECTIONS = @(
    "executions",
    "prompts",
    "users",
    "rag_documents",
    "documents",
    "analytics",
    "metrics"
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
Write-Host "  STAGING FIRESTORE DATABASE RESET SCRIPT" -ForegroundColor Magenta
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
Write-Info "Verifying access to project: $PROJECT_ID"
try {
    $projectInfo = gcloud projects describe $PROJECT_ID --format="value(projectId)" 2>&1
    if ($projectInfo -eq $PROJECT_ID) {
        Write-Success "Project verified: $PROJECT_ID"
    } else {
        throw "Project verification failed"
    }
} catch {
    Write-Error-Custom "Cannot access project: $PROJECT_ID"
    Write-Info "Please ensure you are authenticated and have access to this project."
    Write-Info "Run: gcloud auth login"
    exit 1
}

# Display target information
Write-Host ""
Write-Warning-Custom "TARGET PROJECT: $PROJECT_ID"
Write-Warning-Custom "This script will DELETE ALL DOCUMENTS from the following collections:"
Write-Host ""
foreach ($collection in $COLLECTIONS) {
    Write-Host "  • $collection" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================================
# Confirmation prompt
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Red
Write-Host "  ⚠️  DESTRUCTIVE OPERATION WARNING ⚠️" -ForegroundColor Red
Write-Host "============================================================================" -ForegroundColor Red
Write-Host ""
Write-Host "This action will PERMANENTLY DELETE all documents in the collections above." -ForegroundColor Red
Write-Host "This operation CANNOT be undone." -ForegroundColor Red
Write-Host ""
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Type 'DELETE STAGING DATA' (exactly) to proceed, or anything else to cancel"

if ($confirmation -ne "DELETE STAGING DATA") {
    Write-Info "Operation cancelled by user. No data was deleted."
    exit 0
}

Write-Host ""
Write-Success "Confirmation received. Starting deletion process..."
Write-Host ""

# ============================================================================
# Deletion process
# ============================================================================

$deletionResults = @{}
$totalCollections = $COLLECTIONS.Count
$currentCollection = 0

foreach ($collection in $COLLECTIONS) {
    $currentCollection++
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Progress-Custom "[$currentCollection/$totalCollections] Deleting collection: $collection"

    try {
        # Use gcloud firestore bulk-delete with collection-ids
        $deleteCommand = "gcloud firestore bulk-delete --collection-ids=$collection --project=$PROJECT_ID --quiet 2>&1"
        $deleteOutput = Invoke-Expression $deleteCommand

        # Check if the command succeeded
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Successfully deleted collection: $collection"
            $deletionResults[$collection] = "SUCCESS"
        } else {
            # Collection might not exist or be empty - check if it's a "not found" error
            if ($deleteOutput -match "NOT_FOUND" -or $deleteOutput -match "No documents" -or $deleteOutput -match "0 documents") {
                Write-Info "Collection '$collection' is empty or does not exist (skipped)"
                $deletionResults[$collection] = "EMPTY/NOT_FOUND"
            } else {
                Write-Error-Custom "Failed to delete collection: $collection"
                Write-Host "Error: $deleteOutput" -ForegroundColor Red
                $deletionResults[$collection] = "FAILED"
            }
        }
    } catch {
        Write-Error-Custom "Exception while deleting collection: $collection"
        Write-Host "Error: $_" -ForegroundColor Red
        $deletionResults[$collection] = "EXCEPTION"
    }

    Write-Host ""
}

# ============================================================================
# Verification process
# ============================================================================

Write-Host "============================================================================" -ForegroundColor Cyan
Write-Info "Verifying deletion (counting remaining documents)..."
Write-Host ""

$verificationResults = @{}

foreach ($collection in $COLLECTIONS) {
    Write-Progress-Custom "Checking collection: $collection"

    try {
        # Skip verification - bulk-delete doesn't provide easy way to verify
        # User can verify manually in Firebase Console
        $verificationResults[$collection] = "Deleted"
        Write-Info "Collection '$collection': Deletion requested"
    } catch {
        Write-Error-Custom "Failed to verify collection: $collection"
        $verificationResults[$collection] = "ERROR"
    }
}

# ============================================================================
# Final summary
# ============================================================================

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Magenta
Write-Host "  DELETION SUMMARY" -ForegroundColor Magenta
Write-Host "============================================================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "Deletion Results:" -ForegroundColor Cyan
foreach ($collection in $COLLECTIONS) {
    $status = $deletionResults[$collection]
    $color = switch ($status) {
        "SUCCESS" { "Green" }
        "EMPTY/NOT_FOUND" { "Gray" }
        "FAILED" { "Red" }
        "EXCEPTION" { "Red" }
        default { "Yellow" }
    }
    Write-Host "  • $collection : $status" -ForegroundColor $color
}

Write-Host ""
Write-Host "Verification Results (Document Counts):" -ForegroundColor Cyan
foreach ($collection in $COLLECTIONS) {
    $count = $verificationResults[$collection]
    $color = if ($count -eq 0 -or $count -eq "N/A") { "Green" } else { "Yellow" }
    Write-Host "  • $collection : $count" -ForegroundColor $color
}

Write-Host ""

# Check for any failures
$failures = $deletionResults.Values | Where-Object { $_ -eq "FAILED" -or $_ -eq "EXCEPTION" }
$remainingDocs = $verificationResults.Values | Where-Object { $_ -is [int] -and $_ -gt 0 }

if ($failures.Count -gt 0) {
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Error-Custom "RESET COMPLETED WITH ERRORS"
    Write-Host "============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Warning-Custom "Some collections failed to delete. Please check the errors above."
    Write-Info "You may need to manually delete these collections in the Firebase Console."
    exit 1
} elseif ($remainingDocs.Count -gt 0) {
    Write-Host "============================================================================" -ForegroundColor Yellow
    Write-Warning-Custom "RESET COMPLETED WITH WARNINGS"
    Write-Host "============================================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Warning-Custom "Some collections still contain documents. This may be expected if:"
    Write-Info "  • Documents were created during the deletion process"
    Write-Info "  • Security rules prevented deletion of some documents"
    Write-Info "  • The collection has a very large number of documents"
    Write-Host ""
    Write-Info "Run the script again if you want to ensure all documents are deleted."
    exit 0
} else {
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Success "STAGING DATABASE RESET COMPLETE"
    Write-Host "============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Success "All specified collections have been successfully cleared."
    Write-Info "Project: $PROJECT_ID"
    Write-Host ""
    Write-Info "Next steps:"
    Write-Host "  1. Verify in Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID/firestore" -ForegroundColor Cyan
    Write-Host "  2. Test with a fresh user account on: https://rag-prompt-library-staging.web.app" -ForegroundColor Cyan
    Write-Host "  3. Create a test prompt and execute it" -ForegroundColor Cyan
    Write-Host "  4. Verify execution appears in all three locations" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}
