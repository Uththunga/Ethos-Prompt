# Task 2.1 — Audit Current RAG Implementation (Completed)

Status: COMPLETE
Owner: Backend + ML
Date: [auto]

## Summary
A comprehensive audit of functions/src/rag shows a fairly complete RAG stack (document extraction, chunking, embeddings, vector store, semantic/hybrid search, context retrieval). The backend entry points in functions/main.py are partially out-of-sync with the current RAG module interfaces.

## Key Findings

1) Module/Interface Mismatches in functions/main.py
- Imports reference non-existent modules/classes:
  - src.rag.text_chunker.TextChunker (should use chunking_strategies.ChunkingManager or chunking_manager)
  - src.rag.embedding_generator.EmbeddingGenerator (should use embedding_service.EmbeddingService or global embedding_service)
  - FAISSVectorStore (current vector store integrates Pinecone via src.rag.vector_store.VectorStore/vector_store)
- Context retrieval call signature mismatch:
  - main.py calls ContextRetriever.retrieve_context(user_id, query, document_ids)
  - Current implementation expects a RetrievalContext dataclass instance

2) RAG Modules Present
- Document extraction: document_extractors.py (PDF, DOCX, TXT, MD) with conditional deps
- Chunking: chunking_strategies.py with Fixed/Semantic/Hierarchical/Sliding + manager
- Embeddings: embedding_service.py (providers: Google via REST; OpenAI via OpenRouter SDK); optional Redis cache
- Vector store: vector_store.py (Pinecone) with conditional import
- Search: semantic_search.py, bm25_search_engine.py, hybrid_search_engine.py
- Retrieval: context_retriever.py (uses semantic/hybrid engines, reranking & filtering)

3) Dependencies Not Declared in functions/requirements.txt
- Required/used by modules (conditional in code but needed for full functionality):
  - PyPDF2 (PDF)
  - python-docx (DOCX)
  - markdown, beautifulsoup4 (MD → text)
  - chardet (encoding)
  - nltk, pyspellchecker (BM25 preprocess, spelling)
  - pinecone-client (vector DB)
  - redis (optional caching)
  - openai (only if using OpenRouter SDK for embeddings provider='openai')

Current requirements.txt contains only: firebase-functions, firebase-admin, aiohttp, python-dotenv, pytest, pytest-asyncio.

4) Provider/Key Strategy
- Embeddings (embedding_service): default provider='google' uses Google Generative Language API via requests and GOOGLE_API_KEY; OpenRouter/OpenAI path requires the openai package and uses OPENROUTER_API_KEY.
- Vector store defaults to Pinecone; requires PINECONE_API_KEY and pinecone-client.

## Recommendations

A) Align main.py with RAG modules
- Replace outdated imports with current modules
- Switch per-step processing to the existing DocumentProcessingPipeline where possible
- Update context retrieval to build RetrievalContext and call context_retriever.retrieve_context(retrieval_context)

B) Confirm provider choices and keys (decision required)
- Embeddings provider:
  - Option 1 (recommended short-term): Google embeddings via GOOGLE_API_KEY (no new SDK; current code uses requests)
  - Option 2: OpenAI embeddings via OpenRouter (requires openai package)
- Vector DB:
  - Option 1: Pinecone (requires pinecone-client and API key)
  - Option 2: Defer to Firestore-only retrieval (reduced semantic search quality)

C) Add required dependencies via package manager (needs approval)
- pip install proposals:
  - PyPDF2 python-docx markdown beautifulsoup4 chardet
  - nltk pyspellchecker
  - pinecone-client
  - redis (optional)
  - openai (only if choosing OpenAI/OpenRouter for embeddings)

D) Tests & Validation
- Add unit tests for chunking_manager, embedding_service (mock HTTP), vector_store (mock Pinecone), and context_retriever
- Add integration test for end-to-end RAG flow using emulated Firestore + mock vector store

## Minimal Code Changes Proposed (no runtime side-effects until invoked)
- Update functions/main.py imports and context retrieval call signature
- Prefer using DocumentProcessingPipeline for document ingestion trigger to reduce duplication and drift

## Next Steps (awaiting approval)
1. Confirm embeddings provider (Google vs OpenAI/OpenRouter) and vector DB (Pinecone vs defer)
2. Approve dependency installation; I will run the exact pip commands in functions/ per policy
3. Implement main.py refactor to align with RAG modules (small, self-contained change)
4. Create minimal tests for newly wired paths


