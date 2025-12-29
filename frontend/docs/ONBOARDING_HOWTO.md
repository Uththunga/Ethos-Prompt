# EthosPrompt Onboarding & Guided Tours — How To Add/Modify

This guide explains how to add new guided tours, onboarding paths, and contextual suggestions in the redesigned onboarding system.

## Key Files
- src/components/help/HelpSystem.tsx — Tours, renderer, context, and contextual suggestions
- src/components/help/GuidedOnboarding.tsx — Welcome modal + path selection
- src/services/onboardingService.ts — Firestore persistence + analytics events
- src/components/layout/Sidebar.tsx, prompts/documents components — Target elements with data-help attributes

## 1) Define a New Tour
1. Open src/components/help/HelpSystem.tsx
2. Add a new entry in the TOURS constant:

```ts
const TOURS: Record<string, Tour> = {
  ...,
  "my-new-tour": {
    title: "My New Tour",
    steps: [
      { id: "step-1", title: "Title", content: "Explain", target: '[data-help="selector-1"]', position: 'right' },
      { id: "step-2", title: "Next",  content: "Explain", target: '[data-help="selector-2"]', position: 'bottom' },
    ],
  },
};
```

3. Ensure target elements exist in the UI and include a matching `data-help` attribute, e.g.:
```tsx
<div data-help="selector-1">...</div>
```

4. If the tour should start on a specific route, update `startTour` in HelpSystem to navigate correctly.

## 2) Add a Path Option (Optional)
To expose your tour in the Welcome modal path chooser:
1. Open src/components/help/GuidedOnboarding.tsx
2. Add an item to `ONBOARDING_PATHS`:
```ts
{ id: 'my-role', title: 'My Role', description: 'What this path covers', route: '/dashboard/xyz', tourId: 'my-new-tour' }
```
This will navigate and start your tour when selected. Firestore state and analytics are updated automatically.

## 3) Start a Tour Programmatically
Anywhere in the app:
```tsx
import { useHelp } from '@/components/help/HelpSystem';
...
const { startTour } = useHelp();
startTour('my-new-tour');
```
`startTour` will navigate to the appropriate page (if configured) and start step 0.

## 4) Persistence & Resume
OnboardingService stores state in Firestore:
- onboarding/{userId}: hasSeenWelcome, selectedPath, currentTourId, currentStep, completedTours, updatedAt
- onboardingEvents: analytics events

HelpSystem automatically resumes an in‑progress tour on mount by reading `currentTourId` and `currentStep`.

## 5) Analytics Events
OnboardingService emits:
- path_selected, tour_started, step_viewed, tour_completed, tour_skipped, suggestion_shown

Add new events by calling `OnboardingService.recordEvent({...})`.

## 6) Contextual Suggestions
HelpSystem shows route‑aware suggestions:
- Dashboard: welcomes and hints to press ?
- Prompts/Documents: suggests relevant tours

To extend: modify the route logic in HelpProvider where `showTooltip` is called.

## 7) A11y & UX Notes
- Press ? toggles help mode; Esc closes tour
- Tooltip step UI includes Back, Next, Skip, and Finish
- Ensure visible focus and semantic buttons

## 8) Testing Checklist
- Verify each tour step highlights the correct element
- Ensure tours navigate to the correct page before starting
- Confirm resume works: start a tour, reload, and see it continue
- Confirm analytics events appear in Firestore (onboardingEvents)
- Try each onboarding path from the Welcome modal

## 9) Troubleshooting
- If a step doesn’t position correctly, check the selector and that the element is mounted
- If the welcome modal doesn’t show for a user, ensure `hasSeenWelcome` is false in onboarding/{uid}
- If events aren’t recorded, verify Firebase config and user authentication

