// Layout types for expandable panels

export type RightPanelType = 'onboarding' | 'chat';

export interface LayoutState {
  // Left Sidebar
  leftSidebarOpen: boolean; // mobile drawer open
  leftSidebarCollapsed: boolean; // desktop collapsed state

  // Right Panel
  rightPanelOpen: boolean; // mobile bottom sheet/drawer open
  rightPanelCollapsed: boolean; // desktop collapsed state
  activeRightPanel: RightPanelType | null;

  // UI
  isAnimating: boolean;
  isMobile: boolean;
}

export interface LayoutActions {
  // Left Sidebar
  openLeftSidebar: () => void;
  closeLeftSidebar: () => void;
  toggleLeftSidebar: () => void;

  // Right Panel
  openRightPanel: (panel?: RightPanelType) => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
  setActiveRightPanel: (panel: RightPanelType) => void;

  // Utilities
  closeAllPanels: () => void;
  resetLayout: () => void;
}

export interface LayoutContextValue {
  state: LayoutState;
  actions: LayoutActions;
}
