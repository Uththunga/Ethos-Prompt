# Animation Performance Best Practices (60fps)

## Principles
- Animate transform and opacity only (translate/scale/rotate, fade)
- Avoid layout-affecting props (width/height/margin/left/top)
- Promote layers sparingly (`will-change: transform` during interaction)
- Use easing: `cubic-bezier(0.4, 0, 0.2, 1)` and 200–300ms durations
- Respect `prefers-reduced-motion: reduce`

## CSS Techniques
- `will-change: transform;` for interactive elements
- `transform: translateZ(0);` to promote layer (avoid overuse)
- `contain: layout style paint;` on panels for isolation
- `content-visibility: auto;` for off-screen, non-interactive content

## React Patterns
- Memoize heavy children; avoid unnecessary re-renders
- Lazy load panel content (tabs, charts)
- Defer non-critical work via requestIdleCallback (fallback to setTimeout)

## Framer Motion Notes
- Prefer variants/transform-based animations
- Avoid animating layout (`layout` prop) unless necessary
- Disable animations for reduced motion users

## Monitoring
- Chrome DevTools Performance: FPS and main-thread blocking
- Lighthouse: CLS, TBT
- React Profiler: render waterfalls

## Targets
- Animations: 60fps
- Input delay: <100ms
- CLS during panel transitions: <0.02 (well under 0.1)

