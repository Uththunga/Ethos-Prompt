# Contact Management & Follow-Up System – Implementation Plan

**Version:** 2.0 – Full ROI & CTA Integration
**Last Updated:** November 15, 2025

---

## Executive Summary

This plan integrates the existing ROI calculators, contact forms, quotation system, and exit-intent popups with a new centralized contact management and automated follow-up system. The goal is to ensure **zero lead loss**, provide a unified admin interface for managing all leads, and automate nurturing sequences based on lead source and behavior.

### Current State Analysis

**What Exists:**
- ROI calculators on 3 service pages (Smart Assistant, System Integration, Intelligent Applications)
- Multi-step quotation system with Firestore backend (`quotation_requests` collection)
- Contact form with validation and backend persistence to Firestore (`submit_contact` → `contact_submissions`)
- Exit-intent popups on all service pages with GA tracking and optional backend capture (`capture_lead` → `marketing_leads`)
- Google Analytics tracking for most flows

**Critical Gaps (as of November 15, 2025 in this repo):**
- No unified `/api/leads/ingest` endpoint or `contacts` collection for cross-source deduplication
- Main exit-intent flows override backend capture and currently only log to console + analytics
- ROI calculator leads are posted to `/api/capture-calculator-lead` but not unified into the contact management system in this repo
- No unified contact database – leads remain in separate collections (`contact_submissions`, `marketing_leads`, `quotation_requests`)
- No automated follow-up – all nurturing is manual
- No lead assignment or ownership – no way to track who's handling what
- Quotation funnel analytics events are missing – can't measure conversion by step

---

## 1. Objectives

### Primary Goals

- **[O1] Zero Lead Loss**
  - Capture and persist every lead from ROI calculators, contact forms, quotations, and exit-intent popups to a central database.

- **[O2] Unified Lead Management**
  - Build a single admin panel where all leads are visible, searchable, filterable, and manageable regardless of source.

- **[O3] Automated Lead Nurturing**
  - Implement email sequences triggered by lead source and behavior (e.g., ROI calculator → 3-day follow-up → 7-day reminder).

- **[O4] Lead Ownership & Accountability**
  - Enable assignment of leads to team members with "My Contacts" views and follow-up reminders.

- **[O5] Complete Analytics & Reporting**
  - Track full funnel from initial engagement → lead capture → follow-up → conversion.

- **[O6] Scalable Architecture**
  - Design for future extensions: additional email providers, automation rules, CRM integrations, AI-powered lead scoring.

### Expected Outcomes

- Every ROI calculation, contact form submission, quotation request, and exit-intent capture creates or updates a `contact` record.
- All communication history is logged per contact.
- Follow-up emails are sent automatically based on configurable sequences.
- Team can see pipeline health: leads by source, status, owner, and next action required.
- System is secure, compliant, and auditable.

---

## 2. Prerequisites

### 2.1 Technical

- React + TypeScript frontend (existing marketing/CTA app).
- Backend platform (e.g., Firebase Cloud Functions + Firestore) or equivalent.
- Auth system capable of roles (Firebase Auth + custom claims, or similar).
- Resend account and API key.

### 2.2 Organizational

- Defined roles: at least one **admin** and dev/team members.
- Initial set of follow-up **email templates** from marketing/sales.
- Decisions on compliance basics (opt-in language, data retention, etc.).

---

## 3. Architecture Overview

### 3.1 High-Level Architecture

- **Frontend (Admin & Dev UI)**
  - React SPA routed under `/admin/*`.
  - Uses existing auth and role-based UI controls.
  - Communicates with backend via JSON REST APIs.

- **Backend**
  - HTTP endpoints (e.g., Cloud Functions) for:
    - Contacts CRUD, search, filters.
    - Communication history (activities).
    - Email templates & follow-up sequences.
    - Email job scheduling & status.
  - Scheduled jobs for sending due follow-up emails.

- **Data Store** (example: Firestore)
  - Collections:
    - `contacts`
    - `contact_activities`
    - `email_templates`
    - `email_sequences`
    - `email_jobs`
    - `email_events`
    - `user_roles` (if not using Auth claims only)

