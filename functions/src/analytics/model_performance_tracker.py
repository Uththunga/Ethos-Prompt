"""
Model Performance Tracking System
Tracks and analyzes performance metrics for AI models
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import statistics

try:
    from firebase_admin import firestore
    from google.cloud.firestore import Client
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

logger = logging.getLogger(__name__)

class PerformanceMetric(Enum):
    """Types of performance metrics"""
    LATENCY = "latency"
    COST = "cost"
    SUCCESS_RATE = "success_rate"
    TOKEN_USAGE = "token_usage"
    USER_RATING = "user_rating"
    ERROR_RATE = "error_rate"
    THROUGHPUT = "throughput"

@dataclass
class ModelPerformanceRecord:
    """Single performance record for a model"""
    model_id: str
    model_name: str
    timestamp: datetime
    execution_id: str
    user_id: str
    prompt_id: Optional[str]
    
    # Performance metrics
    latency_ms: float
    cost_usd: float
    success: bool
    error_message: Optional[str]
    
    # Token usage
    input_tokens: int
    output_tokens: int
    total_tokens: int
    
    # User feedback
    user_rating: Optional[float]  # 1-5 stars
    user_feedback: Optional[str]
    
    # Context
    prompt_length: int
    response_length: int
    use_rag: bool
    temperature: float
    max_tokens: int
    
    # Metadata
    metadata: Dict[str, Any]

@dataclass
class ModelPerformanceStats:
    """Aggregated performance statistics for a model"""
    model_id: str
    model_name: str
    time_period: str  # e.g., "24h", "7d", "30d"
    
    # Execution stats
    total_executions: int
    successful_executions: int
    failed_executions: int
    success_rate: float
    
    # Latency stats
    avg_latency_ms: float
    median_latency_ms: float
    p95_latency_ms: float
    p99_latency_ms: float
    
    # Cost stats
    total_cost_usd: float
    avg_cost_per_execution: float
    cost_per_1k_tokens: float
    
    # Token stats
    total_tokens: int
    avg_tokens_per_execution: float
    avg_input_tokens: float
    avg_output_tokens: float
    
    # User satisfaction
    avg_user_rating: Optional[float]
    total_ratings: int
    rating_distribution: Dict[int, int]  # {1: count, 2: count, ...}
    
    # Efficiency metrics
    tokens_per_second: float
    cost_efficiency_score: float  # Lower is better
    quality_score: float  # Based on ratings and success rate
    
    # Timestamps
    calculated_at: datetime
    data_from: datetime
    data_to: datetime

class ModelPerformanceTracker:
    """
    Service for tracking and analyzing model performance
    """
    
    def __init__(self, db: Optional[Client] = None):
        self.db = db or (firestore.client() if FIREBASE_AVAILABLE else None)
        self.collection_name = "model_performance"
        self.stats_collection_name = "model_performance_stats"
        
        logger.info("Model performance tracker initialized")
    
    # =========================================================================
    # RECORD TRACKING
    # =========================================================================
    
    async def record_execution(
        self,
        model_id: str,
        model_name: str,
        execution_id: str,
        user_id: str,
        latency_ms: float,
        cost_usd: float,
        success: bool,
        input_tokens: int,
        output_tokens: int,
        prompt_id: Optional[str] = None,
        error_message: Optional[str] = None,
        user_rating: Optional[float] = None,
        user_feedback: Optional[str] = None,
        prompt_length: int = 0,
        response_length: int = 0,
        use_rag: bool = False,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Record a model execution for performance tracking
        
        Returns:
            Document ID of the performance record
        """
        if not self.db:
            logger.warning("Firestore not available, skipping performance recording")
            return ""
        
        record = ModelPerformanceRecord(
            model_id=model_id,
            model_name=model_name,
            timestamp=datetime.now(timezone.utc),
            execution_id=execution_id,
            user_id=user_id,
            prompt_id=prompt_id,
            latency_ms=latency_ms,
            cost_usd=cost_usd,
            success=success,
            error_message=error_message,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=input_tokens + output_tokens,
            user_rating=user_rating,
            user_feedback=user_feedback,
            prompt_length=prompt_length,
            response_length=response_length,
            use_rag=use_rag,
            temperature=temperature,
            max_tokens=max_tokens,
            metadata=metadata or {}
        )
        
        try:
            doc_ref = self.db.collection(self.collection_name).document()
            doc_ref.set(asdict(record))
            
            logger.info(f"Recorded performance for model {model_id}: {execution_id}")
            return doc_ref.id
            
        except Exception as e:
            logger.error(f"Failed to record performance: {e}")
            return ""
    
    async def update_user_feedback(
        self,
        execution_id: str,
        user_rating: float,
        user_feedback: Optional[str] = None
    ) -> bool:
        """Update user feedback for an execution"""
        if not self.db:
            return False
        
        try:
            # Find the performance record
            query = self.db.collection(self.collection_name).where(
                'execution_id', '==', execution_id
            ).limit(1)
            
            docs = query.stream()
            for doc in docs:
                doc.reference.update({
                    'user_rating': user_rating,
                    'user_feedback': user_feedback,
                    'feedback_updated_at': firestore.SERVER_TIMESTAMP
                })
                logger.info(f"Updated feedback for execution {execution_id}")
                return True
            
            logger.warning(f"Performance record not found for execution {execution_id}")
            return False
            
        except Exception as e:
            logger.error(f"Failed to update feedback: {e}")
            return False
    
    # =========================================================================
    # STATISTICS CALCULATION
    # =========================================================================
    
    async def calculate_stats(
        self,
        model_id: str,
        time_period: str = "24h"
    ) -> Optional[ModelPerformanceStats]:
        """
        Calculate aggregated statistics for a model
        
        Args:
            model_id: Model identifier
            time_period: Time period (24h, 7d, 30d, all)
        
        Returns:
            ModelPerformanceStats or None if no data
        """
        if not self.db:
            return None
        
        # Calculate time range
        now = datetime.now(timezone.utc)
        if time_period == "24h":
            start_time = now - timedelta(hours=24)
        elif time_period == "7d":
            start_time = now - timedelta(days=7)
        elif time_period == "30d":
            start_time = now - timedelta(days=30)
        else:  # "all"
            start_time = datetime.min.replace(tzinfo=timezone.utc)
        
        try:
            # Query performance records
            query = self.db.collection(self.collection_name).where(
                'model_id', '==', model_id
            ).where(
                'timestamp', '>=', start_time
            ).order_by('timestamp')
            
            records = []
            model_name = None
            
            for doc in query.stream():
                data = doc.to_dict()
                records.append(data)
                if not model_name:
                    model_name = data.get('model_name', model_id)
            
            if not records:
                logger.info(f"No performance data found for model {model_id}")
                return None
            
            # Calculate statistics
            stats = self._calculate_statistics(records, model_id, model_name, time_period, start_time, now)
            
            # Store stats in Firestore
            await self._store_stats(stats)
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to calculate stats: {e}")
            return None
    
    def _calculate_statistics(
        self,
        records: List[Dict[str, Any]],
        model_id: str,
        model_name: str,
        time_period: str,
        start_time: datetime,
        end_time: datetime
    ) -> ModelPerformanceStats:
        """Calculate statistics from records"""
        
        total_executions = len(records)
        successful = [r for r in records if r.get('success', False)]
        failed = [r for r in records if not r.get('success', False)]
        
        # Latency stats
        latencies = [r.get('latency_ms', 0) for r in records]
        latencies.sort()
        
        # Cost stats
        costs = [r.get('cost_usd', 0) for r in records]
        total_cost = sum(costs)
        
        # Token stats
        total_tokens = sum(r.get('total_tokens', 0) for r in records)
        input_tokens = [r.get('input_tokens', 0) for r in records]
        output_tokens = [r.get('output_tokens', 0) for r in records]
        
        # User ratings
        ratings = [r.get('user_rating') for r in records if r.get('user_rating') is not None]
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for rating in ratings:
            rating_dist[int(rating)] = rating_dist.get(int(rating), 0) + 1
        
        # Calculate efficiency metrics
        total_time_seconds = sum(latencies) / 1000
        tokens_per_second = total_tokens / total_time_seconds if total_time_seconds > 0 else 0
        
        cost_per_1k_tokens = (total_cost / total_tokens * 1000) if total_tokens > 0 else 0
        cost_efficiency_score = cost_per_1k_tokens  # Lower is better
        
        # Quality score (0-100)
        success_rate = len(successful) / total_executions if total_executions > 0 else 0
        avg_rating = statistics.mean(ratings) if ratings else None
        quality_score = (success_rate * 50) + ((avg_rating / 5 * 50) if avg_rating else 0)
        
        return ModelPerformanceStats(
            model_id=model_id,
            model_name=model_name,
            time_period=time_period,
            total_executions=total_executions,
            successful_executions=len(successful),
            failed_executions=len(failed),
            success_rate=success_rate,
            avg_latency_ms=statistics.mean(latencies) if latencies else 0,
            median_latency_ms=statistics.median(latencies) if latencies else 0,
            p95_latency_ms=latencies[int(len(latencies) * 0.95)] if latencies else 0,
            p99_latency_ms=latencies[int(len(latencies) * 0.99)] if latencies else 0,
            total_cost_usd=total_cost,
            avg_cost_per_execution=total_cost / total_executions if total_executions > 0 else 0,
            cost_per_1k_tokens=cost_per_1k_tokens,
            total_tokens=total_tokens,
            avg_tokens_per_execution=total_tokens / total_executions if total_executions > 0 else 0,
            avg_input_tokens=statistics.mean(input_tokens) if input_tokens else 0,
            avg_output_tokens=statistics.mean(output_tokens) if output_tokens else 0,
            avg_user_rating=avg_rating,
            total_ratings=len(ratings),
            rating_distribution=rating_dist,
            tokens_per_second=tokens_per_second,
            cost_efficiency_score=cost_efficiency_score,
            quality_score=quality_score,
            calculated_at=datetime.now(timezone.utc),
            data_from=start_time,
            data_to=end_time
        )
    
    async def _store_stats(self, stats: ModelPerformanceStats) -> bool:
        """Store calculated statistics in Firestore"""
        if not self.db:
            return False
        
        try:
            doc_id = f"{stats.model_id}_{stats.time_period}"
            doc_ref = self.db.collection(self.stats_collection_name).document(doc_id)
            doc_ref.set(asdict(stats))
            
            logger.info(f"Stored stats for model {stats.model_id} ({stats.time_period})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store stats: {e}")
            return False
    
    # =========================================================================
    # QUERY METHODS
    # =========================================================================
    
    async def get_model_stats(
        self,
        model_id: str,
        time_period: str = "24h"
    ) -> Optional[ModelPerformanceStats]:
        """Get cached statistics for a model"""
        if not self.db:
            return None
        
        try:
            doc_id = f"{model_id}_{time_period}"
            doc = self.db.collection(self.stats_collection_name).document(doc_id).get()
            
            if doc.exists:
                data = doc.to_dict()
                # Convert dict back to dataclass (simplified)
                return ModelPerformanceStats(**data)
            
            # If no cached stats, calculate them
            return await self.calculate_stats(model_id, time_period)
            
        except Exception as e:
            logger.error(f"Failed to get model stats: {e}")
            return None
    
    async def get_all_models_stats(
        self,
        time_period: str = "24h"
    ) -> List[ModelPerformanceStats]:
        """Get statistics for all models"""
        if not self.db:
            return []
        
        try:
            query = self.db.collection(self.stats_collection_name).where(
                'time_period', '==', time_period
            ).order_by('quality_score', direction=firestore.Query.DESCENDING)
            
            stats_list = []
            for doc in query.stream():
                data = doc.to_dict()
                stats_list.append(ModelPerformanceStats(**data))
            
            return stats_list
            
        except Exception as e:
            logger.error(f"Failed to get all models stats: {e}")
            return []
    
    async def get_top_models(
        self,
        metric: PerformanceMetric = PerformanceMetric.QUALITY_SCORE,
        time_period: str = "24h",
        limit: int = 10
    ) -> List[ModelPerformanceStats]:
        """Get top performing models by a specific metric"""
        all_stats = await self.get_all_models_stats(time_period)
        
        # Sort by metric
        if metric == PerformanceMetric.LATENCY:
            all_stats.sort(key=lambda x: x.avg_latency_ms)
        elif metric == PerformanceMetric.COST:
            all_stats.sort(key=lambda x: x.cost_efficiency_score)
        elif metric == PerformanceMetric.SUCCESS_RATE:
            all_stats.sort(key=lambda x: x.success_rate, reverse=True)
        elif metric == PerformanceMetric.USER_RATING:
            all_stats.sort(key=lambda x: x.avg_user_rating or 0, reverse=True)
        else:  # QUALITY_SCORE
            all_stats.sort(key=lambda x: x.quality_score, reverse=True)
        
        return all_stats[:limit]

# Global instance
model_performance_tracker = ModelPerformanceTracker()

