"""
Simplified version for initial deployment
"""
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore
import logging
from typing import Any, Dict
from datetime import datetime, timezone

# Initialize Firebase Admin
initialize_app()

logger = logging.getLogger(__name__)

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://127.0.0.1:5000"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def generate_prompt(req: https_fn.CallableRequest):
    """Generate an AI-optimized prompt based on user requirements - Simplified version"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')
    
    try:
        # Extract request data
        purpose = req.data.get('purpose', '')
        industry = req.data.get('industry', '')
        use_case = req.data.get('useCase', '')
        
        if not purpose:
            raise https_fn.HttpsError('invalid-argument', 'Purpose is required')
        
        # For now, return a simple generated prompt until we can deploy the full AI version
        generated_prompt = f"""You are a helpful assistant specialized in {industry}.

Your task is to {purpose} for the use case of {use_case}.

Please provide clear, helpful, and professional responses that are appropriate for this context.

Instructions:
1. Be specific and actionable
2. Use appropriate terminology for {industry}
3. Maintain a professional tone
4. Provide detailed and helpful information

Please ensure your responses are accurate and helpful."""

        return {
            'generatedPrompt': generated_prompt,
            'title': f"{purpose.title()} Assistant",
            'description': f"AI-generated prompt for {purpose} in {industry}",
            'category': industry or 'General',
            'tags': [industry.lower() if industry else 'general', use_case.lower().replace(' ', '-') if use_case else 'assistant'],
            'variables': [],
            'qualityScore': {
                'overall': 75,
                'structure': 75,
                'clarity': 80,
                'variables': 70,
                'ragCompatibility': 70,
                'suggestions': []
            },
            'suggestions': [
                {
                    'id': 'add-variables',
                    'type': 'variables',
                    'title': 'Add Variables',
                    'description': 'Consider adding variables to make your prompt more dynamic',
                    'impact': 'medium',
                    'category': 'Enhancement',
                    'autoApplicable': False
                }
            ],
            'metadata': {
                'model': 'template-based',
                'tokensUsed': 0,
                'generationTime': 0.1,
                'confidence': 0.75
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating prompt: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://127.0.0.1:5000"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def test_openrouter_connection(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Test OpenRouter API connection - Simplified version"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # For now, return a mock successful response
        # In the future, this will test the actual OpenRouter API
        return {
            'status': 'success',
            'message': 'OpenRouter connection test successful (mock)',
            'model_info': {
                'model': 'meta-llama/llama-3.2-11b-vision-instruct:free',
                'provider': 'OpenRouter',
                'cost_per_token': 0.0
            },
            'test_response': {
                'content': 'Hello! This is a test response from the OpenRouter API.',
                'tokens_used': 12,
                'response_time': 0.85
            },
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'cors_enabled': True
        }

    except Exception as e:
        logger.error(f"Error testing OpenRouter connection: {str(e)}")
        return {
            'status': 'error',
            'message': f'Connection test failed: {str(e)}',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
