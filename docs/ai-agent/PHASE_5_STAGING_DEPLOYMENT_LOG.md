# Phase 5: Staging Deployment Log

Date: October 17, 2025
Project: EthosPrompt (RAG Prompt Library)
Environment: Staging (Firebase)

## Summary

- Status: Deployed ✅ (Hosting + Functions + Firestore rules/indexes)
- OPENROUTER_USE_MOCK: true for all automated checks ✅
- Auth: Service Account via GOOGLE_APPLICATION_CREDENTIALS ✅

## Artifacts & URLs

- Hosting (Project): https://rag-prompt-library-staging.web.app
- Hosting (Preview channel): https://rag-prompt-library-staging--staging-f74fht9c.web.app (expires in ~30 days)
- Functions (Cloud Run):
  - httpApi: https://httpapi-zcr2ek5dsa-ts.a.run.app
  - health: https://health-zcr2ek5dsa-ts.a.run.app
  - stream_prompt: https://stream-prompt-zcr2ek5dsa-ts.a.run.app

## Commands Executed

```powershell
# Env
$env:GOOGLE_APPLICATION_CREDENTIALS='d:\react\React-App-000739\Prompt-Library\rag-prompt-library-staging-firebase-adminsdk-fbsvc-22737aaaf9.json'
$env:OPENROUTER_USE_MOCK='true'

# Hosting deploy (preview channel)
npx -y firebase-tools@13.16.0 hosting:channel:deploy staging --expires 30d --project rag-prompt-library-staging

# Functions deploy
npx -y firebase-tools@13.16.0 deploy --only functions --project rag-prompt-library-staging

# Firestore rules/indexes deploy
npx -y firebase-tools@13.16.0 deploy --only firestore:rules,firestore:indexes --project rag-prompt-library-staging
```

## Build Notes

- Frontend build skipped due to Windows file lock (EPERM unlink) in node_modules (lightningcss, esbuild, rollup native binaries).
- Existing `frontend/dist/` was present and deployed successfully.
- Follow-up: Re-attempt `npm ci && npm run build` after resolving file lock (close editors/AV, run elevated, or restart shell).

## Smoke Tests

```text
SMOKE:GET / (channel URL) => 200 OK
SMOKE:GET httpApi /api/health => 200 OK
SMOKE:POST httpApi /api/ai/prompt-library-chat => Unknown API endpoint (expected auth/route mapping to be verified)
```

## Observations

- Hosting deploy: success, 445 files uploaded
- Functions deploy: success; Node.js 18 deprecation warning (upgrade recommended)
- Firestore rules/indexes: success; rules compile with warnings (unused function, variable names)
- Health endpoint: 200 OK on Cloud Run httpApi
- Prompt Library Chat endpoint: Returned `Unknown API endpoint` when POSTing to `/api/ai/prompt-library-chat` on httpApi

## Potential Follow-ups

1. Frontend build stabilization on Windows:
   - Close any tools locking native binaries (editors/AV)
   - Remove `frontend/node_modules` and run `npm ci` again
   - If persists: try `npm ci --force` or run as Administrator
2. Verify HTTP routing for Prompt Library Chat in cloud deployment:
   - Confirm that `/api/ai/prompt-library-chat` is wired to the httpApi function
   - If FastAPI app is separate, consider deploying it to Cloud Run and updating hosting rewrites or proxy
   - Validate required auth headers; unauthenticated POST should return 401, not `Unknown API endpoint`
3. Upgrade Functions runtime and dependencies:
   - Node.js runtime to a supported version (e.g., Node.js 20)
   - `firebase-functions` to latest

## Next Steps

- Provide confirmation if I should:
  - Attempt another frontend build now (after closing locking processes), or
  - Proceed with UAT planning and use the current staging URL
- If routing for `/api/ai/prompt-library-chat` should work in staging, I can investigate the functions/index.js/rewrites mapping and propose a minimal fix.

--
Deployed by: Augment Agent

## Update — Routing Fix for /api/ai/prompt-library-chat

Date: October 17, 2025

- Change: Implemented POST /api/ai/prompt-library-chat route in functions/index.js (httpApi) with:
  - Firebase Auth verification (401 when unauthenticated)
  - Rate limiting via Firestore (100 req/hour/user)
  - OpenRouter free model by default (z-ai/glm-4.5-air:free)
  - OPENROUTER_USE_MOCK honored when set (for automated tests)
- Deployment: Rolled out only httpApi function
  - Command: npx -y firebase-tools@13.16.0 deploy --only functions:httpApi --project rag-prompt-library-staging
  - URL: https://httpapi-zcr2ek5dsa-ts.a.run.app

Smoke test results (post-fix):

```text
SMOKE:GET /api/health => 200 OK
SMOKE:POST /api/ai/prompt-library-chat => 401 (unauthenticated) ✅ Expected
```

Notes:

- This confirms routing is now correct and protected; frontend calls with a valid Firebase ID token should succeed.
- Next: Use the staging app with an authenticated user to verify end-to-end chat flow.
