#!/usr/bin/env node

/**
 * Test Coverage Analysis and Reporting Script
 * Generates comprehensive test coverage reports and analysis
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
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    log(`Error executing: ${command}`, colors.red);
    throw error;
  }
}

function runTestCoverage() {
  log('🧪 Running test coverage analysis...', colors.blue);
  
  const frontendDir = path.join(process.cwd(), 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    log('❌ Frontend directory not found', colors.red);
    process.exit(1);
  }

  try {
    // Run tests with coverage
    log('Running tests with coverage...', colors.cyan);
    execCommand('npm run test:coverage', { cwd: frontendDir, stdio: 'inherit' });
    
    log('✅ Test coverage completed', colors.green);
  } catch (error) {
    log('❌ Test coverage failed', colors.red);
    process.exit(1);
  }
}

function analyzeCoverageReport() {
  log('📊 Analyzing coverage report...', colors.blue);
  
  const coverageDir = path.join(process.cwd(), 'frontend', 'coverage');
  const coverageJsonPath = path.join(coverageDir, 'coverage-summary.json');
  
  if (!fs.existsSync(coverageJsonPath)) {
    log('⚠️  Coverage summary not found, generating...', colors.yellow);
    return null;
  }

  try {
    const coverageData = JSON.parse(fs.readFileSync(coverageJsonPath, 'utf8'));
    return coverageData;
  } catch (error) {
    log('❌ Failed to parse coverage data', colors.red);
    return null;
  }
}

function displayCoverageSummary(coverageData) {
  if (!coverageData || !coverageData.total) {
    log('⚠️  No coverage data available', colors.yellow);
    return;
  }

  const { total } = coverageData;
  
  log('\n📈 Coverage Summary:', colors.bright);
  log('═'.repeat(50), colors.blue);
  
  const metrics = [
    { name: 'Lines', data: total.lines },
    { name: 'Functions', data: total.functions },
    { name: 'Branches', data: total.branches },
    { name: 'Statements', data: total.statements },
  ];

  metrics.forEach(metric => {
    const percentage = metric.data.pct;
    const color = percentage >= 80 ? colors.green : percentage >= 60 ? colors.yellow : colors.red;
    const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
    
    log(`${status} ${metric.name.padEnd(12)}: ${color}${percentage}%${colors.reset} (${metric.data.covered}/${metric.data.total})`, colors.reset);
  });
}

function generateCoverageThresholds(coverageData) {
  if (!coverageData || !coverageData.total) {
    return;
  }

  const { total } = coverageData;
  const thresholds = {
    lines: Math.max(total.lines.pct - 5, 70),
    functions: Math.max(total.functions.pct - 5, 70),
    branches: Math.max(total.branches.pct - 5, 60),
    statements: Math.max(total.statements.pct - 5, 70),
  };

  log('\n🎯 Recommended Coverage Thresholds:', colors.blue);
  log('Add to vitest.config.ts:', colors.cyan);
  log(`
coverage: {
  thresholds: {
    lines: ${thresholds.lines},
    functions: ${thresholds.functions},
    branches: ${thresholds.branches},
    statements: ${thresholds.statements},
  }
}`, colors.yellow);
}

function identifyUncoveredFiles(coverageData) {
  if (!coverageData) return;

  log('\n🔍 Coverage Analysis:', colors.blue);
  
  const files = Object.entries(coverageData)
    .filter(([key]) => key !== 'total')
    .map(([file, data]) => ({
      file: file.replace(process.cwd(), ''),
      ...data,
    }))
    .sort((a, b) => a.lines.pct - b.lines.pct);

  const lowCoverageFiles = files.filter(file => file.lines.pct < 70);
  
  if (lowCoverageFiles.length > 0) {
    log('\n⚠️  Files with low coverage (<70%):', colors.yellow);
    lowCoverageFiles.slice(0, 10).forEach(file => {
      log(`   ${file.file} - ${file.lines.pct}%`, colors.red);
    });
    
    if (lowCoverageFiles.length > 10) {
      log(`   ... and ${lowCoverageFiles.length - 10} more files`, colors.yellow);
    }
  } else {
    log('✅ All files have good coverage (≥70%)', colors.green);
  }

  const highCoverageFiles = files.filter(file => file.lines.pct >= 90);
  if (highCoverageFiles.length > 0) {
    log(`\n🏆 ${highCoverageFiles.length} files with excellent coverage (≥90%)`, colors.green);
  }
}

function generateCoverageReport() {
  log('\n📋 Generating detailed coverage report...', colors.blue);
  
  const frontendDir = path.join(process.cwd(), 'frontend');
  const coverageDir = path.join(frontendDir, 'coverage');
  
  if (fs.existsSync(path.join(coverageDir, 'lcov-report', 'index.html'))) {
    log('✅ HTML coverage report available at: frontend/coverage/lcov-report/index.html', colors.green);
    log('   Open in browser to view detailed coverage information', colors.cyan);
  }
  
  if (fs.existsSync(path.join(coverageDir, 'lcov.info'))) {
    log('✅ LCOV report available at: frontend/coverage/lcov.info', colors.green);
    log('   Can be used with coverage visualization tools', colors.cyan);
  }
}

function checkCoverageGoals(coverageData) {
  if (!coverageData || !coverageData.total) return;

  const { total } = coverageData;
  const goals = {
    lines: 80,
    functions: 80,
    branches: 70,
    statements: 80,
  };

  log('\n🎯 Coverage Goals Assessment:', colors.blue);
  
  let allGoalsMet = true;
  Object.entries(goals).forEach(([metric, goal]) => {
    const current = total[metric].pct;
    const met = current >= goal;
    const status = met ? '✅' : '❌';
    const color = met ? colors.green : colors.red;
    
    log(`${status} ${metric.padEnd(12)}: ${color}${current}%${colors.reset} (goal: ${goal}%)`, colors.reset);
    
    if (!met) {
      allGoalsMet = false;
      const needed = Math.ceil((goal * total[metric].total / 100) - total[metric].covered);
      log(`   Need ${needed} more ${metric} covered to reach goal`, colors.yellow);
    }
  });

  if (allGoalsMet) {
    log('\n🎉 All coverage goals met!', colors.green);
  } else {
    log('\n⚠️  Some coverage goals not met. Consider adding more tests.', colors.yellow);
  }
}

function main() {
  log('🚀 Starting test coverage analysis...', colors.bright);
  
  try {
    runTestCoverage();
    const coverageData = analyzeCoverageReport();
    
    if (coverageData) {
      displayCoverageSummary(coverageData);
      identifyUncoveredFiles(coverageData);
      checkCoverageGoals(coverageData);
      generateCoverageThresholds(coverageData);
    }
    
    generateCoverageReport();
    
    log('\n✅ Coverage analysis complete!', colors.green);
  } catch (error) {
    log(`❌ Coverage analysis failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the analysis if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
