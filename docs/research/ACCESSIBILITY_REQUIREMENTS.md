# Accessibility Requirements — Expandable Panels (WCAG 2.1 AA)

## Keyboard
- Tab order: predictable; no traps
- Shortcuts: Cmd/Ctrl+B (toggle sidebar), Cmd/Ctrl+K (toggle right panel), Esc (close)
- Focus management: trap focus in drawers/sheets; return focus to trigger on close
- Focus visible: 2px outline, 3:1 contrast minimum

## Semantics & ARIA
- Use semantic elements: `nav`, `aside`, `main`, `button`
- `aria-expanded`, `aria-controls` on toggle buttons
- `aria-hidden` on hidden drawers/panels
- Live regions for state changes ("Right panel opened")

## Motion
- Honor `prefers-reduced-motion`
- Do not rely on motion for meaning

## Touch Targets
- Minimum 44x44px on mobile for all interactive elements

## Color & Contrast
- 4.5:1 for normal text, 3:1 for large text and UI components

## Testing
- axe DevTools
- NVDA/JAWS (Windows), VoiceOver (macOS/iOS)
- Keyboard-only navigation
- Screen-reader announcements for open/close events

