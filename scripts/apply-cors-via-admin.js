#!/usr/bin/env node

/**
 * Apply CORS configuration to Firebase Storage using Admin SDK
 * This is an alternative to using gsutil
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'rag-prompt-library',
    storageBucket: 'rag-prompt-library.appspot.com'
  });
}

async function applyCorsConfiguration() {
  try {
    console.log('🔧 Applying CORS configuration to Firebase Storage...');

    // Read CORS configuration
    const corsPath = path.join(process.cwd(), 'cors.json');
    if (!fs.existsSync(corsPath)) {
      throw new Error('cors.json file not found');
    }

    const corsConfig = JSON.parse(fs.readFileSync(corsPath, 'utf8'));
    console.log('📄 CORS configuration loaded:', JSON.stringify(corsConfig, null, 2));

    // Get storage bucket
    const bucket = admin.storage().bucket();
    
    console.log(`🪣 Working with bucket: ${bucket.name}`);

    // Note: Firebase Admin SDK doesn't directly support CORS configuration
    // This would require using Google Cloud Storage client library
    console.log('⚠️ Firebase Admin SDK limitation detected');
    console.log('📋 Manual steps required:');
    console.log('');
    console.log('1. Install Google Cloud SDK:');
    console.log('   https://cloud.google.com/sdk/docs/install');
    console.log('');
    console.log('2. Authenticate:');
    console.log('   gcloud auth login');
    console.log('');
    console.log('3. Set project:');
    console.log('   gcloud config set project rag-prompt-library');
    console.log('');
    console.log('4. Apply CORS:');
    console.log('   gsutil cors set cors.json gs://rag-prompt-library.appspot.com');
    console.log('');
    console.log('🔄 Alternative: Use Google Cloud Console');
    console.log('   https://console.cloud.google.com/storage/browser/rag-prompt-library.appspot.com');
    console.log('');

    // Try to create a test file to verify bucket access
    console.log('🧪 Testing bucket access...');
    const testFile = bucket.file('test-cors-access.txt');
    await testFile.save('CORS test file', {
      metadata: {
        contentType: 'text/plain'
      }
    });
    
    console.log('✅ Bucket access confirmed - can write files');
    
    // Clean up test file
    await testFile.delete();
    console.log('🧹 Test file cleaned up');

    console.log('');
    console.log('💡 Immediate workaround options:');
    console.log('1. Use the DocumentUploadFunction component (bypasses CORS)');
    console.log('2. Deploy the upload_document_via_function Firebase Function');
    console.log('3. Apply CORS manually using gsutil command above');

    return {
      success: true,
      message: 'Bucket access verified, manual CORS setup required'
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the function
applyCorsConfiguration()
  .then(result => {
    if (result.success) {
      console.log('✨ Process completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Process failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
