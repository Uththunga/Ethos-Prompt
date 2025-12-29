# Tier 1 MVP Implementation Guide
## Step-by-Step Guide to Complete Critical Phase 2 Features

**Date:** 2025-10-03  
**Timeline:** 1-2 weeks (40-60 hours)  
**Goal:** Reach ~75% Phase 2 completion with functional MVP

---

## 📋 TASK LIST OVERVIEW

**Total Tasks:** 8 major components, 53 subtasks  
**Estimated Time:** 40-60 hours  
**Priority Order:** Sequential (1 → 8)

### Task Breakdown
1. **ExecutionHistory Component** (6-8 hours, 7 subtasks)
2. **CostTracker Component** (4-6 hours, 6 subtasks)
3. **ProcessingStatus Component** (6-8 hours, 6 subtasks)
4. **DocumentPreview Component** (4-6 hours, 6 subtasks)
5. **AnalyticsDashboard Component** (8-10 hours, 8 subtasks)
6. **Integration & Wiring** (4-6 hours, 6 subtasks)
7. **End-to-End Testing** (2-3 hours, 6 subtasks)
8. **Verification & Testing** (4-6 hours, 6 subtasks)

---

## 🎯 COMPONENT 1: ExecutionHistory (6-8 hours)

### Overview
Display past prompt executions with filtering, pagination, and detail view.

### File Location
`frontend/src/components/execution/ExecutionHistory.tsx`

### Subtasks

#### 1.1 Create Component Structure (0.5 hours)
**What to do:**
- Create new file with TypeScript interfaces
- Define `ExecutionHistoryProps` interface
- Import dependencies: React, React Query, UI components

**Code Template:**
```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Badge, Button } from '../marketing/ui';

interface ExecutionHistoryProps {
  userId?: string;
  promptId?: string;
  limit?: number;
}

interface Execution {
  id: string;
  promptId: string;
  promptTitle: string;
  model: string;
  timestamp: Date;
  cost: number;
  status: 'success' | 'error';
  output: string;
}

export const ExecutionHistory: React.FC<ExecutionHistoryProps> = ({ userId, promptId, limit = 10 }) => {
  // Component implementation
};
```

#### 1.2 Implement Data Fetching (1.5 hours)
**What to do:**
- Create `useExecutionHistory` custom hook
- Query Firestore `executions` collection
- Filter by userId, support pagination
- Handle loading and error states

**Integration Points:**
- Firestore collection: `executions`
- Filter: `where('userId', '==', userId)`
- Order: `orderBy('timestamp', 'desc')`
- Pagination: `limit(10)`, `startAfter(lastDoc)`

#### 1.3 Build Filter UI (1.5 hours)
**What to do:**
- Add date range picker (today, week, month, all)
- Add model selector dropdown
- Add prompt search input
- Update query on filter change

**UI Components:**
- `Select` for date range and model
- `Input` for search
- Update URL params with filters

#### 1.4 Create Execution List (2 hours)
**What to do:**
- Display executions in responsive table/cards
- Show: Prompt title, Model, Timestamp, Cost, Status
- Add loading skeleton and empty state
- Implement row click to expand

**Columns:**
- Prompt Title (link to prompt detail)
- Model (with FREE badge if applicable)
- Timestamp (formatted: "2 hours ago")
- Cost (formatted: "$0.00")
- Status (badge: success=green, error=red)
- Actions (delete button)

#### 1.5 Add Pagination (1 hour)
**What to do:**
- Previous/Next buttons
- Page numbers (1, 2, 3...)
- Items per page selector (10, 25, 50)
- Show "Showing 1-10 of 100"

#### 1.6 Implement Delete Action (1 hour)
**What to do:**
- Add delete button with confirmation dialog
- Call Firestore delete
- Show success/error toast
- Invalidate React Query cache

#### 1.7 Add Detail Modal (1.5 hours)
**What to do:**
- Create expandable row or modal
- Show full execution details
- Reuse `ExecutionResult` component for output
- Display metadata (tokens, duration, cost)

---

## 🎯 COMPONENT 2: CostTracker (4-6 hours)

### Overview
Display cost analytics with breakdowns by model and time period.

### File Location
`frontend/src/components/execution/CostTracker.tsx`

### Key Features
- Total cost summary (today, week, month, all time)
- Cost breakdown by model
- Free vs. paid comparison
- Simple bar chart visualization
- Export to CSV

### Data Source
- Firestore `executions` collection
- Aggregate `cost` field
- Group by `model` and `timestamp`

### Chart Library
- Use `recharts` for visualization
- Bar chart: X-axis = models, Y-axis = cost
- Color-code free (green) vs paid (blue) models

