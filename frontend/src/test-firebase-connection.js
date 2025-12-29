// Test Firebase connection and authentication
import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

// Test Firebase connection
export const testFirebaseConnection = async () => {
  console.log('🔍 Testing Firebase connection...');
  
  try {
    // Test authentication state
    console.log('👤 Current auth state:', auth.currentUser);
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ User is authenticated:', {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
        
        // Test Firestore connection
        testFirestoreConnection(user.uid);
      } else {
        console.log('❌ User is not authenticated');
      }
    });
    
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
  }
};

// Test Firestore connection
export const testFirestoreConnection = async (userId) => {
  console.log('🔍 Testing Firestore connection for user:', userId);
  
  try {
    // Test reading from Firestore
    const promptsRef = collection(db, 'users', userId, 'prompts');
    console.log('📁 Collection reference created:', promptsRef.path);
    
    const querySnapshot = await getDocs(promptsRef);
    console.log('📊 Existing prompts count:', querySnapshot.size);
    
    querySnapshot.forEach((doc) => {
      console.log('📝 Existing prompt:', doc.id, doc.data());
    });
    
    // Test writing to Firestore
    const testPrompt = {
      title: 'Test Prompt - ' + new Date().toISOString(),
      content: 'This is a test prompt to verify Firebase connectivity.',
      description: 'Test prompt for debugging',
      category: 'General',
      tags: ['test', 'debug'],
      isPublic: false,
      variables: [],
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1
    };
    
    console.log('💾 Attempting to save test prompt:', testPrompt);
    const docRef = await addDoc(promptsRef, testPrompt);
    console.log('✅ Test prompt saved successfully with ID:', docRef.id);
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Firestore connection test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Run the test when this module is imported
if (typeof window !== 'undefined') {
  window.testFirebaseConnection = testFirebaseConnection;
  window.testFirestoreConnection = testFirestoreConnection;
  console.log('🧪 Firebase test functions available on window object');
}
