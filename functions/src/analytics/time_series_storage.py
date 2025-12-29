"""
Time Series Data Storage and Retrieval for Analytics
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass
from collections import defaultdict
import json
import statistics

from google.cloud import firestore
from google.cloud.firestore import AsyncClient

logger = logging.getLogger(__name__)

@dataclass
class TimeSeriesPoint:
    """Single time series data point"""
    timestamp: datetime
    metric_name: str
    value: Union[float, int]
    tags: Dict[str, str]
    metadata: Dict[str, Any]

@dataclass
class TimeSeriesQuery:
    """Time series query parameters"""
    metric_name: str
    start_time: datetime
    end_time: datetime
    tags: Optional[Dict[str, str]] = None
    aggregation: Optional[str] = None  # 'avg', 'sum', 'max', 'min', 'count'
    granularity: Optional[str] = None  # 'minute', 'hour', 'day'

@dataclass
class TimeSeriesResult:
    """Time series query result"""
    metric_name: str
    data_points: List[Tuple[datetime, float]]
    aggregation: Optional[str]
    granularity: Optional[str]
    total_points: int

class TimeSeriesStorage:
    """
    Efficient time series data storage and retrieval system
    """
    
    def __init__(self, firestore_client: Optional[AsyncClient] = None):
        """Initialize time series storage"""
        self.firestore_client = firestore_client or firestore.AsyncClient()
        
        # Collection names for different granularities
        self.collections = {
            "raw": "timeseries_raw",
            "minute": "timeseries_minute",
            "hour": "timeseries_hour", 
            "day": "timeseries_day"
        }
        
        # Retention policies (in days)
        self.retention_policies = {
            "raw": 7,      # Keep raw data for 7 days
            "minute": 30,  # Keep minute aggregates for 30 days
            "hour": 365,   # Keep hour aggregates for 1 year
            "day": 1095    # Keep day aggregates for 3 years
        }
        
        # Background tasks
        self._aggregation_task = None
        self._cleanup_task = None
        
        logger.info("Time series storage initialized")
    
    async def start_background_tasks(self):
        """Start background aggregation and cleanup tasks"""
        if not self._aggregation_task:
            self._aggregation_task = asyncio.create_task(self._aggregation_loop())
        
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())
        
        logger.info("Time series background tasks started")
    
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
        
        logger.info("Time series background tasks stopped")
    
    async def write_point(self, point: TimeSeriesPoint):
        """Write a single time series point"""
        try:
            doc_data = {
                "timestamp": point.timestamp,
                "metric_name": point.metric_name,
                "value": point.value,
                "tags": point.tags,
                "metadata": point.metadata,
                "date": point.timestamp.date().isoformat(),
                "hour": point.timestamp.hour,
                "minute": point.timestamp.minute
            }
            
            # Generate document ID for deduplication
            doc_id = self._generate_doc_id(point)
            
            doc_ref = self.firestore_client.collection(self.collections["raw"]).document(doc_id)
            await doc_ref.set(doc_data)
            
            logger.debug(f"Wrote time series point: {point.metric_name} = {point.value}")
            
        except Exception as e:
            logger.error(f"Error writing time series point: {e}")
    
    async def write_points(self, points: List[TimeSeriesPoint]):
        """Write multiple time series points in batch"""
        try:
            batch = self.firestore_client.batch()
            
            for point in points:
                doc_data = {
                    "timestamp": point.timestamp,
                    "metric_name": point.metric_name,
                    "value": point.value,
                    "tags": point.tags,
                    "metadata": point.metadata,
                    "date": point.timestamp.date().isoformat(),
                    "hour": point.timestamp.hour,
                    "minute": point.timestamp.minute
                }
                
                doc_id = self._generate_doc_id(point)
                doc_ref = self.firestore_client.collection(self.collections["raw"]).document(doc_id)
                batch.set(doc_ref, doc_data)
            
            await batch.commit()
            logger.debug(f"Wrote {len(points)} time series points")
            
        except Exception as e:
            logger.error(f"Error writing time series points: {e}")
    
    async def query(self, query: TimeSeriesQuery) -> TimeSeriesResult:
        """Query time series data"""
        try:
            # Determine best collection to query from based on time range and granularity
            collection_name = self._select_optimal_collection(query)
            
            # Build Firestore query
            firestore_query = (
                self.firestore_client.collection(collection_name)
                .where("metric_name", "==", query.metric_name)
                .where("timestamp", ">=", query.start_time)
                .where("timestamp", "<=", query.end_time)
                .order_by("timestamp")
            )
            
            # Add tag filters
            if query.tags:
                for tag_key, tag_value in query.tags.items():
                    firestore_query = firestore_query.where(f"tags.{tag_key}", "==", tag_value)
            
            # Execute query
            docs = await firestore_query.get()
            raw_points = [(doc.to_dict()["timestamp"], doc.to_dict()["value"]) for doc in docs]
            
            # Apply aggregation if requested
            if query.aggregation and query.granularity:
                aggregated_points = self._aggregate_points(raw_points, query.aggregation, query.granularity)
            else:
                aggregated_points = raw_points
            
            return TimeSeriesResult(
                metric_name=query.metric_name,
                data_points=aggregated_points,
                aggregation=query.aggregation,
                granularity=query.granularity,
                total_points=len(aggregated_points)
            )
            
        except Exception as e:
            logger.error(f"Error querying time series data: {e}")
            return TimeSeriesResult(
                metric_name=query.metric_name,
                data_points=[],
                aggregation=query.aggregation,
                granularity=query.granularity,
                total_points=0
            )
    
    async def get_metric_names(self, start_time: Optional[datetime] = None,
                             end_time: Optional[datetime] = None) -> List[str]:
        """Get list of available metric names"""
        try:
            query = self.firestore_client.collection(self.collections["raw"])
            
            if start_time:
                query = query.where("timestamp", ">=", start_time)
            if end_time:
                query = query.where("timestamp", "<=", end_time)
            
            docs = await query.get()
            metric_names = set()
            
            for doc in docs:
                metric_names.add(doc.to_dict()["metric_name"])
            
            return sorted(list(metric_names))
            
        except Exception as e:
            logger.error(f"Error getting metric names: {e}")
            return []
    
    async def get_metric_tags(self, metric_name: str) -> Dict[str, List[str]]:
        """Get available tags for a metric"""
        try:
            query = (
                self.firestore_client.collection(self.collections["raw"])
                .where("metric_name", "==", metric_name)
                .limit(1000)  # Limit to avoid large queries
            )
            
            docs = await query.get()
            tag_values = defaultdict(set)
            
            for doc in docs:
                tags = doc.to_dict().get("tags", {})
                for tag_key, tag_value in tags.items():
                    tag_values[tag_key].add(tag_value)
            
            return {key: sorted(list(values)) for key, values in tag_values.items()}
            
        except Exception as e:
            logger.error(f"Error getting metric tags: {e}")
            return {}
    
    async def delete_metric(self, metric_name: str, start_time: Optional[datetime] = None,
                          end_time: Optional[datetime] = None):
        """Delete time series data for a metric"""
        try:
            for collection_name in self.collections.values():
                query = (
                    self.firestore_client.collection(collection_name)
                    .where("metric_name", "==", metric_name)
                )
                
                if start_time:
                    query = query.where("timestamp", ">=", start_time)
                if end_time:
                    query = query.where("timestamp", "<=", end_time)
                
                docs = await query.get()
                
                if docs:
                    batch = self.firestore_client.batch()
                    for doc in docs:
                        batch.delete(doc.reference)
                    await batch.commit()
                    
                    logger.info(f"Deleted {len(docs)} points for metric {metric_name} from {collection_name}")
            
        except Exception as e:
            logger.error(f"Error deleting metric data: {e}")
    
    def _generate_doc_id(self, point: TimeSeriesPoint) -> str:
        """Generate unique document ID for deduplication"""
        # Create ID based on timestamp, metric name, and tags
        tag_str = "_".join(f"{k}:{v}" for k, v in sorted(point.tags.items()))
        timestamp_str = point.timestamp.strftime("%Y%m%d_%H%M%S_%f")
        return f"{point.metric_name}_{timestamp_str}_{hash(tag_str) % 10000:04d}"
    
    def _select_optimal_collection(self, query: TimeSeriesQuery) -> str:
        """Select the optimal collection for a query based on time range and granularity"""
        time_range = query.end_time - query.start_time
        
        # If granularity is specified, prefer pre-aggregated data
        if query.granularity == "day" and time_range.days > 1:
            return self.collections["day"]
        elif query.granularity == "hour" and time_range.total_seconds() > 3600:
            return self.collections["hour"]
        elif query.granularity == "minute" and time_range.total_seconds() > 60:
            return self.collections["minute"]
        
        # For large time ranges, use aggregated data
        if time_range.days > 30:
            return self.collections["day"]
        elif time_range.days > 7:
            return self.collections["hour"]
        elif time_range.total_seconds() > 3600:
            return self.collections["minute"]
        else:
            return self.collections["raw"]
    
    def _aggregate_points(self, points: List[Tuple[datetime, float]], 
                         aggregation: str, granularity: str) -> List[Tuple[datetime, float]]:
        """Aggregate time series points"""
        if not points:
            return []
        
        # Group points by time bucket
        if granularity == "minute":
            bucket_size = timedelta(minutes=1)
        elif granularity == "hour":
            bucket_size = timedelta(hours=1)
        elif granularity == "day":
            bucket_size = timedelta(days=1)
        else:
            return points
        
        # Create time buckets
        start_time = points[0][0]
        end_time = points[-1][0]
        
        buckets = defaultdict(list)
        
        for timestamp, value in points:
            # Calculate bucket start time
            if granularity == "minute":
                bucket_start = timestamp.replace(second=0, microsecond=0)
            elif granularity == "hour":
                bucket_start = timestamp.replace(minute=0, second=0, microsecond=0)
            elif granularity == "day":
                bucket_start = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
            
            buckets[bucket_start].append(value)
        
        # Aggregate each bucket
        aggregated = []
        for bucket_time in sorted(buckets.keys()):
            values = buckets[bucket_time]
            
            if aggregation == "avg":
                agg_value = statistics.mean(values)
            elif aggregation == "sum":
                agg_value = sum(values)
            elif aggregation == "max":
                agg_value = max(values)
            elif aggregation == "min":
                agg_value = min(values)
            elif aggregation == "count":
                agg_value = len(values)
            else:
                agg_value = statistics.mean(values)  # Default to average
            
            aggregated.append((bucket_time, agg_value))
        
        return aggregated
    
    async def _aggregation_loop(self):
        """Background task for data aggregation"""
        while True:
            try:
                await self._perform_aggregation()
                await asyncio.sleep(300)  # Run every 5 minutes
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in aggregation loop: {e}")
                await asyncio.sleep(300)
    
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
        """Perform time series data aggregation"""
        now = datetime.utcnow()
        
        # Aggregate raw data to minute buckets
        await self._aggregate_to_granularity("raw", "minute", now - timedelta(hours=1), now)
        
        # Aggregate minute data to hour buckets
        await self._aggregate_to_granularity("minute", "hour", now - timedelta(days=1), now)
        
        # Aggregate hour data to day buckets
        await self._aggregate_to_granularity("hour", "day", now - timedelta(days=7), now)
        
        logger.debug("Time series aggregation completed")
    
    async def _aggregate_to_granularity(self, source_granularity: str, target_granularity: str,
                                      start_time: datetime, end_time: datetime):
        """Aggregate data from one granularity to another"""
        # This would implement the actual aggregation logic
        # For now, just log the operation
        logger.debug(f"Aggregating {source_granularity} to {target_granularity}")
    
    async def _cleanup_old_data(self):
        """Clean up old time series data based on retention policies"""
        now = datetime.utcnow()
        
        for granularity, retention_days in self.retention_policies.items():
            cutoff_date = now - timedelta(days=retention_days)
            collection_name = self.collections[granularity]
            
            try:
                # Delete old documents
                old_docs_query = (
                    self.firestore_client.collection(collection_name)
                    .where("timestamp", "<", cutoff_date)
                    .limit(500)  # Process in batches
                )
                
                docs = await old_docs_query.get()
                
                if docs:
                    batch = self.firestore_client.batch()
                    for doc in docs:
                        batch.delete(doc.reference)
                    await batch.commit()
                    
                    logger.info(f"Cleaned up {len(docs)} old documents from {collection_name}")
                
            except Exception as e:
                logger.error(f"Error cleaning up {collection_name}: {e}")


# Global instance
time_series_storage = TimeSeriesStorage()
