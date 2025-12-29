/**
 * Firebase Cloud Function: Submit Quotation Request
 * Handles quotation form submissions, stores in Firestore, sends notifications
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { z } from 'zod';
import { completeFormSchema } from '../../../frontend/src/components/marketing/quotation/validation';

// Initialize Firestore
const db = admin.firestore();

// Request schema
const submissionRequestSchema = z.object({
  serviceContext: z.enum([
    'intelligent-applications',
    'solutions',
    'smart-assistant',
    'system-integration',
  ]),
  serviceName: z.string().min(1),
  packageType: z.enum(['basic', 'standard', 'enterprise']).optional(),
  packageName: z.string().optional(),
  formData: completeFormSchema,
  metadata: z.object({
    submittedAt: z.string(),
    userAgent: z.string(),
    referrerUrl: z.string(),
    // GAP-009: UTM parameters for marketing attribution
    utmParams: z.object({
      utm_source: z.string().optional(),
      utm_medium: z.string().optional(),
      utm_campaign: z.string().optional(),
      utm_term: z.string().optional(),
      utm_content: z.string().optional(),
    }).optional(),
  }),
  // GAP-005/GAP-012: ROI calculation data for sales context
  roiSnapshot: z.object({
    serviceType: z.string(),
    monthlySavings: z.number(),
    annualSavings: z.number(),
    calculatedAt: z.string(),
  }).passthrough().optional(),
});

/**
 * Generate unique reference number
 * Format: QR-YYYY-NNNNNN
 */
function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 900000 + 100000);
  return `QR-${year}-${random}`;
}

