# Quick Start: Google Embeddings

## 🚀 Get Started in 5 Minutes

This guide will get your Google embeddings up and running quickly.

### Step 1: Get Google API Key (2 minutes)

1. Go to **https://aistudio.google.com/**
2. Sign in with Google account
3. Click **"Get API key"** → **"Create API key"**
4. Copy the key (starts with `AIza...`)

### Step 2: Configure Environment (1 minute)

Add to your `.env` file:
```bash
# Primary embedding provider
GOOGLE_API_KEY=AIza...your-actual-key

# Existing keys (keep these)
OPENROUTER_API_KEY=your-openrouter-key
COHERE_API_KEY=your-cohere-key
```

### Step 3: Test Setup (2 minutes)

```bash
cd functions
python test_google_api_live.py
```

Expected output:
```
✅ Embedding generated successfully!
   • Dimensions: 768
   • Processing time: ~1s
🎉 All tests completed successfully!
```

## ✅ You're Done!

Your RAG system now uses:
- **Primary**: Google embeddings (50% cheaper)
- **Fallback**: OpenRouter embeddings (high availability)
- **Same API**: No code changes needed

## 🔧 How It Works

### Automatic Usage
```python
# Your existing code works unchanged
from rag.embedding_service import embedding_service

# This now uses Google embeddings automatically
result = await embedding_service.generate_embedding("Your text")
print(f"Dimensions: {result.dimensions}")  # 768
```

### Manual Provider Selection
```python
# Force specific provider
google_service = EmbeddingService(provider='google')
openai_service = EmbeddingService(provider='openai')  # via OpenRouter
```

## 📊 Benefits

| Metric | Before (OpenAI) | After (Google) | Improvement |
|--------|----------------|----------------|-------------|
| **Cost** | $0.00002/1K tokens | $0.00001/1K tokens | **50% cheaper** |
| **Dimensions** | 1536 | 768 | **More efficient** |
| **Availability** | Single provider | Google + OpenRouter | **Higher uptime** |

## 🚨 Troubleshooting

### "Service not available"
- Check `GOOGLE_API_KEY` in `.env` file
- Verify key starts with `AIza`
- Test with: `python test_google_api_live.py`

### "API quota exceeded"
- System automatically falls back to OpenRouter
- Check usage in Google AI Studio
- Consider upgrading quota if needed

### "Dimension mismatch"
- Google: 768 dimensions
- OpenAI: 1536 dimensions
- Vector stores handle this automatically

## 📚 Next Steps

- **Production**: Deploy with same `.env` configuration
- **Monitoring**: Track usage in Google AI Studio
- **Scaling**: System handles high volumes automatically
- **Documentation**: See `docs/google-embeddings-migration.md` for details

## 🆘 Support

- **Test script**: `functions/test_google_api_live.py`
- **Integration test**: `functions/test_google_embeddings_integration.py`
- **Full docs**: `docs/google-embeddings-migration.md`
- **Changelog**: `GOOGLE_EMBEDDINGS_CHANGELOG.md`
