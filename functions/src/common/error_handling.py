"""
Comprehensive Error Handling Module for Marketing Agent
Provides circuit breakers, retry logic, and graceful degradation
"""
import logging
import time
import asyncio
from typing import Optional, Callable, Any, TypeVar, Dict
from functools import wraps
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

T = TypeVar('T')


# ============================================================================
# Error Types
# ============================================================================

class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"           # Recoverable, no user impact
    MEDIUM = "medium"     # Degraded functionality
    HIGH = "high"         # Feature unavailable
    CRITICAL = "critical" # Service down


class AgentError(Exception):
    """Base exception for agent errors"""
    def __init__(self, message: str, severity: ErrorSeverity = ErrorSeverity.MEDIUM, details: Optional[Dict] = None):
        super().__init__(message)
        self.severity = severity
        self.details = details or {}
        self.timestamp = datetime.now()


class LLMError(AgentError):
    """LLM-related errors (API failures, rate limits, etc.)"""
    pass


class RetrievalError(AgentError):
    """Knowledge base retrieval errors"""
    pass


class ValidationError(AgentError):
    """Input validation errors"""
    pass


class ConfigurationError(AgentError):
    """Configuration errors"""
    pass


# ============================================================================
# Circuit Breaker
# ============================================================================

class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"       # Normal operation
    OPEN = "open"           # Failing, reject requests
    HALF_OPEN = "half_open" # Testing recovery


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5          # Failures before opening
    success_threshold: int = 2          # Successes to close from half-open
    timeout: int = 60                   # Seconds before trying half-open
    excluded_exceptions: tuple = ()     # Exceptions that don't count as failures


