# Sentry Error Tracking Setup Guide

**Last Updated**: 2025-10-02  
**Status**: ✅ Implemented and Tested

---

## Overview

Sentry error tracking has been integrated into the RAG Prompt Library backend to provide real-time error monitoring, alerting, and debugging capabilities in production environments.

### Features

- ✅ **Automatic Error Capture**: All unhandled exceptions are automatically captured
- ✅ **Contextual Information**: Errors include user context, request data, and custom metadata
- ✅ **Sensitive Data Filtering**: API keys, tokens, and passwords are automatically redacted
- ✅ **Performance Monitoring**: 10% of transactions are sampled for performance insights
- ✅ **Logging Integration**: ERROR-level logs are sent to Sentry as events
- ✅ **Environment Separation**: Development, staging, and production errors are tracked separately

---

## Setup Instructions

### Step 1: Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (or use existing account)
3. Create a new project:
   - Platform: **Python**
   - Project name: **rag-prompt-library-backend**

### Step 2: Get Your DSN

1. Navigate to **Settings** → **Projects** → **rag-prompt-library-backend**
2. Go to **Client Keys (DSN)**
3. Copy the DSN (format: `https://[key]@[organization].ingest.sentry.io/[project-id]`)

### Step 3: Configure Environment Variable

#### For Local Development

Create or update `functions/.env`:

```bash
SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id
ENVIRONMENT=development
```

#### For Firebase Functions (Production)

Set the environment variable using Firebase CLI:

```bash
firebase functions:config:set sentry.dsn="https://your-key@your-org.ingest.sentry.io/your-project-id"
firebase functions:config:set environment="production"
```

Or use `.env` file for Firebase Functions:

```bash
cd functions
echo "SENTRY_DSN=https://your-key@your-org.ingest.sentry.io/your-project-id" >> .env
echo "ENVIRONMENT=production" >> .env
```

### Step 4: Deploy

Deploy your functions to apply the configuration:

```bash
firebase deploy --only functions
```

### Step 5: Verify

