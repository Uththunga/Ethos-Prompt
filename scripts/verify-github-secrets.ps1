# Task 1.6 Verification Script - GitHub Secrets Configuration
# This script helps verify that GitHub secrets are correctly configured

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Task 1.6 Verification Script" -ForegroundColor Cyan
Write-Host "GitHub Secrets Configuration Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Initialize results
$results = @{
    TotalChecks = 0
    PassedChecks = 0
    FailedChecks = 0
    Warnings = 0
}

function Test-Check {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$SuccessMessage,
        [string]$FailureMessage
    )
    
    $script:results.TotalChecks++
    
    if ($Passed) {
        Write-Host "[PASS] $Name" -ForegroundColor Green
        Write-Host "       $SuccessMessage" -ForegroundColor Gray
        $script:results.PassedChecks++
    } else {
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        Write-Host "       $FailureMessage" -ForegroundColor Yellow
        $script:results.FailedChecks++
    }
    Write-Host ""
}

function Test-Warning {
    param(
        [string]$Name,
        [string]$Message
    )
    
    Write-Host "[WARN] $Name" -ForegroundColor Yellow
    Write-Host "       $Message" -ForegroundColor Gray
    $script:results.Warnings++
    Write-Host ""
}

# Check 1: Verify .gitignore excludes service account files
Write-Host "Check 1: Verifying .gitignore configuration..." -ForegroundColor Cyan
$gitignorePath = ".gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    $hasServiceAccountExclusion = $gitignoreContent -match '\*-firebase-adminsdk-\*\.json' -or 
                                   $gitignoreContent -match 'service-account.*\.json'
    
    Test-Check -Name ".gitignore excludes service account files" `
               -Passed $hasServiceAccountExclusion `
               -SuccessMessage "Service account files are properly excluded from version control" `
               -FailureMessage "Add service account exclusions to .gitignore (see guide Step 4.2)"
} else {
    Test-Check -Name ".gitignore file exists" `
               -Passed $false `
               -SuccessMessage "" `
               -FailureMessage ".gitignore file not found in repository root"
}

# Check 2: Verify no service account files in repository
Write-Host "Check 2: Scanning for service account files in repository..." -ForegroundColor Cyan
$serviceAccountFiles = Get-ChildItem -Path . -Recurse -Filter "*firebase-adminsdk*.json" -ErrorAction SilentlyContinue
$hasNoServiceAccountFiles = $serviceAccountFiles.Count -eq 0

Test-Check -Name "No service account files in repository" `
           -Passed $hasNoServiceAccountFiles `
           -SuccessMessage "No service account JSON files found in repository (good!)" `
           -FailureMessage "Found $($serviceAccountFiles.Count) service account file(s). DELETE IMMEDIATELY and remove from git history!"

if (-not $hasNoServiceAccountFiles) {
    Write-Host "       Files found:" -ForegroundColor Red
    foreach ($file in $serviceAccountFiles) {
        Write-Host "       - $($file.FullName)" -ForegroundColor Red
    }
    Write-Host ""
}

# Check 3: Verify GitHub Actions workflow directory exists
Write-Host "Check 3: Checking GitHub Actions workflow configuration..." -ForegroundColor Cyan
$workflowDir = ".github/workflows"
$workflowDirExists = Test-Path $workflowDir

Test-Check -Name "GitHub Actions workflow directory exists" `
           -Passed $workflowDirExists `
           -SuccessMessage "Workflow directory found at .github/workflows/" `
           -FailureMessage "Create .github/workflows/ directory for GitHub Actions"

# Check 4: Check for staging deployment workflow
if ($workflowDirExists) {
    Write-Host "Check 4: Scanning for staging deployment workflows..." -ForegroundColor Cyan
    $workflowFiles = Get-ChildItem -Path $workflowDir -Filter "*.yml" -ErrorAction SilentlyContinue
    $hasStagingWorkflow = $false
    $stagingWorkflowFile = $null
    
    foreach ($file in $workflowFiles) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match 'FIREBASE_SERVICE_ACCOUNT_STAGING' -or 
            $content -match 'staging' -or 
            $content -match 'rag-prompt-library-staging') {
            $hasStagingWorkflow = $true
            $stagingWorkflowFile = $file.Name
            break
        }
    }
    
    if ($hasStagingWorkflow) {
        Test-Check -Name "Staging deployment workflow exists" `
                   -Passed $true `
                   -SuccessMessage "Found staging workflow: $stagingWorkflowFile" `
                   -FailureMessage ""
    } else {
        Test-Warning -Name "No staging deployment workflow found" `
                     -Message "Consider creating a GitHub Actions workflow for automated staging deployments"
    }
    
    # Check 5: Verify workflow references correct secrets
    if ($hasStagingWorkflow) {
        Write-Host "Check 5: Verifying workflow secret references..." -ForegroundColor Cyan
        $workflowContent = Get-Content (Join-Path $workflowDir $stagingWorkflowFile) -Raw
        
        $hasServiceAccountSecret = $workflowContent -match 'FIREBASE_SERVICE_ACCOUNT_STAGING'
        $hasProjectIdSecret = $workflowContent -match 'STAGING_PROJECT_ID'
        
        Test-Check -Name "Workflow references FIREBASE_SERVICE_ACCOUNT_STAGING" `
                   -Passed $hasServiceAccountSecret `
                   -SuccessMessage "Workflow correctly references service account secret" `
                   -FailureMessage "Update workflow to use FIREBASE_SERVICE_ACCOUNT_STAGING secret"
        
        Test-Check -Name "Workflow references STAGING_PROJECT_ID" `
                   -Passed $hasProjectIdSecret `
                   -SuccessMessage "Workflow correctly references project ID secret" `
                   -FailureMessage "Update workflow to use STAGING_PROJECT_ID secret"
    }
}

