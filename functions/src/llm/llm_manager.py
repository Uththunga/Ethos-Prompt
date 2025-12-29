"""
LLM Manager - Core service for managing multiple LLM providers
"""
import os
import logging
import asyncio
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timezone
from dataclasses import dataclass
from enum import Enum
import json

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not available

# Provider imports (will be conditionally imported based on availability)
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import google.generativeai as genai
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

try:
    import cohere
    COHERE_AVAILABLE = True
except ImportError:
    COHERE_AVAILABLE = False

# OpenRouter uses OpenAI-compatible API
try:
    import openai  # OpenRouter uses OpenAI client
    OPENROUTER_AVAILABLE = True
except ImportError:
    OPENROUTER_AVAILABLE = False

logger = logging.getLogger(__name__)

class ProviderType(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    COHERE = "cohere"
    OPENROUTER = "openrouter"

@dataclass
class LLMResponse:
    content: str
    provider: str
    model: str
    tokens_used: int
    cost: float
    response_time: float
    metadata: Dict[str, Any]

@dataclass
class ProviderConfig:
    provider_type: ProviderType
    api_key: str
    model: str
    max_tokens: int = 4000
    temperature: float = 0.7
    enabled: bool = True

class LLMManager:
    """
    Central manager for all LLM providers with failover and load balancing
    """
    
    def __init__(self):
        self.providers = {}
        self.provider_configs = {}
        self.usage_stats = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available LLM providers"""
        # OpenAI
        if OPENAI_AVAILABLE and os.getenv('OPENAI_API_KEY'):
            self._setup_openai()
        
        # Anthropic
        if ANTHROPIC_AVAILABLE and os.getenv('ANTHROPIC_API_KEY'):
            self._setup_anthropic()
        
        # Google
        if GOOGLE_AVAILABLE and os.getenv('GOOGLE_API_KEY'):
            self._setup_google()
        
        # Cohere
        if COHERE_AVAILABLE and os.getenv('COHERE_API_KEY'):
            self._setup_cohere()

        # OpenRouter
        if OPENROUTER_AVAILABLE and os.getenv('OPENROUTER_API_KEY'):
            self._setup_openrouter()

        logger.info(f"Initialized LLM providers: {list(self.providers.keys())}")
    
    def _setup_openai(self):
        """Setup OpenAI provider"""
        try:
            client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
            self.providers[ProviderType.OPENAI] = client
            self.provider_configs[ProviderType.OPENAI] = ProviderConfig(
                provider_type=ProviderType.OPENAI,
                api_key=os.getenv('OPENAI_API_KEY'),
                model=os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
                max_tokens=int(os.getenv('OPENAI_MAX_TOKENS', '4000')),
                temperature=float(os.getenv('OPENAI_TEMPERATURE', '0.7'))
            )
            logger.info("OpenAI provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI: {e}")
    
    def _setup_anthropic(self):
        """Setup Anthropic provider"""
        try:
            client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
            self.providers[ProviderType.ANTHROPIC] = client
            self.provider_configs[ProviderType.ANTHROPIC] = ProviderConfig(
                provider_type=ProviderType.ANTHROPIC,
                api_key=os.getenv('ANTHROPIC_API_KEY'),
                model=os.getenv('ANTHROPIC_MODEL', 'claude-3-haiku-20240307'),
                max_tokens=int(os.getenv('ANTHROPIC_MAX_TOKENS', '4000')),
                temperature=float(os.getenv('ANTHROPIC_TEMPERATURE', '0.7'))
            )
            logger.info("Anthropic provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Anthropic: {e}")
    
    def _setup_google(self):
        """Setup Google provider"""
        try:
            genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
            self.providers[ProviderType.GOOGLE] = genai
            self.provider_configs[ProviderType.GOOGLE] = ProviderConfig(
                provider_type=ProviderType.GOOGLE,
                api_key=os.getenv('GOOGLE_API_KEY'),
                model=os.getenv('GOOGLE_MODEL', 'gemini-1.5-flash'),
                max_tokens=int(os.getenv('GOOGLE_MAX_TOKENS', '4000')),
                temperature=float(os.getenv('GOOGLE_TEMPERATURE', '0.7'))
            )
            logger.info("Google provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Google: {e}")
    
    def _setup_cohere(self):
        """Setup Cohere provider"""
        try:
            client = cohere.Client(api_key=os.getenv('COHERE_API_KEY'))
            self.providers[ProviderType.COHERE] = client
            self.provider_configs[ProviderType.COHERE] = ProviderConfig(
                provider_type=ProviderType.COHERE,
                api_key=os.getenv('COHERE_API_KEY'),
                model=os.getenv('COHERE_MODEL', 'command-r-plus'),
                max_tokens=int(os.getenv('COHERE_MAX_TOKENS', '4000')),
                temperature=float(os.getenv('COHERE_TEMPERATURE', '0.7'))
            )
            logger.info("Cohere provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Cohere: {e}")

    def _setup_openrouter(self):
        """Setup OpenRouter provider"""
        try:
            api_key = os.getenv('OPENROUTER_API_KEY')
            logger.info(f"OpenRouter API key found: {bool(api_key)}")
            if api_key:
                logger.info(f"OpenRouter API key starts with: {api_key[:10]}...")

            # OpenRouter uses OpenAI-compatible API
            client = openai.OpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1"
            )
            self.providers[ProviderType.OPENROUTER] = client
            self.provider_configs[ProviderType.OPENROUTER] = ProviderConfig(
                provider_type=ProviderType.OPENROUTER,
                api_key=os.getenv('OPENROUTER_API_KEY'),
                model=os.getenv('OPENROUTER_MODEL', 'nvidia/llama-3.1-nemotron-ultra-253b-v1:free'),
                max_tokens=int(os.getenv('OPENROUTER_MAX_TOKENS', '4000')),
                temperature=float(os.getenv('OPENROUTER_TEMPERATURE', '0.7'))
            )
            logger.info("OpenRouter provider initialized")
        except Exception as e:
            logger.error(f"Failed to initialize OpenRouter: {e}")

    async def generate_response(
        self, 
        prompt: str, 
        provider: Optional[ProviderType] = None,
        **kwargs
    ) -> LLMResponse:
        """
        Generate response using specified provider or auto-select
        """
        if provider and provider in self.providers:
            return await self._generate_with_provider(prompt, provider, **kwargs)
        
        # Auto-select provider (prefer OpenRouter, then OpenAI, then others)
        for provider_type in [ProviderType.OPENROUTER, ProviderType.OPENAI, ProviderType.ANTHROPIC, ProviderType.GOOGLE, ProviderType.COHERE]:
            if provider_type in self.providers:
                try:
                    return await self._generate_with_provider(prompt, provider_type, **kwargs)
                except Exception as e:
                    logger.warning(f"Provider {provider_type} failed: {e}")
                    continue
        
        raise Exception("No available providers")
    
    async def _generate_with_provider(
        self, 
        prompt: str, 
        provider: ProviderType, 
        **kwargs
    ) -> LLMResponse:
        """Generate response with specific provider"""
        start_time = datetime.now()
        
        try:
            if provider == ProviderType.OPENAI:
                return await self._generate_openai(prompt, **kwargs)
            elif provider == ProviderType.ANTHROPIC:
                return await self._generate_anthropic(prompt, **kwargs)
            elif provider == ProviderType.GOOGLE:
                return await self._generate_google(prompt, **kwargs)
            elif provider == ProviderType.COHERE:
                return await self._generate_cohere(prompt, **kwargs)
            elif provider == ProviderType.OPENROUTER:
                return await self._generate_openrouter(prompt, **kwargs)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
        
        except Exception as e:
            logger.error(f"Error generating response with {provider}: {e}")
            raise
    
    async def _generate_openai(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate response using OpenAI"""
        client = self.providers[ProviderType.OPENAI]
        config = self.provider_configs[ProviderType.OPENAI]
        
        start_time = datetime.now()
        
        response = client.chat.completions.create(
            model=config.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            **kwargs
        )
        
        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()
        
        return LLMResponse(
            content=response.choices[0].message.content,
            provider="openai",
            model=config.model,
            tokens_used=response.usage.total_tokens,
            cost=self._calculate_openai_cost(response.usage.total_tokens, config.model),
            response_time=response_time,
            metadata={
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "finish_reason": response.choices[0].finish_reason
            }
        )

    async def _generate_openrouter(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate response using OpenRouter"""
        client = self.providers[ProviderType.OPENROUTER]
        config = self.provider_configs[ProviderType.OPENROUTER]

        start_time = datetime.now()

        response = client.chat.completions.create(
            model=config.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=config.max_tokens,
            temperature=config.temperature,
            **kwargs
        )

        end_time = datetime.now()
        response_time = (end_time - start_time).total_seconds()

        return LLMResponse(
            content=response.choices[0].message.content,
            provider="openrouter",
            model=config.model,
            tokens_used=response.usage.total_tokens if response.usage else 0,
            cost=0.0,  # OpenRouter model is free
            response_time=response_time,
            metadata={
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "finish_reason": response.choices[0].finish_reason
            }
        )

    async def _generate_anthropic(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate response using Anthropic Claude with enhanced features"""
        try:
            client = self.providers[ProviderType.ANTHROPIC]
            config = self.provider_configs[ProviderType.ANTHROPIC]

            start_time = datetime.now()

            # Prepare messages with system prompt support
            messages = []
            system_prompt = None

            # Extract system prompt if present
            if prompt.startswith("System:"):
                parts = prompt.split("\n\nUser:", 1)
                if len(parts) == 2:
                    system_prompt = parts[0].replace("System:", "").strip()
                    prompt = parts[1].strip()

            messages.append({"role": "user", "content": prompt})

            # Prepare request parameters
            request_params = {
                "model": config.model,
                "max_tokens": config.max_tokens,
                "temperature": config.temperature,
                "messages": messages
            }

            # Add system prompt if available
            if system_prompt:
                request_params["system"] = system_prompt

            # Add additional parameters from kwargs
            if 'top_p' in kwargs:
                request_params["top_p"] = kwargs['top_p']
            if 'top_k' in kwargs:
                request_params["top_k"] = kwargs['top_k']
            if 'stop_sequences' in kwargs:
                request_params["stop_sequences"] = kwargs['stop_sequences']

            response = client.messages.create(**request_params)

            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()

            return LLMResponse(
                content=response.content[0].text,
                provider="anthropic",
                model=config.model,
                tokens_used=response.usage.input_tokens + response.usage.output_tokens,
                cost=self._calculate_anthropic_cost(response.usage.input_tokens, response.usage.output_tokens, config.model),
                response_time=response_time,
                metadata={
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "stop_reason": response.stop_reason,
                    "system_prompt_used": system_prompt is not None,
                    "model_version": config.model
                }
            )

        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            # Enhanced error handling
            if "rate_limit" in str(e).lower():
                raise Exception("Anthropic rate limit exceeded. Please try again later.")
            elif "invalid_api_key" in str(e).lower():
                raise Exception("Invalid Anthropic API key")
            elif "invalid_request" in str(e).lower():
                raise Exception(f"Invalid request to Anthropic: {str(e)}")
            else:
                raise Exception(f"Anthropic generation failed: {str(e)}")

    async def _generate_google(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate response using Google Gemini with enhanced features"""
        try:
            genai = self.providers[ProviderType.GOOGLE]
            config = self.provider_configs[ProviderType.GOOGLE]

            start_time = datetime.now()

            # Configure safety settings
            safety_settings = kwargs.get('safety_settings', [
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ])

            # Configure generation parameters
            generation_config = {
                "max_output_tokens": config.max_tokens,
                "temperature": config.temperature,
            }

            # Add optional parameters
            if 'top_p' in kwargs:
                generation_config["top_p"] = kwargs['top_p']
            if 'top_k' in kwargs:
                generation_config["top_k"] = kwargs['top_k']
            if 'stop_sequences' in kwargs:
                generation_config["stop_sequences"] = kwargs['stop_sequences']

            # Create model with safety settings
            model = genai.GenerativeModel(
                model_name=config.model,
                safety_settings=safety_settings
            )

            # Handle multimodal content if provided
            content_parts = []
            if isinstance(prompt, str):
                content_parts.append(prompt)
            elif isinstance(prompt, list):
                # Support for multimodal input (text + images)
                content_parts = prompt
            else:
                content_parts.append(str(prompt))

            response = model.generate_content(
                content_parts,
                generation_config=genai.types.GenerationConfig(**generation_config)
            )

            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()

            # Check if response was blocked
            if not response.text:
                if response.candidates and response.candidates[0].finish_reason.name == "SAFETY":
                    raise Exception("Response blocked by safety filters")
                else:
                    raise Exception("No response generated")

            # Get actual token counts if available, otherwise estimate
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                input_tokens = response.usage_metadata.prompt_token_count
                output_tokens = response.usage_metadata.candidates_token_count
                total_tokens = response.usage_metadata.total_token_count
            else:
                # Fallback to estimation
                input_tokens = len(str(content_parts).split()) * 1.3
                output_tokens = len(response.text.split()) * 1.3
                total_tokens = int(input_tokens + output_tokens)

            return LLMResponse(
                content=response.text,
                provider="google",
                model=config.model,
                tokens_used=int(total_tokens),
                cost=self._calculate_google_cost(input_tokens, output_tokens, config.model),
                response_time=response_time,
                metadata={
                    "input_tokens": int(input_tokens),
                    "output_tokens": int(output_tokens),
                    "finish_reason": response.candidates[0].finish_reason.name if response.candidates else "unknown",
                    "safety_ratings": [
                        {
                            "category": rating.category.name,
                            "probability": rating.probability.name
                        }
                        for rating in (response.candidates[0].safety_ratings if response.candidates else [])
                    ],
                    "multimodal_input": isinstance(prompt, list)
                }
            )

        except Exception as e:
            logger.error(f"Google Gemini API error: {e}")
            # Enhanced error handling
            if "quota" in str(e).lower() or "rate" in str(e).lower():
                raise Exception("Google API quota exceeded. Please try again later.")
            elif "api_key" in str(e).lower():
                raise Exception("Invalid Google API key")
            elif "safety" in str(e).lower():
                raise Exception("Content blocked by Google's safety filters")
            elif "not found" in str(e).lower():
                raise Exception(f"Google model {config.model} not found")
            else:
                raise Exception(f"Google Gemini generation failed: {str(e)}")

    async def _generate_cohere(self, prompt: str, **kwargs) -> LLMResponse:
        """Generate response using Cohere with enhanced features"""
        try:
            client = self.providers[ProviderType.COHERE]
            config = self.provider_configs[ProviderType.COHERE]

            start_time = datetime.now()

            # Prepare chat parameters
            chat_params = {
                "model": config.model,
                "message": prompt,
                "max_tokens": config.max_tokens,
                "temperature": config.temperature,
            }

            # Add optional parameters
            if 'p' in kwargs:
                chat_params["p"] = kwargs['p']
            if 'k' in kwargs:
                chat_params["k"] = kwargs['k']
            if 'frequency_penalty' in kwargs:
                chat_params["frequency_penalty"] = kwargs['frequency_penalty']
            if 'presence_penalty' in kwargs:
                chat_params["presence_penalty"] = kwargs['presence_penalty']
            if 'stop_sequences' in kwargs:
                chat_params["stop_sequences"] = kwargs['stop_sequences']

            # Add conversation history if provided
            if 'chat_history' in kwargs:
                chat_params["chat_history"] = kwargs['chat_history']

            # Add preamble (system message) if provided
            if 'preamble' in kwargs:
                chat_params["preamble"] = kwargs['preamble']
            elif prompt.startswith("System:"):
                parts = prompt.split("\n\nUser:", 1)
                if len(parts) == 2:
                    chat_params["preamble"] = parts[0].replace("System:", "").strip()
                    chat_params["message"] = parts[1].strip()

            # Add connectors for RAG if provided
            if 'connectors' in kwargs:
                chat_params["connectors"] = kwargs['connectors']

            # Add documents for RAG if provided
            if 'documents' in kwargs:
                chat_params["documents"] = kwargs['documents']

            response = client.chat(**chat_params)

            end_time = datetime.now()
            response_time = (end_time - start_time).total_seconds()

            # Extract token usage with better error handling
            try:
                if hasattr(response, 'meta') and response.meta:
                    tokens_info = getattr(response.meta, 'tokens', {})
                    input_tokens = tokens_info.get('input_tokens', 0)
                    output_tokens = tokens_info.get('output_tokens', 0)
                    billed_tokens = getattr(response.meta, 'billed_tokens', {})
                    billed_input = billed_tokens.get('input_tokens', input_tokens)
                    billed_output = billed_tokens.get('output_tokens', output_tokens)
                else:
                    # Fallback estimation
                    input_tokens = len(prompt.split()) * 1.3
                    output_tokens = len(response.text.split()) * 1.3
                    billed_input = input_tokens
                    billed_output = output_tokens
            except Exception:
                # Final fallback
                input_tokens = len(prompt.split()) * 1.3
                output_tokens = len(response.text.split()) * 1.3
                billed_input = input_tokens
                billed_output = output_tokens

            total_tokens = int(input_tokens + output_tokens)

            # Extract citations if available (for RAG responses)
            citations = []
            if hasattr(response, 'citations') and response.citations:
                citations = [
                    {
                        "start": cite.start,
                        "end": cite.end,
                        "text": cite.text,
                        "document_ids": cite.document_ids
                    }
                    for cite in response.citations
                ]

            return LLMResponse(
                content=response.text,
                provider="cohere",
                model=config.model,
                tokens_used=total_tokens,
                cost=self._calculate_cohere_cost(billed_input, billed_output, config.model),
                response_time=response_time,
                metadata={
                    "input_tokens": int(input_tokens),
                    "output_tokens": int(output_tokens),
                    "billed_input_tokens": int(billed_input),
                    "billed_output_tokens": int(billed_output),
                    "finish_reason": getattr(response.meta, 'finish_reason', 'unknown') if hasattr(response, 'meta') else 'unknown',
                    "citations": citations,
                    "has_rag_context": 'documents' in kwargs or 'connectors' in kwargs,
                    "conversation_id": getattr(response, 'conversation_id', None)
                }
            )

        except Exception as e:
            logger.error(f"Cohere API error: {e}")
            # Enhanced error handling
            if "rate limit" in str(e).lower() or "quota" in str(e).lower():
                raise Exception("Cohere rate limit exceeded. Please try again later.")
            elif "api_key" in str(e).lower() or "unauthorized" in str(e).lower():
                raise Exception("Invalid Cohere API key")
            elif "model" in str(e).lower() and "not found" in str(e).lower():
                raise Exception(f"Cohere model {config.model} not found")
            elif "content filter" in str(e).lower():
                raise Exception("Content blocked by Cohere's content filters")
            else:
                raise Exception(f"Cohere generation failed: {str(e)}")

    async def cohere_rerank(self, query: str, documents: List[str], model: str = "rerank-english-v3.0", top_n: int = 10) -> List[Dict[str, Any]]:
        """Rerank documents using Cohere"""
        try:
            client = self.providers[ProviderType.COHERE]

            response = client.rerank(
                model=model,
                query=query,
                documents=documents,
                top_n=top_n,
                return_documents=True
            )

            return [
                {
                    "index": result.index,
                    "relevance_score": result.relevance_score,
                    "document": result.document.text if hasattr(result.document, 'text') else str(result.document)
                }
                for result in response.results
            ]

        except Exception as e:
            logger.error(f"Cohere rerank error: {e}")
            raise Exception(f"Cohere rerank failed: {str(e)}")

    def _calculate_openai_cost(self, tokens: int, model: str) -> float:
        """Calculate OpenAI cost based on tokens and model"""
        # Simplified cost calculation - should be updated with actual pricing
        cost_per_1k_tokens = {
            "gpt-4o": 0.03,
            "gpt-4o-mini": 0.0015,
            "gpt-4": 0.03,
            "gpt-3.5-turbo": 0.002
        }

        rate = cost_per_1k_tokens.get(model, 0.002)
        return (tokens / 1000) * rate

    def _calculate_anthropic_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Calculate Anthropic cost based on tokens and model"""
        cost_per_1k_tokens = {
            "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
            "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
            "claude-3-opus-20240229": {"input": 0.015, "output": 0.075}
        }

        rates = cost_per_1k_tokens.get(model, {"input": 0.003, "output": 0.015})
        input_cost = (input_tokens / 1000) * rates["input"]
        output_cost = (output_tokens / 1000) * rates["output"]
        return input_cost + output_cost

    def _calculate_google_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Calculate Google cost based on tokens and model"""
        cost_per_1k_tokens = {
            "gemini-1.5-pro": {"input": 0.00125, "output": 0.005},
            "gemini-1.5-flash": {"input": 0.000075, "output": 0.0003},
            "gemini-pro": {"input": 0.0005, "output": 0.0015}
        }

        rates = cost_per_1k_tokens.get(model, {"input": 0.0005, "output": 0.0015})
        input_cost = (input_tokens / 1000) * rates["input"]
        output_cost = (output_tokens / 1000) * rates["output"]
        return input_cost + output_cost

    def _calculate_cohere_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """Calculate Cohere cost based on tokens and model"""
        cost_per_1k_tokens = {
            "command-r-plus": {"input": 0.003, "output": 0.015},
            "command-r": {"input": 0.0005, "output": 0.0015},
            "command": {"input": 0.001, "output": 0.002}
        }

        rates = cost_per_1k_tokens.get(model, {"input": 0.001, "output": 0.002})
        input_cost = (input_tokens / 1000) * rates["input"]
        output_cost = (output_tokens / 1000) * rates["output"]
        return input_cost + output_cost
    
    def get_available_providers(self) -> List[str]:
        """Get list of available providers"""
        return [provider.value for provider in self.providers.keys()]
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all providers"""
        status = {}
        for provider_type, config in self.provider_configs.items():
            status[provider_type.value] = {
                "enabled": config.enabled,
                "model": config.model,
                "available": provider_type in self.providers
            }
        return status

# Global instance
llm_manager = LLMManager()
