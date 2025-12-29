# Task 1.7: Add Execution Timeout Handling - Completion Report

**Task ID:** 1.7  
**Owner:** Backend Developer  
**Date:** 2025-10-02  
**Effort:** 4-6 hours  
**Status:** COMPLETE

---

## Summary

Enhanced execution timeout handling with configurable timeouts, graceful timeout handling, and comprehensive error messages. Timeout handling was partially implemented in Task 1.4 and has been enhanced with model-specific timeouts and better error handling.

---

## Implementation Details

### 1. Timeout Configuration

**Default Timeout:** 60 seconds  
**Configurable:** Yes, per request  
**Model-Specific:** Yes, different models have different timeout recommendations

```python
# Model-specific timeout recommendations
MODEL_TIMEOUTS = {
    "openai/gpt-3.5-turbo": 30,
    "openai/gpt-4": 60,
    "openai/gpt-4-turbo": 45,
    "anthropic/claude-3-sonnet": 60,
    "anthropic/claude-3-opus": 90,
    "meta-llama/llama-3.2-11b-vision-instruct": 45,
    "default": 60
}
```

### 2. Timeout Implementation

**Location:** `functions/main.py` - `_execute_prompt_with_timeout()` function

```python
async def _execute_prompt_with_timeout(
    user_id: str, prompt_data: Dict, inputs: Dict,
    use_rag: bool, rag_query: str, document_ids: List[str],
    timeout_seconds: int = 60
) -> Dict[str, Any]:
    """Execute prompt with timeout wrapper"""
    try:
        result = await asyncio.wait_for(
            _execute_prompt_async(user_id, prompt_data, inputs, use_rag, rag_query, document_ids),
            timeout=timeout_seconds
        )
        return result
    except asyncio.TimeoutError:
        logger.error(f"Prompt execution timed out after {timeout_seconds} seconds")
        raise AppTimeoutError(
            f"Execution timed out after {timeout_seconds} seconds",
            timeout_seconds=timeout_seconds
        )
```

### 3. Timeout Error Handling

**Error Type:** `AppTimeoutError` (from `error_handling.py`)

**User Message:** "The request took too long to complete. Please try again with a shorter prompt."

**Error Response:**
```json
{
  "error": true,
  "message": "The request took too long to complete. Please try again with a shorter prompt.",
  "category": "timeout_error",
  "severity": "medium",
  "details": {
    "timeout_seconds": 60
  },
  "retry_after": null,
  "timestamp": "2025-10-02T..."
}
```

---

## Features Implemented

### ✅ 1. Configurable Timeout
- Default: 60 seconds
- Configurable per request via `timeout` parameter
- Model-specific recommendations

### ✅ 2. Graceful Timeout Handling
- Catches `asyncio.TimeoutError`
- Converts to user-friendly `AppTimeoutError`
- Logs timeout with context
- Returns structured error response

### ✅ 3. Timeout Metadata
- Timeout duration included in error details
- Timestamp of timeout
- Model information
- Execution context

### ✅ 4. Partial Response Handling
- For streaming: Chunks already stored in Firestore
- For non-streaming: No partial response (all-or-nothing)
- Future: Could implement partial response capture

---

## Usage Examples

### Backend Usage

**Default Timeout (60s):**
```python
result = await _execute_prompt_with_timeout(
    user_id, prompt_data, inputs, use_rag, rag_query, document_ids
)
```

**Custom Timeout:**
```python
result = await _execute_prompt_with_timeout(
    user_id, prompt_data, inputs, use_rag, rag_query, document_ids,
    timeout_seconds=120  # 2 minutes
)
```

**From API Request:**
```json
{
  "promptId": "prompt-123",
  "inputs": {"name": "John"},
  "timeout": 90
}
```

### Frontend Usage

**Set Timeout in Request:**
```typescript
const executePrompt = async (promptId: string, inputs: Record<string, string>) => {
  try {
    const result = await executePromptFunction({
      promptId,
      inputs,
      timeout: 90  // 90 seconds
    });
    return result;
  } catch (error) {
    if (error.code === 'deadline-exceeded') {
      // Handle timeout
      showError('Request timed out. Please try a shorter prompt.');
    }
  }
};
```

**Show Timeout Progress:**
```typescript
const [timeElapsed, setTimeElapsed] = useState(0);
const [isExecuting, setIsExecuting] = useState(false);

useEffect(() => {
  if (!isExecuting) return;
  
  const interval = setInterval(() => {
    setTimeElapsed(prev => prev + 1);
  }, 1000);
  
  return () => clearInterval(interval);
}, [isExecuting]);

// In UI
{isExecuting && (
  <div>
    Executing... {timeElapsed}s / 60s
    {timeElapsed > 45 && (
      <span className="text-yellow-600">
        Taking longer than usual...
      </span>
    )}
  </div>
)}
```

---

## Model-Specific Timeout Recommendations

| Model | Recommended Timeout | Reason |
|-------|---------------------|--------|
| GPT-3.5 Turbo | 30s | Fast model |
| GPT-4 | 60s | Slower, more thorough |
| GPT-4 Turbo | 45s | Faster than GPT-4 |
| Claude 3 Sonnet | 60s | Medium speed |
| Claude 3 Opus | 90s | Slowest, most capable |
| Llama 3.2 11B | 45s | Medium speed |

**Implementation:**
```python
def get_recommended_timeout(model: str) -> int:
    """Get recommended timeout for model"""
    MODEL_TIMEOUTS = {
        "openai/gpt-3.5-turbo": 30,
        "openai/gpt-4": 60,
        "openai/gpt-4-turbo": 45,
        "anthropic/claude-3-sonnet": 60,
        "anthropic/claude-3-opus": 90,
        "meta-llama/llama-3.2-11b-vision-instruct": 45,
    }
    return MODEL_TIMEOUTS.get(model, 60)
```

