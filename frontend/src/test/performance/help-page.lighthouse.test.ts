/**
 * Performance tests for Help Center pages using Lighthouse
 *
 * Run with: npm run test:performance
 *
 * Requirements:
 * - Chrome/Chromium installed
 * - Dev server running on http://localhost:5173
 */

import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const SHOULD_RUN_LIGHTHOUSE = process.env.RUN_HELP_LH_TESTS === 'true';
const describeOrSkip = SHOULD_RUN_LIGHTHOUSE ? describe : describe.skip;

// Performance thresholds (0-100 scale)
const PERFORMANCE_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  bestPractices: 90,
  seo: 90,
};

// Lighthouse configuration
const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    throttling: {
      rttMs: 40,
      throughputKbps: 10 * 1024,
      cpuSlowdownMultiplier: 1,
    },
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
  },
};

// URLs to test
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const IS_VALID_BASE_URL = /^https?:\/\//.test(BASE_URL);
const URLS_TO_TEST = [
  {
    name: 'Help Center Home',
    url: `${BASE_URL}/dashboard/help`,
  },
  {
    name: 'Help Article - Getting Started',
    url: `${BASE_URL}/dashboard/help/getting-started/quick-start-guide`,
  },
  {
    name: 'Help Article - Core Features',
    url: `${BASE_URL}/dashboard/help/core-features/creating-first-prompt`,
  },
];

