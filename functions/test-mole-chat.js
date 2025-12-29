#!/usr/bin/env node

/**
 * Script to test MOLE chat functionality in staging
 * Usage: node test-mole-chat.js <userId> <message>
 */

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

const userId = process.argv[2] || 'SrkLzNMtijNgn5dFzQeoJFNg1Rx2';
const message = process.argv[3] || 'list my prompts';

console.log(`\n🤖 Testing MOLE chat in staging`);
console.log(`   User ID: ${userId}`);
console.log(`   Message: "${message}"`);
console.log('');

(async () => {
  try {
    const db = admin.firestore();

    // Test the same query that the chat handler uses
    console.log('📞 Querying prompts (same query as chat handler)...\n');

    const promptsRef = db.collection('prompts');
    const query = promptsRef
      .where('userId', '==', userId)
      .where('isDeleted', '==', false)
      .orderBy('updatedAt', 'desc')
      .limit(50);

    const snapshot = await query.get();

    console.log('✅ Query completed!\n');
    console.log(`   Total prompts found: ${snapshot.size}`);

    if (snapshot.size > 0) {
      console.log('\n📋 Prompts:');
      snapshot.forEach((doc, idx) => {
        const data = doc.data();
        console.log(`   ${idx + 1}. ${data.title || '(Untitled)'}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      isDeleted: ${data.isDeleted}`);
        console.log(`      Created: ${data.createdAt?.toDate?.() || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  No prompts found!');
      console.log('   This is what MOLE chat would see.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
})();
