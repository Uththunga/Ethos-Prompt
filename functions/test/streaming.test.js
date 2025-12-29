/*
  Backend streaming endpoints — emulator tests (Vitest)
  - Uses OPENROUTER_USE_MOCK to guarantee zero billing
  - Uses emulator bypass for SSE auth via ?emulator_uid=...
*/

import * as admin from 'firebase-admin';
import functionsTest from 'firebase-functions-test';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Ensure zero-cost mock mode in all tests
process.env.OPENROUTER_USE_MOCK = 'true';

// Import functions after env is set
import * as functionsModule from '../index.js';

const TEST_UID = 'test-user-uid-123';
const TEST_PROMPT_ID = 'test-prompt-1';

let testEnv;
let db;

beforeAll(async () => {
  // firebase-functions-test harness
  testEnv = functionsTest({ projectId: process.env.GCLOUD_PROJECT || 'rag-prompt-library' });

  // Admin SDK (already initialized by index.js)
  try {
    db = admin.firestore();
  } catch (e) {
    // In case admin not initialized in this context
    admin.initializeApp();
    db = admin.firestore();
  }

  // Seed a prompt owned by TEST_UID
  await db.collection('prompts').doc(TEST_PROMPT_ID).set({
    title: 'Streaming Test Prompt',
    content: 'Hello {name}, this is a streaming test.',
    userId: TEST_UID,
    isDeleted: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

afterAll(async () => {
  try {
    await db.collection('prompts').doc(TEST_PROMPT_ID).delete();
  } catch {}
  try {
    testEnv?.cleanup();
  } catch {}
});

function parseSSE(text) {
  // Basic SSE frame parser: split by double newlines, extract JSON after 'data: '
  const frames = [];
  const parts = String(text || '').split('\n\n');
  for (const p of parts) {
    const line = p.trim();
    if (!line) continue;
    const prefix = 'data: ';
    const idx = line.indexOf(prefix);
    if (idx >= 0) {
      const jsonStr = line.slice(idx + prefix.length);
      try {
        frames.push(JSON.parse(jsonStr));
      } catch {}
    }
  }
  return frames;
}

describe('SSE stream_prompt (HTTP onRequest)', () => {
  it('should stream chunks and complete (emulator auth bypass)', async () => {
    // Call the actual emulator HTTP endpoint to avoid wrapper incompatibilities
    const projectId =
      process.env.GCLOUD_PROJECT ||
      (process.env.FIREBASE_CONFIG
        ? JSON.parse(process.env.FIREBASE_CONFIG).projectId
        : 'rag-prompt-library');
    const baseUrl = `http://127.0.0.1:5001/${projectId}/australia-southeast1`;
    const res = await request(baseUrl)
      .get(
        `/stream_prompt?promptId=${encodeURIComponent(
          TEST_PROMPT_ID
        )}&emulator_uid=${encodeURIComponent(TEST_UID)}&variables=${encodeURIComponent(
          JSON.stringify({ name: 'Alice' })
        )}`
      )
      .set('Accept', 'text/event-stream')
      .expect(200);

    const frames = parseSSE(res.text);
    const types = new Set(frames.map((f) => f?.type));

    expect(types.has('ack')).toBe(true);
    expect(types.has('chunk')).toBe(true);
    expect(types.has('complete')).toBe(true);

    // Ensure at least some content streamed
    const chunkContents = frames
      .filter((f) => f?.type === 'chunk')
      .map((f) => f.content)
      .join('');
    expect(chunkContents.length).toBeGreaterThan(0);
  }, 15000);
});

describe('Polling fallback (onCall): execute_prompt_streaming + get_execution_chunks', () => {
  it('should create an execution and return chunked output until completed', async () => {
    const projectId =
      process.env.GCLOUD_PROJECT ||
      (process.env.FIREBASE_CONFIG
        ? JSON.parse(process.env.FIREBASE_CONFIG).projectId
        : 'rag-prompt-library');
    const baseUrl = `http://127.0.0.1:5001/${projectId}/australia-southeast1`;

    // Start execution via HTTP (onCall protocol)
    const startRes = await request(baseUrl)
      .post('/execute_prompt_streaming')
      .set('Content-Type', 'application/json')
      .send({
        data: {
          promptId: TEST_PROMPT_ID,
          inputs: { name: 'Bob' },
          temperature: 0.1,
          maxTokens: 128,
          emulator_uid: TEST_UID,
        },
      })
      .expect(200);

    const startBody = startRes.body || {};
    const startResult = startBody.result || startBody.data || startBody; // emulator packs in result
    const execId = startResult?.execution_id || startResult?.id;
    expect(execId).toBeTruthy();

    // Poll chunks via HTTP
    let fromIndex = 0;
    let full = '';
    let completed = false;
    let safetyCounter = 0;

    while (!completed && safetyCounter < 50) {
      const chunkRes = await request(baseUrl)
        .post('/get_execution_chunks')
        .set('Content-Type', 'application/json')
        .send({ data: { executionId: execId, fromIndex, emulator_uid: TEST_UID } })
        .expect(200);
      const body = chunkRes.body || {};
      const result = body.result || body.data || body;
      const chunks = result?.chunks || [];
      for (const c of chunks) {
        full += c.content || '';
        fromIndex = Math.max(fromIndex, (c.index || 0) + 1);
      }
      completed = !!result?.completed;
      if (!completed) await new Promise((r) => setTimeout(r, 20));
      safetyCounter++;
    }

    expect(completed).toBe(true);
    expect(full).toContain('MOCK_RESPONSE:');
  }, 20000);

  it('should require authentication', async () => {
    const wrapGetChunks = testEnv.wrap(functionsModule.get_execution_chunks);
    await expect(
      wrapGetChunks({ executionId: 'does-not-matter', fromIndex: 0 }, /* context */ {})
    ).rejects.toBeTruthy();
  });
});

describe('Cancellation (onCall)', () => {
  it('should set execution status to cancelled', async () => {
    // Create a running execution
    const execRef = db.collection('executions').doc();
    await execRef.set({
      userId: TEST_UID,
      status: 'running',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const projectId =
      process.env.GCLOUD_PROJECT ||
      (process.env.FIREBASE_CONFIG
        ? JSON.parse(process.env.FIREBASE_CONFIG).projectId
        : 'rag-prompt-library');
    const baseUrl = `http://127.0.0.1:5001/${projectId}/australia-southeast1`;

    await request(baseUrl)
      .post('/cancel_streaming_execution')
      .set('Content-Type', 'application/json')
      .send({ data: { executionId: execRef.id, emulator_uid: TEST_UID } })
      .expect(200);

    const snap = await execRef.get();
    expect(snap.exists).toBe(true);
    expect(snap.data().status).toBe('cancelled');
  });
});
