# Molē AI Agent - Comprehensive Implementation Plan

## Executive Summary

**Project**: Molē (stylized as "molē" in UI) - Context-Aware AI Agent for EthosPrompt
**Brand**: EthosPrompt (capital E and P, no spacing)
**Live Application**: https://rag-prompt-library.web.app
**Tech Stack**: **LangGraph 1.0** + OpenRouter API + Firebase Cloud Functions + React 18 + TypeScript
**Region**: australia-southeast1
**Last Updated**: October 16, 2025 (Updated with LangGraph 1.0 best practices)

### Objective

Implement a production-ready, context-aware AI agent with dual expertise modes:

1. **Marketing Expert Mode** - Assists visitors on public-facing pages (Homepage, Solutions, Core Services, Prompt Education)
2. **Prompt Engineering Expert Mode** - Assists authenticated users in the Prompt Library Dashboard

### Key Requirements

- **Framework**: **LangGraph v0.3.x** (production-ready, migrating to v1.0 when stable)
- **LLM Provider**: OpenRouter API (already integrated)
- **Cost Control**: Use `:free` suffix models for dev/testing
- **Context Awareness**: Auto-detect Marketing vs. Dashboard sections
- **Authentication**: Respect Firebase Auth state
- **Performance**: <2s for simple queries, <5s for RAG queries
- **Security**: Input validation, rate limiting, data protection
- **Durability**: Checkpointing for fault tolerance and conversation persistence

### Architecture Update (October 2025)

**IMPORTANT**: This plan has been updated to use **LangGraph** instead of legacy LangChain agents:

- ❌ **Deprecated**: `AgentExecutor`, `ConversationBufferMemory`, `create_tool_calling_agent`
- ✅ **Current**: `create_react_agent`, `MemorySaver` checkpointer, LangGraph streaming
- 📚 **Reference**: See `LANGCHAIN_RESEARCH_OCT_2025.md` for detailed migration guide

---

## Table of Contents

