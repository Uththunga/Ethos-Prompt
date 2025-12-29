"""
Enhanced Error Handling for Marketing Agent
Phase 2 Recommendation #16: Exponential backoff and circuit breaker

Provides:
- Exponential backoff for transient failures
- Circuit breaker for cascading failure prevention
- Context-aware fallback responses
"""

import asyncio
import time
import logging
from typing import Any, Callable, Optional
from functools import wraps
from enum import Enum

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, rejecting requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker pattern implementation.

    Prevents cascading failures by temporarily blocking requests
    to a failing service, allowing it time to recover.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        """
        Initialize circuit breaker.

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before trying again (half-open)
            expected_exception: Exception type to catch
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.

        Args:
            func: Function to execute
            *args, **kwargs: Function arguments

        Returns:
            Function result

        Raises:
            Exception: If circuit is open or function fails
        """
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker entering HALF_OPEN state")
            else:
                raise Exception(f"Circuit breaker is OPEN. Service unavailable. Retry after {self.recovery_timeout}s")

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True
        return (time.time() - self.last_failure_time) >= self.recovery_timeout

    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0
        if self.state == CircuitState.HALF_OPEN:
            self.state = CircuitState.CLOSED
            logger.info("Circuit breaker CLOSED after successful recovery")

    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(
                f"Circuit breaker OPENED after {self.failure_count} failures. "
                f"Will retry after {self.recovery_timeout}s"
            )


def with_exponential_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
    exponential_base: float = 2.0
):
    """
    Decorator for exponential backoff retry logic.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        exponential_base: Base for exponential calculation

    Usage:
        @with_exponential_backoff(max_retries=3, base_delay=1.0)
        async def my_function():
            # function that may fail transiently
            pass
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e

                    if attempt < max_retries:
                        # Calculate delay with exponential backoff
                        delay = min(
                            base_delay * (exponential_base ** attempt),
                            max_delay
                        )

                        logger.warning(
                            f"{func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}). "
                            f"Retrying in {delay:.1f}s... Error: {str(e)}"
                        )

                        await asyncio.sleep(delay)
                    else:
                        logger.error(
                            f"{func.__name__} failed after {max_retries + 1} attempts. "
                            f"Final error: {str(e)}"
                        )

            # All retries exhausted
            raise last_exception

        return wrapper
    return decorator


def get_context_aware_fallback(error_type: str, context: Optional[dict] = None) -> str:
    """
    Generate context-aware fallback response based on error type.

    Args:
        error_type: Type of error encountered
        context: Optional context dict with page_context, query, etc.

    Returns:
        User-friendly fallback message
    """
    page_context = context.get("page_context", "unknown") if context else "unknown"

    fallbacks = {
        "kb_retrieval_error": f"""I'm having trouble accessing specific details right now, but I can still help!

EthosPrompt offers AI-powered business solutions including Smart Business Assistants, System Integration, and Custom Applications. Our enterprise-grade technology delivers proven ROI with 40% efficiency gains.

Would you like me to connect you with our team for detailed information? They can answer any specific questions about {page_context}.""",

        "llm_error": """I'm experiencing a temporary issue with my AI processing. Let me try a different approach.

In the meantime, you can:
- Browse our services at https://rag-prompt-library.web.app
- Contact our team directly at /contact
- Ask me a simpler question and I'll do my best to help

What would you like to know about EthosPrompt?""",

        "rate_limit": """I'm getting high traffic right now. Please wait a moment and try again.

While you wait, you can explore:
- Our services overview
- Pricing information
- Customer success stories

I'll be ready to help in just a few seconds!""",

        "timeout": """That request is taking longer than expected. Let me give you some quick information.

EthosPrompt specializes in:
- 24/7 AI Business Assistants (87% faster response times)
- System Integration (600+ app connections)
- Custom Applications (mobile & web)
- Digital Transformation

Would you like details on any of these services?"""
    }

    return fallbacks.get(error_type, fallbacks["llm_error"])


# Pre-configured circuit breakers for different services
watsonx_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    recovery_timeout=60,
    expected_exception=Exception
)

kb_circuit_breaker = CircuitBreaker(
    failure_threshold=3,
    recovery_timeout=30,
    expected_exception=Exception
)
