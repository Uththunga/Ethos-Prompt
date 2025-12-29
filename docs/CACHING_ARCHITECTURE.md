# Technical Architecture: Intelligent Caching System

**Date:** 2025-11-29
**System:** molē AI Agent
**Components:** Frontend (React), Backend (Python/FastAPI), Database (Firestore)

---

## 1. System Overview

The Intelligent Caching System is a hybrid, dual-layer caching solution designed to minimize latency and reduce LLM inference costs. It consists of:
1.  **L1: Browser Cache (Client-Side):** Instant retrieval for individual user history.
2.  **L2: Server Cache (Server-Side):** Shared cache for common queries across all users.

---

## 2. Component Design

### 2.1 Frontend Layer (`useBrowserCache.ts`)
*   **Technology:** IndexedDB (via `idb` library).
*   **Key Features:**
    *   **LRU Eviction:** Automatically removes least recently used items when limit (50MB) is reached.
    *   **Auto-Cleaning:** Background process runs every 30 minutes to clean expired/stale entries.
    *   **Smart Fallback:** If cache miss -> Call API -> If API success -> Save to Cache.

### 2.2 Backend Layer (`cache_manager.py`)
*   **Technology:** Google Cloud Firestore.
*   **Collection:** `responses`
*   **Key Features:**
    *   **Semantic Hashing:** Cache keys are generated from a normalized version of the query + model version.
    *   **PII Guard:** Integrated with `PIIDetector` to prevent caching sensitive data.
    *   **Admin API:** Endpoints to flush/manage cache (`DELETE /api/admin/cache`).

---

## 3. Data Flow

1.  **User Query:** User types "What is EthosPrompt?".
2.  **L1 Check:** Frontend checks IndexedDB.
    *   *Hit:* Return JSON immediately (Latency: < 50ms).
    *   *Miss:* Send POST request to `/api/ai/marketing-chat/stream`.
3.  **PII Scan:** Backend scans query for PII.
    *   *Found:* Skip L2 cache, call LLM directly.
    *   *Clean:* Proceed to L2 check.
4.  **L2 Check:** Backend checks Firestore.
    *   *Hit:* Return stored response (Latency: ~300ms).
    *   *Miss:* Call Watsonx Granite Model.
5.  **Response Generation:** LLM generates response.
6.  **Caching:**
    *   Backend saves to Firestore (if no PII in response).
    *   Frontend saves to IndexedDB (on stream completion).

---

## 4. Configuration

### 4.1 Frontend Constants
```typescript
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE_MB = 50;
const MAX_CACHE_ENTRIES = 500;
```

### 4.2 Backend Environment Variables
```yaml
CACHE_ENABLED: true
CACHE_TTL_DAYS: 30
FIRESTORE_COLLECTION: "responses"
```

---

## 5. Monitoring & Metrics

We track the following metrics in Google Cloud Monitoring:
*   `cache_hit_rate`: Percentage of queries served from L2 cache.
*   `cache_latency`: Time to retrieve from Firestore.
*   `pii_detection_count`: Number of queries rejected due to PII.
