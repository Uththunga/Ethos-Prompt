# Free Models Guide
**RAG Prompt Library - Complete Guide to Free AI Models**  
**Last Updated:** 2025-10-03

---

## 📖 Table of Contents

1. [Introduction](#introduction)
2. [Available Free Models](#available-free-models)
3. [Model Selection Guide](#model-selection-guide)
4. [Agent-Capable Models](#agent-capable-models)
5. [Usage Examples](#usage-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

The RAG Prompt Library provides access to **12 high-quality AI models at zero cost**. All models listed here have **$0/M input and output tokens**, making them ideal for:

- Learning and experimentation
- Production applications with cost constraints
- High-volume use cases
- AI agent creation and agentic workflows

### Key Benefits

✅ **Zero Cost** - No API charges for model usage  
✅ **Production-Ready** - Stable, reliable models  
✅ **Agent-Capable** - 5 models with function calling/tool use  
✅ **High Performance** - Fast response times (300-1200ms)  
✅ **Large Context** - Up to 2M tokens context length  

---

## Available Free Models

### PRIMARY TIER (Recommended)

#### 1. Grok 4 Fast (Default)
- **Model ID:** `x-ai/grok-4-fast:free`
- **Provider:** xAI
- **Context:** 2M tokens (largest)
- **Speed:** 800ms average
- **Best For:** Long-form content, complex prompts, document analysis
- **Agent Capable:** Unknown

#### 2. GLM 4.5 Air ⭐ BEST FOR AGENTS
- **Model ID:** `z-ai/glm-4.5-air:free`
- **Provider:** Zhipu AI
- **Context:** 1M tokens
- **Speed:** 400ms average (fastest)
- **Best For:** AI agents, function calling, tool use, real-time applications
- **Agent Capable:** ✅ YES - Purpose-built for agents

#### 3. Microsoft MAI-DS-R1 ⭐ AGENT OPTIMIZED
- **Model ID:** `microsoft/mai-ds-r1:free`
- **Provider:** Microsoft AI
- **Context:** 163K tokens
- **Speed:** 700ms average
- **Best For:** Agent frameworks, multi-step workflows, tool-calling
- **Agent Capable:** ✅ YES - Enhanced for agent frameworks

#### 4. Qwen3 Coder 480B ⭐ BEST FOR CODING AGENTS
- **Model ID:** `qwen/qwen3-coder-480b-a35b-instruct:free`
- **Provider:** Alibaba Cloud (Qwen)
- **Context:** 32K tokens
- **Speed:** 800ms average
- **Best For:** Agentic coding, code generation, development workflows
- **Agent Capable:** ✅ YES - Optimized for agentic coding

#### 5. DeepSeek V3
- **Model ID:** `deepseek/deepseek-v3:free`
- **Provider:** DeepSeek
- **Context:** 163K tokens
- **Speed:** 1200ms average
- **Best For:** Reasoning, analysis, technical documentation
- **Agent Capable:** Unknown

#### 6. Gemma 2 27B
- **Model ID:** `google/gemma-2-27b-it:free`
- **Provider:** Google
- **Context:** 8K tokens
- **Speed:** 600ms average
- **Best For:** General-purpose tasks, content creation, Q&A
- **Agent Capable:** ❌ No

### SECONDARY TIER (Alternatives)

- **Llama 3.1 8B** - Versatile instruction-following (128K context)
- **Mistral 7B** - Fast and efficient (32K context)
- **Qwen 2.5 7B** - Multilingual support (32K context)
- **DeepSeek R1T2 Chimera** - Multi-step reasoning (163K context)

### EXPERIMENTAL TIER (Preview)

- **Gemini 2.5 Flash 09-2025** ⚠️ - Agent-capable, may be retired Oct 31, 2025
- **Gemini 2.5 Flash Lite Preview** ⚠️ - Fast, experimental

---

## Model Selection Guide

### By Use Case

| Use Case | Recommended Model | Alternative |
|----------|------------------|-------------|
| **AI Agents** | GLM 4.5 Air | Microsoft MAI-DS-R1 |
| **Coding Agents** | Qwen3 Coder 480B | GLM 4.5 Air |
| **Code Generation** | Qwen3 Coder 480B | DeepSeek V3 |
| **Reasoning** | DeepSeek V3 | Microsoft MAI-DS-R1 |
| **Long Documents** | Grok 4 Fast (2M) | GLM 4.5 Air (1M) |
| **Fast Responses** | GLM 4.5 Air | Gemma 2 27B |
| **General Purpose** | Grok 4 Fast | Gemma 2 27B |
| **Multilingual** | Qwen 2.5 7B | GLM 4.5 Air |

### By Performance

**Fastest Models:**
1. GLM 4.5 Air (400ms)
2. Mistral 7B (500ms)
3. Gemma 2 27B (600ms)

**Largest Context:**
1. Grok 4 Fast (2M tokens)
2. GLM 4.5 Air (1M tokens)
3. DeepSeek V3 (163K tokens)

**Best for Agents:**
1. GLM 4.5 Air (5/5 score)
2. Microsoft MAI-DS-R1 (5/5 score)
3. Qwen3 Coder 480B (5/5 score)

---

## Agent-Capable Models

### What Makes a Model "Agent-Capable"?

Agent-capable models support:
- ✅ **Function Calling** - Can call external functions
- ✅ **Tool Use** - Can use tools and APIs
- ✅ **Multi-Step Reasoning** - Can plan and execute workflows
- ✅ **Planning** - Can break down complex tasks

### Top 3 Agent Models

#### 1. GLM 4.5 Air - Best Overall
```
Purpose-built for agent-centric applications
✅ Native function calling
✅ Tool-calling with 32K token context
✅ Fastest agent model (300-500ms)
✅ 1M context for complex workflows
```

#### 2. Microsoft MAI-DS-R1 - Community Favorite
```
Microsoft's post-trained DeepSeek R1
✅ Enhanced for agent frameworks
✅ "Best all-around free model for agents"
✅ Strong multi-step reasoning
✅ 163K context
```

#### 3. Qwen3 Coder 480B - Best for Coding
```
Optimized for agentic coding tasks
✅ Function calling in code contexts
✅ MCP (Model Context Protocol) support
✅ 480B parameters (35B active MoE)
✅ Long-context reasoning over repositories
```

---

## Usage Examples

### Basic Prompt Execution

```python
from openrouter_client import OpenRouterClient, OpenRouterConfig

# Using default free model (Grok 4 Fast)
config = OpenRouterConfig(
    api_key="your-api-key",
    model="x-ai/grok-4-fast:free"
)

async with OpenRouterClient(config) as client:
    response = await client.generate_response(
        prompt="Explain quantum computing in simple terms"
    )
    print(response.content)
```

### Agent with Function Calling (GLM 4.5 Air)

```python
# Using GLM 4.5 Air for agent tasks
config = OpenRouterConfig(
    api_key="your-api-key",
    model="z-ai/glm-4.5-air:free"
)

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"}
                }
            }
        }
    }
]

async with OpenRouterClient(config) as client:
    response = await client.generate_response(
        prompt="What's the weather in Tokyo?",
        tools=tools
    )
```

### Coding Agent (Qwen3 Coder)

```python
# Using Qwen3 Coder for agentic coding
config = OpenRouterConfig(
    api_key="your-api-key",
    model="qwen/qwen3-coder-480b-a35b-instruct:free"
)

async with OpenRouterClient(config) as client:
    response = await client.generate_response(
        prompt="Create a REST API with authentication in Python",
        system_prompt="You are an expert coding agent"
    )
```

---

## Best Practices

### 1. Model Selection
- **Start with GLM 4.5 Air** for agent tasks
- **Use Grok 4 Fast** for long documents
- **Use Qwen3 Coder** for coding tasks
- **Test multiple models** for your specific use case

### 2. Performance Optimization
- **Use streaming** for better UX
- **Cache responses** when appropriate
- **Batch requests** when possible
- **Monitor latency** and switch models if needed

### 3. Cost Savings
- **Prefer free models** for all tasks
- **Track usage** to understand patterns
- **Only use paid models** when necessary
- **Monitor cost savings** dashboard

### 4. Agent Development
- **Use GLM 4.5 Air** as primary agent model
- **Test function calling** thoroughly
- **Implement error handling** for tool use
- **Monitor agent performance** metrics

---

## Troubleshooting

### Common Issues

#### Model Not Responding
- Check API key is valid
- Verify model ID is correct
- Check network connectivity
- Try alternative model

#### Slow Response Times
- Switch to faster model (GLM 4.5 Air, Gemma 2 27B)
- Reduce max_tokens parameter
- Use streaming for better UX
- Check server load

#### Function Calling Not Working
- Verify model supports function calling (GLM 4.5 Air, MAI-DS-R1, Qwen3 Coder)
- Check tool definition format
- Validate function parameters
- Review error messages

#### Context Length Exceeded
- Switch to model with larger context (Grok 4 Fast: 2M, GLM 4.5 Air: 1M)
- Reduce prompt length
- Implement chunking strategy
- Use summarization

---

## Additional Resources

- **Research Report:** [free-models-research-UPDATED-OCT-2025.md](./free-models-research-UPDATED-OCT-2025.md)
- **Agent Guide:** [agent-creation-guide.md](./agent-creation-guide.md)
- **API Key Setup:** [custom-api-key-setup.md](./custom-api-key-setup.md)
- **OpenRouter Docs:** https://openrouter.ai/docs

---

**Need Help?** Check the troubleshooting section or refer to the comprehensive research reports.

