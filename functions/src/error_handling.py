"""
Comprehensive Error Handling Module
Task 1.4: Add Comprehensive Error Handling

This module provides error categorization, handling, and user-friendly error messages
for the Prompt Library Dashboard backend.
"""

import logging
import os
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime, timezone
from firebase_functions import https_fn

logger = logging.getLogger(__name__)

# Sentry integration
try:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    logger.warning("sentry-sdk not installed - error tracking disabled")


def init_sentry():
    """
    Initialize Sentry for error tracking

    This function should be called at application startup to enable
    error tracking in production environments.
    """
    if not SENTRY_AVAILABLE:
        logger.warning("Sentry SDK not available - skipping initialization")
        return

    sentry_dsn = os.getenv('SENTRY_DSN')
    if not sentry_dsn:
        logger.info("SENTRY_DSN not configured - error tracking disabled")
        return

    try:
        # Configure Sentry with logging integration
        sentry_sdk.init(
            dsn=sentry_dsn,
            environment=os.getenv('ENVIRONMENT', 'production'),
            traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
            integrations=[
                LoggingIntegration(
                    level=logging.INFO,  # Capture info and above as breadcrumbs
                    event_level=logging.ERROR  # Send errors and above as events
                )
            ],
            before_send=_filter_sensitive_data
        )
        logger.info(f"Sentry initialized successfully for environment: {os.getenv('ENVIRONMENT', 'production')}")
    except Exception as e:
        logger.error(f"Failed to initialize Sentry: {e}")


def _filter_sensitive_data(event, hint):
    """
    Filter sensitive data from Sentry events before sending

    Args:
        event: Sentry event dictionary
        hint: Additional context

    Returns:
        Modified event or None to drop the event
    """
    # Remove sensitive headers
    if event.get('request') and event['request'].get('headers'):
        sensitive_headers = ['authorization', 'cookie', 'x-api-key']
        for header in sensitive_headers:
            if header in event['request']['headers']:
                event['request']['headers'][header] = '[REDACTED]'

    # Remove sensitive environment variables
    if event.get('contexts') and event['contexts'].get('runtime'):
        env = event['contexts']['runtime'].get('env', {})
        sensitive_env_vars = ['SENTRY_DSN', 'OPENROUTER_API_KEY', 'GOOGLE_API_KEY', 'JWT_SECRET']
        for var in sensitive_env_vars:
            if var in env:
                env[var] = '[REDACTED]'

    return event


class ErrorCategory(Enum):
    """Error categories for better error handling and user feedback"""
    API_ERROR = "api_error"
    NETWORK_ERROR = "network_error"
    VALIDATION_ERROR = "validation_error"
    TIMEOUT_ERROR = "timeout_error"
    AUTHENTICATION_ERROR = "authentication_error"
    AUTHORIZATION_ERROR = "authorization_error"
    RATE_LIMIT_ERROR = "rate_limit_error"
    COST_LIMIT_ERROR = "cost_limit_error"
    NOT_FOUND_ERROR = "not_found_error"
    INTERNAL_ERROR = "internal_error"
    RAG_ERROR = "rag_error"
    EMBEDDING_ERROR = "embedding_error"


