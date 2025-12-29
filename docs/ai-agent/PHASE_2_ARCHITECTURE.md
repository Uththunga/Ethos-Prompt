# Phase 2: Prompt Library Agent - System Architecture

**Date**: October 17, 2025  
**Project**: EthosPrompt - Molē AI Agent Phase 2  
**Status**: Architecture Design Complete

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

The Prompt Library Agent is a context-aware AI assistant for authenticated users in the EthosPrompt dashboard. It provides intelligent assistance for prompt engineering tasks including creation, execution, optimization, and performance analysis.

### Key Components
1. **Frontend**: Dashboard chat panel with context awareness
2. **Backend API**: Authenticated endpoint with rate limiting
3. **LangGraph Agent**: Tool-calling agent with 6 specialized tools
4. **Tools**: Prompt operations (CRUD, execute, analyze, optimize)
5. **Storage**: Firestore for conversations, prompts, executions
6. **LLM**: OpenRouter API for agent reasoning and responses

---

## 📊 ARCHITECTURE DIAGRAM

### High-Level Data Flow

```mermaid
graph TB
    subgraph "Frontend - Dashboard"
        User[Authenticated User]
        RightPanel[RightPanel Component]
        ChatPanel[DashboardChatPanel]
        QuickActions[Quick Actions]
        Context[useDashboardContext Hook]
        Service[promptLibraryChatService]
    end
    
    subgraph "Backend - Firebase Cloud Functions"
        API[/api/ai/prompt-library-chat]
        Auth[Authentication Middleware]
        RateLimit[Rate Limiter]
        Agent[PromptLibraryAgent]
        Tools[Tool Registry]
    end
    
    subgraph "Tools - Prompt Operations"
        T1[create_prompt]
        T2[execute_prompt]
        T3[search_prompts]
        T4[get_history]
        T5[analyze_performance]
        T6[suggest_improvements]
    end
    
    subgraph "External Services"
        Firestore[(Firestore)]
        OpenRouter[OpenRouter API]
    end
    
    User --> RightPanel
    RightPanel --> ChatPanel
    ChatPanel --> QuickActions
    ChatPanel --> Context
    ChatPanel --> Service
    
    Service -->|POST + Auth Token| API
    API --> Auth
    Auth -->|Validate Token| Firestore
    Auth --> RateLimit
    RateLimit --> Agent
    
    Agent --> Tools
    Tools --> T1
    Tools --> T2
    Tools --> T3
    Tools --> T4
    Tools --> T5
    Tools --> T6
    
    T1 --> Firestore
    T2 --> Firestore
    T2 --> OpenRouter
    T3 --> Firestore
    T4 --> Firestore
    T5 --> Firestore
    T6 --> OpenRouter
    
    Agent --> OpenRouter
    Agent --> Firestore
    
    Agent -->|Response| API
    API -->|JSON| Service
    Service --> ChatPanel
    ChatPanel --> User
    
    style User fill:#9333ea,stroke:#7e22ce,color:#fff
    style Agent fill:#3b82f6,stroke:#2563eb,color:#fff
    style Tools fill:#10b981,stroke:#059669,color:#fff
    style Firestore fill:#f59e0b,stroke:#d97706,color:#fff
    style OpenRouter fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## 🔄 DETAILED COMPONENT INTERACTIONS

### 1. User Interaction Flow

```mermaid
sequenceDiagram
    participant U as User
    participant CP as ChatPanel
    participant S as Service
    participant API as API Endpoint
    participant Auth as Auth Middleware
    participant A as Agent
    participant T as Tools
    participant FS as Firestore
    participant OR as OpenRouter
    
    U->>CP: Type message
    CP->>S: sendMessage(message, context)
    S->>S: Get Firebase Auth token
    S->>S: Extract dashboard context
    S->>API: POST /api/ai/prompt-library-chat
    
    API->>Auth: Validate token
    Auth->>FS: Verify user
    Auth-->>API: user_id
    
    API->>A: Initialize agent(user_id)
    API->>A: chat(message, context)
    
    A->>A: Analyze message
    A->>T: Call appropriate tool
    T->>FS: Query/Write data
    T-->>A: Tool result
    
    A->>OR: Generate response
    OR-->>A: LLM response
    
    A->>FS: Save conversation
    A-->>API: Response + metadata
    
    API-->>S: JSON response
    S-->>CP: Display response
    CP-->>U: Show message
