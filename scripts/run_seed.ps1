$ErrorActionPreference = 'Continue'
$env:GOOGLE_APPLICATION_CREDENTIALS = "D:\Users\Downloads\rag-prompt-library-staging-firebase-adminsdk-fbsvc-3c7d49233c.json"
$env:FIREBASE_PROJECT_ID = "rag-prompt-library-staging"
$env:SEED_TEST_EMAIL = "e2e-user@example.com"
$env:SEED_TEST_PASSWORD = "TestPwd!12345"

Write-Host "Environment variables set. Starting seeding..."

Push-Location functions
try {
  node scripts/seed_staging.js 2>&1 | Tee-Object -FilePath "..\docs\artifacts\staging-validation-complete-2025-10-10-225440\logs\seed.log"
  $exit = $LASTEXITCODE
  Write-Host "Seeding finished with exit code $exit"
} finally {
  Pop-Location
}

exit $exit

