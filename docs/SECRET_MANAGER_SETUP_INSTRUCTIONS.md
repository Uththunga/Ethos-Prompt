# Secret Manager Setup Instructions - ACTION REQUIRED

**Status**: ⏳ **AWAITING USER ACTION**  
**Priority**: HIGH  
**Estimated Time**: 10 minutes  
**Blocker**: Requires OpenRouter API key

---

## Quick Start

We've created automated setup scripts to configure Secret Manager for the staging environment. Choose the script for your operating system:

### Windows (PowerShell)
```powershell
cd scripts
.\setup-secret-manager-staging.ps1
```

### Linux / Mac (Bash)
```bash
cd scripts
chmod +x setup-secret-manager-staging.sh
./setup-secret-manager-staging.sh
```

---

## What These Scripts Do

1. ✅ Authenticate with Google Cloud (opens browser)
2. ✅ Set active project to `rag-prompt-library-staging`
3. ✅ Enable Secret Manager API
4. ✅ Prompt you to enter OpenRouter API key (securely)
5. ✅ Create secret `OPENROUTER_API_KEY` in Secret Manager
6. ✅ Grant access to Cloud Functions service account
7. ✅ Verify configuration

---

## Prerequisites

Before running the script, you need:

### 1. OpenRouter API Key for Staging

**Option A: Create New Key (Recommended)**
1. Visit: https://openrouter.ai/keys
2. Click "Create Key"
3. Name: `RAG Prompt Library - Staging`
4. Set spending limit: $10/month
5. Copy the key (starts with `sk-or-v1-`)

**Option B: Use Existing Key**
- Retrieve your staging OpenRouter key from secure storage
- **Important**: Use a separate key for staging (not production)

### 2. Google Cloud Authentication
- You'll be prompted to authenticate via browser
- Use an account with permissions on `rag-prompt-library-staging`
- Required roles: `Secret Manager Admin` or `Owner`

---

## Manual Setup (Alternative)

If you prefer to set up manually without the script:

```bash
# 1. Authenticate
gcloud auth login

# 2. Set project
gcloud config set project rag-prompt-library-staging

# 3. Enable API
gcloud services enable secretmanager.googleapis.com

# 4. Create secret (you'll be prompted to paste the key)
gcloud secrets create OPENROUTER_API_KEY \
  --replication-policy="automatic" \
  --project=rag-prompt-library-staging

# When prompted, paste your OpenRouter API key and press Ctrl+D

# 5. Grant access to service account
gcloud secrets add-iam-policy-binding OPENROUTER_API_KEY \
  --member="serviceAccount:857724136585-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=rag-prompt-library-staging

# 6. Verify
gcloud secrets list --project=rag-prompt-library-staging
```

---

## Verification

After running the script, verify the setup:

```bash
# List secrets
gcloud secrets list --project=rag-prompt-library-staging

# Expected output:
# NAME                  CREATED              REPLICATION_POLICY  LOCATIONS
# OPENROUTER_API_KEY    2025-10-08T...       automatic           -

# Check IAM policy
gcloud secrets get-iam-policy OPENROUTER_API_KEY --project=rag-prompt-library-staging

# Expected output should include:
# - member: serviceAccount:857724136585-compute@developer.gserviceaccount.com
# - role: roles/secretmanager.secretAccessor
```

---

## Troubleshooting

### "You do not currently have an active account selected"
**Solution**: Run `gcloud auth login` first

### "Secret already exists"
**Solution**: The script will prompt you to add a new version or skip

### "Permission denied"
**Solution**: Ensure your account has `Secret Manager Admin` role:
```bash
gcloud projects add-iam-policy-binding rag-prompt-library-staging \
  --member="user:YOUR_EMAIL@example.com" \
  --role="roles/secretmanager.admin"
```

### "API not enabled"
**Solution**: Run `gcloud services enable secretmanager.googleapis.com`

---

## Security Notes

- ✅ The script uses secure input (password-masked) for the API key
- ✅ The key is never displayed in terminal output
- ✅ The key is encrypted at rest in Secret Manager
- ✅ Only the Cloud Functions service account can access it
- ⚠️ Never commit the API key to version control
- ⚠️ Use separate keys for staging and production

---

## Next Steps After Setup

Once Secret Manager is configured:

1. ✅ Secret Manager configured
2. → **Deploy Firestore rules and indexes** (next task)
3. → Deploy Cloud Functions (will automatically use the secret)
4. → Deploy frontend to hosting
5. → Run smoke tests

---

## Cost

Secret Manager costs approximately **$0.09/month** for staging:
- 1 secret version: $0.06/month
- ~10,000 access operations: $0.03/month

---

## Support

If you encounter issues:
1. Check the detailed guide: `docs/SECRET_MANAGER_CONFIGURATION_GUIDE.md`
2. Review troubleshooting section above
3. Verify you have the correct IAM permissions
4. Ensure you're using a valid OpenRouter API key

---

**Created**: 2025-10-08  
**Scripts**: 
- `scripts/setup-secret-manager-staging.ps1` (Windows)
- `scripts/setup-secret-manager-staging.sh` (Linux/Mac)

**Documentation**:
- `docs/SECRET_MANAGER_CONFIGURATION_GUIDE.md` (detailed guide)

