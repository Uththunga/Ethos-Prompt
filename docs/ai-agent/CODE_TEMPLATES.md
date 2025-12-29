# Molē AI Agent - Code Templates

This document provides ready-to-use code templates for implementing the Molē AI agent.

---

## Table of Contents

1. [System Prompts](#system-prompts)
2. [LangChain Agent Setup](#langchain-agent-setup)
3. [Tool Definitions](#tool-definitions)
4. [Frontend Integration](#frontend-integration)
5. [Testing Templates](#testing-templates)

---

## System Prompts

### Marketing Agent System Prompt

```python
MARKETING_AGENT_SYSTEM_PROMPT = """You are Molē (pronounced "moh-lay"), the AI assistant for EthosPrompt, an Australian AI solutions company based in Melbourne.

## Your Role

Help visitors understand EthosPrompt's services, answer questions about pricing and features, and guide them toward the right solution for their business needs.

## About EthosPrompt

EthosPrompt provides enterprise AI solutions including:

1. **Smart Business Assistant** ($890 AUD/month)
   - AI-powered customer service automation
   - 24/7 intelligent chatbot
   - Multi-channel support (web, mobile, social)
   - Custom training on your business data

2. **Custom AI Solutions** (Starting at $2,500 AUD/month)
   - Tailored AI applications for specific business needs
   - End-to-end development and deployment
   - Integration with existing systems
   - Ongoing support and optimization

3. **Digital Transformation** (Custom pricing)
   - End-to-end AI integration
   - Process automation
   - Change management
   - Training and support

4. **Intelligent Applications** (Starting at $3,500 AUD/month)
   - Mobile-first AI applications
   - Real-time data processing
   - Scalable cloud infrastructure

5. **System Integration** (Starting at $1,800 AUD/month)
   - Connect AI with existing business systems
   - API development and integration
   - Data synchronization

## Your Personality

- **Friendly and professional**: Australian business context
- **Consultative**: Ask questions to understand needs
- **Transparent**: Honest about capabilities and limitations
- **Value-focused**: Emphasize business outcomes and ROI
- **Helpful**: Provide actionable next steps

## Guidelines

1. **Always search the knowledge base** before answering questions about services, pricing, or features
2. **Cite sources** when providing specific information (e.g., "According to our Solutions page...")
3. **Ask clarifying questions** if the user's needs are unclear
4. **Suggest next steps** (e.g., "Would you like to schedule a demo?", "I can provide more details about...")
5. **Be concise** - aim for 2-3 paragraphs maximum per response
6. **Use formatting** - bullet points, bold text for emphasis
7. **Handle objections** professionally - acknowledge concerns and provide evidence

## What NOT to Do

- Don't make up pricing or features not in the knowledge base
- Don't promise specific outcomes without qualification
- Don't be pushy or overly sales-focused
- Don't provide technical implementation details unless asked
- Don't discuss competitors negatively
- Don't share information about other customers

## Current Context

Page: {page_context}
User Type: {user_type}

## Available Tools

- **search_knowledge_base**: Search EthosPrompt's knowledge base for information
- **get_pricing_info**: Get detailed pricing for specific services
- **schedule_demo**: Help user schedule a demo or consultation

Begin! Remember to be helpful, professional, and always cite your sources."""
```

### Prompt Library Agent System Prompt

```python
PROMPT_LIBRARY_AGENT_SYSTEM_PROMPT = """You are Molē (pronounced "moh-lay"), the AI assistant for EthosPrompt's Prompt Library dashboard.

## Your Role

Help users create, optimize, and manage their prompt library. You're an expert in prompt engineering, AI model selection, and best practices.

## Your Capabilities

You can help users:

1. **Create Prompts**
   - Generate prompt templates from descriptions
   - Add proper variable placeholders ({{variable_name}})
   - Suggest appropriate categories and tags
   - Write clear descriptions

2. **Execute Prompts**
   - Run prompts with user-provided variables
   - Select appropriate AI models
   - Optimize parameters (temperature, max_tokens)
   - Display results with cost/token information

3. **Optimize Prompts**
   - Analyze prompt performance
   - Suggest improvements for clarity and effectiveness
   - Recommend better model choices
   - Optimize for cost and quality

4. **Troubleshoot**
   - Diagnose execution errors
   - Explain API errors
   - Suggest fixes for common issues

5. **Analyze Performance**
   - Review execution history
   - Calculate cost metrics
   - Identify optimization opportunities

## Your Personality

- **Expert but approachable**: You're knowledgeable but not condescending
- **Practical**: Focus on actionable advice
- **Efficient**: Provide concise, clear responses
- **Proactive**: Suggest improvements and best practices

## Prompt Engineering Best Practices

When creating or optimizing prompts, follow these principles:

1. **Clarity**: Be specific and unambiguous
2. **Context**: Provide necessary background information
3. **Structure**: Use clear formatting and sections
4. **Examples**: Include few-shot examples when helpful
5. **Constraints**: Specify output format, length, style
6. **Variables**: Use {{variable_name}} syntax for placeholders

## Available Tools

- **create_prompt**: Create a new prompt in the user's library
- **execute_prompt**: Execute an existing prompt with variables
- **search_user_prompts**: Search the user's prompt library
- **get_execution_history**: Get recent execution history
- **analyze_prompt_performance**: Analyze prompt performance metrics
- **suggest_prompt_improvements**: Suggest improvements for a prompt

## Current Context

User ID: {user_id}
Current Page: {current_page}
Selected Prompt: {selected_prompt_id}

## Guidelines

1. **Use tools proactively** - If user asks to create a prompt, use the create_prompt tool
2. **Show your work** - Explain why you're making specific suggestions
3. **Cite metrics** - Reference execution history and performance data
4. **Be specific** - Provide concrete examples and code snippets
5. **Validate inputs** - Check that prompts have proper variable syntax
6. **Consider costs** - Suggest cost-effective model choices

Begin! Help the user build amazing prompts."""
```

---

## LangChain Agent Setup

### Marketing Agent Implementation

```python
# functions/src/ai_agent/marketing/marketing_agent.py
from langchain.agents import ConversationalAgent, AgentExecutor
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class MarketingAgent:
    """Marketing expert agent for public-facing pages"""
    
    def __init__(self, llm, retriever, db):
        self.llm = llm
        self.retriever = retriever
        self.db = db
        
        # Create tools
        self.tools = self._create_tools()
        
        # Create memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="output"
        )
        
        # Create agent
        self.agent = ConversationalAgent.from_llm_and_tools(
            llm=self.llm,
            tools=self.tools,
            system_message=self._get_system_prompt(),
            verbose=True
        )
        
        # Create executor
        self.executor = AgentExecutor.from_agent_and_tools(
            agent=self.agent,
            tools=self.tools,
            memory=self.memory,
            max_iterations=5,
            early_stopping_method="generate",
            handle_parsing_errors=True,
            return_intermediate_steps=True
        )
    
    def _create_tools(self) -> List[Tool]:
        """Create tools for the marketing agent"""
        return [
            Tool(
                name="search_knowledge_base",
                func=self._search_kb,
                description=(
                    "Search the EthosPrompt knowledge base for information about "
                    "services, pricing, features, and use cases. "
                    "Input should be a search query. "
                    "Returns relevant information with source citations."
                )
            ),
            Tool(
                name="get_pricing_info",
                func=self._get_pricing,
                description=(
                    "Get detailed pricing information for EthosPrompt services. "
                    "Input should be the service name (e.g., 'Smart Business Assistant', "
                    "'Custom AI Solutions', 'Digital Transformation'). "
                    "Returns pricing details and package information."
                )
            ),
            Tool(
                name="schedule_demo",
                func=self._schedule_demo,
                description=(
                    "Help user schedule a demo or consultation. "
                    "Input should be the user's preferred service and contact preference. "
                    "Returns scheduling information and next steps."
                )
            )
        ]
    
    async def _search_kb(self, query: str) -> str:
        """Search knowledge base"""
        try:
            # Retrieve relevant documents
            docs = await self.retriever.retrieve(query, top_k=5)
            
            if not docs:
                return "I couldn't find specific information about that. Could you rephrase your question?"
            
            # Format results with sources
            result = "Based on our knowledge base:\n\n"
            sources = []
            
            for doc in docs:
                result += f"- {doc.page_content}\n"
                source = doc.metadata.get('pageUrl', 'Unknown')
                if source not in sources:
                    sources.append(source)
            
            result += f"\n\nSources: {', '.join(sources)}"
            
            return result
            
        except Exception as e:
            logger.error(f"Error searching KB: {e}")
            return "I encountered an error searching for that information. Please try again."
    
    async def _get_pricing(self, service_name: str) -> str:
        """Get pricing information"""
        pricing_map = {
            "smart business assistant": "$890 AUD/month - Includes AI chatbot, 24/7 support, custom training",
            "custom ai solutions": "Starting at $2,500 AUD/month - Tailored to your needs, includes development and support",
            "digital transformation": "Custom pricing - Comprehensive AI integration, contact for quote",
            "intelligent applications": "Starting at $3,500 AUD/month - Mobile-first AI apps with cloud infrastructure",
            "system integration": "Starting at $1,800 AUD/month - API integration and data synchronization"
        }
        
        service_key = service_name.lower().strip()
        
        for key, pricing in pricing_map.items():
            if key in service_key:
                return f"Pricing for {service_name}:\n{pricing}\n\nWould you like to schedule a demo to discuss your specific needs?"
        
        return "I don't have specific pricing for that service. Let me search our knowledge base for more information."
    
    async def _schedule_demo(self, input_str: str) -> str:
        """Schedule demo"""
        return (
            "Great! I'd be happy to help you schedule a demo.\n\n"
            "To schedule a consultation:\n"
            "1. Visit our contact page: https://rag-prompt-library.web.app/contact\n"
            "2. Or email us directly: contact@ethosprompt.com\n"
            "3. Or call: +61 3 XXXX XXXX\n\n"
            "Please mention which service you're interested in, and our team will get back to you within 24 hours."
        )
    
    def _get_system_prompt(self) -> str:
        """Get system prompt"""
        return MARKETING_AGENT_SYSTEM_PROMPT
    
    async def chat(
        self,
        message: str,
        page_context: str = "unknown",
        user_type: str = "visitor"
    ) -> Dict[str, Any]:
        """
        Send a message and get response
        
        Args:
            message: User's message
            page_context: Current page context
            user_type: Type of user (visitor, lead, etc.)
        
        Returns:
            {
                'response': str,
                'sources': List[str],
                'tool_calls': List[Dict]
            }
        """
        try:
            # Format system prompt with context
            formatted_prompt = self._get_system_prompt().format(
                page_context=page_context,
                user_type=user_type
            )
            
            # Execute agent
            result = await self.executor.ainvoke({
                "input": message,
                "system_message": formatted_prompt
            })
            
            # Extract response and metadata
            response = result.get('output', '')
            intermediate_steps = result.get('intermediate_steps', [])
            
            # Extract sources from tool calls
            sources = []
            tool_calls = []
            
            for action, observation in intermediate_steps:
                tool_calls.append({
                    'tool': action.tool,
                    'input': action.tool_input,
                    'output': observation
                })
                
                # Extract sources from search results
                if 'Sources:' in observation:
                    source_line = observation.split('Sources:')[1].strip()
                    sources.extend([s.strip() for s in source_line.split(',')])
            
            return {
                'response': response,
                'sources': list(set(sources)),  # Deduplicate
                'tool_calls': tool_calls
            }
            
        except Exception as e:
            logger.error(f"Error in chat: {e}", exc_info=True)
            return {
                'response': "I apologize, but I encountered an error. Please try again.",
                'sources': [],
                'tool_calls': []
            }
```

---

## Tool Definitions

### Prompt Library Tools

```python
# functions/src/ai_agent/prompt_library/prompt_library_tools.py
from langchain.tools import StructuredTool
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class CreatePromptInput(BaseModel):
    """Input schema for create_prompt tool"""
    title: str = Field(description="Title of the prompt (e.g., 'Customer Review Summarizer')")
    content: str = Field(description="Prompt template content with {{variable}} placeholders")
    description: Optional[str] = Field(
        default=None,
        description="Description of what the prompt does and when to use it"
    )
    tags: Optional[List[str]] = Field(
        default=None,
        description="Tags for categorization (e.g., ['summarization', 'customer-service'])"
    )
    category: Optional[str] = Field(
        default="general",
        description="Category (e.g., 'coding', 'writing', 'analysis', 'customer-service')"
    )

class ExecutePromptInput(BaseModel):
    """Input schema for execute_prompt tool"""
    prompt_id: str = Field(description="ID of the prompt to execute")
    variables: Dict[str, str] = Field(
        description="Variables to fill in the prompt template (e.g., {'customer_name': 'John', 'product': 'Widget'})"
    )
    model: Optional[str] = Field(
        default=None,
        description="Model to use (e.g., 'gpt-4', 'claude-3-sonnet'). If not specified, uses user's default."
    )
    temperature: Optional[float] = Field(
        default=0.7,
        description="Temperature for response generation (0.0-1.0). Lower = more focused, higher = more creative."
    )

class PromptLibraryTools:
    """Tools for the Prompt Library agent"""
    
    def __init__(self, db, user_id: str):
        self.db = db
        self.user_id = user_id
    
    def get_tools(self) -> List[StructuredTool]:
        """Get all tools"""
        return [
            StructuredTool.from_function(
                func=self.create_prompt,
                name="create_prompt",
                description="Create a new prompt in the user's library",
                args_schema=CreatePromptInput
            ),
            StructuredTool.from_function(
                func=self.execute_prompt,
                name="execute_prompt",
                description="Execute an existing prompt with variables",
                args_schema=ExecutePromptInput
            ),
            # Add more tools...
        ]
    
    async def create_prompt(
        self,
        title: str,
        content: str,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category: Optional[str] = "general"
    ) -> str:
        """Create a new prompt"""
        try:
            # Validate prompt content
            if not self._validate_prompt_content(content):
                return "❌ Error: Prompt content must include at least one variable placeholder like {{variable_name}}"
            
            # Create prompt document
            prompt_ref = self.db.collection('prompts').document()
            
            await prompt_ref.set({
                'promptId': prompt_ref.id,
                'title': title,
                'content': content,
                'description': description or '',
                'tags': tags or [],
                'category': category,
                'userId': self.user_id,
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP,
                'createdBy': 'mole_agent',
                'version': 1,
                'isActive': True
            })
            
            logger.info(f"Created prompt {prompt_ref.id} for user {self.user_id}")
            
            return (
                f"✅ Prompt '{title}' created successfully!\n\n"
                f"**ID**: {prompt_ref.id}\n"
                f"**Category**: {category}\n"
                f"**Tags**: {', '.join(tags) if tags else 'None'}\n\n"
                f"You can now execute this prompt or find it in your library."
            )
            
        except Exception as e:
            logger.error(f"Error creating prompt: {e}", exc_info=True)
            return f"❌ Error creating prompt: {str(e)}"
    
    async def execute_prompt(
        self,
        prompt_id: str,
        variables: Dict[str, str],
        model: Optional[str] = None,
        temperature: float = 0.7
    ) -> str:
        """Execute a prompt"""
        try:
            # Get prompt
            prompt_ref = self.db.collection('prompts').document(prompt_id)
            prompt_doc = await prompt_ref.get()
            
            if not prompt_doc.exists:
                return f"❌ Error: Prompt {prompt_id} not found"
            
            prompt_data = prompt_doc.to_dict()
            
            # Verify ownership
            if prompt_data.get('userId') != self.user_id:
                return "❌ Error: You don't have permission to execute this prompt"
            
            # Execute using existing execute_prompt function
            from src.api.execute import execute_prompt_logic
            
            result = await execute_prompt_logic(
                prompt_id=prompt_id,
                variables=variables,
                model_id=model,
                user_id=self.user_id,
                temperature=temperature
            )
            
            # Format response
            return (
                f"✅ Execution complete!\n\n"
                f"**Output**:\n{result['output']}\n\n"
                f"**Metrics**:\n"
                f"- Tokens: {result['tokensUsed']}\n"
                f"- Cost: ${result['cost']:.4f}\n"
                f"- Model: {result['model']}\n"
                f"- Duration: {result['duration']:.2f}s"
            )
            
        except Exception as e:
            logger.error(f"Error executing prompt: {e}", exc_info=True)
            return f"❌ Error executing prompt: {str(e)}"
    
    def _validate_prompt_content(self, content: str) -> bool:
        """Validate that prompt has variable placeholders"""
        import re
        # Check for {{variable}} pattern
        return bool(re.search(r'\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}', content))
```

---

*This document continues with Frontend Integration and Testing Templates...*

**Note**: Due to length constraints, additional sections (Frontend Integration, Testing Templates) should be added using the str-replace-editor tool.

