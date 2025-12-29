const { onCall, onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const admin = require('firebase-admin');
const OpenAI = require('openai');
const { randomUUID, createHmac, timingSafeEqual } = require('crypto');
const { z } = require('zod');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

const { defineSecret } = require('firebase-functions/params');

// Secret: RESEND_API_KEY sourced from Secret Manager in prod; env var in emulator
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
// Secret: RESEND_WEBHOOK_SECRET used to verify incoming Resend webhook signatures
const RESEND_WEBHOOK_SECRET = defineSecret('RESEND_WEBHOOK_SECRET');

const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@example.com';
const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'EthosPrompt Notifications';

// Secret: OPENROUTER_API_KEY sourced from Secret Manager in prod; env var in emulator
const OPENROUTER_API_KEY = defineSecret('OPENROUTER_API_KEY');

// Secret: DEFAULT_SEQUENCE_QUOTATION - sequence ID for quotation follow-up emails
const DEFAULT_SEQUENCE_QUOTATION = defineSecret('DEFAULT_SEQUENCE_QUOTATION');

// Lazy OpenRouter client via Secret Manager or env (for emulator)
let _openrouterClient = null;

function createOpenRouterMock() {
  // Minimal mock that supports both streaming and non-streaming completions
  const mock = {
    chat: {
      completions: {
        create: async (opts) => {
          const userMsg = (opts?.messages || []).find((m) => m.role === 'user');
          const promptText = String(userMsg?.content || '').slice(0, 200);
          const mockContent = `MOCK_RESPONSE: ${promptText || 'Hello from mock model.'}`;

          if (opts?.stream) {
            // Return an async iterable to simulate streaming chunks
            const chunks = [];
            const size = 40;
            for (let i = 0; i < mockContent.length; i += size) {
              chunks.push(mockContent.slice(i, i + size));
            }
            return {
              async *[Symbol.asyncIterator]() {
                for (const piece of chunks) {
                  await new Promise((r) => setTimeout(r, 5));
                  yield { choices: [{ delta: { content: piece }, finish_reason: null }] };
                }
                yield { choices: [{ delta: {}, finish_reason: 'stop' }] };
              },
            };
          }

          // Non-streaming response
          return {
            choices: [
              {
                message: { content: mockContent },
                finish_reason: 'stop',
              },
            ],
            usage: { total_tokens: Math.max(1, Math.ceil(mockContent.length / 4)) },
          };
        },
      },
    },
  };
  return mock;
}

function getOpenRouter() {
  if (_openrouterClient) return _openrouterClient;

  // Zero-billing mode for tests and local emulator runs
  // Detect emulator via multiple standard env vars set by Firebase emulators
  const isAnyEmulator =
    String(process.env.FUNCTIONS_EMULATOR || '').toLowerCase() === 'true' ||
    !!process.env.FIREBASE_EMULATOR_HUB ||
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;

  const useMockEnv =
    String(process.env.OPENROUTER_USE_MOCK ?? (isAnyEmulator ? 'true' : 'false')).toLowerCase() ===
    'true';

  if (useMockEnv) {
    console.log('[httpApi] Using OpenRouter MOCK client (no billing).');
    _openrouterClient = createOpenRouterMock();
    return _openrouterClient;
  }

  const apiKey = process.env.OPENROUTER_API_KEY || OPENROUTER_API_KEY.value();
  _openrouterClient = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  });
  return _openrouterClient;
}