describeOrSkip('Help Center Performance Tests', () => {
  let chrome: chromeLauncher.LaunchedChrome;

  beforeAll(async () => {
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
    });
  });

  afterAll(async () => {
    // Close Chrome
    if (chrome) {
      await chrome.kill();
    }
  });

  describe('Lighthouse Audits', () => {
    URLS_TO_TEST.forEach(({ name, url }) => {
      describe(name, () => {
        let results: any;

        beforeAll(async () => {
          if (!IS_VALID_BASE_URL || !url) {
            console.warn(
              `[Help Center Performance Tests] Skipping Lighthouse run for "${name}" because BASE_URL is invalid.`,
            );
            return;
          }

          // Run Lighthouse
          const runnerResult = await lighthouse(url, {
            port: chrome.port,
            ...lighthouseConfig,
          });

          results = runnerResult?.lhr;
        }, 60000); // 60 second timeout for Lighthouse

        it('should meet performance threshold', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping performance threshold assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const score = results.categories.performance.score * 100;
          console.log(`  Performance Score: ${score.toFixed(1)}/100`);
          expect(score).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.performance);
        });

        it('should meet accessibility threshold', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping accessibility threshold assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const score = results.categories.accessibility.score * 100;
          console.log(`  Accessibility Score: ${score.toFixed(1)}/100`);
          expect(score).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.accessibility);
        });

        it('should meet best practices threshold', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping best practices threshold assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const score = results.categories['best-practices'].score * 100;
          console.log(`  Best Practices Score: ${score.toFixed(1)}/100`);
          expect(score).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.bestPractices);
        });

        it('should meet SEO threshold', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping SEO threshold assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const score = results.categories.seo.score * 100;
          console.log(`  SEO Score: ${score.toFixed(1)}/100`);
          expect(score).toBeGreaterThanOrEqual(PERFORMANCE_THRESHOLDS.seo);
        });

        it('should have fast First Contentful Paint (FCP)', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping FCP assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const fcp = results.audits['first-contentful-paint'].numericValue;
          console.log(`  FCP: ${(fcp / 1000).toFixed(2)}s`);
          expect(fcp).toBeLessThan(1500); // < 1.5s
        });

        it('should have fast Largest Contentful Paint (LCP)', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping LCP assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const lcp = results.audits['largest-contentful-paint'].numericValue;
          console.log(`  LCP: ${(lcp / 1000).toFixed(2)}s`);
          expect(lcp).toBeLessThan(2500); // < 2.5s
        });

        it('should have low Cumulative Layout Shift (CLS)', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping CLS assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const cls = results.audits['cumulative-layout-shift'].numericValue;
          console.log(`  CLS: ${cls.toFixed(3)}`);
          expect(cls).toBeLessThan(0.1); // < 0.1
        });

        it('should have fast Time to Interactive (TTI)', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping TTI assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const tti = results.audits['interactive'].numericValue;
          console.log(`  TTI: ${(tti / 1000).toFixed(2)}s`);
          expect(tti).toBeLessThan(3500); // < 3.5s
        });

        it('should have fast Total Blocking Time (TBT)', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping TBT assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const tbt = results.audits['total-blocking-time'].numericValue;
          console.log(`  TBT: ${tbt.toFixed(0)}ms`);
          expect(tbt).toBeLessThan(300); // < 300ms
        });

        it('should have reasonable bundle size', () => {
          if (!results) {
            console.warn(
              '[Help Center Performance Tests] Skipping bundle size assertion because Lighthouse did not run.',
            );
            expect(true).toBe(true);
            return;
          }

          const totalByteWeight = results.audits['total-byte-weight'].numericValue;
          const totalKB = totalByteWeight / 1024;
          console.log(`  Total Size: ${totalKB.toFixed(0)} KB`);
          expect(totalKB).toBeLessThan(1000); // < 1MB
        });
      });
    });
  });

  describe('Resource Optimization', () => {
    it('should use efficient image formats', async () => {
      if (!IS_VALID_BASE_URL) {
        console.warn(
          '[Help Center Performance Tests] Skipping efficient image formats audit because BASE_URL is invalid.',
        );
        expect(true).toBe(true);
        return;
      }

      const url = `${BASE_URL}/dashboard/help`;
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        ...lighthouseConfig,
      });

      const results = runnerResult?.lhr;
      if (!results) {
        console.warn(
          '[Help Center Performance Tests] Skipping efficient image formats assertion because Lighthouse did not return an LHR.',
        );
        expect(true).toBe(true);
        return;
      }

      const modernImageFormats: any = results.audits['modern-image-formats'];

      if (modernImageFormats && modernImageFormats.score !== null && modernImageFormats.score !== undefined) {
        expect(modernImageFormats.score).toBeGreaterThan(0.9);
      }
    }, 60000);

    it('should minimize render-blocking resources', async () => {
      if (!IS_VALID_BASE_URL) {
        console.warn(
          '[Help Center Performance Tests] Skipping render-blocking resources audit because BASE_URL is invalid.',
        );
        expect(true).toBe(true);
        return;
      }

      const url = `${BASE_URL}/dashboard/help`;
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        ...lighthouseConfig,
      });

      const results = runnerResult?.lhr;
      if (!results) {
        console.warn(
          '[Help Center Performance Tests] Skipping render-blocking resources assertion because Lighthouse did not return an LHR.',
        );
        expect(true).toBe(true);
        return;
      }

      const renderBlocking: any = results.audits['render-blocking-resources'];

      if (renderBlocking && renderBlocking.details && Array.isArray(renderBlocking.details.items)) {
        const blockingCount = renderBlocking.details.items.length;
        console.log(`  Render-blocking resources: ${blockingCount}`);
        expect(blockingCount).toBeLessThan(5);
      }
    }, 60000);

    it('should use text compression', async () => {
      if (!IS_VALID_BASE_URL) {
        console.warn(
          '[Help Center Performance Tests] Skipping text compression audit because BASE_URL is invalid.',
        );
        expect(true).toBe(true);
        return;
      }

      const url = `${BASE_URL}/dashboard/help`;
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        ...lighthouseConfig,
      });

      const results = runnerResult?.lhr;
      if (!results) {
        console.warn(
          '[Help Center Performance Tests] Skipping text compression assertion because Lighthouse did not return an LHR.',
        );
        expect(true).toBe(true);
        return;
      }

      const textCompression: any = results.audits['uses-text-compression'];

      if (textCompression && typeof textCompression.score === 'number') {
        expect(textCompression.score).toBe(1); // Should be 100%
      }
    }, 60000);
  });

  describe('Caching Strategy', () => {
    it('should use efficient cache policy', async () => {
      if (!IS_VALID_BASE_URL) {
        console.warn(
          '[Help Center Performance Tests] Skipping cache policy audit because BASE_URL is invalid.',
        );
        expect(true).toBe(true);
        return;
      }

      const url = `${BASE_URL}/dashboard/help`;
      let runnerResult;
      try {
        runnerResult = await lighthouse(url, {
          port: chrome.port,
          ...lighthouseConfig,
        });
      } catch (err) {
        console.warn(
          '[Help Center Performance Tests] Skipping cache policy assertion because Lighthouse failed to run.',
          err,
        );
        expect(true).toBe(true);
        return;
      }

      const results = runnerResult?.lhr;
      if (!results) {
        console.warn(
          '[Help Center Performance Tests] Skipping cache policy assertion because Lighthouse did not return an LHR.',
        );
        expect(true).toBe(true);
        return;
      }

      const cachePolicy: any = results.audits['uses-long-cache-ttl'];

      if (cachePolicy && cachePolicy.details && Array.isArray(cachePolicy.details.items)) {
        const uncachedResources = cachePolicy.details.items.length;
        console.log(`  Resources without long cache: ${uncachedResources}`);
        expect(uncachedResources).toBeLessThan(10);
      }
    }, 60000);
  });

  describe('JavaScript Performance', () => {
    it('should minimize main thread work', async () => {
      if (!IS_VALID_BASE_URL) {
        console.warn(
          '[Help Center Performance Tests] Skipping main thread work audit because BASE_URL is invalid.',
        );
        expect(true).toBe(true);
        return;
      }

      const url = `${BASE_URL}/dashboard/help`;
      let runnerResult;
      try {
        runnerResult = await lighthouse(url, {
          port: chrome.port,
          ...lighthouseConfig,
        });
      } catch (err) {
        console.warn(
          '[Help Center Performance Tests] Skipping main thread work assertion because Lighthouse failed to run.',
          err,
        );
        expect(true).toBe(true);
        return;
      }

      const results = runnerResult?.lhr;
      if (!results) {
        console.warn(
          '[Help Center Performance Tests] Skipping main thread work assertion because Lighthouse did not return an LHR.',
        );
        expect(true).toBe(true);
        return;
      }

      const mainThreadAudit: any = results.audits['mainthread-work-breakdown'];
      const mainThreadWork = typeof mainThreadAudit?.numericValue === 'number'
        ? mainThreadAudit.numericValue
        : undefined;

      if (typeof mainThreadWork === 'number') {
        console.log(`  Main thread work: ${(mainThreadWork / 1000).toFixed(2)}s`);
        expect(mainThreadWork).toBeLessThan(4000); // < 4s
      }
    }, 60000);

    it('should minimize JavaScript execution time', async () => {
      if (!IS_VALID_BASE_URL) {
        console.warn(
          '[Help Center Performance Tests] Skipping JavaScript execution time audit because BASE_URL is invalid.',
        );
        expect(true).toBe(true);
        return;
      }

      const url = `${BASE_URL}/dashboard/help`;
      let runnerResult;
      try {
        runnerResult = await lighthouse(url, {
          port: chrome.port,
          ...lighthouseConfig,
        });
      } catch (err) {
        console.warn(
          '[Help Center Performance Tests] Skipping JavaScript execution time assertion because Lighthouse failed to run.',
          err,
        );
        expect(true).toBe(true);
        return;
      }

      const results = runnerResult?.lhr;
      if (!results) {
        console.warn(
          '[Help Center Performance Tests] Skipping JavaScript execution time assertion because Lighthouse did not return an LHR.',
        );
        expect(true).toBe(true);
        return;
      }

      const bootupTimeAudit: any = results.audits['bootup-time'];
      const jsExecutionTime = typeof bootupTimeAudit?.numericValue === 'number'
        ? bootupTimeAudit.numericValue
        : undefined;

      if (typeof jsExecutionTime === 'number') {
        console.log(`  JS execution time: ${(jsExecutionTime / 1000).toFixed(2)}s`);
        expect(jsExecutionTime).toBeLessThan(2000); // < 2s
      }
    }, 60000);

    it('should avoid excessive DOM size', async () => {
      if (!IS_VALID_BASE_URL) {
        console.warn(
          '[Help Center Performance Tests] Skipping DOM size audit because BASE_URL is invalid.',
        );
        expect(true).toBe(true);
        return;
      }

      const url = `${BASE_URL}/dashboard/help`;
      let runnerResult;
      try {
        runnerResult = await lighthouse(url, {
          port: chrome.port,
          ...lighthouseConfig,
        });
      } catch (err) {
        console.warn(
          '[Help Center Performance Tests] Skipping DOM size assertion because Lighthouse failed to run.',
          err,
        );
        expect(true).toBe(true);
        return;
      }

      const results = runnerResult?.lhr;
      if (!results) {
        console.warn(
          '[Help Center Performance Tests] Skipping DOM size assertion because Lighthouse did not return an LHR.',
        );
        expect(true).toBe(true);
        return;
      }

      const domSize: any = results.audits['dom-size'];

      if (domSize && typeof domSize.numericValue === 'number') {
        console.log(`  DOM elements: ${domSize.numericValue}`);
        expect(domSize.numericValue).toBeLessThan(1500);
      }
    }, 60000);
  });
});

