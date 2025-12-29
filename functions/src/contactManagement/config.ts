import { defineSecret } from 'firebase-functions/params';

export const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'notifications@example.com';

export const RESEND_FROM_NAME = process.env.RESEND_FROM_NAME || 'EthosPrompt Notifications';

export interface ResendConfig {
  apiKey: string | undefined;
  fromEmail: string;
  fromName: string;
}

export function getResendConfig(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY;

  return {
    apiKey,
    fromEmail: RESEND_FROM_EMAIL,
    fromName: RESEND_FROM_NAME,
  };
}
