# Gesture Library Evaluation — Swipe for Panels

## Candidate Libraries
- react-swipeable (lightweight ~5KB)
- framer-motion (already in project; gestures + animations)
- @use-gesture/react (rich gestures; moderate size)
- hammer.js (legacy but solid)
- Native touch events (0KB; custom)

## Evaluation Criteria
- Edge swipe support (left/right 0–50px zones)
- Performance (60fps, low GC pressure)
- Configurability (delta, velocity, passive listeners)
- DX and bundle impact
- Accessibility impact (no interference with SR/keyboard)
- Browser support (iOS Safari, Android Chrome, Firefox, Edge)

## Findings
- react-swipeable: Easiest to integrate; clean API; solid performance; no dependencies.
- framer-motion: Powerful; may over-animate; heavier; already in codebase.
- use-gesture: Very capable; heavier mental model; overkill for simple edge swipes.
- hammer.js: Stable but dated; not tree-shakeable.
- Native: Maximum control; minimal bundle; more code to maintain.

## Recommendation
- Short term: Implement a custom `useSwipeGestures` with native touch events (no new deps).
- Optional: If richer gestures needed, consider `react-swipeable` (requires install approval).

## API Proposal (Implemented)
- `useSwipeGestures({ onSwipeLeft, onSwipeRight, onSwipeDown, edge: 'left' | 'right' | 'none', threshold: 50, velocity: 0.3 })`
- Returns `handlers` props (onTouchStart/Move/End) to spread onto target.
- Provide a separate `EdgeZone` 12–16px overlay for global edge detection.

## Notes
- Always use passive listeners to avoid scroll blocking.
- Prefer swipe to augment, not replace, button interactions.
- Respect prefers-reduced-motion.

