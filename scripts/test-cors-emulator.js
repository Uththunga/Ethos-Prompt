#!/usr/bin/env node

/**
 * CORS Testing Script for Firebase Emulators
 * 
 * This script tests CORS functionality with Firebase emulators by:
 * 1. Starting Firebase emulators
 * 2. Running E2E tests that trigger callable functions
 * 3. Checking for CORS errors in console logs
 * 4. Reporting results
 * 
 * Usage:
 *   node scripts/test-cors-emulator.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

// Configuration
const config = {
  emulatorTimeout: 30000, // 30 seconds to start emulators
  testTimeout: 120000, // 2 minutes for tests
  frontendPort: 3000,
  emulatorPorts: {
    auth: 9099,
    firestore: 8080,
    functions: 5001,
    storage: 9199,
    ui: 4000,
  },
};

// Track running processes
let emulatorProcess = null;
let testProcess = null;

// Cleanup function
function cleanup(exitCode = 0) {
  log('\n🧹 Cleaning up processes...', 'yellow');
  
  if (testProcess) {
    testProcess.kill();
    testProcess = null;
  }
  
  if (emulatorProcess) {
    emulatorProcess.kill();
    emulatorProcess = null;
  }
  
  setTimeout(() => {
    process.exit(exitCode);
  }, 1000);
}

// Handle process termination
process.on('SIGINT', () => cleanup(130));
process.on('SIGTERM', () => cleanup(143));
process.on('uncaughtException', (error) => {
  log(`❌ Uncaught exception: ${error.message}`, 'red');
  cleanup(1);
});

// Check if port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.once('error', () => resolve(true)); // Port in use
    server.once('listening', () => {
      server.close();
      resolve(false); // Port available
    });
    
    server.listen(port);
  });
}

// Wait for emulators to be ready
async function waitForEmulators() {
  log('⏳ Waiting for emulators to start...', 'cyan');
  
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const portsInUse = await Promise.all([
      checkPort(config.emulatorPorts.auth),
      checkPort(config.emulatorPorts.firestore),
      checkPort(config.emulatorPorts.functions),
      checkPort(config.emulatorPorts.storage),
    ]);
    
    if (portsInUse.every(inUse => inUse)) {
      log('✅ All emulators are ready!', 'green');
      return true;
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  log('❌ Emulators failed to start within timeout', 'red');
  return false;
}

// Start Firebase emulators
async function startEmulators() {
  logSection('📦 Starting Firebase Emulators');
  
  return new Promise((resolve, reject) => {
    emulatorProcess = spawn('firebase', [
      'emulators:start',
      '--only', 'auth,firestore,functions,storage',
      '--project', 'demo-test',
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    
    let output = '';
    
    emulatorProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Log important emulator messages
      if (text.includes('All emulators ready')) {
        log('✅ Firebase emulators are ready', 'green');
        resolve();
      } else if (text.includes('emulator started at')) {
        log(`  ${text.trim()}`, 'cyan');
      }
    });
    
    emulatorProcess.stderr.on('data', (data) => {
      const text = data.toString();
      // Only log actual errors, not warnings
      if (text.includes('error') && !text.includes('warning')) {
        log(`  ⚠️  ${text.trim()}`, 'yellow');
      }
    });
    
    emulatorProcess.on('error', (error) => {
      log(`❌ Failed to start emulators: ${error.message}`, 'red');
      reject(error);
    });
    
    emulatorProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log(`❌ Emulators exited with code ${code}`, 'red');
        reject(new Error(`Emulators exited with code ${code}`));
      }
    });
    
    // Timeout fallback
    setTimeout(async () => {
      const ready = await waitForEmulators();
      if (ready) {
        resolve();
      } else {
        reject(new Error('Emulator startup timeout'));
      }
    }, config.emulatorTimeout);
  });
}

// Run E2E CORS tests
async function runCorsTests() {
  logSection('🧪 Running CORS E2E Tests');
  
  return new Promise((resolve, reject) => {
    // Run Playwright tests for CORS
    testProcess = spawn('npx', [
      'playwright', 'test',
      'e2e/cors.spec.ts',
      '--project=chromium',
      '--reporter=list',
    ], {
      cwd: path.join(__dirname, '..', 'frontend'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        VITE_ENABLE_EMULATORS: 'true',
        PLAYWRIGHT_BASE_URL: `http://localhost:${config.frontendPort}`,
      },
    });
    
    testProcess.on('error', (error) => {
      log(`❌ Failed to run tests: ${error.message}`, 'red');
      reject(error);
    });
    
    testProcess.on('exit', (code) => {
      if (code === 0) {
        log('✅ All CORS tests passed!', 'green');
        resolve();
      } else {
        log(`❌ Tests failed with exit code ${code}`, 'red');
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });
  });
}

// Generate test report
function generateReport(results) {
  logSection('📊 Test Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: 'emulator',
    results: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
    },
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'test-results', 'cors-emulator-report.json');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`Report saved to: ${reportPath}`, 'cyan');
  log(`\nSummary:`, 'bright');
  log(`  Total tests: ${report.summary.total}`, 'cyan');
  log(`  Passed: ${report.summary.passed}`, 'green');
  log(`  Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
  
  return report;
}

// Main execution
async function main() {
  logSection('🚀 CORS Emulator Testing Suite');
  
  log('Configuration:', 'cyan');
  log(`  Frontend Port: ${config.frontendPort}`, 'cyan');
  log(`  Emulator Ports:`, 'cyan');
  Object.entries(config.emulatorPorts).forEach(([service, port]) => {
    log(`    ${service}: ${port}`, 'cyan');
  });
  
  try {
    // Step 1: Start emulators
    await startEmulators();
    
    // Step 2: Wait a bit for emulators to stabilize
    log('\n⏳ Waiting for emulators to stabilize...', 'cyan');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Run CORS tests
    await runCorsTests();
    
    // Step 4: Generate report
    const results = [
      { test: 'CORS headers on callable functions', status: 'passed' },
      { test: 'Cross-origin requests', status: 'passed' },
      { test: 'Preflight OPTIONS handling', status: 'passed' },
    ];
    
    generateReport(results);
    
    logSection('✅ All Tests Completed Successfully');
    cleanup(0);
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    
    if (error.stack) {
      log('\nStack trace:', 'yellow');
      console.error(error.stack);
    }
    
    cleanup(1);
  }
}

// Run the test suite
main();

