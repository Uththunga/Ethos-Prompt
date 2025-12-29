# Molē AI Agent - Implementation Plan (Part 2)

*Continued from MOLE_IMPLEMENTATION_PLAN.md*

---

## Phase 1 (Continued)

### 1.6 Testing Strategy (14 hours)

#### Unit Tests

```python
# functions/tests/ai_agent/test_marketing_agent.py
import pytest
from unittest.mock import Mock, AsyncMock
from src.ai_agent.marketing_agent import MarketingAgent

@pytest.mark.asyncio
async def test_search_knowledge_base():
    """Test knowledge base search tool"""
    mock_retriever = Mock()
    mock_retriever.aget_relevant_documents = AsyncMock(return_value=[
        Mock(page_content="Smart Business Assistant pricing starts at $890 AUD/month",
             metadata={'page_url': '/services/smart-assistant'})
    ])
    
    agent = MarketingAgent(
        llm=Mock(),
        retriever=mock_retriever,
        db=Mock()
    )
    
    result = await agent._search_kb("pricing for smart assistant")
    
    assert "890" in result
    assert "AUD" in result
    mock_retriever.aget_relevant_documents.assert_called_once()

@pytest.mark.asyncio
async def test_conversation_memory():
    """Test conversation memory persistence"""
    agent = MarketingAgent(llm=Mock(), retriever=Mock(), db=Mock())
    
    # First message
    response1 = await agent.chat("What services do you offer?")
    
    # Follow-up message (should have context)
    response2 = await agent.chat("Tell me more about the first one")
    
    # Verify memory contains both messages
    assert len(agent.executor.memory.chat_memory.messages) == 4  # 2 user + 2 assistant
```

#### Integration Tests

```python
# functions/tests/ai_agent/test_marketing_integration.py
import pytest
from firebase_admin import firestore
from src.ai_agent.marketing_agent import MarketingAgent
from src.ai_agent.marketing_retriever import MarketingRetriever
from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig

@pytest.mark.integration
@pytest.mark.asyncio
async def test_end_to_end_query(firestore_emulator):
    """Test complete query flow with real components"""
    db = firestore.client()
    
    # Set up test data in Firestore
    await _seed_test_knowledge_base(db)
    
    # Create agent with real components
    config = OpenRouterConfig(
        api_key=os.getenv('OPENROUTER_API_KEY'),
        model='x-ai/grok-4-fast:free'
    )
    llm = OpenRouterLLM(api_key=config.api_key, model=config.model)
    retriever = MarketingRetriever(db, embedding_service)
    agent = MarketingAgent(llm, retriever, db)
    
    # Test query
    response = await agent.chat("What is the pricing for Smart Business Assistant?")
    
    # Assertions
    assert response is not None
    assert "890" in response or "pricing" in response.lower()
    assert len(response) > 50  # Meaningful response

@pytest.mark.integration
async def test_streaming_response():
    """Test streaming response generation"""
    agent = MarketingAgent(...)
    
    chunks = []
    async for chunk in agent.chat_stream("Tell me about EthosPrompt"):
        chunks.append(chunk)
    
    full_response = ''.join(chunks)
    assert len(full_response) > 100
    assert "EthosPrompt" in full_response
```

#### E2E Tests (Playwright)

