# Guided Tour System Investigation Report

**Date:** 2025-01-24  
**Status:** Investigation Complete ✅  
**Priority:** High  

---

## Executive Summary

The "Start Guided Tour" feature in the EthosPrompt help center is **partially broken** due to:
1. **Missing DOM selectors** - Tour targets reference elements that don't exist or have wrong `data-help` attributes
2. **Broken positioning logic** - TourRenderer doesn't properly position tooltips relative to target elements
3. **No navigation handling** - Tours don't navigate to correct pages or wait for elements to load
4. **Limited functionality** - Current system lacks modern onboarding features (progress tracking, skip/resume, contextual help)

---

## 🔍 Investigation Findings

### 1. Tour Definitions (HelpSystem.tsx)

**Location:** `frontend/src/components/help/HelpSystem.tsx` (lines 69-185)

**Defined Tours:**
- `first-time-user` (5 steps) - General dashboard tour
- `prompt-creation` (4 steps) - Prompt editor tour
- `document-upload` (3 steps) - Document upload tour

**Article Mappings (HelpArticleView.tsx):**
```typescript
const ARTICLE_TOUR_MAPPING = {
  'quick-start-guide': { tourId: 'first-time-user', stepCount: 5 },
  'document-upload-guide': { tourId: 'document-upload', stepCount: 3 },
  'creating-first-prompt': { tourId: 'prompt-creation', stepCount: 4 },
};
```

### 2. Broken Element Selectors

#### Tour: `first-time-user`

| Step ID | Target Selector | Status | Actual Location |
|---------|----------------|--------|-----------------|
| `welcome` | `body` | ✅ Works | N/A (generic) |
| `navigation` | `[data-help="main-navigation"]` | ❌ **MISSING** | Sidebar has no data-help attribute |
| `create-prompt` | `[data-help="create-prompt-button"]` | ✅ **EXISTS** | `/prompts` page (line 189) |
| `upload-documents` | `[data-help="upload-documents"]` | ✅ **EXISTS** | `/documents` page (line 117) |
| `help-center` | `[data-help="help-button"]` | ✅ **EXISTS** | HelpButton component (line 420) |

**Issue:** Step 2 (`navigation`) targets `[data-help="main-navigation"]` which doesn't exist in the sidebar.

#### Tour: `prompt-creation`

| Step ID | Target Selector | Status | Actual Location |
|---------|----------------|--------|-----------------|
| `prompt-title` | `[data-help="prompt-title"]` | ❌ **MISSING** | Prompt editor form |
| `prompt-content` | `[data-help="prompt-content"]` | ❌ **MISSING** | Prompt editor textarea |
| `prompt-variables` | `[data-help="prompt-variables"]` | ❌ **MISSING** | Variables section |
| `prompt-settings` | `[data-help="prompt-settings"]` | ❌ **MISSING** | Model settings panel |

**Issue:** ALL selectors missing. Prompt editor components don't have data-help attributes.

#### Tour: `document-upload`

| Step ID | Target Selector | Status | Actual Location |
|---------|----------------|--------|-----------------|
| `upload-area` | `[data-help="upload-area"]` | ❌ **MISSING** | DocumentUpload component |
| `processing-status` | `[data-help="processing-status"]` | ❌ **MISSING** | Document list/status area |
| `document-search` | `[data-help="document-search"]` | ❌ **MISSING** | Search input |

**Issue:** ALL selectors missing. Document upload page lacks data-help attributes.

### 3. TourRenderer Positioning Issues

**Location:** `frontend/src/components/help/HelpSystem.tsx` (lines 350-412)

**Current Implementation:**
```typescript
const TourRenderer: React.FC = () => {
  const { currentTour, tourStep, nextTourStep, previousTourStep, endTour } = useHelp();
  
  if (!currentTour) return null;
  
  const tour = TOURS[currentTour];
  const step = tour.steps[tourStep];
  
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="absolute bg-white rounded-lg shadow-xl p-6 max-w-sm">
        {/* Tour content */}
      </div>
    </div>
  );
};
```

**Problems:**
1. ❌ Tooltip has `position: absolute` but **no top/left/right/bottom** values
2. ❌ Doesn't query for `step.target` element
3. ❌ Doesn't calculate position based on target element
4. ❌ Doesn't highlight target element
5. ❌ Doesn't scroll target element into view

**Result:** Tooltip appears at top-left corner (0, 0) instead of near target element.

### 4. Navigation Issues

**Problem:** Tours don't navigate to the correct pages before showing steps.

**Example:**
- User clicks "Start Guided Tour" on "Creating Your First Prompt" article
- Tour starts with `prompt-creation` tour
- Step 1 targets `[data-help="prompt-title"]` on `/prompts/create` page
- **But user is still on `/dashboard/help` page!**
- Element doesn't exist → Tour shows tooltip at (0, 0)

**Missing Logic:**
- No route navigation before tour starts
- No waiting for page load
- No element existence check
- No fallback if element not found

### 5. User Experience Issues

