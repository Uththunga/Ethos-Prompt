# IBM Granite 4.0 H-Small Integration Guide

## Overview

This guide explains how to integrate **IBM Granite 4.0 H-Small** (32B params, 9B active) as the LLM for your marketing molē assistant via IBM watsonx.ai.

## Why Granite 4.0 H-Small?

**Key Advantages:**
- **Enterprise-Grade**: Built for business applications with responsible AI certification (ISO 42001)
- **Efficient MoE Architecture**: 32B total parameters with only 9B active per forward pass = better performance at lower cost
- **Advanced Tool-Calling**: Native function calling support (OpenAI-compatible schema)
- **Long Context**: Supports up to 128K tokens for complex conversations
- **RAG-Optimized**: Built-in document handling and retrieval capabilities
- **Cost-Effective**: MoE efficiency provides enterprise performance at reduced compute costs

**Current Setup:**
- Previously: OpenRouter with `z-ai/glm-4.5-air:free` (free tier)
- Now: IBM Granite 4.0 H-Small via watsonx.ai (enterprise tier)

## Prerequisites

### 1. IBM Cloud Account & API Key

**Create IBM Cloud Account:**
1. Go to [IBM Cloud](https://cloud.ibm.com/registration)
2. Sign up for a free account (or use existing account)
3. Verify your email address

**Get API Key:**
1. Log in to [IBM Cloud Console](https://cloud.ibm.com/)
2. Navigate to **Manage** → **Access (IAM)** → **API keys**
3. Click **Create an IBM Cloud API key**
4. Name it: `watsonx-granite-key`
5. **Copy and save** the API key securely (you can't retrieve it later)

### 2. watsonx.ai Project Setup

**Create watsonx.ai Project:**
1. Go to [watsonx.ai](https://dataplatform.cloud.ibm.com/wx/home)
2. Click **New Project**
3. Name: `EthosPrompt Marketing Agent`
4. Select **Watson Machine Learning** service
5. Click **Create**

**Get Project ID:**
1. Open your project
2. Click **Manage** tab
3. Copy the **Project ID** (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 3. Enable Granite Model Access

1. In your watsonx.ai project, go to **Assets** tab
2. Click **New asset** → **Work with foundation models**
3. Search for **Granite 4.0 H-Small**
4. Verify it's available in your region (US South recommended)

## Environment Configuration

### Production (Firebase Functions / Cloud Run)

Set the following environment variables in Google Cloud Console:

```bash
# IBM watsonx.ai Credentials
WATSONX_API_KEY=<your-ibm-cloud-api-key>
WATSONX_PROJECT_ID=<your-watsonx-project-id>

# Enable Granite LLM
USE_GRANITE_LLM=true

# Environment
ENVIRONMENT=production
```

**Set via Firebase CLI:**
```bash
firebase functions:config:set \
  watsonx.api_key="YOUR_API_KEY" \
  watsonx.project_id="YOUR_PROJECT_ID" \
  llm.use_granite="true"
```

**Or via Google Cloud Console:**
1. Go to Cloud Functions or Cloud Run
2. Edit the service
3. Add environment variables:
   - `WATSONX_API_KEY`: Your IBM Cloud API key
   - `WATSONX_PROJECT_ID`: Your watsonx.ai project ID
   - `USE_GRANITE_LLM`: `true`

### Local Development

Create a `.env` file in `functions/src/`:

```bash
# IBM watsonx.ai Configuration
WATSONX_API_KEY=your-ibm-cloud-api-key-here
WATSONX_PROJECT_ID=your-watsonx-project-id-here
USE_GRANITE_LLM=true

# Legacy OpenRouter (fallback)
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=z-ai/glm-4.5-air:free
OPENROUTER_USE_MOCK=false

# Environment
ENVIRONMENT=development
```

**Security Note:** Never commit `.env` files to version control. Add to `.gitignore`:
```
functions/src/.env
.env
*.env
```

## Installation

### 1. Install Dependencies

```bash
cd functions/src
pip install ibm-watsonx-ai>=2.0.0
pip install httpx>=0.27.0
```

Or install all dependencies:
```bash
pip install -r requirements.txt
```

### 2. Verify Installation

Test the watsonx client:

```python
from llm.watsonx_client import WatsonxGraniteClient

client = WatsonxGraniteClient()
print("✓ watsonx.ai client initialized successfully")
```

## Usage

### Basic Test

Test Granite locally before deploying:

```python
import asyncio
from ai_agent.marketing.marketing_agent import get_marketing_agent

async def test_granite():
    agent = get_marketing_agent()

    response = await agent.chat(
        message="What services does EthosPrompt offer?",
        context={"page_context": "homepage"}
    )

    print(f"Response: {response['response']}")
    print(f"Model: {response['metadata']['model']}")
    print(f"Token Usage: {response['metadata'].get('token_usage')}")

# Run test
asyncio.run(test_granite())
```

### Toggle Between Providers

Switch between Granite and OpenRouter by setting `USE_GRANITE_LLM`:

**Use Granite (IBM watsonx.ai):**
```bash
export USE_GRANITE_LLM=true
```

**Use OpenRouter (legacy):**
```bash
export USE_GRANITE_LLM=false
```

## Model Configuration

Current settings optimized for molē marketing chat:

```python
Model: ibm/granite-4-0-h-small
Temperature: 0.6  # Balanced creativity/consistency
Max Tokens: 400   # Concise responses (100-150 words)
Streaming: true   # Real-time response delivery
```

**Adjust in `marketing_agent.py` lines 201-203:**
```python
self._temperature = 0.6   # Lower = more focused
self._max_tokens = 400    # Increase for longer responses
self._streaming = True    # Set False to disable streaming
```

## Cost Estimation

**IBM Granite 4.0 H-Small Pricing (Approximate):**
- Input: ~$0.50 per 1M tokens
- Output: ~$1.50 per 1M tokens

**Typical Marketing Chat:**
- Average prompt: ~500 tokens
- Average response: ~200 tokens
- Cost per interaction: ~$0.0005 (0.05 cents)

**Monthly estimate (1000 conversations):**
- Total cost: ~$0.50/month
- Significantly cheaper than GPT-4 (~$0.03 per chat = $30/month)

**Free Tier:**
- IBM Cloud offers free tier for watsonx.ai
- Check [IBM Cloud Free Tier](https://www.ibm.com/cloud/free) for limits

## Deployment

### 1. Update Environment Variables

**Production (Firebase/Cloud Run):**
```bash
# Set in Google Cloud Console
gcloud run services update marketing-api \
  --set-env-vars="USE_GRANITE_LLM=true,WATSONX_API_KEY=YOUR_KEY,WATSONX_PROJECT_ID=YOUR_PROJECT_ID"
```

### 2. Deploy Functions

```bash
cd functions/src
firebase deploy --only functions
```

### 3. Verify Deployment

Check logs to confirm Granite is being used:

```bash
firebase functions:log

# Look for:
# "Initializing IBM Granite 4.0 H-Small via watsonx.ai"
# "IBM Granite 4.0 H-Small initialized"
```

## Monitoring

### Check Model Usage

Logs will include:
- `"model": "ibm/granite-4-0-h-small"` in metadata
- Token usage tracking
- Cost estimation

### Token Usage Monitoring

Response metadata includes:
```json
{
  "token_usage": {
    "prompt_tokens": 500,
    "completion_tokens": 200,
    "total_tokens": 700
  },
  "estimated_cost_usd": 0.00055
}
```

## Troubleshooting

### Error: "WATSONX_API_KEY is required"

**Solution:** Set the environment variable:
```bash
export WATSONX_API_KEY="your-api-key"
```

### Error: "WATSONX_PROJECT_ID is required"

**Solution:** Set the environment variable:
```bash
export WATSONX_PROJECT_ID="your-project-id"
```

### Error: 401 Unauthorized

**Causes:**
1. Invalid API key
2. Expired API key
3. Incorrect project ID

**Solution:**
1. Verify API key in IBM Cloud Console
2. Regenerate if needed
3. Confirm project ID is correct

### Error: 404 Model Not Found

**Cause:** Granite model not available in your region

**Solution:**
1. Use US South region
2. Verify model access in watsonx.ai
3. Check model ID: `ibm/granite-4-0-h-small`

### Slow Response Times

**Optimize:**
1. Enable HTTP/2: Already configured in `watsonx_client.py`
2. Use connection pooling: Already configured
3. Reduce max_tokens if possible
4. Enable streaming for perceived performance

## Rollback Plan

If you need to revert to OpenRouter:

```bash
# Set environment variable
export USE_GRANITE_LLM=false

# Or remove the variable entirely (defaults to false)
unset USE_GRANITE_LLM

# Redeploy
firebase deploy --only functions
```

## Advanced Configuration

### Custom Model Parameters

Edit `watsonx_client.py` to add advanced Granite features:

```python
request_body = {
    "parameters": {
        "decoding_method": "greedy",  # or "sampling"
        "max_new_tokens": 400,
        "temperature": 0.6,
        "top_p": 1.0,
        "top_k": 50,
        "repetition_penalty": 1.0,

        # Granite-specific features
        "length_penalty": {"decay_factor": 2.5},
        "stop_sequences": ["User:", "\n\n\n"],
    }
}
```

### Enable Tool Calling

Granite 4.0 natively supports tool calling. Your marketing agent already has tools defined. Granite will automatically detect and use them.

**Tool format:**
```python
{
    "type": "function",
    "function": {
        "name": "search_kb",
        "description": "Search marketing knowledge base",
        "parameters": {
            "type": "object",
            "properties": {...}
        }
    }
}
```

### Streaming Optimization

For better UX, streaming is enabled by default. Granite streams tokens as they're generated.

**Adjust buffering:**
```python
# In cloud_run_main.py
SSE_MIN_INTERVAL_MS=40  # ~25fps
SSE_MAX_BUFFER_CHARS=220  # Buffer size
```

## Resources

- **IBM watsonx.ai Docs**: https://www.ibm.com/docs/en/watsonx-as-a-service
- **Granite Documentation**: https://www.ibm.com/granite/docs/models/granite
- **IBM Cloud Console**: https://cloud.ibm.com/
- **API Reference**: https://cloud.ibm.com/apidocs/watsonx-ai

## Support

For issues with:
- **IBM credentials**: Contact IBM Cloud support
- **Code integration**: Check logs in Google Cloud Console
- **Model behavior**: Review Granite documentation

---

**Next Steps:**
1. ✅ Get IBM Cloud API key
2. ✅ Create watsonx.ai project
3. ✅ Set environment variables
4. ✅ Deploy and test
5. ✅ Monitor performance
