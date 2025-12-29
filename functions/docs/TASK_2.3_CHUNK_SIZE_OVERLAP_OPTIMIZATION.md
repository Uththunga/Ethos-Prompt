# Task 2.3 — Chunk Size and Overlap Optimization

Objective
- Provide optimized defaults for chunk_size and overlap, balancing retrieval quality and storage cost. Implement a simple heuristic and document guidance.

Implementation
- Added ChunkingManager.suggest_defaults(text, metadata) returning a dict {chunk_size, overlap} using:
  - text length (approx tokens via 4 chars/token)
  - file_type hint (code/log/json/xml -> larger overlap, moderate chunk size)
- Does not require external deps; fast and deterministic.

Suggested defaults
- Short docs (< ~800 tokens): chunk_size=400, overlap=80
- Medium docs (~800–6000 tokens): chunk_size=1000, overlap=200
- Very long docs (> ~6000 tokens): chunk_size=1200, overlap=200
- Code/log/json/xml: chunk_size=800, overlap=200 (more overlap to preserve context windows)

Rationale
- Smaller chunks for short docs prevent oversizing and wasted tokens.
- Medium defaults (1000/200) work well for prose and mixed docs.
- Long docs benefit from slightly larger chunks to reduce total chunk count without losing context.
- Code-like content needs higher overlap to capture cross-line semantics and references.

How to use
```python
from src.rag.chunking_strategies import ChunkingManager
mgr = ChunkingManager()
params = mgr.suggest_defaults(text, {"file_type": "md"})
result = mgr.chunk_document(text, strategy=None, metadata={"requested_strategy": None},
                            chunk_size=params["chunk_size"], overlap=params["overlap"]) 
```

Notes
- Future work: integrate model-aware tokenizers; learn parameters from retrieval quality metrics.
- These defaults are conservative and can be tuned per collection.

