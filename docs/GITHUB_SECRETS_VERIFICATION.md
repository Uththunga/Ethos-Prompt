# GitHub Secrets Verification Checklist

**Repository**: `Uththunga/Ethos-Prompt`  
**Date**: 2025-10-08  
**Purpose**: Verify required GitHub secrets for staging deployment automation

---

## Required GitHub Secrets

The following secrets must be configured in the GitHub repository for staging deployments to work correctly:

### 1. FIREBASE_SERVICE_ACCOUNT_STAGING
- **Type**: JSON (Service Account Key)
- **Purpose**: Authenticates GitHub Actions to deploy to Firebase staging project
- **How to obtain**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/)
  2. Select project: `rag-prompt-library-staging`
  3. Navigate to: IAM & Admin → Service Accounts
  4. Find or create service account with Firebase Admin permissions
  5. Create JSON key and download
- **How to add**:
  ```bash
  # Using GitHub CLI
  gh secret set FIREBASE_SERVICE_ACCOUNT_STAGING < path/to/service-account.json
  
  # Or via GitHub UI
  # Settings → Secrets and variables → Actions → New repository secret
  ```

### 2. STAGING_PROJECT_ID
- **Type**: String
- **Value**: `rag-prompt-library-staging`
- **Purpose**: Identifies the Firebase staging project for deployments
- **How to add**:
  ```bash
  # Using GitHub CLI
  gh secret set STAGING_PROJECT_ID --body "rag-prompt-library-staging"
  
  # Or via GitHub UI
  # Settings → Secrets and variables → Actions → New repository secret
  ```

### 3. STAGING_OPENROUTER_KEY
- **Type**: String (API Key)
- **Format**: `sk-or-v1-...`
- **Purpose**: OpenRouter API key for staging environment AI requests
- **How to obtain**:
  1. Go to [OpenRouter Dashboard](https://openrouter.ai/keys)
  2. Create a new API key for staging environment
  3. Set spending limits appropriate for staging (e.g., $10/month)
  4. Copy the key (starts with `sk-or-v1-`)
- **How to add**:
  ```bash
  # Using GitHub CLI
  gh secret set STAGING_OPENROUTER_KEY --body "sk-or-v1-YOUR_KEY_HERE"
  
  # Or via GitHub UI
  # Settings → Secrets and variables → Actions → New repository secret
  ```

### 4. STAGING_FIREBASE_API_KEY
- **Type**: String (API Key)
- **Format**: `AIzaSy...`
- **Purpose**: Firebase Web API key for staging frontend configuration
- **How to obtain**:
  1. Go to [Firebase Console](https://console.firebase.google.com/)
  2. Select project: `rag-prompt-library-staging`
  3. Navigate to: Project Settings → General
  4. Scroll to "Your apps" section
  5. Find Web App configuration
  6. Copy the `apiKey` value
- **How to add**:
  ```bash
  # Using GitHub CLI
  gh secret set STAGING_FIREBASE_API_KEY --body "AIzaSy..."
  
  # Or via GitHub UI
  # Settings → Secrets and variables → Actions → New repository secret
  ```

---

## Verification Steps

### Option 1: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not already installed
# Windows: winget install GitHub.cli
# Mac: brew install gh
# Linux: See https://github.com/cli/cli#installation

# Authenticate
gh auth login

# List all secrets (names only, values are encrypted)
gh secret list

# Expected output should include:
# FIREBASE_SERVICE_ACCOUNT_STAGING
# STAGING_PROJECT_ID
# STAGING_OPENROUTER_KEY
# STAGING_FIREBASE_API_KEY
```

### Option 2: Using GitHub Web UI

1. Navigate to: https://github.com/Uththunga/Ethos-Prompt/settings/secrets/actions
2. Verify all 4 secrets are listed:
   - ✅ FIREBASE_SERVICE_ACCOUNT_STAGING
   - ✅ STAGING_PROJECT_ID
   - ✅ STAGING_OPENROUTER_KEY
   - ✅ STAGING_FIREBASE_API_KEY

---

## Verification Checklist

**Manual Verification Required** (check each box after confirming):

- [ ] **FIREBASE_SERVICE_ACCOUNT_STAGING** exists in GitHub repository secrets
- [ ] **STAGING_PROJECT_ID** exists and contains value `rag-prompt-library-staging`
- [ ] **STAGING_OPENROUTER_KEY** exists and is a valid OpenRouter API key
- [ ] **STAGING_FIREBASE_API_KEY** exists and matches staging project API key
- [ ] All secrets are configured at **repository level** (not environment level)
- [ ] Service account has necessary permissions (Firebase Admin, Secret Manager Accessor)

---

## Testing Secret Configuration

After adding secrets, test them by triggering a workflow:

```bash
# Create a test branch
git checkout -b test/verify-secrets

# Make a small change to trigger workflow
echo "# Test secrets configuration" >> README.md
git add README.md
git commit -m "test: verify GitHub secrets configuration"
git push origin test/verify-secrets

# Create PR and monitor GitHub Actions
# Check workflow logs for authentication errors
```

---

## Troubleshooting

### Error: "Secret not found"
- **Cause**: Secret name mismatch or not configured
- **Solution**: Verify secret name matches exactly (case-sensitive)

### Error: "Invalid service account"
- **Cause**: Service account JSON is malformed or has insufficient permissions
- **Solution**: 
  1. Verify JSON is valid
  2. Check service account has roles: `Firebase Admin`, `Cloud Functions Admin`, `Secret Manager Secret Accessor`

### Error: "Invalid API key"
- **Cause**: OpenRouter key is invalid or expired
- **Solution**: Generate new key from OpenRouter dashboard

### Error: "Permission denied"
- **Cause**: Service account lacks necessary IAM roles
- **Solution**: Add required roles in Google Cloud Console → IAM

---

## Security Best Practices

1. **Rotate secrets regularly** (every 90 days recommended)
2. **Use separate keys for staging and production**
3. **Set spending limits** on OpenRouter keys
4. **Monitor secret usage** in GitHub Actions logs
5. **Never commit secrets** to version control
6. **Use environment-specific service accounts** (don't reuse production SA for staging)

---

## Related Documentation

- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Firebase Service Accounts](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [OpenRouter API Keys](https://openrouter.ai/docs#authentication)
- [Google Cloud IAM](https://cloud.google.com/iam/docs/service-accounts)

---

**Status**: ⏳ Awaiting manual verification  
**Next Step**: Once verified, proceed with Firebase project verification and staging deployment