/**
 * Sanitize input to prevent XSS
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function isRunningInEmulator(): boolean {
  return (
    String(process.env.FUNCTIONS_EMULATOR || '').toLowerCase() === 'true' ||
    !!process.env.FIREBASE_EMULATOR_HUB ||
    !!process.env.FIRESTORE_EMULATOR_HOST
  );
}

function getProjectId(): string | undefined {
  if (process.env.GCLOUD_PROJECT) {
    return process.env.GCLOUD_PROJECT;
  }

  const firebaseConfig = process.env.FIREBASE_CONFIG;
  if (firebaseConfig) {
    try {
      const parsed = JSON.parse(firebaseConfig);
      if (parsed && typeof parsed.projectId === 'string') {
        return parsed.projectId;
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return undefined;
}

function getHttpApiBaseUrl(): string | null {
  const projectId = getProjectId();
  const region = 'australia-southeast1';

  if (!projectId) {
    console.warn('[quotation->lead_ingest] Unable to determine projectId for httpApi base URL');
    return null;
  }

  if (isRunningInEmulator()) {
    // Match emulator base URL pattern used in tests (contacts.test.js)
    return `http://127.0.0.1:5001/${projectId}/${region}/httpApi`;
  }

  // Default production URL for v2 HTTPS functions
  return `https://${region}-${projectId}.cloudfunctions.net/httpApi`;
}

async function ingestLeadFromQuotation(
  quotationDocId: string,
  data: z.infer<typeof submissionRequestSchema>,
): Promise<string | null> {
  const baseUrl = getHttpApiBaseUrl();
  if (!baseUrl) {
    console.warn(
      '[quotation->lead_ingest] No httpApi base URL available; skipping unified lead ingestion',
    );
    return null;
  }

  const payload = {
    email: data.formData.contactEmail,
    name: data.formData.contactName,
    company: data.formData.companyName,
    phone: data.formData.contactPhone || undefined,
    service: data.serviceName,
    source: 'quotation' as const,
    meta: {
      quotationId: quotationDocId,
      message: data.formData.projectDescription || undefined,
    },
    metadata: {
      userAgent: data.metadata.userAgent,
      referrerUrl: data.metadata.referrerUrl,
      utmParams: {},
    },
  };

  const globalFetch = (globalThis as any).fetch as
    | ((input: any, init?: any) => Promise<any>)
    | undefined;

  if (!globalFetch) {
    console.warn(
      '[quotation->lead_ingest] fetch is not available in this runtime; skipping unified lead ingestion',
    );
    return null;
  }

  try {
    const res = await globalFetch(`${baseUrl}/api/leads/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res || !res.ok) {
      let text = '';
      try {
        if (res && typeof res.text === 'function') {
          text = await res.text();
        }
      } catch {
        // Ignore body read errors
      }

      console.error(
        '[quotation->lead_ingest] Failed to ingest lead via httpApi',
        res && res.status,
        text,
      );
      return null;
    }

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (json && typeof json === 'object' && json.contactId) {
      return String(json.contactId);
    }
  } catch (err) {
    console.error('[quotation->lead_ingest] Error calling httpApi lead ingest', err);
  }

  return null;
}

async function upsertContactFromQuotation(
  quotationId: string,
  data: z.infer<typeof submissionRequestSchema>,
  clientIP: string
): Promise<string> {
  const contactsCol = db.collection('contacts');
  const activitiesCol = db.collection('contact_activities');

  const emailNorm = sanitizeInput(data.formData.contactEmail).toLowerCase();
  const nameSan = sanitizeInput(data.formData.contactName);
  const companySan = sanitizeInput(data.formData.companyName);
  const phoneSan = data.formData.contactPhone
    ? sanitizeInput(data.formData.contactPhone)
    : '';
  const serviceSan = sanitizeInput(data.serviceName);
  const messageSan = data.formData.projectDescription
    ? sanitizeInput(data.formData.projectDescription)
    : '';

  const existingSnap = await contactsCol.where('email', '==', emailNorm).limit(1).get();

  const nowTs = admin.firestore.FieldValue.serverTimestamp();

  const originalLeadIdsUpdate: Record<string, string> = {
    quotationId,
  };

  let contactId: string;

  if (existingSnap.empty) {
    const metaPayload: any = {
      roiSnapshot: null,
      originalLeadIds: originalLeadIdsUpdate,
      leadMagnet: undefined,
      service: serviceSan || undefined,
      timezone: undefined,
      country: undefined,
      metadata: {
        userAgent: data.metadata.userAgent || '',
        referrerUrl: data.metadata.referrerUrl || '',
        utmParams: {},
        ipAddress: clientIP,
      },
    };

    const contactDoc: any = {
      name: nameSan,
      email: emailNorm,
      company: companySan,
      jobTitle: null,
      phone: phoneSan || null,
      status: 'new',
      source: 'quotation',
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
    const existing: any = doc.data() || {};

    const mergedOriginalLeadIds = {
      ...(existing.meta?.originalLeadIds || {}),
      ...originalLeadIdsUpdate,
    };

    const mergedMeta: any = {
      ...(existing.meta || {}),
      service: serviceSan || existing.meta?.service || undefined,
      metadata: {
        ...(existing.meta?.metadata || {}),
        userAgent: data.metadata.userAgent || existing.meta?.metadata?.userAgent || '',
        referrerUrl:
          data.metadata.referrerUrl || existing.meta?.metadata?.referrerUrl || '',
        utmParams: {
          ...(existing.meta?.metadata?.utmParams || {}),
        },
        ipAddress: clientIP,
      },
      originalLeadIds:
        Object.keys(mergedOriginalLeadIds).length > 0 ? mergedOriginalLeadIds : undefined,
    };

    await doc.ref.update({
      name: nameSan || existing.name || '',
      company: companySan || existing.company || '',
      phone: phoneSan || existing.phone || null,
      status: existing.status || 'in_progress',
      source: existing.source || 'quotation',
      notesSummary: messageSan || existing.notesSummary || '',
      lastContactedAt: nowTs,
      updatedAt: nowTs,
      meta: mergedMeta,
    });
  }

  const activitySnippetParts: string[] = [];
  activitySnippetParts.push('Lead from quotation');
  if (serviceSan) activitySnippetParts.push(`service: ${serviceSan}`);
  if (companySan) activitySnippetParts.push(`company: ${companySan}`);

  const activity: any = {
    contactId,
    type: 'note',
    direction: 'inbound',
    subject: 'Quotation request submitted',
    snippet: activitySnippetParts.join(' | '),
    content: messageSan || '',
    createdByUserId: null,
    createdByName: null,
    timestamp: nowTs,
    metadata: {
      channel: 'manual',
      quotationId,
    },
  };

  await activitiesCol.add(activity);

  return contactId;
}

async function autoScheduleQuotationSequenceForContact(contactId: string): Promise<void> {
  const sequenceId = process.env.DEFAULT_SEQUENCE_QUOTATION || '';
  if (!sequenceId) {
    console.log(
      '[quotation->sequence] No DEFAULT_SEQUENCE_QUOTATION configured, skipping auto scheduling',
      contactId,
    );
    return;
  }

  try {
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
          '[quotation->sequence] Sequence already scheduled for contact',
          contactId,
          sequenceId,
        );
        return;
      }
    } catch (err) {
      console.warn(
        '[quotation->sequence] Failed to check existing jobs for contact',
        contactId,
        sequenceId,
        err,
      );
    }

    const sequenceRef = db.collection('email_sequences').doc(sequenceId);
    const sequenceSnap = await sequenceRef.get();
    if (!sequenceSnap.exists) {
      console.warn('[quotation->sequence] Email sequence not found for quotation source', sequenceId);
      return;
    }
    const sequenceData: any = sequenceSnap.data() || {};
    if (sequenceData.isActive === false) {
      console.log(
        '[quotation->sequence] Email sequence is not active for quotation source',
        sequenceId,
      );
      return;
    }

    const stepsRaw: any[] = Array.isArray(sequenceData.steps) ? sequenceData.steps.slice() : [];
    if (!stepsRaw.length) {
      console.log('[quotation->sequence] Email sequence has no steps for quotation source', sequenceId);
      return;
    }

    stepsRaw.sort((a, b) => {
      const aNum = Number(a && a.stepNumber);
      const bNum = Number(b && b.stepNumber);
      const aValid = Number.isFinite(aNum) ? aNum : 0;
      const bValid = Number.isFinite(bNum) ? bNum : 0;
      return aValid - bValid;
    });

    const now = new Date();
    const nowTs = admin.firestore.FieldValue.serverTimestamp();

    let cumulativeDays = 0;
    let firstScheduledTs: admin.firestore.Timestamp | null = null;

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

      const jobDoc: any = {
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
        await db
          .collection('contacts')
          .doc(contactId)
          .set(
            {
              nextFollowUpAt: firstScheduledTs,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
      } catch (err) {
        console.warn(
          '[quotation->sequence] Failed to update nextFollowUpAt for contact',
          contactId,
          err,
        );
      }
    }
  } catch (err) {
    console.error(
      '[quotation->sequence] Failed to auto-schedule default quotation sequence for contact',
      contactId,
      err,
    );
  }
}

/**
 * Send confirmation email to user who submitted quotation
 * Uses service-specific templates for customized content
 */
