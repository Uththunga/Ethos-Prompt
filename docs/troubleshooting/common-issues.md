# Troubleshooting Guide

This guide helps you resolve common issues you might encounter while using RAG Prompt Library.

## Quick Diagnostics

### System Status Check

Before troubleshooting, check these basics:

```bash
# Check if you can access the application
curl -I https://your-app-domain.com

# Check API connectivity
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.ragpromptlibrary.com/v1/health

# Check Firebase connection
# Look for any console errors in browser developer tools
```

### Common Error Patterns

| Error Type | Symptoms | Quick Fix |
|------------|----------|-----------|
| Authentication | "User not authenticated" | Re-login or refresh token |
| Network | Timeouts, connection errors | Check internet connection |
| Quota | "Quota exceeded" | Check usage limits |
| Validation | Form errors | Check required fields |

## Authentication Issues

### Problem: Cannot Sign In

**Symptoms:**
- "Invalid email or password" error
- Login form doesn't respond
- Redirected back to login page

**Solutions:**

1. **Check Credentials**
   ```
   ✓ Verify email address is correct
   ✓ Check password (case-sensitive)
   ✓ Try password reset if unsure
   ```

2. **Clear Browser Data**
   ```
   ✓ Clear cookies and local storage
   ✓ Disable browser extensions
   ✓ Try incognito/private mode
   ```

3. **Check Account Status**
   ```
   ✓ Verify email address (check spam folder)
   ✓ Ensure account isn't suspended
   ✓ Contact support if account locked
   ```

### Problem: Session Expires Frequently

**Symptoms:**
- Logged out unexpectedly
- "Session expired" messages
- Need to re-authenticate often

**Solutions:**

1. **Browser Settings**
   ```
   ✓ Enable cookies for the domain
   ✓ Check if "Block third-party cookies" is disabled
   ✓ Ensure local storage is enabled
   ```

2. **Network Issues**
   ```
   ✓ Check for unstable internet connection
   ✓ Verify firewall isn't blocking requests
   ✓ Try different network if possible
   ```

### Problem: Google Sign-In Not Working

**Symptoms:**
- Google sign-in popup doesn't appear
- "Popup blocked" error
- Google authentication fails

**Solutions:**

1. **Popup Settings**
   ```
   ✓ Allow popups for the domain
   ✓ Disable popup blockers
   ✓ Check browser popup settings
   ```

2. **Google Account Issues**
   ```
   ✓ Ensure Google account is active
   ✓ Check if 2FA is properly configured
   ✓ Try signing out of Google and back in
   ```

## Prompt Creation Issues

### Problem: Variables Not Working

**Symptoms:**
- Variables show as literal text `{{variable_name}}`
- Prompt execution ignores variable values
- Variable validation errors

**Solutions:**

1. **Syntax Check**
   ```
   ✓ Use correct syntax: {{variable_name}}
   ✓ No spaces inside braces: {{variable}} not {{ variable }}
   ✓ Use valid variable names (letters, numbers, underscores)
   ```

2. **Variable Definition**
   ```
   ✓ Ensure variables are defined in prompt settings
   ✓ Check variable names match exactly
   ✓ Verify required variables have values
   ```

3. **Common Mistakes**
   ```
   ❌ {{Variable Name}} (spaces not allowed)
   ❌ {variable} (single braces)
   ❌ {{variable-name}} (hyphens not allowed)
   ✅ {{variable_name}} (correct format)
   ```

### Problem: Prompt Execution Fails

**Symptoms:**
- "Execution failed" error
- No response from AI model
- Timeout errors

**Solutions:**

1. **API Configuration**
   ```
   ✓ Check API keys are valid and active
   ✓ Verify model availability
   ✓ Check quota and billing status
   ```

2. **Prompt Issues**
   ```
   ✓ Ensure prompt isn't too long (check token limits)
   ✓ Remove special characters that might cause issues
   ✓ Test with simpler prompt first
   ```

3. **Model Settings**
   ```
   ✓ Try different model (GPT-3.5 vs GPT-4)
   ✓ Adjust temperature settings
   ✓ Reduce max_tokens if hitting limits
   ```

## Document Upload Issues

### Problem: Document Upload Fails

**Symptoms:**
- "Upload failed" error
- File appears to upload but processing fails
- Supported file types rejected

**Solutions:**

1. **File Requirements**
   ```
   ✓ File size under 10MB
   ✓ Supported formats: PDF, TXT, DOCX, MD
   ✓ File not corrupted or password-protected
   ```

2. **Network Issues**
   ```
   ✓ Stable internet connection
   ✓ Try uploading smaller files first
   ✓ Check firewall/proxy settings
   ```

3. **File Content**
   ```
   ✓ Ensure file contains readable text
   ✓ Avoid heavily formatted documents
   ✓ Check for special characters or encoding issues
   ```

### Problem: Document Processing Stuck

**Symptoms:**
- Document shows "Processing..." indefinitely
- Processing progress doesn't advance
- Document never becomes "Ready"

**Solutions:**

1. **Wait and Retry**
   ```
   ✓ Large documents can take 5-10 minutes
   ✓ Refresh page to check current status
   ✓ Try re-uploading if stuck over 15 minutes
   ```

