"""
Tests for Rating API
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timezone
from firebase_functions import https_fn

# Import the functions to test
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from api.ratings import (
    validate_rating_data,
    check_rate_limit,
    submit_rating,
    get_ratings,
    get_rating_aggregates
)


class TestValidateRatingData:
    """Test rating data validation"""
    
    def test_valid_rating_data(self):
        """Test validation with valid data"""
        data = {
            'executionId': 'exec-123',
            'rating': 5
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is True
        assert error is None
    
    def test_missing_execution_id(self):
        """Test validation with missing executionId"""
        data = {'rating': 5}
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert 'executionId' in error
    
    def test_missing_rating(self):
        """Test validation with missing rating"""
        data = {'executionId': 'exec-123'}
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert 'rating' in error
    
    def test_invalid_rating_type(self):
        """Test validation with non-numeric rating"""
        data = {
            'executionId': 'exec-123',
            'rating': 'five'
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert 'number' in error
    
    def test_rating_out_of_range_low(self):
        """Test validation with rating below 1"""
        data = {
            'executionId': 'exec-123',
            'rating': 0
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert 'between 1 and 5' in error
    
    def test_rating_out_of_range_high(self):
        """Test validation with rating above 5"""
        data = {
            'executionId': 'exec-123',
            'rating': 6
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert 'between 1 and 5' in error
    
    def test_invalid_thumbs_up_down_type(self):
        """Test validation with non-boolean thumbsUpDown"""
        data = {
            'executionId': 'exec-123',
            'rating': 5,
            'thumbsUpDown': 'yes'
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert 'boolean' in error
    
    def test_invalid_text_feedback_type(self):
        """Test validation with non-string textFeedback"""
        data = {
            'executionId': 'exec-123',
            'rating': 5,
            'textFeedback': 123
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert 'string' in error
    
    def test_text_feedback_too_long(self):
        """Test validation with textFeedback exceeding max length"""
        data = {
            'executionId': 'exec-123',
            'rating': 5,
            'textFeedback': 'a' * 1001
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is False
        assert '1000 characters' in error
    
    def test_valid_with_optional_fields(self):
        """Test validation with all optional fields"""
        data = {
            'executionId': 'exec-123',
            'rating': 4,
            'thumbsUpDown': True,
            'textFeedback': 'Great response!',
            'promptId': 'prompt-456',
            'modelUsed': 'gpt-4'
        }
        is_valid, error = validate_rating_data(data)
        assert is_valid is True
        assert error is None


class TestRateLimiting:
    """Test rate limiting functionality"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_not_exceeded(self):
        """Test rate limit check when limit not exceeded"""
        mock_db = Mock()
        mock_collection = Mock()
        mock_query = Mock()
        mock_docs = []
        
        mock_db.collection.return_value = mock_collection
        mock_collection.where.return_value = mock_query
        mock_query.where.return_value = mock_query
        mock_query.get.return_value = mock_docs
        
        is_allowed, error = await check_rate_limit(mock_db, 'user-123')
        
        assert is_allowed is True
        assert error is None
    
    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(self):
        """Test rate limit check when limit exceeded"""
        mock_db = Mock()
        mock_collection = Mock()
        mock_query = Mock()
        # Create 10 mock documents (at the limit)
        mock_docs = [Mock() for _ in range(10)]
        
        mock_db.collection.return_value = mock_collection
        mock_collection.where.return_value = mock_query
        mock_query.where.return_value = mock_query
        mock_query.get.return_value = mock_docs
        
        is_allowed, error = await check_rate_limit(mock_db, 'user-123')
        
        assert is_allowed is False
        assert 'Rate limit exceeded' in error


class TestSubmitRating:
    """Test rating submission"""
    
    def test_submit_rating_unauthenticated(self):
        """Test rating submission without authentication"""
        mock_request = Mock()
        mock_request.auth = None
        mock_request.data = {
            'executionId': 'exec-123',
            'rating': 5
        }
        
        with pytest.raises(https_fn.HttpsError) as exc_info:
            submit_rating(mock_request)
        
        assert exc_info.value.code == https_fn.FunctionsErrorCode.UNAUTHENTICATED
    
    def test_submit_rating_invalid_data(self):
        """Test rating submission with invalid data"""
        mock_request = Mock()
        mock_request.auth = Mock()
        mock_request.auth.uid = 'user-123'
        mock_request.data = {
            'executionId': 'exec-123',
            'rating': 10  # Invalid rating
        }
        
        with pytest.raises(https_fn.HttpsError) as exc_info:
            submit_rating(mock_request)
        
        assert exc_info.value.code == https_fn.FunctionsErrorCode.INVALID_ARGUMENT


class TestGetRatings:
    """Test rating retrieval"""
    
    def test_get_ratings_unauthenticated(self):
        """Test getting ratings without authentication"""
        mock_request = Mock()
        mock_request.auth = None
        mock_request.data = {}
        
        with pytest.raises(https_fn.HttpsError) as exc_info:
            get_ratings(mock_request)
        
        assert exc_info.value.code == https_fn.FunctionsErrorCode.UNAUTHENTICATED


class TestGetRatingAggregates:
    """Test rating aggregation"""
    
    def test_get_aggregates_unauthenticated(self):
        """Test getting aggregates without authentication"""
        mock_request = Mock()
        mock_request.auth = None
        mock_request.data = {}
        
        with pytest.raises(https_fn.HttpsError) as exc_info:
            get_rating_aggregates(mock_request)
        
        assert exc_info.value.code == https_fn.FunctionsErrorCode.UNAUTHENTICATED


# Integration test scenarios
class TestRatingIntegration:
    """Integration tests for rating workflow"""
    
    def test_complete_rating_workflow(self):
        """Test complete rating submission and retrieval workflow"""
        # This would be an integration test that:
        # 1. Submits a rating
        # 2. Retrieves the rating
        # 3. Gets aggregates
        # 4. Verifies all data is consistent
        pass
    
    def test_rating_update_workflow(self):
        """Test updating an existing rating"""
        # This would test:
        # 1. Submit initial rating
        # 2. Submit updated rating for same execution
        # 3. Verify only one rating exists
        # 4. Verify rating was updated
        pass
    
    def test_aggregate_calculation_accuracy(self):
        """Test accuracy of aggregate calculations"""
        # This would test:
        # 1. Submit multiple ratings
        # 2. Calculate expected aggregates manually
        # 3. Get aggregates from API
        # 4. Verify they match
        pass


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

