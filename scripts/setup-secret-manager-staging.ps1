# Setup Secret Manager for Staging Environment
# Project: rag-prompt-library-staging
# Purpose: Configure OPENROUTER_API_KEY secret for Cloud Functions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Secret Manager Setup for Staging" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "rag-prompt-library-staging"
$PROJECT_NUMBER = "857724136585"
$SECRET_NAME = "OPENROUTER_API_KEY"

# Step 1: Authenticate
Write-Host "Step 1: Authenticating with Google Cloud..." -ForegroundColor Yellow
Write-Host "This will open a browser window for authentication." -ForegroundColor Gray
Write-Host ""
gcloud auth login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Authentication failed. Please try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Authentication successful" -ForegroundColor Green
Write-Host ""

# Step 2: Set project
Write-Host "Step 2: Setting active project to $PROJECT_ID..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project. Please check project ID." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project set successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Enable Secret Manager API
Write-Host "Step 3: Enabling Secret Manager API..." -ForegroundColor Yellow
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Failed to enable API. It may already be enabled." -ForegroundColor Yellow
} else {
    Write-Host "✅ Secret Manager API enabled" -ForegroundColor Green
}
Write-Host ""

# Step 4: Check if secret already exists
Write-Host "Step 4: Checking if secret already exists..." -ForegroundColor Yellow
$existingSecret = gcloud secrets list --project=$PROJECT_ID --filter="name:$SECRET_NAME" --format="value(name)" 2>$null

if ($existingSecret) {
    Write-Host "⚠️  Secret '$SECRET_NAME' already exists!" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Do you want to add a new version? (y/n)"
    
    if ($response -eq "y" -or $response -eq "Y") {
        Write-Host ""
        Write-Host "Please enter your OpenRouter API key (it will be hidden):" -ForegroundColor Cyan
        $secureKey = Read-Host -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
        $apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        
        # Validate key format
        if (-not $apiKey.StartsWith("sk-or-v1-")) {
            Write-Host "❌ Invalid API key format. OpenRouter keys should start with 'sk-or-v1-'" -ForegroundColor Red
            exit 1
        }
        
        Write-Host ""
        Write-Host "Adding new version to existing secret..." -ForegroundColor Yellow
        $apiKey | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to add new secret version" -ForegroundColor Red
            exit 1
        }
        
        Write-Host "✅ New secret version added successfully" -ForegroundColor Green
    } else {
        Write-Host "Skipping secret creation. Using existing secret." -ForegroundColor Gray
    }
} else {
    # Step 5: Create new secret
    Write-Host "Secret does not exist. Creating new secret..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please enter your OpenRouter API key (it will be hidden):" -ForegroundColor Cyan
    Write-Host "Format: sk-or-v1-..." -ForegroundColor Gray
    $secureKey = Read-Host -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
    $apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    
    # Validate key format
    if (-not $apiKey.StartsWith("sk-or-v1-")) {
        Write-Host "❌ Invalid API key format. OpenRouter keys should start with 'sk-or-v1-'" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "Creating secret '$SECRET_NAME'..." -ForegroundColor Yellow
    $apiKey | gcloud secrets create $SECRET_NAME --data-file=- --replication-policy="automatic" --project=$PROJECT_ID
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create secret" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Secret created successfully" -ForegroundColor Green
}

Write-Host ""

# Step 6: Grant access to service account
Write-Host "Step 5: Granting access to Cloud Functions service account..." -ForegroundColor Yellow
$SERVICE_ACCOUNT = "$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
Write-Host "Service Account: $SERVICE_ACCOUNT" -ForegroundColor Gray

gcloud secrets add-iam-policy-binding $SECRET_NAME `
    --member="serviceAccount:$SERVICE_ACCOUNT" `
    --role="roles/secretmanager.secretAccessor" `
    --project=$PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Failed to grant access. The binding may already exist." -ForegroundColor Yellow
} else {
    Write-Host "✅ Service account access granted" -ForegroundColor Green
}

Write-Host ""

# Step 7: Verify configuration
Write-Host "Step 6: Verifying configuration..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Listing secrets:" -ForegroundColor Gray
gcloud secrets list --project=$PROJECT_ID

Write-Host ""
Write-Host "Checking IAM policy:" -ForegroundColor Gray
gcloud secrets get-iam-policy $SECRET_NAME --project=$PROJECT_ID

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Secret Manager Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  • Project: $PROJECT_ID" -ForegroundColor White
Write-Host "  • Secret: $SECRET_NAME" -ForegroundColor White
Write-Host "  • Service Account: $SERVICE_ACCOUNT" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy Firestore rules and indexes" -ForegroundColor White
Write-Host "  2. Deploy Cloud Functions (will automatically use this secret)" -ForegroundColor White
Write-Host "  3. Deploy frontend to hosting" -ForegroundColor White
Write-Host "  4. Run smoke tests" -ForegroundColor White
Write-Host ""
Write-Host "To verify the secret value (be careful - this will display it):" -ForegroundColor Yellow
Write-Host "  gcloud secrets versions access latest --secret='$SECRET_NAME' --project=$PROJECT_ID" -ForegroundColor Gray
Write-Host ""

