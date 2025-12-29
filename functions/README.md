# Prompt Library - Firebase Functions

Backend services for the Prompt Library Dashboard application.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Firebase CLI
- OpenRouter API key
- Google Cloud project with billing enabled

### Installation

```bash
# Install dependencies
cd functions
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Verify setup
python scripts/verify_api_keys.py
```

### Running Locally

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, run tests
pytest tests/ -v
```

---

## 🏗️ Architecture Overview

### Hybrid Node.js + Python Architecture

This project uses a **dual-runtime architecture** combining the strengths of both Node.js and Python:

**Node.js Components** (Deployed to Firebase Cloud Functions):

- API endpoints and HTTP handlers (`index.js`)
- Firebase Authentication and authorization
- Firestore database operations
- Cloud Storage file operations
- Frontend hosting and routing

**Python Components** (Local development and testing):

- RAG (Retrieval-Augmented Generation) pipeline (`src/rag/`)
- Document processing and text extraction (`src/rag/document_processor.py`)
- Semantic chunking strategies (`src/rag/chunking_strategies.py`)
- Vector embeddings generation (`src/rag/embedding_service.py`)
- Hybrid search (BM25 + semantic) (`src/rag/hybrid_search.py`)
- LLM integration and cost tracking (`src/llm/`)
- Comprehensive testing suite (`tests/`)

**Why This Architecture?**

- **Python**: Superior ML/NLP libraries, better document processing, robust testing
- **Node.js**: Native Firebase integration, faster cold starts, better API performance
- **Best of Both**: Leverage each language's strengths for optimal performance

**Deployment Model**:

- Node.js functions are deployed to Firebase Cloud Functions
- Python code runs locally for development and testing
- Python files are excluded from deployment (see `firebase.json`)

**See Also**: `docs/PYTHON_REQUIREMENTS_CLARIFICATION.md` for detailed architecture documentation

---

## 📁 Project Structure

```
functions/
├── src/
│   ├── error_handling.py       # Error handling system
│   ├── retry_logic.py          # Retry logic with exponential backoff
│   ├── streaming_handler.py    # Streaming response handler
│   └── llm/
│       ├── openrouter_client.py    # OpenRouter API client
│       └── cost_tracker.py         # Cost tracking system
├── tests/
│   ├── test_error_handling.py      # Error handling tests
│   ├── test_retry_logic.py         # Retry logic tests
│   ├── test_cost_tracker.py        # Cost tracker tests
│   ├── test_openrouter_client.py   # OpenRouter client tests
│   ├── test_streaming_handler.py   # Streaming handler tests
│   └── integration/
│       └── test_openrouter_integration.py  # Integration tests
├── scripts/
│   ├── verify_api_keys.py      # API key verification
│   ├── quick_verify.sh         # Quick verification script
│   ├── deploy_staging.sh       # Deployment script (Bash)
│   └── deploy_staging.ps1      # Deployment script (PowerShell)
├── docs/
│   └── TASK_*.md               # Task completion documentation
├── main.py                     # Cloud Functions entry point
├── requirements.txt            # Python dependencies
└── pytest.ini                  # Pytest configuration
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in `functions/` directory:

```bash
# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-api-key

# Google Embeddings API (for RAG)
GOOGLE_API_KEY=your-google-api-key

# Firebase (auto-configured in Cloud Functions)
FIREBASE_PROJECT_ID=your-project-id
```

### Firebase Functions Config

```bash
# Set environment variables for deployed functions
firebase functions:config:set openrouter.api_key="your-key"
firebase functions:config:set google.api_key="your-key"

# View current config
firebase functions:config:get
```

---

## 📡 API Endpoints

### 1. Execute Prompt

**Endpoint:** `execute_prompt`
**Method:** POST (Cloud Function callable)
**Auth:** Required

**Request:**

```json
{
  "promptId": "prompt-123",
  "inputs": { "name": "John" },
  "useRag": false,
  "ragQuery": "",
  "documentIds": [],
  "timeout": 60
}
```

**Response:**

```json
{
  "output": "Hello John, how are you?",
  "context": "",
  "metadata": {
    "model": "openai/gpt-3.5-turbo",
    "executionTime": 2.5,
    "tokensUsed": 150,
    "promptTokens": 100,
    "completionTokens": 50,
    "cost": 0.000225,
    "finishReason": "stop",
    "useRag": false,
    "timestamp": "2025-10-02T..."
  }
}
```

---

### 2. Execute Prompt (Streaming)

**Endpoint:** `execute_prompt_streaming`
**Method:** POST (Cloud Function callable)
**Auth:** Required

**Request:**

```json
{
  "promptId": "prompt-123",
  "inputs": { "name": "John" },
  "useRag": false
}
```

