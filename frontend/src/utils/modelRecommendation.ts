export interface ModelExecutionCandidate {
  modelId: string;
  latencyMs: number; // lower is better
  costUsd: number;   // lower is better
  qualityScore?: number; // 0-100 (higher is better)
}

export interface RecommendationPrefs {
  optimizeFor?: 'balanced' | 'quality' | 'cost' | 'speed';
  maxLatencyMs?: number;
  maxCostUsd?: number;
  minQuality?: number; // 0-100
}

export function recommendBestModel(
  candidates: ModelExecutionCandidate[],
  prefs: RecommendationPrefs = { optimizeFor: 'balanced' }
): { best: string | null; scores: Record<string, number> } {
  if (!candidates.length) return { best: null, scores: {} };

  // Normalize metrics
  const latencies = candidates.map((c) => c.latencyMs);
  const costs = candidates.map((c) => c.costUsd);
  const qualities = candidates.map((c) => c.qualityScore ?? 0);

  const maxLat = Math.max(...latencies);
  const minLat = Math.min(...latencies);
  const maxCost = Math.max(...costs);
  const minCost = Math.min(...costs);
  const maxQual = Math.max(...qualities);
  const minQual = Math.min(...qualities);

  const weights = (() => {
    switch (prefs.optimizeFor) {
      case 'quality':
        return { quality: 0.6, cost: 0.2, speed: 0.2 };
      case 'cost':
        return { quality: 0.2, cost: 0.6, speed: 0.2 };
      case 'speed':
        return { quality: 0.2, cost: 0.2, speed: 0.6 };
      default:
        return { quality: 0.4, cost: 0.3, speed: 0.3 };
    }
  })();

  const scores: Record<string, number> = {};

  for (const c of candidates) {
    // Normalize each metric to 0-1 (higher better)
    const speedScore = maxLat === minLat ? 1 : 1 - (c.latencyMs - minLat) / (maxLat - minLat);
    const costScore = maxCost === minCost ? 1 : 1 - (c.costUsd - minCost) / (maxCost - minCost);
    const qualityScore = maxQual === minQual ? (c.qualityScore ?? 0) / 100 : ((c.qualityScore ?? 0) - minQual) / (maxQual - minQual);

    // Hard constraints
    if (prefs.maxLatencyMs !== undefined && c.latencyMs > prefs.maxLatencyMs) {
      scores[c.modelId] = -Infinity;
      continue;
    }
    if (prefs.maxCostUsd !== undefined && c.costUsd > prefs.maxCostUsd) {
      scores[c.modelId] = -Infinity;
      continue;
    }
    if (prefs.minQuality !== undefined && (c.qualityScore ?? 0) < prefs.minQuality) {
      scores[c.modelId] = -Infinity;
      continue;
    }

    const score = speedScore * weights.speed + costScore * weights.cost + qualityScore * weights.quality;
    scores[c.modelId] = score;
  }

  const ranked = Object.entries(scores).sort((a, b) => (b[1] - a[1]));
  const best = ranked.length && ranked[0][1] !== -Infinity ? ranked[0][0] : null;
  return { best, scores };
}

