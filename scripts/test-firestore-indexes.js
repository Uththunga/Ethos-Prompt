#!/usr/bin/env node

/**
 * Firestore Index Testing Script
 * 
 * Tests that all required composite indexes are properly configured:
 * - Prompts collection queries
 * - Documents collection queries
 * - Executions collection queries
 * - Analytics collection queries
 * - No missing index errors
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

// Test results
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: [],
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

async function testQuery(testName, queryFn) {
  log(`\nTesting: ${testName}`, 'cyan');
  results.total++;
  
  try {
    const startTime = Date.now();
    const snapshot = await getDocs(queryFn());
    const duration = Date.now() - startTime;
    
    log(`  ✓ Query succeeded`, 'green');
    log(`  Documents: ${snapshot.size}`, 'cyan');
    log(`  Duration: ${duration}ms`, 'cyan');
    
    results.passed++;
    results.tests.push({
      name: testName,
      status: 'passed',
      duration,
      docCount: snapshot.size,
    });
    
    return true;
  } catch (error) {
    log(`  ✗ Query failed: ${error.message}`, 'red');
    
    if (error.message.includes('index')) {
      log(`  Missing index detected!`, 'red');
    }
    
    results.failed++;
    results.tests.push({
      name: testName,
      status: 'failed',
      error: error.message,
    });
    
    return false;
  }
}

async function createTestData(user) {
  logSection('Creating Test Data');
  
  const testDocs = [];
  
  try {
    // Create test prompts
    log('Creating test prompts...', 'cyan');
    for (let i = 0; i < 3; i++) {
      const promptRef = await addDoc(collection(db, 'prompts'), {
        userId: user.uid,
        title: `Test Prompt ${i}`,
        content: `Test content ${i}`,
        category: i % 2 === 0 ? 'General' : 'Technical',
        tags: [`tag${i}`, 'test'],
        isPublic: i === 0,
        createdAt: new Date(Date.now() - i * 1000000),
        updatedAt: new Date(),
        isDeleted: false,
      });
      testDocs.push(promptRef);
    }
    
    // Create test executions
    log('Creating test executions...', 'cyan');
    for (let i = 0; i < 3; i++) {
      const execRef = await addDoc(collection(db, 'executions'), {
        userId: user.uid,
        promptId: 'test-prompt',
        status: i === 0 ? 'completed' : 'pending',
        timestamp: new Date(Date.now() - i * 1000000),
        createdAt: new Date(Date.now() - i * 1000000),
      });
      testDocs.push(execRef);
    }
    
    // Create test documents
    log('Creating test RAG documents...', 'cyan');
    for (let i = 0; i < 3; i++) {
      const docRef = await addDoc(collection(db, 'rag_documents'), {
        uploadedBy: user.uid,
        fileName: `test-doc-${i}.pdf`,
        status: i === 0 ? 'processed' : 'pending',
        uploadedAt: new Date(Date.now() - i * 1000000),
        fileSize: 1024 * (i + 1),
      });
      testDocs.push(docRef);
    }
    
    // Create test execution ratings
    log('Creating test execution ratings...', 'cyan');
    for (let i = 0; i < 3; i++) {
      const ratingRef = await addDoc(collection(db, 'execution_ratings'), {
        userId: user.uid,
        executionId: `exec-${i}`,
        rating: (i % 5) + 1,
        timestamp: new Date(Date.now() - i * 1000000),
      });
      testDocs.push(ratingRef);
    }
    
    log(`Created ${testDocs.length} test documents`, 'green');
    return testDocs;
  } catch (error) {
    log(`Error creating test data: ${error.message}`, 'red');
    throw error;
  }
}

async function cleanupTestData(testDocs) {
  logSection('Cleaning Up Test Data');
  
  try {
    for (const docRef of testDocs) {
      await deleteDoc(docRef);
    }
    log(`Deleted ${testDocs.length} test documents`, 'green');
  } catch (error) {
    log(`Error cleaning up: ${error.message}`, 'yellow');
  }
}

async function runIndexTests(user) {
  logSection('Running Index Tests');
  
  // Test 1: Prompts - userId + createdAt (descending)
  await testQuery(
    'Prompts: userId + createdAt DESC',
    () => query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
  );
  
  // Test 2: Prompts - userId + isDeleted + createdAt
  await testQuery(
    'Prompts: userId + isDeleted + createdAt DESC',
    () => query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
  );
  
  // Test 3: Prompts - userId + category + createdAt
  await testQuery(
    'Prompts: userId + category + createdAt DESC',
    () => query(
      collection(db, 'prompts'),
      where('userId', '==', user.uid),
      where('category', '==', 'General'),
      orderBy('createdAt', 'desc'),
      limit(10)
    )
  );
  
  // Test 4: Executions - userId + timestamp
  await testQuery(
    'Executions: userId + timestamp DESC',
    () => query(
      collection(db, 'executions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    )
  );
  
  // Test 5: Executions - userId + status + timestamp
  await testQuery(
    'Executions: userId + status + timestamp DESC',
    () => query(
      collection(db, 'executions'),
      where('userId', '==', user.uid),
      where('status', '==', 'completed'),
      orderBy('timestamp', 'desc'),
      limit(10)
    )
  );
  
  // Test 6: RAG Documents - uploadedBy + uploadedAt
  await testQuery(
    'RAG Documents: uploadedBy + uploadedAt DESC',
    () => query(
      collection(db, 'rag_documents'),
      where('uploadedBy', '==', user.uid),
      orderBy('uploadedAt', 'desc'),
      limit(10)
    )
  );
  
  // Test 7: RAG Documents - uploadedBy + status + uploadedAt
  await testQuery(
    'RAG Documents: uploadedBy + status + uploadedAt DESC',
    () => query(
      collection(db, 'rag_documents'),
      where('uploadedBy', '==', user.uid),
      where('status', '==', 'processed'),
      orderBy('uploadedAt', 'desc'),
      limit(10)
    )
  );
  
  // Test 8: Execution Ratings - userId + timestamp
  await testQuery(
    'Execution Ratings: userId + timestamp DESC',
    () => query(
      collection(db, 'execution_ratings'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    )
  );
}

async function runAllTests() {
  try {
    logSection('Firestore Index Tests');
    
    // Authenticate
    const user = await authenticateUser();
    
    // Create test data
    const testDocs = await createTestData(user);
    
    // Wait for data to be indexed
    log('\nWaiting for data to be indexed...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run index tests
    await runIndexTests(user);
    
    // Cleanup
    await cleanupTestData(testDocs);
    
    // Summary
    logSection('Test Summary');
    
    log(`Total Tests: ${results.total}`, 'cyan');
    log(`Passed: ${results.passed}`, 'green');
    log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, results.failed > 0 ? 'yellow' : 'green');
    
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      results.tests
        .filter(t => t.status === 'failed')
        .forEach(t => {
          log(`  - ${t.name}`, 'red');
          log(`    Error: ${t.error}`, 'red');
        });
      
      log('\nSome tests failed. Missing indexes detected!', 'red');
      log('Run: firebase deploy --only firestore:indexes', 'yellow');
      process.exit(1);
    } else {
      log('\nAll index tests passed!', 'green');
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

