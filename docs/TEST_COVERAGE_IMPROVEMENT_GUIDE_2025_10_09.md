# Test Coverage Improvement Guide
**RAG Prompt Library Project**

**Date**: 2025-10-09  
**Goal**: Increase frontend test coverage from 70% to 80%+

---

## Current Status

### Coverage Thresholds (vitest.config.ts)

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

**Target**: Increase all thresholds to 80%

---

## Test Coverage Analysis

### Run Coverage Report

```bash
cd frontend
npm run test:coverage
```

**Expected Output**:
```
File                     | % Stmts | % Branch | % Funcs | % Lines
-------------------------|---------|----------|---------|--------
All files                |   70.12 |    68.45 |   71.23 |   69.87
 components/             |   75.34 |    72.11 |   76.45 |   74.89
 hooks/                  |   65.23 |    61.34 |   67.12 |   64.78
 services/               |   68.45 |    65.23 |   70.12 |   67.89
 utils/                  |   72.34 |    69.45 |   73.12 |   71.67
```

---

## Priority Areas for Improvement

### 1. Hooks (Current: ~65%, Target: 80%+)

#### High Priority Hooks

**useStreamingExecution.ts** (Critical - RAG execution)
- Test streaming connection
- Test SSE fallback to polling
- Test cancellation
- Test error handling
- Test reconnection logic

**useRealtimeAnalytics.ts** (Critical - Real-time metrics)
- Test Firestore listeners
- Test metric calculations
- Test 5-second auto-refresh
- Test cleanup on unmount

**usePrompts.ts** (High - Core functionality)
- Test CRUD operations
- Test caching with React Query
- Test error states
- Test optimistic updates

**Example Test Structure**:
```typescript
// frontend/src/hooks/__tests__/useStreamingExecution.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStreamingExecution } from '../useStreamingExecution';

describe('useStreamingExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useStreamingExecution());
    
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamedContent).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('should handle streaming execution', async () => {
    const { result } = renderHook(() => useStreamingExecution());
    
    await result.current.execute('prompt-123', { input: 'test' });
    
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamedContent).toBeTruthy();
    });
  });

  it('should handle cancellation', async () => {
    const { result } = renderHook(() => useStreamingExecution());
    
    result.current.execute('prompt-123', { input: 'test' });
    result.current.cancel();
    
    await waitFor(() => {
      expect(result.current.isCancelled).toBe(true);
    });
  });
});
```

---

### 2. Services (Current: ~68%, Target: 80%+)

#### High Priority Services

**documentService.ts** (Critical - Document upload/processing)
- Test file upload
- Test processing status polling
- Test error handling
- Test file validation

**ratingService.ts** (High - User feedback)
- Test rating submission
- Test feedback submission
- Test Firestore integration

**promptService.ts** (High - Core functionality)
- Test prompt CRUD
- Test execution
- Test variable substitution

**Example Test Structure**:
```typescript
// frontend/src/services/__tests__/documentService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentService } from '../documentService';

vi.mock('../../config/firebase', () => ({
  db: {},
  storage: {},
}));

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(() => {
    service = new DocumentService();
  });

  it('should upload document successfully', async () => {
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const userId = 'user-123';

    const result = await service.uploadDocument(file, userId);

    expect(result).toHaveProperty('id');
    expect(result.status).toBe('pending');
  });

  it('should validate file type', () => {
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/exe' });
    
    expect(() => service.validateFile(invalidFile)).toThrow('Invalid file type');
  });
});
```

---

### 3. Complex Components (Current: ~75%, Target: 80%+)

#### High Priority Components

**PromptExecutor.tsx** (Critical - Main execution UI)
- Test execution flow
- Test RAG toggle
- Test streaming toggle
- Test multi-model execution
- Test error states

**RAGContextPreview.tsx** (High - RAG visualization)
- Test chunk display
- Test expand/collapse
- Test keyword highlighting
- Test relevance scores

**AnalyticsDashboard.tsx** (High - Metrics display)
- Test metric calculations
- Test real-time updates
- Test date range filtering
- Test chart rendering

