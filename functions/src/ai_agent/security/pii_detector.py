"""
PII Detection and Redaction Service (Enhanced for Fail-Closed Mode)
Uses Microsoft Presidio for automatic sensitive data detection
"""
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Try to import Presidio, but don't fail if not installed
try:
    from presidio_analyzer import AnalyzerEngine
    from presidio_anonymizer import AnonymizerEngine
    PRESIDIO_AVAILABLE = True
except ImportError:
    logger.warning("Presidio not installed. PII detection will be disabled. Install with: pip install presidio-analyzer presidio-anonymizer")
    PRESIDIO_AVAILABLE = False


class PIIDetector:
    """
    Detect and redact PII (Personally Identifiable Information) from text.

    Detects:
    - Email addresses
    - Phone numbers
    - Social Security Numbers
    - Credit card numbers
    - Person names
    - IP addresses
    """

    # PII entity types to detect
    DEFAULT_ENTITIES = [
        "EMAIL_ADDRESS",
        "PHONE_NUMBER",
        "US_SSN",
        "CREDIT_CARD",
        "PERSON",
        "IP_ADDRESS",
        "US_DRIVER_LICENSE"
    ]

    def __init__(self, entities: Optional[List[str]] = None, enforce_protection: Optional[bool] = None):
        """
        Initialize PII detector.

        Args:
            entities: List of entity types to detect (uses DEFAULT_ENTITIES if None)
            enforce_protection: If True, raise error if Presidio is unavailable (fail-closed)
        """
        self.entities = entities or self.DEFAULT_ENTITIES

        # Check environment variable for enforcement
        if enforce_protection is None:
            enforce_protection = os.getenv("ENFORCE_PII_PROTECTION", "false").lower() == "true"

        self.enforce_protection = enforce_protection
        self.enabled = PRESIDIO_AVAILABLE

        if self.enabled:
            try:
                self.analyzer = AnalyzerEngine()
                self.anonymizer = AnonymizerEngine()
                logger.info(f"✓ PII detection enabled for: {', '.join(self.entities)}")
            except Exception as e:
                logger.error(f"Failed to initialize Presidio: {e}")
                self.enabled = False
                if self.enforce_protection:
                    raise RuntimeError(f"PII protection is enforced but Presidio failed to initialize: {e}")
        else:
            if self.enforce_protection:
                raise RuntimeError(
                    "PII protection is enforced (ENFORCE_PII_PROTECTION=true) but Presidio is not available. "
                    "Install with: pip install presidio-analyzer presidio-anonymizer"
                )
            logger.warning("⚠️ PII detection disabled (Presidio not available)")
            self.analyzer = None
            self.anonymizer = None

    def detect_pii(self, text: str, language: str = "en") -> List[Dict[str, Any]]:
        """
        Detect PII entities in text.

        Args:
            text: Text to analyze
            language: Language code (default: "en")

        Returns:
            List of detected PII entities with type, start, end, score
        """
        if not self.enabled or not text:
            return []

        try:
            results = self.analyzer.analyze(
                text=text,
                entities=self.entities,
                language=language
            )

            # Convert to dict format
            pii_entities = [
                {
                    "entity_type": result.entity_type,
                    "start": result.start,
                    "end": result.end,
                    "score": result.score,
                    "text": text[result.start:result.end]
                }
                for result in results
            ]

            if pii_entities:
                logger.debug(f"Detected {len(pii_entities)} PII entities in text")

            return pii_entities

        except Exception as e:
            logger.error(f"Error detecting PII: {e}")
            return []

    def redact_pii(
        self,
        text: str,
        replacement: str = "[REDACTED]",
        language: str = "en"
    ) -> str:
        """
        Redact PII from text.

        Args:
            text: Text to redact
            replacement: Replacement string (default: "[REDACTED]")
            language: Language code (default: "en")

        Returns:
            Redacted text
        """
        if not self.enabled or not text:
            return text

        try:
            # Detect PII
            analyzer_results = self.analyzer.analyze(
                text=text,
                entities=self.entities,
                language=language
            )

            if not analyzer_results:
                return text  # No PII found

            # Anonymize/redact
            anonymized_result = self.anonymizer.anonymize(
                text=text,
                analyzer_results=analyzer_results,
                operators={"DEFAULT": lambda x: replacement}  # Replace all with same string
            )

            redacted_text = anonymized_result.text

            if redacted_text != text:
                logger.info(f"Redacted {len(analyzer_results)} PII entities from text")

            return redacted_text

        except Exception as e:
            logger.error(f"Error redacting PII: {e}")
            return text  # Return original on error (safer than breaking flow)

    def redact_dict(
        self,
        data: Dict[str, Any],
        keys_to_redact: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Redact PII from dictionary values.

        Args:
            data: Dictionary to redact
            keys_to_redact: Specific keys to redact (all string values if None)

        Returns:
            Redacted dictionary (new copy)
        """
        if not self.enabled:
            return data

        redacted = data.copy()

        keys = keys_to_redact or [
            k for k, v in data.items()
            if isinstance(v, str)
        ]

        for key in keys:
            if key in redacted and isinstance(redacted[key], str):
                redacted[key] = self.redact_pii(redacted[key])

        return redacted


# Singleton instance for reuse
_pii_detector_instance: Optional[PIIDetector] = None


def get_pii_detector(enforce_protection: Optional[bool] = None) -> PIIDetector:
    """
    Get or create global PII detector instance.

    Args:
        enforce_protection: If True, enforce fail-closed mode

    Returns:
        PIIDetector instance
    """
    global _pii_detector_instance

    if _pii_detector_instance is None:
        _pii_detector_instance = PIIDetector(enforce_protection=enforce_protection)

    return _pii_detector_instance


# Convenience functions
def detect_pii_in_text(text: str) -> List[Dict[str, Any]]:
    """
    Convenience function to detect PII.

    Args:
        text: Text to analyze

    Returns:
        List of PII entities
    """
    detector = get_pii_detector()
    return detector.detect_pii(text)


def redact_pii_from_text(text: str, replacement: str = "[REDACTED]") -> str:
    """
    Convenience function to redact PII.

    Args:
        text: Text to redact
        replacement: Replacement string

    Returns:
        Redacted text
    """
    detector = get_pii_detector()
    return detector.redact_pii(text, replacement)


# Logging wrapper for safe logging
def log_safe(
    logger_instance: logging.Logger,
    level: str,
    message: str,
    **kwargs
):
    """
    Log message with automatic PII redaction.

    Args:
        logger_instance: Logger to use
        level: Log level ("INFO", "WARNING", etc.)
        message: Message to log
        **kwargs: Additional log arguments
    """
    redacted_message = redact_pii_from_text(message)

    log_method = getattr(logger_instance, level.lower(), logger_instance.info)
    log_method(redacted_message, **kwargs)


def contains_pii_patterns(text: str, threshold: float = 0.5) -> bool:
    """
    Check if text contains PII patterns (fast check without redaction).

    Args:
        text: Text to check
        threshold: Confidence threshold for PII detection (0.0-1.0)

    Returns:
        True if PII detected above threshold, False otherwise
    """
    detector = get_pii_detector()

    if not detector.enabled:
        return False

    try:
        pii_entities = detector.detect_pii(text)

        # Check if any entity is above threshold
        for entity in pii_entities:
            if entity.get('score', 0.0) >= threshold:
                logger.debug(f"PII detected: {entity['entity_type']} (score: {entity['score']:.2f})")
                return True

        return False
    except Exception as e:
        logger.error(f"Error checking for PII patterns: {e}")
        # Fail safe: if check fails, assume PII present
        return True

