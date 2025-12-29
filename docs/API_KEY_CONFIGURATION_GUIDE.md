# API Key Configuration Guide - RAG Prompt Library

**Last Updated**: 2025-10-02  
**Project**: RAG Prompt Library  
**Live Demo**: https://react-app-000730.web.app

---

## Overview

This guide provides complete instructions for obtaining and configuring all API keys required for the RAG Prompt Library project.

---

## 🔑 Required API Keys

### 1. **OpenRouter API Key** (REQUIRED - Primary LLM Provider)

**Purpose**: Powers all LLM operations (GPT-3.5, GPT-4, Claude, etc.) and embeddings

**Status**: ✅ **YOU ALREADY HAVE THIS**

**Where it's used**:
- Backend: `functions/src/llm/openrouter_client.py` - All LLM requests
- Backend: `functions/src/rag/embedding_service.py` - Embeddings (fallback)
- Frontend: `frontend/src/services/api.ts` - Direct API calls (optional)

**Configuration**:

**Backend** (`functions/.env`):
```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

**Frontend** (`frontend/.env`) - Optional:
```bash
VITE_OPENROUTER_API_KEY=your-api-key-here
```

**Firebase Functions** (Production):
```bash
firebase functions:config:set openrouter.api_key="sk-or-v1-your-api-key-here"
```

**Verification**:
```bash
# Check if set locally
echo $OPENROUTER_API_KEY

# Check Firebase config
firebase functions:config:get openrouter
```

---

### 2. **Google API Key** (REQUIRED - Primary Embeddings Provider)

**Purpose**: Generates vector embeddings for RAG using Google's text-embedding-004 model

**Status**: ✅ **YOU ALREADY HAVE THIS**

**Where it's used**:
- Backend: `functions/src/rag/embedding_service.py` - Primary embeddings provider
- Backend: Document processing and vector search

**How to Get**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Generative Language API**
4. Go to **APIs & Services** → **Credentials**
5. Click **Create Credentials** → **API Key**
6. Copy the API key

**Configuration**:

**Backend** (`functions/.env`):
```bash
GOOGLE_API_KEY=AIzaSy...your-key-here
```

**Firebase Functions** (Production):
```bash
firebase functions:config:set google.api_key="AIzaSy...your-key-here"
```

**Verification**:
```bash
# Test Google API key
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

---

## 🔐 Optional API Keys

### 3. **Sentry DSN** (OPTIONAL - Error Tracking)

**Purpose**: Real-time error monitoring and alerting in production

**Status**: ⏳ **NOT CONFIGURED** (Recommended for production)

**Priority**: Configure before production deployment

**How to Get**:
1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for free account (5,000 errors/month free)
3. Create new project:
   - Platform: **Python**
   - Project name: **rag-prompt-library-backend**
4. Copy the DSN from project settings

**DSN Format**: `https://[key]@[org].ingest.sentry.io/[project-id]`

**Configuration**:

**Backend** (`functions/.env`):
```bash
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
ENVIRONMENT=production  # or development, staging
```

**Firebase Functions** (Production):
```bash
firebase functions:config:set sentry.dsn="https://your-key@your-org.ingest.sentry.io/your-project-id"
firebase functions:config:set environment="production"
```

**Frontend** (`frontend/.env`) - Optional:
```bash
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-frontend-project-id
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE=0
```

**Benefits**:
- ✅ Real-time error alerts
- ✅ Stack traces and context
- ✅ Performance monitoring
- ✅ User impact tracking

**Documentation**: See `docs/SENTRY_SETUP_GUIDE.md`

---

### 4. **Firebase Configuration** (REQUIRED - Already Configured)

**Purpose**: Authentication, Firestore, Cloud Functions, Storage

**Status**: ✅ **ALREADY CONFIGURED**

**Your Project**: `react-app-000730`  
**Region**: `australia-southeast1`

**Frontend** (`frontend/.env`):
```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=react-app-000730.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=react-app-000730
VITE_FIREBASE_STORAGE_BUCKET=react-app-000730.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234
```

**Note**: These are already configured in your project.

---

## 📋 Configuration Checklist

### Backend Configuration

**File**: `functions/.env`

```bash
# ✅ REQUIRED - Already Configured
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
GOOGLE_API_KEY=AIzaSy...your-key-here

# ⏳ OPTIONAL - Recommended for Production
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
ENVIRONMENT=production

# ✅ Configuration (Already Set)
PYTHON_ENV=development
LOG_LEVEL=info
```

### Frontend Configuration

**File**: `frontend/.env`

```bash
# ✅ REQUIRED - Already Configured
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=react-app-000730.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=react-app-000730
VITE_FIREBASE_STORAGE_BUCKET=react-app-000730.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# ⏳ OPTIONAL - For direct frontend API calls
VITE_OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# ⏳ OPTIONAL - For frontend error tracking
VITE_SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-frontend-project-id
```

---

## 🚀 Quick Setup Instructions

### Step 1: Create Backend .env File

