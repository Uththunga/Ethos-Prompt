"""
Cost Tracking and Optimization Analytics Engine
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import statistics
from collections import defaultdict

from google.cloud import firestore
from google.cloud.firestore import AsyncClient

logger = logging.getLogger(__name__)

class ProviderType(Enum):
    """AI Provider types"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    COHERE = "cohere"
    OPENROUTER = "openrouter"

class CostCategory(Enum):
    """Cost categories"""
    EMBEDDING = "embedding"
    CHAT_COMPLETION = "chat_completion"
    SEARCH = "search"
    STORAGE = "storage"
    COMPUTE = "compute"

@dataclass
class CostEvent:
    """Individual cost event"""
    id: str
    timestamp: datetime
    provider: ProviderType
    category: CostCategory
    model_name: str
    tokens_used: int
    cost_usd: float
    request_id: str
    user_id: Optional[str]
    session_id: Optional[str]
    metadata: Dict[str, Any]

@dataclass
class ProviderPricing:
    """Provider pricing configuration"""
    provider: ProviderType
    model_name: str
    input_token_cost: float  # Cost per 1K input tokens
    output_token_cost: float  # Cost per 1K output tokens
    request_cost: float  # Fixed cost per request
    effective_date: datetime
    currency: str = "USD"

@dataclass
class CostSummary:
    """Cost summary for a time period"""
    period_start: datetime
    period_end: datetime
    total_cost: float
    total_requests: int
    total_tokens: int
    cost_by_provider: Dict[str, float]
    cost_by_category: Dict[str, float]
    cost_by_model: Dict[str, float]
    avg_cost_per_request: float
    avg_cost_per_token: float
    top_expensive_requests: List[Dict[str, Any]]

@dataclass
class CostOptimizationRecommendation:
    """Cost optimization recommendation"""
    type: str
    title: str
    description: str
    potential_savings: float
    confidence: float
    implementation_effort: str  # 'low', 'medium', 'high'
    priority: str  # 'low', 'medium', 'high'
    details: Dict[str, Any]

@dataclass
class CostForecast:
    """Cost forecast data"""
    forecast_date: datetime
    period_days: int
    predicted_cost: float
    confidence_interval: Tuple[float, float]
    trend: str  # 'increasing', 'decreasing', 'stable'
    factors: List[str]

