#!/usr/bin/env node

/**
 * Firebase Setup Verification Script
 * Verifies that Firebase is properly configured and all services are accessible
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics, logEvent } from 'firebase/analytics';

// Firebase configuration (same as your app)
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

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function verifyFirebaseSetup() {
  log('\n🚀 Firebase Setup Verification', 'bold');
  log('================================', 'blue');

  let allTestsPassed = true;

  // Test 1: Firebase App Initialization
  try {
    logInfo('Testing Firebase App initialization...');
    if (app && app.options) {
      logSuccess('Firebase App initialized successfully');
      logInfo(`Project ID: ${app.options.projectId}`);
      logInfo(`App ID: ${app.options.appId}`);
    } else {
      throw new Error('Firebase app not properly initialized');
    }
  } catch (error) {
    logError(`Firebase App initialization failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 2: Authentication
  try {
    logInfo('Testing Firebase Authentication...');
    const userCredential = await signInAnonymously(auth);
    if (userCredential.user) {
      logSuccess('Firebase Authentication working');
      logInfo(`User ID: ${userCredential.user.uid}`);
    }
  } catch (error) {
    logError(`Firebase Authentication failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 3: Firestore
  try {
    logInfo('Testing Firestore database...');
    const testDoc = doc(db, 'test', 'verification');
    const testData = {
      message: 'Firebase verification test',
      timestamp: new Date(),
      success: true
    };
    
    await setDoc(testDoc, testData);
    const docSnap = await getDoc(testDoc);
    
    if (docSnap.exists() && docSnap.data().success) {
      logSuccess('Firestore read/write working');
      await deleteDoc(testDoc); // Clean up
      logInfo('Test document cleaned up');
    } else {
      throw new Error('Failed to read test document');
    }
  } catch (error) {
    logError(`Firestore test failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 4: Cloud Storage
  try {
    logInfo('Testing Cloud Storage...');
    const testFile = new Blob(['Firebase storage test'], { type: 'text/plain' });
    const storageRef = ref(storage, 'test/verification.txt');
    
    await uploadBytes(storageRef, testFile);
    const downloadURL = await getDownloadURL(storageRef);
    
    if (downloadURL) {
      logSuccess('Cloud Storage upload/download working');
      logInfo(`Test file URL: ${downloadURL.substring(0, 50)}...`);
      await deleteObject(storageRef); // Clean up
      logInfo('Test file cleaned up');
    }
  } catch (error) {
    logError(`Cloud Storage test failed: ${error.message}`);
    allTestsPassed = false;
  }

  // Test 5: Cloud Functions
  try {
    logInfo('Testing Cloud Functions...');
    const generatePrompt = httpsCallable(functions, 'generate_prompt');
    const result = await generatePrompt({
      purpose: 'test verification',
      industry: 'technology',
      useCase: 'firebase setup',
      complexity: 'simple'
    });
    
    if (result.data && result.data.generatedPrompt) {
      logSuccess('Cloud Functions working');
      logInfo('Prompt generation function responded successfully');
    } else {
      throw new Error('Function returned unexpected response');
    }
  } catch (error) {
    logWarning(`Cloud Functions test failed: ${error.message}`);
    logInfo('This might be expected if functions are not yet deployed');
  }

  // Test 6: Analytics (if available)
  if (analytics) {
    try {
      logInfo('Testing Firebase Analytics...');
      logEvent(analytics, 'firebase_verification', {
        test_type: 'setup_verification',
        timestamp: new Date().toISOString()
      });
      logSuccess('Firebase Analytics working');
    } catch (error) {
      logWarning(`Analytics test failed: ${error.message}`);
    }
  } else {
    logInfo('Analytics not available (likely running in Node.js environment)');
  }

  // Summary
  log('\n📊 Verification Summary', 'bold');
  log('=====================', 'blue');
  
  if (allTestsPassed) {
    logSuccess('All critical Firebase services are working correctly! 🎉');
    log('\n🚀 Your Firebase setup is ready for production!', 'green');
  } else {
    logError('Some Firebase services failed verification');
    log('\n🔧 Please check the errors above and fix the configuration', 'yellow');
  }

  // Configuration Info
  log('\n⚙️  Configuration Details', 'bold');
  log('========================', 'blue');
  logInfo(`Project ID: ${firebaseConfig.projectId}`);
  logInfo(`Auth Domain: ${firebaseConfig.authDomain}`);
  logInfo(`Storage Bucket: ${firebaseConfig.storageBucket}`);
  logInfo(`Functions Region: us-central1 (default)`);
  
  return allTestsPassed;
}

// Run verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyFirebaseSetup()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      logError(`Verification script failed: ${error.message}`);
      process.exit(1);
    });
}

export { verifyFirebaseSetup };
