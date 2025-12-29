# Task 1.1: Environment Setup & API Key Verification - Completion Guide

**Task ID:** 1.1  
**Owner:** Backend Developer  
**Effort:** 2-4 hours  
**Status:** IN_PROGRESS → COMPLETE  
**Dependencies:** None

---

## Overview

This task verifies that all required API keys and environment configurations are properly set up for the Prompt Library Dashboard backend. This is the foundation for all subsequent development work.

---

## Prerequisites

Before starting, ensure you have:
- ✅ OpenRouter API account and API key
- ✅ Google Cloud project with Embeddings API enabled
- ✅ Firebase project access (react-app-000730)
- ✅ Python 3.9+ installed
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)

---

## Step-by-Step Instructions

### Step 1: Navigate to Functions Directory

```bash
cd functions
```

### Step 2: Check Environment Variables

**Option A: Local Development (.env file)**

1. Check if `.env` file exists:
   ```bash
   ls -la .env
   ```

2. If it doesn't exist, copy from example:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your API keys:
   ```bash
   # Use your preferred editor
   nano .env
   # or
   code .env
   ```

4. Ensure these variables are set:
   ```
   OPENROUTER_API_KEY=sk-or-v1-your-actual-key
   GOOGLE_EMBEDDINGS_API_KEY=your-actual-google-key
   FIREBASE_PROJECT_ID=react-app-000730
   ENVIRONMENT=development
   ```

**Option B: Firebase Functions Config (Production)**

1. Check current config:
   ```bash
   firebase functions:config:get
   ```

2. Set OpenRouter API key:
   ```bash
   firebase functions:config:set openrouter.api_key="sk-or-v1-your-actual-key"
   ```

3. Set Google Embeddings API key:
   ```bash
   firebase functions:config:set google.embeddings_api_key="your-actual-google-key"
   ```

4. Verify configuration:
   ```bash
   firebase functions:config:get
   ```

### Step 3: Install Python Dependencies

```bash
# Install required packages
pip install -r requirements.txt

# Or install specific packages for verification
pip install requests python-dotenv firebase-admin firebase-functions
```

### Step 4: Run Verification Scripts

**Quick Verification (Bash):**

```bash
# Make script executable
chmod +x scripts/quick_verify.sh

# Run quick verification
./scripts/quick_verify.sh
```

**Detailed Verification (Python):**

```bash
# Run comprehensive verification
python scripts/verify_api_keys.py
```

Expected output:
```
============================================================
          API Key Verification - Task 1.1
============================================================

============================================================
              Checking Python Dependencies
============================================================

✓ requests is installed
✓ python-dotenv is installed
✓ firebase-admin is installed
✓ firebase-functions is installed

============================================================
           Verifying Firebase Configuration
============================================================

✓ Firebase Project ID: react-app-000730
✓ firebase.json found
✓ Functions configuration found in firebase.json
ℹ Functions region: australia-southeast1

============================================================
              Verifying OpenRouter API
============================================================

✓ API key found: sk-or-v1-...
ℹ Testing API connection...
✓ API connection successful!
ℹ Test response: API connection successful...
ℹ Tokens used - Prompt: 15, Completion: 8, Total: 23

============================================================
          Verifying Google Embeddings API
============================================================

✓ API key found: AIza...
ℹ Testing API connection...
✓ API connection successful!
ℹ Generated embedding with 768 dimensions

============================================================
                 Verification Summary
============================================================

✓ Dependencies: PASSED
✓ Firebase Config: PASSED
✓ OpenRouter API: PASSED
✓ Google Embeddings API: PASSED

============================================================

✓ All verifications passed! You're ready to proceed to Task 1.2

Next steps:
1. Mark Task 1.1 as COMPLETE in the task list
2. Start Task 1.2: Audit Current Execution Implementation
3. Review functions/main.py and functions/src/ai_service.py
```

### Step 5: Manual API Testing (Optional)

**Test OpenRouter API with curl:**

```bash
curl -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://react-app-000730.web.app" \
  -H "X-Title: Prompt Library Dashboard" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello! This is a test message."}
    ],
    "max_tokens": 50
  }'
```

Expected response:
```json
{
  "id": "gen-...",
  "model": "openai/gpt-3.5-turbo",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! I'm here to help..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 8,
    "total_tokens": 23
  }
}
```

**Test Google Embeddings API:**

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=$GOOGLE_EMBEDDINGS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "models/text-embedding-004",
    "content": {
      "parts": [{
        "text": "This is a test message for embedding generation."
      }]
    }
  }'
```

Expected response:
```json
{
  "embedding": {
    "values": [0.123, -0.456, 0.789, ...]
  }
}
```

### Step 6: Document Configuration

Create a configuration summary document:

```bash
# Create documentation
cat > docs/API_CONFIGURATION.md << 'EOF'
# API Configuration Summary

