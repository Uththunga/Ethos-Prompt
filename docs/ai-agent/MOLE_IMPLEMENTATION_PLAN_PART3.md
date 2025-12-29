# Molē AI Agent - Implementation Plan (Part 3)

*Continued from MOLE_IMPLEMENTATION_PLAN_PART2.md*

---

## Phase 3: Cross-Phase Infrastructure & Context Switching

**Estimated Effort**: 40-50 hours (1-1.25 weeks)

### 3.1 Context Switching Logic (12 hours)

#### Automatic Mode Detection

```typescript
// frontend/src/services/moleAgentService.ts
import { detectAgentMode, getPageContext } from '@/utils/agentContext';
import { auth } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

export class MoleAgentService {
  private marketingChatFn = httpsCallable(functions, 'marketing_chat');
  private promptLibraryChatFn = httpsCallable(functions, 'prompt_library_chat');
  
  async sendMessage(message: string, conversationId?: string): Promise<AgentResponse> {
    const pathname = window.location.pathname;
    const mode = detectAgentMode(pathname);
    const pageContext = getPageContext(pathname);
    const user = auth.currentUser;
    
    // Route to appropriate agent based on mode
    if (mode === 'marketing') {
      return this.sendMarketingMessage(message, conversationId, pageContext);
    } else {
      // Dashboard mode - requires authentication
      if (!user) {
        throw new Error('Authentication required for dashboard agent');
      }
      return this.sendPromptLibraryMessage(message, conversationId, pageContext);
    }
  }
  
  private async sendMarketingMessage(
    message: string,
    conversationId?: string,
    pageContext?: string
  ): Promise<AgentResponse> {
    const result = await this.marketingChatFn({
      message,
      conversationId,
      pageContext
    });
    
    return result.data as AgentResponse;
  }
  
  private async sendPromptLibraryMessage(
    message: string,
    conversationId?: string,
    pageContext?: string
  ): Promise<AgentResponse> {
    const result = await this.promptLibraryChatFn({
      message,
      conversationId,
      pageContext,
      dashboardContext: this.getDashboardContext()
    });
    
    return result.data as AgentResponse;
  }
  
  private getDashboardContext(): DashboardContext {
    // Extract current dashboard context
    const pathname = window.location.pathname;
    
    return {
      currentPage: pathname,
      selectedPromptId: this.getSelectedPromptId(),
      recentExecutions: this.getRecentExecutions(),
      userPreferences: this.getUserPreferences()
    };
  }
}
```

#### Smooth Transition Messaging

```typescript
// frontend/src/components/agent/ModeTransitionNotice.tsx
import React from 'react';
import { Info } from 'lucide-react';

interface ModeTransitionNoticeProps {
  previousMode: 'marketing' | 'dashboard';
  currentMode: 'marketing' | 'dashboard';
}

export const ModeTransitionNotice: React.FC<ModeTransitionNoticeProps> = ({
  previousMode,
  currentMode
}) => {
  if (previousMode === currentMode) return null;
  
  const message = currentMode === 'dashboard'
    ? "👋 Welcome to your dashboard! I can now help you create prompts, analyze executions, and manage your library."
    : "👋 I'm now in marketing mode. Ask me about EthosPrompt's services, pricing, and features!";
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-start gap-2">
      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-900">{message}</p>
    </div>
  );
};
```

#### Conversation History Handling

