"""
Prompt Execution API
RAG Prompt Library - AI Integration with OpenRouter

Endpoints:
- execute_prompt: Execute prompt with AI model
- execute_prompt_stream: Execute with streaming response
- get_execution_history: Get execution history
- get_execution: Get single execution
"""

from firebase_functions import https_fn, options
from firebase_admin import firestore
from datetime import datetime
from typing import Dict, Any, AsyncIterator
import logging
import re
import asyncio

from ..llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from ..llm.model_config import get_model_config, is_free_model
from ..llm.cost_tracker import CostTracker
from ..api.api_keys import decrypt_api_key
from ..analytics.model_performance_tracker import model_performance_tracker

logger = logging.getLogger(__name__)
db = firestore.client()
cost_tracker = CostTracker(db)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def interpolate_variables(template: str, variables: Dict[str, str]) -> str:
    """
    Replace variables in template with actual values

    Args:
        template: Prompt template with {{variable}} placeholders
        variables: Dictionary of variable values

    Returns:
        Interpolated prompt
    """
    result = template
    for key, value in variables.items():
        pattern = r'\{\{' + re.escape(key) + r'\}\}'
        result = re.sub(pattern, str(value), result)

    return result


def calculate_cost(usage: Dict[str, int], model_id: str) -> float:
    """
    Calculate cost for model usage

    Args:
        usage: Token usage dict with input_tokens and output_tokens
        model_id: Model identifier

    Returns:
        Cost in USD
    """
    if is_free_model(model_id):
        return 0.0

    # Get model pricing (would come from model_config)
    # For now, return 0 for free models
    return 0.0


async def get_user_api_key(user_id: str, model_id: str) -> Optional[str]:
    """
    Retrieve user's custom API key for a specific model

    Args:
        user_id: User ID
        model_id: Model identifier

    Returns:
        Decrypted API key if found, None otherwise
    """
    try:
        # Query user's API keys
        keys_ref = db.collection('user_api_keys').where('userId', '==', user_id)
        keys_docs = keys_ref.stream()

        for doc in keys_docs:
            key_data = doc.to_dict()

            # Check if key is for this model or is a general key
            if key_data.get('isActive', True):
                # Decrypt the key
                encrypted_key = key_data.get('encryptedKey')
                if encrypted_key:
                    decrypted_key = decrypt_api_key(encrypted_key, user_id)
                    logger.info(f"Retrieved custom API key for user {user_id}")
                    return decrypted_key

        logger.warning(f"No custom API key found for user {user_id}")
        return None

    except Exception as e:
        logger.error(f"Error retrieving custom API key: {str(e)}")
        return None


def get_fallback_models() -> list[str]:
    """
    Get list of fallback models in priority order
    All fallback models are free models

    Returns:
        List of model IDs in fallback order
    """
    return [
        "x-ai/grok-beta:free",  # Grok 4 Fast
        "zhipuai/glm-4-9b-chat:free",  # GLM-4.5 Air
        "qwen/qwen-2.5-coder-32b-instruct:free"  # Qwen3 Coder
    ]


async def execute_with_fallback(
    client: OpenRouterClient,
    prompt: str,
    primary_model: str,
    config: OpenRouterConfig
) -> tuple[Any, str, bool]:
    """
    Execute prompt with fallback logic

    Args:
        client: OpenRouter client
        prompt: Prompt to execute
        primary_model: Primary model to try first
        config: OpenRouter configuration

    Returns:
        Tuple of (response, model_used, fallback_used)
    """
    fallback_models = get_fallback_models()
    models_to_try = [primary_model] + fallback_models
    last_error = None

    for i, model_id in enumerate(models_to_try):
        is_fallback = i > 0

        try:
            # Update config with current model
            config.model = model_id

            if is_fallback:
                logger.warning(
                    f"Attempting fallback model {model_id} "
                    f"(attempt {i+1}/{len(models_to_try)})"
                )

            # Try to execute
            response = await client.generate_response(prompt=prompt)

            if is_fallback:
                logger.info(f"Successfully executed with fallback model {model_id}")

            return response, model_id, is_fallback

        except Exception as e:
            last_error = e
            logger.error(
                f"Failed to execute with model {model_id}: {str(e)}"
            )

            # If this was the last model, raise the error
            if i == len(models_to_try) - 1:
                logger.error(
                    f"All fallback models failed. Last error: {str(last_error)}"
                )
                raise last_error

            # Otherwise, continue to next model
            continue

    # Should never reach here
    raise RuntimeError("Unexpected state in fallback logic")


# =============================================================================
# EXECUTE PROMPT
# =============================================================================