class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AppError(Exception):
    """Base application error with categorization"""

    def __init__(
        self,
        message: str,
        category: ErrorCategory,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        details: Optional[Dict[str, Any]] = None,
        user_message: Optional[str] = None,
        retry_after: Optional[int] = None
    ):
        super().__init__(message)
        self.message = message
        self.category = category
        self.severity = severity
        self.details = details or {}
        self.user_message = user_message or self._generate_user_message()
        self.retry_after = retry_after
        self.timestamp = datetime.now(timezone.utc)

    def _generate_user_message(self) -> str:
        """Generate user-friendly error message based on category"""
        messages = {
            ErrorCategory.API_ERROR: "We're having trouble connecting to our AI service. Please try again in a moment.",
            ErrorCategory.NETWORK_ERROR: "Network connection issue. Please check your internet connection and try again.",
            ErrorCategory.VALIDATION_ERROR: "Invalid input provided. Please check your request and try again.",
            ErrorCategory.TIMEOUT_ERROR: "The request took too long to complete. Please try again with a shorter prompt.",
            ErrorCategory.AUTHENTICATION_ERROR: "Authentication failed. Please sign in again.",
            ErrorCategory.AUTHORIZATION_ERROR: "You don't have permission to perform this action.",
            ErrorCategory.RATE_LIMIT_ERROR: "You've exceeded the rate limit. Please wait a moment before trying again.",
            ErrorCategory.COST_LIMIT_ERROR: "You've reached your usage limit. Please upgrade your plan or wait until your limit resets.",
            ErrorCategory.NOT_FOUND_ERROR: "The requested resource was not found.",
            ErrorCategory.INTERNAL_ERROR: "An unexpected error occurred. Our team has been notified.",
            ErrorCategory.RAG_ERROR: "Error processing documents for context retrieval. Please try again.",
            ErrorCategory.EMBEDDING_ERROR: "Error generating embeddings. Please try again later."
        }
        return messages.get(self.category, "An error occurred. Please try again.")

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for API response"""
        return {
            "error": True,
            "message": self.user_message,
            "category": self.category.value,
            "severity": self.severity.value,
            "details": self.details,
            "retry_after": self.retry_after,
            "timestamp": self.timestamp.isoformat()
        }

    def to_https_error(self) -> https_fn.HttpsError:
        """Convert to Firebase HttpsError"""
        code_mapping = {
            ErrorCategory.API_ERROR: "unavailable",
            ErrorCategory.NETWORK_ERROR: "unavailable",
            ErrorCategory.VALIDATION_ERROR: "invalid-argument",
            ErrorCategory.TIMEOUT_ERROR: "deadline-exceeded",
            ErrorCategory.AUTHENTICATION_ERROR: "unauthenticated",
            ErrorCategory.AUTHORIZATION_ERROR: "permission-denied",
            ErrorCategory.RATE_LIMIT_ERROR: "resource-exhausted",
            ErrorCategory.COST_LIMIT_ERROR: "resource-exhausted",
            ErrorCategory.NOT_FOUND_ERROR: "not-found",
            ErrorCategory.INTERNAL_ERROR: "internal",
            ErrorCategory.RAG_ERROR: "internal",
            ErrorCategory.EMBEDDING_ERROR: "internal"
        }

        code = code_mapping.get(self.category, "internal")
        return https_fn.HttpsError(code, self.user_message, self.to_dict())


# Specific error classes

class APIError(AppError):
    """API-related errors (OpenRouter, Google Embeddings, etc.)"""
    def __init__(self, message: str, status_code: Optional[int] = None, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.API_ERROR,
            severity=ErrorSeverity.HIGH,
            details={"status_code": status_code},
            **kwargs
        )


class NetworkError(AppError):
    """Network connectivity errors"""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.NETWORK_ERROR,
            severity=ErrorSeverity.HIGH,
            **kwargs
        )


class ValidationError(AppError):
    """Input validation errors"""
    def __init__(self, message: str, field: Optional[str] = None, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.VALIDATION_ERROR,
            severity=ErrorSeverity.LOW,
            details={"field": field},
            **kwargs
        )


class TimeoutError(AppError):
    """Timeout errors"""
    def __init__(self, message: str, timeout_seconds: Optional[int] = None, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.TIMEOUT_ERROR,
            severity=ErrorSeverity.MEDIUM,
            details={"timeout_seconds": timeout_seconds},
            **kwargs
        )


class RateLimitError(AppError):
    """Rate limit exceeded errors"""
    def __init__(self, message: str, retry_after: int, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.RATE_LIMIT_ERROR,
            severity=ErrorSeverity.MEDIUM,
            retry_after=retry_after,
            **kwargs
        )


class CostLimitError(AppError):
    """Cost limit exceeded errors"""
    def __init__(self, message: str, current_cost: float, limit: float, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.COST_LIMIT_ERROR,
            severity=ErrorSeverity.MEDIUM,
            details={"current_cost": current_cost, "limit": limit},
            **kwargs
        )


class RAGError(AppError):
    """RAG pipeline errors"""
    def __init__(self, message: str, stage: Optional[str] = None, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.RAG_ERROR,
            severity=ErrorSeverity.MEDIUM,
            details={"stage": stage},
            **kwargs
        )


class EmbeddingError(AppError):
    """Embedding generation errors"""
    def __init__(self, message: str, **kwargs):
        super().__init__(
            message=message,
            category=ErrorCategory.EMBEDDING_ERROR,
            severity=ErrorSeverity.HIGH,
            **kwargs
        )


def handle_error(error: Exception, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Central error handler that categorizes and formats errors

    Args:
        error: The exception to handle
        context: Additional context about the error

    Returns:
        Dictionary with error information for API response
    """
    context = context or {}

    # Send to Sentry if available
    if SENTRY_AVAILABLE and sentry_sdk.Hub.current.client:
        # Add context to Sentry
        with sentry_sdk.push_scope() as scope:
            for key, value in context.items():
                scope.set_context(key, value if isinstance(value, dict) else {"value": value})

            # Capture the exception
            sentry_sdk.capture_exception(error)

    # If it's already an AppError, use it directly
    if isinstance(error, AppError):
        logger.error(
            f"AppError: {error.category.value} - {error.message}",
            extra={"context": context, "details": error.details}
        )
        return error.to_dict()

    # Categorize common exceptions
    error_str = str(error).lower()

    # Network errors
    if any(keyword in error_str for keyword in ["connection", "network", "timeout", "unreachable"]):
        app_error = NetworkError(str(error))

    # API errors
    elif any(keyword in error_str for keyword in ["api", "401", "403", "429", "500", "502", "503"]):
        app_error = APIError(str(error))

    # Validation errors
    elif any(keyword in error_str for keyword in ["invalid", "required", "missing", "validation"]):
        app_error = ValidationError(str(error))

    # Timeout errors
    elif "timeout" in error_str:
        app_error = TimeoutError(str(error))

    # Default to internal error
    else:
        app_error = AppError(
            message=str(error),
            category=ErrorCategory.INTERNAL_ERROR,
            severity=ErrorSeverity.HIGH
        )

    logger.error(
        f"Unhandled exception: {type(error).__name__} - {str(error)}",
        extra={"context": context},
        exc_info=True
    )

    return app_error.to_dict()


def log_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    request_id: Optional[str] = None
):
    """
    Log error with structured logging for monitoring

    Args:
        error: The exception to log
        context: Additional context
        user_id: User ID if available
        request_id: Request ID for tracing
    """
    log_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context or {},
        "user_id": user_id,
        "request_id": request_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

    if isinstance(error, AppError):
        log_data.update({
            "category": error.category.value,
            "severity": error.severity.value,
            "details": error.details
        })

    logger.error("Error occurred", extra=log_data, exc_info=True)
