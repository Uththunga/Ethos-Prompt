/**
 * Script to trigger Marketing KB initialization via Cloud Function
 * 
 * Usage:
 *   node scripts/initialize-marketing-kb.js [--force]
 * 
 * Options:
 *   --force    Force reindex all documents even if already indexed
 */

const admin = require('firebase-admin');
const { getFunctions } = require('firebase-admin/functions');

// Initialize Firebase Admin
const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS 
  ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // Use default credentials (works in Cloud Functions or with gcloud auth)
  admin.initializeApp();
}

const db = admin.firestore();
const functions = getFunctions();

async function initializeMarketingKB() {
  const forceReindex = process.argv.includes('--force');
  
  console.log('='.repeat(60));
  console.log('Marketing Knowledge Base Initialization');
  console.log('='.repeat(60));
  console.log(`Force reindex: ${forceReindex}`);
  console.log('');
  
  try {
    // Call the Cloud Function
    console.log('Calling initialize_marketing_kb_function...');
    
    const result = await admin.functions().httpsCallable('initialize_marketing_kb_function')({
      force_reindex: forceReindex
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('Indexing Results:');
    console.log('='.repeat(60));
    console.log(`Total documents: ${result.data.results.total_documents}`);
    console.log(`Indexed documents: ${result.data.results.indexed_documents}`);
    console.log(`Skipped documents: ${result.data.results.skipped_documents}`);
    console.log(`Total chunks: ${result.data.results.total_chunks}`);
    console.log(`Total vectors: ${result.data.results.total_vectors}`);
    console.log(`Processing time: ${result.data.results.processing_time.toFixed(2)}s`);
    
    if (result.data.results.errors && result.data.results.errors.length > 0) {
      console.log('');
      console.log(`Errors encountered: ${result.data.results.errors.length}`);
      result.data.results.errors.forEach(error => {
        console.log(`  - ${error.document_id}: ${error.error}`);
      });
    }
    
    console.log('');
    console.log('✓ Marketing KB initialization complete!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('✗ Failed to initialize marketing KB:');
    console.error(error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
}

// Alternative: Direct Firestore approach (if Cloud Function not deployed yet)
async function initializeMarketingKBDirect() {
  const forceReindex = process.argv.includes('--force');
  
  console.log('='.repeat(60));
  console.log('Marketing Knowledge Base Initialization (Direct)');
  console.log('='.repeat(60));
  console.log(`Force reindex: ${forceReindex}`);
  console.log('');
  
  try {
    // Import the Python module (requires Python bridge or rewrite in JS)
    console.error('Direct initialization requires Python. Please use Cloud Function approach.');
    console.error('Deploy the function first: firebase deploy --only functions:initialize_marketing_kb_function');
    process.exit(1);
    
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeMarketingKB();

