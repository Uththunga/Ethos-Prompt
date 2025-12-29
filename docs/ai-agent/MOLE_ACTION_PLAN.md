# Molē AI Agent - Detailed Action Plan

## Step-by-Step Implementation Guide

**Created**: October 17, 2025
**Based On**: MOLE_GAP_ANALYSIS.md
**Target**: Production-Ready Molē Agent in 3 Weeks

---

## Quick Reference

### Completion Status by Phase

| Phase | Component             | Status | Priority     | Effort |
| ----- | --------------------- | ------ | ------------ | ------ |
| 1.2   | Marketing KB Indexing | ❌ 0%  | 🔴 CRITICAL  | 1h     |
| 1.5   | Streaming UI          | ❌ 0%  | 🟡 IMPORTANT | 6h     |
| 1.6   | E2E Tests             | ❌ 0%  | 🔴 CRITICAL  | 12h    |
| 1.7   | Production Deployment | ❌ 0%  | 🔴 CRITICAL  | 6h     |
| 3.1   | Context Switching     | 🚧 40% | 🟡 IMPORTANT | 6h     |
| 3.2   | Unified Storage       | 🚧 50% | 🟡 IMPORTANT | 8h     |
| 3.3   | Monitoring            | ❌ 0%  | 🔴 CRITICAL  | 8h     |

---

## Week 1: Critical Fixes (20-28 hours)

### Task 1.1: Index Marketing Knowledge Base 🔴 CRITICAL

**Priority**: CRITICAL
**Estimated Time**: 1 hour
**Complexity**: Low
**Dependencies**: None

#### Current State

- Marketing KB content defined in `marketing_kb_content.py` (8 documents)
- Indexer script exists: `init_marketing_kb.py`
- Firestore collection `marketing_kb_vectors` is EMPTY
- Agent cannot retrieve marketing content

#### Steps

1. **Verify Prerequisites**

   ```bash
   # Check if Firestore emulator is running (for local testing)
   firebase emulators:start --only firestore

   # Or use production Firestore
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
   ```

2. **Run Indexing Script**

   ```bash
   cd functions

   # Activate virtual environment
   source venv/bin/activate  # Linux/Mac
   # OR
   .\venv\Scripts\activate  # Windows

   # Run indexer
   python -m src.ai_agent.marketing.init_marketing_kb
   ```

3. **Expected Output**

   ```
   Indexing marketing knowledge base...
   Processing document: homepage (1/8)
   Processing document: solutions (2/8)
   Processing document: smart_assistant (3/8)
   Processing document: custom_ai (4/8)
   Processing document: digital_transformation (5/8)
   Processing document: intelligent_applications (6/8)
   Processing document: system_integration (7/8)
   Processing document: education (8/8)

   Summary:
   - Documents processed: 8
   - Total chunks: 42
   - Total vectors: 42
   - Collection: marketing_kb_vectors

   ✅ Marketing KB indexed successfully!
   ```

4. **Verify Indexing**

   ```bash
   # Query Firestore to verify vectors
   firebase firestore:get marketing_kb_vectors --limit 5

   # Or use Python script
   python -c "
   from firebase_admin import firestore, initialize_app
   initialize_app()
   db = firestore.client()
   docs = db.collection('marketing_kb_vectors').limit(5).stream()
   print(f'Found {len(list(docs))} vectors')
   "
   ```

5. **Test Retrieval**
   ```bash
   # Test semantic search
   python -m src.ai_agent.marketing.test_retrieval "What services does EthosPrompt offer?"
   ```

#### Success Criteria

- [ ] 40-60 vectors in `marketing_kb_vectors` collection
- [ ] Each vector has embedding (768 dimensions)
- [ ] Metadata includes: document_id, document_title, category, page, chunk_text
- [ ] Test query returns relevant results

#### Rollback Plan

- Delete collection: `firebase firestore:delete marketing_kb_vectors --recursive`
- Re-run indexing script

---

### Task 1.2: Deploy Marketing Agent to Production 🔴 CRITICAL

**Priority**: CRITICAL
**Estimated Time**: 6 hours
**Complexity**: Medium
**Dependencies**: Task 1.1 (KB indexed)

#### Current State

- Marketing agent code exists in `marketing_agent.py`
- Staging deployment uses Cloud Run (`cloud_run_main.py`)
- Production needs Firebase callable function
- No production endpoint available

#### Steps

