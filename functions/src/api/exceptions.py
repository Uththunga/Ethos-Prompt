"""
Custom Exception Classes and Error Handlers
"""
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
import traceback

logger = logging.getLogger(__name__)

class APIError(Exception):
    """Base API error class"""
    def __init__(
        self, 
        message: str, 
        status_code: int = 500, 
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

class AuthenticationError(APIError):
    """Authentication related errors"""
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 401, "AUTHENTICATION_ERROR", details)

class AuthorizationError(APIError):
    """Authorization related errors"""
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 403, "AUTHORIZATION_ERROR", details)

class ValidationError(APIError):
    """Input validation errors"""
    def __init__(self, message: str = "Invalid input data", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 400, "VALIDATION_ERROR", details)

class ResourceNotFoundError(APIError):
    """Resource not found errors"""
    def __init__(self, message: str = "Resource not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 404, "RESOURCE_NOT_FOUND", details)

class RateLimitError(APIError):
    """Rate limiting errors"""
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 429, "RATE_LIMIT_EXCEEDED", details)

class LLMProviderError(APIError):
    """LLM provider related errors"""
    def __init__(self, message: str = "LLM provider error", provider: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        error_details = details or {}
        if provider:
            error_details["provider"] = provider
        super().__init__(message, 503, "LLM_PROVIDER_ERROR", error_details)

class DocumentProcessingError(APIError):
    """Document processing errors"""
    def __init__(self, message: str = "Document processing failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 422, "DOCUMENT_PROCESSING_ERROR", details)

class VectorStoreError(APIError):
    """Vector store related errors"""
    def __init__(self, message: str = "Vector store error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 503, "VECTOR_STORE_ERROR", details)

class ConfigurationError(APIError):
    """Configuration related errors"""
    def __init__(self, message: str = "Configuration error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, 500, "CONFIGURATION_ERROR", details)

class ExternalServiceError(APIError):
    """External service errors"""
    def __init__(self, message: str = "External service error", service: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        error_details = details or {}
        if service:
            error_details["service"] = service
        super().__init__(message, 503, "EXTERNAL_SERVICE_ERROR", error_details)

def create_error_response(
    error: Exception,
    request: Optional[Request] = None,
    include_traceback: bool = False
) -> JSONResponse:
    """Create standardized error response"""
    
    # Default error response
    error_response = {
        "success": False,
        "error": {
            "message": "Internal server error",
            "code": "INTERNAL_ERROR",
            "timestamp": None,
            "request_id": None
        }
    }
    
    status_code = 500
    
    # Handle different error types
    if isinstance(error, APIError):
        error_response["error"]["message"] = error.message
        error_response["error"]["code"] = error.error_code
        error_response["error"]["details"] = error.details
        status_code = error.status_code
        
    elif isinstance(error, HTTPException):
        error_response["error"]["message"] = error.detail
        error_response["error"]["code"] = f"HTTP_{error.status_code}"
        status_code = error.status_code
        
    elif isinstance(error, ValidationError):
        error_response["error"]["message"] = "Validation error"
        error_response["error"]["code"] = "VALIDATION_ERROR"
        error_response["error"]["details"] = {"validation_errors": str(error)}
        status_code = 422
        
    elif isinstance(error, ValueError):
        error_response["error"]["message"] = str(error)
        error_response["error"]["code"] = "VALUE_ERROR"
        status_code = 400
        
    elif isinstance(error, KeyError):
        error_response["error"]["message"] = f"Missing required field: {str(error)}"
        error_response["error"]["code"] = "MISSING_FIELD"
        status_code = 400
        
    elif isinstance(error, FileNotFoundError):
        error_response["error"]["message"] = "File not found"
        error_response["error"]["code"] = "FILE_NOT_FOUND"
        status_code = 404
        
    elif isinstance(error, PermissionError):
        error_response["error"]["message"] = "Permission denied"
        error_response["error"]["code"] = "PERMISSION_DENIED"
        status_code = 403
        
    else:
        # Generic error handling
        error_response["error"]["message"] = str(error) if str(error) else "Unknown error occurred"
        error_response["error"]["code"] = error.__class__.__name__.upper()
    
    # Add timestamp
    from datetime import datetime, timezone
    error_response["error"]["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    # Add request ID if available
    if request and hasattr(request.state, "request_id"):
        error_response["error"]["request_id"] = request.state.request_id
    
    # Add traceback in development mode
    if include_traceback:
        error_response["error"]["traceback"] = traceback.format_exc()
    
    # Log the error
    log_error(error, request, error_response)
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )

def log_error(error: Exception, request: Optional[Request] = None, error_response: Dict = None):
    """Log error with context"""
    
    # Prepare log context
    log_context = {
        "error_type": error.__class__.__name__,
        "error_message": str(error),
    }
    
    if request:
        log_context.update({
            "method": request.method,
            "url": str(request.url),
            "user_agent": request.headers.get("user-agent"),
            "client_ip": request.client.host if request.client else None,
        })
    
    if error_response:
        log_context["error_code"] = error_response.get("error", {}).get("code")
        log_context["status_code"] = error_response.get("error", {}).get("status_code")
    
    # Log based on error severity
    if isinstance(error, (AuthenticationError, AuthorizationError, ValidationError)):
        logger.warning(f"Client error: {error}", extra=log_context)
    elif isinstance(error, (LLMProviderError, VectorStoreError, ExternalServiceError)):
        logger.error(f"Service error: {error}", extra=log_context)
    elif isinstance(error, ConfigurationError):
        logger.critical(f"Configuration error: {error}", extra=log_context)
    else:
        logger.error(f"Unexpected error: {error}", extra=log_context, exc_info=True)

def handle_llm_provider_errors(func):
    """Decorator to handle LLM provider specific errors"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            error_message = str(e).lower()
            
            # Map common LLM provider errors
            if "rate limit" in error_message or "quota" in error_message:
                raise RateLimitError(f"LLM provider rate limit exceeded: {str(e)}")
            elif "api key" in error_message or "authentication" in error_message:
                raise AuthenticationError(f"LLM provider authentication failed: {str(e)}")
            elif "model not found" in error_message or "invalid model" in error_message:
                raise ValidationError(f"Invalid model specified: {str(e)}")
            elif "timeout" in error_message:
                raise ExternalServiceError(f"LLM provider timeout: {str(e)}", service="llm_provider")
            else:
                raise LLMProviderError(f"LLM provider error: {str(e)}")
    
    return wrapper

def handle_vector_store_errors(func):
    """Decorator to handle vector store specific errors"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            error_message = str(e).lower()
            
            # Map common vector store errors
            if "index not found" in error_message:
                raise ResourceNotFoundError(f"Vector index not found: {str(e)}")
            elif "connection" in error_message or "network" in error_message:
                raise ExternalServiceError(f"Vector store connection error: {str(e)}", service="vector_store")
            elif "quota" in error_message or "limit" in error_message:
                raise RateLimitError(f"Vector store quota exceeded: {str(e)}")
            else:
                raise VectorStoreError(f"Vector store error: {str(e)}")
    
    return wrapper

def handle_document_processing_errors(func):
    """Decorator to handle document processing specific errors"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            error_message = str(e).lower()
            
            # Map common document processing errors
            if "unsupported format" in error_message or "invalid file" in error_message:
                raise ValidationError(f"Unsupported document format: {str(e)}")
            elif "file too large" in error_message or "size limit" in error_message:
                raise ValidationError(f"File size limit exceeded: {str(e)}")
            elif "corrupted" in error_message or "damaged" in error_message:
                raise ValidationError(f"Corrupted document: {str(e)}")
            else:
                raise DocumentProcessingError(f"Document processing failed: {str(e)}")
    
    return wrapper


