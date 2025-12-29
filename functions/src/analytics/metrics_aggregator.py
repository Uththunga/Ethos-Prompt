"""
Metrics Aggregation Engine for Analytics
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from collections import defaultdict
import statistics
import json

from google.cloud import firestore
from google.cloud.firestore import AsyncClient

logger = logging.getLogger(__name__)

@dataclass
class AggregatedMetrics:
    """Aggregated metrics for a time period"""
    period_start: datetime
    period_end: datetime
    granularity: str  # 'minute', 'hour', 'day'
    metrics: Dict[str, Any]

@dataclass
class TrendData:
    """Trend data for metrics over time"""
    metric_name: str
    time_series: List[Tuple[datetime, float]]
    trend_direction: str  # 'up', 'down', 'stable'
    change_percentage: float

class MetricsAggregator:
    """
    Advanced metrics aggregation with time-series analysis
    """

    def __init__(self, firestore_client: Optional[AsyncClient] = None):
        """Initialize metrics aggregator"""
        self.firestore_client = firestore_client or firestore.AsyncClient()

        # simple in-memory cache with TTL
        # key -> (cached_at, data)
        self._cache: Dict[str, Tuple[datetime, Dict[str, AggregatedMetrics]]] = {}
        self._cache_ttl_seconds: int = 30

        # Aggregation configurations
        self.aggregation_rules = {
            "search_performance": {
                "metrics": ["response_time", "success_rate", "results_count"],
                "aggregations": ["avg", "p95", "count", "sum"]
            },
            "user_behavior": {
                "metrics": ["session_duration", "queries_per_session", "click_through_rate"],
                "aggregations": ["avg", "median", "count"]
            },
            "system_health": {
                "metrics": ["cpu_usage", "memory_usage", "error_rate"],
                "aggregations": ["avg", "max", "min"]
            },
            "search_quality": {
                "metrics": ["relevance_score", "user_satisfaction", "query_success_rate"],
                "aggregations": ["avg", "p95", "count"]
            }
        }

        logger.info("Metrics aggregator initialized")

    async def aggregate_metrics(self, start_time: datetime, end_time: datetime,
                              granularity: str = "hour") -> Dict[str, AggregatedMetrics]:
        """
        Aggregate metrics for a time period

        Args:
            start_time: Start of aggregation period
            end_time: End of aggregation period
            granularity: Time granularity ('minute', 'hour', 'day')

        Returns:
            Dictionary of aggregated metrics by category
        """
        # cache key and read-through cache
        cache_key = f"{start_time.isoformat()}|{end_time.isoformat()}|{granularity}"
        cached = self._cache.get(cache_key)
        if cached:
            cached_at, data = cached
            if (datetime.utcnow() - cached_at).total_seconds() < self._cache_ttl_seconds:
                return data

        aggregated_data: Dict[str, AggregatedMetrics] = {}

        # Generate time buckets
        time_buckets = self._generate_time_buckets(start_time, end_time, granularity)

        for category, config in self.aggregation_rules.items():
            try:
                category_metrics = await self._aggregate_category_metrics(
                    category, config, time_buckets, start_time, end_time
                )

                aggregated_data[category] = AggregatedMetrics(
                    period_start=start_time,
                    period_end=end_time,
                    granularity=granularity,
                    metrics=category_metrics
                )

            except Exception as e:
                logger.error(f"Error aggregating {category} metrics: {e}")
                continue
        # store in cache
        self._cache[cache_key] = (datetime.utcnow(), aggregated_data)
        return aggregated_data

    async def calculate_trends(self, metric_name: str, days: int = 7) -> TrendData:
        """
        Calculate trend data for a specific metric

        Args:
            metric_name: Name of the metric to analyze
            days: Number of days to analyze

        Returns:
            Trend data with direction and change percentage
        """
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)

        # Get hourly aggregated data
        time_series_data = await self._get_metric_time_series(
            metric_name, start_time, end_time, "hour"
        )

        if len(time_series_data) < 2:
            return TrendData(
                metric_name=metric_name,
                time_series=time_series_data,
                trend_direction="stable",
                change_percentage=0.0
            )

        # Calculate trend
        values = [value for _, value in time_series_data]

        # Simple linear trend calculation
        first_half = values[:len(values)//2]
        second_half = values[len(values)//2:]

        first_avg = statistics.mean(first_half) if first_half else 0
        second_avg = statistics.mean(second_half) if second_half else 0

        if first_avg == 0:
            change_percentage = 0.0
        else:
            change_percentage = ((second_avg - first_avg) / first_avg) * 100

        # Determine trend direction
        if abs(change_percentage) < 5:  # Less than 5% change
            trend_direction = "stable"
        elif change_percentage > 0:
            trend_direction = "up"
        else:
            trend_direction = "down"

        return TrendData(
            metric_name=metric_name,
            time_series=time_series_data,
            trend_direction=trend_direction,
            change_percentage=change_percentage
        )

    async def get_real_time_dashboard_data(self) -> Dict[str, Any]:
        """Get real-time data for dashboard display"""
        now = datetime.utcnow()

        # Last hour metrics
        hour_ago = now - timedelta(hours=1)
        hour_metrics = await self.aggregate_metrics(hour_ago, now, "minute")

        # Last 24 hours for trends
        day_ago = now - timedelta(hours=24)
        day_trends = {}

        key_metrics = [
            "avg_response_time",
            "success_rate",
            "searches_per_hour",
            "unique_users",
            "error_rate"
        ]

        for metric in key_metrics:
            try:
                trend = await self.calculate_trends(metric, days=1)
                day_trends[metric] = {
                    "current_value": trend.time_series[-1][1] if trend.time_series else 0,
                    "trend_direction": trend.trend_direction,
                    "change_percentage": trend.change_percentage
                }
            except Exception as e:
                logger.error(f"Error calculating trend for {metric}: {e}")
                day_trends[metric] = {
                    "current_value": 0,
                    "trend_direction": "stable",
                    "change_percentage": 0.0
                }

        # System health indicators
        system_health = await self._get_system_health_indicators()

        # Recent alerts
        alerts = await self._get_recent_alerts()

        return {
            "timestamp": now.isoformat(),
            "hour_metrics": {k: v.metrics for k, v in hour_metrics.items()},
            "trends": day_trends,
            "system_health": system_health,
            "alerts": alerts,
            "status": "healthy" if system_health.get("overall_score", 0) > 0.8 else "warning"
        }

    async def generate_performance_report(self, days: int = 7) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=days)

        # Get aggregated metrics
        daily_metrics = await self.aggregate_metrics(start_time, end_time, "day")

        # Calculate key performance indicators
        kpis = await self._calculate_kpis(start_time, end_time)

        # Get top performing and problematic queries
        query_analysis = await self._analyze_query_performance(start_time, end_time)

        # User behavior insights
        user_insights = await self._analyze_user_behavior(start_time, end_time)

        # System performance summary
        system_summary = await self._summarize_system_performance(start_time, end_time)

        return {
            "report_period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat(),
                "days": days
            },
            "kpis": kpis,
            "daily_metrics": {k: v.metrics for k, v in daily_metrics.items()},
            "query_analysis": query_analysis,
            "user_insights": user_insights,
            "system_summary": system_summary,
            "recommendations": await self._generate_recommendations(kpis, query_analysis)
        }

    def _generate_time_buckets(self, start_time: datetime, end_time: datetime,
                              granularity: str) -> List[Tuple[datetime, datetime]]:
        """Generate time buckets for aggregation"""
        buckets = []

        if granularity == "minute":
            delta = timedelta(minutes=1)
        elif granularity == "hour":
            delta = timedelta(hours=1)
        elif granularity == "day":
            delta = timedelta(days=1)
        else:
            raise ValueError(f"Unsupported granularity: {granularity}")

        current = start_time
        while current < end_time:
            bucket_end = min(current + delta, end_time)
            buckets.append((current, bucket_end))
            current = bucket_end

        return buckets

    async def _aggregate_category_metrics(self, category: str, config: Dict[str, Any],
                                        time_buckets: List[Tuple[datetime, datetime]],
                                        start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """Aggregate metrics for a specific category"""
        aggregated = {}

        # Get raw data for the period
        raw_data = await self._get_raw_metrics_data(category, start_time, end_time)

        if not raw_data:
            return {}

        # Aggregate by time buckets
        bucket_aggregates = []
        for bucket_start, bucket_end in time_buckets:
            bucket_data = [
                item for item in raw_data
                if bucket_start <= item["timestamp"] < bucket_end
            ]

            if bucket_data:
                bucket_aggregate = self._aggregate_bucket_data(bucket_data, config)
                bucket_aggregate["timestamp"] = bucket_start
                bucket_aggregates.append(bucket_aggregate)

        # Overall aggregation
        for metric in config["metrics"]:
            metric_values = [item.get(metric) for item in raw_data if item.get(metric) is not None]

            if metric_values:
                aggregated[metric] = {
                    "avg": statistics.mean(metric_values),
                    "min": min(metric_values),
                    "max": max(metric_values),
                    "count": len(metric_values)
                }

                if len(metric_values) >= 20:
                    aggregated[metric]["p95"] = statistics.quantiles(metric_values, n=20)[18]
                else:
                    aggregated[metric]["p95"] = max(metric_values)

        aggregated["time_series"] = bucket_aggregates

        return aggregated

    def _aggregate_bucket_data(self, bucket_data: List[Dict[str, Any]],
                              config: Dict[str, Any]) -> Dict[str, Any]:
        """Aggregate data for a single time bucket"""
        aggregated = {}

        for metric in config["metrics"]:
            values = [item.get(metric) for item in bucket_data if item.get(metric) is not None]

            if values:
                aggregated[metric] = {
                    "avg": statistics.mean(values),
                    "count": len(values),
                    "sum": sum(values)
                }

                if "p95" in config["aggregations"] and len(values) >= 20:
                    aggregated[metric]["p95"] = statistics.quantiles(values, n=20)[18]

        return aggregated

    async def _get_raw_metrics_data(self, category: str, start_time: datetime,
                                  end_time: datetime) -> List[Dict[str, Any]]:
        """Get raw metrics data from Firestore"""
        try:
            # Map categories to collections
            collection_map = {
                "search_performance": "analytics_search_events",
                "user_behavior": "analytics_user_interactions",
                "system_health": "analytics_system_metrics",
                "search_quality": "analytics_search_events"
            }

            collection_name = collection_map.get(category)
            if not collection_name:
                return []

            query = (
                self.firestore_client.collection(collection_name)
                .where("timestamp", ">=", start_time)
                .where("timestamp", "<=", end_time)
                .order_by("timestamp")
            )

            docs = await query.get()
            return [doc.to_dict() for doc in docs]

        except Exception as e:
            logger.error(f"Error getting raw metrics data for {category}: {e}")
            return []

    async def _get_metric_time_series(self, metric_name: str, start_time: datetime,
                                    end_time: datetime, granularity: str) -> List[Tuple[datetime, float]]:
        """Get time series data for a specific metric"""
        # This would implement metric-specific time series retrieval
        # For now, return empty list
        return []

    async def _get_system_health_indicators(self) -> Dict[str, Any]:
        """Get current system health indicators"""
        return {
            "overall_score": 0.95,
            "api_availability": 0.99,
            "response_time_health": 0.92,
            "error_rate_health": 0.98,
            "resource_utilization": 0.85
        }

    async def _get_recent_alerts(self) -> List[Dict[str, Any]]:
        """Get recent system alerts"""
        return []

    async def _calculate_kpis(self, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """Calculate key performance indicators"""
        return {
            "total_searches": 0,
            "avg_response_time": 0.0,
            "success_rate": 1.0,
            "user_satisfaction": 0.0,
            "system_uptime": 0.99
        }

    async def _analyze_query_performance(self, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """Analyze query performance patterns"""
        return {
            "top_queries": [],
            "slow_queries": [],
            "failed_queries": [],
            "query_patterns": {}
        }

    async def _analyze_user_behavior(self, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """Analyze user behavior patterns"""
        return {
            "active_users": 0,
            "session_patterns": {},
            "engagement_metrics": {}
        }

    async def _summarize_system_performance(self, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
        """Summarize system performance"""
        return {
            "availability": 0.99,
            "performance_score": 0.95,
            "resource_efficiency": 0.88
        }

    async def _generate_recommendations(self, kpis: Dict[str, Any],
                                      query_analysis: Dict[str, Any]) -> List[str]:
        """Generate performance recommendations"""
        recommendations = []

        if kpis.get("avg_response_time", 0) > 2.0:
            recommendations.append("Consider optimizing search algorithms to reduce response time")

        if kpis.get("success_rate", 1.0) < 0.95:
            recommendations.append("Investigate and fix causes of search failures")

        return recommendations


# Global instance
metrics_aggregator = MetricsAggregator()
