"""
Unit tests for PII Detection
"""

import pytest
from src.ai_agent.security.pii_detector import (
    PIIDetector,
    detect_pii_in_text,
    redact_pii_from_text
)


class TestPIIDetection:
    """Test PII detection functionality"""

    def setup_method(self):
        """Set up test fixtures"""
        self.detector = PIIDetector()

    def test_email_detection(self):
        """Test email address detection"""
        text = "Contact me at john.doe@example.com for more info"

        entities = self.detector.detect_pii(text)

        if self.detector.enabled:
            assert len(entities) > 0
            assert any(e['entity_type'] == 'EMAIL_ADDRESS' for e in entities)
            assert any('john.doe@example.com' in e['text'] for e in entities)
        else:
            pytest.skip("Presidio not available")

    def test_phone_detection(self):
        """Test phone number detection"""
        text = "Call me at (555) 123-4567"

        entities = self.detector.detect_pii(text)

        if self.detector.enabled:
            assert len(entities) > 0
            assert any(e['entity_type'] == 'PHONE_NUMBER' for e in entities)
        else:
            pytest.skip("Presidio not available")

    def test_ssn_detection(self):
        """Test SSN detection"""
        text = "My SSN is 123-45-6789"

        entities = self.detector.detect_pii(text)

        if self.detector.enabled:
            assert len(entities) > 0
            assert any(e['entity_type'] == 'US_SSN' for e in entities)
        else:
            pytest.skip("Presidio not available")

    def test_redaction(self):
        """Test PII redaction"""
        text = "Email: test@example.com, Phone: 555-1234"

        redacted = self.detector.redact_pii(text)

        if self.detector.enabled:
            assert "test@example.com" not in redacted
            assert "[REDACTED]" in redacted
        else:
            # Without Presidio, should return original
            assert redacted == text

    def test_custom_replacement(self):
        """Test custom replacement string"""
        text = "Contact: john@doe.com"

        redacted = self.detector.redact_pii(text, replacement="***")

        if self.detector.enabled:
            assert "john@doe.com" not in redacted
            assert "***" in redacted
        else:
            pytest.skip("Presidio not available")

    def test_no_pii(self):
        """Test text without PII returns unchanged"""
        text = "This is a normal message without any sensitive data."

        entities = self.detector.detect_pii(text)
        redacted = self.detector.redact_pii(text)

        if self.detector.enabled:
            assert len(entities) == 0
            assert redacted == text
        else:
            assert redacted == text

    def test_dict_redaction(self):
        """Test dictionary value redaction"""
        data = {
            "message": "My email is test@example.com",
            "user_id": "12345",
            "timestamp": "2025-11-27"
        }

        redacted_data = self.detector.redact_dict(data, keys_to_redact=["message"])

        if self.detector.enabled:
            assert "test@example.com" not in redacted_data["message"]
            assert redacted_data["user_id"] == data["user_id"]  # Unchanged
        else:
            assert redacted_data == data

    def test_convenience_functions(self):
        """Test convenience detection and redaction functions"""
        text = "Email me at support@company.com"

        # Test detection
        entities = detect_pii_in_text(text)

        # Test redaction
        redacted = redact_pii_from_text(text)

        if PIIDetector().enabled:
            assert isinstance(entities, list)
            assert isinstance(redacted, str)
            assert "support@company.com" not in redacted
        else:
            pytest.skip("Presidio not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
