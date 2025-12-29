# Firebase Blaze Plan Deployment Checklist
## RAG Prompt Library - Production Deployment Guide

---

## 🔐 **1. GitHub Secrets Configuration**

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

### **Required Secrets:**
```bash
FIREBASE_SERVICE_ACCOUNT    # JSON content of your service account key
OPENROUTER_API_KEY         # Your OpenRouter API key
OPENAI_API_KEY            # Your OpenAI API key (for embeddings)
```

### **Service Account Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `rag-prompt-library`
3. Go to Project Settings > Service Accounts
4. Generate new private key
5. Copy the entire JSON content to `FIREBASE_SERVICE_ACCOUNT` secret

---

## 🚀 **2. Pre-Deployment Steps**

### **Local Environment Setup:**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set project
firebase use rag-prompt-library

# Install function dependencies
cd functions
pip install -r requirements.txt
cd ..
```

### **Configuration Verification:**
- ✅ Verify `firebase.json` has updated functions configuration
- ✅ Check `.firebaserc` points to correct project ID
- ✅ Ensure `firestore.rules` includes new collections
- ✅ Confirm `storage.rules` has updated file size limits

---

## 📦 **3. Deployment Commands**

### **Full Deployment:**
```bash
# Deploy all services
firebase deploy

# Or deploy specific services
firebase deploy --only hosting,functions,firestore,storage
```

### **Functions Only:**
```bash
firebase deploy --only functions
```

### **Firestore Rules & Indexes:**
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 🔍 **4. Post-Deployment Verification**

### **Function Testing:**
1. **Test Prompt Generation:**
   ```bash
   # Call generate_prompt function
   curl -X POST https://us-central1-rag-prompt-library.cloudfunctions.net/generate_prompt \
     -H "Content-Type: application/json" \
     -d '{"data": {"purpose": "test", "industry": "tech"}}'
   ```

2. **Test RAG Execution:**
   - Upload a test document
   - Execute prompt with RAG enabled
   - Verify context retrieval

### **Analytics Verification:**
1. Check Firestore for new collections:
   - `analytics`
   - `execution_logs`
   - `embeddings`

2. Verify data is being written correctly

### **Performance Monitoring:**
1. **Firebase Console:**
   - Functions > Usage tab
   - Monitor execution times
   - Check error rates

2. **Cost Monitoring:**
   - Firebase Console > Usage and billing
   - Set up budget alerts

---

## ⚠️ **5. Common Issues & Solutions**

### **Function Deployment Errors:**
```bash
# If deployment fails, check logs
firebase functions:log

# Clear cache and retry
firebase functions:delete --force
firebase deploy --only functions
```

### **API Key Issues:**
```bash
# Set environment variables for functions
firebase functions:config:set openrouter.api_key="your-key"
firebase functions:config:set openai.api_key="your-key"

# Deploy configuration
firebase deploy --only functions
```

### **Firestore Permission Errors:**
- Verify security rules are deployed
- Check user authentication in frontend
- Ensure proper field names in rules

---

## 📊 **6. Monitoring & Maintenance**

### **Daily Checks:**
- [ ] Function execution success rate > 95%
- [ ] Average response time < 5 seconds
- [ ] No critical errors in logs
- [ ] Cost within expected range

### **Weekly Reviews:**
- [ ] Analytics data quality
- [ ] User engagement metrics
- [ ] Storage usage trends
- [ ] Function performance optimization

### **Monthly Tasks:**
- [ ] Review and optimize function memory allocation
- [ ] Clean up old analytics data (automated)
- [ ] Update dependencies
- [ ] Security audit

---

## 🎯 **7. Success Metrics**

### **Performance Targets:**
- **Function Cold Start:** < 3 seconds
- **Prompt Generation:** < 5 seconds
- **RAG Execution:** < 10 seconds
- **Document Processing:** < 30 seconds

### **Cost Targets:**
- **Functions:** < $50/month for 10K executions
- **Firestore:** < $20/month for 1M reads
- **Storage:** < $10/month for 100GB

### **Quality Targets:**
- **Uptime:** > 99.9%
- **Error Rate:** < 1%
- **User Satisfaction:** > 4.5/5

---

## 🔧 **8. Rollback Plan**

### **If Issues Occur:**
1. **Immediate Rollback:**
   ```bash
   # Revert to previous function version
   firebase functions:delete generate_prompt
   firebase functions:delete execute_prompt_with_rag
   
   # Deploy previous version
   git checkout previous-working-commit
   firebase deploy --only functions
   ```

2. **Partial Rollback:**
   ```bash
   # Disable specific features
   firebase functions:config:unset openrouter.api_key
   firebase deploy --only functions
   ```

3. **Emergency Contacts:**
   - Firebase Support: [Firebase Console > Support]
   - OpenRouter Support: support@openrouter.ai
   - Team Lead: [Your contact info]

---

## ✅ **9. Final Checklist**

Before marking deployment as complete:

- [ ] All functions deployed successfully
- [ ] Frontend can call new functions
- [ ] Analytics data is being collected
- [ ] RAG document processing works
- [ ] External API integrations functional
- [ ] Error monitoring configured
- [ ] Cost alerts set up
- [ ] Documentation updated
- [ ] Team notified of new features

---

## 🎉 **Deployment Complete!**

Your RAG Prompt Library is now running on Firebase Blaze Plan with enhanced capabilities:

- ✅ AI-powered prompt generation
- ✅ RAG document processing
- ✅ Advanced analytics
- ✅ Scalable architecture
- ✅ Production monitoring

**Next Steps:** Monitor performance, gather user feedback, and iterate on features based on usage patterns.
