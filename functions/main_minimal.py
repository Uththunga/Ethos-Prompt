"""
Minimal version for deployment testing
"""
from firebase_functions import https_fn

@https_fn.on_call()
def generate_prompt(req: https_fn.CallableRequest):
    """Generate an AI-optimized prompt based on user requirements - Minimal version"""
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
        raise https_fn.HttpsError('internal', str(e))
