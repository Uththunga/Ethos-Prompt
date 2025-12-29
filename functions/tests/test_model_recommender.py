import asyncio
from typing import List

import pytest

from functions.src.analytics.model_recommendation import (
    ModelRecommendationEngine,
    UserPreferences,
    TaskType,
)
from functions.src.analytics.model_performance_tracker import ModelPerformanceStats


class DummyTracker:
    async def get_all_models_stats(self, time_period: str = "7d") -> List[ModelPerformanceStats]:
        # Three synthetic models with different characteristics
        return [
            ModelPerformanceStats(
                model_id="z-ai/glm-4.5-air:free",
                model_name="z-ai/glm-4.5-air:free",
                time_period=time_period,
                total_executions=100,
                successful_executions=97,
                failed_executions=3,
                success_rate=0.97,
                avg_latency_ms=900,
                median_latency_ms=850,
                p95_latency_ms=1400,
                p99_latency_ms=1800,
                total_cost_usd=0.0,
                avg_cost_per_execution=0.0,
                cost_per_1k_tokens=0.0,
                total_tokens=100000,
                avg_tokens_per_execution=1000.0,
                avg_input_tokens=600.0,
                avg_output_tokens=400.0,
                avg_user_rating=4.6,
                total_ratings=50,
                rating_distribution={1:0,2:2,3:5,4:20,5:23},
                tokens_per_second=120.0,
                cost_efficiency_score=0.0,
                quality_score=92.0,
                calculated_at=__import__('datetime').datetime.utcnow(),
                data_from=__import__('datetime').datetime.utcnow(),
                data_to=__import__('datetime').datetime.utcnow(),
            ),
            ModelPerformanceStats(
                model_id="openai/gpt-3.5-turbo",
                model_name="openai/gpt-3.5-turbo",
                time_period=time_period,
                total_executions=120,
                successful_executions=112,
                failed_executions=8,
                success_rate=0.9333,
                avg_latency_ms=800,
                median_latency_ms=780,
                p95_latency_ms=1300,
                p99_latency_ms=1700,
                total_cost_usd=2.0,
                avg_cost_per_execution=0.016,
                cost_per_1k_tokens=0.001,
                total_tokens=125000,
                avg_tokens_per_execution=1041.6,
                avg_input_tokens=600.0,
                avg_output_tokens=441.6,
                avg_user_rating=4.5,
                total_ratings=40,
                rating_distribution={1:1,2:2,3:6,4:18,5:13},
                tokens_per_second=150.0,
                cost_efficiency_score=0.001,
                quality_score=90.0,
                calculated_at=__import__('datetime').datetime.utcnow(),
                data_from=__import__('datetime').datetime.utcnow(),
                data_to=__import__('datetime').datetime.utcnow(),
            ),
            ModelPerformanceStats(
                model_id="anthropic/claude-3-haiku-20240307",
                model_name="anthropic/claude-3-haiku-20240307",
                time_period=time_period,
                total_executions=80,
                successful_executions=72,
                failed_executions=8,
                success_rate=0.9,
                avg_latency_ms=700,
                median_latency_ms=690,
                p95_latency_ms=1200,
                p99_latency_ms=1500,
                total_cost_usd=1.5,
                avg_cost_per_execution=0.01875,
                cost_per_1k_tokens=0.0015,
                total_tokens=80000,
                avg_tokens_per_execution=1000.0,
                avg_input_tokens=580.0,
                avg_output_tokens=420.0,
                avg_user_rating=4.4,
                total_ratings=30,
                rating_distribution={1:0,2:1,3:7,4:12,5:10},
                tokens_per_second=160.0,
                cost_efficiency_score=0.0015,
                quality_score=88.0,
                calculated_at=__import__('datetime').datetime.utcnow(),
                data_from=__import__('datetime').datetime.utcnow(),
                data_to=__import__('datetime').datetime.utcnow(),
            ),
        ]


@pytest.mark.asyncio
async def test_recommendations_rank_by_score_and_boost_preferences():
    engine = ModelRecommendationEngine(performance_tracker=DummyTracker())

    # No preferences: expect free + high quality first
    recs = await engine.recommend_models(task_type=TaskType.GENERAL, top_k=3)
    ids = [r.model_id for r in recs]
    assert ids[0] == "z-ai/glm-4.5-air:free"

    # Preferences boost: push GPT-3.5 to top
    prefs = UserPreferences(preferred_models=["openai/gpt-3.5-turbo"])
    recs2 = await engine.recommend_models(task_type=TaskType.GENERAL, user_preferences=prefs, top_k=3)
    ids2 = [r.model_id for r in recs2]
    assert ids2[0] == "openai/gpt-3.5-turbo"


