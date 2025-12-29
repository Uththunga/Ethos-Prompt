#!/usr/bin/env node

/**
 * Script to inspect prompts in Firestore to diagnose the isDeleted issue
 * Usage: node inspect-prompts.js <userId>
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

const db = admin.firestore();
const userId = process.argv[2] || 'SrkLzNMtijNgn5dFzQeoJFNg1Rx2';

console.log(`\n🔍 Inspecting prompts for userId: ${userId}\n`);

(async () => {
  try {
    // Check root prompts collection
    console.log('📁 Checking root "prompts" collection...');
    const rootPromptsRef = db.collection('prompts');
    const rootQuery = rootPromptsRef.where('userId', '==', userId);
    const rootSnap = await rootQuery.get();

    console.log(`   Total prompts in root collection: ${rootSnap.size}`);

    let withIsDeleted = 0;
    let withoutIsDeleted = 0;
    let isDeletedTrue = 0;
    let isDeletedFalse = 0;

    rootSnap.forEach((doc) => {
      const data = doc.data();
      if (data.isDeleted === undefined) {
        withoutIsDeleted++;
        console.log(
          `   ⚠️  ${doc.id}: Missing isDeleted field - Title: "${data.title || '(no title)'}"`
        );
      } else {
        withIsDeleted++;
        if (data.isDeleted === true) {
          isDeletedTrue++;
        } else {
          isDeletedFalse++;
        }
      }
    });

    console.log(`\n   Summary:`);
    console.log(`   - With isDeleted field: ${withIsDeleted}`);
    console.log(`   - Without isDeleted field: ${withoutIsDeleted} ⚠️`);
    console.log(`   - isDeleted = true: ${isDeletedTrue}`);
    console.log(`   - isDeleted = false: ${isDeletedFalse}`);

    // Check legacy subcollection
    console.log(`\n📁 Checking legacy "users/{uid}/prompts" subcollection...`);
    const legacyRef = db.collection('users').doc(userId).collection('prompts');
    const legacySnap = await legacyRef.get();

    console.log(`   Total prompts in legacy subcollection: ${legacySnap.size}`);

    if (legacySnap.size > 0) {
      legacySnap.forEach((doc) => {
        const data = doc.data();
        console.log(
          `   📄 ${doc.id}: "${data.title || '(no title)'}" - isDeleted: ${data.isDeleted}`
        );
      });
    }

    // Test the query that analytics uses
    console.log(`\n🔍 Testing analytics query (where isDeleted == false)...`);
    const analyticsQuery = rootPromptsRef
      .where('userId', '==', userId)
      .where('isDeleted', '==', false);
    const analyticsSnap = await analyticsQuery.get();

    console.log(`   Results: ${analyticsSnap.size} prompts`);
    console.log(`   This is what totalPrompts shows in dashboard: ${analyticsSnap.size}`);

    // Summary
    console.log(`\n📊 DIAGNOSIS:`);
    if (withoutIsDeleted > 0) {
      console.log(`   ❌ ISSUE FOUND: ${withoutIsDeleted} prompts missing isDeleted field`);
      console.log(
        `      These prompts are invisible to queries with "where('isDeleted', '==', false)"`
      );
      console.log(`      Solution: Run migration to backfill isDeleted: false`);
    }
    if (legacySnap.size > 0) {
      console.log(`   ❌ ISSUE FOUND: ${legacySnap.size} prompts in legacy subcollection`);
      console.log(`      These prompts are not in the root collection used by analytics and chat`);
      console.log(`      Solution: Run migration to copy them to root collection`);
    }
    if (withoutIsDeleted === 0 && legacySnap.size === 0) {
      console.log(
        `   ✅ No issues found. All prompts have isDeleted field and are in root collection.`
      );
    }

    console.log(`\n✅ Inspection complete!\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