@https_fn.on_call(
    region="australia-southeast1",
    timeout_sec=300,  # 5 minutes for long executions
    cors=options.CorsOptions(
        cors_origins="*",
        cors_methods=["POST"]
    )
)
def execute_prompt(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Execute a prompt with AI model

    Args:
        promptId: ID of the prompt to execute
        variables: Dictionary of variable values
        modelOverride: Optional model ID to override prompt's default
        temperature: Optional temperature override
        maxTokens: Optional max tokens override

    Returns:
        Execution result with output, tokens used, and cost
    """
    # Authentication check
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    # Get parameters
    prompt_id = req.data.get('promptId')
    variables = req.data.get('variables', {})
    model_override = req.data.get('modelOverride')
    temperature = req.data.get('temperature')
    max_tokens = req.data.get('maxTokens')

    if not prompt_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="promptId is required"
        )

    # Start latency timer
    __exec_start = datetime.now()

    try:
        # Get prompt
        prompt_doc = db.collection('prompts').document(prompt_id).get()

        if not prompt_doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Prompt not found"
            )

        prompt_data = prompt_doc.to_dict()

        # Check permissions
        if prompt_data.get('userId') != req.auth.uid and not prompt_data.get('isPublic'):
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Access denied"
            )

        # Interpolate variables
        final_prompt = interpolate_variables(prompt_data['content'], variables)

        # Get model configuration
        model_id = model_override or prompt_data['modelConfig']['modelId']
        model_config = get_model_config(model_id)

        if not model_config:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
                message=f"Invalid model: {model_id}"
            )

        # Determine which API key to use
        api_key = None
        is_custom_key = False
        custom_key_id = None

        if model_config.requires_custom_key:
            # Get user's custom API key from Firestore
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            api_key = loop.run_until_complete(
                get_user_api_key(req.auth.uid, model_id)
            )
            loop.close()

            if not api_key:
                raise https_fn.HttpsError(
                    code=https_fn.FunctionsErrorCode.FAILED_PRECONDITION,
                    message=f"This model requires a custom API key. Please add your OpenRouter API key in settings."
                )

            is_custom_key = True
            logger.info(f"Using custom API key for model {model_id}")
        else:
            # Use default API key
            api_key = get_api_key()
            logger.info(f"Using default API key for model {model_id}")

        # Create OpenRouter config
        openrouter_config = OpenRouterConfig(
            api_key=api_key,
            model=model_id,
            temperature=temperature or prompt_data['modelConfig'].get('temperature', 0.7),
            max_tokens=max_tokens or prompt_data['modelConfig'].get('maxTokens', 2000),
            top_p=prompt_data['modelConfig'].get('topP', 1.0),
            is_custom_key=is_custom_key,
            user_id=req.auth.uid if is_custom_key else None
        )

        # Execute with OpenRouter (with fallback support)
        async def run_execution():
            async with OpenRouterClient(openrouter_config) as client:
                return await execute_with_fallback(
                    client=client,
                    prompt=final_prompt,
                    primary_model=model_id,
                    config=openrouter_config
                )

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            response, model_used, fallback_used = loop.run_until_complete(run_execution())
        finally:
            loop.close()

        # Calculate cost (using the actual model that was used)
        cost = calculate_cost(response.usage, model_used)

        # Save execution record
        execution = {
            'promptId': prompt_id,
            'userId': req.auth.uid,
            'input': final_prompt,
            'output': response.content,
            'variables': variables,
            'modelId': model_used,  # Use actual model that was used
            'requestedModelId': model_id,  # Original requested model
            'modelConfig': {
                'temperature': openrouter_config.temperature,
                'maxTokens': openrouter_config.max_tokens,
                'topP': openrouter_config.top_p
            },
            'tokensUsed': {
                'input': response.usage.get('prompt_tokens', 0),
                'output': response.usage.get('completion_tokens', 0),
                'total': response.usage.get('total_tokens', 0)
            },
            'cost': cost,
            'isFreeModel': is_free_model(model_used),
            'isCustomKey': is_custom_key,
            'fallbackUsed': fallback_used,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'status': 'completed'
        }

        execution_ref = db.collection('executions').add(execution)
        execution_id = execution_ref[1].id

        # Update prompt execution count
        db.collection('prompts').document(prompt_id).update({
            'executionCount': firestore.Increment(1),
            'lastExecutedAt': firestore.SERVER_TIMESTAMP
        })

        # Track cost (for both free and paid models)
        cost_tracker.track_usage(
            user_id=req.auth.uid,
            provider="openrouter",
            model=model_used,
            input_tokens=response.usage.get('prompt_tokens', 0),
            output_tokens=response.usage.get('completion_tokens', 0),
            endpoint="execute_prompt",
            metadata={
                'prompt_id': prompt_id,
                'is_custom_key': is_custom_key,
                'fallback_used': fallback_used,
                'requested_model': model_id
            }
        )

        logger.info(
            f"Executed prompt {prompt_id} with model {model_used} "
            f"(requested: {model_id}, fallback: {fallback_used})"
        )

        # Record model performance (fire-and-forget)
        try:
            __latency_ms = (datetime.now() - __exec_start).total_seconds() * 1000.0
            __tokens = execution['tokensUsed']
            __meta = {
                'requested_model': model_id,
                'fallback_used': fallback_used,
                'is_custom_key': is_custom_key,
            }
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(
                model_performance_tracker.record_execution(
                    model_id=model_used,
                    model_name=model_used,
                    execution_id=execution_id,
                    user_id=req.auth.uid,
                    latency_ms=__latency_ms,
                    cost_usd=cost,
                    success=True,
                    input_tokens=__tokens.get('input', 0),
                    output_tokens=__tokens.get('output', 0),
                    prompt_id=prompt_id,
                    error_message=None,
                    user_rating=None,
                    user_feedback=None,
                    prompt_length=len(final_prompt),
                    response_length=len(response.content or ""),
                    use_rag=False,
                    temperature=openrouter_config.temperature,
                    max_tokens=openrouter_config.max_tokens,
                    metadata=__meta,
                )
            )
        except Exception as __e:
            logger.error(f"Failed to record model performance: {str(__e)}")
        finally:
            try:
                loop.close()
            except Exception:
                pass

        return {
            'success': True,
            'executionId': execution_id,
            'output': response.content,
            'tokensUsed': execution['tokensUsed'],
            'cost': cost,
            'isFreeModel': is_free_model(model_used),
            'modelUsed': model_used,
            'fallbackUsed': fallback_used
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error executing prompt: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message=f"Failed to execute prompt: {str(e)}"
        )


# =============================================================================
# GET EXECUTION HISTORY
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def get_execution_history(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get execution history for a prompt or user

    Args:
        promptId: Optional prompt ID to filter by
        limit: Number of executions to return (default: 20)
        startAfter: Document ID to start after

    Returns:
        List of executions
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    prompt_id = req.data.get('promptId')
    limit = req.data.get('limit', 20)
    start_after = req.data.get('startAfter')

    try:
        # Build query
        query = db.collection('executions').where('userId', '==', req.auth.uid)

        if prompt_id:
            query = query.where('promptId', '==', prompt_id)

        query = query.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit)

        if start_after:
            start_doc = db.collection('executions').document(start_after).get()
            query = query.start_after(start_doc)

        # Execute query
        docs = query.stream()
        executions = [{'id': doc.id, **doc.to_dict()} for doc in docs]

        return {
            'success': True,
            'executions': executions,
            'hasMore': len(executions) == limit
        }

    except Exception as e:
        logger.error(f"Error getting execution history: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Failed to get execution history"
        )


# =============================================================================
# GET SINGLE EXECUTION
# =============================================================================

@https_fn.on_call(region="australia-southeast1")
def get_execution(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """
    Get a single execution by ID

    Args:
        executionId: ID of the execution

    Returns:
        Execution data
    """
    if not req.auth:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.UNAUTHENTICATED,
            message="User must be authenticated"
        )

    execution_id = req.data.get('executionId')

    if not execution_id:
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INVALID_ARGUMENT,
            message="executionId is required"
        )

    try:
        doc = db.collection('executions').document(execution_id).get()

        if not doc.exists:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.NOT_FOUND,
                message="Execution not found"
            )

        execution_data = doc.to_dict()

        # Check permissions
        if execution_data.get('userId') != req.auth.uid:
            raise https_fn.HttpsError(
                code=https_fn.FunctionsErrorCode.PERMISSION_DENIED,
                message="Access denied"
            )

        return {
            'success': True,
            'execution': {
                'id': doc.id,
                **execution_data
            }
        }

    except https_fn.HttpsError:
        raise
    except Exception as e:
        logger.error(f"Error getting execution: {str(e)}")
        raise https_fn.HttpsError(
            code=https_fn.FunctionsErrorCode.INTERNAL,
            message="Failed to get execution"
        )


# =============================================================================
# HELPER: GET API KEY
# =============================================================================

def get_api_key() -> str:
    """Get OpenRouter API key from Firebase config"""
    # TODO: Implement proper config retrieval
    import os
    return os.environ.get('OPENROUTER_API_KEY', '')
