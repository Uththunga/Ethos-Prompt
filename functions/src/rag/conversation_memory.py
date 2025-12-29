"""
Conversation Memory - Manage conversation history and context
"""
import logging
import json
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from enum import Enum

logger = logging.getLogger(__name__)

class MessageRole(Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

@dataclass
class ConversationMessage:
    role: MessageRole
    content: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None
    token_count: int = 0
    message_id: Optional[str] = None

@dataclass
class ConversationSummary:
    conversation_id: str
    summary: str
    key_topics: List[str]
    user_intent: str
    created_at: datetime
    message_count: int
    token_count: int

@dataclass
class ConversationContext:
    conversation_id: str
    user_id: str
    messages: List[ConversationMessage]
    summary: Optional[ConversationSummary]
    created_at: datetime
    updated_at: datetime
    total_tokens: int
    metadata: Optional[Dict[str, Any]] = None

class ConversationMemoryManager:
    """
    Manage conversation history with intelligent summarization and context management
    """

    def __init__(self, firestore_client=None, llm_manager=None):
        self.db = firestore_client
        self.llm_manager = llm_manager

        # Enhanced Configuration
        self.config = {
            'max_messages_in_memory': 20,
            'max_tokens_per_conversation': 8000,
            'summarization_threshold': 15,  # Messages before summarization
            'context_window_size': 10,     # Recent messages to keep
            'summary_max_tokens': 500,
            'cleanup_after_days': 30,
            'importance_threshold': 0.7,   # Threshold for important messages
            'context_compression_ratio': 0.3,  # Target compression ratio
            'topic_tracking_enabled': True,
            'auto_summarization_enabled': True,
            'semantic_clustering_enabled': True,
            'conversation_branching_enabled': True
        }

        # In-memory caches
        self.conversation_cache: Dict[str, ConversationContext] = {}
        self.topic_cache: Dict[str, List[str]] = {}
        self.importance_cache: Dict[str, float] = {}

    async def create_conversation(self, user_id: str, initial_message: Optional[str] = None) -> str:
        """
        Create a new conversation
        """
        conversation_id = f"conv_{user_id}_{int(datetime.now().timestamp())}"

        messages = []
        if initial_message:
            message = ConversationMessage(
                role=MessageRole.USER,
                content=initial_message,
                timestamp=datetime.now(timezone.utc),
                message_id=f"{conversation_id}_msg_0",
                token_count=self._estimate_tokens(initial_message)
            )
            messages.append(message)

        context = ConversationContext(
            conversation_id=conversation_id,
            user_id=user_id,
            messages=messages,
            summary=None,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            total_tokens=sum(msg.token_count for msg in messages),
            metadata={}
        )

        # Save to database
        await self._save_conversation(context)

        logger.info(f"Created conversation {conversation_id} for user {user_id}")
        return conversation_id

    async def add_message(
        self,
        conversation_id: str,
        role: MessageRole,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ConversationMessage:
        """
        Add a message to the conversation
        """
        # Load conversation
        context = await self.get_conversation(conversation_id)
        if not context:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Create message
        message_id = f"{conversation_id}_msg_{len(context.messages)}"
        message = ConversationMessage(
            role=role,
            content=content,
            timestamp=datetime.now(timezone.utc),
            metadata=metadata or {},
            token_count=self._estimate_tokens(content),
            message_id=message_id
        )

        # Add to conversation
        context.messages.append(message)
        context.total_tokens += message.token_count
        context.updated_at = datetime.now(timezone.utc)

        # Check if summarization is needed
        if len(context.messages) >= self.config['summarization_threshold']:
            await self._maybe_summarize_conversation(context)

        # Save updated conversation
        await self._save_conversation(context)

        logger.debug(f"Added message to conversation {conversation_id}")
        return message

    async def get_conversation(self, conversation_id: str) -> Optional[ConversationContext]:
        """
        Get conversation by ID
        """
        if not self.db:
            return None

        try:
            doc_ref = self.db.collection('conversations').document(conversation_id)
            doc = doc_ref.get()

            if not doc.exists:
                return None

            data = doc.to_dict()
            return self._deserialize_conversation(data)

        except Exception as e:
            logger.error(f"Failed to get conversation {conversation_id}: {e}")
            return None

    async def get_conversation_context(
        self,
        conversation_id: str,
        max_tokens: Optional[int] = None
    ) -> Tuple[List[ConversationMessage], Optional[str]]:
        """
        Get conversation context optimized for LLM input
        """
        context = await self.get_conversation(conversation_id)
        if not context:
            return [], None

        max_tokens = max_tokens or int(self.config['max_tokens_per_conversation'])

        # Start with recent messages
        recent_messages = context.messages[-int(self.config['context_window_size']):]

        # Calculate token usage
        current_tokens = sum(msg.token_count for msg in recent_messages)

        # Add summary if available and if we have room
        summary_text = None
        if context.summary and current_tokens < max_tokens:
            summary_text = context.summary.summary
            summary_tokens = self._estimate_tokens(summary_text)

            # If summary + recent messages fit, use both
            if current_tokens + summary_tokens <= max_tokens:
                current_tokens += summary_tokens
            else:
                summary_text = None

        # If we still have room, add more historical messages
        if current_tokens < max_tokens and len(context.messages) > len(recent_messages):
            additional_messages: List[ConversationMessage] = []
            remaining_tokens = max_tokens - current_tokens

            # Work backwards from the recent messages
            start_index = len(context.messages) - len(recent_messages) - 1
            for i in range(start_index, -1, -1):
                msg = context.messages[i]
                if msg.token_count <= remaining_tokens:
                    additional_messages.insert(0, msg)
                    remaining_tokens -= msg.token_count
                else:
                    break

            recent_messages = additional_messages + recent_messages

        return recent_messages, summary_text

    async def _maybe_summarize_conversation(self, context: ConversationContext):
        """
        Summarize conversation if it's getting too long
        """
        if not self.llm_manager or len(context.messages) < self.config['summarization_threshold']:
            return

        # Don't summarize if we already have a recent summary
        if context.summary and len(context.messages) - context.summary.message_count < 10:
            return

        try:
            # Prepare messages for summarization (exclude very recent ones)
            messages_to_summarize = context.messages[:-5]  # Keep last 5 messages

            if len(messages_to_summarize) < 5:  # Not enough to summarize
                return

            # Create summarization prompt
            conversation_text = self._format_messages_for_summarization(messages_to_summarize)

            summary_prompt = f"""
            Please provide a concise summary of this conversation, including:
            1. Main topics discussed
            2. Key decisions or conclusions
            3. User's primary intent or goals
            4. Important context for future messages

            Conversation:
            {conversation_text}

            Summary:
            """

            # Generate summary
            response = await self.llm_manager.generate_response(summary_prompt)

            if response and response.content:
                # Extract key topics (simple keyword extraction)
                key_topics = self._extract_key_topics(conversation_text)

                # Determine user intent
                user_intent = self._determine_user_intent(messages_to_summarize)

                # Create summary
                summary = ConversationSummary(
                    conversation_id=context.conversation_id,
                    summary=response.content.strip(),
                    key_topics=key_topics,
                    user_intent=user_intent,
                    created_at=datetime.now(timezone.utc),
                    message_count=len(messages_to_summarize),
                    token_count=response.tokens_used
                )

                context.summary = summary
                logger.info(f"Created summary for conversation {context.conversation_id}")

        except Exception as e:
            logger.error(f"Failed to summarize conversation {context.conversation_id}: {e}")

    def _format_messages_for_summarization(self, messages: List[ConversationMessage]) -> str:
        """
        Format messages for summarization
        """
        formatted_messages = []
        for msg in messages:
            role = msg.role.value.upper()
            formatted_messages.append(f"{role}: {msg.content}")

        return "\n\n".join(formatted_messages)

    def _extract_key_topics(self, text: str) -> List[str]:
        """
        Extract key topics from conversation text (simple implementation)
        """
        # Simple keyword extraction - in production, use NLP libraries
        import re

        # Remove common words and extract meaningful terms
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())

        # Count word frequency
        word_freq: Dict[str, int] = {}
        for word in words:
            if word not in {'user', 'assistant', 'please', 'would', 'could', 'should', 'think', 'know'}:
                word_freq[word] = word_freq.get(word, 0) + 1

        # Get top keywords
        top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        return [word for word, freq in top_words if freq > 1]

    def _determine_user_intent(self, messages: List[ConversationMessage]) -> str:
        """
        Determine user's primary intent from messages
        """
        user_messages = [msg.content for msg in messages if msg.role == MessageRole.USER]

        if not user_messages:
            return "unknown"

        # Simple intent classification based on keywords
        combined_text = " ".join(user_messages).lower()

        if any(word in combined_text for word in ['help', 'how', 'tutorial', 'guide']):
            return "seeking_help"
        elif any(word in combined_text for word in ['create', 'build', 'make', 'develop']):
            return "creation"
        elif any(word in combined_text for word in ['explain', 'what', 'why', 'understand']):
            return "learning"
        elif any(word in combined_text for word in ['fix', 'error', 'problem', 'issue']):
            return "troubleshooting"
        else:
            return "general_inquiry"

    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for text
        """
        return len(text) // 4  # Simple approximation

    async def _save_conversation(self, context: ConversationContext):
        """
        Save conversation to database
        """
        if not self.db:
            return

        try:
            data = self._serialize_conversation(context)
            doc_ref = self.db.collection('conversations').document(context.conversation_id)
            doc_ref.set(data)

        except Exception as e:
            logger.error(f"Failed to save conversation {context.conversation_id}: {e}")

    def _serialize_conversation(self, context: ConversationContext) -> Dict[str, Any]:
        """
        Serialize conversation for database storage
        """
        data = asdict(context)

        # Convert datetime objects to ISO strings
        data['created_at'] = context.created_at.isoformat()
        data['updated_at'] = context.updated_at.isoformat()

        # Convert messages
        for msg_data in data['messages']:
            msg_data['timestamp'] = datetime.fromisoformat(msg_data['timestamp']).isoformat()
            msg_data['role'] = msg_data['role'].value if hasattr(msg_data['role'], 'value') else msg_data['role']

        # Convert summary
        if data['summary']:
            data['summary']['created_at'] = datetime.fromisoformat(data['summary']['created_at']).isoformat()

        return data

    def _deserialize_conversation(self, data: Dict[str, Any]) -> ConversationContext:
        """
        Deserialize conversation from database
        """
        # Convert datetime strings back to datetime objects
        data['created_at'] = datetime.fromisoformat(data['created_at'])
        data['updated_at'] = datetime.fromisoformat(data['updated_at'])

        # Convert messages
        messages = []
        for msg_data in data['messages']:
            msg_data['timestamp'] = datetime.fromisoformat(msg_data['timestamp'])
            msg_data['role'] = MessageRole(msg_data['role'])
            messages.append(ConversationMessage(**msg_data))

        data['messages'] = messages

        # Convert summary
        if data['summary']:
            data['summary']['created_at'] = datetime.fromisoformat(data['summary']['created_at'])
            data['summary'] = ConversationSummary(**data['summary'])

        return ConversationContext(**data)

    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[ConversationContext]:
        """
        Get conversations for a user
        """
        if not self.db:
            return []

        try:
            query = self.db.collection('conversations')\
                          .where('user_id', '==', user_id)\
                          .order_by('updated_at', direction='DESCENDING')\
                          .limit(limit)

            conversations = []
            for doc in query.stream():
                data = doc.to_dict()
                context = self._deserialize_conversation(data)
                conversations.append(context)

            return conversations

        except Exception as e:
            logger.error(f"Failed to get user conversations: {e}")
            return []

    async def delete_conversation(self, conversation_id: str) -> bool:
        """
        Delete a conversation
        """
        if not self.db:
            return False

        try:
            doc_ref = self.db.collection('conversations').document(conversation_id)
            doc_ref.delete()
            logger.info(f"Deleted conversation {conversation_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete conversation {conversation_id}: {e}")
            return False

    async def cleanup_old_conversations(self, days: Optional[int] = None) -> int:
        """
        Clean up old conversations
        """
        days = days or int(self.config['cleanup_after_days'])
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

        if not self.db:
            return 0

        try:
            query = self.db.collection('conversations')\
                          .where('updated_at', '<', cutoff_date)

            deleted_count = 0
            for doc in query.stream():
                doc.reference.delete()
                deleted_count += 1

            logger.info(f"Cleaned up {deleted_count} old conversations")
            return deleted_count

        except Exception as e:
            logger.error(f"Failed to cleanup old conversations: {e}")
            return 0

    async def analyze_conversation_sentiment(self, conversation_id: str) -> Dict[str, Any]:
        """Analyze conversation sentiment and emotional tone"""
        context = await self.get_conversation(conversation_id)
        if not context:
            return {}

        # Simple sentiment analysis based on keywords
        positive_keywords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'love', 'amazing', 'perfect']
        negative_keywords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'frustrated', 'angry', 'worst']

        sentiment_scores = []
        emotional_indicators = []

        for message in context.messages:
            if message.role == MessageRole.USER:
                content_lower = message.content.lower()

                positive_count = sum(1 for word in positive_keywords if word in content_lower)
                negative_count = sum(1 for word in negative_keywords if word in content_lower)

                # Calculate sentiment score (-1 to 1)
                if positive_count + negative_count > 0:
                    score = (positive_count - negative_count) / (positive_count + negative_count)
                else:
                    score = 0

                sentiment_scores.append(score)

                # Detect emotional indicators
                if '!' in message.content:
                    emotional_indicators.append('excitement')
                if '?' in message.content:
                    emotional_indicators.append('curiosity')
                if message.content.isupper():
                    emotional_indicators.append('emphasis')

        overall_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0

        return {
            'overall_sentiment': overall_sentiment,
            'sentiment_trend': sentiment_scores,
            'emotional_indicators': list(set(emotional_indicators)),
            'message_count': len(context.messages),
            'user_engagement': len([m for m in context.messages if m.role == MessageRole.USER])
        }

    async def extract_conversation_topics(self, conversation_id: str) -> List[str]:
        """Extract key topics from conversation using keyword analysis"""
        context = await self.get_conversation(conversation_id)
        if not context:
            return []

        # Combine all message content
        all_text = " ".join([msg.content for msg in context.messages])

        # Simple keyword extraction (in production, use more sophisticated NLP)
        words = all_text.lower().split()

        # Filter out common words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'}

        # Count word frequencies
        word_freq: Dict[str, int] = {}
        for word in words:
            if len(word) > 3 and word not in stop_words:
                word_freq[word] = word_freq.get(word, 0) + 1

        # Get top topics
        topics = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        return [topic[0] for topic in topics]

    async def get_conversation_analytics(self, conversation_id: str) -> Dict[str, Any]:
        """Get comprehensive conversation analytics"""
        context = await self.get_conversation(conversation_id)
        if not context:
            return {}

        # Basic metrics
        total_messages = len(context.messages)
        user_messages = len([m for m in context.messages if m.role == MessageRole.USER])
        assistant_messages = len([m for m in context.messages if m.role == MessageRole.ASSISTANT])

        # Calculate average response time (simplified)
        response_times = []
        for i in range(1, len(context.messages)):
            if (context.messages[i-1].role == MessageRole.USER and
                context.messages[i].role == MessageRole.ASSISTANT):
                time_diff = (context.messages[i].timestamp - context.messages[i-1].timestamp).total_seconds()
                response_times.append(time_diff)

        avg_response_time = sum(response_times) / len(response_times) if response_times else 0

        # Get sentiment analysis
        sentiment_analysis = await self.analyze_conversation_sentiment(conversation_id)

        # Get topics
        topics = await self.extract_conversation_topics(conversation_id)

        # Calculate conversation quality metrics
        quality_score = 0.5
        if sentiment_analysis.get('overall_sentiment', 0) > 0:
            quality_score += 0.2
        if avg_response_time < 60:  # Fast responses
            quality_score += 0.1
        if total_messages > 5:  # Engaged conversation
            quality_score += 0.1

        return {
            'conversation_id': conversation_id,
            'total_messages': total_messages,
            'user_messages': user_messages,
            'assistant_messages': assistant_messages,
            'total_tokens': context.total_tokens,
            'duration_minutes': (context.updated_at - context.created_at).total_seconds() / 60,
            'avg_response_time_seconds': avg_response_time,
            'sentiment_analysis': sentiment_analysis,
            'key_topics': topics,
            'quality_score': min(1.0, quality_score),
            'has_summary': context.summary is not None,
            'created_at': context.created_at.isoformat(),
            'updated_at': context.updated_at.isoformat()
        }

# Global instance
conversation_memory = ConversationMemoryManager()