---

## 🎯 COMPONENT 3: ProcessingStatus (6-8 hours)

### Overview
Real-time document processing status tracking with polling.

### File Location
`frontend/src/components/documents/ProcessingStatus.tsx`

### Key Features
- Multi-step progress indicator (Upload → Extract → Chunk → Embed)
- Progress bar with percentage
- Real-time polling (every 2 seconds)
- Metadata display (chunks, tokens)
- Error handling with retry

### Backend Integration
- Endpoint: `get_document_status` Cloud Function
- Poll with React Query: `refetchInterval: 2000`
- Stop polling when status = 'complete' or 'error'

### Status States
- `pending` - Gray badge, "Waiting to process"
- `processing` - Blue badge, "Processing...", show progress
- `complete` - Green badge, "Complete", show metadata
- `error` - Red badge, "Error", show retry button

---

## 🎯 COMPONENT 4: DocumentPreview (4-6 hours)

### Overview
Display document metadata and content preview with PDF support.

### File Location
`frontend/src/components/documents/DocumentPreview.tsx`

### Key Features
- Metadata display (title, size, type, pages, words)
- Text preview (first 500 words with Read More)
- PDF preview using `react-pdf`
- Download button
- Chunk visualization

### Dependencies
```bash
npm install react-pdf pdfjs-dist
```

### PDF Preview
- Use `react-pdf` library
- Show first page thumbnail
- Add page navigation (prev/next)
- Fallback to text preview if PDF fails

---

## 🎯 COMPONENT 5: AnalyticsDashboard (8-10 hours)

### Overview
Comprehensive analytics dashboard with metrics, charts, and cost tracking.

### File Location
`frontend/src/components/analytics/AnalyticsDashboard.tsx`

### Sections

#### 5.1 Usage Metrics (Summary Cards)
- Total Prompts
- Total Executions
- Total Documents
- Success Rate

#### 5.2 Cost Analytics (Embedded CostTracker)
- Reuse CostTracker component
- Pass dateRange prop

#### 5.3 Popular Prompts
- Top 5 most executed prompts
- Show: Title, Execution count, Last executed, Avg cost

#### 5.4 Execution Statistics
- Total executions
- Success rate (%)
- Avg duration
- Total tokens used

#### 5.5 Executions Over Time Chart
- Line chart showing executions per day
- Use recharts LineChart
- Support date range filter

#### 5.6 Date Range Filter
- Last 7 days
- Last 30 days
- All time
- Updates all sections

---

## 🎯 COMPONENT 6: Integration & Wiring (4-6 hours)

### Overview
Connect all new components to existing app routes and navigation.

### Tasks

#### 6.1 Add ExecutionHistory to Execution Page
**File:** `frontend/src/pages/Execution.tsx` (or similar)
```typescript
import { ExecutionHistory } from '../components/execution/ExecutionHistory';

// In component:
<Tabs>
  <TabsList>
    <TabsTrigger value="execute">Execute</TabsTrigger>
    <TabsTrigger value="history">History</TabsTrigger>
  </TabsList>
  <TabsContent value="execute">
    <ExecutionForm />
  </TabsContent>
  <TabsContent value="history">
    <ExecutionHistory />
  </TabsContent>
</Tabs>
```

#### 6.2 Create Analytics Route
**File:** `frontend/src/App.tsx` (or router config)
```typescript
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';

// Add route:
<Route path="/analytics" element={<AnalyticsDashboard />} />
```

#### 6.3 Update Navigation
**File:** `frontend/src/components/layout/Sidebar.tsx`
```typescript
import { BarChart } from 'lucide-react';

// Add navigation item:
<NavItem to="/analytics" icon={<BarChart />}>
  Analytics
</NavItem>
```

#### 6.4 Integrate ProcessingStatus in DocumentList
**File:** `frontend/src/components/documents/DocumentList.tsx`
```typescript
import { ProcessingStatus } from './ProcessingStatus';

// In document row:
<TableCell>
  <ProcessingStatus documentId={doc.id} compact />
</TableCell>
```

#### 6.5 Add DocumentPreview Modal
```typescript
import { DocumentPreview } from './DocumentPreview';
import { Dialog } from '../marketing/ui/dialog';

const [previewDocId, setPreviewDocId] = useState<string | null>(null);

// In document row:
<Button onClick={() => setPreviewDocId(doc.id)}>Preview</Button>

// Modal:
<Dialog open={!!previewDocId} onOpenChange={() => setPreviewDocId(null)}>
  <DialogContent>
    {previewDocId && <DocumentPreview documentId={previewDocId} />}
  </DialogContent>
</Dialog>
```

