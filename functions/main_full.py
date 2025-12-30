from firebase_functions import https_fn, firestore_fn, storage_fn, options
from firebase_admin import initialize_app, firestore, storage
import json
import os
import asyncio
from typing import Any, Dict, List
import logging

# Import RAG components
from src.rag.document_processor import DocumentProcessor
from src.rag.text_chunker import TextChunker, ChunkingConfig
from src.rag.embedding_generator import EmbeddingGenerator, EmbeddingConfig
from src.rag.vector_store import FAISSVectorStore
from src.rag.context_retriever import ContextRetriever, RetrievalConfig

# Import LLM components
from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from src.llm.token_counter import TokenCounter

# Initialize Firebase Admin
initialize_app()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize RAG components
document_processor = DocumentProcessor()
text_chunker = TextChunker()
embedding_generator = EmbeddingGenerator(api_key=os.environ.get('OPENROUTER_API_KEY'))
context_retriever = ContextRetriever(embedding_generator)

# Initialize LLM components
openrouter_config = OpenRouterConfig(
    api_key=os.environ.get('OPENROUTER_API_KEY', ''),
    model="meta-llama/llama-3.2-11b-vision-instruct:free"
)
token_counter = TokenCounter(model=openrouter_config.model)

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
def execute_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Execute a prompt with optional RAG context"""
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

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
        prompt_ref = db.collection('users').document(req.auth.uid).collection('prompts').document(prompt_id)
        prompt_doc = prompt_ref.get()

        if not prompt_doc.exists:
            raise https_fn.HttpsError('not-found', 'Prompt not found')

        prompt_data = prompt_doc.to_dict()

        # Run async execution
        result = asyncio.run(_execute_prompt_async(
            req.auth.uid, prompt_data, inputs, use_rag, rag_query, document_ids
        ))

        # Save execution to Firestore
        execution_ref = prompt_ref.collection('executions').document()
        execution_ref.set({
            'inputs': inputs,
            'outputs': result,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'useRag': use_rag,
            'ragQuery': rag_query if use_rag else None,
            'documentIds': document_ids if use_rag else None,
            'status': 'completed'
        })

        return result

    except Exception as e:
        logger.error(f"Error executing prompt: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

async def _execute_prompt_async(user_id: str, prompt_data: Dict, inputs: Dict,
                               use_rag: bool, rag_query: str, document_ids: List[str]) -> Dict[str, Any]:
    """Async prompt execution implementation with OpenRouter LLM"""
    try:
        prompt_content = prompt_data.get('content', '')
        prompt_title = prompt_data.get('title', 'Untitled')

        # Replace variables in prompt
        for var_name, var_value in inputs.items():
            placeholder = f"{{{var_name}}}"
            prompt_content = prompt_content.replace(placeholder, str(var_value))

        context = ""
        context_metadata = {}

        # Retrieve RAG context if requested
        if use_rag and rag_query:
            logger.info(f"Retrieving RAG context for query: {rag_query}")
            context_response = await context_retriever.retrieve_context(
                user_id, rag_query, document_ids if document_ids else None
            )
            context = context_response.get('context', '')
            context_metadata = context_response.get('metadata', {})

        # Create system prompt for better responses
        system_prompt = f"""You are an AI assistant helping with the prompt titled "{prompt_title}".
