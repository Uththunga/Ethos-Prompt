# Modern Dashboard Patterns — Expandable Panels Research

## Overview
This document analyzes 10 modern SaaS dashboards to extract best practices for expandable left sidebars and right action panels across desktop and mobile. Findings directly inform the modernization of our dashboard layout.

## Products Reviewed
- Vercel Dashboard (vercel.com)
- Linear (linear.app)
- Notion (notion.so)
- Stripe Dashboard (dashboard.stripe.com)
- Tailwind UI (tailwindui.com)
- GitHub (github.com)
- Figma (figma.com)
- Retool (retool.com)
- Supabase (supabase.com)
- Railway (railway.app)

## Common Patterns
- Sidebar widths:
  - Expanded: 240–320px (most common: 272–288px)
  - Collapsed: 56–72px (icons only)
- Right panel widths:
  - Expanded: 320–420px (common: 360–400px)
  - Collapsed: 56–72px (icons/rail)
- Animations:
  - Duration: 200–300ms
  - Easing: cubic-bezier(0.4, 0, 0.2, 1)
  - GPU-accelerated properties: transform, opacity
- Mobile:
  - Left sidebar becomes overlay drawer (from left)
  - Right panel becomes bottom sheet (60–90vh) or right drawer
  - Swipe gestures supported on some (Linear, Figma-like tools)
- State persistence:
  - localStorage for collapsed/expanded state
  - URL params for deep linking to panel content (optional)
- Accessibility:
  - Toggle buttons with aria-expanded, aria-controls
  - Focus trap in drawers/sheets
  - Escape to close; keyboard shortcuts (Cmd/Ctrl+B, K)

## Highlights by Product
- Vercel: Smooth transform-based sidebar, persistent collapse state, clear rail icons.
- Linear: Exceptional keyboard support; fast 200ms animations; minimal layout shift.
- Notion: Resizable sidebar; elegant overlay behavior on smaller screens.
- Stripe: Clear right detail panels; lazy-load heavy content.
- Tailwind UI: Reference implementations for drawers/bottom sheets with a11y.
- GitHub: Predictable mobile drawer; maintains context after close.
- Figma: Right panel sections as tabs; strong visual affordances for collapsed rail.
- Retool: Complex dashboards; maintains performance with virtualized content.
- Supabase: Modern transitions; strong color and focus styles.
- Railway: Minimalism; avoids layout jumps by using transforms.

## Recommendations
- Adopt widths: Sidebar 280px/64px; Right panel 384px/64px (aligns with our plan)
- Use transform translateX/opacity for transitions; avoid animating width/margins
- Persist collapsed states in localStorage; reset open states on mobile
- Provide keyboard shortcuts and robust a11y attributes
- Use bottom sheet for right panel on mobile with drag handle and swipe-down

## References & Screenshots
Capture example screenshots and store in `docs/research/screenshots/` (omitted here).
