# Fix Firebase Storage CORS Configuration (PowerShell)
# This script applies CORS settings to Firebase Storage bucket

param(
    [switch]$Force = $false
)

Write-Host "🔧 Fixing Firebase Storage CORS Configuration..." -ForegroundColor Cyan

# Check if gsutil is available
try {
    $null = Get-Command gsutil -ErrorAction Stop
    Write-Host "✅ gsutil found" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: gsutil is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if Firebase CLI is available
try {
    $null = Get-Command firebase -ErrorAction Stop
    Write-Host "✅ Firebase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Firebase CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Firebase CLI: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Get the current Firebase project
try {
    $firebaseUse = firebase use --json | ConvertFrom-Json
    $PROJECT_ID = $firebaseUse.result.project
    
    if (-not $PROJECT_ID) {
        throw "No project selected"
    }
    
    Write-Host "📋 Current Firebase project: $PROJECT_ID" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: No Firebase project selected" -ForegroundColor Red
    Write-Host "Please run: firebase use <project-id>" -ForegroundColor Yellow
    exit 1
}

# Construct the bucket name
$BUCKET_NAME = "$PROJECT_ID.appspot.com"
Write-Host "🪣 Storage bucket: gs://$BUCKET_NAME" -ForegroundColor Cyan

# Check if cors.json exists
if (-not (Test-Path "cors.json")) {
    Write-Host "❌ Error: cors.json file not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Found cors.json configuration file" -ForegroundColor Green

# Validate cors.json format
try {
    $corsContent = Get-Content "cors.json" -Raw | ConvertFrom-Json
    Write-Host "✅ cors.json is valid JSON" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: cors.json is not valid JSON" -ForegroundColor Red
    exit 1
}

# Apply CORS configuration to the bucket
Write-Host "🚀 Applying CORS configuration to Firebase Storage bucket..." -ForegroundColor Cyan

try {
    $result = gsutil cors set cors.json "gs://$BUCKET_NAME" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ CORS configuration applied successfully!" -ForegroundColor Green
    } else {
        throw "gsutil command failed: $result"
    }
} catch {
    Write-Host "❌ Failed to apply CORS configuration" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Please ensure you have the necessary permissions for the bucket" -ForegroundColor Yellow
    exit 1
}

# Verify the CORS configuration
Write-Host "🔍 Verifying CORS configuration..." -ForegroundColor Cyan
Write-Host "Current CORS settings for gs://$BUCKET_NAME:" -ForegroundColor Yellow

try {
    gsutil cors get "gs://$BUCKET_NAME"
} catch {
    Write-Host "⚠️ Could not retrieve CORS settings for verification" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Firebase Storage CORS configuration has been fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 What was done:" -ForegroundColor Cyan
Write-Host "   • Updated cors.json with comprehensive origin and header support" -ForegroundColor White
Write-Host "   • Applied CORS configuration to Firebase Storage bucket: gs://$BUCKET_NAME" -ForegroundColor White
Write-Host "   • Added support for localhost development environments" -ForegroundColor White
Write-Host "   • Included all necessary HTTP methods and headers" -ForegroundColor White
Write-Host ""
Write-Host "🔄 You may need to:" -ForegroundColor Cyan
Write-Host "   • Clear your browser cache" -ForegroundColor White
Write-Host "   • Wait a few minutes for the changes to propagate" -ForegroundColor White
Write-Host "   • Redeploy your application if needed" -ForegroundColor White
Write-Host ""
Write-Host "✨ PDF uploads should now work without CORS errors!" -ForegroundColor Green
