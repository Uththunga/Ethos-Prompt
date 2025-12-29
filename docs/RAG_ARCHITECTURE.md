# RAG Architecture Documentation

**Project**: RAG Prompt Library  
**Version**: 1.0  
**Last Updated**: 2025-10-02  
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Data Flow](#data-flow)
5. [Configuration](#configuration)
6. [Performance](#performance)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## Overview

The RAG (Retrieval-Augmented Generation) pipeline enhances AI prompt execution by retrieving relevant context from user-uploaded documents. This enables the AI to provide more accurate, contextual, and grounded responses.

### Key Features

- **Multi-format Support**: PDF, DOCX, TXT, MD
- **Intelligent Chunking**: Multiple strategies (fixed, semantic, hierarchical, sliding)
- **Google Cloud Native**: 100% within Google Cloud ecosystem
- **Hybrid Search**: Semantic (vector) + Keyword (BM25)
- **Context Optimization**: Re-ranking, diversity filtering, token management
- **Real-time Processing**: Async pipeline with status tracking

### Technology Stack

- **Embeddings**: Google Generative AI (text-embedding-004, 768 dimensions)
- **Vector Storage**: Firestore Vector Search
- **Search**: Semantic + BM25 hybrid
- **Backend**: Firebase Cloud Functions (Python 3.11)
- **Region**: australia-southeast1

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  (React 18 + TypeScript + Tailwind CSS)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Cloud Functions                     │
│                      (Python 3.11)                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Document   │  │   Chunking   │  │  Embedding   │         │
│  │  Extraction  │→ │   Strategy   │→ │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │           Firestore Vector Storage                │         │
│  │  (Vector embeddings + metadata)                   │         │
│  └──────────────────────────────────────────────────┘         │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Semantic   │  │     BM25     │  │    Hybrid    │         │
│  │    Search    │  │    Search    │→ │    Fusion    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                                     │                 │
│         ▼                                     ▼                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Context Retriever & Re-ranker             │         │
│  └──────────────────────────────────────────────────┘         │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────┐         │
│  │      AI Execution (OpenRouter API)                │         │
│  └──────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firestore Database                           │
│  (Prompts, Documents, Executions, Embeddings)                  │
└─────────────────────────────────────────────────────────────────┘
```

### RAG Pipeline Flow

```
Document Upload
    ↓
Text Extraction (PDF/DOCX/TXT/MD)
    ↓
Chunking (1000 tokens, 200 overlap)
    ↓
Embedding Generation (Google text-embedding-004)
    ↓
Vector Storage (Firestore)
    ↓
[User Query]
    ↓
Query Embedding
    ↓
Hybrid Search (Semantic + BM25)
    ↓
Context Retrieval & Re-ranking
    ↓
Context Injection into Prompt
    ↓
AI Generation (OpenRouter)
    ↓
Response with Context Metadata
```

---

## Components

### 1. Document Extractors

**File**: `functions/src/rag/document_extractors.py`

**Purpose**: Extract text from various document formats

**Supported Formats**:
- PDF (PyPDF2)
- DOCX (python-docx)
- TXT (plain text)
- MD (markdown)

**Key Functions**:
```python
extract_text_from_pdf(file_content: bytes) -> str
extract_text_from_docx(file_content: bytes) -> str
extract_text_from_txt(file_content: bytes) -> str
extract_text_from_markdown(file_content: bytes) -> str
```

### 2. Chunking Strategies

**File**: `functions/src/rag/chunking_strategies.py`

**Purpose**: Split documents into manageable chunks

**Strategies**:
1. **FixedSizeChunking**: Fixed token size with overlap
2. **SemanticChunking**: Sentence/paragraph boundaries
3. **HierarchicalChunking**: Document structure (headers, sections)
4. **SlidingWindowChunking**: Sliding window with custom step

**Default Configuration**:
```python
{
    "chunk_size": 1000,  # tokens
    "overlap": 200,      # tokens
    "strategy": "auto"   # auto-select based on content
}
```

**Key Class**:
```python
class ChunkingManager:
    def chunk_document(
        self,
        text: str,
        strategy: str = "auto",
        chunk_size: int = 1000,
        overlap: int = 200,
        metadata: Dict = None
    ) -> ChunkingResult
```

### 3. Embedding Service

**File**: `functions/src/rag/embedding_service.py`

**Purpose**: Generate vector embeddings for text

**Providers**:
- **Primary**: Google Generative AI (text-embedding-004)
- **Fallback**: OpenAI via OpenRouter

**Configuration**:
```python
{
    "model": "text-embedding-004",
    "dimensions": 768,
    "batch_size": 100,
    "cache_enabled": True
}
```

**Key Class**:
```python
class EmbeddingService:
    async def generate_embedding(
        self,
        text: str,
        model: str = "text-embedding-004"
    ) -> EmbeddingResult
    
    async def generate_embeddings_batch(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[EmbeddingResult]
```

### 4. Vector Store

**File**: `functions/src/rag/vector_store.py`

**Purpose**: Store and search vector embeddings

**Technology**: Firestore Vector Search

**Configuration**:
```python
{
    "collection_name": "vector_embeddings",
    "dimensions": 768,
    "metric": "cosine",
    "region": "australia-southeast1"
}
```

**Key Class**:
```python
class VectorStore:
    def upsert_vectors(
        self,
        vectors: List[Tuple[str, List[float], Dict]],
        namespace: str = None,
        batch_size: int = 500
    ) -> bool
    
    def search(
        self,
        query_vector: List[float],
        top_k: int = 10,
        namespace: str = None,
        filter_dict: Dict = None
    ) -> List[VectorSearchResult]
```

### 5. Semantic Search

**File**: `functions/src/rag/semantic_search.py`

**Purpose**: Vector similarity search

**Features**:
- Cosine similarity
- Score boosting (recent, user, quality)
- Similarity threshold filtering (0.7)
- Re-ranking
- Diversity filtering

**Key Class**:
```python
class SemanticSearchEngine:
    async def search(
        self,
        query: SearchQuery
    ) -> SearchResponse
```

### 6. BM25 Search

**File**: `functions/src/rag/bm25_search_engine.py`

**Purpose**: Keyword-based search

**Algorithm**: BM25 (Best Matching 25)

**Configuration**:
```python
{
    "k1": 1.5,  # term frequency saturation
    "b": 0.75   # length normalization
}
```

### 7. Hybrid Search

**File**: `functions/src/rag/hybrid_search_engine.py`

**Purpose**: Combine semantic + keyword search

**Fusion Algorithms**:
- Reciprocal Rank Fusion (RRF)
- CombSum (weighted sum)
- Borda Count (rank-based)
- Adaptive Fusion (dynamic weights)

**Configuration**:
```python
{
    "semantic_weight": 0.7,
    "keyword_weight": 0.3,
    "fusion_algorithm": "adaptive"
}
```

### 8. Context Retriever

**File**: `functions/src/rag/context_retriever.py`

**Purpose**: Orchestrate retrieval and optimize context

**Features**:
- Hybrid search orchestration
- Re-ranking
- Context window management (4000 tokens max)
- Conversation context integration
- Formatted context output

**Key Class**:
```python
class ContextRetriever:
    async def retrieve_context(
        self,
        retrieval_context: RetrievalContext
    ) -> RetrievedContext
```

### 9. Document Processing Pipeline

**File**: `functions/src/rag/document_processor.py`

**Purpose**: Unified pipeline for document processing

**Stages**:
1. PENDING
2. EXTRACTING
3. CHUNKING
4. EMBEDDING
5. INDEXING
6. COMPLETED

**Key Class**:
```python
class DocumentProcessingPipeline:
    async def process_document(
        self,
        job: DocumentProcessingJob,
        file_content: bytes,
        processing_config: Dict = None
    ) -> bool
```

---

## Data Flow

### Document Upload Flow

```python
# 1. User uploads document via frontend
POST /api/documents/upload
{
    "file": <binary>,
    "filename": "document.pdf",
    "workspace_id": "workspace_123"
}

# 2. Backend stores in Firebase Storage
bucket.blob(file_path).upload_from_string(file_content)

# 3. Create processing job
job = DocumentProcessingJob(
    document_id=doc_id,
    user_id=user_id,
    status=ProcessingStatus.PENDING
)

# 4. Run processing pipeline
pipeline.process_document(job, file_content, config)

# 5. Extract text
text = extract_text_from_pdf(file_content)

# 6. Chunk text
chunks = chunking_manager.chunk_document(text)

# 7. Generate embeddings (batch)
embeddings = await embedding_service.generate_embeddings_batch(
    [chunk.content for chunk in chunks]
)

# 8. Store in vector store
vectors = [(chunk.chunk_id, emb.embedding, chunk.metadata) 
           for chunk, emb in zip(chunks, embeddings)]
vector_store.upsert_vectors(vectors, namespace=user_id)

# 9. Update job status
job.status = ProcessingStatus.COMPLETED
```

### RAG Execution Flow

```python
# 1. User executes prompt with RAG enabled
POST /api/prompts/execute
{
    "prompt_id": "prompt_123",
    "variables": {"input": "user query"},
    "rag_enabled": true,
    "document_ids": ["doc_1", "doc_2"]
}

# 2. Build retrieval context
retrieval_ctx = RetrievalContext(
    query="user query",
    user_id=user_id,
    document_filters={"document_ids": ["doc_1", "doc_2"]},
    max_tokens=4000,
    use_hybrid_search=True
)

# 3. Retrieve context
retrieved_context = await context_retriever.retrieve_context(retrieval_ctx)

# 4. Format context
context = retrieved_context.formatted_context

# 5. Inject into prompt
system_prompt = f"{original_prompt}\n\n{context}"

# 6. Execute with OpenRouter
response = await openrouter_client.chat_completion(
    model="gpt-4",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "user query"}
    ]
)

# 7. Store execution with metadata
execution = {
    "prompt_id": prompt_id,
    "response": response.content,
    "rag_enabled": True,
    "context_metadata": retrieved_context.metadata,
    "chunks_used": len(retrieved_context.chunks)
}
```

---

## Configuration

### Environment Variables

```bash
# Google Cloud
GOOGLE_CLOUD_PROJECT=react-app-000730
GOOGLE_CLOUD_REGION=australia-southeast1
GOOGLE_API_KEY=<your-google-api-key>

# OpenRouter (fallback)
OPENROUTER_API_KEY=<your-openrouter-api-key>

# RAG Configuration
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_MAX_CONTEXT_TOKENS=4000
RAG_SIMILARITY_THRESHOLD=0.7
RAG_TOP_K=10
```

### Firebase Functions Config

```bash
firebase functions:config:set \
  google.api_key="<key>" \
  rag.chunk_size="1000" \
  rag.chunk_overlap="200" \
  rag.max_context_tokens="4000"
```

### Chunking Configuration

```python
chunking_config = {
    "strategy": "auto",  # auto, fixed_size, semantic, hierarchical, sliding
    "chunk_size": 1000,  # tokens
    "overlap": 200,      # tokens
    "min_chunk_size": 100,
    "max_chunk_size": 2000
}
```

### Embedding Configuration

```python
embedding_config = {
    "provider": "google",  # google, openai
    "model": "text-embedding-004",
    "dimensions": 768,
    "batch_size": 100,
    "cache_ttl": 3600  # seconds
}
```

### Search Configuration

```python
search_config = {
    "semantic_weight": 0.7,
    "keyword_weight": 0.3,
    "fusion_algorithm": "adaptive",  # rrf, combsum, borda, adaptive
    "similarity_threshold": 0.7,
    "diversity_threshold": 0.9,
    "rerank_top_k": 50,
    "top_k": 10
}
```

### Context Retrieval Configuration

```python
retrieval_config = {
    "max_chunks_per_retrieval": 20,
    "max_tokens": 4000,
    "token_buffer": 200,
    "conversation_context_ratio": 0.2,
    "query_expansion_enabled": True,
    "relevance_threshold": 0.7,
    "diversity_threshold": 0.8
}
```

---

## Performance

### Targets

| Component | Target | Actual |
|-----------|--------|--------|
| Document Processing | <30s per doc | ~10-30s |
| Embedding Generation | <100ms per text | ~50-100ms |
| Vector Search | <300ms | ~100-300ms |
| Semantic Search | <500ms | ~200-550ms |
| Hybrid Search | <1s | ~260-750ms |
| Context Retrieval | <800ms | ~300-800ms |
| Total RAG Overhead | <2s | ~1-2s |

### Optimization Tips

1. **Batch Embeddings**: Process 100 texts at once
2. **Cache Embeddings**: Use Redis for frequently accessed embeddings
3. **Limit Top-K**: Retrieve only what you need (10-20 chunks)
4. **Optimize Chunk Size**: Balance context vs. precision (500-1000 tokens)
5. **Use Namespaces**: Isolate user data for faster search
6. **Index Firestore**: Create composite indexes for filters
7. **Async Processing**: Use async/await for I/O operations

---

## Troubleshooting

### Common Issues

#### 1. Document Processing Fails

**Symptoms**: Status stuck at EXTRACTING or CHUNKING

**Causes**:
- Unsupported file format
- Corrupted file
- File too large (>10MB)

**Solutions**:
```python
# Check file format
if mime_type not in SUPPORTED_FORMATS:
    raise ValueError(f"Unsupported format: {mime_type}")

# Check file size
if len(file_content) > 10 * 1024 * 1024:
    raise ValueError("File too large (max 10MB)")

# Add error handling
try:
    text = extract_text_from_pdf(file_content)
except Exception as e:
    logger.error(f"Extraction failed: {e}")
    job.status = ProcessingStatus.FAILED
```

#### 2. Embedding Generation Fails

**Symptoms**: Error "Failed to generate embedding"

**Causes**:
- API key invalid
- Rate limit exceeded
- Text too long (>8192 tokens)

**Solutions**:
```python
# Verify API key
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not set")

# Handle rate limits
try:
    embedding = await generate_embedding(text)
except RateLimitError:
    await asyncio.sleep(1)
    embedding = await generate_embedding(text)

# Truncate long text
if len(text) > 8000:
    text = text[:8000]
```

#### 3. Search Returns No Results

**Symptoms**: Empty search results despite having documents

**Causes**:
- Similarity threshold too high
- Wrong namespace
- No documents indexed

**Solutions**:
```python
# Lower threshold
search_config["similarity_threshold"] = 0.5

# Check namespace
results = vector_store.search(query_vector, namespace=user_id)

# Verify index
stats = vector_store.get_index_stats()
print(f"Total vectors: {stats.total_vectors}")
```

#### 4. Context Too Large

**Symptoms**: Error "Context exceeds token limit"

**Causes**:
- Too many chunks retrieved
- Chunks too large

**Solutions**:
```python
# Reduce top_k
retrieval_ctx.max_chunks = 10

# Reduce max_tokens
retrieval_ctx.max_tokens = 3000

# Use smaller chunks
chunking_config["chunk_size"] = 500
```

---

## API Reference

See individual component files for detailed API documentation:

- `functions/src/rag/document_extractors.py`
- `functions/src/rag/chunking_strategies.py`
- `functions/src/rag/embedding_service.py`
- `functions/src/rag/vector_store.py`
- `functions/src/rag/semantic_search.py`
- `functions/src/rag/bm25_search_engine.py`
- `functions/src/rag/hybrid_search_engine.py`
- `functions/src/rag/context_retriever.py`
- `functions/src/rag/document_processor.py`

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-02  
**Maintained By**: ML Engineer + Backend Dev Team