class CircuitBreaker:
    """
    Circuit breaker pattern implementation

    Prevents cascading failures by stopping requests to failing services
    """

    def __init__(self, name: str, config: Optional[CircuitBreakerConfig] = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.last_state_change: datetime = datetime.now()

    def call(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute function with circuit breaker protection"""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                logger.info(f"Circuit breaker '{self.name}' entering HALF_OPEN state")
            else:
                raise AgentError(
                    f"Circuit breaker '{self.name}' is OPEN",
                    severity=ErrorSeverity.HIGH,
                    details={"failures": self.failure_count, "last_failure": self.last_failure_time}
                )

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            if not isinstance(e, self.config.excluded_exceptions):
                self._on_failure()
            raise

    async def call_async(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute async function with circuit breaker protection"""
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                logger.info(f"Circuit breaker '{self.name}' entering HALF_OPEN state")
            else:
                raise AgentError(
                    f"Circuit breaker '{self.name}' is OPEN",
                    severity=ErrorSeverity.HIGH,
                    details={"failures": self.failure_count, "last_failure": self.last_failure_time}
                )

        try:
            result = await func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            if not isinstance(e, self.config.excluded_exceptions):
                self._on_failure()
            raise

    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0

        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self._close()

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()

        if self.state == CircuitState.HALF_OPEN:
            self._open()
        elif self.failure_count >= self.config.failure_threshold:
            self._open()

    def _open(self):
        """Open the circuit"""
        self.state = CircuitState.OPEN
        self.last_state_change = datetime.now()
        logger.warning(f"Circuit breaker '{self.name}' opened after {self.failure_count} failures")

    def _close(self):
        """Close the circuit"""
        self.state = CircuitState.CLOSED
        self.success_count = 0
        self.failure_count = 0
        self.last_state_change = datetime.now()
        logger.info(f"Circuit breaker '{self.name}' closed")

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to try half-open"""
        if self.last_failure_time is None:
            return True

        elapsed = (datetime.now() - self.last_failure_time).total_seconds()
        return elapsed >= self.config.timeout


# ============================================================================
# Retry Logic with Exponential Backoff
# ============================================================================

@dataclass
class RetryConfig:
    """Retry configuration"""
    max_attempts: int = 3
    initial_delay: float = 1.0      # seconds
    max_delay: float = 60.0          # seconds
    exponential_base: float = 2.0
    jitter: bool = True              # Add randomness to prevent thundering herd


class RetryHandler:
    """
    Retry handler with exponential backoff
    """

    def __init__(self, config: Optional[RetryConfig] = None):
        self.config = config or RetryConfig()

    def execute(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute function with retry logic"""
        last_exception = None

        for attempt in range(self.config.max_attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e

                if attempt < self.config.max_attempts - 1:
                    delay = self._calculate_delay(attempt)
                    logger.warning(
                        f"Attempt {attempt + 1}/{self.config.max_attempts} failed: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    time.sleep(delay)
                else:
                    logger.error(f"All {self.config.max_attempts} attempts failed")

        raise last_exception

    async def execute_async(self, func: Callable[..., T], *args, **kwargs) -> T:
        """Execute async function with retry logic"""
        last_exception = None

        for attempt in range(self.config.max_attempts):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_exception = e

                if attempt < self.config.max_attempts - 1:
                    delay = self._calculate_delay(attempt)
                    logger.warning(
                        f"Attempt {attempt + 1}/{self.config.max_attempts} failed: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"All {self.config.max_attempts} attempts failed")

        raise last_exception

    def _calculate_delay(self, attempt: int) -> float:
        """Calculate delay with exponential backoff and jitter"""
        delay = min(
            self.config.initial_delay * (self.config.exponential_base ** attempt),
            self.config.max_delay
        )

        if self.config.jitter:
            import random
            delay = delay * (0.5 + random.random())  # 50-150% of calculated delay

        return delay


# ============================================================================
# Decorators
# ============================================================================

def with_circuit_breaker(name: str, config: Optional[CircuitBreakerConfig] = None):
    """
    Decorator to add circuit breaker protection

    Usage:
        @with_circuit_breaker("llm_api")
        async def call_llm(prompt):
            ...
    """
    breaker = CircuitBreaker(name, config)

    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            return await breaker.call_async(func, *args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            return breaker.call(func, *args, **kwargs)

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def with_retry(config: Optional[RetryConfig] = None):
    """
    Decorator to add retry logic

    Usage:
        @with_retry(RetryConfig(max_attempts=5))
        async def fetch_data():
            ...
    """
    handler = RetryHandler(config)

    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            return await handler.execute_async(func, *args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            return handler.execute(func, *args, **kwargs)

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def with_fallback(fallback_func: Callable):
    """
    Decorator to provide fallback on error

    Usage:
        @with_fallback(lambda: "Default response")
        async def risky_operation():
            ...
    """
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Function {func.__name__} failed, using fallback: {e}")
                if asyncio.iscoroutinefunction(fallback_func):
                    return await fallback_func(*args, **kwargs)
                else:
                    return fallback_func(*args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Function {func.__name__} failed, using fallback: {e}")
                return fallback_func(*args, **kwargs)

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


# ============================================================================
# Error Handler Registry
# ============================================================================

class ErrorHandler:
    """
    Centralized error handler for the marketing agent
    """

    def __init__(self):
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.retry_handlers: Dict[str, RetryHandler] = {}

    def get_circuit_breaker(self, name: str, config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
        """Get or create a circuit breaker"""
        if name not in self.circuit_breakers:
            self.circuit_breakers[name] = CircuitBreaker(name, config)
        return self.circuit_breakers[name]

    def get_retry_handler(self, name: str, config: Optional[RetryConfig] = None) -> RetryHandler:
        """Get or create a retry handler"""
        if name not in self.retry_handlers:
            self.retry_handlers[name] = RetryHandler(config)
        return self.retry_handlers[name]

    def handle_error(self, error: Exception, context: Optional[Dict] = None) -> str:
        """
        Handle an error and return user-friendly message

        Args:
            error: The exception that occurred
            context: Additional context about the error

        Returns:
            User-friendly error message
        """
        context = context or {}

        # Log the error
        logger.error(f"Error in {context.get('operation', 'unknown')}: {error}", exc_info=True)

        # Return appropriate message based on error type
        if isinstance(error, LLMError):
            return self._handle_llm_error(error)
        elif isinstance(error, RetrievalError):
            return self._handle_retrieval_error(error)
        elif isinstance(error, ValidationError):
            return self._handle_validation_error(error)
        elif isinstance(error, AgentError):
            return self._handle_agent_error(error)
        else:
            return self._handle_unknown_error(error)

    def _handle_llm_error(self, error: LLMError) -> str:
        """Handle LLM errors"""
        if "rate limit" in str(error).lower():
            return "I'm experiencing high demand right now. Please try again in a moment."
        elif "timeout" in str(error).lower():
            return "The request took too long to process. Please try a simpler question."
        else:
            return "I'm having trouble generating a response right now. Please try again."

    def _handle_retrieval_error(self, error: RetrievalError) -> str:
        """Handle retrieval errors"""
        return "I'm having trouble accessing my knowledge base. I can still help with general questions!"

    def _handle_validation_error(self, error: ValidationError) -> str:
        """Handle validation errors"""
        return f"Invalid input: {str(error)}"

    def _handle_agent_error(self, error: AgentError) -> str:
        """Handle generic agent errors"""
        if error.severity == ErrorSeverity.CRITICAL:
            return "The service is temporarily unavailable. Please try again later."
        else:
            return "Something went wrong. Please try again."

    def _handle_unknown_error(self, error: Exception) -> str:
        """Handle unknown errors"""
        return "An unexpected error occurred. Our team has been notified."


# Global error handler instance
_error_handler = ErrorHandler()


def get_error_handler() -> ErrorHandler:
    """Get the global error handler instance"""
    return _error_handler
