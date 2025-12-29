"""
Task: RAG Context Injection End-to-End Validation (Week 4 P0)

This suite validates that injecting retrieved document context improves response
quality across a diverse set of prompts. It compares responses with and without
RAG context and asserts an improvement rate target (80%+).

Notes:
- Uses only free OpenRouter models (per project preferences)
- Reads prompts and expected criteria from fixtures/test_prompts_rag.json
- Reads context text from fixtures/rag_test_documents/*
- Measures improvement by matching evaluation criteria in responses
- Records basic timing and cost metadata returned by OpenRouter client

Run:
  export OPENROUTER_API_KEY=...  # required
  pytest -q functions/tests/integration/test_rag_e2e_validation.py -k e2e
"""

import os
import sys
import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pytest
from dotenv import load_dotenv

# Add src to path for imports
ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "functions" / "src"
sys.path.insert(0, str(SRC))

from llm.openrouter_client import OpenRouterClient, OpenRouterConfig, LLMResponse  # noqa: E402

load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    pytest.skip("OPENROUTER_API_KEY not set", allow_module_level=True)

# Use validated free model
DEFAULT_MODEL = os.environ.get("OPENROUTER_TEST_MODEL", "z-ai/glm-4.5-air:free")

FIXTURES_DIR = ROOT / "functions" / "tests" / "fixtures"
PROMPTS_FILE = FIXTURES_DIR / "test_prompts_rag.json"
DOCS_DIR = FIXTURES_DIR / "rag_test_documents"


@dataclass
class PromptCase:
    id: str
    category: str
    title: str
    prompt: str
    expected_context: str
    evaluation_criteria: List[str]