**Example Test Structure**:
```typescript
// frontend/src/components/execution/__tests__/PromptExecutor.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PromptExecutor } from '../PromptExecutor';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('PromptExecutor', () => {
  const mockPrompt = {
    id: 'prompt-123',
    title: 'Test Prompt',
    content: 'Hello {{name}}',
    variables: ['name'],
  };

  it('should render prompt executor', () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <PromptExecutor prompt={mockPrompt} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
  });

  it('should execute prompt with variables', async () => {
    const queryClient = new QueryClient();
    const onComplete = vi.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <PromptExecutor prompt={mockPrompt} onExecutionComplete={onComplete} />
      </QueryClientProvider>
    );

    // Fill variable
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John' } });
    
    // Execute
    fireEvent.click(screen.getByText('Execute'));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
```

---

### 4. Utilities (Current: ~72%, Target: 80%+)

#### High Priority Utilities

**performanceTracing.ts** (High - Performance monitoring)
- Test trace creation
- Test metric recording
- Test trace completion

**errorHandling.ts** (High - Error management)
- Test error formatting
- Test error logging
- Test error recovery

**validation.ts** (Medium - Input validation)
- Test prompt validation
- Test variable validation
- Test file validation

---

## Implementation Plan

### Week 1: Hooks & Services (40 hours)

#### Day 1-2: Hooks Testing (16 hours)
- [ ] Write tests for `useStreamingExecution` (4 hours)
- [ ] Write tests for `useRealtimeAnalytics` (4 hours)
- [ ] Write tests for `usePrompts` (3 hours)
- [ ] Write tests for `useDocuments` (3 hours)
- [ ] Write tests for `useAuth` edge cases (2 hours)

#### Day 3-4: Services Testing (16 hours)
- [ ] Write tests for `documentService` (5 hours)
- [ ] Write tests for `ratingService` (3 hours)
- [ ] Write tests for `promptService` (4 hours)
- [ ] Write tests for `analyticsService` (4 hours)

#### Day 5: Utilities Testing (8 hours)
- [ ] Write tests for `performanceTracing` (3 hours)
- [ ] Write tests for `errorHandling` (2 hours)
- [ ] Write tests for `validation` (3 hours)

---

### Week 2: Components & Integration (40 hours)

#### Day 1-2: Complex Components (16 hours)
- [ ] Write tests for `PromptExecutor` (6 hours)
- [ ] Write tests for `RAGContextPreview` (4 hours)
- [ ] Write tests for `AnalyticsDashboard` (6 hours)

#### Day 3: Document Components (8 hours)
- [ ] Write tests for `DocumentUploadZone` (4 hours)
- [ ] Write tests for `DocumentList` (4 hours)

#### Day 4: Integration Tests (8 hours)
- [ ] Write integration tests for prompt execution flow (4 hours)
- [ ] Write integration tests for document upload flow (4 hours)

#### Day 5: Coverage Review & Fixes (8 hours)
- [ ] Run coverage report (1 hour)
- [ ] Identify gaps (2 hours)
- [ ] Write additional tests (4 hours)
- [ ] Update coverage thresholds (1 hour)

---

## Commands Reference

### Run All Tests
```bash
npm run test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests for Specific File
```bash
npm run test -- useStreamingExecution.test.ts
```

### Run Tests with UI
```bash
npm run test:ui
```

---

## Coverage Threshold Update

After achieving 80%+ coverage, update `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

---

## CI/CD Integration

Update `.github/workflows/ci.yml` to enforce coverage:

```yaml
- name: Run Tests with Coverage
  run: |
    cd frontend
    npm run test:coverage
    
- name: Upload Coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./frontend/coverage/coverage-final.json
    flags: frontend
    fail_ci_if_error: true
```

---

## Success Criteria

- [ ] All coverage metrics ≥ 80%
- [ ] All critical hooks tested
- [ ] All services tested
- [ ] All complex components tested
- [ ] Integration tests for main flows
- [ ] CI/CD enforces coverage thresholds
- [ ] Coverage report generated and reviewed

---

## Monitoring & Maintenance

### Weekly Coverage Review
```bash
npm run test:coverage
```

### Monthly Coverage Audit
- Review uncovered code
- Identify new features needing tests
- Update test suite

### Continuous Improvement
- Add tests for new features
- Refactor tests for maintainability
- Keep coverage above 80%

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-09  
**Maintained By**: QA Team

