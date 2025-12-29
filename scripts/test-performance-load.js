#!/usr/bin/env node

/**
 * Performance and Load Testing Script
 * 
 * Tests:
 * - API response times
 * - Firestore query performance
 * - Concurrent request handling
 * - Read/write costs
 * - Latency under load
 */

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
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
const { connectFirestoreEmulator } = require('firebase/firestore');
const { connectAuthEmulator } = require('firebase/auth');

try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  log('Connected to Firebase emulators', 'green');
} catch (error) {
  log('Warning: Could not connect to emulators', 'yellow');
}

// Performance metrics
const metrics = {
  tests: [],
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  totalReads: 0,
  totalWrites: 0,
  avgLatency: 0,
  p95Latency: 0,
  p99Latency: 0,
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

async function testOperation(name, operation, target = 200) {
  log(`\nTesting: ${name}`, 'cyan');
  
  const startTime = Date.now();
  let success = false;
  let error = null;
  
  try {
    await operation();
    success = true;
  } catch (err) {
    error = err.message;
  }
  
  const latency = Date.now() - startTime;
  const passed = success && latency <= target;
  
  log(`  Latency: ${latency}ms (target: ${target}ms)`, passed ? 'green' : 'yellow');
  log(`  Status: ${success ? 'Success' : 'Failed'}`, success ? 'green' : 'red');
  if (error) {
    log(`  Error: ${error}`, 'red');
  }
  
  metrics.tests.push({
    name,
    latency,
    success,
    passed,
    error,
  });
  
  metrics.totalTests++;
  if (passed) metrics.passedTests++;
  else metrics.failedTests++;
  
  return { latency, success };
}

async function testConcurrentOperations(name, operations, target = 500) {
  log(`\nTesting: ${name}`, 'cyan');
  
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;
  
  try {
    const results = await Promise.allSettled(operations);
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        successCount++;
      } else {
        failCount++;
      }
    });
  } catch (error) {
    log(`  Error: ${error.message}`, 'red');
  }
  
  const latency = Date.now() - startTime;
  const passed = failCount === 0 && latency <= target;
  
  log(`  Total operations: ${operations.length}`, 'cyan');
  log(`  Successful: ${successCount}`, 'green');
  log(`  Failed: ${failCount}`, failCount > 0 ? 'red' : 'green');
  log(`  Total latency: ${latency}ms (target: ${target}ms)`, passed ? 'green' : 'yellow');
  log(`  Avg per operation: ${(latency / operations.length).toFixed(2)}ms`, 'cyan');
  
  metrics.tests.push({
    name,
    latency,
    success: failCount === 0,
    passed,
    operations: operations.length,
    successCount,
    failCount,
  });
  
  metrics.totalTests++;
  if (passed) metrics.passedTests++;
  else metrics.failedTests++;
  
  return { latency, successCount, failCount };
}

