"""
Retry Logic with Exponential Backoff
Task 1.5: Implement Retry Logic with Exponential Backoff

This module provides retry decorators and utilities for handling transient failures
in API calls and other operations.
"""

import asyncio
import logging
import random
from typing import Callable, Optional, Tuple, Type, Union
from functools import wraps
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class RetryConfig:
    """Configuration for retry behavior"""
    
    def __init__(
        self,
        max_retries: int = 5,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
        retryable_exceptions: Optional[Tuple[Type[Exception], ...]] = None
    ):
        """
        Initialize retry configuration
        
        Args:
            max_retries: Maximum number of retry attempts
            initial_delay: Initial delay in seconds
            max_delay: Maximum delay in seconds
            exponential_base: Base for exponential backoff (2.0 = double each time)
            jitter: Whether to add random jitter to delays
            retryable_exceptions: Tuple of exception types to retry on
        """
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
        self.retryable_exceptions = retryable_exceptions or (Exception,)
    
    def calculate_delay(self, attempt: int) -> float:
        """
        Calculate delay for given attempt number
        
        Args:
            attempt: Current attempt number (0-indexed)
        
        Returns:
            Delay in seconds
        """
        # Exponential backoff: initial_delay * (base ^ attempt)
        delay = min(
            self.initial_delay * (self.exponential_base ** attempt),
            self.max_delay
        )
        
        # Add jitter to prevent thundering herd
        if self.jitter:
            delay = delay * (0.5 + random.random())  # Random between 50% and 150%
        
        return delay


# Default retry configurations for different scenarios

DEFAULT_RETRY_CONFIG = RetryConfig(
    max_retries=5,
    initial_delay=1.0,
    max_delay=60.0,
    exponential_base=2.0,
    jitter=True
)

API_RETRY_CONFIG = RetryConfig(
    max_retries=3,
    initial_delay=2.0,
    max_delay=30.0,
    exponential_base=2.0,
    jitter=True,
    retryable_exceptions=(
        ConnectionError,
        TimeoutError,
        # Add specific API exceptions here
    )
)

NETWORK_RETRY_CONFIG = RetryConfig(
    max_retries=5,
    initial_delay=1.0,
    max_delay=16.0,
    exponential_base=2.0,
    jitter=True,
    retryable_exceptions=(
        ConnectionError,
        TimeoutError,
        OSError,
    )
)


def retry_async(
    config: Optional[RetryConfig] = None,
    on_retry: Optional[Callable[[Exception, int, float], None]] = None
):
    """
    Decorator for async functions with retry logic
    
    Args:
        config: RetryConfig instance (uses DEFAULT_RETRY_CONFIG if None)
        on_retry: Optional callback function called on each retry
                  Signature: (exception, attempt, delay) -> None
    
    Example:
        @retry_async(config=API_RETRY_CONFIG)
        async def call_api():
            # API call code
            pass
    """
    config = config or DEFAULT_RETRY_CONFIG
    
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    # Try to execute the function
                    result = await func(*args, **kwargs)
                    
                    # Log success if this was a retry
                    if attempt > 0:
                        logger.info(
                            f"Function {func.__name__} succeeded on attempt {attempt + 1}"
                        )
                    
                    return result
                
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    # If this was the last attempt, raise the exception
                    if attempt >= config.max_retries:
                        logger.error(
                            f"Function {func.__name__} failed after {config.max_retries + 1} attempts",
                            exc_info=True
                        )
                        raise
                    
                    # Calculate delay for next retry
                    delay = config.calculate_delay(attempt)
                    
                    # Log retry attempt
                    logger.warning(
                        f"Function {func.__name__} failed on attempt {attempt + 1}, "
                        f"retrying in {delay:.2f}s. Error: {str(e)}"
                    )
                    
                    # Call on_retry callback if provided
                    if on_retry:
                        try:
                            on_retry(e, attempt, delay)
                        except Exception as callback_error:
                            logger.error(
                                f"Error in on_retry callback: {str(callback_error)}"
                            )
                    
                    # Wait before retrying
                    await asyncio.sleep(delay)
            
            # This should never be reached, but just in case
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator


