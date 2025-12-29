import * as admin from 'firebase-admin';

import { db } from './index';
import type { ContactActivity } from './models';

type FirestoreTimestamp = FirebaseFirestore.Timestamp | admin.firestore.Timestamp;

type ContactActivityDocument = Omit<ContactActivity, 'id'>;

const activitiesCollection = db.collection('contact_activities');

function mapContactActivityDoc(
  snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): ContactActivity {
  const data = snap.data() as ContactActivityDocument | undefined;

  if (!data) {
    throw new Error(`Contact activity document ${snap.id} has no data`);
  }

  return {
    id: snap.id,
    ...data,
  };
}

export interface CreateContactActivityInput {
  contactId: string;
  type: ContactActivity['type'];
  direction: ContactActivity['direction'];
  subject?: string;
  snippet: string;
  content?: string;
  createdByUserId?: string;
  createdByName?: string;
  timestamp?: FirestoreTimestamp;
  metadata?: ContactActivity['metadata'];
}

export interface ContactActivityListOptions {
  limit?: number;
}

export async function createContactActivity(
  input: CreateContactActivityInput,
): Promise<ContactActivity> {
  const now = admin.firestore.FieldValue.serverTimestamp() as FirestoreTimestamp;

  const docData: ContactActivityDocument = {
    contactId: input.contactId,
    type: input.type,
    direction: input.direction,
    snippet: input.snippet,
    content: input.content ?? '',
    createdByUserId: input.createdByUserId,
    createdByName: input.createdByName,
    timestamp: input.timestamp ?? now,
    metadata: input.metadata,
  };

  // Strip undefined values so Firestore does not reject the document
  (Object.keys(docData) as (keyof ContactActivityDocument)[]).forEach((key) => {
    if (docData[key] === undefined) {
      delete docData[key];
    }
  });

  const ref = await activitiesCollection.add(docData);
  const snap = await ref.get();

  return mapContactActivityDoc(snap);
}

export async function listContactActivities(
  contactId: string,
  options: ContactActivityListOptions = {},
): Promise<ContactActivity[]> {
  const { limit = 50 } = options;

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = activitiesCollection
    .where('contactId', '==', contactId)
    .orderBy('timestamp', 'desc')
    .limit(limit);

  const snap = await query.get();
  return snap.docs.map((doc) => mapContactActivityDoc(doc));
}
