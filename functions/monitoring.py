"""
Firebase Functions Monitoring and Alerting
Provides comprehensive monitoring for backend functions
"""

import time
import logging
import json
from typing import Dict, Any, Optional
from functools import wraps
from firebase_admin import firestore
from google.cloud import monitoring_v3
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FunctionMonitor:
    """Monitor Firebase Functions performance and errors"""
    
    def __init__(self):
        self.db = firestore.client()
        self.metrics_collection = 'monitoring_metrics'
        self.errors_collection = 'monitoring_errors'
        
        # Initialize Google Cloud Monitoring client
        try:
            self.monitoring_client = monitoring_v3.MetricServiceClient()
            self.project_name = f"projects/{os.environ.get('GCLOUD_PROJECT', 'demo-project')}"
        except Exception as e:
            logger.warning(f"Failed to initialize monitoring client: {e}")
            self.monitoring_client = None
    
    def record_metric(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a custom metric"""
        try:
            metric_data = {
                'name': metric_name,
                'value': value,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'labels': labels or {}
            }
            
            # Store in Firestore
            self.db.collection(self.metrics_collection).add(metric_data)
            
            # Send to Google Cloud Monitoring if available
            if self.monitoring_client:
                self._send_to_cloud_monitoring(metric_name, value, labels)
                
            logger.info(f"Recorded metric: {metric_name} = {value}")
            
        except Exception as e:
            logger.error(f"Failed to record metric {metric_name}: {e}")
    
    def record_error(self, error_message: str, function_name: str, stack_trace: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        """Record an error event"""
        try:
            error_data = {
                'message': error_message,
                'function_name': function_name,
                'stack_trace': stack_trace,
                'metadata': metadata or {},
                'timestamp': firestore.SERVER_TIMESTAMP,
                'severity': 'ERROR'
            }
            
            # Store in Firestore
            self.db.collection(self.errors_collection).add(error_data)
            
            logger.error(f"Recorded error in {function_name}: {error_message}")
            
        except Exception as e:
            logger.error(f"Failed to record error: {e}")
    
    def _send_to_cloud_monitoring(self, metric_name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Send metric to Google Cloud Monitoring"""
        try:
            series = monitoring_v3.TimeSeries()
            series.metric.type = f"custom.googleapis.com/rag_prompt_library/{metric_name}"
            series.resource.type = "cloud_function"
            series.resource.labels["function_name"] = os.environ.get('FUNCTION_NAME', 'unknown')
            series.resource.labels["region"] = os.environ.get('FUNCTION_REGION', 'us-central1')
            
            # Add custom labels
            if labels:
                for key, value in labels.items():
                    series.metric.labels[key] = str(value)
            
            # Create data point
            point = monitoring_v3.Point()
            point.value.double_value = value
            point.interval.end_time.seconds = int(time.time())
            series.points = [point]
            
            # Send to monitoring
            self.monitoring_client.create_time_series(
                name=self.project_name,
                time_series=[series]
            )
            
        except Exception as e:
            logger.warning(f"Failed to send metric to Cloud Monitoring: {e}")

# Global monitor instance
monitor = FunctionMonitor()

def monitor_function(function_name: str):
    """Decorator to monitor function execution"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                # Record function start
                monitor.record_metric(f"{function_name}_calls", 1, {
                    'function': function_name,
                    'status': 'started'
                })
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Record success
                execution_time = (time.time() - start_time) * 1000  # Convert to ms
                monitor.record_metric(f"{function_name}_duration", execution_time, {
                    'function': function_name,
                    'status': 'success'
                })
                
                monitor.record_metric(f"{function_name}_success", 1, {
                    'function': function_name
                })
                
                return result
                
            except Exception as e:
                # Record error
                execution_time = (time.time() - start_time) * 1000
                monitor.record_metric(f"{function_name}_duration", execution_time, {
                    'function': function_name,
                    'status': 'error'
                })
                
                monitor.record_metric(f"{function_name}_errors", 1, {
                    'function': function_name,
                    'error_type': type(e).__name__
                })
                
                monitor.record_error(
                    error_message=str(e),
                    function_name=function_name,
                    stack_trace=str(e.__traceback__) if hasattr(e, '__traceback__') else None,
                    metadata={
                        'args': str(args)[:500],  # Limit size
                        'kwargs': str(kwargs)[:500]
                    }
                )
                
                raise  # Re-raise the exception
                
        return wrapper
    return decorator

def track_api_usage(endpoint: str, user_id: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
    """Track API endpoint usage"""
    monitor.record_metric("api_usage", 1, {
        'endpoint': endpoint,
        'user_id': user_id or 'anonymous'
    })
    
    if metadata:
        # Store detailed usage data
        usage_data = {
            'endpoint': endpoint,
            'user_id': user_id,
            'metadata': metadata,
            'timestamp': firestore.SERVER_TIMESTAMP
        }
        monitor.db.collection('api_usage').add(usage_data)

def track_model_usage(model_name: str, tokens_used: int, cost: float, user_id: Optional[str] = None):
    """Track AI model usage and costs"""
    monitor.record_metric("model_tokens", tokens_used, {
        'model': model_name,
        'user_id': user_id or 'anonymous'
    })
    
    monitor.record_metric("model_cost", cost, {
        'model': model_name,
        'user_id': user_id or 'anonymous'
    })
    
    # Store detailed usage data
    usage_data = {
        'model_name': model_name,
        'tokens_used': tokens_used,
        'cost': cost,
        'user_id': user_id,
        'timestamp': firestore.SERVER_TIMESTAMP
    }
    monitor.db.collection('model_usage').add(usage_data)

def check_system_health():
    """Check overall system health"""
    try:
        # Check Firestore connectivity
        monitor.db.collection('health_check').add({
            'status': 'healthy',
            'timestamp': firestore.SERVER_TIMESTAMP,
            'component': 'firestore'
        })
        
        # Record health check
        monitor.record_metric("health_check", 1, {
            'status': 'healthy'
        })
        
        return {
            'status': 'healthy',
            'timestamp': time.time(),
            'components': {
                'firestore': 'healthy',
                'monitoring': 'healthy'
            }
        }
        
    except Exception as e:
        monitor.record_error(
            error_message=f"Health check failed: {str(e)}",
            function_name="health_check"
        )
        
        return {
            'status': 'unhealthy',
            'timestamp': time.time(),
            'error': str(e)
        }

def get_monitoring_summary(hours: int = 24):
    """Get monitoring summary for the last N hours"""
    try:
        # Calculate time range
        end_time = time.time()
        start_time = end_time - (hours * 3600)
        
        # Query metrics
        metrics_query = monitor.db.collection(monitor.metrics_collection)\
            .where('timestamp', '>=', start_time)\
            .order_by('timestamp', direction=firestore.Query.DESCENDING)\
            .limit(1000)
        
        # Query errors
        errors_query = monitor.db.collection(monitor.errors_collection)\
            .where('timestamp', '>=', start_time)\
            .order_by('timestamp', direction=firestore.Query.DESCENDING)\
            .limit(100)
        
        metrics = [doc.to_dict() for doc in metrics_query.stream()]
        errors = [doc.to_dict() for doc in errors_query.stream()]
        
        # Calculate summary statistics
        total_calls = sum(1 for m in metrics if m.get('name', '').endswith('_calls'))
        total_errors = len(errors)
        avg_duration = sum(m.get('value', 0) for m in metrics if m.get('name', '').endswith('_duration')) / max(len([m for m in metrics if m.get('name', '').endswith('_duration')]), 1)
        
        return {
            'period_hours': hours,
            'total_calls': total_calls,
            'total_errors': total_errors,
            'error_rate': total_errors / max(total_calls, 1),
            'avg_duration_ms': avg_duration,
            'recent_errors': errors[:5],  # Last 5 errors
            'timestamp': time.time()
        }
        
    except Exception as e:
        logger.error(f"Failed to get monitoring summary: {e}")
        return {
            'error': str(e),
            'timestamp': time.time()
        }

# Export monitoring functions
__all__ = [
    'monitor',
    'monitor_function',
    'track_api_usage',
    'track_model_usage',
    'check_system_health',
    'get_monitoring_summary'
]
