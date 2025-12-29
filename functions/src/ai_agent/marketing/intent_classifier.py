"""
Intent Classification Helper for Marketing Agent

Lightweight intent classification to improve query understanding
and retrieval targeting. Not a full classifier - just keyword-based
hints to optimize downstream components.
"""
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

# Intent categories with associated keywords
INTENT_KEYWORDS = {
    "greeting": [
        "hi", "hello", "hey", "good morning", "good afternoon",
        "good evening", "greetings", "howdy", "sup", "yo"
    ],
    "pricing": [
        "cost", "price", "pricing", "how much", "quote", "quotation",
        "budget", "investment", "afford", "pay", "expensive", "cheap",
        "fees", "subscription", "monthly", "annual"
    ],
    "services": [
        "services", "offer", "offerings", "solutions", "products",
        "what do you do", "what does ethosprompt", "capabilities"
    ],
    "technical": [
        "security", "api", "integrate", "integration", "technology",
        "stack", "architecture", "infrastructure", "encryption",
        "compliance", "hipaa", "gdpr", "soc 2"
    ],
    "prompt_library": [
        "prompt library", "prompt engine", "prompt management", "prompts",
        "create prompt", "edit prompt", "save prompt", "library"
    ],
    "comparison": [
        "vs", "versus", "compared to", "better than", "difference",
        "salesforce", "hubspot", "zendesk", "intercom", "competitor"
    ],
    "roi": [
        "roi", "return on investment", "savings", "efficiency",
        "payback", "value", "benefit", "results", "metrics"
    ],
    "timeline": [
        "how long", "timeline", "time frame", "when", "duration",
        "implement", "deploy", "launch", "start"
    ],
    "consultation": [
        "consultation", "demo", "meeting", "call", "talk to",
        "speak with", "contact", "schedule", "book"
    ],
    "support": [
        "help", "support", "question", "issue", "problem",
        "faq", "how to", "guide"
    ],
    "off_topic": [
        "weather", "sports", "news", "politics", "entertainment",
        "joke", "poem", "story", "game"
    ],
    "exit_satisfaction": [
        "cheers", "no worries", "too easy", "legend", "beauty", "ta",
        "thanks", "thank you", "got it", "perfect", "that's all",
        "understood", "makes sense", "appreciate it", "all good",
        "that's what i needed", "that helps", "goodbye", "bye", "talk later",
        # BIZ-003 FIX: Additional Australian/common exit phrases
        "all done", "sorted", "that'll do", "sweet as", "you beauty",
        "appreciate that", "cheers mate", "ta mate", "legend mate",
        "that's perfect", "brilliant", "lovely", "great thanks"
    ],
    "confirmation": [
        "yes", "yeah", "yep", "sure", "ok", "okay", "sounds good",
        "no", "nope", "not really", "i'm good"
    ]
}

# Confidence thresholds
HIGH_CONFIDENCE = 0.8
MEDIUM_CONFIDENCE = 0.5
LOW_CONFIDENCE = 0.3


def classify_intent(query: str) -> Tuple[str, float]:
    """
    Classify user query intent using keyword matching.

    Args:
        query: User's input message

    Returns:
        Tuple of (intent_name, confidence_score)
    """
    if not query or not query.strip():
        return ("general", 0.0)

    query_lower = query.lower().strip()
    query_words = set(query_lower.split())

    # Score each intent category
    intent_scores = {}

    for intent, keywords in INTENT_KEYWORDS.items():
        # Count keyword matches
        matches = 0
        for keyword in keywords:
            # For greeting intent, require exact word match to avoid "HIPAA" matching "hi"
            if intent == "greeting":
                if keyword in query_words:
                    matches += 2
            elif keyword in query_lower:
                # Boost for exact word match vs substring
                if keyword in query_words:
                    matches += 2
                else:
                    matches += 1

        if matches > 0:
            # Normalize score (more matches = higher confidence)
            intent_scores[intent] = min(matches * 0.3, 1.0)

    if not intent_scores:
        return ("general", LOW_CONFIDENCE)

    # Get highest scoring intent
    best_intent = max(intent_scores, key=intent_scores.get)
    best_score = intent_scores[best_intent]

    # Special case: very short queries that are greetings
    if len(query_words) <= 2 and best_intent == "greeting":
        best_score = HIGH_CONFIDENCE

    return (best_intent, best_score)


