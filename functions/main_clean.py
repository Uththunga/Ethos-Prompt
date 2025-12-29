"""
Simple Firebase Functions for RAG Prompt Library - CORS Testing
"""
import json
from typing import Any, Dict

from firebase_functions import https_fn, options
from firebase_admin import initialize_app

# Initialize Firebase Admin
initialize_app()

@https_fn.on_call(
    memory=options.MemoryOption.MB_256,
    timeout_sec=60,
    cors=options.CorsOptions(
        cors_origins=[
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5000"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def generate_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Simple prompt generation function with CORS support"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # Extract request data
        purpose = req.data.get('purpose', '')
        industry = req.data.get('industry', '')
        use_case = req.data.get('useCase', '')

        if not purpose:
            raise https_fn.HttpsError('invalid-argument', 'Purpose is required')

        # Simple template-based generation
        generated_prompt = f"""You are a professional {industry} specialist and expert assistant.

Your primary objective is to {purpose} for {use_case} scenarios.

Context Variables:
- {{user_input}}: The specific request or question from the user
- {{context}}: Relevant background information or constraints

Instructions:
1. Analyze the {{user_input}} carefully and consider the {{context}}
2. Provide detailed responses appropriate for {industry}
3. Use professional terminology and maintain industry standards
4. Structure your response clearly with logical flow
5. Include specific, actionable recommendations when applicable

Quality Standards:
- Accuracy: Ensure all information is correct and up-to-date
- Relevance: Keep responses focused on the specific {use_case}
- Professionalism: Maintain appropriate tone and language
- Completeness: Address all aspects of the request thoroughly

Please provide helpful, accurate, and professional assistance."""

        return {
            'generatedPrompt': generated_prompt,
            'title': f"{purpose.title()} Assistant",
            'description': f"AI-generated prompt for {purpose} in {industry}",
            'category': industry or 'General',
            'tags': [industry.lower() if industry else 'general', use_case.lower().replace(' ', '-') if use_case else 'assistant'],
            'variables': [
                {'name': 'user_input', 'type': 'text', 'required': True, 'description': 'The specific request or question from the user'},
                {'name': 'context', 'type': 'text', 'required': False, 'description': 'Relevant background information or constraints'}
            ],
            'qualityScore': {
                'overall': 75,
                'structure': 80,
                'clarity': 75,
                'variables': 70,
                'ragCompatibility': 85,
                'suggestions': []
            },
            'suggestions': [],
            'metadata': {
                'model': 'template-simple',
                'tokensUsed': len(generated_prompt.split()) * 1.3,
                'generationTime': 0.1,
                'confidence': 0.75,
                'corsEnabled': True
            }
        }

    except Exception as e:
        raise https_fn.HttpsError('internal', str(e))


@https_fn.on_call(
    memory=options.MemoryOption.MB_256,
    timeout_sec=60,
    cors=options.CorsOptions(
        cors_origins=[
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5000"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def test_cors(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Simple test function to verify CORS is working"""
    return {
        'message': 'CORS is working correctly!',
        'timestamp': '2025-07-18T12:00:00Z',
        'origin': req.headers.get('origin', 'unknown'),
        'method': req.method,
        'authenticated': req.auth is not None,
        'userId': req.auth.uid if req.auth else None
    }