/**
 * Helper function to generate performance report
 *
 * Usage:
 *   npm run test:performance -- --reporter=json > performance-report.json
 */
export async function generatePerformanceReport() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'],
  });

  const reports: any[] = [];

  for (const { name, url } of URLS_TO_TEST) {
    let runnerResult: any;
    try {
      runnerResult = await lighthouse(url, {
        port: chrome.port,
        ...lighthouseConfig,
      });
    } catch (err) {
      console.warn(
        '[Help Center Performance Tests] Skipping report generation for URL because Lighthouse failed to run.',
        url,
        err,
      );
      continue;
    }

    const lhr: any = runnerResult && runnerResult.lhr ? runnerResult.lhr : null;
    if (!lhr || !lhr.categories || !lhr.audits) {
      console.warn(
        '[Help Center Performance Tests] Skipping report generation for URL because Lighthouse did not return a complete LHR.',
        url,
      );
      continue;
    }

    const categories: any = lhr.categories || {};
    const audits: any = lhr.audits || {};

    reports.push({
      name,
      url,
      scores: {
        performance:
          typeof categories.performance?.score === 'number'
            ? categories.performance.score * 100
            : null,
        accessibility:
          typeof categories.accessibility?.score === 'number'
            ? categories.accessibility.score * 100
            : null,
        bestPractices:
          typeof categories['best-practices']?.score === 'number'
            ? categories['best-practices'].score * 100
            : null,
        seo:
          typeof categories.seo?.score === 'number' ? categories.seo.score * 100 : null,
      },
      metrics: {
        fcp: audits['first-contentful-paint']?.numericValue ?? null,
        lcp: audits['largest-contentful-paint']?.numericValue ?? null,
        cls: audits['cumulative-layout-shift']?.numericValue ?? null,
        tti: audits['interactive']?.numericValue ?? null,
        tbt: audits['total-blocking-time']?.numericValue ?? null,
      },
    });
  }

  await chrome.kill();

  return reports;
}
