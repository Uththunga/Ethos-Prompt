# CORS Configuration — RAG Prompt Library

This document captures the production-ready CORS configuration across Cloud Functions and Cloud Storage.

## Allowed Production Origins

Keep these four origins in ALL server-side CORS allowlists:

- https://react-app-000730.web.app
- https://react-app-000730.firebaseapp.com
- https://rag-prompt-library.web.app
- https://rag-prompt-library.firebaseapp.com

Include local development origins as needed:

- http://localhost:5173 (Vite default)
- http://localhost:3000 (alt dev)
- http://127.0.0.1:5000 (local testing)

## Firebase Functions (Node runtime)

- Callable functions automatically handle CORS, but explicit preflight handling is implemented for the HTTP `httpApi` function.
- A backward-compatible callable named `generate_prompt` is exported to satisfy the current frontend contract.

Example:

```js
exports.httpApi = onRequest({ cors: true }, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).send();
  // ...
});
```

## Firebase Functions (Python runtime)

Python callable functions in `functions/main.py` use `options.CorsOptions` and must include both production origin sets.

Example:

```python
@https_fn.on_call(
  cors=options.CorsOptions(
    cors_origins=[
      "https://react-app-000730.web.app",
      "https://react-app-000730.firebaseapp.com",
      "https://rag-prompt-library.web.app",
      "https://rag-prompt-library.firebaseapp.com",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5000",
    ],
    cors_methods=["GET", "POST", "OPTIONS"],
  )
)
```

Note: Python functions are currently ignored by `firebase.json` for deployment. Deploying them requires adjusting configuration or using a separate deployment path.

## Firebase Storage (CORS)

The `cors.json` file includes both production origin sets and is applied to the bucket via gsutil.

Commands to apply:

```bash
# Default bucket (rag-prompt-library)
gsutil cors set cors.json gs://rag-prompt-library.appspot.com

# If using the react-app-000730 project bucket as well
gsutil cors set cors.json gs://react-app-000730.appspot.com
```

## Verification

- Local: Use Firebase emulators (requires Java). Start emulators and the dev server, then run Playwright `e2e/cors.spec.ts`.
- Staging/Prod: From the live site, open DevTools Network tab while executing a function (e.g., AI-Assisted Creation). Ensure:
  - No CORS errors in Console
  - `Access-Control-Allow-Origin` header present
  - Preflight (OPTIONS) returns 200/204

## Notes

- Node.js 18 runtime is deprecated and should be upgraded before 2025-10-30.
- Keep this document updated whenever origins or hosting domains change.

