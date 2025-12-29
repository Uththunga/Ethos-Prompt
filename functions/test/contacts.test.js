import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Ensure zero-cost mock mode in all tests (for any OpenRouter usage)
process.env.OPENROUTER_USE_MOCK = 'true';

// NOTE: We hit the Functions emulator directly via HTTP, so we do not need to
// import the module under test for these endpoints. The httpApi function is
// deployed at /httpApi and internally routes /api/contacts* paths.

// Emulator-only auth fallback UID used in authenticateHttpRequest in index.js
const EMULATOR_UID = '5f3TZo1RW8abwje1q43wdPfLyqde';

let testEnv;
let db;
let baseUrl;
let apiBaseUrl;

beforeAll(async () => {
  // firebase-functions-test harness (mainly for consistency and cleanup)
  testEnv = functionsTest({ projectId: process.env.GCLOUD_PROJECT || 'rag-prompt-library' });

  // Admin SDK (already initialized by index.js in most cases)
  try {
    db = admin.firestore();
  } catch (e) {
    admin.initializeApp();
    db = admin.firestore();
  }

  const projectId =
    process.env.GCLOUD_PROJECT ||
    (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : 'rag-prompt-library');

  baseUrl = `http://127.0.0.1:5001/${projectId}/australia-southeast1`;
  apiBaseUrl = `${baseUrl}/httpApi`;

  // Seed user_roles entry so the emulator auth fallback user has an admin role by default
  await db
    .collection('user_roles')
    .doc(EMULATOR_UID)
    .set({
      userId: EMULATOR_UID,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});

afterAll(async () => {
  try {
    // Clean up test contacts tagged with "contacts-test"
    const snap = await db
      .collection('contacts')
      .where('tags', 'array-contains', 'contacts-test')
      .get();
    const batch = db.batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  } catch {}

  try {
    await db.collection('user_roles').doc(EMULATOR_UID).delete();
  } catch {}

  try {
    testEnv?.cleanup();
  } catch {}
});

function authHeader() {
  // When running against the emulator, the backend treats idToken === 'emulator'
  // as a special case and maps it to EMULATOR_UID.
  return { Authorization: 'Bearer emulator' };
}

describe('Contacts API – RBAC and CRUD via httpApi', () => {
  it('should reject contacts listing without auth', async () => {
    await request(apiBaseUrl).get('/api/contacts').expect(401);
  });

  it('should allow admin to create and fetch a contact', async () => {
    const email = `contacts-admin-${Date.now()}@example.com`;

    const createRes = await request(apiBaseUrl)
      .post('/api/contacts')
      .set(authHeader())
      .set('Content-Type', 'application/json')
      .send({
        name: 'Admin Test Contact',
        email,
        tags: ['contacts-test'],
        notesSummary: 'Created in contacts.test.js',
      })
      .expect(201);

    const created = createRes.body?.contact;
    expect(createRes.body?.success).toBe(true);
    expect(created?.id).toBeTruthy();
    expect(created?.email).toBe(email.toLowerCase());

    const getRes = await request(apiBaseUrl)
      .get(`/api/contacts/${encodeURIComponent(created.id)}`)
      .set(authHeader())
      .expect(200);

    expect(getRes.body?.success).toBe(true);
    expect(getRes.body?.contact?.id).toBe(created.id);
    expect(getRes.body?.contact?.email).toBe(email.toLowerCase());
  });

  it('should support listing with basic filters', async () => {
    const email = `contacts-filter-${Date.now()}@example.com`;

    // Ensure admin role
    await db
      .collection('user_roles')
      .doc(EMULATOR_UID)
      .set({ userId: EMULATOR_UID, role: 'admin', createdAt: admin.firestore.FieldValue.serverTimestamp() });

    // Create a contact with owner and status
    await request(apiBaseUrl)
      .post('/api/contacts')
      .set(authHeader())
      .set('Content-Type', 'application/json')
      .send({
        name: 'Filter Test Contact',
        email,
        status: 'in_progress',
        ownerUserId: EMULATOR_UID,
        source: 'manual',
        tags: ['contacts-test', 'filter-tag'],
      })
      .expect(201);

    const listRes = await request(apiBaseUrl)
      .get(
        `/api/contacts?status=in_progress&ownerUserId=${encodeURIComponent(
          EMULATOR_UID
        )}&tag=${encodeURIComponent('filter-tag')}`
      )
      .set(authHeader())
      .expect(200);

    expect(listRes.body?.success).toBe(true);
    const items = Array.isArray(listRes.body?.contacts) ? listRes.body.contacts : [];
    expect(items.length).toBeGreaterThan(0);
    const found = items.some((c) => c.email === email.toLowerCase());
    expect(found).toBe(true);
  });

  it('should update contact status and nextFollowUpAt', async () => {
    const email = `contacts-update-${Date.now()}@example.com`;

    const createRes = await request(apiBaseUrl)
      .post('/api/contacts')
      .set(authHeader())
      .set('Content-Type', 'application/json')
      .send({
        name: 'Update Test Contact',
        email,
        tags: ['contacts-test'],
      })
      .expect(201);

    const contactId = createRes.body?.contact?.id;
    expect(contactId).toBeTruthy();

    const nextFollowUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const updateRes = await request(apiBaseUrl)
      .patch(`/api/contacts/${encodeURIComponent(contactId)}`)
      .set(authHeader())
      .set('Content-Type', 'application/json')
      .send({
        status: 'qualified',
        nextFollowUpAt,
      })
      .expect(200);

    expect(updateRes.body?.success).toBe(true);
    expect(updateRes.body?.contact?.status).toBe('qualified');
    expect(updateRes.body?.contact?.nextFollowUpAt).toBeTruthy();
  });

  it('should respect dev role for my-contacts and block delete', async () => {
    // Switch role to dev
    await db
      .collection('user_roles')
      .doc(EMULATOR_UID)
      .set({ userId: EMULATOR_UID, role: 'dev', createdAt: admin.firestore.FieldValue.serverTimestamp() });

    const email = `contacts-dev-${Date.now()}@example.com`;

    const createRes = await request(apiBaseUrl)
      .post('/api/contacts')
      .set(authHeader())
      .set('Content-Type', 'application/json')
      .send({
        name: 'Dev Owner Contact',
        email,
        ownerUserId: EMULATOR_UID,
        tags: ['contacts-test'],
      })
      .expect(201);

    const contactId = createRes.body?.contact?.id;
    expect(contactId).toBeTruthy();

    const myRes = await request(apiBaseUrl)
      .get('/api/my-contacts')
      .set(authHeader())
      .expect(200);

    expect(myRes.body?.success).toBe(true);
    const items = Array.isArray(myRes.body?.contacts) ? myRes.body.contacts : [];
    const found = items.some((c) => c.id === contactId);
    expect(found).toBe(true);

    // Dev should NOT be able to delete
    await request(apiBaseUrl)
      .delete(`/api/contacts/${encodeURIComponent(contactId)}`)
      .set(authHeader())
      .expect(403);
  });

  it('should allow admin to delete a contact', async () => {
    // Switch role back to admin
    await db
      .collection('user_roles')
      .doc(EMULATOR_UID)
      .set({ userId: EMULATOR_UID, role: 'admin', createdAt: admin.firestore.FieldValue.serverTimestamp() });

    const email = `contacts-admin-delete-${Date.now()}@example.com`;

    const createRes = await request(apiBaseUrl)
      .post('/api/contacts')
      .set(authHeader())
      .set('Content-Type', 'application/json')
      .send({
        name: 'Admin Delete Contact',
        email,
        tags: ['contacts-test'],
      })
      .expect(201);

    const contactId = createRes.body?.contact?.id;
    expect(contactId).toBeTruthy();

    await request(apiBaseUrl)
      .delete(`/api/contacts/${encodeURIComponent(contactId)}`)
      .set(authHeader())
      .expect(200);

    await request(apiBaseUrl)
      .get(`/api/contacts/${encodeURIComponent(contactId)}`)
      .set(authHeader())
      .expect(404);
  });

  it('should return 404 for unknown contact id', async () => {
    await db
      .collection('user_roles')
      .doc(EMULATOR_UID)
      .set({ userId: EMULATOR_UID, role: 'admin', createdAt: admin.firestore.FieldValue.serverTimestamp() });

    await request(apiBaseUrl)
      .get('/api/contacts/non-existent-contact-id')
      .set(authHeader())
      .expect(404);
  });
});
