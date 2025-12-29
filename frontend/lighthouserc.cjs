module.exports = {
  ci: {
    collect: {
      // URLs to test - configurable via environment variables
      url: (() => {
        const base = process.env.LIGHTHOUSE_BASE_URL || 'http://localhost:4173';
        const paths = ['', '/documents', '/prompts', '/chat', '/settings'];
        if (process.env.LIGHTHOUSE_EXCLUDE_CHAT === 'true') {
          const idx = paths.indexOf('/chat');
          if (idx !== -1) paths.splice(idx, 1);
        }
        if (process.env.LIGHTHOUSE_PATHS) {
          try {
            const custom = JSON.parse(process.env.LIGHTHOUSE_PATHS);
            if (Array.isArray(custom) && custom.length)
              return custom.map((p) => (p ? `${base}${p}` : base));
          } catch (_) {
            /* noop */
          }
        }
        return paths.map((p) => (p ? `${base}${p}` : base));
      })(),

      // Lighthouse settings
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
        skipAudits: [
          'uses-http2', // Skip HTTP/2 check for local testing
          'redirects-http', // Skip HTTPS redirect check for local testing
        ],
      },

      // Number of runs per URL
      numberOfRuns: process.env.LIGHTHOUSE_RUNS ? Number(process.env.LIGHTHOUSE_RUNS) : 3,

      // Start server command (used only when testing local preview)
      startServerCommand: process.env.LIGHTHOUSE_BASE_URL ? undefined : 'npm run preview',
      startServerReadyPattern: process.env.LIGHTHOUSE_BASE_URL ? undefined : 'Local:.*:4173',
      startServerReadyTimeout: process.env.LIGHTHOUSE_BASE_URL ? 0 : 30000,
    },

    assert: {
      // Performance budgets
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],

        // Core Web Vitals (Desktop)
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'experimental-interaction-to-next-paint': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],

        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 512000 }], // 500KB
        'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 102400 }], // 100KB
        'resource-summary:image:size': ['warn', { maxNumericValue: 1048576 }], // 1MB
        'resource-summary:total:size': ['warn', { maxNumericValue: 2097152 }], // 2MB

        // Performance audits
        'unused-javascript': ['warn', { maxNumericValue: 0.2 }],
        'unused-css-rules': ['warn', { maxNumericValue: 0.2 }],

        // Best practices (skip HTTPS/library audits in local/preview)
        'csp-xss': ['warn', { minScore: 0.8 }],

        // Accessibility
        'color-contrast': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        label: ['error', { minScore: 1 }],
        'link-name': ['error', { minScore: 1 }],
        'button-name': ['error', { minScore: 1 }],

        // SEO
        'document-title': ['error', { minScore: 1 }],
        'meta-description': ['error', { minScore: 1 }],
        'robots-txt': ['warn', { minScore: 1 }],
        canonical: ['warn', { minScore: 1 }],
      },
    },

    upload: {
      target: 'temporary-public-storage',
      // For production, use LHCI server or GitHub integration
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: 'your-build-token'
    },

    server: {
      // LHCI server configuration (if using)
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
  },
};
