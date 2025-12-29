# Help Center V2 - Testing Checklist

## Pre-Testing Setup

- [x] Feature flag enabled: `VITE_HELP_CENTER_V2=true` in `.env`
- [x] Dev server restarted to pick up environment changes
- [ ] Browser cache cleared (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- [ ] Navigate to: `http://localhost:3000/dashboard/help`

---

## 1. Main View (Category Grid)

### Visual Layout
- [ ] **Header**: "Help Center" title is visible and prominent
- [ ] **Subtitle**: Descriptive text appears below title
- [ ] **Search Bar**: Large, prominent search input with icon
- [ ] **Popular Searches**: Section with 6 pill-shaped buttons
- [ ] **Quick Actions**: Section with 3 action cards
- [ ] **Divider**: Horizontal line separates sections
- [ ] **Category Grid**: 6 category cards in responsive grid
- [ ] **Spacing**: Adequate whitespace between all sections

### Popular Searches
- [ ] Click "How to create a prompt" → Search executes, results appear
- [ ] Click "Upload documents" → Search executes, results appear
- [ ] Click "RAG execution" → Search executes, results appear
- [ ] Click "Variable syntax" → Search executes, results appear
- [ ] Click "API integration" → Search executes, results appear
- [ ] Click "Best practices" → Search executes, results appear
- [ ] **Hover Effect**: Pills change background color on hover
- [ ] **Focus State**: Pills show focus ring when tabbed to

### Quick Actions
- [ ] Click "Create Your First Prompt" → Navigates to article
- [ ] Click "Upload Documents for RAG" → Navigates to article
- [ ] Click "Execute RAG-Enabled Prompts" → Navigates to article
- [ ] **Icons**: Each action has a colored icon
- [ ] **Hover Effect**: Cards show border color change and shadow
- [ ] **Arrow Icon**: Right arrow appears on each card

### Category Cards
- [ ] **Getting Started** (🚀 green): Shows correct count
- [ ] **Core Features** (📖 blue): Shows correct count
- [ ] **Account & Settings** (⚙️ purple): Shows correct count
- [ ] **Troubleshooting** (🔧 orange): Shows correct count
- [ ] **API & Integration** (💻 indigo): Shows correct count
- [ ] **Best Practices** (💡 yellow): Shows correct count
- [ ] **Hover Effect**: Icon scales up, title changes color, arrow appears
- [ ] **Click**: Navigates to category articles

---

## 2. Search Functionality

### Search Input
- [ ] Type "prompt" → Suggestions appear after 300ms
- [ ] Type "rag" → Suggestions appear
- [ ] Type "document" → Suggestions appear
- [ ] **Debouncing**: Suggestions don't appear immediately (300ms delay)
- [ ] **Clear Button**: X icon appears when text is entered
- [ ] Click clear button → Input clears, suggestions disappear

### Autocomplete Suggestions
- [ ] **Dropdown**: Appears below search input
- [ ] **Styling**: White background, border, shadow
- [ ] **Items**: Show article titles and categories
- [ ] **Hover**: Items highlight on hover
- [ ] **Arrow Keys**: ↓ selects next, ↑ selects previous
- [ ] **Enter Key**: Selects highlighted suggestion
- [ ] **Escape Key**: Closes suggestions dropdown
- [ ] **Click Outside**: Closes suggestions dropdown

### Search Results
- [ ] Search "prompt" → Results show articles with "prompt" in title/content
- [ ] **Keyword Highlighting**: Search terms are highlighted in yellow
- [ ] **Results Header**: Shows "Search results for 'prompt'"
- [ ] **Count**: Shows "X articles found"
- [ ] **Empty State**: Shows "No articles found" for non-existent terms
- [ ] **Back Button**: "← Browse all categories" appears at bottom
- [ ] Click back button → Returns to main view

---

## 3. Category View

### Navigation
- [ ] Click "Getting Started" category → Shows category articles
- [ ] **Breadcrumbs**: Not shown (only in article view)
- [ ] **Header**: Shows "Getting Started Articles"
- [ ] **Count**: Shows correct number of articles

### Article List
- [ ] **Cards**: Articles displayed as cards with borders
- [ ] **Title**: Article title is prominent
- [ ] **Excerpt**: Short description appears
- [ ] **Difficulty Badge**: Shows beginner/intermediate/advanced with correct color
  - [ ] Beginner = Green
  - [ ] Intermediate = Yellow
  - [ ] Advanced = Red
- [ ] **Featured Badge**: "Featured Article" badge for featured articles
- [ ] **Tags**: Article tags appear as small pills
- [ ] **Read Time**: "X min read" appears
- [ ] **Hover Effect**: Card border changes color, shadow appears

### Back Navigation
- [ ] "← Browse all categories" button appears
- [ ] Click back button → Returns to main view
- [ ] Search bar still visible and functional

---

## 4. Article View

### Navigation
- [ ] Click any article → Article detail view loads
- [ ] **Breadcrumbs**: Show "Help Center > Category > Article Title"
- [ ] Click "Help Center" breadcrumb → Returns to main view
- [ ] Click category breadcrumb → Returns to category view

### Layout (Desktop)
- [ ] **Two-column layout**: Content on left, ToC on right
- [ ] **Table of Contents**: Sticky sidebar with headings
- [ ] **Content**: Markdown rendered correctly
- [ ] **Spacing**: Adequate margins and padding

### Layout (Mobile)
- [ ] **Single column**: ToC hidden or moved
- [ ] **Content**: Full width, readable
- [ ] **Responsive**: No horizontal scrolling

### Content Rendering
- [ ] **Headings**: H1, H2, H3 styled correctly
- [ ] **Paragraphs**: Readable line height and spacing
- [ ] **Bold/Italic**: Markdown formatting works
- [ ] **Lists**: Bullet and numbered lists render correctly
- [ ] **Links**: Clickable and styled

### Code Blocks
- [ ] **Syntax Highlighting**: Code has colors (VS Code Dark Plus theme)
- [ ] **Copy Button**: Appears in top-right of code block
- [ ] Click copy button → "Copied!" message appears
- [ ] **Language Label**: Shows programming language
- [ ] **Line Numbers**: Optional, if enabled

### Table of Contents
- [ ] **Headings List**: Shows all H2 and H3 headings
- [ ] **Indentation**: H3 headings indented under H2
- [ ] **Active Highlighting**: Current section highlighted
- [ ] Click heading → Smooth scrolls to section
- [ ] **Sticky**: ToC stays visible while scrolling

### Step-by-Step Guides
- [ ] **Steps**: Numbered steps appear
- [ ] **Icons**: Step numbers in circles
- [ ] **Content**: Step content readable
- [ ] **Tips**: Tips section appears if present
- [ ] **Code**: Code snippets in steps render correctly

### FAQ Accordion
- [ ] **Accordion**: FAQ section appears if article has FAQs
- [ ] **Search**: Search input appears if 3+ FAQs
- [ ] Click FAQ → Expands to show answer
- [ ] Click again → Collapses
- [ ] **Multiple Open**: Multiple FAQs can be open simultaneously
- [ ] **Keyboard**: Space/Enter toggles accordion
- [ ] **Animation**: Smooth expand/collapse animation

### Feedback Widget
- [ ] **Thumbs Up/Down**: Two buttons appear
- [ ] Click thumbs up → Button becomes solid, "Thank you" message
- [ ] Click thumbs down → Button becomes solid, "Thank you" message
- [ ] **Disabled**: Buttons disabled after clicking
- [ ] **Console**: Check console for feedback log

### Related Articles
- [ ] **Section**: "Related Articles" appears at bottom
- [ ] **Cards**: 3 related articles shown
- [ ] **Relevance**: Articles are actually related (same category/tags)
- [ ] **Click**: Navigates to related article

### Recently Viewed
- [ ] View multiple articles
- [ ] **Sidebar**: Recently viewed section appears (if implemented)
- [ ] **localStorage**: Check browser DevTools → Application → Local Storage
- [ ] **Max 5**: Only last 5 articles tracked

---

## 5. Responsive Design

### Mobile (< 640px)
- [ ] **Search Bar**: Full width, readable
- [ ] **Popular Searches**: Pills wrap to multiple lines
- [ ] **Quick Actions**: Stack vertically
- [ ] **Categories**: Single column grid
- [ ] **Article View**: Single column, no ToC sidebar
- [ ] **Code Blocks**: Horizontal scroll if needed
- [ ] **Touch**: All buttons/links easily tappable (44px min)

### Tablet (640px - 1024px)
- [ ] **Categories**: 2-column grid
- [ ] **Quick Actions**: 2 columns or stacked
- [ ] **Article View**: Content full width or with ToC

### Desktop (> 1024px)
- [ ] **Categories**: 3-column grid
- [ ] **Quick Actions**: Side-by-side with popular searches
- [ ] **Article View**: Two-column with ToC sidebar

---

## 6. Accessibility

### Keyboard Navigation
- [ ] **Tab**: Navigate through all interactive elements
- [ ] **Enter**: Activate buttons and links
- [ ] **Space**: Toggle accordions
- [ ] **Escape**: Close search suggestions
- [ ] **Arrow Keys**: Navigate search suggestions
- [ ] **Focus Visible**: All focused elements have visible outline

### Screen Reader
- [ ] **ARIA Labels**: All buttons have descriptive labels
- [ ] **Headings**: Proper heading hierarchy (H1 → H2 → H3)
- [ ] **Landmarks**: nav, main, article elements used
- [ ] **Alt Text**: Icons have aria-hidden or aria-label
- [ ] **Live Regions**: Search results announce changes

### Color Contrast
- [ ] **Text**: All text meets 4.5:1 contrast ratio
- [ ] **Buttons**: Sufficient contrast in all states
- [ ] **Difficulty Badges**: Green/Yellow/Red readable

---

## 7. Performance

### Load Time
- [ ] **Initial Load**: < 2 seconds
- [ ] **Search**: Results appear < 500ms
- [ ] **Navigation**: Page transitions smooth

### Interactions
- [ ] **Hover**: No lag on hover effects
- [ ] **Click**: Immediate feedback on clicks
- [ ] **Scroll**: Smooth scrolling, no jank

---

## 8. Error Handling

### No Articles
- [ ] Delete all articles from `articles.json`
- [ ] **Empty State**: Shows "No articles found" message
- [ ] **Icon**: Question mark icon appears
- [ ] **Message**: Helpful error message

### Network Error
- [ ] Disable network in DevTools
- [ ] **Fallback**: Static articles still load
- [ ] **Console**: Warning logged about Firestore

### Invalid Routes
- [ ] Navigate to `/dashboard/help/invalid-category`
- [ ] **Handling**: Shows empty state or redirects

---

## 9. No Video References

### Visual Audit
- [ ] **No Video Icons**: No VideoCameraIcon anywhere
- [ ] **No Video Buttons**: No "Watch Video" buttons
- [ ] **No Video Players**: No embedded video players
- [ ] **No Video Links**: No links to video content

### Code Audit
- [x] Search codebase for "video" → Only comment "no video content"
- [x] Search codebase for "VideoCamera" → Not found in V2
- [x] Search codebase for "videoUrl" → Not found in V2

---

## 10. Browser Compatibility

### Chrome
- [ ] All features work
- [ ] No console errors

### Firefox
- [ ] All features work
- [ ] No console errors

### Safari
- [ ] All features work
- [ ] No console errors

### Edge
- [ ] All features work
- [ ] No console errors

---

## Issues Found

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| | | | |

---

## Sign-Off

- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] No blocking issues found
- [ ] Help Center V2 ready for production

**Tested By**: _______________
**Date**: _______________
**Browser/OS**: _______________

