# AI Agent Creation Guide
**RAG Prompt Library - Building AI Agents with Free Models**  
**Last Updated:** 2025-10-03

---

## 📖 Table of Contents

1. [Introduction to AI Agents](#introduction-to-ai-agents)
2. [Agent-Capable Free Models](#agent-capable-free-models)
3. [Function Calling Basics](#function-calling-basics)
4. [Tool Use Patterns](#tool-use-patterns)
5. [Multi-Step Workflows](#multi-step-workflows)
6. [Code Examples](#code-examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Introduction to AI Agents

### What is an AI Agent?

An AI agent is an autonomous system that can:
- **Perceive** its environment through inputs
- **Reason** about tasks and goals
- **Act** by calling functions and using tools
- **Learn** from feedback and results

### Key Capabilities

1. **Function Calling** - Invoke external functions
2. **Tool Use** - Interact with APIs and services
3. **Multi-Step Reasoning** - Plan and execute complex workflows
4. **Planning** - Break down tasks into steps
5. **Memory** - Maintain context across interactions

### Why Use Free Models for Agents?

✅ **Zero Cost** - Build and test agents without API charges  
✅ **Production-Ready** - 5 agent-capable models available  
✅ **High Performance** - Fast response times (300-800ms)  
✅ **Purpose-Built** - GLM 4.5 Air designed for agents  

---

## Agent-Capable Free Models

### Top 3 Models for Agent Creation

#### 1. GLM 4.5 Air ⭐ #1 RECOMMENDATION
```
Model ID: z-ai/glm-4.5-air:free
Provider: Zhipu AI
Context: 1M tokens
Speed: 300-500ms (fastest)

✅ Purpose-built for agent-centric applications
✅ Native function calling support
✅ Tool-calling with 32K token context
✅ Optimized for agentic workflows
✅ Best overall agent model

Use Cases:
- General-purpose AI agents
- Multi-step task automation
- Tool-calling applications
- Real-time agent interactions
```

#### 2. Microsoft MAI-DS-R1 ⭐ COMMUNITY FAVORITE
```
Model ID: microsoft/mai-ds-r1:free
Provider: Microsoft AI
Context: 163K tokens
Speed: 600-800ms

✅ Post-trained DeepSeek R1 by Microsoft
✅ Enhanced for agent frameworks
✅ Strong multi-step reasoning
✅ "Best all-around free model for agents"

Use Cases:
- Agent framework integration
- Complex multi-step workflows
- Reasoning-heavy agent tasks
- Agent orchestration
```

#### 3. Qwen3 Coder 480B ⭐ BEST FOR CODING AGENTS
```
Model ID: qwen/qwen3-coder-480b-a35b-instruct:free
Provider: Alibaba Cloud (Qwen)
Context: 32K tokens
Speed: 700-900ms

✅ Optimized for agentic coding tasks
✅ Function calling in code contexts
✅ MCP (Model Context Protocol) support
✅ 480B parameters (35B active MoE)

Use Cases:
- Coding agents
- Development workflow automation
- Code generation with tool integration
- Repository-level code understanding
```

---

## Function Calling Basics

### What is Function Calling?

Function calling allows the AI model to:
1. Recognize when a function should be called
2. Extract parameters from user input
3. Return structured function call requests
4. Process function results

### Basic Function Definition

```python
# Define a simple function
def get_weather(location: str) -> dict:
    """Get current weather for a location"""
    # Implementation
    return {
        "location": location,
        "temperature": 72,
        "condition": "sunny"
    }

# Define function schema for the model
weather_tool = {
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City name or location"
                }
            },
            "required": ["location"]
        }
    }
}
```

### Function Calling Flow

```
1. User Input → "What's the weather in Tokyo?"
2. Model Reasoning → Identifies need to call get_weather
3. Function Call → {"name": "get_weather", "arguments": {"location": "Tokyo"}}
4. Execute Function → get_weather("Tokyo")
5. Function Result → {"temperature": 72, "condition": "sunny"}
6. Model Response → "The weather in Tokyo is sunny with a temperature of 72°F"
```

---

## Tool Use Patterns

### Pattern 1: Single Tool Call

```python
from openrouter_client import OpenRouterClient, OpenRouterConfig

# Configure agent model
config = OpenRouterConfig(
    api_key="your-api-key",
    model="z-ai/glm-4.5-air:free"  # Best for agents
)

# Define tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web for information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"}
                },
                "required": ["query"]
            }
        }
    }
]

async with OpenRouterClient(config) as client:
    response = await client.generate_response(
        prompt="Search for latest AI news",
        tools=tools
    )
    
    # Check if model wants to call a function
    if response.function_call:
        function_name = response.function_call["name"]
        arguments = response.function_call["arguments"]
        
        # Execute function
        result = execute_function(function_name, arguments)
        
        # Send result back to model
        final_response = await client.generate_response(
            prompt="Here's the search result",
            context=str(result)
        )
```

### Pattern 2: Multiple Tool Calls

```python
# Define multiple tools
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather information"
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_flight",
            "description": "Book a flight"
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_hotel",
            "description": "Book a hotel"
        }
    }
]

# Agent can choose which tools to use
async with OpenRouterClient(config) as client:
    response = await client.generate_response(
        prompt="Plan a trip to Paris next week",
        tools=tools
    )
```

### Pattern 3: Tool Chaining

```python
# Sequential tool calls
async def agent_workflow(prompt: str):
    """Execute multi-step agent workflow"""
    
    # Step 1: Search for information
    search_result = await call_tool("search_web", {"query": prompt})
    
    # Step 2: Analyze results
    analysis = await call_tool("analyze_data", {"data": search_result})
    
    # Step 3: Generate report
    report = await call_tool("generate_report", {"analysis": analysis})
    
    return report
```

---

## Multi-Step Workflows

### Example: Research Agent

```python
class ResearchAgent:
    def __init__(self):
        self.config = OpenRouterConfig(
            api_key="your-api-key",
            model="microsoft/mai-ds-r1:free"  # Good for multi-step reasoning
        )
        self.tools = self._define_tools()
    
    def _define_tools(self):
        return [
            {
                "type": "function",
                "function": {
                    "name": "search_web",
                    "description": "Search the web"
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_article",
                    "description": "Read and extract content from URL"
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "summarize",
                    "description": "Summarize text"
                }
            }
        ]
    
    async def research(self, topic: str) -> str:
        """Conduct research on a topic"""
        
        async with OpenRouterClient(self.config) as client:
            # Step 1: Plan research
            plan = await client.generate_response(
                prompt=f"Create a research plan for: {topic}",
                system_prompt="You are a research agent. Plan your research steps."
            )
            
            # Step 2: Execute research steps
            results = []
            for step in plan.steps:
                result = await self._execute_step(client, step)
                results.append(result)
            
            # Step 3: Synthesize findings
            final_report = await client.generate_response(
                prompt="Synthesize research findings",
                context="\n".join(results)
            )
            
            return final_report.content
    
    async def _execute_step(self, client, step):
        """Execute a single research step"""
        response = await client.generate_response(
            prompt=step,
            tools=self.tools
        )
        
        if response.function_call:
            return await self._handle_function_call(response.function_call)
        
        return response.content
```

### Example: Coding Agent

```python
class CodingAgent:
    def __init__(self):
        self.config = OpenRouterConfig(
            api_key="your-api-key",
            model="qwen/qwen3-coder-480b-a35b-instruct:free"  # Best for coding
        )
    
    async def generate_code(self, requirements: str) -> dict:
        """Generate code based on requirements"""
        
        async with OpenRouterClient(self.config) as client:
            # Step 1: Analyze requirements
            analysis = await client.generate_response(
                prompt=f"Analyze these requirements: {requirements}",
                system_prompt="You are a coding agent. Break down requirements."
            )
            
            # Step 2: Design solution
            design = await client.generate_response(
                prompt="Design the solution architecture",
                context=analysis.content
            )
            
            # Step 3: Generate code
            code = await client.generate_response(
                prompt="Generate the code implementation",
                context=design.content
            )
            
            # Step 4: Generate tests
            tests = await client.generate_response(
                prompt="Generate unit tests for the code",
                context=code.content
            )
            
            return {
                "code": code.content,
                "tests": tests.content,
                "design": design.content
            }
```

---

## Code Examples

### Complete Agent Example

```python
import asyncio
from openrouter_client import OpenRouterClient, OpenRouterConfig

class SimpleAgent:
    """Simple AI agent with tool use"""
    
    def __init__(self, model="z-ai/glm-4.5-air:free"):
        self.config = OpenRouterConfig(
            api_key="your-api-key",
            model=model
        )
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "calculate",
                    "description": "Perform mathematical calculations",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "expression": {"type": "string"}
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_time",
                    "description": "Get current time"
                }
            }
        ]
    
    async def run(self, user_input: str) -> str:
        """Run agent with user input"""
        
        async with OpenRouterClient(self.config) as client:
            response = await client.generate_response(
                prompt=user_input,
                tools=self.tools,
                system_prompt="You are a helpful agent. Use tools when needed."
            )
            
            # Handle function calls
            if hasattr(response, 'function_call') and response.function_call:
                result = self._execute_function(response.function_call)
                
                # Send result back to model
                final_response = await client.generate_response(
                    prompt=f"Function result: {result}",
                    context=user_input
                )
                return final_response.content
            
            return response.content
    
    def _execute_function(self, function_call):
        """Execute the requested function"""
        name = function_call["name"]
        args = function_call.get("arguments", {})
        
        if name == "calculate":
            return eval(args["expression"])
        elif name == "get_time":
            from datetime import datetime
            return datetime.now().isoformat()
        
        return "Function not found"

# Usage
async def main():
    agent = SimpleAgent()
    result = await agent.run("What is 25 * 4 + 10?")
    print(result)

asyncio.run(main())
```

---

## Best Practices

### 1. Model Selection
- **Use GLM 4.5 Air** for general agent tasks
- **Use MAI-DS-R1** for complex reasoning
- **Use Qwen3 Coder** for coding agents

### 2. Tool Design
- Keep tool descriptions clear and concise
- Use descriptive parameter names
- Validate tool inputs
- Handle errors gracefully

### 3. Agent Architecture
- Implement retry logic for failed tool calls
- Add timeout handling
- Log all agent actions
- Monitor performance metrics

### 4. Testing
- Test each tool independently
- Test multi-step workflows
- Test error scenarios
- Monitor token usage

---

## Troubleshooting

### Function Not Being Called
- Verify model supports function calling
- Check tool definition format
- Make prompt more explicit
- Review model response

### Incorrect Parameters
- Improve parameter descriptions
- Add examples in descriptions
- Validate parameters before execution
- Provide clear error messages

### Performance Issues
- Use faster model (GLM 4.5 Air)
- Reduce tool complexity
- Implement caching
- Optimize tool execution

---

## Additional Resources

- **Free Models Guide:** [free-models-guide.md](./free-models-guide.md)
- **Agent Models Summary:** [AGENT_MODELS_SUMMARY.md](./AGENT_MODELS_SUMMARY.md)
- **OpenRouter Docs:** https://openrouter.ai/docs

---

**Ready to build agents?** Start with GLM 4.5 Air and experiment with the examples above!

