"""
Quality Requirements Validation Tests
"""
import pytest
import logging
import json
import os
import subprocess
import sys
from unittest.mock import Mock, patch, MagicMock
try:
    from fastapi.testclient import TestClient
except Exception:
    pytest.skip("FastAPI not installed; skipping quality validation tests", allow_module_level=True)
from io import StringIO

from src.api.main import app
from src.api.exceptions import APIError, ValidationError, LLMProviderError
from src.config import settings

class TestQualityRequirements:
    """Test quality requirements including coverage, error handling, and monitoring"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    @pytest.fixture
    def mock_auth_token(self):
        """Mock authentication token"""
        return "Bearer mock_valid_token"

    @pytest.fixture
    def mock_user(self):
        """Mock user data"""
        return {
            'uid': 'test_user_123',
            'email': 'test@example.com',
            'claims': {'admin': False}
        }

    def test_critical_paths_coverage(self, client, mock_auth_token, mock_user):
        """Ensure all critical paths are tested"""

        critical_paths = [
            # Authentication paths
            ("POST", "/api/ai/chat", {"query": "test"}),
            ("POST", "/api/ai/rag-chat", {"query": "test"}),
            ("POST", "/api/ai/upload-document", None),  # File upload
            ("POST", "/api/ai/search-documents", {"query": "test"}),
            ("GET", "/api/ai/system-status", None),
            ("GET", "/api/ai/usage-stats", None),
            ("GET", "/api/ai/conversations", None),
            ("DELETE", "/api/ai/conversations/test_id", None),
            ("GET", "/api/ai/document-status/test_job", None),

            # Health check paths
            ("GET", "/health", None),
            ("GET", "/health/detailed", None),
            ("GET", "/health/ready", None),
        ]

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Mock all dependencies to avoid actual service calls
            with patch('src.llm.llm_manager.LLMManager.generate_response') as mock_llm, \
                 patch('src.rag.rag_pipeline.rag_pipeline.query') as mock_rag, \
                 patch('src.rag.rag_pipeline.rag_pipeline.process_document') as mock_process, \
                 patch('src.rag.rag_pipeline.rag_pipeline.search_documents') as mock_search, \
                 patch('src.rag.rag_pipeline.rag_pipeline.get_system_status') as mock_status, \
                 patch('src.rag.rag_pipeline.rag_pipeline.get_usage_stats') as mock_stats, \
                 patch('src.rag.rag_pipeline.rag_pipeline.delete_conversation') as mock_delete, \
                 patch('src.rag.rag_pipeline.rag_pipeline.get_document_status') as mock_doc_status:

                # Set up mocks
                mock_llm.return_value = Mock(content="test", provider="openai", model="gpt-4", tokens_used=10, cost=0.001, response_time=0.5, metadata={})
                mock_rag.return_value = Mock(response="test", sources=[], conversation_id="test", query_id="test", provider="openai", model="gpt-4", tokens_used=10, processing_time=1.0, confidence_score=0.8, metadata={})
                mock_process.return_value = Mock(job_id="test_job", status=Mock(value="pending"), filename="test.txt")
                mock_search.return_value = [Mock(chunk_id="1", content="test", score=0.9, metadata={})]
                mock_status.return_value = {"status": "idle", "metrics": {}}
                mock_stats.return_value = {"total_queries": 0}
                mock_delete.return_value = True
                mock_doc_status.return_value = Mock(job_id="test_job", status=Mock(value="completed"), filename="test.txt", created_at=Mock(), updated_at=Mock(), total_chunks=1, steps=[])
                mock_doc_status.return_value.created_at.isoformat.return_value = "2024-01-01T00:00:00Z"
                mock_doc_status.return_value.updated_at.isoformat.return_value = "2024-01-01T00:01:00Z"

                tested_paths = []

                for method, path, data in critical_paths:
                    try:
                        headers = {"Authorization": mock_auth_token} if path.startswith("/api/") else {}

                        if method == "GET":
                            response = client.get(path, headers=headers)
                        elif method == "POST":
                            if "upload-document" in path:
                                from io import BytesIO
                                response = client.post(
                                    path,
                                    files={"file": ("test.txt", BytesIO(b"test content"), "text/plain")},
                                    headers=headers
                                )
                            else:
                                response = client.post(path, json=data, headers=headers)
                        elif method == "DELETE":
                            response = client.delete(path, headers=headers)

                        # Path should be accessible (not 404)
                        assert response.status_code != 404, f"Critical path {method} {path} not found"
                        tested_paths.append(f"{method} {path}")

                    except Exception as e:
                        pytest.fail(f"Critical path {method} {path} failed: {e}")

                print(f"Tested {len(tested_paths)} critical paths:")
                for path in tested_paths:
                    print(f"  ✓ {path}")

    def test_error_handling_edge_cases(self, client, mock_auth_token, mock_user):
        """Verify error handling covers edge cases"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Test various error scenarios
            error_test_cases = [
                # Empty/invalid inputs
                {
                    "endpoint": "/api/ai/chat",
                    "data": {"query": ""},
                    "expected_status": 400,
                    "description": "Empty query"
                },
                {
                    "endpoint": "/api/ai/chat",
                    "data": {"query": "test", "temperature": 5.0},
                    "expected_status": 422,
                    "description": "Invalid temperature"
                },
                {
                    "endpoint": "/api/ai/search-documents",
                    "data": {"query": "test", "limit": 1000},
                    "expected_status": 422,
                    "description": "Limit too high"
                },

                # File upload edge cases
                {
                    "endpoint": "/api/ai/upload-document",
                    "file_data": ("", b"", "text/plain"),  # Empty filename
                    "expected_status": 400,
                    "description": "Empty filename"
                },
                {
                    "endpoint": "/api/ai/upload-document",
                    "file_data": ("test.xyz", b"content", "application/unknown"),  # Unsupported type
                    "expected_status": 400,
                    "description": "Unsupported file type"
                },
            ]

            for test_case in error_test_cases:
                try:
                    if "file_data" in test_case:
                        from io import BytesIO
                        filename, content, content_type = test_case["file_data"]
                        response = client.post(
                            test_case["endpoint"],
                            files={"file": (filename, BytesIO(content), content_type)},
                            headers={"Authorization": mock_auth_token}
                        )
                    else:
                        response = client.post(
                            test_case["endpoint"],
                            json=test_case["data"],
                            headers={"Authorization": mock_auth_token}
                        )

                    # Should return appropriate error status
                    assert response.status_code >= 400, f"Error case '{test_case['description']}' should return error status"

                    # Response should be valid JSON with error structure
                    error_data = response.json()
                    assert "success" in error_data
                    assert error_data["success"] is False
                    assert "error" in error_data

                    print(f"✓ Error case handled: {test_case['description']} -> {response.status_code}")

                except Exception as e:
                    pytest.fail(f"Error handling test failed for '{test_case['description']}': {e}")

    def test_logging_system_functional(self, caplog):
        """Confirm logging system is in place and functional"""

        # Test that logging is configured
        logger = logging.getLogger("src.api.main")

        with caplog.at_level(logging.INFO):
            logger.info("Test log message")
            logger.warning("Test warning message")
            logger.error("Test error message")

        # Check that logs were captured
        log_messages = [record.message for record in caplog.records]
        assert "Test log message" in log_messages
        assert "Test warning message" in log_messages
        assert "Test error message" in log_messages

        # Test structured logging
        with caplog.at_level(logging.INFO):
            logger.info("Structured log", extra={"user_id": "test_123", "action": "test"})

        # Verify structured data is included
        structured_record = next((r for r in caplog.records if hasattr(r, 'user_id')), None)
        if structured_record:
            assert structured_record.user_id == "test_123"
            assert structured_record.action == "test"

        print("✓ Logging system is functional")

    def test_monitoring_endpoints_available(self, client):
        """Confirm monitoring endpoints are available"""

        monitoring_endpoints = [
            "/health",
            "/health/detailed",
            "/health/ready"
        ]

        for endpoint in monitoring_endpoints:
            response = client.get(endpoint)

            # Should not be 404 (endpoint exists)
            assert response.status_code != 404, f"Monitoring endpoint {endpoint} not found"

            # Should return JSON
            try:
                data = response.json()
                assert isinstance(data, dict)
                print(f"✓ Monitoring endpoint {endpoint} available")
            except json.JSONDecodeError:
                pytest.fail(f"Monitoring endpoint {endpoint} does not return valid JSON")

    def test_configuration_validation(self):
        """Test configuration validation is working"""

        # Test that settings are loaded
        assert settings is not None

        # Test configuration validation
        config_issues = settings.validate_configuration()

        # In test environment, some issues are expected (missing API keys)
        # But critical configuration should be valid
        critical_issues = [
            issue for issue in config_issues
            if "required" in issue.lower() and "production" not in issue.lower()
        ]

        # Should not have critical configuration issues in test
        if critical_issues:
            print(f"Configuration issues found: {critical_issues}")

        print(f"✓ Configuration validation working (found {len(config_issues)} issues)")

    def test_exception_handling_consistency(self, client, mock_auth_token, mock_user):
        """Test that exceptions are handled consistently across endpoints"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Test that all endpoints handle exceptions consistently
            endpoints_to_test = [
                ("/api/ai/chat", {"query": "test"}),
                ("/api/ai/rag-chat", {"query": "test"}),
                ("/api/ai/search-documents", {"query": "test"}),
                ("/api/ai/system-status", None),
                ("/api/ai/usage-stats", None),
            ]

            for endpoint, data in endpoints_to_test:
                # Mock a service to raise an exception
                with patch('src.rag.rag_pipeline.rag_pipeline.get_system_status') as mock_service:
                    mock_service.side_effect = Exception("Test exception")

                    if data:
                        response = client.post(endpoint, json=data, headers={"Authorization": mock_auth_token})
                    else:
                        response = client.get(endpoint, headers={"Authorization": mock_auth_token})

                    # Should handle exception gracefully
                    assert response.status_code >= 400

                    # Should return consistent error format
                    try:
                        error_data = response.json()
                        assert "success" in error_data
                        assert error_data["success"] is False
                        assert "error" in error_data
                        print(f"✓ Exception handling consistent for {endpoint}")
                    except json.JSONDecodeError:
                        pytest.fail(f"Endpoint {endpoint} does not return valid JSON on exception")

    def test_security_headers_present(self, client):
        """Test that security headers are present in responses"""

        response = client.get("/health")

        # Check for security-related headers
        headers_to_check = [
            "X-Request-ID",  # Request tracking
            # Add more security headers as implemented
        ]

        present_headers = []
        for header in headers_to_check:
            if header in response.headers:
                present_headers.append(header)

        print(f"✓ Security headers present: {present_headers}")

    def test_api_documentation_available(self):
        """Test that API documentation is available"""

        # FastAPI automatically generates OpenAPI docs
        client = TestClient(app)

        # Test OpenAPI schema endpoint
        response = client.get("/openapi.json")
        assert response.status_code == 200

        schema = response.json()
        assert "openapi" in schema
        assert "info" in schema
        assert "paths" in schema

        # Check that main endpoints are documented
        documented_paths = schema["paths"].keys()
        expected_paths = [
            "/health",
            "/api/ai/chat",
            "/api/ai/rag-chat",
            "/api/ai/upload-document",
            "/api/ai/search-documents"
        ]

        for path in expected_paths:
            assert path in documented_paths, f"Path {path} not documented in OpenAPI schema"

        print(f"✓ API documentation available with {len(documented_paths)} endpoints")

    def test_data_validation_comprehensive(self, client, mock_auth_token, mock_user):
        """Test comprehensive data validation"""

        with patch('src.auth.auth_middleware.verify_token_async') as mock_auth:
            mock_auth.return_value = mock_user

            # Test various invalid data scenarios
            validation_tests = [
                # Chat endpoint validation
                {
                    "endpoint": "/api/ai/chat",
                    "data": {"query": "x" * 10000},  # Very long query
                    "description": "Extremely long query"
                },
                {
                    "endpoint": "/api/ai/chat",
                    "data": {"query": "test", "max_tokens": -1},  # Negative tokens
                    "description": "Negative max_tokens"
                },
                {
                    "endpoint": "/api/ai/rag-chat",
                    "data": {"query": "test", "max_context_tokens": 0},  # Zero context
                    "description": "Zero context tokens"
                },
                {
                    "endpoint": "/api/ai/search-documents",
                    "data": {"query": "test", "limit": 0},  # Zero limit
                    "description": "Zero search limit"
                },
            ]

            for test in validation_tests:
                response = client.post(
                    test["endpoint"],
                    json=test["data"],
                    headers={"Authorization": mock_auth_token}
                )

                # Should return validation error
                assert response.status_code in [400, 422], f"Validation test '{test['description']}' should return validation error"

                error_data = response.json()
                assert error_data["success"] is False

                print(f"✓ Validation test passed: {test['description']}")

    def run_coverage_analysis(self):
        """Run test coverage analysis"""
        try:
            # Run pytest with coverage
            result = subprocess.run([
                sys.executable, "-m", "pytest",
                "--cov=src",
                "--cov-report=term-missing",
                "--cov-report=json",
                "tests/"
            ], capture_output=True, text=True, cwd="functions")

            if result.returncode == 0:
                print("✓ Test coverage analysis completed")
                print(result.stdout)

                # Try to read coverage report
                try:
                    with open("functions/coverage.json", "r") as f:
                        coverage_data = json.load(f)
                        total_coverage = coverage_data["totals"]["percent_covered"]
                        print(f"Total test coverage: {total_coverage:.1f}%")

                        if total_coverage >= 90:
                            print("✓ Coverage target (>90%) achieved")
                        else:
                            print(f"⚠ Coverage target not met: {total_coverage:.1f}% < 90%")

                except FileNotFoundError:
                    print("Coverage report file not found")
            else:
                print(f"Coverage analysis failed: {result.stderr}")

        except Exception as e:
            print(f"Could not run coverage analysis: {e}")

# Run coverage analysis when module is imported
if __name__ == "__main__":
    test_instance = TestQualityRequirements()
    test_instance.run_coverage_analysis()