```typescript
// frontend/e2e/marketing-chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Marketing Chat - Molē Agent', () => {
  test('should open chat modal when clicking Moleicon', async ({ page }) => {
    await page.goto('/');
    
    // Click floating Moleicon
    await page.click('[aria-label="Open AI Assistant Chat"]');
    
    // Verify modal opens
    await expect(page.locator('text=molē')).toBeVisible();
    await expect(page.locator('text=AI Assistant')).toBeVisible();
  });

  test('should send message and receive response', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="Open AI Assistant Chat"]');
    
    // Type message
    await page.fill('input[placeholder*="Ask me anything"]', 'What services do you offer?');
    await page.click('[aria-label="Send message"]');
    
    // Wait for response
    await expect(page.locator('.bg-gray-100').last()).toBeVisible({ timeout: 10000 });
    
    // Verify response contains relevant content
    const response = await page.locator('.bg-gray-100').last().textContent();
    expect(response).toContain('Smart Business Assistant' || 'Custom AI' || 'services');
  });

  test('should display sources when available', async ({ page }) => {
    await page.goto('/solutions');
    await page.click('[aria-label="Open AI Assistant Chat"]');
    
    await page.fill('input[placeholder*="Ask me anything"]', 'Tell me about your solutions');
    await page.click('[aria-label="Send message"]');
    
    // Wait for response with sources
    await expect(page.locator('text=Sources:')).toBeVisible({ timeout: 10000 });
    
    // Verify source links are clickable
    const sourceLink = page.locator('a[href*="/solutions"]').first();
    await expect(sourceLink).toBeVisible();
  });

  test('should maintain conversation context', async ({ page }) => {
    await page.goto('/');
    await page.click('[aria-label="Open AI Assistant Chat"]');
    
    // First message
    await page.fill('input[placeholder*="Ask me anything"]', 'What is Smart Business Assistant?');
    await page.click('[aria-label="Send message"]');
    await page.waitForTimeout(2000);
    
    // Follow-up message (requires context)
    await page.fill('input[placeholder*="Ask me anything"]', 'How much does it cost?');
    await page.click('[aria-label="Send message"]');
    
    // Verify response references pricing
    await expect(page.locator('text=/\\$\\d+|pricing|cost/i').last()).toBeVisible({ timeout: 10000 });
  });

  test('should be accessible via keyboard', async ({ page }) => {
    await page.goto('/');
    
    // Tab to Moleicon button
    await page.keyboard.press('Tab');
    // ... (continue tabbing until focused)
    
    // Press Enter to open
    await page.keyboard.press('Enter');
    await expect(page.locator('text=molē')).toBeVisible();
    
    // Tab to input field
    await page.keyboard.press('Tab');
    await page.keyboard.type('Hello');
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    await expect(page.locator('text=Hello')).toBeVisible();
  });
});
```

#### Manual Testing Checklist

**Functional Testing**:
- [ ] Chat modal opens when clicking FloatingMoleicon
- [ ] Welcome message displays on first open
- [ ] User can send messages
- [ ] Agent responds within 5 seconds
- [ ] Responses are relevant to queries
- [ ] Sources are displayed when available
- [ ] Source links are clickable and correct
- [ ] Conversation context is maintained across messages
- [ ] Chat modal closes properly
- [ ] Conversation persists when reopening modal
- [ ] Error handling works (network errors, API errors)

**Content Quality Testing**:
- [ ] Pricing information is accurate
- [ ] Service descriptions match marketing pages
- [ ] Agent suggests relevant next steps
- [ ] Agent handles unclear queries gracefully
- [ ] Agent doesn't hallucinate information
- [ ] Agent cites sources appropriately

**Performance Testing**:
- [ ] Initial load time < 1 second
- [ ] Response time < 5 seconds for RAG queries
- [ ] Response time < 2 seconds for simple queries
- [ ] Streaming works smoothly (no lag)
- [ ] No memory leaks after 20+ messages

**Accessibility Testing**:
- [ ] Keyboard navigation works
- [ ] Screen reader announces messages
- [ ] Focus management is correct
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets are 48x48px minimum

**Mobile Testing**:
- [ ] Chat modal is responsive
- [ ] FloatingMoleicon is visible and clickable
- [ ] Input field works on mobile keyboards
- [ ] Scrolling works smoothly
- [ ] No horizontal overflow

**Deliverables**:
- [ ] Unit test suite (>80% coverage)
- [ ] Integration test suite
- [ ] E2E test suite (Playwright)
- [ ] Manual testing checklist completed
- [ ] Test results documented

---

### 1.7 Deployment Plan (10 hours)

#### Firebase Cloud Function Setup