**Current Limitations:**
1. ❌ No welcome modal for first-time users
2. ❌ No progress indicator (e.g., "Step 2 of 5")
3. ❌ No "Skip Tour" option
4. ❌ No "Resume Later" functionality
5. ❌ No contextual help based on user actions
6. ❌ No multiple tour paths (beginner vs advanced)
7. ❌ No state persistence (localStorage only, not Firestore)
8. ❌ No analytics/tracking
9. ❌ No adaptive tours based on user progress
10. ❌ No interactive elements (users just read, don't do)

---

## 📋 Root Cause Analysis

### Why Tours Are Broken

1. **Incomplete Implementation:**
   - Tours were defined but DOM elements were never tagged with `data-help` attributes
   - TourRenderer was scaffolded but positioning logic was never implemented

2. **No Integration Testing:**
   - Tours were never tested end-to-end
   - No validation that target elements exist

3. **Missing Navigation Logic:**
   - Tours assume user is already on the correct page
   - No automatic navigation or page transitions

4. **Positioning Algorithm Missing:**
   - TourRenderer doesn't calculate tooltip position
   - No element highlighting or focus management

---

## 🎯 Recommended Fixes (Phase 2)

### Fix 1: Add Missing data-help Attributes

**Files to Update:**
- `frontend/src/components/layout/Sidebar.tsx` - Add `data-help="main-navigation"`
- `frontend/src/components/prompts/PromptEditor.tsx` - Add all prompt-related attributes
- `frontend/src/components/documents/DocumentUpload.tsx` - Add upload-related attributes
- `frontend/src/pages/Documents.tsx` - Add document management attributes

### Fix 2: Implement TourRenderer Positioning

**Algorithm:**
```typescript
1. Query for target element: document.querySelector(step.target)
2. If not found, show fallback message or skip step
3. Get element bounding rect: element.getBoundingClientRect()
4. Calculate tooltip position based on step.position:
   - 'top': above element
   - 'bottom': below element
   - 'left': left of element
   - 'right': right of element
5. Scroll element into view: element.scrollIntoView({ behavior: 'smooth', block: 'center' })
6. Highlight element with spotlight effect
7. Position tooltip with arrow pointing to element
```

### Fix 3: Add Navigation Logic

**Implementation:**
```typescript
const startTour = (tourId: string) => {
  const tour = TOURS[tourId];
  const firstStep = tour.steps[0];
  
  // Navigate to correct page based on tour
  if (tourId === 'prompt-creation') {
    navigate('/prompts/create');
  } else if (tourId === 'document-upload') {
    navigate('/documents');
  }
  
  // Wait for navigation and element to exist
  setTimeout(() => {
    setCurrentTour(tourId);
    setTourStep(0);
  }, 500);
};
```

---

## 🚀 Advanced Onboarding System Design (Phase 3)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Onboarding System                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Welcome    │  │  Tour Path   │  │   Progress   │      │
│  │    Modal     │→ │  Selection   │→ │   Tracking   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Interactive Tour Engine                    │   │
│  │  • Element highlighting                              │   │
│  │  • Smart positioning                                 │   │
│  │  • Navigation handling                               │   │
│  │  • Action detection                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Contextual  │  │   Analytics  │  │    State     │      │
│  │     Help     │  │   Tracking   │  │ Persistence  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Welcome Modal** - Engaging first-time user experience
2. **Multiple Tour Paths** - Role-based onboarding (Quick Start, Prompt Creator, RAG Expert, API Developer)
3. **Interactive Tooltips** - Next/Skip/Previous controls with progress indicators
4. **Smart Detection** - Detect user actions and adapt tour accordingly
5. **State Persistence** - Firestore-based cross-device progress tracking
6. **Analytics** - Track completion rates, drop-offs, and engagement
7. **Contextual Help** - Show relevant tips based on current page/action
8. **Resume Capability** - Users can pause and resume tours anytime

---

## 📊 Success Metrics

### Phase 2 (Fixes)
- ✅ All tour selectors exist and are valid
- ✅ Tours navigate to correct pages
- ✅ Tooltips position correctly relative to target elements
- ✅ All 3 tours work end-to-end without errors

### Phase 3 (Advanced System)
- 🎯 70%+ first-time users complete at least one tour
- 🎯 50%+ users complete full onboarding
- 🎯 <10% drop-off rate per tour step
- 🎯 90%+ user satisfaction with onboarding experience

---

## 🔗 Related Files

- `frontend/src/components/help/HelpSystem.tsx` - Tour definitions and rendering
- `frontend/src/components/help/HelpArticleView.tsx` - "Start Guided Tour" button
- `frontend/src/components/help/GuidedOnboarding.tsx` - Onboarding component
- `frontend/src/data/help/articles.json` - Help articles with tour mappings
- `frontend/src/pages/Prompts.tsx` - Prompt page with data-help attributes
- `frontend/src/pages/Documents.tsx` - Documents page with data-help attributes

---

**Next Steps:** Proceed to Phase 2 (Fix Existing Issues)