Provide helpful, accurate, and well-structured responses. If context information is provided, use it to enhance your response while being clear about what information comes from the context versus your general knowledge."""

        # Generate response using OpenRouter
        async with OpenRouterClient(openrouter_config) as llm_client:
            if context:
                # Use context-enhanced generation
                llm_response = await llm_client.generate_with_context(
                    prompt=prompt_content,
                    context=context,
                    system_prompt=system_prompt
                )
            else:
                # Standard generation without context
                llm_response = await llm_client.generate_response(
                    prompt=prompt_content,
                    system_prompt=system_prompt
                )

        # Prepare result
        result = {
            'output': llm_response.content,
            'context': context,
            'metadata': {
                'model': llm_response.model,
                'executionTime': llm_response.response_time,
                'tokensUsed': llm_response.usage.get('total_tokens', 0),
                'promptTokens': llm_response.usage.get('prompt_tokens', 0),
                'completionTokens': llm_response.usage.get('completion_tokens', 0),
                'cost': llm_response.cost_estimate,
                'finishReason': llm_response.finish_reason,
                'useRag': use_rag,
                'contextMetadata': context_metadata
            }
        }

        logger.info(f"Successfully executed prompt with {llm_response.usage.get('total_tokens', 0)} tokens")
        return result

    except Exception as e:
        logger.error(f"Error in async prompt execution: {str(e)}")
        # Return error response instead of raising
        return {
            'output': f"Error executing prompt: {str(e)}",
            'context': context if 'context' in locals() else "",
            'metadata': {
                'model': openrouter_config.model,
                'executionTime': 0,
                'tokensUsed': 0,
                'cost': 0,
                'error': str(e),
                'useRag': use_rag,
                'contextMetadata': context_metadata if 'context_metadata' in locals() else {}
            }
        }

@firestore_fn.on_document_created(document="rag_documents/{doc_id}")
def process_document(event: firestore_fn.Event[firestore_fn.DocumentSnapshot]):
    """Process uploaded documents for RAG"""
    try:
        doc_data = event.data.to_dict()
        doc_id = event.params['doc_id']

        logger.info(f"Processing document: {doc_id}")

        # Run async processing
        asyncio.run(_process_document_async(doc_id, doc_data))

    except Exception as e:
        logger.error(f"Error in document processing trigger: {str(e)}")
        # Update document status to failed
        db = firestore.client()
        doc_ref = db.collection('rag_documents').document(doc_id)
        doc_ref.update({
            'status': 'failed',
            'error': str(e),
            'processedAt': firestore.SERVER_TIMESTAMP
        })

async def _process_document_async(doc_id: str, doc_data: Dict):
    """Async document processing implementation"""
    db = firestore.client()
    doc_ref = db.collection('rag_documents').document(doc_id)

    try:
        # Update status to processing
        doc_ref.update({
            'status': 'processing',
            'processingStartedAt': firestore.SERVER_TIMESTAMP
        })

        # Extract file path from document data
        file_path = doc_data.get('filePath')
        if not file_path:
            raise ValueError("No file path found in document data")

        # Step 1: Process document and extract text
        logger.info(f"Extracting text from document: {doc_id}")
        processed_doc = await document_processor.process_document(doc_id, file_path)

        # Step 2: Chunk the text
        logger.info(f"Chunking text for document: {doc_id}")
        chunks = text_chunker.chunk_text(
            processed_doc['text_content'],
            doc_id,
            processed_doc['metadata']
        )

        if not chunks:
            raise ValueError("No chunks generated from document")

        # Step 3: Generate embeddings
        logger.info(f"Generating embeddings for {len(chunks)} chunks")
        chunks_with_embeddings = await embedding_generator.generate_embeddings(chunks)

        # Step 4: Store chunks in Firestore
        logger.info(f"Storing chunks in Firestore")
        chunk_refs = []
        for chunk in chunks_with_embeddings:
            chunk_ref = doc_ref.collection('chunks').document(chunk['id'])
            chunk_ref.set({
                'content': chunk['content'],
                'metadata': chunk['metadata'],
                'embedding': chunk.get('embedding'),
                'createdAt': firestore.SERVER_TIMESTAMP
            })
            chunk_refs.append(chunk_ref.id)

        # Step 5: Add chunks to vector store
        logger.info(f"Adding chunks to vector store")
        user_id = doc_data.get('uploadedBy')
        if user_id:
            vector_store = FAISSVectorStore(user_id)
            await vector_store.add_chunks(chunks_with_embeddings)
        else:
            logger.warning("No user ID found for vector store update")

        # Step 6: Update document status
        embedding_stats = embedding_generator.get_embedding_stats(chunks_with_embeddings)
        doc_ref.update({
            'status': 'completed',
            'processedAt': firestore.SERVER_TIMESTAMP,
            'textContent': processed_doc['text_content'][:1000] + '...' if len(processed_doc['text_content']) > 1000 else processed_doc['text_content'],
            'processingMetadata': {
                **processed_doc['metadata'],
                'chunk_count': len(chunks_with_embeddings),
                'embedding_stats': embedding_stats
            },
            'chunkIds': chunk_refs
        })

        logger.info(f"Successfully processed document {doc_id} with {len(chunks_with_embeddings)} chunks")

    except Exception as e:
        logger.error(f"Error processing document {doc_id}: {str(e)}")
        doc_ref.update({
            'status': 'failed',
            'error': str(e),
            'processedAt': firestore.SERVER_TIMESTAMP
        })
        raise

        logger.info(f"Document processed successfully: {doc_id}")

    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        # Update document status to failed
        try:
            db = firestore.client()
            doc_ref = db.collection('rag_documents').document(event.params['doc_id'])
            doc_ref.update({
                'status': 'failed',
                'error': str(e),
                'processedAt': firestore.SERVER_TIMESTAMP
            })
        except:
            pass

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
def search_prompts(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Search prompts with filters"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        query = req.data.get('query', '')
        tags = req.data.get('tags', [])
        category = req.data.get('category', '')
        limit = req.data.get('limit', 20)

        db = firestore.client()
        prompts_ref = db.collection('users').document(req.auth.uid).collection('prompts')

        # Build query
        query_ref = prompts_ref

        if category:
            query_ref = query_ref.where('category', '==', category)

        if tags:
            query_ref = query_ref.where('tags', 'array-contains-any', tags)

        # Order by creation date and limit
        query_ref = query_ref.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit)

        results = query_ref.get()

        prompts = []
        for doc in results:
            prompt_data = doc.to_dict()
            prompt_data['id'] = doc.id
            prompts.append(prompt_data)

        return {
            'prompts': prompts,
            'total': len(prompts)
        }

    except Exception as e:
        logger.error(f"Error searching prompts: {str(e)}")
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
    """Test OpenRouter API connection and model info"""
    # Verify authentication
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # Run async test
        result = asyncio.run(_test_openrouter_async())
        return result

    except Exception as e:
        logger.error(f"Error testing OpenRouter connection: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

async def _test_openrouter_async() -> Dict[str, Any]:
    """Async OpenRouter connection test"""
    try:
        async with OpenRouterClient(openrouter_config) as llm_client:
            # Test API key validation
            is_valid = await llm_client.validate_api_key()

            if not is_valid:
                return {
                    'status': 'error',
                    'message': 'Invalid API key or connection failed',
                    'model_info': llm_client.get_model_info()
                }

            # Test simple generation
            test_response = await llm_client.generate_response(
                prompt="Hello! Please respond with a brief greeting.",
                system_prompt="You are a helpful AI assistant. Keep responses concise."
            )

            return {
                'status': 'success',
                'message': 'OpenRouter connection successful',
                'test_response': {
                    'content': test_response.content,
                    'model': test_response.model,
                    'tokens_used': test_response.usage.get('total_tokens', 0),
                    'response_time': test_response.response_time,
                    'cost': test_response.cost_estimate
                },
                'model_info': llm_client.get_model_info()
            }

    except Exception as e:
        logger.error(f"OpenRouter test failed: {str(e)}")
        return {
            'status': 'error',
            'message': f'Test failed: {str(e)}',
            'model_info': {
                'model': openrouter_config.model,
                'configured': True
            }
        }

    except Exception as e:
        logger.error(f"Error searching prompts: {str(e)}")
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
def get_analytics(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Get user analytics and usage statistics"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        db = firestore.client()
        user_ref = db.collection('users').document(req.auth.uid)

        # Get prompt count
        prompts_ref = user_ref.collection('prompts')
        prompts_count = len(prompts_ref.get())

        # Get execution count (simplified - in production, use aggregation)
        executions_count = 0
        for prompt_doc in prompts_ref.get():
            executions = prompt_doc.reference.collection('executions').get()
            executions_count += len(executions)

        # TODO: Add more analytics like cost tracking, performance metrics, etc.

        return {
            'promptsCount': prompts_count,
            'executionsCount': executions_count,
            'totalCost': 0.0,  # TODO: Calculate actual cost
            'avgExecutionTime': 1.5  # TODO: Calculate actual average
        }

    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
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
def generate_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Generate an AI-optimized prompt based on user requirements"""
    if not req.auth:
        raise https_fn.HttpsError('unauthenticated', 'User must be authenticated')

    try:
        # Extract request data
        purpose = req.data.get('purpose', '')
        industry = req.data.get('industry', '')
        use_case = req.data.get('useCase', '')
        target_audience = req.data.get('targetAudience', '')
        input_variables = req.data.get('inputVariables', [])
        output_format = req.data.get('outputFormat', 'paragraph')
        tone = req.data.get('tone', 'professional')
        length = req.data.get('length', 'medium')
        include_rag = req.data.get('includeRAG', False)
        additional_requirements = req.data.get('additionalRequirements', '')

        if not purpose:
            raise https_fn.HttpsError('invalid-argument', 'Purpose is required')

        # Run async generation
        result = asyncio.run(_generate_prompt_async(
            purpose, industry, use_case, target_audience, input_variables,
            output_format, tone, length, include_rag, additional_requirements
        ))

        return result

    except Exception as e:
        logger.error(f"Error generating prompt: {str(e)}")
        raise https_fn.HttpsError('internal', str(e))