2. **Document Issues**
   ```
   ✓ Check if document is text-based (not scanned image)
   ✓ Ensure document isn't corrupted
   ✓ Try converting to different format
   ```

### Problem: RAG Not Finding Relevant Content

**Symptoms:**
- AI responses don't reference uploaded documents
- "No relevant information found" messages
- Poor quality responses despite good documents

**Solutions:**

1. **Search Optimization**
   ```
   ✓ Use specific, detailed queries
   ✓ Include key terms from your documents
   ✓ Try different phrasings of the same question
   ```

2. **Document Quality**
   ```
   ✓ Ensure documents are well-structured
   ✓ Check that content is relevant to queries
   ✓ Consider breaking large documents into smaller ones
   ```

## Performance Issues

### Problem: Slow Loading Times

**Symptoms:**
- Pages take long time to load
- Slow response to user interactions
- Timeouts during operations

**Solutions:**

1. **Browser Optimization**
   ```
   ✓ Clear browser cache and cookies
   ✓ Disable unnecessary browser extensions
   ✓ Close other tabs/applications
   ```

2. **Network Optimization**
   ```
   ✓ Check internet speed
   ✓ Try different network connection
   ✓ Use wired connection instead of WiFi
   ```

3. **Application Settings**
   ```
   ✓ Reduce number of prompts loaded at once
   ✓ Limit document upload sizes
   ✓ Use simpler AI models for faster responses
   ```

### Problem: High Memory Usage

**Symptoms:**
- Browser becomes slow or unresponsive
- "Out of memory" errors
- System performance degrades

**Solutions:**

1. **Browser Management**
   ```
   ✓ Restart browser regularly
   ✓ Close unused tabs
   ✓ Clear browser cache
   ```

2. **Usage Patterns**
   ```
   ✓ Avoid keeping many large documents open
   ✓ Process documents in smaller batches
   ✓ Log out when not actively using
   ```

## API and Integration Issues

### Problem: API Authentication Fails

**Symptoms:**
- "Invalid API key" errors
- 401 Unauthorized responses
- API calls rejected

**Solutions:**

1. **API Key Verification**
   ```
   ✓ Check API key is copied correctly
   ✓ Ensure no extra spaces or characters
   ✓ Verify key hasn't expired
   ```

2. **Permission Issues**
   ```
   ✓ Check API key has required permissions
   ✓ Verify account has access to requested features
   ✓ Ensure billing is up to date
   ```

### Problem: Rate Limiting

**Symptoms:**
- "Too many requests" errors
- 429 status codes
- Temporary API blocks

**Solutions:**

1. **Request Management**
   ```
   ✓ Implement exponential backoff
   ✓ Reduce request frequency
   ✓ Batch multiple operations
   ```

2. **Plan Upgrade**
   ```
   ✓ Check current rate limits
   ✓ Consider upgrading plan
   ✓ Contact support for higher limits
   ```

## Error Messages Reference

### Common Error Codes

| Code | Message | Meaning | Solution |
|------|---------|---------|----------|
| AUTH001 | User not authenticated | Session expired | Re-login |
| QUOTA001 | Quota exceeded | Usage limits reached | Check billing |
| VALID001 | Validation failed | Invalid input data | Check form fields |
| NETWORK001 | Connection timeout | Network issues | Check connection |
| UPLOAD001 | File upload failed | Upload error | Check file size/type |
| PROCESS001 | Processing failed | Document processing error | Try re-uploading |

### Firebase Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| auth/user-not-found | Account doesn't exist | Check email or sign up |
| auth/wrong-password | Incorrect password | Reset password |
| auth/too-many-requests | Rate limited | Wait and try again |
| auth/network-request-failed | Network error | Check connection |

## Getting Additional Help

### Before Contacting Support

1. **Gather Information**
   ```
   ✓ Error messages (exact text)
   ✓ Steps to reproduce the issue
   ✓ Browser and version
   ✓ Operating system
   ✓ Time when issue occurred
   ```

2. **Try Basic Troubleshooting**
   ```
   ✓ Refresh the page
   ✓ Clear browser cache
   ✓ Try different browser
   ✓ Check system status page
   ```

### Contact Options

- **Help Center**: Search existing articles and guides
- **Community Forum**: Ask questions and get help from other users
- **Support Ticket**: For technical issues requiring direct assistance
- **Live Chat**: Available during business hours for urgent issues

### Information to Include

When contacting support, please include:

```
- Account email address
- Detailed description of the issue
- Steps you've already tried
- Screenshots or error messages
- Browser and operating system details
- Time and date when issue occurred
```

## Preventive Measures

### Regular Maintenance

1. **Browser Hygiene**
   ```
   ✓ Clear cache weekly
   ✓ Update browser regularly
   ✓ Manage extensions
   ```

2. **Account Management**
   ```
   ✓ Monitor usage quotas
   ✓ Keep payment methods updated
   ✓ Review security settings
   ```

3. **Best Practices**
   ```
   ✓ Use strong, unique passwords
   ✓ Enable two-factor authentication
   ✓ Regular backup of important prompts
   ✓ Monitor system status updates
   ```

---

**Still having issues?** Check our [FAQ](faq.md) or [contact support](mailto:support@ragpromptlibrary.com) for personalized assistance.