# Check 6: Verify Firebase project configuration
Write-Host "Check 6: Verifying Firebase project configuration..." -ForegroundColor Cyan
$firebaseRcPath = ".firebaserc"
if (Test-Path $firebaseRcPath) {
    $firebaseRcContent = Get-Content $firebaseRcPath -Raw
    $hasStagingAlias = $firebaseRcContent -match '"staging".*"rag-prompt-library-staging"'
    
    Test-Check -Name "Firebase staging alias configured" `
               -Passed $hasStagingAlias `
               -SuccessMessage "Staging alias points to rag-prompt-library-staging" `
               -FailureMessage "Add staging alias to .firebaserc (should already be configured)"
} else {
    Test-Check -Name ".firebaserc file exists" `
               -Passed $false `
               -SuccessMessage "" `
               -FailureMessage ".firebaserc file not found in repository root"
}

# Check 7: Verify environment files
Write-Host "Check 7: Verifying environment configuration files..." -ForegroundColor Cyan
$envStagingPath = "frontend/.env.staging"
$envStagingExists = Test-Path $envStagingPath

Test-Check -Name "Staging environment file exists" `
           -Passed $envStagingExists `
           -SuccessMessage "Found frontend/.env.staging" `
           -FailureMessage "frontend/.env.staging not found (should exist from Task 1.2)"

if ($envStagingExists) {
    $envContent = Get-Content $envStagingPath -Raw
    $hasProjectId = $envContent -match 'VITE_FIREBASE_PROJECT_ID=rag-prompt-library-staging'
    
    Test-Check -Name "Environment file has correct project ID" `
               -Passed $hasProjectId `
               -SuccessMessage "Environment file configured for staging project" `
               -FailureMessage "Update VITE_FIREBASE_PROJECT_ID in frontend/.env.staging"
}

# Check 8: Verify no secrets in environment files
Write-Host "Check 8: Scanning for exposed secrets in environment files..." -ForegroundColor Cyan
$envFiles = Get-ChildItem -Path "frontend" -Filter ".env*" -ErrorAction SilentlyContinue
$hasExposedSecrets = $false

foreach ($envFile in $envFiles) {
    $content = Get-Content $envFile.FullName -Raw
    # Check for service account patterns (should never be in .env files)
    if ($content -match '"private_key"' -or $content -match 'BEGIN PRIVATE KEY') {
        $hasExposedSecrets = $true
        Write-Host "       [CRITICAL] Service account key found in $($envFile.Name)!" -ForegroundColor Red
    }
}

Test-Check -Name "No service account keys in environment files" `
           -Passed (-not $hasExposedSecrets) `
           -SuccessMessage "No service account keys found in .env files (good!)" `
           -FailureMessage "CRITICAL: Service account keys found in .env files. Remove immediately!"

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total Checks:  $($results.TotalChecks)" -ForegroundColor White
Write-Host "Passed:        $($results.PassedChecks)" -ForegroundColor Green
Write-Host "Failed:        $($results.FailedChecks)" -ForegroundColor Red
Write-Host "Warnings:      $($results.Warnings)" -ForegroundColor Yellow
Write-Host ""

if ($results.FailedChecks -eq 0) {
    Write-Host "✅ All checks passed! Repository is properly configured." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Confirm you've added all 4 GitHub secrets (cannot be verified locally)" -ForegroundColor White
    Write-Host "2. Verify secrets in GitHub: Settings → Secrets and variables → Actions" -ForegroundColor White
    Write-Host "3. Proceed to Task 1.7: Run Staging Smoke Tests" -ForegroundColor White
} else {
    Write-Host "❌ Some checks failed. Please review and fix the issues above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "- Update .gitignore to exclude service account files" -ForegroundColor White
    Write-Host "- Remove any service account JSON files from repository" -ForegroundColor White
    Write-Host "- Verify .firebaserc has staging alias configured" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Manual verification reminder
Write-Host "⚠️  MANUAL VERIFICATION REQUIRED:" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script cannot verify GitHub secrets (they're encrypted)." -ForegroundColor White
Write-Host "Please manually confirm in GitHub:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions" -ForegroundColor Cyan
Write-Host "2. Verify these 4 secrets exist:" -ForegroundColor White
Write-Host "   - FIREBASE_SERVICE_ACCOUNT_STAGING" -ForegroundColor Gray
Write-Host "   - STAGING_PROJECT_ID" -ForegroundColor Gray
Write-Host "   - STAGING_OPENROUTER_KEY" -ForegroundColor Gray
Write-Host "   - STAGING_FIREBASE_API_KEY" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Confirm you've deleted the local service account JSON file" -ForegroundColor White
Write-Host ""

# Exit with appropriate code
if ($results.FailedChecks -eq 0) {
    exit 0
} else {
    exit 1
}

