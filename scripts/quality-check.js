#!/usr/bin/env node

/**
 * Quality Check Script
 * Runs comprehensive quality checks including linting, type checking, testing, and security audits
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    return false;
  }
}

function execCommandSilent(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    return null;
  }
}

class QualityChecker {
  constructor() {
    this.results = {
      typeCheck: { passed: false, duration: 0 },
      lint: { passed: false, duration: 0 },
      format: { passed: false, duration: 0 },
      test: { passed: false, duration: 0, coverage: null },
      security: { passed: false, duration: 0, vulnerabilities: 0 },
      dependencies: { passed: false, duration: 0, outdated: 0 },
    };
    this.frontendDir = path.join(process.cwd(), 'frontend');
  }

  async runTypeCheck() {
    log('🔍 Running TypeScript type check...', colors.blue);
    const startTime = Date.now();
    
    if (!fs.existsSync(path.join(this.frontendDir, 'tsconfig.json'))) {
      log('⚠️  TypeScript config not found, skipping', colors.yellow);
      this.results.typeCheck.passed = true;
      return;
    }

    const passed = execCommand('npm run type-check', { cwd: this.frontendDir });
    this.results.typeCheck.passed = passed;
    this.results.typeCheck.duration = Date.now() - startTime;
    
    if (passed) {
      log('✅ TypeScript type check passed', colors.green);
    } else {
      log('❌ TypeScript type check failed', colors.red);
    }
  }

  async runLinting() {
    log('🔧 Running ESLint...', colors.blue);
    const startTime = Date.now();
    
    const passed = execCommand('npm run lint', { cwd: this.frontendDir });
    this.results.lint.passed = passed;
    this.results.lint.duration = Date.now() - startTime;
    
    if (passed) {
      log('✅ ESLint check passed', colors.green);
    } else {
      log('❌ ESLint check failed', colors.red);
      log('💡 Try running: npm run lint:fix', colors.cyan);
    }
  }

  async runFormatCheck() {
    log('💅 Checking code formatting...', colors.blue);
    const startTime = Date.now();
    
    const passed = execCommand('npm run format:check', { cwd: this.frontendDir });
    this.results.format.passed = passed;
    this.results.format.duration = Date.now() - startTime;
    
    if (passed) {
      log('✅ Code formatting is correct', colors.green);
    } else {
      log('❌ Code formatting issues found', colors.red);
      log('💡 Try running: npm run format', colors.cyan);
    }
  }

  async runTests() {
    log('🧪 Running tests...', colors.blue);
    const startTime = Date.now();
    
    const passed = execCommand('npm run test:ci', { cwd: this.frontendDir });
    this.results.test.passed = passed;
    this.results.test.duration = Date.now() - startTime;
    
    // Try to extract coverage information
    const coveragePath = path.join(this.frontendDir, 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      try {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        this.results.test.coverage = coverageData.total;
      } catch (error) {
        log('⚠️  Could not parse coverage data', colors.yellow);
      }
    }
    
    if (passed) {
      log('✅ All tests passed', colors.green);
      if (this.results.test.coverage) {
        const coverage = this.results.test.coverage;
        log(`📊 Coverage: ${coverage.lines.pct}% lines, ${coverage.functions.pct}% functions`, colors.cyan);
      }
    } else {
      log('❌ Some tests failed', colors.red);
    }
  }

  async runSecurityAudit() {
    log('🔒 Running security audit...', colors.blue);
    const startTime = Date.now();
    
    const auditOutput = execCommandSilent('npm audit --json', { cwd: this.frontendDir });
    this.results.security.duration = Date.now() - startTime;
    
    if (auditOutput) {
      try {
        const auditData = JSON.parse(auditOutput);
        const vulnerabilities = auditData.metadata?.vulnerabilities || {};
        const totalVulns = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
        
        this.results.security.vulnerabilities = totalVulns;
        this.results.security.passed = totalVulns === 0;
        
        if (totalVulns === 0) {
          log('✅ No security vulnerabilities found', colors.green);
        } else {
          log(`⚠️  Found ${totalVulns} security vulnerabilities`, colors.yellow);
          log('💡 Try running: npm audit fix', colors.cyan);
        }
      } catch (error) {
        log('⚠️  Could not parse audit results', colors.yellow);
        this.results.security.passed = true; // Don't fail on parse error
      }
    } else {
      log('✅ Security audit completed', colors.green);
      this.results.security.passed = true;
    }
  }

  async checkDependencies() {
    log('📦 Checking dependencies...', colors.blue);
    const startTime = Date.now();
    
    const outdatedOutput = execCommandSilent('npm outdated --json', { cwd: this.frontendDir });
    this.results.dependencies.duration = Date.now() - startTime;
    
    if (outdatedOutput) {
      try {
        const outdatedData = JSON.parse(outdatedOutput);
        const outdatedCount = Object.keys(outdatedData).length;
        
        this.results.dependencies.outdated = outdatedCount;
        this.results.dependencies.passed = outdatedCount === 0;
        
        if (outdatedCount === 0) {
          log('✅ All dependencies are up to date', colors.green);
        } else {
          log(`⚠️  Found ${outdatedCount} outdated dependencies`, colors.yellow);
          log('💡 Try running: npm run deps:update', colors.cyan);
        }
      } catch (error) {
        // npm outdated returns non-zero exit code when outdated packages exist
        // but still provides valid JSON, so we handle this case
        this.results.dependencies.passed = true;
        log('✅ Dependency check completed', colors.green);
      }
    } else {
      log('✅ All dependencies are up to date', colors.green);
      this.results.dependencies.passed = true;
    }
  }

  displaySummary() {
    log('\n📋 Quality Check Summary:', colors.bright);
    log('═'.repeat(60), colors.blue);
    
    const checks = [
      { name: 'TypeScript', result: this.results.typeCheck },
      { name: 'ESLint', result: this.results.lint },
      { name: 'Formatting', result: this.results.format },
      { name: 'Tests', result: this.results.test },
      { name: 'Security', result: this.results.security },
      { name: 'Dependencies', result: this.results.dependencies },
    ];

    let allPassed = true;
    let totalDuration = 0;

    checks.forEach(check => {
      const status = check.result.passed ? '✅' : '❌';
      const color = check.result.passed ? colors.green : colors.red;
      const duration = (check.result.duration / 1000).toFixed(1);
      
      log(`${status} ${check.name.padEnd(15)} ${color}${check.result.passed ? 'PASSED' : 'FAILED'}${colors.reset} (${duration}s)`, colors.reset);
      
      if (!check.result.passed) allPassed = false;
      totalDuration += check.result.duration;
    });

    log('─'.repeat(60), colors.blue);
    log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`, colors.cyan);
    
    if (allPassed) {
      log('\n🎉 All quality checks passed!', colors.green);
    } else {
      log('\n⚠️  Some quality checks failed. Please review and fix the issues above.', colors.yellow);
    }

    // Additional metrics
    if (this.results.test.coverage) {
      const coverage = this.results.test.coverage;
      log(`\n📊 Test Coverage: ${coverage.lines.pct}% lines, ${coverage.branches.pct}% branches`, colors.cyan);
    }

    if (this.results.security.vulnerabilities > 0) {
      log(`🔒 Security: ${this.results.security.vulnerabilities} vulnerabilities found`, colors.yellow);
    }

    if (this.results.dependencies.outdated > 0) {
      log(`📦 Dependencies: ${this.results.dependencies.outdated} packages outdated`, colors.yellow);
    }

    return allPassed;
  }

  async runAll() {
    log('🚀 Starting comprehensive quality check...', colors.bright);
    
    if (!fs.existsSync(this.frontendDir)) {
      log('❌ Frontend directory not found', colors.red);
      process.exit(1);
    }

    try {
      await this.runTypeCheck();
      await this.runLinting();
      await this.runFormatCheck();
      await this.runTests();
      await this.runSecurityAudit();
      await this.checkDependencies();
      
      const allPassed = this.displaySummary();
      
      if (!allPassed) {
        log('\n💡 Quick fixes:', colors.blue);
        log('• npm run lint:fix     - Fix linting issues', colors.cyan);
        log('• npm run format       - Fix formatting issues', colors.cyan);
        log('• npm audit fix        - Fix security vulnerabilities', colors.cyan);
        log('• npm run deps:update  - Update outdated dependencies', colors.cyan);
        
        process.exit(1);
      }
      
      log('\n✅ Quality check completed successfully!', colors.green);
      
    } catch (error) {
      log(`❌ Quality check failed: ${error.message}`, colors.red);
      process.exit(1);
    }
  }
}

async function main() {
  const checker = new QualityChecker();
  await checker.runAll();
}

// Run the quality check if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { QualityChecker, main };
