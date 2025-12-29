"""
Feedback Service for Marketing Agent
Captures user feedback (thumbs up/down, text) and links to conversations
"""
import logging
from typing import Optional, Dict, Any, Literal
from datetime import datetime, timezone
from enum import Enum

logger = logging.getLogger(__name__)


class FeedbackSentiment(str, Enum):
    """Feedback sentiment types"""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class FeedbackService:
    """
    Service to collect and store user feedback on agent responses.

    Feedback is linked to conversation_id and specific message_id (if available)
    to enable analysis of response quality and identify improvement areas.
    """

    def __init__(self, db: Any = None):
        """
        Initialize feedback service

        Args:
            db: Database connection (Firestore, PostgreSQL, etc.)
        """
        self.db = db
        self.enabled = db is not None

        if not self.enabled:
            logger.warning("⚠️ Feedback service disabled (no database connection)")

    async def submit_feedback(
        self,
        conversation_id: str,
        sentiment: FeedbackSentiment,
        message_id: Optional[str] = None,
        feedback_text: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Submit user feedback

        Args:
            conversation_id: Unique conversation identifier
            sentiment: positive, negative, or neutral
            message_id: Specific message ID (for multi-turn tracking)
            feedback_text: Optional text feedback from user
            user_id: Optional user identifier
            metadata: Optional additional metadata (page context, etc.)

        Returns:
            Feedback record with ID
        """
        feedback_record = {
            "feedback_id": self._generate_feedback_id(),
            "conversation_id": conversation_id,
            "message_id": message_id,
            "sentiment": sentiment.value,
            "feedback_text": feedback_text,
            "user_id": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {}
        }

        if self.enabled:
            try:
                # Store in database
                await self._store_feedback(feedback_record)
                logger.info(f"✓ Feedback recorded: {conversation_id} ({sentiment.value})")
            except Exception as e:
                logger.error(f"Failed to store feedback: {e}")
        else:
            # Log to console if database not available
            logger.info(f"Feedback (no DB): {sentiment.value} for conversation {conversation_id}")

        return feedback_record

    async def _store_feedback(self, feedback_record: Dict[str, Any]) -> None:
        """Store feedback in database"""
        if not self.db:
            return

        # Example for Firestore
        try:
            if hasattr(self.db, 'collection'):
                # Firestore
                await self.db.collection('agent_feedback').add(feedback_record)
            else:
                # Other DB implementations
                logger.warning("Database type not supported for feedback storage")
        except Exception as e:
            logger.error(f"Error storing feedback: {e}")
            raise

    async def get_feedback_summary(
        self,
        conversation_id: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get feedback summary/analytics

        Args:
            conversation_id: Filter by specific conversation
            start_date: Start date filter
            end_date: End date filter

        Returns:
            Summary statistics
        """
        if not self.enabled:
            return {
                "error": "Feedback service not enabled (no database)",
                "total_feedback": 0
            }

        # This would query the database for analytics
        # For now, return placeholder
        return {
            "total_feedback": 0,
            "positive": 0,
            "negative": 0,
            "neutral": 0,
            "response_rate": 0.0
        }

    def _generate_feedback_id(self) -> str:
        """Generate unique feedback ID"""
        import uuid
        return f"fb_{uuid.uuid4().hex[:12]}"


# Singleton instance
_feedback_service_instance: Optional[FeedbackService] = None


def get_feedback_service(db: Any = None) -> FeedbackService:
    """
    Get or create global feedback service instance

    Args:
        db: Database connection (optional, uses existing if already initialized)

    Returns:
        FeedbackService instance
    """
    global _feedback_service_instance

    if _feedback_service_instance is None:
        _feedback_service_instance = FeedbackService(db=db)
    elif db is not None and _feedback_service_instance.db is None:
        # Update DB connection if provided
        _feedback_service_instance.db = db
        _feedback_service_instance.enabled = True

    return _feedback_service_instance


# Convenience function for quick feedback submission
async def submit_agent_feedback(
    conversation_id: str,
    thumbs_up: bool,
    feedback_text: Optional[str] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Convenience function to submit feedback

    Args:
        conversation_id: Conversation ID
        thumbs_up: True for positive, False for negative
        feedback_text: Optional text feedback
        **kwargs: Additional metadata

    Returns:
        Feedback record
    """
    service = get_feedback_service()
    sentiment = FeedbackSentiment.POSITIVE if thumbs_up else FeedbackSentiment.NEGATIVE

    return await service.submit_feedback(
        conversation_id=conversation_id,
        sentiment=sentiment,
        feedback_text=feedback_text,
        metadata=kwargs
    )