1. **Create Production Cloud Function** (2 hours)

   **Option A: Node.js Callable Function** (Recommended for consistency)

   Edit `functions/index.js`:

   ```javascript
   // Add after existing imports
   const { PythonShell } = require('python-shell');

   // Marketing chat callable function
   exports.marketingChat = onCall(
     {
       region: 'australia-southeast1',
       memory: '512MB',
       timeoutSeconds: 60,
       cors: true,
     },
     async (request) => {
       const { message, conversationId, pageContext } = request.data;

       // Validate input
       if (!message || typeof message !== 'string') {
         throw new HttpsError('invalid-argument', 'Message is required');
       }

       try {
         // Call Python marketing agent
         const options = {
           mode: 'json',
           pythonPath: 'python3',
           pythonOptions: ['-u'],
           scriptPath: './src/ai_agent/marketing',
           args: [message, conversationId || '', pageContext || ''],
         };

         const results = await PythonShell.run('agent_wrapper.py', options);
         return results[0];
       } catch (error) {
         console.error('Marketing agent error:', error);
         throw new HttpsError('internal', 'Failed to process message');
       }
     }
   );
   ```

   **Option B: Python Callable Function** (Alternative)

   Edit `functions/main.py`:

   ```python
   @https_fn.on_call(
       region="australia-southeast1",
       memory=512,
       timeout_sec=60
   )
   def marketing_chat(req: https_fn.CallableRequest) -> dict:
       """Marketing chat endpoint"""
       from src.ai_agent.marketing.marketing_agent import MarketingAgent
       from src.ai_agent.marketing.marketing_retriever import MarketingRetriever
       from src.rag.embedding_service import embedding_service

       data = req.data
       message = data.get('message')
       conversation_id = data.get('conversationId')
       page_context = data.get('pageContext', 'unknown')

       if not message:
           raise https_fn.HttpsError('invalid-argument', 'Message required')

       # Initialize components
       db = firestore.client()
       retriever = MarketingRetriever(db, embedding_service)

       # Initialize agent
       agent = MarketingAgent(
           db=db,
           retriever=retriever,
           model="x-ai/grok-2-1212:free",
           temperature=0.7
       )

       # Generate response
       response = await agent.chat(
           message=message,
           conversation_id=conversation_id,
           context={'page_context': page_context}
       )

       return {
           'response': response.response,
           'conversationId': response.conversation_id,
           'sources': response.metadata.get('sources', []),
           'metadata': response.metadata
       }
   ```

2. **Configure Environment Variables** (30 minutes)

   ```bash
   # Set Firebase config
   firebase functions:config:set \
     openrouter.api_key="$OPENROUTER_API_KEY" \
     marketing_agent.model="x-ai/grok-2-1212:free" \
     marketing_agent.temperature="0.7" \
     marketing_agent.max_tokens="2000"

   # Verify config
   firebase functions:config:get
   ```

3. **Update Frontend Service** (1 hour)

   Edit `frontend/src/services/marketingChatService.ts`:

   ```typescript
   // Change from HTTP endpoint to callable function
   import { getFunctions, httpsCallable } from 'firebase/functions';
   import { functions } from '@/config/firebase';

   const marketingChatFn = httpsCallable(functions, 'marketingChat');

   async sendMessage(message: string, pageContext?: string): Promise<MarketingChatResponse> {
     try {
       const result = await marketingChatFn({
         message,
         conversationId: this.conversationId,
         pageContext: pageContext || this.detectPageContext(),
       });

       const data = result.data as MarketingChatResponse;

       if (data.conversationId) {
         this.conversationId = data.conversationId;
         this.saveConversationId(data.conversationId);
       }

       return data;
     } catch (error) {
       console.error('Marketing chat error:', error);
       throw error;
     }
   }
   ```

4. **Deploy to Production** (30 minutes)

   ```bash
   # Build frontend
   cd frontend
   npm run build

   # Deploy functions and hosting
   cd ..
   firebase deploy --only functions:marketingChat,hosting --project react-app-000730
   ```

5. **Smoke Test** (1 hour)

   ```bash
   # Test callable function
   curl -X POST \
     https://australia-southeast1-react-app-000730.cloudfunctions.net/marketingChat \
     -H "Content-Type: application/json" \
     -d '{
       "data": {
         "message": "What services does EthosPrompt offer?",
         "pageContext": "homepage"
       }
     }'

   # Expected response:
   # {
   #   "result": {
   #     "response": "EthosPrompt offers...",
   #     "conversationId": "...",
   #     "sources": [...]
   #   }
   # }
   ```

