/*
  Playwright global setup: ensure Firebase emulators have seed data and a test user.
  - Creates an E2E user in Auth emulator
  - Seeds Firestore emulator with prompts, documents, and executions
*/

// Node 18+ has global fetch

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } };

function fsString(v: string): FirestoreValue {
  return { stringValue: v };
}
function fsInt(v: number): FirestoreValue {
  return { integerValue: String(Math.trunc(v)) };
}
function fsDouble(v: number): FirestoreValue {
  return { doubleValue: v };
}
function fsBool(v: boolean): FirestoreValue {
  return { booleanValue: v };
}
function fsTime(d: Date): FirestoreValue {
  return { timestampValue: d.toISOString() };
}
function fsMap(fields: Record<string, FirestoreValue>): FirestoreValue {
  return { mapValue: { fields } };
}
function fsArray(values: FirestoreValue[]): FirestoreValue {
  return { arrayValue: { values } };
}

async function waitForEmulator(url: string, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status === 404) return; // 404 is fine for root path
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Emulator not reachable: ${url}`);
}

async function createAuthUser(email: string, password: string) {
  const url =
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok && data?.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(`Auth user creation failed: ${res.status} ${JSON.stringify(data)}`);
  }

  if (data?.localId) {
    return data.localId as string;
  }

  // If already exists, sign in to get localId
  const signInUrl =
    'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key';
  const siRes = await fetch(signInUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const siData = await siRes.json();
  if (!siRes.ok) throw new Error(`Auth sign-in failed: ${siRes.status} ${JSON.stringify(siData)}`);
  return siData.localId as string;
}

function docName(projectId: string, collection: string, id: string) {
  return `projects/${projectId}/databases/(default)/documents/${collection}/${id}`;
}

async function seedDocument(
  projectId: string,
  collection: string,
  id: string,
  fields: Record<string, FirestoreValue>
) {
  const url = `http://localhost:8080/v1/${docName(projectId, collection, id)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // Firestore emulator admin header to bypass rules
      Authorization: 'Bearer owner',
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore seed failed: ${res.status} ${text}`);
  }
}

async function globalSetup() {
  // If targeting a remote base URL (staging/prod), skip emulator seeding entirely
  const remoteBase = process.env.PLAYWRIGHT_BASE_URL || '';
  const isRemote = remoteBase && !remoteBase.includes('localhost');
  if (isRemote) {
    // eslint-disable-next-line no-console
    console.warn('[global-setup] Remote base URL detected; skipping emulator waits and seeding');
    return;
  }
  const projectId =
    process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'react-app-000730';
  const e2eEmail = process.env.VITE_E2E_EMAIL || 'e2e@test.com';
  const e2ePassword = process.env.VITE_E2E_PASSWORD || 'e2e12345';

  // Wait for emulators (best-effort)
  let emulatorsReady = true;
  try {
    await Promise.all([
      waitForEmulator('http://localhost:8080'),
      waitForEmulator('http://localhost:9099'),
      waitForEmulator('http://localhost:9199').catch(() => {}),
      waitForEmulator('http://localhost:5001').catch(() => {}),
    ]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[global-setup] Emulators not reachable, proceeding in UI-only mode');
    emulatorsReady = false;
  }

  // Ensure auth user (if auth emulator is available)
  let uid = 'e2e-user-placeholder';
  if (emulatorsReady) {
    uid = await createAuthUser(e2eEmail, e2ePassword);
  }

  const now = new Date();

  if (emulatorsReady) {
    // Seed a RAG-enabled prompt (root collection: prompts)
    await seedDocument(projectId, 'prompts', 'seed-prompt-1', {
      userId: fsString(uid),
      title: fsString('RAG Test Prompt'),
      content: fsString('Answer based on the documents: {{query}}'),
      description: fsString('Test prompt with RAG enabled'),
      category: fsString('General'),
      tags: fsArray([fsString('test'), fsString('rag')]),
      variables: fsArray([
        fsMap({
          name: fsString('query'),
          type: fsString('string'),
          description: fsString('User query'),
          required: fsBool(true),
        }),
      ]),
      isPublic: fsBool(false),
      model: fsString('z-ai/glm-4.5-air:free'),
      temperature: fsDouble(0.7),
      maxTokens: fsInt(2000),
      createdAt: fsTime(now),
      updatedAt: fsTime(now),
      executionCount: fsInt(0),
      version: fsInt(1),
      isDeleted: fsBool(false),
    });

    // Seed RAG documents for this user with various statuses
    const docs = [
      {
        id: 'seed-doc-completed',
        originalName: 'Test Document 1.pdf',
        filename: 'test-document-1.pdf',
        type: 'application/pdf',
        status: 'completed',
        size: 102400,
        metadata: { chunk_count: 5, contentType: 'application/pdf', originalSize: 102400 },
      },
      {
        id: 'seed-doc-processing',
        originalName: 'Processing Doc.txt',
        filename: 'processing-doc.txt',
        type: 'text/plain',
        status: 'processing',
        size: 2048,
        metadata: { chunk_count: 0, contentType: 'text/plain', originalSize: 2048 },
      },
      {
        id: 'seed-doc-failed',
        originalName: 'Bad Doc.docx',
        filename: 'bad-doc.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        status: 'failed',
        size: 4096,
        metadata: {
          chunk_count: 0,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          originalSize: 4096,
        },
      },
    ] as const;

    for (const d of docs) {
      await seedDocument(projectId, 'rag_documents', d.id, {
        uploadedBy: fsString(uid),
        originalName: fsString(d.originalName),
        filename: fsString(d.filename),
        filePath: fsString(`documents/${d.id}`),
        downloadURL: fsString('http://localhost/fake'),
        uploadedAt: fsTime(now),
        size: fsInt(d.size),
        type: fsString(d.type),
        status: fsString(d.status),
        chunks: fsArray([]),
        metadata: fsMap({
          originalSize: fsInt(d.metadata.originalSize),
          contentType: fsString(d.metadata.contentType),
          chunk_count: fsInt(d.metadata.chunk_count),
        }),
      });
    }

    // Seed an execution record at root 'executions' for history page
    await seedDocument(projectId, 'executions', 'seed-exec-1', {
      userId: fsString(uid),
      promptId: fsString('seed-prompt-1'),
      promptTitle: fsString('RAG Test Prompt'),
      model: fsString('z-ai/glm-4.5-air:free'),
      timestamp: fsTime(now),
      cost: fsDouble(0),
      status: fsString('success'),
      output: fsString('Test output with seeded data.'),
      variables: fsMap({ query: fsString('What is in the test document?') }),
      tokensUsed: fsInt(100),
      duration: fsDouble(2.5),
    });

    // eslint-disable-next-line no-console
    console.log('[global-setup] Firebase emulators seeded successfully');
  } else {
    // eslint-disable-next-line no-console
    console.warn('[global-setup] Skipping emulator seeding; running UI-only tests');
  }
}

export default globalSetup;