def get_intents(query: str, threshold: float = 0.3) -> List[Tuple[str, float]]:
    """
    Get all detected intents above threshold, sorted by confidence.

    Useful for multi-intent queries like "What services do you offer and how much?"

    Args:
        query: User's input message
        threshold: Minimum confidence to include

    Returns:
        List of (intent_name, confidence_score) tuples, sorted by score descending
    """
    if not query or not query.strip():
        return [("general", 0.0)]

    query_lower = query.lower().strip()
    query_words = set(query_lower.split())

    intent_scores = []

    for intent, keywords in INTENT_KEYWORDS.items():
        matches = 0
        for keyword in keywords:
            if keyword in query_lower:
                if keyword in query_words:
                    matches += 2
                else:
                    matches += 1

        if matches > 0:
            score = min(matches * 0.3, 1.0)
            if score >= threshold:
                intent_scores.append((intent, score))

    if not intent_scores:
        return [("general", LOW_CONFIDENCE)]

    # Sort by score descending
    intent_scores.sort(key=lambda x: x[1], reverse=True)
    return intent_scores


def is_simple_greeting(query: str) -> bool:
    """
    Check if query is a simple greeting that doesn't need KB search.

    Args:
        query: User's input message

    Returns:
        True if this is a simple greeting
    """
    if not query:
        return False

    query_lower = query.lower().strip()
    words = query_lower.split()

    # Very short and matches greeting keywords
    if len(words) <= 3:
        greeting_words = {"hi", "hello", "hey", "greetings", "howdy", "yo"}
        if any(word in greeting_words for word in words):
            return True

    return False


def is_exit_signal(query: str) -> bool:
    """
    Check if query indicates user wants to end conversation.

    Used to detect Australian-style exit phrases like "cheers", "no worries"
    and skip follow-up questions.

    Args:
        query: User's input message

    Returns:
        True if this is an exit/satisfaction signal
    """
    if not query:
        return False

    query_lower = query.lower().strip()

    # DD-004 Fix: Check for negative prefixes that negate exit intent
    # "No, thanks" or "Not yet, thanks" should continue conversation
    negative_prefixes = ["no ", "no,", "not ", "don't ", "can't ", "won't ", "i need ", "but ", "wait ", "actually "]
    if any(query_lower.startswith(prefix) for prefix in negative_prefixes):
        return False

    # Remove punctuation for better matching
    query_clean = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in query_lower)
    query_words = set(query_clean.split())

    # Check for exit_satisfaction intent
    exit_phrases = INTENT_KEYWORDS.get("exit_satisfaction", [])

    # Single word matches - strong signals
    single_word_exits = {"cheers", "thanks", "ta", "bye", "goodbye", "legend", "beauty", "perfect", "understood"}
    if query_words & single_word_exits:
        return True

    # Multi-word phrase matches
    for phrase in exit_phrases:
        if phrase in query_lower or phrase in query_clean:
            return True

    # Also check if message starts with common exit patterns
    exit_starters = ["thanks", "thank you", "cheers", "no worries", "got it", "that's all", "all good"]
    for starter in exit_starters:
        if query_lower.startswith(starter):
            return True

    return False


def get_suggested_category(query: str) -> Optional[str]:
    """
    Suggest a KB category filter based on query intent.

    Maps intents to KB categories for better retrieval targeting.

    Args:
        query: User's input message

    Returns:
        Suggested category or None if general search is better
    """
    intent, confidence = classify_intent(query)

    # Only suggest if we're confident
    if confidence < MEDIUM_CONFIDENCE:
        return None

    # Map intents to KB categories
    intent_to_category = {
        "pricing": "engagement",
        "services": "offerings",
        "technical": "differentiation",
        "roi": "differentiation",
        "support": "support",
        # Don't filter for general intents
        "greeting": None,
        "comparison": None,
        "consultation": None,
        "timeline": None,
        "off_topic": None,
        "general": None
    }

    return intent_to_category.get(intent)
