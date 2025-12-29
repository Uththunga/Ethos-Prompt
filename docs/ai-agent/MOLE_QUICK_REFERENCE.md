# Molē AI Agent - Quick Reference Guide

## Overview

**Molē** (stylized as "molē") is EthosPrompt's context-aware AI assistant with dual expertise:
- **Marketing Expert**: Helps visitors on public pages
- **Prompt Engineering Expert**: Assists authenticated users in dashboard

---

## File Structure

```
Prompt-Library/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── marketing/
│       │   │   ├── FloatingMoleiconChat.tsx          # NEW: Enhanced floating button
│       │   │   ├── MarketingChatModal.tsx            # NEW: Marketing chat UI
│       │   │   └── ui/
│       │   │       └── Moleicon.tsx                  # EXISTING: WebGL icon
│       │   └── layout/
│       │       └── panels/
│       │           └── ChatPanel.tsx                 # EXISTING: Dashboard chat
│       ├── services/
│       │   ├── marketingChatService.ts               # NEW: Marketing agent API
│       │   └── promptLibraryChatService.ts           # NEW: Dashboard agent API
│       └── utils/
│           └── agentContext.ts                       # NEW: Context detection
│
└── functions/
    └── src/
        ├── ai_agent/                                 # NEW: Agent implementation
        │   ├── common/                               # Shared utilities
        │   │   ├── base_agent.py                     # Base agent class
        │   │   ├── openrouter_wrapper.py             # Unified LLM client
        │   │   ├── cache_manager.py                  # Response caching
        │   │   ├── cost_tracker.py                   # Usage tracking
        │   │   └── rate_limiter.py                   # Rate limiting
        │   │
        │   ├── marketing/                            # Marketing agent
        │   │   ├── marketing_agent.py                # Main agent
        │   │   ├── marketing_tools.py                # Agent tools
        │   │   ├── marketing_retriever.py            # RAG retrieval
        │   │   └── kb_processor.py                   # Knowledge base
        │   │
        │   └── prompt_library/                       # Dashboard agent
        │       ├── prompt_library_agent.py           # Main agent
        │       ├── prompt_library_tools.py           # Agent tools
        │       └── context_manager.py                # User context
        │
        └── api/
            ├── marketing_chat.py                     # NEW: Marketing endpoint
            └── prompt_library_chat.py                # NEW: Dashboard endpoint
```

---

## Key Components

### 1. Marketing Agent (Public-Facing)

**Purpose**: Help visitors learn about EthosPrompt services

**Capabilities**:
- Answer questions about services, pricing, features
- Search marketing knowledge base
- Provide pricing information
- Schedule demos
- Guide users to relevant pages

**Model**: `x-ai/grok-4-fast:free` (dev), `openai/gpt-4-turbo` (prod)

**Endpoint**: `marketing_chat` (Cloud Function)

**UI**: FloatingMoleicon → MarketingChatModal

---

### 2. Prompt Library Agent (Authenticated)

**Purpose**: Assist users with prompt engineering tasks

**Capabilities**:
- Create new prompts
- Execute prompts
- Search user's prompt library
- Analyze execution history
- Suggest prompt improvements
- Troubleshoot errors

**Model**: `openai/gpt-4-turbo` (better for code/technical tasks)

**Endpoint**: `prompt_library_chat` (Cloud Function, requires auth)

**UI**: RightPanel → ChatPanel (existing component)

---

## Quick Start Commands

### Development Setup

```bash
# 1. Install dependencies
cd functions
pip install langchain langchain-community langchain-openai

# 2. Set environment variables
export OPENROUTER_API_KEY="sk-or-v1-..."
export MARKETING_AGENT_MODEL="x-ai/grok-4-fast:free"

# 3. Build marketing knowledge base
python scripts/build_marketing_kb.py

# 4. Start emulators
firebase emulators:start

# 5. Run frontend
cd ../frontend
npm run dev
```

### Testing

```bash
# Unit tests
pytest tests/ai_agent/ -v

# Integration tests
pytest tests/ai_agent/ -v -m integration

# E2E tests
cd frontend
npm run test:e2e
```

### Deployment

```bash
# Deploy to staging
firebase use staging
firebase deploy --only functions:marketing_chat,functions:prompt_library_chat

# Deploy to production
firebase use production
firebase deploy --only functions:marketing_chat,functions:prompt_library_chat
```

---

## API Reference

### Marketing Chat Endpoint

```typescript
// Request
{
  message: string;
  conversationId?: string;
  pageContext: string;  // e.g., 'homepage', 'solutions_page'
}

// Response
{
  response: string;
  conversationId: string;
  sources: Array<{ title: string; url: string }>;
  metadata: {
    model: string;
    tokensUsed: number;
    responseTime: number;
  };
}
```

### Prompt Library Chat Endpoint

```typescript
// Request (requires authentication)
{
  message: string;
  conversationId?: string;
  pageContext: string;
  dashboardContext?: {
    selectedPromptId?: string;
    recentExecutions?: string[];
  };
}

// Response
{
  response: string;
  conversationId: string;
  actions?: Array<{
    type: 'create_prompt' | 'execute_prompt' | 'navigate';
    data: any;
  }>;
  suggestions?: string[];
  metadata: {
    model: string;
    tokensUsed: number;
    responseTime: number;
    toolCalls: Array<{ tool: string; result: string }>;
  };
}
```

---

## Configuration

### Environment Variables

