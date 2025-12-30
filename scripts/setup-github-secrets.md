# GitHub Secrets Setup Guide

## RAG Prompt Library - Required Secrets Configuration

_Updated: 2025-07-18_

---

## 🔑 **Required GitHub Repository Secrets**

Go to your GitHub repository: `Settings > Secrets and variables > Actions > Repository secrets`

### **1. Firebase Configuration Secrets**

```bash
# Firebase Web App Configuration
VITE_FIREBASE_API_KEY = AIzaSyDJWjw2e8FayU3CvIWyGXXFAqDCTFN5CJs
VITE_FIREBASE_AUTH_DOMAIN = rag-prompt-library.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = rag-prompt-library
VITE_FIREBASE_STORAGE_BUCKET = rag-prompt-library.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 743998930129
VITE_FIREBASE_APP_ID = 1:743998930129:web:69dd61394ed81598cd99f0
```

### **2. Firebase Service Account (CRITICAL)**

```bash
# Firebase Admin SDK Service Account JSON
FIREBASE_SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "rag-prompt-library",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": "-----BEGIN PRIVATE KEY-----\n[YOUR_PRIVATE_KEY_CONTENT]\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@rag-prompt-library.iam.gserviceaccount.com",
  "client_id": "117234567890123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40rag-prompt-library.iam.gserviceaccount.com"
}
```

### **3. OpenRouter API Keys (UPDATED)**

```bash
# Prompt Generation API Key
OPENROUTER_API_KEY = sk-or-v1-[YOUR_OPENROUTER_API_KEY_HERE]

# RAG Processing API Key
OPENROUTER_API_KEY_RAG = sk-or-v1-[YOUR_OPENROUTER_RAG_API_KEY_HERE]
```

---

## 🚨 **CRITICAL SECURITY NOTES**

### **Service Account Key Security:**

1. **NEVER commit the service account JSON file to your repository**
2. **The file has been removed from your repository for security**
3. **Copy the JSON content from your Firebase Console:**
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate new private key"
   - Copy the entire JSON content
   - Paste it as the value for `FIREBASE_SERVICE_ACCOUNT` secret

### **API Key Security:**

- All API keys are stored as GitHub secrets
- They are never exposed in logs or code
- Environment variables are used in all configurations

---

## ✅ **Verification Steps**

After setting up all secrets:

1. **Check Secret Names:** Ensure exact spelling and case sensitivity
2. **Test Deployment:** Push to `develop` branch to test staging deployment
3. **Monitor Logs:** Check GitHub Actions logs for any authentication errors
4. **Verify Functions:** Test Firebase Functions after deployment

---

## 🔧 **Troubleshooting**

### **Common Issues:**

- **Authentication Failed:** Check `FIREBASE_SERVICE_ACCOUNT` JSON format
- **API Key Invalid:** Verify OpenRouter API keys are active
- **Build Failures:** Ensure all `VITE_*` variables are set correctly

### **Testing Locally:**

- Use the `functions/.env` file for local development
- Never commit `.env` files to version control
- Test functions locally before deploying

---

## 📋 **Next Steps After Setup**

1. **Commit and Push:** Your changes to trigger the workflow
2. **Monitor Deployment:** Watch GitHub Actions for successful deployment
3. **Test Application:** Verify all features work with new API keys
4. **Update Documentation:** Keep this guide updated with any changes
