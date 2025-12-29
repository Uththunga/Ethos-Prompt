# Molē Marketing Agent - Quick Start Deployment Guide

**Last Updated**: October 16, 2025  
**Status**: Phase 1 Complete - Ready for Deployment

---

## 🚀 Quick Start (5 Steps)

### Prerequisites
- ✅ Python 3.11+ installed
- ✅ Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ OpenRouter API key (get from https://openrouter.ai)
- ✅ Firebase project configured (react-app-000730)

---

## Step 1: Install Dependencies (5 minutes)

```bash
# Navigate to functions directory
cd functions

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
python -c "import langgraph; print('LangGraph installed:', langgraph.__version__)"
```

**Expected Output**: `LangGraph installed: 0.3.x`

---

## Step 2: Initialize Marketing Knowledge Base (2 minutes)

```bash
# Still in functions directory
python -m src.ai_agent.marketing.init_marketing_kb
```

**Expected Output**:
```
Starting Marketing KB initialization...
Processing document 1/8: company_overview
  Created 5 chunks
  Generated 5 embeddings
  Stored 5 vectors
Processing document 2/8: services_overview
  ...
✅ Initialization complete!
Total documents: 8
Total chunks: 42
Total vectors: 42
```

**Verification**:
```bash
# Check Firestore collections
firebase firestore:get marketing_kb_vectors --limit 5
firebase firestore:get marketing_kb_index --limit 5
```

---

## Step 3: Configure Environment Variables (2 minutes)

```bash
# Set OpenRouter API key
firebase functions:config:set openrouter.api_key="YOUR_OPENROUTER_API_KEY"

# Set model (free model for testing)
firebase functions:config:set openrouter.model="x-ai/grok-2-1212:free"

# Set mock mode (false for production)
firebase functions:config:set openrouter.use_mock="false"

# Verify configuration
firebase functions:config:get
```

**Expected Output**:
```json
{
  "openrouter": {
    "api_key": "sk-or-v1-...",
    "model": "x-ai/grok-2-1212:free",
    "use_mock": "false"
  }
}
```

---

## Step 4: Deploy Backend (5 minutes)

```bash
# Deploy Cloud Functions
firebase deploy --only functions

# Wait for deployment to complete...
```

**Expected Output**:
```
✔  functions: Finished running predeploy script.
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
i  functions: preparing codebase default for deployment
...
✔  Deploy complete!

Functions:
  api(australia-southeast1): https://australia-southeast1-react-app-000730.cloudfunctions.net/api
```

**Test Endpoint**:
```bash
curl -X POST https://australia-southeast1-react-app-000730.cloudfunctions.net/api/ai/marketing-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is EthosPrompt?",
    "page_context": "homepage"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "response": "EthosPrompt is a smart, modular, RAG-enabled prompt management system...",
  "conversation_id": "uuid-here",
  "sources": [
    {
      "title": "EthosPrompt Company Overview",
      "score": 0.92
    }
  ],
  "metadata": {}
}
```

---

## Step 5: Deploy Frontend (3 minutes)

### 5.1: Copy MarketingChatModal Component

```bash
# Copy the implementation from docs to frontend
cp docs/ai-agent/MarketingChatModal_IMPLEMENTATION.tsx \
   frontend/src/components/marketing/MarketingChatModal.tsx
```

### 5.2: Build and Deploy

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already done)
npm install

# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

**Expected Output**:
```
✔  Deploy complete!

Hosting URL: https://react-app-000730.web.app
```

---

## ✅ Verification Checklist

### Backend Verification
- [ ] KB initialized (42 vectors in Firestore)
- [ ] Environment variables set
- [ ] Functions deployed successfully
- [ ] API endpoint responds to test request
- [ ] Response includes sources from KB

### Frontend Verification
- [ ] MarketingChatModal.tsx copied
- [ ] Frontend built without errors
- [ ] Hosting deployed successfully
- [ ] Chat icon visible on marketing pages
- [ ] Chat modal opens when clicked
- [ ] Messages send and receive successfully
- [ ] Conversation persists across page navigation

---

## 🧪 Testing the Deployment

### Test 1: Basic Chat Flow
1. Navigate to https://react-app-000730.web.app
2. Click the floating molē icon (bottom-right)
3. Type: "What is EthosPrompt?"
4. Verify response appears with sources
5. Type: "How much does it cost?"
6. Verify conversation continues

### Test 2: Conversation Persistence
1. Send a message in chat
2. Close the modal
3. Navigate to /solutions page
4. Open chat modal again
5. Verify previous messages are still visible

### Test 3: Page Context Detection
1. Open chat on homepage
2. Send message: "Tell me about this page"
3. Verify response is contextual to homepage
4. Navigate to /solutions
5. Send message: "Tell me about this page"
6. Verify response is contextual to solutions page

### Test 4: Error Handling
1. Disconnect internet
2. Send a message
3. Verify error message appears
4. Reconnect internet
5. Retry message
6. Verify success