async function sendResendEmail({ to, subject, html, text, tags }) {
  // Detect emulator environment (similar to getOpenRouter)
  const isAnyEmulator =
    String(process.env.FUNCTIONS_EMULATOR || '').toLowerCase() === 'true' ||
    !!process.env.FIREBASE_EMULATOR_HUB ||
    !!process.env.FIRESTORE_EMULATOR_HOST ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;

  const apiKey =
    process.env.RESEND_API_KEY ||
    (RESEND_API_KEY && typeof RESEND_API_KEY.value === 'function'
      ? RESEND_API_KEY.value()
      : undefined);

  const useMockEnv =
    !apiKey ||
    String(process.env.RESEND_USE_MOCK ?? (isAnyEmulator ? 'true' : 'false'))
      .toLowerCase()
      .trim() === 'true';

  const recipients = Array.isArray(to) ? to : [to];

  if (useMockEnv) {
    const mockId = `mock_resend_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    console.log('[email] Using Resend MOCK client (no billing).', {
      to: recipients,
      subject,
      tags,
    });
    return { id: mockId, mocked: true };
  }

  // Normalize tags into Resend's expected [{ name, value }] shape
  let normalizedTags;
  if (Array.isArray(tags)) {
    normalizedTags = tags
      .map((tag) => {
        if (!tag) return null;
        if (typeof tag === 'string') {
          return { name: 'label', value: tag };
        }
        if (
          tag &&
          typeof tag === 'object' &&
          typeof tag.name === 'string' &&
          typeof tag.value === 'string'
        ) {
          return { name: tag.name, value: tag.value };
        }
        return null;
      })
      .filter(Boolean);
    if (!normalizedTags.length) {
      normalizedTags = undefined;
    }
  }

  const payload = {
    from: `${RESEND_FROM_NAME} <${RESEND_FROM_EMAIL}>`,
    to: recipients,
    subject,
    html,
    text,
    tags: normalizedTags,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const textBody = await response.text().catch(() => '');
    throw new Error(`Resend API error: HTTP ${response.status} ${textBody}`);
  }

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    // Ignore JSON parse errors and return minimal data
  }
  return data;
}
// ============================================================================
// Resend Webhook Verification & Handling
// ============================================================================

function getResendWebhookSecret() {
  const envSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (envSecret && envSecret.trim()) return envSecret.trim();
  if (RESEND_WEBHOOK_SECRET && typeof RESEND_WEBHOOK_SECRET.value === 'function') {
    try {
      const fromSecret = RESEND_WEBHOOK_SECRET.value();
      if (fromSecret && typeof fromSecret === 'string' && fromSecret.trim()) {
        return fromSecret.trim();
      }
    } catch (e) {
      console.warn('[resend_webhook] Failed to load RESEND_WEBHOOK_SECRET from Secret Manager', e);
    }
  }
  return '';
}

function verifyResendSignature(headers, payload) {
  const id = headers['svix-id'] || headers['Svix-Id'] || headers['SVIX-ID'];
  const timestamp =
    headers['svix-timestamp'] || headers['Svix-Timestamp'] || headers['SVIX-TIMESTAMP'];
  const signatureHeader =
    headers['svix-signature'] || headers['Svix-Signature'] || headers['SVIX-SIGNATURE'];

  if (!id || !timestamp || !signatureHeader) {
    console.warn('[resend_webhook] Missing Svix signature headers');
    return false;
  }

  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum)) {
    console.warn('[resend_webhook] Invalid svix-timestamp header');
    return false;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const tolerance = 5 * 60; // 5 minutes
  if (Math.abs(nowSec - tsNum) > tolerance) {
    console.warn('[resend_webhook] Webhook timestamp outside tolerance');
    return false;
  }

  const secret = getResendWebhookSecret();
  if (!secret) {
    console.warn(
      '[resend_webhook] RESEND_WEBHOOK_SECRET is not configured; skipping signature verification.'
    );
    return true;
  }

  const signedContent = `${id}.${timestamp}.${payload}`;
  const secretPart = secret.startsWith('whsec_') ? secret.split('_', 2)[1] : secret;
  const secretBytes = Buffer.from(secretPart, 'base64');
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');

  const providedParts = String(signatureHeader)
    .split(' ')
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of providedParts) {
    const pieces = part.split(',', 2);
    if (pieces.length !== 2) continue;
    const sig = pieces[1];
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(sig);
    if (expectedBuf.length !== sigBuf.length) continue;
    if (timingSafeEqual(expectedBuf, sigBuf)) {
      return true;
    }
  }

  console.warn('[resend_webhook] Signature verification failed');
  return false;
}

function mapResendTypeToEmailEventType(type) {
  if (!type || typeof type !== 'string') return null;
  if (!type.startsWith('email.')) return null;
  const suffix = type.slice('email.'.length);
  switch (suffix) {
    case 'sent':
      return 'sent';
    case 'delivered':
      return 'delivered';
    case 'delivery_delayed':
      return 'failed';
    case 'bounced':
      return 'bounced';
    case 'opened':
      return 'opened';
    case 'clicked':
      return 'clicked';
    case 'complained':
      return 'complained';
    case 'failed':
      return 'failed';
    default:
      return null;
  }
}

async function handleResendWebhookEvent(event) {
  if (!event || typeof event !== 'object') return;

  const type = event.type;
  const data = event.data || {};
  const createdAtStr = event.created_at || data.created_at || null;
  const emailId = data.email_id || data.id || null;

  if (!type || !emailId) {
    return;
  }

  const eventType = mapResendTypeToEmailEventType(type);
  if (!eventType) {
    return;
  }

  let eventTimestamp;
  if (createdAtStr && typeof createdAtStr === 'string') {
    const d = new Date(createdAtStr);
    eventTimestamp = Number.isNaN(d.getTime())
      ? admin.firestore.Timestamp.now()
      : admin.firestore.Timestamp.fromDate(d);
  } else {
    eventTimestamp = admin.firestore.Timestamp.now();
  }

  const jobsSnap = await db
    .collection('email_jobs')
    .where('providerMessageId', '==', String(emailId))
    .limit(20)
    .get();

  if (jobsSnap.empty) {
    console.log('[resend_webhook] No email_jobs found for email_id', emailId);
    return;
  }

  const batch = db.batch();
  const nowTs = FieldValue.serverTimestamp();

  jobsSnap.docs.forEach((doc) => {
    const jobRef = doc.ref;
    const jobData = doc.data() || {};
    const updates = { updatedAt: nowTs };

    switch (eventType) {
      case 'sent':
      case 'delivered': {
        updates.status = 'sent';
        if (!jobData.sentAt) {
          updates.sentAt = eventTimestamp;
        }
        break;
      }
      case 'opened': {
        if (!jobData.openedAt) {
          updates.openedAt = eventTimestamp;
        }
        break;
      }
      case 'clicked': {
        if (!jobData.clickedAt) {
          updates.clickedAt = eventTimestamp;
        }
        break;
      }
      case 'bounced': {
        updates.status = 'failed';
        updates.bouncedAt = eventTimestamp;
        if (data.bounce && typeof data.bounce.message === 'string') {
          updates.lastError = data.bounce.message;
        }
        break;
      }
      case 'complained': {
        updates.status = 'failed';
        if (!updates.lastError) {
          updates.lastError = 'Recipient complained about the email';
        }
        break;
      }
      case 'failed': {
        updates.status = 'failed';
        if (data.error && typeof data.error.message === 'string') {
          updates.lastError = data.error.message;
        }
        break;
      }
      default:
        break;
    }

    batch.update(jobRef, updates);
  });

  const eventsCol = db.collection('email_events');
  jobsSnap.docs.forEach((doc) => {
    const jobId = doc.id;
    const eventDoc = {
      emailJobId: jobId,
      type: eventType,
      providerEventId: String(emailId),
      timestamp: eventTimestamp,
      rawPayload: event,
      createdAt: nowTs,
    };
    const ref = eventsCol.doc();
    batch.set(ref, eventDoc);
  });

  await batch.commit();
  const jobIds = jobsSnap.docs.map((d) => d.id);
  console.log('[resend_webhook] Updated jobs from webhook event', {
    type: eventType,
    emailId,
    jobIds,
  });
}

exports.resend_webhook = onRequest(
  {
    region: 'australia-southeast1',
    secrets: [RESEND_WEBHOOK_SECRET],
    timeoutSeconds: 60,
    memory: '256MB',
  },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const headers = req.headers || {};

    // Use rawBody when available to avoid mutation before verification
    let payload;
    if (req.rawBody) {
      payload = req.rawBody.toString('utf8');
    } else if (typeof req.body === 'string') {
      payload = req.body;
    } else {
      payload = JSON.stringify(req.body || {});
    }

    try {
      if (!verifyResendSignature(headers, payload)) {
        res.status(400).send('Invalid webhook signature');
        return;
      }
    } catch (err) {
      console.error('[resend_webhook] Signature verification error', err);
      res.status(400).send('Invalid webhook');
      return;
    }

    let event;
    try {
      event = JSON.parse(payload);
    } catch (err) {
      console.error('[resend_webhook] Failed to parse JSON payload', err);
      res.status(400).send('Invalid JSON payload');
      return;
    }

    try {
      await handleResendWebhookEvent(event);
    } catch (err) {
      console.error('[resend_webhook] Error handling event', err);
      // We still return 200 so Resend doesn't keep retrying forever
    }

    res.status(200).json({ success: true });
  }
);

// ============================================================================
// Conversation Context Tracking (In-Memory Cache with TTL)
// ============================================================================

/**
 * Global in-memory cache for conversation contexts
 * Stores recently listed prompts to enable contextual commands like "delete it"
 * TTL: 10 minutes (600,000ms)
 */
const conversationContexts = new Map();
const CONTEXT_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Store conversation context (e.g., recently listed prompts)
 * @param {string} conversationId - Unique conversation ID
 * @param {string} userId - User ID for security
 * @param {Array} prompts - Array of {id, title} objects
 */
function storeConversationContext(conversationId, userId, prompts) {
  const now = Date.now();
  const context = {
    conversationId,
    userId,
    lastListedPrompts: prompts.map((p, idx) => ({
      id: p.id,
      title: p.title || '',
      position: idx + 1, // 1-indexed for "first", "second", etc.
    })),
    timestamp: now,
    expiresAt: now + CONTEXT_TTL_MS,
  };
  conversationContexts.set(conversationId, context);

  // Cleanup expired contexts (run periodically)
  cleanupExpiredContexts();
}

/**
 * Retrieve conversation context
 * @param {string} conversationId - Unique conversation ID
 * @param {string} userId - User ID for security validation
 * @returns {Object|null} Context object or null if not found/expired
 */
function getConversationContext(conversationId, userId) {
  const context = conversationContexts.get(conversationId);
  if (!context) return null;

  // Check expiration
  if (Date.now() > context.expiresAt) {
    conversationContexts.delete(conversationId);
    return null;
  }

  // Validate user ID for security
  if (context.userId !== userId) {
    return null;
  }

  return context;
}

/**
 * Cleanup expired contexts from memory
 */
function cleanupExpiredContexts() {
  const now = Date.now();
  for (const [convId, ctx] of conversationContexts.entries()) {
    if (now > ctx.expiresAt) {
      conversationContexts.delete(convId);
    }
  }
}

// Extended helpers for pending actions (e.g., delete confirmation)
/**
 * Set a pending delete action in the conversation context
 * @param {string} conversationId
 * @param {string} userId
 * @param {{ids: string[], items: Array<{id:string,title:string}>}} pending
 */
function setPendingDelete(conversationId, userId, pending) {
  const now = Date.now();
  let ctx = conversationContexts.get(conversationId);
  if (!ctx || ctx.userId !== userId) {
    ctx = {
      conversationId,
      userId,
      lastListedPrompts: [],
      timestamp: now,
      expiresAt: now + CONTEXT_TTL_MS,
    };
  }
  ctx.pendingDelete = {
    ids: Array.isArray(pending?.ids) ? pending.ids.slice(0, 50) : [],
    items: Array.isArray(pending?.items) ? pending.items.slice(0, 50) : [],
    createdAt: now,
  };
  ctx.timestamp = now;
  ctx.expiresAt = now + CONTEXT_TTL_MS;
  conversationContexts.set(conversationId, ctx);
}

/**
 * Get pending delete action (if any). Returns null if none/expired/user mismatch
 */
function getPendingDelete(conversationId, userId) {
  const ctx = getConversationContext(conversationId, userId);
  return ctx && ctx.pendingDelete ? ctx.pendingDelete : null;
}

/**
 * Clear pending delete action (if any)
 */
function clearPendingDelete(conversationId) {
  const ctx = conversationContexts.get(conversationId);
  if (ctx && ctx.pendingDelete) {
    delete ctx.pendingDelete;
    ctx.timestamp = Date.now();
    ctx.expiresAt = ctx.timestamp + CONTEXT_TTL_MS;
    conversationContexts.set(conversationId, ctx);
  }
}

// Persistence helpers for conversation context (bridges memory across requests)
async function persistConversationContext(conversationId, userId) {
  try {
    const ctx = conversationContexts.get(conversationId);
    if (!ctx || ctx.userId !== userId) return;
    await db
      .collection('chat_conversations')
      .doc(`${userId}_${conversationId}`)
      .set(
        {
          conversationId,
          userId,
          lastListedPrompts: Array.isArray(ctx.lastListedPrompts) ? ctx.lastListedPrompts : [],
          pendingDelete: ctx.pendingDelete || null,
          timestamp: typeof ctx.timestamp === 'number' ? ctx.timestamp : Date.now(),
          expiresAt: typeof ctx.expiresAt === 'number' ? ctx.expiresAt : Date.now() + CONTEXT_TTL_MS,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  } catch (e) {
    console.error('[chat] Failed to persist conversation context:', e);
  }
}

async function loadConversationContext(conversationId, userId) {
  try {
    const docId = `${userId}_${conversationId}`;
    const snap = await db.collection('chat_conversations').doc(docId).get();
    if (!snap.exists) return null;
    const data = snap.data();
    if (!data || data.userId !== userId) return null;
    const ctx = {
      conversationId,
      userId,
      lastListedPrompts: Array.isArray(data.lastListedPrompts) ? data.lastListedPrompts : [],
      pendingDelete: data.pendingDelete || null,
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      expiresAt: typeof data.expiresAt === 'number' ? data.expiresAt : Date.now() + CONTEXT_TTL_MS,
    };
    conversationContexts.set(conversationId, ctx);
    return ctx;
  } catch (e) {
    console.error('[chat] Failed to load conversation context:', e);
    return null;
  }
}

async function ensureConversationContext(conversationId, userId) {
  const ctx = getConversationContext(conversationId, userId);
  if (ctx) return ctx;
  return await loadConversationContext(conversationId, userId);
}

async function getPendingDeleteAsync(conversationId, userId) {
  const ctx =
    getConversationContext(conversationId, userId) ||
    (await loadConversationContext(conversationId, userId));
  return ctx && ctx.pendingDelete ? ctx.pendingDelete : null;
}

async function setPendingDeleteAsync(conversationId, userId, pending) {
  setPendingDelete(conversationId, userId, pending);
  await persistConversationContext(conversationId, userId);
}

async function clearPendingDeleteAsync(conversationId) {
  clearPendingDelete(conversationId);
  const ctx = conversationContexts.get(conversationId);
  if (ctx && ctx.userId) {
    await persistConversationContext(conversationId, ctx.userId);
  }
}

// Proxy to preserve existing openrouter.* call sites
const openrouter = new Proxy(
  {},
  {
    get(_target, prop) {
      return getOpenRouter()[prop];
    },
  }
);

// ============================================================================
// Scheduled processor for scheduled email jobs
// ============================================================================

exports.process_scheduled_email_jobs = onSchedule(
  {
    region: 'australia-southeast1',
    schedule: 'every 5 minutes',
    timeZone: 'Australia/Sydney',
    timeoutSeconds: 300,
    memory: '512MB',
  },
  async (event) => {
    const now = new Date();
    const cutoff = admin.firestore.Timestamp.fromDate(now);

    console.log('[email_jobs] Processing scheduled email jobs at', now.toISOString());

    const batchSize = 20;
    const jobsSnap = await db
      .collection('email_jobs')
      .where('status', '==', 'scheduled')
      .where('scheduledAt', '<=', cutoff)
      .orderBy('scheduledAt', 'asc')
      .limit(batchSize)
      .get();

    if (jobsSnap.empty) {
      console.log('[email_jobs] No scheduled jobs due');
      return;
    }

    let processed = 0;

    for (const doc of jobsSnap.docs) {
      const jobId = doc.id;
      const jobData = doc.data() || {};

      const contactId = jobData.contactId;
      const templateId = jobData.templateId;
      const sequenceId = jobData.sequenceId || null;
      const stepNumber = jobData.stepNumber || null;

      if (!contactId || !templateId) {
        console.warn('[email_jobs] Skipping job with missing contactId/templateId', jobId);
        continue;
      }

      const jobRef = doc.ref;

      try {
        // Re-check status inside transaction to avoid double-send in concurrent runs
        const txResult = await db.runTransaction(async (tx) => {
          const latestSnap = await tx.get(jobRef);
          if (!latestSnap.exists) {
            return { skip: true, reason: 'missing' };
          }
          const latest = latestSnap.data() || {};
          if (latest.status !== 'scheduled') {
            return { skip: true, reason: `status=${latest.status}` };
          }
          tx.update(jobRef, {
            status: 'sending',
            updatedAt: FieldValue.serverTimestamp(),
          });
          return { skip: false };
        });

        if (txResult.skip) {
          console.log('[email_jobs] Skipping job due to', txResult.reason, jobId);
          continue;
        }

        const contactSnap = await db.collection('contacts').doc(contactId).get();
        if (!contactSnap.exists) {
          console.warn('[email_jobs] Contact missing for job', jobId, contactId);
          await jobRef.update({
            status: 'failed',
            lastError: 'Contact not found',
            updatedAt: FieldValue.serverTimestamp(),
          });
          continue;
        }
        const contactData = contactSnap.data() || {};
        const toEmail =
          contactData.email && typeof contactData.email === 'string'
            ? contactData.email.trim().toLowerCase()
            : '';
        if (!toEmail) {
          console.warn('[email_jobs] Contact email missing for job', jobId, contactId);
          await jobRef.update({
            status: 'failed',
            lastError: 'Contact email is missing',
            updatedAt: FieldValue.serverTimestamp(),
          });
          continue;
        }

        const templateSnap = await db.collection('email_templates').doc(templateId).get();
        if (!templateSnap.exists) {
          console.warn('[email_jobs] Template missing for job', jobId, templateId);
          await jobRef.update({
            status: 'failed',
            lastError: 'Email template not found',
            updatedAt: FieldValue.serverTimestamp(),
          });
          continue;
        }
        const template = templateSnap.data() || {};

        const subjectBase = template.subject || '';
        const htmlBase = template.bodyHtml || '';
        const textBase = template.bodyText || '';

        function renderTemplate(str) {
          if (!str) return '';
          return str.replace(/{{\s*([^}]+)\s*}}/g, (match, keyRaw) => {
            const key = keyRaw.trim();
            if (!key) return '';

            if (key.startsWith('contact.')) {
              const field = key.slice('contact.'.length);
              const value = contactData[field];
              return value != null ? String(value) : '';
            }

            return '';
          });
        }

        const subject = renderTemplate(subjectBase);
        const html = renderTemplate(htmlBase);
        const text = textBase ? renderTemplate(textBase) : '';

        let providerMessageId = null;
        try {
          const sendResult = await sendResendEmail({
            to: toEmail,
            subject,
            html,
            text,
            tags: ['contact_management', 'sequence'],
          });
          providerMessageId = sendResult && sendResult.id ? String(sendResult.id) : null;

          await jobRef.update({
            status: 'sent',
            providerMessageId,
            sentAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (err) {
          console.error('[email_jobs] Failed to send scheduled email job', jobId, err);
          await jobRef.update({
            status: 'failed',
            lastError: String(err && err.message ? err.message : err),
            updatedAt: FieldValue.serverTimestamp(),
          });
          continue;
        }

        // Log contact activity for the sent email
        try {
          const activityDoc = {
            contactId,
            type: sequenceId ? 'system_email' : 'email',
            direction: 'outbound',
            subject: subject || null,
            snippet: subject || template.subject || 'Scheduled email',
            content: '',
            createdByUserId: jobData.createdByUserId || null,
            createdByName: null,
            timestamp: FieldValue.serverTimestamp(),
            metadata: {
              channel: 'resend',
              emailJobId: jobId,
              sequenceId: sequenceId || null,
              stepNumber: stepNumber || null,
            },
          };

          Object.keys(activityDoc).forEach((key) => {
            if (activityDoc[key] === undefined) {
              delete activityDoc[key];
            }
          });

          await db.collection('contact_activities').add(activityDoc);

          // Update contact lastContactedAt
          await db.collection('contacts').doc(contactId).set(
            {
              lastContactedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        } catch (err) {
          console.warn('[email_jobs] Failed to log activity for job', jobId, err);
        }

        processed += 1;
      } catch (outerErr) {
        console.error('[email_jobs] Unexpected error processing job', jobId, outerErr);
      }
    }

    console.log('[email_jobs] Processed scheduled jobs count:', processed);
  }
);

// Default model configuration (validated working free model)
// GLM 4.5 Air: Fastest validated model (2.61s avg), 100% success rate, 1M context, agent-optimized
const DEFAULT_MODEL = 'z-ai/glm-4.5-air:free';

// Main API endpoint - Firebase callable functions handle CORS automatically
exports.api = onCall(
  {
    region: 'australia-southeast1',
    secrets: [OPENROUTER_API_KEY],
    timeoutSeconds: 120, // 2 minutes for external API calls
    memory: '256MB',
    maxInstances: 100,
    // Disable App Check for staging environment (enable in production)
    enforceAppCheck: false, // Set to true in production
    consumeAppCheckToken: false, // Set to true in production
  },
  async (request) => {
    const data = request.data || {};
    const endpoint = data.endpoint || 'health';

    switch (endpoint) {
      case 'health':
        return {
          status: 'success',
          message: 'API working',
          region: 'australia-southeast1',
        };

      case 'execute_prompt':
        return await executePrompt(request);

      case 'test_openrouter_connection':
        return await testOpenRouterConnection();

      case 'get_available_models':
        return getAvailableModels();

      case 'generate_prompt':
        return await generatePrompt(request);

      default:
        return {
          status: 'error',
          message: `Unknown endpoint: ${endpoint}`,
        };
    }
  }
);

// ============================================================================
// Contact Submission & Lead Capture (HTTP endpoints)
// ============================================================================

// Basic sanitization to prevent XSS vectors in user-provided strings
function sanitizeInput(input) {
  return String(input || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function generateContactRef() {
  const year = new Date().getFullYear();
  const rnd = Math.floor(Math.random() * 900000 + 100000);
  return `CR-${year}-${rnd}`;
}

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  service: z.string().min(1),
  message: z.string().min(1),
  source: z.string().optional(),
  metadata: z
    .object({
      submittedAt: z.string(),
      userAgent: z.string().optional(),
      referrerUrl: z.string().optional(),
    })
    .optional(),
});

exports.submit_contact = onRequest(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 30,
    memory: '256MB',
  },
  async (req, res) => {
    // CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      const body = req.body || {};
      const parsed = contactSchema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, error: 'Validation failed', details: parsed.error.errors });
      }

      const data = parsed.data;
      const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      // Rate limit: by IP and by email within last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const ipQuery = await db
        .collection('contact_submissions')
        .where('metadata.ipAddress', '==', String(clientIP))
        .where('createdAt', '>', oneHourAgo)
        .get();
      if (ipQuery.size >= 5) {
        return res
          .status(429)
          .json({ success: false, error: 'Rate limit exceeded. Please try again later.' });
      }

      const emailQuery = await db
        .collection('contact_submissions')
        .where('email', '==', data.email)
        .where('createdAt', '>', oneHourAgo)
        .get();
      if (!emailQuery.empty) {
        return res
          .status(409)
          .json({ success: false, error: 'A recent submission with this email already exists.' });
      }

      const reference = generateContactRef();

      const doc = {
        reference,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),

        name: sanitizeInput(data.name),
        email: sanitizeInput(data.email),
        phone: data.phone ? sanitizeInput(data.phone) : null,
        service: sanitizeInput(data.service),
        message: sanitizeInput(data.message),
        source: data.source ? sanitizeInput(data.source) : 'direct',

        metadata: {
          submittedAt: data.metadata?.submittedAt || new Date().toISOString(),
          userAgent: data.metadata?.userAgent || '',
          referrerUrl: data.metadata?.referrerUrl || '',
          ipAddress: String(clientIP),
        },
      };

      await db.collection('contact_submissions').add(doc);

      // TODO: integrate email notifications (user + sales) if required

      return res.status(200).json({ success: true, reference });
    } catch (e) {
      console.error('[submit_contact] error:', e);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

const leadSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  service: z.string().optional(),
  source: z.string().optional(),
  timestamp: z.string().optional(),
});

exports.capture_lead = onRequest(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 15,
    memory: '256MB',
  },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
      const body = req.body || {};
      const parsed = leadSchema.safeParse(body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ success: false, error: 'Validation failed', details: parsed.error.errors });
      }
      const data = parsed.data;
      const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      // De-dupe by email within last 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recent = await db
        .collection('marketing_leads')
        .where('email', '==', data.email)
        .where('createdAt', '>', since)
        .get();
      if (!recent.empty) {
        return res.status(200).json({ success: true });
      }

      await db.collection('marketing_leads').add({
        createdAt: FieldValue.serverTimestamp(),
        email: sanitizeInput(data.email),
        name: data.name ? sanitizeInput(data.name) : '',
        service: data.service ? sanitizeInput(data.service) : '',
        source: data.source ? sanitizeInput(data.source) : 'exit_intent',
        ipAddress: String(clientIP),
      });

      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('[capture_lead] error:', e);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Unified lead ingestion schema for consolidated contacts pipeline
const leadIngestionSchema = z.object({
  source: z.enum(['roi_calculator', 'contact_form', 'quotation', 'exit_intent']).optional(),
  service: z.string().optional(),
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  meta: z
    .object({
      roiSnapshot: z.any().optional(),
      quotationId: z.string().optional(),
      contactFormId: z.string().optional(),
      message: z.string().optional(),
      leadMagnet: z.string().optional(),
    })
    .optional(),
  metadata: z
    .object({
      userAgent: z.string().optional(),
      referrerUrl: z.string().optional(),
      utmParams: z.record(z.any()).optional(),
    })
    .optional(),
});

const contactCreateSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    company: z.string().optional(),
    jobTitle: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    status: z.string().optional(),
    source: z.string().optional(),
    ownerUserId: z.string().nullable().optional(),
    team: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    notesSummary: z.string().optional(),
    nextFollowUpAt: z.union([z.string(), z.date(), z.null()]).optional(),
    meta: z.record(z.any()).optional(),
  })
  .strict();

const contactUpdateSchema = contactCreateSchema.partial();

const contactActivityCreateSchema = z
  .object({
    type: z.enum(['email', 'call', 'meeting', 'note', 'system_email']).optional(),
    direction: z.enum(['inbound', 'outbound', 'internal']).optional(),
    subject: z.string().optional(),
    content: z.string().optional(),
    snippet: z.string().optional(),
    metadata: z
      .object({
        channel: z.string().optional(),
        emailJobId: z.string().optional(),
        attachments: z.array(z.string()).optional(),
      })
      .catchall(z.any())
      .optional(),
  })
  .strict();

const scheduleSequenceBodySchema = z
  .object({
    sequenceId: z.string().min(1).max(200),
  })
  .strict();

const sendEmailBodySchema = z
  .object({
    templateId: z.string().min(1).max(200),
    subjectOverride: z.string().max(300).optional(),
    bodyHtmlOverride: z.string().max(50000).optional(),
    bodyTextOverride: z.string().max(50000).optional(),
    variables: z.record(z.any()).optional(),
  })
  .strict();

const DEFAULT_SEQUENCES_BY_SOURCE = {
  roi_calculator: process.env.DEFAULT_SEQUENCE_ROI_CALCULATOR || '',
  contact_form: process.env.DEFAULT_SEQUENCE_CONTACT_FORM || '',
  quotation: process.env.DEFAULT_SEQUENCE_QUOTATION || '',
  exit_intent: process.env.DEFAULT_SEQUENCE_EXIT_INTENT || '',
};

async function autoScheduleDefaultSequenceForContact(contactId, source) {
  try {
    let sequenceId = DEFAULT_SEQUENCES_BY_SOURCE[source];
    if (source === 'quotation') {
      sequenceId = process.env.DEFAULT_SEQUENCE_QUOTATION || DEFAULT_SEQUENCE_QUOTATION.value();
    }

    if (!sequenceId) {
      return null;
    }

    const contactRef = db.collection('contacts').doc(contactId);
    const contactSnap = await contactRef.get();
    if (!contactSnap.exists) {
      console.warn('[auto_sequence] Contact not found for auto sequence', contactId, source);
      return null;
    }
    const contactData = contactSnap.data() || {};
    const toEmail =
      contactData.email && typeof contactData.email === 'string'
        ? contactData.email.trim().toLowerCase()
        : '';
    if (!toEmail) {
      console.warn('[auto_sequence] Contact email missing for auto sequence', contactId, source);
      return null;
    }

    const sequenceSnap = await db.collection('email_sequences').doc(sequenceId).get();
    if (!sequenceSnap.exists) {
      console.warn('[auto_sequence] Email sequence not found for source', source, sequenceId);
      return null;
    }
    const sequence = sequenceSnap.data() || {};
    if (sequence.isActive === false) {
      console.log('[auto_sequence] Email sequence is not active for source', source, sequenceId);
      return null;
    }

    const stepsRaw = Array.isArray(sequence.steps) ? sequence.steps.slice() : [];
    if (!stepsRaw.length) {
      console.log('[auto_sequence] Email sequence has no steps for source', source, sequenceId);
      return null;
    }

    stepsRaw.sort((a, b) => {
      const aNum = Number(a && a.stepNumber);
      const bNum = Number(b && b.stepNumber);
      const aValid = Number.isFinite(aNum) ? aNum : 0;
      const bValid = Number.isFinite(bNum) ? bNum : 0;
      return aValid - bValid;
    });

    const now = new Date();
    const nowTs = FieldValue.serverTimestamp();
    const jobsCol = db.collection('email_jobs');

    // Avoid double-scheduling the same sequence for this contact
    try {
      const existingJobsSnap = await jobsCol
        .where('contactId', '==', contactId)
        .where('sequenceId', '==', sequenceId)
        .limit(1)
        .get();
      if (!existingJobsSnap.empty) {
        console.log(
          '[auto_sequence] Sequence already scheduled for contact',
          contactId,
          source,
          sequenceId
        );
        return null;
      }
    } catch (err) {
      console.warn(
        '[auto_sequence] Failed to check existing jobs for contact',
        contactId,
        source,
        sequenceId,
        err
      );
    }

    let cumulativeDays = 0;
    let firstScheduledTs = null;

    for (const step of stepsRaw) {
      const templateId = step && typeof step.templateId === 'string' ? step.templateId : '';
      if (!templateId) continue;

      const waitDaysNum = Number(step.waitDays);
      const waitDays = Number.isFinite(waitDaysNum) && waitDaysNum >= 0 ? waitDaysNum : 0;
      cumulativeDays += waitDays;

      const stepNumberRaw = Number(step.stepNumber);
      const stepNumber =
        Number.isFinite(stepNumberRaw) && stepNumberRaw > 0 ? stepNumberRaw : undefined;

      const scheduledDate = new Date(now.getTime() + cumulativeDays * 24 * 60 * 60 * 1000);
      const scheduledTs = admin.firestore.Timestamp.fromDate(scheduledDate);

      if (!firstScheduledTs) {
        firstScheduledTs = scheduledTs;
      }

      const jobDoc = {
        contactId,
        sequenceId,
        stepNumber: stepNumber || null,
        templateId,
        scheduleType: 'scheduled',
        scheduledAt: scheduledTs,
        status: 'scheduled',
        provider: 'resend',
        providerMessageId: null,
        sentAt: null,
        openedAt: null,
        clickedAt: null,
        bouncedAt: null,
        lastError: null,
        createdByUserId: null,
        createdAt: nowTs,
        updatedAt: nowTs,
      };

      await jobsCol.add(jobDoc);
    }

    if (firstScheduledTs) {
      try {
        await contactRef.set(
          {
            nextFollowUpAt: firstScheduledTs,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('[auto_sequence] Failed to update nextFollowUpAt for contact', contactId, err);
      }
    }

    return { contactId, sequenceId };
  } catch (err) {
    console.error(
      '[auto_sequence] Failed to auto-schedule default sequence for contact',
      contactId,
      source,
      err
    );
    return null;
  }
}

async function handleLeadIngest(req, res, overrideSource) {
  try {
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    const body = {
      ...rawBody,
      source: overrideSource || rawBody.source,
    };

    const parsed = leadIngestionSchema.safeParse(body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parsed.error.errors,
      });
    }

    const data = parsed.data;
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    // Basic IP rate limiting: 10 leads/minute per IP
    const rate = await checkRateLimit(`ip:${clientIP}`, 'lead_ingest', 10, 60 * 1000);
    if (!rate.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      });
    }

    const emailNorm = sanitizeInput(data.email).toLowerCase();
    const nameSan = data.name ? sanitizeInput(data.name) : '';
    const companySan = data.company ? sanitizeInput(data.company) : '';
    const phoneSan = data.phone ? sanitizeInput(data.phone) : '';
    const serviceSan = data.service ? sanitizeInput(data.service) : '';
    const messageSan = data.meta?.message ? sanitizeInput(data.meta.message) : '';
    const source = data.source || 'other';

    const contactsCol = db.collection('contacts');
    const existingSnap = await contactsCol.where('email', '==', emailNorm).limit(1).get();

    const nowTs = FieldValue.serverTimestamp();
    let contactId = null;
    let isNew = false;

    const originalLeadIdsUpdate = {};
    if (data.meta?.quotationId) {
      originalLeadIdsUpdate.quotationId = data.meta.quotationId;
    }
    if (data.meta?.contactFormId) {
      originalLeadIdsUpdate.contactFormId = data.meta.contactFormId;
    }

    if (existingSnap.empty) {
      isNew = true;

      const metaPayload = {
        roiSnapshot: data.meta?.roiSnapshot || null,
        metadata: {
          userAgent: data.metadata?.userAgent || '',
          referrerUrl: data.metadata?.referrerUrl || '',
          utmParams: data.metadata?.utmParams || {},
        },
      };

      if (Object.keys(originalLeadIdsUpdate).length > 0) {
        metaPayload.originalLeadIds = originalLeadIdsUpdate;
      }

      if (data.meta?.leadMagnet) {
        metaPayload.leadMagnet = data.meta.leadMagnet;
      }

      if (serviceSan) {
        metaPayload.service = serviceSan;
      }

      const contactDoc = {
        name: nameSan,
        email: emailNorm,
        company: companySan,
        jobTitle: null,
        phone: phoneSan || null,
        status: 'new',
        source,
        ownerUserId: null,
        team: null,
        tags: [],
        notesSummary: messageSan || '',
        lastContactedAt: nowTs,
        nextFollowUpAt: null,
        createdAt: nowTs,
        updatedAt: nowTs,
        meta: metaPayload,
      };

      const ref = await contactsCol.add(contactDoc);
      contactId = ref.id;
    } else {
      const doc = existingSnap.docs[0];
      contactId = doc.id;
      const existing = doc.data() || {};
      const existingMeta = existing.meta || {};

      const mergedOriginalLeadIds = {
        ...(existingMeta.originalLeadIds || {}),
        ...originalLeadIdsUpdate,
      };

      const mergedMeta = {
        ...existingMeta,
        metadata: {
          ...(existingMeta.metadata || {}),
          userAgent: data.metadata?.userAgent || existingMeta.metadata?.userAgent || '',
          referrerUrl: data.metadata?.referrerUrl || existingMeta.metadata?.referrerUrl || '',
          utmParams: {
            ...(existingMeta.metadata?.utmParams || {}),
            ...(data.metadata?.utmParams || {}),
          },
        },
      };

      if (data.meta?.roiSnapshot) {
        mergedMeta.roiSnapshot = data.meta.roiSnapshot;
      }

      if (Object.keys(mergedOriginalLeadIds).length > 0) {
        mergedMeta.originalLeadIds = mergedOriginalLeadIds;
      } else if (Object.prototype.hasOwnProperty.call(mergedMeta, 'originalLeadIds')) {
        delete mergedMeta.originalLeadIds;
      }

      if (data.meta?.leadMagnet) {
        mergedMeta.leadMagnet = data.meta.leadMagnet;
      }

      if (serviceSan) {
        mergedMeta.service = serviceSan;
      }

      await doc.ref.update({
        name: nameSan || existing.name || '',
        company: companySan || existing.company || '',
        phone: phoneSan || existing.phone || null,
        status: existing.status || 'in_progress',
        source: existing.source || source,
        notesSummary: messageSan || existing.notesSummary || '',
        lastContactedAt: nowTs,
        updatedAt: nowTs,
        meta: mergedMeta,
      });
    }

    const activitiesCol = db.collection('contact_activities');

    const activitySnippetParts = [];
    activitySnippetParts.push(`Lead from ${source}`);
    if (serviceSan) activitySnippetParts.push(`service: ${serviceSan}`);
    if (companySan) activitySnippetParts.push(`company: ${companySan}`);

    const activity = {
      contactId,
      type: 'note',
      direction: 'inbound',
      subject: `Lead captured from ${source}`,
      snippet: activitySnippetParts.join(' | '),
      content: messageSan || '',
      createdByUserId: null,
      createdByName: null,
      timestamp: nowTs,
      metadata: {
        channel: 'manual',
      },
    };

    await activitiesCol.add(activity);

    await autoScheduleDefaultSequenceForContact(contactId, source);

    return res.status(200).json({ success: true, contactId, isNew });
  } catch (e) {
    console.error('[lead_ingest] error:', e);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

// Public HTTPS endpoint for Custom Quote submissions
exports.submitQuotationRequest = onRequest(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    // Required to access Secret Manager values
    secrets: [RESEND_API_KEY, DEFAULT_SEQUENCE_QUOTATION],
  },
  async (req, res) => {
    // CORS for browser form
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    const quotationSubmissionSchema = z.object({
      serviceContext: z.enum([
        'intelligent-applications',
        'solutions',
        'smart-assistant',
        'system-integration',
      ]),
      serviceName: z.string().min(1),
      packageType: z.enum(['basic', 'standard', 'enterprise']).optional(),
      packageName: z.string().optional(),
      formData: z
        .object({
          companyName: z.string().min(1),
          contactName: z.string().min(1),
          contactEmail: z.string().email(),
          contactPhone: z.string().optional(),
          projectDescription: z.string().min(1),
          needsConsultation: z.boolean().optional(),
        })
        .passthrough(),
      metadata: z.object({
        submittedAt: z.string(),
        userAgent: z.string().optional(),
        referrerUrl: z.string().optional(),
      }),
    });

    function generateReferenceNumber() {
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 900000 + 100000);
      return `QR-${year}-${random}`;
    }

    try {
      const rawBody = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const parsed = quotationSubmissionSchema.safeParse(rawBody);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.errors,
        });
        return;
      }

      const data = parsed.data;
      const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      // IP rate-limiting: max 30 submissions/hour (relaxed for staging/testing)
      try {
        const rate = await checkRateLimit(`ip:${clientIP}`, 'quotation_submit', 30, 60 * 60 * 1000);
        if (!rate.allowed) {
          res.status(429).json({
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
          });
          return;
        }
      } catch (rateErr) {
        console.warn('[quotation] Rate limit check failed, continuing anyway', rateErr);
      }

      // Duplicate email check in last hour
      const oneHourAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
      let dupSnap = null;
      try {
        dupSnap = await db
          .collection('quotation_requests')
          .where('businessInfo.contactEmail', '==', data.formData.contactEmail)
          .where('createdAt', '>', oneHourAgo)
          .limit(1)
          .get();
      } catch (dupErr) {
        if (
          dupErr &&
          (dupErr.code === 9 || dupErr.code === 'FAILED_PRECONDITION') &&
          typeof dupErr.message === 'string' &&
          dupErr.message.includes('requires an index')
        ) {
          console.warn(
            '[quotation] Duplicate check skipped because Firestore composite index is missing or building',
            dupErr
          );
        } else {
          throw dupErr;
        }
      }

      if (dupSnap && !dupSnap.empty) {
        res.status(409).json({
          success: false,
          error: 'A quotation request with this email was already submitted recently.',
        });
        return;
      }

      const referenceNumber = generateReferenceNumber();

      const quotationDoc = {
        referenceNumber,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        serviceContext: data.serviceContext,
        serviceName: data.serviceName,
        packageType: data.packageType || null,
        packageName: data.packageName || null,
        businessInfo: {
          companyName: sanitizeInput(data.formData.companyName),
          contactName: sanitizeInput(data.formData.contactName),
          contactEmail: sanitizeInput(data.formData.contactEmail),
          contactPhone: data.formData.contactPhone
            ? sanitizeInput(data.formData.contactPhone)
            : null,
        },
        projectDescription: sanitizeInput(data.formData.projectDescription),
        metadata: {
          submittedAt: admin.firestore.Timestamp.fromDate(new Date(data.metadata.submittedAt)),
          userAgent: data.metadata.userAgent || '',
          referrerUrl: data.metadata.referrerUrl || '',
          ipAddress: clientIP,
        },
      };

      const docRef = await db.collection('quotation_requests').add(quotationDoc);

      // Ingest into unified contacts pipeline (best-effort)
      let contactId = null;
      try {
        const leadReq = {
          body: {
            email: data.formData.contactEmail,
            name: data.formData.contactName,
            company: data.formData.companyName,
            phone: data.formData.contactPhone || undefined,
            service: data.serviceName,
            source: 'quotation',
            meta: {
              quotationId: docRef.id,
              message: data.formData.projectDescription || undefined,
            },
            metadata: {
              userAgent: data.metadata.userAgent,
              referrerUrl: data.metadata.referrerUrl,
              utmParams: {},
            },
          },
          headers: req.headers || {},
          ip: clientIP,
        };

        let leadStatus = 200;
        let leadBody = null;
        const leadRes = {
          status(code) {
            leadStatus = code;
            return this;
          },
          json(body) {
            leadBody = body;
            return body;
          },
        };

        await handleLeadIngest(leadReq, leadRes, 'quotation');
        if (leadStatus === 200 && leadBody && leadBody.contactId) {
          contactId = String(leadBody.contactId);
        }
      } catch (ingestErr) {
        console.error(
          '[quotation->lead_ingest] Failed to ingest lead via unified pipeline',
          ingestErr
        );
      }

      // Send confirmation email to user (best-effort)
      try {
        const userEmail = data.formData.contactEmail;
        if (userEmail) {
          const userName = data.formData.contactName || 'there';
          const subject = `We've received your quotation request (${referenceNumber})`;
          const text = `Hi ${userName},\n\nThanks for requesting a custom quotation for ${data.serviceName}. Your reference number is ${referenceNumber}.\n\nOur team will review your request and get back to you shortly.\n\n– The Team`;
          await sendResendEmail({
            to: userEmail,
            subject,
            html: text.replace(/\n/g, '<br />'),
            text,
            tags: ['quotation', 'user-confirmation'],
          });
        }
      } catch (emailErr) {
        console.error('[quotation->email] Failed to send user confirmation email', emailErr);
      }

      // Optional sales notification
      try {
        const salesEmail =
          process.env.QUOTATION_SALES_EMAIL || process.env.SALES_NOTIFICATION_EMAIL;
        if (salesEmail) {
          const subject = `New quotation request: ${referenceNumber}`;
          const text = `New quotation request\n\nReference: ${referenceNumber}\nName: ${
            data.formData.contactName
          }\nEmail: ${data.formData.contactEmail}\nCompany: ${
            data.formData.companyName || ''
          }\nService: ${data.serviceName}\nNeeds consultation: ${
            data.formData.needsConsultation ? 'Yes' : 'No'
          }`;
          await sendResendEmail({
            to: salesEmail,
            subject,
            html: text.replace(/\n/g, '<br />'),
            text,
            tags: ['quotation', 'internal-notification'],
          });
        } else {
          console.log(
            '[quotation->email] No QUOTATION_SALES_EMAIL/SALES_NOTIFICATION_EMAIL configured; skipping sales notification'
          );
        }
      } catch (salesErr) {
        console.error('[quotation->email] Failed to send sales notification email', salesErr);
      }

      console.log('[quotation] Quotation submitted', {
        referenceNumber,
        serviceContext: data.serviceContext,
        packageType: data.packageType || null,
        needsConsultation: !!data.formData.needsConsultation,
        contactId,
      });

      res.status(200).json({
        success: true,
        referenceNumber,
        contactId,
        message: 'Quotation request submitted successfully',
      });
    } catch (err) {
      console.error('[quotation] Error submitting quotation', err);
      console.error('[quotation] Error stack:', err.stack);
      console.error('[quotation] Error message:', err.message);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  }
);

