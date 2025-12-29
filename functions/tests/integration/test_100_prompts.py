"""
Task 1.3.2: Implement Comprehensive Test Suite (100+ prompts)
- Loads prompts from fixtures/test_prompts_100.json
- Uses OpenRouter free models only (via llm.free_models_config)
- Rate limits to 1 req/sec
- Retries each prompt up to 3 times on transient errors
- Calculates success rate and average latency
- Skips module if OPENROUTER_API_KEY not set
"""

import os
import json
import time
import asyncio
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

import pytest

# Include functions/src on sys.path for imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "src"))

from llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from llm.free_models_config import FREE_MODELS_PRIMARY

FIXTURES = Path(__file__).parent.parent / "fixtures"
PROMPTS_FILE = FIXTURES / "test_prompts_100.json"

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENROUTER_API_KEY_RAG")
if not OPENROUTER_API_KEY:
    pytest.skip("OPENROUTER_API_KEY not set; skipping real API tests", allow_module_level=True)

# Filter to only stable models (exclude deprecated/experimental)
STABLE_FREE_MODELS = [m.model_id for m in FREE_MODELS_PRIMARY if m.is_stable and not m.is_experimental]


@dataclass
class PromptCase:
    id: str
    category: str
    prompt: str


def _load_prompts() -> List[PromptCase]:
    if not PROMPTS_FILE.exists():
        pytest.skip(f"Prompts file not found: {PROMPTS_FILE}")
    with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    cases: List[PromptCase] = []
    for item in data:
        cases.append(PromptCase(id=item["id"], category=item.get("category", "uncategorized"), prompt=item["prompt"]))
    assert len(cases) >= 100, "Expected at least 100 prompts"
    return cases


def _is_transient(err: Exception) -> bool:
    msg = str(err).lower()
    return any(s in msg for s in ["timeout", "rate limit", "temporarily", "retry", "429", "503", "502"])


async def _run_with_retries_async(config: OpenRouterConfig, prompt: str, retries: int = 3) -> Tuple[bool, float, str, float]:
    """Run a single prompt with retries using async client"""
    attempt = 0
    while attempt <= retries:
        attempt += 1
        start = time.time()
        try:
            async with OpenRouterClient(config) as cli:
                res = await cli.generate_response(prompt=prompt)
                latency = time.time() - start
                ok = bool(res and res.content and len(res.content.strip()) > 0)
                if ok:
                    return True, latency, "", float(getattr(res, "cost_estimate", 0.0))
                # If empty content, treat as failure but retry
                if attempt <= retries:
                    await asyncio.sleep(1.0)
                    continue
                return False, latency, "empty_response", 0.0
        except Exception as e:
            latency = time.time() - start
            if _is_transient(e) and attempt <= retries:
                await asyncio.sleep(1.0)
                continue
            return False, latency, str(e), 0.0


@pytest.mark.parametrize("model", STABLE_FREE_MODELS)
@pytest.mark.asyncio
async def test_run_100_prompts_free_models(model: str):
    """Test 100+ prompts against a single free model"""
    prompts = _load_prompts()
    config = OpenRouterConfig(api_key=OPENROUTER_API_KEY, model=model)

    # For quick testing, limit to first 5 prompts; remove this line for full run
    # prompts = prompts[:5]

    total = 0
    passed = 0
    latencies: List[float] = []
    errors: List[Dict[str, Any]] = []
    total_cost = 0.0
    failure_by_category: Dict[str, int] = {}

    for case in prompts:
        total += 1
        ok, latency, err, cost = await _run_with_retries_async(config, case.prompt)
        latencies.append(latency)
        if ok:
            passed += 1
            total_cost += float(cost)
        else:
            errors.append({"id": case.id, "category": case.category, "error": err})
            failure_by_category[case.category] = failure_by_category.get(case.category, 0) + 1
        # Rate limit: 1 req/sec across prompts
        await asyncio.sleep(1.0)

    success_rate = (passed / total) * 100.0 if total else 0.0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0

    # Log summary
    print(f"\nModel: {model}")
    print(f"Total: {total}, Passed: {passed}, Success Rate: {success_rate:.1f}%")
    print(f"Average Latency: {avg_latency:.2f}s")
    print(f"Total Cost: ${total_cost:.6f}")
    if errors:
        print(f"Failures: {len(errors)} (showing up to 5)")
        for e in errors[:5]:
            print(f" - {e['id']} [{e['category']}]: {e['error']}")
        # Failure breakdown by category
        print("Failure breakdown by category:")
        for cat, cnt in sorted(failure_by_category.items(), key=lambda x: -x[1]):
            print(f" - {cat}: {cnt}")

    # Assertions per acceptance criteria
    assert success_rate >= 95.0, f"Success rate too low: {success_rate:.1f}%"
    assert avg_latency < 5.0, f"Average latency too high: {avg_latency:.2f}s"
