#!/usr/bin/env node

/**
 * Performance Budget Checker for CI/CD
 * Validates build artifacts against performance budgets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PerformanceBudgetChecker {
  constructor() {
    this.budgetConfig = this.loadBudgetConfig();
    this.buildDir = path.join(__dirname, '../dist');
    this.results = {
      passed: [],
      warnings: [],
      errors: [],
      score: 0
    };
  }

  /**
   * Load performance budget configuration
   */
  loadBudgetConfig() {
    const configPath = path.join(__dirname, '../performance-budget.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('Performance budget configuration not found');
    }

    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  /**
   * Check all performance budgets
   */
  async checkBudgets() {
    console.log('🔍 Checking performance budgets...\n');

    try {
      // Check bundle sizes
      await this.checkBundleSizes();
      
      // Check Lighthouse scores (if available)
      await this.checkLighthouseScores();
      
      // Generate report
      this.generateReport();
      
      // Determine if CI should fail
      const shouldFail = this.shouldFailCI();
      
      if (shouldFail) {
        console.log('\n❌ Performance budget check failed!');
        process.exit(1);
      } else {
        console.log('\n✅ Performance budget check passed!');
        process.exit(0);
      }
      
    } catch (error) {
      console.error('\n💥 Performance budget check error:', error);
      process.exit(1);
    }
  }

  /**
   * Check bundle size budgets
   */
  async checkBundleSizes() {
    console.log('📦 Checking bundle sizes...');

    if (!fs.existsSync(this.buildDir)) {
      throw new Error('Build directory not found. Run build first.');
    }

    const bundleSizes = this.analyzeBundleSizes();
    const budgets = this.budgetConfig.budgets.find(b => b.name === 'Bundle Size Budget');
    
    if (!budgets) return;

    budgets.resourceSizes.forEach(budget => {
      const actualSize = bundleSizes[budget.resourceType] || 0;
      const budgetSize = budget.maximumSizeKb;
      
      const result = {
        name: `${budget.resourceType} bundle size`,
        actual: actualSize,
        budget: budgetSize,
        unit: 'KB',
        passed: actualSize <= budgetSize
      };

      if (result.passed) {
        this.results.passed.push(result);
        console.log(`  ✅ ${result.name}: ${actualSize}KB (budget: ${budgetSize}KB)`);
      } else {
        const violation = {
          ...result,
          severity: actualSize > budgetSize * 1.2 ? 'error' : 'warning'
        };
        
        if (violation.severity === 'error') {
          this.results.errors.push(violation);
          console.log(`  ❌ ${result.name}: ${actualSize}KB > ${budgetSize}KB (EXCEEDED)`);
        } else {
          this.results.warnings.push(violation);
          console.log(`  ⚠️  ${result.name}: ${actualSize}KB > ${budgetSize}KB (WARNING)`);
        }
      }
    });
  }

  /**
   * Analyze bundle sizes from build directory
   */
  analyzeBundleSizes() {
    const sizes = {
      script: 0,
      stylesheet: 0,
      image: 0,
      font: 0,
      total: 0
    };

    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          const sizeKB = stat.size / 1024;
          
          if (['.js', '.mjs'].includes(ext)) {
            sizes.script += sizeKB;
          } else if (ext === '.css') {
            sizes.stylesheet += sizeKB;
          } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'].includes(ext)) {
            sizes.image += sizeKB;
          } else if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
            sizes.font += sizeKB;
          }
          
          sizes.total += sizeKB;
        }
      });
    };

    scanDirectory(this.buildDir);

    // Round to 2 decimal places
    Object.keys(sizes).forEach(key => {
      sizes[key] = Math.round(sizes[key] * 100) / 100;
    });

    return sizes;
  }

  /**
   * Check Lighthouse scores if available
   */
  async checkLighthouseScores() {
    console.log('\n🔍 Checking Lighthouse scores...');

    const lighthouseReportPath = path.join(this.buildDir, 'lighthouse-report.json');
    
    if (!fs.existsSync(lighthouseReportPath)) {
      console.log('  ⚠️  Lighthouse report not found, skipping score check');
      return;
    }

    try {
      const report = JSON.parse(fs.readFileSync(lighthouseReportPath, 'utf8'));
      const budgets = this.budgetConfig.lighthouse;
      
      Object.entries(budgets).forEach(([category, budget]) => {
        const score = report.categories[category]?.score * 100 || 0;
        
        const result = {
          name: `Lighthouse ${category}`,
          actual: Math.round(score),
          budget: budget,
          unit: '%',
          passed: score >= budget
        };

        if (result.passed) {
          this.results.passed.push(result);
          console.log(`  ✅ ${result.name}: ${result.actual}% (budget: ${budget}%)`);
        } else {
          const violation = {
            ...result,
            severity: score < budget * 0.8 ? 'error' : 'warning'
          };
          
          if (violation.severity === 'error') {
            this.results.errors.push(violation);
            console.log(`  ❌ ${result.name}: ${result.actual}% < ${budget}% (FAILED)`);
          } else {
            this.results.warnings.push(violation);
            console.log(`  ⚠️  ${result.name}: ${result.actual}% < ${budget}% (WARNING)`);
          }
        }
      });
      
    } catch (error) {
      console.log('  ⚠️  Failed to parse Lighthouse report:', error.message);
    }
  }

  /**
   * Generate performance budget report
   */
  generateReport() {
    const totalChecks = this.results.passed.length + this.results.warnings.length + this.results.errors.length;
    const passedChecks = this.results.passed.length;
    
    this.results.score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

    const report = {
      timestamp: new Date().toISOString(),
      score: this.results.score,
      summary: {
        total: totalChecks,
        passed: this.results.passed.length,
        warnings: this.results.warnings.length,
        errors: this.results.errors.length
      },
      results: this.results,
      budgetConfig: this.budgetConfig
    };

    // Save report
    const reportPath = path.join(this.buildDir, 'performance-budget-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    this.generateHTMLReport(report);

    console.log('\n📊 Performance Budget Report:');
    console.log(`   Score: ${this.results.score}%`);
    console.log(`   Passed: ${this.results.passed.length}`);
    console.log(`   Warnings: ${this.results.warnings.length}`);
    console.log(`   Errors: ${this.results.errors.length}`);
    console.log(`   Report saved: ${reportPath}`);
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(report) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Budget Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .score { font-size: 2em; font-weight: bold; color: ${report.score >= 80 ? '#28a745' : report.score >= 60 ? '#ffc107' : '#dc3545'}; }
        .section { margin: 20px 0; }
        .result { padding: 10px; margin: 5px 0; border-radius: 4px; }
        .passed { background: #d4edda; border-left: 4px solid #28a745; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .error { background: #f8d7da; border-left: 4px solid #dc3545; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Budget Report</h1>
        <div class="score">${report.score}%</div>
        <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <table>
            <tr><th>Metric</th><th>Count</th></tr>
            <tr><td>Total Checks</td><td>${report.summary.total}</td></tr>
            <tr><td>Passed</td><td>${report.summary.passed}</td></tr>
            <tr><td>Warnings</td><td>${report.summary.warnings}</td></tr>
            <tr><td>Errors</td><td>${report.summary.errors}</td></tr>
        </table>
    </div>

    <div class="section">
        <h2>Results</h2>
        ${[...report.results.passed, ...report.results.warnings, ...report.results.errors]
          .map(result => `
            <div class="result ${result.passed ? 'passed' : (result.severity === 'error' ? 'error' : 'warning')}">
                <strong>${result.name}</strong>: ${result.actual}${result.unit} 
                ${result.passed ? '≤' : '>'} ${result.budget}${result.unit}
            </div>
          `).join('')}
    </div>
</body>
</html>`;

    const htmlPath = path.join(this.buildDir, 'performance-budget-report.html');
    fs.writeFileSync(htmlPath, html);
  }

  /**
   * Determine if CI should fail
   */
  shouldFailCI() {
    if (!this.budgetConfig.ci?.failOnBudgetExceeded) {
      return false;
    }

    return this.results.errors.length > 0;
  }

  /**
   * Send notification if configured
   */
  async sendNotification() {
    const webhook = this.budgetConfig.monitoring?.slackWebhook;
    
    if (!webhook || this.results.errors.length === 0) {
      return;
    }

    const message = {
      text: `🚨 Performance Budget Violation`,
      attachments: [{
        color: 'danger',
        fields: [
          {
            title: 'Score',
            value: `${this.results.score}%`,
            short: true
          },
          {
            title: 'Errors',
            value: this.results.errors.length,
            short: true
          },
          {
            title: 'Failed Checks',
            value: this.results.errors.map(e => e.name).join('\n'),
            short: false
          }
        ]
      }]
    };

    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });

      if (response.ok) {
        console.log('📱 Notification sent to Slack');
      }
    } catch (error) {
      console.warn('⚠️  Failed to send notification:', error.message);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new PerformanceBudgetChecker();
  checker.checkBudgets();
}

module.exports = PerformanceBudgetChecker;
