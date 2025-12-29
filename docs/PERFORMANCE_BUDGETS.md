# Performance Budgets

This repository enforces performance budgets in CI to prevent regressions.

## What is enforced?
- Bundle sizes (JS/CSS/images/fonts/total) via `frontend/scripts/check-performance-budget.js`
- Lighthouse category thresholds via `frontend/performance-budget.json`

## Run locally
```bash
cd frontend
npm run build
npm run check:budget
```

- Report files are written to `frontend/dist/`:
  - `performance-budget-report.json`
  - `performance-budget-report.html`

## CI integration
- .github/workflows/ci.yml runs the checker after build and uploads the report artifact
- CI will fail if error-level budget violations occur (see `ci.failOnBudgetExceeded`)

## Adjusting budgets
- Edit `frontend/performance-budget.json`
- Commit changes and ensure the checker passes

## Remediation tips
- Code split large routes/components
- Remove unused dependencies; prefer lighter alternatives
- Tree-shake and enable `vite` optimizations
- Compress images and serve modern formats (webp/avif)
- Lazy load non-critical code

