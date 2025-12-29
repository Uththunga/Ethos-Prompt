# LangChain & LangGraph Research Summary (October 2025)

**Research Date**: October 16, 2025  
**Purpose**: Update Molē implementation plan with current LangChain/LangGraph best practices

---

## Executive Summary

### Key Findings

1. **LangChain v1.0 & LangGraph v1.0 Alpha Released** (October 2025)
   - Both frameworks are in v1.0 alpha as of October 2025
   - Stable release expected late October 2025
   - Current production version: v0.3.x (stable)
   - **Recommendation**: Use v0.3.x for production, monitor v1.0 for migration

2. **Legacy Agent Patterns Deprecated**
   - `AgentExecutor` → **Migrate to LangGraph**
   - `ConversationBufferMemory` → **Migrate to LangGraph MemorySaver**
   - `create_tool_calling_agent` → **Use LangGraph `create_react_agent`**
   - ReAct agents and OpenAI Functions agents → **Unified in LangGraph**

3. **LangGraph is the Production Standard**
   - Companies using in production: Uber, LinkedIn, Klarna, Elastic
   - Designed specifically for production agent workloads
   - Replaces legacy LangChain agent executors

---

## Critical Architecture Changes

### 1. Agent Framework: LangGraph (Not Legacy LangChain)

**OLD APPROACH (Deprecated)**:
```python
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.memory import ConversationBufferMemory

agent = create_tool_calling_agent(model, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, memory=memory)
```

**NEW APPROACH (LangGraph 1.0)**:
```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()
agent = create_react_agent(
    model, 
    tools, 
    prompt=system_message,  # Can be string, SystemMessage, or callable
    checkpointer=memory
)
```

### 2. Memory Management: MemorySaver Checkpointer

**OLD APPROACH (Deprecated)**:
```python
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory

memory = ConversationBufferMemory(memory_key='chat_history')
```

**NEW APPROACH (LangGraph)**:
```python
from langgraph.checkpoint.memory import MemorySaver

# In-memory checkpointer (for development)
memory = MemorySaver()

# For production: Use PostgreSQL or other persistent checkpointer
from langgraph.checkpoint.postgres import PostgresSaver
memory = PostgresSaver(connection_string)

# Usage with config
config = {"configurable": {"thread_id": "conversation-123"}}
agent.invoke({"messages": [("user", query)]}, config)
```

### 3. Agent Types: Unified Tool-Calling Pattern

**Key Change**: No more distinction between "ReAct Agent" and "OpenAI Functions Agent"

- LangGraph uses **native tool calling** from the LLM
- `create_react_agent` works with any tool-calling LLM (OpenAI, Anthropic, etc.)
- Structured outputs handled natively via tool calling

**Recommended Pattern**:
```python
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool

@tool
def search_kb(query: str) -> str:
    """Search the knowledge base."""
    return search_results

tools = [search_kb, get_pricing, schedule_demo]

agent = create_react_agent(
    llm,  # Any tool-calling LLM
    tools,
    prompt="You are a helpful marketing assistant."
)
```

---

## Production Best Practices (October 2025)

### 1. Structured Agents with Discrete Steps

**Why**: LangGraph's core design principle
- Enables checkpointing, streaming, human-in-the-loop
- Provides deterministic concurrency (no data races)
- Scales gracefully with agent complexity

**Implementation**:
- Define agents as graphs with nodes (steps) and edges (transitions)
- Use `StateGraph` for custom state management
- Use `create_react_agent` for standard tool-calling agents

### 2. Checkpointing for Durability

**Why**: Production agents need fault tolerance
- Save state at each step
- Resume from any checkpoint
- Enable human-in-the-loop workflows

**Implementation**:
```python
from langgraph.checkpoint.memory import MemorySaver

checkpointer = MemorySaver()
agent = create_react_agent(model, tools, checkpointer=checkpointer)

# Invoke with thread_id for persistence
config = {"configurable": {"thread_id": "user-123-session-456"}}
result = agent.invoke({"messages": [("user", "Hello")]}, config)

# Resume later with same thread_id
result = agent.invoke({"messages": [("user", "Continue")]}, config)
```

### 3. Streaming for User Engagement

**Why**: Reduce perceived latency
- Stream token-by-token for chatbots
- Stream intermediate steps for transparency
- Stream updates for progress indicators

**Stream Modes**:
- `values`: Full state after each step
- `updates`: Only updates from each step
- `messages`: Message-by-message streaming
- `tasks`: Task execution details
- `checkpoints`: Checkpoint snapshots
- `custom`: Custom streaming logic

**Implementation**:
```python
for chunk in agent.stream(
    {"messages": [("user", query)]},
    config,
    stream_mode="messages"  # or "updates", "values", etc.
):
    print(chunk)
```

### 4. Human-in-the-Loop with Interrupts

**Why**: Critical for production AI agents
- Approve/reject actions before execution
- Edit agent plans
- Ask clarifying questions
- Time-travel to previous states

**Implementation**:
```python
from langgraph.prebuilt import create_react_agent

agent = create_react_agent(model, tools, checkpointer=checkpointer)

# Interrupt before tool execution
agent.interrupt_before = ["tools"]

# Run until interrupt
for event in agent.stream({"messages": [("user", query)]}, config):
    if event.get("interrupted"):
        # Show user the planned action
        # Get approval
        # Resume or modify
        agent.update_state(config, modified_state)
```

### 5. Tracing and Observability

**Why**: Debug and improve agent performance
- LangSmith for native tracing
- OpenTelemetry (OTEL) for wider compatibility
- LangGraph Studio for visual debugging

**Implementation**:
```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-api-key"

# Traces automatically sent to LangSmith
agent.invoke({"messages": [("user", query)]}, config)
```

