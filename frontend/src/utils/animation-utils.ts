export const motionEasing = [0.4, 0, 0.2, 1] as const; // Material-like easing

export function motionDuration(prefersReducedMotion: boolean) {
  return prefersReducedMotion ? 0 : 0.3;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

// Helper to set will-change during interaction
export function withWillChange(el: HTMLElement | null, prop: string = 'transform') {
  if (!el) return () => {};
  const prev = el.style.willChange;
  el.style.willChange = prop;
  return () => {
    el.style.willChange = prev;
  };
}

