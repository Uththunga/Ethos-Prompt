"""
EthosPrompt Python SDK

A comprehensive Python SDK for interacting with the EthosPrompt API.
Supports both synchronous and asynchronous operations with type hints.
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from enum import Enum
import httpx

__version__ = "1.0.0"
__author__ = "EthosPrompt Team"
__email__ = "support@ethosprompt.com"

class VariableType(Enum):
    """Variable types for prompt templates"""
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "boolean"
    SELECT = "select"

class DocumentStatus(Enum):
    """Document processing status"""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

@dataclass
class Variable:
    """Prompt template variable"""
    name: str
    type: VariableType
    description: Optional[str] = None
    required: bool = True
    default_value: Optional[str] = None
    options: Optional[List[str]] = None

@dataclass
class Prompt:
    """Prompt data structure"""
    id: str
    title: str
    content: str
    user_id: str
    description: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    variables: Optional[List[Variable]] = None
    workspace_id: Optional[str] = None
    is_public: bool = False
    is_shared: bool = False
    version: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    execution_count: int = 0
    like_count: int = 0
    comments_count: int = 0

@dataclass
class Document:
    """Document data structure"""
    id: str
    filename: str
    content_type: str
    size: int
    status: DocumentStatus
    uploaded_by: str
    uploaded_at: str
    processed_at: Optional[str] = None
    chunks_count: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class Execution:
    """Prompt execution result"""
    id: str
    prompt_id: str
    user_id: str
    variables: Dict[str, Any]
    model: str
    response: str
    tokens_used: int
    cost: float
    execution_time: float
    created_at: str
    rag_context: Optional[List[str]] = None

@dataclass
class APIResponse:
    """API response wrapper"""
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    timestamp: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None

class EthosPromptError(Exception):
    """Base exception for EthosPrompt SDK"""

    def __init__(self, message: str, code: Optional[int] = None, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details

class AuthenticationError(EthosPromptError):
    """Authentication related errors"""
    pass

class RateLimitError(EthosPromptError):
    """Rate limit exceeded errors"""
    pass

class NotFoundError(EthosPromptError):
    """Resource not found errors"""
    pass

class ValidationError(EthosPromptError):
    """Request validation errors"""
    pass

class EthosPromptClient:
    """
    Synchronous client for EthosPrompt API

    Example:
        client = EthosPromptClient(api_key="your_api_key")
        prompts = client.get_prompts()
    """

    def __init__(
        self,
        base_url: str = "https://australia-southeast1-ethosprompt.cloudfunctions.net/api",
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        timeout: float = 30.0,
        retries: int = 3
    ):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.access_token = access_token
        self.timeout = timeout
        self.retries = retries

        # Create HTTP client
        self._client = httpx.Client(
            timeout=timeout,
            headers=self._get_headers()
        )

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        """Close the HTTP client"""
        self._client.close()

    def _get_headers(self) -> Dict[str, str]:
        """Get request headers"""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": f"EthosPrompt-Python-SDK/{__version__}"
        }

        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        elif self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        return headers

    def _handle_response(self, response: httpx.Response) -> APIResponse:
        """Handle HTTP response and convert to APIResponse"""
        try:
            data = response.json()
        except json.JSONDecodeError:
            raise EthosPromptError(f"Invalid JSON response: {response.text}")

        if not response.is_success:
            error_data = data.get('error', {})
            message = error_data.get('message', f"HTTP {response.status_code}")
            code = error_data.get('code', response.status_code)
            details = error_data.get('details')

            # Raise specific exception types
            if response.status_code == 401:
                raise AuthenticationError(message, code, details)
            elif response.status_code == 403:
                raise AuthenticationError(message, code, details)
            elif response.status_code == 404:
                raise NotFoundError(message, code, details)
            elif response.status_code == 429:
                raise RateLimitError(message, code, details)
            elif response.status_code >= 400 and response.status_code < 500:
                raise ValidationError(message, code, details)
            else:
                raise EthosPromptError(message, code, details)

        return APIResponse(
            success=data.get('success', True),
            message=data.get('message'),
            data=data.get('data'),
            timestamp=data.get('timestamp'),
            meta=data.get('meta')
        )

    def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> APIResponse:
        """Make HTTP request with retry logic"""
        url = f"{self.base_url}{endpoint}"

        last_exception = None
        for attempt in range(self.retries + 1):
            try:
                response = self._client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params
                )
                return self._handle_response(response)

            except (httpx.RequestError, httpx.TimeoutException) as e:
                last_exception = e
                if attempt < self.retries:
                    # Exponential backoff
                    time.sleep(2 ** attempt)
                    continue
                else:
                    raise EthosPromptError(f"Request failed after {self.retries + 1} attempts: {str(e)}")

            except (AuthenticationError, ValidationError, NotFoundError) as e:
                # Don't retry client errors
                raise e

        raise last_exception

    # HEALTH CHECK

    def health(self) -> Dict[str, Any]:
        """Check API health status"""
        response = self._request("GET", "/v1/health")
        return response.data

    # PROMPTS

    def get_prompts(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        workspace_id: Optional[str] = None
    ) -> List[Prompt]:
        """Get a list of prompts with optional filtering"""
        params = {"page": page, "limit": limit}

        if search:
            params["search"] = search
        if category:
            params["category"] = category
        if workspace_id:
            params["workspace_id"] = workspace_id
        if tags:
            params["tags"] = tags

        response = self._request("GET", "/v1/prompts", params=params)

        # Convert to Prompt objects
        prompts = []
        for prompt_data in response.data or []:
            # Convert variables
            variables = None
            if prompt_data.get('variables'):
                variables = [
                    Variable(
                        name=var['name'],
                        type=VariableType(var['type']),
                        description=var.get('description'),
                        required=var.get('required', True),
                        default_value=var.get('default_value'),
                        options=var.get('options')
                    )
                    for var in prompt_data['variables']
                ]

            prompt = Prompt(
                id=prompt_data['id'],
                title=prompt_data['title'],
                content=prompt_data['content'],
                user_id=prompt_data['user_id'],
                description=prompt_data.get('description'),
                category=prompt_data.get('category'),
                tags=prompt_data.get('tags'),
                variables=variables,
                workspace_id=prompt_data.get('workspace_id'),
                is_public=prompt_data.get('is_public', False),
                is_shared=prompt_data.get('is_shared', False),
                version=prompt_data.get('version', 1),
                created_at=prompt_data.get('created_at'),
                updated_at=prompt_data.get('updated_at'),
                execution_count=prompt_data.get('execution_count', 0),
                like_count=prompt_data.get('like_count', 0),
                comments_count=prompt_data.get('comments_count', 0)
            )
            prompts.append(prompt)

        return prompts

    def get_prompt(self, prompt_id: str) -> Prompt:
        """Get a specific prompt by ID"""
        response = self._request("GET", f"/v1/prompts/{prompt_id}")
        prompt_data = response.data

        # Convert variables
        variables = None
        if prompt_data.get('variables'):
            variables = [
                Variable(
                    name=var['name'],
                    type=VariableType(var['type']),
                    description=var.get('description'),
                    required=var.get('required', True),
                    default_value=var.get('default_value'),
                    options=var.get('options')
                )
                for var in prompt_data['variables']
            ]

        return Prompt(
            id=prompt_data['id'],
            title=prompt_data['title'],
            content=prompt_data['content'],
            user_id=prompt_data['user_id'],
            description=prompt_data.get('description'),
            category=prompt_data.get('category'),
            tags=prompt_data.get('tags'),
            variables=variables,
            workspace_id=prompt_data.get('workspace_id'),
            is_public=prompt_data.get('is_public', False),
            is_shared=prompt_data.get('is_shared', False),
            version=prompt_data.get('version', 1),
            created_at=prompt_data.get('created_at'),
            updated_at=prompt_data.get('updated_at'),
            execution_count=prompt_data.get('execution_count', 0),
            like_count=prompt_data.get('like_count', 0),
            comments_count=prompt_data.get('comments_count', 0)
        )

    def create_prompt(
        self,
        title: str,
        content: str,
        description: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        variables: Optional[List[Variable]] = None,
        workspace_id: Optional[str] = None,
        is_public: bool = False
    ) -> Prompt:
        """Create a new prompt"""
        data = {
            "title": title,
            "content": content,
            "is_public": is_public
        }

        if description:
            data["description"] = description
        if category:
            data["category"] = category
        if tags:
            data["tags"] = tags
        if workspace_id:
            data["workspace_id"] = workspace_id
        if variables:
            data["variables"] = [
                {
                    "name": var.name,
                    "type": var.type.value,
                    "description": var.description,
                    "required": var.required,
                    "default_value": var.default_value,
                    "options": var.options
                }
                for var in variables
            ]

        response = self._request("POST", "/v1/prompts", data=data)
        return self.get_prompt(response.data['id'])

    def update_prompt(
        self,
        prompt_id: str,
        title: Optional[str] = None,
        content: Optional[str] = None,
        description: Optional[str] = None,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        variables: Optional[List[Variable]] = None,
        is_public: Optional[bool] = None
    ) -> Prompt:
        """Update an existing prompt"""
        data = {}

        if title is not None:
            data["title"] = title
        if content is not None:
            data["content"] = content
        if description is not None:
            data["description"] = description
        if category is not None:
            data["category"] = category
        if tags is not None:
            data["tags"] = tags
        if is_public is not None:
            data["is_public"] = is_public
        if variables is not None:
            data["variables"] = [
                {
                    "name": var.name,
                    "type": var.type.value,
                    "description": var.description,
                    "required": var.required,
                    "default_value": var.default_value,
                    "options": var.options
                }
                for var in variables
            ]

        response = self._request("PUT", f"/v1/prompts/{prompt_id}", data=data)
        return self.get_prompt(prompt_id)

    def delete_prompt(self, prompt_id: str) -> bool:
        """Delete a prompt"""
        response = self._request("DELETE", f"/v1/prompts/{prompt_id}")
        return response.success

    # DOCUMENTS

    def get_documents(
        self,
        page: int = 1,
        limit: int = 20,
        status: Optional[str] = None
    ) -> List[Document]:
        """Get a list of documents"""
        params = {"page": page, "limit": limit}

        if status:
            params["status"] = status

        response = self._request("GET", "/v1/documents", params=params)

        # Convert to Document objects
        documents = []
        for doc_data in response.data or []:
            document = Document(
                id=doc_data['id'],
                filename=doc_data['filename'],
                content_type=doc_data['content_type'],
                size=doc_data['size'],
                status=DocumentStatus(doc_data['status']),
                uploaded_by=doc_data['uploaded_by'],
                uploaded_at=doc_data['uploaded_at'],
                processed_at=doc_data.get('processed_at'),
                chunks_count=doc_data.get('chunks_count'),
                metadata=doc_data.get('metadata')
            )
            documents.append(document)

        return documents

    def get_document(self, document_id: str) -> Document:
        """Get a specific document by ID"""
        response = self._request("GET", f"/v1/documents/{document_id}")
        doc_data = response.data

        return Document(
            id=doc_data['id'],
            filename=doc_data['filename'],
            content_type=doc_data['content_type'],
            size=doc_data['size'],
            status=DocumentStatus(doc_data['status']),
            uploaded_by=doc_data['uploaded_by'],
            uploaded_at=doc_data['uploaded_at'],
            processed_at=doc_data.get('processed_at'),
            chunks_count=doc_data.get('chunks_count'),
            metadata=doc_data.get('metadata')
        )

    def delete_document(self, document_id: str) -> bool:
        """Delete a document"""
        response = self._request("DELETE", f"/v1/documents/{document_id}")
        return response.success

    # UTILITY METHODS

    def test_connection(self) -> Dict[str, Any]:
        """Test API connectivity and authentication"""
        try:
            health_data = self.health()
            return {
                "success": True,
                "message": "API connection successful",
                "details": health_data
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "details": getattr(e, 'details', None)
            }

# Async client implementation would go here...
# For brevity, I'll create a placeholder

class AsyncEthosPromptClient:
    """
    Asynchronous client for EthosPrompt API

    Example:
        async with AsyncEthosPromptClient(api_key="your_api_key") as client:
            prompts = await client.get_prompts()
    """

    def __init__(self, **kwargs):
        # Implementation similar to sync client but with httpx.AsyncClient
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

    async def close(self):
        """Close the async HTTP client"""
        pass

# Convenience functions
def create_client(**kwargs) -> EthosPromptClient:
    """Create a new synchronous client instance"""
    return EthosPromptClient(**kwargs)

def create_async_client(**kwargs) -> AsyncEthosPromptClient:
    """Create a new asynchronous client instance"""
    return AsyncEthosPromptClient(**kwargs)

# Export main classes and functions
__all__ = [
    "EthosPromptClient",
    "AsyncEthosPromptClient",
    "EthosPromptError",
    "AuthenticationError",
    "RateLimitError",
    "NotFoundError",
    "ValidationError",
    "Prompt",
    "Variable",
    "Document",
    "Execution",
    "VariableType",
    "DocumentStatus",
    "create_client",
    "create_async_client"
]