---

## 🎯 COMPONENT 7: E2E Testing (2-3 hours)

### Overview
Create basic Playwright tests for critical user flows.

### Setup
```bash
npm install -D @playwright/test
npx playwright install
```

### Configuration
**File:** `playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

### Test File
**File:** `frontend/e2e/critical-flows.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('User can create a prompt', async ({ page }) => {
    await page.goto('/prompts');
    await page.click('text=Create Prompt');
    await page.fill('[name="title"]', 'Test Prompt');
    await page.fill('[name="content"]', 'This is a test prompt');
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=Test Prompt')).toBeVisible();
  });

  test('User can execute a prompt', async ({ page }) => {
    await page.goto('/prompts');
    await page.click('text=Test Prompt');
    await page.click('text=Execute');
    await page.click('button:has-text("Run")');
    await expect(page.locator('.execution-result')).toBeVisible();
  });

  test('User can upload a document', async ({ page }) => {
    await page.goto('/documents');
    await page.setInputFiles('input[type="file"]', 'test-fixtures/sample.pdf');
    await expect(page.locator('text=sample.pdf')).toBeVisible();
  });

  test('User can view analytics', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('text=Total Prompts')).toBeVisible();
    await expect(page.locator('text=Total Executions')).toBeVisible();
  });
});
```

---

## 🎯 COMPONENT 8: Verification & Testing (4-6 hours)

### Overview
Comprehensive testing and verification of all implementations.

### Checklist

#### 8.1 Run Frontend Tests
```bash
cd frontend
npm run test:ci
```
- Document pass/fail rate
- Fix any failing tests
- Aim for 80%+ coverage

#### 8.2 Run Backend Tests
```bash
cd functions
pytest
```
- Document pass/fail rate
- Verify endpoint tests exist
- Aim for 85%+ coverage

#### 8.3 Manual Component Testing
Test each component in browser:
- [ ] ExecutionHistory: Filters work, pagination works, delete works
- [ ] CostTracker: Data accurate, charts render, export works
- [ ] ProcessingStatus: Polling works, updates in real-time, retry works
- [ ] DocumentPreview: Preview displays, PDF works, download works
- [ ] AnalyticsDashboard: All sections display, charts render, filters work

#### 8.4 Backend Connectivity
Test all endpoints from browser dev tools:
- [ ] Prompt CRUD (8 endpoints)
- [ ] Execute endpoint
- [ ] Document endpoints (5)
- [ ] API key endpoints (4)

#### 8.5 End-to-End Flows
Test complete user journeys:
- [ ] Create prompt → Execute → View in history
- [ ] Upload document → View status → Preview
- [ ] View analytics → Check cost tracking → Export data

#### 8.6 Create Completion Report
Document:
- What's implemented and working
- Test results (pass rates, coverage)
- Known issues and bugs
- Deployment readiness
- Updated completion percentage (~75%)

---

## 📊 SUCCESS CRITERIA

### Tier 1 Complete When:
- ✅ All 5 components implemented and functional
- ✅ Components integrated into app navigation
- ✅ Basic E2E tests pass
- ✅ Manual testing shows all features work
- ✅ No critical bugs blocking usage
- ✅ Completion report shows ~75% Phase 2 complete

---

## 🚀 GETTING STARTED

### Day 1-2: Components 1-2 (10-14 hours)
- Implement ExecutionHistory
- Implement CostTracker
- Test both components

### Day 3-4: Components 3-4 (10-14 hours)
- Implement ProcessingStatus
- Implement DocumentPreview
- Test both components

### Day 5-6: Component 5 (8-10 hours)
- Implement AnalyticsDashboard
- Test dashboard

### Day 7-8: Integration & Testing (10-14 hours)
- Wire up all components
- Create E2E tests
- Run verification
- Create completion report

---

## 💡 TIPS FOR SUCCESS

### Do's ✅
- Follow the task order (1 → 8)
- Test each component before moving to next
- Commit frequently with clear messages
- Ask for help when stuck
- Update task status honestly

### Don'ts ❌
- Don't skip testing
- Don't mark tasks complete without verification
- Don't try to implement everything at once
- Don't ignore integration issues
- Don't over-engineer solutions

---

## 📝 TRACKING PROGRESS

Use the task management system to track progress:
- Mark subtasks complete as you finish them
- Update time estimates if needed
- Document blockers or issues
- Celebrate small wins!

---

**Ready to start? Begin with Task 1.1: Create ExecutionHistory component structure!** 🚀

