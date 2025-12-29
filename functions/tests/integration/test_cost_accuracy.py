"""
Task 1.3.4: Verify Cost Tracking Accuracy
- Calculate expected costs for known provider/model/token combinations
- Compare with CostTracker.calculate_cost results
- Assert variance < 1%
Note: This test avoids network calls and Firestore.
"""

from decimal import Decimal
from typing import Tuple

import pytest

from src.llm.cost_tracker import CostTracker


def variance(a: Decimal, b: Decimal) -> float:
    if a == 0 and b == 0:
        return 0.0
    denom = a if a != 0 else (b if b != 0 else Decimal("1"))
    return float(abs(a - b) / denom)


@pytest.mark.parametrize(
    "provider,model,input_tokens,output_tokens,expected",
    [
        # These expected values must be kept in sync with src/llm/cost_tracker.py pricing
        # OpenAI: gpt-3.5-turbo: input=0.0005, output=0.0015 per 1K tokens
        # (1000/1000 * 0.0005) + (500/1000 * 0.0015) = 0.0005 + 0.00075 = 0.001250
        ("openai", "gpt-3.5-turbo", 1000, 500, Decimal("0.001250")),

        # OpenAI: gpt-4: input=0.03, output=0.06 per 1K tokens
        # (1000/1000 * 0.03) + (1000/1000 * 0.06) = 0.03 + 0.06 = 0.090000
        ("openai", "gpt-4", 1000, 1000, Decimal("0.090000")),

        # Anthropic: claude-3-haiku-20240307: input=0.00025, output=0.00125 per 1K tokens
        # (2000/1000 * 0.00025) + (1000/1000 * 0.00125) = 0.0005 + 0.00125 = 0.001750
        ("anthropic", "claude-3-haiku-20240307", 2000, 1000, Decimal("0.001750")),

        # Google: gemini-1.0-pro: input=0.0005, output=0.0015 per 1K tokens
        # (1500/1000 * 0.0005) + (500/1000 * 0.0015) = 0.00075 + 0.00075 = 0.001500
        ("google", "gemini-1.0-pro", 1500, 500, Decimal("0.001500")),
    ],
)
def test_cost_calculation_accuracy(provider: str, model: str, input_tokens: int, output_tokens: int, expected: Decimal):
    tracker = CostTracker()
    actual = tracker.calculate_cost(provider, model, input_tokens, output_tokens)
    assert variance(actual, expected) < 0.01, f"Cost variance too high for {provider}/{model}: actual={actual} expected={expected}"


import os
import json
import asyncio
from pathlib import Path

from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig

FIXTURES = Path(__file__).parent.parent / "fixtures"
PROMPTS_FILE = FIXTURES / "test_prompts_100.json"

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_API_KEY_RAG")

@pytest.mark.asyncio
@pytest.mark.skipif(not OPENROUTER_API_KEY, reason="OPENROUTER_API_KEY not set; skipping real API tests")
async def test_cost_is_zero_for_free_models_on_50_prompts():
    """
    Execute 50 prompts against a validated free model and assert total cost is $0.00.
    We avoid paid models per project testing preferences.
    """
    # Load prompts
    with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    prompts = [p["prompt"] for p in data[:50]]

    model = "z-ai/glm-4.5-air:free"
    cfg = OpenRouterConfig(api_key=OPENROUTER_API_KEY, model=model, max_tokens=256, temperature=0.3)

    tracker = CostTracker()

    total_client_cost = 0.0
    total_tracker_cost = 0.0

    async with OpenRouterClient(cfg) as cli:
        for p in prompts:
            res = await cli.generate_response(prompt=p)
            total_client_cost += float(getattr(res, "cost_estimate", 0.0))
            usage = res.usage or {}
            input_tokens = int(usage.get("prompt_tokens", 0))
            output_tokens = int(usage.get("completion_tokens", 0))
            # Provider is the part before '/'
            provider = model.split('/')[0]
            total_tracker_cost += float(tracker.calculate_cost(provider, model.split('/')[-1], input_tokens, output_tokens))
            await asyncio.sleep(0.2)

    assert total_client_cost == 0.0, f"Client cost should be $0.00 for free models, got ${total_client_cost:.6f}"
    assert total_tracker_cost == 0.0, f"Tracker cost should be $0.00 for free models, got ${total_tracker_cost:.6f}"