// Backward-compatible alias for AI-assisted prompt generation
exports.generate_prompt = onCall(
  {
    region: 'australia-southeast1',
    secrets: [OPENROUTER_API_KEY],
    timeoutSeconds: 120,
    memory: '256MB',
    maxInstances: 100,
    // Disable App Check for staging environment (enable in production)
    enforceAppCheck: false, // Set to true in production
    consumeAppCheckToken: false, // Set to true in production
  },
  async (request) => {
    return await generatePrompt(request);
  }
);

// =============================================================================
// PROMPT CRUD OPERATIONS
// =============================================================================

// Create prompt - CRUD operation for prompts
exports.create_prompt = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      // Validate required fields
      if (!data.title || !data.content) {
        throw new Error('Title and content are required');
      }

      // Create prompt document
      const promptData = {
        userId,
        title: data.title,
        content: data.content,
        description: data.description || '',
        category: data.category || 'General',
        tags: data.tags || [],
        variables: data.variables || [],
        isPublic: data.isPublic || false,
        model: data.model || DEFAULT_MODEL,
        temperature: data.temperature !== undefined ? data.temperature : 0.7,
        maxTokens: data.maxTokens || 2000,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        executionCount: 0,
        averageRating: 0,
        ratingCount: 0,
        version: 1,
        isDeleted: false, // Track deletion status
      };

      // Add to Firestore
      const promptRef = await db.collection('prompts').add(promptData);

      // Get the created document
      const createdPrompt = await promptRef.get();

      console.log(`Created prompt ${promptRef.id} for user ${userId}`);

      return {
        success: true,
        promptId: promptRef.id,
        prompt: {
          id: promptRef.id,
          ...createdPrompt.data(),
        },
      };
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw new Error(`Failed to create prompt: ${error.message}`);
    }
  }
);

// Get prompt by ID
exports.get_prompt = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      const promptId = data.promptId;
      const includeVersions = data.includeVersions || false;

      if (!promptId) {
        throw new Error('promptId is required');
      }

      // Validate prompt ID format
      if (typeof promptId !== 'string' || promptId.length < 10) {
        throw new Error('Invalid promptId format');
      }

      // Get prompt from Firestore
      const promptRef = db.collection('prompts').doc(promptId);
      const promptDoc = await promptRef.get();

      if (!promptDoc.exists) {
        throw new Error('Prompt not found or has been deleted');
      }

      const promptData = promptDoc.data();

      // Check if user has permission to view this prompt
      // User can view if: they own it OR it's public
      if (promptData.userId !== userId && !promptData.isPublic) {
        throw new Error('Permission denied: You do not have access to this prompt');
      }

      const result = {
        id: promptDoc.id,
        ...promptData,
      };

      // Include version history if requested
      if (includeVersions) {
        const versionsSnapshot = await promptRef
          .collection('versions')
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();

        result.versions = versionsSnapshot.docs.map((doc) => ({
          version: doc.data().version,
          content: doc.data().content,
          updatedAt: doc.data().createdAt,
          updatedBy: doc.data().userId,
        }));
      }

      console.log(`Retrieved prompt ${promptId} for user ${userId}`);

      return {
        success: true,
        prompt: result,
      };
    } catch (error) {
      console.error('Error getting prompt:', error);
      throw new Error(`Failed to get prompt: ${error.message}`);
    }
  }
);

// Update prompt
exports.update_prompt = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      const promptId = data.promptId;

      if (!promptId) {
        throw new Error('promptId is required');
      }

      // Get existing prompt
      const promptRef = db.collection('prompts').doc(promptId);
      const promptDoc = await promptRef.get();

      if (!promptDoc.exists) {
        throw new Error('Prompt not found');
      }

      const existingData = promptDoc.data();

      // Check ownership
      if (existingData.userId !== userId) {
        throw new Error('Permission denied: You can only update your own prompts');
      }

      // Prepare update data (only update provided fields)
      const updateData = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.variables !== undefined) updateData.variables = data.variables;
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
      if (data.model !== undefined) updateData.model = data.model;
      if (data.temperature !== undefined) updateData.temperature = data.temperature;
      if (data.maxTokens !== undefined) updateData.maxTokens = data.maxTokens;

      // Increment version if content changed
      if (data.content !== undefined && data.content !== existingData.content) {
        updateData.version = (existingData.version || 1) + 1;

        // Save version history
        await promptRef.collection('versions').add({
          version: existingData.version || 1,
          content: existingData.content,
          createdAt: FieldValue.serverTimestamp(),
          userId: userId,
        });
      }

      // Update prompt
      await promptRef.update(updateData);

      // Get updated document
      const updatedPrompt = await promptRef.get();

      console.log(`Updated prompt ${promptId} for user ${userId}`);

      return {
        success: true,
        prompt: {
          id: promptDoc.id,
          ...updatedPrompt.data(),
        },
      };
    } catch (error) {
      console.error('Error updating prompt:', error);
      throw new Error(`Failed to update prompt: ${error.message}`);
    }
  }
);

// Delete prompt
exports.delete_prompt = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      const promptId = data.promptId;

      if (!promptId) {
        throw new Error('promptId is required');
      }

      // Get prompt
      const promptRef = db.collection('prompts').doc(promptId);
      const promptDoc = await promptRef.get();

      if (!promptDoc.exists) {
        throw new Error('Prompt not found');
      }

      const promptData = promptDoc.data();

      // Check ownership
      if (promptData.userId !== userId) {
        throw new Error('Permission denied: You can only delete your own prompts');
      }

      // Soft delete: mark as deleted instead of removing
      await promptRef.update({
        isDeleted: true,
        deletedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`Deleted prompt ${promptId} for user ${userId}`);

      return {
        success: true,
        message: 'Prompt deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting prompt:', error);
      throw new Error(`Failed to delete prompt: ${error.message}`);
    }
  }
);

// List prompts
exports.list_prompts = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      const limitCount = Math.min(data.limit || 50, 100); // Max 100 prompts per request
      const category = data.category;
      const isPublic = data.isPublic;
      const tags = data.tags || [];

      // Build query - always filter by userId first for security
      let query = db.collection('prompts').where('userId', '==', userId);

      // Exclude deleted prompts
      query = query.where('isDeleted', '==', false);

      // Filter by category if provided
      if (category) {
        query = query.where('category', '==', category);
      }

      // Filter by tags if provided (max 10 tags for array-contains-any)
      if (tags.length > 0) {
        query = query.where('tags', 'array-contains-any', tags.slice(0, 10));
      }

      // Order by updatedAt (newest first) - matches frontend expectation
      query = query.orderBy('updatedAt', 'desc');

      // Limit results
      query = query.limit(limitCount);

      // Execute query
      const snapshot = await query.get();

      const prompts = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure timestamps are serializable
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
        };
      });

      console.log(`Listed ${prompts.length} prompts for user ${userId}`);

      return {
        success: true,
        prompts,
        total: prompts.length,
        limit: limitCount,
        offset: 0,
        hasMore: prompts.length === limitCount,
      };
    } catch (error) {
      console.error('Error listing prompts:', error);
      throw new Error(`Failed to list prompts: ${error.message}`);
    }
  }
);

// Search prompts
exports.search_prompts = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      const searchQuery = data.query || '';
      const limit = Math.min(data.limit || 20, 100);

      // For now, implement basic search by fetching user's prompts and filtering
      // In production, you'd use Algolia or Elasticsearch for full-text search
      let query = db.collection('prompts').where('userId', '==', userId);

      // Exclude deleted prompts
      query = query.where('isDeleted', '==', false);

      // Order by creation date
      query = query.orderBy('createdAt', 'desc');

      // Limit results
      query = query.limit(limit * 2); // Fetch more to filter

      const snapshot = await query.get();

      // Filter by search query (case-insensitive)
      const searchLower = searchQuery.toLowerCase();
      const prompts = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((prompt) => {
          if (!searchQuery) return true;
          return (
            prompt.title?.toLowerCase().includes(searchLower) ||
            prompt.description?.toLowerCase().includes(searchLower) ||
            prompt.content?.toLowerCase().includes(searchLower) ||
            prompt.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
          );
        })
        .slice(0, limit);

      console.log(`Searched prompts for user ${userId}, found ${prompts.length} results`);

      return {
        success: true,
        prompts,
        total: prompts.length,
      };
    } catch (error) {
      console.error('Error searching prompts:', error);
      throw new Error(`Failed to search prompts: ${error.message}`);
    }
  }
);

// Get prompt versions
exports.get_prompt_versions = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      const promptId = data.promptId;
      const limit = Math.min(data.limit || 10, 50); // Max 50 versions

      if (!promptId) {
        throw new Error('promptId is required');
      }

      // Get prompt to verify ownership
      const promptRef = db.collection('prompts').doc(promptId);
      const promptDoc = await promptRef.get();

      if (!promptDoc.exists) {
        throw new Error('Prompt not found');
      }

      const promptData = promptDoc.data();

      // Check permission
      if (promptData.userId !== userId && !promptData.isPublic) {
        throw new Error('Permission denied: You do not have access to this prompt');
      }

      // Get versions
      const versionsSnapshot = await promptRef
        .collection('versions')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const versions = versionsSnapshot.docs.map((doc) => ({
        version: doc.data().version,
        content: doc.data().content,
        updatedAt: doc.data().createdAt,
        updatedBy: doc.data().userId,
      }));

      console.log(`Retrieved ${versions.length} versions for prompt ${promptId}`);

      return {
        success: true,
        versions,
      };
    } catch (error) {
      console.error('Error getting prompt versions:', error);
      throw new Error(`Failed to get prompt versions: ${error.message}`);
    }
  }
);

// Restore prompt version
exports.restore_prompt_version = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const userId = request.auth.uid;
    const data = request.data || {};

    try {
      const promptId = data.promptId;
      const versionNumber = data.version;

      if (!promptId) {
        throw new Error('promptId is required');
      }

      if (versionNumber === undefined) {
        throw new Error('version is required');
      }

      // Get prompt
      const promptRef = db.collection('prompts').doc(promptId);
      const promptDoc = await promptRef.get();

      if (!promptDoc.exists) {
        throw new Error('Prompt not found');
      }

      const promptData = promptDoc.data();

      // Check ownership
      if (promptData.userId !== userId) {
        throw new Error('Permission denied: You can only restore your own prompts');
      }

      // Find the version
      const versionsSnapshot = await promptRef
        .collection('versions')
        .where('version', '==', versionNumber)
        .limit(1)
        .get();

      if (versionsSnapshot.empty) {
        throw new Error(`Version ${versionNumber} not found`);
      }

      const versionData = versionsSnapshot.docs[0].data();

      // Save current version before restoring
      await promptRef.collection('versions').add({
        version: promptData.version || 1,
        content: promptData.content,
        createdAt: FieldValue.serverTimestamp(),
        userId: userId,
      });

      // Restore the version
      await promptRef.update({
        content: versionData.content,
        version: (promptData.version || 1) + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Get updated prompt
      const updatedPrompt = await promptRef.get();

      console.log(`Restored prompt ${promptId} to version ${versionNumber}`);

      return {
        success: true,
        prompt: {
          id: promptDoc.id,
          ...updatedPrompt.data(),
        },
      };
    } catch (error) {
      console.error('Error restoring prompt version:', error);
      throw new Error(`Failed to restore prompt version: ${error.message}`);
    }
  }
);

// Multi-model execution function
exports.execute_multi_model_prompt = onCall(
  {
    region: 'australia-southeast1',
    secrets: [OPENROUTER_API_KEY],
    timeoutSeconds: 300, // 5 minutes for multi-model execution
    memory: '512MB', // More memory for parallel execution
    maxInstances: 50, // Limit concurrent multi-model executions
    // DISABLED: App Check not configured in staging environment
    // enforceAppCheck: true, // Require valid App Check token (bot protection)
    // consumeAppCheckToken: true, // Prevent token reuse
  },
  async (request) => {
    try {
      // Verify authentication
      if (!request.auth) {
        throw new Error('User must be authenticated');
      }

      // Rate limiting: 50 requests per hour
      const rateLimit = await checkRateLimit(
        request.auth.uid,
        'execute_multi_model_prompt',
        50,
        3600000
      );
      if (!rateLimit.allowed) {
        throw new Error(
          `Rate limit exceeded. You can make 50 requests per hour. Try again at ${rateLimit.resetAt.toISOString()}`
        );
      }

      const { prompt, models = [], systemPrompt = '', context = '' } = request.data;

      if (!prompt) {
        throw new Error('Prompt is required');
      }

      if (!models || models.length === 0) {
        throw new Error('At least one model is required');
      }

      console.log(`Executing multi-model prompt with ${models.length} models:`, models);

      const startTime = Date.now();
      const results = [];

      // Execute prompt with each model
      for (const modelKey of models) {
        try {
          console.log(`Executing with model: ${modelKey}`);

          const modelStartTime = Date.now();

          const completion = await openrouter.chat.completions.create({
            model: modelKey,
            messages: [
              {
                role: 'system',
                content:
                  systemPrompt ||
                  `You are an AI assistant. Provide helpful, accurate, and well-structured responses.`,
              },
              {
                role: 'user',
                content: context ? `${context}\n\n${prompt}` : prompt,
              },
            ],
            max_tokens: 1000,
            temperature: 0.7,
          });

          const modelExecutionTime = (Date.now() - modelStartTime) / 1000;

          // Extract response safely
          let response = '';
          let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

          if (completion && completion.choices && completion.choices.length > 0) {
            response = completion.choices[0]?.message?.content || '';
          }

          if (completion.usage) {
            usage = completion.usage;
          }

          results.push({
            model_name: modelKey,
            provider: 'openrouter',
            response: response,
            latency: modelExecutionTime,
            cost: 0.0, // Free models
            token_count: usage.total_tokens,
            quality_score: Math.random() * 0.3 + 0.7, // Mock quality score between 0.7-1.0
            error: null,
          });
        } catch (error) {
          console.error(`Error executing with model ${modelKey}:`, error);
          results.push({
            model_name: modelKey,
            provider: 'openrouter',
            response: '',
            latency: 0,
            cost: 0.0,
            token_count: 0,
            quality_score: 0,
            error: error.message,
          });
        }
      }

      const totalExecutionTime = (Date.now() - startTime) / 1000;
      const successfulResults = results.filter((r) => !r.error);
      const totalTokens = results.reduce((sum, r) => sum + r.token_count, 0);

      // Determine best model based on quality score and successful execution
      let bestModel = '';
      if (successfulResults.length > 0) {
        bestModel = successfulResults.reduce((best, current) =>
          current.quality_score > best.quality_score ? current : best
        ).model_name;
      }

      const comparisonMetrics = {
        total_models: models.length,
        successful_executions: successfulResults.length,
        failed_executions: results.length - successfulResults.length,
        avg_latency:
          successfulResults.length > 0
            ? successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length
            : 0,
        total_tokens: totalTokens,
        cost_breakdown: results.reduce((breakdown, r) => {
          breakdown[r.model_name] = r.cost;
          return breakdown;
        }, {}),
      };

      return {
        success: true,
        results: results,
        bestModel: bestModel,
        totalCost: 0.0, // All free models
        executionTime: totalExecutionTime,
        comparisonMetrics: comparisonMetrics,
      };
    } catch (error) {
      console.error('Multi-model execution error:', error);
      return {
        success: false,
        error: error.message,
        results: [],
        bestModel: '',
        totalCost: 0.0,
        executionTime: 0,
        comparisonMetrics: {
          total_models: 0,
          successful_executions: 0,
          failed_executions: 0,
          avg_latency: 0,
          total_tokens: 0,
          cost_breakdown: {},
        },
      };
    }
  }
);

// Execute prompt function with real OpenRouter integration
async function executePrompt(request) {
  // Determine model to use (define outside try block for error handling)
  let modelToUse = DEFAULT_MODEL;

  try {
    // Verify authentication
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const {
      promptId,
      inputs = {},
      useRag = false,
      ragQuery = '',
      documentIds = [],
      models = [],
      temperature = 0.7,
      maxTokens = 1000,
    } = request.data;

    if (!promptId) {
      throw new Error('promptId is required');
    }

    // Get prompt from Firestore (root collection)
    const promptRef = db.collection('prompts').doc(promptId);
    const promptDoc = await promptRef.get();

    if (!promptDoc.exists) {
      throw new Error('Prompt not found');
    }

    const promptData = promptDoc.data();

    // Verify ownership
    if (promptData.userId !== request.auth.uid) {
      throw new Error('Unauthorized: You do not own this prompt');
    }
    let promptContent = promptData.content || '';

    // Replace variables in prompt
    for (const [varName, varValue] of Object.entries(inputs)) {
      const placeholder = `{${varName}}`;
      promptContent = promptContent.replace(new RegExp(placeholder, 'g'), String(varValue));
    }

    // Update model to use
    modelToUse = models && models.length > 0 ? models[0] : DEFAULT_MODEL;

    // Generate response using OpenRouter
    const startTime = Date.now();

    const completion = await openrouter.chat.completions.create({
      model: modelToUse,
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant helping with the prompt titled "${
            promptData.title || 'Untitled'
          }". Provide helpful, accurate, and well-structured responses.`,
        },
        {
          role: 'user',
          content: promptContent,
        },
      ],
      max_tokens: maxTokens,
      temperature: temperature,
    });

    console.log('OpenRouter API Response:', JSON.stringify(completion, null, 2));

    const executionTime = (Date.now() - startTime) / 1000;

    // Safely extract response with better error handling
    let response = '';
    let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    let finishReason = 'unknown';

    if (completion && completion.choices && completion.choices.length > 0) {
      response = completion.choices[0]?.message?.content || '';
      finishReason = completion.choices[0]?.finish_reason || 'unknown';
    } else {
      console.error('Unexpected OpenRouter response structure:', completion);
      throw new Error('Invalid response from OpenRouter API - no choices returned');
    }

    if (completion.usage) {
      usage = completion.usage;
    }

    // Save execution to Firestore (top-level executions collection)
    // Frontend expects: promptId, userId, promptTitle, model, timestamp, cost, status, output, variables, tokensUsed, duration
    console.log('💾 Saving execution to Firestore...');
    console.log('📍 Collection path: executions (top-level)');
    console.log('👤 User ID:', request.auth.uid);
    console.log('📝 Prompt ID:', promptId);
    console.log('📌 Prompt Title:', promptData.title || 'Untitled Prompt');

    const executionRef = db.collection('executions').doc();
    const executionData = {
      // Required fields for ExecutionHistory component
      userId: request.auth.uid,
      promptId: promptId,
      promptTitle: promptData.title || 'Untitled Prompt', // Frontend needs this for display
      model: modelToUse, // Frontend expects 'model' not 'modelId'
      timestamp: FieldValue.serverTimestamp(), // Frontend expects 'timestamp' not 'createdAt'
      cost: 0.0, // Free model
      status: 'completed',
      output: response, // Frontend expects flat 'output' field
      variables: inputs, // Frontend expects 'variables' not 'inputs'
      tokensUsed: usage && typeof usage.total_tokens === 'number' ? usage.total_tokens : 0, // Frontend expects flat 'tokensUsed'
      duration: executionTime, // Frontend expects 'duration' in seconds

      // Additional metadata for debugging and analytics (avoid undefined values)
      metadata: {
        promptTokens: usage && typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0,
        completionTokens:
          usage && typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0,
        finishReason: typeof finishReason !== 'undefined' ? finishReason : null,
        useRag: !!useRag,
        ragQuery: useRag ? ragQuery || null : null,
        documentIds: useRag ? documentIds || null : null,
        temperature: typeof temperature === 'number' ? temperature : null,
        maxTokens: typeof maxTokens === 'number' ? maxTokens : null,
      },
    };

    await executionRef.set(executionData);
    console.log('✅ Execution saved successfully! Document ID:', executionRef.id);
    console.log('📊 Execution data:', JSON.stringify(executionData, null, 2));

    return {
      success: true,
      output: response,
      context: '',
      metadata: {
        model: modelToUse,
        executionTime,
        tokensUsed: usage && typeof usage.total_tokens === 'number' ? usage.total_tokens : 0,
        promptTokens: usage && typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0,
        completionTokens:
          usage && typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0,
        cost: 0.0,
        finishReason: typeof finishReason !== 'undefined' ? finishReason : null,
        useRag: !!useRag,
      },
    };
  } catch (error) {
    console.error('Error executing prompt:', error);

    // Enhanced error handling for model availability issues
    let errorMessage = error.message;
    let userFriendlyMessage = `Error executing prompt: ${error.message}`;

    if (error.message && error.message.includes('No endpoints found')) {
      errorMessage = 'Model endpoint not available';
      userFriendlyMessage =
        'The selected AI model is currently unavailable. Please try a different model or contact support.';
    } else if (error.message && error.message.includes('404')) {
      errorMessage = 'Model not found';
      userFriendlyMessage =
        'The selected AI model was not found. It may have been deprecated or renamed.';
    } else if (error.message && error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded';
      userFriendlyMessage = 'Too many requests. Please wait a moment and try again.';
    }

    return {
      success: false,
      error: errorMessage,
      output: userFriendlyMessage,
      metadata: {
        model: modelToUse || DEFAULT_MODEL,
        executionTime: 0,
        tokensUsed: 0,
        cost: 0,
        error: errorMessage,
        originalError: error.message,
      },
    };
  }
}

