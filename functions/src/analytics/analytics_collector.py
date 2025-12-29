"""
Real-time Analytics Collection System
"""
import asyncio
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import json
import statistics

from google.cloud import firestore
from google.cloud.firestore import AsyncClient

logger = logging.getLogger(__name__)

@dataclass
class SearchEvent:
    """Search event data structure"""
    event_id: str
    timestamp: datetime
    query: str
    search_type: str
    user_id: Optional[str]
    session_id: str
    results_count: int
    response_time: float
    success: bool
    metadata: Dict[str, Any]

@dataclass
class SystemMetrics:
    """System performance metrics"""
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    active_connections: int
    requests_per_minute: int
    error_rate: float
    cache_hit_rate: float
    avg_response_time: float

@dataclass
class UserInteractionEvent:
    """User interaction event"""
    event_id: str
    timestamp: datetime
    user_id: Optional[str]
    session_id: str
    event_type: str  # 'result_click', 'query_modify', 'filter_apply', etc.
    data: Dict[str, Any]

@dataclass
class PerformanceMetrics:
    """Aggregated performance metrics"""
    period_start: datetime
    period_end: datetime
    total_searches: int
    avg_response_time: float
    p95_response_time: float
    success_rate: float
    cache_hit_rate: float
    unique_users: int
    unique_sessions: int
    top_queries: List[Dict[str, Any]]
    search_type_distribution: Dict[str, int]

