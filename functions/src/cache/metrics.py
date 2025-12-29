"""
Cache Metrics Tracking and Monitoring
Provides detailed metrics for cache performance analysis
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass, asdict
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class CacheMetrics:
    """Cache performance metrics"""
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    invalidations: int = 0
    errors: int = 0
    total_size_bytes: int = 0
    avg_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    
    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate"""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0
    
    @property
    def miss_rate(self) -> float:
        """Calculate cache miss rate"""
        return 1.0 - self.hit_rate
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = asdict(self)
        data['hit_rate'] = self.hit_rate
        data['miss_rate'] = self.miss_rate
        return data


@dataclass
class LayerMetrics:
    """Metrics for a specific cache layer"""
    layer_name: str
    metrics: CacheMetrics
    timestamp: datetime


class CacheMetricsCollector:
    """
    Collects and aggregates cache metrics across all layers
    """
    
    def __init__(self):
        self.layer_metrics: Dict[str, CacheMetrics] = {
            'memory': CacheMetrics(),
            'firestore': CacheMetrics(),
            'redis': CacheMetrics()
        }
        
        # Time-series data for trend analysis
        self.metrics_history: List[LayerMetrics] = []
        self.max_history_size = 1000
        
        # Latency tracking
        self.latency_samples: Dict[str, List[float]] = defaultdict(list)
        self.max_samples = 1000
        
        # Alert thresholds
        self.alert_thresholds = {
            'min_hit_rate': 0.7,  # Alert if hit rate < 70%
            'max_latency_ms': 100,  # Alert if p95 latency > 100ms
            'max_error_rate': 0.05  # Alert if error rate > 5%
        }
        
        logger.info("Cache metrics collector initialized")
    
    def record_hit(self, layer: str):
        """Record a cache hit"""
        if layer in self.layer_metrics:
            self.layer_metrics[layer].hits += 1
    
    def record_miss(self, layer: str):
        """Record a cache miss"""
        if layer in self.layer_metrics:
            self.layer_metrics[layer].misses += 1
    
    def record_eviction(self, layer: str):
        """Record a cache eviction"""
        if layer in self.layer_metrics:
            self.layer_metrics[layer].evictions += 1
    
    def record_invalidation(self, layer: str):
        """Record a cache invalidation"""
        if layer in self.layer_metrics:
            self.layer_metrics[layer].invalidations += 1
    
    def record_error(self, layer: str):
        """Record a cache error"""
        if layer in self.layer_metrics:
            self.layer_metrics[layer].errors += 1
    
    def record_latency(self, layer: str, latency_ms: float):
        """Record cache operation latency"""
        if layer not in self.latency_samples:
            self.latency_samples[layer] = []
        
        self.latency_samples[layer].append(latency_ms)
        
        # Keep only recent samples
        if len(self.latency_samples[layer]) > self.max_samples:
            self.latency_samples[layer] = self.latency_samples[layer][-self.max_samples:]
        
        # Update metrics
        if layer in self.layer_metrics:
            samples = self.latency_samples[layer]
            self.layer_metrics[layer].avg_latency_ms = sum(samples) / len(samples)
            
            # Calculate percentiles
            sorted_samples = sorted(samples)
            p95_idx = int(len(sorted_samples) * 0.95)
            p99_idx = int(len(sorted_samples) * 0.99)
            
            self.layer_metrics[layer].p95_latency_ms = sorted_samples[p95_idx] if sorted_samples else 0.0
            self.layer_metrics[layer].p99_latency_ms = sorted_samples[p99_idx] if sorted_samples else 0.0
    
    def update_size(self, layer: str, size_bytes: int):
        """Update total cache size"""
        if layer in self.layer_metrics:
            self.layer_metrics[layer].total_size_bytes = size_bytes
    
    def get_metrics(self, layer: Optional[str] = None) -> Dict[str, Any]:
        """Get current metrics"""
        if layer:
            if layer in self.layer_metrics:
                return self.layer_metrics[layer].to_dict()
            return {}
        
        # Return all layers
        return {
            layer: metrics.to_dict()
            for layer, metrics in self.layer_metrics.items()
        }
    
    def get_aggregated_metrics(self) -> Dict[str, Any]:
        """Get aggregated metrics across all layers"""
        total_hits = sum(m.hits for m in self.layer_metrics.values())
        total_misses = sum(m.misses for m in self.layer_metrics.values())
        total_evictions = sum(m.evictions for m in self.layer_metrics.values())
        total_invalidations = sum(m.invalidations for m in self.layer_metrics.values())
        total_errors = sum(m.errors for m in self.layer_metrics.values())
        total_size = sum(m.total_size_bytes for m in self.layer_metrics.values())
        
        total_requests = total_hits + total_misses
        hit_rate = total_hits / total_requests if total_requests > 0 else 0.0
        error_rate = total_errors / total_requests if total_requests > 0 else 0.0
        
        return {
            'total_hits': total_hits,
            'total_misses': total_misses,
            'total_evictions': total_evictions,
            'total_invalidations': total_invalidations,
            'total_errors': total_errors,
            'total_size_bytes': total_size,
            'hit_rate': hit_rate,
            'error_rate': error_rate,
            'total_requests': total_requests
        }
    
    def check_alerts(self) -> List[Dict[str, Any]]:
        """Check for alert conditions"""
        alerts = []
        aggregated = self.get_aggregated_metrics()
        
        # Check hit rate
        if aggregated['hit_rate'] < self.alert_thresholds['min_hit_rate']:
            alerts.append({
                'type': 'LOW_HIT_RATE',
                'severity': 'WARNING',
                'message': f"Cache hit rate ({aggregated['hit_rate']:.2%}) below threshold ({self.alert_thresholds['min_hit_rate']:.2%})",
                'value': aggregated['hit_rate'],
                'threshold': self.alert_thresholds['min_hit_rate']
            })
        
        # Check error rate
        if aggregated['error_rate'] > self.alert_thresholds['max_error_rate']:
            alerts.append({
                'type': 'HIGH_ERROR_RATE',
                'severity': 'ERROR',
                'message': f"Cache error rate ({aggregated['error_rate']:.2%}) above threshold ({self.alert_thresholds['max_error_rate']:.2%})",
                'value': aggregated['error_rate'],
                'threshold': self.alert_thresholds['max_error_rate']
            })
        
        # Check latency per layer
        for layer, metrics in self.layer_metrics.items():
            if metrics.p95_latency_ms > self.alert_thresholds['max_latency_ms']:
                alerts.append({
                    'type': 'HIGH_LATENCY',
                    'severity': 'WARNING',
                    'layer': layer,
                    'message': f"{layer} cache p95 latency ({metrics.p95_latency_ms:.2f}ms) above threshold ({self.alert_thresholds['max_latency_ms']}ms)",
                    'value': metrics.p95_latency_ms,
                    'threshold': self.alert_thresholds['max_latency_ms']
                })
        
        return alerts
    
    def snapshot(self):
        """Take a snapshot of current metrics"""
        for layer, metrics in self.layer_metrics.items():
            snapshot = LayerMetrics(
                layer_name=layer,
                metrics=CacheMetrics(**asdict(metrics)),
                timestamp=datetime.now(timezone.utc)
            )
            self.metrics_history.append(snapshot)
        
        # Trim history
        if len(self.metrics_history) > self.max_history_size:
            self.metrics_history = self.metrics_history[-self.max_history_size:]
    
    def get_trends(self, layer: str, duration_minutes: int = 60) -> Dict[str, Any]:
        """Get metric trends over time"""
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=duration_minutes)
        
        relevant_snapshots = [
            s for s in self.metrics_history
            if s.layer_name == layer and s.timestamp >= cutoff
        ]
        
        if not relevant_snapshots:
            return {}
        
        # Calculate trends
        hit_rates = [s.metrics.hit_rate for s in relevant_snapshots]
        latencies = [s.metrics.avg_latency_ms for s in relevant_snapshots]
        
        return {
            'layer': layer,
            'duration_minutes': duration_minutes,
            'snapshots_count': len(relevant_snapshots),
            'hit_rate': {
                'current': hit_rates[-1] if hit_rates else 0.0,
                'avg': sum(hit_rates) / len(hit_rates) if hit_rates else 0.0,
                'min': min(hit_rates) if hit_rates else 0.0,
                'max': max(hit_rates) if hit_rates else 0.0
            },
            'latency_ms': {
                'current': latencies[-1] if latencies else 0.0,
                'avg': sum(latencies) / len(latencies) if latencies else 0.0,
                'min': min(latencies) if latencies else 0.0,
                'max': max(latencies) if latencies else 0.0
            }
        }
    
    def reset(self, layer: Optional[str] = None):
        """Reset metrics"""
        if layer:
            if layer in self.layer_metrics:
                self.layer_metrics[layer] = CacheMetrics()
                self.latency_samples[layer] = []
        else:
            for layer in self.layer_metrics:
                self.layer_metrics[layer] = CacheMetrics()
            self.latency_samples.clear()
            self.metrics_history.clear()
        
        logger.info(f"Cache metrics reset for layer: {layer or 'all'}")


# Global metrics collector
cache_metrics_collector = CacheMetricsCollector()


# Convenience functions
def record_cache_hit(layer: str):
    """Record a cache hit"""
    cache_metrics_collector.record_hit(layer)


def record_cache_miss(layer: str):
    """Record a cache miss"""
    cache_metrics_collector.record_miss(layer)


def get_cache_metrics(layer: Optional[str] = None) -> Dict[str, Any]:
    """Get cache metrics"""
    return cache_metrics_collector.get_metrics(layer)

