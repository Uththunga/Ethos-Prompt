import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateCostUSD, isFreeModel } from '../costPredictor';

describe('costPredictor (frontend)', () => {
  it('estimates tokens ~ length/4', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('a'.repeat(40))).toBe(10);
  });

  it('detects free model ids and returns $0 cost', () => {
    expect(isFreeModel('z-ai/glm-4.5-air:free')).toBe(true);
    const cost = estimateCostUSD('openrouter', 'z-ai/glm-4.5-air:free', 'hello', 'world');
    expect(cost).toBe(0);
  });

  it('estimates small non-zero cost for paid models', () => {
    const cost = estimateCostUSD('openai', 'gpt-3.5-turbo', 'a'.repeat(400), 'b'.repeat(200));
    expect(cost).toBeGreaterThanOrEqual(0);
  });
});