async function runPerformanceTests(user) {
  logSection('Performance Tests');
  
  // Test 1: Single document read
  await testOperation(
    'Single document read',
    async () => {
      const promptRef = doc(db, 'prompts', 'test-prompt-id');
      await getDoc(promptRef);
      metrics.totalReads++;
    },
    100
  );
  
  // Test 2: Query with filter
  await testOperation(
    'Query with filter (10 docs)',
    async () => {
      const q = query(
        collection(db, 'prompts'),
        where('userId', '==', user.uid),
        limit(10)
      );
      const snapshot = await getDocs(q);
      metrics.totalReads += snapshot.size;
    },
    150
  );
  
  // Test 3: Query with multiple filters and ordering
  await testOperation(
    'Complex query (userId + isDeleted + orderBy)',
    async () => {
      const q = query(
        collection(db, 'prompts'),
        where('userId', '==', user.uid),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      metrics.totalReads += snapshot.size;
    },
    200
  );
  
  // Test 4: Document write
  await testOperation(
    'Single document write',
    async () => {
      const docRef = await addDoc(collection(db, 'prompts'), {
        userId: user.uid,
        title: 'Performance Test Prompt',
        content: 'Test content',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });
      metrics.totalWrites++;
      await deleteDoc(docRef);
      metrics.totalWrites++;
    },
    150
  );
}

async function runLoadTests(user) {
  logSection('Load Tests');
  
  // Test 1: Concurrent reads (10 simultaneous)
  const readOperations = Array(10).fill(null).map(() => async () => {
    const q = query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid),
      limit(5)
    );
    const snapshot = await getDocs(q);
    metrics.totalReads += snapshot.size;
  });
  
  await testConcurrentOperations(
    'Concurrent reads (10 simultaneous)',
    readOperations.map(op => op()),
    500
  );
  
  // Test 2: Concurrent writes (5 simultaneous)
  const writeOperations = Array(5).fill(null).map((_, i) => async () => {
    const docRef = await addDoc(collection(db, 'prompts'), {
      userId: user.uid,
      title: `Load Test Prompt ${i}`,
      content: `Test content ${i}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
    });
    metrics.totalWrites++;
    // Clean up
    await deleteDoc(docRef);
    metrics.totalWrites++;
  });
  
  await testConcurrentOperations(
    'Concurrent writes (5 simultaneous)',
    writeOperations.map(op => op()),
    800
  );
  
  // Test 3: Mixed operations (reads + writes)
  const mixedOperations = [
    ...Array(5).fill(null).map(() => async () => {
      const q = query(collection(db, 'prompts'), where('userId', '==', user.uid), limit(3));
      const snapshot = await getDocs(q);
      metrics.totalReads += snapshot.size;
    }),
    ...Array(3).fill(null).map((_, i) => async () => {
      const docRef = await addDoc(collection(db, 'executions'), {
        userId: user.uid,
        promptId: 'test',
        status: 'completed',
        timestamp: new Date(),
      });
      metrics.totalWrites++;
      await deleteDoc(docRef);
      metrics.totalWrites++;
    }),
  ];
  
  await testConcurrentOperations(
    'Mixed operations (5 reads + 3 writes)',
    mixedOperations.map(op => op()),
    600
  );
}

function calculateStatistics() {
  const latencies = metrics.tests.map(t => t.latency).sort((a, b) => a - b);
  
  metrics.avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  metrics.p95Latency = latencies[Math.floor(latencies.length * 0.95)];
  metrics.p99Latency = latencies[Math.floor(latencies.length * 0.99)];
}

async function runAllTests() {
  try {
    logSection('Performance & Load Testing');
    
    // Authenticate
    const user = await authenticateUser();
    
    // Run performance tests
    await runPerformanceTests(user);
    
    // Run load tests
    await runLoadTests(user);
    
    // Calculate statistics
    calculateStatistics();
    
    // Summary
    logSection('Test Summary');
    
    log(`Total Tests: ${metrics.totalTests}`, 'cyan');
    log(`Passed: ${metrics.passedTests}`, 'green');
    log(`Failed: ${metrics.failedTests}`, metrics.failedTests > 0 ? 'red' : 'green');
    log(`Success Rate: ${((metrics.passedTests / metrics.totalTests) * 100).toFixed(1)}%`, metrics.failedTests > 0 ? 'yellow' : 'green');
    
    console.log('\nLatency Metrics:');
    log(`  Average: ${metrics.avgLatency.toFixed(2)}ms`, 'cyan');
    log(`  P95: ${metrics.p95Latency}ms`, 'cyan');
    log(`  P99: ${metrics.p99Latency}ms`, 'cyan');
    
    console.log('\nFirestore Operations:');
    log(`  Total Reads: ${metrics.totalReads}`, 'cyan');
    log(`  Total Writes: ${metrics.totalWrites}`, 'cyan');
    log(`  Total Operations: ${metrics.totalReads + metrics.totalWrites}`, 'cyan');
    
    console.log('\nPerformance Targets:');
    const avgTarget = metrics.avgLatency < 200;
    const p95Target = metrics.p95Latency < 500;
    
    log(`  Average < 200ms: ${avgTarget ? 'PASS ✓' : 'FAIL ✗'}`, avgTarget ? 'green' : 'red');
    log(`  P95 < 500ms: ${p95Target ? 'PASS ✓' : 'FAIL ✗'}`, p95Target ? 'green' : 'red');
    
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

