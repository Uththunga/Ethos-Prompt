"""
Performance Optimization - Advanced caching, connection pooling, and optimization strategies
"""
import logging
import asyncio
import time
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass
from datetime import datetime, timedelta
import threading
from concurrent.futures import ThreadPoolExecutor
import weakref

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    operation: str
    duration: float
    timestamp: datetime
    success: bool
    metadata: Optional[Dict[str, Any]] = None

class PerformanceMonitor:
    """
    Monitor and track performance metrics
    """
    
    def __init__(self, max_metrics: int = 10000):
        self.metrics: List[PerformanceMetrics] = []
        self.max_metrics = max_metrics
        self._lock = threading.Lock()
    
    def record_metric(self, operation: str, duration: float, success: bool = True, metadata: Optional[Dict[str, Any]] = None):
        """Record a performance metric"""
        metric = PerformanceMetrics(
            operation=operation,
            duration=duration,
            timestamp=datetime.now(),
            success=success,
            metadata=metadata or {}
        )
        
        with self._lock:
            self.metrics.append(metric)
            
            # Keep only recent metrics
            if len(self.metrics) > self.max_metrics:
                self.metrics = self.metrics[-self.max_metrics:]
    
    def get_stats(self, operation: Optional[str] = None, hours: int = 24) -> Dict[str, Any]:
        """Get performance statistics"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        with self._lock:
            filtered_metrics = [
                m for m in self.metrics 
                if m.timestamp >= cutoff_time and (operation is None or m.operation == operation)
            ]
        
        if not filtered_metrics:
            return {}
        
        durations = [m.duration for m in filtered_metrics]
        success_count = sum(1 for m in filtered_metrics if m.success)
        
        return {
            'count': len(filtered_metrics),
            'success_rate': success_count / len(filtered_metrics),
            'avg_duration': sum(durations) / len(durations),
            'min_duration': min(durations),
            'max_duration': max(durations),
            'p95_duration': sorted(durations)[int(len(durations) * 0.95)] if len(durations) > 20 else max(durations),
            'p99_duration': sorted(durations)[int(len(durations) * 0.99)] if len(durations) > 100 else max(durations)
        }

class ConnectionPool:
    """
    Generic connection pool for managing expensive connections
    """
    
    def __init__(self, create_connection: Callable, max_connections: int = 10, max_idle_time: int = 300):
        self.create_connection = create_connection
        self.max_connections = max_connections
        self.max_idle_time = max_idle_time
        
        self._pool: List[Dict[str, Any]] = []
        self._active_connections = 0
        self._lock = threading.Lock()
        
        # Start cleanup thread
        self._cleanup_thread = threading.Thread(target=self._cleanup_idle_connections, daemon=True)
        self._cleanup_thread.start()
    
    def get_connection(self):
        """Get a connection from the pool"""
        with self._lock:
            # Try to get an existing connection
            while self._pool:
                conn_info = self._pool.pop(0)
                if time.time() - conn_info['last_used'] < self.max_idle_time:
                    conn_info['last_used'] = time.time()
                    return conn_info['connection']
            
            # Create new connection if under limit
            if self._active_connections < self.max_connections:
                connection = self.create_connection()
                self._active_connections += 1
                return connection
            
            # Pool is full, wait and retry
            raise Exception("Connection pool exhausted")
    
    def return_connection(self, connection):
        """Return a connection to the pool"""
        with self._lock:
            self._pool.append({
                'connection': connection,
                'last_used': time.time()
            })
    
    def _cleanup_idle_connections(self):
        """Clean up idle connections"""
        while True:
            time.sleep(60)  # Check every minute
            
            with self._lock:
                current_time = time.time()
                active_pool = []
                
                for conn_info in self._pool:
                    if current_time - conn_info['last_used'] < self.max_idle_time:
                        active_pool.append(conn_info)
                    else:
                        # Close idle connection
                        try:
                            if hasattr(conn_info['connection'], 'close'):
                                conn_info['connection'].close()
                        except Exception as e:
                            logger.warning(f"Error closing idle connection: {e}")
                        
                        self._active_connections -= 1
                
                self._pool = active_pool

class AsyncBatchProcessor:
    """
    Batch processor for optimizing bulk operations
    """
    
    def __init__(self, batch_size: int = 100, max_wait_time: float = 1.0):
        self.batch_size = batch_size
        self.max_wait_time = max_wait_time
        self._batches: Dict[str, List[Any]] = {}
        self._batch_timers: Dict[str, float] = {}
        self._processors: Dict[str, Callable] = {}
        self._lock = asyncio.Lock()
    
    async def add_to_batch(self, batch_key: str, item: Any, processor: Callable):
        """Add item to batch for processing"""
        async with self._lock:
            if batch_key not in self._batches:
                self._batches[batch_key] = []
                self._batch_timers[batch_key] = time.time()
                self._processors[batch_key] = processor
            
            self._batches[batch_key].append(item)
            
            # Process batch if full or timer expired
            if (len(self._batches[batch_key]) >= self.batch_size or 
                time.time() - self._batch_timers[batch_key] >= self.max_wait_time):
                await self._process_batch(batch_key)
    
    async def _process_batch(self, batch_key: str):
        """Process a batch of items"""
        if batch_key not in self._batches or not self._batches[batch_key]:
            return
        
        batch = self._batches[batch_key]
        processor = self._processors[batch_key]
        
        # Clear batch
        self._batches[batch_key] = []
        self._batch_timers[batch_key] = time.time()
        
        try:
            # Process batch
            await processor(batch)
        except Exception as e:
            logger.error(f"Batch processing error for {batch_key}: {e}")

class MemoryOptimizer:
    """
    Memory optimization utilities
    """
    
    def __init__(self):
        self._weak_refs: Dict[str, weakref.WeakValueDictionary] = {}
    
    def get_weak_cache(self, cache_name: str) -> weakref.WeakValueDictionary:
        """Get or create a weak reference cache"""
        if cache_name not in self._weak_refs:
            self._weak_refs[cache_name] = weakref.WeakValueDictionary()
        return self._weak_refs[cache_name]
    
    def cleanup_cache(self, cache_name: str):
        """Manually cleanup a cache"""
        if cache_name in self._weak_refs:
            self._weak_refs[cache_name].clear()

class QueryOptimizer:
    """
    Optimize database and vector store queries
    """
    
    def __init__(self):
        self.query_cache: Dict[str, Any] = {}
        self.query_stats: Dict[str, List[float]] = {}
    
    def optimize_vector_query(self, query_vector: List[float], top_k: int = 10) -> Dict[str, Any]:
        """Optimize vector similarity query"""
        # Normalize vector for better performance
        magnitude = sum(x * x for x in query_vector) ** 0.5
        if magnitude > 0:
            normalized_vector = [x / magnitude for x in query_vector]
        else:
            normalized_vector = query_vector
        
        # Adjust top_k based on performance requirements
        optimized_top_k = min(top_k, 50)  # Limit to reasonable size
        
        return {
            'vector': normalized_vector,
            'top_k': optimized_top_k,
            'include_metadata': True,
            'include_values': False  # Reduce payload size
        }
    
    def cache_query_result(self, query_hash: str, result: Any, ttl: int = 300):
        """Cache query result with TTL"""
        self.query_cache[query_hash] = {
            'result': result,
            'expires_at': time.time() + ttl
        }
    
    def get_cached_result(self, query_hash: str) -> Optional[Any]:
        """Get cached query result if valid"""
        if query_hash in self.query_cache:
            cached = self.query_cache[query_hash]
            if time.time() < cached['expires_at']:
                return cached['result']
            else:
                del self.query_cache[query_hash]
        return None

class ResourceManager:
    """
    Manage system resources and prevent resource exhaustion
    """
    
    def __init__(self, max_memory_mb: int = 1024, max_cpu_percent: int = 80):
        self.max_memory_mb = max_memory_mb
        self.max_cpu_percent = max_cpu_percent
        self.thread_pool = ThreadPoolExecutor(max_workers=4)
    
    def check_resources(self) -> Dict[str, Any]:
        """Check current resource usage"""
        try:
            import psutil
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_mb = memory.used / (1024 * 1024)
            
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            return {
                'memory_mb': memory_mb,
                'memory_percent': memory.percent,
                'cpu_percent': cpu_percent,
                'memory_available': memory_mb < self.max_memory_mb,
                'cpu_available': cpu_percent < self.max_cpu_percent
            }
        except ImportError:
            # psutil not available, return default values
            return {
                'memory_mb': 0,
                'memory_percent': 0,
                'cpu_percent': 0,
                'memory_available': True,
                'cpu_available': True
            }
    
    def should_throttle(self) -> bool:
        """Check if operations should be throttled"""
        resources = self.check_resources()
        return not (resources['memory_available'] and resources['cpu_available'])

class PerformanceOptimizer:
    """
    Main performance optimization coordinator
    """
    
    def __init__(self):
        self.monitor = PerformanceMonitor()
        self.batch_processor = AsyncBatchProcessor()
        self.memory_optimizer = MemoryOptimizer()
        self.query_optimizer = QueryOptimizer()
        self.resource_manager = ResourceManager()
    
    def performance_timer(self, operation: str):
        """Decorator for timing operations"""
        def decorator(func):
            async def async_wrapper(*args, **kwargs):
                start_time = time.time()
                success = True
                try:
                    result = await func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    raise e
                finally:
                    duration = time.time() - start_time
                    self.monitor.record_metric(operation, duration, success)
            
            def sync_wrapper(*args, **kwargs):
                start_time = time.time()
                success = True
                try:
                    result = func(*args, **kwargs)
                    return result
                except Exception as e:
                    success = False
                    raise e
                finally:
                    duration = time.time() - start_time
                    self.monitor.record_metric(operation, duration, success)
            
            return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
        return decorator
    
    def get_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report"""
        return {
            'monitor_stats': self.monitor.get_stats(),
            'resource_usage': self.resource_manager.check_resources(),
            'cache_stats': {
                'query_cache_size': len(self.query_optimizer.query_cache)
            },
            'recommendations': self._get_performance_recommendations()
        }
    
    def _get_performance_recommendations(self) -> List[str]:
        """Get performance optimization recommendations"""
        recommendations = []
        
        # Check resource usage
        resources = self.resource_manager.check_resources()
        if not resources['memory_available']:
            recommendations.append("High memory usage detected - consider increasing memory limits")
        
        if not resources['cpu_available']:
            recommendations.append("High CPU usage detected - consider scaling horizontally")
        
        # Check operation performance
        stats = self.monitor.get_stats()
        if stats and stats.get('avg_duration', 0) > 1.0:
            recommendations.append("Slow operations detected - consider optimizing queries or adding caching")
        
        if stats and stats.get('success_rate', 1.0) < 0.95:
            recommendations.append("Low success rate detected - investigate error patterns")
        
        return recommendations

# Global instance
performance_optimizer = PerformanceOptimizer()

