#!/usr/bin/env node

/**
 * Script to run the migration_legacy_prompts callable function in staging
 * Usage: node run-migration-dryrun.js <userId> [dryRun] [force]
 * 
 * Examples:
 *   node run-migration-dryrun.js SrkLzNMtijNgn5dFzQeoJFNg1Rx2 true false
 *   node run-migration-dryrun.js SrkLzNMtijNgn5dFzQeoJFNg1Rx2
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with staging credentials
const serviceAccountPath = path.join(__dirname, '../staging-service-account.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'rag-prompt-library-staging',
  });
} catch (err) {
  console.error('❌ Could not load staging service account. Using default credentials.');
  console.error('   Make sure you have GOOGLE_APPLICATION_CREDENTIALS set or staging-service-account.json in the repo root.');
  process.exit(1);
}

const args = process.argv.slice(2);
const userId = args[0];
const dryRun = args[1] !== 'false' ? true : false;
const force = args[2] === 'true' ? true : false;

if (!userId) {
  console.error('❌ Usage: node run-migration-dryrun.js <userId> [dryRun=true] [force=false]');
  console.error('   Example: node run-migration-dryrun.js SrkLzNMtijNgn5dFzQeoJFNg1Rx2 true false');
  process.exit(1);
}

console.log(`\n🚀 Running migration for userId: ${userId}`);
console.log(`   dryRun: ${dryRun}`);
console.log(`   force: ${force}`);
console.log('');

(async () => {
  try {
    const functions = admin.functions('australia-southeast1');
    const migrateFn = functions.httpsCallable('migrate_legacy_prompts');
    
    console.log('📞 Calling migrate_legacy_prompts...\n');
    const result = await migrateFn({
      userId,
      dryRun,
      force,
      batchSize: 400,
    });

    console.log('✅ Migration completed!\n');
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.data && result.data.stats) {
      const stats = result.data.stats;
      console.log('\n📊 Migration Statistics:');
      console.log(`   Root prompts checked: ${stats.rootChecked}`);
      console.log(`   Root prompts backfilled: ${stats.rootBackfilled}`);
      console.log(`   Prompts migrated from subcollection: ${stats.migratedFromSubcollection}`);
      console.log(`   Existing root prompts skipped: ${stats.skippedExistingRoot}`);
      if (stats.errors && stats.errors.length > 0) {
        console.log(`   Errors: ${stats.errors.length}`);
        stats.errors.forEach((err, idx) => {
          console.log(`     ${idx + 1}. ${err}`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    process.exit(1);
  }
})();

