/**
 * Frontend Cost Predictor (approximate)
 * - Estimates tokens as text.length / 4 (rounded)
 * - Returns $0.00 for known free models (ids ending with ":free")
 * - Otherwise uses a small default rate for UX estimation only
 */

export function estimateTokens(text: string | undefined | null, charsPerToken = 4): number {
  if (!text) return 0;
  const cpt = Math.max(1, Math.floor(charsPerToken));
  return Math.max(0, Math.round(text.length / cpt));
}

export function isFreeModel(modelId: string): boolean {
  return modelId.endsWith(':free');
}

export function estimateCostUSD(
  provider: string,
  modelId: string,
  inputText?: string,
  outputText?: string,
  opts?: { charsPerToken?: number; defaultPer1kTokensUSD?: number }
): number {
  // Free models: cost is always $0.00
  if (isFreeModel(modelId)) return 0;

  const charsPerToken = opts?.charsPerToken ?? 4;
  const defaultPer1k = opts?.defaultPer1kTokensUSD ?? 0.001; // very low, UI-only placeholder

  const inputTokens = estimateTokens(inputText, charsPerToken);
  const outputTokens = estimateTokens(outputText, charsPerToken);
  const total = inputTokens + outputTokens;

  return +(Math.max(0, (total / 1000) * defaultPer1k).toFixed(6));
}

