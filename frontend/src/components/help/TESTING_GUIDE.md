# Help Center Testing Guide

## Overview
This guide provides comprehensive testing instructions for the Help Center component, including manual testing procedures, automated test execution, and quality assurance checklists.

---

## Quick Start

### Run All Tests
```bash
# Navigate to frontend directory
cd frontend

# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run accessibility tests
npm run test -- HelpCenter.accessibility.test.tsx

# Run E2E tests (if configured)
npm run test:e2e
```

### Start Development Server
```bash
npm run dev
```

Then navigate to: `http://localhost:3001/dashboard/help`

---

## Manual Testing Checklist

### 1. Initial Load
- [ ] Page loads without errors
- [ ] All sections render correctly
- [ ] Theme colors are applied consistently
- [ ] No console errors or warnings
- [ ] Loading skeleton appears briefly (if data is fetched)

### 2. Search Functionality
- [ ] Search input is visible and accessible
- [ ] Typing in search filters articles in real-time
- [ ] Search suggestions appear as you type
- [ ] Clicking a suggestion performs the search
- [ ] Pressing Enter submits the search
- [ ] Pressing Escape clears the search
- [ ] Search works with partial matches
- [ ] Search is case-insensitive
- [ ] Search highlights matching text (if implemented)

### 3. Category Navigation
- [ ] All categories are visible in the sidebar
- [ ] Clicking a category filters articles
- [ ] Active category is highlighted
- [ ] Subcategories expand/collapse correctly
- [ ] Article count is displayed per category
- [ ] "All Articles" shows all content
- [ ] Category selection persists during search

### 4. Article Display
- [ ] Article cards show all metadata (title, excerpt, tags, difficulty, read time)
- [ ] Featured articles are marked clearly
- [ ] Article type icons are displayed correctly
- [ ] Difficulty badges use appropriate colors
- [ ] View count and ratings are visible
- [ ] Tags are displayed and clickable (if implemented)
- [ ] Article cards are responsive

### 5. Article Interaction
- [ ] Clicking an article opens the full content
- [ ] Article content is formatted correctly
- [ ] Breadcrumb navigation appears
- [ ] Back button returns to article list
- [ ] Related articles are shown (if available)
- [ ] Step-by-step guides display progress
- [ ] FAQs are expandable/collapsible
- [ ] Feedback buttons work (helpful/not helpful)

### 6. Filtering & Sorting
- [ ] Filter panel opens/closes correctly
- [ ] Difficulty filters work
- [ ] Content type filters work
- [ ] Multiple filters can be combined
- [ ] Sort options work (relevance, date, popularity, rating)
- [ ] Filters persist during navigation
- [ ] Clear filters button resets all filters

### 7. Responsive Design
- [ ] **Mobile (< 640px)**
  - [ ] Single column layout
  - [ ] Category sidebar is collapsible
  - [ ] Touch-friendly buttons
  - [ ] Readable font sizes
  - [ ] No horizontal scrolling
- [ ] **Tablet (640px - 1024px)**
  - [ ] Two-column layout where appropriate
  - [ ] Optimized sidebar width
  - [ ] Responsive images
- [ ] **Desktop (> 1024px)**
  - [ ] Multi-column layout
  - [ ] Fixed sidebar navigation
  - [ ] Hover states visible

### 8. Accessibility
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] ARIA labels are present
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] No keyboard traps
- [ ] Skip to main content link works

### 9. Theme Colors
- [ ] Primary color (ethos-purple) is used consistently
- [ ] Muted colors for secondary content
- [ ] Border colors are consistent
- [ ] Card backgrounds use theme colors
- [ ] Hover states use accent colors
- [ ] Text colors have proper contrast
- [ ] No hardcoded blue/gray colors remain

### 10. Error Handling
- [ ] Error state displays when data fetch fails
- [ ] Retry button works
- [ ] Error messages are user-friendly
- [ ] Fallback to static data works
- [ ] No crashes on invalid input

### 11. Performance
- [ ] Page loads in < 3 seconds
- [ ] Search is responsive (< 300ms)
- [ ] No layout shifts during load
- [ ] Images load progressively
- [ ] Smooth scrolling and transitions

---

## Automated Testing

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run specific test file
npm run test HelpCenter.test.tsx