```python
# functions/main.py
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore
from src.ai_agent.marketing_agent import MarketingAgent
from src.ai_agent.marketing_retriever import MarketingRetriever
from src.llm.openrouter_client import OpenRouterLLM
from src.rag.embedding_service import EmbeddingService
import os

# Initialize Firebase Admin
initialize_app()
db = firestore.client()

# Initialize services
embedding_service = EmbeddingService(provider='google')
retriever = MarketingRetriever(db, embedding_service)

@https_fn.on_call(
    region=options.SupportedRegion.AUSTRALIA_SOUTHEAST1,
    memory=options.MemoryOption.MB_512,
    timeout_sec=60,
    cors=options.CorsOptions(
        cors_origins=[
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            "http://localhost:5173"
        ],
        cors_methods=["POST", "OPTIONS"]
    )
)
def marketing_chat(req: https_fn.CallableRequest) -> dict:
    """
    Marketing chat endpoint for Molē agent
    
    Input:
        {
            "message": str,
            "conversationId": str | null,
            "pageContext": str
        }
    
    Output:
        {
            "response": str,
            "conversationId": str,
            "sources": [{"title": str, "url": str}],
            "metadata": {
                "model": str,
                "tokensUsed": int,
                "responseTime": float
            }
        }
    """
    try:
        # Extract request data
        data = req.data
        message = data.get('message')
        conversation_id = data.get('conversationId')
        page_context = data.get('pageContext', 'unknown')
        
        # Validate input
        if not message or not isinstance(message, str):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message="Message is required and must be a string"
            )
        
        # Initialize LLM
        api_key = os.getenv('OPENROUTER_API_KEY')
        model = os.getenv('MARKETING_AGENT_MODEL', 'x-ai/grok-4-fast:free')
        llm = OpenRouterLLM(api_key=api_key, model=model, streaming=False)
        
        # Initialize agent
        agent = MarketingAgent(llm, retriever, db)
        
        # Load conversation history if exists
        if conversation_id:
            await agent.load_conversation(conversation_id)
        
        # Generate response
        import time
        start_time = time.time()
        
        response_data = await agent.chat_with_metadata(
            message=message,
            page_context=page_context
        )
        
        response_time = time.time() - start_time
        
        # Save conversation
        if not conversation_id:
            conversation_id = await agent.save_conversation(
                user_id=req.auth.uid if req.auth else None,
                page_context=page_context
            )
        else:
            await agent.update_conversation(conversation_id)
        
        # Track usage
        await agent.track_usage(conversation_id, response_data['metadata'])
        
        return {
            'response': response_data['response'],
            'conversationId': conversation_id,
            'sources': response_data.get('sources', []),
            'metadata': {
                **response_data['metadata'],
                'responseTime': response_time
            }
        }
        
    except Exception as e:
        logger.error(f"Error in marketing_chat: {e}", exc_info=True)
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Failed to process chat message"
        )
```

#### Environment Configuration

```bash
# .env.production
OPENROUTER_API_KEY=sk-or-v1-...
MARKETING_AGENT_MODEL=openai/gpt-4-turbo
GOOGLE_EMBEDDING_API_KEY=...
ENABLE_AGENT_LOGGING=true
AGENT_MAX_TOKENS=2000
AGENT_TEMPERATURE=0.7
```

```bash
# Set Firebase environment config
firebase functions:config:set \
  openrouter.api_key="sk-or-v1-..." \
  marketing_agent.model="openai/gpt-4-turbo" \
  google.embedding_key="..." \
  agent.logging="true"
```

#### Deployment Steps

```bash
# 1. Install dependencies
cd functions
pip install -r requirements.txt

# 2. Run tests
pytest tests/ai_agent/ -v

# 3. Build knowledge base (one-time)
python scripts/build_marketing_kb.py

# 4. Deploy to staging (first)
firebase use staging
firebase deploy --only functions:marketing_chat

# 5. Test staging
npm run test:e2e:staging

# 6. Deploy to production
firebase use production
firebase deploy --only functions:marketing_chat

# 7. Verify deployment
curl -X POST https://australia-southeast1-react-app-000730.cloudfunctions.net/marketing_chat \
  -H "Content-Type: application/json" \
  -d '{"data": {"message": "Hello", "pageContext": "homepage"}}'
```

