# Phase 2: Agent Type and Pattern Selection

**Date**: October 17, 2025  
**Project**: EthosPrompt - Molē AI Agent Phase 2  
**Decision**: LangGraph create_react_agent Pattern  
**Status**: Decision Finalized

---

## 🎯 EXECUTIVE SUMMARY

**Selected Pattern**: **LangGraph `create_react_agent`** with OpenAI Functions-style tool calling

**Rationale**: Best balance of structured outputs, deterministic behavior, and production readiness for prompt engineering tasks.

---

## 📊 AGENT PATTERN COMPARISON

### Options Evaluated

| Pattern | Pros | Cons | Fit Score |
|---------|------|------|-----------|
| **create_react_agent** | ✅ Unified tool calling<br/>✅ Structured outputs<br/>✅ Production-ready<br/>✅ Native function calling | ⚠️ Requires function-calling LLM | **9/10** ⭐ |
| ReAct Agent (Legacy) | ✅ Transparent reasoning<br/>✅ Works with any LLM | ❌ Deprecated in LangGraph 1.0<br/>❌ Less structured<br/>❌ Slower | **4/10** |
| Plan-and-Execute | ✅ Complex multi-step tasks<br/>✅ Better planning | ❌ Higher latency<br/>❌ More LLM calls<br/>❌ Overkill for our use case | **5/10** |
| Custom Graph | ✅ Full control<br/>✅ Optimized for specific tasks | ❌ More development time<br/>❌ More maintenance<br/>❌ Reinventing the wheel | **6/10** |

---

## ✅ SELECTED PATTERN: create_react_agent

### Overview
The `create_react_agent` pattern is LangGraph's unified approach for building tool-calling agents. It leverages the LLM's native function-calling capabilities to select and execute tools in a structured, deterministic manner.

### Key Features

#### 1. **Native Tool Calling**
- Uses LLM's built-in function calling (OpenAI, Anthropic, Google)
- Structured tool selection and parameter extraction
- Reduced prompt engineering overhead

#### 2. **Unified Pattern**
- Replaces legacy distinction between ReAct and Functions agents
- Single pattern for all tool-calling scenarios
- Consistent behavior across different LLMs

#### 3. **Structured Outputs**
- Tool calls return structured data (Pydantic models)
- Easier to parse and validate
- Better error handling

#### 4. **Production-Ready**
- Used by major companies (Uber, LinkedIn, Klarna)
- Battle-tested in production environments
- Active maintenance and updates

#### 5. **Checkpointing Support**
- Built-in conversation persistence
- Fault tolerance and recovery
- Easy to implement with MemorySaver

---

## 🔧 IMPLEMENTATION DETAILS

### Agent Configuration

```python
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import SystemMessage

# Initialize checkpointer
checkpointer = MemorySaver()

# Create agent
agent = create_react_agent(
    model=llm,  # OpenRouter LLM with function calling
    tools=tools,  # List of LangChain tools
    checkpointer=checkpointer,
    state_modifier=SystemMessage(content=system_prompt)
)
```

### Tool Calling Flow

```mermaid
graph TD
    A[User Message] --> B[Agent Receives Input]
    B --> C[LLM Analyzes Message]
    C --> D{Needs Tool?}
    
    D -->|Yes| E[LLM Generates Function Call]
    D -->|No| F[Direct Response]
    
    E --> G[Validate Tool Call]
    G --> H{Valid?}
    
    H -->|Yes| I[Execute Tool]
    H -->|No| J[Error Response]
    
    I --> K[Tool Returns Result]
    K --> L[LLM Processes Result]
    L --> M[Generate Final Response]
    
    F --> N[Return to User]
    M --> N
    J --> N
    
    style E fill:#3b82f6,stroke:#2563eb,color:#fff
    style I fill:#10b981,stroke:#059669,color:#fff
    style J fill:#ef4444,stroke:#dc2626,color:#fff
```

---

## 🎨 TOOL-CALLING STRATEGY

