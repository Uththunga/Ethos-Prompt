# Phase 2: Next Steps & Action Plan

**Date**: October 17, 2025  
**Current Status**: Backend Complete (53% of Phase 2)  
**Next Milestone**: Complete Backend Testing (Section 2.5)

---

## 🎯 IMMEDIATE NEXT STEPS

### Step 1: Review What Was Built (30 minutes)

**Review the backend code**:
```bash
# View the agent implementation
code functions/src/ai_agent/prompt_library/prompt_library_agent.py

# View the tools
code functions/src/ai_agent/prompt_library/tools/

# View the API endpoint
code functions/src/api/main.py
```

**Review the documentation**:
1. `docs/ai-agent/PHASE_2_ARCHITECTURE.md` - Understand the system design
2. `docs/ai-agent/PHASE_2_SECURITY.md` - Understand security model
3. `docs/ai-agent/PHASE_2_AUTOMATED_IMPLEMENTATION_SUMMARY.md` - See what was done

---

### Step 2: Test the Backend Manually (1 hour)

**Option A: Direct API Testing**

1. **Get a Firebase Auth token**:
```bash
# Login to Firebase
firebase login

# Get your user token (you'll need to extract this from browser dev tools)
# Or create a test user and get their token
```

2. **Test the endpoint**:
```bash
curl -X POST http://localhost:5001/react-app-000730/australia-southeast1/api/ai/prompt-library-chat \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a prompt for writing blog posts about AI",
    "dashboard_context": {
      "currentPage": "prompts-list",
      "totalPrompts": 5
    }
  }'
```

**Option B: Python Script Testing**

Create `test_agent_manual.py`:
```python
import asyncio
from firebase_admin import firestore, initialize_app
from src.ai_agent.prompt_library.prompt_library_agent import PromptLibraryAgent

# Initialize Firebase
initialize_app()
db = firestore.client()

async def test_agent():
    # Create agent for test user
    agent = PromptLibraryAgent(
        user_id="test-user-123",
        db=db,
        model="x-ai/grok-2-1212:free",
        temperature=0.1,
        max_tokens=2000
    )
    
    # Test chat
    response = await agent.chat(
        message="Create a prompt for writing blog posts",
        dashboard_context={"currentPage": "prompts-list"}
    )
    
    print("Response:", response)

asyncio.run(test_agent())
```

Run it:
```bash
cd functions
python test_agent_manual.py
```

---

### Step 3: Complete Backend Testing (8-12 hours)

**Task 2.5.2: Write unit tests for individual tools**

Create `functions/tests/ai_agent/test_tools.py`:
```python
"""
Unit tests for Prompt Library Tools
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.ai_agent.prompt_library.tools.create_prompt import create_prompt_tool
from src.ai_agent.prompt_library.tools.execute_prompt import execute_prompt_tool
# ... import other tools

class TestCreatePromptTool:
    @pytest.fixture
    def mock_db(self):
        db = Mock()
        db.collection.return_value.document.return_value.set = AsyncMock()
        return db
    
    async def test_create_prompt_success(self, mock_db):
        tool = create_prompt_tool(user_id="test-user", db=mock_db)
        
        result = await tool.ainvoke({
            "title": "Test Prompt",
            "content": "This is a test {{variable}}",
            "category": "general",
            "tags": ["test"]
        })
        
        assert result["success"] is True
        assert "prompt_id" in result
        mock_db.collection.assert_called_with("prompts")

# Add more tests for each tool...
```

**Task 2.5.3: Write unit tests for PromptLibraryAgent**