6. **Frontend Integration Test** (1 hour)
   - Open https://rag-prompt-library.web.app
   - Click FloatingMoleicon
   - Send message: "What is Smart Business Assistant?"
   - Verify response includes pricing and features
   - Check sources are displayed
   - Verify conversation persists on reload

#### Success Criteria

- [ ] `marketingChat` function deployed to production
- [ ] Function responds within 5 seconds
- [ ] Responses include relevant marketing content
- [ ] Sources are cited correctly
- [ ] Conversation ID persists across messages
- [ ] Frontend integration works end-to-end

#### Rollback Plan

```bash
# Revert to previous version
firebase functions:log --only marketingChat --limit 100
firebase rollback functions:marketingChat
```

---

### Task 1.3: Configure Monitoring & Alerts 🔴 CRITICAL

**Priority**: CRITICAL
**Estimated Time**: 8 hours
**Complexity**: Medium
**Dependencies**: Task 1.2 (production deployment)

#### Current State

- No Cloud Monitoring metrics
- No alert policies
- No dashboards
- Cannot detect production issues

#### Steps

1. **Create Custom Metrics** (2 hours)

   Edit `functions/src/ai_agent/common/monitoring.py`:

   ```python
   from google.cloud import monitoring_v3
   import time
   from typing import Dict, Any

   class AgentMonitoring:
       def __init__(self, project_id: str):
           self.client = monitoring_v3.MetricServiceClient()
           self.project_name = f"projects/{project_id}"

       def record_response_time(
           self,
           response_time: float,
           agent_mode: str,
           success: bool
       ):
           """Record agent response time"""
           series = monitoring_v3.TimeSeries()
           series.metric.type = "custom.googleapis.com/agent/response_time"
           series.metric.labels["agent_mode"] = agent_mode
           series.metric.labels["success"] = str(success)

           now = time.time()
           interval = monitoring_v3.TimeInterval({
               "end_time": {"seconds": int(now)}
           })
           point = monitoring_v3.Point({
               "interval": interval,
               "value": {"double_value": response_time}
           })
           series.points = [point]

           self.client.create_time_series(
               name=self.project_name,
               time_series=[series]
           )

       def record_error(self, agent_mode: str, error_type: str):
           """Record agent error"""
           series = monitoring_v3.TimeSeries()
           series.metric.type = "custom.googleapis.com/agent/errors"
           series.metric.labels["agent_mode"] = agent_mode
           series.metric.labels["error_type"] = error_type

           now = time.time()
           interval = monitoring_v3.TimeInterval({
               "end_time": {"seconds": int(now)}
           })
           point = monitoring_v3.Point({
               "interval": interval,
               "value": {"int64_value": 1}
           })
           series.points = [point]

           self.client.create_time_series(
               name=self.project_name,
               time_series=[series]
           )
   ```

2. **Instrument Agent Code** (2 hours)

   Edit `functions/src/ai_agent/marketing/marketing_agent.py`:

   ```python
   from ..common.monitoring import AgentMonitoring
   import time

   class MarketingAgent(BaseAgent):
       def __init__(self, ...):
           super().__init__(...)
           self.monitoring = AgentMonitoring(project_id="react-app-000730")

       async def chat(self, message: str, ...):
           start_time = time.time()
           success = False

           try:
               response = await super().chat(message, ...)
               success = True
               return response
           except Exception as e:
               self.monitoring.record_error("marketing", type(e).__name__)
               raise
           finally:
               response_time = time.time() - start_time
               self.monitoring.record_response_time(
                   response_time, "marketing", success
               )
   ```