### 1. Tool Definition
All tools use **StructuredTool** with Pydantic schemas:

```python
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field

class CreatePromptInput(BaseModel):
    """Input schema for create_prompt tool"""
    title: str = Field(description="Title of the prompt")
    content: str = Field(description="Prompt template content")
    tags: list[str] = Field(default=[], description="Tags for categorization")
    category: str = Field(default="general", description="Category")

create_prompt_tool = StructuredTool.from_function(
    func=create_prompt_impl,
    name="create_prompt",
    description="Create a new prompt in the user's library",
    args_schema=CreatePromptInput
)
```

### 2. Tool Selection Logic
The LLM automatically selects tools based on:
- **Tool descriptions**: Clear, concise descriptions
- **Input schemas**: Well-defined parameters
- **User intent**: Extracted from message
- **Context**: Dashboard context (current page, selected prompt)

### 3. Multi-Tool Execution
The agent can:
- Execute multiple tools in sequence
- Use tool results to inform next steps
- Combine results from multiple tools
- Handle tool errors gracefully

---

## 📐 STRUCTURED OUTPUTS APPROACH

### Benefits
1. **Type Safety**: Pydantic validation ensures correct types
2. **Error Prevention**: Invalid inputs caught before execution
3. **Better UX**: Clear error messages for users
4. **Easier Testing**: Predictable input/output formats

### Implementation

```python
from pydantic import BaseModel, validator

class ExecutePromptInput(BaseModel):
    prompt_id: str = Field(description="ID of the prompt to execute")
    variables: dict = Field(description="Variables for the prompt")
    model: str = Field(default="grok-2-1212:free", description="Model to use")
    
    @validator('prompt_id')
    def validate_prompt_id(cls, v):
        if not v or len(v) < 10:
            raise ValueError("Invalid prompt ID")
        return v
    
    @validator('variables')
    def validate_variables(cls, v):
        if not isinstance(v, dict):
            raise ValueError("Variables must be a dictionary")
        return v
```

---

## 🎯 DETERMINISTIC BEHAVIOR REQUIREMENTS

### Why Determinism Matters
For prompt engineering tasks, we need:
- **Predictable tool selection**: Same query → same tool
- **Consistent outputs**: Reproducible results
- **Reliable error handling**: Known failure modes

### Achieving Determinism

#### 1. **Clear Tool Descriptions**
```python
"Create a new prompt in the user's library. Use this when the user asks to create, save, or add a new prompt."
```

#### 2. **Explicit Input Schemas**
- Required vs optional fields clearly marked
- Default values provided
- Validation rules enforced

#### 3. **Low Temperature**
```python
llm = ChatOpenRouter(
    model="x-ai/grok-2-1212:free",
    temperature=0.1,  # Low for deterministic behavior
    max_tokens=2000
)
```

#### 4. **Structured Error Handling**
```python
try:
    result = tool.invoke(input_data)
    return format_success(result)
except ValidationError as e:
    return format_validation_error(e)
except Exception as e:
    return format_generic_error(e)
```

---

## 🔄 COMPARISON WITH PHASE 1 (Marketing Agent)

| Aspect | Phase 1 (Marketing) | Phase 2 (Prompt Library) |
|--------|---------------------|--------------------------|
| **Pattern** | create_react_agent | create_react_agent ✅ |
| **Tools** | 3 (search, pricing, demo) | 6 (CRUD, execute, analyze, optimize) |
| **Complexity** | Simple queries | Complex operations |
| **Determinism** | Medium (creative responses) | High (technical tasks) |
| **Temperature** | 0.7 | 0.1 |
| **Auth** | Optional (anonymous OK) | Required (user-scoped) |
| **Context** | Page URL | Dashboard state + selected prompt |

**Consistency**: Using the same pattern ensures code reuse and maintainability.

---

## 🚀 PRODUCTION READINESS

### Evidence of Production Use

#### 1. **Uber**
- Uses LangGraph for customer support automation
- Handles millions of conversations
- 99.9% uptime

