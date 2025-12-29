# A/B Testing Guide for RAG Quality Validation

**Last Updated**: 2025-10-02  
**Status**: ✅ Framework Implemented, Ready for Execution  
**Priority**: P1 (HIGH PRIORITY)

---

## Overview

This guide explains how to conduct A/B testing to validate that RAG (Retrieval-Augmented Generation) improves response quality compared to non-RAG responses.

### Purpose

- **Validate RAG Value**: Confirm that RAG provides measurable improvement in response quality
- **Quantify Improvement**: Measure the percentage improvement in relevance, accuracy, and user satisfaction
- **Cost-Benefit Analysis**: Compare the additional cost of RAG against the quality improvement
- **Identify Optimization Opportunities**: Find areas where RAG can be improved

---

## Test Framework

### Components

1. **Test Prompts** (`tests/ab_testing/test_prompts.json`)
   - 15 diverse prompts across 7 categories
   - Each prompt includes expected topics for relevance scoring
   - Categories: technology, business, health, education, finance, environment, psychology

2. **A/B Testing Script** (`tests/ab_testing/rag_quality_test.py`)
   - Executes prompts with and without RAG
   - Measures latency, cost, tokens, and relevance
   - Generates comprehensive results and metrics

3. **Results Analysis** (Generated: `ab_test_results.json`)
   - Raw test data for all iterations
   - Aggregated metrics and comparisons
   - Statistical analysis

---

## Setup Instructions

### Prerequisites

