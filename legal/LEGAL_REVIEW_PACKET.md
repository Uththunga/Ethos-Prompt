# Legal Review Packet: Watsonx Caching Implementation

**Date:** 2025-11-29
**Project:** Watsonx Performance Optimization (Intelligent Caching)
**Priority:** High (Blocking Production Deployment)

---

## 📧 Draft Email to Legal Team

**Subject:** Urgent Legal Review: Terms & Privacy Updates for AI Caching System

**Body:**

Dear Legal Team,

We are preparing to launch a new intelligent caching system for our AI marketing agent (molē) to significantly improve performance and reduce costs. This system involves caching user queries and AI responses.

To ensure compliance with GDPR, CCPA, and data protection standards, we have prepared draft updates for our Terms of Service and Privacy Policy.

**We request your review and approval of the following documents:**

1.  **Terms of Service Updates:**
    *   **Key Changes:** Added clauses defining "Cached Data" ownership, user license for caching, and limitations of liability for cached content.
    *   **Location:** `legal/TERMS_OF_SERVICE_UPDATES.md`

2.  **Privacy Policy Updates:**
    *   **Key Changes:** Added "Cache Data" as a collected data type, defined retention periods (30 days), and outlined user rights (access/deletion) specifically for cached data.
    *   **Location:** `legal/PRIVACY_POLICY_UPDATES.md`

**Technical Context for Review:**
*   **PII Protection:** We have implemented automated PII detection. Responses containing PII are *not* cached.
*   **Retention:** Cached data is automatically deleted after 30 days.
*   **User Rights:** Users can request to view or delete their cached data via new API endpoints we have implemented.
*   **Security:** Data is stored in Firestore with strict IAM controls.

Please let us know if you require any further technical details or changes to these drafts. We are aiming to deploy to production by [Target Date, e.g., next Friday].

Best regards,

[Your Name/Team Name]

---

## 📄 Document Summaries

### 1. Terms of Service Updates (`legal/TERMS_OF_SERVICE_UPDATES.md`)
*   **Section 3.4 (New):** Explicitly grants us the right to cache anonymized query/response pairs for performance optimization.
*   **Section 5.2 (Update):** Clarifies that while users own their input, we retain rights to the aggregated, anonymized cache data.
*   **Disclaimer:** Adds specific disclaimers regarding the accuracy of cached AI responses (which may be up to 30 days old).

### 2. Privacy Policy Updates (`legal/PRIVACY_POLICY_UPDATES.md`)
*   **Data Collection:** Adds "Interaction History & Cache Data" to the list of collected information.
*   **Purpose:** Specifies "System Performance & Optimization" as a legal basis for processing.
*   **Storage:** Discloses use of Google Cloud Firestore and local browser storage (IndexedDB).
*   **GDPR/CCPA:** Explicitly addresses rights to delete cached interaction history.

---

## 🔗 File Locations
*   [Terms of Service Updates](file:///d:/react/React-App-000740/EthosPrompt/legal/TERMS_OF_SERVICE_UPDATES.md)
*   [Privacy Policy Updates](file:///d:/react/React-App-000740/EthosPrompt/legal/PRIVACY_POLICY_UPDATES.md)
