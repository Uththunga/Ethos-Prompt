"""
IBM watsonx.ai Client for Granite 4.0 H-Small
Provides LangChain-compatible wrapper for IBM Granite models
"""
import logging
import os
from typing import Optional, Dict, Any, List, AsyncIterator
import httpx
import re
from datetime import datetime, timezone, timedelta
from langchain_core.runnables import Runnable
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage, ToolMessage, AIMessageChunk

logger = logging.getLogger(__name__)


class WatsonxGraniteClient:
    """
    IBM watsonx.ai client for Granite 4.0 models.

    Provides LangChain-compatible interface for IBM Granite LLMs via watsonx.ai API.

    Features:
    - Granite 4.0 H-Small (32B parameters, 9B active)
    - IBM Cloud authentication
    - Streaming support
    - Connection pooling
    - Error handling and retries
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        project_id: Optional[str] = None,
        model_id: Optional[str] = None,
        temperature: float = 0.6,
        max_tokens: int = 400,
        api_url: Optional[str] = None,
        version: Optional[str] = None,
    ):
        """
        Initialize watsonx.ai client for Granite models.

        Args:
            api_key: IBM Cloud API key (or set WATSONX_API_KEY env var)
            project_id: watsonx.ai project ID (or set WATSONX_PROJECT_ID env var)
            model_id: Granite model ID (or set WATSONX_MODEL_ID env var; default: ibm/granite-4-h-small)
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens to generate
            api_url: watsonx.ai API endpoint (or set WATSONX_API_URL env var)
            version: watsonx.ai API version query parameter (or set WATSONX_API_VERSION env var)
        """
        self.api_key = api_key or os.getenv("WATSONX_API_KEY")
        self.project_id = project_id or os.getenv("WATSONX_PROJECT_ID")
        self.model_id = model_id or os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.api_url = api_url or os.getenv(
            "WATSONX_API_URL",
            "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation",
        )
        self.version = version or os.getenv("WATSONX_API_VERSION", "2023-05-02")

        if not self.api_key:
            raise ValueError("WATSONX_API_KEY is required (set via env var or constructor)")
        if not self.project_id:
            raise ValueError("WATSONX_PROJECT_ID is required (set via env var or constructor)")

        # IAM access token cache (exchanged from API key)
        self._access_token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None

        # Initialize HTTP client with connection pooling and generous timeout
        # First message can take 30-40s due to cold start, so 90s timeout is safe
        self._http_client = httpx.AsyncClient(
            timeout=90.0,  # Increased from 30s to handle cold starts
            limits=httpx.Limits(
                max_keepalive_connections=5,
                max_connections=10,
                keepalive_expiry=30.0
            ),
            http2=True
        )

        # Retry configuration
        self._max_retries = 3
        self._retry_base_delay = 1.0  # seconds

        logger.info(
            f"WatsonxGraniteClient initialized: {self.model_id} (temp={self.temperature}, max_tokens={self.max_tokens}, version={self.version})"
        )

    def _build_url_with_version(self, url: str) -> str:
        """Ensure the required 'version' query parameter is present on the watsonx.ai URL."""
        if "version=" in url:
            return url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}version={self.version}"

    async def _get_access_token(self) -> str:
        """Get or refresh IAM access token for watsonx.ai.

        IBM Cloud uses an IAM access token, not the raw API key, in the
        Authorization header. We exchange the API key for a token via the
        IAM endpoint and cache it until shortly before expiry.
        """
        # Reuse token if it's still valid (with a small refresh margin)
        if self._access_token and self._token_expiry:
            if datetime.now(timezone.utc) < self._token_expiry - timedelta(seconds=60):
                return self._access_token

        iam_url = "https://iam.cloud.ibm.com/identity/token"
        data = {
            "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
            "apikey": self.api_key,
        }
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }

        logger.debug("Requesting new IAM access token for watsonx.ai")
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(iam_url, data=data, headers=headers)

        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error(
                f"IAM token request failed: {e.response.status_code} - {e.response.text}"
            )
            raise

        payload = resp.json()
        access_token = payload.get("access_token")
        expires_in = payload.get("expires_in", 3600)
        if not access_token:
            raise RuntimeError("IAM token response missing access_token")

        self._access_token = access_token
        self._token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        return self._access_token

    def _format_messages_for_granite(self, messages: List[Any]) -> str:
        """
        Format messages for Granite 4.0 chat template.

        Granite uses a specific chat format. We'll convert LangChain messages
        (BaseMessage objects) or simple dicts into the appropriate format.

        Args:
            messages: List of LangChain messages or dicts with 'role' and 'content'

        Returns:
            Formatted prompt string
        """
        formatted_parts: List[str] = []

        for msg in messages:
            role: str
            content: str

            # Handle LangChain message objects
            if isinstance(msg, BaseMessage):
                content = msg.content
                if isinstance(msg, SystemMessage):
                    role = "system"
                elif isinstance(msg, HumanMessage):
                    role = "user"
                elif isinstance(msg, AIMessage):
                    role = "assistant"
                elif isinstance(msg, ToolMessage) or getattr(msg, "type", "") == "tool":
                    role = "tool"
                else:
                    role = "user"

            # Handle plain dicts
            elif isinstance(msg, dict):
                role = msg.get("role", "user")
                content = str(msg.get("content", ""))

            # Fallback: treat anything else as user text
            else:
                role = "user"
                content = str(msg)

            if role == "system":
                formatted_parts.append(f"System: {content}")
            elif role == "user":
                formatted_parts.append(f"User: {content}")
            elif role == "assistant":
                formatted_parts.append(f"Assistant: {content}")
            elif role == "tool":
                # Granite 4.0 tool response format
                formatted_parts.append(f"<tool_response>{content}</tool_response>")

        # Add final assistant prompt
        formatted_parts.append("Assistant:")

        return "\n\n".join(formatted_parts)

    async def generate(
        self,
        prompt: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate text using Granite 4.0 model.

        Args:
            prompt: Input text prompt
            **kwargs: Additional generation parameters

        Returns:
            Response dict with 'text', 'model', 'usage', etc.
        """
        try:
            request_body = {
                "model_id": self.model_id,
                "input": prompt,
                "parameters": {
                    "decoding_method": "greedy",
                    "max_new_tokens": kwargs.get("max_tokens", self.max_tokens),
                    "temperature": kwargs.get("temperature", self.temperature),
                    "top_p": kwargs.get("top_p", 1.0),
                    "top_k": kwargs.get("top_k", 50),
                    "stop_sequences": kwargs.get("stop", ["\nUser:", "User:", "\n\nUser:", "\nUser: ", "User: ", "\n\nUser: "]),  # Critical fix for infinite loops
                },
                "project_id": self.project_id
            }

            logger.debug(f"Watsonx API request: {self.model_id}")
            start_time = datetime.now(timezone.utc)

            # Ensure we have a valid IAM access token for this request
            access_token = await self._get_access_token()
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }

            url = self._build_url_with_version(self.api_url)

            # Retry loop with exponential backoff
            last_error = None
            for attempt in range(self._max_retries + 1):
                try:
                    response = await self._http_client.post(
                        url,
                        headers=headers,
                        json=request_body
                    )
                    response.raise_for_status()
                    break  # Success
                except (httpx.TimeoutException, httpx.ConnectError, httpx.HTTPStatusError) as e:
                    last_error = e
                    if attempt < self._max_retries:
                        delay = self._retry_base_delay * (2 ** attempt)
                        logger.warning(f"WatsonX request failed (attempt {attempt + 1}/{self._max_retries + 1}), retrying in {delay}s: {e}")
                        import asyncio
                        await asyncio.sleep(delay)
                    else:
                        logger.error(f"WatsonX request failed after {self._max_retries + 1} attempts: {e}")
                        raise last_error

            duration_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)
            result = response.json()

            # Extract generated text
            generated_text = result.get("results", [{}])[0].get("generated_text", "")

            # Extract token usage
            token_usage = result.get("results", [{}])[0].get("input_token_count", 0)
            output_tokens = result.get("results", [{}])[0].get("generated_token_count", 0)

            logger.info(
                f"Watsonx generation complete: {output_tokens} tokens generated in {duration_ms}ms"
            )

            # FIX: Strip trailing "User:" suffix that LLM sometimes generates
            cleaned_text = re.sub(r'\s*User:\s*$', '', generated_text).strip()

            return {
                "text": cleaned_text,
                "model": self.model_id,
                "usage": {
                    "prompt_tokens": token_usage,
                    "completion_tokens": output_tokens,
                    "total_tokens": token_usage + output_tokens
                },
                "duration_ms": duration_ms,
                "finish_reason": result.get("results", [{}])[0].get("stop_reason", "completed")
            }

        except httpx.HTTPStatusError as e:
            # Log detailed IBM error payload when available to aid debugging
            try:
                error_detail = e.response.json()
            except Exception:
                error_detail = e.response.text
            url = str(e.request.url) if getattr(e, "request", None) else "unknown"
            logger.error(
                f"Watsonx API HTTP error: {e.response.status_code} "
                f"url={url} body={error_detail}"
            )
            raise
        except Exception as e:
            logger.error(f"Watsonx generation error: {e}")
            raise

    async def generate_batch(
        self,
        prompts: List[str],
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Generate text for a batch of prompts concurrently.

        Phase 3 Rec #15: Request Batching
        Uses asyncio.gather to process multiple requests in parallel,
        leveraging the HTTP connection pool for improved throughput.

        Args:
            prompts: List of input prompts
            **kwargs: Additional generation parameters

        Returns:
            List of response dicts in same order as prompts
        """
        import asyncio

        logger.info(f"Processing batch of {len(prompts)} requests")

        # Create tasks for each prompt
        tasks = [
            self.generate(prompt, **kwargs)
            for prompt in prompts
        ]

        # Execute concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results (handle exceptions)
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Batch item {i} failed: {result}")
                processed_results.append({
                    "text": "",
                    "error": str(result),
                    "model": self.model_id,
                    "usage": {"total_tokens": 0}
                })
            else:
                processed_results.append(result)

        return processed_results

    async def generate_stream(
        self,
        prompt: str,
        **kwargs
    ) -> AsyncIterator[str]:
        """
        Stream text generation using Granite 4.0 model.

        Args:
            prompt: Input text prompt
            **kwargs: Additional generation parameters

        Yields:
            Text chunks as they are generated
        """
        try:
            # EXPLICIT validation and logging for debugging truncation
            max_tokens_requested = kwargs.get("max_tokens", self.max_tokens)

            logger.warning(
                f"🔍 WATSONX STREAM REQUEST - "
                f"max_new_tokens={max_tokens_requested}, "
                f"model={self.model_id}, "
                f"prompt_length={len(prompt)} chars"
            )

            request_body = {
                "model_id": self.model_id,
                "input": prompt,
                "parameters": {
                    "decoding_method": "greedy",
                    "max_new_tokens": max_tokens_requested,  # Explicit, no fallback
                    "min_new_tokens": 100,  # Force minimum generation to prevent early stops
                    "temperature": kwargs.get("temperature", self.temperature),
                    "top_p": kwargs.get("top_p", 1.0),
                    "top_k": kwargs.get("top_k", 50),
                    "repetition_penalty": 1.05,  # Discourage repetition that wastes tokens
                    "stop_sequences": kwargs.get("stop", ["\nUser:", "User:", "\n\nUser:", "\nUser: ", "User: ", "\n\nUser: "]),  # Critical fix for infinite loops
                },
                "project_id": self.project_id
            }

            logger.warning(f"🔍 REQUEST PARAMETERS: {request_body['parameters']}")

            # Stream endpoint
            stream_url = self.api_url.replace("/generation", "/generation_stream")
            stream_url = self._build_url_with_version(stream_url)

            # Ensure we have a valid IAM access token for this request
            access_token = await self._get_access_token()
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }

            # Track token usage for debugging
            total_tokens = 0
            total_chars = 0

            async with self._http_client.stream(
                "POST",
                stream_url,
                headers=headers,
                json=request_body
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if line.strip():
                        # Parse SSE format
                        if line.startswith("data: "):
                            import json
                            try:
                                data = json.loads(line[6:])
                                if "results" in data:
                                    result = data["results"][0]
                                    text = result.get("generated_text", "")

                                    # Track token usage
                                    tokens_generated = result.get("generated_token_count", 0)
                                    stop_reason = result.get("stop_reason", "unknown")

                                    if text:
                                        total_tokens += tokens_generated
                                        total_chars += len(text)

                                        # CLIENT-SIDE CHUNKING for better UX
                                        # Watsonx returns the full response in one chunk, so we split it
                                        # into smaller pieces to simulate streaming for better perceived performance
                                        words = text.split()
                                        chunk_size = 5  # Words per chunk

                                        for i in range(0, len(words), chunk_size):
                                            chunk = " ".join(words[i:i + chunk_size])
                                            if i + chunk_size < len(words):
                                                chunk += " "  # Add trailing space except for last chunk
                                            yield chunk

                                    # Log completion with diagnostic info
                                    if stop_reason and stop_reason != "not_finished":
                                        logger.warning(
                                            f"🔍 STREAM COMPLETED - "
                                            f"tokens={total_tokens}, "
                                            f"chars={total_chars}, "
                                            f"stop_reason={stop_reason}, "
                                            f"requested_max={max_tokens_requested}"
                                        )
                            except json.JSONDecodeError:
                                continue

        except Exception as e:
            logger.error(f"Watsonx streaming error: {e}")
            raise

    async def close(self):
        """Close HTTP client."""
        await self._http_client.aclose()
        logger.debug("Watsonx HTTP client closed")


# LangChain-compatible wrapper
class WatsonxGraniteLangChain(Runnable):
    """
    LangChain-compatible wrapper for IBM Granite via watsonx.ai.

    Provides the same interface as LangChain's ChatOpenAI for easy integration.
    Inherits from Runnable to be compatible with LangGraph.
    """

    def __init__(
        self,
        model: str = "ibm/granite-4-h-small",
        temperature: float = 0.6,
        max_tokens: int = 400,
        streaming: bool = True,
        watsonx_api_key: Optional[str] = None,
        watsonx_project_id: Optional[str] = None
    ):
        """
        Initialize LangChain-compatible Granite client.

        Args:
            model: Granite model ID
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            streaming: Enable streaming
            watsonx_api_key: IBM Cloud API key
            watsonx_project_id: watsonx.ai project ID
        """
        self.model_name = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.streaming = streaming

        # Initialize watsonx client
        self._client = WatsonxGraniteClient(
            api_key=watsonx_api_key,
            project_id=watsonx_project_id,
            model_id=model,
            temperature=temperature,
            max_tokens=max_tokens
        )

        logger.info(f"WatsonxGraniteLangChain initialized: {model} (v2025-11-24-STREAMING-FIX)")

    def invoke(self, input: Any, config: Optional[Dict[str, Any]] = None, **kwargs):
        """
        Synchronous invoke (required by Runnable interface).

        Since LangGraph and FastAPI always run in an async context with a managed
        event loop, we use asyncio.run() directly. The framework (uvicorn/FastAPI)
        handles event loop lifecycle, so this works correctly.

        Note: This fixes the streaming issue by avoiding thread boundaries that
        break async generators. The previous ThreadPoolExecutor approach created
        a separate event loop in a new thread, preventing proper streaming.

        Version: v2025-11-24-STREAMING-FIX
        """
        import asyncio

        # For LangGraph/FastAPI context, always use asyncio.run()
        # The framework manages the event loop lifecycle properly
        try:
            return asyncio.run(self.ainvoke(input, **kwargs))
        except RuntimeError as e:
            # If asyncio.run() fails due to existing event loop, this indicates
            # an architectural issue that should be surfaced, not hidden
            logger.error(
                f"Event loop conflict in invoke(): {e}. "
                "This suggests incorrect usage - LangGraph should use ainvoke() directly."
            )
            raise


    async def ainvoke(self, messages: Any, config: Optional[Dict[str, Any]] = None, **kwargs):
        """
        Invoke model with messages (LangChain interface).

        Args:
            messages: List of LangChain messages, a single message, or a raw prompt
            config: Optional configuration (required by Runnable interface)
            **kwargs: Additional parameters

        Returns:
            AIMessage-like response
        """
        # Extract messages if passed as a dict (common in LangGraph)
        if isinstance(messages, dict) and "messages" in messages:
            messages = messages["messages"]
        # Normalize input to a list of messages
        if isinstance(messages, (str, BaseMessage, dict)):
            message_list: List[Any] = [messages]
        else:
            message_list = list(messages)

        # Format messages for Granite
        prompt = self._client._format_messages_for_granite(message_list)

        # Generate response
        result = await self._client.generate(prompt, **kwargs)

        # Return LangChain-compatible response
        return AIMessage(
            content=result["text"],
            response_metadata={
                "model": result["model"],
                "usage": result["usage"],
                "finish_reason": result["finish_reason"]
            }
        )

    async def astream(self, messages: List[Dict[str, str]], **kwargs):
        """
        Stream model responses (LangChain interface).

        Args:
            messages: List of message dicts
            **kwargs: Additional parameters

        Yields:
            AIMessageChunk-like responses
        """
        # Format messages for Granite
        prompt = self._client._format_messages_for_granite(messages)

        # Stream response
        async for chunk in self._client.generate_stream(prompt, **kwargs):
            yield AIMessageChunk(content=chunk)

    def bind_tools(self, tools: List[Any], **kwargs):
        """
        Bind tools to the model (LangGraph interface).

        For Granite, we don't actually bind tools to the model since it doesn't
        support native tool calling. Instead, we return self and let LangGraph
        handle tool calling through the ReAct pattern.

        Args:
            tools: List of tools to bind
            **kwargs: Additional parameters

        Returns:
            Self (for method chaining)
        """
        # Store tools for reference but don't actually bind them
        # LangGraph will handle tool calling through ReAct prompting
        self._tools = tools
        logger.info(f"Tools registered with Granite model: {len(tools)} tools")
        return self


# LangChain-compatible message classes