async def _generate_prompt_async(purpose: str, industry: str, use_case: str,
                                target_audience: str, input_variables: List[Dict],
                                output_format: str, tone: str, length: str,
                                include_rag: bool, additional_requirements: str) -> Dict[str, Any]:
    """Async prompt generation implementation"""
    try:
        # Build the generation prompt
        generation_prompt = _build_generation_prompt(
            purpose, industry, use_case, target_audience, input_variables,
            output_format, tone, length, include_rag, additional_requirements
        )

        system_prompt = """You are an expert prompt engineer specializing in creating high-quality, effective AI prompts. Your task is to generate optimized prompts based on user requirements.

Guidelines:
1. Create clear, specific, and actionable prompts
2. Include appropriate variable placeholders using {{variable_name}} syntax
3. Apply industry-specific best practices
4. Ensure the tone matches the requested style
5. Structure the prompt for optimal AI model performance
6. Include context instructions when RAG is requested

Return your response as a JSON object with the following structure:
{
  "generatedPrompt": "The actual prompt content",
  "title": "A descriptive title for the prompt",
  "description": "Brief description of what the prompt does",
  "category": "Appropriate category",
  "tags": ["relevant", "tags"],
  "variables": [{"name": "var_name", "type": "string", "description": "Variable description", "required": true}],
  "suggestions": ["improvement suggestion 1", "improvement suggestion 2"]
}"""

        # Generate using OpenRouter
        async with OpenRouterClient(openrouter_config) as llm_client:
            llm_response = await llm_client.generate_response(
                prompt=generation_prompt,
                system_prompt=system_prompt
            )

        # Parse the JSON response
        try:
            import json
            response_data = json.loads(llm_response.content)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            response_data = _create_fallback_response(
                llm_response.content, purpose, industry, input_variables
            )

        # Calculate quality score
        quality_score = _calculate_quality_score(response_data.get('generatedPrompt', ''), input_variables)

        # Prepare final result
        result = {
            'generatedPrompt': response_data.get('generatedPrompt', ''),
            'title': response_data.get('title', f"{purpose.title()} Prompt"),
            'description': response_data.get('description', f"AI-generated prompt for {purpose}"),
            'category': response_data.get('category', industry or 'General'),
            'tags': response_data.get('tags', [industry, use_case, tone]),
            'variables': _format_variables(response_data.get('variables', []), input_variables),
            'qualityScore': quality_score,
            'suggestions': _generate_enhancement_suggestions(response_data.get('generatedPrompt', ''), quality_score),
            'metadata': {
                'model': llm_response.model,
                'tokensUsed': llm_response.usage.get('total_tokens', 0),
                'generationTime': llm_response.response_time,
                'confidence': min(quality_score['overall'] / 100.0, 1.0)
            }
        }

        logger.info(f"Successfully generated prompt with quality score: {quality_score['overall']}")
        return result

    except Exception as e:
        logger.error(f"Error in async prompt generation: {str(e)}")
        raise

