#!/usr/bin/env node

/**
 * Local Lighthouse Testing Script
 * Runs Lighthouse audits locally with custom configuration
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

class LocalLighthouseRunner {
  constructor(options = {}) {
    this.options = {
      port: options.port || 4173,
      outputDir: options.outputDir || './lighthouse-reports',
      urls: options.urls || [
        'http://localhost:4173',
        'http://localhost:4173/documents',
        'http://localhost:4173/prompts',
        'http://localhost:4173/chat'
      ],
      ...options
    };

    this.thresholds = {
      performance: 90,
      accessibility: 95,
      'best-practices': 90,
      seo: 90,
      pwa: 80
    };
  }

  /**
   * Run Lighthouse audits for all URLs
   */
  async runAudits() {
    console.log('🔍 Starting Lighthouse audits...\n');

    // Ensure output directory exists
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }

    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });

    const results = [];

    try {
      for (const url of this.options.urls) {
        console.log(`📊 Auditing: ${url}`);
        
        const result = await this.auditUrl(url, chrome.port);
        results.push(result);
        
        // Save individual report
        await this.saveReport(result, url);
      }

      // Generate summary report
      await this.generateSummaryReport(results);

      console.log('\n✅ Lighthouse audits completed!');
      console.log(`📁 Reports saved to: ${this.options.outputDir}`);

      // Check if any audits failed
      const failed = results.some(result => this.hasFailures(result));
      if (failed) {
        console.log('\n❌ Some audits failed to meet thresholds');
        process.exit(1);
      }

    } finally {
      await chrome.kill();
    }
  }

  /**
   * Audit a single URL
   */
  async auditUrl(url, chromePort) {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      port: chromePort,
      settings: {
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.109 Safari/537.36'
      }
    };

    const runnerResult = await lighthouse(url, options);
    return runnerResult.lhr;
  }

  /**
   * Save individual report
   */
  async saveReport(result, url) {
    const urlSlug = url.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save JSON report
    const jsonPath = path.join(this.options.outputDir, `${urlSlug}_${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));

    // Generate HTML report
    const htmlPath = path.join(this.options.outputDir, `${urlSlug}_${timestamp}.html`);
    const html = this.generateHTMLReport(result, url);
    fs.writeFileSync(htmlPath, html);

    console.log(`  📄 Report saved: ${htmlPath}`);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(result, url) {
    const categories = result.categories;
    const audits = result.audits;

    const getScoreColor = (score) => {
      if (score >= 0.9) return '#28a745';
      if (score >= 0.5) return '#ffc107';
      return '#dc3545';
    };

    const formatScore = (score) => Math.round(score * 100);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lighthouse Report - ${url}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score-circle { display: inline-block; width: 60px; height: 60px; border-radius: 50%; 
                       text-align: center; line-height: 60px; color: white; font-weight: bold; margin: 10px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric-card { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 1.5em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #6c757d; font-size: 0.9em; }
        .audit-list { margin-top: 20px; }
        .audit-item { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .audit-pass { background: #d4edda; border-left: 4px solid #28a745; }
        .audit-fail { background: #f8d7da; border-left: 4px solid #dc3545; }
        .audit-warn { background: #fff3cd; border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Lighthouse Report</h1>
        <p><strong>URL:</strong> ${url}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        
        <div style="text-align: center; margin: 20px 0;">
            ${Object.entries(categories).map(([key, category]) => `
                <div class="score-circle" style="background-color: ${getScoreColor(category.score)}">
                    ${formatScore(category.score)}
                </div>
                <div style="display: inline-block; margin: 0 10px; vertical-align: top;">
                    <div style="font-weight: bold;">${category.title}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="metrics">
        ${audits['first-contentful-paint'] ? `
        <div class="metric-card">
            <div class="metric-value" style="color: ${getScoreColor(audits['first-contentful-paint'].score)}">
                ${Math.round(audits['first-contentful-paint'].numericValue)}ms
            </div>
            <div class="metric-label">First Contentful Paint</div>
        </div>` : ''}
        
        ${audits['largest-contentful-paint'] ? `
        <div class="metric-card">
            <div class="metric-value" style="color: ${getScoreColor(audits['largest-contentful-paint'].score)}">
                ${Math.round(audits['largest-contentful-paint'].numericValue)}ms
            </div>
            <div class="metric-label">Largest Contentful Paint</div>
        </div>` : ''}
        
        ${audits['cumulative-layout-shift'] ? `
        <div class="metric-card">
            <div class="metric-value" style="color: ${getScoreColor(audits['cumulative-layout-shift'].score)}">
                ${audits['cumulative-layout-shift'].numericValue.toFixed(3)}
            </div>
            <div class="metric-label">Cumulative Layout Shift</div>
        </div>` : ''}
        
        ${audits['total-blocking-time'] ? `
        <div class="metric-card">
            <div class="metric-value" style="color: ${getScoreColor(audits['total-blocking-time'].score)}">
                ${Math.round(audits['total-blocking-time'].numericValue)}ms
            </div>
            <div class="metric-label">Total Blocking Time</div>
        </div>` : ''}
    </div>

    <div class="audit-list">
        <h2>Key Audits</h2>
        ${Object.entries(audits)
          .filter(([key, audit]) => audit.score !== null && audit.score < 1)
          .map(([key, audit]) => {
            const className = audit.score >= 0.9 ? 'audit-pass' : audit.score >= 0.5 ? 'audit-warn' : 'audit-fail';
            return `
            <div class="audit-item ${className}">
                <strong>${audit.title}</strong><br>
                <small>${audit.description}</small>
                ${audit.displayValue ? `<br><em>Value: ${audit.displayValue}</em>` : ''}
            </div>`;
          }).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Generate summary report
   */
  async generateSummaryReport(results) {
    const summary = {
      timestamp: new Date().toISOString(),
      totalUrls: results.length,
      averageScores: {},
      failures: []
    };

    // Calculate average scores
    const categories = ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'];
    categories.forEach(category => {
      const scores = results.map(result => result.categories[category]?.score || 0);
      summary.averageScores[category] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    // Find failures
    results.forEach((result, index) => {
      const url = this.options.urls[index];
      Object.entries(this.thresholds).forEach(([category, threshold]) => {
        const score = result.categories[category]?.score * 100 || 0;
        if (score < threshold) {
          summary.failures.push({
            url,
            category,
            score: Math.round(score),
            threshold
          });
        }
      });
    });

    const summaryPath = path.join(this.options.outputDir, 'summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    console.log('\n📊 Summary:');
    console.log(`   URLs tested: ${summary.totalUrls}`);
    console.log(`   Average Performance: ${Math.round(summary.averageScores.performance * 100)}%`);
    console.log(`   Average Accessibility: ${Math.round(summary.averageScores.accessibility * 100)}%`);
    console.log(`   Failures: ${summary.failures.length}`);
  }

  /**
   * Check if results have failures
   */
  hasFailures(result) {
    return Object.entries(this.thresholds).some(([category, threshold]) => {
      const score = result.categories[category]?.score * 100 || 0;
      return score < threshold;
    });
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new LocalLighthouseRunner();
  runner.runAudits().catch(console.error);
}

module.exports = LocalLighthouseRunner;
