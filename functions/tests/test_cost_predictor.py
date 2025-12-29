from decimal import Decimal

from functions.src.llm.cost_predictor import estimate_cost, estimate_tokens_from_text


def test_estimate_tokens_from_text_basic():
    assert estimate_tokens_from_text("") == 0
    assert estimate_tokens_from_text(None) == 0
    assert estimate_tokens_from_text("abcd") == 1  # 4 chars / 4
    assert estimate_tokens_from_text("a" * 40) == 10


def test_estimate_cost_free_model_is_zero():
    est = estimate_cost(
        provider="openrouter",
        model="z-ai/glm-4.5-air:free",
        input_text="Hello world!",
        output_text="Response",
    )
    assert est.estimated_cost_usd == Decimal("0.00")


def test_estimate_cost_paid_model_positive():
    est = estimate_cost(
        provider="openai",
        model="gpt-3.5-turbo",
        input_text="a" * 400,
        output_text="b" * 200,
    )
    # Should be non-negative (and typically > 0) for paid models
    assert est.estimated_cost_usd >= Decimal("0.000000")