class AnalyticsCollector:
    """
    Real-time analytics collection and aggregation system
    """
    
    def __init__(self, firestore_client: Optional[AsyncClient] = None):
        """Initialize analytics collector"""
        self.firestore_client = firestore_client or firestore.AsyncClient()
        
        # In-memory buffers for real-time data
        self.search_events_buffer = deque(maxlen=1000)
        self.system_metrics_buffer = deque(maxlen=100)
        self.user_events_buffer = deque(maxlen=500)
        
        # Aggregation windows
        self.minute_aggregates = {}
        self.hour_aggregates = {}
        self.day_aggregates = {}
        
        # Performance tracking
        self.request_times = deque(maxlen=1000)
        self.error_counts = defaultdict(int)
        self.cache_stats = {"hits": 0, "misses": 0}
        
        # Background tasks
        self._aggregation_task = None
        self._cleanup_task = None
        
        logger.info("Analytics collector initialized")
    
    async def start_background_tasks(self):
        """Start background aggregation and cleanup tasks"""
        if not self._aggregation_task:
            self._aggregation_task = asyncio.create_task(self._aggregation_loop())
        
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        logger.info("Analytics background tasks started")
    
    async def stop_background_tasks(self):
        """Stop background tasks"""
        if self._aggregation_task:
            self._aggregation_task.cancel()
            try:
                await self._aggregation_task
            except asyncio.CancelledError:
                pass
        
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Analytics background tasks stopped")
    
    async def collect_search_event(self, event: SearchEvent):
        """Collect a search event"""
        try:
            # Add to in-memory buffer
            self.search_events_buffer.append(event)
            
            # Track request time
            self.request_times.append(event.response_time)
            
            # Update error counts
            if not event.success:
                self.error_counts[event.metadata.get("error_type", "unknown")] += 1
            
            # Store in Firestore for persistence
            await self._store_search_event(event)
            
            logger.debug(f"Collected search event: {event.event_id}")
            
        except Exception as e:
            logger.error(f"Error collecting search event: {e}")
    
    async def collect_system_metrics(self, metrics: SystemMetrics):
        """Collect system performance metrics"""
        try:
            # Add to in-memory buffer
            self.system_metrics_buffer.append(metrics)
            
            # Store in Firestore
            await self._store_system_metrics(metrics)
            
            logger.debug(f"Collected system metrics at {metrics.timestamp}")
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
    
    async def collect_user_interaction(self, event: UserInteractionEvent):
        """Collect user interaction event"""
        try:
            # Add to in-memory buffer
            self.user_events_buffer.append(event)
            
            # Store in Firestore
            await self._store_user_interaction(event)
            
            logger.debug(f"Collected user interaction: {event.event_type}")
            
        except Exception as e:
            logger.error(f"Error collecting user interaction: {e}")
    
    def update_cache_stats(self, hit: bool):
        """Update cache hit/miss statistics"""
        if hit:
            self.cache_stats["hits"] += 1
        else:
            self.cache_stats["misses"] += 1
    
    async def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get current real-time metrics"""
        now = datetime.utcnow()
        
        # Calculate metrics from recent events
        recent_searches = [
            event for event in self.search_events_buffer
            if (now - event.timestamp).total_seconds() < 300  # Last 5 minutes
        ]
        
        recent_system_metrics = [
            metrics for metrics in self.system_metrics_buffer
            if (now - metrics.timestamp).total_seconds() < 60  # Last minute
        ]
        
        # Calculate aggregated metrics
        total_searches = len(recent_searches)
        avg_response_time = statistics.mean([e.response_time for e in recent_searches]) if recent_searches else 0
        success_rate = sum(1 for e in recent_searches if e.success) / total_searches if total_searches > 0 else 1.0
        
        # Cache hit rate
        total_cache_requests = self.cache_stats["hits"] + self.cache_stats["misses"]
        cache_hit_rate = self.cache_stats["hits"] / total_cache_requests if total_cache_requests > 0 else 0
        
        # System metrics
        current_cpu = recent_system_metrics[-1].cpu_usage if recent_system_metrics else 0
        current_memory = recent_system_metrics[-1].memory_usage if recent_system_metrics else 0
        
        # Search type distribution
        search_type_dist = defaultdict(int)
        for event in recent_searches:
            search_type_dist[event.search_type] += 1
        
        return {
            "timestamp": now.isoformat(),
            "searches_last_5min": total_searches,
            "avg_response_time": avg_response_time,
            "success_rate": success_rate,
            "cache_hit_rate": cache_hit_rate,
            "current_cpu_usage": current_cpu,
            "current_memory_usage": current_memory,
            "search_type_distribution": dict(search_type_dist),
            "active_sessions": len(set(e.session_id for e in recent_searches)),
            "error_rate": 1.0 - success_rate
        }
    
    async def get_performance_metrics(self, period_hours: int = 24) -> PerformanceMetrics:
        """Get aggregated performance metrics for a time period"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=period_hours)
        
        # Query events from Firestore
        search_events = await self._query_search_events(start_time, end_time)
        
        if not search_events:
            return PerformanceMetrics(
                period_start=start_time,
                period_end=end_time,
                total_searches=0,
                avg_response_time=0,
                p95_response_time=0,
                success_rate=1.0,
                cache_hit_rate=0,
                unique_users=0,
                unique_sessions=0,
                top_queries=[],
                search_type_distribution={}
            )
        
        # Calculate metrics
        total_searches = len(search_events)
        response_times = [e.response_time for e in search_events]
        avg_response_time = statistics.mean(response_times)
        p95_response_time = statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max(response_times)
        
        successful_searches = sum(1 for e in search_events if e.success)
        success_rate = successful_searches / total_searches
        
        unique_users = len(set(e.user_id for e in search_events if e.user_id))
        unique_sessions = len(set(e.session_id for e in search_events))
        
        # Top queries
        query_counts = defaultdict(int)
        query_response_times = defaultdict(list)
        for event in search_events:
            query_counts[event.query] += 1
            query_response_times[event.query].append(event.response_time)
        
        top_queries = [
            {
                "query": query,
                "count": count,
                "avg_response_time": statistics.mean(query_response_times[query])
            }
            for query, count in sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Search type distribution
        search_type_dist = defaultdict(int)
        for event in search_events:
            search_type_dist[event.search_type] += 1
        
        return PerformanceMetrics(
            period_start=start_time,
            period_end=end_time,
            total_searches=total_searches,
            avg_response_time=avg_response_time,
            p95_response_time=p95_response_time,
            success_rate=success_rate,
            cache_hit_rate=self.cache_stats["hits"] / (self.cache_stats["hits"] + self.cache_stats["misses"]) if (self.cache_stats["hits"] + self.cache_stats["misses"]) > 0 else 0,
            unique_users=unique_users,
            unique_sessions=unique_sessions,
            top_queries=top_queries,
            search_type_distribution=dict(search_type_dist)
        )
    
    async def _store_search_event(self, event: SearchEvent):
        """Store search event in Firestore"""
        try:
            doc_ref = self.firestore_client.collection("analytics_search_events").document(event.event_id)
            await doc_ref.set({
                **asdict(event),
                "timestamp": event.timestamp,
                "date": event.timestamp.date().isoformat(),
                "hour": event.timestamp.hour
            })
        except Exception as e:
            logger.error(f"Error storing search event: {e}")
    
    async def _store_system_metrics(self, metrics: SystemMetrics):
        """Store system metrics in Firestore"""
        try:
            doc_ref = self.firestore_client.collection("analytics_system_metrics").document()
            await doc_ref.set({
                **asdict(metrics),
                "timestamp": metrics.timestamp,
                "date": metrics.timestamp.date().isoformat(),
                "hour": metrics.timestamp.hour
            })
        except Exception as e:
            logger.error(f"Error storing system metrics: {e}")
    
    async def _store_user_interaction(self, event: UserInteractionEvent):
        """Store user interaction in Firestore"""
        try:
            doc_ref = self.firestore_client.collection("analytics_user_interactions").document(event.event_id)
            await doc_ref.set({
                **asdict(event),
                "timestamp": event.timestamp,
                "date": event.timestamp.date().isoformat(),
                "hour": event.timestamp.hour
            })
        except Exception as e:
            logger.error(f"Error storing user interaction: {e}")
    
    async def _query_search_events(self, start_time: datetime, end_time: datetime) -> List[SearchEvent]:
        """Query search events from Firestore"""
        try:
            query = (
                self.firestore_client.collection("analytics_search_events")
                .where("timestamp", ">=", start_time)
                .where("timestamp", "<=", end_time)
                .order_by("timestamp")
            )
            
            docs = await query.get()
            events = []
            
            for doc in docs:
                data = doc.to_dict()
                event = SearchEvent(
                    event_id=data["event_id"],
                    timestamp=data["timestamp"],
                    query=data["query"],
                    search_type=data["search_type"],
                    user_id=data.get("user_id"),
                    session_id=data["session_id"],
                    results_count=data["results_count"],
                    response_time=data["response_time"],
                    success=data["success"],
                    metadata=data["metadata"]
                )
                events.append(event)
            
            return events
            
        except Exception as e:
            logger.error(f"Error querying search events: {e}")
            return []
    
    async def _aggregation_loop(self):
        """Background task for data aggregation"""
        while True:
            try:
                await self._perform_aggregation()
                await asyncio.sleep(60)  # Run every minute
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in aggregation loop: {e}")
                await asyncio.sleep(60)
    
    async def _cleanup_loop(self):
        """Background task for data cleanup"""
        while True:
            try:
                await self._cleanup_old_data()
                await asyncio.sleep(3600)  # Run every hour
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in cleanup loop: {e}")
                await asyncio.sleep(3600)
    
    async def _perform_aggregation(self):
        """Perform data aggregation"""
        # This would implement time-based aggregation
        # For now, just log that aggregation is running
        logger.debug("Performing data aggregation")
    
    async def _cleanup_old_data(self):
        """Clean up old analytics data"""
        # Remove data older than 30 days
        cutoff_date = datetime.utcnow() - timedelta(days=30)
        
        try:
            # Clean up old search events
            old_events_query = (
                self.firestore_client.collection("analytics_search_events")
                .where("timestamp", "<", cutoff_date)
            )
            
            batch = self.firestore_client.batch()
            docs = await old_events_query.get()
            
            for doc in docs:
                batch.delete(doc.reference)
            
            if docs:
                await batch.commit()
                logger.info(f"Cleaned up {len(docs)} old search events")
                
        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")


# Global instance
analytics_collector = AnalyticsCollector()
