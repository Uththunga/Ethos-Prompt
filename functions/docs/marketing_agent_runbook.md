# Marketing Agent Runbook & Guides

## Incident Response

### High Latency (>5s)
**Symptoms**: User reports slow responses, monitoring shows p99 latency spikes.
**Diagnosis**:
1. Check Cloud Run logs for "Cold Start".
2. Check OpenRouter/Watsonx API status.
3. Verify if retrieval (Firestore/Vector Store) is slow.
**Mitigation**:
- Increase `min-instances` in Cloud Run.
- Check `lazy_imports` logic is working.
- Switch LLM provider if outage detected.

### Error Spikes (5xx)
**Symptoms**: High failure rate in metrics.
**Diagnosis**:
1. Check logs for exceptions.
2. Common issues: API Key quota, Rate limits, Schema validation errors.
**Mitigation**:
- Rotate API keys if quota exceeded.
- Rollback to previous version if caused by deployment.

### Hallucinations / Quality Issues
**Symptoms**: Agent providing wrong pricing or fake features.
**Diagnosis**:
1. Check `reflection_node` logs for validation failures.
2. Verify Knowledge Base content (is it up to date?).
**Mitigation**:
- Update Knowledge Base content.
- Adjust `hallucination_terms` in `workflow_nodes.py`.
- Improve System Prompt in `marketing_agent.py`.

---

## Deployment Guide

### Staging Deployment
Triggered automatically on push to `develop` or PRs.
```bash
# Manual trigger
git checkout develop
git push origin develop
```
**Verification**:
- Check GitHub Actions "Deploy to Staging" job.
- Run smoke tests against staging URL.

### Production Deployment
Triggered on push to `main`. Requires manual approval in GitHub Actions.
```bash
# Manual trigger
git checkout main
git merge develop
git push origin main
```
**Rollback**:
- Go to GitHub Actions -> "Rollback Production" workflow.
- Run manually to revert traffic to previous revision.

---

## Evaluation Guide

### Running Evaluation
Run the golden dataset evaluation to measure agent quality.
```bash
cd functions
# Run full evaluation
python evaluation/evaluator.py --limit 50 --strict
```

### Interpreting Results
- **Quality Score**: Target > 0.85.
- **Hallucination Rate**: Target < 5%.
- **Tool Usage Accuracy**: Target > 90%.

If score drops, check `evaluation_report.md` for failing cases.

---

## Prompt Versioning

Prompts are managed via `PromptVersionManager` and stored in Firestore.

### Updating Prompts
1. Modify `marketing_prompts.py` or use the `prompt_versioning.py` script.
2. Register new version:
   ```python
   manager.register_version(template="New prompt...", version_id="v1.1.0")
   ```
3. Set active version:
   ```python
   manager.set_active_version("v1.1.0")
   ```

---

## Onboarding Checklist

- [ ] Install Python 3.11+ and dependencies (`pip install -r requirements.txt`)
- [ ] Configure `.env` with API keys (OPENROUTER, WATSONX, FIREBASE)
- [ ] Run local tests: `pytest tests/`
- [ ] Read `marketing_agent_architecture.md`
- [ ] Run a local chat session: `python scripts/chat_local.py`
