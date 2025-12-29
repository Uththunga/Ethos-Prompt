# Performance Measurement Guide (Layout Animations)

This guide explains how to measure FPS and diagnose performance for the Sidebar, Right Panel, Mobile Drawer, and Bottom Sheet animations using Chrome DevTools.

## Prerequisites
- Chrome (latest stable)
- Built app (recommended) or Vite dev server
- A page where you can trigger:
  - Sidebar collapse/expand
  - Right Panel collapse/expand and panel switching
  - Mobile Drawer and Bottom Sheet (use device emulation or a real device)

## Quick FPS Indicators
1) Rendering FPS Meter
- Open DevTools (F12) → Command Palette (Ctrl/Cmd+Shift+P) → type “Rendering” → open the “Rendering” panel.
- Enable “FPS meter”.
- Trigger an animation; the meter shows frame rate and GPU/CPU timing.

2) Performance Insights (fast overview)
- DevTools → Performance → “Performance insights” tab
- Click “Start recording”, perform the interaction, then “Stop”.
- Review “Interaction to Next Paint (INP)” and breakdown summary.

## Detailed Recording (Performance Tab)
1) Open DevTools → Performance tab
2) Click the Record button (●)
3) Perform the sequence (one at a time for clean traces):
   - Toggle Sidebar collapsed/expanded
   - Toggle Right Panel collapsed/expanded; switch panel tabs
   - On mobile viewport (<768px), open/close Drawer and Bottom Sheet; swipe gestures
4) Click Stop (■)
5) Analyze the trace:
   - FPS graph (top): Look for dips below 60 fps
   - Main thread: check for long tasks (>50ms)
   - Frames track: ensure consistent frame intervals during animation
   - “Timings” and “Experience” tracks: look for INP/LCP issues
   - Summary panel: Layout, Style Recalculation, Scripting times; GPU vs CPU cost

## What to Look For
- 60 fps target during animations (green bars in Frames track)
- Minimal layout/reflow during animations (we animate transform/opacity only)
- Short tasks: avoid blocking main thread >50ms
- Low Style and Layout time; heavy work should be offloaded or batched
- No “Forced reflow” warnings in Performance insights

## Recommended Setup for Repeatable Tests
- Use a production build (npm run build && npm run preview) for representative results.
- Disable React DevTools and Redux/Query devtools when profiling.
- Close extra tabs/apps to reduce noise.
- Use the same viewport size and the same test sequence each run.

## Capturing Evidence
- In Performance tab, click the camera icon in the toolbar to capture a screenshot of the frame timeline.
- Export trace: Click “Save profile…” (3-dot menu in the Performance panel) and store the .json for regression comparison.

## Device Emulation & Throttling
- DevTools → Toggle device toolbar (Ctrl/Cmd+Shift+M) → select iPhone/Android presets
- Network throttling: set to “Fast 3G” to test slow networks (for initial load)
- CPU throttling: set to 4×/6× to simulate low-end devices

## Pass/Fail Criteria
- Animations sustain near-60 fps on desktop without CPU throttling
- With 4× CPU throttle, animations remain usable (>30 fps) and input responsive
- No visible jank or stutter; no layout thrash spikes during animations
- CLS < 0.1 during panel transitions

## Tips to Fix Bottlenecks
- Ensure only transform/opacity are animated (avoid width/left/top during the animation)
- Add `will-change: transform` only while animating; remove afterward
- Memoize heavy React subtrees, use React.lazy and Suspense for non-critical content
- Defer non-essential work to idle callbacks or after transitionend
- Batch state updates; avoid synchronous layout reads during animation frames
- Reduce shadow and blur effects during transitions on low-end devices

## Reporting Template
- Test target: (component + action)
- Environment: OS, Chrome version, device/emulator, throttling settings
- Steps: detailed interaction steps
- Metrics: observed fps range, INP, long tasks (count and max), layout/style costs
- Evidence: screenshots/video, saved trace (.json)
- Summary: pass/fail + recommended improvements

