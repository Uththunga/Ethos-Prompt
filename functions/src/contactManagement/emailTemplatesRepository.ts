import * as admin from 'firebase-admin';

import { db } from './index';
import type { EmailTemplate, EmailTemplateType } from './models';

const emailTemplatesCollection = db.collection('email_templates');

type FirestoreTimestamp = FirebaseFirestore.Timestamp | admin.firestore.Timestamp;

type EmailTemplateDocument = Omit<EmailTemplate, 'id'>;

function mapTemplateDoc(
  snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): EmailTemplate {
  const data = snap.data() as EmailTemplateDocument | undefined;

  if (!data) {
    throw new Error(`Email template document ${snap.id} has no data`);
  }

  return {
    id: snap.id,
    ...data,
  };
}

export interface CreateEmailTemplateInput {
  name: string;
  description?: string;
  type: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables?: string[];
  isActive?: boolean;
  createdByUserId: string;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  description?: string;
  type?: EmailTemplateType;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
  variables?: string[];
  isActive?: boolean;
}

export interface EmailTemplateListOptions {
  onlyActive?: boolean;
  type?: EmailTemplateType;
  limit?: number;
}

export interface EmailTemplateListResult {
  templates: EmailTemplate[];
}

export async function createEmailTemplate(
  input: CreateEmailTemplateInput,
): Promise<EmailTemplate> {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const docData: Record<string, unknown> = {
    name: input.name.trim(),
    description: input.description ?? '',
    type: input.type,
    subject: input.subject,
    bodyHtml: input.bodyHtml,
    bodyText: input.bodyText ?? null,
    variables: input.variables ?? [],
    isActive: input.isActive ?? true,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await emailTemplatesCollection.add(docData);
  const snap = await ref.get();

  return mapTemplateDoc(snap);
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
  const snap = await emailTemplatesCollection.doc(id).get();

  if (!snap.exists) {
    return null;
  }

  return mapTemplateDoc(snap);
}

export async function updateEmailTemplate(
  id: string,
  updates: UpdateEmailTemplateInput,
): Promise<EmailTemplate | null> {
  const ref = emailTemplatesCollection.doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return null;
  }

  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.description !== undefined) updateData.description = updates.description ?? '';
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.subject !== undefined) updateData.subject = updates.subject;
  if (updates.bodyHtml !== undefined) updateData.bodyHtml = updates.bodyHtml;
  if (updates.bodyText !== undefined) updateData.bodyText = updates.bodyText ?? null;
  if (updates.variables !== undefined) updateData.variables = updates.variables ?? [];
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  const keys = Object.keys(updateData);
  if (keys.length === 1 && keys[0] === 'updatedAt') {
    return mapTemplateDoc(snap);
  }

  await ref.update(updateData);
  const updatedSnap = await ref.get();

  return mapTemplateDoc(updatedSnap);
}

export async function deleteEmailTemplate(id: string): Promise<boolean> {
  const ref = emailTemplatesCollection.doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return false;
  }

  await ref.delete();
  return true;
}

export async function listEmailTemplates(
  options: EmailTemplateListOptions = {},
): Promise<EmailTemplateListResult> {
  const { onlyActive, type, limit = 100 } = options;

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = emailTemplatesCollection.orderBy(
    'createdAt',
    'desc',
  );

  if (onlyActive) {
    query = query.where('isActive', '==', true);
  }

  if (type) {
    query = query.where('type', '==', type);
  }

  query = query.limit(limit);

  const snap = await query.get();
  const templates = snap.docs.map((doc) => mapTemplateDoc(doc));

  return { templates };
}
