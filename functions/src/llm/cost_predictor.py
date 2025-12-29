"""
Cost Predictor
--------------
Lightweight cost estimation utilities that do NOT call providers.
Uses simple token estimation heuristics and existing CostTracker pricing.

- Estimation is approximate and intended for pre-execution UX and budgeting
- Returns 0 for free models (e.g., ids ending with ":free")
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional

from .cost_tracker import cost_tracker


# Rough heuristic commonly used for GPT-family tokenization: ~4 chars per token
DEFAULT_CHARS_PER_TOKEN = 4


@dataclass
class CostEstimate:
    provider: str
    model: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    estimated_cost_usd: Decimal


def estimate_tokens_from_text(text: Optional[str], chars_per_token: int = DEFAULT_CHARS_PER_TOKEN) -> int:
    """Approximate token count from raw text length.

    Args:
        text: The text to estimate tokens for
        chars_per_token: Average characters per token (default 4)

    Returns:
        Estimated integer token count (>= 0)
    """
    if not text:
        return 0
    # Defensive: avoid division by zero and clamp minimum
    cpt = max(1, int(chars_per_token))
    return max(0, int(round(len(text) / cpt)))


def estimate_cost(
    provider: str,
    model: str,
    input_text: Optional[str],
    output_text: Optional[str] = None,
    *,
    chars_per_token: int = DEFAULT_CHARS_PER_TOKEN,
) -> CostEstimate:
    """Estimate cost using token heuristics and CostTracker pricing.

    Notes:
    - Returns 0 for free models (handled by CostTracker)
    - Uses CostTracker.calculate_cost with estimated token counts
    - Safe to call without network or provider access
    """
    input_tokens = estimate_tokens_from_text(input_text, chars_per_token)
    output_tokens = estimate_tokens_from_text(output_text, chars_per_token)
    total_tokens = input_tokens + output_tokens

    estimated_cost = cost_tracker.calculate_cost(
        provider=provider,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
    )

    return CostEstimate(
        provider=provider,
        model=model,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        estimated_cost_usd=estimated_cost,
    )

