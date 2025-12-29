/**
 * UTM Parameter Tracking Utility
 * GAP-009: Capture and persist UTM parameters for marketing attribution
 */

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const UTM_STORAGE_KEY = 'ethosprompt_utm_params';
const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/**
 * Extract UTM parameters from URL
 */
export function extractUtmFromUrl(url: string = window.location.href): UtmParams {
  try {
    const params = new URL(url).searchParams;
    const utm: UtmParams = {};

    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
      }
    }

    return utm;
  } catch {
    return {};
  }
}

/**
 * Save UTM parameters to sessionStorage (persists for session only)
 */
export function persistUtmParams(utm?: UtmParams): void {
  try {
    const params = utm || extractUtmFromUrl();
    if (Object.keys(params).length > 0) {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params));
    }
  } catch {
    // sessionStorage not available
  }
}

/**
 * Get persisted UTM parameters
 */
export function getPersistedUtmParams(): UtmParams {
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // sessionStorage not available or parse error
  }
  return {};
}

/**
 * Check if any UTM params are present
 */
export function hasUtmParams(): boolean {
  return Object.keys(getPersistedUtmParams()).length > 0;
}

/**
 * Initialize UTM tracking on page load
 * Call this once in your app's entry point (e.g., App.tsx or main.tsx)
 */
export function initUtmTracking(): void {
  const urlUtm = extractUtmFromUrl();
  if (Object.keys(urlUtm).length > 0) {
    persistUtmParams(urlUtm);
    if (process.env.NODE_ENV === 'development') {
      console.log('[UTM] Captured params:', urlUtm);
    }
  }
}

/**
 * Clear UTM params (e.g., after successful conversion)
 */
export function clearUtmParams(): void {
  try {
    sessionStorage.removeItem(UTM_STORAGE_KEY);
  } catch {
    // sessionStorage not available
  }
}
