# Embedding Service Audit (Task 3.1)

Date: 2025-10-03
Status: COMPLETE

Scope
- Reviewed functions/src/rag/embedding_service.py implementation
- Verified model metadata and default configuration (Google text-embedding-004, 768 dims)
- Exercised core APIs with unit tests using mocks (no external calls)

Key Findings
- Providers supported: Google (text-embedding-004) and OpenAI via OpenRouter (text-embedding-3-*).
- Caching supported via Redis (optional). If Redis unavailable, gracefully disabled.
- Batch embeddings implemented with per-text caching reuse and error collection.
- Retries in provider calls with exponential backoff present.

Improvements Implemented
- Added simple rate limiting (requests/sec) with async sleep.
- Added embedding validation (dimension + non-zero checks).
- Added cost estimation helpers using per-model pricing.
- Integrated rate limiting into single and batch embedding flows.

Test Summary (unit)
- tests/test_embedding_service_basics.py — basics and validation short-circuit.
- tests/test_embedding_service_advanced.py — rate limiting, batch mixed cache, validation, cost.

Recommendations & Next Steps
- Configure EMBEDDING_RATE_RPS via env per environment.
- Add structured logging for cost and latency metrics.
- Optionally add per-user quotas via higher-level manager.

