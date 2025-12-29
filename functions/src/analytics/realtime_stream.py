"""
Realtime analytics utilities

Provides pure functions to derive short-window (e.g., last 5 minutes) metrics
from execution and rating events. Intended for use in Cloud Functions or
batch jobs. Keeping logic here enables unit testing without emulator runtime.

All functions are side-effect free and typed for clarity.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Callable, Iterable, List, Dict, Any, TypeVar

T = TypeVar('T')


@dataclass(frozen=True)
class ExecutionEvent:
    id: str
    user_id: str
    prompt_id: str
    model: str
    status: str  # 'pending' | 'completed' | 'failed'
    timestamp: datetime
    cost: float
    duration: float | None = None
    rating: float | None = None


@dataclass(frozen=True)
class RatingSubmission:
    id: str
    execution_id: str
    rating: float
    timestamp: datetime
    user_id: str


@dataclass(frozen=True)
class RealtimeMetrics:
    timestamp: datetime
    executions_per_minute: int
    active_executions: int
    total_cost: float
    average_response_time: float
    success_rate: float
    error_rate: float
    top_models: List[dict]
    recent_ratings: List[dict]


def _now() -> datetime:
    return datetime.utcnow()


def window_filter(items: Iterable[T], *, get_ts: Callable[[T], datetime], since: datetime) -> List[T]:
    """Return items whose timestamp >= since.

    Args:
        items: iterable of items
        get_ts: function to extract datetime from item
        since: lower-bound timestamp (inclusive)
    """
    result: List[T] = []
    for it in items:
        try:
            ts = get_ts(it)
        except Exception:
            continue
        if ts >= since:
            result.append(it)
    return result


def compute_realtime_metrics(
    executions: Iterable[ExecutionEvent],
    ratings: Iterable[RatingSubmission],
    *,
    window_minutes: int = 5,
    now: datetime | None = None,
) -> RealtimeMetrics:
    """Compute short-window realtime metrics.

    Mirrors the frontend hook's aggregation so backend/services can share one
    definition of KPI semantics.
    """
    now = now or _now()
    window_start = now - timedelta(minutes=window_minutes)

    execs = window_filter(executions, get_ts=lambda e: e.timestamp, since=window_start)
    rates = window_filter(ratings, get_ts=lambda r: r.timestamp, since=window_start)

    # Executions per minute = count of events in the most recent rolling minute
    one_minute_ago = now - timedelta(minutes=1)
    epm = sum(1 for e in execs if e.timestamp >= one_minute_ago)

    active = sum(1 for e in execs if e.status == 'pending')
    total_cost = round(sum(e.cost for e in execs), 6)

    with_duration = [e for e in execs if e.duration is not None]
    avg_resp = (
        sum(e.duration or 0 for e in with_duration) / len(with_duration)
        if with_duration
        else 0.0
    )

    completed = [e for e in execs if e.status != 'pending']
    successes = [e for e in completed if e.status == 'completed']
    success_rate = (len(successes) / len(completed)) if completed else 0.0
    error_rate = 1.0 - success_rate

    # Top models by count
    model_counts: Dict[str, int] = {}
    for e in execs:
        model_counts[e.model] = model_counts.get(e.model, 0) + 1
    top_models = [
        {"model": model, "count": count}
        for model, count in sorted(model_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    ]

    recent_ratings = [
        {"rating": r.rating, "timestamp": r.timestamp.isoformat()} for r in rates if r.rating > 0
    ][:10]

    return RealtimeMetrics(
        timestamp=now,
        executions_per_minute=epm,
        active_executions=active,
        total_cost=total_cost,
        average_response_time=avg_resp,
        success_rate=success_rate,
        error_rate=error_rate,
        top_models=top_models,
        recent_ratings=recent_ratings,
    )


__all__ = [
    "ExecutionEvent",
    "RatingSubmission",
    "RealtimeMetrics",
    "compute_realtime_metrics",
]
