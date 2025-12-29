/**
 * Help Articles Migration and Versioning Script
 * 
 * Migrates existing help articles to new schema with versioning support
 * 
 * Usage:
 *   npm run migrate-help-articles
 *   npm run migrate-help-articles -- --dry-run
 *   npm run migrate-help-articles -- --backup
 * 
 * Options:
 *   --dry-run: Preview changes without writing to Firestore
 *   --backup: Create backup collection before migration
 *   --collection: Source collection name (default: helpArticles)
 *   --backup-collection: Backup collection name (default: helpArticles_backup_TIMESTAMP)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface LegacyArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  difficulty: string;
  lastUpdated?: string | Timestamp;
  [key: string]: any;
}

interface ModernArticle extends LegacyArticle {
  subcategory?: string;
  prerequisites?: string[];
  relatedArticles?: string[];
  estimatedReadTime?: number;
  featured?: boolean;
  views: number;
  helpful: number;
  rating: number;
  version: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastUpdated: Timestamp;
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const shouldBackup = args.includes('--backup');
const collectionName = args.find(arg => arg.startsWith('--collection='))?.split('=')[1] || 'helpArticles';
const backupCollectionName = args.find(arg => arg.startsWith('--backup-collection='))?.split('=')[1] || 
  `helpArticles_backup_${Date.now()}`;

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
  path.join(__dirname, '../../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: Service account key not found at:', serviceAccountPath);
  console.error('   Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable or place serviceAccountKey.json in project root');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = getFirestore();

console.log(`\n🔄 Help Articles Migration Script`);
console.log(`   Source Collection: ${collectionName}`);
console.log(`   Mode: ${isDryRun ? 'DRY RUN' : 'MIGRATION'}`);
console.log(`   Backup: ${shouldBackup ? `Yes (${backupCollectionName})` : 'No'}\n`);

// Estimate reading time from content
function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Migrate article to modern schema
function migrateArticle(legacy: LegacyArticle): ModernArticle {
  const now = Timestamp.now();
  
  // Convert lastUpdated to Timestamp if it's a string
  let lastUpdated: Timestamp;
  if (typeof legacy.lastUpdated === 'string') {
    lastUpdated = Timestamp.fromDate(new Date(legacy.lastUpdated));
  } else if (legacy.lastUpdated instanceof Timestamp) {
    lastUpdated = legacy.lastUpdated;
  } else {
    lastUpdated = now;
  }

  return {
    ...legacy,
    subcategory: legacy.subcategory || undefined,
    prerequisites: legacy.prerequisites || [],
    relatedArticles: legacy.relatedArticles || [],
    estimatedReadTime: legacy.estimatedReadTime || estimateReadingTime(legacy.content),
    featured: legacy.featured || false,
    views: legacy.views || 0,
    helpful: legacy.helpful || 0,
    rating: legacy.rating || 0,
    version: legacy.version || 1,
    createdAt: legacy.createdAt || now,
    updatedAt: now,
    lastUpdated,
    faqs: legacy.faqs || [],
  };
}

// Backup collection
async function backupCollection() {
  console.log(`📦 Creating backup: ${backupCollectionName}...`);
  
  const sourceRef = db.collection(collectionName);
  const backupRef = db.collection(backupCollectionName);
  
  const snapshot = await sourceRef.get();
  let backed = 0;

  for (const doc of snapshot.docs) {
    if (!isDryRun) {
      await backupRef.doc(doc.id).set(doc.data());
    }
    backed++;
  }

  console.log(`✅ Backed up ${backed} articles to ${backupCollectionName}\n`);
}

// Migrate articles
async function migrateArticles() {
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.get();

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`📄 Found ${snapshot.size} articles to migrate\n`);

  for (const doc of snapshot.docs) {
    try {
      const legacy = doc.data() as LegacyArticle;
      
      // Check if already migrated (has version field)
      if (legacy.version && !isDryRun) {
        console.log(`⏭️  Skipping ${doc.id} (already migrated, version ${legacy.version})`);
        skipped++;
        continue;
      }

      const modern = migrateArticle(legacy);

      if (isDryRun) {
        console.log(`🔍 [DRY RUN] Would migrate: ${doc.id}`);
        console.log(`   Title: ${modern.title}`);
        console.log(`   Category: ${modern.category}${modern.subcategory ? ` > ${modern.subcategory}` : ''}`);
        console.log(`   Estimated read time: ${modern.estimatedReadTime} min`);
        console.log(`   Version: ${legacy.version || 'none'} → ${modern.version}`);
        console.log(`   New fields: ${Object.keys(modern).filter(k => !(k in legacy)).join(', ')}`);
        console.log('');
        migrated++;
      } else {
        await collectionRef.doc(doc.id).update(modern);
        console.log(`✅ Migrated: ${doc.id} (${modern.title})`);
        migrated++;
      }
    } catch (error) {
      console.error(`❌ Error migrating ${doc.id}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Migrated: ${migrated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${snapshot.size}`);

  if (isDryRun) {
    console.log('\n💡 This was a dry run. No changes were made to Firestore.');
    console.log('   Run without --dry-run to apply migration.');
  } else {
    console.log('\n✅ Migration complete!');
  }
}

// Version article (create new version in subcollection)
async function versionArticle(articleId: string) {
  const docRef = db.collection(collectionName).doc(articleId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new Error(`Article ${articleId} not found`);
  }

  const data = doc.data() as ModernArticle;
  const versionNumber = (data.version || 0) + 1;

  // Create version in subcollection
  const versionRef = docRef.collection('versions').doc(`v${versionNumber}`);
  await versionRef.set({
    ...data,
    versionNumber,
    versionedAt: Timestamp.now(),
  });

  // Update main document version
  await docRef.update({
    version: versionNumber,
    updatedAt: Timestamp.now(),
  });

  console.log(`✅ Created version ${versionNumber} for article ${articleId}`);
}

// Run migration
async function run() {
  try {
    // Backup if requested
    if (shouldBackup && !isDryRun) {
      await backupCollection();
    }

    // Migrate articles
    await migrateArticles();

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

run();

