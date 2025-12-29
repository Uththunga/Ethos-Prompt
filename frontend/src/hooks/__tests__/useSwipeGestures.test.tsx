import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSwipeGestures } from '../useSwipeGestures';

function Harness({ onSwipeRight }: any) {
  const handlers = useSwipeGestures({ onSwipeRight, edge: 'left', threshold: 10, velocity: 0 });
  return <div data-testid="target" {...handlers} />;
}

describe('useSwipeGestures', () => {
  it('calls onSwipeRight when swiping right from left edge', () => {
    const onSwipeRight = vi.fn();
    const { getByTestId } = render(<Harness onSwipeRight={onSwipeRight} />);
    const el = getByTestId('target');

    // Mock minimal Touch objects
    const startTouch = { clientX: 2, clientY: 10 } as any;
    const endTouch = { clientX: 100, clientY: 10 } as any;

    // Fire touchstart and touchend events with touches/changedTouches arrays
    fireEvent.touchStart(el, { touches: [startTouch] });
    fireEvent.touchEnd(el, { changedTouches: [endTouch] });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
  });
});

