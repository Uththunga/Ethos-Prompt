import React from 'react';

export interface NavItem {
  path: string;
  label: string;
  exact?: boolean;
  ariaLabel?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
}

export interface NavigationProps {
  className?: string;
  onNavigate?: () => void;
}