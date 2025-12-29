# Staging Data Seeding Script

## Overview
`seed_staging.js` populates the staging Firestore database with test data for E2E testing and manual validation.

## Prerequisites
1. **Service Account Key** for `rag-prompt-library-staging`
   - Download from Firebase Console → Project Settings → Service Accounts → Generate New Private Key
   - Save as `serviceAccount.json` (DO NOT commit to git)

2. **Environment Variables**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
   export FIREBASE_PROJECT_ID="rag-prompt-library-staging"
   export SEED_TEST_EMAIL="test@example.com"
   export SEED_TEST_PASSWORD="ChangeMe_Staging1!"
   ```

## What Gets Seeded

### Test User
- **Email**: test@example.com
- **Password**: ChangeMe_Staging1! (change via env var)
- **Email Verified**: true
- **Role**: user

### Prompts (5 total)
1. **seed-prompt-1**: Simple Greeting (no variables, public)
2. **seed-prompt-2**: Personalized Greeting (with {name} variable)
3. **seed-prompt-3**: Code Generator (with {language}, {task} variables)
4. **seed-prompt-4**: RAG-enabled Q&A (with {question} variable)
5. **seed-prompt-5**: Model Comparison Prompt (with {topic} variable)

### Documents (3 total)
1. **seed-doc-1**: sample.pdf (application/pdf)
2. **seed-doc-2**: readme.md (text/markdown)
3. **seed-doc-3**: data.txt (text/plain)

All documents marked as `completed` with mock content.

### Executions (10 total)
- **6 successful** executions (seed-exec-success-1 to 6)
- **4 failed** executions (seed-exec-failed-1 to 4)

All executions use free model: `z-ai/glm-4.5-air:free`

## Running the Script

### PowerShell (Windows)
```powershell
cd functions
$env:GOOGLE_APPLICATION_CREDENTIALS = "path\to\serviceAccount.json"
$env:FIREBASE_PROJECT_ID = "rag-prompt-library-staging"
node scripts/seed_staging.js
```

### Bash (Linux/Mac)
```bash
cd functions
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccount.json"
export FIREBASE_PROJECT_ID="rag-prompt-library-staging"
node scripts/seed_staging.js
```

## Expected Output
```
Seeding staging environment...
Using test user: <UID> <test@example.com>
Prompts seeded.
Documents seeded.
Executions seeded.
Done in 2.5s
```

## Verification
1. **Firebase Console**: https://console.firebase.google.com/project/rag-prompt-library-staging/firestore
2. Check collections: `prompts`, `rag_documents`, `prompts/{id}/executions`
3. **Authentication**: https://console.firebase.google.com/project/rag-prompt-library-staging/authentication/users
4. Verify test user exists

## Idempotency
- Script is safe to re-run
- Uses stable document IDs (seed-prompt-1, etc.)
- Merge mode prevents duplicates

## Security Notes
- **DO NOT** commit serviceAccount.json to git
- **DO NOT** use production service account
- Change default password via environment variable
- Revoke service account key after seeding if not needed

## Troubleshooting

**Error: "Could not load the default credentials"**
- Ensure GOOGLE_APPLICATION_CREDENTIALS is set correctly
- Verify service account JSON file exists and is valid

**Error: "Permission denied"**
- Verify service account has Firestore and Auth permissions
- Check Firebase project ID is correct

**Error: "auth/email-already-exists"**
- User already exists (this is OK, script will use existing user)
- To reset: delete user in Firebase Console → Authentication

## Next Steps After Seeding
1. Run E2E tests: `npm run test:e2e` (in frontend directory)
2. Manual smoke testing with test@example.com credentials
3. Verify all seeded data is accessible in staging app