- **Email Provider Integration**
  - Resend for sending transactional and follow-up emails.
  - Webhook endpoint to receive delivery/open/bounce events.

- **Auth & RBAC**
  - Roles: `admin`, `dev`.
  - Enforced both at API layer and data store (security rules).

---

## 4. Database Schema Design (Firestore-Oriented)

> These map easily to SQL tables if needed.

### 4.1 `contacts`

Represents a canonical person/company lead.

- `id` (document ID)
- `name: string`
- `email: string`
- `company: string`
- `jobTitle?: string`
- `phone?: string`
- `status: 'new' | 'in_progress' | 'responded' | 'qualified' | 'closed_won' | 'closed_lost'`
- `source: 'roi_calculator' | 'quotation' | 'contact_form' | 'manual' | 'import' | 'other'`
- `ownerUserId?: string` (assigned dev/owner)
- `team?: string`
- `tags: string[]`
- `notesSummary?: string`
- `lastContactedAt?: Timestamp`
- `nextFollowUpAt?: Timestamp`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `meta?: {
    originalLeadIds?: {
      quotationId?: string;
      contactFormId?: string;
      roiLeadId?: string;
    };
    timezone?: string;
    country?: string;
  }`

Indexes:

- `(ownerUserId, status)`
- `(status, nextFollowUpAt)`
- `(email)`
- `(tags)`

---

### 4.2 `contact_activities`

Logs communication and notes for each contact.

- `id`
- `contactId` (ref to `contacts`)
- `type: 'email' | 'call' | 'meeting' | 'note' | 'system_email'`
- `direction: 'inbound' | 'outbound' | 'internal'`
- `subject?: string`
- `snippet: string`
- `content?: string`
- `createdByUserId?: string`
- `createdByName?: string`
- `timestamp: Timestamp`
- `metadata?: {
    emailJobId?: string;
    channel?: 'resend' | 'manual' | 'slack';
    attachments?: string[];
  }`

Index:

- `(contactId, timestamp)`

---

### 4.3 `email_templates`

Reusable email templates.

- `id`
- `name: string`
- `description?: string`
- `type: 'initial_followup' | 'reminder' | 'nps' | 'custom'`
- `subject: string`
- `bodyHtml: string`
- `bodyText?: string`
- `variables: string[]` (e.g., `['contact.name', 'contact.company']`)
- `isActive: boolean`
- `createdByUserId: string`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

---

### 4.4 `email_sequences`

Multi-step follow-up flows.

- `id`
- `name: string`
- `description?: string`
- `isActive: boolean`
- `steps: Array<{
    stepNumber: number;
    templateId: string;
    waitDays: number;
    condition?: {
      field: string;
      op: '==' | '!=' | 'in' | 'not_in';
      value: any;
    };
  }>`
- `createdByUserId: string`
- `createdAt: Timestamp`

---

### 4.5 `email_jobs`

Represents scheduled or sent emails.