```python
# functions/src/ai_agent/conversation_manager.py
from typing import Optional, List
from datetime import datetime, timezone

class ConversationManager:
    def __init__(self, db):
        self.db = db
    
    async def get_or_create_conversation(
        self,
        conversation_id: Optional[str],
        user_id: Optional[str],
        agent_mode: str,
        page_context: str
    ) -> str:
        """
        Get existing conversation or create new one
        Handles mode switching gracefully
        """
        if conversation_id:
            # Check if conversation exists and mode matches
            conv_ref = self.db.collection('agent_conversations').document(conversation_id)
            conv_doc = await conv_ref.get()
            
            if conv_doc.exists:
                conv_data = conv_doc.to_dict()
                
                # If mode changed, create new conversation
                if conv_data.get('agentMode') != agent_mode:
                    return await self._create_new_conversation(
                        user_id, agent_mode, page_context,
                        previous_conversation_id=conversation_id
                    )
                
                return conversation_id
        
        # Create new conversation
        return await self._create_new_conversation(user_id, agent_mode, page_context)
    
    async def _create_new_conversation(
        self,
        user_id: Optional[str],
        agent_mode: str,
        page_context: str,
        previous_conversation_id: Optional[str] = None
    ) -> str:
        """Create a new conversation"""
        conv_ref = self.db.collection('agent_conversations').document()
        
        await conv_ref.set({
            'conversationId': conv_ref.id,
            'userId': user_id,
            'agentMode': agent_mode,
            'pageContext': page_context,
            'messages': [],
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'status': 'active',
            'previousConversationId': previous_conversation_id,
            'metadata': {
                'userAgent': None,  # Set from request
                'referrer': None
            }
        })
        
        return conv_ref.id
```

**Deliverables**:
- [ ] Context switching logic implemented
- [ ] Mode transition UI components
- [ ] Conversation manager
- [ ] Cross-mode conversation handling
- [ ] Testing for mode switches

---

### 3.2 Shared Infrastructure (16 hours)

#### Common LangChain Utilities

```python
# functions/src/ai_agent/common/base_agent.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from langchain.agents import AgentExecutor
from langchain.memory import ConversationBufferMemory

class BaseAgent(ABC):
    """Base class for all Molē agents"""
    
    def __init__(self, llm, db, user_id: Optional[str] = None):
        self.llm = llm
        self.db = db
        self.user_id = user_id
        self.executor: Optional[AgentExecutor] = None
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
    
    @abstractmethod
    def _create_tools(self) -> List:
        """Create agent-specific tools"""
        pass
    
    @abstractmethod
    def _get_system_prompt(self) -> str:
        """Get agent-specific system prompt"""
        pass
    
    async def chat(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """Send a message and get response"""
        if not self.executor:
            raise RuntimeError("Agent not initialized")
        
        # Add context to prompt if provided
        if context:
            message = self._enhance_message_with_context(message, context)
        
        # Execute agent
        result = await self.executor.arun(input=message)
        
        return result
    
    async def chat_stream(self, message: str, context: Optional[Dict[str, Any]] = None):
        """Send a message and stream response"""
        # Streaming implementation
        pass
    
    def _enhance_message_with_context(self, message: str, context: Dict[str, Any]) -> str:
        """Add context information to the message"""
        context_str = "\n".join([f"{k}: {v}" for k, v in context.items()])
        return f"Context:\n{context_str}\n\nUser message: {message}"
```

#### Unified OpenRouter Client

```python
# functions/src/ai_agent/common/openrouter_wrapper.py
from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from typing import Optional

class UnifiedOpenRouterClient:
    """Unified client for all agent interactions"""
    
    def __init__(self, api_key: str, default_model: str = "x-ai/grok-4-fast:free"):
        self.api_key = api_key
        self.default_model = default_model
        self._cost_tracker = CostTracker()
    
    async def generate(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        stream: bool = False,
        user_id: Optional[str] = None
    ):
        """Generate response with automatic cost tracking"""
        config = OpenRouterConfig(
            api_key=self.api_key,
            model=model or self.default_model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream
        )
        
        async with OpenRouterClient(config) as client:
            if stream:
                async for chunk in client.generate_response_stream(prompt=prompt):
                    yield chunk
            else:
                response = await client.generate_response(prompt=prompt)
                
                # Track cost
                await self._cost_tracker.track(
                    user_id=user_id,
                    model=config.model,
                    tokens=response.usage['total_tokens'],
                    cost=response.cost_estimate
                )
                
                return response
```

#### Conversation Storage Schema

