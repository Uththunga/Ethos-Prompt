# Evaluation System

This directory contains the Marketing Agent evaluation system.

## Files

- **golden_dataset.json**: 50 test cases covering all query types
- **evaluator.py**: Evaluation framework with scoring metrics
- **results/**: Evaluation outputs (JSON + Markdown reports)

## Usage

### Run Full Evaluation

```bash
python evaluation/evaluator.py
```

### Run Limited Evaluation (first 10 cases)

```bash
python evaluation/evaluator.py 10
```

### From Python

```python
from evaluation.evaluator import MarketingAgentEvaluator
from ai_agent.marketing.marketing_agent import get_marketing_agent

agent = get_marketing_agent()
evaluator = MarketingAgentEvaluator(agent, "evaluation/golden_dataset.json")

results = await evaluator.evaluate_all(limit=10)
evaluator.save_results("evaluation/results")
```

## Metrics

### Content Coverage (35% weight)
- Checks if response contains expected keywords
- Score: matches / total_expected

### Tool Usage (20% weight)
- Verifies correct tools were called
- Score: 1.0 if expected tool used, 0.5 otherwise

### Follow-up Questions (20% weight)
- Checks for "might also want to know" phrase
- Score: 1.0 if present, 0.0 if missing

### Response Length (10% weight)
- Validates conciseness (100-2500 chars)
- Score: 1.0 if in range, 0.7 otherwise

### Hallucination Prevention (15% weight)
- Checks for removed terms ("digital transformation")
- Score: 1.0 if clean, 0.0 if hallucinated

## Quality Threshold

Each test case has a `quality_threshold` (typically 0.75-0.90). Tests pass if:

```
weighted_score >= quality_threshold
```

## Target: >85% Overall Quality Score

Regression alert if score drops >5% from baseline.

## Dataset Categories

- **pricing** (5 cases): Pricing queries
- **services** (5 cases): Service information
- **technical** (5 cases): Technical questions
- **contact** (5 cases): Contact/consultation requests
- **edge_case** (5 cases): Ambiguous/hallucination tests
- **multi_intent** (3 cases): Multiple intents in one query
- **comparison** (2 cases): Competitive differentiators
- **use_case** (3 cases): Specific use case queries
- **roi** (2 cases): ROI and results questions
- **getting_started** (2 cases): Onboarding questions
- **support** (2 cases): Support and training
- **features** (2 cases): Feature inquiries
- **scalability** (1 case): Scalability questions
- **industry** (2 cases): Industry-specific questions
- **compliance** (2 cases): GDPR, privacy, security
- **customization** (1 case): Customization questions
- **deployment** (1 case): Deployment options
- **success_stories** (1 case): Case studies
- **trial** (1 case): Trial/demo requests

## Example Test Case

```json
{
  "id": "pricing_001",
  "category": "pricing",
  "query": "How much does it cost?",
  "expected_content": ["custom quotation", "pricing", "quote"],
  "expected_tools": ["search_kb", "get_pricing"],
  "expected_follow_ups": 3,
  "quality_threshold": 0.85
}
```

## Output

### evaluation_results.json
Complete detailed results with per-test scores.

### evaluation_report.md
Human-readable markdown report with:
- Summary statistics
- Category breakdown
- Failed test list
- Recommendations
