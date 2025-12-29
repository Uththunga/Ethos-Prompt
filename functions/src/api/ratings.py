"""
Execution Rating API
Handles submission, retrieval, and aggregation of execution ratings
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from firebase_functions import https_fn
from firebase_admin import firestore
from google.cloud.firestore_v1 import FieldFilter

logger = logging.getLogger(__name__)

# Rate limiting configuration
RATE_LIMIT_WINDOW = 60  # seconds
MAX_RATINGS_PER_WINDOW = 10  # max ratings per user per window


def validate_rating_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """
    Validate rating submission data
    
    Args:
        data: Rating data to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Required fields
    required_fields = ['executionId', 'rating']
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate rating value (1-5)
    rating = data.get('rating')
    if not isinstance(rating, (int, float)):
        return False, "Rating must be a number"
    
    if rating < 1 or rating > 5:
        return False, "Rating must be between 1 and 5"
    
    # Validate thumbsUpDown if provided
    if 'thumbsUpDown' in data:
        if not isinstance(data['thumbsUpDown'], bool):
            return False, "thumbsUpDown must be a boolean"
    
    # Validate textFeedback if provided
    if 'textFeedback' in data:
        if not isinstance(data['textFeedback'], str):
            return False, "textFeedback must be a string"
        
        if len(data['textFeedback']) > 1000:
            return False, "textFeedback must be less than 1000 characters"
    
    return True, None


async def check_rate_limit(db: firestore.Client, user_id: str) -> tuple[bool, Optional[str]]:
    """
    Check if user has exceeded rate limit for rating submissions
    
    Args:
        db: Firestore client
        user_id: User ID to check
        
    Returns:
        Tuple of (is_allowed, error_message)
    """
    try:
        # Get recent ratings from this user
        cutoff_time = datetime.now(timezone.utc).timestamp() - RATE_LIMIT_WINDOW
        
        ratings_ref = db.collection('execution_ratings')
        recent_ratings = (
            ratings_ref
            .where(filter=FieldFilter('userId', '==', user_id))
            .where(filter=FieldFilter('timestamp', '>=', cutoff_time))
            .get()
        )
        
        if len(recent_ratings) >= MAX_RATINGS_PER_WINDOW:
            return False, f"Rate limit exceeded. Maximum {MAX_RATINGS_PER_WINDOW} ratings per {RATE_LIMIT_WINDOW} seconds."
        
        return True, None
        
    except Exception as e:
        logger.error(f"Error checking rate limit: {e}")
        # Allow request if rate limit check fails
        return True, None