```typescript
// Unified schema for all agent conversations
interface AgentConversation {
  conversationId: string;
  userId?: string;  // null for anonymous marketing users
  sessionId: string;
  agentMode: 'marketing' | 'prompt_library';
  
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Timestamp;
    metadata?: {
      sources?: Array<{ title: string; url: string }>;
      toolCalls?: Array<{ tool: string; input: any; output: any }>;
      model?: string;
      tokensUsed?: number;
      cost?: number;
    };
  }>;
  
  context: {
    currentPage: string;
    pageContext: string;
    dashboardContext?: {
      selectedPromptId?: string;
      recentExecutions?: string[];
    };
  };
  
  metadata: {
    userAgent: string;
    referrer?: string;
    totalMessages: number;
    totalCost: number;
    averageResponseTime: number;
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastMessageAt: Timestamp;
  status: 'active' | 'archived' | 'deleted';
  previousConversationId?: string;  // For mode switches
}
```

**Deliverables**:
- [ ] Base agent class
- [ ] Unified OpenRouter client
- [ ] Shared utilities (cost tracking, logging, error handling)
- [ ] Common conversation storage
- [ ] Shared configuration management

---

### 3.3 Performance & Cost Optimization (12 hours)

#### Caching Strategy

```python
# functions/src/ai_agent/common/cache_manager.py
from src.cache.firebase_cache import FirebaseCache
from typing import Optional
import hashlib

class AgentCacheManager:
    def __init__(self, cache: FirebaseCache):
        self.cache = cache
    
    async def get_cached_response(
        self,
        query: str,
        agent_mode: str,
        page_context: str
    ) -> Optional[str]:
        """Get cached response for common queries"""
        cache_key = self._generate_cache_key(query, agent_mode, page_context)
        
        cached = await self.cache.get(cache_key)
        if cached:
            return cached.get('response')
        
        return None
    
    async def cache_response(
        self,
        query: str,
        response: str,
        agent_mode: str,
        page_context: str,
        ttl: int = 3600  # 1 hour
    ):
        """Cache response for future use"""
        cache_key = self._generate_cache_key(query, agent_mode, page_context)
        
        await self.cache.set(
            cache_key,
            {'response': response, 'query': query},
            ttl=ttl
        )
    
    def _generate_cache_key(self, query: str, agent_mode: str, page_context: str) -> str:
        """Generate cache key from query and context"""
        content = f"{agent_mode}:{page_context}:{query.lower().strip()}"
        return f"agent_cache:{hashlib.md5(content.encode()).hexdigest()}"
```

#### Response Streaming

```python
# functions/src/ai_agent/common/streaming.py
from typing import AsyncIterator
import json

async def stream_agent_response(
    agent,
    message: str,
    context: dict
) -> AsyncIterator[str]:
    """Stream agent response in chunks"""
    
    # Send initial metadata
    yield json.dumps({
        'type': 'metadata',
        'data': {'status': 'processing', 'timestamp': datetime.now().isoformat()}
    }) + '\n'
    
    # Stream response chunks
    async for chunk in agent.chat_stream(message, context):
        yield json.dumps({
            'type': 'content',
            'data': {'chunk': chunk}
        }) + '\n'
    
    # Send completion metadata
    yield json.dumps({
        'type': 'complete',
        'data': {'status': 'done', 'timestamp': datetime.now().isoformat()}
    }) + '\n'
```

#### Token Usage Optimization

