# Reflection Mechanism Documentation

## Overview

The **Reflection Mechanism** is a self-correction system that validates AI-generated responses before returning them to users. It ensures high-quality, accurate, and on-brand marketing content.

**Key Benefits:**
- 🎯 Prevents hallucinations and inaccurate information
- ✅ Ensures brand voice consistency
- 📝 Enforces response formatting standards
- 🔄 Automatic self-correction without user intervention

---

## How It Works

### Workflow Integration

The reflection mechanism sits between response generation and delivery:

```
User Query → LLM Response → Reflection Node → [Pass/Fail]
                                 ↓
                        [Fail] → Regenerate with Feedback
                                 ↓
                        Reflection Node → [Retry up to max_iterations]
```

### Validation Checks

The reflection node performs **9 comprehensive checks** on every response:

#### 1. **Empty Response Check**
- **Trigger:** Response <20 characters
- **Purpose:** Ensure meaningful content
- **Example Failure:** `""`

#### 2. **Follow-up Questions Check**
- **Trigger:** Missing "might also want to know" section
- **Purpose:** Maintain engagement and guide users
- **Example Failure:** Response lacks suggested questions

#### 3. **Length Check**
- **Trigger:** Response >2500 characters
- **Purpose:** Enforce conciseness (as per system prompt)
- **Example Failure:** Long-winded explanations

#### 4. **Hallucination Detection (Keywords)**
- **Trigger:** Mentions outdated/removed content
- **Monitored Terms:** "digital transformation", "AI prompt optimization"
- **Purpose:** Prevent referencing deprecated services
- **Example Failure:** "Our Digital Transformation service helps..."

#### 5. **Hallucination Detection (Content Accuracy)**
- **Trigger:** Claims not found in retrieved context
- **Purpose:** Ensure factual accuracy
- **Example Failure:** "We have 500+ clients" when KB says "100+ clients"

#### 6. **Brand Voice Validation**
- **Trigger:** Contains forbidden words
- **Forbidden List:** "delve", "tapestry", "landscape of", "realm of", "testament to"
- **Purpose:** Avoid generic AI-sounding language
- **Example Failure:** "Let's delve into our pricing options..."

#### 7. **Call to Action Check**
- **Trigger:** Discusses pricing without suggesting consultation
- **Required Keywords:** "consultation", "contact", "reach out", "schedule"
- **Purpose:** Drive conversions
- **Example Failure:** Lists pricing without CTA

#### 8. **LLM-Based Claim Verification**
- **Trigger:** Claims not supported by retrieved context
- **Method:** Uses LLM to cross-reference response against `tools_output`
- **Purpose:** Catch subtle factual errors
- **Example Failure:** "We have 500+ clients" when KB says "100+ clients"

#### 9. **Formatting & Structure**
- **Trigger A:** Long response (>500 chars) without bullet points
- **Trigger B:** Paragraph >800 characters
- **Purpose:** Ensure readability
- **Example Failure:** Wall of text without structure

---

## Configuration

### Max Iterations

**Location:** `workflow_graph.py`

```python
max_iterations: int  # Default: 10
```

**Tuning Guidance:**
- **3:** Aggressive quality control, may accept flawed responses
- **5:** Balanced (recommended for production)
- **10:** Conservative, higher latency but better quality

**Trade-off:** More iterations = Better quality but slower responses

---

### Validation Thresholds

**Location:** `workflow_nodes.py:reflection_node`

Modifiable thresholds:

| Parameter | Current Value | Purpose |
|-----------|--------------|---------|
| Min length | 20 chars | Prevent empty responses |
| Max length | 2500 chars | Enforce conciseness |
| Max paragraph | 800 chars | Readability |
| Min response for bullets | 500 chars | Formatting threshold |

**To Modify:** Edit constants in `reflection_node` function

---

## Reflection Metrics

### Tracked Metrics

The reflection mechanism exposes metrics via `AgentResponse.metadata`:

```python
{
  "iteration_count": 2,          # Number of regeneration attempts
  "reflection_feedback": "..."   # Validation issues encountered
}
```

### Evaluating Reflection Impact

Use the provided evaluation script:

```bash
# Mock mode (zero cost)
export OPENROUTER_USE_MOCK=true
python scripts/evaluate_reflection.py --limit 50

# Real LLM mode
export OPENROUTER_USE_MOCK=false
python scripts/evaluate_reflection.py --limit 50
```

**Output Metrics:**
- **Reflection Rate:** % of responses triggering self-correction
- **Total Reflections:** Count of failure cases
- **Avg Iterations:** Average attempts per response

**Target Benchmarks:**
- Reflection Rate: 20-40% (indicates active quality control)
- Avg Iterations: 1.5-2.5 (efficient self-correction)

---

## Feedback Quality

### Feedback Message Format

When validation fails, the reflection node generates a structured feedback message:

```
Response FAILED validation. Re-generate with improvements:

Issues found:
- Missing required follow-up questions
- Brand voice violation: Avoid using 'delve'
- Potential hallucination: Price '$500' not found in retrieved content

Requirements:
- Include 3+ follow-up questions in "You might also want to know:" section
- Use professional, direct language
- Only mention prices explicitly stated in the context
```

### Improving Feedback

