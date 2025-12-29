#!/usr/bin/env node

/**
 * Firestore Security Rules Testing Script
 * 
 * Tests Firestore security rules with emulator to verify:
 * - Authentication requirements
 * - Ownership checks
 * - Field validation
 * - Permission enforcement
 */

const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

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

let testEnv;
const PROJECT_ID = 'demo-test';

async function setupTestEnvironment() {
  logSection('Setting up Test Environment');
  
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');
  
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: rules,
      host: 'localhost',
      port: 8080,
    },
  });
  
  log('Test environment initialized', 'green');
}

async function testPromptRules() {
  logSection('Testing Prompt Collection Rules');
  
  const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
  const bob = testEnv.authenticatedContext('bob', { email: 'bob@example.com' });
  const unauthed = testEnv.unauthenticatedContext();
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Unauthenticated users cannot read prompts
  try {
    await assertFails(unauthed.firestore().collection('prompts').doc('test').get());
    log('  PASS: Unauthenticated users cannot read prompts', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Unauthenticated users can read prompts', 'red');
    failed++;
  }
  
  // Test 2: Authenticated users can create prompts
  try {
    await assertSucceeds(
      alice.firestore().collection('prompts').add({
        title: 'Test Prompt',
        content: 'Test content',
        userId: 'alice',
        createdBy: 'alice',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      })
    );
    log('  PASS: Authenticated users can create prompts', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Authenticated users cannot create prompts', 'red');
    failed++;
  }
  
  // Test 3: Users can read their own prompts
  try {
    const promptRef = alice.firestore().collection('prompts').doc('alice-prompt');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('prompts').doc('alice-prompt').set({
        title: 'Alice Prompt',
        content: 'Alice content',
        userId: 'alice',
        createdBy: 'alice',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });
    });
    
    await assertSucceeds(promptRef.get());
    log('  PASS: Users can read their own prompts', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users cannot read their own prompts', 'red');
    failed++;
  }
  
  // Test 4: Users can update their own prompts
  try {
    await assertSucceeds(
      alice.firestore().collection('prompts').doc('alice-prompt').update({
        title: 'Updated Title',
        updatedAt: new Date(),
      })
    );
    log('  PASS: Users can update their own prompts', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users cannot update their own prompts', 'red');
    failed++;
  }
  
  // Test 5: Users cannot update other users' prompts
  try {
    await assertFails(
      bob.firestore().collection('prompts').doc('alice-prompt').update({
        title: 'Bob trying to update',
      })
    );
    log('  PASS: Users cannot update other users prompts', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users can update other users prompts', 'red');
    failed++;
  }
  
  // Test 6: Users can delete their own prompts
  try {
    await assertSucceeds(
      alice.firestore().collection('prompts').doc('alice-prompt').delete()
    );
    log('  PASS: Users can delete their own prompts', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users cannot delete their own prompts', 'red');
    failed++;
  }
  
  return { passed, failed };
}

async function testDocumentRules() {
  logSection('Testing RAG Documents Collection Rules');
  
  const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
  const bob = testEnv.authenticatedContext('bob', { email: 'bob@example.com' });
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Users can upload documents
  try {
    await assertSucceeds(
      alice.firestore().collection('rag_documents').add({
        fileName: 'test.pdf',
        uploadedBy: 'alice',
        uploadedAt: new Date(),
        status: 'pending',
        fileSize: 1024,
      })
    );
    log('  PASS: Users can upload documents', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users cannot upload documents', 'red');
    failed++;
  }
  
  // Test 2: Users can read their own documents
  try {
    const docRef = alice.firestore().collection('rag_documents').doc('alice-doc');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('rag_documents').doc('alice-doc').set({
        fileName: 'alice.pdf',
        uploadedBy: 'alice',
        uploadedAt: new Date(),
        status: 'processed',
      });
    });
    
    await assertSucceeds(docRef.get());
    log('  PASS: Users can read their own documents', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users cannot read their own documents', 'red');
    failed++;
  }
  
  // Test 3: Users cannot read other users' documents
  try {
    await assertFails(
      bob.firestore().collection('rag_documents').doc('alice-doc').get()
    );
    log('  PASS: Users cannot read other users documents', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users can read other users documents', 'red');
    failed++;
  }
  
  return { passed, failed };
}

async function testExecutionRules() {
  logSection('Testing Executions Collection Rules');
  
  const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Users can create executions
  try {
    await assertSucceeds(
      alice.firestore().collection('executions').add({
        promptId: 'test-prompt',
        userId: 'alice',
        timestamp: new Date(),
        status: 'pending',
      })
    );
    log('  PASS: Users can create executions', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users cannot create executions', 'red');
    failed++;
  }
  
  // Test 2: Users can read their own executions
  try {
    const execRef = alice.firestore().collection('executions').doc('alice-exec');
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('executions').doc('alice-exec').set({
        promptId: 'test-prompt',
        userId: 'alice',
        timestamp: new Date(),
        status: 'completed',
      });
    });
    
    await assertSucceeds(execRef.get());
    log('  PASS: Users can read their own executions', 'green');
    passed++;
  } catch (error) {
    log('  FAIL: Users cannot read their own executions', 'red');
    failed++;
  }
  
  return { passed, failed };
}

async function runAllTests() {
  try {
    await setupTestEnvironment();
    
    const results = {
      prompts: await testPromptRules(),
      documents: await testDocumentRules(),
      executions: await testExecutionRules(),
    };
    
    // Summary
    logSection('Test Summary');
    
    const totalPassed = results.prompts.passed + results.documents.passed + results.executions.passed;
    const totalFailed = results.prompts.failed + results.documents.failed + results.executions.failed;
    const total = totalPassed + totalFailed;
    
    log(`Total Tests: ${total}`, 'cyan');
    log(`Passed: ${totalPassed}`, 'green');
    log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
    log(`Success Rate: ${((totalPassed / total) * 100).toFixed(1)}%`, totalFailed > 0 ? 'yellow' : 'green');
    
    // Cleanup
    await testEnv.cleanup();
    
    if (totalFailed > 0) {
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

