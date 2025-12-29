# Staging Deployment Plan: Watsonx Caching System

**Target Environment:** Staging (Google Cloud Run)
**Prerequisites:** Legal & Security Approvals Received
**Rollback Time:** < 5 minutes

---

## ✅ Pre-Deployment Checklist

- [ ] **Approvals:** Legal and Security sign-off received.
- [ ] **Configuration:** `deployment/production_config.yaml` reviewed and environment variables set.
- [ ] **Database:** Firestore indexes created (`scripts/create_firestore_indexes.sh`).
- [ ] **Secrets:** `WATSONX_API_KEY` and `ADMIN_API_KEY` verified in Secret Manager.
- [ ] **Backup:** Current staging database snapshot taken.

---

## 🚀 Deployment Steps

### 1. Deploy Server-Side Cache
```bash
# Deploy to Cloud Run using the production config
gcloud run services replace deployment/production_config.yaml --region us-central1
```

### 2. Verify Deployment Health
```bash
# Check service status
gcloud run services describe marketing-agent-service --region us-central1 --format="value(status.url)"

# Verify health endpoint
curl https://[STAGING_URL]/health
```

### 3. Run Integration Tests (Live)
```bash
# Run the integration test suite against the staging URL
export BASE_URL="https://[STAGING_URL]"
python -m pytest functions/tests/test_cache_integration.py
```

### 4. Warm the Cache
```bash
# Pre-populate cache with top 100 FAQs
python functions/scripts/warm_cache.py --env staging
```

---

## 🧪 Validation & Acceptance Criteria

1.  **Cache Hit:** Repeat the same query twice. Second response time should be < 500ms.
2.  **PII Check:** Send a query with a fake credit card number. Verify it is **NOT** cached.
3.  **Persistence:** Verify data appears in Firestore "responses" collection.
4.  **Logs:** Check Cloud Logging for "Cache HIT" and "Cache MISS" entries.

---

## 🔄 Rollback Procedure (Emergency)

If critical errors or PII leaks are detected:

1.  **Revert to Previous Revision:**
    ```bash
    gcloud run services update-traffic marketing-agent-service --to-latest=false --to-revisions=[PREVIOUS_REVISION]=100
    ```

2.  **Disable Caching (Config Switch):**
    ```bash
    gcloud run services update marketing-agent-service --set-env-vars CACHE_ENABLED=false
    ```

3.  **Flush Cache (If Corrupted):**
    ```bash
    curl -X DELETE https://[STAGING_URL]/api/admin/cache -H "Authorization: Bearer [ADMIN_KEY]"
    ```