Create `functions/tests/ai_agent/test_agent.py`:
```python
"""
Unit tests for PromptLibraryAgent
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from src.ai_agent.prompt_library.prompt_library_agent import PromptLibraryAgent

class TestPromptLibraryAgent:
    @pytest.fixture
    def mock_db(self):
        return Mock()
    
    def test_agent_initialization(self, mock_db):
        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db,
            model="x-ai/grok-2-1212:free"
        )
        
        assert agent.user_id == "test-user"
        assert agent.model == "x-ai/grok-2-1212:free"
        assert len(agent.tools) == 6
    
    @patch('src.ai_agent.prompt_library.prompt_library_agent.create_react_agent')
    async def test_chat_method(self, mock_create_agent, mock_db):
        # Mock the agent response
        mock_agent = Mock()
        mock_agent.ainvoke = AsyncMock(return_value={
            "messages": [{"content": "Test response"}]
        })
        mock_create_agent.return_value = mock_agent
        
        agent = PromptLibraryAgent(
            user_id="test-user",
            db=mock_db
        )
        
        response = await agent.chat(message="Test message")
        
        assert response["success"] is True
        assert "response" in response

# Add more tests...
```

**Task 2.5.4: Write integration tests**

Create `functions/tests/ai_agent/test_integration.py`:
```python
"""
Integration tests with Firestore emulator
"""
import pytest
from firebase_admin import firestore
from src.ai_agent.prompt_library.prompt_library_agent import PromptLibraryAgent

@pytest.mark.integration
class TestPromptLibraryIntegration:
    @pytest.fixture
    def db(self):
        # Use Firestore emulator
        return firestore.client()
    
    @pytest.fixture
    async def agent(self, db):
        return PromptLibraryAgent(
            user_id="test-user",
            db=db,
            model="x-ai/grok-2-1212:free"
        )
    
    async def test_create_and_execute_prompt(self, agent, db):
        # Create a prompt
        create_response = await agent.chat(
            message="Create a prompt titled 'Blog Writer' with content 'Write a blog post about {{topic}}'"
        )
        
        assert create_response["success"] is True
        
        # Verify prompt was created in Firestore
        prompts = db.collection("prompts").where("userId", "==", "test-user").get()
        assert len(list(prompts)) > 0

# Add more integration tests...
```

**Run the tests**:
```bash
cd functions

# Run unit tests
pytest tests/ai_agent/test_tool_schemas.py -v
pytest tests/ai_agent/test_tools.py -v
pytest tests/ai_agent/test_agent.py -v

# Run integration tests with emulator
firebase emulators:exec "pytest tests/ai_agent/test_integration.py -v"

# Generate coverage report
pytest tests/ai_agent/ --cov=src/ai_agent/prompt_library --cov-report=html
```

---

### Step 4: Implement Frontend (12-16 hours)

**Task 2.6.1: Create API service**

Create `frontend/src/services/promptLibraryChatService.ts`:
```typescript
import { auth } from '@/lib/firebase';

interface ChatRequest {
  message: string;
  conversationId?: string;
  dashboardContext?: any;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  conversationId: string;
  metadata?: any;
  error?: string;
}

export class PromptLibraryChatService {
  private baseUrl = import.meta.env.VITE_API_URL;
  
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    
    const token = await user.getIdToken();
    
    const response = await fetch(`${this.baseUrl}/api/ai/prompt-library-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const promptLibraryChatService = new PromptLibraryChatService();
```

**Task 2.6.2: Create Chat Panel Component**

Create `frontend/src/components/dashboard/DashboardChatPanel.tsx`:
```typescript
import React, { useState } from 'react';
import { promptLibraryChatService } from '@/services/promptLibraryChatService';
import { useDashboardContext } from '@/hooks/useDashboardContext';

export function DashboardChatPanel() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dashboardContext = useDashboardContext();
  
  const handleSend = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const response = await promptLibraryChatService.sendMessage({
        message,
        dashboardContext,
      });
      
      setMessages([...messages, 
        { role: 'user', content: message },
        { role: 'assistant', content: response.response }
      ]);
      setMessage('');
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask molē for help..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Continue with remaining frontend tasks...**

---

### Step 5: Deploy to Staging (2-4 hours)

**Set up environment variables**:
```bash
# Set OpenRouter API key
firebase functions:config:set openrouter.api_key="YOUR_KEY"

# Set model configuration
firebase functions:config:set agent.model="x-ai/grok-2-1212:free"
firebase functions:config:set agent.temperature="0.1"
```

