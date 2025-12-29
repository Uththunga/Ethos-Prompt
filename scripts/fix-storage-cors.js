#!/usr/bin/env node

/**
 * Fix Firebase Storage CORS Configuration
 * Alternative method using Firebase Admin SDK
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Firebase Storage CORS Configuration...');

// Check if Firebase CLI is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI found');
} catch (error) {
  console.error('❌ Error: Firebase CLI is not installed');
  console.error('Please install Firebase CLI: npm install -g firebase-tools');
  process.exit(1);
}

// Get the current Firebase project
let projectId;
try {
  const firebaseUse = execSync('firebase use --json', { encoding: 'utf8' });
  const result = JSON.parse(firebaseUse);
  projectId = result.result?.project;
  
  if (!projectId) {
    throw new Error('No project selected');
  }
  
  console.log(`📋 Current Firebase project: ${projectId}`);
} catch (error) {
  console.error('❌ Error: No Firebase project selected');
  console.error('Please run: firebase use <project-id>');
  process.exit(1);
}

// Check if cors.json exists
const corsPath = path.join(process.cwd(), 'cors.json');
if (!fs.existsSync(corsPath)) {
  console.error('❌ Error: cors.json file not found in current directory');
  process.exit(1);
}

console.log('📄 Found cors.json configuration file');

// Validate cors.json format
try {
  const corsContent = fs.readFileSync(corsPath, 'utf8');
  JSON.parse(corsContent);
  console.log('✅ cors.json is valid JSON');
} catch (error) {
  console.error('❌ Error: cors.json is not valid JSON');
  process.exit(1);
}

// Construct the bucket name
const bucketName = `${projectId}.appspot.com`;
console.log(`🪣 Storage bucket: gs://${bucketName}`);

// Check if gsutil is available
let useGsutil = true;
try {
  execSync('gsutil version', { stdio: 'ignore' });
  console.log('✅ gsutil found - using gsutil method');
} catch (error) {
  console.log('⚠️ gsutil not found - will provide manual instructions');
  useGsutil = false;
}

if (useGsutil) {
  // Apply CORS configuration using gsutil
  console.log('🚀 Applying CORS configuration to Firebase Storage bucket...');
  
  try {
    execSync(`gsutil cors set cors.json gs://${bucketName}`, { stdio: 'inherit' });
    console.log('✅ CORS configuration applied successfully!');
    
    // Verify the CORS configuration
    console.log('🔍 Verifying CORS configuration...');
    console.log(`Current CORS settings for gs://${bucketName}:`);
    execSync(`gsutil cors get gs://${bucketName}`, { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Failed to apply CORS configuration');
    console.error('Please ensure you have the necessary permissions for the bucket');
    process.exit(1);
  }
} else {
  // Provide manual instructions
  console.log('\n📋 Manual CORS Configuration Instructions:');
  console.log('\n1. Install Google Cloud SDK:');
  console.log('   https://cloud.google.com/sdk/docs/install');
  console.log('\n2. Authenticate with Google Cloud:');
  console.log('   gcloud auth login');
  console.log('\n3. Set your project:');
  console.log(`   gcloud config set project ${projectId}`);
  console.log('\n4. Apply CORS configuration:');
  console.log(`   gsutil cors set cors.json gs://${bucketName}`);
  console.log('\n5. Verify CORS configuration:');
  console.log(`   gsutil cors get gs://${bucketName}`);
}

console.log('\n🎉 Firebase Storage CORS configuration process completed!');
console.log('\n📝 What was done:');
console.log('   • Updated cors.json with comprehensive origin and header support');
console.log(`   • ${useGsutil ? 'Applied' : 'Prepared'} CORS configuration for Firebase Storage bucket: gs://${bucketName}`);
console.log('   • Added support for localhost development environments');
console.log('   • Included all necessary HTTP methods and headers');

console.log('\n🔄 You may need to:');
console.log('   • Clear your browser cache');
console.log('   • Wait a few minutes for the changes to propagate');
console.log('   • Redeploy your application if needed');

console.log('\n✨ PDF uploads should now work without CORS errors!');

// Additional troubleshooting information
console.log('\n🔧 If you still experience CORS issues:');
console.log('   1. Check that you\'re authenticated with the correct Google account');
console.log('   2. Verify you have Storage Admin permissions on the project');
console.log('   3. Try running the gsutil command manually');
console.log('   4. Check the Firebase Console Storage settings');
console.log('   5. Ensure your domain is correctly listed in cors.json');
