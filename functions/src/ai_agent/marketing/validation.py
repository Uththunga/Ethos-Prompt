"""
Marketing Agent Response Validation
Validates agent responses meet quality standards

Recommendation #13: Response Validation
- Checks word count (target: 100-150 words)
- Validates follow-up questions presence (3 required)
- Detects technical error message leakage
- Expected: 30-40% reduction in malformed responses
"""

import logging
import re
from typing import Dict, List, Optional, TypedDict

logger = logging.getLogger(__name__)


class ValidatedResponse(TypedDict):
    """Validated response structure"""
    response: str
    follow_up_questions: List[str]
    validation_passed: bool
    validation_errors: List[str]
    word_count: int


def extract_follow_up_questions(response_text: str) -> List[str]:
    """
    Extract follow-up questions from response.

    Args:
        response_text: Agent response text

    Returns:
        List of follow-up questions
    """
    questions = []

    # Look for "You might also want to know:" section
    if "You might also want to know:" in response_text:
        # Split at the marker
        parts = response_text.split("You might also want to know:")
        if len(parts) > 1:
            questions_section = parts[1]
            # Split into lines and extract questions
            lines = questions_section.strip().split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                # Remove common prefixes: "1. " "2. " "- " etc.
                for prefix in ['1. ', '2. ', '3. ', '1) ', '2) ', '3) ', '- ', '• ', '* ']:
                    if line.startswith(prefix):
                        line = line[len(prefix):]
                        break
                # Remove digit-dot pattern at start
                line = re.sub(r'^\d+\.?\s*', '', line)

                if line:
                    questions.append(line)

    return questions[:3]  # Return max 3


def validate_marketing_response(response_text: str, min_words: int = 50, max_words: int = 200, required_questions: int = 0) -> ValidatedResponse:
    """
    Validate agent response meets quality standards.

    Args:
        response_text: Agent response text
        min_words: Minimum word count (default: 50)
        max_words: Maximum word count (default: 200)
        required_questions: Required number of follow-up questions (default: 0 - optional)

    Returns:
        ValidatedResponse with validation results
    """
    errors = []

    # Check word count (target: 100-150 words, but allow 50-200 range)
    word_count = len(response_text.split())

    if word_count > max_words:
        errors.append(f"Response too long ({word_count} words, target: 100-150, max: {max_words})")
    elif word_count < min_words:
        errors.append(f"Response too short ({word_count} words, target: 100-150, min: {min_words})")

    # Check for follow-up questions (only if required)
    if required_questions > 0:
        if "You might also want to know:" not in response_text and "follow" not in response_text.lower():
            errors.append("Missing follow-up questions section")

    # Extract follow-up questions
    follow_ups = extract_follow_up_questions(response_text)

    if required_questions > 0 and len(follow_ups) < required_questions:
        errors.append(f"Only {len(follow_ups)} follow-up questions (need {required_questions})")

    # Check for error messages leaked to users
    error_phrases = [
        "error retrieving",
        "technical issue",
        "unable to retrieve",
        "exception occurred",
        "traceback",
        "internal server error",
        "failed to",
        "something went wrong"
    ]

    if any(phrase in response_text.lower() for phrase in error_phrases):
        errors.append("Response contains technical error messages")

    # Check for empty or too generic responses
    if word_count < 10:
        errors.append("Response is essentially empty")

    # Log validation results
    if errors:
        logger.warning(f"Response validation failed: {errors} (word_count={word_count}, questions={len(follow_ups)})")
    else:
        logger.debug(f"Response validation passed (word_count={word_count}, questions={len(follow_ups)})")

    return {
        "response": response_text,
        "follow_up_questions": follow_ups,
        "validation_passed": len(errors) == 0,
        "validation_errors": errors,
        "word_count": word_count
    }


def get_corrective_prompt(validation_errors: List[str]) -> str:
    """
    Generate corrective prompt based on validation errors.

    Args:
        validation_errors: List of validation error messages

    Returns:
        Corrective prompt to append to regeneration
    """
    corrections = []

    for error in validation_errors:
        if "too long" in error:
            corrections.append("Make your response more concise (100-150 words).")
        elif "too short" in error:
            corrections.append("Provide a more complete response (100-150 words).")
        elif "follow-up questions" in error:
            corrections.append("Add exactly 3 follow-up questions with prefix 'You might also want to know:'")
        elif "error messages" in error:
            corrections.append("Remove technical error messages. Use friendly language.")

    if corrections:
        return "\n\nPLEASE FIX: " + " ".join(corrections)
    return ""
