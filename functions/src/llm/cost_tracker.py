"""
Cost Tracker - Real-time cost tracking with usage metrics and billing integration
"""
import logging
import asyncio
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
import json

# Import free models configuration
from .free_models_config import get_model_by_id

logger = logging.getLogger(__name__)

@dataclass
class CostEntry:
    user_id: str
    provider: str
    model: str
    tokens_used: int
    cost: Decimal
    timestamp: datetime
    request_id: str
    endpoint: str
    metadata: Dict[str, Any]

@dataclass
class UsageStats:
    total_requests: int
    total_tokens: int
    total_cost: Decimal
    requests_by_provider: Dict[str, int]
    tokens_by_provider: Dict[str, int]
    cost_by_provider: Dict[str, Decimal]
    requests_by_model: Dict[str, int]
    average_cost_per_request: Decimal
    average_tokens_per_request: float
    # Free model tracking
    free_requests: int = 0
    free_tokens: int = 0
    paid_requests: int = 0
    paid_tokens: int = 0
    cost_savings: Decimal = Decimal("0.00")  # Estimated savings from free models

@dataclass
class CostLimit:
    daily_limit: Decimal
    monthly_limit: Decimal
    per_request_limit: Decimal
    enabled: bool = True

class CostTracker:
    """
    Real-time cost tracking with usage metrics and billing integration
    """

    def __init__(self, firestore_client=None):
        self.db = firestore_client
        self.cost_entries = []  # Local cache for batch operations
        self.batch_size = 100

        # Cost rates per provider/model (in USD per 1K tokens)
        self.cost_rates = {
            "openai": {
                "gpt-4o": {"input": 0.0025, "output": 0.01},
                "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
                "gpt-4": {"input": 0.03, "output": 0.06},
                "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
                "text-embedding-3-small": {"input": 0.00002, "output": 0},
                "text-embedding-3-large": {"input": 0.00013, "output": 0}
            },
            "anthropic": {
                "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
                "claude-3-haiku-20240307": {"input": 0.00025, "output": 0.00125},
                "claude-3-opus-20240229": {"input": 0.015, "output": 0.075}
            },
            "google": {
                "gemini-1.5-pro": {"input": 0.00125, "output": 0.005},
                "gemini-1.5-flash": {"input": 0.000075, "output": 0.0003},
                "gemini-1.0-pro": {"input": 0.0005, "output": 0.0015}
            },
            "cohere": {
                "command-r-plus": {"input": 0.003, "output": 0.015},
                "command-r": {"input": 0.0005, "output": 0.0015},
                "embed-english-v3.0": {"input": 0.0001, "output": 0}
            }
        }

        # Default cost limits
        self.default_limits = {
            "free": CostLimit(
                daily_limit=Decimal("1.00"),
                monthly_limit=Decimal("10.00"),
                per_request_limit=Decimal("0.10")
            ),
            "pro": CostLimit(
                daily_limit=Decimal("50.00"),
                monthly_limit=Decimal("500.00"),
                per_request_limit=Decimal("5.00")
            ),
            "enterprise": CostLimit(
                daily_limit=Decimal("1000.00"),
                monthly_limit=Decimal("10000.00"),
                per_request_limit=Decimal("100.00")
            )
        }

    def is_free_model(self, model: str) -> bool:
        """
        Check if a model is a free model
        """
        # Check if model ID ends with :free
        if model.endswith(':free'):
            return True

        # Check against free models configuration
        free_model = get_model_by_id(model)
        return free_model is not None

    def calculate_cost(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int = 0
    ) -> Decimal:
        """
        Calculate cost based on provider, model, and token usage
        Returns $0.00 for free models
        """
        try:
            # Check if this is a free model
            if self.is_free_model(model):
                logger.info(f"Free model detected: {model}, cost = $0.00")
                return Decimal("0.00")

            if provider not in self.cost_rates:
                logger.warning(f"Unknown provider: {provider}")
                return Decimal("0.001")  # Default minimal cost

            if model not in self.cost_rates[provider]:
                logger.warning(f"Unknown model: {model} for provider: {provider}")
                # Use average cost for provider
                avg_rates = list(self.cost_rates[provider].values())[0]
            else:
                avg_rates = self.cost_rates[provider][model]

            input_cost = Decimal(str(avg_rates["input"])) * Decimal(str(input_tokens)) / Decimal("1000")
            output_cost = Decimal(str(avg_rates["output"])) * Decimal(str(output_tokens)) / Decimal("1000")

            total_cost = input_cost + output_cost

            # Round to 6 decimal places
            return total_cost.quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)

        except Exception as e:
            logger.error(f"Error calculating cost: {e}")
            return Decimal("0.001")  # Fallback cost

    def track_usage(
        self,
        user_id: str,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int = 0,
        request_id: Optional[str] = None,
        endpoint: str = "default",
        metadata: Optional[Dict[str, Any]] = None
    ) -> CostEntry:
        """
        Track usage and calculate cost
        Properly tracks free vs paid model usage
        """
        total_tokens = input_tokens + output_tokens
        cost = self.calculate_cost(provider, model, input_tokens, output_tokens)
        is_free = self.is_free_model(model)

        # Add free/paid indicator to metadata
        enhanced_metadata = metadata or {}
        enhanced_metadata['is_free_model'] = is_free
        enhanced_metadata['model_type'] = 'free' if is_free else 'paid'

        cost_entry = CostEntry(
            user_id=user_id,
            provider=provider,
            model=model,
            tokens_used=total_tokens,
            cost=cost,
            timestamp=datetime.now(timezone.utc),
            request_id=request_id or f"req_{int(datetime.now().timestamp())}",
            endpoint=endpoint,
            metadata=enhanced_metadata
        )

        # Add to local cache
        self.cost_entries.append(cost_entry)

        # Batch write to Firestore if cache is full
        if len(self.cost_entries) >= self.batch_size:
            self._flush_cost_entries()

        # Save individual entry to Firestore immediately for real-time tracking
        if self.db:
            self._save_cost_entry(cost_entry)

        model_type = "FREE" if is_free else "PAID"
        logger.info(f"Tracked usage ({model_type}): {user_id}, {provider}/{model}, {total_tokens} tokens, ${cost}")

        return cost_entry

    async def track_cost_async(self, cost_entry: CostEntry):
        """
        Async version of cost tracking
        Saves cost entry to Firestore asynchronously
        """
        try:
            # Add to local cache
            self.cost_entries.append(cost_entry)

            # Save to Firestore in background
            if self.db:
                # Run sync method in executor to avoid blocking
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, self._save_cost_entry, cost_entry)

            logger.info(f"Tracked cost async: {cost_entry.user_id}, ${cost_entry.cost}")
        except Exception as e:
            logger.error(f"Error tracking cost async: {str(e)}")

    def check_cost_limits(self, user_id: str, user_tier: str = "free") -> Dict[str, Any]:
        """
        Check if user is within cost limits
        """
        limits = self.default_limits.get(user_tier, self.default_limits["free"])

        if not limits.enabled:
            return {"within_limits": True, "limits_checked": False}

        now = datetime.now(timezone.utc)

        # Get daily usage
        daily_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        daily_usage = self._get_usage_for_period(user_id, daily_start, now)

        # Get monthly usage
        monthly_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_usage = self._get_usage_for_period(user_id, monthly_start, now)

        # Check limits
        daily_exceeded = daily_usage.total_cost >= limits.daily_limit
        monthly_exceeded = monthly_usage.total_cost >= limits.monthly_limit

        return {
            "within_limits": not (daily_exceeded or monthly_exceeded),
            "limits_checked": True,
            "daily": {
                "used": float(daily_usage.total_cost),
                "limit": float(limits.daily_limit),
                "remaining": float(limits.daily_limit - daily_usage.total_cost),
                "exceeded": daily_exceeded
            },
            "monthly": {
                "used": float(monthly_usage.total_cost),
                "limit": float(limits.monthly_limit),
                "remaining": float(limits.monthly_limit - monthly_usage.total_cost),
                "exceeded": monthly_exceeded
            },
            "per_request_limit": float(limits.per_request_limit)
        }

    def get_usage_stats(
        self,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> UsageStats:
        """
        Get usage statistics for a user within a date range
        """
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)

        return self._get_usage_for_period(user_id, start_date, end_date)

    def _get_usage_for_period(
        self,
        user_id: str,
        start_date: datetime,
        end_date: datetime
    ) -> UsageStats:
        """
        Get usage statistics for a specific period
        """
        if not self.db:
            # Return empty stats if no database
            return UsageStats(
                total_requests=0,
                total_tokens=0,
                total_cost=Decimal("0"),
                requests_by_provider={},
                tokens_by_provider={},
                cost_by_provider={},
                requests_by_model={},
                average_cost_per_request=Decimal("0"),
                average_tokens_per_request=0.0,
                free_requests=0,
                free_tokens=0,
                paid_requests=0,
                paid_tokens=0,
                cost_savings=Decimal("0.00")
            )

        try:
            # Query Firestore for cost entries in the period
            cost_collection = self.db.collection('cost_tracking')
            query = cost_collection.where('user_id', '==', user_id)\
                                  .where('timestamp', '>=', start_date)\
                                  .where('timestamp', '<=', end_date)

            entries = query.stream()

            # Aggregate statistics
            total_requests = 0
            total_tokens = 0
            total_cost = Decimal("0")
            requests_by_provider: Dict[str, int] = {}
            tokens_by_provider: Dict[str, int] = {}
            cost_by_provider: Dict[str, Decimal] = {}
            requests_by_model: Dict[str, int] = {}

            # Free vs Paid tracking
            free_requests = 0
            free_tokens = 0
            paid_requests = 0
            paid_tokens = 0
            cost_savings = Decimal("0.00")

            for entry_doc in entries:
                entry_data = entry_doc.to_dict()

                total_requests += 1
                tokens_used = entry_data.get('tokens_used', 0)
                cost = Decimal(str(entry_data.get('cost', 0)))
                total_tokens += tokens_used
                total_cost += cost

                provider = entry_data.get('provider', 'unknown')
                model = entry_data.get('model', 'unknown')

                # Check if this is a free model
                metadata = entry_data.get('metadata', {})
                is_free = metadata.get('is_free_model', False) or self.is_free_model(model)

                if is_free:
                    free_requests += 1
                    free_tokens += tokens_used
                    # Estimate cost savings (assume GPT-3.5-turbo pricing as baseline)
                    estimated_cost = Decimal(str(tokens_used)) * Decimal("0.001") / Decimal("1000")
                    cost_savings += estimated_cost
                else:
                    paid_requests += 1
                    paid_tokens += tokens_used

                # By provider
                requests_by_provider[provider] = requests_by_provider.get(provider, 0) + 1
                tokens_by_provider[provider] = tokens_by_provider.get(provider, 0) + tokens_used
                cost_by_provider[provider] = cost_by_provider.get(provider, Decimal("0")) + cost

                # By model
                requests_by_model[model] = requests_by_model.get(model, 0) + 1

            # Calculate averages
            avg_cost_per_request = total_cost / total_requests if total_requests > 0 else Decimal("0")
            avg_tokens_per_request = total_tokens / total_requests if total_requests > 0 else 0.0

            return UsageStats(
                total_requests=total_requests,
                total_tokens=total_tokens,
                total_cost=total_cost,
                requests_by_provider=requests_by_provider,
                tokens_by_provider=tokens_by_provider,
                cost_by_provider=cost_by_provider,
                requests_by_model=requests_by_model,
                average_cost_per_request=avg_cost_per_request,
                average_tokens_per_request=avg_tokens_per_request,
                free_requests=free_requests,
                free_tokens=free_tokens,
                paid_requests=paid_requests,
                paid_tokens=paid_tokens,
                cost_savings=cost_savings
            )

        except Exception as e:
            logger.error(f"Error getting usage stats: {e}")
            return UsageStats(
                total_requests=0,
                total_tokens=0,
                total_cost=Decimal("0"),
                requests_by_provider={},
                tokens_by_provider={},
                cost_by_provider={},
                requests_by_model={},
                average_cost_per_request=Decimal("0"),
                average_tokens_per_request=0.0,
                free_requests=0,
                free_tokens=0,
                paid_requests=0,
                paid_tokens=0,
                cost_savings=Decimal("0.00")
            )

    def _save_cost_entry(self, cost_entry: CostEntry):
        """
        Save cost entry to Firestore
        """
        if not self.db:
            return

        try:
            cost_data = asdict(cost_entry)
            cost_data['cost'] = float(cost_entry.cost)  # Convert Decimal to float for Firestore
            cost_data['timestamp'] = cost_entry.timestamp  # Firestore handles datetime

            self.db.collection('cost_tracking').add(cost_data)

        except Exception as e:
            logger.error(f"Error saving cost entry: {e}")

    def _flush_cost_entries(self):
        """
        Flush cached cost entries to Firestore in batch
        """
        if not self.db or not self.cost_entries:
            return

        try:
            batch = self.db.batch()

            for cost_entry in self.cost_entries:
                cost_data = asdict(cost_entry)
                cost_data['cost'] = float(cost_entry.cost)
                cost_data['timestamp'] = cost_entry.timestamp

                doc_ref = self.db.collection('cost_tracking').document()
                batch.set(doc_ref, cost_data)

            batch.commit()
            logger.info(f"Flushed {len(self.cost_entries)} cost entries to Firestore")

            # Clear cache
            self.cost_entries = []

        except Exception as e:
            logger.error(f"Error flushing cost entries: {e}")

    def get_cost_breakdown(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get detailed cost breakdown for a user
        """
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        stats = self._get_usage_for_period(user_id, start_date, end_date)

        return {
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days
            },
            "summary": {
                "total_requests": stats.total_requests,
                "total_tokens": stats.total_tokens,
                "total_cost": float(stats.total_cost),
                "average_cost_per_request": float(stats.average_cost_per_request),
                "average_tokens_per_request": stats.average_tokens_per_request
            },
            "by_provider": {
                provider: {
                    "requests": stats.requests_by_provider.get(provider, 0),
                    "tokens": stats.tokens_by_provider.get(provider, 0),
                    "cost": float(stats.cost_by_provider.get(provider, Decimal("0")))
                }
                for provider in set(list(stats.requests_by_provider.keys()) + list(stats.cost_by_provider.keys()))
            },
            "by_model": stats.requests_by_model
        }

# Global instance
cost_tracker = CostTracker()
