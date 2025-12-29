export type ContactSubmission = {
  name: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  source?: string;
  metadata?: {
    submittedAt: string;
    userAgent?: string;
    referrerUrl?: string;
  };
};

const getBaseUrl = () => {
  // Configure base URL to your Functions HTTP endpoint, e.g. https://<region>-<project>.cloudfunctions.net
  // For local dev without backend, leave undefined to simulate success.
  const envUrl = (import.meta as any).env?.VITE_CONTACT_API_BASE_URL as string | undefined;
  return envUrl && envUrl.trim().length > 0 ? envUrl.replace(/\/$/, '') : undefined;
};

export const contactService = {
  async submitContact(payload: ContactSubmission): Promise<{ success: boolean; reference?: string }>
  {
    const baseUrl = getBaseUrl();

    // Map existing contact form shape into unified lead ingestion schema
    const body = {
      email: payload.email,
      name: payload.name,
      service: payload.service,
      phone: payload.phone,
      source: payload.source || 'contact_form',
      meta: {
        message: payload.message,
      },
      metadata: {
        userAgent: payload.metadata?.userAgent,
        referrerUrl: payload.metadata?.referrerUrl,
        utmParams: {},
      },
    };

    const url = baseUrl ? `${baseUrl}/leads/capture-contact` : '/api/leads/capture-contact';

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Contact submission failed: HTTP ${res.status} ${text}`);
    }

    const json = await res.json().catch(() => ({ success: false }));

    // Adapt ingestion response `{ success, contactId }` to the previous `{ success, reference }` shape
    if (json && typeof json === 'object') {
      return {
        success: !!json.success,
        reference: json.contactId || json.reference,
      };
    }

    return { success: true };
  },

  async captureLead(email: string, name?: string, service?: string): Promise<{ success: boolean }>
  {
    const baseUrl = getBaseUrl();
    if (!baseUrl) {
      return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 300));
    }

    const res = await fetch(`${baseUrl}/capture_lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, service, source: 'exit_intent', timestamp: new Date().toISOString() })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Lead capture failed: HTTP ${res.status} ${text}`);
    }

    return res.json();
  }
};