**Date:** $(date)
**Task:** 1.1 - Environment Setup & API Key Verification

## Configured APIs

### OpenRouter API
- **Status:** ✅ Verified
- **Endpoint:** https://openrouter.ai/api/v1/chat/completions
- **Models Available:** GPT-3.5-turbo, GPT-4, Claude-3, etc.
- **Test Result:** Successful connection

### Google Embeddings API
- **Status:** ✅ Verified
- **Endpoint:** https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004
- **Embedding Dimensions:** 768
- **Test Result:** Successful connection

### Firebase Configuration
- **Project ID:** react-app-000730
- **Region:** australia-southeast1
- **Status:** ✅ Verified

## Environment Variables

All required environment variables are set in:
- Local: `functions/.env`
- Production: Firebase Functions Config

## Next Steps

Proceed to Task 1.2: Audit Current Execution Implementation
EOF
```

---

## Acceptance Criteria Checklist

Mark each item as complete:

- [ ] **1. API Keys Configured**
  - [ ] OpenRouter API key is set in `.env` or Firebase config
  - [ ] Google Embeddings API key is set in `.env` or Firebase config
  - [ ] Firebase Project ID is set
  - [ ] No placeholder values remain

- [ ] **2. API Connections Verified**
  - [ ] OpenRouter API test request returns 200 status
  - [ ] OpenRouter API returns valid response with content
  - [ ] Google Embeddings API test request returns 200 status
  - [ ] Google Embeddings API returns valid embedding vector

- [ ] **3. Dependencies Installed**
  - [ ] Python packages installed (`requests`, `python-dotenv`, `firebase-admin`, `firebase-functions`)
  - [ ] No import errors when running verification script

- [ ] **4. Firebase Configuration Verified**
  - [ ] `firebase.json` exists and is valid
  - [ ] Functions configuration present in `firebase.json`
  - [ ] Project ID matches expected value (react-app-000730)

- [ ] **5. Documentation Complete**
  - [ ] Configuration process documented
  - [ ] API test results recorded
  - [ ] Any issues or workarounds documented

- [ ] **6. Verification Scripts Run Successfully**
  - [ ] `quick_verify.sh` completes without errors
  - [ ] `verify_api_keys.py` shows all checks passed
  - [ ] Manual curl tests (optional) successful

---

## Common Issues & Solutions

### Issue 1: "OPENROUTER_API_KEY not set"

**Solution:**
1. Check if `.env` file exists: `ls -la .env`
2. If not, copy from example: `cp .env.example .env`
3. Edit `.env` and add your actual API key
4. Reload environment: `source .env` (bash) or restart terminal

### Issue 2: "Authentication failed - Invalid API key"

**Solution:**
1. Verify API key is correct (no extra spaces or quotes)
2. Check API key on OpenRouter dashboard: https://openrouter.ai/keys
3. Ensure API key starts with `sk-or-v1-`
4. Try generating a new API key if needed

### Issue 3: "Google Embeddings API 403 Forbidden"

**Solution:**
1. Ensure Generative Language API is enabled in Google Cloud Console
2. Check API key restrictions (if any)
3. Verify billing is enabled on Google Cloud project
4. Check API quotas haven't been exceeded

### Issue 4: "Module not found" errors

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Or install specific missing package
pip install <package-name>
```

### Issue 5: "firebase.json not found"

**Solution:**
```bash
# Navigate to project root (one level up from functions)
cd ..

# Verify firebase.json exists
ls -la firebase.json

# If running from functions directory, use relative path
ls -la ../firebase.json
```

---

## Time Tracking

**Estimated Time:** 2-4 hours  
**Actual Time:** ___ hours

**Breakdown:**
- Environment setup: ___ minutes
- API key configuration: ___ minutes
- Running verification scripts: ___ minutes
- Troubleshooting issues: ___ minutes
- Documentation: ___ minutes

---

## Next Steps

Once all acceptance criteria are met:

1. **Update Task Status:**
   ```bash
   # Mark Task 1.1 as COMPLETE in task management system
   ```

2. **Proceed to Task 1.2:**
   - Review `functions/main.py`
   - Review `functions/src/ai_service.py`
   - Review `frontend/src/components/execution/PromptExecutor.tsx`
   - Document current implementation
   - Identify gaps and failure modes

3. **Notify Team:**
   - Update team on completion
   - Share any issues encountered
   - Document any deviations from plan

---

## Sign-off

**Completed by:** _______________  
**Date:** _______________  
**Verified by:** _______________  
**Date:** _______________

---

**Task 1.1 Status:** ✅ COMPLETE

Ready to proceed to Task 1.2: Audit Current Execution Implementation

