#!/usr/bin/env node

/**
 * Post-Migration Verification Automation Script
 * Automates testing and validation of zen-home marketing integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VerificationAutomation {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
    
    this.marketingPages = [
      '/',
      '/solutions',
      '/contact',
      '/prompting-guide',
      '/basics',
      '/techniques',
      '/faq',
      '/help-center',
      '/services/custom-ai-solutions',
      '/services/digital-transformation',
      '/services/intelligent-applications',
      '/services/system-integration',
      '/privacy',
      '/terms',
      '/cookies'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type];
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runTest(testName, testFunction) {
    this.log(`Running: ${testName}`);
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name: testName,
        status: 'passed',
        duration,
        result
      });
      
      this.results.summary.passed++;
      this.log(`✅ ${testName} - Passed (${duration}ms)`, 'success');
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message
      });
      
      this.results.summary.failed++;
      this.log(`❌ ${testName} - Failed: ${error.message}`, 'error');
      throw error;
    } finally {
      this.results.summary.total++;
    }
  }

  // Test 1: Verify project structure
  async testProjectStructure() {
    return this.runTest('Project Structure Validation', () => {
      const requiredPaths = [
        'frontend/src/pages/marketing',
        'frontend/src/components/marketing',
        'frontend/public/assets/marketing',
        'frontend/src/constants/marketing-nav.ts'
      ];

      const missing = [];
      for (const reqPath of requiredPaths) {
        if (!fs.existsSync(reqPath)) {
          missing.push(reqPath);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing required paths: ${missing.join(', ')}`);
      }

      return { status: 'All required directories exist', paths: requiredPaths };
    });
  }

  // Test 2: Verify marketing pages exist
  async testMarketingPagesExist() {
    return this.runTest('Marketing Pages Existence', () => {
      const marketingDir = 'frontend/src/pages/marketing';
      const expectedFiles = [
        'Index.tsx',
        'Solutions.tsx',
        'Contact.tsx',
        'PromptingGuide.tsx',
        'Basics.tsx',
        'Techniques.tsx',
        'FAQ.tsx',
        'HelpCenter.tsx',
        'CustomAISolutions.tsx',
        'DigitalTransformation.tsx',
        'IntelligentApplications.tsx',
        'SystemIntegration.tsx',
        'PrivacyPolicy.tsx',
        'TermsOfService.tsx',
        'CookiePolicy.tsx',
        'NotFound.tsx',
        'PlaceholderPage.tsx'
      ];

      const missing = [];
      for (const file of expectedFiles) {
        const filePath = path.join(marketingDir, file);
        if (!fs.existsSync(filePath)) {
          missing.push(file);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing marketing pages: ${missing.join(', ')}`);
      }

      return { status: 'All marketing pages exist', count: expectedFiles.length };
    });
  }

  // Test 3: Verify marketing components exist
  async testMarketingComponentsExist() {
    return this.runTest('Marketing Components Existence', () => {
      const componentDirs = [
        'frontend/src/components/marketing/layout',
        'frontend/src/components/marketing/sections',
        'frontend/src/components/marketing/ui',
        'frontend/src/components/marketing/templates',
        'frontend/src/components/marketing/services',
        'frontend/src/components/marketing/interactive'
      ];

      const missing = [];
      for (const dir of componentDirs) {
        if (!fs.existsSync(dir)) {
          missing.push(dir);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing component directories: ${missing.join(', ')}`);
      }

      return { status: 'All component directories exist', directories: componentDirs };
    });
  }

  // Test 4: Verify assets exist
  async testMarketingAssetsExist() {
    return this.runTest('Marketing Assets Existence', () => {
      const assetsDir = 'frontend/public/assets/marketing';
      
      if (!fs.existsSync(assetsDir)) {
        throw new Error('Marketing assets directory does not exist');
      }

      const imageDir = path.join(assetsDir, 'images');
      if (!fs.existsSync(imageDir)) {
        throw new Error('Marketing images directory does not exist');
      }

      // Check for critical images
      const criticalImages = [
        'ethosbrain.svg',
        'Group 288.png',
        'Group 287.svg',
        'bot.png',
        'ai 3 1.png',
        'mole1.png',
        'banner-background.jpg',
        'promptmole.png',
        'footer-background.jpg'
      ];

      const missing = [];
      for (const image of criticalImages) {
        const imagePath = path.join(imageDir, image);
        if (!fs.existsSync(imagePath)) {
          missing.push(image);
        }
      }

      if (missing.length > 0) {
        this.log(`⚠️ Missing critical images: ${missing.join(', ')}`, 'warning');
        this.results.summary.warnings++;
      }

      return { 
        status: 'Assets directory exists', 
        missingImages: missing,
        hasWarnings: missing.length > 0 
      };
    });
  }

  // Test 5: Check TypeScript compilation
  async testTypeScriptCompilation() {
    return this.runTest('TypeScript Compilation', () => {
      try {
        // Change to frontend directory and run type check
        process.chdir('frontend');
        execSync('npm run type-check', { stdio: 'pipe' });
        process.chdir('..');
        
        return { status: 'TypeScript compilation successful' };
      } catch (error) {
        process.chdir('..');
        throw new Error(`TypeScript compilation failed: ${error.message}`);
      }
    });
  }

  // Test 6: Check build process
  async testBuildProcess() {
    return this.runTest('Build Process Validation', () => {
      try {
        process.chdir('frontend');
        execSync('npm run build', { stdio: 'pipe' });
        process.chdir('..');
        
        // Check if dist directory was created
        if (!fs.existsSync('frontend/dist')) {
          throw new Error('Build output directory not found');
        }
        
        return { status: 'Build process successful' };
      } catch (error) {
        process.chdir('..');
        throw new Error(`Build process failed: ${error.message}`);
      }
    });
  }

  // Test 7: Validate package.json dependencies
  async testDependencies() {
    return this.runTest('Dependencies Validation', () => {
      const packageJsonPath = 'frontend/package.json';
      
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for required zen-home dependencies
      const requiredDeps = [
        'embla-carousel-autoplay',
        'lottie-react',
        'react-icons',
        'tailwind-merge',
        'tailwindcss-animate'
      ];

      const missing = [];
      for (const dep of requiredDeps) {
        if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
          missing.push(dep);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
      }

      return { 
        status: 'All required dependencies present',
        dependencies: requiredDeps 
      };
    });
  }

  // Generate comprehensive report
  generateReport() {
    const reportPath = 'verification-report.json';
    
    this.results.summary.successRate = 
      this.results.summary.total > 0 
        ? ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1)
        : 0;

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    this.log(`📊 Verification report saved to ${reportPath}`, 'info');
    this.log(`📈 Success Rate: ${this.results.summary.successRate}%`, 'info');
    
    return this.results;
  }

  // Main execution function
  async run() {
    this.log('🚀 Starting Post-Migration Verification', 'info');
    
    try {
      await this.testProjectStructure();
      await this.testMarketingPagesExist();
      await this.testMarketingComponentsExist();
      await this.testMarketingAssetsExist();
      await this.testDependencies();
      
      // Optional tests (may fail in some environments)
      try {
        await this.testTypeScriptCompilation();
      } catch (error) {
        this.log('⚠️ TypeScript compilation test skipped (optional)', 'warning');
      }
      
      try {
        await this.testBuildProcess();
      } catch (error) {
        this.log('⚠️ Build process test skipped (optional)', 'warning');
      }
      
    } catch (error) {
      this.log(`💥 Critical test failed: ${error.message}`, 'error');
    }
    
    const report = this.generateReport();
    
    this.log('🎉 Verification completed', 'success');
    this.log(`📊 Results: ${report.summary.passed}/${report.summary.total} tests passed`, 'info');
    
    if (report.summary.failed > 0) {
      this.log(`❌ ${report.summary.failed} tests failed - review required`, 'error');
      process.exit(1);
    }
    
    if (report.summary.warnings > 0) {
      this.log(`⚠️ ${report.summary.warnings} warnings - review recommended`, 'warning');
    }
    
    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const automation = new VerificationAutomation();
  automation.run().catch(error => {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  });
}

module.exports = VerificationAutomation;