// Test OpenRouter connection
async function testOpenRouterConnection() {
  try {
    const completion = await openrouter.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: 'Hello! Please respond with a brief greeting.',
        },
      ],
      max_tokens: 50,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    const usage = completion.usage || { total_tokens: 0 };

    return {
      status: 'success',
      message: 'OpenRouter connection successful',
      region: 'australia-southeast1',
      testResponse: response,
      tokensUsed: usage.total_tokens,
      model: DEFAULT_MODEL,
    };
  } catch (error) {
    console.error('OpenRouter connection test failed:', error);
    return {
      status: 'error',
      message: 'OpenRouter connection failed',
      region: 'australia-southeast1',
      error: error.message,
    };
  }
}

// Get available models
function getAvailableModels() {
  return {
    success: true,
    message: 'Available models retrieved',
    region: 'australia-southeast1',
    models: {
      // VALIDATED WORKING MODELS (Task 1.1 - 100% success rate)
      'z-ai/glm-4.5-air:free': {
        key: 'z-ai/glm-4.5-air:free',
        provider: 'openrouter',
        model_name: 'z-ai/glm-4.5-air:free',
        display_name: 'GLM 4.5 Air (Free) ⚡ DEFAULT',
        description:
          'Fastest validated model (2.61s avg), 100% success rate, 1M context, agent-optimized',
        context_window: 1000000,
        cost_per_1k_tokens: 0.0,
        configured: true,
        validated: true,
        isDefault: true,
        avgResponseTime: 2.61,
      },
      'x-ai/grok-4-fast:free': {
        key: 'x-ai/grok-4-fast:free',
        provider: 'openrouter',
        model_name: 'x-ai/grok-4-fast:free',
        display_name: 'Grok 4 Fast (Free)',
        description:
          'Validated model (4.17s avg), 100% success rate, 2M context, best for long-form content',
        context_window: 2000000,
        cost_per_1k_tokens: 0.0,
        configured: true,
        validated: true,
        avgResponseTime: 4.17,
      },
      'microsoft/mai-ds-r1:free': {
        key: 'microsoft/mai-ds-r1:free',
        provider: 'openrouter',
        model_name: 'microsoft/mai-ds-r1:free',
        display_name: 'Microsoft MAI-DS-R1 (Free)',
        description:
          'Validated model (3.97s avg), 100% success rate, 163K context, agent framework integration',
        context_window: 163000,
        cost_per_1k_tokens: 0.0,
        configured: true,
        validated: true,
        avgResponseTime: 3.97,
      },
      'mistralai/mistral-7b-instruct:free': {
        key: 'mistralai/mistral-7b-instruct:free',
        provider: 'openrouter',
        model_name: 'mistralai/mistral-7b-instruct:free',
        display_name: 'Mistral 7B Instruct (Free) ⚡⚡',
        description:
          'Ultra-fast validated model (1.33s avg), 100% success rate, 32K context, high-throughput',
        context_window: 32000,
        cost_per_1k_tokens: 0.0,
        configured: true,
        validated: true,
        avgResponseTime: 1.33,
      },
      // DEPRECATED MODELS (Not validated or unavailable)
      'nvidia/nemotron-nano-9b-v2:free': {
        key: 'nvidia/nemotron-nano-9b-v2:free',
        provider: 'openrouter',
        model_name: 'nvidia/nemotron-nano-9b-v2:free',
        display_name: 'Nemotron Nano 9B V2 (Free) [DEPRECATED]',
        description: 'Not validated - may be unavailable',
        context_window: 131072,
        cost_per_1k_tokens: 0.0,
        configured: false,
        deprecated: true,
      },
      'google/gemma-3-27b-it:free': {
        key: 'google/gemma-3-27b-it:free',
        provider: 'openrouter',
        model_name: 'google/gemma-3-27b-it:free',
        display_name: 'Gemma 3 27B IT (Free)',
        description: 'Free Google instruction-tuned language model',
        context_window: 131072,
        cost_per_1k_tokens: 0.0,
        configured: true,
      },
      'meta-llama/llama-3.3-70b-instruct:free': {
        key: 'meta-llama/llama-3.3-70b-instruct:free',
        provider: 'openrouter',
        model_name: 'meta-llama/llama-3.3-70b-instruct:free',
        display_name: 'Llama 3.3 70B Instruct (Free)',
        description: 'Free Meta large instruction-tuned model',
        context_window: 131072,
        cost_per_1k_tokens: 0.0,
        configured: true,
      },

      'nvidia/llama-3.1-nemotron-ultra-253b-v1:free': {
        key: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
        provider: 'openrouter',
        model_name: 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free',
        display_name: 'Llama 3.1 Nemotron Ultra (Free)',
        description: 'Free large language model by NVIDIA',
        context_window: 131072,
        cost_per_1k_tokens: 0.0,
        configured: true,
      },
      'microsoft/phi-3-mini-128k-instruct:free': {
        key: 'microsoft/phi-3-mini-128k-instruct:free',
        provider: 'openrouter',
        model_name: 'microsoft/phi-3-mini-128k-instruct:free',
        display_name: 'Phi-3 Mini 128K (Free)',
        description: 'Free compact model with large context window',
        context_window: 128000,
        cost_per_1k_tokens: 0.0,
        configured: true,
      },
      'mistralai/mistral-nemo:free': {
        key: 'mistralai/mistral-nemo:free',
        provider: 'openrouter',
        model_name: 'mistralai/mistral-nemo:free',
        display_name: 'Mistral Nemo 12B (Free)',
        description: 'Free 12B parameter model with 128k context window',
        context_window: 131072,
        cost_per_1k_tokens: 0.0,
        configured: true,
      },
      'google/gemma-2-9b-it:free': {
        key: 'google/gemma-2-9b-it:free',
        provider: 'openrouter',
        model_name: 'google/gemma-2-9b-it:free',
        display_name: 'Gemma 2 9B (Free)',
        description: 'Free 9B parameter model by Google',
        context_window: 8192,
        cost_per_1k_tokens: 0.0,
        configured: true,
      },
    },
    apiKeysConfigured: {
      openrouter: true,
      openai: false,
      anthropic: false,
      cohere: false,
    },
    default_model: DEFAULT_MODEL,
  };
}

// Separate function for get_available_models (for backward compatibility)
exports.get_available_models = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 10, // Very fast operation
    memory: '128MB',
    maxInstances: 200,
  },
  (request) => {
    return getAvailableModels();
  }
);

// Health check endpoint
exports.health = onRequest(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 5, // Health checks should be fast
    memory: '128MB',
    maxInstances: 200, // Reduced to stay within CPU quota
  },
  (req, res) => {
    res.json({
      status: 'healthy',
      region: 'australia-southeast1',
    });
  }
);

// Rate limiting middleware (Firestore-based)
async function checkRateLimit(userId, functionName, maxRequests = 100, windowMs = 3600000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get rate limit document
  const rateLimitRef = db.collection('rate_limits').doc(`${userId}_${functionName}`);
  const rateLimitDoc = await rateLimitRef.get();

  if (!rateLimitDoc.exists) {
    // First request - create document
    await rateLimitRef.set({
      userId,
      functionName,
      requests: [now],
      createdAt: FieldValue.serverTimestamp(),
    });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const data = rateLimitDoc.data();
  const recentRequests = data.requests.filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(recentRequests[0] + windowMs),
    };
  }

  // Update requests
  await rateLimitRef.update({
    requests: [...recentRequests, now],
  });

  return {
    allowed: true,
    remaining: maxRequests - recentRequests.length - 1,
  };
}

// Authentication middleware for HTTP endpoints
async function authenticateHttpRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const idToken = authHeader.split('Bearer ')[1];

  // Emulator-only dev shortcut: allow a special bearer token to bypass verification
  // This enables local HTTP E2E tests without hitting the Auth emulator REST.
  const isAnyEmulator =
    String(process.env.FUNCTIONS_EMULATOR || '').toLowerCase() === 'true' ||
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIREBASE_EMULATOR_HUB;
  if (isAnyEmulator) {
    // Accept common emulator tokens for convenience
    if (idToken === 'owner' || idToken === 'emulator' || idToken.startsWith('EMULATOR_TEST_')) {
      // Use the known test UID from dashboard logs for accurate data access
      const fallbackUid = '5f3TZo1RW8abwje1q43wdPfLyqde';
      return { uid: fallbackUid };
    }
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// RBAC helper
async function requireUserWithRole(req, res, allowedRoles) {
  try {
    const user = await authenticateHttpRequest(req);
    const roleSnap = await db.collection('user_roles').doc(user.uid).get();
    const roleData = roleSnap.exists ? roleSnap.data() || {} : {};
    const role = roleData.role;
    if (!role || !allowedRoles.includes(role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden: insufficient role',
      });
      return null;
    }
    return { user, role };
  } catch (authError) {
    res.status(401).json({
      success: false,
      error: authError.message,
    });
    return null;
  }
}

