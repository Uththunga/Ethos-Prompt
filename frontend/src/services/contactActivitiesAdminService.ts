import { auth } from '@/config/firebase';
import type { ContactActivity } from '@/types';

interface ActivityListResponse {
  success: boolean;
  activities: ContactActivity[];
}

interface ActivityResponse {
  success: boolean;
  activity: ContactActivity;
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

export const contactActivitiesAdminService = {
  async listActivities(contactId: string, limit = 50): Promise<ActivityListResponse> {
    const headers = await getAuthHeader();
    const params = new URLSearchParams();
    if (limit && limit > 0) params.set('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(contactId)}/activities${query}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list activities: HTTP ${res.status}`);
    }
    return res.json();
  },

  async createNote(contactId: string, content: string): Promise<ActivityResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(contactId)}/activities`;
    const body: Record<string, unknown> = {
      type: 'note',
      direction: 'internal',
      content,
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to create activity: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async createCall(
    contactId: string,
    options: { direction: 'inbound' | 'outbound'; summary: string; metadata?: Record<string, unknown> },
  ): Promise<ActivityResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(contactId)}/activities`;
    const body: Record<string, unknown> = {
      type: 'call',
      direction: options.direction,
      content: options.summary,
    };
    if (options.metadata && typeof options.metadata === 'object') {
      body.metadata = options.metadata;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to create call activity: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async createMeeting(
    contactId: string,
    summary: string,
    metadata?: Record<string, unknown>,
  ): Promise<ActivityResponse> {
    const headers = await getAuthHeader();
    const url = `${baseUrl}/api/contacts/${encodeURIComponent(contactId)}/activities`;
    const body: Record<string, unknown> = {
      type: 'meeting',
      direction: 'internal',
      content: summary,
    };
    if (metadata && typeof metadata === 'object') {
      body.metadata = metadata;
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to create meeting activity: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },
};
