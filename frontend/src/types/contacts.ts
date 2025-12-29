export type ContactStatus =
  | 'new'
  | 'in_progress'
  | 'responded'
  | 'qualified'
  | 'closed_won'
  | 'closed_lost';

export type ContactSource =
  | 'roi_calculator'
  | 'quotation'
  | 'contact_form'
  | 'exit_intent'
  | 'manual'
  | 'import'
  | 'other';

export interface ContactMetaOriginalLeadIds {
  quotationId?: string;
  contactFormId?: string;
  roiLeadId?: string;
}

export interface ContactMetadata {
  userAgent?: string;
  referrerUrl?: string;
  utmParams?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ContactMeta {
  originalLeadIds?: ContactMetaOriginalLeadIds;
  timezone?: string;
  country?: string;
  roiSnapshot?: unknown;
  leadMagnet?: string;
  service?: string;
  metadata?: ContactMetadata;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  jobTitle?: string | null;
  phone?: string | null;
  status: ContactStatus;
  source: ContactSource;
  ownerUserId?: string | null;
  team?: string | null;
  tags: string[];
  notesSummary?: string;
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  meta?: ContactMeta;
}

export type ContactActivityType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'note'
  | 'system_email';

export type ContactActivityDirection = 'inbound' | 'outbound' | 'internal';

export interface ContactActivityMetadata {
  emailJobId?: string;
  channel?: 'resend' | 'manual' | 'slack' | 'other';
  attachments?: string[];
  [key: string]: unknown;
}

export interface ContactActivity {
  id: string;
  contactId: string;
  type: ContactActivityType;
  direction: ContactActivityDirection;
  subject?: string;
  snippet: string;
  content?: string;
  createdByUserId?: string;
  createdByName?: string;
  timestamp: Date;
  metadata?: ContactActivityMetadata;
}

export type EmailTemplateType =
  | 'initial_followup'
  | 'reminder'
  | 'nps'
  | 'custom';

export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  type: EmailTemplateType;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  variables: string[];
  isActive: boolean;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailSequenceConditionOp = '==' | '!=' | 'in' | 'not_in';

export interface EmailSequenceStepCondition {
  field: string;
  op: EmailSequenceConditionOp;
  value: unknown;
}

export interface EmailSequenceStep {
  stepNumber: number;
  templateId: string;
  waitDays: number;
  condition?: EmailSequenceStepCondition;
}

export interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  steps: EmailSequenceStep[];
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailJobScheduleType = 'immediate' | 'scheduled';

export type EmailJobStatus =
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'cancelled';

export interface EmailJob {
  id: string;
  contactId: string;
  sequenceId?: string;
  stepNumber?: number;
  templateId: string;
  scheduleType: EmailJobScheduleType;
  scheduledAt: Date;
  status: EmailJobStatus;
  provider: 'resend';
  providerMessageId?: string;
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  lastError?: string;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

export interface EmailEvent {
  id: string;
  emailJobId: string;
  type: EmailEventType;
  providerEventId: string;
  timestamp: Date;
  rawPayload: unknown;
  createdAt: Date;
}

export type UserRole = 'admin' | 'dev';

export interface UserRoleRecord {
  userId: string;
  role: UserRole;
  team?: string;
  createdAt: Date;
}
