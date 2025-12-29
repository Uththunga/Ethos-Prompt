#!/usr/bin/env bash
set -euo pipefail

# Deploy frontend to a Firebase Hosting preview channel named "staging"
# Requires: Firebase CLI authenticated and project configured via .firebaserc
# Optional: Set STAGING_URL to run smoke tests against the deployed preview URL

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

# 1) Build frontend
pushd frontend >/dev/null
npm run build
popd >/dev/null

# 2) Deploy hosting to preview channel "staging" (expires in 7 days)
echo "Deploying to Firebase Hosting preview channel 'staging'..."
firebase hosting:channel:deploy staging --expires 7d --only hosting

echo "\nDeployment complete. If Firebase CLI printed a preview URL, export it as STAGING_URL."
echo "Example: export STAGING_URL=https://<site-id>--staging.web.app"

echo "\nOptional: Run smoke tests (requires Python + pytest + requests)"
echo "pytest -q functions/tests/smoke_tests.py"

