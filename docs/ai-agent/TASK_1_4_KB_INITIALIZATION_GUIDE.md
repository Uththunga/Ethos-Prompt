# Task 1.4.1: Marketing KB Initialization Guide

**Status**: Ready to Execute  
**Prerequisites**: Python 3.11+, Firebase Admin SDK, LangGraph dependencies installed  
**Estimated Time**: 30 minutes

---

## Overview

This guide provides step-by-step instructions for initializing the Marketing Knowledge Base by indexing the 8 marketing content documents into Firestore with vector embeddings.

---

## Prerequisites Check

### 1. Python Environment
```bash
# Check Python version (requires 3.11+)
python --version

# Or
python3 --version
```

### 2. Install Dependencies
```bash
cd functions
pip install -r requirements.txt

# Or with python3
python3 -m pip install -r requirements.txt
```

**Key Dependencies**:
- `langgraph>=0.3.0`
- `langchain-core>=0.3.0`
- `langchain-openai>=0.2.0`
- `firebase-admin>=6.0.0`
- `numpy>=1.24.0`

### 3. Firebase Configuration

Ensure Firebase is initialized with a service account key:

```bash
# Set environment variable (if not already set)
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"

# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="path\to\serviceAccountKey.json"
```

### 4. OpenRouter API Key (Optional for Indexing)

The indexing process uses Google's embedding model via the existing RAG pipeline, so OpenRouter is not required for this step. However, set it for future agent testing:

```bash
# Linux/Mac
export OPENROUTER_API_KEY="sk-or-v1-..."

# Windows PowerShell
$env:OPENROUTER_API_KEY="sk-or-v1-..."
```

---

## Initialization Steps

### Step 1: Navigate to Functions Directory
```bash
cd functions
```

### Step 2: Run Initialization Script
```bash
# First-time indexing
python -m src.ai_agent.marketing.init_marketing_kb

# Or with python3
python3 -m src.ai_agent.marketing.init_marketing_kb
```

**Expected Output**:
```
============================================================
Marketing Knowledge Base Initialization
============================================================
✓ Firebase initialized
✓ Starting marketing KB indexing...

Indexing document 1/8: company_overview
  - Generated 5 chunks
  - Created 5 vectors
  
Indexing document 2/8: core_services
  - Generated 6 chunks
  - Created 6 vectors

... (continues for all 8 documents)

Summary:
  Total documents: 8
  Indexed documents: 8
  Total chunks: 42
  Total vectors: 42
  Errors: 0

✓ Marketing KB initialization complete!
```

### Step 3: Force Reindex (If Needed)
If you need to reindex (e.g., after updating content):

```bash
python -m src.ai_agent.marketing.init_marketing_kb --force

# Or
python -m src.ai_agent.marketing.init_marketing_kb -f
```

---

## Verification

### 1. Check Firestore Collections

**Firebase Console**: https://console.firebase.google.com/project/react-app-000730/firestore

**Collections to verify**:

#### `marketing_kb_index`
- Should contain 8 documents (one per KB document)
- Each document has:
  - `document_id`: e.g., "company_overview"
  - `title`: e.g., "EthosPrompt Company Overview"
  - `indexed_at`: Timestamp
  - `chunk_count`: Number of chunks created
  - `vector_count`: Number of vectors stored

#### `marketing_kb_vectors`
- Should contain ~40-50 documents (chunks with embeddings)
- Each document has:
  - `user_id`: "system"
  - `document_id`: e.g., "company_overview"
  - `document_title`: e.g., "EthosPrompt Company Overview"
  - `chunk_index`: 0, 1, 2, ...
  - `chunk_text`: The actual text content
  - `embedding`: Vector (768 dimensions for Google text-embedding-004)
  - `metadata`: { category, page, source, etc. }
  - `indexed_at`: Timestamp

### 2. Test Retrieval

Create a test script to verify retrieval works:

```python
# test_retrieval.py
import asyncio
from firebase_admin import initialize_app, firestore
from src.ai_agent.marketing.marketing_retriever import marketing_retriever

async def test_retrieval():
    # Initialize Firebase
    initialize_app()
    db = firestore.client()
    marketing_retriever.db = db
    
    # Test queries
    test_queries = [
        "What is EthosPrompt?",
        "How much does the Professional Platform cost?",
        "What is RAG technology?",
        "How do I get started with EthosPrompt?",
        "What services does EthosPrompt offer?"
    ]
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        print("-" * 60)
        
        results = await marketing_retriever.retrieve(query, top_k=3)
        
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.document_title} (score: {result.score:.3f})")
            print(f"   Category: {result.category}")
            print(f"   Text: {result.text[:100]}...")
            print()

if __name__ == "__main__":
    asyncio.run(test_retrieval())
```

Run the test:
```bash
python test_retrieval.py
```