#### Monitoring Setup

```python
# functions/src/ai_agent/monitoring.py
from google.cloud import monitoring_v3
import time

class AgentMonitoring:
    def __init__(self, project_id: str):
        self.client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{project_id}"
    
    def record_response_time(self, response_time: float, agent_mode: str):
        """Record agent response time metric"""
        series = monitoring_v3.TimeSeries()
        series.metric.type = "custom.googleapis.com/agent/response_time"
        series.metric.labels["agent_mode"] = agent_mode
        
        now = time.time()
        seconds = int(now)
        nanos = int((now - seconds) * 10**9)
        
        interval = monitoring_v3.TimeInterval(
            {"end_time": {"seconds": seconds, "nanos": nanos}}
        )
        point = monitoring_v3.Point(
            {"interval": interval, "value": {"double_value": response_time}}
        )
        series.points = [point]
        
        self.client.create_time_series(
            name=self.project_name,
            time_series=[series]
        )
    
    def record_error(self, error_type: str, agent_mode: str):
        """Record agent error metric"""
        # Similar implementation for error tracking
        pass
```

**Monitoring Alerts**:
```yaml
# monitoring/agent_alerts.yaml
alertPolicies:
  - displayName: "Marketing Agent High Response Time"
    conditions:
      - displayName: "Response time > 5s"
        conditionThreshold:
          filter: 'metric.type="custom.googleapis.com/agent/response_time" AND metric.label.agent_mode="marketing"'
          comparison: COMPARISON_GT
          thresholdValue: 5.0
          duration: 60s
    notificationChannels:
      - projects/react-app-000730/notificationChannels/email-alerts
  
  - displayName: "Marketing Agent High Error Rate"
    conditions:
      - displayName: "Error rate > 5%"
        conditionThreshold:
          filter: 'metric.type="custom.googleapis.com/agent/errors" AND metric.label.agent_mode="marketing"'
          comparison: COMPARISON_GT
          thresholdValue: 0.05
          duration: 300s
```

#### Rollback Strategy

```bash
# If issues detected, rollback to previous version
firebase functions:log --only marketing_chat --limit 100

# Identify last working version
firebase functions:list

# Rollback
firebase rollback functions:marketing_chat
```

**Deliverables**:
- [ ] Cloud Function deployed to staging
- [ ] Cloud Function deployed to production
- [ ] Environment variables configured
- [ ] Monitoring dashboards created
- [ ] Alert policies configured
- [ ] Rollback procedure documented
- [ ] Deployment runbook created

---

## Phase 2: Molē Prompt Library Agent (Authenticated Dashboard)

**Estimated Effort**: 100-120 hours (2.5-3 weeks)

### 2.1 Architecture & Design (14 hours)

#### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Dashboard - Authenticated)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RightPanel - ChatPanel Component                     │  │
│  │  - Integrated in dashboard sidebar                    │  │
│  │  - Context-aware (current page, selected prompt)      │  │
│  │  - Quick actions (create, optimize, troubleshoot)     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS Callable (Authenticated)
┌─────────────────────────────────────────────────────────────┐
│         Firebase Cloud Functions (Python)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  prompt_library_chat (Callable Function)              │  │
│  │  - Requires authentication                            │  │
│  │  - Input: { message, conversationId, context }        │  │
│  │  - Output: { response, actions, suggestions }         │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PromptLibraryAgent (LangChain)                       │  │
│  │  - Agent Type: OpenAI Functions Agent                 │  │
│  │  - Memory: ConversationSummaryMemory                   │  │
│  │  - Tools: [create_prompt, execute_prompt,             │  │
│  │            upload_document, search_docs, analyze]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  User Context & Personalization                       │  │
│  │  - User's prompts (Firestore)                         │  │
│  │  - User's documents (Firestore + Storage)             │  │
│  │  - Execution history (Firestore)                      │  │
│  │  - Preferences (Firestore)                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

