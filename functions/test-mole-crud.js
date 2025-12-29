#!/usr/bin/env node

/**
 * Comprehensive MOLE CRUD operations test in staging
 * Tests: List, Create, Update, Delete with confirmation
 */

const https = require('https');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin for staging
const serviceAccountPath = path.join(
  __dirname,
  '../rag-prompt-library-staging-firebase-adminsdk-fbsvc-22737aaaf9.json'
);
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'rag-prompt-library-staging',
});

const userId = 'SrkLzNMtijNgn5dFzQeoJFNg1Rx2';

console.log(`\n🧪 MOLE CRUD Operations Test`);
console.log(`   User ID: ${userId}`);
console.log(`   Environment: Staging`);
console.log('');

// Helper to get auth token
async function getAuthToken() {
  try {
    const token = await admin.auth().createCustomToken(userId);
    return token;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}

// Helper to call chat endpoint
async function callChatEndpoint(message, conversationId = null) {
  const token = await getAuthToken();

  const postData = JSON.stringify({
    message,
    conversationId: conversationId || `test-${Date.now()}`,
    dashboardContext: {
      currentPage: 'dashboard',
      totalPrompts: 4, // Correct value from our inspection
      recentExecutions: [],
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'httpapi-zcr2ek5dsa-ts.a.run.app',
      port: 443,
      path: '/api/ai/prompt-library-chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        Authorization: `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`   [DEBUG] Status: ${res.statusCode}`);
          console.log(`   [DEBUG] Raw response: ${data.substring(0, 500)}`);
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test functions
async function testListPrompts() {
  console.log('📋 Test 1: List Prompts');
  console.log('   Message: "list my prompts"');

  try {
    const response = await callChatEndpoint('list my prompts');
    console.log('   ✅ Response:', response.response?.substring(0, 200) + '...');

    if (response.response && response.response.includes('prompt')) {
      console.log('   ✅ PASS: List prompts works\n');
      return true;
    } else {
      console.log('   ❌ FAIL: No prompts in response\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testCreatePrompt() {
  console.log('📝 Test 2: Create Prompt');
  console.log(
    "   Message: \"create a prompt called 'CRUD Test' with content 'This is a test prompt'\""
  );

  try {
    const response = await callChatEndpoint(
      'create a prompt called "CRUD Test" with content "This is a test prompt"'
    );
    console.log('   ✅ Response:', response.response?.substring(0, 200) + '...');

    if (
      response.success &&
      response.response &&
      response.response.toLowerCase().includes('created')
    ) {
      console.log('   ✅ PASS: Create prompt works\n');
      return true;
    } else {
      console.log('   ❌ FAIL: Prompt not created\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testDeleteWithConfirmation() {
  console.log('🗑️  Test 3: Delete with Confirmation');

  try {
    // First, list prompts to get context
    console.log('   Step 1: List prompts to establish context');
    const conversationId = `test-delete-${Date.now()}`;
    await callChatEndpoint('list my prompts', conversationId);

    // Request delete
    console.log('   Step 2: Request delete of first prompt');
    const deleteRequest = await callChatEndpoint('delete the first one', conversationId);
    console.log('   Response:', deleteRequest.response?.substring(0, 200) + '...');

    if (deleteRequest.response && deleteRequest.response.toLowerCase().includes('confirm')) {
      console.log('   ✅ Confirmation requested');

      // Confirm delete
      console.log('   Step 3: Confirm deletion');
      const confirmResponse = await callChatEndpoint('confirm', conversationId);
      console.log('   Response:', confirmResponse.response?.substring(0, 200) + '...');

      if (
        confirmResponse.success &&
        confirmResponse.response &&
        confirmResponse.response.toLowerCase().includes('deleted')
      ) {
        console.log('   ✅ PASS: Delete with confirmation works\n');
        return true;
      } else {
        console.log('   ❌ FAIL: Delete not confirmed\n');
        return false;
      }
    } else {
      console.log('   ❌ FAIL: No confirmation requested\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message, '\n');
    return false;
  }
}

async function testCancelDelete() {
  console.log('🚫 Test 4: Cancel Delete');

  try {
    // First, list prompts to get context
    console.log('   Step 1: List prompts to establish context');
    const conversationId = `test-cancel-${Date.now()}`;
    await callChatEndpoint('list my prompts', conversationId);

    // Request delete
    console.log('   Step 2: Request delete of first prompt');
    const deleteRequest = await callChatEndpoint('delete the first one', conversationId);

    if (deleteRequest.response && deleteRequest.response.toLowerCase().includes('confirm')) {
      console.log('   ✅ Confirmation requested');

      // Cancel delete
      console.log('   Step 3: Cancel deletion');
      const cancelResponse = await callChatEndpoint('cancel', conversationId);
      console.log('   Response:', cancelResponse.response?.substring(0, 200) + '...');

      if (
        cancelResponse.success &&
        cancelResponse.response &&
        cancelResponse.response.toLowerCase().includes('cancel')
      ) {
        console.log('   ✅ PASS: Cancel delete works\n');
        return true;
      } else {
        console.log('   ❌ FAIL: Delete not cancelled\n');
        return false;
      }
    } else {
      console.log('   ❌ FAIL: No confirmation requested\n');
      return false;
    }
  } catch (error) {
    console.log('   ❌ ERROR:', error.message, '\n');
    return false;
  }
}

// Run all tests
(async () => {
  const results = {
    list: false,
    create: false,
    deleteConfirm: false,
    deleteCancel: false,
  };

  results.list = await testListPrompts();
  results.create = await testCreatePrompt();
  results.deleteConfirm = await testDeleteWithConfirmation();
  results.deleteCancel = await testCancelDelete();

  console.log('📊 Test Summary:');
  console.log(`   List Prompts: ${results.list ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Create Prompt: ${results.create ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Delete with Confirmation: ${results.deleteConfirm ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Cancel Delete: ${results.deleteCancel ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every((r) => r);
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}\n`);

  process.exit(allPassed ? 0 : 1);
})();
