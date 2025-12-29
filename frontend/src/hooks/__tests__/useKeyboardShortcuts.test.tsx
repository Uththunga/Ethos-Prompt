import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

function HookHarness({ onToggleSidebar, onToggleRightPanel, onEscape }: any) {
  useKeyboardShortcuts({ onToggleSidebar, onToggleRightPanel, onEscape });
  return <div>harness</div>;
}

describe('useKeyboardShortcuts', () => {
  it('triggers onToggleSidebar with Cmd/Ctrl+B', () => {
    const onToggleSidebar = vi.fn();
    const onToggleRightPanel = vi.fn();
    const onEscape = vi.fn();
    render(
      <HookHarness
        onToggleSidebar={onToggleSidebar}
        onToggleRightPanel={onToggleRightPanel}
        onEscape={onEscape}
      />
    );

    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const event = new KeyboardEvent('keydown', {
      key: 'b',
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
    expect(onToggleRightPanel).not.toHaveBeenCalled();
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('triggers onToggleRightPanel with Cmd/Ctrl+K', () => {
    const onToggleSidebar = vi.fn();
    const onToggleRightPanel = vi.fn();
    const onEscape = vi.fn();
    render(
      <HookHarness
        onToggleSidebar={onToggleSidebar}
        onToggleRightPanel={onToggleRightPanel}
        onEscape={onEscape}
      />
    );

    const isMac = navigator.platform.toUpperCase().includes('MAC');
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: !isMac,
      metaKey: isMac,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(onToggleRightPanel).toHaveBeenCalledTimes(1);
  });

  it('triggers onEscape with Escape', () => {
    const onEscape = vi.fn();
    render(<HookHarness onEscape={onEscape} />);
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    window.dispatchEvent(event);
    expect(onEscape).toHaveBeenCalledTimes(1);
  });
});