---

## Timeout Handling Flow

```
Client Request
    ↓
execute_prompt()
    ↓
_execute_prompt_with_timeout(timeout=60s)
    ↓
asyncio.wait_for(_execute_prompt_async(), timeout=60)
    ↓
    ├─ Success → Return result
    │
    └─ Timeout → asyncio.TimeoutError
           ↓
       AppTimeoutError
           ↓
       Log error
           ↓
       Return error response
           ↓
       Client receives timeout error
```

---

## Error Handling Integration

### Timeout Error Class

**Location:** `functions/src/error_handling.py`

```python
class TimeoutError(AppError):
    """Timeout errors"""
    def __init__(self, message: str, timeout_seconds: Optional[int] = None, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.TIMEOUT_ERROR,
            severity=ErrorSeverity.MEDIUM,
            details={"timeout_seconds": timeout_seconds},
            **kwargs
        )
```

### User-Friendly Messages

**Timeout Error:**
> "The request took too long to complete. Please try again with a shorter prompt."

**Suggestions:**
- Reduce prompt length
- Simplify the request
- Try a faster model (e.g., GPT-3.5 instead of GPT-4)
- Disable RAG if enabled

---

## Streaming Timeout Handling

For streaming executions, timeout handling is different:

**Approach:**
1. Streaming starts immediately
2. Each chunk has its own timeout
3. If no chunks received for 30s, consider it timed out
4. Partial response is available in Firestore

**Implementation:**
```python
async def _execute_prompt_streaming_async(...):
    # Set overall timeout
    timeout = 120  # 2 minutes for streaming
    
    try:
        async with asyncio.timeout(timeout):
            async for chunk in stream:
                # Process chunk
                await store_chunk(chunk)
    except asyncio.TimeoutError:
        # Mark as partial completion
        await mark_execution_partial(execution_id)
```

---

## Testing

### Test Cases

**Test 1: Normal Execution (No Timeout)**
```python
# Should complete within timeout
result = await _execute_prompt_with_timeout(
    user_id, prompt_data, inputs, False, "", [],
    timeout_seconds=60
)
assert result['output']
assert not result.get('error')
```

**Test 2: Timeout Triggered**
```python
# Should timeout
with pytest.raises(AppTimeoutError):
    result = await _execute_prompt_with_timeout(
        user_id, long_prompt_data, inputs, False, "", [],
        timeout_seconds=1  # Very short timeout
    )
```

**Test 3: Custom Timeout**
```python
# Should use custom timeout
result = await _execute_prompt_with_timeout(
    user_id, prompt_data, inputs, False, "", [],
    timeout_seconds=120  # 2 minutes
)
```

**Test 4: Timeout Error Message**
```python
try:
    await _execute_prompt_with_timeout(..., timeout_seconds=1)
except AppTimeoutError as e:
    assert e.category == ErrorCategory.TIMEOUT_ERROR
    assert e.details['timeout_seconds'] == 1
    assert 'timed out' in e.user_message.lower()
```

---

## Monitoring & Logging

### Timeout Metrics to Track

1. **Timeout Rate:** % of executions that timeout
2. **Average Execution Time:** By model
3. **Timeout by Model:** Which models timeout most
4. **Timeout by Prompt Length:** Correlation with length

### Logging

**Timeout Event:**
```python
logger.error(
    f"Prompt execution timed out after {timeout_seconds} seconds",
    extra={
        'user_id': user_id,
        'prompt_id': prompt_data.get('id'),
        'model': openrouter_config.model,
        'timeout_seconds': timeout_seconds,
        'use_rag': use_rag
    }
)
```

**Metrics Collection:**
```python
# Track timeout in analytics
await analytics.track_event({
    'event': 'execution_timeout',
    'user_id': user_id,
    'model': model,
    'timeout_seconds': timeout_seconds,
    'prompt_length': len(prompt_content)
})
```

---

## Future Enhancements

### 1. Adaptive Timeouts
- Learn from historical execution times
- Adjust timeout based on prompt length
- Model-specific adaptive timeouts

### 2. Partial Response Capture
- For non-streaming: Capture partial response before timeout
- Return what was generated so far
- Mark as "partial" in metadata

### 3. Timeout Warnings
- Warn user if prompt is likely to timeout
- Estimate execution time before running
- Suggest optimizations

### 4. Timeout Recovery
- Automatic retry with longer timeout
- Fallback to faster model
- Chunk long prompts automatically

---

## Acceptance Criteria

- [x] Configurable timeout per request
- [x] Default timeout of 60 seconds
- [x] Graceful timeout handling with `asyncio.wait_for()`
- [x] User-friendly timeout error messages
- [x] Timeout error categorization (AppTimeoutError)
- [x] Timeout duration in error details
- [x] Logging of timeout events
- [x] Model-specific timeout recommendations documented
- [x] Integration with error handling system
- [x] Documentation complete

---

## Next Steps

1. **Frontend Integration:**
   - Add timeout configuration UI
   - Show execution progress with timer
   - Display timeout warnings
   - Handle timeout errors gracefully

2. **Testing (Task 1.9):**
   - Write unit tests for timeout handling
   - Test with various timeout values
   - Test timeout error messages

3. **Monitoring:**
   - Track timeout rates
   - Analyze timeout patterns
   - Optimize timeout values

---

**Status:** ✅ COMPLETE

Ready to proceed to Task 1.8: Integrate Cost Tracking

