/**
 * Marketing Chat Context
 * Manages the open/closed state and display mode of the marketing chat across page navigation
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { debug } from '../utils/debugUtils';

export type DisplayMode = 'side-panel' | 'center-modal';

const DISPLAY_MODE_STORAGE_KEY = 'marketing_chat_display_mode';
const DEFAULT_DISPLAY_MODE: DisplayMode = 'side-panel';

interface MarketingChatContextType {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  navigateWithChat: (url: string) => void;
}

const MarketingChatContext = createContext<MarketingChatContextType | undefined>(undefined);

export const useMarketingChat = () => {
  const context = useContext(MarketingChatContext);
  if (!context) {
    throw new Error('useMarketingChat must be used within MarketingChatProvider');
  }
  return context;
};

interface MarketingChatProviderProps {
  children: ReactNode;
}

/**
 * Validates that a value is a valid DisplayMode
 */
function isValidDisplayMode(value: unknown): value is DisplayMode {
  return value === 'side-panel' || value === 'center-modal';
}

export const MarketingChatProvider: React.FC<MarketingChatProviderProps> = ({ children }) => {
  // Initialize isOpen state from sessionStorage to persist across navigation
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = sessionStorage.getItem('marketing-chat-open');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // Initialize displayMode from localStorage (persists across sessions)
  const [displayMode, setDisplayModeState] = useState<DisplayMode>(() => {
    try {
      const stored = localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
      if (stored && isValidDisplayMode(stored)) {
        return stored;
      }
    } catch {
      // localStorage may be disabled
    }
    return DEFAULT_DISPLAY_MODE;
  });

  // Persist isOpen to sessionStorage whenever it changes
  React.useEffect(() => {
    try {
      sessionStorage.setItem('marketing-chat-open', String(isOpen));
    } catch {
      // Ignore sessionStorage errors (e.g., in private browsing mode)
    }
  }, [isOpen]);

  // Persist displayMode to localStorage whenever it changes
  React.useEffect(() => {
    try {
      localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, displayMode);
    } catch {
      // Ignore localStorage errors
    }
  }, [displayMode]);

  // Cross-tab synchronization for displayMode
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === DISPLAY_MODE_STORAGE_KEY && e.newValue && isValidDisplayMode(e.newValue)) {
        setDisplayModeState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Manage body class for chat modal state
  React.useEffect(() => {
    if (isOpen) {
      debug.log('[MarketingChatContext] Opening chat, adding body class');
      document.body.classList.add('marketing-chat-open');
    } else {
      debug.log('[MarketingChatContext] Closing chat, removing body class');
      document.body.classList.remove('marketing-chat-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('marketing-chat-open');
    };
  }, [isOpen]);

  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Set display mode with localStorage persistence
  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
  }, []);

  /**
   * Navigate to a URL while keeping chat open in side-panel mode
   * This enables "co-browsing" where users can explore the site with chat assistance
   */
  const navigateWithChat = useCallback((url: string) => {
    // Switch to side-panel mode for co-browsing experience
    setDisplayModeState('side-panel');

    // Navigate using window.location (works for all marketing pages)
    window.location.href = url;
  }, []);

  const value = {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    displayMode,
    setDisplayMode,
    navigateWithChat,
  };

  return <MarketingChatContext.Provider value={value}>{children}</MarketingChatContext.Provider>;
};