3. **Create Alert Policies** (2 hours)

   Create `monitoring/alert_policies.yaml`:

   ```yaml
   alertPolicies:
     - displayName: 'Marketing Agent High Response Time'
       conditions:
         - displayName: 'Response time > 5s'
           conditionThreshold:
             filter: |
               metric.type="custom.googleapis.com/agent/response_time"
               AND metric.label.agent_mode="marketing"
             comparison: COMPARISON_GT
             thresholdValue: 5.0
             duration: 60s
             aggregations:
               - alignmentPeriod: 60s
                 perSeriesAligner: ALIGN_MEAN
       notificationChannels:
         - projects/react-app-000730/notificationChannels/email-alerts
       alertStrategy:
         autoClose: 604800s # 7 days

     - displayName: 'Marketing Agent High Error Rate'
       conditions:
         - displayName: 'Error rate > 5%'
           conditionThreshold:
             filter: |
               metric.type="custom.googleapis.com/agent/errors"
               AND metric.label.agent_mode="marketing"
             comparison: COMPARISON_GT
             thresholdValue: 0.05
             duration: 300s
       notificationChannels:
         - projects/react-app-000730/notificationChannels/email-alerts
   ```

   Deploy alerts:

   ```bash
   gcloud alpha monitoring policies create --policy-from-file=monitoring/alert_policies.yaml
   ```

4. **Create Monitoring Dashboard** (2 hours)

   Create `monitoring/dashboard.json`:

   ```json
   {
     "displayName": "Molē Agent Monitoring",
     "mosaicLayout": {
       "columns": 12,
       "tiles": [
         {
           "width": 6,
           "height": 4,
           "widget": {
             "title": "Agent Response Time (p95)",
             "xyChart": {
               "dataSets": [
                 {
                   "timeSeriesQuery": {
                     "timeSeriesFilter": {
                       "filter": "metric.type=\"custom.googleapis.com/agent/response_time\"",
                       "aggregation": {
                         "alignmentPeriod": "60s",
                         "perSeriesAligner": "ALIGN_DELTA",
                         "crossSeriesReducer": "REDUCE_PERCENTILE_95"
                       }
                     }
                   }
                 }
               ]
             }
           }
         },
         {
           "xPos": 6,
           "width": 6,
           "height": 4,
           "widget": {
             "title": "Agent Error Rate",
             "xyChart": {
               "dataSets": [
                 {
                   "timeSeriesQuery": {
                     "timeSeriesFilter": {
                       "filter": "metric.type=\"custom.googleapis.com/agent/errors\"",
                       "aggregation": {
                         "alignmentPeriod": "60s",
                         "perSeriesAligner": "ALIGN_RATE"
                       }
                     }
                   }
                 }
               ]
             }
           }
         }
       ]
     }
   }
   ```

   Deploy dashboard:

   ```bash
   gcloud monitoring dashboards create --config-from-file=monitoring/dashboard.json
   ```

#### Success Criteria

- [ ] Custom metrics visible in Cloud Monitoring
- [ ] Alert policies created and active
- [ ] Dashboard shows real-time metrics
- [ ] Test alert triggers correctly (simulate high response time)
- [ ] Email notifications received

---

### Task 1.4: Write E2E Tests 🔴 CRITICAL

**Priority**: CRITICAL
**Estimated Time**: 12 hours
**Complexity**: High
**Dependencies**: Task 1.2 (production deployment)

#### Current State

- No E2E tests for marketing chat
- No E2E tests for prompt library chat
- No automated testing of user flows

#### Steps

1. **Set Up Playwright** (1 hour)

   ```bash
   cd frontend
   npm install -D @playwright/test
   npx playwright install

   # Create config
   npx playwright init
   ```