def retry_sync(
    config: Optional[RetryConfig] = None,
    on_retry: Optional[Callable[[Exception, int, float], None]] = None
):
    """
    Decorator for synchronous functions with retry logic
    
    Args:
        config: RetryConfig instance (uses DEFAULT_RETRY_CONFIG if None)
        on_retry: Optional callback function called on each retry
    
    Example:
        @retry_sync(config=NETWORK_RETRY_CONFIG)
        def make_request():
            # Request code
            pass
    """
    config = config or DEFAULT_RETRY_CONFIG
    
    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    result = func(*args, **kwargs)
                    
                    if attempt > 0:
                        logger.info(
                            f"Function {func.__name__} succeeded on attempt {attempt + 1}"
                        )
                    
                    return result
                
                except config.retryable_exceptions as e:
                    last_exception = e
                    
                    if attempt >= config.max_retries:
                        logger.error(
                            f"Function {func.__name__} failed after {config.max_retries + 1} attempts",
                            exc_info=True
                        )
                        raise
                    
                    delay = config.calculate_delay(attempt)
                    
                    logger.warning(
                        f"Function {func.__name__} failed on attempt {attempt + 1}, "
                        f"retrying in {delay:.2f}s. Error: {str(e)}"
                    )
                    
                    if on_retry:
                        try:
                            on_retry(e, attempt, delay)
                        except Exception as callback_error:
                            logger.error(
                                f"Error in on_retry callback: {str(callback_error)}"
                            )
                    
                    import time
                    time.sleep(delay)
            
            if last_exception:
                raise last_exception
        
        return wrapper
    return decorator


async def retry_with_timeout(
    func: Callable,
    timeout_seconds: float,
    retry_config: Optional[RetryConfig] = None,
    *args,
    **kwargs
):
    """
    Execute an async function with both retry logic and timeout
    
    Args:
        func: Async function to execute
        timeout_seconds: Timeout in seconds
        retry_config: RetryConfig instance
        *args, **kwargs: Arguments to pass to func
    
    Returns:
        Result of func
    
    Raises:
        asyncio.TimeoutError: If execution exceeds timeout
        Exception: If all retries fail
    
    Example:
        result = await retry_with_timeout(
            call_api,
            timeout_seconds=30,
            retry_config=API_RETRY_CONFIG,
            api_key="...",
            prompt="..."
        )
    """
    retry_config = retry_config or DEFAULT_RETRY_CONFIG
    
    @retry_async(config=retry_config)
    async def wrapped():
        return await asyncio.wait_for(
            func(*args, **kwargs),
            timeout=timeout_seconds
        )
    
    return await wrapped()


class RetryStats:
    """Track retry statistics for monitoring"""
    
    def __init__(self):
        self.total_attempts = 0
        self.successful_attempts = 0
        self.failed_attempts = 0
        self.retry_counts = {}  # function_name -> retry_count
        self.last_errors = {}   # function_name -> last_error
    
    def record_attempt(self, function_name: str, attempt: int, success: bool, error: Optional[Exception] = None):
        """Record a retry attempt"""
        self.total_attempts += 1
        
        if success:
            self.successful_attempts += 1
        else:
            self.failed_attempts += 1
        
        if function_name not in self.retry_counts:
            self.retry_counts[function_name] = []
        
        self.retry_counts[function_name].append(attempt)
        
        if error:
            self.last_errors[function_name] = {
                "error": str(error),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def get_stats(self) -> dict:
        """Get retry statistics"""
        return {
            "total_attempts": self.total_attempts,
            "successful_attempts": self.successful_attempts,
            "failed_attempts": self.failed_attempts,
            "success_rate": self.successful_attempts / self.total_attempts if self.total_attempts > 0 else 0,
            "retry_counts": {
                func: {
                    "total": len(counts),
                    "average": sum(counts) / len(counts) if counts else 0,
                    "max": max(counts) if counts else 0
                }
                for func, counts in self.retry_counts.items()
            },
            "last_errors": self.last_errors
        }


# Global retry stats instance
retry_stats = RetryStats()

