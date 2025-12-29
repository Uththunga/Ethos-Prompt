# GitHub Secrets Verification Guide
**RAG Prompt Library Project**

**Date**: 2025-10-09  
**Purpose**: Verify and configure GitHub Secrets for staging deployment

---

## Required GitHub Secrets

The following secrets are required for automated staging deployment via GitHub Actions:

### 1. FIREBASE_SERVICE_ACCOUNT_STAGING
**Purpose**: Service account JSON for Firebase staging project authentication  
**Type**: JSON file content  
**Used In**: `.github/workflows/ci-cd.yml`, `.github/workflows/staging.yml`

**How to Obtain**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `rag-prompt-library-staging`
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Download the JSON file

**How to Set**:
```bash
gh secret set FIREBASE_SERVICE_ACCOUNT_STAGING < path/to/service-account-staging.json
```

---

### 2. STAGING_PROJECT_ID
**Purpose**: Firebase project ID for staging environment  
**Type**: String  
**Value**: `rag-prompt-library-staging`  
**Used In**: `.github/workflows/ci-cd.yml`, `.github/workflows/staging.yml`

**How to Set**:
```bash
gh secret set STAGING_PROJECT_ID --body "rag-prompt-library-staging"
```

---

### 3. STAGING_OPENROUTER_KEY
**Purpose**: OpenRouter API key for staging environment  
**Type**: String (API key)  
**Format**: `sk-or-v1-...`  
**Used In**: `.github/workflows/ci-cd.yml`