// HTTP API endpoint to handle REST API calls
exports.httpApi = onRequest(
  {
    region: 'australia-southeast1',
    cors: true,
    timeoutSeconds: 120, // 2 minutes for API calls
    memory: '512MB',
    maxInstances: 100,
    // Required to access Secret Manager value in getOpenRouter() and sendResendEmail()
    secrets: [OPENROUTER_API_KEY, RESEND_API_KEY],
  },
  async (req, res) => {
    try {
      // Set CORS headers
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.status(200).send();
        return;
      }

      const path = req.path;
      const url = req.url; // Full URL including query params
      console.log(` API Request: ${req.method} ${path} (URL: ${url})`);
      console.log(` Headers:`, req.headers);

      // Public lead ingestion endpoints (no auth)
      if (req.method === 'POST' && (path === '/api/leads/ingest' || path === '/leads/ingest')) {
        return await handleLeadIngest(req, res);
      }

      if (
        req.method === 'POST' &&
        (path === '/api/leads/capture-roi' || path === '/leads/capture-roi')
      ) {
        return await handleLeadIngest(req, res, 'roi_calculator');
      }

      if (
        req.method === 'POST' &&
        (path === '/api/leads/capture-exit-intent' || path === '/leads/capture-exit-intent')
      ) {
        return await handleLeadIngest(req, res, 'exit_intent');
      }

      if (
        req.method === 'POST' &&
        (path === '/api/leads/capture-contact' || path === '/leads/capture-contact')
      ) {
        return await handleLeadIngest(req, res, 'contact_form');
      }

      if (req.method === 'GET' && (path === '/api/contacts' || path === '/contacts')) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const queryParams = req.query || {};
        const statusFilter = queryParams.status ? String(queryParams.status) : null;
        const ownerFilter = queryParams.ownerUserId ? String(queryParams.ownerUserId) : null;
        const sourceFilter = queryParams.source ? String(queryParams.source) : null;
        const tagFilter = queryParams.tag ? String(queryParams.tag) : null;
        const serviceFilter = queryParams.service ? String(queryParams.service) : null;
        const pageNum = Number.parseInt(queryParams.page, 10) || 1;
        const pageSize = Number.parseInt(queryParams.pageSize, 10) || 20;
        const limit = Math.min(Math.max(pageSize, 1), 100);
        const offset = pageNum > 1 ? (pageNum - 1) * limit : 0;

        let query = db.collection('contacts').orderBy('createdAt', 'desc');
        if (statusFilter) {
          query = query.where('status', '==', statusFilter);
        }
        if (ownerFilter) {
          query = query.where('ownerUserId', '==', ownerFilter);
        }
        if (sourceFilter) {
          query = query.where('source', '==', sourceFilter);
        }
        if (tagFilter) {
          query = query.where('tags', 'array-contains', tagFilter);
        }
        if (serviceFilter) {
          query = query.where('service', '==', serviceFilter);
        }

        query = query.limit(limit);
        if (offset > 0) {
          query = query.offset(offset);
        }

        const snap = await query.get();
        const contacts = snap.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
          };
        });

        res.json({
          success: true,
          contacts,
        });
        return;
      }

      const contactExportMatch =
        (req.method === 'GET' &&
          (path.match(/^\/api\/contacts\/([^/]+)\/export$/) ||
            path.match(/^\/contacts\/([^/]+)\/export$/))) ||
        null;
      if (contactExportMatch) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const contactId = contactExportMatch[1];

        const contactRef = db.collection('contacts').doc(contactId);
        const [contactSnap, activitiesSnap, jobsSnap] = await Promise.all([
          contactRef.get(),
          db
            .collection('contact_activities')
            .where('contactId', '==', contactId)
            .orderBy('timestamp', 'desc')
            .limit(500)
            .get(),
          db
            .collection('email_jobs')
            .where('contactId', '==', contactId)
            .orderBy('createdAt', 'desc')
            .limit(200)
            .get(),
        ]);

        if (!contactSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Contact not found',
          });
          return;
        }

        const contactData = contactSnap.data() || {};
        const activities = activitiesSnap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() || {}),
        }));
        const emailJobs = jobsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() || {}) }));

        res.json({
          success: true,
          contact: {
            id: contactSnap.id,
            ...contactData,
          },
          activities,
          emailJobs,
        });
        return;
      }

      const contactIdMatchGet =
        (req.method === 'GET' &&
          (path.match(/^\/api\/contacts\/(.+)$/) || path.match(/^\/contacts\/(.+)$/))) ||
        null;
      if (contactIdMatchGet) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const contactId = contactIdMatchGet[1];
        const doc = await db.collection('contacts').doc(contactId).get();
        if (!doc.exists) {
          res.status(404).json({
            success: false,
            error: 'Contact not found',
          });
          return;
        }
        const data = doc.data() || {};
        res.json({
          success: true,
          contact: {
            id: doc.id,
            ...data,
          },
        });
        return;
      }

      if (req.method === 'POST' && (path === '/api/contacts' || path === '/contacts')) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const parsedBody = contactCreateSchema.safeParse(rawBody || {});
        if (!parsedBody.success) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: parsedBody.error.errors,
          });
          return;
        }
        const body = parsedBody.data || {};

        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!name || !email) {
          res.status(400).json({
            success: false,
            error: 'name and email are required',
          });
          return;
        }

        const nowTs = FieldValue.serverTimestamp();
        const contactDoc = {
          name,
          email,
          company: typeof body.company === 'string' ? body.company : '',
          jobTitle:
            body.jobTitle === null || typeof body.jobTitle === 'string'
              ? body.jobTitle || null
              : null,
          phone: body.phone === null || typeof body.phone === 'string' ? body.phone || null : null,
          status: typeof body.status === 'string' ? body.status : 'new',
          source: typeof body.source === 'string' ? body.source : 'manual',
          ownerUserId:
            body.ownerUserId === null || typeof body.ownerUserId === 'string'
              ? body.ownerUserId || null
              : null,
          team: body.team === null || typeof body.team === 'string' ? body.team || null : null,
          tags: Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string') : [],
          notesSummary: typeof body.notesSummary === 'string' ? body.notesSummary : '',
          lastContactedAt: null,
          nextFollowUpAt: null,
          createdAt: nowTs,
          updatedAt: nowTs,
        };

        if (body.meta && typeof body.meta === 'object') {
          contactDoc.meta = body.meta;
        }

        const ref = await db.collection('contacts').add(contactDoc);
        const snap = await ref.get();
        const data = snap.data() || {};

        res.status(201).json({
          success: true,
          contact: {
            id: ref.id,
            ...data,
          },
        });
        return;
      }

      const contactIdMatchUpdate =
        ((req.method === 'PUT' || req.method === 'PATCH') &&
          (path.match(/^\/api\/contacts\/(.+)$/) || path.match(/^\/contacts\/(.+)$/))) ||
        null;
      if (contactIdMatchUpdate) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const contactId = contactIdMatchUpdate[1];
        const ref = db.collection('contacts').doc(contactId);
        const existingSnap = await ref.get();
        if (!existingSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Contact not found',
          });
          return;
        }

        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const body = rawBody || {};
        const updateData = {};

        if (Object.prototype.hasOwnProperty.call(body, 'name') && typeof body.name === 'string') {
          updateData.name = body.name.trim();
        }
        if (Object.prototype.hasOwnProperty.call(body, 'email') && typeof body.email === 'string') {
          updateData.email = body.email.trim().toLowerCase();
        }
        if (Object.prototype.hasOwnProperty.call(body, 'company')) {
          updateData.company = typeof body.company === 'string' ? body.company : '';
        }
        if (Object.prototype.hasOwnProperty.call(body, 'jobTitle')) {
          updateData.jobTitle =
            body.jobTitle === null || typeof body.jobTitle === 'string'
              ? body.jobTitle || null
              : null;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
          updateData.phone =
            body.phone === null || typeof body.phone === 'string' ? body.phone || null : null;
        }
        if (
          Object.prototype.hasOwnProperty.call(body, 'status') &&
          typeof body.status === 'string'
        ) {
          updateData.status = body.status;
        }
        if (
          Object.prototype.hasOwnProperty.call(body, 'source') &&
          typeof body.source === 'string'
        ) {
          updateData.source = body.source;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'ownerUserId')) {
          updateData.ownerUserId =
            body.ownerUserId === null || typeof body.ownerUserId === 'string'
              ? body.ownerUserId || null
              : null;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'team')) {
          updateData.team =
            body.team === null || typeof body.team === 'string' ? body.team || null : null;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'tags')) {
          updateData.tags = Array.isArray(body.tags)
            ? body.tags.filter((t) => typeof t === 'string')
            : [];
        }
        if (Object.prototype.hasOwnProperty.call(body, 'notesSummary')) {
          updateData.notesSummary = typeof body.notesSummary === 'string' ? body.notesSummary : '';
        }
        if (Object.prototype.hasOwnProperty.call(body, 'nextFollowUpAt')) {
          const value = body.nextFollowUpAt;
          if (value === null) {
            updateData.nextFollowUpAt = null;
          } else if (typeof value === 'string' || value instanceof Date) {
            // Store the provided value directly (string ISO or Date)
            updateData.nextFollowUpAt = value;
          }
        }
        if (
          Object.prototype.hasOwnProperty.call(body, 'meta') &&
          body.meta &&
          typeof body.meta === 'object'
        ) {
          updateData.meta = body.meta;
        }

        updateData.updatedAt = FieldValue.serverTimestamp();

        await ref.update(updateData);
        const updatedSnap = await ref.get();
        const updatedData = updatedSnap.data() || {};

        res.json({
          success: true,
          contact: {
            id: updatedSnap.id,
            ...updatedData,
          },
        });
        return;
      }

      const gdprDeleteMatch =
        (req.method === 'POST' &&
          (path.match(/^\/api\/contacts\/([^/]+)\/gdpr-delete$/) ||
            path.match(/^\/contacts\/([^/]+)\/gdpr-delete$/))) ||
        null;
      if (gdprDeleteMatch) {
        const ctx = await requireUserWithRole(req, res, ['admin']);
        if (!ctx) return;
        const { user } = ctx;
        const contactId = gdprDeleteMatch[1];

        const contactRef = db.collection('contacts').doc(contactId);
        const contactSnap = await contactRef.get();
        if (!contactSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Contact not found',
          });
          return;
        }

        const nowTs = FieldValue.serverTimestamp();
        await contactRef.set(
          {
            name: 'Deleted Contact',
            email: null,
            company: null,
            jobTitle: null,
            phone: null,
            notesSummary: null,
            tags: [],
            updatedAt: nowTs,
            meta: {
              gdprDeletedAt: nowTs,
              gdprDeletedBy: user.uid,
            },
          },
          { merge: true }
        );

        await db.collection('audit_logs').add({
          type: 'gdpr_contact_delete',
          contactId,
          requestedByUserId: user.uid,
          createdAt: nowTs,
        });

        res.json({
          success: true,
        });
        return;
      }

      const contactIdMatchDelete =
        (req.method === 'DELETE' &&
          (path.match(/^\/api\/contacts\/(.+)$/) || path.match(/^\/contacts\/(.+)$/))) ||
        null;
      if (contactIdMatchDelete) {
        const ctx = await requireUserWithRole(req, res, ['admin']);
        if (!ctx) return;
        const contactId = contactIdMatchDelete[1];
        const ref = db.collection('contacts').doc(contactId);
        const existingSnap = await ref.get();
        if (!existingSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Contact not found',
          });
          return;
        }
        await ref.delete();
        res.json({
          success: true,
        });
        return;
      }

      if (req.method === 'GET' && (path === '/api/my-contacts' || path === '/my-contacts')) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const { user } = ctx;
        const queryParams = req.query || {};
        const statusFilter = queryParams.status ? String(queryParams.status) : null;
        const sourceFilter = queryParams.source ? String(queryParams.source) : null;
        const tagFilter = queryParams.tag ? String(queryParams.tag) : null;
        const serviceFilter = queryParams.service ? String(queryParams.service) : null;
        const pageNum = Number.parseInt(queryParams.page, 10) || 1;
        const pageSize = Number.parseInt(queryParams.pageSize, 10) || 20;
        const limit = Math.min(Math.max(pageSize, 1), 100);
        const offset = pageNum > 1 ? (pageNum - 1) * limit : 0;

        let query = db
          .collection('contacts')
          .where('ownerUserId', '==', user.uid)
          .orderBy('createdAt', 'desc');
        if (statusFilter) {
          query = query.where('status', '==', statusFilter);
        }
        if (sourceFilter) {
          query = query.where('source', '==', sourceFilter);
        }
        if (tagFilter) {
          query = query.where('tags', 'array-contains', tagFilter);
        }
        if (serviceFilter) {
          query = query.where('service', '==', serviceFilter);
        }

        query = query.limit(limit);
        if (offset > 0) {
          query = query.offset(offset);
        }

        const snap = await query.get();
        const contacts = snap.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
          };
        });

        res.json({
          success: true,
          contacts,
        });
        return;
      }

      const contactActivitiesMatch =
        path.match(/^\/api\/contacts\/([^/]+)\/activities$/) ||
        path.match(/^\/contacts\/([^/]+)\/activities$/) ||
        null;
      if (contactActivitiesMatch) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const { user } = ctx;
        const contactId = contactActivitiesMatch[1];

        if (req.method === 'GET') {
          const queryParams = req.query || {};
          const limitParam = Number.parseInt(queryParams.limit, 10);
          const limit =
            Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

          const snap = await db
            .collection('contact_activities')
            .where('contactId', '==', contactId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

          const activities = snap.docs.map((doc) => {
            const data = doc.data() || {};
            return {
              id: doc.id,
              ...data,
            };
          });

          res.json({
            success: true,
            activities,
          });
          return;
        }

        if (req.method === 'POST') {
          const rawBody =
            typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
          const parsedBody = contactActivityCreateSchema.safeParse(rawBody || {});
          if (!parsedBody.success) {
            res.status(400).json({
              success: false,
              error: 'Validation failed',
              details: parsedBody.error.errors,
            });
            return;
          }
          const body = parsedBody.data || {};

          const rate = await checkRateLimit(user.uid, 'contacts_add_activity', 500, 3600000);
          if (!rate.allowed) {
            res.status(429).json({
              success: false,
              error: 'Rate limit exceeded for adding activities. Please try again later.',
            });
            return;
          }

          const allowedTypes = ['email', 'call', 'meeting', 'note', 'system_email'];
          const allowedDirections = ['inbound', 'outbound', 'internal'];

          const type = typeof body.type === 'string' ? body.type : 'note';
          const direction = typeof body.direction === 'string' ? body.direction : 'internal';

          if (!allowedTypes.includes(type) || !allowedDirections.includes(direction)) {
            res.status(400).json({
              success: false,
              error: 'Invalid activity type or direction',
            });
            return;
          }

          const subject =
            typeof body.subject === 'string' && body.subject.trim()
              ? body.subject.trim()
              : undefined;
          const content =
            typeof body.content === 'string' && body.content.trim() ? body.content.trim() : '';
          let snippet =
            typeof body.snippet === 'string' && body.snippet.trim() ? body.snippet.trim() : '';

          if (!snippet) {
            if (subject) {
              snippet = subject;
            } else if (content) {
              snippet = content.length > 140 ? `${content.slice(0, 137)}...` : content;
            } else {
              snippet = `${type} activity`;
            }
          }

          const metadata = {};
          if (body.metadata && typeof body.metadata === 'object') {
            const metaObj = body.metadata;
            const channel = typeof metaObj.channel === 'string' ? metaObj.channel : 'manual';
            metadata.channel = channel;
            if (typeof metaObj.emailJobId === 'string') {
              metadata.emailJobId = metaObj.emailJobId;
            }
            if (Array.isArray(metaObj.attachments)) {
              metadata.attachments = metaObj.attachments.filter((a) => typeof a === 'string');
            }

            Object.keys(metaObj).forEach((key) => {
              if (
                key !== 'channel' &&
                key !== 'emailJobId' &&
                key !== 'attachments' &&
                metaObj[key] !== undefined
              ) {
                metadata[key] = metaObj[key];
              }
            });
          } else {
            metadata.channel = 'manual';
          }

          const activityDoc = {
            contactId,
            type,
            direction,
            subject: subject || null,
            snippet,
            content,
            createdByUserId: user.uid,
            createdByName: user.name || user.email || null,
            timestamp: FieldValue.serverTimestamp(),
            metadata,
          };

          Object.keys(activityDoc).forEach((key) => {
            if (activityDoc[key] === undefined) {
              delete activityDoc[key];
            }
          });

          const ref = await db.collection('contact_activities').add(activityDoc);
          const shouldUpdateLastContacted =
            type === 'email' || type === 'call' || type === 'meeting' || type === 'system_email';

          if (shouldUpdateLastContacted) {
            try {
              await db.collection('contacts').doc(contactId).set(
                {
                  lastContactedAt: FieldValue.serverTimestamp(),
                  updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
              );
            } catch (updateError) {
              console.warn(
                '[contacts] Failed to update lastContactedAt for contact',
                contactId,
                updateError
              );
            }
          }

          const snap = await ref.get();
          const data = snap.data() || {};

          res.status(201).json({
            success: true,
            activity: {
              id: ref.id,
              ...data,
            },
          });
          return;
        }
      }

      const contactEmailJobsMatch =
        path.match(/^\/api\/contacts\/([^/]+)\/email-jobs$/) ||
        path.match(/^\/contacts\/([^/]+)\/email-jobs$/) ||
        null;
      if (contactEmailJobsMatch) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const contactId = contactEmailJobsMatch[1];

        if (req.method === 'GET') {
          const queryParams = req.query || {};
          const limitParam = Number.parseInt(queryParams.limit, 10);
          const limit =
            Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

          const snap = await db
            .collection('email_jobs')
            .where('contactId', '==', contactId)
            .orderBy('scheduledAt', 'desc')
            .limit(limit)
            .get();

          const jobs = snap.docs.map((doc) => {
            const data = doc.data() || {};
            return {
              id: doc.id,
              ...data,
            };
          });

          res.json({
            success: true,
            jobs,
          });
          return;
        }

        res.status(405).json({ success: false, error: 'Method Not Allowed' });
        return;
      }

      if (req.method === 'GET' && (path === '/api/email-jobs' || path === '/email-jobs')) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const queryParams = req.query || {};
        const statusFilter = queryParams.status ? String(queryParams.status) : null;
        const contactIdFilter = queryParams.contactId ? String(queryParams.contactId) : null;
        const sequenceIdFilter = queryParams.sequenceId ? String(queryParams.sequenceId) : null;
        const limitParam = Number.parseInt(queryParams.limit, 10);
        const limit =
          Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

        let query = db.collection('email_jobs').orderBy('createdAt', 'desc');
        if (statusFilter) {
          query = query.where('status', '==', statusFilter);
        }
        if (contactIdFilter) {
          query = query.where('contactId', '==', contactIdFilter);
        }
        if (sequenceIdFilter) {
          query = query.where('sequenceId', '==', sequenceIdFilter);
        }

        const snap = await query.limit(limit).get();
        const jobs = snap.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
          };
        });

        res.json({
          success: true,
          jobs,
        });
        return;
      }

      if (req.method === 'GET' && (path === '/api/email-events' || path === '/email-events')) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const queryParams = req.query || {};
        const emailJobId = queryParams.emailJobId ? String(queryParams.emailJobId) : null;
        const typeFilter = queryParams.type ? String(queryParams.type) : null;
        const limitParam = Number.parseInt(queryParams.limit, 10);
        const limit =
          Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

        let query = db.collection('email_events').orderBy('timestamp', 'desc');
        if (emailJobId) {
          query = query.where('emailJobId', '==', emailJobId);
        }
        if (typeFilter) {
          query = query.where('type', '==', typeFilter);
        }

        const snap = await query.limit(limit).get();
        const events = snap.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
          };
        });

        res.json({
          success: true,
          events,
        });
        return;
      }

      // Email templates CRUD routes
      if (
        req.method === 'GET' &&
        (path === '/api/email-templates' || path === '/email-templates')
      ) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const queryParams = req.query || {};
        const typeFilter = queryParams.type ? String(queryParams.type) : null;
        const onlyActiveRaw =
          typeof queryParams.onlyActive === 'string' ? queryParams.onlyActive : undefined;
        const onlyActive =
          typeof onlyActiveRaw === 'string' &&
          (onlyActiveRaw.toLowerCase() === 'true' || onlyActiveRaw === '1');

        let query = db.collection('email_templates').orderBy('createdAt', 'desc');
        if (typeFilter) {
          query = query.where('type', '==', typeFilter);
        }
        if (onlyActive) {
          query = query.where('isActive', '==', true);
        }

        const snap = await query.limit(100).get();
        const templates = snap.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
          };
        });

        res.json({
          success: true,
          templates,
        });
        return;
      }

      const emailTemplateIdMatchGet =
        (req.method === 'GET' &&
          (path.match(/^\/api\/email-templates\/([^/]+)$/) ||
            path.match(/^\/email-templates\/([^/]+)$/))) ||
        null;
      if (emailTemplateIdMatchGet) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const templateId = emailTemplateIdMatchGet[1];
        const doc = await db.collection('email_templates').doc(templateId).get();
        if (!doc.exists) {
          res.status(404).json({
            success: false,
            error: 'Template not found',
          });
          return;
        }
        const data = doc.data() || {};
        res.json({
          success: true,
          template: {
            id: doc.id,
            ...data,
          },
        });
        return;
      }

      if (
        req.method === 'POST' &&
        (path === '/api/email-templates' || path === '/email-templates')
      ) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const { user } = ctx;
        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const body = rawBody || {};

        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const type = typeof body.type === 'string' ? body.type : 'custom';
        const subject = typeof body.subject === 'string' ? body.subject : '';
        const bodyHtml = typeof body.bodyHtml === 'string' ? body.bodyHtml : '';

        if (!name || !subject || !bodyHtml) {
          res.status(400).json({
            success: false,
            error: 'name, subject and bodyHtml are required',
          });
          return;
        }

        const nowTs = FieldValue.serverTimestamp();
        const docData = {
          name,
          description: typeof body.description === 'string' ? body.description : '',
          type,
          subject,
          bodyHtml,
          bodyText: typeof body.bodyText === 'string' ? body.bodyText : null,
          variables: Array.isArray(body.variables)
            ? body.variables.filter((v) => typeof v === 'string')
            : [],
          isActive: typeof body.isActive === 'boolean' ? body.isActive : true,
          createdByUserId: user.uid,
          createdAt: nowTs,
          updatedAt: nowTs,
        };

        const ref = await db.collection('email_templates').add(docData);
        const snap = await ref.get();
        const data = snap.data() || {};

        res.status(201).json({
          success: true,
          template: {
            id: ref.id,
            ...data,
          },
        });
        return;
      }

      const emailTemplateIdMatchUpdate =
        ((req.method === 'PUT' || req.method === 'PATCH') &&
          (path.match(/^\/api\/email-templates\/([^/]+)$/) ||
            path.match(/^\/email-templates\/([^/]+)$/))) ||
        null;
      if (emailTemplateIdMatchUpdate) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const templateId = emailTemplateIdMatchUpdate[1];
        const ref = db.collection('email_templates').doc(templateId);
        const existingSnap = await ref.get();
        if (!existingSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Template not found',
          });
          return;
        }

        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const body = rawBody || {};
        const updateData = {};

        if (Object.prototype.hasOwnProperty.call(body, 'name') && typeof body.name === 'string') {
          updateData.name = body.name.trim();
        }
        if (Object.prototype.hasOwnProperty.call(body, 'description')) {
          updateData.description = typeof body.description === 'string' ? body.description : '';
        }
        if (Object.prototype.hasOwnProperty.call(body, 'type') && typeof body.type === 'string') {
          updateData.type = body.type;
        }
        if (
          Object.prototype.hasOwnProperty.call(body, 'subject') &&
          typeof body.subject === 'string'
        ) {
          updateData.subject = body.subject;
        }
        if (
          Object.prototype.hasOwnProperty.call(body, 'bodyHtml') &&
          typeof body.bodyHtml === 'string'
        ) {
          updateData.bodyHtml = body.bodyHtml;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'bodyText')) {
          updateData.bodyText = typeof body.bodyText === 'string' ? body.bodyText : null;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'variables')) {
          updateData.variables = Array.isArray(body.variables)
            ? body.variables.filter((v) => typeof v === 'string')
            : [];
        }
        if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
          updateData.isActive = !!body.isActive;
        }

        updateData.updatedAt = FieldValue.serverTimestamp();

        await ref.update(updateData);
        const updatedSnap = await ref.get();
        const updatedData = updatedSnap.data() || {};

        res.json({
          success: true,
          template: {
            id: updatedSnap.id,
            ...updatedData,
          },
        });
        return;
      }

      const emailTemplateIdMatchDelete =
        (req.method === 'DELETE' &&
          (path.match(/^\/api\/email-templates\/([^/]+)$/) ||
            path.match(/^\/email-templates\/([^/]+)$/))) ||
        null;
      if (emailTemplateIdMatchDelete) {
        const ctx = await requireUserWithRole(req, res, ['admin']);
        if (!ctx) return;
        const templateId = emailTemplateIdMatchDelete[1];
        const ref = db.collection('email_templates').doc(templateId);
        const existingSnap = await ref.get();
        if (!existingSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Template not found',
          });
          return;
        }

        await ref.delete();
        res.json({ success: true });
        return;
      }

      // Email sequences CRUD routes
      if (
        req.method === 'GET' &&
        (path === '/api/email-sequences' || path === '/email-sequences')
      ) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const queryParams = req.query || {};
        const onlyActiveRaw =
          typeof queryParams.onlyActive === 'string' ? queryParams.onlyActive : undefined;
        const onlyActive =
          typeof onlyActiveRaw === 'string' &&
          (onlyActiveRaw.toLowerCase() === 'true' || onlyActiveRaw === '1');

        let query = db.collection('email_sequences').orderBy('createdAt', 'desc');
        if (onlyActive) {
          query = query.where('isActive', '==', true);
        }

        const snap = await query.limit(100).get();
        const sequences = snap.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            ...data,
          };
        });

        res.json({
          success: true,
          sequences,
        });
        return;
      }

      const emailSequenceIdMatchGet =
        (req.method === 'GET' &&
          (path.match(/^\/api\/email-sequences\/([^/]+)$/) ||
            path.match(/^\/email-sequences\/([^/]+)$/))) ||
        null;
      if (emailSequenceIdMatchGet) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const sequenceId = emailSequenceIdMatchGet[1];
        const doc = await db.collection('email_sequences').doc(sequenceId).get();
        if (!doc.exists) {
          res.status(404).json({
            success: false,
            error: 'Sequence not found',
          });
          return;
        }
        const data = doc.data() || {};
        res.json({
          success: true,
          sequence: {
            id: doc.id,
            ...data,
          },
        });
        return;
      }

      if (
        req.method === 'POST' &&
        (path === '/api/email-sequences' || path === '/email-sequences')
      ) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const { user } = ctx;
        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const body = rawBody || {};

        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const description =
          Object.prototype.hasOwnProperty.call(body, 'description') &&
          typeof body.description === 'string'
            ? body.description
            : '';
        const isActive = typeof body.isActive === 'boolean' ? body.isActive : true;

        const stepsRaw = Array.isArray(body.steps) ? body.steps : [];

        const steps = [];
        stepsRaw.forEach((step, index) => {
          if (!step || typeof step !== 'object') return;
          const templateId = typeof step.templateId === 'string' ? step.templateId.trim() : '';
          if (!templateId) return;

          const waitDaysNum = Number(step.waitDays);
          const waitDays = Number.isFinite(waitDaysNum) && waitDaysNum >= 0 ? waitDaysNum : 0;

          let condition;
          const cond = step.condition;
          if (cond && typeof cond === 'object') {
            const field = typeof cond.field === 'string' ? cond.field : '';
            const op = cond.op;
            if (field && (op === '==' || op === '!=' || op === 'in' || op === 'not_in')) {
              condition = {
                field,
                op,
                value: cond.value,
              };
            }
          }

          const stepNumberRaw = Number(step.stepNumber);
          const stepNumber =
            Number.isFinite(stepNumberRaw) && stepNumberRaw > 0 ? stepNumberRaw : index + 1;

          const cleanStep = {
            stepNumber,
            templateId,
            waitDays,
          };

          if (condition) {
            cleanStep.condition = condition;
          }

          steps.push(cleanStep);
        });

        if (!name || steps.length === 0) {
          res.status(400).json({
            success: false,
            error: 'name and at least one valid step are required',
          });
          return;
        }

        const nowTs = FieldValue.serverTimestamp();
        const docData = {
          name,
          description,
          isActive,
          steps,
          createdByUserId: user.uid,
          createdAt: nowTs,
          updatedAt: nowTs,
        };

        const ref = await db.collection('email_sequences').add(docData);
        const snap = await ref.get();
        const data = snap.data() || {};

        res.status(201).json({
          success: true,
          sequence: {
            id: ref.id,
            ...data,
          },
        });
        return;
      }

      const emailSequenceIdMatchUpdate =
        ((req.method === 'PUT' || req.method === 'PATCH') &&
          (path.match(/^\/api\/email-sequences\/([^/]+)$/) ||
            path.match(/^\/email-sequences\/([^/]+)$/))) ||
        null;
      if (emailSequenceIdMatchUpdate) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const sequenceId = emailSequenceIdMatchUpdate[1];
        const ref = db.collection('email_sequences').doc(sequenceId);
        const existingSnap = await ref.get();
        if (!existingSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Sequence not found',
          });
          return;
        }

        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const body = rawBody || {};
        const updateData = {};

        if (Object.prototype.hasOwnProperty.call(body, 'name') && typeof body.name === 'string') {
          updateData.name = body.name.trim();
        }
        if (Object.prototype.hasOwnProperty.call(body, 'description')) {
          updateData.description = typeof body.description === 'string' ? body.description : '';
        }
        if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
          updateData.isActive = !!body.isActive;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'steps')) {
          const stepsRaw = Array.isArray(body.steps) ? body.steps : [];
          const steps = [];

          stepsRaw.forEach((step, index) => {
            if (!step || typeof step !== 'object') return;
            const templateId = typeof step.templateId === 'string' ? step.templateId.trim() : '';
            if (!templateId) return;

            const waitDaysNum = Number(step.waitDays);
            const waitDays = Number.isFinite(waitDaysNum) && waitDaysNum >= 0 ? waitDaysNum : 0;

            let condition;
            const cond = step.condition;
            if (cond && typeof cond === 'object') {
              const field = typeof cond.field === 'string' ? cond.field : '';
              const op = cond.op;
              if (field && (op === '==' || op === '!=' || op === 'in' || op === 'not_in')) {
                condition = {
                  field,
                  op,
                  value: cond.value,
                };
              }
            }

            const stepNumberRaw = Number(step.stepNumber);
            const stepNumber =
              Number.isFinite(stepNumberRaw) && stepNumberRaw > 0 ? stepNumberRaw : index + 1;

            const cleanStep = {
              stepNumber,
              templateId,
              waitDays,
            };

            if (condition) {
              cleanStep.condition = condition;
            }

            steps.push(cleanStep);
          });

          if (!steps.length) {
            res.status(400).json({
              success: false,
              error: 'At least one valid step is required',
            });
            return;
          }

          updateData.steps = steps;
        }

        updateData.updatedAt = FieldValue.serverTimestamp();

        await ref.update(updateData);
        const updatedSnap = await ref.get();
        const updatedData = updatedSnap.data() || {};

        res.json({
          success: true,
          sequence: {
            id: updatedSnap.id,
            ...updatedData,
          },
        });
        return;
      }

      const emailSequenceIdMatchDelete =
        (req.method === 'DELETE' &&
          (path.match(/^\/api\/email-sequences\/([^/]+)$/) ||
            path.match(/^\/email-sequences\/([^/]+)$/))) ||
        null;
      if (emailSequenceIdMatchDelete) {
        const ctx = await requireUserWithRole(req, res, ['admin']);
        if (!ctx) return;
        const sequenceId = emailSequenceIdMatchDelete[1];
        const ref = db.collection('email_sequences').doc(sequenceId);
        const existingSnap = await ref.get();
        if (!existingSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Sequence not found',
          });
          return;
        }

        await ref.delete();
        res.json({ success: true });
        return;
      }

      const scheduleSequenceMatch =
        (req.method === 'POST' &&
          (path.match(/^\/api\/contacts\/([^/]+)\/schedule-sequence$/) ||
            path.match(/^\/contacts\/([^/]+)\/schedule-sequence$/))) ||
        null;
      if (scheduleSequenceMatch) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const { user } = ctx;
        const contactId = scheduleSequenceMatch[1];

        const rate = await checkRateLimit(user.uid, 'contacts_schedule_sequence', 50, 3600000);
        if (!rate.allowed) {
          res.status(429).json({
            success: false,
            error: 'Rate limit exceeded for scheduling sequences. Please try again later.',
          });
          return;
        }

        const contactSnap = await db.collection('contacts').doc(contactId).get();
        if (!contactSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Contact not found',
          });
          return;
        }
        const contactData = contactSnap.data() || {};
        const toEmail =
          contactData.email && typeof contactData.email === 'string'
            ? contactData.email.trim().toLowerCase()
            : '';
        if (!toEmail) {
          res.status(400).json({
            success: false,
            error: 'Contact email is missing',
          });
          return;
        }

        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const parsedBody = scheduleSequenceBodySchema.safeParse(rawBody || {});
        if (!parsedBody.success) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: parsedBody.error.errors,
          });
          return;
        }
        const { sequenceId } = parsedBody.data;

        const sequenceSnap = await db.collection('email_sequences').doc(sequenceId).get();
        if (!sequenceSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Email sequence not found',
          });
          return;
        }
        const sequence = sequenceSnap.data() || {};
        if (sequence.isActive === false) {
          res.status(400).json({
            success: false,
            error: 'Email sequence is not active',
          });
          return;
        }

        const stepsRaw = Array.isArray(sequence.steps) ? sequence.steps.slice() : [];
        if (!stepsRaw.length) {
          res.status(400).json({
            success: false,
            error: 'Email sequence has no steps',
          });
          return;
        }

        stepsRaw.sort((a, b) => {
          const aNum = Number(a.stepNumber) || 0;
          const bNum = Number(b.stepNumber) || 0;
          return aNum - bNum;
        });

        const now = new Date();
        const nowTs = FieldValue.serverTimestamp();
        const jobsCol = db.collection('email_jobs');
        const jobs = [];

        let cumulativeDays = 0;
        let firstScheduledTs = null;

        for (const step of stepsRaw) {
          const templateId = step && typeof step.templateId === 'string' ? step.templateId : '';
          if (!templateId) continue;

          const waitDaysNum = Number(step.waitDays);
          const waitDays = Number.isFinite(waitDaysNum) && waitDaysNum >= 0 ? waitDaysNum : 0;
          cumulativeDays += waitDays;

          const stepNumberRaw = Number(step.stepNumber);
          const stepNumber =
            Number.isFinite(stepNumberRaw) && stepNumberRaw > 0 ? stepNumberRaw : undefined;

          const scheduledDate = new Date(now.getTime() + cumulativeDays * 24 * 60 * 60 * 1000);
          const scheduledTs = admin.firestore.Timestamp.fromDate(scheduledDate);

          if (!firstScheduledTs) {
            firstScheduledTs = scheduledTs;
          }

          const jobDoc = {
            contactId,
            sequenceId,
            stepNumber: stepNumber || null,
            templateId,
            scheduleType: 'scheduled',
            scheduledAt: scheduledTs,
            status: 'scheduled',
            provider: 'resend',
            providerMessageId: null,
            sentAt: null,
            openedAt: null,
            clickedAt: null,
            bouncedAt: null,
            lastError: null,
            createdByUserId: user.uid,
            createdAt: nowTs,
            updatedAt: nowTs,
          };

          const jobRef = await jobsCol.add(jobDoc);
          const jobSnap = await jobRef.get();
          const jobData = jobSnap.data() || {};
          jobs.push({
            id: jobRef.id,
            ...jobData,
          });
        }

        if (!jobs.length) {
          res.status(400).json({
            success: false,
            error: 'No valid steps to schedule for this sequence',
          });
          return;
        }

        if (firstScheduledTs) {
          try {
            await db.collection('contacts').doc(contactId).set(
              {
                nextFollowUpAt: firstScheduledTs,
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          } catch (err) {
            console.warn(
              '[contacts] Failed to update nextFollowUpAt after scheduling sequence',
              contactId,
              err
            );
          }
        }

        res.status(201).json({
          success: true,
          contactId,
          sequenceId,
          jobs,
        });
        return;
      }

      const sendEmailMatch =
        (req.method === 'POST' &&
          (path.match(/^\/api\/contacts\/([^/]+)\/send-email$/) ||
            path.match(/^\/contacts\/([^/]+)\/send-email$/))) ||
        null;
      if (sendEmailMatch) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;
        const { user } = ctx;
        const contactId = sendEmailMatch[1];

        const rate = await checkRateLimit(user.uid, 'contacts_send_email', 100, 3600000);
        if (!rate.allowed) {
          res.status(429).json({
            success: false,
            error: 'Rate limit exceeded for sending emails. Please try again later.',
          });
          return;
        }

        const contactSnap = await db.collection('contacts').doc(contactId).get();
        if (!contactSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Contact not found',
          });
          return;
        }
        const contactData = contactSnap.data() || {};
        const toEmail =
          contactData.email && typeof contactData.email === 'string'
            ? contactData.email.trim().toLowerCase()
            : '';
        if (!toEmail) {
          res.status(400).json({
            success: false,
            error: 'Contact email is missing',
          });
          return;
        }

        const rawBody =
          typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
        const parsedBody = sendEmailBodySchema.safeParse(rawBody || {});
        if (!parsedBody.success) {
          res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: parsedBody.error.errors,
          });
          return;
        }
        const body = parsedBody.data;
        const { templateId } = body;

        const templateSnap = await db.collection('email_templates').doc(templateId).get();
        if (!templateSnap.exists) {
          res.status(404).json({
            success: false,
            error: 'Email template not found',
          });
          return;
        }
        const template = templateSnap.data() || {};

        const variables =
          body.variables && typeof body.variables === 'object' ? body.variables : {};

        const subjectBase =
          typeof body.subjectOverride === 'string' && body.subjectOverride.trim()
            ? body.subjectOverride.trim()
            : template.subject || '';
        const htmlBase =
          typeof body.bodyHtmlOverride === 'string' && body.bodyHtmlOverride.trim()
            ? body.bodyHtmlOverride
            : template.bodyHtml || '';
        const textBase =
          typeof body.bodyTextOverride === 'string' && body.bodyTextOverride.trim()
            ? body.bodyTextOverride
            : template.bodyText || '';

        function renderTemplate(str) {
          if (!str) return '';
          return str.replace(/{{\s*([^}]+)\s*}}/g, (match, keyRaw) => {
            const key = keyRaw.trim();
            if (!key) return '';

            if (key.startsWith('contact.')) {
              const field = key.slice('contact.'.length);
              const value = contactData[field];
              return value != null ? String(value) : '';
            }

            if (Object.prototype.hasOwnProperty.call(variables, key)) {
              const value = variables[key];
              return value != null ? String(value) : '';
            }

            return '';
          });
        }

        const subject = renderTemplate(subjectBase);
        const html = renderTemplate(htmlBase);
        const text = textBase ? renderTemplate(textBase) : '';

        const nowTs = FieldValue.serverTimestamp();
        const jobsCol = db.collection('email_jobs');
        const jobRef = await jobsCol.add({
          contactId,
          sequenceId: null,
          stepNumber: null,
          templateId,
          scheduleType: 'immediate',
          scheduledAt: nowTs,
          status: 'sending',
          provider: 'resend',
          providerMessageId: null,
          sentAt: null,
          openedAt: null,
          clickedAt: null,
          bouncedAt: null,
          lastError: null,
          createdByUserId: user.uid,
          createdAt: nowTs,
          updatedAt: nowTs,
        });

        let providerMessageId = null;
        let sendError = null;

        try {
          const sendResult = await sendResendEmail({
            to: toEmail,
            subject,
            html,
            text,
            tags: ['contact_management'],
          });
          providerMessageId = sendResult && sendResult.id ? String(sendResult.id) : null;

          await jobRef.update({
            status: 'sent',
            providerMessageId,
            sentAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } catch (err) {
          console.error('[email] Failed to send email via Resend', err);
          sendError = err;
          await jobRef.update({
            status: 'failed',
            lastError: err && err.message ? String(err.message) : 'Unknown error',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        // Log contact activity
        try {
          const activityDoc = {
            contactId,
            type: 'email',
            direction: 'outbound',
            subject,
            snippet: subject || 'Email sent',
            content: html || text || '',
            createdByUserId: user.uid,
            createdByName: user.name || user.email || null,
            timestamp: FieldValue.serverTimestamp(),
            metadata: {
              channel: 'resend',
              emailJobId: jobRef.id,
              providerMessageId,
              templateId,
            },
          };

          const actRef = await db.collection('contact_activities').add(activityDoc);

          try {
            await db.collection('contacts').doc(contactId).set(
              {
                lastContactedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true }
            );
          } catch (updateError) {
            console.warn(
              '[contacts] Failed to update lastContactedAt after send-email',
              contactId,
              updateError
            );
          }

          const actSnap = await actRef.get();
          const actData = actSnap.data() || {};

          res.status(sendError ? 500 : 200).json({
            success: !sendError,
            job: {
              id: jobRef.id,
            },
            activity: {
              id: actRef.id,
              ...actData,
            },
            error: sendError
              ? sendError && sendError.message
                ? String(sendError.message)
                : 'Failed to send email'
              : undefined,
          });
          return;
        } catch (activityError) {
          console.error('[email] Failed to log email activity', activityError);

          res.status(sendError ? 500 : 200).json({
            success: !sendError,
            job: {
              id: jobRef.id,
            },
            activity: null,
            error: sendError
              ? sendError && sendError.message
                ? String(sendError.message)
                : 'Failed to send email'
              : undefined,
          });
          return;
        }
      }

      // Route: GET /api/ai/document-status/:jobId (Firebase hosting sends full path)
      if (req.method === 'GET' && path.match(/^\/api\/ai\/document-status\/(.+)$/)) {
        // SECURITY: Authenticate user for document status
        try {
          const user = await authenticateHttpRequest(req);
          const jobId = path.match(/^\/api\/ai\/document-status\/(.+)$/)[1];
          console.log(`📄 Extracted jobId: ${jobId} for user: ${user.uid}`);
          return await handleDocumentStatus(req, res, jobId, user);
        } catch (authError) {
          return res.status(401).json({
            success: false,
            error: authError.message,
          });
        }
      }

      // Also try without /api prefix in case Firebase strips it
      if (req.method === 'GET' && path.match(/^\/ai\/document-status\/(.+)$/)) {
        // SECURITY: Authenticate user for document status
        try {
          const user = await authenticateHttpRequest(req);
          const jobId = path.match(/^\/ai\/document-status\/(.+)$/)[1];
          console.log(`📄 Extracted jobId (no /api prefix): ${jobId} for user: ${user.uid}`);
          return await handleDocumentStatus(req, res, jobId, user);
        } catch (authError) {
          return res.status(401).json({
            success: false,
            error: authError.message,
          });
        }
      }
      // Route: POST /api/ai/prompt-library-chat
      if (
        req.method === 'POST' &&
        (path === '/api/ai/prompt-library-chat' || path === '/ai/prompt-library-chat')
      ) {
        try {
          const user = await authenticateHttpRequest(req);
          return await handlePromptLibraryChat(req, res, user);
        } catch (authError) {
          return res.status(401).json({ success: false, error: authError.message });
        }
      }

      // Emulator-only GET test route to avoid JSON body parsing issues during CLI tests
      const isAnyEmulator =
        String(process.env.FUNCTIONS_EMULATOR || '').toLowerCase() === 'true' ||
        !!process.env.FIREBASE_EMULATOR_HUB;
      if (
        isAnyEmulator &&
        req.method === 'GET' &&
        (path === '/api/ai/prompt-library-chat-test' || path === '/ai/prompt-library-chat-test')
      ) {
        try {
          const user = await authenticateHttpRequest(req);
          // Synthesize a body from query for the existing handler
          req.body = { message: String(req.query?.message || '') };
          return await handlePromptLibraryChat(req, res, user);
        } catch (authError) {
          return res.status(401).json({ success: false, error: authError.message });
        }
      }

      // Emulator-only: Self-test suite for chat intents (GET)
      if (
        isAnyEmulator &&
        req.method === 'GET' &&
        (path === '/api/ai/prompt-library-chat-selftest' ||
          path === '/ai/prompt-library-chat-selftest')
      ) {
        try {
          const user = await authenticateHttpRequest(req);
          // Seed test prompts
          const seed1 = await db.collection('prompts').add({
            userId: user.uid,
            title: 'SelfTest A',
            content: 'Alpha',
            isDeleted: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            version: 1,
          });
          const seed2 = await db.collection('prompts').add({
            userId: user.uid,
            title: 'SelfTest B',
            content: 'Beta',
            isDeleted: false,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            version: 1,
          });

          function createResCapture() {
            const obj = { statusCode: 200, body: null };
            const resStub = {
              _obj: obj,
              setHeader() {
                return this;
              },
              status(code) {
                this._obj.statusCode = code;
                return this;
              },
              json(payload) {
                this._obj.body = payload;
                return this;
              },
            };
            return { resStub, obj };
          }

          const tests = [
            { name: 'list_show', msg: 'Show me all my prompts', expect: 200 },
            { name: 'list_display', msg: 'display my prompts', expect: 200 },
            { name: 'list_view', msg: 'view prompts', expect: 200 },
            { name: 'list_get', msg: 'get prompt list', expect: 200 },
            { name: 'list_whitespace', msg: '   LIST   my   PROMPTS   ', expect: 200 },
            {
              name: 'update_title_update',
              msg: `Update the title of ${seed1.id} to "New Title E2E"`,
              expect: 200,
            },
            {
              name: 'update_title_set',
              msg: `set title of id ${seed1.id} as "Another Title"`,
              expect: 200,
            },
            {
              name: 'update_content_update',
              msg: `Update the content of ${seed1.id} to "Updated content E2E"`,
              expect: 200,
            },
            {
              name: 'update_content_with',
              msg: `set content of prompt ${seed1.id} with "Body 2"`,
              expect: 200,
            },
            { name: 'delete_delete', msg: `Delete the prompt ${seed2.id}`, expect: 200 },
            { name: 'delete_remove', msg: `remove prompt id ${seed2.id}`, expect: 200 },
            { name: 'delete_archive', msg: `archive the prompt ${seed2.id}`, expect: 200 },
            // Negative cases
            { name: 'bad_empty_title', msg: `update the title of ${seed1.id} to ""`, expect: 400 },
            { name: 'bad_empty_content', msg: `update content of ${seed1.id} to ""`, expect: 400 },
            { name: 'bad_missing_id_title', msg: 'update the title to "Oops"', expect: 400 },
            { name: 'bad_invalid_id_delete', msg: 'delete the prompt abc def', expect: 400 },
            {
              name: 'not_found_delete',
              msg: 'delete the prompt does-not-exist-12345',
              expect: 404,
            },
            // Contextual operation tests (require list context first)
            { name: 'contextual_list_setup', msg: 'Show me all my prompts', expect: 200 },
            { name: 'contextual_delete_it_ambiguous', msg: 'delete it', expect: 400 }, // Ambiguous - multiple prompts
            { name: 'contextual_delete_first', msg: 'delete the first one', expect: 200 },
            { name: 'contextual_list_again', msg: 'list my prompts', expect: 200 },
            {
              name: 'contextual_update_title_first',
              msg: 'update the title of the first one to "Contextual Title"',
              expect: 200,
            },
            {
              name: 'contextual_update_content_first',
              msg: 'update the content of the first one to "Contextual Content"',
              expect: 200,
            },
            { name: 'contextual_delete_by_title', msg: 'delete SelfTest B', expect: 200 },
            { name: 'contextual_no_context', msg: 'delete the second one', expect: 400 }, // No context after previous delete
            // Test context expiration and missing context
            { name: 'contextual_delete_it_no_list', msg: 'delete it', expect: 400 }, // No recent list
          ];

          const results = [];
          for (const tc of tests) {
            const reqStub = {
              body: { message: tc.msg, conversationId: 'SELFTEST' },
              headers: {},
              method: 'POST',
            };
            const { resStub, obj } = createResCapture();
            await handlePromptLibraryChat(reqStub, resStub, user);
            const pass =
              obj.statusCode === tc.expect || (tc.expect === 200 && obj.body?.success === true);
            results.push({
              name: tc.name,
              message: tc.msg,
              status: obj.statusCode,
              success: obj.body?.success === true,
              error: obj.body?.error || null,
              duration: obj.body?.metadata?.duration ?? null,
              pass,
            });
          }
          const passCount = results.filter((r) => r.pass).length;
          const passRate = results.length ? Math.round((passCount / results.length) * 100) : 0;
          return res.json({
            success: true,
            summary: { total: results.length, passed: passCount, passRate },
            results,
          });
        } catch (authError) {
          return res.status(401).json({ success: false, error: authError.message });
        }
      }

      // Developer overview endpoint for contact & email pipeline metrics
      if (req.method === 'GET' && (path === '/api/dev/overview' || path === '/dev/overview')) {
        const ctx = await requireUserWithRole(req, res, ['admin', 'dev']);
        if (!ctx) return;

        const now = new Date();
        const windowDays = 90;
        const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
        const windowStartTs = admin.firestore.Timestamp.fromDate(windowStart);

        const [contactsSnap, emailJobsSnap, sequencesSnap, templatesSnap] = await Promise.all([
          db.collection('contacts').where('createdAt', '>=', windowStartTs).limit(1000).get(),
          db.collection('email_jobs').where('createdAt', '>=', windowStartTs).limit(1000).get(),
          db.collection('email_sequences').limit(200).get(),
          db.collection('email_templates').limit(200).get(),
        ]);

        const contactsByStatus = {};
        const contactsBySource = {};
        contactsSnap.docs.forEach((doc) => {
          const data = doc.data() || {};
          const status = typeof data.status === 'string' ? data.status : 'unknown';
          const source = typeof data.source === 'string' ? data.source : 'unknown';
          contactsByStatus[status] = (contactsByStatus[status] || 0) + 1;
          contactsBySource[source] = (contactsBySource[source] || 0) + 1;
        });

        const emailJobsByStatus = {};
        const emailJobsByScheduleType = {};
        emailJobsSnap.docs.forEach((doc) => {
          const data = doc.data() || {};
          const status = typeof data.status === 'string' ? data.status : 'unknown';
          const scheduleType =
            typeof data.scheduleType === 'string' ? data.scheduleType : 'unknown';
          emailJobsByStatus[status] = (emailJobsByStatus[status] || 0) + 1;
          emailJobsByScheduleType[scheduleType] = (emailJobsByScheduleType[scheduleType] || 0) + 1;
        });

        res.json({
          success: true,
          windowDays,
          contacts: {
            sampleSize: contactsSnap.size,
            byStatus: contactsByStatus,
            bySource: contactsBySource,
          },
          emailJobs: {
            sampleSize: emailJobsSnap.size,
            byStatus: emailJobsByStatus,
            byScheduleType: emailJobsByScheduleType,
          },
          sequences: {
            total: sequencesSnap.size,
          },
          templates: {
            total: templatesSnap.size,
          },
        });
        return;
      }

      // Route: Health check
      if (
        req.method === 'GET' &&
        (path === '/api/health' || path === '/health' || path === '/ai/health')
      ) {
        res.json({
          status: 'healthy',
          region: 'australia-southeast1',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Default: Unknown endpoint
      res.status(404).json({
        success: false,
        error: `Unknown API endpoint: ${req.method} ${path}`,
      });
    } catch (error) {
      console.error('❌ API Error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

// Handle document status requests
async function handleDocumentStatus(req, res, jobId, user) {
  try {
    console.log(`📊 Checking status for job: ${jobId} by user: ${user.uid}`);

    // Get document from Firestore
    const docRef = db.collection('rag_documents').doc(jobId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`❌ Document not found: ${jobId}`);
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    const docData = docSnap.data();

    // SECURITY: Verify user owns this document
    // Check both userId and uploadedBy for backward compatibility
    const documentOwner = docData.userId || docData.uploadedBy;
    if (documentOwner !== user.uid) {
      console.log(
        `❌ Unauthorized access attempt: ${user.uid} tried to access document owned by ${documentOwner}`
      );
      return res.status(403).json({
        success: false,
        error: 'Unauthorized: You do not own this document',
      });
    }

    console.log(`📄 Document status: ${docData.status}`);

    // Map internal status to frontend-expected status
    let status = docData.status;
    if (status === 'uploaded') {
      status = 'processing';
    }

    const response = {
      success: true,
      job_id: jobId,
      status: status,
      document_id: jobId,
      created_at: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updated_at:
        docData.processedAt?.toDate?.()?.toISOString() ||
        docData.createdAt?.toDate?.()?.toISOString() ||
        new Date().toISOString(),
      progress: getProgressFromStatus(status),
      error_message: docData.error || null,
    };

    console.log(`✅ Returning status response:`, response);
    res.json(response);
  } catch (error) {
    console.error(`❌ Error getting document status for ${jobId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get document status',
    });
  }
}

// Helper: Build a brief system prompt from dashboard context
function buildSystemPromptFromDashboard(ctx) {
  try {
    const parts = [];
    parts.push(
      "You are EthosPrompt's Prompt Library assistant. Use the provided dashboard context to tailor answers. If context is not relevant, answer normally."
    );
    if (ctx?.currentPage) parts.push(`Current page: ${ctx.currentPage}.`);
    if (ctx?.selectedPrompt?.title) parts.push(`Selected prompt: ${ctx.selectedPrompt.title}.`);
    if (typeof ctx?.totalPrompts === 'number') parts.push(`Total prompts: ${ctx.totalPrompts}.`);
    if (ctx?.userPreferences?.defaultModel)
      parts.push(`Default model: ${ctx.userPreferences.defaultModel}.`);
    return parts.join(' ');
  } catch (_e) {
    return 'You are EthosPrompt assistant.';
  }
}

// Handler: Prompt Library Chat (now with basic tool intents for list/update/delete)
async function handlePromptLibraryChat(req, res, user) {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const message = (body.message || '').toString().trim();
    const conversationId = body.conversationId || randomUUID();
    const dashboardContext = body.dashboardContext || null;

    if (!message) {
      return res.status(400).json({ success: false, error: 'message is required' });
    }

    // Rate limit: 100 requests/hour per user for chat
    const rate = await checkRateLimit(user.uid, 'prompt_library_chat', 100, 3600000);
    if (!rate.allowed) {
      const seconds = Math.max(1, Math.ceil((rate.resetAt - new Date()) / 1000));
      return res
        .status(429)
        .json({ success: false, error: 'Rate limit exceeded', retry_after: seconds });
    }

    // --- Intent detection for tools ---

    // Hardened parsing helpers (synonyms, whitespace, validation)
    const messageNorm = message.replace(/\s+/g, ' ').trim();
    const idPattern = '[A-Za-z0-9_-]{5,64}';
    const listSynonyms = /\b(show|list|display|view|get)\b/i;
    const listRegex2 = /\b(list|show|display|view|get)\s+(my\s+)?(prompts?|all)\b/i;

    // Fast path: handle confirmation/cancellation of a pending delete
    const pending = await getPendingDeleteAsync(conversationId, user.uid);
    if (pending) {
      const isConfirm = /\b(confirm|yes|y|proceed|ok|okay)\b/i.test(messageNorm);
      const isCancel = /\b(cancel|no|n|stop|abort|never\s?mind|nah)\b/i.test(messageNorm);
      if (isConfirm) {
        const t0 = Date.now();
        const deletedIds = [];
        const errors = [];
        try {
          for (const promptId of pending.ids) {
            if (!isValidId(promptId)) {
              errors.push(`Invalid ID format: ${promptId}`);
              continue;
            }
            const ref = db.collection('prompts').doc(promptId);
            const snap = await ref.get();
            if (!snap.exists) {
              errors.push(`Prompt ${promptId} not found`);
              continue;
            }
            const existing = snap.data();
            if (existing.userId !== user.uid) {
              errors.push(`Permission denied for ${promptId}`);
              continue;
            }
            await ref.update({
              isDeleted: true,
              deletedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
            deletedIds.push(promptId);
          }
          await clearPendingDeleteAsync(conversationId);
          const titleMap = new Map((pending.items || []).map((it) => [it.id, it.title || '']));
          const lines = deletedIds.map(
            (id) => `- ${id}${titleMap.get(id) ? `: ${titleMap.get(id)}` : ''}`
          );
          const responseText = deletedIds.length
            ? `Deleted ${deletedIds.length} prompt(s):\n${lines.join('\n')}${
                errors.length ? `\nErrors: ${errors.join('; ')}` : ''
              }`
            : `No prompts were deleted.${errors.length ? ` Errors: ${errors.join('; ')}` : ''}`;
          return res.json({
            success: deletedIds.length > 0,
            response: responseText,
            conversationId,
            metadata: {
              tool_calls: [
                {
                  name: 'delete_prompt',
                  duration: (Date.now() - t0) / 1000,
                  success: deletedIds.length > 0,
                  deleted_count: deletedIds.length,
                  errors: errors.length ? errors : undefined,
                },
              ],
            },
          });
        } catch (e) {
          await clearPendingDeleteAsync(conversationId);
          return res.status(500).json({ success: false, error: e.message, conversationId });
        }
      } else if (isCancel) {
        await clearPendingDeleteAsync(conversationId);
        return res.json({ success: true, response: 'Deletion cancelled.', conversationId });
      }
      // If there's a pending delete but user said something else, fall through to normal handling
    }

    /\b(show|list|display|view|get)\b\s*(?:me\s*)?(?:all\s*)?(?:of\s*)?(?:my\s*)?(?:the\s*)?(?:list\s+of\s+prompts|prompts?|prompt\s+list)\b/i;
    const updateTitleRegexes = [
      new RegExp(
        `\\b(update|set|change|rename|retitle)\\b\\s*(?:the\\s*)?title\\s*(?:of\\s*)?(?:prompt\\s*|id\\s*)?(${idPattern})\\s*(?:to|=|as|:)\\s*['\"]([^'\"]+)['\"]`,
        'i'
      ),
      new RegExp(
        `\\b(update|set|change|rename|retitle)\\b\\s*(?:the\\s*)?title\\s*(?:of\\s*)?(?:prompt\\s*|id\\s*)?(${idPattern})\\s*(?:to|=|as|:)\\s*(.+)$`,
        'i'
      ),
    ];
    const updateContentRegexes = [
      new RegExp(
        `\\b(update|set|change|replace)\\b\\s*(?:the\\s*)?content\\s*(?:of\\s*)?(?:prompt\\s*|id\\s*)?(${idPattern})\\s*(?:to|=|with|as|:)\\s*['\"]([^'\"]+)['\"]`,
        'i'
      ),
      new RegExp(
        `\\b(update|set|change|replace)\\b\\s*(?:the\\s*)?content\\s*(?:of\\s*)?(?:prompt\\s*|id\\s*)?(${idPattern})\\s*(?:to|=|with|as|:)\\s*(.+)$`,
        'i'
      ),
    ];
    const deleteRegexes = [
      // Delete by ID: "delete prompt abc123"
      new RegExp(
        `\\b(delete|remove|trash|archive)\\b\\s*(?:the\\s*)?prompt\\s*(?:id\\s*)?(${idPattern})\\b`,
        'i'
      ),
    ];

    // Contextual delete patterns (require conversation context)
    const deleteContextualRegexes = [
      // "delete it" / "remove it" / "trash it"
      /\b(delete|remove|trash|archive)\s+it\b/i,
      // "delete the first one" / "delete the second one" / "delete the third one"
      /\b(delete|remove|trash|archive)\s+(?:the\s+)?(first|second|third|1st|2nd|3rd)\s+(?:one|prompt)\b/i,
      // "delete both" / "delete all" / "delete all of them"
      /\b(delete|remove|trash|archive)\s+(?:both|all)(?:\s+(?:of\s+)?(?:them|these|those))?\b/i,
      // "delete [title]" - will be handled separately by title matching
    ];
    function isValidId(val) {
      return /^[A-Za-z0-9_-]{5,64}$/.test(val || '');
    }
    function stripQuotes(s) {
      return (s || '').replace(/^["']|["']$/g, '').trim();
    }
    function matchAny(regexes, text) {
      for (const r of regexes) {
        const mm = r.exec(text);
        if (mm) return mm;
      }
      return null;
    }
    function wantsList(text) {
      if (listRegex2.test(text)) return true;
      return /\bprompts?\b/i.test(text) && listSynonyms.test(text);
    }

    /**
     * Resolve contextual delete reference to prompt ID(s)
     * @param {string} message - User message
     * @param {Object} context - Conversation context
     * @returns {Array<string>|null|{error: string}} Array of prompt IDs, null if cannot resolve, or error object
     */
    function resolveContextualDelete(message, context) {
      if (!context || !context.lastListedPrompts || context.lastListedPrompts.length === 0) {
        return null;
      }

      const prompts = context.lastListedPrompts;
      const messageNorm = message.toLowerCase().trim();

      // "delete it" - only if there's exactly one prompt in context
      if (/\b(delete|remove|trash|archive)\s+it\b/i.test(messageNorm)) {
        if (prompts.length === 1) {
          return [prompts[0].id];
        }
        // Ambiguous - multiple prompts
        return {
          error:
            'Ambiguous reference: "it" could refer to multiple prompts. Please say "delete the first one", "delete both", or specify the prompt ID or title.',
        };
      }

      // "delete the first one" / "delete the second one"
      const positionMatch = messageNorm.match(
        /\b(delete|remove|trash|archive)\s+(?:the\s+)?(first|second|third|1st|2nd|3rd)\s+(?:one|prompt)\b/i
      );
      if (positionMatch) {
        const posWord = positionMatch[2].toLowerCase();
        let position = 0;
        if (posWord === 'first' || posWord === '1st') position = 1;
        else if (posWord === 'second' || posWord === '2nd') position = 2;
        else if (posWord === 'third' || posWord === '3rd') position = 3;

        const prompt = prompts.find((p) => p.position === position);
        return prompt ? [prompt.id] : null;
      }

      // "delete both" / "delete all"
      if (
        /\b(delete|remove|trash|archive)\s+(?:both|all)(?:\s+(?:of\s+)?(?:them|these|those))?\b/i.test(
          messageNorm
        )
      ) {
        return prompts.map((p) => p.id);
      }

      // "delete [title]" - fuzzy match by title
      const deleteVerb = /\b(delete|remove|trash|archive)\b/i.exec(messageNorm);
      if (deleteVerb) {
        // Extract potential title after the delete verb
        const afterVerb = message.substring(deleteVerb.index + deleteVerb[0].length).trim();
        // Remove common words like "the", "prompt", "called", "named"
        const titleQuery = afterVerb
          .replace(/^(?:the\s+)?(?:prompt\s+)?(?:called\s+)?(?:named\s+)?/i, '')
          .replace(/^["']|["']$/g, '')
          .trim()
          .toLowerCase();

        // Exclude very short queries and common contextual words
        const excludedWords = ['it', 'one', 'this', 'that', 'them', 'these', 'those'];
        if (titleQuery.length > 2 && !excludedWords.includes(titleQuery)) {
          // Find prompt with matching title (case-insensitive, partial match)
          const matchedPrompt = prompts.find(
            (p) =>
              p.title.toLowerCase().includes(titleQuery) ||
              titleQuery.includes(p.title.toLowerCase())
          );

          if (matchedPrompt) {
            return [matchedPrompt.id];
          }
        }
      }

      return null;
    }

    /**
     * Resolve contextual update reference to prompt ID
     * @param {string} message - User message
     * @param {Object} context - Conversation context
     * @returns {string|null} Prompt ID or null if cannot resolve
     */
    function resolveContextualUpdate(message, context) {
      if (!context || !context.lastListedPrompts || context.lastListedPrompts.length === 0) {
        return null;
      }

      const prompts = context.lastListedPrompts;
      const messageNorm = message.toLowerCase().trim();

      // "update the first one" / "update the title of the first one" / "update the content of the second one"
      const positionMatch = messageNorm.match(
        /\b(update|set|change|rename|retitle)\s+(?:the\s+)?(?:title|content)?\s*(?:of\s+)?(?:the\s+)?(first|second|third|1st|2nd|3rd)\s+(?:one|prompt)\b/i
      );
      if (positionMatch) {
        const posWord = positionMatch[2].toLowerCase();
        let position = 0;
        if (posWord === 'first' || posWord === '1st') position = 1;
        else if (posWord === 'second' || posWord === '2nd') position = 2;
        else if (posWord === 'third' || posWord === '3rd') position = 3;

        const prompt = prompts.find((p) => p.position === position);
        return prompt ? prompt.id : null;
      }

      // "update [title]" - fuzzy match by title
      const updateVerb = /\b(update|set|change|rename|retitle)\b/i.exec(messageNorm);
      if (updateVerb) {
        // Extract potential title between verb and "to"
        const afterVerb = message.substring(updateVerb.index + updateVerb[0].length);
        const toMatch = /\s+to\s+/i.exec(afterVerb);
        if (toMatch) {
          const titlePart = afterVerb.substring(0, toMatch.index).trim();
          const titleQuery = titlePart
            .replace(
              /^(?:the\s+)?(?:title\s+of\s+)?(?:the\s+)?(?:prompt\s+)?(?:called\s+)?(?:named\s+)?/i,
              ''
            )
            .replace(/^["']|["']$/g, '')
            .trim()
            .toLowerCase();

          if (titleQuery.length > 2) {
            const matchedPrompt = prompts.find(
              (p) =>
                p.title.toLowerCase().includes(titleQuery) ||
                titleQuery.includes(p.title.toLowerCase())
            );
            if (matchedPrompt) {
              return matchedPrompt.id;
            }
          }
        }
      }

      return null;
    }

    const tool_calls = [];
    const overallStart = Date.now();

    // Tool: list_prompts
    if (wantsList(messageNorm)) {
      const t0 = Date.now();
      try {
        const limitCount = Math.min(body.limit || 50, 100);
        let query = db
          .collection('prompts')
          .where('userId', '==', user.uid)
          .where('isDeleted', '==', false)
          .orderBy('updatedAt', 'desc')
          .limit(limitCount);
        if (Array.isArray(body.tags) && body.tags.length > 0) {
          query = query.where('tags', 'array-contains-any', body.tags.slice(0, 10));
        }
        if (body.category) {
          query = query.where('category', '==', body.category);
        }
        const snapshot = await query.get();
        const prompts = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            title: d.title,
            updatedAt: d.updatedAt?.toDate?.() || d.updatedAt,
            isDeleted: !!d.isDeleted,
          };
        });

        tool_calls.push({
          name: 'list_prompts',
          args: {
            limit: limitCount,
            category: body.category || null,
            tags: Array.isArray(body.tags) ? body.tags.slice(0, 10) : [],
          },
          duration: (Date.now() - t0) / 1000,
          success: true,
          result_count: prompts.length,
        });

        // Store conversation context for contextual commands (e.g., "delete it")
        if (prompts.length > 0) {
          storeConversationContext(conversationId, user.uid, prompts);
          await persistConversationContext(conversationId, user.uid);
        }

        const lines = prompts.map((p) => `- ${p.id}: ${p.title}`).slice(0, 20);
        const responseText = prompts.length
          ? `Found ${prompts.length} prompts:\n${lines.join('\n')}`
          : 'You have no prompts yet.';

        return res.json({
          success: true,
          response: responseText,
          conversationId,
          metadata: {
            tool_calls,
            duration: (Date.now() - overallStart) / 1000,
            tokens_used: 0,
            cost: 0,
          },
        });
      } catch (e) {
        tool_calls.push({
          name: 'list_prompts',
          duration: (Date.now() - t0) / 1000,
          success: false,
          error: e.message,
        });
        return res
          .status(500)
          .json({ success: false, error: e.message, conversationId, metadata: { tool_calls } });
      }
    }

    // Tool: count_prompts (explicit count instead of relying on dashboard context)
    if (/\bhow\s+many\b/i.test(messageNorm) && /\bprompts?\b/i.test(messageNorm)) {
      const t0 = Date.now();
      try {
        const snapshot = await db
          .collection('prompts')
          .where('userId', '==', user.uid)
          .where('isDeleted', '==', false)
          .get();
        const count = snapshot.size || 0;
        tool_calls.push({
          name: 'count_prompts',
          duration: (Date.now() - t0) / 1000,
          success: true,
          result_count: count,
        });
        return res.json({
          success: true,
          response: `You currently have ${count} prompt${count === 1 ? '' : 's'}.`,
          conversationId,
          metadata: {
            tool_calls,
            duration: (Date.now() - overallStart) / 1000,
            tokens_used: 0,
            cost: 0,
          },
        });
      } catch (e) {
        tool_calls.push({
          name: 'count_prompts',
          duration: (Date.now() - t0) / 1000,
          success: false,
          error: e.message,
        });
        return res
          .status(500)
          .json({ success: false, error: e.message, conversationId, metadata: { tool_calls } });
      }
    }

    // Tool: update_prompt (title) - with contextual support
    let m = matchAny(updateTitleRegexes, messageNorm);
    let promptId = null;
    let newTitle = null;

    if (m) {
      // Direct ID match: "update the title of abc123 to 'New Title'"
      promptId = m[2];
      const newTitleRaw = m[3];
      newTitle = stripQuotes(String(newTitleRaw)).trim();
    } else {
      // Try contextual resolution: "update the title of the first one to 'New Title'"
      const context = await ensureConversationContext(conversationId, user.uid);
      const contextualId = resolveContextualUpdate(message, context);

      if (contextualId) {
        promptId = contextualId;
        // Extract new title from message (after "to")
        const toMatch = /\s+to\s+(.+)$/i.exec(message);
        if (toMatch) {
          newTitle = stripQuotes(toMatch[1]).trim();
        }
      }
    }

    if (promptId && newTitle !== null) {
      if (!isValidId(promptId)) {
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, title: newTitle },
          duration: 0,
          success: false,
          error: 'Invalid prompt ID format',
        });
        return res.status(400).json({
          success: false,
          error: 'Invalid prompt ID format. Use alphanumeric with - or _ (5-64 chars).',
          conversationId,

          metadata: { tool_calls },
        });
      }
      if (!newTitle) {
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, title: newTitle },
          duration: 0,
          success: false,
          error: 'Empty title',
        });
        return res.status(400).json({
          success: false,
          error:
            'New title cannot be empty. Example: Update the title of <PROMPT_ID> to "New Title"',
          conversationId,
          metadata: { tool_calls },
        });
      }
      const t0 = Date.now();
      try {
        const ref = db.collection('prompts').doc(promptId);
        const snap = await ref.get();
        if (!snap.exists) {
          tool_calls.push({
            name: 'update_prompt',
            args: { promptId, title: newTitle },
            duration: (Date.now() - t0) / 1000,
            success: false,
            error: 'Prompt not found',
          });
          return res.status(404).json({
            success: false,
            error: `Prompt ${promptId} not found`,
            conversationId,
            metadata: { tool_calls },
          });
        }
        const existing = snap.data();
        if (existing.userId !== user.uid) {
          tool_calls.push({
            name: 'update_prompt',
            args: { promptId, title: newTitle },
            duration: (Date.now() - t0) / 1000,
            success: false,
            error: 'Permission denied',
          });
          return res.status(403).json({
            success: false,
            error: 'Permission denied',
            conversationId,
            metadata: { tool_calls },
          });
        }
        await ref.update({ title: newTitle, updatedAt: FieldValue.serverTimestamp() });
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, title: newTitle },
          duration: (Date.now() - t0) / 1000,
          success: true,
        });
        return res.json({
          success: true,
          response: `Updated title for ${promptId} to "${newTitle}".`,
          conversationId,
          metadata: {
            tool_calls,
            duration: (Date.now() - overallStart) / 1000,
            tokens_used: 0,
            cost: 0,
          },
        });
      } catch (e) {
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, title: newTitle },
          duration: (Date.now() - t0) / 1000,
          success: false,
          error: e.message,
        });
        return res
          .status(500)
          .json({ success: false, error: e.message, conversationId, metadata: { tool_calls } });
      }
    }

    // Tool: update_prompt (content with versioning) - with contextual support
    m = matchAny(updateContentRegexes, messageNorm);
    promptId = null;
    let newContent = null;

    if (m) {
      // Direct ID match: "update the content of abc123 to 'New Content'"
      promptId = m[2];
      const newContentRaw = m[3];
      newContent = stripQuotes(String(newContentRaw));
    } else {
      // Try contextual resolution: "update the content of the first one to 'New Content'"
      const context = await ensureConversationContext(conversationId, user.uid);
      const contextualId = resolveContextualUpdate(message, context);

      if (contextualId && /\bcontent\b/i.test(message)) {
        promptId = contextualId;
        // Extract new content from message (after "to")
        const toMatch = /\s+to\s+(.+)$/i.exec(message);
        if (toMatch) {
          newContent = stripQuotes(toMatch[1]);
        }
      }
    }

    if (promptId && newContent !== null) {
      if (!isValidId(promptId)) {
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, content: '<<new content>>' },
          duration: 0,
          success: false,
          error: 'Invalid prompt ID format',
        });
        return res.status(400).json({
          success: false,
          error: 'Invalid prompt ID format. Use alphanumeric with - or _ (5-64 chars).',
          conversationId,
          metadata: { tool_calls },
        });
      }
      if (!newContent || !newContent.trim()) {
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, content: '<<empty>>' },
          duration: 0,
          success: false,
          error: 'Empty content',
        });
        return res.status(400).json({
          success: false,
          error:
            'New content cannot be empty. Example: Update the content of <PROMPT_ID> to "Your new content"',
          conversationId,
          metadata: { tool_calls },
        });
      }
      const t0 = Date.now();
      try {
        const ref = db.collection('prompts').doc(promptId);
        const snap = await ref.get();
        if (!snap.exists) {
          tool_calls.push({
            name: 'update_prompt',
            args: { promptId, content: '<<new content>>' },
            duration: (Date.now() - t0) / 1000,
            success: false,
            error: 'Prompt not found',
          });
          return res.status(404).json({
            success: false,
            error: `Prompt ${promptId} not found`,
            conversationId,
            metadata: { tool_calls },
          });
        }
        const existing = snap.data();
        if (existing.userId !== user.uid) {
          tool_calls.push({
            name: 'update_prompt',
            args: { promptId, content: '<<new content>>' },
            duration: (Date.now() - t0) / 1000,
            success: false,
            error: 'Permission denied',
          });
          return res.status(403).json({
            success: false,
            error: 'Permission denied',
            conversationId,
            metadata: { tool_calls },
          });
        }

        const update = { updatedAt: FieldValue.serverTimestamp() };
        let versionIncremented = false;
        if (newContent !== existing.content) {
          update.content = newContent;
          update.version = (existing.version || 1) + 1;
          versionIncremented = true;
          await ref.collection('versions').add({
            version: existing.version || 1,
            content: existing.content,
            createdAt: FieldValue.serverTimestamp(),
            userId: user.uid,
          });
        }
        await ref.update(update);
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, content: '<<UPDATED>>' },
          duration: (Date.now() - t0) / 1000,
          success: true,
          version_incremented: versionIncremented,
        });
        return res.json({
          success: true,
          response: `Updated content for ${promptId}.`,
          conversationId,
          metadata: {
            tool_calls,
            duration: (Date.now() - overallStart) / 1000,
            tokens_used: 0,
            cost: 0,
          },
        });
      } catch (e) {
        tool_calls.push({
          name: 'update_prompt',
          args: { promptId, content: '<<new content>>' },
          duration: (Date.now() - t0) / 1000,
          success: false,
          error: e.message,
        });
        return res
          .status(500)
          .json({ success: false, error: e.message, conversationId, metadata: { tool_calls } });
      }
    }

    // Tool: delete_prompt (soft delete) - with contextual support
    m = matchAny(deleteRegexes, messageNorm);
    let promptIdsToDelete = null;

    if (m) {
      // Direct ID match: "delete prompt abc123"
      promptIdsToDelete = [m[2]];
    } else {
      // Try contextual resolution: "delete it", "delete the first one", "delete both", "delete [title]"
      const context = await ensureConversationContext(conversationId, user.uid);
      const contextualResult = resolveContextualDelete(message, context);

      // Check if contextual resolution returned an error
      if (contextualResult && contextualResult.error) {
        return res.status(400).json({
          success: false,
          error: contextualResult.error,
          conversationId,
          metadata: { tool_calls },
        });
      }

      promptIdsToDelete = contextualResult;

      if (!promptIdsToDelete && matchAny(deleteContextualRegexes, messageNorm)) {
        // User tried a contextual delete but we couldn't resolve it
        const hasContext =
          context && context.lastListedPrompts && context.lastListedPrompts.length > 0;
        const errorMsg = hasContext
          ? 'Could not determine which prompt to delete. Please specify the prompt ID, title, or say "delete the first one".'
          : 'Please list your prompts first, then you can say "delete it" or "delete the first one". Alternatively, specify the prompt ID or title directly.';

        return res.status(400).json({
          success: false,
          error: errorMsg,
          conversationId,
          metadata: { tool_calls },
        });
      }
    }

    if (promptIdsToDelete && promptIdsToDelete.length > 0) {
      const t0 = Date.now();

      const errors = [];

      // Validate all IDs first
      for (const promptId of promptIdsToDelete) {
        if (!isValidId(promptId)) {
          errors.push(`Invalid ID format: ${promptId}`);
        }
      }

      if (errors.length > 0) {
        tool_calls.push({
          name: 'delete_prompt',
          args: { promptIds: promptIdsToDelete },
          duration: 0,
          success: false,
          error: errors.join('; '),
        });
        return res.status(400).json({
          success: false,
          error: errors.join('; '),
          conversationId,
          metadata: { tool_calls },
        });
      }

      // Load prompt titles and verify ownership, then request confirmation
      const items = [];
      const validIds = [];
      for (const promptId of promptIdsToDelete) {
        const ref = db.collection('prompts').doc(promptId);
        const snap = await ref.get();
        if (!snap.exists) {
          errors.push(`Prompt ${promptId} not found`);
          continue;
        }
        const existing = snap.data();
        if (existing.userId !== user.uid) {
          errors.push(`Permission denied for ${promptId}`);
          continue;
        }
        items.push({ id: promptId, title: existing.title || '' });
        validIds.push(promptId);
      }

      if (validIds.length === 0) {
        tool_calls.push({
          name: 'delete_prompt',
          args: { promptIds: promptIdsToDelete },
          duration: (Date.now() - t0) / 1000,
          success: false,
          error: errors.join('; '),
        });
        return res.status(404).json({
          success: false,
          error: errors.join('; '),
          conversationId,
          metadata: { tool_calls },
        });
      }

      await setPendingDeleteAsync(conversationId, user.uid, { ids: validIds, items });
      const lines = items.map((it) => `- ${it.id}: ${it.title || '(Untitled)'}`);
      const responseText = `Please confirm deletion of ${validIds.length} prompt(s):\n${lines.join(
        '\n'
      )}\nReply "confirm" to proceed or "cancel" to abort.`;
      return res.json({
        success: true,
        response: responseText,
        conversationId,
        metadata: {
          tool_calls: [
            {
              name: 'delete_prompt',
              args: { promptIds: validIds },
              duration: (Date.now() - t0) / 1000,
              success: true,
              confirmation_required: true,
            },
          ],
        },
      });
    }

    // Guidance for malformed tool-like requests
    if (
      /\b(update|set|change|rename|retitle)\b/i.test(messageNorm) &&
      /\btitle\b/i.test(messageNorm)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid title update format. Example: Update the title of <PROMPT_ID> to "New Title"',
      });
    }
    if (/\b(update|set|change|replace)\b/i.test(messageNorm) && /\bcontent\b/i.test(messageNorm)) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid content update format. Example: Update the content of <PROMPT_ID> to "New content text"',
      });
    }
    if (/\b(delete|remove|trash|archive)\b/i.test(messageNorm) && /\bprompt\b/i.test(messageNorm)) {
      return res.status(400).json({
        success: false,
        error:
          'I couldn\'t tell which prompt to delete. Say "list my prompts" first, then "delete the first one", or provide an ID like "delete prompt <PROMPT_ID>".',
      });
    }

    // --- Fallback to LLM (mock in emulator) ---
    const systemPrompt = dashboardContext
      ? buildSystemPromptFromDashboard(dashboardContext)
      : 'You are a helpful assistant for EthosPrompt. Keep answers concise and practical.';

    const start = Date.now();

    // If running in emulator, return deterministic mock without calling OpenRouter
    const isAnyEmulator =
      String(process.env.FUNCTIONS_EMULATOR || '').toLowerCase() === 'true' ||
      !!process.env.FIREBASE_EMULATOR_HUB ||
      !!process.env.FIRESTORE_EMULATOR_HOST ||
      !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;

    let responseText = '';

    // Include short conversation history when available from frontend (max 6 turns)
    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...(Array.isArray(body?.history)
        ? body.history
            .filter(
              (m) =>
                m &&
                (m.role === 'user' || m.role === 'assistant') &&
                typeof m.content === 'string' &&
                m.content.trim()
            )
            .slice(-6)
            .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
        : []),
      { role: 'user', content: message },
    ];

    let tokens = 0;

    if (isAnyEmulator) {
      // Trigger OpenRouter mock client initialization to emit the verification log line
      try {
        getOpenRouter();
      } catch (e) {
        /* no-op */
      }
      console.log('[httpApi] Using OpenRouter MOCK client (no billing).');
      responseText = `MOCK_RESPONSE: ${message}`;
    } else {
      const completion = await openrouter.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: llmMessages,
        max_tokens: 800,
        temperature: 0.3,
      });
      if (completion?.choices?.length) {
        responseText = completion.choices[0]?.message?.content || '';
      }
      if (completion?.usage?.total_tokens) {
        tokens = completion.usage.total_tokens;
      }
    }

    const duration = (Date.now() - start) / 1000;
    return res.json({
      success: true,
      response: responseText,
      conversationId,
      metadata: {
        tool_calls,
        duration,
        tokens_used: tokens,
        cost: 0,
      },
    });
  } catch (error) {
    console.error('prompt-library-chat error:', error);

    const msg = (error && error.message ? String(error.message) : '').toLowerCase();
    if (msg.includes('rate limit') || msg.includes('429')) {
      return res.status(429).json({
        success: false,
        error: error.message || 'Rate limit exceeded. Please try again later.',
        retry_after: 60,
      });
    }
    if (
      msg.includes('unauthorized') ||
      msg.includes('invalid or expired token') ||
      msg.includes('401')
    ) {
      return res.status(401).json({ success: false, error: 'Authentication failed' });
    }
    return res
      .status(500)
      .json({ success: false, error: error.message || 'Internal server error' });
  }
}

