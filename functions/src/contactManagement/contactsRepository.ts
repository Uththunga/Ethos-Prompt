import * as admin from 'firebase-admin';

import { db } from './index';
import type { Contact, ContactMeta, ContactSource, ContactStatus } from './models';

type FirestoreTimestamp = FirebaseFirestore.Timestamp | admin.firestore.Timestamp;

type ContactDocument = Omit<Contact, 'id'>;

const contactsCollection = db.collection('contacts');

function mapContactDoc(
  snap: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
): Contact {
  const data = snap.data() as ContactDocument | undefined;

  if (!data) {
    throw new Error(`Contact document ${snap.id} has no data`);
  }

  return {
    id: snap.id,
    ...data,
  };
}

export interface CreateContactInput {
  name: string;
  email: string;
  company?: string;
  jobTitle?: string | null;
  phone?: string | null;
  status?: ContactStatus;
  source: ContactSource;
  ownerUserId?: string | null;
  team?: string | null;
  tags?: string[];
  notesSummary?: string;
  lastContactedAt?: FirestoreTimestamp | null;
  nextFollowUpAt?: FirestoreTimestamp | null;
  meta?: ContactMeta;
}

export interface UpdateContactInput {
  name?: string;
  email?: string;
  company?: string;
  jobTitle?: string | null;
  phone?: string | null;
  status?: ContactStatus;
  source?: ContactSource;
  ownerUserId?: string | null;
  team?: string | null;
  tags?: string[];
  notesSummary?: string;
  lastContactedAt?: FirestoreTimestamp | null;
  nextFollowUpAt?: FirestoreTimestamp | null;
  meta?: ContactMeta;
}

export interface ContactListFilters {
  status?: ContactStatus;
  ownerUserId?: string;
  source?: ContactSource;
  tag?: string;
}

export interface ContactListOptions extends ContactListFilters {
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'lastContactedAt';
  direction?: FirebaseFirestore.OrderByDirection;
}

export interface ContactListResult {
  contacts: Contact[];
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const emailNorm = input.email.trim().toLowerCase();

  const docData: Record<string, unknown> = {
    name: input.name.trim(),
    email: emailNorm,
    company: input.company ?? '',
    jobTitle: input.jobTitle ?? null,
    phone: input.phone ?? null,
    status: input.status ?? 'new',
    source: input.source,
    ownerUserId: input.ownerUserId ?? null,
    team: input.team ?? null,
    tags: input.tags ?? [],
    notesSummary: input.notesSummary ?? '',
    lastContactedAt: input.lastContactedAt ?? now,
    nextFollowUpAt: input.nextFollowUpAt ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (input.meta) {
    docData.meta = input.meta;
  }

  const ref = await contactsCollection.add(docData);
  const snap = await ref.get();

  return mapContactDoc(snap);
}

export async function getContactById(id: string): Promise<Contact | null> {
  const snap = await contactsCollection.doc(id).get();

  if (!snap.exists) {
    return null;
  }

  return mapContactDoc(snap);
}

export async function updateContact(
  id: string,
  updates: UpdateContactInput,
): Promise<Contact | null> {
  const ref = contactsCollection.doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return null;
  }

  const updateData: Record<string, unknown> = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email.trim().toLowerCase();
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.jobTitle !== undefined) updateData.jobTitle = updates.jobTitle;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.source !== undefined) updateData.source = updates.source;
  if (updates.ownerUserId !== undefined) updateData.ownerUserId = updates.ownerUserId;
  if (updates.team !== undefined) updateData.team = updates.team;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.notesSummary !== undefined) updateData.notesSummary = updates.notesSummary;
  if (updates.lastContactedAt !== undefined) updateData.lastContactedAt = updates.lastContactedAt;
  if (updates.nextFollowUpAt !== undefined) updateData.nextFollowUpAt = updates.nextFollowUpAt;
  if (updates.meta !== undefined) updateData.meta = updates.meta;

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  // If nothing except updatedAt is being changed, avoid an empty update.
  const keys = Object.keys(updateData);
  if (keys.length === 1 && keys[0] === 'updatedAt') {
    // No-op update; just return the current document mapped to Contact.
    return mapContactDoc(snap);
  }

  await ref.update(updateData);
  const updatedSnap = await ref.get();

  return mapContactDoc(updatedSnap);
}

export async function deleteContact(id: string): Promise<boolean> {
  const ref = contactsCollection.doc(id);
  const snap = await ref.get();

  if (!snap.exists) {
    return false;
  }

  await ref.delete();
  return true;
}

export async function listContacts(options: ContactListOptions = {}): Promise<ContactListResult> {
  const {
    status,
    ownerUserId,
    source,
    tag,
    limit = 50,
    orderBy = 'createdAt',
    direction = 'desc',
  } = options;

  let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = contactsCollection.orderBy(
    orderBy,
    direction,
  );

  if (status) {
    query = query.where('status', '==', status);
  }

  if (ownerUserId) {
    query = query.where('ownerUserId', '==', ownerUserId);
  }

  if (source) {
    query = query.where('source', '==', source);
  }

  if (tag) {
    query = query.where('tags', 'array-contains', tag);
  }

  query = query.limit(limit);

  const snap = await query.get();
  const contacts = snap.docs.map((doc) => mapContactDoc(doc));

  return { contacts };
}

export async function listMyContacts(
  ownerUserId: string,
  options: Omit<ContactListOptions, 'ownerUserId'> = {},
): Promise<ContactListResult> {
  return listContacts({ ...options, ownerUserId });
}