- `id`
- `contactId`
- `sequenceId?: string`
- `stepNumber?: number`
- `templateId: string`
- `scheduleType: 'immediate' | 'scheduled'`
- `scheduledAt: Timestamp`
- `status: 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled'`
- `provider: 'resend'`
- `providerMessageId?: string`
- `sentAt?: Timestamp`
- `openedAt?: Timestamp`
- `clickedAt?: Timestamp`
- `bouncedAt?: Timestamp`
- `lastError?: string`
- `createdByUserId: string`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`

Indexes:

- `(status, scheduledAt)`
- `(contactId)`

---

### 4.6 `email_events`

Raw event log from Resend.

- `id`
- `emailJobId`
- `type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'failed'`
- `providerEventId: string`
- `timestamp: Timestamp`
- `rawPayload: object`
- `createdAt: Timestamp`

---

### 4.7 `user_roles`

(If not relying solely on Auth custom claims.)

- `userId`
- `role: 'admin' | 'dev'`
- `team?: string`
- `createdAt`

---

## 5. API Endpoints (REST Outline)

Base path: `/api/admin/*` for admin/dev endpoints, `/api/leads/*` for public lead ingestion.

### 5.1 Lead Ingestion (Public/Semi-Public)

**Critical for ROI & CTA Integration:**

- `POST /api/leads/ingest`
  - **Purpose:** Single entry point for all marketing lead sources.
  - **Body:**
    ```json
    {
      "source": "roi_calculator" | "contact_form" | "quotation" | "exit_intent",
      "service": "smart-assistant" | "system-integration" | "web-mobile" | "digital-transformation",
      "email": "string",
      "name": "string?",
      "company": "string?",
      "phone": "string?",
      "meta": {
        "roiSnapshot": { "inputs": {}, "results": {} },
        "quotationId": "string?",
        "contactFormId": "string?",
        "message": "string?",
        "leadMagnet": "string?"
      },
      "metadata": {
        "userAgent": "string?",
        "referrerUrl": "string?",
        "utmParams": {}
      }
    }
    ```
  - **Behavior:**
    - Deduplicate by email (upsert contact).
    - Update `lastContactedAt`, merge `meta.originalLeadIds`.
    - Create `contact_activity` entry.
    - Trigger default follow-up sequence based on source.
    - Return `{ success: true, contactId, isNew: boolean }`.

- `POST /api/leads/capture-roi`
  - **Purpose:** Specialized endpoint for ROI calculator leads (backward compatibility).
  - Internally calls `/ingest` with `source: 'roi_calculator'`.

- `POST /api/leads/capture-exit-intent`
  - **Purpose:** Specialized endpoint for exit-intent popups.
  - Internally calls `/ingest` with `source: 'exit_intent'`.

---

### 5.2 Auth / RBAC

- `GET /api/me`
  - Returns user profile and role.
- Middleware:
  - `requireRole('admin')`, `requireRole('dev')` used in APIs.

---

### 5.3 Contacts

- `GET /api/contacts`
  - Query: `q`, `status`, `ownerUserId`, `source`, `tag`, `service`, `page`, `pageSize`.
- `POST /api/contacts`
- `GET /api/contacts/:id`
- `PUT /api/contacts/:id`
- `DELETE /api/contacts/:id` (admin only).
- `GET /api/contacts/:id/activities`
- `POST /api/contacts/:id/activities`
- `GET /api/my-contacts`

---

### 5.3 Email Templates & Sequences

- `GET /api/email-templates`
- `POST /api/email-templates`
- `GET /api/email-templates/:id`
- `PUT /api/email-templates/:id`
- `DELETE /api/email-templates/:id`

- `GET /api/email-sequences`
- `POST /api/email-sequences`
- `GET /api/email-sequences/:id`
- `PUT /api/email-sequences/:id`
- `DELETE /api/email-sequences/:id`

---

### 5.4 Email Sending & Follow-Ups

- `POST /api/contacts/:id/send-email`
  - Body: `templateId`, `sendNow?`, `scheduledAt?`, `extraVariables?`.

- `POST /api/followups/schedule`
  - Body: `contactId`, `sequenceId`.

- `GET /api/email-jobs`
- `GET /api/email-jobs/:id`

---

### 5.5 Resend Webhook

- `POST /api/webhooks/resend`
  - Validates signature.
  - Maps provider events to `email_jobs` and `email_events`.

---

### 5.6 Developer-Focused Views

- `GET /api/dev/overview`
  - Aggregate stats for the current dev.

---

## 6. Admin Panel UI Structure

### 6.1 Navigation

- `AdminLayout`
  - Sidebar:
    - Contacts
    - My Contacts
    - Email Templates
    - Sequences
    - Activity/Queue (optional)
  - Topbar:
    - Search box, user avatar, role badge.

---

### 6.2 Contacts List View

- `ContactsPage`
  - `ContactFilters`
  - `ContactSearchBar`
  - `ContactTable`
  - `PaginationControls`

---

### 6.3 Contact Detail View

- `ContactDetailPage` / drawer variant
  - Header with summary and quick actions.
  - Tabs:
    - Activity
    - Details
    - Follow-Up

---

### 6.4 Templates & Sequences UI

- `EmailTemplatesPage` + `EmailTemplateEditor`.
- `SequencesPage` + `SequenceEditor`.

---

### 6.5 Developer View

- `MyContactsPage`
  - Focus on contacts owned by current user.
  - Highlight items requiring follow-up today.

---

## 7. Step-by-Step Implementation Phases & Tasks

### Phase 0 – Lead Ingestion & ROI/CTA Integration (CRITICAL FIRST)

**Goal:** Stop losing leads immediately by implementing the ingestion layer.

**Tasks:**

1. **Backend: Implement Lead Ingestion API**
   - [ ] Create `functions/src/leads/ingestLead.ts`
   - [ ] Implement `POST /api/leads/ingest` with:
     - Zod validation for all lead sources
     - Email deduplication logic (query by email, upsert)
     - Contact creation/update with source tracking
     - Activity logging
     - Basic rate limiting (10 leads/min per IP)
   - [ ] Add sanitization for all text inputs
   - [ ] Return `contactId` and `isNew` flag

2. **Backend: Implement Specialized Lead Endpoints**
   - [ ] Create `POST /api/leads/capture-roi` (wraps `/ingest`)
   - [ ] Create `POST /api/leads/capture-exit-intent` (wraps `/ingest`)
   - [ ] Update `submitQuotationRequest` to call `/ingest` after storing quotation
   - [ ] Implement `POST /api/leads/capture-contact` for contact form

3. **Frontend: Wire ROI Calculators**
   - [ ] Update `SmartBusinessAssistant.tsx`:
     - Replace console.log in `onEmailCapture` with API call to `/api/leads/capture-roi`
     - Include `calculatorData` in payload
   - [ ] Update `SystemIntegration.tsx` (same as above)
   - [ ] Update `IntelligentApplications.tsx` (same as above)
   - [ ] Update `gated-roi-calculator.tsx` default path to use `/api/leads/capture-roi`
   - [ ] Update `unified-roi-calculator.tsx` default path

4. **Frontend: Wire Exit-Intent Popups**
   - [ ] Update `useServiceExitIntent.ts`:
     - Replace default fetch to `/api/capture-lead` with `/api/leads/capture-exit-intent`
   - [ ] Update all service pages to remove custom `onEmailCapture` or make them call the API
   - [ ] Ensure localStorage still works for prefill but also persist server-side

5. **Frontend: Wire Contact Form**
   - [ ] Update `contactService.ts`:
     - Change `submitContact` to call `/api/leads/capture-contact`
     - Ensure all form fields map to ingestion schema
   - [ ] Update `ContactForm.tsx` to handle new response format

6. **Backend: Update Quotation System**
   - [ ] In `submitQuotation.ts`, after successful Firestore write:
     - Call internal `ingestLead` function with:
       - `source: 'quotation'`
       - Extract email, name, company from `businessInfo`
       - Include `quotationId` in `meta.originalLeadIds`

7. **Testing & Validation**
   - [ ] Test each lead source creates a contact in Firestore
   - [ ] Verify deduplication works (same email = update, not duplicate)
   - [ ] Confirm activities are logged for each capture
   - [ ] Check rate limiting blocks spam

**Success Criteria:**
- All 4 lead sources (ROI, Contact, Quotation, Exit-Intent) create/update contacts in `contacts` collection
- Zero console.log-only captures remain
- Admin can query all leads via Firestore console

**Timeline:** 2–3 days

---

### Phase 1 – Foundations & Analytics

**Goal:** Set up data models and add missing analytics.

**Tasks:**

1. **Data Models**
   - [ ] Define TypeScript interfaces for all entities
   - [ ] Create shared types package if needed

2. **Backend Structure**
   - [ ] Create `functions/src/contactManagement/` module
   - [ ] Configure environment variables for Resend
   - [ ] Add Firestore security rules skeleton

3. **Analytics Integration**
   - [ ] Add analytics to quotation modal:
     - `quotation_modal_opened`
     - `quotation_step_completed`
     - `quotation_submitted`
     - `quotation_abandoned`
   - [ ] Standardize ROI analytics to use `useMarketingAnalytics`
   - [ ] Add funnel tracking for lead ingestion

**Timeline:** 1–1.5 days

---

### Phase 2 – Core Contacts API

- Implement Firestore repositories for `contacts`.
- Implement REST endpoints for contacts CRUD and search.
- Add RBAC middleware (admin/dev roles).
- Write unit tests for contacts repo and endpoints.

### Phase 3 – Admin UI (Contacts Management)

- Implement `AdminLayout` with nav.
- Build `ContactsPage` with filters, search, table, pagination.
- Implement `ContactDetailPage` with editable fields.
- Implement `MyContactsPage` filtering by current user.

### Phase 4 – Communication History (Activities)

- Implement repositories and endpoints for `contact_activities`.
- Add activity timeline UI to contact detail.
- Implement form to add notes, calls, and meetings.

### Phase 5 – Email Templates & Resend Integration

- Integrate Resend client and wrapper.
- Implement `email_templates` CRUD API.
- Implement `POST /contacts/:id/send-email` using templates.
- Build Email Templates admin UI.
- Add "Send Email" modal to contact detail.

### Phase 6 – Follow-Up Sequences & Scheduler

- Implement `email_sequences` CRUD API.
- Implement follow-up scheduling endpoint.
- Implement scheduled function to process `email_jobs`.
- Add Follow-Up tab to contact detail showing sequences and upcoming emails.

### Phase 7 – Webhooks & Status Tracking

- Implement Resend webhook endpoint with signature verification.
- Map events to `email_jobs` and `email_events`.
- Update contact activity and UI with send/open/bounce statuses.

### Phase 8 – Security, Compliance & Observability

**Tasks:**

- [ ] Harden Firestore rules to enforce role-based access
- [ ] Add Zod validation and sanitization in all APIs
- [ ] Implement rate limits on email sending (per-user quotas)
- [ ] Add structured logging and error alerting
- [ ] Document data retention and email consent handling
- [ ] Add GDPR-compliant data export/delete endpoints
- [ ] Implement audit logging for sensitive actions

**Timeline:** 1.5–2 days

---

## 8. Timeline Estimates (Revised with Phase 0)

Assuming one senior engineer ~70–80% allocation:

- **Phase 0 (Lead Ingestion):** 2–3 days ⚠️ **START HERE**
- Phase 1 (Foundations): 1–1.5 days
- Phase 2 (Contacts API): 1.5–2 days
- Phase 3 (Admin UI): 2–3 days
- Phase 4 (Activities): 1–1.5 days
- Phase 5 (Templates & Sending): 2–3 days
- Phase 6 (Sequences & Scheduler): 2–3 days
- Phase 7 (Webhooks): 1.5–2 days
- Phase 8 (Security): 1.5–2 days

**Total:** ~15–21 working days

**Critical Path:** Phase 0 must complete before significant value is realized. Phases 1–4 can overlap partially.

---

## 9. Resources & Success Criteria

### 9.1 Resources

- 1 senior backend engineer.
- 1 frontend engineer for admin UI.
- Optionally QA support.
- Resend account and verified sending domain.

### 9.2 Success Criteria

- All leads have a corresponding `contact` record with owner and status.
- Admin panel supports search, filters, and detail views.
- Emails can be sent manually and via sequences; statuses (sent/opened/bounced) visible.
- Role-based access enforced; unauthorized actions blocked.
- System is observable via logs/metrics and passes agreed test suite.

---

## 10. Integration Checklist: Connecting ROI & CTA to Contact System

### 10.1 ROI Calculator Integration

- [ ] **Backend:** `/api/leads/capture-roi` endpoint implemented
- [ ] **Frontend:** All 3 service pages call API instead of console.log
- [ ] **Frontend:** Default path in `gated-roi-calculator.tsx` uses API
- [ ] **Data:** ROI snapshot (inputs + results) stored in `contact.meta.roiSnapshot`
- [ ] **Analytics:** ROI events include `contactId` for attribution
- [ ] **Follow-up:** Auto-trigger "ROI Calculator Follow-up" sequence on capture

### 10.2 Contact Form Integration

- [ ] **Backend:** `/api/leads/capture-contact` endpoint implemented
- [ ] **Frontend:** `contactService.ts` calls new endpoint
- [ ] **Data:** All form fields map to contact schema
- [ ] **Analytics:** Form submission includes `contactId`
- [ ] **Follow-up:** Auto-trigger "Contact Inquiry Follow-up" sequence

### 10.3 Quotation System Integration

- [ ] **Backend:** `submitQuotation.ts` calls `ingestLead` after Firestore write
- [ ] **Data:** `quotationId` stored in `contact.meta.originalLeadIds.quotationId`
- [ ] **Analytics:** Quotation events include `contactId`
- [ ] **Follow-up:** Auto-trigger "Quotation Follow-up" sequence
- [ ] **Activity:** Quotation submission creates activity entry

### 10.4 Exit-Intent Integration

- [ ] **Backend:** `/api/leads/capture-exit-intent` endpoint implemented
- [ ] **Frontend:** `useServiceExitIntent.ts` calls API
- [ ] **Frontend:** All service pages use default or custom API call
- [ ] **Data:** Exit-intent leads stored with `source: 'exit_intent'`
- [ ] **Prefill:** Quotation modal still reads from localStorage for UX
- [ ] **Follow-up:** Auto-trigger "Exit-Intent Nurture" sequence

### 10.5 Cross-System Features

- [ ] **Deduplication:** Same email across sources updates single contact
- [ ] **Source Tracking:** `contact.source` reflects first touch; activities show all touches
- [ ] **Lead Scoring:** (Future) Score based on engagement (ROI calc + quotation = high intent)
- [ ] **Unified Timeline:** Admin can see: ROI calc → exit-intent → quotation → contact form in one view

---

## 11. Risks & Mitigations

### Critical Risks

- **Risk:** Phase 0 not prioritized → leads continue to be lost
  - **Mitigation:** Make Phase 0 mandatory before any other work

- **Risk:** Deduplication logic fails → duplicate contacts
  - **Mitigation:** Unique index on email, thorough testing, admin merge tool

- **Risk:** Rate limiting too aggressive → legitimate leads blocked
  - **Mitigation:** Start with generous limits, monitor, adjust based on data

### Standard Risks

- **RBAC mistakes** → Write RBAC tests, review rules
- **Email deliverability issues** → Use proper domain setup (SPF/DKIM), quotas, warm-up
- **Webhook inconsistencies** → Ensure idempotent processing and logging
- **Scalability** → Use indexed queries, pagination, and virtualized tables

---

## 12. Success Metrics

### Phase 0 Success (Lead Capture)

- **Zero console-only captures:** All leads persist to Firestore
- **100% capture rate:** Every ROI calc, contact form, quotation, exit-intent creates a contact
- **Deduplication works:** Same email = 1 contact with multiple activities

### Phase 3 Success (Admin UI)

- **Visibility:** Admin can see all leads in one interface
- **Filtering works:** Can filter by source, service, status, date range
- **Search works:** Can find contact by name, email, company

### Phase 6 Success (Automation)

- **Sequences run:** Follow-up emails sent automatically based on schedule
- **Status tracking:** Email open/bounce rates visible per sequence
- **Conversion tracking:** Can measure ROI calc → quotation → closed won

### Overall Success (90 days post-launch)

- **Lead volume:** X% increase in captured leads (vs. previous console-only)
- **Response time:** Average time to first follow-up < 24 hours
- **Conversion rate:** X% of leads progress to qualified/closed won
- **Team adoption:** 100% of team uses admin panel for lead management
