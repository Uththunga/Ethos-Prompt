# Staging Environment Management Scripts

This directory contains PowerShell scripts for managing the `rag-prompt-library-staging` Firebase project. These scripts help with database management, testing, and verification workflows.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Scripts Overview](#scripts-overview)
- [Usage Workflows](#usage-workflows)
- [Script Details](#script-details)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before using these scripts, ensure you have the following installed:

### Required Tools

1. **Google Cloud SDK (gcloud)**
   - Download: https://cloud.google.com/sdk/docs/install
   - Verify: `gcloud --version`
   - Authenticate: `gcloud auth login`
   - Set up ADC: `gcloud auth application-default login`

2. **Firebase CLI**
   - Install: `npm install -g firebase-tools`
   - Verify: `firebase --version`
   - Authenticate: `firebase login`

3. **Node.js** (v18 or higher)
   - Download: https://nodejs.org/
   - Verify: `node --version`

4. **PowerShell** (Windows)
   - Built-in on Windows 10/11
   - Verify: `$PSVersionTable.PSVersion`

### Optional Tools

- **Playwright** (for E2E verification)
  - Auto-installed by `verify-execution-visibility.ps1` if missing
  - Manual install: `npm install -g playwright && npx playwright install chromium`

---

## Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `backup-staging-firestore.ps1` | Export Firestore to GCS | Before making destructive changes |
| `reset-staging-firestore.ps1` | Delete all Firestore data | To start with a clean database |
| `create-test-data.ps1` | Generate test prompts & executions | After reset or for testing |
| `verify-execution-visibility.ps1` | Automated UI verification | To verify execution data displays correctly |

---

## Usage Workflows

### Workflow 1: Complete Database Reset with Testing

Use this workflow when you want to completely reset the staging database and verify everything works:

```powershell
# Step 1: Backup current data (optional but recommended)
.\scripts\backup-staging-firestore.ps1

# Step 2: Reset the database (deletes all data)
.\scripts\reset-staging-firestore.ps1

# Step 3: Create test data
# First, get your user ID from Firebase Console or create a new test user
.\scripts\create-test-data.ps1 -UserId "your-user-id-here"

# Step 4: Verify execution visibility in UI
.\scripts\verify-execution-visibility.ps1
```

### Workflow 2: Backup Before Deployment

Use this workflow before deploying major changes:

```powershell
# Backup current state
.\scripts\backup-staging-firestore.ps1

# Deploy your changes
cd frontend
npm run build
firebase deploy --only hosting:staging

# If something goes wrong, restore from backup (see script output for restore command)
```

### Workflow 3: Quick Test Data Generation

Use this workflow to quickly populate the database with test data:

```powershell
# Create test data for current user
.\scripts\create-test-data.ps1 -UserId "your-user-id"

# Or create more test data
.\scripts\create-test-data.ps1 -UserId "your-user-id" -PromptCount 5 -ExecutionsPerPrompt 2
```

### Workflow 4: Automated Verification

Use this workflow to verify execution visibility after code changes:

```powershell
# Run verification with visible browser (for debugging)
.\scripts\verify-execution-visibility.ps1 -Headless $false

# Run verification in headless mode (for CI/CD)
.\scripts\verify-execution-visibility.ps1
```

---

## Script Details

### 1. `backup-staging-firestore.ps1`

**Purpose**: Export all Firestore collections to Google Cloud Storage for backup.

**Usage**:
```powershell
# Basic usage (uses default bucket)
.\scripts\backup-staging-firestore.ps1

# Custom bucket
.\scripts\backup-staging-firestore.ps1 -BucketName "my-custom-bucket"
```

**Parameters**:
- `-BucketName` (optional): GCS bucket name (default: `rag-prompt-library-staging-backups`)
- `-ProjectId` (optional): Firebase project ID (default: `rag-prompt-library-staging`)

**Output**:
- Backup location: `gs://{bucket}/backup-{timestamp}/`
- Restore command displayed in output
- List of all available backups

**Restore from Backup**:
```powershell
# Using gcloud
gcloud firestore import "gs://bucket-name/backup-20250121-143000" --project=rag-prompt-library-staging

# Or use Firebase Console:
# https://console.firebase.google.com/project/rag-prompt-library-staging/firestore
# → Import/Export tab → Import data
```

---

### 2. `reset-staging-firestore.ps1`

**Purpose**: Delete all documents from specified Firestore collections.

**Usage**:
```powershell
.\scripts\reset-staging-firestore.ps1
```

**⚠️ WARNING**: This is a **DESTRUCTIVE** operation. All data will be permanently deleted.

**Collections Deleted**:
- `executions`
- `prompts`
- `users` (including subcollections)
- `rag_documents`
- `documents`
- `analytics`
- `metrics`

**Safety Features**:
- Requires typing `DELETE STAGING DATA` to confirm
- Explicit project targeting (won't affect production)
- Verification after deletion
- Detailed summary report

**Output**:
- Deletion status for each collection
- Document count verification (should be 0)
- Error reporting if any collection fails

---

### 3. `create-test-data.ps1`

**Purpose**: Automatically create test prompts and execution records in Firestore.

**Usage**:
```powershell
# Basic usage (you'll be prompted for User ID)
.\scripts\create-test-data.ps1

# With User ID
.\scripts\create-test-data.ps1 -UserId "abc123xyz"

# Custom configuration
.\scripts\create-test-data.ps1 -UserId "abc123xyz" -PromptCount 5 -ExecutionsPerPrompt 2
```

**Parameters**:
- `-UserId` (required): Firebase user ID (get from Authentication console)
- `-PromptCount` (optional): Number of prompts to create (default: 3, max: 3)
- `-ExecutionsPerPrompt` (optional): Executions per prompt (default: 1)
- `-ProjectId` (optional): Firebase project ID (default: `rag-prompt-library-staging`)

**Test Data Created**:
1. **Greeting Generator** (Beginner)
   - Category: Communication
   - Variables: name, topic

2. **Code Explainer** (Intermediate)
   - Category: Development
   - Variables: language, code

3. **Email Writer** (Advanced)
   - Category: Business
   - Variables: recipient, subject, tone

**Output**:
- List of created prompt IDs
- List of created execution IDs
- Link to Firestore Console for verification

**Getting Your User ID**:
```
1. Go to: https://console.firebase.google.com/project/rag-prompt-library-staging/authentication/users
2. Find your test user
3. Copy the User UID
```

---

### 4. `verify-execution-visibility.ps1`

**Purpose**: Automated E2E verification that execution data appears in all three UI locations.

**Usage**:
```powershell
# Headless mode (default)
.\scripts\verify-execution-visibility.ps1

# Visible browser (for debugging)
.\scripts\verify-execution-visibility.ps1 -Headless $false

# Custom base URL
.\scripts\verify-execution-visibility.ps1 -BaseUrl "https://custom-url.web.app"
```

**Parameters**:
- `-BaseUrl` (optional): Staging URL (default: `https://rag-prompt-library-staging.web.app`)
- `-Headless` (optional): Run browser in headless mode (default: `$true`)
- `-OutputDir` (optional): Output directory for results (default: `test-results`)

**Tests Performed**:
1. **Execution History Page** (`/dashboard/executions`)
   - Verifies execution list is populated
   - Checks statistics are visible
   - Captures console logs

2. **Dashboard Recent Activity** (`/dashboard`)
   - Verifies Recent Activity section exists
   - Checks for activity items
   - Captures console logs

3. **Profile Panel**
   - Opens profile panel
   - Verifies execution count is displayed
   - Checks count is > 0

**Output Files**:
- `test-results/test-report.json` - Detailed test results
- `test-results/1-execution-history.png` - Screenshot of execution history page
- `test-results/2-dashboard.png` - Screenshot of dashboard
- `test-results/3-profile-panel.png` - Screenshot of profile panel
- `test-results/console-logs.txt` - All captured console logs

**Exit Codes**:
- `0` - All tests passed
- `1` - One or more tests failed

---

## Troubleshooting

### Common Issues

#### 1. "gcloud not found"
**Solution**: Install Google Cloud SDK and authenticate
```powershell
# Download from: https://cloud.google.com/sdk/docs/install
# After installation:
gcloud auth login
gcloud auth application-default login
```

#### 2. "Permission denied"
**Solution**: Re-authenticate with proper permissions
```powershell
gcloud auth login
firebase login
gcloud projects describe rag-prompt-library-staging
```

#### 3. "User ID required" (create-test-data)
**Solution**: Get user ID from Firebase Console
```
https://console.firebase.google.com/project/rag-prompt-library-staging/authentication/users
```

#### 4. Verification tests fail but data exists
**Debug steps**:
```powershell
# Run with visible browser
.\scripts\verify-execution-visibility.ps1 -Headless $false

# Check console logs
Get-Content test-results\console-logs.txt
```

---

## Additional Resources

- **Firebase Console**: https://console.firebase.google.com/project/rag-prompt-library-staging
- **Firestore Data**: https://console.firebase.google.com/project/rag-prompt-library-staging/firestore/data
- **Staging App**: https://rag-prompt-library-staging.web.app

---

**Last Updated**: 2025-01-21

