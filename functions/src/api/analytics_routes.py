"""
Analytics Dashboard API Routes
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
import psutil
import time

from ..analytics.analytics_collector import analytics_collector, SearchEvent, SystemMetrics, UserInteractionEvent
from ..analytics.metrics_aggregator import metrics_aggregator
from ..analytics.time_series_storage import time_series_storage, TimeSeriesQuery
from ..ab_testing.experiment_manager import experiment_manager, Experiment, ExperimentVariant, ExperimentMetric, ExperimentEvent, ExperimentStatus, VariantType
from ..cost_optimization.cost_tracker import cost_tracker, CostEvent, ProviderType, CostCategory

logger = logging.getLogger(__name__)

# Create router
analytics_router = APIRouter(prefix="/api/analytics", tags=["analytics"])

# Pydantic models for request/response
class RealTimeMetricsResponse(BaseModel):
    """Real-time metrics response"""
    timestamp: str
    searches_last_5min: int
    avg_response_time: float
    success_rate: float
    cache_hit_rate: float
    current_cpu_usage: float
    current_memory_usage: float
    search_type_distribution: Dict[str, int]
    active_sessions: int
    error_rate: float

class PerformanceMetricsResponse(BaseModel):
    """Performance metrics response"""
    period_start: str
    period_end: str
    total_searches: int
    avg_response_time: float
    p95_response_time: float
    success_rate: float
    cache_hit_rate: float
    unique_users: int
    unique_sessions: int
    top_queries: List[Dict[str, Any]]
    search_type_distribution: Dict[str, int]

class SystemHealthResponse(BaseModel):
    """System health response"""
    timestamp: str
    overall_health: str
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    active_connections: int
    uptime_hours: float
    error_rate: float
    response_time_p95: float

class SearchAnalyticsResponse(BaseModel):
    """Search analytics response"""
    total_searches: int
    unique_queries: int
    avg_results_per_search: float
    most_popular_queries: List[Dict[str, Any]]
    search_type_breakdown: Dict[str, int]
    intent_distribution: Dict[str, int]
    spell_corrections: int
    query_expansions: int

class TimeSeriesDataResponse(BaseModel):
    """Time series data response"""
    metric_name: str
    data_points: List[List[Any]]  # [timestamp, value] pairs
    aggregation: Optional[str]
    granularity: Optional[str]
    total_points: int

class DashboardDataResponse(BaseModel):
    """Complete dashboard data response"""
    timestamp: str
    real_time_metrics: RealTimeMetricsResponse
    system_health: SystemHealthResponse
    search_analytics: SearchAnalyticsResponse
    performance_trends: Dict[str, Any]
    alerts: List[Dict[str, Any]]

# Dependency to get current system metrics
async def get_current_system_metrics() -> SystemMetrics:
    """Get current system metrics"""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return SystemMetrics(
        timestamp=datetime.utcnow(),
        cpu_usage=cpu_percent,
        memory_usage=memory.percent,
        active_connections=len(psutil.net_connections()),
        requests_per_minute=0,  # Would be calculated from recent requests
        error_rate=0.0,  # Would be calculated from recent errors
        cache_hit_rate=0.0,  # Would be calculated from cache stats
        avg_response_time=0.0  # Would be calculated from recent requests
    )

@analytics_router.get("/real-time", response_model=RealTimeMetricsResponse)
async def get_real_time_metrics():
    """Get real-time analytics metrics"""
    try:
        metrics = await analytics_collector.get_real_time_metrics()
        return RealTimeMetricsResponse(**metrics)
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get real-time metrics")

@analytics_router.get("/performance", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    hours: int = Query(24, description="Number of hours to analyze", ge=1, le=168)
):
    """Get performance metrics for a time period"""
    try:
        metrics = await analytics_collector.get_performance_metrics(period_hours=hours)
        
        return PerformanceMetricsResponse(
            period_start=metrics.period_start.isoformat(),
            period_end=metrics.period_end.isoformat(),
            total_searches=metrics.total_searches,
            avg_response_time=metrics.avg_response_time,
            p95_response_time=metrics.p95_response_time,
            success_rate=metrics.success_rate,
            cache_hit_rate=metrics.cache_hit_rate,
            unique_users=metrics.unique_users,
            unique_sessions=metrics.unique_sessions,
            top_queries=metrics.top_queries,
            search_type_distribution=metrics.search_type_distribution
        )
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get performance metrics")

@analytics_router.get("/system-health", response_model=SystemHealthResponse)
async def get_system_health():
    """Get current system health status"""
    try:
        # Get current system metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        boot_time = psutil.boot_time()
        uptime_hours = (time.time() - boot_time) / 3600
        
        # Get recent metrics for error rate and response time
        real_time_metrics = await analytics_collector.get_real_time_metrics()
        
        # Determine overall health
        health_score = 1.0
        if cpu_percent > 80:
            health_score -= 0.3
        if memory.percent > 85:
            health_score -= 0.3
        if real_time_metrics.get("error_rate", 0) > 0.05:
            health_score -= 0.2
        if real_time_metrics.get("avg_response_time", 0) > 3.0:
            health_score -= 0.2
        
        overall_health = "healthy" if health_score > 0.8 else "warning" if health_score > 0.5 else "critical"
        
        return SystemHealthResponse(
            timestamp=datetime.utcnow().isoformat(),
            overall_health=overall_health,
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            disk_usage=disk.percent,
            active_connections=len(psutil.net_connections()),
            uptime_hours=uptime_hours,
            error_rate=real_time_metrics.get("error_rate", 0),
            response_time_p95=real_time_metrics.get("avg_response_time", 0)
        )
    except Exception as e:
        logger.error(f"Error getting system health: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system health")

@analytics_router.get("/search-analytics", response_model=SearchAnalyticsResponse)
async def get_search_analytics(
    hours: int = Query(24, description="Number of hours to analyze", ge=1, le=168)
):
    """Get search analytics and patterns"""
    try:
        # Get performance metrics which includes search data
        metrics = await analytics_collector.get_performance_metrics(period_hours=hours)
        
        # Calculate additional analytics
        total_searches = metrics.total_searches
        unique_queries = len(metrics.top_queries)
        avg_results_per_search = 5.0  # Would be calculated from actual data
        
        # Mock intent distribution (would be calculated from actual data)
        intent_distribution = {
            "factual": int(total_searches * 0.4),
            "exploratory": int(total_searches * 0.3),
            "procedural": int(total_searches * 0.2),
            "analytical": int(total_searches * 0.1)
        }
        
        return SearchAnalyticsResponse(
            total_searches=total_searches,
            unique_queries=unique_queries,
            avg_results_per_search=avg_results_per_search,
            most_popular_queries=metrics.top_queries[:10],
            search_type_breakdown=metrics.search_type_distribution,
            intent_distribution=intent_distribution,
            spell_corrections=int(total_searches * 0.15),  # Estimated 15% have corrections
            query_expansions=int(total_searches * 0.25)   # Estimated 25% have expansions
        )
    except Exception as e:
        logger.error(f"Error getting search analytics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get search analytics")

@analytics_router.get("/time-series/{metric_name}", response_model=TimeSeriesDataResponse)
async def get_time_series_data(
    metric_name: str,
    start_time: datetime = Query(..., description="Start time for data"),
    end_time: datetime = Query(..., description="End time for data"),
    granularity: Optional[str] = Query("hour", description="Data granularity"),
    aggregation: Optional[str] = Query("avg", description="Aggregation method")
):
    """Get time series data for a specific metric"""
    try:
        query = TimeSeriesQuery(
            metric_name=metric_name,
            start_time=start_time,
            end_time=end_time,
            granularity=granularity,
            aggregation=aggregation
        )
        
        result = await time_series_storage.query(query)
        
        # Convert data points to the expected format
        data_points = [[point[0].isoformat(), point[1]] for point in result.data_points]
        
        return TimeSeriesDataResponse(
            metric_name=result.metric_name,
            data_points=data_points,
            aggregation=result.aggregation,
            granularity=result.granularity,
            total_points=result.total_points
        )
    except Exception as e:
        logger.error(f"Error getting time series data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get time series data")

@analytics_router.get("/dashboard", response_model=DashboardDataResponse)
async def get_dashboard_data():
    """Get complete dashboard data"""
    try:
        # Get all dashboard components
        real_time_metrics = await get_real_time_metrics()
        system_health = await get_system_health()
        search_analytics = await get_search_analytics(hours=24)
        
        # Get performance trends (simplified)
        performance_trends = {
            "response_time_trend": "stable",
            "search_volume_trend": "up",
            "error_rate_trend": "down",
            "user_satisfaction_trend": "up"
        }
        
        # Get recent alerts (mock data)
        alerts = []
        
        return DashboardDataResponse(
            timestamp=datetime.utcnow().isoformat(),
            real_time_metrics=real_time_metrics,
            system_health=system_health,
            search_analytics=search_analytics,
            performance_trends=performance_trends,
            alerts=alerts
        )
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard data")

@analytics_router.post("/events/search")
async def record_search_event(
    query: str,
    search_type: str,
    results_count: int,
    response_time: float,
    success: bool = True,
    user_id: Optional[str] = None,
    session_id: str = "anonymous",
    metadata: Dict[str, Any] = {}
):
    """Record a search event"""
    try:
        event = SearchEvent(
            event_id=f"search_{int(time.time() * 1000)}_{hash(query) % 10000}",
            timestamp=datetime.utcnow(),
            query=query,
            search_type=search_type,
            user_id=user_id,
            session_id=session_id,
            results_count=results_count,
            response_time=response_time,
            success=success,
            metadata=metadata
        )
        
        await analytics_collector.collect_search_event(event)
        return {"status": "success", "event_id": event.event_id}
    except Exception as e:
        logger.error(f"Error recording search event: {e}")
        raise HTTPException(status_code=500, detail="Failed to record search event")

@analytics_router.post("/events/interaction")
async def record_user_interaction(
    event_type: str,
    user_id: Optional[str] = None,
    session_id: str = "anonymous",
    data: Dict[str, Any] = {}
):
    """Record a user interaction event"""
    try:
        event = UserInteractionEvent(
            event_id=f"interaction_{int(time.time() * 1000)}_{hash(event_type) % 10000}",
            timestamp=datetime.utcnow(),
            user_id=user_id,
            session_id=session_id,
            event_type=event_type,
            data=data
        )
        
        await analytics_collector.collect_user_interaction(event)
        return {"status": "success", "event_id": event.event_id}
    except Exception as e:
        logger.error(f"Error recording user interaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to record user interaction")

@analytics_router.get("/metrics/available")
async def get_available_metrics():
    """Get list of available metrics"""
    try:
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(days=7)
        
        metric_names = await time_series_storage.get_metric_names(start_time, end_time)
        
        return {
            "metrics": metric_names,
            "total_count": len(metric_names),
            "period": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Error getting available metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available metrics")

@analytics_router.get("/report/performance")
async def get_performance_report(
    days: int = Query(7, description="Number of days for the report", ge=1, le=30)
):
    """Get comprehensive performance report"""
    try:
        report = await metrics_aggregator.generate_performance_report(days=days)
        return report
    except Exception as e:
        logger.error(f"Error generating performance report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate performance report")

@analytics_router.get("/health")
async def analytics_health_check():
    """Health check for analytics system"""
    try:
        # Check if analytics collector is working
        test_metrics = await analytics_collector.get_real_time_metrics()
        
        # Check system resources
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
        
        health_status = "healthy"
        if cpu_percent > 90 or memory_percent > 95:
            health_status = "degraded"
        
        return {
            "status": health_status,
            "timestamp": datetime.utcnow().isoformat(),
            "analytics_collector": "operational",
            "system_resources": {
                "cpu_usage": cpu_percent,
                "memory_usage": memory_percent
            },
            "recent_metrics_available": len(test_metrics) > 0
        }
    except Exception as e:
        logger.error(f"Analytics health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

# A/B Testing Routes
@analytics_router.post("/experiments")
async def create_experiment(
    name: str,
    description: str,
    variants: List[Dict[str, Any]],
    metrics: List[Dict[str, Any]],
    target_sample_size: int = 1000,
    confidence_level: float = 0.95,
    created_by: str = "system"
):
    """Create a new A/B test experiment"""
    try:
        # Convert variants
        experiment_variants = []
        for i, v_data in enumerate(variants):
            variant = ExperimentVariant(
                id=v_data.get("id", f"variant_{i}"),
                name=v_data["name"],
                description=v_data.get("description", ""),
                type=VariantType(v_data.get("type", "treatment")),
                traffic_allocation=v_data["traffic_allocation"],
                configuration=v_data.get("configuration", {}),
                is_control=v_data.get("is_control", False)
            )
            experiment_variants.append(variant)

        # Convert metrics
        experiment_metrics = []
        for m_data in metrics:
            metric = ExperimentMetric(
                name=m_data["name"],
                description=m_data.get("description", ""),
                type=m_data.get("type", "conversion"),
                goal=m_data.get("goal", "maximize"),
                primary=m_data.get("primary", False)
            )
            experiment_metrics.append(metric)

        # Create experiment
        experiment = Experiment(
            id="",  # Will be generated
            name=name,
            description=description,
            status=ExperimentStatus.DRAFT,
            variants=experiment_variants,
            metrics=experiment_metrics,
            start_date=None,
            end_date=None,
            target_sample_size=target_sample_size,
            confidence_level=confidence_level,
            created_by=created_by,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            metadata={}
        )

        experiment_id = await experiment_manager.create_experiment(experiment)
        return {"experiment_id": experiment_id, "status": "created"}

    except Exception as e:
        logger.error(f"Error creating experiment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create experiment")

@analytics_router.get("/experiments")
async def list_experiments(status: Optional[str] = None):
    """List A/B test experiments"""
    try:
        experiment_status = ExperimentStatus(status) if status else None
        experiments = await experiment_manager.list_experiments(experiment_status)

        return {
            "experiments": [
                {
                    "id": exp.id,
                    "name": exp.name,
                    "description": exp.description,
                    "status": exp.status.value,
                    "created_at": exp.created_at.isoformat(),
                    "start_date": exp.start_date.isoformat() if exp.start_date else None,
                    "end_date": exp.end_date.isoformat() if exp.end_date else None,
                    "variants_count": len(exp.variants),
                    "metrics_count": len(exp.metrics)
                }
                for exp in experiments
            ]
        }

    except Exception as e:
        logger.error(f"Error listing experiments: {e}")
        raise HTTPException(status_code=500, detail="Failed to list experiments")

@analytics_router.get("/experiments/{experiment_id}")
async def get_experiment(experiment_id: str):
    """Get experiment details"""
    try:
        experiment = await experiment_manager.get_experiment(experiment_id)
        if not experiment:
            raise HTTPException(status_code=404, detail="Experiment not found")

        return {
            "id": experiment.id,
            "name": experiment.name,
            "description": experiment.description,
            "status": experiment.status.value,
            "variants": [
                {
                    "id": v.id,
                    "name": v.name,
                    "description": v.description,
                    "type": v.type.value,
                    "traffic_allocation": v.traffic_allocation,
                    "configuration": v.configuration,
                    "is_control": v.is_control
                }
                for v in experiment.variants
            ],
            "metrics": [
                {
                    "name": m.name,
                    "description": m.description,
                    "type": m.type,
                    "goal": m.goal,
                    "primary": m.primary
                }
                for m in experiment.metrics
            ],
            "start_date": experiment.start_date.isoformat() if experiment.start_date else None,
            "end_date": experiment.end_date.isoformat() if experiment.end_date else None,
            "target_sample_size": experiment.target_sample_size,
            "confidence_level": experiment.confidence_level,
            "created_by": experiment.created_by,
            "created_at": experiment.created_at.isoformat(),
            "updated_at": experiment.updated_at.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting experiment: {e}")
        raise HTTPException(status_code=500, detail="Failed to get experiment")

@analytics_router.post("/experiments/{experiment_id}/start")
async def start_experiment(experiment_id: str):
    """Start an A/B test experiment"""
    try:
        success = await experiment_manager.start_experiment(experiment_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to start experiment")

        return {"status": "started", "experiment_id": experiment_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting experiment: {e}")
        raise HTTPException(status_code=500, detail="Failed to start experiment")

@analytics_router.post("/experiments/{experiment_id}/stop")
async def stop_experiment(experiment_id: str):
    """Stop an A/B test experiment"""
    try:
        success = await experiment_manager.stop_experiment(experiment_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to stop experiment")

        return {"status": "stopped", "experiment_id": experiment_id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping experiment: {e}")
        raise HTTPException(status_code=500, detail="Failed to stop experiment")

@analytics_router.post("/experiments/{experiment_id}/assign")
async def assign_user_to_variant(
    experiment_id: str,
    user_id: str,
    session_id: Optional[str] = None
):
    """Assign user to experiment variant"""
    try:
        variant_id = await experiment_manager.assign_user_to_variant(
            experiment_id, user_id, session_id
        )

        if not variant_id:
            raise HTTPException(status_code=400, detail="Failed to assign user to variant")

        return {
            "experiment_id": experiment_id,
            "user_id": user_id,
            "variant_id": variant_id,
            "assigned_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning user to variant: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign user to variant")

@analytics_router.post("/experiments/{experiment_id}/events")
async def record_experiment_event(
    experiment_id: str,
    variant_id: str,
    user_id: str,
    event_type: str,
    event_data: Dict[str, Any] = {},
    session_id: Optional[str] = None
):
    """Record an experiment event"""
    try:
        event = ExperimentEvent(
            id="",  # Will be generated
            experiment_id=experiment_id,
            variant_id=variant_id,
            user_id=user_id,
            event_type=event_type,
            event_data=event_data,
            timestamp=datetime.utcnow(),
            session_id=session_id
        )

        success = await experiment_manager.record_event(event)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to record event")

        return {"status": "recorded", "event_id": event.id}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording experiment event: {e}")
        raise HTTPException(status_code=500, detail="Failed to record experiment event")

@analytics_router.get("/experiments/{experiment_id}/results")
async def get_experiment_results(experiment_id: str):
    """Get experiment results and analysis"""
    try:
        results = await experiment_manager.get_experiment_results(experiment_id)
        if not results:
            raise HTTPException(status_code=404, detail="Experiment results not found")

        return {
            "experiment_id": results.experiment_id,
            "variant_results": results.variant_results,
            "statistical_significance": results.statistical_significance,
            "confidence_intervals": {
                k: {"lower": v[0], "upper": v[1]}
                for k, v in results.confidence_intervals.items()
            },
            "p_values": results.p_values,
            "effect_sizes": results.effect_sizes,
            "sample_sizes": results.sample_sizes,
            "conversion_rates": results.conversion_rates,
            "recommendations": results.recommendations,
            "analysis_date": results.analysis_date.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting experiment results: {e}")
        raise HTTPException(status_code=500, detail="Failed to get experiment results")

# Cost Optimization Routes
@analytics_router.post("/costs/events")
async def record_cost_event(
    provider: str,
    category: str,
    model_name: str,
    tokens_used: int,
    cost_usd: float,
    request_id: str,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    metadata: Dict[str, Any] = {}
):
    """Record a cost event"""
    try:
        event = CostEvent(
            id=f"cost_{int(time.time() * 1000)}_{hash(request_id) % 10000}",
            timestamp=datetime.utcnow(),
            provider=ProviderType(provider),
            category=CostCategory(category),
            model_name=model_name,
            tokens_used=tokens_used,
            cost_usd=cost_usd,
            request_id=request_id,
            user_id=user_id,
            session_id=session_id,
            metadata=metadata
        )

        success = await cost_tracker.record_cost_event(event)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to record cost event")

        return {"status": "recorded", "event_id": event.id}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {e}")
    except Exception as e:
        logger.error(f"Error recording cost event: {e}")
        raise HTTPException(status_code=500, detail="Failed to record cost event")

@analytics_router.get("/costs/summary")
async def get_cost_summary(
    days: int = Query(30, description="Number of days to analyze", ge=1, le=365)
):
    """Get cost summary for a time period"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        summary = await cost_tracker.get_cost_summary(start_date, end_date)

        return {
            "period": {
                "start": summary.period_start.isoformat(),
                "end": summary.period_end.isoformat(),
                "days": days
            },
            "total_cost": summary.total_cost,
            "total_requests": summary.total_requests,
            "total_tokens": summary.total_tokens,
            "cost_by_provider": summary.cost_by_provider,
            "cost_by_category": summary.cost_by_category,
            "cost_by_model": summary.cost_by_model,
            "avg_cost_per_request": summary.avg_cost_per_request,
            "avg_cost_per_token": summary.avg_cost_per_token,
            "top_expensive_requests": summary.top_expensive_requests
        }

    except Exception as e:
        logger.error(f"Error getting cost summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cost summary")