def _build_generation_prompt(purpose: str, industry: str, use_case: str,
                           target_audience: str, input_variables: List[Dict],
                           output_format: str, tone: str, length: str,
                           include_rag: bool, additional_requirements: str) -> str:
    """Build the prompt for AI generation"""

    variables_text = ""
    if input_variables:
        variables_text = "\n\nRequired Variables:\n"
        for var in input_variables:
            variables_text += f"- {{{{ {var.get('name', '')} }}}}: {var.get('description', '')} ({var.get('type', 'string')})\n"

    rag_instruction = ""
    if include_rag:
        rag_instruction = "\n\nRAG Integration: Include instructions for using document context. Add a {{context}} variable and instructions on how to use provided context information."

    prompt = f"""Create a high-quality AI prompt with the following specifications:

Purpose: {purpose}
Industry: {industry}
Use Case: {use_case}
Target Audience: {target_audience}
Output Format: {output_format}
Tone: {tone}
Length: {length}
{variables_text}
{rag_instruction}

Additional Requirements: {additional_requirements}

The prompt should be:
1. Clear and specific in its instructions
2. Optimized for AI model performance
3. Include appropriate variable placeholders
4. Follow industry best practices for {industry}
5. Match the requested {tone} tone
6. Produce output in {output_format} format

Please generate an effective prompt that meets these requirements."""

    return prompt

