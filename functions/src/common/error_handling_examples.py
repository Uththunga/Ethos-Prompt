"""
Example: Integrating Error Handling into Marketing Agent

This demonstrates how to use the error handling module with
circuit breakers, retry logic, and graceful degradation.
"""

from src.common.error_handling import (
    with_circuit_breaker,
    with_retry,
    with_fallback,
    get_error_handler,
    CircuitBreakerConfig,
    RetryConfig,
    LLMError,
    RetrievalError
)
import asyncio


# ============================================================================
# Example 1: Circuit Breaker for LLM Calls
# ============================================================================

@with_circuit_breaker(
    "llm_api",
    CircuitBreakerConfig(
        failure_threshold=5,    # Open after 5 failures
        success_threshold=2,    # Close after 2 successes
        timeout=60              # Try again after 60 seconds
    )
)
async def call_llm(prompt: str) -> str:
    """Call LLM with circuit breaker protection"""
    # Actual LLM call here
    # If this fails repeatedly, circuit breaker will open
    # and reject requests until timeout expires
    pass


# ============================================================================
# Example 2: Retry Logic for KB Retrieval
# ============================================================================

@with_retry(
    RetryConfig(
        max_attempts=3,
        initial_delay=1.0,
        max_delay=10.0,
        exponential_base=2.0,
        jitter=True
    )
)
async def retrieve_from_kb(query: str) -> list:
    """Retrieve from KB with retry logic"""
    # Transient failures (network issues, etc.) will be retried
    # with exponential backoff
    pass


# ============================================================================
# Example 3: Fallback for Graceful Degradation
# ============================================================================

async def fallback_response() -> str:
    """Fallback response when main function fails"""
    return """I'm having trouble accessing my full knowledge base right now,
but I can still help! Here's what I know about EthosPrompt:

EthosPrompt is an AI-powered platform for intelligent business automation.
We offer:
- Smart Business Assistance
- System Integration
- Intelligent Applications

For detailed information, I'd recommend scheduling a consultation with our team."""


@with_fallback(fallback_response)
async def search_kb_with_fallback(query: str) -> str:
    """Search KB with fallback to generic response"""
    # If this fails, fallback_response() will be called
    results = await retrieve_from_kb(query)
    return format_results(results)


# ============================================================================
# Example 4: Combined Error Handling
# ============================================================================

@with_circuit_breaker("llm_api")
@with_retry(RetryConfig(max_attempts=2))
@with_fallback(lambda: "I'm having trouble right now. Please try again.")
async def robust_llm_call(prompt: str) -> str:
    """
    LLM call with:
    1. Circuit breaker (prevents cascading failures)
    2. Retry logic (handles transient errors)
    3. Fallback (graceful degradation)
    """
    # Call LLM
    pass


# ============================================================================
# Example 5: Refactored Marketing Agent with Error Handling
# ============================================================================

class MarketingAgentWithErrorHandling:
    """Marketing Agent with comprehensive error handling"""

    def __init__(self, db=None):
        self.db = db
        self.error_handler = get_error_handler()

        # Get circuit breakers for different services
        self.llm_breaker = self.error_handler.get_circuit_breaker(
            "llm_api",
            CircuitBreakerConfig(failure_threshold=5, timeout=60)
        )

        self.kb_breaker = self.error_handler.get_circuit_breaker(
            "kb_retrieval",
            CircuitBreakerConfig(failure_threshold=3, timeout=30)
        )

        # Get retry handlers
        self.llm_retry = self.error_handler.get_retry_handler(
            "llm",
            RetryConfig(max_attempts=3, initial_delay=1.0)
        )

        self.kb_retry = self.error_handler.get_retry_handler(
            "kb",
            RetryConfig(max_attempts=2, initial_delay=0.5)
        )

    async def chat(self, message: str, context: dict = None) -> str:
        """
        Chat with comprehensive error handling
        """
        try:
            # Step 1: Retrieve from KB (with circuit breaker + retry)
            try:
                kb_results = await self.kb_breaker.call_async(
                    self.kb_retry.execute_async,
                    self._retrieve_kb,
                    message
                )
            except Exception as e:
                # KB retrieval failed, continue without context
                logger.warning(f"KB retrieval failed: {e}")
                kb_results = []

            # Step 2: Call LLM (with circuit breaker + retry + fallback)
            try:
                response = await self.llm_breaker.call_async(
                    self.llm_retry.execute_async,
                    self._call_llm,
                    message,
                    kb_results
                )
                return response
            except Exception as e:
                # LLM failed, use fallback
                logger.error(f"LLM call failed: {e}")
                return self._get_fallback_response(message)

        except Exception as e:
            # Catch-all error handling
            error_message = self.error_handler.handle_error(
                e,
                context={"operation": "chat", "message": message}
            )
            return error_message

    async def _retrieve_kb(self, query: str) -> list:
        """Retrieve from knowledge base"""
        # Actual retrieval logic
        # May raise RetrievalError
        pass

    async def _call_llm(self, message: str, context: list) -> str:
        """Call LLM"""
        # Actual LLM call
        # May raise LLMError
        pass

    def _get_fallback_response(self, message: str) -> str:
        """Get fallback response when LLM fails"""
        return """I'm experiencing technical difficulties right now.
However, I'd be happy to help! Here are some ways to get assistance:

1. **Schedule a Consultation**: Our team can provide personalized guidance
2. **Visit our Website**: Explore our services and solutions
3. **Try Again**: The issue may be temporary

Is there something specific I can help you with?"""


