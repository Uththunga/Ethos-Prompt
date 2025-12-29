"""
AI API Endpoints - Flask routes for AI functionality
"""
import logging
from flask import Blueprint, request, jsonify
from functools import wraps
import asyncio
from datetime import datetime

from ..ai_service import ai_service
from ..auth.auth_middleware import require_auth

logger = logging.getLogger(__name__)

# Create blueprint
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

def async_route(f):
    """Decorator to handle async routes in Flask"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(f(*args, **kwargs))
        finally:
            loop.close()
    return wrapper

@ai_bp.route('/chat', methods=['POST'])
@require_auth
@async_route
async def chat():
    """
    Basic AI chat endpoint
    """
    try:
        data = request.get_json()
        user_id = request.user_id  # From auth middleware
        
        # Validate request
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        query = data['query'].strip()
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query cannot be empty'
            }), 400
        
        # Generate response
        response = await ai_service.generate_response(
            user_id=user_id,
            prompt=query,
            provider=data.get('provider'),
            model=data.get('model'),
            max_tokens=data.get('max_tokens', 1000),
            temperature=data.get('temperature', 0.7)
        )
        
        if response['success']:
            return jsonify({
                'success': True,
                'response': response['content'],
                'metadata': {
                    'provider': response['provider'],
                    'model': response['model'],
                    'tokens_used': response['tokens_used'],
                    'cost': response['cost'],
                    'response_time': response['response_time']
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': response['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/rag-chat', methods=['POST'])
@require_auth
@async_route
async def rag_chat():
    """
    RAG-powered chat endpoint
    """
    try:
        data = request.get_json()
        user_id = request.user_id
        
        # Validate request
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        query = data['query'].strip()
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query cannot be empty'
            }), 400
        
        # Generate RAG response
        response = await ai_service.generate_rag_response(
            user_id=user_id,
            query=query,
            conversation_id=data.get('conversation_id'),
            max_context_tokens=data.get('max_context_tokens', 4000),
            provider=data.get('provider')
        )
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"RAG chat endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/upload-document', methods=['POST'])
@require_auth
@async_route
async def upload_document():
    """
    Document upload endpoint
    """
    try:
        user_id = request.user_id
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file provided'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Get filename from form data or file
        filename = request.form.get('filename', file.filename)
        
        # Read file content
        file_content = file.read()
        
        # Upload document
        response = await ai_service.upload_document(
            user_id=user_id,
            file_content=file_content,
            filename=filename,
            file_type=file.content_type,
            metadata={
                'uploaded_at': datetime.now().isoformat(),
                'file_size': len(file_content)
            }
        )
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Document upload endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/search-documents', methods=['POST'])
@require_auth
@async_route
async def search_documents():
    """
    Document search endpoint
    """
    try:
        data = request.get_json()
        user_id = request.user_id
        
        # Validate request
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        query = data['query'].strip()
        if not query:
            return jsonify({
                'success': False,
                'error': 'Query cannot be empty'
            }), 400
        
        # Search documents
        response = await ai_service.search_documents(
            user_id=user_id,
            query=query,
            search_type=data.get('search_type', 'hybrid'),
            filters=data.get('filters'),
            top_k=data.get('top_k', 10),
            use_cache=data.get('use_cache', True)
        )
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Document search endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/document-status/<job_id>', methods=['GET'])
@require_auth
def document_status(job_id):
    """
    Get document processing status
    """
    try:
        user_id = request.user_id
        
        # Get job status
        job_status = ai_service.document_processor.get_job_status(job_id)
        
        if not job_status:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        
        # Check if user owns this job
        if job_status.get('user_id') != user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'status': job_status.get('status'),
            'document_id': job_status.get('document_id'),
            'progress': job_status.get('progress', 0),
            'error_message': job_status.get('error_message'),
            'created_at': job_status.get('created_at'),
            'updated_at': job_status.get('updated_at')
        })
        
    except Exception as e:
        logger.error(f"Document status endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/usage-stats', methods=['GET'])
@require_auth
def usage_stats():
    """
    Get user usage statistics
    """
    try:
        user_id = request.user_id
        days = request.args.get('days', 30, type=int)
        
        # Get usage stats
        stats = ai_service.cost_tracker.get_cost_breakdown(user_id, days=days)
        
        return jsonify({
            'success': True,
            'total_requests': stats.get('total_requests', 0),
            'total_tokens': stats.get('total_tokens', 0),
            'total_cost': float(stats.get('total_cost', 0)),
            'documents_processed': stats.get('documents_processed', 0),
            'avg_response_time': stats.get('avg_response_time', 0),
            'period_days': days,
            'breakdown': stats.get('breakdown', {})
        })
        
    except Exception as e:
        logger.error(f"Usage stats endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/system-status', methods=['GET'])
def system_status():
    """
    Get system status (public endpoint)
    """
    try:
        # Get provider status
        provider_status = ai_service.llm_manager.get_provider_status()
        available_providers = ai_service.llm_manager.get_available_providers()
        
        # Check service availability
        services = {
            'llm_service': ai_service.llm_manager.is_available(),
            'vector_store': ai_service.hybrid_search.vector_store.is_available(),
            'embedding_service': ai_service.hybrid_search.semantic_engine.embedding_service.is_available(),
            'cache_service': ai_service.cache_manager.l2_cache.client is not None,
            'document_processor': True  # Always available
        }
        
        # Determine overall status
        critical_services = ['llm_service', 'document_processor']
        overall_status = 'healthy'
        
        if not all(services[service] for service in critical_services):
            overall_status = 'critical'
        elif not all(services.values()):
            overall_status = 'degraded'
        
        return jsonify({
            'success': True,
            'status': overall_status,
            'providers': {
                'available': available_providers,
                'status': provider_status
            },
            'services': services,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"System status endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/conversations', methods=['GET'])
@require_auth
@async_route
async def get_conversations():
    """
    Get user conversations
    """
    try:
        user_id = request.user_id
        limit = request.args.get('limit', 20, type=int)
        
        conversations = await ai_service.conversation_memory.get_user_conversations(
            user_id, limit=limit
        )
        
        # Convert to JSON-serializable format
        conversation_list = []
        for conv in conversations:
            conversation_list.append({
                'conversation_id': conv.conversation_id,
                'created_at': conv.created_at.isoformat(),
                'updated_at': conv.updated_at.isoformat(),
                'message_count': len(conv.messages),
                'total_tokens': conv.total_tokens,
                'last_message': conv.messages[-1].content[:100] + '...' if conv.messages else None
            })
        
        return jsonify({
            'success': True,
            'conversations': conversation_list
        })
        
    except Exception as e:
        logger.error(f"Get conversations endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@ai_bp.route('/conversations/<conversation_id>', methods=['DELETE'])
@require_auth
@async_route
async def delete_conversation(conversation_id):
    """
    Delete a conversation
    """
    try:
        user_id = request.user_id
        
        # Get conversation to verify ownership
        conversation = await ai_service.conversation_memory.get_conversation(conversation_id)
        
        if not conversation:
            return jsonify({
                'success': False,
                'error': 'Conversation not found'
            }), 404
        
        if conversation.user_id != user_id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403
        
        # Delete conversation
        success = await ai_service.conversation_memory.delete_conversation(conversation_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Conversation deleted'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete conversation'
            }), 500
        
    except Exception as e:
        logger.error(f"Delete conversation endpoint error: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# Error handlers
@ai_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request'
    }), 400

@ai_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'error': 'Unauthorized'
    }), 401

@ai_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'error': 'Forbidden'
    }), 403

@ai_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Not found'
    }), 404

@ai_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500