**Best Practices:**
1. **Be Specific:** "Add bullet points for readability" > "Improve formatting"
2. **Cite Examples:** Include the violation (e.g., actual price vs. stated price)
3. **Provide Guidance:** Tell LLM *how* to fix, not just *what* is wrong

**File:** `workflow_nodes.py:reflection_node` (lines 240-270)

---

## Advanced: LLM-Based Verification

### `verify_claims` Function

**Purpose:** Cross-reference response claims against retrieved context using an LLM

**Implementation:**

```python
async def verify_claims(response_text: str, context: str, llm: Any) -> List[str]:
    verification_prompt = f"""
    Verify if the following response is fully supported by the provided context.

    Context: {context[:4000]}
    Response: {response_text}

    Identify any claims in the response that are NOT supported by the context.
    If all claims are supported, return "SUPPORTED".
    If there are unsupported claims, list them as bullet points.
    """

    verification_response = await llm.ainvoke([HumanMessage(content=verification_prompt)])

    if "SUPPORTED" in verification_response.content:
        return []  # All claims verified

    # Extract unsupported claims
    issues = [line.strip('- ').strip() for line in content.split('\n') if line.strip().startswith('-')]
    return [f"Unsupported claim: {issue}" for issue in issues]
```

**Limitation:** Requires LLM call, adds ~200-500ms latency

**When to Disable:** Set `llm=None` to skip LLM-based verification (falls back to keyword checks only)

---

## Troubleshooting

### Problem: Reflection Rate Too High (>60%)

**Possible Causes:**
- Validation thresholds too strict
- System prompt not aligned with validation rules
- LLM model quality issue

**Solutions:**
1. Relax thresholds (e.g., increase max_length to 3000)
2. Update system prompt to explicitly mention requirements
3. Test with different LLM model

---

### Problem: Reflection Rate Too Low (<10%)

**Possible Causes:**
- Validation checks not comprehensive enough
- LLM already producing high-quality responses
- Checks bypassed by specific response patterns

**Solutions:**
1. Add domain-specific validation rules
2. Lower quality thresholds (e.g., min_length to 50)
3. Review pass-through cases in logs

---

### Problem: Max Iterations Frequently Reached

**Possible Causes:**
- Conflicting validation rules
- Unclear feedback messages
- LLM incapable of meeting requirements

**Solutions:**
1. Review feedback clarity (add examples)
2. Simplify validation rules
3. Increase max_iterations temporarily to diagnose
4. Consider different LLM model

---

## Testing Reflection

### Unit Tests

**File:** `tests/ai_agent/test_reflection_validation.py`

**Test Cases:**
- ✅ `test_reflection_node_pass`: All validations pass
- ✅ `test_reflection_node_fail_followup`: Missing follow-up questions
- ✅ `test_reflection_node_formatting_check`: Formatting violations

**Run Tests:**
```bash
pytest tests/ai_agent/test_reflection_validation.py -v
```

---

### Integration Testing

**Script:** `scripts/evaluate_reflection.py`

**Purpose:** Measure reflection impact on real queries

**Sample Output:**
```
📊 REFLECTION METRICS
============================================================
Reflection Rate: 35.0%
Total Reflections: 17
Avg Iterations: 1.9
============================================================
```

**Interpretation:**
- **35% reflection rate:** Healthy quality control
- **1.9 avg iterations:** Efficient self-correction
- **No max iterations reached:** Validation rules are achievable

---

## Best Practices

### 1. Align System Prompt with Validation Rules

Ensure the system prompt explicitly mentions:
- "Include 3 follow-up questions"
- "Keep responses under 3 paragraphs"
- "Use bullet points for lists"

**Why:** LLM learns to meet validation criteria upfront, reducing reflection rate

---

### 2. Monitor Reflection Metrics in Production

Track reflection rate over time:
- Sudden spike: New validation rule too strict or LLM regression
- Sudden drop: Validation becoming ineffective

**Tools:** Firestore queries on `metadata.iteration_count`

---

### 3. A/B Test Validation Changes

Before deploying stricter validations:
1. Run evaluation on golden dataset (baseline)
2. Make validation change
3. Re-run evaluation (compare reflection rate)
4. Deploy if <10% reflection rate increase

---

### 4. Graceful Degradation

Always allow max_iterations to accept "good enough" responses:
- Better to return imperfect response than fail
- Log max_iterations cases for manual review

---

## Future Enhancements

### Planned Improvements (Week 5-6)

- **Adaptive Thresholds:** Adjust validation strictness based on query complexity
- **Cached Validations:** Skip expensive checks for similar queries
- **Multi-Model Verification:** Use different LLM for claim verification
- **User Feedback Loop:** Incorporate thumbs up/down into validation tuning

---

## Related Documentation

- [Architecture Overview](file:///d:/react/React-App-000740/EthosPrompt/functions/docs/ARCHITECTURE.md)
- [User Guide](file:///d:/react/React-App-000740/EthosPrompt/functions/docs/USER_GUIDE.md)
- [Contributing Guide](file:///d:/react/React-App-000740/EthosPrompt/functions/CONTRIBUTING.md)

---

**Last Updated:** 2025-11-27
**Version:** 1.0
**Maintained By:** AI Agent Development Team
