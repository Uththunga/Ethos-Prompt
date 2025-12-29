"""
Model Recommendation Algorithm
Recommends best AI models based on historical performance, user preferences, and constraints
"""
import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import math

from .model_performance_tracker import (
    ModelPerformanceTracker,
    ModelPerformanceStats,
    PerformanceMetric
)

logger = logging.getLogger(__name__)

class TaskType(Enum):
    """Types of tasks for model selection"""
    CREATIVE_WRITING = "creative_writing"
    CODE_GENERATION = "code_generation"
    ANALYSIS = "analysis"
    SUMMARIZATION = "summarization"
    QUESTION_ANSWERING = "question_answering"
    TRANSLATION = "translation"
    CHAT = "chat"
    RAG = "rag"
    GENERAL = "general"

class OptimizationGoal(Enum):
    """Optimization goals for model selection"""
    QUALITY = "quality"  # Best quality regardless of cost
    COST = "cost"  # Lowest cost
    SPEED = "speed"  # Fastest response
    BALANCED = "balanced"  # Balance of all factors

@dataclass
class ModelRecommendation:
    """Recommendation for a specific model"""
    model_id: str
    model_name: str
    score: float  # 0-100
    confidence: float  # 0-1
    reasoning: List[str]
    
    # Performance predictions
    estimated_latency_ms: float
    estimated_cost_usd: float
    estimated_quality: float  # 0-100
    
    # Stats used for recommendation
    stats: Optional[ModelPerformanceStats]
    
    # Ranking
    rank: int

@dataclass
class UserPreferences:
    """User preferences for model selection"""
    preferred_models: Optional[List[str]] = None
    excluded_models: Optional[List[str]] = None
    max_cost_per_execution: Optional[float] = None
    max_latency_ms: Optional[float] = None
    min_quality_score: Optional[float] = None
    optimization_goal: OptimizationGoal = OptimizationGoal.BALANCED
    
    def __post_init__(self):
        if self.preferred_models is None:
            self.preferred_models = []
        if self.excluded_models is None:
            self.excluded_models = []

