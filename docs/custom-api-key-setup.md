# Custom API Key Setup Guide
**RAG Prompt Library - Using Your Own OpenRouter API Key**  
**Last Updated:** 2025-10-03

---

## 📖 Table of Contents

1. [Introduction](#introduction)
2. [Why Use a Custom API Key?](#why-use-a-custom-api-key)
3. [Getting an OpenRouter API Key](#getting-an-openrouter-api-key)
4. [Adding Your API Key](#adding-your-api-key)
5. [Using Paid Models](#using-paid-models)
6. [Security & Privacy](#security--privacy)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

The RAG Prompt Library provides **12 free models** that work without any API key. However, you can add your own OpenRouter API key to:

- Access paid models (GPT-4, Claude 3.5 Sonnet, etc.)
- Increase rate limits
- Get priority access
- Use your own credits

---

## Why Use a Custom API Key?

### Free Models (No API Key Needed)
✅ 12 high-quality models  
✅ Zero cost  
✅ Production-ready  
✅ Agent-capable models  
✅ No setup required  

### Paid Models (Custom API Key Required)
✅ Access to GPT-4, Claude, etc.  
✅ Higher quality for some tasks  
✅ Larger context windows  
✅ Priority access  
✅ Your own usage limits  

### When to Use Custom API Key?

**Use Free Models When:**
- Learning and experimentation
- Cost is a concern
- Building agents (5 agent-capable free models)
- High-volume use cases
- Free models meet your needs

**Use Custom API Key When:**
- Need specific paid models
- Require highest quality
- Need very large context (>2M tokens)
- Have specific compliance requirements
- Want dedicated resources

---

## Getting an OpenRouter API Key

### Step 1: Create OpenRouter Account

1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Click "Sign Up" or "Get Started"
3. Create account with email or OAuth
4. Verify your email address

### Step 2: Add Credits (Optional)

1. Go to [OpenRouter Credits](https://openrouter.ai/credits)
2. Click "Add Credits"
3. Choose amount ($5, $10, $20, etc.)
4. Complete payment
5. Credits appear in your account

**Note:** Some free models work without credits!

### Step 3: Generate API Key

1. Go to [OpenRouter Keys](https://openrouter.ai/keys)
2. Click "Create New Key"
3. Give it a name (e.g., "RAG Prompt Library")
4. Set permissions (optional)
5. Click "Create"
6. **Copy the API key** (you won't see it again!)

**Example API Key Format:**
```
sk-or-v1-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd
```

---

## Adding Your API Key

### Method 1: Through the UI (Recommended)

1. **Open RAG Prompt Library**
2. **Go to Settings** → API Keys
3. **Click "Add Custom API Key"**
4. **Paste your OpenRouter API key**
5. **Click "Validate Key"** to test
6. **Click "Save"**

Your key is encrypted and stored securely in Firestore.

### Method 2: Environment Variable (Development)

For local development:

```bash
# .env file
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Method 3: Configuration File (Advanced)

```python
# config.py
OPENROUTER_CONFIG = {
    "api_key": "sk-or-v1-your-key-here",
    "is_custom_key": True,
    "user_id": "your-user-id"
}
```

---

## Using Paid Models

### Step 1: Add Custom API Key

Follow the steps above to add your OpenRouter API key.

### Step 2: Select Paid Model

1. **Go to Prompt Execution**
2. **Click Model Selector**
3. **Filter by "Paid Models"**
4. **Select desired model:**
   - GPT-4 Turbo
   - Claude 3.5 Sonnet
   - Gemini 1.5 Pro
   - etc.

### Step 3: Execute Prompt

1. **Enter your prompt**
2. **Click "Execute"**
3. **View results**
4. **Check cost** in execution history

### Cost Tracking

The application tracks:
- ✅ Tokens used (input + output)
- ✅ Cost per execution
- ✅ Total cost
- ✅ Cost savings (free vs paid)

**Example Cost Display:**
```
Model: GPT-4 Turbo
Tokens: 1,250 (1,000 input + 250 output)
Cost: $0.0325
  Input: $0.0100 (1,000 tokens × $0.01/1K)
  Output: $0.0225 (250 tokens × $0.09/1K)
```

---

## Security & Privacy

### How We Protect Your API Key

1. **Encryption at Rest**
   - Keys encrypted with Cloud KMS
   - Stored in Firestore with encryption
   - Never stored in plain text

2. **Encryption in Transit**
   - HTTPS/TLS for all communications
   - Secure WebSocket connections
   - No key exposure in logs

3. **Access Control**
   - Keys tied to your user account
   - Only you can access your keys
   - Admin cannot see your keys

4. **Key Management**
   - Rotate keys anytime
   - Revoke keys instantly
   - Multiple keys supported

### Best Practices

✅ **Never share your API key**  
✅ **Rotate keys regularly** (every 90 days)  
✅ **Use separate keys** for dev/prod  
✅ **Monitor usage** regularly  
✅ **Revoke compromised keys** immediately  
✅ **Set spending limits** on OpenRouter  

### What We DON'T Do

❌ We don't store keys in plain text  
❌ We don't log API keys  
❌ We don't share keys with third parties  
❌ We don't use your keys for our purposes  
❌ We don't have access to your OpenRouter account  

---

## Troubleshooting

### API Key Not Working

**Problem:** "Invalid API key" error

**Solutions:**
1. Verify key is copied correctly (no spaces)
2. Check key hasn't been revoked
3. Ensure key has proper permissions
4. Try generating a new key

### Insufficient Credits

**Problem:** "Insufficient credits" error

**Solutions:**
1. Add credits to OpenRouter account
2. Check current balance
3. Switch to free model
4. Wait for credits to refresh

### Rate Limit Exceeded

**Problem:** "Rate limit exceeded" error

**Solutions:**
1. Wait a few minutes
2. Upgrade OpenRouter plan
3. Use free models (no rate limits)
4. Implement request throttling

### Model Not Available

**Problem:** "Model not available" error

**Solutions:**
1. Check model is still supported
2. Verify you have access to model
3. Try alternative model
4. Check OpenRouter status page

### Key Validation Failed

**Problem:** Key validation fails

**Solutions:**
1. Test key directly on OpenRouter
2. Check key permissions
3. Verify network connectivity
4. Try different model for testing

---

## FAQ

### Q: Do I need an API key to use the app?
**A:** No! 12 free models work without any API key.

### Q: How much do paid models cost?
**A:** Varies by model. GPT-4 Turbo: ~$0.01-0.03 per request. Claude 3.5 Sonnet: ~$0.003-0.015 per request.

### Q: Can I use multiple API keys?
**A:** Yes! Add multiple keys and switch between them.

### Q: Is my API key safe?
**A:** Yes! Keys are encrypted and never exposed.

### Q: Can I remove my API key?
**A:** Yes! Go to Settings → API Keys → Delete.

### Q: What happens if I run out of credits?
**A:** Paid models stop working. Free models continue working.

### Q: Can I share my API key?
**A:** No! Never share your API key with anyone.

### Q: How do I check my usage?
**A:** Go to Analytics → Usage to see detailed breakdown.

---

## Cost Comparison

### Free Models (No API Key)
```
Prompt Executions: Unlimited
Cost per Request: $0.00
Monthly Cost: $0.00
Best For: Most use cases, agents, high-volume
```

### Paid Models (Custom API Key)
```
GPT-4 Turbo:
  Cost per Request: ~$0.01-0.03
  Monthly Cost (1000 requests): ~$10-30
  Best For: Highest quality, complex reasoning

Claude 3.5 Sonnet:
  Cost per Request: ~$0.003-0.015
  Monthly Cost (1000 requests): ~$3-15
  Best For: Long documents, analysis

Gemini 1.5 Pro:
  Cost per Request: ~$0.001-0.005
  Monthly Cost (1000 requests): ~$1-5
  Best For: Multimodal, cost-effective
```

---

## Additional Resources

- **Free Models Guide:** [free-models-guide.md](./free-models-guide.md)
- **Agent Creation Guide:** [agent-creation-guide.md](./agent-creation-guide.md)
- **OpenRouter Docs:** https://openrouter.ai/docs
- **OpenRouter Pricing:** https://openrouter.ai/models

---

## Support

**Need help?**
- Check troubleshooting section above
- Review OpenRouter documentation
- Contact support through the app

---

**Remember:** Free models are powerful and work great for most use cases. Only add a custom API key if you specifically need paid models!

