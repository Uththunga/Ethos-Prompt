"""
Embedding Service - Generate embeddings for text chunks
"""
import os
import logging
import asyncio
import hashlib
import time
from typing import List, Dict, Any, Optional, Tuple, cast
from dataclasses import dataclass
import json

# OpenAI import (conditional)
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

# Google Cloud AI Platform import (conditional)
try:
    from google.cloud import aiplatform  # type: ignore[attr-defined]
    from google.cloud.aiplatform.gapic.schema import predict  # type: ignore
    import google.auth
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

# Redis import for caching (conditional)
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class EmbeddingResult:
    text: str
    embedding: List[float]
    model: str
    dimensions: int
    tokens_used: int
    processing_time: float
    cached: bool = False

@dataclass
class BatchEmbeddingResult:
    results: List[EmbeddingResult]
    total_tokens: int
    total_time: float
    success_count: int
    error_count: int
    errors: List[str]

class EmbeddingService:
    """
    Service for generating text embeddings with caching and batch processing
    Supports both OpenAI and Google Cloud AI Platform embeddings
    """

    def __init__(self, provider: str = 'openai', api_key: Optional[str] = None, redis_url: Optional[str] = None,
                 google_project_id: Optional[str] = None, google_location: str = 'us-central1'):
        self.provider = provider.lower()
        self.redis_url = redis_url or os.getenv('REDIS_URL')

        # Initialize embedding clients based on provider
        self.openai_client = None
        self.google_client = None

        if self.provider == 'openai':
            self.api_key = api_key or os.getenv('OPENROUTER_API_KEY')  # Use OpenRouter instead
            if self.api_key and OPENAI_AVAILABLE:
                self.openai_client = openai.OpenAI(
                    api_key=self.api_key,
                    base_url="https://openrouter.ai/api/v1"  # OpenRouter endpoint
                )
                logger.info("OpenAI embedding client initialized via OpenRouter")

        elif self.provider == 'google':
            self.google_project_id = google_project_id or os.getenv('GOOGLE_CLOUD_PROJECT')
            self.google_location = google_location
            self.google_api_key = api_key or os.getenv('GOOGLE_API_KEY')

            if GOOGLE_AVAILABLE and (self.google_project_id or self.google_api_key):
                try:
                    if self.google_project_id:
                        aiplatform.init(project=self.google_project_id, location=self.google_location)
                        self.google_client = aiplatform.gapic.PredictionServiceClient()
                        logger.info("Google Cloud AI Platform embedding client initialized")
                    else:
                        # Use API key for direct API calls
                        logger.info("Google API key configured for embeddings")
                except Exception as e:
                    logger.error(f"Failed to initialize Google embedding client: {e}")

        # Initialize Redis cache
        self.redis_client = None
        if self.redis_url and REDIS_AVAILABLE:
            try:
                self.redis_client = redis.from_url(self.redis_url, decode_responses=False)
                self.redis_client.ping()
                logger.info("Redis cache connected for embeddings")
            except Exception as e:
                logger.warning(f"Failed to connect to Redis cache: {e}")
                self.redis_client = None

        # Configuration
        if self.provider == 'google':
            self.default_model = 'text-embedding-004'
            self.batch_size = 100  # Google batch limit
        else:
            self.default_model = 'text-embedding-3-small'
            self.batch_size = 100  # OpenAI batch limit

        self.cache_ttl = 7 * 24 * 3600  # 7 days
        self.max_retries = 3
        self.retry_delay = 1.0

        # Rate limiting (requests per second); 0 disables
        try:
            self.rate_limit_rps: float = float(os.getenv('EMBEDDING_RATE_RPS', '0'))
        except Exception:
            self.rate_limit_rps = 0.0
        self._next_available_time: float = 0.0

        # Optional cost tracking callback: fn(event_type, data)
        self._cost_handler = None

        # Model configurations
        self.model_configs = {
            # OpenAI models
            'text-embedding-3-small': {
                'provider': 'openai',
                'dimensions': 1536,
                'max_tokens': 8191,
                'cost_per_1k_tokens': 0.00002
            },
            'text-embedding-3-large': {
                'provider': 'openai',
                'dimensions': 3072,
                'max_tokens': 8191,
                'cost_per_1k_tokens': 0.00013
            },
            'text-embedding-ada-002': {
                'provider': 'openai',
                'dimensions': 1536,
                'max_tokens': 8191,
                'cost_per_1k_tokens': 0.0001
            },
            # Google models
            'text-embedding-004': {
                'provider': 'google',
                'dimensions': 768,
                'max_tokens': 2048,
                'cost_per_1k_tokens': 0.00001  # Estimated cost
            },
            'textembedding-gecko@003': {
                'provider': 'google',
                'dimensions': 768,
                'max_tokens': 3072,
                'cost_per_1k_tokens': 0.00001
            }
        }

    def _get_cache_key(self, text: str, model: str) -> str:
        """Generate cache key for text and model"""
        text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
        return f"embedding:{model}:{text_hash}"

    def _get_cached_embedding(self, text: str, model: str) -> Optional[List[float]]:
        """Get cached embedding if available"""
        if not self.redis_client:
            return None

        try:
            cache_key = self._get_cache_key(text, model)
            cached_data = self.redis_client.get(cache_key)

            if cached_data:
                embedding = json.loads(cached_data)
                logger.debug(f"Cache hit for embedding: {cache_key}")
                return embedding

        except Exception as e:
            logger.warning(f"Cache read error: {e}")

        return None

    def _cache_embedding(self, text: str, model: str, embedding: List[float]):
        """Cache embedding for future use"""
        if not self.redis_client:
            return

        try:
            cache_key = self._get_cache_key(text, model)
            cached_data = json.dumps(embedding)

            self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                cached_data
            )

            logger.debug(f"Cached embedding: {cache_key}")

        except Exception as e:
            logger.warning(f"Cache write error: {e}")
    async def _acquire_rate_limit(self):
        """Simple rate limiter: ensure at most rate_limit_rps requests per second.
        If disabled (<=0), returns immediately.
        """
        if getattr(self, 'rate_limit_rps', 0.0) and self.rate_limit_rps > 0:
            now = time.time()
            wait = max(0.0, self._next_available_time - now)
            if wait > 0:
                await asyncio.sleep(wait)
            # schedule next slot
            self._next_available_time = max(now, self._next_available_time) + (1.0 / self.rate_limit_rps)

    def validate_embedding(self, embedding: List[float], model: Optional[str] = None) -> Dict[str, Any]:
        """Validate embedding dimensions and non-zero vector."""
        model = model or self.default_model
        expected = self.model_configs.get(model, self.model_configs[self.default_model])['dimensions']
        length = len(embedding) if embedding is not None else 0
        is_nonzero = bool(embedding) and any(abs(x) > 0 for x in embedding)
        ok = (length == expected) and is_nonzero
        return {
            'ok': ok,
            'length': length,
            'expected': expected,
            'is_nonzero': is_nonzero,
        }

    def estimate_cost_for_tokens(self, tokens: int, model: Optional[str] = None) -> float:
        """Estimate cost in USD for a given token count."""
        model = model or self.default_model
        cfg = self.model_configs.get(model, self.model_configs[self.default_model])
        return (tokens / 1000.0) * cast(float, cfg.get('cost_per_1k_tokens', 0.0))

    def estimate_cost_for_texts(self, texts: List[str], model: Optional[str] = None) -> float:
        """Estimate total cost for a list of texts."""
        model = model or self.default_model
        total_tokens = sum(self._estimate_tokens(t or '') for t in texts)
        return self.estimate_cost_for_tokens(total_tokens, model)

    def estimate_batch_cost(self, texts: List[str], model: Optional[str] = None) -> float:
        """Estimate total embedding cost for a batch of texts using model pricing."""
        return self.estimate_cost_for_texts(texts, model)

    def set_cost_handler(self, handler):
        """Set optional cost tracking callback. Handler signature: fn(event_type: str, data: dict)"""
        self._cost_handler = handler

    def _emit_cost_event(self, event_type: str, data: Dict[str, Any]):
        """Emit cost tracking event if handler is set."""
        if self._cost_handler:
            try:
                self._cost_handler(event_type, data)
            except Exception as e:
                logger.warning(f"Cost handler failed: {e}")



    def _estimate_tokens(self, text: str) -> int:
        """Estimate token count for text"""
        # Simple approximation: 1 token ≈ 4 characters
        return len(text) // 4

    def _validate_text(self, text: str, model: str) -> Tuple[bool, str]:
        """Validate text for embedding generation"""
        if not text or not text.strip():
            return False, "Text is empty"

        # Check token limit
        model_config = self.model_configs.get(model, self.model_configs[self.default_model])

        estimated_tokens = self._estimate_tokens(text)

        if estimated_tokens > cast(int, model_config['max_tokens']):
            return False, f"Text too long: {estimated_tokens} tokens (max: {model_config['max_tokens']})"

        return True, ""

    async def generate_embedding(
        self,
        text: str,
        model: Optional[str] = None
    ) -> Optional[EmbeddingResult]:
        """Generate embedding for a single text"""
        model = model or self.default_model
        start_time = time.time()

        # Validate text
        is_valid, error_msg = self._validate_text(text, model)
        if not is_valid:
            logger.error(f"Text validation failed: {error_msg}")
            return None

        # Check cache first
        cached_embedding = self._get_cached_embedding(text, model)
        if cached_embedding:
            processing_time = time.time() - start_time
            model_config = self.model_configs.get(model, self.model_configs[self.default_model])

            return EmbeddingResult(
                text=text,
                embedding=cached_embedding,
                model=model,
                dimensions=len(cached_embedding),
                tokens_used=self._estimate_tokens(text),
                processing_time=processing_time,
                cached=True
            )

        # Generate new embedding based on provider
        model_config = self.model_configs.get(model, self.model_configs[self.default_model])
        provider = model_config.get('provider', self.provider)

        try:
            await self._acquire_rate_limit()
            if provider == 'openai':
                embedding, tokens_used = await self._generate_openai_embedding(text, model)
            elif provider == 'google':
                embedding, tokens_used = await self._generate_google_embedding(text, model)
            else:
                logger.error(f"Unsupported provider: {provider}")
                return None

            processing_time = time.time() - start_time

            # Validate embedding (non-fatal)
            try:
                val = self.validate_embedding(embedding, model)
                if not val.get('ok'):
                    logger.warning(f"Embedding validation failed: {val}")
            except Exception:
                logger.warning("Embedding validation raised; continuing")

            # Cache the result
            self._cache_embedding(text, model, embedding)

            # Emit cost event
            cost = self.estimate_cost_for_tokens(tokens_used, model)
            self._emit_cost_event('embedding_generated', {
                'model': model,
                'tokens': tokens_used,
                'cost': cost,
                'text_length': len(text)
            })

            return EmbeddingResult(
                text=text,
                embedding=embedding,
                model=model,
                dimensions=len(embedding),
                tokens_used=tokens_used,
                processing_time=processing_time,
                cached=False
            )

        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None

    async def _generate_openai_embedding(self, text: str, model: str) -> Tuple[List[float], int]:
        """Generate embedding using OpenAI API"""
        if not self.openai_client:
            raise Exception("OpenAI client not available")

        # Make API call with retries
        for attempt in range(self.max_retries):
            try:
                # Call OpenRouter embeddings endpoint directly (bypass SDK inconsistencies)
                import httpx
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": model or "openai/text-embedding-3-small",
                    "input": text,
                }
                resp = httpx.post("https://openrouter.ai/api/v1/embeddings", headers=headers, json=payload, timeout=60)
                resp.raise_for_status()
                resp_obj = resp.json()

                data_items = resp_obj.get("data", [])
                usage_obj = resp_obj.get("usage", {}) or {}
                total_tokens_used = usage_obj.get("total_tokens") or 0

                if not data_items:
                    raise ValueError("Embeddings response missing data list")

                first_item = data_items[0]
                embedding = first_item.get("embedding") if isinstance(first_item, dict) else getattr(first_item, "embedding", None)
                if embedding is None:
                    raise ValueError("Embedding item missing 'embedding' field")

                tokens_used = total_tokens_used or self._estimate_tokens(text)
                return embedding, tokens_used
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise e
                logger.warning(f"OpenAI embedding attempt {attempt + 1} failed: {e}")
                await asyncio.sleep(self.retry_delay * (2 ** attempt))

        raise RuntimeError("Failed to generate OpenAI embedding after retries")

    async def _generate_google_embedding(self, text: str, model: str) -> Tuple[List[float], int]:
        """Generate embedding using Google Cloud AI Platform API"""
        import requests

        if not self.google_api_key:
            raise Exception("Google API key not available")

        # Use Google Generative AI API for embeddings
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent"
        headers = {
            'Content-Type': 'application/json',
        }

        data = {
            'model': f'models/{model}',
            'content': {
                'parts': [{'text': text}]
            }
        }

        # Make API call with retries
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    url,
                    headers=headers,
                    json=data,
                    params={'key': self.google_api_key}
                )
                response.raise_for_status()

                result = response.json()
                embedding = result['embedding']['values']
                tokens_used = self._estimate_tokens(text)  # Google doesn't return token count

                return embedding, tokens_used
            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise e
                logger.warning(f"Google embedding attempt {attempt + 1} failed: {e}")
                await asyncio.sleep(self.retry_delay * (2 ** attempt))

        raise RuntimeError("Failed to generate Google embedding after retries")

    def _generate_local_embedding(self, text: str, dimensions: int = 768) -> List[float]:
        """Deterministic, keyword-aware local embedding using feature hashing + L2 norm.
        Produces stable vectors where cosine similarity reflects token overlap.
        """
        try:
            import numpy as np
            import re
            import hashlib

            # Tokenize: lowercase alphanumerics
            tokens = re.findall(r"[a-z0-9]+", (text or "").lower())
            vec = np.zeros(dimensions, dtype=float)

            if not tokens:
                return [0.0] * dimensions

            for tok in tokens:
                # Hash to index and pseudo-random sign for better spread
                h = hashlib.md5(tok.encode("utf-8")).hexdigest()
                idx = int(h[:8], 16) % dimensions
                s = hashlib.sha256(tok.encode("utf-8")).hexdigest()
                sign = 1.0 if (int(s[-1], 16) % 2 == 0) else -1.0
                vec[idx] += sign

            # L2 normalize
            norm = float(np.linalg.norm(vec)) or 1.0
            return (vec / norm).tolist()
        except Exception as e:
            logger.error(f"Local embedding generation failed: {e}")
            # Fallback to zero vector
            return [0.0] * dimensions

    async def generate_batch_embeddings(
        self,
        texts: List[str],
        model: Optional[str] = None
    ) -> BatchEmbeddingResult:
        """Generate embeddings for multiple texts in batches"""
        model = model or self.default_model
        start_time = time.time()

        results = []
        errors = []
        total_tokens = 0

        # Process in batches
        for i in range(0, len(texts), self.batch_size):
            batch_texts = texts[i:i + self.batch_size]

            # Filter out invalid texts
            valid_texts = []
            for text in batch_texts:
                is_valid, error_msg = self._validate_text(text, model)
                if is_valid:
                    valid_texts.append(text)
                else:
                    errors.append(f"Text {i + len(valid_texts)}: {error_msg}")

            if not valid_texts:
                continue

            # Check cache for batch
            batch_results = []
            uncached_texts = []
            uncached_indices = []

            for idx, text in enumerate(valid_texts):
                cached_embedding = self._get_cached_embedding(text, model)
                if cached_embedding:
                    result = EmbeddingResult(

                        text=text,
                        embedding=cached_embedding,
                        model=model,
                        dimensions=len(cached_embedding),
                        tokens_used=self._estimate_tokens(text),
                        processing_time=0.0,
                        cached=True
                    )
                    batch_results.append(result)
                    total_tokens += result.tokens_used
                else:
                    uncached_texts.append(text)
                    uncached_indices.append(idx)

            # Generate embeddings for uncached texts
            if uncached_texts:
                model_config = self.model_configs.get(model, self.model_configs[self.default_model])
                provider = self.provider or model_config.get('provider', self.provider)

                try:
                    if provider == 'local':
                        # Fast, deterministic local embeddings (no external calls)
                        for text in uncached_texts:
                            dims = cast(int, self.model_configs.get(model, self.model_configs[self.default_model])['dimensions'])
                            embedding = self._generate_local_embedding(text, dimensions=dims)
                            self._cache_embedding(text, model, embedding)
                            result = EmbeddingResult(
                                text=text,
                                embedding=embedding,
                                model=model,
                                dimensions=len(embedding),
                                tokens_used=0,
                                processing_time=(time.time() - start_time) / max(1, len(uncached_texts)),
                                cached=False
                            )
                            batch_results.append(result)
                        # No need to proceed to other providers

                    elif provider == 'openai' and self.openai_client:
                        # Make batch API call for OpenAI with retries
                        for attempt in range(self.max_retries):
                            try:
                                await self._acquire_rate_limit()
                                # Call OpenRouter embeddings endpoint directly (bypass SDK inconsistencies)
                                import httpx
                                headers = {
                                    "Authorization": f"Bearer {self.api_key}",
                                    "Content-Type": "application/json",
                                }
                                payload = {
                                    "model": model or "openai/text-embedding-3-small",
                                    "input": uncached_texts,
                                }
                                resp = httpx.post("https://openrouter.ai/api/v1/embeddings", headers=headers, json=payload, timeout=60)
                                resp.raise_for_status()
                                resp_obj = resp.json()

                                # Extract data list and usage
                                data_items = resp_obj.get("data", [])
                                usage_obj = resp_obj.get("usage", {}) or {}
                                total_tokens_used = usage_obj.get("total_tokens") or 0

                                if not data_items:
                                    raise ValueError("Embeddings response missing data list")

                                # Process results
                                for idx, (text, embedding_data) in enumerate(zip(uncached_texts, data_items)):
                                    # OpenAI SDK item vs dict
                                    openai_embedding = getattr(embedding_data, "embedding", None)
                                    if openai_embedding is None and isinstance(embedding_data, dict):
                                        openai_embedding = embedding_data.get("embedding")
                                    if openai_embedding is None:
                                        raise ValueError("Embedding item missing 'embedding' field")

                                    # Cache the result
                                    self._cache_embedding(text, model, cast(List[float], openai_embedding))

                                    # tokens per item (approx if total not provided)
                                    per_item_tokens = (total_tokens_used // len(uncached_texts)) if total_tokens_used else self._estimate_tokens(text)

                                    result = EmbeddingResult(
                                        text=text,
                                        embedding=cast(List[float], openai_embedding),
                                        model=model,
                                        dimensions=len(embedding),
                                        tokens_used=per_item_tokens,
                                        processing_time=(time.time() - start_time) / max(1, len(uncached_texts)),
                                        cached=False
                                    )
                                    batch_results.append(result)
                                    total_tokens += result.tokens_used
                                break
                            except Exception as e:
                                if attempt == self.max_retries - 1:
                                    raise e
                                logger.warning(f"OpenAI batch embedding attempt {attempt + 1} failed: {e}")
                                await asyncio.sleep(self.retry_delay * (2 ** attempt))

                    elif provider == 'google':
                        # Process Google embeddings one by one (no batch API)
                        for text in uncached_texts:
                            try:
                                await self._acquire_rate_limit()
                                embedding, tokens_used = await self._generate_google_embedding(text, model)

                                # Cache the result
                                self._cache_embedding(text, model, embedding)

                                result = EmbeddingResult(
                                    text=text,
                                    embedding=embedding,
                                    model=model,
                                    dimensions=len(embedding),
                                    tokens_used=tokens_used,
                                    processing_time=(time.time() - start_time) / len(uncached_texts),
                                    cached=False
                                )
                                batch_results.append(result)
                                total_tokens += result.tokens_used
                            except Exception as e:
                                error_msg = f"Google embedding failed for text: {e}"
                                logger.error(error_msg)
                                errors.append(error_msg)

                    else:
                        error_msg = f"No client available for provider: {provider}"
                        logger.error(error_msg)
                        errors.append(error_msg)

                except Exception as e:
                    error_msg = f"Batch embedding failed: {e}"
                    logger.error(error_msg)
                    errors.append(error_msg)

            results.extend(batch_results)

        total_time = time.time() - start_time

        # Emit batch cost event
        batch_cost = self.estimate_cost_for_tokens(total_tokens, model)
        self._emit_cost_event('batch_embeddings_generated', {
            'model': model,
            'total_tokens': total_tokens,
            'total_cost': batch_cost,
            'success_count': len(results),
            'error_count': len(errors)
        })

        return BatchEmbeddingResult(
            results=results,
            total_tokens=total_tokens,
            total_time=total_time,
            success_count=len(results),
            error_count=len(errors),
            errors=errors
        )

    def get_model_info(self, model: Optional[str] = None) -> Dict[str, Any]:
        """Get information about embedding models"""
        if model:
            return self.model_configs.get(model, {})
        else:
            return self.model_configs

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if not self.redis_client:
            return {'cache_available': False}

        try:
            info = self.redis_client.info()
            return {
                'cache_available': True,
                'used_memory': info.get('used_memory_human', 'unknown'),
                'connected_clients': info.get('connected_clients', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'cache_hits': info.get('keyspace_hits', 0),
                'cache_misses': info.get('keyspace_misses', 0)
            }
        except Exception as e:
            return {'cache_available': False, 'error': str(e)}

    def clear_cache(self, pattern: str = "embedding:*") -> bool:
        """Clear embedding cache"""
        if not self.redis_client:
            return False

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                logger.info(f"Cleared {len(keys)} cached embeddings")
            return True
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return False

    def is_available(self) -> bool:
        """Check if embedding service is available"""
        if self.provider == 'google':
            return GOOGLE_AVAILABLE and self.google_api_key is not None
        elif self.provider == 'openai':
            # Check for OpenRouter API key since we use OpenRouter for OpenAI embeddings
            return OPENAI_AVAILABLE and self.openai_client is not None
        return False

# Global instance - Use local deterministic embeddings for Phase 2 to ensure zero billing
embedding_service = EmbeddingService(provider='local')
