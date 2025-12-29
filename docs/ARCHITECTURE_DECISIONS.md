# Architecture Decision Records (ADRs)

## ADR-001: Relevance Score UI Placement

- Status: Accepted
- Date: 2025-10-05

Context:
- The completion summary referenced a standalone component `RelevanceScore.tsx`.
- Actual implementation integrates relevance scoring directly into `RAGContextPreview.tsx`.

Decision:
- Keep relevance score logic (color, label, percent bar) inside `RAGContextPreview.tsx` for cohesion with chunk rendering and metrics.

Consequences:
- No separate `RelevanceScore.tsx` file will be created.
- Documentation updated to reflect integrated implementation.
- Future refactor may extract to a child component if reuse emerges.

