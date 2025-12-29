import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onToggleSidebar?: () => void; // Cmd/Ctrl+B
  onToggleRightPanel?: () => void; // Cmd/Ctrl+K
  onEscape?: () => void; // Escape
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const metaOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (metaOrCtrl && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        options.onToggleSidebar?.();
        return;
      }

      if (metaOrCtrl && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        options.onToggleRightPanel?.();
        return;
      }

      if (e.key === 'Escape') {
        options.onEscape?.();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options]);
}