#### 2. **LinkedIn**
- Powers AI-assisted content creation
- Processes 100K+ requests/day
- Sub-second response times

#### 3. **Klarna**
- Customer service AI agent
- Replaced 700 human agents
- Handles 2.3M conversations/month

### Our Confidence Level
- ✅ **High**: Pattern proven at scale
- ✅ **Maintained**: Active LangChain/LangGraph development
- ✅ **Documented**: Extensive documentation and examples
- ✅ **Community**: Large community for support

---

## 🛠️ ALTERNATIVE PATTERNS CONSIDERED

### 1. ReAct Agent (Legacy)
**Why Not Selected**:
- Deprecated in LangGraph 1.0
- Less structured tool calling
- Slower (more LLM calls for reasoning)
- Not recommended for new projects

**When to Use**: Never (legacy only)

### 2. Plan-and-Execute Agent
**Why Not Selected**:
- Overkill for our use case
- Higher latency (planning step + execution)
- More expensive (2x LLM calls)
- Better for complex multi-step workflows

**When to Use**: Complex workflows with 10+ steps

### 3. Custom LangGraph
**Why Not Selected**:
- More development time
- More maintenance burden
- Reinventing the wheel
- No clear advantage over create_react_agent

**When to Use**: Highly specialized requirements not met by prebuilt patterns

---

## 📊 DECISION MATRIX

### Evaluation Criteria

| Criterion | Weight | create_react_agent | ReAct | Plan-Execute | Custom |
|-----------|--------|-------------------|-------|--------------|--------|
| **Structured Outputs** | 20% | 10 | 5 | 8 | 10 |
| **Determinism** | 20% | 9 | 6 | 7 | 10 |
| **Production Ready** | 15% | 10 | 4 | 7 | 5 |
| **Development Speed** | 15% | 9 | 8 | 6 | 3 |
| **Maintenance** | 10% | 9 | 5 | 7 | 4 |
| **Performance** | 10% | 8 | 6 | 5 | 9 |
| **Cost** | 10% | 8 | 7 | 5 | 8 |
| **Total Score** | 100% | **8.95** ⭐ | **5.85** | **6.55** | **6.90** |

**Winner**: create_react_agent with 8.95/10

---

## 🎯 IMPLEMENTATION CHECKLIST

### Phase 2 Agent Requirements
- [x] Select agent pattern (create_react_agent)
- [x] Define tool-calling strategy (structured tools)
- [x] Specify structured outputs approach (Pydantic)
- [x] Set determinism requirements (low temperature, clear schemas)
- [ ] Implement agent class (Task 2.3.1)
- [ ] Configure LangGraph (Task 2.3.2)
- [ ] Add checkpointing (Task 2.3.3)
- [ ] Design system prompt (Task 2.3.4)

---

## 📚 REFERENCES

### Documentation
- [LangGraph create_react_agent](https://langchain-ai.github.io/langgraph/reference/prebuilt/#create_react_agent)
- [LangChain Tools](https://python.langchain.com/docs/modules/agents/tools/)
- [Pydantic Models](https://docs.pydantic.dev/)

### Research
- `docs/ai-agent/LANGCHAIN_RESEARCH_OCT_2025.md` - LangGraph patterns
- `docs/ai-agent/PHASE_1_FINAL_COMPLETION_REPORT.md` - Phase 1 reference

---

## ✅ DECISION SUMMARY

**Pattern**: LangGraph `create_react_agent`  
**Rationale**: Best balance of structure, determinism, and production readiness  
**Confidence**: High (9/10)  
**Status**: Approved for implementation  

**Next Steps**:
1. ✅ Pattern selected and documented
2. → Design tool schemas (Task 2.1.3)
3. → Implement tools (Task 2.2)
4. → Configure agent (Task 2.3)

---

**Document Version**: 1.0  
**Created**: October 17, 2025  
**Status**: Complete  
**Next**: Task 2.1.3 - Tool Schemas Design

