#!/usr/bin/env node

/**
 * Button Testing Suite Runner
 *
 * This script runs all button-related tests and generates comprehensive reports
 * for the button standardization validation.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { validateButtonStandardization } from './button-validation-scripts';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestResult[];
  validationResult?: unknown;
}

/**
 * Runs a specific test file and captures results
 */
function runTestFile(testFile: string): TestResult {
  const startTime = Date.now();

  try {
    console.log(`🧪 Running ${testFile}...`);

    const output = execSync(
      `npx vitest run ${testFile} --reporter=verbose`,
      {
        encoding: 'utf-8',
        cwd: path.resolve(__dirname, '..'),
        timeout: 60000 // 60 second timeout
      }
    );

    const duration = Date.now() - startTime;

    return {
      name: testFile,
      passed: true,
      duration,
      output
    };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as { stdout?: string; stderr?: string; message?: string };

    return {
      name: testFile,
      passed: false,
      duration,
      output: err.stdout || '',
      error: err.stderr || err.message
    };
  }
}

/**
 * Runs all button-related tests
 */
async function runButtonTestSuite(): Promise<TestSuiteResult> {
  console.log('🚀 Starting Button Standardization Test Suite');
  console.log('=' .repeat(60));

  const testFiles = [
    'src/test/button-sizing.test.tsx',
    'src/test/button-context-consistency.test.tsx',
    'src/test/button-visual-regression.test.tsx',
    'src/test/button-accessibility.test.tsx'
  ];

  const startTime = Date.now();
  const results: TestResult[] = [];

  // Run each test file
  for (const testFile of testFiles) {
    const result = runTestFile(testFile);
    results.push(result);

    if (result.passed) {
      console.log(`✅ ${testFile} - PASSED (${result.duration}ms)`);
    } else {
      console.log(`❌ ${testFile} - FAILED (${result.duration}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error.substring(0, 200)}...`);
      }
    }
  }

  // Run validation script
  console.log('\n🔍 Running button validation...');
  let validationResult;
  try {
    validationResult = await validateButtonStandardization();
    console.log(`✅ Validation completed - ${validationResult.validButtons}/${validationResult.totalButtons} buttons valid`);
  } catch (error) {
    console.log(`❌ Validation failed: ${error}`);
  }

  const totalDuration = Date.now() - startTime;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;

  const suiteResult: TestSuiteResult = {
    totalTests: results.length,
    passedTests,
    failedTests,
    duration: totalDuration,
    results,
    validationResult
  };

  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Suite Summary');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${suiteResult.totalTests}`);
  console.log(`Passed: ${suiteResult.passedTests}`);
  console.log(`Failed: ${suiteResult.failedTests}`);
  console.log(`Duration: ${suiteResult.duration}ms`);
  console.log(`Success Rate: ${((suiteResult.passedTests / suiteResult.totalTests) * 100).toFixed(1)}%`);

  if (validationResult) {
    console.log(`\nButton Validation:`);
    console.log(`- Total Buttons: ${validationResult.totalButtons}`);
    console.log(`- Valid Buttons: ${validationResult.validButtons}`);
    console.log(`- Invalid Buttons: ${validationResult.invalidButtons}`);
    console.log(`- Validation Success Rate: ${((validationResult.validButtons / validationResult.totalButtons) * 100).toFixed(1)}%`);
  }

  return suiteResult;
}

/**
 * Generates a comprehensive test report
 */
function generateTestReport(result: TestSuiteResult): string {
  const report = [
    '# Button Standardization Test Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Executive Summary',
    `- **Total Test Files**: ${result.totalTests}`,
    `- **Passed**: ${result.passedTests}`,
    `- **Failed**: ${result.failedTests}`,
    `- **Success Rate**: ${((result.passedTests / result.totalTests) * 100).toFixed(1)}%`,
    `- **Total Duration**: ${(result.duration / 1000).toFixed(2)}s`,
    ''
  ];

  if (result.validationResult) {
    report.push('## Button Validation Results');
    report.push(`- **Total Buttons Found**: ${result.validationResult.totalButtons}`);
    report.push(`- **Valid Buttons**: ${result.validationResult.validButtons}`);
    report.push(`- **Invalid Buttons**: ${result.validationResult.invalidButtons}`);
    report.push(`- **Deprecated Size Usage**: ${result.validationResult.deprecatedSizes.length}`);
    report.push(`- **Accessibility Issues**: ${result.validationResult.missingAccessibility.length}`);
    report.push(`- **Inconsistent Sizing**: ${result.validationResult.inconsistentSizing.length}`);
    report.push('');
  }

  report.push('## Test Results by File');
  result.results.forEach(testResult => {
    const status = testResult.passed ? '✅ PASSED' : '❌ FAILED';
    const duration = `${testResult.duration}ms`;

    report.push(`### ${testResult.name} - ${status} (${duration})`);

    if (!testResult.passed && testResult.error) {
      report.push('```');
      report.push(testResult.error.substring(0, 1000));
      if (testResult.error.length > 1000) {
        report.push('... (truncated)');
      }
      report.push('```');
    }

    report.push('');
  });

  if (result.failedTests > 0) {
    report.push('## Recommendations');
    report.push('The following issues were identified and should be addressed:');
    report.push('');

    result.results.filter(r => !r.passed).forEach(failedTest => {
      report.push(`- **${failedTest.name}**: Review test failures and fix underlying issues`);
    });

    if (result.validationResult && result.validationResult.invalidButtons > 0) {
      report.push('- **Button Validation**: Address deprecated size usage and accessibility issues');
      report.push('- **Migration**: Complete migration of remaining non-standard buttons');
    }
  } else {
    report.push('## ✅ All Tests Passed!');
    report.push('Congratulations! All button standardization tests are passing.');
    report.push('The button sizing system is properly implemented and validated.');
  }

  return report.join('\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    const result = await runButtonTestSuite();

    // Generate and save report
    const report = generateTestReport(result);
    const reportPath = path.resolve(__dirname, 'button-test-report.md');
    fs.writeFileSync(reportPath, report);

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (result.failedTests > 0) {
      console.log('\n❌ Some tests failed. Please review the report and fix issues.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed! Button standardization is complete.');
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Test suite execution failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { generateTestReport, runButtonTestSuite };

// Run if called directly
if (require.main === module) {
  main();
}
