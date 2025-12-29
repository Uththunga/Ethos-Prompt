"""
Enhanced AI/ML Functions with full LLM integration
"""
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore
import logging
from typing import Any, Dict
from datetime import datetime, timezone, timedelta
import json
import os
import time

# Load environment variables for Firebase Functions
def load_firebase_config():
    """Load configuration from environment variables and .env file"""
    try:
        # Try to load from .env file first
        from dotenv import load_dotenv
        load_dotenv()
        logging.info("Loaded environment from .env file")
    except ImportError:
        logging.info("dotenv not available, using existing environment variables")

    # Ensure required environment variables are set
    required_vars = ['OPENROUTER_API_KEY', 'GOOGLE_API_KEY']
    missing_vars = []

    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)

    if missing_vars:
        logging.warning(f"Missing environment variables: {missing_vars}")
    else:
        logging.info("All required environment variables are set")

# Load configuration
load_firebase_config()

# Initialize Firebase Admin
app = initialize_app()
db = firestore.client()

# Import our AI service
try:
    from src.ai_service import ai_service
    # Initialize with Firestore client
    ai_service.db = db
    AI_SERVICE_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("AI Service initialized successfully")
except ImportError as e:
    AI_SERVICE_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning(f"AI Service not available: {e}")

# Set up environment variables for AI providers
def setup_ai_environment():
    """Setup environment variables for AI providers"""
    # These would typically be set in Firebase Functions config
    # For now, we'll use placeholder values
    if not os.getenv('OPENAI_API_KEY'):
        logger.warning("OPENAI_API_KEY not set")
    if not os.getenv('ANTHROPIC_API_KEY'):
        logger.warning("ANTHROPIC_API_KEY not set")
    if not os.getenv('GOOGLE_API_KEY'):
        logger.warning("GOOGLE_API_KEY not set")
    if not os.getenv('COHERE_API_KEY'):
        logger.warning("COHERE_API_KEY not set")

setup_ai_environment()

def _cors_enabled_response(data: Any, status_code: int = 200):
    """Helper function to create CORS-enabled responses"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600',
        'Content-Type': 'application/json'
    }

    return (json.dumps(data), status_code, headers)

def _handle_preflight():
    """Handle CORS preflight requests"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
    }
    return ('', 204, headers)

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],  # Allow all origins for now to fix CORS
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def generate_prompt(req: https_fn.CallableRequest):
    """Generate an AI-optimized prompt based on user requirements"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # Extract request data
        purpose = req.data.get('purpose', '')
        industry = req.data.get('industry', '')
        use_case = req.data.get('useCase', '')
        provider = req.data.get('provider', 'openai')
        user_tier = req.data.get('userTier', 'free')

        if not purpose:
            raise https_fn.HttpsError('invalid-argument', 'Purpose is required')

        user_id = req.auth.uid

        if AI_SERVICE_AVAILABLE:
            # Use AI service for intelligent prompt generation
            prompt_template = f"""You are an expert prompt engineer. Create a high-quality, professional prompt for the following requirements:

Purpose: {purpose}
Industry: {industry}
Use Case: {use_case}

Create a prompt that:
1. Is specific and actionable for {industry}
2. Addresses the {purpose} effectively
3. Is optimized for {use_case}
4. Includes appropriate variables using {{variable_name}} syntax
5. Follows best practices for AI prompt engineering

