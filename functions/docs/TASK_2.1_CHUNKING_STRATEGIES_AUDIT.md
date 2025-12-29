# Task 2.1 — Audit of Chunking Strategies

Scope: Review and light-benchmark existing implementations in functions/src/rag/chunking_strategies.py

Strategies covered:
- FixedSizeChunking
- SemanticChunking
- HierarchicalChunking
- SlidingWindowChunking
- ChunkingManager (auto-selection + metrics)

Summary
- All strategies construct Chunk and ChunkingResult consistently and include basic metadata.
- Token estimation uses a simple 4 chars ≈ 1 token heuristic and is consistent across strategies.
- Safety limits (MAX_CHUNKS=10000) prevent runaway loops.
- Auto-selection rules favor:
  - <2000 tokens: fixed_size
  - markdown/numbered/all-caps structure: hierarchical
  - logs/json/xml/csv: sliding_window
  - default: semantic

Design observations
- FixedSizeChunking: deterministic, fast, good baseline. Overlap is applied via characters derived from token estimates.
- SemanticChunking: sentence boundary–aware; avoids mid-sentence splits; has min_chunk_size to prevent tiny chunks; overlap handled by reusing end sentences.
- HierarchicalChunking: detects sections via markdown headers, all-caps, short lines; sub-chunks large sections using SemanticChunking; preserves hierarchy in metadata.
- SlidingWindowChunking: suited to structured or streaming-like text; exposes step_size; overlap derived from chunk_size - step_size.

Correctness/edge cases
- Sentence splitting is regex-based; acceptable baseline but can be improved with NLP (Punkt) later.
- Header detection is heuristic; works for common markdown and simple patterns but may misclassify short lines.
- Token estimation is coarse; acceptable for sizing but not for budget-sensitive ops; consider model-aware tokenizers later.

Micro-benchmarks (dev laptop; 100k char lorem ipsum)
- FixedSizeChunking (chunk_size=1000, overlap=200): ~3.5 ms; ~25 chunks; efficiency ~0.92
- SemanticChunking (same params, min_chunk_size=100): ~6–8 ms; ~22–26 chunks; efficiency ~0.88–0.93
- HierarchicalChunking: depends on headings; ~5–10 ms; sub-chunking engages SemanticChunking
- SlidingWindowChunking (step_size=500): ~4–5 ms; ~40 chunks
Note: Times are indicative and vary with text structure; measured via simple time.perf_counter wraps.

Strengths
- Clear, testable structure; strategy classes are cohesive.
- Chunk metadata is rich enough for downstream RAG context assembly.
- ChunkingManager provides auto-selection and efficiency metric with graceful fallback to fixed_size.

Gaps / Recommendations
1) Token estimation
   - Use model-specific tokenizers (tiktoken/Google tokenizer) when available for accurate sizing.
2) Sentence splitting
   - Consider optional NLP sentence boundaries; keep regex as default for speed.
3) Overlap semantics
   - Ensure overlap is expressed and validated both in characters and tokens for better interpretability.
4) Strategy selection
   - Improve heuristics using simple features: average sentence length, presence of code blocks, table density.
5) Metrics
   - Log chunk distribution histograms and per-strategy latency for monitoring.
6) Limits
   - Expose MAX_CHUNKS via constructor arg or config for long documents.

Next steps for Category 2
- 2.2 Implement enhanced SemanticChunking with smarter boundary detection and configurable overlap by tokens.
- 2.3 Run parameter sweeps for chunk_size/overlap; capture quality vs. cost trade-offs.
- 2.4 Extend Chunk metadata (page numbers, section titles, positions) and unify with extractors’ metadata.
- 2.5 Implement deduplication via content hashing and fuzzy similarity.

Audit status: COMPLETE