1. Trigger a test error (see Testing section below)
2. Check your Sentry dashboard at [https://sentry.io](https://sentry.io)
3. Verify the error appears with correct environment tag

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | No | None | Sentry Data Source Name (DSN) |
| `ENVIRONMENT` | No | `production` | Environment name (development, staging, production) |

### Sentry Configuration

The Sentry SDK is configured in `functions/src/error_handling.py`:

```python
sentry_sdk.init(
    dsn=sentry_dsn,
    environment=os.getenv('ENVIRONMENT', 'production'),
    traces_sample_rate=0.1,  # 10% of transactions
    integrations=[
        LoggingIntegration(
            level=logging.INFO,  # Breadcrumbs
            event_level=logging.ERROR  # Events
        )
    ],
    before_send=_filter_sensitive_data
)
```

### Sensitive Data Filtering

The following data is automatically redacted before sending to Sentry:

**Headers**:
- `authorization`
- `cookie`
- `x-api-key`

**Environment Variables**:
- `SENTRY_DSN`
- `OPENROUTER_API_KEY`
- `GOOGLE_API_KEY`
- `JWT_SECRET`

---

## Testing

### Manual Test

Create a test script `functions/test_sentry_manual.py`:

```python
"""
Manual test for Sentry integration
Run this to verify Sentry is capturing errors
"""
import os
from src.error_handling import init_sentry, handle_error, APIError

# Set test DSN (replace with your actual DSN)
os.environ['SENTRY_DSN'] = 'https://your-key@your-org.ingest.sentry.io/your-project-id'
os.environ['ENVIRONMENT'] = 'test'

# Initialize Sentry
init_sentry()

# Trigger a test error
try:
    error = APIError("Test error from manual test", status_code=500)
    handle_error(error, context={'test': True, 'user_id': 'test-user'})
    print("✅ Test error sent to Sentry")
    print("Check your Sentry dashboard: https://sentry.io")
except Exception as e:
    print(f"❌ Error: {e}")
```

Run the test:

```bash
cd functions
python test_sentry_manual.py
```

### Automated Tests

Run the Sentry integration tests:

```bash
cd functions
pytest tests/test_sentry_integration.py -v
```

**Expected Output**:
```
tests/test_sentry_integration.py::TestSentryIntegration::test_init_sentry_without_dsn PASSED
tests/test_sentry_integration.py::TestSentryIntegration::test_init_sentry_with_dsn PASSED
tests/test_sentry_integration.py::TestSentryIntegration::test_handle_error_captures_to_sentry PASSED
tests/test_sentry_integration.py::TestSentryIntegration::test_handle_error_without_sentry PASSED
tests/test_sentry_integration.py::TestSentryIntegration::test_sensitive_data_filtering PASSED

5 passed in 0.94s
```

---

## Usage

### Automatic Error Capture

All errors handled by `handle_error()` are automatically sent to Sentry:

```python
from src.error_handling import handle_error, APIError

try:
    # Your code here
    response = call_external_api()
except Exception as e:
    # Automatically captured by Sentry
    error_dict = handle_error(e, context={'user_id': user_id})
    return error_dict
```

### Manual Error Capture

You can also manually capture errors:

```python
import sentry_sdk

try:
    # Your code here
    risky_operation()
except Exception as e:
    # Add custom context
    sentry_sdk.set_context("custom_context", {
        "operation": "risky_operation",
        "parameters": {"param1": "value1"}
    })
    
    # Capture the exception
    sentry_sdk.capture_exception(e)
    
    # Re-raise or handle
    raise
```

### Adding Breadcrumbs

Add breadcrumbs to track the sequence of events leading to an error:

```python
import sentry_sdk

sentry_sdk.add_breadcrumb(
    category='auth',
    message='User logged in',
    level='info',
    data={'user_id': user_id}
)
```

---

## Monitoring

### Sentry Dashboard

Access your Sentry dashboard at [https://sentry.io](https://sentry.io) to:

- View real-time errors
- Track error frequency and trends
- Analyze stack traces
- View user impact
- Set up alerts and notifications

### Key Metrics to Monitor

1. **Error Rate**: Errors per minute/hour
2. **Affected Users**: Number of unique users experiencing errors
3. **Error Types**: Most common error categories
4. **Performance**: Transaction duration and throughput
5. **Release Health**: Error rates by deployment version

### Alerts

Configure alerts in Sentry:

1. Go to **Alerts** → **Create Alert Rule**
2. Set conditions (e.g., "Error count > 10 in 5 minutes")
3. Configure notifications (email, Slack, PagerDuty)

---

## Troubleshooting

### Errors Not Appearing in Sentry

**Check 1**: Verify DSN is set
```bash
echo $SENTRY_DSN
```

**Check 2**: Check logs for initialization message
```bash
firebase functions:log --only execute_prompt
# Look for: "Sentry initialized successfully"
```

**Check 3**: Verify sentry-sdk is installed
```bash
cd functions
pip list | grep sentry
# Should show: sentry-sdk 2.39.0 (or higher)
```

**Check 4**: Test with manual script
```bash
python test_sentry_manual.py
```

### Sensitive Data Leaking

If sensitive data is appearing in Sentry:

1. Update `_filter_sensitive_data()` in `functions/src/error_handling.py`
2. Add the sensitive field to the filter list
3. Redeploy functions

### Too Many Events

If you're hitting Sentry rate limits:

1. Reduce `traces_sample_rate` (currently 0.1 = 10%)
2. Add filters to ignore specific errors
3. Upgrade your Sentry plan

---

## Best Practices

1. **Use Environment Tags**: Always set `ENVIRONMENT` to separate dev/staging/prod errors
2. **Add Context**: Include user_id, request_id, and relevant metadata with errors
3. **Filter Sensitive Data**: Never send API keys, passwords, or PII to Sentry
4. **Set Up Alerts**: Configure alerts for critical errors
5. **Review Regularly**: Check Sentry dashboard weekly to identify trends
6. **Release Tracking**: Tag errors with release versions for better tracking

---

## Cost Considerations

### Sentry Free Tier

- **5,000 errors/month** included
- **10,000 performance units/month** included
- **1 user** included
- **30 days data retention**

### Optimization Tips

1. **Sample Transactions**: Use `traces_sample_rate=0.1` (10%) instead of 1.0 (100%)
2. **Filter Noise**: Ignore expected errors (e.g., validation errors)
3. **Use Breadcrumbs**: Instead of logging everything, use breadcrumbs for context
4. **Aggregate Similar Errors**: Sentry automatically groups similar errors

---

## Acceptance Criteria ✅

- [x] Sentry SDK installed (`sentry-sdk>=1.40.0`)
- [x] `init_sentry()` function created in `error_handling.py`
- [x] Sentry initialized in `main.py` at module load
- [x] `handle_error()` captures exceptions with `sentry_sdk.capture_exception()`
- [x] Sensitive data filtering implemented
- [x] Environment variable configuration documented
- [x] Test suite created and passing (5/5 tests)
- [x] Setup guide created (this document)

---

## References

- [Sentry Python SDK Documentation](https://docs.sentry.io/platforms/python/)
- [Sentry Firebase Integration](https://docs.sentry.io/platforms/python/integrations/firebase/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)

---

**Status**: ✅ **P0 BLOCKER RESOLVED**  
**Completion Date**: 2025-10-02  
**Test Results**: 5/5 tests passing  
**Production Ready**: Yes

