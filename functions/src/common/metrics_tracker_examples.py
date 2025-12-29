"""
Example: Using Advanced Metrics Tracker in Marketing Agent

Demonstrates how to integrate the metrics tracker for detailed
performance monitoring and analysis.
"""

from src.common.metrics_tracker import MetricsTracker, TrackRequest
import time
import asyncio


# ============================================================================
# Example 1: Basic Metrics Tracking
# ============================================================================

async def example_basic_tracking():
    """Basic metrics tracking"""
    tracker = MetricsTracker(agent_type="marketing")

    # Track LLM latency
    start = time.time()
    # ... LLM call ...
    duration_ms = int((time.time() - start) * 1000)
    tracker.track_llm_latency(duration_ms, model="granite-4-0-h-small")

    # Track KB retrieval
    start = time.time()
    # ... KB retrieval ...
    duration_ms = int((time.time() - start) * 1000)
    tracker.track_kb_retrieval_latency(duration_ms, category="services")

    # Track validation
    tracker.track_validation_success("input")

    # Track response quality
    response = "This is a sample response from the agent."
    tracker.track_response_quality(
        response_text=response,
        token_count=50,
        sources_cited=2,
        tool_calls=1,
        fallback_used=False
    )

    # Get summary
    summary = tracker.get_request_summary()
    print(f"Request Summary: {summary}")


# ============================================================================
# Example 2: Using Context Manager
# ============================================================================

async def example_context_manager():
    """Use context manager for automatic tracking"""
    tracker = MetricsTracker()

    with TrackRequest(tracker, conversation_id="conv-123") as t:
        # Track LLM call
        t.track_llm_latency(1500, "granite")

        # Track KB retrieval
        t.track_kb_retrieval_latency(200, "pricing")

        # Track validation
        t.track_validation_success("message_length")

        # Track response
        t.track_response_quality(
            response_text="Sample response",
            token_count=100,
            sources_cited=3
        )

    # Summary automatically logged on exit


# ============================================================================
# Example 3: Validation Error Tracking
# ============================================================================

async def example_validation_tracking():
    """Track validation errors"""
    tracker = MetricsTracker()

    # Track validation error
    tracker.track_validation_error(
        validation_type="message_length",
        field="message",
        error_message="Message too long (>5000 chars)"
    )

    # Track validation error
    tracker.track_validation_error(
        validation_type="required_field",
        field="conversation_id",
        error_message="Missing required field: conversation_id"
    )

    # Track successful validation
    tracker.track_validation_success("email_format")

    # Get validation summary
    summary = tracker.get_request_summary()
    print(f"Validation Metrics: {summary['validation']}")


# ============================================================================
# Example 4: Cache Performance Tracking
# ============================================================================

async def example_cache_tracking():
    """Track cache performance"""
    tracker = MetricsTracker()

    # Simulate cache lookup
    cache_key = "response:conv-123:msg-456"
    cached_response = None  # Simulate cache miss

    if cached_response:
        tracker.track_cache_hit("response")
        return cached_response
    else:
        tracker.track_cache_miss("response")
        # Generate new response
        response = "New response"
        # Cache it
        return response


# ============================================================================
# Example 5: Conversation Engagement Tracking
# ============================================================================

async def example_engagement_tracking():
    """Track user engagement"""
    tracker = MetricsTracker()

    conversation_id = "conv-789"

    # Track each turn
    for turn in range(1, 6):
        tracker.track_conversation_turn(conversation_id, turn)
        # ... process message ...


# ============================================================================
# Example 6: Integrated Marketing Agent with Metrics
# ============================================================================