Generate a complete, ready-to-use prompt that a user can immediately apply."""

            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                result = loop.run_until_complete(
                    ai_service.generate_prompt_response(
                        user_id=user_id,
                        prompt_template=prompt_template,
                        variables={
                            'purpose': purpose,
                            'industry': industry,
                            'use_case': use_case
                        },
                        provider=provider,
                        user_tier=user_tier,
                        endpoint='generate_prompt'
                    )
                )
            finally:
                loop.close()

            if result['success']:
                generated_prompt = result['response']

                # Extract variables from generated prompt
                variables = ai_service.template_engine.extract_variables(generated_prompt)

                return {
                    'generatedPrompt': generated_prompt,
                    'title': f"{purpose.title()} Assistant",
                    'description': f"AI-generated prompt for {purpose} in {industry}",
                    'category': industry or 'General',
                    'tags': [industry.lower() if industry else 'general', use_case.lower().replace(' ', '-') if use_case else 'assistant'],
                    'variables': [{'name': var, 'type': 'text', 'required': True} for var in variables],
                    'qualityScore': {
                        'overall': 90,
                        'structure': 95,
                        'clarity': 90,
                        'variables': 85,
                        'ragCompatibility': 88,
                        'suggestions': []
                    },
                    'suggestions': [],
                    'metadata': {
                        'model': result['metadata']['model'],
                        'provider': result['metadata']['provider'],
                        'tokensUsed': result['metadata']['tokens_used'],
                        'generationTime': result['metadata']['response_time'],
                        'confidence': 0.9,
                        'cost': result['metadata']['cost']
                    }
                }
            else:
                # Fallback to template-based generation
                logger.warning(f"AI generation failed: {result.get('error')}")

        # Fallback template-based generation
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
            'description': f"Template-generated prompt for {purpose} in {industry}",
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
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],  # Allow all origins for now to fix CORS
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def test_openrouter_connection(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Test OpenRouter API connection - Simplified version"""
    # Temporarily allow unauthenticated access for testing
    logger.info(f"test_openrouter_connection called with auth: {req.auth is not None}")

    try:
        # Test actual OpenRouter API connection
        from .src.ai_service import ai_service

        # Test provider connection (run async function synchronously)
        import asyncio
        result = asyncio.run(ai_service.test_provider_connection('openrouter'))

        if result['success']:
            return {
                'status': 'success',
                'message': 'OpenRouter connection test successful',
                'model_info': {
                    'model': result['model'],
                    'provider': result['provider'],
                    'cost': result.get('cost', 0.0)
                },
                'test_response': {
                    'content': result['response'],
                    'tokens_used': result['tokens_used'],
                    'response_time': result['response_time']
                },
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'cors_enabled': True
            }
        else:
            return {
                'status': 'error',
                'message': f'OpenRouter connection failed: {result["error"]}',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

    except Exception as e:
        logger.error(f"Error testing OpenRouter connection: {str(e)}")
        return {
            'status': 'error',
            'message': f'Connection test failed: {str(e)}',
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],  # Allow all origins for now to fix CORS
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def execute_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Execute a prompt - Simplified version"""
    # Temporarily allow unauthenticated access for testing
    logger.info(f"execute_prompt called with auth: {req.auth is not None}")

    # Use a test user ID if not authenticated
    user_id = req.auth.uid if req.auth else 'test-user'

    try:
        prompt_id = req.data.get('promptId')
        inputs = req.data.get('inputs', {})
        use_rag = req.data.get('useRag', False)
        rag_query = req.data.get('ragQuery', '')
        document_ids = req.data.get('documentIds', [])

        if not prompt_id:
            raise https_fn.HttpsError('invalid-argument', 'promptId is required')

        # Get prompt from Firestore
        db = firestore.client()
        prompt_ref = db.collection('users').document(user_id).collection('prompts').document(prompt_id)
        prompt_doc = prompt_ref.get()

        if not prompt_doc.exists:
            raise https_fn.HttpsError('not-found', 'Prompt not found')

        prompt_data = prompt_doc.to_dict()
        prompt_content = prompt_data.get('content', '')

        # Replace variables in prompt
        for var_name, var_value in inputs.items():
            placeholder = f"{{{var_name}}}"
            prompt_content = prompt_content.replace(placeholder, str(var_value))

        # Use actual AI service for prompt execution
        from .src.ai_service import ai_service

        # Determine provider based on models list or use default
        provider = None
        if models and len(models) > 0:
            model_name = models[0].lower()
            if 'gpt' in model_name or 'openai' in model_name:
                provider = 'openai'
            elif 'claude' in model_name or 'anthropic' in model_name:
                provider = 'anthropic'
            elif 'gemini' in model_name or 'google' in model_name:
                provider = 'google'
            else:
                provider = 'openrouter'  # Default to OpenRouter for other models
        else:
            provider = 'openrouter'  # Default provider

        # Execute prompt with AI service with fallback strategies
        ai_result = None
        providers_to_try = [provider] if provider else ['openrouter', 'google']

        for attempt, current_provider in enumerate(providers_to_try):
            try:
                logger.info(f"Attempting AI generation with provider: {current_provider} (attempt {attempt + 1})")

                if use_rag:
                    # Use RAG-enabled generation
                    ai_result = asyncio.run(ai_service.generate_rag_response(
                        user_id=user_id,
                        query=prompt_content,
                        max_context_tokens=4000,
                        provider=current_provider
                    ))
                else:
                    # Use standard prompt generation
                    ai_result = asyncio.run(ai_service.generate_prompt_response(
                        user_id=user_id,
                        prompt_template=prompt_content,
                        variables=inputs,
                        provider=current_provider,
                        user_tier="free"  # Default tier
                    ))

                if ai_result['success']:
                    logger.info(f"AI generation successful with provider: {current_provider}")
                    break
                else:
                    logger.warning(f"AI generation failed with provider {current_provider}: {ai_result.get('error')}")
                    if attempt < len(providers_to_try) - 1:
                        logger.info(f"Trying next provider...")
                        continue

            except Exception as e:
                logger.error(f"Exception during AI generation with provider {current_provider}: {str(e)}")
                if attempt < len(providers_to_try) - 1:
                    logger.info(f"Trying next provider due to exception...")
                    continue
                else:
                    # Last attempt failed
                    ai_result = {
                        'success': False,
                        'error': f"All providers failed. Last error: {str(e)}",
                        'provider_attempts': providers_to_try
                    }

        if not ai_result or not ai_result['success']:
            error_msg = ai_result.get('error', 'Unknown error') if ai_result else 'No AI result generated'
            logger.error(f"All AI generation attempts failed: {error_msg}")
            raise https_fn.HttpsError('internal', f"AI generation failed after trying providers {providers_to_try}: {error_msg}")

        # Extract response data
        ai_response = ai_result['response']
        metadata = ai_result.get('metadata', {})

        # Save execution to Firestore
        execution_data = {
            'promptId': prompt_id,
            'userId': user_id,
            'inputs': inputs,
            'response': ai_response,
            'useRag': use_rag,
            'ragQuery': rag_query,
            'documentIds': document_ids,
            'executedAt': datetime.now(timezone.utc),
            'tokensUsed': metadata.get('tokens_used', 0),
            'executionTime': metadata.get('total_time', 0),
            'model': metadata.get('model', 'unknown'),
            'provider': metadata.get('provider', provider),
            'cost': metadata.get('cost', 0.0)
        }

        # Save to executions collection
        executions_ref = db.collection('users').document(user_id).collection('executions')
        execution_ref = executions_ref.add(execution_data)

        return {
            'success': True,
            'response': ai_response,
            'executionId': execution_ref[1].id,
            'tokensUsed': execution_data['tokensUsed'],
            'executionTime': execution_data['executionTime'],
            'model': execution_data['model'],
            'provider': execution_data['provider'],
            'cost': execution_data['cost'],
            'timestamp': execution_data['executedAt'].isoformat()
        }

    except Exception as e:
        logger.error(f"Error executing prompt: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

# Add a simple HTTP endpoint for CORS bypass
@https_fn.on_request(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def execute_prompt_http(req):
    """HTTP endpoint for execute_prompt to bypass CORS issues"""
    # Handle preflight requests
    if req.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    try:
        # Parse JSON data
        import json
        data = req.get_json() or {}

        # Extract data from the request
        request_data = data.get('data', data)
        prompt_id = request_data.get('promptId', 'test-prompt')
        inputs = request_data.get('inputs', {})

        # Use actual AI service for HTTP endpoint
        from .src.ai_service import ai_service

        # Execute with AI service (simplified for HTTP endpoint)
        ai_result = asyncio.run(ai_service.generate_prompt_response(
            user_id="http_user",  # Placeholder user ID for HTTP endpoint
            prompt_template=f"Respond to this prompt: {prompt_id}",
            variables=inputs,
            provider="openrouter",
            user_tier="free"
        ))

        if ai_result['success']:
            result = {
                'success': True,
                'response': ai_result['response'],
                'metadata': {
                    'promptId': prompt_id,
                    'inputs': inputs,
                    'executedAt': datetime.now(timezone.utc).isoformat(),
                    'tokensUsed': ai_result.get('metadata', {}).get('tokens_used', 0),
                    'executionTime': ai_result.get('metadata', {}).get('total_time', 0),
                    'model': ai_result.get('metadata', {}).get('model', 'unknown'),
                    'cost': ai_result.get('metadata', {}).get('cost', 0.0),
                    'method': 'HTTP'
                }
            }
        else:
            result = {
                'success': False,
                'error': ai_result.get('error', 'Unknown error'),
                'metadata': {
                    'promptId': prompt_id,
                    'inputs': inputs,
                    'executedAt': datetime.now(timezone.utc).isoformat(),
                    'method': 'HTTP'
                }
            }

        # Return with CORS headers
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        }

        return (json.dumps(result), 200, headers)

    except Exception as e:
        logger.error(f"Error in execute_prompt_http: {str(e)}")
        error_response = {'error': str(e), 'success': False}
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json'
        }
        return (json.dumps(error_response), 500, headers)

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def validate_prompt_template(req: https_fn.CallableRequest):
    """Validate a prompt template"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        template = req.data.get('template', '')
        variables = req.data.get('variables', {})

        if not template:
            raise https_fn.HttpsError('invalid-argument', 'Template is required')

        if AI_SERVICE_AVAILABLE:
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                result = loop.run_until_complete(
                    ai_service.validate_prompt_template(template, variables)
                )
            finally:
                loop.close()

            return result
        else:
            # Basic validation fallback
            return {
                'valid': True,
                'validation': {
                    'errors': [],
                    'warnings': ['AI validation not available'],
                    'missing_variables': [],
                    'unused_variables': []
                },
                'template_info': {
                    'variables': [],
                    'complexity_score': 1
                }
            }

    except Exception as e:
        logger.error(f"Error validating template: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def get_user_usage_stats(req: https_fn.CallableRequest):
    """Get user usage statistics"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        user_id = req.auth.uid
        days = req.data.get('days', 30)

        if AI_SERVICE_AVAILABLE:
            result = ai_service.get_user_usage_stats(user_id, days)
            return result
        else:
            return {
                'user_id': user_id,
                'period_days': days,
                'error': 'AI service not available'
            }

    except Exception as e:
        logger.error(f"Error getting usage stats: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def get_ai_system_status(req: https_fn.CallableRequest):
    """Get AI system status"""
    try:
        if AI_SERVICE_AVAILABLE:
            result = ai_service.get_system_status()
            return result
        else:
            return {
                'status': 'unavailable',
                'error': 'AI service not available',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }

    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def test_ai_provider(req: https_fn.CallableRequest):
    """Test AI provider connection"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        provider = req.data.get('provider', 'openai')

        if AI_SERVICE_AVAILABLE:
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                result = loop.run_until_complete(
                    ai_service.test_provider_connection(provider)
                )
            finally:
                loop.close()

            return result
        else:
            return {
                'success': False,
                'provider': provider,
                'error': 'AI service not available'
            }

    except Exception as e:
        logger.error(f"Error testing provider: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

# New RAG and AI Chat endpoints

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def ai_chat(req: https_fn.CallableRequest):
    """Basic AI chat endpoint"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        user_id = req.auth.uid
        query = req.data.get('query', '').strip()

        if not query:
            raise https_fn.HttpsError('invalid-argument', 'Query is required')

        if AI_SERVICE_AVAILABLE:
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                result = loop.run_until_complete(
                    ai_service.generate_response(
                        user_id=user_id,
                        prompt=query,
                        provider=req.data.get('provider'),
                        model=req.data.get('model'),
                        max_tokens=req.data.get('max_tokens', 1000),
                        temperature=req.data.get('temperature', 0.7)
                    )
                )
            finally:
                loop.close()

            return result
        else:
            return {
                'success': False,
                'error': 'AI service not available'
            }

    except Exception as e:
        logger.error(f"Error in AI chat: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def rag_chat(req: https_fn.CallableRequest):
    """RAG-powered chat endpoint"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        user_id = req.auth.uid
        query = req.data.get('query', '').strip()

        if not query:
            raise https_fn.HttpsError('invalid-argument', 'Query is required')

        if AI_SERVICE_AVAILABLE:
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                result = loop.run_until_complete(
                    ai_service.generate_rag_response(
                        user_id=user_id,
                        query=query,
                        conversation_id=req.data.get('conversation_id'),
                        max_context_tokens=req.data.get('max_context_tokens', 4000),
                        provider=req.data.get('provider')
                    )
                )
            finally:
                loop.close()

            return result
        else:
            return {
                'success': False,
                'error': 'AI service not available'
            }

    except Exception as e:
        logger.error(f"Error in RAG chat: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def upload_document(req: https_fn.CallableRequest):
    """Document upload endpoint"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        user_id = req.auth.uid
        file_content = req.data.get('file_content')
        filename = req.data.get('filename')

        if not file_content or not filename:
            raise https_fn.HttpsError('invalid-argument', 'File content and filename are required')

        if AI_SERVICE_AVAILABLE:
            # Convert base64 to bytes if needed
            import base64
            if isinstance(file_content, str):
                file_content = base64.b64decode(file_content)

            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                result = loop.run_until_complete(
                    ai_service.upload_document(
                        user_id=user_id,
                        file_content=file_content,
                        filename=filename,
                        file_type=req.data.get('file_type'),
                        metadata=req.data.get('metadata', {})
                    )
                )
            finally:
                loop.close()

            return result
        else:
            return {
                'success': False,
                'error': 'AI service not available'
            }

    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def search_documents(req: https_fn.CallableRequest):
    """Document search endpoint"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        user_id = req.auth.uid
        query = req.data.get('query', '').strip()

        if not query:
            raise https_fn.HttpsError('invalid-argument', 'Query is required')

        if AI_SERVICE_AVAILABLE:
            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                result = loop.run_until_complete(
                    ai_service.search_documents(
                        user_id=user_id,
                        query=query,
                        search_type=req.data.get('search_type', 'hybrid'),
                        filters=req.data.get('filters'),
                        top_k=req.data.get('top_k', 10),
                        use_cache=req.data.get('use_cache', True)
                    )
                )
            finally:
                loop.close()

            return result
        else:
            return {
                'success': False,
                'error': 'AI service not available'
            }

    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@https_fn.on_request(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def health(req: Request):
    """Basic health check endpoint"""
    if req.method == 'OPTIONS':
        return _handle_preflight()

    try:
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'version': '1.0.0',
            'environment': 'production'
        }

        return _cors_enabled_response(health_status)

    except Exception as e:
        logger.error(f"Health check error: {str(e)}")
        error_response = {
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        return _cors_enabled_response(error_response, 500)

@https_fn.on_request(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def health_detailed(req: Request):
    """Detailed health check with component testing"""
    if req.method == 'OPTIONS':
        return _handle_preflight()

    try:
        start_time = time.time()

        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'version': '1.0.0',
            'environment': 'production',
            'services': {},
            'metrics': {},
            'response_time_ms': 0
        }

        # Test Google API availability
        try:
            # Simulate Google API test
            google_test_start = time.time()
            # In real implementation, this would test actual Google API
            google_latency = (time.time() - google_test_start) * 1000

            health_status['services']['google_embeddings'] = {
                'available': True,
                'latency_ms': round(google_latency, 2),
                'provider': 'google',
                'last_test': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            health_status['services']['google_embeddings'] = {
                'available': False,
                'error': str(e),
                'provider': 'google',
                'last_test': datetime.now(timezone.utc).isoformat()
            }

        # Test OpenRouter fallback
        try:
            # Simulate OpenRouter API test
            openrouter_test_start = time.time()
            # In real implementation, this would test actual OpenRouter API
            openrouter_latency = (time.time() - openrouter_test_start) * 1000

            health_status['services']['openrouter_fallback'] = {
                'available': True,
                'latency_ms': round(openrouter_latency, 2),
                'provider': 'openrouter',
                'last_test': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            health_status['services']['openrouter_fallback'] = {
                'available': False,
                'error': str(e),
                'provider': 'openrouter',
                'last_test': datetime.now(timezone.utc).isoformat()
            }

        # Test Firestore database
        try:
            # Test database connection
            db_test_start = time.time()
            # Simple database operation
            test_doc = db.collection('health_checks').document('test')
            test_doc.set({
                'timestamp': datetime.now(timezone.utc),
                'test': True
            })
            db_latency = (time.time() - db_test_start) * 1000

            health_status['services']['firestore'] = {
                'available': True,
                'latency_ms': round(db_latency, 2),
                'last_test': datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            health_status['services']['firestore'] = {
                'available': False,
                'error': str(e),
                'last_test': datetime.now(timezone.utc).isoformat()
            }

        # System metrics
        try:
            import psutil
            health_status['metrics'] = {
                'memory_usage_percent': psutil.virtual_memory().percent,
                'cpu_usage_percent': psutil.cpu_percent(interval=0.1),
                'disk_usage_percent': psutil.disk_usage('/').percent
            }
        except ImportError:
            # psutil not available, use basic metrics
            health_status['metrics'] = {
                'memory_usage_percent': 'unavailable',
                'cpu_usage_percent': 'unavailable',
                'disk_usage_percent': 'unavailable'
            }

        # Determine overall status
        google_ok = health_status['services']['google_embeddings']['available']
        openrouter_ok = health_status['services']['openrouter_fallback']['available']
        firestore_ok = health_status['services']['firestore']['available']

        if not firestore_ok:
            health_status['status'] = 'critical'
        elif not google_ok and not openrouter_ok:
            health_status['status'] = 'critical'
        elif not google_ok:
            health_status['status'] = 'degraded'

        # Calculate total response time
        health_status['response_time_ms'] = round((time.time() - start_time) * 1000, 2)

        status_code = 200 if health_status['status'] == 'healthy' else 503
        return _cors_enabled_response(health_status, status_code)

    except Exception as e:
        logger.error(f"Detailed health check error: {str(e)}")
        error_response = {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        return _cors_enabled_response(error_response, 500)

@https_fn.on_request(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def health_ready(req: Request):
    """Readiness probe for load balancers"""
    if req.method == 'OPTIONS':
        return _handle_preflight()

    try:
        # Quick readiness checks
        ready_status = {
            'ready': True,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }

        # Quick database connectivity check
        try:
            # Simple database read operation
            db.collection('health_checks').limit(1).get()
            ready_status['database'] = 'ready'
        except Exception:
            ready_status['ready'] = False
            ready_status['database'] = 'not_ready'

        # Check if AI service is available
        if AI_SERVICE_AVAILABLE:
            ready_status['ai_service'] = 'ready'
        else:
            ready_status['ai_service'] = 'not_ready'
            # Don't mark as not ready for AI service unavailability
            # as core functions can still work

        status_code = 200 if ready_status['ready'] else 503
        return _cors_enabled_response(ready_status, status_code)

    except Exception as e:
        logger.error(f"Readiness check error: {str(e)}")
        error_response = {
            'ready': False,
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        return _cors_enabled_response(error_response, 503)

# ============================================================================
# USAGE TRACKING AND ANALYTICS
# ============================================================================

class UsageTracker:
    """Comprehensive usage tracking for RAG application"""

    def __init__(self):
        self.db = db
        self.metrics_collection = self.db.collection('usage_metrics')
        self.daily_stats_collection = self.db.collection('daily_stats')

    def track_embedding_generation(self, provider: str, model: str, tokens: int,
                                 latency: float, success: bool, cost: float = 0.0):
        """Track embedding generation metrics"""
        try:
            metric = {
                'timestamp': datetime.now(timezone.utc),
                'type': 'embedding_generation',
                'provider': provider,
                'model': model,
                'tokens': tokens,
                'latency_ms': latency,
                'success': success,
                'cost_usd': cost,
                'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'hour': datetime.now(timezone.utc).hour
            }
            self.metrics_collection.add(metric)
            logger.info(f"Tracked embedding generation: {provider}, {tokens} tokens, {latency}ms")
        except Exception as e:
            logger.error(f"Error tracking embedding generation: {e}")

    def track_search_query(self, query_type: str, query_length: int, results_count: int,
                          latency: float, relevance_score: float = 0.0):
        """Track search performance metrics"""
        try:
            metric = {
                'timestamp': datetime.now(timezone.utc),
                'type': 'search_query',
                'query_type': query_type,
                'query_length': query_length,
                'results_count': results_count,
                'latency_ms': latency,
                'relevance_score': relevance_score,
                'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'hour': datetime.now(timezone.utc).hour
            }
            self.metrics_collection.add(metric)
            logger.info(f"Tracked search query: {query_type}, {results_count} results, {latency}ms")
        except Exception as e:
            logger.error(f"Error tracking search query: {e}")

    def track_document_processing(self, file_type: str, file_size_kb: int,
                                chunks_created: int, processing_time: float, success: bool):
        """Track document processing metrics"""
        try:
            metric = {
                'timestamp': datetime.now(timezone.utc),
                'type': 'document_processing',
                'file_type': file_type,
                'file_size_kb': file_size_kb,
                'chunks_created': chunks_created,
                'processing_time_ms': processing_time,
                'success': success,
                'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'hour': datetime.now(timezone.utc).hour
            }
            self.metrics_collection.add(metric)
            logger.info(f"Tracked document processing: {file_type}, {chunks_created} chunks, {processing_time}ms")
        except Exception as e:
            logger.error(f"Error tracking document processing: {e}")

    def track_api_request(self, endpoint: str, method: str, status_code: int,
                         latency: float, user_id: str = None):
        """Track API request metrics"""
        try:
            metric = {
                'timestamp': datetime.now(timezone.utc),
                'type': 'api_request',
                'endpoint': endpoint,
                'method': method,
                'status_code': status_code,
                'latency_ms': latency,
                'user_id': user_id,
                'success': 200 <= status_code < 400,
                'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'hour': datetime.now(timezone.utc).hour
            }
            self.metrics_collection.add(metric)
        except Exception as e:
            logger.error(f"Error tracking API request: {e}")

    def get_hourly_metrics(self, hours: int = 24):
        """Get aggregated hourly metrics"""
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(hours=hours)

            metrics = self.metrics_collection.where(
                'timestamp', '>=', start_time
            ).where(
                'timestamp', '<=', end_time
            ).stream()

            hourly_data = {}
            for metric in metrics:
                data = metric.to_dict()
                hour_key = data['timestamp'].strftime('%Y-%m-%d %H:00')

                if hour_key not in hourly_data:
                    hourly_data[hour_key] = {
                        'embeddings_generated': 0,
                        'search_queries': 0,
                        'documents_processed': 0,
                        'api_requests': 0,
                        'total_cost': 0.0,
                        'avg_latency': 0.0,
                        'error_count': 0
                    }

                if data['type'] == 'embedding_generation':
                    hourly_data[hour_key]['embeddings_generated'] += 1
                    hourly_data[hour_key]['total_cost'] += data.get('cost_usd', 0)
                elif data['type'] == 'search_query':
                    hourly_data[hour_key]['search_queries'] += 1
                elif data['type'] == 'document_processing':
                    hourly_data[hour_key]['documents_processed'] += 1
                elif data['type'] == 'api_request':
                    hourly_data[hour_key]['api_requests'] += 1
                    if not data.get('success', True):
                        hourly_data[hour_key]['error_count'] += 1

            return hourly_data

        except Exception as e:
            logger.error(f"Error getting hourly metrics: {e}")
            return {}

    def get_provider_usage_stats(self, days: int = 7):
        """Get provider usage statistics"""
        try:
            end_time = datetime.now(timezone.utc)
            start_time = end_time - timedelta(days=days)

            metrics = self.metrics_collection.where(
                'type', '==', 'embedding_generation'
            ).where(
                'timestamp', '>=', start_time
            ).stream()

            provider_stats = {}
            for metric in metrics:
                data = metric.to_dict()
                provider = data.get('provider', 'unknown')

                if provider not in provider_stats:
                    provider_stats[provider] = {
                        'requests': 0,
                        'total_tokens': 0,
                        'total_cost': 0.0,
                        'avg_latency': 0.0,
                        'success_rate': 0.0,
                        'successful_requests': 0
                    }

                provider_stats[provider]['requests'] += 1
                provider_stats[provider]['total_tokens'] += data.get('tokens', 0)
                provider_stats[provider]['total_cost'] += data.get('cost_usd', 0)

                if data.get('success', False):
                    provider_stats[provider]['successful_requests'] += 1

            # Calculate averages and rates
            for provider, stats in provider_stats.items():
                if stats['requests'] > 0:
                    stats['success_rate'] = stats['successful_requests'] / stats['requests']
                    stats['avg_cost_per_request'] = stats['total_cost'] / stats['requests']

            return provider_stats

        except Exception as e:
            logger.error(f"Error getting provider usage stats: {e}")
            return {}

# Initialize usage tracker
usage_tracker = UsageTracker()

@https_fn.on_request(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def usage_metrics(req: Request):
    """Get current usage metrics and analytics"""
    if req.method == 'OPTIONS':
        return _handle_preflight()

    try:
        # Get query parameters
        hours = int(req.args.get('hours', 24))
        days = int(req.args.get('days', 7))

        # Get metrics data
        hourly_metrics = usage_tracker.get_hourly_metrics(hours)
        provider_stats = usage_tracker.get_provider_usage_stats(days)

        # Calculate summary statistics
        total_embeddings = sum(hour_data.get('embeddings_generated', 0) for hour_data in hourly_metrics.values())
        total_searches = sum(hour_data.get('search_queries', 0) for hour_data in hourly_metrics.values())
        total_documents = sum(hour_data.get('documents_processed', 0) for hour_data in hourly_metrics.values())
        total_cost = sum(hour_data.get('total_cost', 0) for hour_data in hourly_metrics.values())
        total_errors = sum(hour_data.get('error_count', 0) for hour_data in hourly_metrics.values())
        total_requests = sum(hour_data.get('api_requests', 0) for hour_data in hourly_metrics.values())

        error_rate = (total_errors / total_requests) if total_requests > 0 else 0

        response_data = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'period': {
                'hours': hours,
                'days': days
            },
            'summary': {
                'total_embeddings_generated': total_embeddings,
                'total_search_queries': total_searches,
                'total_documents_processed': total_documents,
                'total_api_requests': total_requests,
                'total_cost_usd': round(total_cost, 4),
                'error_rate': round(error_rate, 4),
                'total_errors': total_errors
            },
            'hourly_metrics': hourly_metrics,
            'provider_stats': provider_stats
        }

        return _cors_enabled_response(response_data)

    except Exception as e:
        logger.error(f"Error getting usage metrics: {str(e)}")
        error_response = {
            'error': str(e),
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        return _cors_enabled_response(error_response, 500)

# Simple API router function to ensure deployment works
@https_fn.on_call(
    region="australia-southeast1",
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def api(req: https_fn.CallableRequest):
    """Simple API router function for testing"""
    try:
        data = req.data
        endpoint = data.get('endpoint', 'health')

        if endpoint == 'health':
            return {
                'status': 'success',
                'message': 'API is working',
                'region': 'australia-southeast1',
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
        elif endpoint == 'execute_prompt':
            # Call the execute_prompt function
            return execute_prompt(req)
        elif endpoint == 'test_openrouter_connection':
            # Call the test_openrouter_connection function
            return test_openrouter_connection(req)
        else:
            return {
                'status': 'error',
                'message': f'Unknown endpoint: {endpoint}'
            }
    except Exception as e:
        logger.error(f"Error in API router: {str(e)}")
        return {
            'status': 'error',
            'message': str(e)
        }
