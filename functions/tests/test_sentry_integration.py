"""
Test Sentry Integration
Verifies that Sentry error tracking is properly configured
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from src.error_handling import init_sentry, handle_error, APIError, ValidationError


class TestSentryIntegration:
    """Test Sentry integration"""

    def test_init_sentry_without_dsn(self):
        """Test Sentry initialization without DSN"""
        with patch.dict(os.environ, {'SENTRY_DSN': ''}, clear=False):
            # Should not raise an exception
            init_sentry()
            # Test passes if no exception is raised

    def test_init_sentry_with_dsn(self):
        """Test Sentry initialization with DSN"""
        test_dsn = "https://test@sentry.io/123456"

        with patch.dict(os.environ, {'SENTRY_DSN': test_dsn, 'ENVIRONMENT': 'test'}, clear=False):
            with patch('src.error_handling.sentry_sdk') as mock_sentry:
                mock_sentry.Hub.current.client = MagicMock()
                init_sentry()

                # Verify sentry_sdk.init was called
                mock_sentry.init.assert_called_once()
                call_kwargs = mock_sentry.init.call_args[1]

                assert call_kwargs['dsn'] == test_dsn
                assert call_kwargs['environment'] == 'test'
                assert call_kwargs['traces_sample_rate'] == 0.1

    def test_handle_error_captures_to_sentry(self):
        """Test that handle_error captures exceptions to Sentry"""
        error = APIError("Test API error", status_code=500)

        with patch('src.error_handling.sentry_sdk') as mock_sentry:
            mock_sentry.Hub.current.client = MagicMock()
            mock_sentry.SENTRY_AVAILABLE = True

            result = handle_error(error, context={'user_id': 'test-user'})

            # Verify Sentry captured the exception
            mock_sentry.capture_exception.assert_called_once_with(error)

            # Verify error dict returned
            assert result['error'] is True
            assert result['category'] == 'api_error'

    def test_handle_error_without_sentry(self):
        """Test that handle_error works without Sentry"""
        error = ValidationError("Test validation error", field="email")

        with patch('src.error_handling.SENTRY_AVAILABLE', False):
            result = handle_error(error)

            # Should still return error dict
            assert result['error'] is True
            assert result['category'] == 'validation_error'

    def test_sensitive_data_filtering(self):
        """Test that sensitive data is filtered from Sentry events"""
        from src.error_handling import _filter_sensitive_data

        event = {
            'request': {
                'headers': {
                    'authorization': 'Bearer secret-token',
                    'cookie': 'session=abc123',
                    'x-api-key': 'secret-key',
                    'user-agent': 'Mozilla/5.0'
                }
            },
            'contexts': {
                'runtime': {
                    'env': {
                        'SENTRY_DSN': 'https://secret@sentry.io/123',
                        'OPENROUTER_API_KEY': 'sk-secret',
                        'GOOGLE_API_KEY': 'gcp-secret',
                        'JWT_SECRET': 'jwt-secret',
                        'SAFE_VAR': 'safe-value'
                    }
                }
            }
        }

        filtered_event = _filter_sensitive_data(event, None)

        # Verify sensitive headers are redacted
        assert filtered_event['request']['headers']['authorization'] == '[REDACTED]'
        assert filtered_event['request']['headers']['cookie'] == '[REDACTED]'
        assert filtered_event['request']['headers']['x-api-key'] == '[REDACTED]'
        assert filtered_event['request']['headers']['user-agent'] == 'Mozilla/5.0'

        # Verify sensitive env vars are redacted
        env = filtered_event['contexts']['runtime']['env']
        assert env['SENTRY_DSN'] == '[REDACTED]'
        assert env['OPENROUTER_API_KEY'] == '[REDACTED]'
        assert env['GOOGLE_API_KEY'] == '[REDACTED]'
        assert env['JWT_SECRET'] == '[REDACTED]'
        assert env['SAFE_VAR'] == 'safe-value'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