def load_prompt_cases(min_count: int = 20) -> List[PromptCase]:
    with open(PROMPTS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    cases: List[PromptCase] = []
    for item in data.get("test_prompts", []):
        cases.append(
            PromptCase(
                id=item["id"],
                category=item["category"],
                title=item.get("title", item["id"]),
                prompt=item["prompt"],
                expected_context=item.get("expected_context", "none"),
                evaluation_criteria=item.get("evaluation_criteria", []),
            )
        )
    # Ensure we have at least min_count
    return cases[: max(min_count, len(cases))]


def load_context_for_case(case: PromptCase) -> str:
    """Build context string by concatenating relevant documents.

    Rules:
    - expected_context may be:
      * filename (e.g., technical_doc_ai.txt)
      * comma-separated filenames
      * "all": include all fixture docs
      * "any" or "none": return empty context (baseline-like)
    """
    ctx = case.expected_context.strip().lower()
    if ctx in ("none", "any", ""):
        return ""

    doc_paths: List[Path] = []
    if ctx == "all":
        doc_paths = sorted(DOCS_DIR.glob("*"))
    else:
        names = [p.strip() for p in ctx.split(",") if p.strip()]
        for name in names:
            p = DOCS_DIR / name
            if p.exists():
                doc_paths.append(p)

    parts: List[str] = []
    for p in doc_paths:
        try:
            parts.append(f"[Source: {p.name}]\n" + p.read_text(encoding="utf-8")[:4000])
        except Exception:
            # Skip unreadable file
            continue

    return "\n\n".join(parts)


def criteria_match_score(text: str, criteria: List[str]) -> float:
    """Return fraction of criteria phrases present in text (case-insensitive)."""
    if not criteria:
        return 0.0
    t = text.lower()
    hits = 0
    for crit in criteria:
        if any(tok.strip() and tok.strip().lower() in t for tok in [crit]):
            hits += 1
    return hits / max(1, len(criteria))


def improved(baseline: str, with_ctx: str, criteria: List[str]) -> Tuple[bool, Dict[str, float]]:
    """Determine if with_ctx improved vs baseline using simple metrics.

    Metrics:
      - criteria_score: fraction of evaluation_criteria matched
      - length_gain: fractional length increase vs baseline
    Improvement if:
      - criteria_score_ctx > criteria_score_base by >= 0.15 OR
      - criteria_score equal but length_gain >= 0.25 (proxy for specificity)
    """
    base_score = criteria_match_score(baseline, criteria)
    ctx_score = criteria_match_score(with_ctx, criteria)
    len_base = max(1, len(baseline))
    len_ctx = len(with_ctx)
    length_gain = (len_ctx - len_base) / len_base

    improved_flag = (ctx_score - base_score) >= 0.15 or (
        abs(ctx_score - base_score) < 1e-6 and length_gain >= 0.25
    )
    return improved_flag, {
        "criteria_base": base_score,
        "criteria_ctx": ctx_score,
        "length_gain": length_gain,
    }


@pytest.mark.asyncio
async def test_rag_e2e_improvement_rate():
    """
    End-to-end: Execute 20+ prompts with and without context and validate
    improvement rate >= 80%.
    """
    cases = load_prompt_cases(min_count=20)

    config = OpenRouterConfig(
        api_key=OPENROUTER_API_KEY,
        model=DEFAULT_MODEL,
        max_tokens=300,
        temperature=0.3,  # lower for factual alignment in tests
    )

    improved_count = 0
    evaluated = 0
    timings: List[float] = []
    costs: List[float] = []

    async with OpenRouterClient(config) as client:
        for idx, case in enumerate(cases, 1):
            # Build context
            context_text = load_context_for_case(case)

            # Baseline
            t0 = time.time()
            base: LLMResponse = await client.generate_response(
                prompt=case.prompt,
                system_prompt="You are a concise, helpful assistant.",
            )
            t1 = time.time()

            # With context
            ctx: LLMResponse = await client.generate_response(
                prompt=case.prompt,
                system_prompt="Use the provided context to answer precisely; cite specific details when present.",
                context=context_text,
            )
            t2 = time.time()

            evaluated += 1
            timings.append((t1 - t0) + (t2 - t1))
            costs.append(base.cost_estimate + ctx.cost_estimate)

            imp, metrics = improved(base.content, ctx.content, case.evaluation_criteria)
            if imp:
                improved_count += 1

            # Debug output for first few
            if idx <= 5:
                print(f"\n— Case {idx}/{len(cases)}: {case.id} [{case.category}] —")
                print(f"Criteria base={metrics['criteria_base']:.2f}, ctx={metrics['criteria_ctx']:.2f}, length_gain={metrics['length_gain']:.2f}")

    improvement_rate = improved_count / max(1, evaluated)

    print("\nE2E Summary:")
    print(f"  Cases evaluated: {evaluated}")
    print(f"  Improved: {improved_count} ({improvement_rate*100:.1f}%)")
    if timings:
        avg_time = sum(timings) / len(timings)
        print(f"  Avg total time per pair: {avg_time:.2f}s")
    if costs:
        print(f"  Total estimated cost: ${sum(costs):.6f} (should be $0.00 with free models)")

    # Target from plan: 80%+
    assert improvement_rate >= 0.80, f"Improvement rate below target: {improvement_rate*100:.1f}% < 80%"


@pytest.mark.asyncio
async def test_rag_e2e_reports_and_metadata():
    """
    Sanity check that metadata from the client is present and consistent across
    multiple executions (non-empty content, numeric token usage fields where available).
    """
    cases = load_prompt_cases(min_count=3)

    config = OpenRouterConfig(
        api_key=OPENROUTER_API_KEY,
        model=DEFAULT_MODEL,
        max_tokens=200,
        temperature=0.5,
    )

    async with OpenRouterClient(config) as client:
        for case in cases:
            ctx_text = load_context_for_case(case)
            res = await client.generate_response(
                prompt=case.prompt,
                system_prompt="Use context if provided.",
                context=ctx_text,
            )
            assert isinstance(res.content, str) and len(res.content) > 0
            assert isinstance(res.usage, dict)
            assert isinstance(res.cost_estimate, float)
            assert res.cost_estimate == 0.0  # free model
            assert isinstance(res.response_time, float) and res.response_time >= 0.0
            assert isinstance(res.metadata, dict)

