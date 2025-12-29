import React, { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFocusTrap } from '../useFocusTrap';

function TrapHarness({ active = true }: { active?: boolean }) {
  const containerRef = useFocusTrap(active);
  return (
    <div>
      <button data-testid="before">Before</button>
      <div ref={containerRef as any}>
        <button data-testid="first">First</button>
        <button data-testid="last">Last</button>
      </div>
      <button data-testid="after">After</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('keeps focus within container when active', () => {
    const { getByTestId } = render(<TrapHarness active={true} />);

    const first = getByTestId('first');
    const last = getByTestId('last');

    // Focus last and press Tab -> should cycle to first
    last.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(tabEvent);
    expect(document.activeElement).toBe(first);

    // Focus first and press Shift+Tab -> should go to last
    first.focus();
    const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
    document.dispatchEvent(shiftTab);
    expect(document.activeElement).toBe(last);
  });
});

