# Firebase Functions Deployment Guide

## Prerequisites

1. **Firebase CLI installed**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase login**:
   ```bash
   firebase login
   ```

3. **Python 3.11** installed on your system

## Step-by-Step Deployment

### 1. Configure Environment Variables

Run the configuration script to set up Firebase Functions environment variables:

```bash
# Make the script executable (Linux/Mac)
chmod +x configure-firebase-env.sh

# Run the configuration script
./configure-firebase-env.sh
```

**Or manually set environment variables:**

```bash
# Set OpenRouter API Key
firebase functions:config:set openrouter.api_key="REDACTED_API_KEY"

# Set Google API Key  
firebase functions:config:set google.api_key="AIzaSyCXVU58BoDu5hwa4Ppz3R8tV3GpWmWEq7g"

# Set default model
firebase functions:config:set openrouter.model="nvidia/llama-3.1-nemotron-ultra-253b-v1:free"
```

### 2. Install Python Dependencies

```bash
cd functions
pip install -r requirements.txt
cd ..
```

### 3. Deploy Functions

Run the deployment script:

```bash
# Make the script executable (Linux/Mac)
chmod +x deploy-functions.sh

# Run the deployment script
./deploy-functions.sh
```

**Or deploy manually:**

```bash
firebase deploy --only functions
```

### 4. Verify Deployment

After deployment, verify the functions are working:

1. **Check Firebase Console**: Go to Firebase Console > Functions
2. **Test OpenRouter connection**: Use the test button in your frontend
3. **Execute a prompt**: Try running a prompt through the frontend

## Deployed Functions

The following functions will be deployed to `australia-southeast1` region:

- `execute_prompt` - Main prompt execution with AI integration
- `test_openrouter_connection` - Test OpenRouter API connection  
- `execute_prompt_http` - HTTP endpoint for CORS bypass
- `validate_template` - Template validation
- `get_usage_stats` - User usage statistics
- `get_system_status` - System health status
- `test_provider` - Test AI provider connections
- `ai_chat` - AI chat functionality
- `rag_chat` - RAG-enabled chat
- `upload_document` - Document upload for RAG
- `search_documents` - Document search

## Function URLs

After deployment, your functions will be available at:
```
https://australia-southeast1-[PROJECT-ID].cloudfunctions.net/[FUNCTION-NAME]
```

## Troubleshooting

### Common Issues

1. **Environment variables not set**:
   ```bash
   firebase functions:config:get
   ```

2. **Python dependency issues**:
   ```bash
   cd functions
   pip install -r requirements.txt --upgrade
   ```

3. **Function timeout**:
   - Check function logs: `firebase functions:log`
   - Increase timeout in function configuration

4. **CORS issues**:
   - Use the `execute_prompt_http` endpoint
   - Check CORS configuration in functions

### Monitoring

- **Function logs**: `firebase functions:log`
- **Firebase Console**: Monitor function performance and errors
- **Frontend console**: Check for API call errors

## Next Steps

After successful deployment:

1. Test AI integration through the frontend
2. Monitor function performance and costs
3. Set up alerts for function failures
4. Configure rate limiting if needed