// Helper function to get progress percentage from status
function getProgressFromStatus(status) {
  const progressMap = {
    processing: 25,
    extracting: 25,
    chunking: 50,
    embedding: 75,
    indexing: 90,
    completed: 100,
    failed: 0,
  };
  return progressMap[status] || 25;
}

// Manual document status fix function (admin only)
exports.fix_document_statuses = onCall(
  {
    region: 'australia-southeast1',
    cors: true,
    timeoutSeconds: 300, // 5 minutes for large batches
    memory: '512MB',
    maxInstances: 1, // Only one instance (admin operation)
  },
  async (request) => {
    try {
      // SECURITY: Verify authentication
      if (!request.auth) {
        throw new Error('User must be authenticated');
      }

      // SECURITY: Verify admin role
      const userDoc = await db.collection('users').doc(request.auth.uid).get();
      const userData = userDoc.data();

      if (!userData || userData.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      // Log admin operation for audit trail
      console.log(
        `🔧 Admin operation: fix_document_statuses by ${request.auth.uid} (${
          userData.email || 'unknown'
        })`
      );

      // Get all documents with "uploaded" status
      const uploadedDocs = await db
        .collection('rag_documents')
        .where('status', '==', 'uploaded')
        .get();

      console.log(`📄 Found ${uploadedDocs.size} documents with "uploaded" status`);

      if (uploadedDocs.empty) {
        return {
          success: true,
          message: 'No documents need fixing',
          documentsFixed: 0,
        };
      }

      // Update each document to "completed" status
      const batch = db.batch();
      const documentNames = [];

      uploadedDocs.forEach((doc) => {
        const docRef = db.collection('rag_documents').doc(doc.id);
        const docData = doc.data();

        batch.update(docRef, {
          status: 'completed',
          processedAt: new Date(),
          textContent: 'Document processed manually',
          processingMetadata: {
            chunk_count: 1,
            processing_method: 'manual_fix',
          },
        });

        documentNames.push(docData.filename || 'Unknown');
        console.log(`📝 Queued update for document: ${docData.filename}`);
      });

      // Commit the batch update
      await batch.commit();

      console.log('🎉 Successfully updated all document statuses to "completed"');

      return {
        success: true,
        message: 'Documents successfully updated to completed status',
        documentsFixed: uploadedDocs.size,
        documentNames: documentNames,
      };
    } catch (error) {
      console.error('❌ Error fixing document statuses:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

// Admin-only: migrate legacy prompts to be visible again and backfill isDeleted
exports.migrate_legacy_prompts = onCall(
  {
    region: 'australia-southeast1',
    cors: true,
    timeoutSeconds: 540,
    memory: '1GB',
    maxInstances: 1,
  },
  async (request) => {
    try {
      if (!request.auth) {
        throw new Error('User must be authenticated');
      }

      // Verify admin
      const callerUid = request.auth.uid;
      const callerDoc = await db.collection('users').doc(callerUid).get();
      const callerData = callerDoc.data() || {};
      const token = request.auth.token || {};
      const isAdmin = callerData.role === 'admin' || token.admin === true || token.role === 'admin';
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { userId, dryRun = true, force = false, batchSize = 400 } = request.data || {};
      if (!userId) {
        throw new Error('userId is required');
      }

      console.log(
        `🔧 migrate_legacy_prompts start | userId=${userId} dryRun=${dryRun} force=${force}`
      );

      const stats = {
        rootChecked: 0,
        rootBackfilled: 0,
        migratedFromSubcollection: 0,
        skippedExistingRoot: 0,
        errors: [],
      };

      // Phase 1: Backfill isDeleted: false for root prompts missing the field
      const rootSnap = await db.collection('prompts').where('userId', '==', userId).get();
      let batch = db.batch();
      let ops = 0;
      rootSnap.forEach((doc) => {
        stats.rootChecked++;
        const data = doc.data();
        if (data.isDeleted === undefined) {
          stats.rootBackfilled++;
          if (!dryRun) {
            batch.update(doc.ref, { isDeleted: false, updatedAt: FieldValue.serverTimestamp() });
            ops++;
            if (ops >= batchSize) {
              batch.commit();
              batch = db.batch();
              ops = 0;
            }
          }
        }
      });
      if (!dryRun && ops > 0) {
        await batch.commit();
      }

      // Phase 2: Migrate from legacy users/{uid}/prompts subcollection
      const legacyRef = db.collection('users').doc(userId).collection('prompts');
      const legacySnap = await legacyRef.get();
      if (!legacySnap.empty) {
        let batch2 = db.batch();
        let ops2 = 0;
        for (const doc of legacySnap.docs) {
          try {
            const legacy = doc.data();
            const targetRef = db.collection('prompts').doc(doc.id);
            const existing = await targetRef.get();
            if (existing.exists && !force) {
              stats.skippedExistingRoot++;
              continue;
            }
            const payload = {
              ...legacy,
              userId,
              isDeleted: legacy.isDeleted === undefined ? false : !!legacy.isDeleted,
              updatedAt: FieldValue.serverTimestamp(),
            };
            if (!legacy.createdAt) payload.createdAt = FieldValue.serverTimestamp();

            if (!dryRun) {
              if (existing.exists && force) {
                batch2.set(targetRef, payload, { merge: true });
              } else {
                batch2.set(targetRef, payload, { merge: false });
              }
              ops2++;
              if (ops2 >= batchSize) {
                await batch2.commit();
                batch2 = db.batch();
                ops2 = 0;
              }
            }
            stats.migratedFromSubcollection++;
          } catch (e) {
            stats.errors.push(`Doc ${doc.id}: ${e.message}`);
          }
        }
        if (!dryRun && ops2 > 0) {
          await batch2.commit();
        }
      }

      console.log(`✅ migrate_legacy_prompts done | userId=${userId}`, stats);
      return {
        success: true,
        dryRun,
        stats,
        message: dryRun ? 'Dry run completed' : 'Migration completed',
      };
    } catch (error) {
      console.error('❌ migrate_legacy_prompts error', error);
      return { success: false, error: error.message };
    }
  }
);

// Document processing function with region fix
exports.process_document = onDocumentCreated(
  {
    document: 'rag_documents/{docId}',
    region: 'australia-southeast1',
    timeoutSeconds: 540, // 9 minutes (max) for large documents
    memory: '1GB', // More memory for PDF processing
    maxInstances: 10, // Limit concurrent processing
  },
  async (event) => {
    const docId = event.params.docId;
    const docData = event.data.data();

    console.log(`🔥 FUNCTION TRIGGERED! Processing document: ${docId}`);
    console.log(`📄 Document data:`, JSON.stringify(docData, null, 2));

    try {
      // Update status to processing
      await db.collection('rag_documents').doc(docId).update({
        status: 'processing',
        processingStartedAt: FieldValue.serverTimestamp(),
      });

      // For now, simulate processing and mark as completed
      // In a full implementation, you would:
      // 1. Download the file from Firebase Storage
      // 2. Extract text content based on file type
      // 3. Split text into chunks
      // 4. Generate embeddings
      // 5. Store chunks and embeddings

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Update status to completed
      await db
        .collection('rag_documents')
        .doc(docId)
        .update({
          status: 'completed',
          processedAt: FieldValue.serverTimestamp(),
          textContent: 'Document processed successfully',
          processingMetadata: {
            chunk_count: 1,
            processing_method: 'automatic',
          },
        });

      console.log(`✅ Successfully processed document: ${docId}`);
    } catch (error) {
      console.error(`❌ Error processing document ${docId}:`, error);

      // Update status to failed
      await db.collection('rag_documents').doc(docId).update({
        status: 'failed',
        error: error.message,
        processedAt: FieldValue.serverTimestamp(),
      });
    }
  }
);

// Alternative HTTP-triggered document processor (backup solution)
exports.process_document_http = onCall(
  {
    region: 'australia-southeast1',
    timeoutSeconds: 540, // 9 minutes (max) for large documents
    memory: '1GB', // More memory for processing
    maxInstances: 10, // Limit concurrent processing
  },
  async (request) => {
    try {
      // SECURITY: Verify authentication
      if (!request.auth) {
        throw new Error('User must be authenticated');
      }

      const { documentId } = request.data;

      if (!documentId) {
        throw new Error('Document ID is required');
      }

      console.log(
        `🔧 HTTP-triggered processing for document: ${documentId} by user: ${request.auth.uid}`
      );

      // Get document data
      const docRef = db.collection('rag_documents').doc(documentId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new Error('Document not found');
      }

      const docData = docSnap.data();

      // SECURITY: Verify user owns this document
      // Check both userId and uploadedBy for backward compatibility
      const documentOwner = docData.userId || docData.uploadedBy;
      if (documentOwner !== request.auth.uid) {
        throw new Error('Unauthorized: You do not own this document');
      }

      // Only process if status is 'uploaded'
      if (docData.status !== 'uploaded') {
        return {
          success: false,
          message: `Document status is '${docData.status}', not 'uploaded'`,
        };
      }

      // Update status to processing
      await docRef.update({
        status: 'processing',
        processingStartedAt: FieldValue.serverTimestamp(),
      });

      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Update status to completed
      await docRef.update({
        status: 'completed',
        processedAt: FieldValue.serverTimestamp(),
        textContent: 'Document processed via HTTP trigger',
        processingMetadata: {
          chunk_count: 1,
          processing_method: 'http_trigger',
        },
      });

      console.log(`✅ HTTP processing completed for document: ${documentId}`);

      return {
        success: true,
        message: 'Document processed successfully',
        documentId: documentId,
      };
    } catch (error) {
      console.error('❌ HTTP processing error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

// AI-Assisted Prompt Generation Function
async function generatePrompt(request) {
  try {
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }

    const data = request.data || {};
    const purpose = data.purpose || '';
    const industry = data.industry || '';
    const useCase = data.useCase || '';
    const targetAudience = data.targetAudience || '';
    const inputVariables = data.inputVariables || [];
    const outputFormat = data.outputFormat || 'paragraph';
    const tone = data.tone || 'professional';
    const length = data.length || 'medium';
    const includeRAG = data.includeRAG || false;
    const additionalRequirements = data.additionalRequirements || '';

    if (!purpose) {
      throw new Error('Purpose is required');
    }

    // Build variables text
    let variablesText = '';
    if (inputVariables.length > 0) {
      variablesText = '\n\nRequired Variables:\n';
      inputVariables.forEach((variable) => {
        variablesText += `- {{ ${variable.name} }}: ${variable.description} (${variable.type})\n`;
      });
    }

    // Build RAG instruction
    let ragInstruction = '';
    if (includeRAG) {
      ragInstruction =
        '\n\nRAG Integration: Include instructions for using document context. Add a {{context}} variable and instructions on how to use provided context information.';
    }

    // Create the generation prompt for the AI
    const generationPrompt = `Create a high-quality AI prompt with the following specifications:

Purpose: ${purpose}
Industry: ${industry}
Use Case: ${useCase}
Target Audience: ${targetAudience}
Output Format: ${outputFormat}
Tone: ${tone}
Length: ${length}${variablesText}${ragInstruction}

Additional Requirements: ${additionalRequirements}

The prompt should be:
1. Clear and specific in its instructions
2. Optimized for AI model performance
3. Include appropriate variable placeholders
4. Follow industry best practices for ${industry}
5. Match the requested ${tone} tone
6. Produce output in ${outputFormat} format

Please generate an effective prompt that meets these requirements.`;

    // Use Llama 3.3 70B for prompt generation (as configured)
    const response = await openrouter.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert prompt engineer specializing in creating high-quality, effective AI prompts. Generate clear, specific, and optimized prompts based on user requirements.',
        },
        {
          role: 'user',
          content: generationPrompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const generatedPrompt = response.choices[0]?.message?.content || '';

    if (!generatedPrompt) {
      throw new Error('Failed to generate prompt');
    }

    // Generate title and description
    const title = `${purpose.charAt(0).toUpperCase() + purpose.slice(1)} Assistant`;
    const description = `AI-generated prompt for ${purpose} in ${industry}`;

    // Generate tags
    const tags = [
      industry?.toLowerCase() || 'general',
      useCase?.toLowerCase().replace(/\s+/g, '-') || 'assistant',
      tone?.toLowerCase() || 'professional',
    ];

    // Create variables array
    const variables = inputVariables.map((variable) => ({
      name: variable.name,
      type: variable.type || 'text',
      required: variable.required !== false,
      description: variable.description || `${variable.name} input`,
    }));

    // Add default variables if none provided
    if (variables.length === 0) {
      variables.push(
        {
          name: 'user_input',
          type: 'text',
          required: true,
          description: 'The specific request or question from the user',
        },
        {
          name: 'context',
          type: 'text',
          required: false,
          description: 'Relevant background information or constraints',
        }
      );
    }

    // Generate enhancement suggestions
    const suggestions = [
      {
        type: 'clarity',
        title: 'Improve Clarity',
        description: 'Consider adding more specific instructions or examples',
        impact: 'medium',
        autoApplicable: false,
      },
      {
        type: 'structure',
        title: 'Add Structure',
        description: 'Consider using numbered steps or bullet points for complex tasks',
        impact: 'low',
        autoApplicable: false,
      },
    ];

    return {
      success: true,
      generatedPrompt,
      title,
      description,
      category: industry || 'General',
      tags,
      variables,
      suggestions,
      metadata: {
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        tokensUsed: response.usage?.total_tokens || 0,
        cost: 0.0, // Free model
      },
    };
  } catch (error) {
    console.error('❌ Prompt generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate prompt',
    };
  }
}

// =============================================================================
// STREAMING (SSE) AND POLLING FALLBACK ENDPOINTS
// =============================================================================

// Helper: create execution doc
async function createExecutionDoc({ userId, promptId, promptTitle, model, mode }) {
  const ref = db.collection('executions').doc();
  await ref.set({
    userId,
    promptId,
    promptTitle: promptTitle || 'Untitled Prompt',
    model: model || DEFAULT_MODEL,
    timestamp: FieldValue.serverTimestamp(),
    status: 'running',
    mode: mode || 'sse',
    cost: 0,
    tokensUsed: 0,
    duration: 0,
  });
  return ref;
}

// Helper: chunk a string to simulated stream chunks (for polling fallback)
function chunkString(str, size = 120) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

// SSE streaming endpoint used by frontend at `${VITE_FIREBASE_FUNCTIONS_URL}/stream_prompt`
exports.stream_prompt = onRequest(
  {
    region: 'australia-southeast1',
    secrets: [OPENROUTER_API_KEY],
    timeoutSeconds: 180,
    memory: '512MB',
    cors: true,
  },
  async (req, res) => {
    // CORS + SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

    try {
      if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
      }

      // Normalize query params for both emulator tests and deployed runtime
      const q =
        req.query ||
        Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());

      // Auth via token query param (emulator bypass supported for tests)
      let user;
      const isEmulator = String(process.env.FUNCTIONS_EMULATOR).toLowerCase() === 'true';
      if (isEmulator && q.emulator_uid) {
        user = { uid: String(req.query.emulator_uid) };
      } else {
        const token = q.token;
        if (!token || typeof token !== 'string') {
          res.status(401);
          send({ type: 'error', message: 'Missing auth token' });
          res.end();
          return;
        }
        try {
          user = await admin.auth().verifyIdToken(token);
        } catch (e) {
          res.status(401);
          send({ type: 'error', message: 'Invalid token' });
          res.end();
          return;
        }
      }

      const promptId = String(q.promptId || '');
      if (!promptId) {
        res.status(400);
        send({ type: 'error', message: 'promptId required' });
        res.end();
        return;
      }

      // Parse options
      const variables = (() => {
        try {
          return JSON.parse(String(q.variables || '{}'));
        } catch {
          return {};
        }
      })();
      const useRag = String(q.useRAG || 'false') === 'true';
      const ragQuery = q.ragQuery ? String(q.ragQuery) : '';
      const documentIds = (() => {
        try {
          return JSON.parse(String(q.documentIds || '[]'));
        } catch {
          return [];
        }
      })();
      const model = q.model ? String(q.model) : DEFAULT_MODEL;
      const temperature = q.temperature !== undefined ? Number(q.temperature) : 0.7;
      const maxTokens = q.maxTokens !== undefined ? Number(q.maxTokens) : 1000;

      // Load prompt and verify ownership
      const promptRef = db.collection('prompts').doc(promptId);
      const promptDoc = await promptRef.get();
      if (!promptDoc.exists) {
        res.status(404);
        send({ type: 'error', message: 'Prompt not found' });
        res.end();
        return;
      }
      const promptData = promptDoc.data();
      if (promptData.userId !== user.uid) {
        res.status(403);
        send({ type: 'error', message: 'Unauthorized' });
        res.end();
        return;
      }

      // Prepare prompt content with variables
      let promptContent = promptData.content || '';
      for (const [k, v] of Object.entries(variables || {})) {
        const ph = new RegExp(`\\{${k}\\}`, 'g');
        promptContent = promptContent.replace(ph, String(v));
      }

      const executionRef = await createExecutionDoc({
        userId: user.uid,
        promptId,
        promptTitle: promptData.title,
        model,
        mode: 'sse',
      });

      let accumulated = '';
      let idx = 0;
      let finished = false;
      const startTime = Date.now();

      // Periodically check for cancellation
      let lastCheck = 0;
      async function checkCancelled() {
        const now = Date.now();
        if (now - lastCheck < 500) return false;
        lastCheck = now;
        const snap = await executionRef.get();
        const st = snap.data()?.status;
        return st === 'cancelled';
      }

      // Write initial ack so client considers SSE established
      send({ type: 'ack', execution_id: executionRef.id });

      // Stream from OpenRouter
      const stream = await openrouter.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for prompt \"${promptData.title || 'Untitled'}\".`,
          },
          { role: 'user', content: promptContent },
        ],
        max_tokens: maxTokens,
        temperature,
        stream: true,
      });

      for await (const part of stream) {
        // Cancellation support
        if (await checkCancelled()) {
          send({ type: 'error', message: 'cancelled' });
          await executionRef.update({
            status: 'cancelled',
            duration: (Date.now() - startTime) / 1000,
          });
          res.end();
          return;
        }

        const delta = part?.choices?.[0]?.delta?.content || '';
        if (delta) {
          accumulated += delta;
          // Emit SSE chunk
          send({ type: 'chunk', content: delta, index: idx, model });
          // Persist chunk for polling fallback
          await executionRef
            .collection('chunks')
            .doc(String(idx))
            .set({ index: idx, content: delta, createdAt: FieldValue.serverTimestamp() });
          idx += 1;
        }
        const finish = part?.choices?.[0]?.finish_reason;
        if (finish) {
          finished = true;
        }
      }

      // Completed
      await executionRef.update({
        status: finished ? 'completed' : 'completed',
        output: accumulated,
        duration: (Date.now() - startTime) / 1000,
        tokensUsed: 0,
      });
      send({
        type: 'complete',
        metadata: {
          execution_id: executionRef.id,
          model,
          duration: (Date.now() - startTime) / 1000,
        },
      });
      res.end();
    } catch (error) {
      console.error('SSE stream error:', error);
      try {
        send({ type: 'error', message: error.message || 'Stream failed' });
      } catch {}
      res.end();
    }
  }
);

// Start a streaming execution for polling fallback; returns execution_id
exports.execute_prompt_streaming = onCall(
  {
    region: 'australia-southeast1',
    secrets: [OPENROUTER_API_KEY],
    timeoutSeconds: 60,
    memory: '256MB',
    maxInstances: 100,
  },
  async (request) => {
    // Emulator/test bypass: allow auth via request.data.emulator_uid
    const isEmu = String(process.env.FUNCTIONS_EMULATOR).toLowerCase() === 'true';
    const isTest = Boolean(process.env.VITEST || process.env.VITEST_WORKER_ID);
    if ((isEmu || isTest) && request?.data?.emulator_uid && !request.auth) {
      request.auth = { uid: String(request.data.emulator_uid) };
    }
    if (!request.auth) {
      throw new Error('User must be authenticated');
    }
    const {
      promptId,
      inputs = {},
      useRag = false,
      ragQuery = '',
      documentIds = [],
      model,
      temperature = 0.7,
      maxTokens = 1000,
    } = request.data || {};

    if (!promptId) throw new Error('promptId is required');

    const promptRef = db.collection('prompts').doc(promptId);
    const promptDoc = await promptRef.get();
    if (!promptDoc.exists) throw new Error('Prompt not found');
    const promptData = promptDoc.data();
    if (promptData.userId !== request.auth.uid) throw new Error('Unauthorized');

    const execRef = db.collection('executions').doc();
    await execRef.set({
      userId: request.auth.uid,
      promptId,
      promptTitle: promptData.title || 'Untitled Prompt',
      model: model || DEFAULT_MODEL,
      timestamp: FieldValue.serverTimestamp(),
      status: 'created',
      mode: 'poll',
      request: { inputs, useRag, ragQuery, documentIds, temperature, maxTokens },
    });

    return { success: true, execution_id: execRef.id };
  }
);

// Retrieve chunks for an execution (polling fallback)
exports.get_execution_chunks = onCall(
  {
    region: 'australia-southeast1',
    secrets: [OPENROUTER_API_KEY],
    timeoutSeconds: 120,
    memory: '256MB',
    maxInstances: 200,
  },
  async (request) => {
    // Emulator/test bypass: allow auth via request.data.emulator_uid
    const isEmu = String(process.env.FUNCTIONS_EMULATOR).toLowerCase() === 'true';
    const isTest = Boolean(process.env.VITEST || process.env.VITEST_WORKER_ID);
    if ((isEmu || isTest) && request?.data?.emulator_uid && !request.auth) {
      request.auth = { uid: String(request.data.emulator_uid) };
    }
    if (!request.auth) throw new Error('User must be authenticated');
    const { executionId, fromIndex = 0 } = request.data || {};
    if (!executionId) throw new Error('executionId is required');

    const execRef = db.collection('executions').doc(executionId);
    const execSnap = await execRef.get();
    if (!execSnap.exists) throw new Error('Execution not found');
    const execData = execSnap.data();
    if (execData.userId !== request.auth.uid) throw new Error('Unauthorized');

    let completed = execData.status === 'completed';

    // If not processed yet, run a non-streaming completion and persist chunked output
    if (execData.status === 'created') {
      const promptRef = db.collection('prompts').doc(execData.promptId);
      const promptSnap = await promptRef.get();
      if (!promptSnap.exists) throw new Error('Prompt not found');
      const promptData = promptSnap.data();

      let content = promptData.content || '';
      const vars = execData.request?.inputs || {};
      for (const [k, v] of Object.entries(vars)) {
        const ph = new RegExp(`\\{${k}\\}`, 'g');
        content = content.replace(ph, String(v));
      }

      const modelToUse = execData.model || DEFAULT_MODEL;
      const temp = execData.request?.temperature ?? 0.7;
      const maxToks = execData.request?.maxTokens ?? 1000;

      const completion = await openrouter.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant for prompt "${execData.promptTitle || 'Untitled'}".`,
          },
          { role: 'user', content: content },
        ],
        max_tokens: maxToks,
        temperature: temp,
      });

      const full = completion.choices?.[0]?.message?.content || '';
      const pieces = chunkString(full, 160);
      let idx = 0;
      for (const p of pieces) {
        await execRef
          .collection('chunks')
          .doc(String(idx))
          .set({ index: idx, content: p, createdAt: FieldValue.serverTimestamp() });
        idx += 1;
      }
      await execRef.update({
        status: 'completed',
        output: full,
        tokensUsed: completion.usage?.total_tokens || 0,
      });
      completed = true;
    }

    // Fetch new chunks
    const snap = await execRef
      .collection('chunks')
      .orderBy('index')
      .startAt(Number(fromIndex))
      .limit(500)
      .get();
    const chunks = [];
    snap.forEach((doc) => chunks.push({ index: doc.data().index, content: doc.data().content }));

    return { success: true, chunks, completed, metadata: { execution_id: executionId } };
  }
);

// Cancel an in-progress execution
exports.cancel_streaming_execution = onCall(
  {
    region: 'australia-southeast1',
    secrets: [OPENROUTER_API_KEY],
    timeoutSeconds: 30,
    memory: '256MB',
  },
  async (request) => {
    // Emulator/test bypass: allow auth via request.data.emulator_uid
    const isEmu = String(process.env.FUNCTIONS_EMULATOR).toLowerCase() === 'true';
    const isTest = Boolean(process.env.VITEST || process.env.VITEST_WORKER_ID);
    if ((isEmu || isTest) && request?.data?.emulator_uid && !request.auth) {
      request.auth = { uid: String(request.data.emulator_uid) };
    }
    if (!request.auth) throw new Error('User must be authenticated');
    const { executionId } = request.data || {};
    if (!executionId) throw new Error('executionId is required');
    const execRef = db.collection('executions').doc(executionId);
    const snap = await execRef.get();
    if (!snap.exists) throw new Error('Execution not found');
    const data = snap.data();
    if (data.userId !== request.auth.uid) throw new Error('Unauthorized');

    await execRef.update({ status: 'cancelled', cancelledAt: FieldValue.serverTimestamp() });
    return { success: true };
  }
);

// Export sendResendEmail for use in other modules (e.g., quotations)
exports.sendResendEmail = sendResendEmail;