1. **OpenRouter API Key**
   - Sign up at [https://openrouter.ai](https://openrouter.ai)
   - Get API key from [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Add credits to your account ($5-10 recommended for testing)

2. **Environment Configuration**

Create or update `functions/.env`:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

Or set environment variable:

```bash
# Windows PowerShell
$env:OPENROUTER_API_KEY="sk-or-v1-your-api-key-here"

# Windows CMD
set OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Linux/Mac
export OPENROUTER_API_KEY="sk-or-v1-your-api-key-here"
```

3. **Install Dependencies**

```bash
cd functions
pip install -r requirements.txt
```

---

## Running A/B Tests

### Quick Test (2 iterations)

For testing the framework:

```bash
cd functions
python -m tests.ab_testing.rag_quality_test --iterations 2 --model gpt-3.5-turbo
```

**Expected Time**: ~2-3 minutes  
**Expected Cost**: ~$0.10-0.20

### Standard Test (50 iterations)

For production validation:

```bash
cd functions
python -m tests.ab_testing.rag_quality_test --iterations 50 --model gpt-3.5-turbo
```

**Expected Time**: ~45-60 minutes  
**Expected Cost**: ~$2.50-5.00

### Full Test (100 iterations)

For comprehensive analysis:

```bash
cd functions
python -m tests.ab_testing.rag_quality_test --iterations 100 --model gpt-3.5-turbo
```

**Expected Time**: ~90-120 minutes  
**Expected Cost**: ~$5.00-10.00

### Test with Different Models

```bash
# GPT-4 (higher quality, higher cost)
python -m tests.ab_testing.rag_quality_test --iterations 50 --model gpt-4

# Claude 3 Haiku (fast, low cost)
python -m tests.ab_testing.rag_quality_test --iterations 50 --model anthropic/claude-3-haiku

# Claude 3.5 Sonnet (high quality)
python -m tests.ab_testing.rag_quality_test --iterations 50 --model anthropic/claude-3.5-sonnet
```

### Custom Output File

```bash
python -m tests.ab_testing.rag_quality_test --iterations 50 --output my_test_results.json
```

---

## Understanding Results

### Output Format

The script generates `ab_test_results.json` with the following structure:

```json
{
  "timestamp": "2025-10-02T19:30:00",
  "num_iterations": 50,
  "model": "gpt-3.5-turbo",
  "test_prompts": 15,
  "without_rag": [
    {
      "prompt_id": "tech_ai_trends",
      "category": "technology",
      "iteration": 0,
      "response": "...",
      "latency": 1.23,
      "tokens": 150,
      "cost": 0.0003,
      "relevance_score": 0.67,
      "success": true
    }
  ],
  "with_rag": [
    {
      "prompt_id": "tech_ai_trends",
      "category": "technology",
      "iteration": 0,
      "response": "...",
      "latency": 1.45,
      "tokens": 200,
      "cost": 0.0004,
      "relevance_score": 0.83,
      "context_chunks": 5,
      "context_length": 1500,
      "success": true
    }
  ],
  "metrics": {
    "without_rag": {
      "total_tests": 750,
      "successful_tests": 745,
      "success_rate": 99.3,
      "avg_latency": 1.2,
      "avg_tokens": 145,
      "total_cost": 0.22,
      "avg_relevance": 0.65
    },
    "with_rag": {
      "total_tests": 750,
      "successful_tests": 740,
      "success_rate": 98.7,
      "avg_latency": 1.5,
      "avg_tokens": 195,
      "total_cost": 0.30,
      "avg_relevance": 0.82,
      "avg_context_chunks": 5.0
    },
    "latency_change_pct": 25.0,
    "cost_increase_pct": 36.4,
    "relevance_improvement_pct": 26.2
  }
}
```

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Success Rate** | Percentage of successful API calls | >95% |
| **Avg Latency** | Average response time in seconds | <3s |
| **Avg Tokens** | Average tokens per response | 100-300 |
| **Total Cost** | Total cost for all tests | <$10 |
| **Avg Relevance** | Average relevance score (0-1) | >0.7 |
| **Relevance Improvement** | % improvement with RAG | >20% |
| **Cost Increase** | % cost increase with RAG | <200% |

### Interpreting Results

#### ✅ RAG is Effective

- **Relevance Improvement**: ≥20%
- **Cost Increase**: <200%
- **Success Rate**: >95%

**Action**: Deploy RAG to production

#### ⚠️ RAG Needs Optimization

- **Relevance Improvement**: 10-20%
- **Cost Increase**: 100-200%
- **Success Rate**: 90-95%

**Action**: Optimize chunking, retrieval, or context injection

#### ❌ RAG Not Effective

- **Relevance Improvement**: <10%
- **Cost Increase**: >200%
- **Success Rate**: <90%

**Action**: Investigate root cause, improve document quality, or reconsider RAG approach

---

## Metrics Explained

### Relevance Score

**Calculation**: Percentage of expected topics found in response

```python
relevance_score = (topics_found / total_expected_topics)
```

**Example**:
- Expected topics: ["machine learning", "neural networks", "AI", "transformers"]
- Response contains: "machine learning", "AI", "transformers"
- Relevance score: 3/4 = 0.75 (75%)

**Limitations**:
- Simple keyword matching (not semantic)
- Doesn't measure accuracy or quality
- Doesn't detect hallucinations

**Improvements** (Future):
- Use semantic similarity (embeddings)
- Add human evaluation
- Implement fact-checking

### Latency

**Measurement**: Time from request to complete response

**Components**:
- API request time
- Model inference time
- Network latency
- (With RAG) Retrieval time + context injection time

**Target**: <3 seconds for good UX

### Cost

**Calculation**: Based on token usage and model pricing

```python
cost = (prompt_tokens * input_price + completion_tokens * output_price) / 1000
```

**Typical Costs** (per 1K tokens):
- GPT-3.5 Turbo: $0.0005 input, $0.0015 output
- GPT-4: $0.03 input, $0.06 output
- Claude 3 Haiku: $0.00025 input, $0.00125 output
- Claude 3.5 Sonnet: $0.003 input, $0.015 output

---

## Troubleshooting

### Issue: All Tests Failing

**Symptoms**:
```
ERROR: OpenRouterConfig.__init__() missing 1 required positional argument: 'api_key'
```

**Solution**:
1. Check API key is set: `echo $OPENROUTER_API_KEY`
2. Verify API key is valid at [https://openrouter.ai/keys](https://openrouter.ai/keys)
3. Ensure `.env` file is in `functions/` directory
4. Restart terminal to reload environment variables

### Issue: Rate Limiting

**Symptoms**:
```
ERROR: 429 Too Many Requests
```

**Solution**:
1. Reduce iterations: `--iterations 10`
2. Increase delay between requests (edit `rag_quality_test.py` line 247: `await asyncio.sleep(1.0)`)
3. Use a different model with higher rate limits
4. Upgrade OpenRouter plan

### Issue: High Cost

**Symptoms**:
- Total cost exceeds budget
- Running out of credits

**Solution**:
1. Use cheaper models (gpt-3.5-turbo, claude-3-haiku)
2. Reduce iterations
3. Reduce max_tokens (edit script line 57: `max_tokens=300`)
4. Test with fewer prompts (edit `test_prompts.json`)

### Issue: Low Relevance Scores

**Symptoms**:
- Relevance scores <0.5 for both RAG and non-RAG

**Solution**:
1. Review expected topics in `test_prompts.json` - may be too specific
2. Check response quality manually
3. Adjust relevance scoring algorithm
4. Use semantic similarity instead of keyword matching

---

## Best Practices

1. **Start Small**: Run 2-5 iterations first to verify setup
2. **Monitor Costs**: Check OpenRouter dashboard during tests
3. **Save Results**: Keep results files for comparison over time
4. **Test Multiple Models**: Compare different models to find best cost/quality balance
5. **Review Manually**: Manually review a sample of responses to validate metrics
6. **Iterate**: Run tests after each RAG optimization to measure improvement

---

## Next Steps

### After Running Tests

1. **Analyze Results**
   - Review `ab_test_results.json`
   - Check if relevance improvement ≥20%
   - Verify cost increase is acceptable

2. **Generate Report**
   - Create `docs/AB_TEST_RESULTS.md` with findings
   - Include recommendations
   - Document any issues or limitations

3. **Optimize if Needed**
   - Adjust chunking strategy
   - Tune retrieval parameters (top_k, similarity_threshold)
   - Improve context injection prompt
   - Re-run tests to measure improvement

4. **Deploy to Production**
   - If results are positive (≥20% improvement)
   - Update production configuration
   - Monitor real-world performance

---

## Acceptance Criteria

- [x] Test framework created (`rag_quality_test.py`)
- [x] Test prompts defined (15 prompts across 7 categories)
- [ ] 50+ iterations completed per prompt
- [ ] Results documented in `docs/AB_TEST_RESULTS.md`
- [ ] Relevance improvement ≥20% validated (or documented why not)
- [ ] Cost-benefit analysis completed
- [ ] Recommendations provided

---

## References

- A/B Testing Script: `functions/tests/ab_testing/rag_quality_test.py`
- Test Prompts: `functions/tests/ab_testing/test_prompts.json`
- Gap Analysis: `GAP_ANALYSIS_PHASE1_VS_PLAN.md` (Issue #2)
- Remediation Roadmap: `PHASE1_GAP_REMEDIATION_ROADMAP.md` (Days 2-3)

---

**Status**: ✅ Framework Ready, Awaiting API Key Configuration and Execution  
**Next Action**: Configure OPENROUTER_API_KEY and run 50-iteration test

