/**
 * Display Mode Preference Hook
 * Manages user preference for marketing chat display mode (side-panel vs center-modal)
 *
 * Features:
 * - localStorage persistence
 * - Cross-tab synchronization via storage event
 * - SSR-safe with lazy initialization
 */

import { useCallback, useEffect, useState } from 'react';

export type DisplayMode = 'side-panel' | 'center-modal';

const STORAGE_KEY = 'marketing_chat_display_mode';
const DEFAULT_MODE: DisplayMode = 'side-panel';

/**
 * Validates that a value is a valid DisplayMode
 */
function isValidDisplayMode(value: unknown): value is DisplayMode {
  return value === 'side-panel' || value === 'center-modal';
}

/**
 * Hook for managing display mode preference
 * @returns [currentMode, setMode] tuple
 */
export function useDisplayModePreference(): [DisplayMode, (mode: DisplayMode) => void] {
  // Lazy initialization from localStorage (SSR-safe)
  const [mode, setModeState] = useState<DisplayMode>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODE;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isValidDisplayMode(stored)) {
        return stored;
      }
    } catch {
      // localStorage may be disabled or quota exceeded
    }
    return DEFAULT_MODE;
  });

  // Persist to localStorage on change
  const setMode = useCallback((newMode: DisplayMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && isValidDisplayMode(e.newValue)) {
        setModeState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [mode, setMode];
}

export default useDisplayModePreference;