def _create_fallback_response(content: str, purpose: str, industry: str, input_variables: List[Dict]) -> Dict[str, Any]:
    """Create a fallback response when JSON parsing fails"""
    return {
        'generatedPrompt': content,
        'title': f"{purpose.title()} Prompt",
        'description': f"AI-generated prompt for {purpose}",
        'category': industry or 'General',
        'tags': [industry, purpose],
        'variables': input_variables,
        'suggestions': ["Review and refine the generated prompt", "Test with sample inputs"]
    }

def _format_variables(ai_variables: List[Dict], input_variables: List[Dict]) -> List[Dict]:
    """Format variables from AI response, falling back to input variables"""
    if not ai_variables:
        return [
            {
                'name': var.get('name', ''),
                'type': var.get('type', 'string'),
                'description': var.get('description', ''),
                'required': var.get('required', True)
            }
            for var in input_variables
        ]

    return [
        {
            'name': var.get('name', ''),
            'type': var.get('type', 'string'),
            'description': var.get('description', ''),
            'required': var.get('required', True)
        }
        for var in ai_variables
    ]

def _calculate_quality_score(prompt: str, variables: List[Dict]) -> Dict[str, Any]:
    """Calculate quality score for generated prompt with 11 quality dimensions"""
    import re

    if not prompt:
        return {
            'overall': 0,
            'structure': 0,
            'clarity': 0,
            'variables': 0,
            'ragCompatibility': 0,
            'industryOptimization': 0,
            'specificity': 0,
            'actionability': 0,
            'contextCompleteness': 0,
            'outputFormatClarity': 0,
            'toneConsistency': 0,
            'readability': 0,
            'suggestions': []
        }

    # 1. Structure score
    structure_score = 70
    if len(prompt.split('\n')) > 1:
        structure_score += 10
    if any(word in prompt.lower() for word in ['please', 'you are', 'your task']):
        structure_score += 10
    if re.search(r'\d+\.', prompt):  # Numbered lists
        structure_score += 5
    if re.search(r'[-*]', prompt):  # Bullet points
        structure_score += 5

    # 2. Clarity score
    clarity_score = 70
    word_count = len(prompt.split())
    if word_count > 20:
        clarity_score += 10
    if prompt.count('{{') == prompt.count('}}'):
        clarity_score += 10
    if word_count > 50:
        clarity_score += 5
    if re.search(r'\b(example|for instance|such as)\b', prompt, re.I):
        clarity_score += 5

    # 3. Variables score
    variables_score = 50
    if variables:
        variables_score = 80
        if all('{{' + var.get('name', '') + '}}' in prompt for var in variables):
            variables_score = 90

    # 4. RAG compatibility score
    rag_score = 60
    if '{{context}}' in prompt or 'context' in prompt.lower():
        rag_score = 85
    if re.search(r'\b(document|based on|according to)\b', prompt, re.I):
        rag_score += 5

    # 5. Industry optimization score
    industry_score = 60
    industry_keywords = ['professional', 'technical', 'business', 'analysis', 'strategy', 'framework']
    keyword_count = sum(1 for kw in industry_keywords if kw in prompt.lower())
    industry_score += min(keyword_count * 5, 30)

    # 6. Specificity score
    specificity_score = 50
    if re.search(r'\b\d+\b', prompt):  # Contains numbers
        specificity_score += 15
    if re.search(r'\b(specific|exactly|precisely|particular|detailed)\b', prompt, re.I):
        specificity_score += 15
    if re.search(r'\b(example|for instance|such as|like)\b', prompt, re.I):
        specificity_score += 15
    if not re.search(r'\b(some|any|maybe|perhaps|might|could|general)\b', prompt, re.I):
        specificity_score += 5

    # 7. Actionability score
    actionability_score = 50
    action_verbs = ['analyze', 'create', 'generate', 'write', 'list', 'describe', 'explain', 'compare', 'summarize', 'identify']
    if any(verb in prompt.lower() for verb in action_verbs):
        actionability_score += 20
    if re.search(r'\b(step|first|second|then|next|finally)\b', prompt, re.I):
        actionability_score += 15
    if re.search(r'\b(must|should|required|limit|maximum|minimum)\b', prompt, re.I):
        actionability_score += 10
    if re.search(r'\b(output|result|response|answer|provide|include)\b', prompt, re.I):
        actionability_score += 5

    # 8. Context completeness score
    context_score = 40
    if re.search(r'\b(background|context|situation|scenario)\b', prompt, re.I):
        context_score += 20
    if re.search(r'\b(audience|user|customer|reader|viewer)\b', prompt, re.I):
        context_score += 15
    if re.search(r'\b(purpose|goal|objective|aim|intent)\b', prompt, re.I):
        context_score += 15
    if len(prompt) > 150:
        context_score += 10

    # 9. Output format clarity score
    format_score = 40
    if re.search(r'\b(format|structure|template|layout)\b', prompt, re.I):
        format_score += 20
    if re.search(r'\b(json|markdown|html|list|table|paragraph|bullet points?)\b', prompt, re.I):
        format_score += 20
    if re.search(r'\b(\d+\s*(words?|characters?|sentences?|paragraphs?))\b', prompt, re.I):
        format_score += 15
    if re.search(r'\b(section|heading|title|introduction|conclusion)\b', prompt, re.I):
        format_score += 5

    # 10. Tone consistency score
    formal_words = len(re.findall(r'\b(please|kindly|ensure|verify|confirm|therefore|furthermore|consequently)\b', prompt, re.I))
    casual_words = len(re.findall(r'\b(hey|yeah|cool|awesome|stuff|things|gonna|wanna)\b', prompt, re.I))
    technical_words = len(re.findall(r'\b(algorithm|function|parameter|variable|implementation|architecture)\b', prompt, re.I))
    total_tone_words = formal_words + casual_words + technical_words

    tone_score = 70
    if total_tone_words > 0:
        dominant_tone = max(formal_words, casual_words, technical_words)
        consistency = dominant_tone / total_tone_words
        tone_score = int(50 + consistency * 50)

    # 11. Readability score (simplified Flesch-Kincaid)
    words = prompt.split()
    sentences = re.split(r'[.!?]+', prompt)
    sentences = [s for s in sentences if s.strip()]

    readability_score = 70
    if len(words) > 0 and len(sentences) > 0:
        avg_words_per_sentence = len(words) / len(sentences)
        # Optimal range: 15-20 words per sentence
        if 15 <= avg_words_per_sentence <= 20:
            readability_score = 90
        elif 10 <= avg_words_per_sentence <= 25:
            readability_score = 80
        else:
            readability_score = 70

    # Calculate overall score (average of all 11 metrics)
    overall = (
        structure_score + clarity_score + variables_score + rag_score +
        industry_score + specificity_score + actionability_score +
        context_score + format_score + tone_score + readability_score
    ) // 11

    return {
        'overall': min(overall, 100),
        'structure': min(structure_score, 100),
        'clarity': min(clarity_score, 100),
        'variables': min(variables_score, 100),
        'ragCompatibility': min(rag_score, 100),
        'industryOptimization': min(industry_score, 100),
        'specificity': min(specificity_score, 100),
        'actionability': min(actionability_score, 100),
        'contextCompleteness': min(context_score, 100),
        'outputFormatClarity': min(format_score, 100),
        'toneConsistency': min(tone_score, 100),
        'readability': min(readability_score, 100),
        'suggestions': []
    }