```python
# functions/src/ai_agent/common/token_optimizer.py
from langchain.text_splitter import TokenTextSplitter

class TokenOptimizer:
    def __init__(self, max_context_tokens: int = 4000):
        self.max_context_tokens = max_context_tokens
        self.splitter = TokenTextSplitter(chunk_size=500, chunk_overlap=50)
    
    def optimize_context(self, context_documents: List[str]) -> str:
        """Optimize context to fit within token limit"""
        # Concatenate documents
        full_context = "\n\n".join(context_documents)
        
        # Estimate tokens (rough: 1 token ≈ 4 characters)
        estimated_tokens = len(full_context) // 4
        
        if estimated_tokens <= self.max_context_tokens:
            return full_context
        
        # Truncate to fit
        max_chars = self.max_context_tokens * 4
        return full_context[:max_chars] + "\n\n[Context truncated...]"
    
    def compress_conversation_history(self, messages: List[dict]) -> List[dict]:
        """Compress old messages to save tokens"""
        if len(messages) <= 10:
            return messages
        
        # Keep first 2 and last 8 messages
        # Summarize middle messages
        recent = messages[-8:]
        old = messages[:-8]
        
        summary = {
            'role': 'system',
            'content': f"[Previous conversation summary: {len(old)} messages exchanged]"
        }
        
        return [messages[0], summary] + recent
```

#### Usage Limits

```python
# functions/src/ai_agent/common/rate_limiter.py
from datetime import datetime, timedelta

class AgentRateLimiter:
    def __init__(self, db):
        self.db = db
    
    async def check_rate_limit(
        self,
        user_id: Optional[str],
        session_id: str,
        agent_mode: str
    ) -> tuple[bool, Optional[str]]:
        """
        Check if user/session has exceeded rate limits
        
        Returns: (allowed, error_message)
        """
        # Anonymous users: 10 messages per hour
        # Authenticated users: 100 messages per hour
        limit = 100 if user_id else 10
        window = timedelta(hours=1)
        
        # Get recent messages
        cutoff = datetime.now() - window
        
        query = self.db.collection('agent_conversations')
        if user_id:
            query = query.where('userId', '==', user_id)
        else:
            query = query.where('sessionId', '==', session_id)
        
        query = query.where('agentMode', '==', agent_mode)
        query = query.where('lastMessageAt', '>=', cutoff)
        
        conversations = await query.get()
        
        total_messages = sum(
            len(conv.to_dict().get('messages', []))
            for conv in conversations
        )
        
        if total_messages >= limit:
            return False, f"Rate limit exceeded. Please try again in {window.total_seconds() // 60} minutes."
        
        return True, None
```

**Deliverables**:
- [ ] Caching implementation
- [ ] Streaming support
- [ ] Token optimization
- [ ] Rate limiting
- [ ] Cost monitoring dashboard

---

### 3.4 Documentation (10 hours)

#### Developer Documentation

```markdown
# Molē Agent - Developer Guide

## Architecture Overview

Molē is a context-aware AI agent with two modes:
1. Marketing Mode - Public-facing, helps with product info
2. Prompt Library Mode - Authenticated, helps with prompt engineering

## Adding New Tools

To add a new tool to an agent:

1. Define the tool in `functions/src/ai_agent/{mode}_tools.py`
2. Add tool to agent's `_create_tools()` method
3. Update system prompt to mention the tool
4. Write unit tests
5. Update documentation

Example:
\`\`\`python
def my_new_tool(self, input: str) -> str:
    """Tool description for the agent"""
    # Implementation
    return result
\`\`\`

## Testing

Run tests:
\`\`\`bash
pytest tests/ai_agent/ -v
\`\`\`

## Deployment

Deploy to staging:
\`\`\`bash
firebase use staging
firebase deploy --only functions:marketing_chat,functions:prompt_library_chat
\`\`\`
```

#### User-Facing Documentation

```markdown
# Meet molē - Your AI Assistant

molē (pronounced "moh-lay") is your intelligent assistant throughout EthosPrompt.

## On Marketing Pages

Click the floating molē icon to:
- Learn about our services
- Get pricing information
- Schedule a demo
- Ask questions about AI solutions

## In Your Dashboard

molē can help you:
- Create new prompts
- Optimize existing prompts
- Troubleshoot execution errors
- Analyze performance metrics
- Search your prompt library

## Tips for Best Results

1. **Be specific** - "Create a prompt for summarizing customer reviews" is better than "help me"
2. **Provide context** - Mention what you're trying to achieve
3. **Ask follow-ups** - molē remembers your conversation
4. **Use examples** - Show molē what you want

## Privacy

- Marketing conversations are anonymous
- Dashboard conversations are linked to your account
- Conversations are stored for 30 days
- You can delete your conversation history anytime
```

