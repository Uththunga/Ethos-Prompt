import { auth } from '@/config/firebase';
import type { EmailEvent, EmailEventType, EmailJob, EmailJobStatus } from '@/types';

interface EmailJobsListResponse {
  success: boolean;
  jobs: EmailJob[];
}

interface EmailEventsListResponse {
  success: boolean;
  events: EmailEvent[];
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

export const emailJobsAdminService = {
  async listJobs(params: {
    status?: EmailJobStatus | 'all';
    contactId?: string;
    sequenceId?: string;
    limit?: number;
  } = {}): Promise<EmailJobsListResponse> {
    const headers = await getAuthHeader();
    const search = new URLSearchParams();
    if (params.status && params.status !== 'all') search.set('status', params.status);
    if (params.contactId) search.set('contactId', params.contactId);
    if (params.sequenceId) search.set('sequenceId', params.sequenceId);
    if (params.limit && params.limit > 0) search.set('limit', String(params.limit));
    const query = search.toString() ? `?${search.toString()}` : '';
    const url = `${baseUrl}/api/email-jobs${query}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to list email jobs: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },

  async listEvents(params: {
    emailJobId?: string;
    type?: EmailEventType | 'all';
    limit?: number;
  } = {}): Promise<EmailEventsListResponse> {
    const headers = await getAuthHeader();
    const search = new URLSearchParams();
    if (params.emailJobId) search.set('emailJobId', params.emailJobId);
    if (params.type && params.type !== 'all') search.set('type', params.type);
    if (params.limit && params.limit > 0) search.set('limit', String(params.limit));
    const query = search.toString() ? `?${search.toString()}` : '';
    const url = `${baseUrl}/api/email-events${query}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to list email events: HTTP ${res.status} ${text}`);
    }
    return res.json();
  },
};
