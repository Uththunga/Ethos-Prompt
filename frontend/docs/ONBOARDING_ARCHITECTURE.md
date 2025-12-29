# EthosPrompt Onboarding System — Architecture (Phase 3)

This document describes the Phase 3 redesign of the Guided Tour system into a comprehensive, multi‑path, interactive onboarding system with Firestore persistence and analytics.

## Goals
- Progressive, role-based onboarding with selectable paths
- Interactive tooltips with clear progress and controls
- Cross-device persistence and resume
- Contextual, adaptive help suggestions
- Analytics for completion rates, drop-offs, and engagement

## High-level Architecture
```
App
└─ HelpProvider (existing)
   ├─ GuidedOnboarding (NEW)  ← Welcome modal + path selection + contextual suggestions
   ├─ TooltipRenderer (existing)
   └─ TourRenderer (enhanced) ← Progress, skip, analytics hooks

Services
└─ OnboardingService (NEW)
   ├─ getOnboardingState / updateOnboardingState
   ├─ markTourStart / markTourComplete
   └─ recordEvent (analytics)

Data
└─ Firestore
   ├─ onboarding/{uid}               # OnboardingState
   └─ onboardingEvents/{autoId}      # OnboardingEvent
```

## TypeScript Interfaces
```ts
// Onboarding paths (role-based)
export type OnboardingPathId = 'quick-start' | 'prompt-creator' | 'rag-expert' | 'api-developer';

export interface OnboardingState {
  userId: string;
  hasSeenWelcome: boolean;
  selectedPath?: OnboardingPathId;
  currentTourId?: string | null;
  currentStep?: number; // 0-based
  completedTours: string[];
  dismissedSuggestions: string[]; // suggestion keys
  analytics: {
    startedAt?: number;     // ms epoch
    completedAt?: number;   // ms epoch
    totalTimeSpentMs?: number;
    dropOff?: { tourId: string; stepIndex: number } | null;
  };
  updatedAt: number; // ms epoch
}

export interface OnboardingEvent {
  userId: string;
  type:
    | 'path_selected' | 'tour_started' | 'step_viewed' | 'tour_completed' | 'tour_skipped'
    | 'suggestion_shown' | 'suggestion_accepted' | 'suggestion_dismissed';
  pathId?: OnboardingPathId;
  tourId?: string;
  stepIndex?: number;
  metadata?: Record<string, any>;
  ts: number; // ms epoch
}

export interface OnboardingPathDefinition {
  id: OnboardingPathId;
  name: string;
  description: string;
  initialRoute: string;   // where to navigate before starting
  tourId: string;         // existing Tour id from HelpSystem (Phase 2)
  icon?: React.ReactNode; // optional UI icon
}
```

## Firestore Schema
- Document: `onboarding/{uid}` → OnboardingState
- Collection: `onboardingEvents` (top-level) → OnboardingEvent

Security considerations:
- onboarding/{uid}: read/write only by `request.auth.uid == uid`
- onboardingEvents: write by authenticated users; read restricted to admins (analytics)

## Component Responsibilities
- GuidedOnboarding
  - Detect first-time users (hasSeenWelcome=false) and show modal
  - Present path cards; on select → update state, navigate, start tour, record events
  - Listen to route changes and show contextual suggestions (debounced)
- TourRenderer (enhanced)
  - Show step progress bar, Next/Back/Skip/Finish
  - Persist progress on step change; record analytics

## Integration with HelpSystem
- Use `useHelp()` to call `startTour(tourId)`, `nextTourStep`, `endTour`
- When tour starts/ends/steps change → call OnboardingService to persist and `recordEvent`

## Onboarding Paths (initial)
- quick-start → route `/dashboard`, tour `first-time-user`
- prompt-creator → route `/dashboard/prompts`, tour `prompt-creation`
- rag-expert → route `/dashboard/documents`, tour `document-upload`
- api-developer → route `/dashboard/executions`, tour `first-time-user` (initial; can be extended later)

## Persistence & Resume
- Load `onboarding/{uid}` on app start
- If `currentTourId` is set and tour not active → offer to resume
- Always mirror last known progress to localStorage for offline; reconcile to Firestore on reconnect

## Analytics Events
- path_selected, tour_started, step_viewed, tour_completed, tour_skipped
- suggestion_shown, suggestion_accepted, suggestion_dismissed
- Stored in `onboardingEvents` with timestamps for time-based analysis

## How to Add a New Path or Tour
1) Define a new Tour (or reuse existing) in HelpSystem TOURS
2) Add a new `OnboardingPathDefinition` in GuidedOnboarding
3) Optionally add contextual suggestion rules keyed by route/action
4) No service changes required; events and state persistence are generic

## Example Usage
```ts
// Start a selected path
await OnboardingService.updateOnboardingState(uid, {
  selectedPath: 'prompt-creator',
  currentTourId: 'prompt-creation',
  currentStep: 0,
});
await OnboardingService.recordEvent({ userId: uid, type: 'path_selected', pathId: 'prompt-creator', ts: Date.now() });
startTour('prompt-creation');
```

## Performance & Cost
- Single small onboarding doc per user; lightweight
- Events are append-only; consider periodic aggregation for admin dashboards

## Accessibility
- Modal focus trap, ESC to close
- Buttons keyboard accessible; visible focus states
- Tooltip controls operable via keyboard (Arrow keys, Enter, Space, ESC)

## Open Questions / Future Work
- Dedicated API Developer tour once API UI is finalized
- Admin analytics dashboard (aggregation, charts)
- A/B experimentation for different path sequences