---

## 📊 Monitoring

### Firebase Console
1. Navigate to https://console.firebase.google.com/project/react-app-000730
2. Go to **Functions** → **Logs**
3. Filter by function: `api`
4. Look for `/api/ai/marketing-chat` requests

### Firestore Data
1. Go to **Firestore Database**
2. Check collections:
   - `marketing_kb_vectors` (should have ~42 documents)
   - `marketing_kb_index` (should have 1 document)

### OpenRouter Usage
1. Navigate to https://openrouter.ai/dashboard
2. Check **Usage** tab
3. Verify costs are $0 (using free model)

---

## 🐛 Troubleshooting

### Issue: KB Initialization Fails

**Symptoms**: Error during `init_marketing_kb.py`

**Solutions**:
1. Check Python version: `python --version` (should be 3.11+)
2. Verify dependencies: `pip list | grep langgraph`
3. Check Firebase credentials: `firebase login`
4. Check Firestore rules (should allow writes)

### Issue: API Endpoint Returns 500 Error

**Symptoms**: `curl` test returns 500 Internal Server Error

**Solutions**:
1. Check function logs: `firebase functions:log`
2. Verify environment variables: `firebase functions:config:get`
3. Check OpenRouter API key is valid
4. Verify KB is initialized (check Firestore)

### Issue: Frontend Chat Not Working

**Symptoms**: Chat modal doesn't open or messages don't send

**Solutions**:
1. Check browser console for errors (F12)
2. Verify API endpoint URL in `marketingChatService.ts`
3. Check CORS configuration in backend
4. Clear localStorage: `localStorage.clear()`
5. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Issue: No Sources in Response

**Symptoms**: Response appears but no sources listed

**Solutions**:
1. Verify KB is initialized: `firebase firestore:get marketing_kb_vectors --limit 1`
2. Check retrieval logs in function logs
3. Verify hybrid search weights in `marketing_retriever.py`
4. Test retrieval directly: `python -m src.ai_agent.marketing.test_retrieval`

---

## 🔧 Advanced Configuration

### Using Production Models

```bash
# Switch to GPT-4 Turbo (costs apply)
firebase functions:config:set openrouter.model="openai/gpt-4-turbo"

# Or Claude 3.5 Sonnet
firebase functions:config:set openrouter.model="anthropic/claude-3.5-sonnet"

# Redeploy
firebase deploy --only functions
```

### Enabling Streaming

1. Implement `/api/ai/marketing-chat-stream` endpoint (see `marketing_agent.py` for `chat_stream` method)
2. Update `marketingChatService.ts` to use `sendMessageStream()`
3. Update `MarketingChatModal.tsx` to handle streaming responses

### Custom Chunking Strategy

Edit `functions/src/ai_agent/marketing/kb_indexer.py`:

```python
self.chunking_config = ChunkingConfig(
    chunk_size=1000,  # Increase for more context
    chunk_overlap=200,  # Increase for better continuity
    preserve_boundaries=True,
    min_chunk_size=300
)
```

Re-run initialization:
```bash
python -m src.ai_agent.marketing.init_marketing_kb --force-reindex
```

### Adjusting Hybrid Search Weights

Edit `functions/src/ai_agent/marketing/marketing_retriever.py`:

```python
self.semantic_weight = 0.8  # Increase for more semantic focus
self.bm25_weight = 0.2      # Decrease keyword focus
```

Redeploy:
```bash
firebase deploy --only functions
```

---

## 📈 Performance Optimization

### Reduce Cold Starts
```bash
# Increase minimum instances (costs apply)
firebase functions:config:set functions.min_instances="1"
```

### Enable Response Caching
See `docs/ai-agent/MOLE_IMPLEMENTATION_PLAN_PART3.md` for Phase 3 caching implementation.

### Monitor Costs
```bash
# Set up billing alerts in Google Cloud Console
# Navigate to: Billing → Budgets & alerts
# Set threshold: $10/month
```

---

## 🎉 Success!

If all verification steps pass, your Molē Marketing Agent is live! 🚀

**Next Steps**:
1. Monitor usage and performance
2. Gather user feedback
3. Iterate on retrieval quality
4. Begin Phase 2: Prompt Library Agent

---

## 📞 Support

### Documentation
- **Full Implementation**: `docs/ai-agent/PHASE_1_COMPLETION_SUMMARY.md`
- **KB Initialization**: `docs/ai-agent/TASK_1_4_KB_INITIALIZATION_GUIDE.md`
- **Status Report**: `docs/ai-agent/IMPLEMENTATION_STATUS_REPORT.md`

### External Resources
- **LangGraph Docs**: https://langchain-ai.github.io/langgraph/
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Firebase Docs**: https://firebase.google.com/docs

---

**Deployment Time**: ~20 minutes  
**Difficulty**: Intermediate  
**Status**: ✅ Ready for Production

*Happy Deploying! 🎉*

