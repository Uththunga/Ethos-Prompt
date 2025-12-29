import { describe, expect, it } from 'vitest';
import { recommendBestModel } from '../modelRecommendation';

describe('recommendBestModel', () => {
  const candidates = [
    { modelId: 'free-fast', latencyMs: 800, costUsd: 0, qualityScore: 70 },
    { modelId: 'paid-quality', latencyMs: 1200, costUsd: 0.01, qualityScore: 90 },
    { modelId: 'paid-slow', latencyMs: 2500, costUsd: 0.02, qualityScore: 85 },
  ];

  it('returns a best model in balanced mode', () => {
    const { best } = recommendBestModel(candidates, { optimizeFor: 'balanced' });
    expect(best).toBeTruthy();
  });

  it('prefers quality when optimizeFor=quality', () => {
    const { best } = recommendBestModel(candidates, { optimizeFor: 'quality' });
    expect(best).toBe('paid-quality');
  });

  it('prefers free/cheap when optimizeFor=cost', () => {
    const { best } = recommendBestModel(candidates, { optimizeFor: 'cost' });
    expect(best).toBe('free-fast');
  });

  it('respects hard constraints', () => {
    const { best } = recommendBestModel(candidates, { maxLatencyMs: 1500, minQuality: 80 });
    // free-fast passes latency but fails minQuality=80, so only paid-quality remains under these constraints
    expect(best).toBe('paid-quality');
  });
});
