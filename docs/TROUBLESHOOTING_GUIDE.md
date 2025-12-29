# Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered in the RAG Prompt Library application.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Prompt Execution Errors](#prompt-execution-errors)
3. [Document Upload Problems](#document-upload-problems)
4. [RAG Context Issues](#rag-context-issues)
5. [Performance Problems](#performance-problems)
6. [Database Errors](#database-errors)
7. [API Integration Issues](#api-integration-issues)
8. [Deployment Issues](#deployment-issues)

---

## Authentication Issues

### Cannot Login

**Symptoms**: Login button doesn't work, error message displayed

**Possible Causes**:
- Invalid credentials
- Firebase Auth not initialized
- Network connectivity issues
- Browser blocking cookies

**Solutions**:

1. **Verify credentials**
   ```typescript
   // Check if email is verified
   const user = auth.currentUser;
   if (user && !user.emailVerified) {
     // Send verification email
     await sendEmailVerification(user);
   }
   ```

2. **Check Firebase Auth initialization**
   ```typescript
   // Ensure Firebase is initialized
   import { auth } from '@/config/firebase';
   console.log('Auth initialized:', !!auth);
   ```

3. **Clear browser cache and cookies**
   - Chrome: Settings > Privacy > Clear browsing data
   - Firefox: Settings > Privacy > Clear Data

4. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for Firebase Auth errors
   - Check network tab for failed requests

### Token Expired

**Symptoms**: "Token expired" error, forced logout

**Solutions**:

1. **Refresh token automatically**
   ```typescript
   // Token refresh is handled by Firebase SDK
   const user = auth.currentUser;
   if (user) {
     const token = await user.getIdToken(true); // Force refresh
   }
   ```

2. **Check token expiration**
   ```typescript
   const tokenResult = await user.getIdTokenResult();
   console.log('Token expires:', new Date(tokenResult.expirationTime));
   ```

### Session Not Persisting

**Symptoms**: User logged out after page refresh

**Solutions**:

1. **Check persistence setting**
   ```typescript
   import { setPersistence, browserLocalPersistence } from 'firebase/auth';
   await setPersistence(auth, browserLocalPersistence);
   ```

2. **Verify localStorage is enabled**
   ```javascript
   try {
     localStorage.setItem('test', 'test');
     localStorage.removeItem('test');
   } catch (e) {
     console.error('localStorage not available');
   }
   ```

---

## Prompt Execution Errors

### Execution Timeout

**Symptoms**: Execution takes too long, timeout error

**Possible Causes**:
- Model is slow or unavailable
- Large prompt or context
- Network issues
- Rate limiting

**Solutions**:

1. **Increase timeout**
   ```typescript
   const result = await executePrompt(promptId, variables, {
     timeout: 60000, // 60 seconds
   });
   ```

2. **Use faster model**
   - Switch to smaller model (e.g., llama-3.2-1b instead of llama-3.2-70b)
   - Use free models for testing

3. **Reduce context size**
   - Limit RAG chunks to top 5
   - Reduce max_tokens parameter

4. **Check OpenRouter status**
   - Visit https://openrouter.ai/status
   - Try different model provider

### Invalid Variables Error

**Symptoms**: "Missing required variable" or "Invalid variable format"

**Solutions**:

1. **Verify variable names match template**
   ```typescript
   // Template: "Hello {{name}}, welcome to {{place}}"
   const variables = {
     name: "John",
     place: "RAG Library"
   };
   ```

2. **Check for typos in variable names**
   - Variable names are case-sensitive
   - No spaces in variable names

3. **Validate variable values**
   ```typescript
   function validateVariables(variables: Record<string, string>) {
     for (const [key, value] of Object.entries(variables)) {
       if (!value || value.trim() === '') {
         throw new Error(`Variable ${key} is empty`);
       }
     }
   }
   ```

### Model Not Available

**Symptoms**: "Model not found" or "Model unavailable"

**Solutions**:

1. **Check model ID**
   - Verify model ID is correct
   - Check OpenRouter model list: https://openrouter.ai/models

2. **Use fallback model**
   ```typescript
   const models = [
     'meta-llama/llama-3.2-3b-instruct:free',
     'google/gemma-2-9b-it:free',
     'mistralai/mistral-7b-instruct:free'
   ];
   
   for (const model of models) {
     try {
       return await executeWithModel(model);
     } catch (error) {
       console.warn(`Model ${model} failed, trying next...`);
     }
   }
   ```

3. **Check API key configuration**
   ```bash
   firebase functions:config:get openrouter.api_key
   ```

---

## Document Upload Problems

### Upload Fails

**Symptoms**: Document upload fails, error message displayed

**Possible Causes**:
- File too large
- Unsupported file type
- Storage quota exceeded
- Network issues

**Solutions**:

1. **Check file size**
   ```typescript
   const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
   if (file.size > MAX_FILE_SIZE) {
     throw new Error('File too large');
   }
   ```

2. **Verify file type**
   ```typescript
   const ALLOWED_TYPES = ['application/pdf', 'text/plain', 'application/msword'];
   if (!ALLOWED_TYPES.includes(file.type)) {
     throw new Error('Unsupported file type');
   }
   ```

3. **Check Storage quota**
   - Visit Firebase Console > Storage
   - Check usage and limits

4. **Retry with exponential backoff**
   ```typescript
   async function uploadWithRetry(file: File, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await uploadFile(file);
       } catch (error) {
         if (i === maxRetries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
       }
     }
   }
   ```

### Document Processing Stuck

**Symptoms**: Document status remains "processing" indefinitely

**Solutions**:

1. **Check Cloud Function logs**
   ```bash
   firebase functions:log --only processDocument
   ```

2. **Manually trigger reprocessing**
   ```typescript
   await updateDoc(doc(db, 'rag_documents', docId), {
     status: 'pending',
     processingStartedAt: null
   });
   ```

3. **Check for processing errors**
   - Look for errors in Firestore document
   - Check Cloud Logging for function errors

---

## RAG Context Issues

### No Context Retrieved

**Symptoms**: RAG execution returns no context chunks

**Possible Causes**:
- No documents uploaded
- Documents not processed
- Query doesn't match document content
- Embedding generation failed

**Solutions**:

1. **Verify documents are processed**
   ```typescript
   const docs = await getDocs(
     query(collection(db, 'rag_documents'), 
     where('status', '==', 'ready'))
   );
   console.log('Ready documents:', docs.size);
   ```

2. **Check embedding generation**
   ```bash
   # Check function logs
   firebase functions:log --only generateEmbeddings
   ```

3. **Adjust similarity threshold**
   ```typescript
   const chunks = await retrieveChunks(query, {
     topK: 10,
     minSimilarity: 0.5 // Lower threshold
   });
   ```

4. **Try different query phrasing**
   - Use keywords from document
   - Rephrase question

### Irrelevant Context Retrieved

**Symptoms**: Retrieved chunks don't match query

**Solutions**:

1. **Increase similarity threshold**
   ```typescript
   const chunks = await retrieveChunks(query, {
     minSimilarity: 0.7 // Higher threshold
   });
   ```

2. **Use hybrid search**
   ```typescript
   const chunks = await hybridSearch(query, {
     semanticWeight: 0.7,
     keywordWeight: 0.3
   });
   ```

3. **Re-generate embeddings**
   - Delete and re-upload document
   - Trigger manual reprocessing

---

## Performance Problems

### Slow Page Load

**Symptoms**: Pages take >3 seconds to load

**Solutions**:

1. **Check bundle size**
   ```bash
   cd frontend
   npm run build
   ls -lh dist/assets/*.js
   ```

2. **Enable code splitting**
   ```typescript
   // Use React.lazy for route-based splitting
   const Dashboard = lazy(() => import('./pages/Dashboard'));
   ```

3. **Optimize images**
   - Use WebP format
   - Compress images
   - Use lazy loading

4. **Check network waterfall**
   - Open DevTools > Network
   - Look for slow requests
   - Check for blocking resources

### High Memory Usage

**Symptoms**: Browser tab crashes, "Out of memory" errors

**Solutions**:

1. **Limit data fetching**
   ```typescript
   // Use pagination
   const prompts = await getDocs(
     query(collection(db, 'prompts'), limit(20))
   );
   ```

2. **Clean up subscriptions**
   ```typescript
   useEffect(() => {
     const unsubscribe = onSnapshot(query, callback);
     return () => unsubscribe(); // Cleanup
   }, []);
   ```

3. **Use virtual scrolling**
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';
   ```

---

## Database Errors

### Permission Denied

**Symptoms**: "Missing or insufficient permissions" error

**Solutions**:

1. **Check Firestore rules**
   ```bash
   firebase firestore:rules:get
   ```

2. **Verify user authentication**
   ```typescript
   const user = auth.currentUser;
   if (!user) {
     throw new Error('User not authenticated');
   }
   ```

3. **Check document ownership**
   ```typescript
   const doc = await getDoc(docRef);
   if (doc.data()?.userId !== user.uid) {
     throw new Error('Not authorized');
   }
   ```

### Query Requires Index

**Symptoms**: "The query requires an index" error

**Solutions**:

1. **Click the link in error message**
   - Firebase provides direct link to create index

2. **Manually create index**
   - Add to `firestore.indexes.json`
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "prompts",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "userId", "order": "ASCENDING" },
           { "fieldPath": "createdAt", "order": "DESCENDING" }
         ]
       }
     ]
   }
   ```

3. **Deploy indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

---

## API Integration Issues

### OpenRouter API Errors

**Symptoms**: API calls fail, rate limit errors

**Solutions**:

1. **Check API key**
   ```bash
   firebase functions:config:get openrouter.api_key
   ```

2. **Handle rate limiting**
   ```typescript
   if (error.status === 429) {
     const retryAfter = error.headers['retry-after'];
     await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
     return retry();
   }
   ```

3. **Use free models**
   - Switch to models ending with `:free`
   - No rate limits on free models

---

## Deployment Issues

See [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) for detailed deployment troubleshooting.

---

## Getting Help

If you can't resolve the issue:

1. **Check logs**
   - Browser console (F12)
   - Firebase Console > Functions > Logs
   - Cloud Logging

2. **Search documentation**
   - Firebase docs: https://firebase.google.com/docs
   - OpenRouter docs: https://openrouter.ai/docs

3. **Contact support**
   - Firebase Support
   - OpenRouter Support
   - Project maintainers

---

**Last Updated**: 2025-10-05  
**Next Review**: 2026-01-05

