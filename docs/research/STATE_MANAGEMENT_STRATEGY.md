# State Management Strategy — Expandable Panels

## Goals
- Persist user preferences (collapsed states, active panel)
- Keep runtime UI state responsive to breakpoint changes
- Avoid vendor lock-in; minimal dependencies

## Chosen Approach: Hybrid
- Context API for runtime state + actions
- localStorage for persisted preferences (collapsed states, last panel)
- Mobile defaults override (always closed by default)
- Optional URL params for deep linking (future)

## Persisted Keys (localStorage)
- `leftSidebarCollapsed: boolean`
- `rightPanelCollapsed: boolean`
- `activeRightPanel: 'profile' | 'api-keys' | 'notifications' | 'privacy' | 'billing' | 'onboarding' | 'chat'`

## Not Persisted (runtime only)
- `leftSidebarOpen` (mobile drawer)
- `rightPanelOpen` (mobile bottom sheet/drawer)
- `isAnimating`, hover/focus states

## API
- State shape: `LayoutState`
- Actions: `open/close/toggle` for both panels, `setActiveRightPanel`, `closeAllPanels`, `resetLayout`

## Edge Cases
- On breakpoint change to desktop, close mobile drawers
- On reduce-motion, disable transitions
- Handle SSR/No-Storage with try/catch guards

## Security
- Only store non-sensitive UI prefs; never store secrets