@https_fn.on_call(region="australia-southeast1")
def submit_rating(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Submit an execution rating
    
    Request data:
        - executionId: str (required)
        - rating: int (1-5, required)
        - thumbsUpDown: bool (optional)
        - textFeedback: str (optional)
        - promptId: str (optional)
        - modelUsed: str (optional)
    
    Returns:
        Success response with rating ID or error
    """
    # Check authentication
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated to submit ratings"
        )
    
    user_id = req.auth.uid
    data = req.data
    
    # Validate input data
    is_valid, error_message = validate_rating_data(data)
    if not is_valid:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message=error_message
        )
    
    try:
        db = firestore.client()
        
        # Check rate limit
        is_allowed, rate_limit_error = check_rate_limit(db, user_id)
        if not is_allowed:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.RESOURCE_EXHAUSTED,
                message=rate_limit_error
            )
        
        # Get execution details if not provided
        execution_id = data['executionId']
        prompt_id = data.get('promptId')
        model_used = data.get('modelUsed')
        
        if not prompt_id or not model_used:
            # Fetch from execution document
            execution_ref = db.collection('executions').document(execution_id)
            execution_doc = execution_ref.get()
            
            if execution_doc.exists:
                execution_data = execution_doc.to_dict()
                prompt_id = prompt_id or execution_data.get('promptId')
                model_used = model_used or execution_data.get('model')
        
        # Create rating document
        rating_data = {
            'executionId': execution_id,
            'userId': user_id,
            'rating': int(data['rating']),
            'thumbsUpDown': data.get('thumbsUpDown'),
            'textFeedback': data.get('textFeedback', '').strip(),
            'timestamp': datetime.now(timezone.utc),
            'promptId': prompt_id,
            'modelUsed': model_used,
        }
        
        # Check if user already rated this execution
        existing_ratings = (
            db.collection('execution_ratings')
            .where(filter=FieldFilter('executionId', '==', execution_id))
            .where(filter=FieldFilter('userId', '==', user_id))
            .limit(1)
            .get()
        )
        
        if existing_ratings:
            # Update existing rating
            rating_ref = existing_ratings[0].reference
            rating_ref.update(rating_data)
            rating_id = rating_ref.id
            logger.info(f"Updated rating {rating_id} for execution {execution_id}")
        else:
            # Create new rating
            rating_ref = db.collection('execution_ratings').document()
            rating_ref.set(rating_data)
            rating_id = rating_ref.id
            logger.info(f"Created rating {rating_id} for execution {execution_id}")
        
        # Update execution document with rating
        execution_ref = db.collection('executions').document(execution_id)
        execution_ref.update({
            'rating': int(data['rating']),
            'ratedAt': datetime.now(timezone.utc),
            'ratedBy': user_id,
        })
        
        return {
            'success': True,
            'ratingId': rating_id,
            'message': 'Rating submitted successfully'
        }
        
    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error submitting rating: {e}", exc_info=True)
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to submit rating: {str(e)}"
        )


@https_fn.on_call(region="australia-southeast1")
def get_ratings(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get ratings for an execution, prompt, or user
    
    Request data:
        - executionId: str (optional)
        - promptId: str (optional)
        - userId: str (optional)
        - limit: int (optional, default 50)
    
    Returns:
        List of ratings
    """
    # Check authentication
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated to view ratings"
        )
    
    data = req.data
    
    try:
        db = firestore.client()
        ratings_ref = db.collection('execution_ratings')
        
        # Build query based on filters
        query = ratings_ref
        
        if 'executionId' in data:
            query = query.where(filter=FieldFilter('executionId', '==', data['executionId']))
        
        if 'promptId' in data:
            query = query.where(filter=FieldFilter('promptId', '==', data['promptId']))
        
        if 'userId' in data:
            query = query.where(filter=FieldFilter('userId', '==', data['userId']))
        
        # Order by timestamp descending
        query = query.order_by('timestamp', direction=firestore.Query.DESCENDING)
        
        # Apply limit
        limit = data.get('limit', 50)
        query = query.limit(limit)
        
        # Execute query
        ratings_docs = query.get()
        
        # Format results
        ratings = []
        for doc in ratings_docs:
            rating_data = doc.to_dict()
            rating_data['id'] = doc.id
            # Convert timestamp to ISO format
            if 'timestamp' in rating_data and rating_data['timestamp']:
                rating_data['timestamp'] = rating_data['timestamp'].isoformat()
            ratings.append(rating_data)
        
        return {
            'success': True,
            'ratings': ratings,
            'count': len(ratings)
        }
        
    except Exception as e:
        logger.error(f"Error fetching ratings: {e}", exc_info=True)
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to fetch ratings: {str(e)}"
        )


@https_fn.on_call(region="australia-southeast1")
def get_rating_aggregates(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get aggregated rating statistics
    
    Request data:
        - promptId: str (optional)
        - modelUsed: str (optional)
        - userId: str (optional)
    
    Returns:
        Aggregated rating statistics
    """
    # Check authentication
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated to view rating statistics"
        )
    
    data = req.data
    
    try:
        db = firestore.client()
        ratings_ref = db.collection('execution_ratings')
        
        # Build query based on filters
        query = ratings_ref
        
        if 'promptId' in data:
            query = query.where(filter=FieldFilter('promptId', '==', data['promptId']))
        
        if 'modelUsed' in data:
            query = query.where(filter=FieldFilter('modelUsed', '==', data['modelUsed']))
        
        if 'userId' in data:
            query = query.where(filter=FieldFilter('userId', '==', data['userId']))
        
        # Get all matching ratings
        ratings_docs = query.get()
        
        if not ratings_docs:
            return {
                'success': True,
                'aggregates': {
                    'totalRatings': 0,
                    'averageRating': 0,
                    'ratingDistribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                    'thumbsUpCount': 0,
                    'thumbsDownCount': 0,
                    'feedbackCount': 0,
                }
            }
        
        # Calculate aggregates
        total_ratings = len(ratings_docs)
        rating_sum = 0
        rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        thumbs_up_count = 0
        thumbs_down_count = 0
        feedback_count = 0
        
        for doc in ratings_docs:
            rating_data = doc.to_dict()
            rating = rating_data.get('rating', 0)
            
            rating_sum += rating
            rating_distribution[rating] = rating_distribution.get(rating, 0) + 1
            
            if rating_data.get('thumbsUpDown') is True:
                thumbs_up_count += 1
            elif rating_data.get('thumbsUpDown') is False:
                thumbs_down_count += 1
            
            if rating_data.get('textFeedback'):
                feedback_count += 1
        
        average_rating = rating_sum / total_ratings if total_ratings > 0 else 0
        
        return {
            'success': True,
            'aggregates': {
                'totalRatings': total_ratings,
                'averageRating': round(average_rating, 2),
                'ratingDistribution': rating_distribution,
                'thumbsUpCount': thumbs_up_count,
                'thumbsDownCount': thumbs_down_count,
                'feedbackCount': feedback_count,
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating rating aggregates: {e}", exc_info=True)
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to calculate rating aggregates: {str(e)}"
        )