```

---

## 🔐 AUTHENTICATION FLOW

```mermaid
graph LR
    A[User Login] --> B[Firebase Auth]
    B --> C[ID Token Generated]
    C --> D[Token Stored in Client]
    D --> E[Request to API]
    E --> F{Token Valid?}
    F -->|Yes| G[Extract user_id]
    F -->|No| H[Return 401]
    G --> I[Check Rate Limit]
    I -->|OK| J[Process Request]
    I -->|Exceeded| K[Return 429]
    J --> L[User-Scoped Data Access]
    
    style B fill:#3b82f6,stroke:#2563eb,color:#fff
    style F fill:#f59e0b,stroke:#d97706,color:#fff
    style H fill:#ef4444,stroke:#dc2626,color:#fff
    style K fill:#ef4444,stroke:#dc2626,color:#fff
    style L fill:#10b981,stroke:#059669,color:#fff
```

---

## 🛠️ TOOL ARCHITECTURE

### Tool Execution Flow

```mermaid
graph TD
    A[Agent Receives Message] --> B{Needs Tool?}
    B -->|Yes| C[Select Tool]
    B -->|No| D[Direct Response]
    
    C --> E{Which Tool?}
    
    E -->|Create| F[create_prompt]
    E -->|Execute| G[execute_prompt]
    E -->|Search| H[search_prompts]
    E -->|History| I[get_history]
    E -->|Analyze| J[analyze_performance]
    E -->|Optimize| K[suggest_improvements]
    
    F --> L[Validate Input]
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    L --> M{Valid?}
    M -->|Yes| N[Execute Tool Logic]
    M -->|No| O[Return Error]
    
    N --> P[Access Firestore]
    N --> Q[Call OpenRouter]
    
    P --> R[Return Result]
    Q --> R
    
    R --> S[Format Response]
    S --> T[Return to Agent]
    
    style A fill:#9333ea,stroke:#7e22ce,color:#fff
    style N fill:#10b981,stroke:#059669,color:#fff
    style O fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## 💾 DATA STORAGE ARCHITECTURE

### Firestore Collections

```mermaid
erDiagram
    USERS ||--o{ PROMPTS : creates
    USERS ||--o{ EXECUTIONS : runs
    USERS ||--o{ CONVERSATIONS : has
    PROMPTS ||--o{ EXECUTIONS : generates
    CONVERSATIONS ||--o{ MESSAGES : contains
    
    USERS {
        string uid PK
        string email
        timestamp createdAt
        object preferences
    }
    
    PROMPTS {
        string id PK
        string userId FK
        string title
        string content
        array tags
        string category
        int version
        timestamp createdAt
        timestamp updatedAt
    }
    
    EXECUTIONS {
        string id PK
        string userId FK
        string promptId FK
        object variables
        string output
        int tokensUsed
        float cost
        string status
        timestamp executedAt
    }
    
    CONVERSATIONS {
        string id PK
        string userId FK
        string agentMode
        array messages
        object metadata
        timestamp createdAt
        timestamp updatedAt
    }
    
    MESSAGES {
        string id PK
        string role
        string content
        timestamp timestamp
        object metadata
    }
```

---

## 🔧 COMPONENT SPECIFICATIONS

### Frontend Components

#### 1. DashboardChatPanel
- **Purpose**: Main chat interface for dashboard
- **Features**: Message history, input field, tool indicators, quick actions
- **State**: Messages, loading, error, conversation ID
- **Context**: Current page, selected prompt, user preferences

#### 2. QuickActions
- **Purpose**: Preset prompts for common tasks
- **Actions**: Create prompt, Optimize prompt, Troubleshoot, Analyze
- **Behavior**: One-click population of chat input

#### 3. useDashboardContext Hook
- **Purpose**: Extract and provide dashboard context
- **Data**: Current page, selected prompt ID, recent executions
- **Updates**: On route change, prompt selection

#### 4. promptLibraryChatService
- **Purpose**: API communication layer
- **Methods**: sendMessage(), sendMessageStream()
- **Features**: Auth token injection, retry logic, conversation persistence

### Backend Components

