import { auth } from '@/config/firebase';
import type { EmailSequence } from '@/types';

interface EmailSequencesListResponse {
  success: boolean;
  sequences: EmailSequence[];
}

interface EmailSequenceResponse {
  success: boolean;
  sequence: EmailSequence;
}

interface DeleteResponse {
  success: boolean;
}

interface ListSequencesParams {
  onlyActive?: boolean;
}

interface CreateEmailSequencePayload {
  name: string;
  description?: string;
  isActive?: boolean;
  steps: EmailSequence['steps'];
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

export const emailSequencesAdminService = {
  async listSequences(params: ListSequencesParams = {}): Promise<EmailSequencesListResponse> {
    const headers = await getAuthHeader();
    const search = new URLSearchParams();
    if (params.onlyActive) search.set('onlyActive', 'true');
    const query = search.toString() ? `?${search.toString()}` : '';
    const url = `${baseUrl}/api/email-sequences${query}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list email sequences: HTTP ${res.status}`);
    }
    return res.json();
  },

  async getSequence(id: string): Promise<EmailSequenceResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/email-sequences/${encodeURIComponent(id)}`;
    const res = await fetch(url, { headers });
    if (res.status === 404) {
      throw new Error('Email sequence not found');
    }
    if (!res.ok) {
      throw new Error(`Failed to get email sequence: HTTP ${res.status}`);
    }
    return res.json();
  },

  async createSequence(payload: CreateEmailSequencePayload): Promise<EmailSequenceResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/email-sequences`;
    const body: Record<string, unknown> = {
      name: payload.name,
      description: payload.description,
      isActive: payload.isActive,
      steps: Array.isArray(payload.steps) ? payload.steps : [],
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to create email sequence: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async updateSequence(id: string, updates: Partial<EmailSequence>): Promise<EmailSequenceResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/email-sequences/${encodeURIComponent(id)}`;
    const body: Record<string, unknown> = {};

    if (updates.name !== undefined) body.name = updates.name;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.isActive !== undefined) body.isActive = updates.isActive;
    if (updates.steps !== undefined) body.steps = updates.steps;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to update email sequence: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async deleteSequence(id: string): Promise<DeleteResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/email-sequences/${encodeURIComponent(id)}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    if (res.status === 404) {
      throw new Error('Email sequence not found');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to delete email sequence: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },
};
