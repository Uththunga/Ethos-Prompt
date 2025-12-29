# Performance Budget Enforcement Guide

## Overview

This guide explains how performance budgets are enforced in the RAG Prompt Library project, including CI/CD integration, monitoring, and optimization strategies.

## Table of Contents

1. [Performance Budgets](#performance-budgets)
2. [CI/CD Integration](#cicd-integration)
3. [Local Development](#local-development)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Optimization Strategies](#optimization-strategies)
6. [Troubleshooting](#troubleshooting)

---

## Performance Budgets

### Current Budgets

Our performance budgets are defined in `frontend/performance-budget.json`:

#### Bundle Size Budgets

| Resource Type | Maximum Size (Gzipped) | Purpose |
|--------------|------------------------|---------|
| JavaScript   | 500 KB                 | All JS bundles combined |
| CSS          | 100 KB                 | All stylesheets combined |
| Images       | 1000 KB                | All images combined |
| Fonts        | 200 KB                 | All font files combined |
| **Total**    | **2000 KB (2 MB)**     | All assets combined |

#### Timing Budgets

| Metric | Budget | Description |
|--------|--------|-------------|
| First Contentful Paint (FCP) | 1800ms | Time until first content is painted |
| Largest Contentful Paint (LCP) | 2500ms | Time until largest content element is rendered |
| First Input Delay (FID) | 100ms | Time from first user interaction to browser response |
| Cumulative Layout Shift (CLS) | 0.1 | Visual stability of the page |
| Time to First Byte (TTFB) | 800ms | Server response time |
| Total Blocking Time (TBT) | 200ms | Time page is blocked from user interaction |
| Speed Index | 3000ms | How quickly content is visually displayed |

#### Lighthouse Scores

| Category | Minimum Score |
|----------|--------------|
| Performance | 90 |
| Accessibility | 95 |
| Best Practices | 90 |
| SEO | 90 |
| PWA | 80 |

---

## CI/CD Integration

### Automated Checks

Performance budgets are automatically checked in our CI/CD pipeline on every push and pull request.

#### GitHub Actions Workflow

The `.github/workflows/ci.yml` file includes:

1. **Build Step**: Builds the frontend with production optimizations
2. **Budget Check**: Runs `check-performance-budget.js` script
3. **Bundle Analysis**: Generates bundle size reports
4. **Lighthouse CI**: Runs Lighthouse performance audits
5. **Artifact Upload**: Saves reports for review

```yaml
- name: Check performance budgets
  run: |
    cd frontend
    node scripts/check-performance-budget.js
  continue-on-error: false
```

### Failure Behavior

- **Budget Exceeded**: Build fails, preventing merge
- **Warnings (>90% of budget)**: Build passes but warnings are logged
- **Reports**: Detailed reports are uploaded as artifacts

### Viewing Reports

1. Go to GitHub Actions tab
2. Select the workflow run
3. Download artifacts:
   - `performance-budget-report.json` - Detailed budget analysis
   - `lighthouse-results` - Lighthouse audit results

---

## Local Development

### Running Budget Checks Locally

```bash
# Build and check budgets
cd frontend
npm run build:check

# Or run separately
npm run build
npm run check:budget
```

### Analyzing Bundle Size

```bash
# Generate interactive bundle visualization
npm run analyze

# Check specific bundle sizes
npm run size:check

# Understand why a module is bundled
npm run size:why
```

### Performance Testing

```bash
# Run performance tests
npm run performance:test

# Run Lighthouse locally
npm run lighthouse
```

---

## Monitoring & Alerts

### Real-Time Monitoring

Performance metrics are tracked in production using:

1. **Firebase Performance Monitoring**
   - Automatic page load metrics
   - Custom performance traces
   - Network request monitoring

2. **Sentry Performance**
   - Transaction monitoring
   - Slow query detection
   - Error correlation with performance

3. **Custom Analytics**
   - Web Vitals tracking
   - User-centric metrics
   - Performance budgets compliance

### Alert Configuration

Alerts are configured in `frontend/performance-budget.json`:

```json
{
  "monitoring": {
    "alertThresholds": {
      "performance": {
        "warning": 80,
        "error": 70
      },
      "bundleSize": {
        "warning": 400,
        "error": 500
      }
    }
  }
}
```

### Slack Notifications

Configure Slack webhook in `performance-budget.json` to receive alerts:

```json
{
  "monitoring": {
    "slackWebhook": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
  }
}
```

---

## Optimization Strategies

### Code Splitting

**Current Implementation:**

```typescript
// vite.config.ts
manualChunks: (id) => {
  if (id.includes('node_modules/react/')) return 'react-vendor';
  if (id.includes('node_modules/firebase/')) return 'firebase-vendor';
  // ... more chunks
}
```

**Best Practices:**

- Split vendor code from application code
- Create separate chunks for large libraries
- Use dynamic imports for route-based splitting

### Tree Shaking

**Enabled in Vite:**

```typescript
// vite.config.ts
esbuild: {
  treeShaking: true,
  drop: ['console', 'debugger'] // Production only
}
```

**Best Practices:**

- Use ES6 imports (not CommonJS)
- Avoid side effects in modules
- Mark packages as side-effect-free in package.json

### Compression

**Gzip & Brotli:**

```typescript
// vite.config.ts
viteCompression({
  algorithm: 'gzip',
  ext: '.gz',
  threshold: 1024,
  compressionOptions: { level: 9 }
})
```

**CDN Configuration:**

- Enable compression at CDN level
- Use Firebase Hosting compression
- Configure proper cache headers

### Image Optimization

**Strategies:**

1. Use WebP format with fallbacks
2. Implement lazy loading
3. Use responsive images with srcset
4. Compress images before upload
5. Use CDN for image delivery

**Tools:**

```bash
npm run optimize:images
```

### Font Optimization

**Best Practices:**

1. Use `font-display: swap` for faster rendering
2. Subset fonts to include only needed characters
3. Use WOFF2 format (best compression)
4. Preload critical fonts
5. Self-host fonts (avoid external requests)

### CSS Optimization

**Strategies:**

1. Use Tailwind CSS purge for unused styles
2. Enable CSS code splitting
3. Minify CSS in production
4. Use critical CSS for above-the-fold content

**Tools:**

```bash
npm run optimize:css
```

---

## Troubleshooting

### Budget Exceeded

**Step 1: Identify the Problem**

```bash
npm run analyze
```

This opens an interactive treemap showing bundle composition.

**Step 2: Common Culprits**

1. **Large Dependencies**
   - Check for duplicate dependencies
   - Use lighter alternatives (e.g., date-fns instead of moment)
   - Import only what you need

2. **Unoptimized Images**
   - Compress images
   - Use appropriate formats
   - Implement lazy loading

3. **Unused Code**
   - Remove dead code
   - Enable tree shaking
   - Use dynamic imports

**Step 3: Optimization**

```bash
# Check for duplicate dependencies
npm ls <package-name>

# Update dependencies
npm run deps:update

# Audit bundle
npm run size:why
```

### Slow Build Times

**Solutions:**

1. Disable source maps in development
2. Use `reportCompressedSize: false` in Vite config
3. Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096`
4. Use SWC instead of Babel (if applicable)

### Lighthouse Scores Low

**Common Issues:**

1. **Performance**
   - Reduce bundle size
   - Optimize images
   - Enable compression
   - Use CDN

2. **Accessibility**
   - Add alt text to images
   - Ensure proper heading hierarchy
   - Use semantic HTML
   - Test with screen readers

3. **Best Practices**
   - Use HTTPS
   - Avoid console errors
   - Use modern image formats
   - Implement CSP headers

4. **SEO**
   - Add meta descriptions
   - Use proper title tags
   - Implement structured data
   - Create sitemap

---

## Resources

### Documentation

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)

### Tools

- [Bundlephobia](https://bundlephobia.com/) - Check package sizes
- [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [WebPageTest](https://www.webpagetest.org/)

### Internal Links

- [Performance Monitoring Setup](./PERFORMANCE_MONITORING.md)
- [Optimization Checklist](./OPTIMIZATION_CHECKLIST.md)
- [CI/CD Pipeline](../.github/workflows/ci.yml)

---

**Last Updated**: 2025-10-04  
**Maintained By**: Development Team  
**Questions?** Contact the performance team or open an issue.