**Response:**

```json
{
  "execution_id": "uuid-here",
  "status": "streaming",
  "message": "Streaming execution started. Poll /get_execution_chunks for updates."
}
```

---

### 3. Get Execution Chunks

**Endpoint:** `get_execution_chunks`
**Method:** POST (Cloud Function callable)
**Auth:** Required

**Request:**

```json
{
  "executionId": "uuid-here",
  "promptId": "prompt-123",
  "fromIndex": 0
}
```

**Response:**

```json
{
  "execution_id": "uuid-here",
  "status": "streaming" | "completed" | "failed",
  "completed": false,
  "total_chunks": 10,
  "chunks": [
    {
      "index": 0,
      "content": "Hello",
      "timestamp": "2025-10-02T...",
      "metadata": {}
    }
  ],
  "metadata": {}
}
```

---

## 🧪 Testing

### Run All Tests

```bash
cd functions
pytest tests/ -v
```

### Run Specific Test Suite

```bash
# Unit tests
pytest tests/test_error_handling.py -v
pytest tests/test_retry_logic.py -v
pytest tests/test_cost_tracker.py -v

# Integration tests (requires API key)
export OPENROUTER_API_KEY="your-key"
pytest tests/integration/ -v -s
```

### Run with Coverage

```bash
pytest --cov=src --cov-report=html --cov-report=term
open htmlcov/index.html
```

---

## 🚀 Deployment

### Deploy to Staging

```bash
# Using PowerShell (Windows)
cd functions/scripts
./deploy_staging.ps1

# Using Bash (Linux/Mac)
cd functions/scripts
./deploy_staging.sh
```

### Deploy to Production

```bash
# Deploy all
firebase deploy

# Deploy functions only
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:execute_prompt
```

---

## 📊 Monitoring

### View Logs

```bash
# All function logs
firebase functions:log --limit 100

# Specific function
firebase functions:log --only execute_prompt

# Follow logs in real-time
firebase functions:log --follow

# Filter by severity
firebase functions:log --severity ERROR
```

### Monitor Performance

- Firebase Console → Functions → Dashboard
- Firebase Console → Performance Monitoring
- Cloud Monitoring → Metrics Explorer

---

## 🔍 Troubleshooting

### Common Issues

**Issue: API Key Not Found**

```
Error: OPENROUTER_API_KEY environment variable is required
```

**Solution:** Set environment variable or Firebase config

**Issue: Function Timeout**

```
Error: Function execution took longer than 60s
```

**Solution:** Increase timeout or optimize prompt

**Issue: Cost Tracking Failed**

```
Warning: Failed to track cost
```

**Solution:** Check Firestore permissions and connection

---

## 📚 Documentation

### Task Completion Guides

- [Task 1.1: Environment Setup](docs/TASK_1.1_COMPLETION_GUIDE.md)
- [Task 1.2: Audit Report](docs/TASK_1.2_AUDIT_REPORT.md)
- [Task 1.3: Security Fix](docs/TASK_1.3_COMPLETION.md)
- [Task 1.4: Error Handling](docs/TASK_1.4_COMPLETION.md)
- [Task 1.5: Retry Logic](docs/TASK_1.5_COMPLETION.md)
- [Task 1.6: Streaming Support](docs/TASK_1.6_COMPLETION.md)
- [Task 1.7: Timeout Handling](docs/TASK_1.7_COMPLETION.md)
- [Task 1.8: Cost Tracking](docs/TASK_1.8_COMPLETION.md)
- [Task 1.9: Unit Tests](docs/TASK_1.9_COMPLETION.md)
- [Task 1.10: Integration Tests](docs/TASK_1.10_COMPLETION.md)
- [Task 1.11: Deployment](docs/TASK_1.11_COMPLETION.md)

### Architecture Documentation

- [Phase 1 Progress Summary](../PHASE_1_PROGRESS_SUMMARY.md)
- [Phase 1 Final Summary](../PHASE_1_FINAL_SUMMARY.md)
- [Implementation Status](../IMPLEMENTATION_STATUS_SUMMARY.md)

---

## 🤝 Contributing

### Code Style

- Follow PEP 8 for Python code
- Use type hints
- Write docstrings for all functions
- Keep functions small and focused

### Testing

- Write tests for all new features
- Maintain 80%+ code coverage
- Run tests before committing

### Commit Messages

Follow Conventional Commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `refactor:` Code refactoring

---

## 📄 License

Copyright © 2025 Prompt Library. All rights reserved.

---

## 📞 Support

For issues or questions:

- Check documentation in `docs/`
- Review troubleshooting guide
- Check Firebase Console logs
- Contact development team

---

**Last Updated:** 2025-10-02
**Version:** 1.0.0
**Status:** Production Ready