async function sendUserConfirmationEmail(
  email: string,
  referenceNumber: string,
  data: z.infer<typeof submissionRequestSchema>
): Promise<void> {
  // Lazy-load the sendResendEmail function from parent index.js
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sendResendEmail } = require('../../index.js');

  // Import service-specific templates
  const { generateServiceSpecificEmail } = require('./emailTemplates');

  // Generate service-specific email content
  const emailContent = generateServiceSpecificEmail(email, referenceNumber, {
    serviceContext: data.serviceContext,
    serviceName: data.serviceName,
    formData: {
      contactName: data.formData.contactName,
      companyName: data.formData.companyName,
      industry: data.formData.industry,
      desiredTimeline: data.formData.desiredTimeline,
      budgetRange: data.formData.budgetRange,
      needsConsultation: data.formData.needsConsultation,
    },
  });

  await sendResendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    tags: [
      { name: 'type', value: 'quotation' },
      { name: 'category', value: 'confirmation' },
      { name: 'service', value: data.serviceContext },
    ],
  });
}

/**
 * Send notification email to sales team about new quotation
 */
async function sendSalesTeamNotificationEmail(
  referenceNumber: string,
  data: z.infer<typeof submissionRequestSchema>
): Promise<void> {
  // Lazy-load the sendResendEmail function from parent index.js
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { sendResendEmail } = require('../../index.js');

  const salesTeamEmail = process.env.SALES_TEAM_EMAIL || 'ethosprompt@gmail.com';

  const subject = `🔔 New Quotation Request: ${referenceNumber} - ${data.formData.companyName}`;

  const formatList = (items: string[]) => items.map(item => `<li>${item}</li>`).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .content { background: #fff; padding: 30px; }
        .section { margin: 25px 0; padding: 20px; background: #f9fafb; border-radius: 6px; }
        .section h3 { color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; }
        .info-label { font-weight: bold; color: #555; }
        .priority { display: inline-block; padding: 5px 10px; background: #ef4444; color: white; border-radius: 4px; font-size: 12px; }
        ul { margin: 10px 0; padding-left: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 New Quotation Request</h1>
          <p style="margin: 0; font-size: 18px;">Reference: <strong>${referenceNumber}</strong></p>
        </div>

        <div class="content">
          <div class="alert">
            <strong>⏰ Action Required:</strong> This quotation request requires review and response within 24-48 hours.
          </div>

          <div class="section">
            <h3>📋 Business Information</h3>
            <div class="info-grid">
              <span class="info-label">Company:</span><span>${data.formData.companyName}</span>
              <span class="info-label">Contact Name:</span><span>${data.formData.contactName}</span>
              <span class="info-label">Email:</span><span><a href="mailto:${data.formData.contactEmail}">${data.formData.contactEmail}</a></span>
              <span class="info-label">Phone:</span><span>${data.formData.contactPhone || 'Not provided'}</span>
              <span class="info-label">Industry:</span><span>${data.formData.industry}</span>
              <span class="info-label">Company Size:</span><span>${data.formData.companySize}</span>
            </div>
          </div>

          <div class="section">
            <h3>🎯 Service Information</h3>
            <div class="info-grid">
              <span class="info-label">Service Context:</span><span>${data.serviceContext}</span>
              <span class="info-label">Service Name:</span><span>${data.serviceName}</span>
              <span class="info-label">Package Type:</span><span>${data.packageType || 'Not specified'}</span>
              <span class="info-label">Package Name:</span><span>${data.packageName || 'Not specified'}</span>
            </div>
          </div>

          <div class="section">
            <h3>📝 Project Scope</h3>
            <p><strong>Description:</strong></p>
            <p>${data.formData.projectDescription}</p>
            <p><strong>Primary Goals:</strong></p>
            <ul>${formatList(data.formData.primaryGoals)}</ul>
            ${data.formData.specificFeatures && data.formData.specificFeatures.length > 0 ? `
              <p><strong>Specific Features:</strong></p>
              <ul>${formatList(data.formData.specificFeatures)}</ul>
            ` : ''}
          </div>

          <div class="section">
            <h3>⚙️ Technical Requirements</h3>
            ${data.formData.existingSystems && data.formData.existingSystems.length > 0 ? `
              <p><strong>Existing Systems:</strong></p>
              <ul>${formatList(data.formData.existingSystems)}</ul>
            ` : '<p><em>No existing systems specified</em></p>'}
            ${data.formData.integrationNeeds ? `
              <p><strong>Integration Needs:</strong></p>
              <p>${data.formData.integrationNeeds}</p>
            ` : ''}
            <div class="info-grid" style="margin-top: 15px;">
              <span class="info-label">Data Volume:</span><span>${data.formData.dataVolume}</span>
            </div>
            ${data.formData.securityRequirements && data.formData.securityRequirements.length > 0 ? `
              <p><strong>Security Requirements:</strong></p>
              <ul>${formatList(data.formData.securityRequirements)}</ul>
            ` : ''}
          </div>

          <div class="section">
            <h3>📅 Timeline & Budget</h3>
            <div class="info-grid">
              <span class="info-label">Timeline:</span><span>${data.formData.desiredTimeline}</span>
              <span class="info-label">Budget Range:</span><span>${data.formData.budgetRange}</span>
              <span class="info-label">Flexibility:</span><span>${data.formData.flexibility}</span>
            </div>
          </div>

          <div class="section">
            <h3>🤝 Consultation Preference</h3>
            <div class="info-grid">
              <span class="info-label">Needs Consultation:</span><span>${data.formData.needsConsultation ? '✅ Yes' : '❌ No'}</span>
              ${data.formData.needsConsultation ? `
                <span class="info-label">Format:</span><span>${data.formData.consultationFormat || 'Not specified'}</span>
                ${data.formData.preferredTimeSlots && data.formData.preferredTimeSlots.length > 0 ? `
                  <span class="info-label">Preferred Times:</span><span>${data.formData.preferredTimeSlots.join(', ')}</span>
                ` : ''}
              ` : ''}
            </div>
          </div>

          ${data.roiSnapshot ? `
          <div class="section" style="background: #f0fdf4; border-left: 4px solid #22c55e;">
            <h3>💰 ROI Calculator Results (User-Submitted)</h3>
            <div class="info-grid">
              <span class="info-label">Service Type:</span><span>${data.roiSnapshot.serviceType}</span>
              <span class="info-label">Monthly Savings:</span><span style="color: #22c55e; font-weight: bold;">$${data.roiSnapshot.monthlySavings.toLocaleString()}</span>
              <span class="info-label">Annual Savings:</span><span style="color: #22c55e; font-weight: bold;">$${data.roiSnapshot.annualSavings.toLocaleString()}</span>
              <span class="info-label">Calculated:</span><span>${new Date(data.roiSnapshot.calculatedAt).toLocaleString()}</span>
            </div>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              <em>User completed ROI calculator before submitting quotation - indicates strong buying intent</em>
            </p>
          </div>
          ` : ''}

          <div class="section">
            <h3>📊 Metadata</h3>
            <div class="info-grid">
              <span class="info-label">Submitted:</span><span>${new Date(data.metadata.submittedAt).toLocaleString()}</span>
              <span class="info-label">Referrer:</span><span style="word-break: break-all;">${data.metadata.referrerUrl || 'Direct'}</span>
            </div>
          </div>

          <p style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 6px;">
            <strong>Next Steps:</strong><br>
            1. Review the quotation details above<br>
            2. Prepare a custom proposal based on requirements<br>
            3. ${data.formData.needsConsultation ? 'Schedule consultation with client' : 'Send quotation to client'}<br>
            4. Follow up within 24-48 hours
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
NEW QUOTATION REQUEST
Reference: ${referenceNumber}

BUSINESS INFORMATION
Company: ${data.formData.companyName}
Contact: ${data.formData.contactName}
Email: ${data.formData.contactEmail}
Phone: ${data.formData.contactPhone || 'Not provided'}
Industry: ${data.formData.industry}
Company Size: ${data.formData.companySize}

SERVICE INFORMATION
Service Context: ${data.serviceContext}
Service Name: ${data.serviceName}
Package Type: ${data.packageType || 'Not specified'}

PROJECT DESCRIPTION
${data.formData.projectDescription}

Primary Goals:
${data.formData.primaryGoals.map(g => `- ${g}`).join('\n')}

TECHNICAL REQUIREMENTS
Data Volume: ${data.formData.dataVolume}
${data.formData.existingSystems?.length ? `Existing Systems:\n${data.formData.existingSystems.map(s => `- ${s}`).join('\n')}` : ''}
${data.formData.integrationNeeds ? `Integration Needs: ${data.formData.integrationNeeds}` : ''}

TIMELINE & BUDGET
Timeline: ${data.formData.desiredTimeline}
Budget Range: ${data.formData.budgetRange}
Flexibility: ${data.formData.flexibility}

CONSULTATION
Needs Consultation: ${data.formData.needsConsultation ? 'Yes' : 'No'}
${data.formData.needsConsultation ? `Format: ${data.formData.consultationFormat || 'Not specified'}` : ''}

ACTION REQUIRED: Review and respond within 24-48 hours
  `.trim();

  await sendResendEmail({
    to: salesTeamEmail,
    subject,
    html,
    text,
    tags: [
      { name: 'type', value: 'quotation' },
      { name: 'category', value: 'sales_notification' }
    ],
  });
}

/**
 * Main Cloud Function
 */
export const submitQuotationRequest = functions.https.onRequest(async (req, res) => {
  // GAP-008 FIX: Environment-aware CORS with origin validation
  const allowedOrigins = [
    // Production
    'https://ethosprompt.com',
    'https://www.ethosprompt.com',
    'https://rag-prompt-library.web.app',
    'https://rag-prompt-library.firebaseapp.com',
    'https://react-app-000730.web.app',
    'https://react-app-000730.firebaseapp.com',
    // Staging
    'https://rag-prompt-library-staging.web.app',
    'https://ethosprompt-staging.web.app',
    // Local development
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  const origin = req.headers.origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin);

  if (isAllowedOrigin) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.FUNCTIONS_EMULATOR === 'true') {
    // Allow any origin in emulator mode for testing
    res.set('Access-Control-Allow-Origin', origin || '*');
  }
  // If origin not allowed and not in emulator, no CORS header is set (browser will block)

  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    // Validate request body
    const validationResult = submissionRequestSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors,
      });
      return;
    }

    const data = validationResult.data;

    // Rate limiting check (simple IP-based)
    const clientIP = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const oneHourAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 60 * 60 * 1000)
    );

    const recentSubmissions = await db
      .collection('quotation_requests')
      .where('metadata.ipAddress', '==', clientIP)
      .where('createdAt', '>', oneHourAgo)
      .get();

    if (recentSubmissions.size >= 3) {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
      });
      return;
    }

    // Check for duplicate email in last hour
    const duplicateCheck = await db
      .collection('quotation_requests')
      .where('businessInfo.contactEmail', '==', data.formData.contactEmail)
      .where('createdAt', '>', oneHourAgo)
      .get();

    if (!duplicateCheck.empty) {
      res.status(409).json({
        success: false,
        error: 'A quotation request with this email was already submitted recently.',
      });
      return;
    }

    // Generate reference number
    const referenceNumber = generateReferenceNumber();

    // Prepare document
    const quotationDoc = {
      referenceNumber,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      serviceContext: data.serviceContext,
      serviceName: data.serviceName,
      packageType: data.packageType || null,
      packageName: data.packageName || null,

      businessInfo: {
        companyName: sanitizeInput(data.formData.companyName),
        industry: data.formData.industry,
        companySize: data.formData.companySize,
        contactName: sanitizeInput(data.formData.contactName),
        contactEmail: sanitizeInput(data.formData.contactEmail),
        contactPhone: data.formData.contactPhone ? sanitizeInput(data.formData.contactPhone) : null,
      },

      projectScope: {
        description: sanitizeInput(data.formData.projectDescription),
        primaryGoals: data.formData.primaryGoals,
        specificFeatures: data.formData.specificFeatures || [],
      },

      technicalRequirements: {
        existingSystems: data.formData.existingSystems || [],
        integrationNeeds: data.formData.integrationNeeds ? sanitizeInput(data.formData.integrationNeeds) : '',
        dataVolume: data.formData.dataVolume,
        securityRequirements: data.formData.securityRequirements || [],
      },

      timelineBudget: {
        desiredTimeline: data.formData.desiredTimeline,
        budgetRange: data.formData.budgetRange,
        flexibility: data.formData.flexibility,
      },

      consultationPreference: {
        needsConsultation: data.formData.needsConsultation,
        consultationFormat: data.formData.consultationFormat || null,
        preferredTimeSlots: data.formData.preferredTimeSlots || [],
      },

      metadata: {
        submittedAt: admin.firestore.Timestamp.fromDate(new Date(data.metadata.submittedAt)),
        userAgent: data.metadata.userAgent,
        referrerUrl: data.metadata.referrerUrl,
        ipAddress: clientIP,
      },

      salesNotes: {
        assignedTo: null,
        quotationSentAt: null,
        quotationAmount: null,
        notes: '',
      },
    };

    // Store in Firestore
    const docRef = await db.collection('quotation_requests').add(quotationDoc);

    // Ingest into unified contacts pipeline via httpApi (non-fatal if it fails)
    let contactId: string | null = null;
    try {
      const ingestedId = await ingestLeadFromQuotation(docRef.id, data);
      contactId = ingestedId || null;
    } catch (ingestError) {
      console.error(
        '[quotation->lead_ingest] Failed to ingest lead via unified pipeline',
        ingestError,
      );
    }

    // Send confirmation email to user (non-fatal if fails)
    try {
      await sendUserConfirmationEmail(data.formData.contactEmail, referenceNumber, data);
      console.log('[quotation] User confirmation email sent successfully', referenceNumber);
    } catch (emailError) {
      console.error('[quotation] Failed to send user confirmation email', referenceNumber, emailError);
      // Don't throw - email failure shouldn't block quotation submission
    }

    // Send notification email to sales team (non-fatal if fails)
    try {
      await sendSalesTeamNotificationEmail(referenceNumber, data);
      console.log('[quotation] Sales team notification email sent successfully', referenceNumber);
    } catch (emailError) {
      console.error('[quotation] Failed to send sales team notification email', referenceNumber, emailError);
      // Don't throw - email failure shouldn't block quotation submission
    }

    // TODO: Post to Slack (future enhancement)
    // await postToSlack(referenceNumber, data);


    // Log analytics event
    console.log('Quotation submitted:', {
      referenceNumber,
      serviceContext: data.serviceContext,
      packageType: data.packageType,
      needsConsultation: data.formData.needsConsultation,
    });

    // Return success
    res.status(200).json({
      success: true,
      referenceNumber,
      contactId,
      message: 'Quotation request submitted successfully',
    });

  } catch (error) {
    console.error('Error submitting quotation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});