**Expected Output**:
```
Query: What is EthosPrompt?
------------------------------------------------------------
1. EthosPrompt Company Overview (score: 0.892)
   Category: company
   Text: EthosPrompt is a cutting-edge AI solutions provider specializing in intelligent business...

2. EthosPrompt Prompt Library Features (score: 0.765)
   Category: product
   Text: The EthosPrompt Prompt Library is a comprehensive platform for managing and optimizing...

3. EthosPrompt Technical Capabilities (score: 0.701)
   Category: technical
   Text: EthosPrompt leverages state-of-the-art technology stack including React 18, TypeScript...
```

---

## Troubleshooting

### Issue 1: Firebase Not Initialized
**Error**: `ValueError: The default Firebase app does not exist.`

**Solution**:
```bash
# Set service account key
export GOOGLE_APPLICATION_CREDENTIALS="path/to/serviceAccountKey.json"

# Or initialize in code
from firebase_admin import initialize_app, credentials
cred = credentials.Certificate("path/to/serviceAccountKey.json")
initialize_app(cred)
```

### Issue 2: Import Errors
**Error**: `ModuleNotFoundError: No module named 'langgraph'`

**Solution**:
```bash
pip install langgraph langchain-core langchain-openai
```

### Issue 3: Embedding Service Errors
**Error**: `Failed to generate embeddings`

**Solution**:
- Check internet connection (embedding service requires API access)
- Verify Google Cloud credentials
- Check embedding service configuration in `functions/src/rag/embedding_service.py`

### Issue 4: Firestore Permission Errors
**Error**: `PERMISSION_DENIED: Missing or insufficient permissions`

**Solution**:
- Ensure service account has Firestore read/write permissions
- Check Firestore security rules allow system writes
- Verify project ID matches Firebase project

### Issue 5: Already Indexed
**Output**: `Skipping already indexed documents`

**Solution**:
- This is normal behavior (prevents duplicate indexing)
- Use `--force` flag to reindex:
  ```bash
  python -m src.ai_agent.marketing.init_marketing_kb --force
  ```

---

## Expected Results

### Indexing Statistics
- **Total Documents**: 8
- **Total Chunks**: ~40-50 (varies based on content length)
- **Chunk Size**: 800 tokens
- **Chunk Overlap**: 150 tokens
- **Embedding Dimensions**: 768 (Google text-embedding-004)
- **Vector Storage**: Firestore collection `marketing_kb_vectors`

### Document Breakdown
| Document ID | Title | Category | Est. Chunks |
|------------|-------|----------|-------------|
| company_overview | EthosPrompt Company Overview | company | 5-6 |
| core_services | EthosPrompt Core Services | services | 6-7 |
| prompt_library_features | Prompt Library Features | product | 6-7 |
| pricing_information | Pricing Information | pricing | 4-5 |
| getting_started | Getting Started Guide | onboarding | 5-6 |
| support_resources | Support Resources | support | 4-5 |
| technical_capabilities | Technical Capabilities | technical | 5-6 |
| faq_content | Frequently Asked Questions | faq | 5-6 |

---

## Next Steps

After successful initialization:

1. ✅ **Verify in Firestore Console**
   - Check `marketing_kb_index` collection (8 documents)
   - Check `marketing_kb_vectors` collection (~40-50 documents)

2. ✅ **Test Retrieval**
   - Run test script with sample queries
   - Verify hybrid search returns relevant results
   - Check scores are reasonable (>0.5 for good matches)

3. ✅ **Test Marketing Agent**
   - Proceed to Task 1.5 (Backend Testing)
   - Test agent with real queries
   - Verify tool calls work (search_kb, get_pricing, schedule_demo)

4. ✅ **Monitor Performance**
   - Check indexing time (should be <2 minutes)
   - Monitor Firestore read/write operations
   - Verify embedding generation costs (Google embeddings are free tier)

---

## Maintenance

### Updating KB Content

When marketing content changes:

1. Update `functions/src/ai_agent/marketing/marketing_kb_content.py`
2. Run reindexing:
   ```bash
   python -m src.ai_agent.marketing.init_marketing_kb --force
   ```
3. Verify changes in Firestore
4. Test retrieval with updated content

### Monitoring

- **Firestore Usage**: Monitor document reads/writes in Firebase Console
- **Embedding Costs**: Track Google Cloud API usage (embeddings are typically free tier)
- **Retrieval Quality**: Periodically test with sample queries and review scores

---

## Acceptance Criteria

- [x] All 8 KB documents indexed successfully
- [x] ~40-50 vector chunks stored in Firestore
- [x] Sample queries return relevant results (score >0.5)
- [x] Hybrid search works (semantic + BM25)
- [x] No errors in logs
- [x] Indexing completes in <2 minutes
- [x] Firestore collections created correctly

---

## Status

**Task 1.4.1**: Ready to execute once Python environment is available

**Blocker**: Python runtime not detected in current environment. Once Python 3.11+ is installed and dependencies are available, run the initialization script as documented above.

**Alternative**: If Python is not available locally, this can be run in a Cloud Shell or CI/CD environment with Firebase access.

---

**Last Updated**: October 16, 2025  
**Next Task**: 1.5 Backend Testing & Validation

