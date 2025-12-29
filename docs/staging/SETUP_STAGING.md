# Staging Environment Setup Guide

This guide describes how to set up the staging environment for the RAG Prompt Library using the confirmed production project ID: `rag-prompt-library`.

## 1) Create the Staging Firebase Project

- Project ID: `rag-prompt-library-staging`
- Region: `australia-southeast1`
- Enable: Authentication, Firestore (Native, same location), Storage, Hosting, Functions
- Billing: Enable Blaze plan if Functions/Vector Search are required

## 2) Configure Local and Frontend Environment

- Create `frontend/.env.staging` (already scaffolded)
- Populate with Firebase web app config from the staging project's Firebase Console
- Keep `VITE_USE_EMULATORS=false` for staging

## 3) Configure GitHub Secrets (Staging)

Add the following repository secrets:

- `FIREBASE_SERVICE_ACCOUNT_RAG_PROMPT_LIBRARY_STAGING` — JSON content of a Firebase service account with Hosting (and optionally Functions) deploy permissions for `rag-prompt-library-staging`
- (Optional) `STAGING_FIREBASE_CONFIG` — Base64 or JSON for front-end env injection if using a build-time injection step

## 4) CI Workflow for Staging Deploys

- A new workflow has been added: `.github/workflows/staging.yml`
- Triggers on pushes to `develop` or `staging` branches and on manual dispatch
- Builds the frontend and deploys to Firebase Hosting for the staging project

If Functions deploys are needed in CI, prefer a second job using the Firebase CLI with a service account and:

```bash
firebase deploy --only functions --project rag-prompt-library-staging
```

## 5) Functions Environment Config (Staging)

From your workstation:

```bash
firebase use rag-prompt-library-staging

# Set provider API keys (use staging-scope keys where possible)
firebase functions:config:set \
  openrouter.api_key="<staging-openrouter-key>" \
  openrouter.api_key_rag="<staging-openrouter-rag-key>" \
  llm.default_provider="openrouter" \
  google.api_key="<staging-google-genai-key>"

# Verify
firebase functions:config:get
```

Then deploy:

```bash
firebase deploy --only functions,hosting,firestore:indexes --project rag-prompt-library-staging
```

## 6) Post-Deploy Smoke Tests

- Sign up/login
- Create a prompt
- Upload a document
- Execute prompt with RAG and confirm streamed updates appear
- Check Firestore documents and vector search results

## 7) Keep Regions Consistent

- Ensure Functions, Firestore, and Hosting are aligned to `australia-southeast1` for parity with production

---

Once the above steps are complete, the staging environment will mirror production and can safely gate releases.

