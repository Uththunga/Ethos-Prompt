"""
Search Analytics - Quality metrics and performance monitoring for search
"""
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import statistics
from google.cloud import firestore  # type: ignore

logger = logging.getLogger(__name__)

@dataclass
class SearchMetrics:
    query: str
    user_id: str
    search_type: str  # semantic, hybrid, keyword
    results_count: int
    search_time: float
    relevance_scores: List[float]
    user_interactions: List[Dict[str, Any]]  # clicks, ratings, etc.
    timestamp: datetime
    metadata: Dict[str, Any]

@dataclass
class QualityMetrics:
    precision_at_k: Dict[int, float]  # P@1, P@5, P@10
    recall_at_k: Dict[int, float]     # R@1, R@5, R@10
    mrr: float                        # Mean Reciprocal Rank
    ndcg_at_k: Dict[int, float]       # NDCG@1, NDCG@5, NDCG@10
    avg_relevance_score: float
    user_satisfaction: float

@dataclass
class PerformanceMetrics:
    avg_search_time: float
    p95_search_time: float
    p99_search_time: float
    cache_hit_ratio: float
    error_rate: float
    throughput_qps: float

class SearchAnalytics:
    """
    Search analytics and quality metrics system
    """

    def __init__(self, firestore_client=None):
        self.db = firestore_client
        self.metrics_buffer = []
        self.buffer_size = 100

        # Quality thresholds
        self.quality_thresholds = {
            'min_precision_at_5': 0.6,
            'min_mrr': 0.7,
            'min_user_satisfaction': 3.5,
            'max_search_time': 2.0,
            'min_cache_hit_ratio': 0.4
        }

    def record_search_metrics(
        self,
        query: str,
        user_id: str,
        search_type: str,
        results: List[Any],
        search_time: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Record search metrics for analysis
        """
        # Extract relevance scores
        relevance_scores = []
        if hasattr(results[0], 'score') if results else False:
            relevance_scores = [result.score for result in results]

        metrics = SearchMetrics(
            query=query,
            user_id=user_id,
            search_type=search_type,
            results_count=len(results),
            search_time=search_time,
            relevance_scores=relevance_scores,
            user_interactions=[],
            timestamp=datetime.now(timezone.utc),
            metadata=metadata or {}
        )

        # Add to buffer
        self.metrics_buffer.append(metrics)

        # Flush buffer if full
        if len(self.metrics_buffer) >= self.buffer_size:
            self._flush_metrics_buffer()

        # Save individual metric to Firestore
        if self.db:
            self._save_search_metric(metrics)

        return f"search_metric_{int(time.time())}"

    def record_user_interaction(
        self,
        search_metric_id: str,
        interaction_type: str,
        result_rank: int,
        relevance_rating: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Record user interaction with search results
        """
        interaction = {
            'type': interaction_type,  # click, rating, bookmark, etc.
            'result_rank': result_rank,
            'relevance_rating': relevance_rating,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'metadata': metadata or {}
        }

        if self.db:
            try:
                # Update the search metric with interaction
                doc_ref = self.db.collection('search_metrics').document(search_metric_id)
                doc_ref.update({
                    'user_interactions': firestore.ArrayUnion([interaction])
                })
            except Exception as e:
                logger.error(f"Failed to record user interaction: {e}")

    def calculate_quality_metrics(
        self,
        search_results: List[Any],
        user_interactions: List[Dict[str, Any]],
        k_values: List[int] = [1, 5, 10]
    ) -> QualityMetrics:
        """
        Calculate search quality metrics
        """
        if not search_results:
            return QualityMetrics(
                precision_at_k={k: 0.0 for k in k_values},
                recall_at_k={k: 0.0 for k in k_values},
                mrr=0.0,
                ndcg_at_k={k: 0.0 for k in k_values},
                avg_relevance_score=0.0,
                user_satisfaction=0.0
            )

        # Extract relevance judgments from user interactions
        relevance_judgments = self._extract_relevance_judgments(user_interactions)

        # Calculate metrics
        precision_at_k = {}
        recall_at_k = {}
        ndcg_at_k = {}

        for k in k_values:
            precision_at_k[k] = self._calculate_precision_at_k(search_results, relevance_judgments, k)
            recall_at_k[k] = self._calculate_recall_at_k(search_results, relevance_judgments, k)
            ndcg_at_k[k] = self._calculate_ndcg_at_k(search_results, relevance_judgments, k)

        mrr = self._calculate_mrr(search_results, relevance_judgments)

        # Average relevance score
        relevance_scores = [getattr(result, 'score', 0.0) for result in search_results]
        avg_relevance_score = statistics.mean(relevance_scores) if relevance_scores else 0.0

        # User satisfaction from ratings
        user_satisfaction = self._calculate_user_satisfaction(user_interactions)

        return QualityMetrics(
            precision_at_k=precision_at_k,
            recall_at_k=recall_at_k,
            mrr=mrr,
            ndcg_at_k=ndcg_at_k,
            avg_relevance_score=avg_relevance_score,
            user_satisfaction=user_satisfaction
        )

    def _extract_relevance_judgments(self, user_interactions: List[Dict[str, Any]]) -> Dict[int, float]:
        """
        Extract relevance judgments from user interactions
        """
        judgments = {}

        for interaction in user_interactions:
            rank = interaction.get('result_rank')
            if rank is None:
                continue

            # Explicit ratings
            if interaction.get('relevance_rating') is not None:
                judgments[rank] = float(interaction['relevance_rating'])

            # Implicit feedback
            elif interaction.get('type') == 'click':
                judgments[rank] = judgments.get(rank, 0.0) + 0.5
            elif interaction.get('type') == 'bookmark':
                judgments[rank] = judgments.get(rank, 0.0) + 0.8
            elif interaction.get('type') == 'share':
                judgments[rank] = judgments.get(rank, 0.0) + 0.7

        # Normalize implicit feedback to 0-1 scale
        for rank in judgments:
            judgments[rank] = min(1.0, judgments[rank])

        return judgments

    def get_analytics_dashboard_data(self) -> Dict[str, Any]:
        """Get enhanced data for analytics dashboard"""
        recent_queries = self._get_recent_queries(hours=24)

        if not recent_queries:
            return {
                'total_queries': 0,
                'avg_response_time': 0,
                'avg_relevance_score': 0,
                'top_queries': [],
                'performance_trend': [],
                'quality_metrics': {},
                'search_patterns': {},
                'user_satisfaction': 0,
                'cache_hit_rate': 0
            }

        # Calculate metrics
        total_queries = len(recent_queries)
        avg_response_time = sum(q.get('response_time', 0) for q in recent_queries) / total_queries

        # Get relevance scores
        relevance_scores = [
            score for q in recent_queries
            for score in q.get('relevance_scores', [])
        ]
        avg_relevance_score = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0

        # Top queries
        query_counts: Dict[str, int] = {}
        for query in recent_queries:
            text = query.get('query_text', '')
            query_counts[text] = query_counts.get(text, 0) + 1

        top_queries = sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:10]

        # Calculate user satisfaction
        satisfaction_scores = [q.get('user_satisfaction', 0) for q in recent_queries if q.get('user_satisfaction')]
        user_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else 0

        # Calculate cache hit rate
        cache_hits = sum(1 for q in recent_queries if q.get('cache_hit', False))
        cache_hit_rate = cache_hits / total_queries if total_queries > 0 else 0

        return {
            'total_queries': total_queries,
            'avg_response_time': avg_response_time,
            'avg_relevance_score': avg_relevance_score,
            'top_queries': [{'query': q, 'count': c} for q, c in top_queries],
            'performance_trend': self._get_performance_trend(),
            'quality_metrics': self._get_quality_metrics(),
            'search_patterns': self._analyze_search_patterns(recent_queries),
            'user_satisfaction': user_satisfaction,
            'cache_hit_rate': cache_hit_rate
        }

    def _analyze_search_patterns(self, queries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze search patterns and trends"""
        patterns: Dict[str, Any] = {
            'query_length_distribution': {},
            'search_types': {},
            'time_distribution': {},
            'failed_queries': []
        }

        for query in queries:
            # Query length distribution
            query_text = query.get('query_text', '')
            length_bucket = self._get_length_bucket(len(query_text.split()))
            patterns['query_length_distribution'][length_bucket] = \
                patterns['query_length_distribution'].get(length_bucket, 0) + 1

            # Search types
            search_type = query.get('search_type', 'unknown')
            patterns['search_types'][search_type] = \
                patterns['search_types'].get(search_type, 0) + 1

            # Time distribution (hour of day)
            timestamp = query.get('timestamp')
            if timestamp:
                try:
                    hour = datetime.fromisoformat(timestamp).hour
                    patterns['time_distribution'][hour] = \
                        patterns['time_distribution'].get(hour, 0) + 1
                except:
                    pass

            # Failed queries (no results or low relevance)
            relevance_scores = query.get('relevance_scores', [])
            if not relevance_scores or max(relevance_scores) < 0.3:
                patterns['failed_queries'].append({
                    'query': query_text,
                    'timestamp': timestamp,
                    'max_relevance': max(relevance_scores) if relevance_scores else 0
                })

        return patterns

    def _get_length_bucket(self, word_count: int) -> str:
        """Get query length bucket"""
        if word_count <= 2:
            return "short (1-2 words)"
        elif word_count <= 5:
            return "medium (3-5 words)"
        elif word_count <= 10:
            return "long (6-10 words)"
        else:
            return "very long (10+ words)"

    def _calculate_precision_at_k(self, results: List[Any], judgments: Dict[int, float], k: int) -> float:
        """
        Calculate Precision@K
        """
        if not results or k <= 0:
            return 0.0

        relevant_count = 0
        for i in range(min(k, len(results))):
            rank = i + 1
            if judgments.get(rank, 0.0) >= 0.5:  # Threshold for relevance
                relevant_count += 1

        return relevant_count / min(k, len(results))

    def _calculate_recall_at_k(self, results: List[Any], judgments: Dict[int, float], k: int) -> float:
        """
        Calculate Recall@K
        """
        if not results or k <= 0:
            return 0.0

        total_relevant = sum(1 for score in judgments.values() if score >= 0.5)
        if total_relevant == 0:
            return 0.0

        relevant_at_k = 0
        for i in range(min(k, len(results))):
            rank = i + 1
            if judgments.get(rank, 0.0) >= 0.5:
                relevant_at_k += 1

        return relevant_at_k / total_relevant

    def _calculate_mrr(self, results: List[Any], judgments: Dict[int, float]) -> float:
        """
        Calculate Mean Reciprocal Rank
        """
        if not results:
            return 0.0

        for i in range(len(results)):
            rank = i + 1
            if judgments.get(rank, 0.0) >= 0.5:
                return 1.0 / rank

        return 0.0

    def _calculate_ndcg_at_k(self, results: List[Any], judgments: Dict[int, float], k: int) -> float:
        """
        Calculate Normalized Discounted Cumulative Gain@K
        """
        if not results or k <= 0:
            return 0.0

        # Calculate DCG@K
        dcg = 0.0
        for i in range(min(k, len(results))):
            rank = i + 1
            relevance = judgments.get(rank, 0.0)
            dcg += relevance / (1.0 + i)  # Simplified DCG formula

        # Calculate IDCG@K (ideal DCG)
        sorted_relevances = sorted(judgments.values(), reverse=True)
        idcg = 0.0
        for i in range(min(k, len(sorted_relevances))):
            idcg += sorted_relevances[i] / (1.0 + i)

        return dcg / idcg if idcg > 0 else 0.0

    def _calculate_user_satisfaction(self, user_interactions: List[Dict[str, Any]]) -> float:
        """
        Calculate user satisfaction score
        """
        ratings = []

        for interaction in user_interactions:
            if interaction.get('relevance_rating') is not None:
                ratings.append(float(interaction['relevance_rating']))

        if ratings:
            return statistics.mean(ratings)

        # Fallback: estimate satisfaction from interaction types
        satisfaction_scores = []
        for interaction in user_interactions:
            interaction_type = interaction.get('type')
            if interaction_type == 'click':
                satisfaction_scores.append(3.0)
            elif interaction_type == 'bookmark':
                satisfaction_scores.append(4.5)
            elif interaction_type == 'share':
                satisfaction_scores.append(4.0)

        return statistics.mean(satisfaction_scores) if satisfaction_scores else 2.5

    def get_performance_metrics(self, days: int = 7) -> PerformanceMetrics:
        """
        Get performance metrics for the specified period
        """
        if not self.db:
            return PerformanceMetrics(
                avg_search_time=0.5,
                p95_search_time=1.2,
                p99_search_time=2.0,
                cache_hit_ratio=0.6,
                error_rate=0.02,
                throughput_qps=10.0
            )

        try:
            # Query search metrics from the last N days
            start_date = datetime.now(timezone.utc) - timedelta(days=days)

            query = self.db.collection('search_metrics')\
                          .where('timestamp', '>=', start_date)\
                          .order_by('timestamp')

            metrics = []
            for doc in query.stream():
                metrics.append(doc.to_dict())

            if not metrics:
                return PerformanceMetrics(
                    avg_search_time=0.0,
                    p95_search_time=0.0,
                    p99_search_time=0.0,
                    cache_hit_ratio=0.0,
                    error_rate=0.0,
                    throughput_qps=0.0
                )

            # Calculate performance metrics
            search_times = [m['search_time'] for m in metrics if 'search_time' in m]

            avg_search_time = statistics.mean(search_times) if search_times else 0.0
            p95_search_time = statistics.quantiles(search_times, n=20)[18] if len(search_times) > 20 else 0.0
            p99_search_time = statistics.quantiles(search_times, n=100)[98] if len(search_times) > 100 else 0.0

            # Calculate throughput (queries per second)
            if metrics:
                time_span = (datetime.now(timezone.utc) - start_date).total_seconds()
                throughput_qps = len(metrics) / time_span if time_span > 0 else 0.0
            else:
                throughput_qps = 0.0

            return PerformanceMetrics(
                avg_search_time=avg_search_time,
                p95_search_time=p95_search_time,
                p99_search_time=p99_search_time,
                cache_hit_ratio=0.6,  # Would need cache metrics
                error_rate=0.02,      # Would need error tracking
                throughput_qps=throughput_qps
            )

        except Exception as e:
            logger.error(f"Failed to get performance metrics: {e}")
            return PerformanceMetrics(
                avg_search_time=0.0,
                p95_search_time=0.0,
                p99_search_time=0.0,
                cache_hit_ratio=0.0,
                error_rate=0.0,
                throughput_qps=0.0
            )

    def get_search_analytics_dashboard(self, days: int = 7) -> Dict[str, Any]:
        """
        Get comprehensive search analytics for dashboard
        """
        performance_metrics = self.get_performance_metrics(days)

        # Mock quality metrics - in production, calculate from actual data
        quality_metrics = QualityMetrics(
            precision_at_k={1: 0.85, 5: 0.72, 10: 0.68},
            recall_at_k={1: 0.15, 5: 0.45, 10: 0.62},
            mrr=0.78,
            ndcg_at_k={1: 0.85, 5: 0.76, 10: 0.71},
            avg_relevance_score=0.74,
            user_satisfaction=4.1
        )

        return {
            'period_days': days,
            'performance': asdict(performance_metrics),
            'quality': asdict(quality_metrics),
            'health_status': self._calculate_health_status(performance_metrics, quality_metrics),
            'top_queries': self._get_top_queries(days),
            'search_trends': self._get_search_trends(days),
            'generated_at': datetime.now(timezone.utc).isoformat()
        }

    def _calculate_health_status(self, perf: PerformanceMetrics, qual: QualityMetrics) -> Dict[str, Any]:
        """
        Calculate overall search system health status
        """
        health_checks = {
            'search_speed': perf.avg_search_time <= self.quality_thresholds['max_search_time'],
            'precision_quality': qual.precision_at_k.get(5, 0) >= self.quality_thresholds['min_precision_at_5'],
            'ranking_quality': qual.mrr >= self.quality_thresholds['min_mrr'],
            'user_satisfaction': qual.user_satisfaction >= self.quality_thresholds['min_user_satisfaction']
        }

        healthy_checks = sum(health_checks.values())
        total_checks = len(health_checks)

        health_score = healthy_checks / total_checks

        if health_score >= 0.8:
            status = 'healthy'
        elif health_score >= 0.6:
            status = 'warning'
        else:
            status = 'critical'

        return {
            'status': status,
            'score': health_score,
            'checks': health_checks,
            'recommendations': self._get_health_recommendations(health_checks)
        }

    def _get_health_recommendations(self, health_checks: Dict[str, bool]) -> List[str]:
        """
        Get recommendations based on health check results
        """
        recommendations = []

        if not health_checks.get('search_speed', True):
            recommendations.append("Optimize search performance - consider caching and indexing improvements")

        if not health_checks.get('precision_quality', True):
            recommendations.append("Improve search precision - review ranking algorithms and relevance scoring")

        if not health_checks.get('ranking_quality', True):
            recommendations.append("Enhance ranking quality - consider re-ranking models and user feedback")

        if not health_checks.get('user_satisfaction', True):
            recommendations.append("Focus on user experience - analyze user feedback and search patterns")

        return recommendations

    def _get_top_queries(self, days: int) -> List[Dict[str, Any]]:
        """
        Get top search queries
        """
        # Mock data - in production, query from database
        return [
            {'query': 'machine learning tutorial', 'count': 45, 'avg_satisfaction': 4.2},
            {'query': 'python best practices', 'count': 38, 'avg_satisfaction': 4.0},
            {'query': 'API documentation', 'count': 32, 'avg_satisfaction': 3.8},
            {'query': 'database setup', 'count': 28, 'avg_satisfaction': 4.1},
            {'query': 'authentication guide', 'count': 24, 'avg_satisfaction': 3.9}
        ]

    def _get_search_trends(self, days: int) -> Dict[str, List[float]]:
        """
        Get search trends over time
        """
        # Mock data - in production, calculate from actual metrics
        return {
            'daily_searches': [120, 135, 142, 128, 156, 148, 162],
            'avg_response_time': [0.45, 0.52, 0.48, 0.51, 0.47, 0.49, 0.46],
            'user_satisfaction': [4.1, 4.0, 4.2, 3.9, 4.1, 4.0, 4.2]
        }

    def _save_search_metric(self, metrics: SearchMetrics):
        """
        Save search metrics to Firestore
        """
        if not self.db:
            return

        try:
            metrics_data = asdict(metrics)
            metrics_data['timestamp'] = metrics.timestamp.isoformat()

            self.db.collection('search_metrics').add(metrics_data)
        except Exception as e:
            logger.error(f"Failed to save search metrics: {e}")

    def _flush_metrics_buffer(self):
        """
        Flush metrics buffer to database
        """
        if not self.db or not self.metrics_buffer:
            return

        try:
            batch = self.db.batch()

            for metrics in self.metrics_buffer:
                metrics_data = asdict(metrics)
                metrics_data['timestamp'] = metrics.timestamp.isoformat()

                doc_ref = self.db.collection('search_metrics').document()
                batch.set(doc_ref, metrics_data)

            batch.commit()
            logger.info(f"Flushed {len(self.metrics_buffer)} search metrics")

            self.metrics_buffer.clear()

        except Exception as e:
            logger.error(f"Failed to flush metrics buffer: {e}")

    def _get_recent_queries(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get recent search queries"""
        if not self.db:
            return []

        try:
            start_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            query = self.db.collection('search_metrics')\
                          .where('timestamp', '>=', start_time)\
                          .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                          .limit(100)

            return [doc.to_dict() for doc in query.stream()]
        except Exception as e:
            logger.error(f"Failed to get recent queries: {e}")
            return []

    def _get_performance_trend(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get performance trend over time"""
        # Mock implementation for dashboard
        return [
            {'date': (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d'),
             'avg_latency': 0.5, 'qps': 10}
            for i in range(days)
        ]

    def _get_quality_metrics(self) -> Dict[str, float]:
        """Get current quality metrics"""
        # Mock implementation
        return {
            'precision': 0.8,
            'recall': 0.6,
            'mrr': 0.75
        }

# Global instance
search_analytics = SearchAnalytics()
