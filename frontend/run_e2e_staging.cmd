@echo off
set PLAYWRIGHT_BASE_URL=https://rag-prompt-library-staging.web.app
set OPENROUTER_USE_MOCK=true
npx playwright test --reporter=list > ..\docs\artifacts\staging-validation-complete-latest\logs\e2e-final-validation.log 2>&1
