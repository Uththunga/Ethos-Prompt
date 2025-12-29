from datetime import datetime, timedelta

from src.analytics.realtime_stream import (
    ExecutionEvent,
    RatingSubmission,
    compute_realtime_metrics,
)


def test_compute_realtime_metrics_basic():
    now = datetime.utcnow()
    execs = [
        ExecutionEvent(
            id="e1",
            user_id="u1",
            prompt_id="p1",
            model="z-ai/glm-4.5-air:free",
            status="completed",
            timestamp=now - timedelta(seconds=20),
            cost=0.0,
            duration=2.5,
        ),
        ExecutionEvent(
            id="e2",
            user_id="u1",
            prompt_id="p2",
            model="z-ai/glm-4.5-air:free",
            status="failed",
            timestamp=now - timedelta(minutes=2),
            cost=0.0,
            duration=1.0,
        ),
        ExecutionEvent(
            id="e3",
            user_id="u1",
            prompt_id="p3",
            model="openai/gpt-3.5:free",
            status="pending",
            timestamp=now - timedelta(seconds=10),
            cost=0.0,
        ),
    ]

    ratings = [
        RatingSubmission(
            id="r1",
            execution_id="e1",
            rating=5,
            timestamp=now - timedelta(seconds=15),
            user_id="u1",
        )
    ]

    m = compute_realtime_metrics(execs, ratings, window_minutes=5, now=now)

    assert m.executions_per_minute >= 1
    assert m.active_executions == 1
    assert m.total_cost == 0.0
    assert m.average_response_time > 0
    assert 0.0 <= m.success_rate <= 1.0
    assert m.error_rate == 1.0 - m.success_rate
    assert len(m.top_models) > 0
    assert len(m.recent_ratings) == 1