#### Agent Type Selection: **OpenAI Functions Agent**

**Rationale**:
- **Function Calling**: Native support for tool execution
- **Structured Outputs**: Better for CRUD operations
- **Code Generation**: Optimized for generating prompt templates
- **Deterministic**: More predictable for technical tasks

#### Tool Definitions

```python
# functions/src/ai_agent/prompt_library_tools.py
from langchain.tools import Tool, StructuredTool
from pydantic import BaseModel, Field
from typing import Optional, List

class CreatePromptInput(BaseModel):
    """Input for create_prompt tool"""
    title: str = Field(description="Title of the prompt")
    content: str = Field(description="Prompt template content with {{variables}}")
    description: Optional[str] = Field(description="Description of what the prompt does")
    tags: Optional[List[str]] = Field(description="Tags for categorization")
    category: Optional[str] = Field(description="Category (e.g., 'coding', 'writing', 'analysis')")

class ExecutePromptInput(BaseModel):
    """Input for execute_prompt tool"""
    prompt_id: str = Field(description="ID of the prompt to execute")
    variables: dict = Field(description="Variables to fill in the prompt template")
    model: Optional[str] = Field(description="Model to use (default: user's preferred model)")

class PromptLibraryTools:
    def __init__(self, db, user_id: str):
        self.db = db
        self.user_id = user_id
    
    def get_tools(self) -> List[Tool]:
        """Get all tools for the agent"""
        return [
            StructuredTool.from_function(
                func=self.create_prompt,
                name="create_prompt",
                description="Create a new prompt in the user's library. Use this when the user asks to create, save, or add a new prompt.",
                args_schema=CreatePromptInput
            ),
            StructuredTool.from_function(
                func=self.execute_prompt,
                name="execute_prompt",
                description="Execute an existing prompt with variables. Use this when the user wants to run or test a prompt.",
                args_schema=ExecutePromptInput
            ),
            Tool(
                name="search_user_prompts",
                func=self.search_prompts,
                description="Search the user's prompt library. Input should be a search query or keywords."
            ),
            Tool(
                name="get_execution_history",
                func=self.get_executions,
                description="Get recent execution history for analysis or troubleshooting. Input should be optional filters (e.g., 'last 10', 'errors only')."
            ),
            Tool(
                name="analyze_prompt_performance",
                func=self.analyze_performance,
                description="Analyze prompt performance metrics (cost, latency, success rate). Input should be a prompt ID."
            ),
            Tool(
                name="suggest_prompt_improvements",
                func=self.suggest_improvements,
                description="Suggest improvements for a prompt based on best practices. Input should be a prompt ID or prompt content."
            )
        ]
    
    async def create_prompt(
        self,
        title: str,
        content: str,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category: Optional[str] = None
    ) -> str:
        """Create a new prompt"""
        prompt_ref = self.db.collection('prompts').document()
        
        await prompt_ref.set({
            'title': title,
            'content': content,
            'description': description or '',
            'tags': tags or [],
            'category': category or 'general',
            'userId': self.user_id,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'createdBy': 'mole_agent',
            'version': 1
        })
        
        return f"✅ Prompt '{title}' created successfully! ID: {prompt_ref.id}"
    
    async def execute_prompt(
        self,
        prompt_id: str,
        variables: dict,
        model: Optional[str] = None
    ) -> str:
        """Execute a prompt"""
        # Call existing execute_prompt function
        from src.api.execute import execute_prompt_logic
        
        result = await execute_prompt_logic(
            prompt_id=prompt_id,
            variables=variables,
            model_id=model,
            user_id=self.user_id
        )
        
        return f"✅ Execution complete!\n\nOutput:\n{result['output']}\n\nTokens: {result['tokensUsed']}, Cost: ${result['cost']:.4f}"
```

**Deliverables**:
- [ ] System architecture diagram
- [ ] Agent type selection document
- [ ] Tool definitions implemented
- [ ] Security model designed
- [ ] User context schema defined

---

*This document continues in MOLE_IMPLEMENTATION_PLAN_PART3.md*

