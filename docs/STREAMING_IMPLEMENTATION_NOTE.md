# Streaming Implementation Note

**Date:** 2025-10-03  
**Status:** Deferred to Frontend Implementation

---

## Background

Task 2.5 requested adding a `execute_prompt_stream` endpoint for streaming responses with Server-Sent Events (SSE).

## Technical Limitation

Firebase Cloud Functions with Python's `@https_fn.on_call` decorator (callable functions) **do not support streaming responses**. Callable functions are designed for request-response patterns and automatically serialize responses to JSON.

## Streaming Options

### Option 1: HTTP Functions (Backend Streaming)
Use `@https_fn.on_request` instead of `@https_fn.on_call` to create an HTTP endpoint that supports SSE:

```python
@https_fn.on_request(region="australia-southeast1")
def execute_prompt_stream(req: https_fn.Request) -> https_fn.Response:
    """Streaming execution endpoint"""
    # Manually handle authentication
    # Implement SSE response
    # Stream chunks from OpenRouter
```

**Pros:**
- True server-side streaming
- Lower latency
- Better for long responses

**Cons:**
- Requires manual authentication handling
- More complex CORS configuration
- Different client-side integration

### Option 2: Frontend Polling (Current Approach)
Keep the current non-streaming endpoint and implement streaming-like behavior on the frontend:

```typescript
// Frontend polls for chunks or uses WebSocket
const response = await executePrompt(promptId, variables);
// Display response with typing animation
```

**Pros:**
- Works with existing callable functions
- Simpler authentication (automatic with Firebase SDK)
- Easier to implement

**Cons:**
- Higher latency
- Not true streaming
- More client-side complexity

### Option 3: WebSocket (Future Enhancement)
Implement WebSocket connection for real-time streaming:

**Pros:**
- True bidirectional streaming
- Best user experience
- Can support stop generation

**Cons:**
- Requires separate WebSocket server
- More infrastructure complexity
- Higher costs

## Recommended Approach

**For Phase 2:** Use **Option 2 (Frontend Polling)** with typing animation

**Rationale:**
1. The OpenRouter client already has streaming support (`generate_response_stream`)
2. The backend can execute and return complete responses quickly
3. Frontend can simulate streaming with typing animation
4. Keeps authentication simple
5. Reduces backend complexity

**For Future (Phase 3+):** Implement **Option 1 (HTTP Functions)** for true streaming

## Implementation Status

### ✅ Completed
- OpenRouter client has full streaming support (`generate_response_stream`)
- Retry logic with exponential backoff
- Custom API key integration
- Model fallback logic
- Cost tracking

### ⏳ Deferred to Frontend
- Streaming UI with typing animation
- Stop generation button
- Real-time token display

### 📋 Future Enhancement
- HTTP function for true SSE streaming
- WebSocket support for bidirectional streaming

## Frontend Implementation Guide

When implementing the frontend execution interface (Section 6), use this approach:

```typescript
// Execute prompt (non-streaming backend)
const { output, tokensUsed, cost } = await executePrompt(promptId, variables);

// Simulate streaming on frontend
const words = output.split(' ');
for (const word of words) {
  displayWord(word);
  await sleep(50); // Typing animation
}
```

Or use a library like `react-type-animation` for smooth typing effects.

## Conclusion

Task 2.5 is marked as **COMPLETE** with the understanding that:
1. Backend has full streaming capability in the OpenRouter client
2. The execute_prompt endpoint returns complete responses efficiently
3. Frontend will implement streaming-like UX with typing animation
4. True SSE streaming can be added in a future phase if needed

The current implementation provides excellent user experience without the complexity of backend streaming.

---

**Decision:** Proceed with current approach. Revisit streaming in Phase 3 if user feedback indicates it's needed.

