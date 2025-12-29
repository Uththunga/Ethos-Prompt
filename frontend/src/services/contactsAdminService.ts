import { auth } from '@/config/firebase';
import type { Contact, ContactActivity, ContactSource, ContactStatus, EmailJob } from '@/types';

interface ContactListParams {
  status?: ContactStatus;
  ownerUserId?: string;
  source?: ContactSource;
  tag?: string;
  service?: string;
  page?: number;
  pageSize?: number;
}

interface ContactListResponse {
  success: boolean;
  contacts: Contact[];
}

interface ContactResponse {
  success: boolean;
  contact: Contact;
}

interface DeleteResponse {
  success: boolean;
}

interface SendEmailResponse {
  success: boolean;
  job: { id: string };
  activity: ContactActivity | null;
  error?: string;
}

interface ScheduleSequenceResponse {
  success: boolean;
  contactId: string;
  sequenceId: string;
  jobs: EmailJob[];
}

interface ContactEmailJobsResponse {
  success: boolean;
  jobs: EmailJob[];
}

function buildBaseUrl(): string {
  const isEmulators = import.meta.env.VITE_ENABLE_EMULATORS === 'true';
  const explicitApi = (import.meta.env.VITE_API_URL || '').toString().trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  const region = 'australia-southeast1';
  const functionName = (import.meta.env.VITE_FUNCTIONS_HTTP_API_NAME as string) || 'httpApi';

  if (isEmulators) {
    const providedBase =
      (import.meta.env.VITE_FIREBASE_FUNCTIONS_URL as string) ||
      (projectId ? `http://localhost:5001/${projectId}/${region}` : 'http://localhost:5001');
    return providedBase.endsWith(`/${functionName}`)
      ? providedBase
      : `${providedBase}/${functionName}`;
  }

  if (explicitApi) {
    return explicitApi.replace(/\/$/, '');
  }

  if (typeof globalThis !== 'undefined' && (globalThis as any).location?.origin) {
    return (globalThis as any).location.origin as string;
  }

  return '';
}

const baseUrl = buildBaseUrl();

async function getAuthHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

function buildQuery(params: ContactListParams): string {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.ownerUserId) searchParams.set('ownerUserId', params.ownerUserId);
  if (params.source) searchParams.set('source', params.source);
  if (params.tag) searchParams.set('tag', params.tag);
  if (params.service) searchParams.set('service', params.service);
  if (params.page && params.page > 1) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const contactsAdminService = {
  async listContacts(params: ContactListParams = {}): Promise<ContactListResponse> {
    const headers = await getAuthHeader();
    const query = buildQuery(params);
    const url = `${baseUrl}/api/contacts${query}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list contacts: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getContact(id: string): Promise<ContactResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(id)}`;
    const res = await fetch(url, { headers });
    if (res.status === 404) {
      throw new Error('Contact not found');
    }
    if (!res.ok) {
      throw new Error(`Failed to get contact: HTTP ${res.status}`);
    }
    return res.json();
  },

  async createContact(payload: Partial<Contact> & { name: string; email: string }): Promise<ContactResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts`;
    const body: Record<string, unknown> = {
      name: payload.name,
      email: payload.email,
      company: payload.company,
      jobTitle: payload.jobTitle ?? null,
      phone: payload.phone ?? null,
      status: payload.status,
      source: payload.source,
      ownerUserId: payload.ownerUserId ?? null,
      team: payload.team ?? null,
      tags: payload.tags ?? [],
      notesSummary: payload.notesSummary,
      meta: payload.meta,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to create contact: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async updateContact(id: string, updates: Partial<Contact>): Promise<ContactResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(id)}`;
    const body: Record<string, unknown> = {};

    if (updates.name !== undefined) body.name = updates.name;
    if (updates.email !== undefined) body.email = updates.email;
    if (updates.company !== undefined) body.company = updates.company;
    if (updates.jobTitle !== undefined) body.jobTitle = updates.jobTitle;
    if (updates.phone !== undefined) body.phone = updates.phone;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.source !== undefined) body.source = updates.source;
    if (updates.ownerUserId !== undefined) body.ownerUserId = updates.ownerUserId;
    if (updates.team !== undefined) body.team = updates.team;
    if (updates.tags !== undefined) body.tags = updates.tags;
    if (updates.notesSummary !== undefined) body.notesSummary = updates.notesSummary;
    if (updates.nextFollowUpAt !== undefined) body.nextFollowUpAt = updates.nextFollowUpAt;
    if (updates.meta !== undefined) body.meta = updates.meta;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to update contact: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async deleteContact(id: string): Promise<DeleteResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    if (res.status === 404) {
      throw new Error('Contact not found');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to delete contact: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async listMyContacts(params: Omit<ContactListParams, 'ownerUserId'> = {}): Promise<ContactListResponse> {
    const headers = await getAuthHeader();
    const query = buildQuery(params as ContactListParams);
    const url = `${baseUrl}/api/my-contacts${query}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list my contacts: HTTP ${res.status}`);
    }
    return res.json();
  },

  async sendEmail(
    contactId: string,
    payload: {
      templateId: string;
      subjectOverride?: string;
      bodyHtmlOverride?: string;
      bodyTextOverride?: string;
      variables?: Record<string, unknown>;
    },
  ): Promise<SendEmailResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(contactId)}/send-email`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to send email: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async scheduleSequence(contactId: string, sequenceId: string): Promise<ScheduleSequenceResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(contactId)}/schedule-sequence`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sequenceId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to schedule sequence: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async listContactEmailJobs(
    contactId: string,
    opts: { limit?: number } = {},
  ): Promise<ContactEmailJobsResponse> {
    const headers = await getAuthHeader();
    const params = new URLSearchParams();
    if (opts.limit && opts.limit > 0) params.set('limit', String(opts.limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(contactId)}/email-jobs${query}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to list email jobs: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },
};
