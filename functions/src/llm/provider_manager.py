"""
Unified Provider Interface - Advanced provider management with failover and load balancing
"""
import logging
import asyncio
import time
import random
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

from .llm_manager import LLMManager, ProviderType, LLMResponse

logger = logging.getLogger(__name__)

class ProviderStatus(Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    MAINTENANCE = "maintenance"

@dataclass
class ProviderHealth:
    status: ProviderStatus
    last_check: datetime
    response_time: float
    error_rate: float
    success_count: int
    error_count: int
    last_error: Optional[str] = None

@dataclass
class ProviderCapabilities:
    max_tokens: int
    supports_streaming: bool
    supports_function_calling: bool
    supports_multimodal: bool
    supports_embeddings: bool
    cost_per_1k_tokens: float
    rate_limit_rpm: int

class LoadBalancingStrategy(Enum):
    ROUND_ROBIN = "round_robin"
    LEAST_LATENCY = "least_latency"
    LEAST_COST = "least_cost"
    WEIGHTED_RANDOM = "weighted_random"
    HEALTH_BASED = "health_based"

class ProviderManager:
    """
    Advanced provider management with failover, load balancing, and health monitoring
    """
    
    def __init__(self, llm_manager: LLMManager):
        self.llm_manager = llm_manager
        self.provider_health: Dict[ProviderType, ProviderHealth] = {}
        self.provider_capabilities: Dict[ProviderType, ProviderCapabilities] = {}
        self.load_balancing_strategy = LoadBalancingStrategy.HEALTH_BASED
        self.failover_enabled = True
        self.health_check_interval = 300  # 5 minutes
        self.circuit_breaker_threshold = 0.5  # 50% error rate
        self.circuit_breaker_timeout = 600  # 10 minutes
        
        # Provider weights for load balancing
        self.provider_weights: Dict[ProviderType, float] = {
            ProviderType.OPENAI: 1.0,
            ProviderType.ANTHROPIC: 1.0,
            ProviderType.GOOGLE: 0.8,
            ProviderType.COHERE: 0.7
        }
        
        # Round robin counter
        self._round_robin_counter = 0
        
        # Initialize provider capabilities
        self._initialize_provider_capabilities()
        
        # Start health monitoring
        asyncio.create_task(self._health_monitor_loop())
    
    def _initialize_provider_capabilities(self):
        """Initialize provider capabilities"""
        self.provider_capabilities = {
            ProviderType.OPENAI: ProviderCapabilities(
                max_tokens=128000,
                supports_streaming=True,
                supports_function_calling=True,
                supports_multimodal=True,
                supports_embeddings=True,
                cost_per_1k_tokens=0.0015,
                rate_limit_rpm=3500
            ),
            ProviderType.ANTHROPIC: ProviderCapabilities(
                max_tokens=200000,
                supports_streaming=True,
                supports_function_calling=False,
                supports_multimodal=True,
                supports_embeddings=False,
                cost_per_1k_tokens=0.003,
                rate_limit_rpm=1000
            ),
            ProviderType.GOOGLE: ProviderCapabilities(
                max_tokens=32768,
                supports_streaming=True,
                supports_function_calling=True,
                supports_multimodal=True,
                supports_embeddings=True,
                cost_per_1k_tokens=0.0005,
                rate_limit_rpm=60
            ),
            ProviderType.COHERE: ProviderCapabilities(
                max_tokens=4096,
                supports_streaming=True,
                supports_function_calling=False,
                supports_multimodal=False,
                supports_embeddings=True,
                cost_per_1k_tokens=0.001,
                rate_limit_rpm=1000
            )
        }
        
        # Initialize health status
        for provider_type in ProviderType:
            self.provider_health[provider_type] = ProviderHealth(
                status=ProviderStatus.HEALTHY,
                last_check=datetime.now(),
                response_time=0.0,
                error_rate=0.0,
                success_count=0,
                error_count=0
            )
    
    async def generate_response(self, prompt: str, requirements: Optional[Dict[str, Any]] = None, **kwargs) -> LLMResponse:
        """
        Generate response with intelligent provider selection and failover
        """
        requirements = requirements or {}
        
        # Select optimal provider
        selected_providers = self._select_providers(requirements)
        
        last_error = None
        
        for provider_type in selected_providers:
            try:
                # Check if provider is healthy
                if not self._is_provider_healthy(provider_type):
                    logger.warning(f"Skipping unhealthy provider: {provider_type.value}")
                    continue
                
                # Generate response
                start_time = time.time()
                response = await self.llm_manager.generate_response(
                    prompt, 
                    provider=provider_type.value,
                    **kwargs
                )
                response_time = time.time() - start_time
                
                # Update health metrics
                self._update_provider_health(provider_type, True, response_time)
                
                # Add provider selection metadata
                response.metadata.update({
                    'selected_provider': provider_type.value,
                    'provider_selection_strategy': self.load_balancing_strategy.value,
                    'failover_attempts': len(selected_providers) - selected_providers.index(provider_type) - 1
                })
                
                return response
                
            except Exception as e:
                last_error = e
                logger.error(f"Provider {provider_type.value} failed: {e}")
                
                # Update health metrics
                self._update_provider_health(provider_type, False, 0.0, str(e))
                
                # Continue to next provider if failover is enabled
                if not self.failover_enabled:
                    break
        
        # All providers failed
        raise Exception(f"All providers failed. Last error: {last_error}")
    
    def _select_providers(self, requirements: Dict[str, Any]) -> List[ProviderType]:
        """
        Select providers based on requirements and load balancing strategy
        """
        # Filter providers based on requirements
        eligible_providers = []
        
        for provider_type, capabilities in self.provider_capabilities.items():
            # Check if provider meets requirements
            if self._meets_requirements(capabilities, requirements):
                eligible_providers.append(provider_type)
        
        if not eligible_providers:
            # Fallback to all available providers
            eligible_providers = list(ProviderType)
        
        # Apply load balancing strategy
        return self._apply_load_balancing(eligible_providers)
    
    def _meets_requirements(self, capabilities: ProviderCapabilities, requirements: Dict[str, Any]) -> bool:
        """Check if provider capabilities meet requirements"""
        if requirements.get('max_tokens', 0) > capabilities.max_tokens:
            return False
        
        if requirements.get('requires_streaming', False) and not capabilities.supports_streaming:
            return False
        
        if requirements.get('requires_function_calling', False) and not capabilities.supports_function_calling:
            return False
        
        if requirements.get('requires_multimodal', False) and not capabilities.supports_multimodal:
            return False
        
        if requirements.get('requires_embeddings', False) and not capabilities.supports_embeddings:
            return False
        
        if requirements.get('max_cost_per_1k', float('inf')) < capabilities.cost_per_1k_tokens:
            return False
        
        return True
    
    def _apply_load_balancing(self, providers: List[ProviderType]) -> List[ProviderType]:
        """Apply load balancing strategy to provider list"""
        if self.load_balancing_strategy == LoadBalancingStrategy.ROUND_ROBIN:
            return self._round_robin_selection(providers)
        
        elif self.load_balancing_strategy == LoadBalancingStrategy.LEAST_LATENCY:
            return self._least_latency_selection(providers)
        
        elif self.load_balancing_strategy == LoadBalancingStrategy.LEAST_COST:
            return self._least_cost_selection(providers)
        
        elif self.load_balancing_strategy == LoadBalancingStrategy.WEIGHTED_RANDOM:
            return self._weighted_random_selection(providers)
        
        elif self.load_balancing_strategy == LoadBalancingStrategy.HEALTH_BASED:
            return self._health_based_selection(providers)
        
        else:
            return providers
    
    def _round_robin_selection(self, providers: List[ProviderType]) -> List[ProviderType]:
        """Round robin provider selection"""
        if not providers:
            return providers
        
        # Rotate the list based on counter
        self._round_robin_counter = (self._round_robin_counter + 1) % len(providers)
        return providers[self._round_robin_counter:] + providers[:self._round_robin_counter]
    
    def _least_latency_selection(self, providers: List[ProviderType]) -> List[ProviderType]:
        """Select providers by lowest latency"""
        return sorted(providers, key=lambda p: self.provider_health[p].response_time)
    
    def _least_cost_selection(self, providers: List[ProviderType]) -> List[ProviderType]:
        """Select providers by lowest cost"""
        return sorted(providers, key=lambda p: self.provider_capabilities[p].cost_per_1k_tokens)
    
    def _weighted_random_selection(self, providers: List[ProviderType]) -> List[ProviderType]:
        """Weighted random provider selection"""
        # Calculate weights based on health and configured weights
        weights = []
        for provider in providers:
            health = self.provider_health[provider]
            base_weight = self.provider_weights.get(provider, 1.0)
            
            # Adjust weight based on health
            if health.status == ProviderStatus.HEALTHY:
                health_multiplier = 1.0
            elif health.status == ProviderStatus.DEGRADED:
                health_multiplier = 0.5
            else:
                health_multiplier = 0.1
            
            weights.append(base_weight * health_multiplier)
        
        # Weighted random selection
        if sum(weights) == 0:
            return providers
        
        selected = random.choices(providers, weights=weights, k=len(providers))
        return list(dict.fromkeys(selected))  # Remove duplicates while preserving order
    
    def _health_based_selection(self, providers: List[ProviderType]) -> List[ProviderType]:
        """Select providers based on health status"""
        healthy = []
        degraded = []
        unhealthy = []
        
        for provider in providers:
            health = self.provider_health[provider]
            if health.status == ProviderStatus.HEALTHY:
                healthy.append(provider)
            elif health.status == ProviderStatus.DEGRADED:
                degraded.append(provider)
            else:
                unhealthy.append(provider)
        
        # Sort each group by response time
        healthy.sort(key=lambda p: self.provider_health[p].response_time)
        degraded.sort(key=lambda p: self.provider_health[p].response_time)
        unhealthy.sort(key=lambda p: self.provider_health[p].response_time)
        
        return healthy + degraded + unhealthy
    
    def _is_provider_healthy(self, provider_type: ProviderType) -> bool:
        """Check if provider is healthy"""
        health = self.provider_health[provider_type]
        
        # Check circuit breaker
        if health.error_rate > self.circuit_breaker_threshold:
            time_since_last_error = (datetime.now() - health.last_check).total_seconds()
            if time_since_last_error < self.circuit_breaker_timeout:
                return False
        
        return health.status in [ProviderStatus.HEALTHY, ProviderStatus.DEGRADED]
    
    def _update_provider_health(self, provider_type: ProviderType, success: bool, response_time: float, error: Optional[str] = None):
        """Update provider health metrics"""
        health = self.provider_health[provider_type]
        
        if success:
            health.success_count += 1
            health.response_time = (health.response_time + response_time) / 2  # Moving average
        else:
            health.error_count += 1
            health.last_error = error
        
        # Calculate error rate
        total_requests = health.success_count + health.error_count
        health.error_rate = health.error_count / total_requests if total_requests > 0 else 0
        
        # Update status based on metrics
        if health.error_rate > 0.8:
            health.status = ProviderStatus.UNHEALTHY
        elif health.error_rate > 0.3:
            health.status = ProviderStatus.DEGRADED
        else:
            health.status = ProviderStatus.HEALTHY
        
        health.last_check = datetime.now()
    
    async def _health_monitor_loop(self):
        """Background health monitoring loop"""
        while True:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._perform_health_checks()
            except Exception as e:
                logger.error(f"Health monitor error: {e}")
    
    async def _perform_health_checks(self):
        """Perform health checks on all providers"""
        test_prompt = "Hello, this is a health check."
        
        for provider_type in ProviderType:
            try:
                start_time = time.time()
                await self.llm_manager.generate_response(
                    test_prompt,
                    provider=provider_type.value,
                    max_tokens=10
                )
                response_time = time.time() - start_time
                
                self._update_provider_health(provider_type, True, response_time)
                
            except Exception as e:
                self._update_provider_health(provider_type, False, 0.0, str(e))
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get current provider status"""
        status = {}
        
        for provider_type, health in self.provider_health.items():
            capabilities = self.provider_capabilities[provider_type]
            
            status[provider_type.value] = {
                'status': health.status.value,
                'response_time': health.response_time,
                'error_rate': health.error_rate,
                'success_count': health.success_count,
                'error_count': health.error_count,
                'last_error': health.last_error,
                'last_check': health.last_check.isoformat(),
                'capabilities': {
                    'max_tokens': capabilities.max_tokens,
                    'supports_streaming': capabilities.supports_streaming,
                    'supports_function_calling': capabilities.supports_function_calling,
                    'supports_multimodal': capabilities.supports_multimodal,
                    'supports_embeddings': capabilities.supports_embeddings,
                    'cost_per_1k_tokens': capabilities.cost_per_1k_tokens,
                    'rate_limit_rpm': capabilities.rate_limit_rpm
                }
            }
        
        return status
    
    def set_load_balancing_strategy(self, strategy: LoadBalancingStrategy):
        """Set load balancing strategy"""
        self.load_balancing_strategy = strategy
        logger.info(f"Load balancing strategy set to: {strategy.value}")
    
    def set_provider_weight(self, provider_type: ProviderType, weight: float):
        """Set provider weight for load balancing"""
        self.provider_weights[provider_type] = weight
        logger.info(f"Provider {provider_type.value} weight set to: {weight}")
    
    def enable_failover(self, enabled: bool = True):
        """Enable or disable failover"""
        self.failover_enabled = enabled
        logger.info(f"Failover {'enabled' if enabled else 'disabled'}")
    
    def force_provider_status(self, provider_type: ProviderType, status: ProviderStatus):
        """Force a provider status (for maintenance, etc.)"""
        self.provider_health[provider_type].status = status
        logger.info(f"Provider {provider_type.value} status forced to: {status.value}")

