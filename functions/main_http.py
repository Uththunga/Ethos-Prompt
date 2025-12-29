"""
HTTP Functions version to fix CORS issues
"""
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore
import logging
from typing import Any, Dict
from datetime import datetime, timezone
import json
from flask import Request

# Initialize Firebase Admin
initialize_app()

logger = logging.getLogger(__name__)

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

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def execute_prompt_http(req: Request):
    """HTTP version of execute_prompt to fix CORS issues"""
    # Handle preflight requests
    if req.method == 'OPTIONS':
        return _handle_preflight()
    
    try:
        # Parse JSON data
        data = req.get_json() or {}
        prompt_id = data.get('promptId')
        inputs = data.get('inputs', {})
        use_rag = data.get('useRag', False)
        rag_query = data.get('ragQuery', '')
        document_ids = data.get('documentIds', [])
        
        if not prompt_id:
            return _cors_enabled_response({'error': 'promptId is required'}, 400)
        
        # For testing, return a mock response
        mock_response = f"This is a mock response for prompt {prompt_id} with inputs: {inputs}"
        
        result = {
            'success': True,
            'response': mock_response,
            'metadata': {
                'promptId': prompt_id,
                'inputs': inputs,
                'useRag': use_rag,
                'ragQuery': rag_query,
                'documentIds': document_ids,
                'executedAt': datetime.now(timezone.utc).isoformat(),
                'tokensUsed': len(mock_response.split()) * 1.3,
                'executionTime': 0.5,
                'model': 'mock-model',
                'cost': 0.0
            }
        }
        
        return _cors_enabled_response(result)
        
    except Exception as e:
        logger.error(f"Error in execute_prompt_http: {str(e)}")
        return _cors_enabled_response({'error': str(e)}, 500)

@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=["*"],
        cors_methods=["GET", "POST", "OPTIONS"],
        cors_headers=["Content-Type", "Authorization"]
    )
)
def test_connection_http(req: Request):
    """HTTP version of test connection to fix CORS issues"""
    # Handle preflight requests
    if req.method == 'OPTIONS':
        return _handle_preflight()
    
    try:
        result = {
            'status': 'success',
            'message': 'HTTP connection test successful',
            'model_info': {
                'model': 'llama-3.2-11b',
                'provider': 'OpenRouter'
            },
            'test_response': {
                'content': 'This is a test response from the HTTP function.',
                'tokens_used': 150,
                'response_time': 2.3
            },
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'cors_enabled': True,
            'method': 'HTTP'
        }
        
        return _cors_enabled_response(result)
        
    except Exception as e:
        logger.error(f"Error in test_connection_http: {str(e)}")
        return _cors_enabled_response({'error': str(e)}, 500)