```bash
cd functions
cp .env.example .env
```

Edit `functions/.env` and add your API keys:
```bash
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
GOOGLE_API_KEY=AIzaSy...your-actual-key-here
```

### Step 2: Create Frontend .env File

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env` with your Firebase config (already done).

### Step 3: Configure Firebase Functions (Production)

```bash
# Set OpenRouter API key
firebase functions:config:set openrouter.api_key="sk-or-v1-your-key-here"

# Set Google API key
firebase functions:config:set google.api_key="AIzaSy...your-key-here"

# Optional: Set Sentry DSN
firebase functions:config:set sentry.dsn="https://your-key@your-org.ingest.sentry.io/your-project-id"
firebase functions:config:set environment="production"
```

### Step 4: Verify Configuration

```bash
# Check local environment
cd functions
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('OpenRouter:', 'SET' if os.getenv('OPENROUTER_API_KEY') else 'NOT SET'); print('Google:', 'SET' if os.getenv('GOOGLE_API_KEY') else 'NOT SET')"

# Check Firebase config
firebase functions:config:get
```

---

## 🧪 Testing API Keys

### Test OpenRouter API Key

```bash
cd functions
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

import requests
api_key = os.getenv('OPENROUTER_API_KEY')
response = requests.get(
    'https://openrouter.ai/api/v1/models',
    headers={'Authorization': f'Bearer {api_key}'}
)
print('OpenRouter Status:', response.status_code)
print('Models available:', len(response.json().get('data', [])))
"
```

### Test Google API Key

```bash
cd functions
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

import requests
api_key = os.getenv('GOOGLE_API_KEY')
response = requests.get(
    f'https://generativelanguage.googleapis.com/v1beta/models?key={api_key}'
)
print('Google API Status:', response.status_code)
print('Models available:', len(response.json().get('models', [])))
"
```

### Test Sentry Integration

```bash
cd functions
pytest tests/test_sentry_integration.py -v
```

---

## 💰 Cost Estimates

### OpenRouter (Primary LLM)
- **Free Tier**: Some models available for free (nvidia/nemotron)
- **Paid Models**: 
  - GPT-3.5 Turbo: ~$0.0005-0.0015 per 1K tokens
  - GPT-4: ~$0.03-0.06 per 1K tokens
  - Claude 3.5 Sonnet: ~$0.003-0.015 per 1K tokens
- **Estimated Monthly**: $10-50 (light usage), $50-200 (moderate usage)

### Google Embeddings
- **Free Tier**: 1,500 requests/day free
- **Paid**: $0.00001 per 1K characters (~$0.01 per 1M characters)
- **Estimated Monthly**: $0-5 (most usage covered by free tier)

### Sentry
- **Free Tier**: 5,000 errors/month, 10,000 performance units/month
- **Paid**: $26/month for 50K errors
- **Estimated Monthly**: $0 (free tier sufficient for most projects)

**Total Estimated Monthly Cost**: $10-55 (depending on usage)

---

## 🔒 Security Best Practices

1. **Never Commit API Keys**
   - ✅ `.env` files are in `.gitignore`
   - ✅ Use `.env.example` as template

2. **Use Environment Variables**
   - ✅ Backend: Load from `.env` file
   - ✅ Frontend: Use `VITE_` prefix for Vite
   - ✅ Production: Use Firebase Functions config

3. **Rotate Keys Regularly**
   - Rotate every 90 days
   - Rotate immediately if compromised

4. **Limit Key Permissions**
   - Use separate keys for dev/staging/prod
   - Set usage limits in provider dashboards

5. **Monitor Usage**
   - Check OpenRouter dashboard: https://openrouter.ai/activity
   - Check Google Cloud Console: https://console.cloud.google.com/
   - Set up billing alerts

---

## 📚 Additional Resources

- **OpenRouter Documentation**: https://openrouter.ai/docs
- **Google AI Documentation**: https://ai.google.dev/docs
- **Sentry Documentation**: https://docs.sentry.io/platforms/python/
- **Firebase Documentation**: https://firebase.google.com/docs

---

## ✅ Summary

### What You Have Configured ✅
1. ✅ **OpenRouter API Key** - Primary LLM provider
2. ✅ **Google API Key** - Primary embeddings provider
3. ✅ **Firebase Configuration** - Backend infrastructure

### What You Should Configure Next ⏳
1. ⏳ **Sentry DSN** (Backend) - Error tracking (15 minutes)
2. ⏳ **Sentry DSN** (Frontend) - Frontend error tracking (optional, 10 minutes)

### Production Deployment Checklist
- [x] OpenRouter API key configured
- [x] Google API key configured
- [ ] Sentry DSN configured (recommended)
- [x] Firebase Functions config set
- [ ] Test all API keys
- [ ] Set up billing alerts
- [ ] Deploy to production

---

**Next Steps**: 
1. Configure Sentry DSN (optional but recommended)
2. Run A/B tests with configured API keys
3. Deploy to production with confidence!