**Deploy to staging**:
```bash
# Deploy functions
firebase deploy --only functions --project react-app-000730

# Deploy hosting to preview channel
firebase hosting:channel:deploy staging --project react-app-000730
```

**Test in staging**:
```bash
# Run smoke tests
curl https://australia-southeast1-react-app-000730.cloudfunctions.net/api/ai/prompt-library-chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "test"}'
```

---

## 📋 TASK CHECKLIST

### Week 1: Backend Testing
- [ ] Review backend code and documentation
- [ ] Test backend manually with curl/Python
- [ ] Write unit tests for tools (test_tools.py)
- [ ] Write unit tests for agent (test_agent.py)
- [ ] Write integration tests (test_integration.py)
- [ ] Write API endpoint tests
- [ ] Achieve >80% code coverage
- [ ] Document test results

### Week 2: Frontend Implementation
- [ ] Create promptLibraryChatService.ts
- [ ] Create DashboardChatPanel.tsx
- [ ] Create useDashboardContext.ts hook
- [ ] Create QuickActions.tsx component
- [ ] Create ToolExecutionIndicator.tsx
- [ ] Integrate with RightPanel.tsx
- [ ] Add accessibility features
- [ ] Implement conversation persistence

### Week 3: Testing & Deployment
- [ ] Write frontend unit tests
- [ ] Write frontend component tests
- [ ] Write E2E tests with Playwright
- [ ] Deploy to staging
- [ ] Set up monitoring and alerts
- [ ] Perform UAT
- [ ] Deploy to production
- [ ] Create completion report

---

## 🎯 SUCCESS CRITERIA

### Backend
- ✅ All 6 tools working correctly
- ✅ Agent responds to user messages
- ✅ Authentication working
- ✅ Rate limiting enforced
- ⏳ >80% test coverage
- ⏳ All tests passing

### Frontend
- ⏳ Chat panel integrated in dashboard
- ⏳ Messages sent and received
- ⏳ Context extracted correctly
- ⏳ Quick actions working
- ⏳ Accessible (WCAG 2.1 AA)
- ⏳ Conversation persisted

### Deployment
- ⏳ Staging deployment successful
- ⏳ Monitoring and alerts configured
- ⏳ UAT completed with positive feedback
- ⏳ Production deployment successful
- ⏳ No critical issues in first 24 hours

---

## 💡 TIPS & BEST PRACTICES

### Testing
1. **Start with unit tests** - Easiest to write and debug
2. **Use mocks liberally** - Mock Firestore, LLM, external APIs
3. **Test edge cases** - Empty inputs, invalid data, errors
4. **Use fixtures** - Reuse test data across tests

### Frontend
1. **Follow existing patterns** - Look at Marketing Agent implementation
2. **Mobile-first** - Design for mobile, enhance for desktop
3. **Error handling** - Show user-friendly error messages
4. **Loading states** - Always show feedback during async operations

### Deployment
1. **Test locally first** - Use emulators before deploying
2. **Deploy to staging** - Always test in staging before production
3. **Monitor closely** - Watch logs and metrics after deployment
4. **Have rollback plan** - Know how to rollback if issues arise

---

## 📞 GETTING HELP

### If You Get Stuck
1. **Check documentation** - Review PHASE_2_*.md files
2. **Check existing code** - Look at Marketing Agent (Phase 1)
3. **Check tests** - Look at existing test files in functions/tests/
4. **Ask for help** - Provide specific error messages and context

### Useful Commands
```bash
# View logs
firebase functions:log --only prompt-library-chat

# Check Firestore data
firebase firestore:get prompts --limit 10

# Run specific test
pytest tests/ai_agent/test_tools.py::TestCreatePromptTool::test_create_prompt_success -v

# Check coverage
pytest --cov=src/ai_agent/prompt_library --cov-report=term-missing
```

---

**Good luck with Phase 2 completion! 🚀**

The backend is solid and production-ready. Focus on testing it thoroughly, then build the frontend, and you'll have a complete, working Prompt Library Agent!

