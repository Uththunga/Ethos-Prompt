"""
Improved Error Handling Utilities
Provides specific exception types and better error context
"""
import logging
from typing import Any, Optional, Callable
from functools import wraps
import traceback

logger = logging.getLogger(__name__)


class AgentError(Exception):
    """Base exception for agent errors"""
    pass


class ConfigurationError(AgentError):
    """Configuration validation failed"""
    pass


class ValidationError(AgentError):
    """Input validation failed"""
    pass


class RetrievalError(AgentError):
    """Knowledge base retrieval failed"""
    pass


class LLMError(AgentError):
    """LLM invocation failed"""
    pass


class CheckpointerError(AgentError):
    """State persistence failed"""
    pass


def handle_retrieval_errors(fallback_message: Optional[str] = None):
    """
    Decorator for retrieval operations with specific error handling.

    Usage:
        @handle_retrieval_errors(fallback_message="KB unavailable")
        async def search_kb(...):
            ...
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except (ConnectionError, TimeoutError) as e:
                # Network/connection issues - recoverable
                logger.error(f"Retrieval connection failed in {func.__name__}: {e}")
                from ..common.monitoring import AgentMonitoring
                _mon = AgentMonitoring(service="marketing-api")
                _mon.record_error("retrieval_connection", str(e))

                if fallback_message:
                    return fallback_message
                raise RetrievalError(f"Could not connect to knowledge base: {e}") from e

            except ValueError as e:
                # Invalid parameters
                logger.error(f"Invalid retrieval parameters in {func.__name__}: {e}")
                raise ValidationError(f"Invalid search parameters: {e}") from e

            except Exception as e:
                # Unexpected errors - log full traceback
                logger.exception(f"Unexpected error in {func.__name__}")
                from ..common.monitoring import AgentMonitoring
                _mon = AgentMonitoring(service="marketing-api")
                _mon.record_error("retrieval_unexpected", str(e))

                # Re-raise with context
                raise RetrievalError(f"Retrieval failed unexpectedly: {str(e)}") from e

        return wrapper
    return decorator


def handle_llm_errors(func: Callable):
    """
    Decorator for LLM operations with specific error handling.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except (ConnectionError, TimeoutError) as e:
            logger.error(f"LLM connection failed in {func.__name__}: {e}")
            from ..common.monitoring import AgentMonitoring
            _mon = AgentMonitoring(service="marketing-api")
            _mon.record_error("llm_connection", str(e))
            raise LLMError(f"LLM service unavailable: {e}") from e

        except ValueError as e:
            # Rate limit or API errors
            logger.error(f"LLM API error in {func.__name__}: {e}")
            raise LLMError(f"LLM API error: {e}") from e

        except Exception as e:
            logger.exception(f"Unexpected LLM error in {func.__name__}")
            from ..common.monitoring import AgentMonitoring
            _mon = AgentMonitoring(service="marketing-api")
            _mon.record_error("llm_unexpected", str(e))
            raise LLMError(f"LLM failed unexpectedly: {str(e)}") from e

    return wrapper


def log_error_with_context(
    logger_instance: logging.Logger,
    error: Exception,
    context: Optional[dict] = None
):
    """
    Log error with full context and stack trace.

    Args:
        logger_instance: Logger to use
        error: Exception that occurred
        context: Additional context dict
    """
    error_info = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "stack_trace": traceback.format_exc(),
        "context": context or {}
    }

    logger_instance.error(
        f"Error occurred: {error_info['error_type']} - {error_info['error_message']}",
        extra={"error_info": error_info}
    )