#### 1. PromptLibraryAgent
- **Pattern**: LangGraph create_react_agent
- **Tools**: 6 specialized tools
- **Memory**: MemorySaver with Firestore persistence
- **LLM**: OpenRouter (x-ai/grok-2-1212:free for testing)

#### 2. Authentication Middleware
- **Validation**: Firebase ID token verification
- **Extraction**: user_id from token claims
- **Errors**: 401 for invalid/missing tokens

#### 3. Rate Limiter
- **Limit**: 100 requests/hour per user
- **Storage**: Firestore (conversation counts)
- **Response**: 429 with retry-after header

#### 4. Tools
- **create_prompt**: Firestore write with validation
- **execute_prompt**: Integration with existing execution logic
- **search_prompts**: Firestore query with filters
- **get_history**: Execution history retrieval
- **analyze_performance**: Metric aggregation
- **suggest_improvements**: LLM-powered optimization

---

## 🚀 DEPLOYMENT ARCHITECTURE

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        FH[Firebase Hosting]
        CF[Cloud Functions]
        FS[(Firestore)]
        CM[Cloud Monitoring]
    end
    
    subgraph "External Services"
        OR[OpenRouter API]
        FA[Firebase Auth]
    end
    
    Users --> LB
    LB --> FH
    FH --> CF
    CF --> FS
    CF --> OR
    CF --> FA
    CF --> CM
    
    CM --> Alerts[Alert Notifications]
    
    style LB fill:#3b82f6,stroke:#2563eb,color:#fff
    style CF fill:#10b981,stroke:#059669,color:#fff
    style FS fill:#f59e0b,stroke:#d97706,color:#fff
    style CM fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## 📈 SCALABILITY CONSIDERATIONS

### Performance Targets
- **Response Time**: <2s for simple queries, <5s for complex
- **Throughput**: 100 requests/second
- **Availability**: 99.5% uptime

### Scaling Strategy
1. **Horizontal Scaling**: Cloud Functions auto-scale
2. **Caching**: Response caching for common queries
3. **Rate Limiting**: Prevent abuse and manage costs
4. **Monitoring**: Real-time metrics and alerts

---

## 🔒 SECURITY ARCHITECTURE

### Security Layers
1. **Authentication**: Firebase Auth token validation
2. **Authorization**: User-scoped data access
3. **Input Validation**: Pydantic schemas
4. **Rate Limiting**: Per-user request limits
5. **CORS**: Restricted origins
6. **Firestore Rules**: Server-side validation

### Data Protection
- **Encryption**: TLS in transit, encrypted at rest
- **Access Control**: User can only access own data
- **Audit Logging**: All requests logged with user_id
- **Token Expiry**: Short-lived tokens (1 hour)

---

## 📊 MONITORING & OBSERVABILITY

### Metrics Tracked
1. **Performance**: Response time, latency, throughput
2. **Errors**: Error rate, error types, stack traces
3. **Usage**: Requests/day, tool usage, conversation length
4. **Costs**: Token usage, API costs, per-user costs

### Alerts Configured
- High latency (>5s)
- High error rate (>5%)
- Rate limit violations
- Cost threshold exceeded ($50/month)

---

## 🎯 ARCHITECTURE DECISIONS

### 1. Agent Pattern: LangGraph create_react_agent
**Rationale**: 
- Native tool calling support
- Structured outputs
- Better for deterministic tasks
- Production-ready (used by major companies)

### 2. Storage: Firestore
**Rationale**:
- Real-time updates
- Scalable
- Integrated with Firebase Auth
- Vector search support

### 3. LLM: OpenRouter
**Rationale**:
- Multiple model support
- Cost-effective
- Free models for testing
- Unified API

### 4. Authentication: Firebase Auth
**Rationale**:
- Integrated with existing system
- Secure token-based auth
- Easy client-side integration
- Built-in user management

---

## 📝 NEXT STEPS

1. ✅ Architecture documented
2. → Implement tool schemas (Task 2.1.3)
3. → Implement individual tools (Task 2.2)
4. → Configure LangGraph agent (Task 2.3)
5. → Build API endpoint (Task 2.4)
6. → Integrate frontend (Task 2.6)

---

**Document Version**: 1.0  
**Created**: October 17, 2025  
**Status**: Complete  
**Next**: Task 2.1.2 - Agent Pattern Selection