### 6. Parallelization for Performance

**Why**: Reduce actual latency
- Execute independent steps concurrently
- No data races (guaranteed by LangGraph)
- Deterministic execution order

**How it Works**:
- LangGraph automatically detects parallelizable nodes
- Uses BSP/Pregel algorithm for deterministic concurrency
- Updates applied in deterministic order

---

## Hallucination Reduction Techniques (2025)

### 1. RAG with Hybrid Search
- Combine semantic search (70%) + BM25 keyword search (30%)
- Use smaller chunks (512-1024 tokens) for precision
- Implement re-ranking for top results

### 2. Structured Outputs
- Use tool calling for structured responses
- Define Pydantic models for output validation
- Leverage native structured output APIs (OpenAI, Anthropic)

### 3. Few-Shot Prompting
- Include 2-3 examples in system prompt
- Use LangSmith datasets for example selection
- Implement dynamic example selection based on query similarity

### 4. Chain-of-Thought (CoT)
- Prompt LLM to "think step by step"
- Use intermediate reasoning steps
- Validate reasoning before final answer

### 5. Reflexion Pattern
- Agent reviews its own output
- Self-correction loop
- Confidence scoring

### 6. Grounding with Citations
- Always return sources with RAG responses
- Attribute claims to specific documents
- Enable user verification

---

## Migration Guide: Legacy LangChain → LangGraph

### Step 1: Replace AgentExecutor
```python
# OLD
from langchain.agents import AgentExecutor
agent_executor = AgentExecutor(agent=agent, tools=tools)

# NEW
from langgraph.prebuilt import create_react_agent
agent = create_react_agent(model, tools)
```

### Step 2: Replace Memory
```python
# OLD
from langchain.memory import ConversationBufferMemory
memory = ConversationBufferMemory()

# NEW
from langgraph.checkpoint.memory import MemorySaver
checkpointer = MemorySaver()
agent = create_react_agent(model, tools, checkpointer=checkpointer)
```

### Step 3: Update Invocation Pattern
```python
# OLD
result = agent_executor.invoke({"input": query})

# NEW
config = {"configurable": {"thread_id": "session-123"}}
result = agent.invoke({"messages": [("user", query)]}, config)
```

### Step 4: Update Streaming
```python
# OLD
for step in agent_executor.stream({"input": query}):
    print(step)

# NEW
for chunk in agent.stream(
    {"messages": [("user", query)]},
    config,
    stream_mode="updates"
):
    print(chunk)
```

---

## Recommendations for Molē Implementation

### 1. Use LangGraph (Not Legacy LangChain Agents)
- **Marketing Agent**: `create_react_agent` with tools
- **Prompt Library Agent**: `create_react_agent` with tools
- **No distinction needed** between "ReAct" and "Functions" agents

### 2. Implement Checkpointing from Day 1
- Use `MemorySaver` for development
- Plan for PostgreSQL checkpointer in production
- Enable conversation persistence and fault tolerance

### 3. Leverage Streaming
- Stream messages token-by-token for chatbot UX
- Stream updates for transparency
- Use `stream_mode="messages"` for marketing chat

### 4. Plan for Human-in-the-Loop
- Interrupt before tool execution (optional)
- Enable approval workflows for sensitive actions
- Support conversation editing and time-travel

### 5. Integrate LangSmith from Start
- Enable tracing in development
- Monitor agent trajectories
- Collect feedback for improvement

### 6. Use Hybrid RAG
- 70% semantic + 30% BM25 (as planned)
- Smaller chunks for marketing KB (800 tokens)
- Re-ranking for top results

### 7. Cost Control
- Use `:free` models for testing (as planned)
- Implement `OPENROUTER_USE_MOCK` (as planned)
- Track token usage per conversation

---

## Updated Technology Stack

### Core Frameworks
- **LangGraph**: v0.3.x (stable) → v1.0 (when released)
- **LangChain Core**: v0.3.x
- **LangChain OpenAI/Anthropic**: Latest integration packages

### Checkpointing
- **Development**: `MemorySaver` (in-memory)
- **Production**: PostgreSQL checkpointer or Firestore-based custom checkpointer

### Observability
- **LangSmith**: Native tracing and monitoring
- **LangGraph Studio**: Visual debugging (development)
- **Custom**: Firebase Performance Monitoring + Sentry

### Models (via OpenRouter)
- **Development**: Models with `:free` suffix
- **Production**: `openai/gpt-4-turbo`, `anthropic/claude-3.5-sonnet`

---

## Next Steps

1. **Update Implementation Plan**
   - Replace "Conversational ReAct Agent" → "LangGraph Agent"
   - Replace "OpenAI Functions Agent" → "LangGraph Agent"
   - Update code examples to use `create_react_agent`
   - Add checkpointing configuration
   - Update memory management approach

2. **Update Code Templates**
   - Provide LangGraph examples (not legacy AgentExecutor)
   - Show checkpointing patterns
   - Demonstrate streaming modes
   - Include human-in-the-loop examples

3. **Update Task List**
   - Reflect LangGraph-first approach
   - Add checkpointing setup tasks
   - Add LangSmith integration tasks
   - Remove deprecated patterns

---

## References

- [LangChain v1.0 Release Policy](https://python.langchain.com/docs/versions/release_policy/)
- [Migrating to LangGraph](https://python.langchain.com/docs/how_to/migrate_agent/)
- [Building LangGraph Blog Post](https://blog.langchain.com/building-langgraph/)
- [LangGraph Production Best Practices](https://langchain-ai.github.io/langgraph/)
- [LangChain v0.3 Deprecations](https://python.langchain.com/docs/versions/v0_3/)

---

**Document Version**: 1.0  
**Last Updated**: October 16, 2025  
**Author**: Augment Agent (Research & Analysis)