class CostTracker:
    """
    Cost Tracking and Optimization Analytics Engine
    """
    
    def __init__(self, firestore_client: Optional[AsyncClient] = None):
        """Initialize cost tracker"""
        self.firestore_client = firestore_client or firestore.AsyncClient()
        
        # Collections
        self.cost_events_collection = "cost_events"
        self.pricing_collection = "provider_pricing"
        self.summaries_collection = "cost_summaries"
        
        # Default pricing (would be loaded from configuration)
        self.default_pricing = {
            ProviderType.OPENAI: {
                "gpt-4": ProviderPricing(
                    provider=ProviderType.OPENAI,
                    model_name="gpt-4",
                    input_token_cost=0.03,  # $0.03 per 1K tokens
                    output_token_cost=0.06,  # $0.06 per 1K tokens
                    request_cost=0.0,
                    effective_date=datetime.utcnow()
                ),
                "gpt-3.5-turbo": ProviderPricing(
                    provider=ProviderType.OPENAI,
                    model_name="gpt-3.5-turbo",
                    input_token_cost=0.001,  # $0.001 per 1K tokens
                    output_token_cost=0.002,  # $0.002 per 1K tokens
                    request_cost=0.0,
                    effective_date=datetime.utcnow()
                ),
                "text-embedding-ada-002": ProviderPricing(
                    provider=ProviderType.OPENAI,
                    model_name="text-embedding-ada-002",
                    input_token_cost=0.0001,  # $0.0001 per 1K tokens
                    output_token_cost=0.0,
                    request_cost=0.0,
                    effective_date=datetime.utcnow()
                )
            },
            ProviderType.ANTHROPIC: {
                "claude-3-opus": ProviderPricing(
                    provider=ProviderType.ANTHROPIC,
                    model_name="claude-3-opus",
                    input_token_cost=0.015,  # $0.015 per 1K tokens
                    output_token_cost=0.075,  # $0.075 per 1K tokens
                    request_cost=0.0,
                    effective_date=datetime.utcnow()
                ),
                "claude-3-sonnet": ProviderPricing(
                    provider=ProviderType.ANTHROPIC,
                    model_name="claude-3-sonnet",
                    input_token_cost=0.003,  # $0.003 per 1K tokens
                    output_token_cost=0.015,  # $0.015 per 1K tokens
                    request_cost=0.0,
                    effective_date=datetime.utcnow()
                )
            }
        }
        
        logger.info("Cost tracker initialized")
    
    async def record_cost_event(self, event: CostEvent) -> bool:
        """Record a cost event"""
        try:
            # Store in Firestore
            doc_ref = self.firestore_client.collection(self.cost_events_collection).document(event.id)
            event_data = asdict(event)
            event_data['provider'] = event.provider.value
            event_data['category'] = event.category.value
            event_data['date'] = event.timestamp.date().isoformat()
            event_data['hour'] = event.timestamp.hour
            
            await doc_ref.set(event_data)
            
            logger.debug(f"Recorded cost event: {event.id} - ${event.cost_usd:.4f}")
            return True
            
        except Exception as e:
            logger.error(f"Error recording cost event: {e}")
            return False
    
    async def calculate_cost(self, provider: ProviderType, model_name: str, 
                           input_tokens: int, output_tokens: int = 0) -> float:
        """Calculate cost for a request"""
        try:
            # Get pricing for provider and model
            pricing = self._get_pricing(provider, model_name)
            if not pricing:
                logger.warning(f"No pricing found for {provider.value}/{model_name}")
                return 0.0
            
            # Calculate cost
            input_cost = (input_tokens / 1000) * pricing.input_token_cost
            output_cost = (output_tokens / 1000) * pricing.output_token_cost
            total_cost = input_cost + output_cost + pricing.request_cost
            
            return total_cost
            
        except Exception as e:
            logger.error(f"Error calculating cost: {e}")
            return 0.0
    
    async def get_cost_summary(self, start_date: datetime, end_date: datetime) -> CostSummary:
        """Get cost summary for a time period"""
        try:
            # Query cost events
            query = (
                self.firestore_client.collection(self.cost_events_collection)
                .where("timestamp", ">=", start_date)
                .where("timestamp", "<=", end_date)
                .order_by("timestamp")
            )
            
            docs = await query.get()
            events = []
            
            for doc in docs:
                data = doc.to_dict()
                event = CostEvent(
                    id=data["id"],
                    timestamp=data["timestamp"],
                    provider=ProviderType(data["provider"]),
                    category=CostCategory(data["category"]),
                    model_name=data["model_name"],
                    tokens_used=data["tokens_used"],
                    cost_usd=data["cost_usd"],
                    request_id=data["request_id"],
                    user_id=data.get("user_id"),
                    session_id=data.get("session_id"),
                    metadata=data.get("metadata", {})
                )
                events.append(event)
            
            # Calculate summary
            total_cost = sum(e.cost_usd for e in events)
            total_requests = len(events)
            total_tokens = sum(e.tokens_used for e in events)
            
            # Group by provider
            cost_by_provider = defaultdict(float)
            for event in events:
                cost_by_provider[event.provider.value] += event.cost_usd
            
            # Group by category
            cost_by_category = defaultdict(float)
            for event in events:
                cost_by_category[event.category.value] += event.cost_usd
            
            # Group by model
            cost_by_model = defaultdict(float)
            for event in events:
                cost_by_model[event.model_name] += event.cost_usd
            
            # Calculate averages
            avg_cost_per_request = total_cost / total_requests if total_requests > 0 else 0.0
            avg_cost_per_token = total_cost / total_tokens if total_tokens > 0 else 0.0
            
            # Top expensive requests
            top_expensive = sorted(events, key=lambda e: e.cost_usd, reverse=True)[:10]
            top_expensive_requests = [
                {
                    "request_id": e.request_id,
                    "cost": e.cost_usd,
                    "provider": e.provider.value,
                    "model": e.model_name,
                    "tokens": e.tokens_used,
                    "timestamp": e.timestamp.isoformat()
                }
                for e in top_expensive
            ]
            
            return CostSummary(
                period_start=start_date,
                period_end=end_date,
                total_cost=total_cost,
                total_requests=total_requests,
                total_tokens=total_tokens,
                cost_by_provider=dict(cost_by_provider),
                cost_by_category=dict(cost_by_category),
                cost_by_model=dict(cost_by_model),
                avg_cost_per_request=avg_cost_per_request,
                avg_cost_per_token=avg_cost_per_token,
                top_expensive_requests=top_expensive_requests
            )
            
        except Exception as e:
            logger.error(f"Error getting cost summary: {e}")
            return CostSummary(
                period_start=start_date,
                period_end=end_date,
                total_cost=0.0,
                total_requests=0,
                total_tokens=0,
                cost_by_provider={},
                cost_by_category={},
                cost_by_model={},
                avg_cost_per_request=0.0,
                avg_cost_per_token=0.0,
                top_expensive_requests=[]
            )
    
    async def generate_optimization_recommendations(self, days: int = 30) -> List[CostOptimizationRecommendation]:
        """Generate cost optimization recommendations"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get cost summary
            summary = await self.get_cost_summary(start_date, end_date)
            
            recommendations = []
            
            # Recommendation 1: Model optimization
            if summary.cost_by_model:
                expensive_models = sorted(
                    summary.cost_by_model.items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:3]
                
                for model, cost in expensive_models:
                    if cost > summary.total_cost * 0.3:  # Model accounts for >30% of costs
                        recommendations.append(CostOptimizationRecommendation(
                            type="model_optimization",
                            title=f"Optimize {model} usage",
                            description=f"Model {model} accounts for ${cost:.2f} ({cost/summary.total_cost:.1%}) of total costs. Consider using a more cost-effective alternative.",
                            potential_savings=cost * 0.3,  # Estimate 30% savings
                            confidence=0.8,
                            implementation_effort="medium",
                            priority="high" if cost > summary.total_cost * 0.5 else "medium",
                            details={
                                "current_cost": cost,
                                "percentage_of_total": cost / summary.total_cost,
                                "suggested_alternatives": self._get_model_alternatives(model)
                            }
                        ))
            
            # Recommendation 2: Provider optimization
            if len(summary.cost_by_provider) > 1:
                provider_costs = list(summary.cost_by_provider.values())
                if max(provider_costs) > sum(provider_costs) * 0.7:  # One provider >70% of costs
                    dominant_provider = max(summary.cost_by_provider.items(), key=lambda x: x[1])
                    
                    recommendations.append(CostOptimizationRecommendation(
                        type="provider_diversification",
                        title="Diversify AI providers",
                        description=f"Provider {dominant_provider[0]} accounts for ${dominant_provider[1]:.2f} of costs. Consider diversifying to reduce dependency and potentially lower costs.",
                        potential_savings=dominant_provider[1] * 0.15,  # Estimate 15% savings
                        confidence=0.6,
                        implementation_effort="high",
                        priority="medium",
                        details={
                            "dominant_provider": dominant_provider[0],
                            "cost": dominant_provider[1],
                            "percentage": dominant_provider[1] / summary.total_cost
                        }
                    ))
            
            # Recommendation 3: Usage optimization
            if summary.avg_cost_per_request > 0.01:  # High cost per request
                recommendations.append(CostOptimizationRecommendation(
                    type="usage_optimization",
                    title="Optimize request patterns",
                    description=f"Average cost per request is ${summary.avg_cost_per_request:.4f}. Consider implementing caching, batching, or request optimization.",
                    potential_savings=summary.total_cost * 0.2,  # Estimate 20% savings
                    confidence=0.7,
                    implementation_effort="medium",
                    priority="medium",
                    details={
                        "avg_cost_per_request": summary.avg_cost_per_request,
                        "total_requests": summary.total_requests,
                        "optimization_strategies": [
                            "Implement response caching",
                            "Batch similar requests",
                            "Optimize prompt length",
                            "Use streaming for long responses"
                        ]
                    }
                ))
            
            # Recommendation 4: Budget alerts
            if summary.total_cost > 100:  # Significant spending
                recommendations.append(CostOptimizationRecommendation(
                    type="monitoring",
                    title="Set up budget alerts",
                    description="Implement automated budget alerts to prevent unexpected cost spikes.",
                    potential_savings=summary.total_cost * 0.1,  # Prevent 10% overspend
                    confidence=0.9,
                    implementation_effort="low",
                    priority="high",
                    details={
                        "current_monthly_cost": summary.total_cost * (30 / days),
                        "suggested_budget": summary.total_cost * 1.2,
                        "alert_thresholds": [0.5, 0.8, 0.9, 1.0]
                    }
                ))
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating optimization recommendations: {e}")
            return []
    
    async def forecast_costs(self, days_ahead: int = 30) -> CostForecast:
        """Forecast future costs based on historical data"""
        try:
            # Get historical data (last 30 days)
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=30)
            
            summary = await self.get_cost_summary(start_date, end_date)
            
            # Simple linear forecast based on daily average
            daily_avg_cost = summary.total_cost / 30
            predicted_cost = daily_avg_cost * days_ahead
            
            # Calculate confidence interval (simplified)
            margin_error = predicted_cost * 0.2  # 20% margin
            confidence_interval = (
                predicted_cost - margin_error,
                predicted_cost + margin_error
            )
            
            # Determine trend (simplified)
            trend = "stable"
            if daily_avg_cost > 10:
                trend = "increasing"
            elif daily_avg_cost < 1:
                trend = "decreasing"
            
            factors = [
                "Historical usage patterns",
                "Current growth rate",
                "Seasonal variations"
            ]
            
            return CostForecast(
                forecast_date=datetime.utcnow(),
                period_days=days_ahead,
                predicted_cost=predicted_cost,
                confidence_interval=confidence_interval,
                trend=trend,
                factors=factors
            )
            
        except Exception as e:
            logger.error(f"Error forecasting costs: {e}")
            return CostForecast(
                forecast_date=datetime.utcnow(),
                period_days=days_ahead,
                predicted_cost=0.0,
                confidence_interval=(0.0, 0.0),
                trend="unknown",
                factors=[]
            )
    
    def _get_pricing(self, provider: ProviderType, model_name: str) -> Optional[ProviderPricing]:
        """Get pricing for provider and model"""
        provider_pricing = self.default_pricing.get(provider, {})
        return provider_pricing.get(model_name)
    
    def _get_model_alternatives(self, model_name: str) -> List[str]:
        """Get alternative models for cost optimization"""
        alternatives = {
            "gpt-4": ["gpt-3.5-turbo", "claude-3-sonnet"],
            "claude-3-opus": ["claude-3-sonnet", "gpt-3.5-turbo"],
            "gpt-3.5-turbo": ["claude-3-haiku"],
        }
        return alternatives.get(model_name, [])


# Global instance
cost_tracker = CostTracker()