def _generate_enhancement_suggestions(prompt: str, quality_score: Dict) -> List[Dict]:
    """Generate enhancement suggestions based on prompt analysis"""
    suggestions = []

    if quality_score['structure'] < 80:
        suggestions.append({
            'id': 'structure_improvement',
            'type': 'structure',
            'title': 'Improve Structure',
            'description': 'Consider adding clear sections or steps to your prompt',
            'impact': 'medium',
            'category': 'Structure',
            'autoApplicable': False
        })

    if quality_score['clarity'] < 80:
        suggestions.append({
            'id': 'clarity_improvement',
            'type': 'clarity',
            'title': 'Enhance Clarity',
            'description': 'Add more specific instructions or examples',
            'impact': 'high',
            'category': 'Clarity',
            'autoApplicable': False
        })

    if quality_score['variables'] < 80:
        suggestions.append({
            'id': 'variables_improvement',
            'type': 'variables',
            'title': 'Optimize Variables',
            'description': 'Ensure all variables are properly defined and used',
            'impact': 'medium',
            'category': 'Variables',
            'autoApplicable': False
        })

    if quality_score['ragCompatibility'] < 80:
        suggestions.append({
            'id': 'rag_improvement',
            'type': 'rag_optimization',
            'title': 'Add RAG Support',
            'description': 'Include context variable and instructions for document-based responses',
            'impact': 'low',
            'category': 'RAG',
            'autoApplicable': True
        })

    return suggestions