**How to Obtain**:
1. Go to [OpenRouter.ai](https://openrouter.ai/)
2. Sign in to your account
3. Go to API Keys section
4. Create a new key for staging (or use existing)
5. Copy the key (starts with `sk-or-v1-`)

**How to Set**:
```bash
gh secret set STAGING_OPENROUTER_KEY --body "sk-or-v1-YOUR_STAGING_KEY_HERE"
```

---

### 4. STAGING_FIREBASE_API_KEY
**Purpose**: Firebase Web API key for staging frontend  
**Type**: String  
**Value**: From Firebase Console  
**Used In**: `.github/workflows/ci-cd.yml` (optional, for verification)

**How to Obtain**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `rag-prompt-library-staging`
3. Go to Project Settings → General
4. Scroll to "Your apps" section
5. Find "Web API Key" (starts with `AIza`)

**Current Value** (from `.env.staging`):
```
AIzaSyDO_PRnAPZg6neE2NVYj7SdDNny6jmkAY8
```

**How to Set**:
```bash
gh secret set STAGING_FIREBASE_API_KEY --body "AIzaSyDO_PRnAPZg6neE2NVYj7SdDNny6jmkAY8"
```

---

## Verification Steps

### Step 1: Install GitHub CLI (if not already installed)

**macOS**:
```bash
brew install gh
```

**Windows**:
```bash
winget install GitHub.cli
```

**Linux**:
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

---

### Step 2: Authenticate with GitHub

```bash
gh auth login
```

Follow the prompts to authenticate.

---

### Step 3: List Existing Secrets

```bash
gh secret list
```

**Expected Output**:
```
FIREBASE_SERVICE_ACCOUNT_STAGING    Updated 2025-10-09
STAGING_PROJECT_ID                  Updated 2025-10-09
STAGING_OPENROUTER_KEY              Updated 2025-10-09
STAGING_FIREBASE_API_KEY            Updated 2025-10-09
```

---

### Step 4: Verify Each Secret

#### Check if FIREBASE_SERVICE_ACCOUNT_STAGING exists:
```bash
gh secret list | grep FIREBASE_SERVICE_ACCOUNT_STAGING
```

If missing, set it:
```bash
gh secret set FIREBASE_SERVICE_ACCOUNT_STAGING < service-account-staging.json
```

#### Check if STAGING_PROJECT_ID exists:
```bash
gh secret list | grep STAGING_PROJECT_ID
```

If missing, set it:
```bash
gh secret set STAGING_PROJECT_ID --body "rag-prompt-library-staging"
```

#### Check if STAGING_OPENROUTER_KEY exists:
```bash
gh secret list | grep STAGING_OPENROUTER_KEY
```

If missing, set it:
```bash
gh secret set STAGING_OPENROUTER_KEY --body "sk-or-v1-YOUR_KEY_HERE"
```

#### Check if STAGING_FIREBASE_API_KEY exists:
```bash
gh secret list | grep STAGING_FIREBASE_API_KEY
```

If missing, set it:
```bash
gh secret set STAGING_FIREBASE_API_KEY --body "AIzaSyDO_PRnAPZg6neE2NVYj7SdDNny6jmkAY8"
```

---

## Workflow Usage Verification

### ci-cd.yml Usage

**Lines 199-210**:
```yaml
- name: Setup Firebase Authentication
  run: |
    echo '${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}' > $HOME/firebase-service-account.json
    export GOOGLE_APPLICATION_CREDENTIALS=$HOME/firebase-service-account.json

- name: Set Firebase Functions Environment Variables
  run: |
    export GOOGLE_APPLICATION_CREDENTIALS=$HOME/firebase-service-account.json
    firebase functions:config:set \
      openrouter.api_key="${{ secrets.STAGING_OPENROUTER_KEY }}" \
      app.environment="staging" \
      --project ${{ secrets.STAGING_PROJECT_ID }}
```

**Secrets Used**:
- ✅ `FIREBASE_SERVICE_ACCOUNT_STAGING`
- ✅ `STAGING_OPENROUTER_KEY`
- ✅ `STAGING_PROJECT_ID`

---

### staging.yml Usage

Check if `staging.yml` uses the correct secret names:
```bash
grep -n "secrets\." .github/workflows/staging.yml
```

---

## Troubleshooting

### Issue: "gh: command not found"
**Solution**: Install GitHub CLI (see Step 1)

### Issue: "HTTP 401: Bad credentials"
**Solution**: Re-authenticate with `gh auth login`

### Issue: "Secret not found"
**Solution**: Set the secret using the commands above

### Issue: "Permission denied"
**Solution**: Ensure you have admin access to the repository

### Issue: "Invalid JSON in service account"
**Solution**: Verify the JSON file is valid and complete

---

## Security Best Practices

1. **Never commit secrets to git**
   - Secrets should only be stored in GitHub Secrets
   - Never include in `.env` files that are committed

2. **Use separate keys for staging and production**
   - Staging: `STAGING_OPENROUTER_KEY`
   - Production: `OPENROUTER_API_KEY` (different key)

3. **Rotate keys regularly**
   - Update secrets every 90 days
   - Immediately rotate if compromised

4. **Limit secret access**
   - Only repository admins should have access
   - Use environment-specific secrets

5. **Audit secret usage**
   - Review workflow logs regularly
   - Monitor for unauthorized access

---

## Verification Checklist

- [ ] GitHub CLI installed and authenticated
- [ ] All 4 secrets listed in `gh secret list`
- [ ] FIREBASE_SERVICE_ACCOUNT_STAGING contains valid JSON
- [ ] STAGING_PROJECT_ID is `rag-prompt-library-staging`
- [ ] STAGING_OPENROUTER_KEY starts with `sk-or-v1-`
- [ ] STAGING_FIREBASE_API_KEY starts with `AIza`
- [ ] Workflows reference correct secret names
- [ ] Test deployment workflow runs successfully

---

## Next Steps

After verifying all secrets:

1. **Test CI/CD Workflow**:
   ```bash
   # Create a test branch
   git checkout -b test/secrets-verification
   
   # Make a small change
   echo "# Test" >> README.md
   
   # Commit and push
   git add README.md
   git commit -m "test: verify GitHub secrets configuration"
   git push origin test/secrets-verification
   
   # Create PR
   gh pr create --title "Test: Verify GitHub Secrets" --body "Testing staging deployment with verified secrets"
   
   # Monitor workflow
   gh pr checks
   ```

2. **Verify Workflow Success**:
   - Check GitHub Actions tab
   - Verify staging deployment completes
   - Check for any secret-related errors

3. **Proceed to Phase 3**:
   - Deploy Firestore rules and indexes
   - Deploy Cloud Functions
   - Deploy frontend
   - Run smoke tests

---

## Additional Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Firebase Service Accounts](https://firebase.google.com/docs/admin/setup#initialize-sdk)
- [OpenRouter API Keys](https://openrouter.ai/docs#api-keys)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-09  
**Maintained By**: DevOps Team

