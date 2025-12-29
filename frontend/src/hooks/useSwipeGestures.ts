import { useCallback, useRef } from 'react';

interface Options {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
  edge?: 'left' | 'right' | 'none';
  threshold?: number; // px distance
  velocity?: number; // px/ms minimal
}

export function useSwipeGestures(opts: Options = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeDown,
    onSwipeUp,
    edge = 'none',
    threshold = 50,
    velocity = 0.3,
  } = opts;

  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const active = useRef(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
      startTime.current = performance.now();
      active.current =
        edge === 'none' ||
        (edge === 'left' && startX.current < 50) ||
        (edge === 'right' && startX.current > window.innerWidth - 50);
    },
    [edge]
  );

  const onTouchMove = useCallback((_e: React.TouchEvent) => {
    // no-op: allow browser to scroll; detection on end
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!active.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const dt = Math.max(1, performance.now() - startTime.current);
      const vx = Math.abs(dx) / dt; // px per ms
      const vy = Math.abs(dy) / dt;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) >= threshold && vx >= velocity) {
          if (dx > 0) {
            if (onSwipeRight) onSwipeRight();
          } else {
            if (onSwipeLeft) onSwipeLeft();
          }
        }
      } else {
        if (Math.abs(dy) >= threshold && vy >= velocity) {
          if (dy > 0) {
            if (onSwipeDown) onSwipeDown();
          } else {
            if (onSwipeUp) onSwipeUp();
          }
        }
      }
    },
    [threshold, velocity, onSwipeLeft, onSwipeRight, onSwipeDown, onSwipeUp]
  );

  return { onTouchStart, onTouchMove, onTouchEnd } as const;
}