# Run with coverage
npm run test:coverage
```

**Coverage Targets:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

### Accessibility Tests
```bash
# Run accessibility tests
npm run test HelpCenter.accessibility.test.tsx
```

**Checks:**
- WCAG 2.1 AA compliance
- ARIA attributes
- Keyboard navigation
- Color contrast
- Semantic HTML

### Integration Tests
```bash
# Run integration tests
npm run test -- --grep "integration"
```

**Scenarios:**
- Search + filter combination
- Category navigation + article selection
- Error state + retry
- Loading state + data fetch

---

## Browser Testing

### Supported Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Testing Procedure
1. Open Help Center in each browser
2. Test all manual testing checklist items
3. Check for browser-specific issues
4. Verify theme colors render correctly
5. Test responsive design at different viewport sizes

---

## Device Testing

### Mobile Devices
- [ ] iOS Safari (iPhone)
- [ ] Android Chrome (Samsung/Pixel)
- [ ] iOS Chrome (iPhone)

### Tablets
- [ ] iPad Safari
- [ ] Android Chrome (tablet)

### Testing Procedure
1. Test touch interactions
2. Verify responsive layout
3. Check font sizes and readability
4. Test orientation changes (portrait/landscape)
5. Verify no horizontal scrolling

---

## Performance Testing

### Lighthouse Audit
```bash
# Run Lighthouse in Chrome DevTools
# Target scores:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90
```

### Load Testing
1. Open Chrome DevTools Network tab
2. Reload page
3. Check metrics:
   - [ ] First Contentful Paint < 1.5s
   - [ ] Largest Contentful Paint < 2.5s
   - [ ] Time to Interactive < 3.5s
   - [ ] Cumulative Layout Shift < 0.1

---

## Regression Testing

### After Code Changes
- [ ] Run all automated tests
- [ ] Test affected features manually
- [ ] Check for console errors
- [ ] Verify theme colors unchanged
- [ ] Test on multiple browsers
- [ ] Check responsive design

### Before Deployment
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Lighthouse scores meet targets
- [ ] Manual testing checklist complete
- [ ] Accessibility tests pass

---

## Known Issues

### Current
None

### Fixed
- ✅ Theme color inconsistencies (Phase 2)
- ✅ Static content not RAG-specific (Phase 3)
- ✅ No dynamic data integration (Phase 5)

---

## Test Data

### Sample Articles
The component includes comprehensive test data:
- Quick Start Guide (beginner, tutorial)
- Document Upload Guide (beginner, guide)
- RAG Execution Basics (intermediate, guide)
- Troubleshooting Guide (beginner, troubleshooting)

### Test Scenarios
1. **Empty Search**: No results found
2. **Partial Match**: "RAG" matches multiple articles
3. **Category Filter**: "getting-started" shows 1 article
4. **Difficulty Filter**: "beginner" shows 3 articles
5. **Combined Filters**: Category + difficulty + search

---

## Debugging Tips

### Common Issues
1. **Articles not displaying**
   - Check browser console for errors
   - Verify data is being fetched
   - Check filter state

2. **Search not working**
   - Verify search query state
   - Check filter logic
   - Look for JavaScript errors

3. **Theme colors not applied**
   - Check Tailwind config
   - Verify CSS variables in index.css
   - Inspect element classes

4. **Responsive layout broken**
   - Check viewport meta tag
   - Verify Tailwind breakpoints
   - Test at different screen sizes

### Debug Tools
- React DevTools (component state)
- Chrome DevTools (network, console, elements)
- Lighthouse (performance, accessibility)
- axe DevTools (accessibility)
- WAVE (accessibility)

---

## Reporting Issues

### Bug Report Template
```markdown
**Title**: Brief description

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- Viewport: 1920x1080

**Steps to Reproduce**:
1. Navigate to /dashboard/help
2. Click on search input
3. Type "RAG"

**Expected Behavior**:
Articles should filter to show RAG-related content

**Actual Behavior**:
No articles are displayed

**Screenshots**:
[Attach screenshot]

**Console Errors**:
[Paste any console errors]
```

---

## Continuous Integration

### GitHub Actions (if configured)
```yaml
# .github/workflows/test.yml
- Run linting
- Run type checking
- Run unit tests
- Run accessibility tests
- Generate coverage report
- Upload to Codecov
```

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
**Status**: ✅ All Tests Passing

