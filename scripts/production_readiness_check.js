#!/usr/bin/env node

/**
 * Production Readiness Check
 * Comprehensive validation of system components for production deployment
 * Checks infrastructure, code quality, security, and deployment readiness
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  projectRoot: process.cwd(),
  requiredFiles: [
    'package.json',
    'firebase.json',
    'firestore.rules',
    'storage.rules',
    'frontend/package.json',
    'functions/requirements.txt',
    'functions/main.py'
  ],
  requiredDirectories: [
    'frontend/src',
    'functions/src',
    'docs',
    'scripts',
    'deployment'
  ]
};

// Test results tracking
const checkResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warningCount: 0,
  errors: [],
  warnings: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    header: '🚀'
  }[type] || '📋';
  
  console.log(`${prefix} ${message}`);
}

function recordCheck(checkName, status, message = '') {
  checkResults.total++;
  
  switch (status) {
    case 'pass':
      checkResults.passed++;
      log(`${checkName} - PASSED ${message}`, 'success');
      break;
    case 'fail':
      checkResults.failed++;
      checkResults.errors.push({ check: checkName, message });
      log(`${checkName} - FAILED: ${message}`, 'error');
      break;
    case 'warning':
      checkResults.warningCount++;
      checkResults.warnings.push({ check: checkName, message });
      log(`${checkName} - WARNING: ${message}`, 'warning');
      break;
  }
}

function checkFileExists(filePath) {
  const fullPath = path.join(CONFIG.projectRoot, filePath);
  return fs.existsSync(fullPath);
}

function checkDirectoryExists(dirPath) {
  const fullPath = path.join(CONFIG.projectRoot, dirPath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      cwd: CONFIG.projectRoot,
      ...options 
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

// Check functions
function checkProjectStructure() {
  log('\n📁 Checking Project Structure...', 'header');
  
  // Check required files
  CONFIG.requiredFiles.forEach(file => {
    if (checkFileExists(file)) {
      recordCheck(`File: ${file}`, 'pass');
    } else {
      recordCheck(`File: ${file}`, 'fail', 'Required file missing');
    }
  });
  
  // Check required directories
  CONFIG.requiredDirectories.forEach(dir => {
    if (checkDirectoryExists(dir)) {
      recordCheck(`Directory: ${dir}`, 'pass');
    } else {
      recordCheck(`Directory: ${dir}`, 'fail', 'Required directory missing');
    }
  });
}

function checkFrontendReadiness() {
  log('\n🎨 Checking Frontend Readiness...', 'header');
  
  // Check if frontend can build
  const buildResult = runCommand('npm run build', { cwd: path.join(CONFIG.projectRoot, 'frontend') });
  if (buildResult.success) {
    recordCheck('Frontend Build', 'pass');
  } else {
    recordCheck('Frontend Build', 'fail', 'Build failed');
  }
  
  // Check if tests exist
  const testDir = path.join(CONFIG.projectRoot, 'frontend/src/test');
  if (checkDirectoryExists('frontend/src/test')) {
    recordCheck('Frontend Tests', 'pass');
  } else {
    recordCheck('Frontend Tests', 'warning', 'Test directory not found');
  }
  
  // Check for TypeScript configuration
  if (checkFileExists('frontend/tsconfig.json')) {
    recordCheck('TypeScript Config', 'pass');
  } else {
    recordCheck('TypeScript Config', 'warning', 'TypeScript config missing');
  }
}

function checkBackendReadiness() {
  log('\n⚙️ Checking Backend Readiness...', 'header');
  
  // Check main function file
  if (checkFileExists('functions/main.py')) {
    recordCheck('Main Function File', 'pass');
  } else {
    recordCheck('Main Function File', 'fail', 'main.py not found');
  }
  
  // Check requirements file
  if (checkFileExists('functions/requirements.txt')) {
    recordCheck('Requirements File', 'pass');
  } else {
    recordCheck('Requirements File', 'fail', 'requirements.txt not found');
  }
  
  // Check if Python dependencies can be installed
  const pipResult = runCommand('pip install -r requirements.txt --dry-run', { 
    cwd: path.join(CONFIG.projectRoot, 'functions') 
  });
  if (pipResult.success) {
    recordCheck('Python Dependencies', 'pass');
  } else {
    recordCheck('Python Dependencies', 'warning', 'Some dependencies may have issues');
  }
}

function checkFirebaseConfiguration() {
  log('\n🔥 Checking Firebase Configuration...', 'header');
  
  // Check firebase.json
  if (checkFileExists('firebase.json')) {
    try {
      const firebaseConfig = JSON.parse(fs.readFileSync(path.join(CONFIG.projectRoot, 'firebase.json'), 'utf8'));
      
      // Check hosting configuration
      if (firebaseConfig.hosting) {
        recordCheck('Firebase Hosting Config', 'pass');
      } else {
        recordCheck('Firebase Hosting Config', 'fail', 'Hosting configuration missing');
      }
      
      // Check functions configuration
      if (firebaseConfig.functions) {
        recordCheck('Firebase Functions Config', 'pass');
      } else {
        recordCheck('Firebase Functions Config', 'fail', 'Functions configuration missing');
      }
      
      // Check Firestore configuration
      if (firebaseConfig.firestore) {
        recordCheck('Firestore Config', 'pass');
      } else {
        recordCheck('Firestore Config', 'fail', 'Firestore configuration missing');
      }
      
    } catch (error) {
      recordCheck('Firebase Config Parse', 'fail', 'Invalid JSON in firebase.json');
    }
  } else {
    recordCheck('Firebase Config File', 'fail', 'firebase.json not found');
  }
  
  // Check security rules
  if (checkFileExists('firestore.rules')) {
    recordCheck('Firestore Rules', 'pass');
  } else {
    recordCheck('Firestore Rules', 'fail', 'firestore.rules not found');
  }
  
  if (checkFileExists('storage.rules')) {
    recordCheck('Storage Rules', 'pass');
  } else {
    recordCheck('Storage Rules', 'fail', 'storage.rules not found');
  }
}

function checkSecurityConfiguration() {
  log('\n🔒 Checking Security Configuration...', 'header');
  
  // Check for environment variables template
  if (checkFileExists('.env.example') || checkFileExists('.env.template')) {
    recordCheck('Environment Template', 'pass');
  } else {
    recordCheck('Environment Template', 'warning', 'No .env template found');
  }
  
  // Check for .gitignore
  if (checkFileExists('.gitignore')) {
    const gitignoreContent = fs.readFileSync(path.join(CONFIG.projectRoot, '.gitignore'), 'utf8');
    if (gitignoreContent.includes('.env') && gitignoreContent.includes('node_modules')) {
      recordCheck('Gitignore Security', 'pass');
    } else {
      recordCheck('Gitignore Security', 'warning', 'Gitignore may not exclude sensitive files');
    }
  } else {
    recordCheck('Gitignore File', 'fail', '.gitignore not found');
  }
}

function checkDeploymentReadiness() {
  log('\n🚀 Checking Deployment Readiness...', 'header');
  
  // Check for deployment scripts
  if (checkFileExists('deployment/deploy.sh') || checkFileExists('scripts/deploy.sh')) {
    recordCheck('Deployment Scripts', 'pass');
  } else {
    recordCheck('Deployment Scripts', 'warning', 'No deployment scripts found');
  }
  
  // Check for CI/CD configuration
  if (checkDirectoryExists('.github/workflows')) {
    recordCheck('CI/CD Configuration', 'pass');
  } else {
    recordCheck('CI/CD Configuration', 'warning', 'No GitHub Actions workflows found');
  }
  
  // Check for production environment configuration
  if (checkFileExists('docs/7_Day_Production_Deployment_Plan.md')) {
    recordCheck('Deployment Documentation', 'pass');
  } else {
    recordCheck('Deployment Documentation', 'warning', 'Deployment plan not found');
  }
}

function checkDocumentation() {
  log('\n📚 Checking Documentation...', 'header');
  
  // Check for README
  if (checkFileExists('README.md')) {
    recordCheck('README File', 'pass');
  } else {
    recordCheck('README File', 'warning', 'README.md not found');
  }
  
  // Check for API documentation
  if (checkDirectoryExists('docs')) {
    const docsFiles = fs.readdirSync(path.join(CONFIG.projectRoot, 'docs'));
    if (docsFiles.length > 0) {
      recordCheck('Documentation Directory', 'pass', `${docsFiles.length} files found`);
    } else {
      recordCheck('Documentation Directory', 'warning', 'Docs directory is empty');
    }
  } else {
    recordCheck('Documentation Directory', 'warning', 'No docs directory found');
  }
}

function generateReadinessReport() {
  log('\n📊 Production Readiness Report', 'header');
  log('=' * 60, 'info');
  
  const successRate = ((checkResults.passed / checkResults.total) * 100).toFixed(1);
  
  log(`Total Checks: ${checkResults.total}`, 'info');
  log(`Passed: ${checkResults.passed}`, 'success');
  log(`Failed: ${checkResults.failed}`, checkResults.failed > 0 ? 'error' : 'info');
  log(`Warnings: ${checkResults.warningCount}`, checkResults.warningCount > 0 ? 'warning' : 'info');
  log(`Success Rate: ${successRate}%`, 'info');
  
  // Determine readiness level
  let readinessLevel = 'Not Ready';
  let readinessColor = 'error';
  
  if (checkResults.failed === 0 && checkResults.warningCount <= 2) {
    readinessLevel = 'Production Ready';
    readinessColor = 'success';
  } else if (checkResults.failed <= 2 && checkResults.warningCount <= 5) {
    readinessLevel = 'Nearly Ready';
    readinessColor = 'warning';
  } else if (checkResults.failed <= 5) {
    readinessLevel = 'Needs Work';
    readinessColor = 'warning';
  }
  
  log(`\n🎯 Readiness Level: ${readinessLevel}`, readinessColor);
  
  // Show critical issues
  if (checkResults.failed > 0) {
    log('\n❌ Critical Issues to Fix:', 'error');
    checkResults.errors.forEach(error => {
      log(`  - ${error.check}: ${error.message}`, 'error');
    });
  }
  
  // Show warnings
  if (checkResults.warningCount > 0) {
    log('\n⚠️ Warnings to Address:', 'warning');
    checkResults.warnings.forEach(warning => {
      log(`  - ${warning.check}: ${warning.message}`, 'warning');
    });
  }
  
  // Recommendations
  log('\n💡 Next Steps:', 'info');
  if (checkResults.failed > 0) {
    log('  1. Fix all critical issues listed above', 'info');
  }
  if (checkResults.warningCount > 0) {
    log('  2. Address warnings for better production readiness', 'info');
  }
  log('  3. Run comprehensive integration tests', 'info');
  log('  4. Perform security audit', 'info');
  log('  5. Test deployment in staging environment', 'info');
  
  return readinessLevel === 'Production Ready';
}

// Main execution
async function runProductionReadinessCheck() {
  log('🚀 RAG Prompt Library - Production Readiness Check', 'header');
  log('=' * 60, 'info');
  
  // Run all checks
  checkProjectStructure();
  checkFrontendReadiness();
  checkBackendReadiness();
  checkFirebaseConfiguration();
  checkSecurityConfiguration();
  checkDeploymentReadiness();
  checkDocumentation();
  
  // Generate report
  const isReady = generateReadinessReport();
  
  return isReady;
}

// Run if called directly
if (require.main === module) {
  runProductionReadinessCheck()
    .then(isReady => {
      process.exit(isReady ? 0 : 1);
    })
    .catch(error => {
      log(`Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runProductionReadinessCheck, checkResults };
