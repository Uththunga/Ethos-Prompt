# Google Cloud Secret Manager Configuration Guide

**Project**: rag-prompt-library-staging  
**Project Number**: 857724136585  
**Date**: 2025-10-08  
**Purpose**: Configure Secret Manager for staging Cloud Functions

---

## Overview

The Cloud Functions in this project use Google Cloud Secret Manager to securely store and access the OpenRouter API key. This guide provides step-by-step instructions for configuring Secret Manager for the staging environment.

**Why Secret Manager?**
- ✅ More secure than environment variables
- ✅ Automatic encryption at rest
- ✅ Fine-grained IAM access control
- ✅ Audit logging of secret access
- ✅ Version management for secrets

---

## Prerequisites

- [x] Google Cloud SDK installed (version 531.0.0 verified)
- [x] Firebase project `rag-prompt-library-staging` exists (verified)
- [x] Project number: 857724136585
- [ ] OpenRouter API key for staging environment
- [ ] Appropriate IAM permissions (Owner or Secret Manager Admin)

---

## Step-by-Step Configuration

### Step 1: Authenticate with Google Cloud

```bash
# Authenticate with your Google account
gcloud auth login

# Set the active project
gcloud config set project rag-prompt-library-staging

# Verify current project
gcloud config get-value project
# Expected output: rag-prompt-library-staging
```

---

### Step 2: Enable Secret Manager API

```bash
# Enable the Secret Manager API (if not already enabled)
gcloud services enable secretmanager.googleapis.com

# Verify the API is enabled
gcloud services list --enabled | grep secretmanager
# Expected output: secretmanager.googleapis.com
```

---

### Step 3: Obtain OpenRouter API Key

**Option A: Create New Staging Key (Recommended)**

1. Visit: https://openrouter.ai/keys
2. Click "Create Key"
3. Name: `RAG Prompt Library - Staging`
4. Set spending limit: $10/month (appropriate for staging)
5. Copy the key (format: `sk-or-v1-...`)
6. **Important**: Save the key securely - it won't be shown again

**Option B: Use Existing Key**

If you already have a staging OpenRouter key, retrieve it from your secure storage.

**Security Best Practice**: Use separate API keys for staging and production environments.

---

### Step 4: Create Secret in Secret Manager

**Method 1: Interactive (Recommended for first-time setup)**

```bash
# Create secret interactively (you'll be prompted to paste the key)
gcloud secrets create OPENROUTER_API_KEY \
  --replication-policy="automatic" \
  --project=rag-prompt-library-staging

# You'll be prompted: "Enter secret data:"
# Paste your OpenRouter API key (sk-or-v1-...)
# Press Ctrl+D (Windows/Linux) or Cmd+D (Mac) to finish
```

**Method 2: From File**

```bash
# Save your key to a temporary file (NEVER commit this file!)
echo -n "sk-or-v1-YOUR_ACTUAL_KEY_HERE" > /tmp/openrouter-key.txt

# Create secret from file
gcloud secrets create OPENROUTER_API_KEY \
  --data-file=/tmp/openrouter-key.txt \
  --replication-policy="automatic" \
  --project=rag-prompt-library-staging

# Delete the temporary file immediately
rm /tmp/openrouter-key.txt
```

**Method 3: One-liner (PowerShell)**

```powershell
# For PowerShell on Windows
$key = "sk-or-v1-YOUR_ACTUAL_KEY_HERE"
$key | gcloud secrets create OPENROUTER_API_KEY --data-file=- --project=rag-prompt-library-staging
```

**Method 4: One-liner (Bash/Linux/Mac)**

```bash
# For Bash/Zsh
echo -n "sk-or-v1-YOUR_ACTUAL_KEY_HERE" | gcloud secrets create OPENROUTER_API_KEY --data-file=- --project=rag-prompt-library-staging
```

---

### Step 5: Grant Access to Cloud Functions Service Account

Cloud Functions need permission to access the secret. Grant the `Secret Manager Secret Accessor` role to the default Compute Engine service account:

```bash
# Get the project number
PROJECT_NUMBER=$(gcloud projects describe rag-prompt-library-staging --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"
# Expected: 857724136585

# Grant access to the Compute Engine service account
gcloud secrets add-iam-policy-binding OPENROUTER_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=rag-prompt-library-staging
```

**Expected Output**:
```yaml
Updated IAM policy for secret [OPENROUTER_API_KEY].
bindings:
- members:
  - serviceAccount:857724136585-compute@developer.gserviceaccount.com
  role: roles/secretmanager.secretAccessor
etag: ...
version: 1
```

---

### Step 6: Verify Secret Configuration

