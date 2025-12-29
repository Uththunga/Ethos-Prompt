/*
 Seeding script for staging Firestore and Auth

 Requirements to run (one-time, local machine or CI):
 1) Service Account for project 'rag-prompt-library-staging'
 2) Set env: GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccount.json
 3) node functions/scripts/seed_staging.js

 Safety:
 - Idempotent: re-runs will upsert same docs by stable IDs.
 - No external API calls; purely Firestore/Auth writes.
*/

const admin = require('firebase-admin');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'rag-prompt-library-staging';
const TEST_EMAIL = process.env.SEED_TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD || 'ChangeMe_Staging1!';

function initAdmin() {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: PROJECT_ID,
    });
  }
  return { auth: admin.auth(), db: admin.firestore() };
}

async function ensureUser(auth) {
  try {
    const user = await auth.getUserByEmail(TEST_EMAIL);
    return user;
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      const user = await auth.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        emailVerified: true,
      });
      await auth.setCustomUserClaims(user.uid, { role: 'user' });
      return user;
    }
    throw e;
  }
}

function promptDoc(uid, id, data) {
  return {
    id,
    userId: uid,
    title: data.title,
    content: data.content,
    description: data.description || '',
    category: data.category || 'General',
    tags: data.tags || [],
    variables: data.variables || [],
    isPublic: !!data.isPublic,
    model: data.model || 'z-ai/glm-4.5-air:free',
    temperature: data.temperature ?? 0.7,
    maxTokens: data.maxTokens || 1000,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    executionCount: 0,
    averageRating: 0,
    ratingCount: 0,
    version: 1,
    isDeleted: false,
  };
}

async function seedPrompts(db, uid) {
  const prompts = [
    promptDoc(uid, 'seed-prompt-1', {
      title: 'Simple Greeting',
      content: 'Say hello to the world.',
      isPublic: true,
    }),
    promptDoc(uid, 'seed-prompt-2', {
      title: 'Personalized Greeting',
      content: 'Hello {name}, welcome to the RAG Prompt Library!',
      variables: ['name'],
    }),
    promptDoc(uid, 'seed-prompt-3', {
      title: 'Code Generator',
      content: 'Write a {language} function that {task}.',
      variables: ['language', 'task'],
      tags: ['code', 'generator'],
    }),
    promptDoc(uid, 'seed-prompt-4', {
      title: 'RAG-enabled Q&A',
      content: 'Using the provided context, answer: {question}',
      variables: ['question'],
      tags: ['rag'],
    }),
    promptDoc(uid, 'seed-prompt-5', {
      title: 'Model Comparison Prompt',
      content: 'Compare responses to: {topic}',
      variables: ['topic'],
      tags: ['comparison'],
    }),
  ];

  for (const p of prompts) {
    const ref = db.collection('prompts').doc(p.id);
    await ref.set(p, { merge: true });
  }
}

async function seedDocuments(db, uid) {
  const docs = [
    { id: 'seed-doc-1', filename: 'sample.pdf', mimeType: 'application/pdf' },
    { id: 'seed-doc-2', filename: 'readme.md', mimeType: 'text/markdown' },
    { id: 'seed-doc-3', filename: 'data.txt', mimeType: 'text/plain' },
  ];

  for (const d of docs) {
    const ref = db.collection('rag_documents').doc(d.id);
    await ref.set(
      {
        uploadedBy: uid, // ✅ FIXED: Changed from userId to uploadedBy to match production schema
        filename: d.filename,
        mimeType: d.mimeType,
        status: 'completed',
        textContent: 'Seeded document content for testing.',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingMetadata: { chunk_count: 1, processing_method: 'seed' },
      },
      { merge: true }
    );
  }
}

async function seedExecutions(db, uid) {
  const execs = [];
  // 6 successful executions
  for (let i = 1; i <= 6; i++) {
    execs.push({
      id: `seed-exec-success-${i}`,
      promptId: 'seed-prompt-1',
      promptTitle: 'Simple Greeting',
      status: 'completed',
      // ✅ FIXED: Use flat structure (production) instead of nested outputs
      tokensUsed: 50,
      cost: 0,
      duration: 1.5 + i * 0.2, // Varying durations for realistic data
      output: `Hello world ${i}`,
      model: 'z-ai/glm-4.5-air:free',
    });
  }
  // 4 failed executions
  for (let i = 1; i <= 4; i++) {
    execs.push({
      id: `seed-exec-failed-${i}`,
      promptId: 'seed-prompt-2',
      promptTitle: 'Personalized Greeting',
      status: 'failed',
      tokensUsed: 0,
      cost: 0,
      duration: 0.5,
      output: '',
      error: 'Seeded failure for testing',
      model: 'z-ai/glm-4.5-air:free',
    });
  }

  // ✅ FIXED: Store in flat 'executions' collection instead of nested subcollection
  for (const e of execs) {
    const execRef = db.collection('executions').doc(e.id);
    await execRef.set(
      {
        userId: uid,
        promptId: e.promptId,
        promptTitle: e.promptTitle,
        inputs: {},
        output: e.output,
        status: e.status,
        tokensUsed: e.tokensUsed,
        cost: e.cost,
        duration: e.duration,
        model: e.model,
        error: e.error || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

(async function main() {
  const start = Date.now();
  console.log('Seeding staging environment...');
  const { auth, db } = initAdmin();

  const user = await ensureUser(auth);
  console.log(`Using test user: ${user.uid} <${TEST_EMAIL}>`);

  await seedPrompts(db, user.uid);
  console.log('Prompts seeded.');

  await seedDocuments(db, user.uid);
  console.log('Documents seeded.');

  await seedExecutions(db, user.uid);
  console.log('Executions seeded.');

  console.log(`Done in ${(Date.now() - start) / 1000}s`);
  process.exit(0);
})().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
