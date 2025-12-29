"""
Unit tests for error handling module
"""
import pytest
from src.error_handling import (
    AppError, ValidationError, APIError, TimeoutError,
    RAGError, ErrorCategory, ErrorSeverity,
    handle_error, log_error
)


class TestErrorClasses:
    """Test error class hierarchy"""

    def test_app_error_creation(self):
        """Test AppError creation"""
        error = AppError(
            message="Test error",
            category=ErrorCategory.VALIDATION_ERROR,
            severity=ErrorSeverity.MEDIUM
        )

        assert error.message == "Test error"
        assert error.category == ErrorCategory.VALIDATION_ERROR
        assert error.severity == ErrorSeverity.MEDIUM
        assert error.user_message is not None

    def test_validation_error(self):
        """Test ValidationError"""
        error = ValidationError("Invalid input", field="email")

        assert error.category == ErrorCategory.VALIDATION_ERROR
        assert error.severity == ErrorSeverity.LOW
        assert error.details["field"] == "email"
        assert "invalid" in error.user_message.lower()

    def test_api_error(self):
        """Test APIError"""
        error = APIError("API failed", status_code=500)

        assert error.category == ErrorCategory.API_ERROR
        assert error.severity == ErrorSeverity.HIGH
        assert error.details["status_code"] == 500

    def test_timeout_error(self):
        """Test TimeoutError"""
        error = TimeoutError("Request timed out", timeout_seconds=60)

        assert error.category == ErrorCategory.TIMEOUT_ERROR
        assert error.severity == ErrorSeverity.MEDIUM
        assert error.details["timeout_seconds"] == 60

    def test_rag_error(self):
        """Test RAGError"""
        error = RAGError("RAG retrieval failed", stage="embedding")

        assert error.category == ErrorCategory.RAG_ERROR
        assert error.severity == ErrorSeverity.MEDIUM
        assert error.details["stage"] == "embedding"


class TestErrorHandling:
    """Test error handling functions"""

    def test_handle_error_with_app_error(self):
        """Test handle_error with AppError"""
        error = ValidationError("Invalid input", field="email")
        result = handle_error(error)

        assert result["error"] is True
        assert result["category"] == "validation_error"
        assert result["severity"] == "low"
        assert "message" in result
        assert "details" in result

    def test_handle_error_with_generic_exception(self):
        """Test handle_error with generic Exception"""
        error = ValueError("Something went wrong")
        result = handle_error(error)

        assert result["error"] is True
        assert result["category"] == "internal_error"
        assert result["severity"] == "high"
        assert isinstance(result["message"], str) and len(result["message"]) > 0

    def test_handle_error_with_context(self):
        """Test handle_error with context"""
        error = APIError("API failed", status_code=500)
        result = handle_error(error, context={"user_id": "user-123"})

        assert result["error"] is True
        assert result["category"] == "api_error"

    def test_error_to_https_error(self):
        """Test conversion to Firebase HttpsError"""
        error = ValidationError("Invalid input")
        https_error = error.to_https_error()

        # Check that it has the expected attributes
        assert hasattr(https_error, 'code')
        assert hasattr(https_error, 'message')


class TestErrorMessages:
    """Test user-friendly error messages"""

    def test_validation_error_message(self):
        """Test validation error message"""
        error = ValidationError("Invalid email format", field="email")
        assert "invalid" in error.user_message.lower()
        assert "check" in error.user_message.lower()

    def test_api_error_message(self):
        """Test API error message"""
        error = APIError("Connection failed", status_code=503)
        assert "service" in error.user_message.lower() or "unavailable" in error.user_message.lower()

    def test_timeout_error_message(self):
        """Test timeout error message"""
        error = TimeoutError("Request timed out", timeout_seconds=60)
        assert "too long" in error.user_message.lower() or "timeout" in error.user_message.lower()

    def test_rag_error_message(self):
        """Test RAG error message"""
        error = RAGError("Document not found", stage="retrieval")
        assert "document" in error.user_message.lower() or "context" in error.user_message.lower()


class TestErrorSeverity:
    """Test error severity levels"""

    def test_low_severity_errors(self):
        """Test low severity errors"""
        error = ValidationError("Invalid input")
        assert error.severity == ErrorSeverity.LOW

    def test_medium_severity_errors(self):
        """Test medium severity errors"""
        error = TimeoutError("Request timed out")
        assert error.severity == ErrorSeverity.MEDIUM

    def test_high_severity_errors(self):
        """Test high severity errors"""
        error = APIError("API failed", status_code=500)
        assert error.severity == ErrorSeverity.HIGH


class TestErrorDetails:
    """Test error details"""

    def test_error_details_included(self):
        """Test that error details are included"""
        error = ValidationError("Invalid input", field="email")

        assert "field" in error.details
        assert error.details["field"] == "email"

    def test_error_timestamp(self):
        """Test that error has timestamp"""
        error = AppError("Test error", category=ErrorCategory.INTERNAL_ERROR)
        result = handle_error(error)

        assert "timestamp" in result
        assert result["timestamp"] is not None

    def test_error_retry_after(self):
        """Test retry_after in error details"""
        error = APIError("Rate limited", status_code=429, retry_after=60)

        assert error.retry_after == 60
        result = handle_error(error)
        assert result["retry_after"] == 60


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
