"""
API Request/Response Models
Pydantic models for API validation
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, List, Any
from datetime import datetime


# =============================================================================
# PROMPT LIBRARY CHAT MODELS
# =============================================================================

class PromptLibraryChatRequest(BaseModel):
    """Request model for /api/ai/prompt-library-chat endpoint"""
    
    message: str = Field(
        description="User's message to the agent",
        min_length=1,
        max_length=5000
    )
    conversation_id: Optional[str] = Field(
        default=None,
        description="Optional conversation ID for continuing a conversation"
    )
    dashboard_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Current dashboard context (page, selected prompt, etc.)"
    )
    stream: bool = Field(
        default=False,
        description="Whether to stream the response"
    )
    
    @validator('message')
    def validate_message(cls, v):
        if not v or not v.strip():
            raise ValueError("Message cannot be empty")
        return v.strip()


class ToolCall(BaseModel):
    """Tool call metadata"""
    tool: str
    arguments: Optional[str] = None


class PromptLibraryChatResponse(BaseModel):
    """Response model for /api/ai/prompt-library-chat endpoint"""
    
    success: bool
    response: Optional[str] = None
    conversation_id: str
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    
    # Optional fields for enhanced UX
    actions: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Suggested quick actions for the user"
    )
    suggestions: Optional[List[str]] = Field(
        default=None,
        description="Follow-up suggestions"
    )


# =============================================================================
# AUTHENTICATION MODELS
# =============================================================================

class UserContext(BaseModel):
    """Authenticated user context"""
    user_id: str
    email: Optional[str] = None
    email_verified: bool = False
    claims: Dict[str, Any] = {}


# =============================================================================
# ERROR MODELS
# =============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    error_code: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# =============================================================================
# RATE LIMIT MODELS
# =============================================================================

class RateLimitInfo(BaseModel):
    """Rate limit information"""
    limit: int
    remaining: int
    reset_at: datetime
    retry_after: Optional[int] = None  # Seconds until reset

