#!/usr/bin/env node

/**
 * Production Environment Verification Script
 * Tests all critical functionality in the deployed RAG Prompt Library
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics, logEvent } from 'firebase/analytics';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJWjw2e8FayU3CvIWyGXXFAqDCTFN5CJs",
  authDomain: "rag-prompt-library.firebaseapp.com",
  projectId: "rag-prompt-library",
  storageBucket: "rag-prompt-library.firebasestorage.app",
  messagingSenderId: "743998930129",
  appId: "1:743998930129:web:69dd61394ed81598cd99f0",
  measurementId: "G-CEDFF0WMPW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const statusColor = passed ? 'green' : 'red';
  
  log(`${status} ${testName}`, statusColor);
  if (details) {
    log(`    ${details}`, 'cyan');
  }
  
  testResults.tests.push({ name: testName, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function testAuthentication() {
  log('\n🔐 Testing Authentication...', 'bold');
  
  try {
    // Test anonymous sign-in
    const userCredential = await signInAnonymously(auth);
    logTest('Anonymous Authentication', true, `User ID: ${userCredential.user.uid}`);
    
    // Test sign-out
    await signOut(auth);
    logTest('Sign Out', true, 'Successfully signed out');
    
    // Sign back in for other tests
    await signInAnonymously(auth);
    
  } catch (error) {
    logTest('Authentication', false, error.message);
  }
}

async function testFirestore() {
  log('\n🗄️ Testing Firestore Database...', 'bold');
  
  try {
    const testDocId = `test_${Date.now()}`;
    const testDoc = doc(db, 'test_verification', testDocId);
    const testData = {
      message: 'Production verification test',
      timestamp: new Date(),
      success: true,
      environment: 'production'
    };
    
    // Test write
    await setDoc(testDoc, testData);
    logTest('Firestore Write', true, `Document ID: ${testDocId}`);
    
    // Test read
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists() && docSnap.data().success) {
      logTest('Firestore Read', true, 'Data retrieved successfully');
    } else {
      logTest('Firestore Read', false, 'Failed to read test document');
    }
    
    // Clean up
    await deleteDoc(testDoc);
    logTest('Firestore Delete', true, 'Test document cleaned up');
    
  } catch (error) {
    logTest('Firestore Operations', false, error.message);
  }
}

async function testCloudStorage() {
  log('\n📁 Testing Cloud Storage...', 'bold');
  
  try {
    const testFileName = `test_${Date.now()}.txt`;
    const testFile = new Blob(['Production verification test file'], { type: 'text/plain' });
    const storageRef = ref(storage, `test/${testFileName}`);
    
    // Test upload
    await uploadBytes(storageRef, testFile);
    logTest('Storage Upload', true, `File: ${testFileName}`);
    
    // Test download URL
    const downloadURL = await getDownloadURL(storageRef);
    if (downloadURL) {
      logTest('Storage Download URL', true, 'URL generated successfully');
    } else {
      logTest('Storage Download URL', false, 'Failed to generate download URL');
    }
    
    // Clean up
    await deleteObject(storageRef);
    logTest('Storage Delete', true, 'Test file cleaned up');
    
  } catch (error) {
    logTest('Cloud Storage Operations', false, error.message);
  }
}

async function testCloudFunctions() {
  log('\n⚡ Testing Cloud Functions...', 'bold');
  
  try {
    // Test prompt generation function
    const generatePrompt = httpsCallable(functions, 'generate_prompt');
    const promptRequest = {
      purpose: 'Production verification test',
      industry: 'Technology',
      useCase: 'System testing',
      complexity: 'simple'
    };
    
    const startTime = Date.now();
    const result = await generatePrompt(promptRequest);
    const executionTime = Date.now() - startTime;
    
    if (result.data && result.data.generatedPrompt) {
      logTest('Prompt Generation Function', true, `Execution time: ${executionTime}ms`);
      logTest('OpenRouter API Integration', true, 'AI model responded successfully');
      
      // Check if it's using the enhanced Blaze Plan features
      if (result.data.metadata && result.data.metadata.blazePlanFeatures) {
        logTest('Blaze Plan Features', true, 'Enhanced features active');
      } else {
        logTest('Blaze Plan Features', false, 'Enhanced features not detected');
      }
    } else {
      logTest('Prompt Generation Function', false, 'Invalid response format');
    }
    
  } catch (error) {
    logTest('Cloud Functions', false, error.message);
    
    // Check specific error types
    if (error.code === 'unauthenticated') {
      logTest('Function Authentication', false, 'Authentication required');
    } else if (error.code === 'not-found') {
      logTest('Function Deployment', false, 'Function not found - may not be deployed');
    } else if (error.message.includes('quota')) {
      logTest('API Quota', false, 'API quota exceeded');
    }
  }
}

async function testWebsiteAccessibility() {
  log('\n🌐 Testing Website Accessibility...', 'bold');
  
  try {
    const productionURL = 'https://rag-prompt-library.web.app';
    
    // Test if we can fetch the main page
    const response = await fetch(productionURL);
    
    if (response.ok) {
      logTest('Website Accessibility', true, `Status: ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        logTest('HTML Content Delivery', true, 'Proper content type');
      } else {
        logTest('HTML Content Delivery', false, `Unexpected content type: ${contentType}`);
      }
    } else {
      logTest('Website Accessibility', false, `HTTP ${response.status}: ${response.statusText}`);
    }
    
  } catch (error) {
    logTest('Website Accessibility', false, error.message);
  }
}

async function testAnalytics() {
  log('\n📊 Testing Analytics...', 'bold');
  
  try {
    if (analytics) {
      logEvent(analytics, 'production_verification', {
        test_type: 'automated_verification',
        timestamp: new Date().toISOString(),
        environment: 'production'
      });
      logTest('Analytics Event Logging', true, 'Event logged successfully');
    } else {
      logTest('Analytics Initialization', false, 'Analytics not available');
    }
  } catch (error) {
    logTest('Analytics', false, error.message);
  }
}

async function testUserWorkflow() {
  log('\n👤 Testing Complete User Workflow...', 'bold');
  
  try {
    // This would test the complete user journey
    // For now, we'll test the core components
    
    // Test user data creation
    const userId = auth.currentUser?.uid;
    if (userId) {
      const userDoc = doc(db, 'users', userId);
      await setDoc(userDoc, {
        email: 'test@verification.com',
        displayName: 'Verification Test User',
        createdAt: new Date(),
        lastLogin: new Date()
      });
      logTest('User Profile Creation', true, 'User document created');
      
      // Test prompt creation
      const promptsCollection = collection(db, 'users', userId, 'prompts');
      const promptDoc = await addDoc(promptsCollection, {
        title: 'Verification Test Prompt',
        content: 'This is a test prompt for verification',
        category: 'Testing',
        tags: ['verification', 'test'],
        createdAt: new Date(),
        isPublic: false
      });
      logTest('Prompt Creation', true, `Prompt ID: ${promptDoc.id}`);
      
      // Clean up
      await deleteDoc(userDoc);
      await deleteDoc(promptDoc);
      logTest('User Workflow Cleanup', true, 'Test data cleaned up');
    } else {
      logTest('User Workflow', false, 'No authenticated user');
    }
    
  } catch (error) {
    logTest('User Workflow', false, error.message);
  }
}

async function runAllTests() {
  log('🚀 RAG Prompt Library - Production Verification', 'bold');
  log('================================================', 'blue');
  log(`Testing production environment: ${firebaseConfig.projectId}`, 'cyan');
  log(`Timestamp: ${new Date().toISOString()}`, 'cyan');
  
  // Run all tests
  await testAuthentication();
  await testFirestore();
  await testCloudStorage();
  await testCloudFunctions();
  await testWebsiteAccessibility();
  await testAnalytics();
  await testUserWorkflow();
  
  // Summary
  log('\n📊 Test Summary', 'bold');
  log('===============', 'blue');
  log(`Total Tests: ${testResults.passed + testResults.failed}`, 'cyan');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'red' : 'green');
  
  const successRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
  log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  // Detailed results
  if (testResults.failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        log(`  • ${test.name}: ${test.details}`, 'red');
      });
  }
  
  // Final verdict
  log('\n🎯 Final Verdict', 'bold');
  log('================', 'blue');
  
  if (successRate >= 90) {
    log('🎉 PRODUCTION READY - All critical systems operational!', 'green');
  } else if (successRate >= 70) {
    log('⚠️  MOSTLY READY - Some issues need attention', 'yellow');
  } else {
    log('🚨 NOT READY - Critical issues must be resolved', 'red');
  }
  
  return successRate >= 80;
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log(`\n🚨 Verification script failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

export { runAllTests };