**Deliverables**:
- [ ] Developer documentation
- [ ] User-facing documentation
- [ ] API documentation
- [ ] Troubleshooting guide
- [ ] FAQ

---

## Implementation Timeline

### Week 1-2: Phase 1 - Marketing Agent
- **Days 1-2**: Architecture & Design
- **Days 3-5**: Knowledge Base & RAG Setup
- **Days 6-7**: LangChain Configuration
- **Days 8-9**: OpenRouter Integration
- **Days 10-12**: UI/UX Integration
- **Days 13-14**: Testing & Deployment

### Week 3-4: Phase 2 - Prompt Library Agent
- **Days 15-16**: Architecture & Design
- **Days 17-19**: Tool Implementation
- **Days 20-21**: LangChain Configuration
- **Days 22-23**: UI Integration
- **Days 24-26**: Testing
- **Days 27-28**: Deployment

### Week 5: Phase 3 - Infrastructure & Polish
- **Days 29-30**: Context Switching
- **Days 31-32**: Shared Infrastructure
- **Days 33-34**: Performance Optimization
- **Days 35**: Final Testing & Documentation

**Total Duration**: 5-6 weeks (35-40 working days)

---

## Risk Assessment

### High-Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenRouter API costs exceed budget | High | Medium | Use `:free` models for dev/testing, implement strict rate limiting, monitor costs daily |
| LangChain agent produces hallucinations | High | Medium | Implement response validation, cite sources, use structured outputs |
| Poor response quality | High | Low | Extensive testing, prompt engineering, user feedback loop |
| Performance issues (>5s response time) | Medium | Medium | Implement caching, optimize retrieval, use streaming |
| Security vulnerabilities | High | Low | Input validation, rate limiting, authentication checks |

### Medium-Priority Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Knowledge base becomes outdated | Medium | High | Automated re-indexing pipeline, version control |
| User confusion about agent capabilities | Medium | Medium | Clear onboarding, capability documentation |
| Conversation context loss | Low | Medium | Robust conversation storage, error recovery |

---

## Success Metrics

### Phase 1 (Marketing Agent)

**Engagement Metrics**:
- [ ] Chat open rate: >15% of marketing page visitors
- [ ] Messages per conversation: >3 average
- [ ] Conversation completion rate: >60%

**Quality Metrics**:
- [ ] Response relevance: >85% (user feedback)
- [ ] Response time: <3s average
- [ ] Source citation rate: >70% of responses

**Business Metrics**:
- [ ] Demo requests via agent: >10% of total demos
- [ ] Conversion rate: Track visitors who chat → sign up

### Phase 2 (Prompt Library Agent)

**Usage Metrics**:
- [ ] Daily active users: >30% of dashboard users
- [ ] Prompts created via agent: >20% of total prompts
- [ ] Tool usage: >5 tool calls per day

**Quality Metrics**:
- [ ] Task completion rate: >75%
- [ ] User satisfaction: >4/5 stars
- [ ] Error rate: <5%

**Performance Metrics**:
- [ ] Response time: <2s for simple queries, <5s for RAG queries
- [ ] Uptime: >99.5%
- [ ] Cost per conversation: <$0.10

### Overall Success Criteria

- [ ] 80% test coverage
- [ ] Zero critical security vulnerabilities
- [ ] Positive user feedback (>4/5 stars)
- [ ] Cost within budget (<$500/month for 1000 users)
- [ ] Performance targets met
- [ ] Documentation complete

---

## Next Steps

1. **Review & Approve**: Stakeholder review of implementation plan
2. **Resource Allocation**: Assign developers, set timeline
3. **Environment Setup**: Configure dev/staging environments
4. **Kickoff**: Begin Phase 1 implementation
5. **Weekly Check-ins**: Monitor progress, adjust as needed

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-16  
**Author**: AI Implementation Team  
**Status**: Ready for Review

