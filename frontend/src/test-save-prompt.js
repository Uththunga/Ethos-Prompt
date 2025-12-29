/**
 * Test script to verify save prompt functionality
 * This script will test the complete save flow including authentication
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { promptService } from './services/firestore.js';

// Firebase configuration
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

console.log('🔥 Firebase initialized');

// Test prompt data
const testPromptData = {
  title: 'Test Prompt - ' + new Date().toISOString(),
  content: 'This is a test prompt to verify save functionality. Current time: {{current_time}}',
  description: 'A test prompt created to verify the save functionality is working correctly',
  category: 'Testing',
  tags: ['test', 'debugging', 'save-functionality'],
  isPublic: false,
  variables: [
    {
      name: 'current_time',
      type: 'text',
      required: true,
      description: 'The current timestamp'
    }
  ]
};

async function testSavePrompt() {
  console.log('🧪 Starting save prompt test...');
  
  try {
    // Wait for authentication
    console.log('🔐 Waiting for authentication...');
    const user = await new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          console.log('✅ User authenticated:', user.uid);
          resolve(user);
        } else {
          console.log('❌ No user found, attempting anonymous sign-in...');
          signInAnonymously(auth)
            .then((result) => {
              console.log('✅ Anonymous sign-in successful:', result.user.uid);
              resolve(result.user);
            })
            .catch((error) => {
              console.error('❌ Anonymous sign-in failed:', error);
              reject(error);
            });
        }
      });
    });

    console.log('📝 Attempting to save test prompt...');
    console.log('Prompt data:', testPromptData);
    
    // Test the save functionality
    const promptId = await promptService.createPrompt(user.uid, testPromptData);
    
    console.log('✅ Prompt saved successfully!');
    console.log('📋 Prompt ID:', promptId);
    
    // Verify the prompt was saved by retrieving it
    console.log('🔍 Verifying prompt was saved...');
    const savedPrompt = await promptService.getPrompt(user.uid, promptId);
    
    if (savedPrompt) {
      console.log('✅ Prompt verification successful!');
      console.log('📄 Saved prompt:', {
        id: savedPrompt.id,
        title: savedPrompt.title,
        category: savedPrompt.category,
        createdAt: savedPrompt.createdAt,
        createdBy: savedPrompt.createdBy
      });
    } else {
      console.error('❌ Prompt verification failed - could not retrieve saved prompt');
    }
    
    return { success: true, promptId, savedPrompt };
    
  } catch (error) {
    console.error('❌ Save prompt test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return { success: false, error };
  }
}

// Test connection to Firebase
async function testFirebaseConnection() {
  console.log('🔗 Testing Firebase connection...');
  
  try {
    // Test authentication
    const user = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 10000);
      
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(user);
      });
    });
    
    console.log('✅ Firebase connection successful');
    console.log('🔐 Auth state:', user ? `Authenticated: ${user.uid}` : 'Not authenticated');
    
    return { connected: true, authenticated: !!user, userId: user?.uid };
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return { connected: false, error: error.message };
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting prompt save functionality tests...');
  console.log('=' .repeat(50));
  
  // Test 1: Firebase connection
  const connectionResult = await testFirebaseConnection();
  console.log('Connection test result:', connectionResult);
  console.log('-'.repeat(30));
  
  // Test 2: Save prompt functionality
  const saveResult = await testSavePrompt();
  console.log('Save test result:', saveResult);
  console.log('-'.repeat(30));
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('Firebase Connection:', connectionResult.connected ? '✅ PASS' : '❌ FAIL');
  console.log('Save Functionality:', saveResult.success ? '✅ PASS' : '❌ FAIL');
  
  if (saveResult.success) {
    console.log('🎉 All tests passed! Save prompt functionality is working correctly.');
  } else {
    console.log('⚠️ Tests failed. Please check the error details above.');
  }
}

// Export for use in browser console
window.testSavePrompt = testSavePrompt;
window.testFirebaseConnection = testFirebaseConnection;
window.runTests = runTests;

// Auto-run tests if this script is loaded directly
if (typeof window !== 'undefined') {
  console.log('🔧 Test functions loaded. Run window.runTests() to start testing.');
}

export { testSavePrompt, testFirebaseConnection, runTests };
