# Contributing to Marketing Agent

Thank you for your interest in contributing to the EthosPrompt Marketing Agent! This guide will help you get started.

---

## Table of Contents

- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Contribution Workflow](#contribution-workflow)
- [Architecture Primer](#architecture-primer)

---

## Development Setup

### Prerequisites

- **Python:** 3.11+
- **Node.js:** 18+ (for Firebase Functions)
- **Git:** Latest version
- **IDE:** VS Code recommended (with Python + Pylance extensions)

### Initial Setup

1. **Clone Repository:**
   ```bash
   git clone https://github.com/your-org/EthosPrompt.git
   cd EthosPrompt/functions
   ```

2. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r src/requirements.txt
   pip install -r requirements-dev.txt  # Dev tools (mypy, pytest, black)
   ```

4. **Set Environment Variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

   **Required Variables:**
   - `OPENROUTER_API_KEY` or (`WATSONX_API_KEY` + `WATSONX_PROJECT_ID`)
   - `PINECONE_API_KEY`
   - `FIREBASE_PROJECT_ID`

5. **Run Tests (Verify Setup):**
   ```bash
   pytest tests/ai_agent/ -v
   ```

---

## Code Standards

### Type Safety

**Requirement:** 100% mypy compliance

```bash
# Run type checker
mypy src/ai_agent/marketing/ --config-file mypy.ini
```

**Guidelines:**
- Use `TypedDict` for dict structures
- Annotate all function signatures
- Use `Optional[T]` for nullable values
- Avoid `Any` unless interfacing with untyped library

### Code Formatting

**Tool:** Black (line length: 100)

```bash
# Auto-format code
black src/ai_agent/marketing/

# Check formatting
black --check src/ai_agent/marketing/
```

### Linting

**Tool:** Flake8

```bash
flake8 src/ai_agent/marketing/ --max-line-length=100
```

### Documentation

**Style:** Google Python Style Guide

**Requirements:**
- Docstrings for all public functions/classes
- Sphinx-compatible format
- Include Args, Returns, Raises sections

**Example:**
```python
async def search_kb(query: str, category: Optional[str] = None) -> str:
    """
    Search the marketing knowledge base.

    Args:
        query: The search query string
        category: Optional category filter (e.g., "pricing", "services")

    Returns:
        Formatted search results with source citations

    Raises:
        ValueError: If query is empty
        ConnectionError: If knowledge base is unreachable
    """
    ...
```

---

## Testing Requirements

### Test Categories

| Type | Command | Coverage Target |
|------|---------|-----------------|
| **Unit Tests** | `pytest tests/ai_agent/test_*.py` | 80%+ |
| **Integration Tests** | `pytest tests/ai_agent/test_*_e2e.py` | 70%+ |
| **Evaluation** | `python scripts/evaluate_reflection.py` | Quality score >85% |

### Writing New Tests

**Location:** `tests/ai_agent/`

**Naming:** `test_<feature>_<scenario>.py`

**Example:**
```python
import pytest
from src.ai_agent.marketing.workflow_nodes import reflection_node

@pytest.mark.asyncio
async def test_reflection_node_brand_voice():
    """Test reflection detects brand voice violations"""
    state = {
        "messages": [AIMessage(content="Let's delve into the pricing...")],
        "tools_output": []
    }

    result = await reflection_node(state, llm=None)

    assert result["validation_passed"] == False
    assert "brand voice" in result["reflection_feedback"].lower()
```

### Running Tests

```bash
# All tests
pytest

# Specific module
pytest tests/ai_agent/test_reflection_validation.py

# With coverage
pytest --cov=src/ai_agent/marketing --cov-report=html

# Verbose output
pytest -v -s
```

---

## Contribution Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

**Branch Naming:**
- `feature/*`: New features
- `fix/*`: Bug fixes
- `docs/*`: Documentation only
- `refactor/*`: Code refactoring
- `test/*`: Test additions

### 2. Make Changes

**Checklist Before Commit:**
- [ ] Code passes `mypy`
- [ ] Code formatted with `black`
- [ ] Tests added/updated
- [ ] Tests passing
- [ ] Docstrings added
- [ ] `CHANGELOG.md` updated (if user-facing change)

### 3. Commit Changes

**Format:**
```
<type>(<scope>): <subject>

<body>
```

**Example:**
```
feat(reflection): add timeout detection for LLM verification

- Add 5s timeout to verify_claims function
- Fall back to keyword checks if timeout exceeded
- Update tests to mock timeout scenario

Closes #123
```

### 4. Push and Create PR

```bash
git push origin feature/your-feature-name
```

**PR Template:**
```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passed
- [ ] Evaluation score maintained/improved

## Checklist
- [ ] Code follows style guidelines
- [ ] mypy passes
- [ ] Tests pass
- [ ] Documentation updated
```

### 5. Code Review

**Requirements:**
- 1+ approvals from maintainers
- All CI checks passing
- No merge conflicts

**Review Criteria:**
- Code quality and readability
- Test coverage
- Documentation completeness
- Performance considerations
- Security implications

---

## Architecture Primer

### Key Concepts

#### StateGraph Workflow
- **Nodes:** `llm`, `tools`, `reflect`
- **Routing:** Conditional edges based on `next_action`
- **State:** `MarketingAgentState` TypedDict

#### Reflection Mechanism
- 9 validation checks per response
- Self-correction via feedback loop
- Max iterations: 10 (configurable)

#### Tool System
- `search_kb`: RAG knowledge retrieval
- `get_pricing`: Pricing info lookup
- `request_consultation`: Lead generation

### Code Organization

```
src/ai_agent/marketing/
├── marketing_agent.py       # Main agent class
├── workflow_graph.py         # StateGraph definition
├── workflow_nodes.py         # Node implementations
├── agent_state.py            # State schema
├── marketing_prompts.py      # System prompts
├── marketing_retriever.py    # RAG retrieval logic
├── marketing_kb_content.py   # Knowledge base data
└── firestore_checkpointer.py # Conversation persistence
```

### Common Tasks

#### Adding a Validation Check

**File:** `workflow_nodes.py:reflection_node`

```python
# Add to validation checks section (around line 210)
if "specific_pattern" in response_text.lower():
    issues.append("New validation rule triggered")
```

#### Adding a Tool

**File:** `marketing_agent.py:_define_tools`

```python
@tool
async def new_tool(param: str) -> str:
    """Tool description"""
    # Implementation
    return result

# Add to return statement
return [search_kb, get_pricing, request_consultation, new_tool]
```

#### Modifying System Prompt

**File:** `marketing_prompts.py`

```python
def get_system_prompt() -> str:
    return """
    # Update prompt content here
    """
```

**Important:** Test prompt changes with evaluation script before deploying

---

## Performance Guidelines

### Best Practices

1. **Use Async/Await:** All I/O operations should be async
2. **Cache Expensive Calls:** LLM calls, embeddings, etc.
3. **Lazy Imports:** Defer heavy imports to reduce cold start
4. **Batch Operations:** Group database/API calls when possible

### Benchmarks

| Operation | Target | Current |
|-----------|--------|---------|
| Cold Start | <2s | ~1.5s |
| Warm Response | <1s | ~600ms |
| Tool Call | <500ms | ~300ms |
| Reflection Check | <200ms | ~150ms |

### Monitoring

Track via `metadata` in responses:
- `token_usage`: LLM token consumption
- `iteration_count`: Reflection attempts
- `tool_calls`: Number of tool invocations

---

## Troubleshooting

### Common Issues

**Problem:** `ModuleNotFoundError: No module named 'src'`

**Solution:**
```python
import sys
sys.path.insert(0, os.path.abspath('.'))
```

---

**Problem:** mypy errors in LangGraph code

**Solution:** Add to `mypy.ini`:
```ini
[mypy-langgraph.*]
ignore_errors = True
```

---

**Problem:** Tests fail with Firebase connection error

**Solution:** Use mock mode:
```bash
export OPENROUTER_USE_MOCK=true
pytest
```

---

## Getting Help

- **Documentation:** [`docs/ARCHITECTURE.md`](file:///d:/react/React-App-000740/EthosPrompt/functions/docs/ARCHITECTURE.md)
- **Issues:** GitHub Issues with `marketing-agent` label
- **Slack:** #marketing-agent-dev channel
- **Email:** dev-team@ethosprompt.com

---

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct.

**TL;DR:** Be respectful, inclusive, and professional.

---

**Thank you for contributing!** 🎉