```bash
# List all secrets in the project
gcloud secrets list --project=rag-prompt-library-staging

# Expected output:
# NAME                  CREATED              REPLICATION_POLICY  LOCATIONS
# OPENROUTER_API_KEY    2025-10-08T...       automatic           -

# Verify secret value (this will display the actual key - be careful!)
gcloud secrets versions access latest --secret="OPENROUTER_API_KEY" --project=rag-prompt-library-staging

# Expected output: sk-or-v1-... (your actual key)

# Check IAM policy
gcloud secrets get-iam-policy OPENROUTER_API_KEY --project=rag-prompt-library-staging
```

---

### Step 7: Test Secret Access from Functions

The Cloud Functions code (functions/index.js) uses the secret like this:

```javascript
const { defineSecret } = require('firebase-functions/params');
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY || OPENROUTER_API_KEY.value();
  // ... use apiKey
}
```

When you deploy functions, Firebase will automatically:
1. Detect the `defineSecret('OPENROUTER_API_KEY')` usage
2. Request access to the secret from Secret Manager
3. Make the secret available to the function at runtime

---

## Verification Checklist

After completing the steps above, verify:

- [ ] Secret Manager API is enabled
- [ ] Secret `OPENROUTER_API_KEY` exists in project `rag-prompt-library-staging`
- [ ] Secret contains valid OpenRouter API key (starts with `sk-or-v1-`)
- [ ] Compute Engine service account has `secretAccessor` role
- [ ] Secret can be accessed via `gcloud secrets versions access latest`
- [ ] IAM policy shows service account binding

---

## Troubleshooting

### Error: "Secret already exists"

If the secret already exists, you can update it instead:

```bash
# Add a new version to existing secret
echo -n "sk-or-v1-NEW_KEY" | gcloud secrets versions add OPENROUTER_API_KEY --data-file=- --project=rag-prompt-library-staging

# Disable old version (optional)
gcloud secrets versions disable 1 --secret="OPENROUTER_API_KEY" --project=rag-prompt-library-staging
```

### Error: "Permission denied"

Ensure you have the necessary IAM roles:
- `Secret Manager Admin` (to create secrets)
- `Project IAM Admin` (to grant access to service accounts)

```bash
# Check your permissions
gcloud projects get-iam-policy rag-prompt-library-staging \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL@example.com"
```

### Error: "API not enabled"

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com --project=rag-prompt-library-staging
```

### Secret not accessible from Functions

1. Verify service account has correct permissions
2. Check that functions are deployed with `--gen2` flag (required for Secret Manager)
3. Ensure secret name matches exactly (case-sensitive)

---

## Security Best Practices

### ✅ DO:
- Use separate API keys for staging and production
- Set spending limits on OpenRouter keys
- Rotate secrets regularly (every 90 days)
- Use Secret Manager for all sensitive data
- Grant least-privilege access (only to service accounts that need it)
- Enable audit logging for secret access

### ❌ DON'T:
- Never commit secrets to version control
- Don't share secrets via email or chat
- Don't use production keys in staging
- Don't grant broad access (e.g., `allUsers`)
- Don't store secrets in environment variables if Secret Manager is available

---

## Cost Considerations

**Secret Manager Pricing** (as of 2025):
- Secret versions: $0.06 per secret version per month
- Access operations: $0.03 per 10,000 operations

**Estimated Monthly Cost for Staging**:
- 1 secret (OPENROUTER_API_KEY): ~$0.06/month
- ~10,000 function invocations: ~$0.03/month
- **Total**: ~$0.09/month (negligible)

---

## Alternative: Using Firebase Functions Config (Legacy)

If you prefer to use `firebase functions:config` instead of Secret Manager, you'll need to:

1. **Modify functions/index.js**:
   ```javascript
   // Remove:
   const { defineSecret } = require('firebase-functions/params');
   const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');
   
   // Replace with:
   const functions = require('firebase-functions');
   const apiKey = functions.config().openrouter.api_key;
   ```

2. **Set config**:
   ```bash
   firebase functions:config:set \
     openrouter.api_key="sk-or-v1-YOUR_KEY" \
     --project rag-prompt-library-staging
   ```

**Note**: Secret Manager is recommended over functions:config for better security and features.

---

## Next Steps

After configuring Secret Manager:

1. ✅ Secret Manager configured
2. → Deploy Firestore rules and indexes
3. → Deploy Cloud Functions (will automatically use the secret)
4. → Deploy frontend to hosting
5. → Run smoke tests to verify API connectivity

---

## Related Documentation

- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [OpenRouter API Documentation](https://openrouter.ai/docs)
- [IAM Roles for Secret Manager](https://cloud.google.com/secret-manager/docs/access-control)

---

**Configuration Guide Version**: 1.0  
**Last Updated**: 2025-10-08  
**Maintained by**: Development Team