# ============================================================================
# Example 6: Error Handling in Tools
# ============================================================================

class MarketingTools:
    """Marketing tools with error handling"""

    def __init__(self):
        self.error_handler = get_error_handler()

    @with_circuit_breaker("kb_search")
    @with_retry(RetryConfig(max_attempts=2))
    async def search_kb(self, query: str, category: Optional[str] = None) -> str:
        """Search KB with error handling"""
        try:
            # Actual search logic
            results = await self._do_search(query, category)

            if not results:
                # No results, provide helpful fallback
                return self._get_no_results_message(query)

            return self._format_results(results)

        except Exception as e:
            # Handle error gracefully
            return self.error_handler.handle_error(
                e,
                context={"tool": "search_kb", "query": query}
            )

    async def _do_search(self, query: str, category: Optional[str] = None) -> list:
        """Actual search implementation"""
        # May raise RetrievalError
        pass

    def _get_no_results_message(self, query: str) -> str:
        """Fallback message when no results found"""
        return f"""I don't have specific information about "{query}" in my knowledge base.

However, I can help you with:
- Company overview and mission
- Services and solutions
- Pricing information
- Getting started guides

Would you like to know about any of these topics?"""

    def _format_results(self, results: list) -> str:
        """Format search results"""
        # Format logic
        pass


# ============================================================================
# Example 7: Monitoring Circuit Breaker State
# ============================================================================

def monitor_circuit_breakers():
    """Monitor circuit breaker states for alerting"""
    error_handler = get_error_handler()

    for name, breaker in error_handler.circuit_breakers.items():
        if breaker.state.value == "open":
            logger.critical(
                f"Circuit breaker '{name}' is OPEN! "
                f"Failures: {breaker.failure_count}, "
                f"Last failure: {breaker.last_failure_time}"
            )
            # Send alert to monitoring system
        elif breaker.state.value == "half_open":
            logger.warning(f"Circuit breaker '{name}' is HALF_OPEN (testing recovery)")


# ============================================================================
# Usage Summary
# ============================================================================

"""
ERROR HANDLING PATTERNS:

1. Circuit Breaker (Prevent Cascading Failures):
   - Use for external API calls (LLM, KB)
   - Opens after N failures
   - Prevents overwhelming failing services
   - Auto-recovers after timeout

2. Retry Logic (Handle Transient Errors):
   - Use for network requests
   - Exponential backoff with jitter
   - Configurable max attempts
   - Prevents thundering herd

3. Fallback (Graceful Degradation):
   - Always provide fallback response
   - Never show raw errors to users
   - Maintain service availability
   - Degrade gracefully

4. Error Handler (Centralized):
   - User-friendly error messages
   - Logging and monitoring
   - Context-aware responses
   - Severity-based handling

BEST PRACTICES:
- Combine patterns (circuit breaker + retry + fallback)
- Monitor circuit breaker states
- Log all errors with context
- Test error scenarios
- Provide helpful fallback messages
"""

