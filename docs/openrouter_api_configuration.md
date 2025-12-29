# OpenRouter API Configuration Guide
## RAG Prompt Library - API Keys & Model Setup

*Configuration Date: July 2025*
*Version: 1.0*

---

## 🔑 **API Keys Configuration**

### **For AI Prompt Generation:**
- **Environment Variable:** `OPENROUTER_API_KEY`
- **API Key:** `REDACTED_API_KEY`
- **Model:** `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- **Usage:** Used by `generate_prompt` function for AI-optimized prompt creation

### **For RAG Processing & Embeddings:**
- **Environment Variable:** `OPENROUTER_API_KEY_RAG`
- **API Key:** `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`
- **Model:** `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- **Usage:** Used by `execute_prompt_with_rag` and `process_uploaded_document` functions

---

## 🚀 **Implementation Steps**

### **Step 1: Add GitHub Secrets**

Go to your GitHub repository: `Settings > Secrets and variables > Actions`

Add the following repository secrets:

```bash
# For prompt generation
OPENROUTER_API_KEY = REDACTED_API_KEY

# For RAG processing
OPENROUTER_API_KEY_RAG = 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

# Firebase service account (your existing key)
FIREBASE_SERVICE_ACCOUNT = [Your Firebase service account JSON]
```

### **Step 2: Configure Firebase Functions Environment**

Set environment variables for local development and production:

```bash
# For local development (.env file in functions directory)
OPENROUTER_API_KEY=REDACTED_API_KEY
OPENROUTER_API_KEY_RAG=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

# For production (Firebase Functions config)
firebase functions:config:set openrouter.api_key="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"
firebase functions:config:set openrouter.api_key_rag="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"
```

### **Step 3: Deploy Updated Functions**

```bash
# Deploy functions with new configuration
firebase deploy --only functions

# Or deploy everything
firebase deploy
```

---

## 🔧 **Function Configuration Details**

### **Updated Functions:**

#### **1. generate_prompt Function:**
- **Model:** `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- **API Key:** Uses `OPENROUTER_API_KEY`
- **Purpose:** AI-powered prompt generation
- **Max Tokens:** 1000
- **Temperature:** 0.7

#### **2. execute_prompt_with_rag Function:**
- **Model:** `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- **API Key:** Uses `OPENROUTER_API_KEY_RAG` (fallback to main key)
- **Purpose:** RAG-enhanced prompt execution
- **Max Tokens:** 2000
- **Temperature:** 0.7

#### **3. process_uploaded_document Function:**
- **Model:** `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- **API Key:** Uses `OPENROUTER_API_KEY_RAG`
- **Purpose:** Document processing and embedding generation
- **Trigger:** Firestore document creation in `rag_documents` collection

---

## 🧪 **Testing Configuration**

### **Test Prompt Generation:**
```bash
# Using Firebase CLI
firebase functions:shell

# In the shell, test the function
generate_prompt({
  data: {
    purpose: "Create a marketing email",
    industry: "Technology",
    useCase: "Product launch",
    complexity: "medium"
  }
})
```

### **Test RAG Execution:**
```bash
# Test RAG functionality
execute_prompt_with_rag({
  data: {
    promptId: "test-prompt-id",
    inputs: {
      user_input: "Tell me about our product features",
      context: "Product documentation context"
    },
    useRag: true
  }
})
```

---

## 📊 **Model Specifications**

### **NVIDIA Llama 3.1 Nemotron Ultra 253B:**
- **Provider:** NVIDIA via OpenRouter
- **Model Size:** 253 billion parameters
- **Context Length:** 128,000 tokens
- **Cost:** Free tier available
- **Capabilities:**
  - Advanced text generation
  - Complex reasoning
  - Multi-turn conversations
  - Code generation
  - RAG-optimized responses

### **API Endpoints:**
- **Base URL:** `https://openrouter.ai/api/v1/chat/completions`
- **Authentication:** Bearer token
- **Rate Limits:** As per OpenRouter free tier limits
- **Timeout:** 60 seconds for RAG, 30 seconds for prompt generation

---

## 🔒 **Security Best Practices**

### **API Key Management:**
1. **Never commit API keys** to version control
2. **Use environment variables** for all deployments
3. **Rotate keys regularly** (recommended: every 90 days)
4. **Monitor usage** through OpenRouter dashboard
5. **Set up alerts** for unusual activity

### **Access Control:**
1. **Restrict API key access** to necessary team members only
2. **Use separate keys** for different environments (dev/staging/prod)
3. **Implement logging** for all API calls
4. **Monitor costs** and set budget alerts

---

## 📈 **Monitoring & Analytics**

### **Function Performance:**
- Monitor execution times in Firebase Console
- Track API call success rates
- Monitor token usage and costs
- Set up alerts for failures

### **OpenRouter Dashboard:**
- Track API usage and costs
- Monitor rate limit usage
- Review model performance metrics
- Set up billing alerts

---

## 🚨 **Troubleshooting**

### **Common Issues:**

#### **API Key Not Working:**
```bash
# Check environment variables
firebase functions:config:get

# Verify secrets in GitHub
# Go to repository Settings > Secrets and variables > Actions
```

#### **Model Not Found Error:**
- Verify model name: `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- Check OpenRouter model availability
- Ensure API key has access to the model

#### **Rate Limit Exceeded:**
- Monitor usage in OpenRouter dashboard
- Implement exponential backoff in functions
- Consider upgrading to paid tier if needed

#### **Function Timeout:**
- Increase timeout limits in firebase.json
- Optimize prompt length and complexity
- Implement request batching for large operations

---

## ✅ **Verification Checklist**

Before deployment, ensure:

- [ ] GitHub secrets are configured correctly
- [ ] Firebase Functions environment variables are set
- [ ] Model names are updated in code
- [ ] API keys are valid and active
- [ ] Functions deploy successfully
- [ ] Test calls return expected responses
- [ ] Error handling works properly
- [ ] Monitoring is configured
- [ ] Cost alerts are set up

---

## 📞 **Support Contacts**

- **OpenRouter Support:** [OpenRouter Documentation](https://openrouter.ai/docs)
- **Firebase Support:** [Firebase Console Support](https://console.firebase.google.com/support)
- **NVIDIA Model Info:** [NVIDIA AI Foundation Models](https://www.nvidia.com/en-us/ai-data-science/foundation-models/)

Your RAG Prompt Library is now configured with NVIDIA Llama 3.1 Nemotron Ultra 253B for enhanced AI capabilities! 🚀
