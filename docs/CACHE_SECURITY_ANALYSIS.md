# Security Analysis: Intelligent Caching System

**Date:** 2025-11-29
**System:** molē AI Agent (Caching Layer)
**Classification:** Internal Confidential

---

## 1. Executive Summary

This document details the security architecture, threat model, and risk mitigations for the new intelligent caching system deployed in the molē AI agent. The system introduces a dual-layer cache (Browser + Server) to optimize performance.

**Key Security Controls:**
*   **Automated PII Detection:** Real-time scanning of all queries and responses.
*   **No-Cache Policy for PII:** Data containing sensitive information is never cached.
*   **Data Isolation:** Strict IAM controls on server-side storage.
*   **TTL Enforcement:** Automatic expiration of data after 30 days.

---

## 2. Architecture & Data Flow

### 2.1 Browser Cache (Client-Side)
*   **Storage:** IndexedDB (Local to user's device).
*   **Scope:** Private to the specific user/browser instance.
*   **Encryption:** Relies on device-level encryption.
*   **Risk:** Low (Data never leaves user's control).

### 2.2 Server Cache (Server-Side)
*   **Storage:** Google Cloud Firestore (`responses` collection).
*   **Scope:** Shared across users (for common FAQs).
*   **Encryption:** AES-256 at rest (Google managed), TLS 1.3 in transit.
*   **Risk:** Medium (Shared data store).

---

## 3. Threat Model

| Threat | Risk Level | Mitigation Strategy | Status |
| :--- | :--- | :--- | :--- |
| **PII Leakage in Cache** | High | **1. Pre-computation Check:** Regex + NLP scan before caching.<br>**2. Redaction:** Masking of detected entities.<br>**3. User-Specific Keys:** Personal queries are not shared. | ✅ Implemented |
| **Stale/Inaccurate Data** | Medium | **1. TTL:** Hard limit of 30 days.<br>**2. Versioning:** Cache keys include model version.<br>**3. Admin Flush:** API to clear cache instantly. | ✅ Implemented |
| **Cache Poisoning** | High | **1. Input Validation:** Strict schema validation.<br>**2. Write Access:** Only trusted backend services can write.<br>**3. Rate Limiting:** Prevent flood attacks. | ✅ Implemented |
| **Unauthorized Access** | High | **1. IAM Roles:** Least privilege access.<br>**2. API Auth:** JWT validation for all read/write ops. | ✅ Implemented |

---

## 4. PII Protection Implementation

We utilize a multi-layered approach to prevent PII from entering the cache.

### 4.1 Detection Logic (`pii_detector.py`)
We use Microsoft Presidio combined with custom regex patterns to detect:
*   **Financial:** Credit card numbers, IBANs, Crypto addresses.
*   **Personal:** Email addresses, Phone numbers, SSN/IDs.
*   **Names:** Person names (via NLP NER).

### 4.2 Handling Policy
*   **If PII Detected in Query:** -> **SKIP CACHE** (Pass directly to LLM, do not store).
*   **If PII Detected in Response:** -> **DO NOT CACHE** (Send to user, do not store).

---

## 5. Compliance & Auditing

### 5.1 GDPR/CCPA
*   **Right to Access:** Users can request a dump of their cached interactions via `GET /api/user/cached-data`.
*   **Right to Delete:** Users can wipe their history via `DELETE /api/user/cached-data`.

### 5.2 Audit Logs
All cache operations (HIT, MISS, WRITE, DELETE) are logged to Google Cloud Logging with the following metadata:
*   Timestamp
*   User ID (Hash)
*   Operation Type
*   Cache Key Hash (Never raw query)
*   Latency

---

## 6. Conclusion

The caching system has been designed with "Security by Design" principles. The primary risk of PII leakage is mitigated through aggressive automated detection and a "fail-safe" policy where any doubt results in non-caching.