1. [Phase 1: Molē Marketing Agent (Public-Facing)](#phase-1-molē-marketing-agent)
2. [Phase 2: Molē Prompt Library Agent (Authenticated Dashboard)](#phase-2-molē-prompt-library-agent)
3. [Phase 3: Cross-Phase Infrastructure](#phase-3-cross-phase-infrastructure)
4. [Implementation Timeline](#implementation-timeline)
5. [Risk Assessment](#risk-assessment)
6. [Success Metrics](#success-metrics)

---

## Phase 1: Molē Marketing Agent (Public-Facing)

**Estimated Effort**: 80-100 hours (2-2.5 weeks)

### 1.1 Architecture & Design (12 hours)

#### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FloatingMoleicon (Marketing Pages)                   │  │
│  │  - Homepage, Solutions, Services, Education           │  │
│  │  - Click → Opens Chat Modal                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MarketingChatModal Component                         │  │
│  │  - Message display                                     │  │
│  │  - Input field                                         │  │
│  │  - Streaming response                                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTPS Callable
┌─────────────────────────────────────────────────────────────┐
│         Firebase Cloud Functions (Python)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  marketing_chat (Callable Function)                   │  │
│  │  - Input: { message, conversationId?, context }       │  │
│  │  - Output: { response, sources, conversationId }      │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MarketingAgentOrchestrator (LangGraph)               │  │
│  │  - Pattern: create_react_agent                        │  │
│  │  - Checkpointer: MemorySaver (dev) / Firestore (prod) │  │
│  │  - Tools: [search_kb, get_pricing, schedule_demo]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Marketing Knowledge Base (RAG)                       │  │
│  │  - Vector Store: Firestore Vector Search              │  │
│  │  - Embeddings: Google text-embedding-004              │  │
│  │  - Retrieval: Hybrid (Semantic + BM25)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              OpenRouter API                                  │
│  - Model: x-ai/grok-4-fast:free (dev/testing)               │
│  - Model: openai/gpt-4-turbo (production)                   │
│  - Streaming: Enabled                                        │
└─────────────────────────────────────────────────────────────┘
```

#### Agent Pattern Selection: **LangGraph create_react_agent**

**Rationale** (Updated October 2025):

- **LangGraph**: Production-ready framework (used by Uber, LinkedIn, Klarna)
- **create_react_agent**: Unified pattern for tool-calling agents (replaces legacy ReAct/Functions distinction)
- **Native Tool Calling**: Leverages LLM's built-in function calling capabilities
- **Checkpointing**: Built-in fault tolerance and conversation persistence
- **Streaming**: Multiple stream modes for optimal UX
- **Transparency**: Shows reasoning steps (useful for debugging)

**Alternative Considered**: Plan-and-Execute Agent (rejected due to higher latency)

#### State Management

**Conversation Storage**:

```typescript
// Firestore Collection: marketing_conversations
{
  conversationId: string;
  userId?: string;  // Optional (anonymous users allowed)
  sessionId: string;  // Browser session ID
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Timestamp;
    metadata?: {
      sources?: string[];
      toolCalls?: string[];
    };
  }>;
  context: {
    currentPage: string;  // e.g., '/solutions', '/services/smart-assistant'
    referrer?: string;
    userAgent: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'active' | 'archived';
}
```

#### Context Detection Mechanism

**URL-Based Detection**:

```typescript
// frontend/src/utils/agentContext.ts
export function detectAgentMode(pathname: string): 'marketing' | 'dashboard' {
  if (pathname.startsWith('/dashboard')) {
    return 'dashboard';
  }
  return 'marketing';
}

export function getPageContext(pathname: string): string {
  const pageMap: Record<string, string> = {
    '/': 'homepage',
    '/solutions': 'solutions_page',
    '/services/smart-assistant': 'smart_assistant_service',
    '/services/custom-ai': 'custom_ai_service',
    '/services/digital-transformation': 'digital_transformation_service',
    '/services/intelligent-applications': 'intelligent_applications_service',
    '/services/system-integration': 'system_integration_service',
    '/prompt-library': 'prompt_library_landing',
    '/education/basics': 'prompt_education_basics',
    '/education/techniques': 'prompt_education_techniques',
  };
  return pageMap[pathname] || 'unknown';
}
```

**Deliverables**:

- [ ] System architecture diagram (Mermaid)
- [ ] Agent type selection document
- [ ] State management schema
- [ ] Context detection utility functions
- [ ] Technical design review

---

### 1.2 Knowledge Base & RAG Setup (20 hours)

#### Content Sources

**Marketing Pages to Index**:

1. **Homepage** (`/`)

   - Hero section
   - Core services overview
   - Value propositions
   - Trust signals

2. **Solutions Page** (`/solutions`)

   - Problem statements
   - Solution descriptions
   - Use cases
   - Benefits

3. **Service Pages** (`/services/*`)

   - Smart Business Assistant
   - Custom AI Solutions
   - Digital Transformation
   - Intelligent Applications
   - System Integration

4. **Prompt Education** (`/education/*`)

   - Basics guide
   - Techniques guide
   - Best practices

5. **FAQ & Pricing**
   - Common questions
   - Pricing tiers
   - Package details

#### Document Chunking Strategy

**Approach**: Semantic Chunking with Metadata

```python
# functions/src/ai_agent/marketing_kb_processor.py
from langchain.text_splitter import RecursiveCharacterTextSplitter

class MarketingKBProcessor:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,  # Smaller chunks for precise retrieval
            chunk_overlap=150,  # Overlap to preserve context
            separators=["\n\n", "\n", ". ", " ", ""],
            length_function=len,
        )

    def process_page(self, page_content: str, page_metadata: dict) -> List[Document]:
        """
        Process a marketing page into chunks with metadata

        Args:
            page_content: Raw HTML/Markdown content
            page_metadata: {
                'page_url': str,
                'page_title': str,
                'section': str,  # e.g., 'services', 'education'
                'keywords': List[str]
            }

        Returns:
            List of LangChain Document objects
        """
        # Extract clean text (remove HTML tags, scripts, styles)
        clean_text = self._clean_html(page_content)

        # Split into chunks
        chunks = self.text_splitter.create_documents(
            texts=[clean_text],
            metadatas=[page_metadata]
        )

        # Enhance metadata for each chunk
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                'chunk_index': i,
                'total_chunks': len(chunks),
                'char_count': len(chunk.page_content),
                'indexed_at': datetime.now(timezone.utc).isoformat()
            })

        return chunks
```

#### Vector Embedding Approach

**Model**: Google `text-embedding-004` (already integrated in RAG pipeline)

**Storage**: Firestore Vector Search

```python
# Collection: marketing_knowledge_base
{
  chunkId: string;
  content: string;
  embedding: Vector;  # 768 dimensions
  metadata: {
    pageUrl: string;
    pageTitle: string;
    section: string;
    keywords: string[];
    chunkIndex: number;
    totalChunks: number;
  };
  createdAt: Timestamp;
}
```

#### Retrieval Strategy

**Hybrid Search**: Semantic (70%) + BM25 (30%)

```python
# functions/src/ai_agent/marketing_retriever.py
from langchain.retrievers import EnsembleRetriever
from langchain.retrievers import BM25Retriever
from langchain_community.vectorstores import Firestore

class MarketingRetriever:
    def __init__(self, db, embedding_service):
        # Semantic retriever (Firestore Vector Search)
        self.vector_store = Firestore(
            client=db,
            collection_name="marketing_knowledge_base",
            embedding_service=embedding_service
        )
        self.semantic_retriever = self.vector_store.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 8}
        )

        # BM25 retriever (keyword-based)
        self.bm25_retriever = BM25Retriever.from_documents(
            documents=self._load_all_documents(),
            k=8
        )

        # Ensemble retriever (combines both)
        self.ensemble_retriever = EnsembleRetriever(
            retrievers=[self.semantic_retriever, self.bm25_retriever],
            weights=[0.7, 0.3]  # 70% semantic, 30% keyword
        )

    async def retrieve(self, query: str, page_context: str = None) -> List[Document]:
        """
        Retrieve relevant documents with optional page context filtering
        """
        results = await self.ensemble_retriever.aget_relevant_documents(query)

        # Filter by page context if provided
        if page_context:
            results = [
                doc for doc in results
                if doc.metadata.get('section') == page_context
            ]

        # Re-rank by relevance (optional)
        results = self._rerank(query, results)

        return results[:5]  # Top 5 results
```

**Deliverables**:

- [ ] Content extraction scripts for all marketing pages
- [ ] Document chunking implementation
- [ ] Vector embedding generation pipeline
- [ ] Firestore collection setup
- [ ] Hybrid retrieval implementation
- [ ] Knowledge base indexing complete

---

### 1.3 LangChain Framework Configuration (16 hours)

#### Agent Type Configuration

```python
# functions/src/ai_agent/marketing_agent.py
from langchain.agents import ConversationalAgent, AgentExecutor
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool

class MarketingAgent:
    def __init__(self, llm, retriever, db):
        self.llm = llm
        self.retriever = retriever
        self.db = db

        # Define tools
        self.tools = self._create_tools()

        # Create agent
        self.agent = ConversationalAgent.from_llm_and_tools(
            llm=self.llm,
            tools=self.tools,
            system_message=self._get_system_prompt(),
            verbose=True  # Enable for debugging
        )

        # Create executor
        self.executor = AgentExecutor.from_agent_and_tools(
            agent=self.agent,
            tools=self.tools,
            memory=ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True
            ),
            max_iterations=5,
            early_stopping_method="generate"
        )

    def _create_tools(self) -> List[Tool]:
        """Create tools for the agent"""
        return [
            Tool(
                name="search_knowledge_base",
                func=self._search_kb,
                description="Search the EthosPrompt knowledge base for information about services, pricing, features, and use cases. Input should be a search query."
            ),
            Tool(
                name="get_pricing_info",
                func=self._get_pricing,
                description="Get detailed pricing information for EthosPrompt services. Input should be the service name (e.g., 'Smart Business Assistant', 'Custom AI Solutions')."
            ),
            Tool(
                name="schedule_demo",
                func=self._schedule_demo,
                description="Help user schedule a demo or consultation. Input should be the user's preferred service and contact preference."
            )
        ]
```

#### Prompt Template Design

```python
def _get_system_prompt(self) -> str:
    return """You are Molē (pronounced "moh-lay"), the AI assistant for EthosPrompt, an Australian AI solutions company.

Your role is to help visitors understand EthosPrompt's services, answer questions about pricing and features, and guide them toward the right solution for their business needs.

## About EthosPrompt

EthosPrompt provides enterprise AI solutions including:
1. Smart Business Assistant - AI-powered customer service automation
2. Custom AI Solutions - Tailored AI applications for specific business needs
3. Digital Transformation - End-to-end AI integration and process automation
4. Intelligent Applications - Mobile-first AI applications
5. System Integration - Connect AI with existing business systems

## Your Personality

- Friendly and professional
- Australian business context (use AUD for pricing, Australian examples)
- Consultative approach - ask questions to understand needs
- Transparent about capabilities and limitations
- Focus on business value and ROI

## Guidelines

1. **Always search the knowledge base** before answering questions about services, pricing, or features
2. **Cite sources** when providing specific information (e.g., "According to our Solutions page...")
3. **Ask clarifying questions** if the user's needs are unclear
4. **Suggest next steps** (e.g., "Would you like to schedule a demo?", "I can provide more details about...")
5. **Be concise** - aim for 2-3 paragraphs maximum per response
6. **Use formatting** - bullet points, bold text for emphasis
7. **Handle objections** professionally - acknowledge concerns and provide evidence

## What NOT to do

- Don't make up pricing or features not in the knowledge base
- Don't promise specific outcomes without qualification
- Don't be pushy or overly sales-focused
- Don't provide technical implementation details unless asked
- Don't discuss competitors negatively

## Current Context

Page: {page_context}
User Type: {user_type}

Begin!"""
```

**Deliverables**:

- [ ] LangChain agent implementation
- [ ] Tool definitions (search KB, get pricing, schedule demo)
- [ ] System prompt template
- [ ] Memory configuration
- [ ] Agent executor setup
- [ ] Unit tests for agent logic

---

### 1.4 OpenRouter API Integration (12 hours)

#### Model Selection

**Development/Testing**:

- Primary: `x-ai/grok-4-fast:free` (fast, free, good for testing)
- Fallback: `z-ai/glm-4.5-air:free` (function calling support)

**Production**:

- Primary: `openai/gpt-4-turbo` (best quality, streaming support)
- Fallback: `anthropic/claude-3.5-sonnet` (alternative provider)

#### API Client Implementation

```python
# functions/src/ai_agent/openrouter_langchain.py
from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun
from typing import Optional, List, Any
import aiohttp

class OpenRouterLLM(LLM):
    """Custom LangChain LLM wrapper for OpenRouter API"""

    api_key: str
    model: str = "x-ai/grok-4-fast:free"
    temperature: float = 0.7
    max_tokens: int = 2000
    streaming: bool = True

    @property
    def _llm_type(self) -> str:
        return "openrouter"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Non-streaming call"""
        # Use existing OpenRouterClient
        from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig

        config = OpenRouterConfig(
            api_key=self.api_key,
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )

        async def _generate():
            async with OpenRouterClient(config) as client:
                response = await client.generate_response(
                    prompt=prompt,
                    system_prompt=None
                )
                return response.content

        import asyncio
        return asyncio.run(_generate())

    async def _acall(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Async call with streaming support"""
        from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig

        config = OpenRouterConfig(
            api_key=self.api_key,
            model=self.model,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            stream=self.streaming
        )

        if self.streaming and run_manager:
            # Streaming mode
            full_response = ""
            async with OpenRouterClient(config) as client:
                async for chunk in client.generate_response_stream(prompt=prompt):
                    if chunk.content:
                        full_response += chunk.content
                        # Send token to callback
                        await run_manager.on_llm_new_token(chunk.content)
            return full_response
        else:
            # Non-streaming mode
            async with OpenRouterClient(config) as client:
                response = await client.generate_response(prompt=prompt)
                return response.content
```

#### Cost Tracking

```python
# functions/src/ai_agent/cost_tracker.py
class AgentCostTracker:
    def __init__(self, db):
        self.db = db

    async def track_usage(
        self,
        conversation_id: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        cost_estimate: float
    ):
        """Track agent usage and costs"""
        doc_ref = self.db.collection('agent_usage').document()
        await doc_ref.set({
            'conversationId': conversation_id,
            'model': model,
            'promptTokens': prompt_tokens,
            'completionTokens': completion_tokens,
            'totalTokens': prompt_tokens + completion_tokens,
            'costEstimate': cost_estimate,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'agentMode': 'marketing'
        })
```

**Deliverables**:

- [ ] OpenRouter LangChain LLM wrapper
- [ ] Streaming implementation
- [ ] Cost tracking system
- [ ] Model fallback logic
- [ ] Usage monitoring dashboard query

---

### 1.5 UI/UX Integration (16 hours)

#### Integration with FloatingMoleicon

**Current Implementation** (from `App.tsx`):

```typescript
const FloatingMoleicon: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) {
    return null; // Hidden on dashboard (uses RightPanel instead)
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-20 h-20 z-50">
      <Suspense fallback={<div className="w-20 h-20 animate-pulse bg-gray-200 rounded-full" />}>
        <Moleicon hoverIntensity={0.8} rotateOnHover={false} />
      </Suspense>
    </div>
  );
};
```

**Enhanced Implementation**:

```typescript
// frontend/src/components/marketing/FloatingMoleiconChat.tsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Moleicon from './ui/Moleicon';
import { MarketingChatModal } from './MarketingChatModal';

export const FloatingMoleiconChat: React.FC = () => {
  const location = useLocation();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-20 h-20 z-50
                   hover:scale-110 transition-transform duration-200
                   focus:outline-none focus:ring-4 focus:ring-ethos-purple/50 rounded-full"
        aria-label="Open AI Assistant Chat"
      >
        <Moleicon hoverIntensity={0.8} rotateOnHover={true} />
      </button>

      {/* Chat Modal */}
      <MarketingChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        pageContext={location.pathname}
      />
    </>
  );
};
```

#### Chat Interface Design

```typescript
// frontend/src/components/marketing/MarketingChatModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { marketingChatService } from '@/services/marketingChatService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Array<{ title: string; url: string }>;
}

interface MarketingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext: string;
}

export const MarketingChatModal: React.FC<MarketingChatModalProps> = ({
  isOpen,
  onClose,
  pageContext,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "👋 Hi! I'm molē, your AI assistant. How can I help you learn about EthosPrompt today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await marketingChatService.sendMessage({
        message: input,
        conversationId,
        pageContext,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(response.conversationId);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10">
                <Moleicon hue={180} hoverIntensity={0.3} rotateOnHover={false} />
              </div>
              <div>
                <DialogTitle>molē</DialogTitle>
                <p className="text-sm text-gray-500">AI Assistant</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-ethos-purple text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-300">
                    <p className="text-xs font-semibold mb-1">Sources:</p>
                    {message.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        className="text-xs text-ethos-purple hover:underline block"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {source.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <Loader2 className="w-5 h-5 animate-spin text-ethos-purple" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about EthosPrompt..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ethos-purple"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-ethos-purple text-white rounded-lg hover:bg-ethos-purple/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**Deliverables**:

- [ ] FloatingMoleiconChat component
- [ ] MarketingChatModal component
- [ ] marketingChatService implementation
- [ ] Streaming response UI
- [ ] Mobile responsive design
- [ ] Accessibility testing (WCAG 2.1 AA)

---

_This document continues in MOLE_IMPLEMENTATION_PLAN_PART2.md due to length constraints_