class MarketingAgentWithMetrics:
    """Marketing Agent with comprehensive metrics tracking"""

    def __init__(self):
        self.metrics = MetricsTracker(agent_type="marketing")

    async def chat(
        self,
        message: str,
        conversation_id: str,
        turn_number: int = 1
    ) -> str:
        """
        Chat with comprehensive metrics tracking
        """
        with TrackRequest(self.metrics, conversation_id) as tracker:
            # Track conversation turn
            tracker.track_conversation_turn(conversation_id, turn_number)

            # Validate input
            validation_start = time.time()
            if not self._validate_message(message, tracker):
                return "Invalid message"
            validation_ms = int((time.time() - validation_start) * 1000)
            tracker.track_validation_latency(validation_ms)

            # Check cache
            cached = self._check_cache(message, tracker)
            if cached:
                return cached

            # Retrieve from KB
            kb_start = time.time()
            kb_results = await self._retrieve_kb(message, tracker)
            kb_ms = int((time.time() - kb_start) * 1000)
            tracker.track_kb_retrieval_latency(kb_ms, "general")

            # Call LLM
            llm_start = time.time()
            response = await self._call_llm(message, kb_results, tracker)
            llm_ms = int((time.time() - llm_start) * 1000)
            tracker.track_llm_latency(llm_ms, "granite-4-0-h-small")

            # Track response quality
            tracker.track_response_quality(
                response_text=response,
                token_count=len(response.split()),  # Approximate
                sources_cited=len(kb_results),
                tool_calls=0,
                fallback_used=False
            )

            return response

    def _validate_message(self, message: str, tracker: MetricsTracker) -> bool:
        """Validate message with metrics"""
        # Check length
        if len(message) > 5000:
            tracker.track_validation_error(
                validation_type="message_length",
                field="message",
                error_message="Message too long"
            )
            return False

        # Check not empty
        if not message.strip():
            tracker.track_validation_error(
                validation_type="required_field",
                field="message",
                error_message="Message is empty"
            )
            return False

        tracker.track_validation_success("message")
        return True

    def _check_cache(self, message: str, tracker: MetricsTracker) -> Optional[str]:
        """Check cache with metrics"""
        # Simulate cache lookup
        cached = None

        if cached:
            tracker.track_cache_hit("response")
            return cached
        else:
            tracker.track_cache_miss("response")
            return None

    async def _retrieve_kb(
        self,
        message: str,
        tracker: MetricsTracker
    ) -> list:
        """Retrieve from KB"""
        # Simulate KB retrieval
        await asyncio.sleep(0.2)
        return [{"content": "Sample KB content"}]

    async def _call_llm(
        self,
        message: str,
        context: list,
        tracker: MetricsTracker
    ) -> str:
        """Call LLM"""
        # Simulate LLM call
        await asyncio.sleep(1.5)
        return "Sample LLM response"


# ============================================================================
# Example 7: Metrics Analysis
# ============================================================================

def analyze_metrics(tracker: MetricsTracker):
    """Analyze collected metrics"""
    summary = tracker.get_request_summary()

    # Latency analysis
    latency = summary['latency']
    print(f"Total latency: {latency['total_ms']}ms")
    print(f"  LLM: {latency['llm_ms']}ms ({latency['llm_ms']/latency['total_ms']*100:.1f}%)")
    print(f"  KB: {latency['kb_retrieval_ms']}ms ({latency['kb_retrieval_ms']/latency['total_ms']*100:.1f}%)")
    print(f"  Tools: {latency['tool_execution_ms']}ms")
    print(f"  Validation: {latency['validation_ms']}ms")

    # Validation analysis
    validation = summary['validation']
    if validation['total_validations'] > 0:
        error_rate = validation['validation_errors'] / validation['total_validations'] * 100
        print(f"\nValidation error rate: {error_rate:.1f}%")
        print(f"Error types: {validation['error_types']}")

    # Quality analysis
    quality = summary['quality']
    print(f"\nResponse quality:")
    print(f"  Length: {quality['response_length_chars']} chars")
    print(f"  Sources cited: {quality['sources_cited']}")
    print(f"  Tool calls: {quality['tool_calls_made']}")
    print(f"  Fallback used: {quality['fallback_used']}")


# ============================================================================
# Usage Summary
# ============================================================================

"""
METRICS TRACKING PATTERNS:

1. Latency Tracking:
   - LLM calls: track_llm_latency(duration_ms, model)
   - KB retrieval: track_kb_retrieval_latency(duration_ms, category)
   - Tools: track_tool_latency(tool_name, duration_ms)
   - Validation: track_validation_latency(duration_ms)

2. Validation Tracking:
   - Errors: track_validation_error(type, field, message)
   - Success: track_validation_success(type)

3. Quality Tracking:
   - Response: track_response_quality(text, tokens, sources, tools, fallback)

4. Engagement Tracking:
   - Turns: track_conversation_turn(conversation_id, turn_number)

5. Cache Tracking:
   - Hits: track_cache_hit(cache_type)
   - Misses: track_cache_miss(cache_type)

BEST PRACTICES:
- Use context manager (TrackRequest) for automatic summary
- Track all major operations (LLM, KB, tools)
- Always track validation results
- Monitor cache performance
- Analyze metrics to identify bottlenecks
"""
