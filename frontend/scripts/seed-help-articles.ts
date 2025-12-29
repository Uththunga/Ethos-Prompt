/**
 * Firestore Help Articles Seeding Script
 * 
 * Seeds the Firestore helpArticles collection from articles.json
 * 
 * Usage:
 *   npm run seed-help-articles
 *   npm run seed-help-articles -- --dry-run
 *   npm run seed-help-articles -- --force
 * 
 * Options:
 *   --dry-run: Preview changes without writing to Firestore
 *   --force: Overwrite existing articles
 *   --collection: Custom collection name (default: helpArticles)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  views?: number;
  helpful?: number;
  rating?: number;
  estimatedReadTime?: number;
  featured?: boolean;
  prerequisites?: string[];
  relatedArticles?: string[];
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

interface FirestoreArticle extends Omit<HelpArticle, 'lastUpdated'> {
  lastUpdated: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const collectionName = args.find(arg => arg.startsWith('--collection='))?.split('=')[1] || 'helpArticles';

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

// Load articles from JSON
const articlesPath = path.join(__dirname, '../src/data/help/articles.json');
const articles: HelpArticle[] = JSON.parse(fs.readFileSync(articlesPath, 'utf8'));

console.log(`\n📚 Firestore Help Articles Seeding Script`);
console.log(`   Collection: ${collectionName}`);
console.log(`   Mode: ${isDryRun ? 'DRY RUN' : isForce ? 'FORCE' : 'NORMAL'}`);
console.log(`   Articles to seed: ${articles.length}\n`);

// Convert article to Firestore format
function convertToFirestoreArticle(article: HelpArticle): FirestoreArticle {
  const now = Timestamp.now();
  const lastUpdated = Timestamp.fromDate(new Date(article.lastUpdated));

  return {
    ...article,
    lastUpdated,
    createdAt: now,
    updatedAt: now,
    version: 1,
    views: article.views || 0,
    helpful: article.helpful || 0,
    rating: article.rating || 0,
  };
}

// Seed articles to Firestore
async function seedArticles() {
  const collectionRef = db.collection(collectionName);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const article of articles) {
    try {
      const docRef = collectionRef.doc(article.id);
      const docSnap = await docRef.get();
      const exists = docSnap.exists;

      if (exists && !isForce) {
        console.log(`⏭️  Skipping ${article.id} (already exists, use --force to overwrite)`);
        skipped++;
        continue;
      }

      const firestoreArticle = convertToFirestoreArticle(article);

      if (isDryRun) {
        console.log(`🔍 [DRY RUN] Would ${exists ? 'update' : 'create'}: ${article.id}`);
        console.log(`   Title: ${article.title}`);
        console.log(`   Category: ${article.category}${article.subcategory ? ` > ${article.subcategory}` : ''}`);
        console.log(`   Difficulty: ${article.difficulty}`);
        console.log(`   Featured: ${article.featured ? 'Yes' : 'No'}`);
        console.log(`   Read time: ${article.estimatedReadTime || 'N/A'} min`);
        console.log(`   Tags: ${article.tags.join(', ')}`);
        console.log('');
        
        if (exists) {
          updated++;
        } else {
          created++;
        }
      } else {
        if (exists) {
          // Update existing article, preserve createdAt and views
          const existingData = docSnap.data() as FirestoreArticle;
          await docRef.update({
            ...firestoreArticle,
            createdAt: existingData.createdAt,
            views: existingData.views || 0,
            helpful: existingData.helpful || 0,
            rating: existingData.rating || 0,
            version: (existingData.version || 0) + 1,
            updatedAt: Timestamp.now(),
          });
          console.log(`✅ Updated: ${article.id} (${article.title})`);
          updated++;
        } else {
          // Create new article
          await docRef.set(firestoreArticle);
          console.log(`✅ Created: ${article.id} (${article.title})`);
          created++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${article.id}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${articles.length}`);

  if (isDryRun) {
    console.log('\n💡 This was a dry run. No changes were made to Firestore.');
    console.log('   Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Seeding complete!');
  }
}

// Run seeding
seedArticles()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

