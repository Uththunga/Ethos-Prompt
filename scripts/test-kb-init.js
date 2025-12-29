/**
 * Test script to trigger Marketing KB initialization
 * Simpler version that uses Firebase SDK directly
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase config for staging
const firebaseConfig = {
  apiKey: "AIzaSyDCPBPPPPPPPPPPPPPPPPPPPPPPPPPPPPP",  // Replace with actual
  authDomain: "rag-prompt-library-staging.firebaseapp.com",
  projectId: "rag-prompt-library-staging",
  storageBucket: "rag-prompt-library-staging.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'australia-southeast1');
const auth = getAuth(app);

async function testKBInit() {
  try {
    console.log('Authenticating...');
    
    // Sign in (use test credentials or skip if function allows unauthenticated)
    // await signInWithEmailAndPassword(auth, 'test@example.com', 'password');
    
    console.log('Calling initialize_marketing_kb_function...');
    
    const initKB = httpsCallable(functions, 'initialize_marketing_kb_function');
    const result = await initKB({ force_reindex: false });
    
    console.log('Success!');
    console.log(JSON.stringify(result.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.code, error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
  }
}

testKBInit();