```bash
# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-...

# Agent Models
MARKETING_AGENT_MODEL=x-ai/grok-4-fast:free  # or openai/gpt-4-turbo
PROMPT_LIBRARY_AGENT_MODEL=openai/gpt-4-turbo

# Agent Settings
AGENT_MAX_TOKENS=2000
AGENT_TEMPERATURE=0.7
AGENT_ENABLE_CACHING=true
AGENT_CACHE_TTL=3600

# Rate Limiting
AGENT_RATE_LIMIT_ANONYMOUS=10  # messages per hour
AGENT_RATE_LIMIT_AUTHENTICATED=100  # messages per hour

# Monitoring
AGENT_ENABLE_LOGGING=true
AGENT_LOG_LEVEL=INFO
```

### Firebase Config

```bash
firebase functions:config:set \
  openrouter.api_key="sk-or-v1-..." \
  marketing_agent.model="openai/gpt-4-turbo" \
  prompt_library_agent.model="openai/gpt-4-turbo" \
  agent.max_tokens="2000" \
  agent.temperature="0.7"
```

---

## Common Tasks

### Add New Tool to Marketing Agent

```python
# 1. Define tool in marketing_tools.py
async def my_new_tool(self, input: str) -> str:
    """Tool description for the agent"""
    # Implementation
    return result

# 2. Add to tools list in marketing_agent.py
Tool(
    name="my_new_tool",
    func=self.my_new_tool,
    description="Description for the agent"
)

# 3. Update system prompt to mention the tool

# 4. Write tests
@pytest.mark.asyncio
async def test_my_new_tool():
    agent = MarketingAgent(...)
    result = await agent.my_new_tool("test input")
    assert result is not None
```

### Update Knowledge Base

```bash
# 1. Update content in marketing pages
# 2. Re-run knowledge base builder
python scripts/build_marketing_kb.py

# 3. Verify indexing
python scripts/verify_kb.py

# 4. Deploy updated KB
firebase deploy --only firestore:indexes
```

### Monitor Agent Performance

```python
# Query agent usage
from google.cloud import firestore

db = firestore.Client()

# Get recent conversations
conversations = db.collection('agent_conversations') \
    .where('agentMode', '==', 'marketing') \
    .order_by('createdAt', direction=firestore.Query.DESCENDING) \
    .limit(100) \
    .stream()

# Calculate metrics
total_messages = 0
total_cost = 0
response_times = []

for conv in conversations:
    data = conv.to_dict()
    total_messages += len(data.get('messages', []))
    total_cost += data.get('metadata', {}).get('totalCost', 0)
    response_times.append(data.get('metadata', {}).get('averageResponseTime', 0))

print(f"Total messages: {total_messages}")
print(f"Total cost: ${total_cost:.2f}")
print(f"Avg response time: {sum(response_times) / len(response_times):.2f}s")
```

---

## Troubleshooting

### Agent Not Responding

1. Check Cloud Function logs:
   ```bash
   firebase functions:log --only marketing_chat
   ```

2. Verify OpenRouter API key:
   ```bash
   firebase functions:config:get
   ```

3. Test endpoint directly:
   ```bash
   curl -X POST https://australia-southeast1-react-app-000730.cloudfunctions.net/marketing_chat \
     -H "Content-Type: application/json" \
     -d '{"data": {"message": "Hello", "pageContext": "homepage"}}'
   ```

### Poor Response Quality

1. Check knowledge base indexing:
   ```python
   python scripts/verify_kb.py
   ```

2. Review system prompt:
   ```python
   # In marketing_agent.py
   print(agent._get_system_prompt())
   ```

3. Test retrieval:
   ```python
   results = await retriever.retrieve("pricing information")
   print(results)
   ```

### High Costs

1. Check usage:
   ```bash
   python scripts/analyze_agent_costs.py
   ```

2. Enable caching:
   ```python
   AGENT_ENABLE_CACHING=true
   ```

3. Switch to free model for testing:
   ```bash
   MARKETING_AGENT_MODEL=x-ai/grok-4-fast:free
   ```

### Rate Limiting Issues

1. Check rate limit settings:
   ```python
   # In rate_limiter.py
   limit = 100 if user_id else 10
   ```

2. View rate limit logs:
   ```bash
   firebase functions:log --only marketing_chat | grep "rate limit"
   ```

---

## Best Practices

### Prompt Engineering

1. **Be specific in system prompts**
   - Define personality clearly
   - List capabilities explicitly
   - Provide examples

2. **Use structured outputs**
   - Define Pydantic models for tool inputs
   - Validate outputs

3. **Cite sources**
   - Always include source metadata
   - Make sources clickable

### Performance

1. **Implement caching**
   - Cache common queries
   - Set appropriate TTL

2. **Optimize context**
   - Limit context tokens
   - Compress conversation history

3. **Use streaming**
   - Better perceived performance
   - Lower timeout risk

### Security

1. **Validate inputs**
   - Check message length
   - Sanitize user input
   - Validate tool parameters

2. **Rate limiting**
   - Different limits for anonymous vs. authenticated
   - Track by user ID and session ID

3. **Authentication**
   - Require auth for dashboard agent
   - Verify Firebase ID tokens

---

## Resources

- **LangChain Docs**: https://python.langchain.com/docs/
- **OpenRouter API**: https://openrouter.ai/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Project Docs**: `/docs/ai-agent/`

---

**Last Updated**: 2025-10-16  
**Version**: 1.0