2. **Write Marketing Chat E2E Tests** (5 hours)

   Create `frontend/e2e/marketing-chat.spec.ts`:

   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Marketing Chat - Molē Agent', () => {
     test.beforeEach(async ({ page }) => {
       await page.goto('/');
     });

     test('should open chat modal when clicking Moleicon', async ({ page }) => {
       // Click floating Moleicon
       await page.click('[aria-label="Open AI Assistant Chat"]');

       // Verify modal opens
       await expect(page.locator('text=molē')).toBeVisible();
       await expect(page.locator('text=AI Assistant')).toBeVisible();
     });

     test('should send message and receive response', async ({ page }) => {
       await page.click('[aria-label="Open AI Assistant Chat"]');

       // Type message
       const input = page.locator('input[placeholder*="Ask me anything"]');
       await input.fill('What services does EthosPrompt offer?');
       await page.click('[aria-label="Send message"]');

       // Wait for response (max 10s)
       await expect(page.locator('.chat-message-assistant-text').last()).toBeVisible({
         timeout: 10000,
       });

       // Verify response contains relevant content
       const response = await page.locator('.chat-message-assistant-text').last().textContent();
       expect(response).toMatch(/Smart Business Assistant|Custom AI|services/i);
     });

     test('should display sources when available', async ({ page }) => {
       await page.goto('/solutions');
       await page.click('[aria-label="Open AI Assistant Chat"]');

       await page.fill('input[placeholder*="Ask me anything"]', 'Tell me about your solutions');
       await page.click('[aria-label="Send message"]');

       // Wait for response with sources
       await expect(page.locator('text=Sources:').or(page.locator('text=Learn more:'))).toBeVisible(
         { timeout: 10000 }
       );
     });

     test('should maintain conversation context', async ({ page }) => {
       await page.click('[aria-label="Open AI Assistant Chat"]');

       // First message
       await page.fill(
         'input[placeholder*="Ask me anything"]',
         'What is Smart Business Assistant?'
       );
       await page.click('[aria-label="Send message"]');
       await page.waitForTimeout(3000);

       // Follow-up message (requires context)
       await page.fill('input[placeholder*="Ask me anything"]', 'How much does it cost?');
       await page.click('[aria-label="Send message"]');

       // Verify response references pricing
       await expect(page.locator('text=/\\$\\d+|pricing|cost/i').last()).toBeVisible({
         timeout: 10000,
       });
     });
   });
   ```

3. **Write Prompt Library Chat E2E Tests** (5 hours)

   Create `frontend/e2e/prompt-library-chat.spec.ts`:

   ```typescript
   import { test, expect } from '@playwright/test';

   test.describe('Prompt Library Chat - Molē Agent', () => {
     test.beforeEach(async ({ page }) => {
       // Login
       await page.goto('/login');
       await page.fill('[name="email"]', 'test@example.com');
       await page.fill('[name="password"]', 'testpassword');
       await page.click('button[type="submit"]');
       await expect(page).toHaveURL('/dashboard');
     });

     test('should create prompt via chat', async ({ page }) => {
       // Open chat panel
       await page.click('[aria-label="Open chat panel"]');

       // Send create prompt request
       await page.fill(
         'textarea[placeholder*="Ask"]',
         'Create a prompt titled "Email Generator" that generates professional emails'
       );
       await page.click('[aria-label="Send message"]');

       // Wait for response
       await expect(page.locator('text=/created.*successfully/i')).toBeVisible({ timeout: 15000 });

       // Verify prompt appears in library
       await page.goto('/dashboard/prompts');
       await expect(page.locator('text=Email Generator')).toBeVisible();
     });

     test('should execute prompt via chat', async ({ page }) => {
       // Assume prompt exists
       await page.goto('/dashboard/prompts');
       await page.click('text=Test Prompt');

       // Open chat
       await page.click('[aria-label="Open chat panel"]');

       // Execute prompt
       await page.fill('textarea[placeholder*="Ask"]', 'Execute this prompt with topic="AI"');
       await page.click('[aria-label="Send message"]');

       // Wait for execution result
       await expect(page.locator('text=/execution.*complete/i')).toBeVisible({ timeout: 20000 });
     });
   });
   ```

4. **Run Tests** (1 hour)

   ```bash
   # Run all E2E tests
   npx playwright test

   # Run specific test file
   npx playwright test e2e/marketing-chat.spec.ts

   # Run in headed mode (see browser)
   npx playwright test --headed

   # Generate HTML report
   npx playwright show-report
   ```

#### Success Criteria

- [ ] All E2E tests pass
- [ ] Tests run in CI/CD pipeline
- [ ] Test coverage includes critical user flows
- [ ] Tests are reliable (no flakiness)

---

## Week 2: Important Enhancements (14-20 hours)

### Task 2.1: Implement Streaming Responses 🟡 IMPORTANT

**Priority**: IMPORTANT
**Estimated Time**: 6 hours
**Complexity**: Medium
**Dependencies**: None

#### Current State

- Backend supports streaming (`chat_stream` method exists)
- Frontend has `sendMessageStream()` but NOT used
- Users see loading spinner instead of progressive response

#### Steps

1. **Update MarketingChatModal** (3 hours)

   Edit `frontend/src/components/marketing/MarketingChatModal.tsx`:

   ```typescript
   const handleSendMessage = async () => {
     if (!input.trim() || isLoading) return;

     const userMessage: MarketingChatMessage = {
       id: `user-${Date.now()}`,
       role: 'user',
       content: input.trim(),
       timestamp: new Date(),
     };

     const newMessages = [...messages, userMessage];
     setMessages(newMessages);
     setInput('');
     setIsLoading(true);

     // Create placeholder for streaming response
     const assistantMessageId = `assistant-${Date.now()}`;
     const assistantMessage: MarketingChatMessage = {
       id: assistantMessageId,
       role: 'assistant',
       content: '',
       timestamp: new Date(),
     };

     setMessages([...newMessages, assistantMessage]);

     try {
       // Use streaming
       let fullContent = '';

       for await (const chunk of marketingChatService.sendMessageStream(
         userMessage.content,
         pageContext
       )) {
         fullContent += chunk;

         // Update message with accumulated content
         setMessages((prev) =>
           prev.map((msg) =>
             msg.id === assistantMessageId ? { ...msg, content: fullContent } : msg
           )
         );
       }

       // Save final conversation
       saveConversationHistory([...newMessages, { ...assistantMessage, content: fullContent }]);
     } catch (error) {
       console.error('Chat error:', error);
       setError('Failed to send message. Please try again.');
     } finally {
       setIsLoading(false);
     }
   };
   ```

2. **Update DashboardChatPanel** (3 hours)

   Similar changes to `frontend/src/components/layout/panels/DashboardChatPanel.tsx`

3. **Test Streaming** (30 minutes)
   - Send message and verify progressive display
   - Test on slow network (Chrome DevTools throttling)
   - Verify final message is complete

#### Success Criteria

- [ ] Responses stream progressively (word-by-word or chunk-by-chunk)
- [ ] No loading spinner during streaming
- [ ] Final message is complete and saved
- [ ] Works on slow networks

---

### Task 2.2: Implement Context Switching 🟡 IMPORTANT

**Priority**: IMPORTANT
**Estimated Time**: 6 hours
**Complexity**: Medium
**Dependencies**: None

#### Current State

- Separate services for marketing and prompt library
- No unified routing logic
- No transition messaging

#### Steps

1. **Create Unified Service** (3 hours)

   Create `frontend/src/services/moleAgentService.ts`:

   ```typescript
   import { auth } from '@/config/firebase';
   import { marketingChatService } from './marketingChatService';
   import { promptLibraryChatService } from './promptLibraryChatService';

   export type AgentMode = 'marketing' | 'prompt_library';

   export class MoleAgentService {
     detectMode(): AgentMode {
       const pathname = window.location.pathname;
       return pathname.startsWith('/dashboard') ? 'prompt_library' : 'marketing';
     }

     async sendMessage(message: string, context?: any) {
       const mode = this.detectMode();
       const user = auth.currentUser;

       if (mode === 'prompt_library' && !user) {
         throw new Error('Authentication required for dashboard agent');
       }

       if (mode === 'marketing') {
         return marketingChatService.sendMessage(message, context?.pageContext);
       } else {
         return promptLibraryChatService.sendMessage({
           message,
           dashboardContext: context?.dashboardContext,
         });
       }
     }
   }

   export const moleAgentService = new MoleAgentService();
   ```

2. **Add Transition UI** (2 hours)

   Create `frontend/src/components/agent/ModeTransitionNotice.tsx`:

   ```typescript
   import React from 'react';
   import { Info } from 'lucide-react';

   interface Props {
     previousMode: AgentMode;
     currentMode: AgentMode;
   }

   export const ModeTransitionNotice: React.FC<Props> = ({ previousMode, currentMode }) => {
     if (previousMode === currentMode) return null;

     const message =
       currentMode === 'marketing'
         ? "You're now chatting with the Marketing Assistant. I can help you learn about EthosPrompt's services."
         : "You're now chatting with the Prompt Library Assistant. I can help you create, execute, and optimize prompts.";

     return (
       <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
         <Info className="w-5 h-5 text-blue-600 mt-0.5" />
         <p className="text-sm text-blue-900">{message}</p>
       </div>
     );
   };
   ```

3. **Test Transitions** (1 hour)
   - Navigate from homepage to dashboard
   - Verify transition notice appears
   - Verify correct agent responds

#### Success Criteria

- [ ] Unified service routes to correct agent
- [ ] Transition notice displays when switching modes
- [ ] Conversation context preserved where possible

---

### Task 2.3: Unified Conversation Storage 🟡 IMPORTANT

**Priority**: IMPORTANT
**Estimated Time**: 8 hours
**Complexity**: High
**Dependencies**: None

#### Current State

- Marketing conversations in localStorage only
- Prompt library conversations in MemorySaver only
- No Firestore persistence
- No analytics

#### Steps

1. **Create Firestore Collection** (1 hour)

   Update `firestore.rules`:

   ```javascript
   // Agent conversations
   match /agent_conversations/{conversationId} {
     allow read: if isAuthenticated() &&
       (resource.data.userId == request.auth.uid || resource.data.userId == null);
     allow create: if isAuthenticated() || request.resource.data.agentMode == 'marketing';
     allow update: if isAuthenticated() &&
       (resource.data.userId == request.auth.uid || resource.data.userId == null);
   }
   ```

   Create index in `firestore.indexes.json`:

   ```json
   {
     "collectionGroup": "agent_conversations",
     "queryScope": "COLLECTION",
     "fields": [
       { "fieldPath": "userId", "order": "ASCENDING" },
       { "fieldPath": "updatedAt", "order": "DESCENDING" }
     ]
   }
   ```

2. **Implement Persistence Logic** (4 hours)

   Create `frontend/src/services/conversationStorage.ts`:

   ```typescript
   import { db } from '@/config/firebase';
   import {
     collection,
     doc,
     setDoc,
     getDoc,
     query,
     where,
     orderBy,
     limit,
   } from 'firebase/firestore';

   export interface StoredConversation {
     conversationId: string;
     userId?: string;
     sessionId: string;
     agentMode: 'marketing' | 'prompt_library';
     messages: Array<{
       role: 'user' | 'assistant';
       content: string;
       timestamp: Date;
       metadata?: any;
     }>;
     context: {
       currentPage: string;
       pageContext?: string;
       dashboardContext?: any;
     };
     createdAt: Date;
     updatedAt: Date;
     status: 'active' | 'archived';
   }

   export class ConversationStorage {
     async saveConversation(conversation: StoredConversation) {
       const ref = doc(db, 'agent_conversations', conversation.conversationId);
       await setDoc(
         ref,
         {
           ...conversation,
           updatedAt: new Date(),
         },
         { merge: true }
       );
     }

     async loadConversation(conversationId: string): Promise<StoredConversation | null> {
       const ref = doc(db, 'agent_conversations', conversationId);
       const snap = await getDoc(ref);
       return snap.exists() ? (snap.data() as StoredConversation) : null;
     }

     async getUserConversations(userId: string, agentMode?: string) {
       const q = query(
         collection(db, 'agent_conversations'),
         where('userId', '==', userId),
         ...(agentMode ? [where('agentMode', '==', agentMode)] : []),
         orderBy('updatedAt', 'desc'),
         limit(50)
       );

       const snap = await getDocs(q);
       return snap.docs.map((doc) => doc.data() as StoredConversation);
     }
   }

   export const conversationStorage = new ConversationStorage();
   ```

3. **Integrate with Chat Components** (2 hours)

   - Update MarketingChatModal to save to Firestore
   - Update DashboardChatPanel to save to Firestore
   - Load conversation history on mount

4. **Add Analytics Tracking** (1 hour)
   - Track conversation metrics (message count, duration)
   - Track tool usage
   - Track user engagement

#### Success Criteria

- [ ] Conversations saved to Firestore
- [ ] Conversations load on page refresh
- [ ] Analytics data collected
- [ ] User can view conversation history

---

## Week 3: Quality & Polish (18-26 hours)

### Task 3.1: Accessibility Audit 🟢 NICE TO HAVE

**Priority**: NICE TO HAVE
**Estimated Time**: 6 hours
**Complexity**: Medium
**Dependencies**: None

#### Steps

1. **Run Automated Audit** (1 hour)

   ```bash
   # Install axe-core
   npm install -D @axe-core/playwright

   # Run accessibility tests
   npx playwright test --grep @a11y
   ```

2. **Manual Testing** (3 hours)

   - Screen reader testing (NVDA, JAWS, VoiceOver)
   - Keyboard navigation testing
   - Color contrast verification
   - Focus management testing

3. **Fix Issues** (2 hours)
   - Add missing ARIA labels
   - Fix focus order
   - Improve color contrast
   - Add skip links

#### Success Criteria

- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader announces all content
- [ ] Keyboard navigation works
- [ ] Color contrast meets standards

---

### Task 3.2: Marketing Agent Unit Tests 🟢 NICE TO HAVE

**Priority**: NICE TO HAVE
**Estimated Time**: 8 hours
**Complexity**: Medium
**Dependencies**: None

#### Steps

1. **Write Agent Tests** (4 hours)

   Create `functions/tests/ai_agent/test_marketing_agent.py`:

   ```python
   import pytest
   from unittest.mock import Mock, AsyncMock
   from src.ai_agent.marketing.marketing_agent import MarketingAgent

   @pytest.mark.asyncio
   async def test_chat_with_kb_retrieval():
       """Test agent retrieves from KB and generates response"""
       mock_retriever = Mock()
       mock_retriever.retrieve = AsyncMock(return_value=[
           Mock(text="Smart Business Assistant pricing: $890 AUD/month",
                score=0.95,
                document_title="Smart Assistant Service")
       ])

       agent = MarketingAgent(
           db=Mock(),
           retriever=mock_retriever,
           model="x-ai/grok-2-1212:free"
       )

       response = await agent.chat("What is the pricing for Smart Business Assistant?")

       assert response.success
       assert "890" in response.response
       assert len(response.metadata.get('sources', [])) > 0
   ```

2. **Write Retriever Tests** (2 hours)
3. **Write KB Indexer Tests** (2 hours)

#### Success Criteria

- [ ] > 80% code coverage for marketing agent
- [ ] All tests pass
- [ ] Tests run in CI/CD

---

### Task 3.3: KB Update Automation 🟢 NICE TO HAVE

**Priority**: NICE TO HAVE
**Estimated Time**: 12 hours
**Complexity**: High
**Dependencies**: None

#### Steps

1. **Create Update Script** (4 hours)

   - Detect changes in marketing content
   - Re-index only changed documents
   - Version tracking

2. **Set Up Scheduled Job** (4 hours)

   - Cloud Scheduler to trigger re-indexing
   - Pub/Sub topic for updates
   - Cloud Function to process updates

3. **Add Monitoring** (2 hours)

   - Track indexing status
   - Alert on failures
   - Log update history

4. **Test Automation** (2 hours)
   - Trigger manual update
   - Verify incremental indexing
   - Verify version tracking

#### Success Criteria

- [ ] Automated re-indexing works
- [ ] Only changed documents re-indexed
- [ ] Version history maintained
- [ ] Monitoring alerts on failures

---

## Summary & Next Steps

### Immediate Actions (This Week)

1. **Run KB Indexing** (1 hour) - CRITICAL

   ```bash
   cd functions
   python -m src.ai_agent.marketing.init_marketing_kb
   ```

2. **Deploy Marketing Agent** (6 hours) - CRITICAL

   - Create callable function
   - Deploy to production
   - Smoke test

3. **Configure Monitoring** (8 hours) - CRITICAL

   - Set up metrics
   - Create alerts
   - Build dashboard

4. **Write E2E Tests** (12 hours) - CRITICAL
   - Marketing chat tests
   - Prompt library tests
   - Run in CI/CD

### Progress Tracking

Use this checklist to track completion:

**Week 1: Critical Fixes**

- [ ] Task 1.1: Index Marketing KB (1h)
- [ ] Task 1.2: Deploy Marketing Agent (6h)
- [ ] Task 1.3: Configure Monitoring (8h)
- [ ] Task 1.4: Write E2E Tests (12h)

**Week 2: Important Enhancements**

- [ ] Task 2.1: Streaming Responses (6h)
- [ ] Task 2.2: Context Switching (6h)
- [ ] Task 2.3: Unified Storage (8h)

**Week 3: Quality & Polish**

- [ ] Task 3.1: Accessibility Audit (6h)
- [ ] Task 3.2: Marketing Agent Tests (8h)
- [ ] Task 3.3: KB Update Automation (12h)

### Total Effort Estimate

- **Week 1**: 27 hours (Critical)
- **Week 2**: 20 hours (Important)
- **Week 3**: 26 hours (Nice to Have)
- **Total**: 73 hours (~2 weeks full-time or 3 weeks part-time)

### Success Metrics

After completing all tasks:

- ✅ Marketing agent responds with accurate content
- ✅ Prompt library agent creates/executes prompts
- ✅ Streaming responses provide better UX
- ✅ Monitoring detects issues in production
- ✅ E2E tests prevent regressions
- ✅ Accessibility standards met
- ✅ Automated KB updates reduce maintenance

---

**Document Version**: 1.0
**Last Updated**: October 17, 2025
**Next Review**: After Week 1 completion