class ModelRecommendationEngine:
    """
    Engine for recommending AI models based on multiple factors
    """
    
    def __init__(self, performance_tracker: Optional[ModelPerformanceTracker] = None):
        self.performance_tracker = performance_tracker or ModelPerformanceTracker()
        
        # Task-specific model preferences (based on general knowledge)
        self.task_model_affinity = {
            TaskType.CREATIVE_WRITING: {
                "claude": 1.2,
                "gpt-4": 1.1,
                "gemini": 1.0,
            },
            TaskType.CODE_GENERATION: {
                "gpt-4": 1.2,
                "claude": 1.1,
                "codellama": 1.3,
            },
            TaskType.ANALYSIS: {
                "claude": 1.2,
                "gpt-4": 1.2,
                "gemini": 1.1,
            },
            TaskType.SUMMARIZATION: {
                "claude": 1.1,
                "gpt-4": 1.0,
                "gemini": 1.0,
            },
            TaskType.RAG: {
                "gpt-4": 1.1,
                "claude": 1.1,
                "gemini": 1.0,
            },
        }
        
        logger.info("Model recommendation engine initialized")
    
    # =========================================================================
    # RECOMMENDATION METHODS
    # =========================================================================
    
    async def recommend_models(
        self,
        task_type: TaskType = TaskType.GENERAL,
        user_preferences: Optional[UserPreferences] = None,
        context: Optional[Dict[str, Any]] = None,
        time_period: str = "7d",
        top_k: int = 5
    ) -> List[ModelRecommendation]:
        """
        Recommend top models for a given task
        
        Args:
            task_type: Type of task
            user_preferences: User preferences and constraints
            context: Additional context (prompt length, use_rag, etc.)
            time_period: Time period for performance stats
            top_k: Number of recommendations to return
        
        Returns:
            List of model recommendations sorted by score
        """
        if user_preferences is None:
            user_preferences = UserPreferences()
        
        if context is None:
            context = {}
        
        # Get performance stats for all models
        all_stats = await self.performance_tracker.get_all_models_stats(time_period)
        
        if not all_stats:
            logger.warning("No performance stats available for recommendations")
            return []
        
        # Filter out excluded models
        all_stats = [
            s for s in all_stats
            if s.model_id not in user_preferences.excluded_models
        ]
        
        # Calculate scores for each model
        recommendations = []
        for stats in all_stats:
            score, reasoning = self._calculate_model_score(
                stats=stats,
                task_type=task_type,
                user_preferences=user_preferences,
                context=context
            )
            
            # Apply constraints
            if not self._meets_constraints(stats, user_preferences):
                continue
            
            # Calculate confidence based on data availability
            confidence = self._calculate_confidence(stats)
            
            recommendation = ModelRecommendation(
                model_id=stats.model_id,
                model_name=stats.model_name,
                score=score,
                confidence=confidence,
                reasoning=reasoning,
                estimated_latency_ms=stats.avg_latency_ms,
                estimated_cost_usd=stats.avg_cost_per_execution,
                estimated_quality=stats.quality_score,
                stats=stats,
                rank=0  # Will be set after sorting
            )
            recommendations.append(recommendation)
        
        # Sort by score (descending)
        recommendations.sort(key=lambda x: x.score, reverse=True)
        
        # Boost preferred models
        if user_preferences.preferred_models:
            recommendations = self._boost_preferred_models(
                recommendations,
                user_preferences.preferred_models
            )
        
        # Assign ranks
        for i, rec in enumerate(recommendations):
            rec.rank = i + 1
        
        return recommendations[:top_k]
    
    def _calculate_model_score(
        self,
        stats: ModelPerformanceStats,
        task_type: TaskType,
        user_preferences: UserPreferences,
        context: Dict[str, Any]
    ) -> Tuple[float, List[str]]:
        """
        Calculate overall score for a model
        
        Returns:
            (score, reasoning)
        """
        reasoning = []
        
        # Base score from quality
        quality_score = stats.quality_score
        reasoning.append(f"Quality score: {quality_score:.1f}/100")
        
        # Task affinity bonus
        task_affinity = self._get_task_affinity(stats.model_id, task_type)
        reasoning.append(f"Task affinity: {task_affinity:.2f}x")
        
        # Optimization goal weights
        goal = user_preferences.optimization_goal
        if goal == OptimizationGoal.QUALITY:
            weights = {'quality': 0.7, 'cost': 0.1, 'speed': 0.2}
        elif goal == OptimizationGoal.COST:
            weights = {'quality': 0.2, 'cost': 0.6, 'speed': 0.2}
        elif goal == OptimizationGoal.SPEED:
            weights = {'quality': 0.2, 'cost': 0.2, 'speed': 0.6}
        else:  # BALANCED
            weights = {'quality': 0.4, 'cost': 0.3, 'speed': 0.3}
        
        # Normalize metrics to 0-100 scale
        quality_normalized = quality_score
        
        # Cost score (lower is better, invert for scoring)
        cost_score = self._normalize_cost_score(stats.cost_efficiency_score)
        reasoning.append(f"Cost efficiency: {cost_score:.1f}/100")
        
        # Speed score (lower latency is better, invert for scoring)
        speed_score = self._normalize_speed_score(stats.avg_latency_ms)
        reasoning.append(f"Speed: {speed_score:.1f}/100")
        
        # Calculate weighted score
        weighted_score = (
            quality_normalized * weights['quality'] +
            cost_score * weights['cost'] +
            speed_score * weights['speed']
        )
        
        # Apply task affinity multiplier
        final_score = weighted_score * task_affinity
        
        # Success rate penalty
        if stats.success_rate < 0.95:
            penalty = (0.95 - stats.success_rate) * 50
            final_score -= penalty
            reasoning.append(f"Success rate penalty: -{penalty:.1f}")
        
        # Cap at 100
        final_score = min(100, max(0, final_score))
        
        reasoning.append(f"Final score: {final_score:.1f}/100")
        
        return final_score, reasoning
    
    def _get_task_affinity(self, model_id: str, task_type: TaskType) -> float:
        """Get task affinity multiplier for a model"""
        if task_type not in self.task_model_affinity:
            return 1.0
        
        affinities = self.task_model_affinity[task_type]
        
        # Check if model ID contains any affinity keywords
        for keyword, multiplier in affinities.items():
            if keyword.lower() in model_id.lower():
                return multiplier
        
        return 1.0
    
    def _normalize_cost_score(self, cost_per_1k_tokens: float) -> float:
        """Normalize cost to 0-100 score (lower cost = higher score)"""
        # Assume typical range: $0.001 to $0.1 per 1k tokens
        # Use logarithmic scale
        if cost_per_1k_tokens <= 0:
            return 100
        
        # Map to 0-100 (inverted)
        min_cost = 0.0001  # $0.0001 per 1k tokens (very cheap)
        max_cost = 0.1     # $0.1 per 1k tokens (expensive)
        
        # Logarithmic normalization
        log_cost = math.log10(max(cost_per_1k_tokens, min_cost))
        log_min = math.log10(min_cost)
        log_max = math.log10(max_cost)
        
        normalized = 100 * (1 - (log_cost - log_min) / (log_max - log_min))
        return max(0, min(100, normalized))
    
    def _normalize_speed_score(self, latency_ms: float) -> float:
        """Normalize latency to 0-100 score (lower latency = higher score)"""
        # Assume typical range: 100ms to 10000ms
        min_latency = 100    # 100ms (very fast)
        max_latency = 10000  # 10s (slow)
        
        # Linear normalization (inverted)
        normalized = 100 * (1 - (latency_ms - min_latency) / (max_latency - min_latency))
        return max(0, min(100, normalized))
    
    def _meets_constraints(
        self,
        stats: ModelPerformanceStats,
        preferences: UserPreferences
    ) -> bool:
        """Check if model meets user constraints"""
        if preferences.max_cost_per_execution:
            if stats.avg_cost_per_execution > preferences.max_cost_per_execution:
                return False
        
        if preferences.max_latency_ms:
            if stats.avg_latency_ms > preferences.max_latency_ms:
                return False
        
        if preferences.min_quality_score:
            if stats.quality_score < preferences.min_quality_score:
                return False
        
        return True
    
    def _calculate_confidence(self, stats: ModelPerformanceStats) -> float:
        """Calculate confidence in recommendation based on data availability"""
        # More executions = higher confidence
        execution_confidence = min(1.0, stats.total_executions / 100)
        
        # More ratings = higher confidence
        rating_confidence = min(1.0, stats.total_ratings / 20) if stats.total_ratings > 0 else 0.5
        
        # High success rate = higher confidence
        success_confidence = stats.success_rate
        
        # Average confidence
        confidence = (execution_confidence + rating_confidence + success_confidence) / 3
        
        return confidence
    
    def _boost_preferred_models(
        self,
        recommendations: List[ModelRecommendation],
        preferred_models: List[str]
    ) -> List[ModelRecommendation]:
        """Boost scores of preferred models"""
        for rec in recommendations:
            if rec.model_id in preferred_models:
                rec.score *= 1.2  # 20% boost
                rec.reasoning.append("Preferred model bonus: +20%")
        
        # Re-sort after boosting
        recommendations.sort(key=lambda x: x.score, reverse=True)
        
        return recommendations
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    async def get_best_model_for_task(
        self,
        task_type: TaskType,
        user_preferences: Optional[UserPreferences] = None
    ) -> Optional[ModelRecommendation]:
        """Get single best model recommendation for a task"""
        recommendations = await self.recommend_models(
            task_type=task_type,
            user_preferences=user_preferences,
            top_k=1
        )
        
        return recommendations[0] if recommendations else None
    
    async def compare_models(
        self,
        model_ids: List[str],
        task_type: TaskType = TaskType.GENERAL,
        time_period: str = "7d"
    ) -> List[ModelRecommendation]:
        """Compare specific models"""
        all_stats = await self.performance_tracker.get_all_models_stats(time_period)
        
        # Filter to requested models
        filtered_stats = [s for s in all_stats if s.model_id in model_ids]
        
        recommendations = []
        for stats in filtered_stats:
            score, reasoning = self._calculate_model_score(
                stats=stats,
                task_type=task_type,
                user_preferences=UserPreferences(),
                context={}
            )
            
            confidence = self._calculate_confidence(stats)
            
            recommendation = ModelRecommendation(
                model_id=stats.model_id,
                model_name=stats.model_name,
                score=score,
                confidence=confidence,
                reasoning=reasoning,
                estimated_latency_ms=stats.avg_latency_ms,
                estimated_cost_usd=stats.avg_cost_per_execution,
                estimated_quality=stats.quality_score,
                stats=stats,
                rank=0
            )
            recommendations.append(recommendation)
        
        # Sort by score
        recommendations.sort(key=lambda x: x.score, reverse=True)
        
        # Assign ranks
        for i, rec in enumerate(recommendations):
            rec.rank = i + 1
        
        return recommendations

# Global instance
model_recommendation_engine = ModelRecommendationEngine()


