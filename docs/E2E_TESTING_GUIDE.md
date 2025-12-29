# E2E Testing Guide (Playwright)

This project uses Playwright for end-to-end testing across Chromium, Firefox, and WebKit.

## Local Setup

```bash
cd frontend
npm ci
npx playwright install --with-deps
```

## Running Tests Locally

```bash
cd frontend
npm run build
npm run preview & sleep 5
PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test
```

- To run a single browser:
```bash
npx playwright test --project=chromium
```

- To debug:
```bash
npx playwright test --debug
```

## CI Integration

- E2E jobs are added to:
  - .github/workflows/ci.yml (gates deploy)
  - .github/workflows/test.yml

- Each job:
  - Installs browsers with `npx playwright install --with-deps`
  - Builds and serves the app with `vite preview`
  - Runs `npx playwright test --project=<browser>`
  - Uploads the Playwright HTML report as an artifact

## Best Practices
- Keep tests independent and idempotent
- Prefer data-testid and role-based selectors over class names
- Reset state between tests; use test accounts
- Use only free OpenRouter models in testing to avoid cost

## Troubleshooting
- Browser install issues: re-run `npx playwright install --with-deps`
- Server not ready: increase `sleep` delay or use `npx wait-on http://localhost:5173`
- Flaky tests: use `test.retry(2)` and assert by role/visible text

