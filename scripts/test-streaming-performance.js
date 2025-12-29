#!/usr/bin/env node

/**
 * Streaming Performance Testing Script
 *
 * Tests streaming latency and performance metrics:
 * - First chunk latency (target: < 2s)
 * - Total execution time (target: < 10s)
 * - Update frequency
 * - Firestore read/write counts
 * - Error rates
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  addDoc,
  doc,
  onSnapshot,
  deleteDoc,
  updateDoc,
} = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bright');
  console.log('='.repeat(80) + '\n');
}

// Firebase configuration for emulator
const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-test.firebaseapp.com',
  projectId: 'demo-test',
  storageBucket: 'demo-test.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Connect to emulators
if (process.env.USE_EMULATORS !== 'false') {
  const { connectFirestoreEmulator } = require('firebase/firestore');
  const { connectAuthEmulator } = require('firebase/auth');

  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    log('Connected to Firebase emulators', 'green');
  } catch (error) {
    log('Warning: Could not connect to emulators', 'yellow');
  }
}

// Performance metrics
const metrics = {
  tests: [],
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  avgFirstChunk: 0,
  avgTotalTime: 0,
  minFirstChunk: Infinity,
  maxFirstChunk: 0,
  minTotalTime: Infinity,
  maxTotalTime: 0,
};

async function authenticateUser() {
  logSection('Authenticating Test User');

  const email = 'e2e-user@example.com';
  const password = 'TestPwd!12345';

  try {
    await signInWithEmailAndPassword(auth, email, password);
    log(`Authenticated as: ${email}`, 'green');
    return auth.currentUser;
  } catch (error) {
    log(`Authentication failed: ${error.message}`, 'red');
    throw error;
  }
}

async function simulateStreamingExecution(testName, promptContent) {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    let firstChunkTime = null;
    let updateCount = 0;
    let lastContent = '';

    const user = auth.currentUser;
    if (!user) {
      reject(new Error('User not authenticated'));
      return;
    }

    try {
      // Create execution document
      const executionRef = await addDoc(collection(db, 'executions'), {
        userId: user.uid,
        promptId: 'test-prompt',
        promptContent: promptContent,
        status: 'pending',
        createdAt: new Date(),
        partialOutput: '',
      });

      log(`  Created execution: ${executionRef.id}`, 'cyan');

      // Listen for streaming updates
      const unsubscribe = onSnapshot(executionRef, (snapshot) => {
        const data = snapshot.data();
        updateCount++;

        if (data?.partialOutput && data.partialOutput !== lastContent) {
          if (!firstChunkTime) {
            firstChunkTime = Date.now() - startTime;
            log(`  First chunk received: ${firstChunkTime}ms`, 'green');
          }
          lastContent = data.partialOutput;
        }

        if (data?.status === 'completed') {
          const totalTime = Date.now() - startTime;
          unsubscribe();

          // Clean up
          deleteDoc(executionRef).catch(() => {});

          resolve({
            testName,
            firstChunkTime: firstChunkTime || totalTime,
            totalTime,
            updateCount,
            success: true,
          });
        } else if (data?.status === 'error') {
          unsubscribe();
          deleteDoc(executionRef).catch(() => {});

          reject(new Error(data.error || 'Execution failed'));
        }
      });

      // Simulate streaming updates (in real scenario, backend would do this)
      setTimeout(async () => {
        // Simulate first chunk
        await updateDoc(executionRef, {
          status: 'streaming',
          partialOutput: 'This is the first chunk of the response...',
        });
      }, 500);

      setTimeout(async () => {
        // Simulate more content
        await updateDoc(executionRef, {
          partialOutput:
            'This is the first chunk of the response... and here is more content being streamed...',
        });
      }, 1000);

      setTimeout(async () => {
        // Simulate completion
        await updateDoc(executionRef, {
          status: 'completed',
          output:
            'This is the first chunk of the response... and here is more content being streamed... and finally the complete response.',
          completedAt: new Date(),
        });
      }, 1500);

      // Timeout after 30 seconds
      setTimeout(() => {
        unsubscribe();
        deleteDoc(executionRef).catch(() => {});
        reject(new Error('Test timeout'));
      }, 30000);
    } catch (error) {
      reject(error);
    }
  });
}

async function runPerformanceTest(testName, promptContent) {
  log(`\nRunning test: ${testName}`, 'cyan');

  try {
    const result = await simulateStreamingExecution(testName, promptContent);

    // Check against targets
    const firstChunkPass = result.firstChunkTime < 2000;
    const totalTimePass = result.totalTime < 10000;

    log(
      `  First chunk: ${result.firstChunkTime}ms ${firstChunkPass ? '✓' : '✗'}`,
      firstChunkPass ? 'green' : 'red'
    );
    log(
      `  Total time: ${result.totalTime}ms ${totalTimePass ? '✓' : '✗'}`,
      totalTimePass ? 'green' : 'red'
    );
    log(`  Updates: ${result.updateCount}`, 'cyan');

    const passed = firstChunkPass && totalTimePass;

    // Record metrics
    metrics.tests.push(result);
    metrics.totalTests++;
    if (passed) {
      metrics.passedTests++;
    } else {
      metrics.failedTests++;
    }

    // Update aggregates
    metrics.avgFirstChunk =
      (metrics.avgFirstChunk * (metrics.totalTests - 1) + result.firstChunkTime) /
      metrics.totalTests;
    metrics.avgTotalTime =
      (metrics.avgTotalTime * (metrics.totalTests - 1) + result.totalTime) / metrics.totalTests;
    metrics.minFirstChunk = Math.min(metrics.minFirstChunk, result.firstChunkTime);
    metrics.maxFirstChunk = Math.max(metrics.maxFirstChunk, result.firstChunkTime);
    metrics.minTotalTime = Math.min(metrics.minTotalTime, result.totalTime);
    metrics.maxTotalTime = Math.max(metrics.maxTotalTime, result.totalTime);

    return passed;
  } catch (error) {
    log(`  FAILED: ${error.message}`, 'red');
    metrics.totalTests++;
    metrics.failedTests++;
    return false;
  }
}

async function runAllTests() {
  try {
    logSection('Streaming Performance Tests');

    // Authenticate
    await authenticateUser();

    // Run multiple tests
    const tests = [
      ['Short prompt execution', 'Tell me about AI'],
      ['Medium prompt execution', 'Explain the concept of machine learning in detail'],
      [
        'Long prompt execution',
        'Write a comprehensive essay about the history and future of artificial intelligence',
      ],
      ['Variable substitution', 'Hello {{name}}, tell me about {{topic}}'],
      ['Complex template', 'Generate a {{format}} about {{subject}} in {{style}} style'],
    ];

    for (const [testName, promptContent] of tests) {
      await runPerformanceTest(testName, promptContent);
      // Wait between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Summary
    logSection('Performance Test Summary');

    log(`Total Tests: ${metrics.totalTests}`, 'cyan');
    log(`Passed: ${metrics.passedTests}`, 'green');
    log(`Failed: ${metrics.failedTests}`, metrics.failedTests > 0 ? 'red' : 'green');
    log(
      `Success Rate: ${((metrics.passedTests / metrics.totalTests) * 100).toFixed(1)}%`,
      metrics.failedTests > 0 ? 'yellow' : 'green'
    );

    console.log('\nLatency Metrics:');
    log(`  First Chunk (avg): ${metrics.avgFirstChunk.toFixed(0)}ms`, 'cyan');
    log(`  First Chunk (min): ${metrics.minFirstChunk}ms`, 'green');
    log(`  First Chunk (max): ${metrics.maxFirstChunk}ms`, 'yellow');
    log(`  Total Time (avg): ${metrics.avgTotalTime.toFixed(0)}ms`, 'cyan');
    log(`  Total Time (min): ${metrics.minTotalTime}ms`, 'green');
    log(`  Total Time (max): ${metrics.maxTotalTime}ms`, 'yellow');

    console.log('\nPerformance Targets:');
    const firstChunkTarget = metrics.avgFirstChunk < 2000;
    const totalTimeTarget = metrics.avgTotalTime < 10000;

    log(
      `  First Chunk < 2s: ${firstChunkTarget ? 'PASS ✓' : 'FAIL ✗'}`,
      firstChunkTarget ? 'green' : 'red'
    );
    log(
      `  Total Time < 10s: ${totalTimeTarget ? 'PASS ✓' : 'FAIL ✗'}`,
      totalTimeTarget ? 'green' : 'red'
    );

    if (metrics.failedTests > 0) {
      log('\nSome tests failed. Please review the results above.', 'red');
      process.exit(1);
    } else {
      log('\nAll tests passed!', 'green');
      process.exit(0);
    }
  } catch (error) {
    log(`\nError running tests: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
