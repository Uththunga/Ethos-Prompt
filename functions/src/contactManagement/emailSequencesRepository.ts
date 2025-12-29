import * as admin from 'firebase-admin';

import { db } from './index';
import type { EmailSequence, EmailSequenceStep } from './models';

const emailSequencesCollection = db.collection('email_sequences');

type EmailSequenceDocument = Omit<EmailSequence, 'id'>;

function mapSequenceDoc(
  snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): EmailSequence {
  const data = snap.data() as EmailSequenceDocument | undefined;

  if (!data) {
    throw new Error(`Email sequence document ${snap.id} has no data`);
  }

  return {
    id: snap.id,
    ...data,
  };
}

export interface CreateEmailSequenceInput {
  name: string;
  description?: string;
  isActive?: boolean;
  steps: EmailSequenceStep[];
  createdByUserId: string;
}

export interface UpdateEmailSequenceInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  steps?: EmailSequenceStep[];
}

export interface EmailSequenceListOptions {
  onlyActive?: boolean;
  limit?: number;
}

export interface EmailSequenceListResult {
  sequences: EmailSequence[];
}

function sanitizeSteps(rawSteps: EmailSequenceStep[] | undefined | null): EmailSequenceStep[] {
  if (!Array.isArray(rawSteps)) return [];

  const result: EmailSequenceStep[] = [];

  rawSteps.forEach((step, index) => {
    const templateId = typeof step.templateId === 'string' ? step.templateId : '';
    if (!templateId) return;

    const waitDaysNum = Number((step as any).waitDays);
    const waitDays = Number.isFinite(waitDaysNum) && waitDaysNum >= 0 ? waitDaysNum : 0;

    let condition: EmailSequenceStep['condition'] | undefined;
    const cond = (step as any).condition;
    if (cond && typeof cond === 'object') {
      const field = typeof cond.field === 'string' ? cond.field : '';
      const op = cond.op as any;
      if (field && (op === '==' || op === '!=' || op === 'in' || op === 'not_in')) {
        condition = {
          field,
          op,
          value: cond.value,
        };
      }
    }

    const stepNumberRaw = Number((step as any).stepNumber);
    const stepNumber = Number.isFinite(stepNumberRaw) && stepNumberRaw > 0 ? stepNumberRaw : index + 1;

    const cleanStep: EmailSequenceStep = {
      stepNumber,
      templateId,
      waitDays,
    };

    if (condition) {
      cleanStep.condition = condition;
    }

    result.push(cleanStep);
  });

  return result;
}

export async function createEmailSequence(
  input: CreateEmailSequenceInput,
): Promise<EmailSequence> {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const steps = sanitizeSteps(input.steps);
  if (!steps.length) {
    throw new Error('Email sequence must have at least one step');
  }

  const docData: Record<string, unknown> = {
    name: input.name.trim(),
    description: input.description ?? '',
    isActive: input.isActive ?? true,
    steps,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await emailSequencesCollection.add(docData);
  const snap = await ref.get();

  return mapSequenceDoc(snap);
}

export async function getEmailSequenceById(id: string): Promise<EmailSequence | null> {
  const snap = await emailSequencesCollection.doc(id).get();

  if (!snap.exists) {
    return null;
  }

  return mapSequenceDoc(snap);
}

export async function updateEmailSequence(
  id: string,
  updates: UpdateEmailSequenceInput,
): Promise<EmailSequence | null> {
  const ref = emailSequencesCollection.doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return null;
  }

  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.description !== undefined) updateData.description = updates.description ?? '';
  if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
  if (updates.steps !== undefined) {
    const steps = sanitizeSteps(updates.steps);
    if (!steps.length) {
      throw new Error('Email sequence must have at least one step');
    }
    updateData.steps = steps;
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  const keys = Object.keys(updateData);
  if (keys.length === 1 && keys[0] === 'updatedAt') {
    return mapSequenceDoc(snap);
  }

  await ref.update(updateData);
  const updatedSnap = await ref.get();

  return mapSequenceDoc(updatedSnap);
}

export async function deleteEmailSequence(id: string): Promise<boolean> {
  const ref = emailSequencesCollection.doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return false;
  }

  await ref.delete();
  return true;
}

export async function listEmailSequences(
  options: EmailSequenceListOptions = {},
): Promise<EmailSequenceListResult> {
  const { onlyActive, limit = 100 } = options;

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = emailSequencesCollection.orderBy(
    'createdAt',
    'desc',
  );

  if (onlyActive) {
    query = query.where('isActive', '==', true);
  }

  query = query.limit(limit);

  const snap = await query.get();
  const sequences = snap.docs.map((doc) => mapSequenceDoc(doc));

  return { sequences };
}