@analytics_router.get("/costs/optimization")
async def get_optimization_recommendations(
    days: int = Query(30, description="Number of days to analyze", ge=7, le=90)
):
    """Get cost optimization recommendations"""
    try:
        recommendations = await cost_tracker.generate_optimization_recommendations(days)

        return {
            "analysis_period_days": days,
            "recommendations": [
                {
                    "type": rec.type,
                    "title": rec.title,
                    "description": rec.description,
                    "potential_savings": rec.potential_savings,
                    "confidence": rec.confidence,
                    "implementation_effort": rec.implementation_effort,
                    "priority": rec.priority,
                    "details": rec.details
                }
                for rec in recommendations
            ],
            "total_potential_savings": sum(rec.potential_savings for rec in recommendations),
            "high_priority_count": len([r for r in recommendations if r.priority == "high"])
        }

    except Exception as e:
        logger.error(f"Error getting optimization recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get optimization recommendations")

@analytics_router.get("/costs/forecast")
async def get_cost_forecast(
    days_ahead: int = Query(30, description="Number of days to forecast", ge=1, le=365)
):
    """Get cost forecast"""
    try:
        forecast = await cost_tracker.forecast_costs(days_ahead)

        return {
            "forecast_date": forecast.forecast_date.isoformat(),
            "period_days": forecast.period_days,
            "predicted_cost": forecast.predicted_cost,
            "confidence_interval": {
                "lower": forecast.confidence_interval[0],
                "upper": forecast.confidence_interval[1]
            },
            "trend": forecast.trend,
            "factors": forecast.factors,
            "daily_average": forecast.predicted_cost / forecast.period_days
        }

    except Exception as e:
        logger.error(f"Error getting cost forecast: {e}")
        raise HTTPException(status_code=500, detail="Failed to get cost forecast")

@analytics_router.post("/costs/calculate")
async def calculate_cost(
    provider: str,
    model_name: str,
    input_tokens: int,
    output_tokens: int = 0
):
    """Calculate cost for a request"""
    try:
        provider_enum = ProviderType(provider)
        cost = await cost_tracker.calculate_cost(
            provider_enum, model_name, input_tokens, output_tokens
        )

        return {
            "provider": provider,
            "model_name": model_name,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "estimated_cost": cost,
            "cost_per_token": cost / (input_tokens + output_tokens) if (input_tokens + output_tokens) > 0 else 0
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid provider: {e}")
    except Exception as e:
        logger.error(f"Error calculating cost: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate cost")
