# Help Center Components

This directory contains all components for the Help Center V2 redesign.

## Components Overview

### Core Components

#### HelpCenterV2.tsx
Main container component that orchestrates the help center experience.

**Features:**
- Routing between category, search, and article views
- Search query management with debouncing
- Article filtering by category and search
- Breadcrumb generation

**Usage:**
```tsx
import HelpCenterV2 from '@/components/help/HelpCenterV2';

<HelpCenterV2 />
```

#### HelpSearchBar.tsx
Debounced search input with autocomplete suggestions.

**Props:**
- `value: string` - Current search value
- `onChange: (value: string) => void` - Value change handler
- `onSearch: (query: string) => void` - Search submission handler
- `suggestions?: SearchSuggestion[]` - Autocomplete suggestions
- `debounceMs?: number` - Debounce delay (default: 300ms)

**Features:**
- Debounced search (300ms default)
- Keyboard navigation (↑↓ arrows, Enter, Escape)
- ARIA labels for accessibility
- Click-outside detection

**Usage:**
```tsx
<HelpSearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  onSearch={handleSearch}
  suggestions={suggestions}
/>
```

#### HelpCategoryList.tsx
Grid of category cards with icons and article counts.

**Props:**
- `articles: HelpArticle[]` - All articles for counting
- `onCategoryClick?: (categoryId: string) => void` - Category click handler

**Features:**
- Responsive grid layout
- Category icons and colors
- Article counts per category
- Hover effects

**Usage:**
```tsx
<HelpCategoryList
  articles={articles}
  onCategoryClick={handleCategoryClick}
/>
```

#### HelpResultsList.tsx
List of article cards with keyword highlighting.

**Props:**
- `articles: HelpArticle[]` - Articles to display
- `searchQuery?: string` - Query for keyword highlighting
- `onArticleClick?: (article: HelpArticle) => void` - Article click handler

**Features:**
- Keyword highlighting in titles and excerpts
- Difficulty badges with semantic colors
- Featured article badges
- Read time calculation
- Empty state handling

**Usage:**
```tsx
<HelpResultsList
  articles={filteredArticles}
  searchQuery={searchQuery}
  onArticleClick={handleArticleClick}
/>
```

#### HelpArticleView.tsx
Full article view with markdown rendering and interactive elements.

**Props:**
- `article: HelpArticle` - Article to display
- `allArticles?: HelpArticle[]` - All articles for related content
- `breadcrumbs?: BreadcrumbItem[]` - Breadcrumb navigation
- `onFeedback?: (articleId: string, helpful: boolean) => void` - Feedback handler
- `showTableOfContents?: boolean` - Show ToC (default: true)
- `showRelatedArticles?: boolean` - Show related articles (default: true)

**Features:**
- Markdown rendering with syntax highlighting
- Table of contents with smooth scrolling
- Step-by-step guides
- FAQ accordion
- Feedback widget
- Related articles
- Recently viewed tracking

**Usage:**
```tsx
<HelpArticleView
  article={currentArticle}
  allArticles={articles}
  breadcrumbs={breadcrumbs}
  onFeedback={handleFeedback}
/>
```

### Interactive Components

#### TableOfContents.tsx
Navigable table of contents with anchor links.

**Props:**
- `content: string` - Markdown content to parse
- `maxLevel?: number` - Maximum heading level (default: 3)
- `sticky?: boolean` - Enable sticky positioning (default: true)

**Features:**
- Parses markdown headings
- Generates anchor links
- Active section highlighting
- Smooth scrolling
- Sticky positioning

**Usage:**
```tsx
<TableOfContents content={article.content} sticky />
```

#### CodeBlock.tsx
Syntax-highlighted code block with copy button.

**Props:**
- `code: string` - Code to display
- `language?: string` - Programming language
- `showLineNumbers?: boolean` - Show line numbers
- `fileName?: string` - Optional file name

**Features:**
- Syntax highlighting (react-syntax-highlighter)
- Copy-to-clipboard button
- Language detection
- VS Code Dark Plus theme

**Usage:**
```tsx
<CodeBlock
  code={codeString}
  language="javascript"
  fileName="example.js"
/>
```

#### FAQAccordion.tsx
Accessible accordion for FAQs.

**Props:**
- `faqs: FAQ[]` - FAQ items
- `searchable?: boolean` - Enable search (default: true)
- `defaultOpen?: string[]` - IDs of items to open by default

**Features:**
- Radix UI Accordion (accessible)
- Search filtering
- Keyboard navigation
- Smooth animations

**Usage:**
```tsx
<FAQAccordion
  faqs={article.faqs}
  searchable={article.faqs.length > 3}
/>
```

#### RelatedArticles.tsx
Related articles based on tags and categories.

**Props:**
- `currentArticle: HelpArticle` - Current article
- `allArticles: HelpArticle[]` - All articles for matching
- `maxResults?: number` - Maximum articles to show (default: 3)

**Features:**
- Relevance scoring algorithm
- Tag and category matching
- Difficulty and featured weighting
- Responsive grid layout

**Usage:**
```tsx
<RelatedArticles
  currentArticle={article}
  allArticles={articles}
  maxResults={3}
/>
```

#### RecentlyViewed.tsx
Recently viewed articles tracker.

**Props:**
- `allArticles: HelpArticle[]` - All articles
- `currentArticleId?: string` - Exclude current article
- `maxItems?: number` - Maximum items to show (default: 5)

**Features:**
- localStorage persistence
- Automatic tracking
- Compact card layout
- Max 5 items

**Usage:**
```tsx
<RecentlyViewed
  allArticles={articles}
  currentArticleId={article.id}
/>
```

#### FeedbackWidget.tsx
Thumbs up/down feedback widget.

**Props:**
- `articleId: string` - Article ID
- `onFeedbackSubmit?: (articleId: string, helpful: boolean) => void` - Callback

**Features:**
- React Query mutation
- Firestore integration (placeholder)
- Visual feedback
- Disabled state after submission

**Usage:**
```tsx
<FeedbackWidget
  articleId={article.id}
  onFeedbackSubmit={handleFeedback}
/>
```

## Utility Functions

### highlightKeywords(text: string, query: string)
Highlights keywords in text with `<mark>` tags.

### getDifficultyColor(difficulty: string)
Returns Tailwind classes for difficulty badges.

### calculateReadTime(content: string)
Calculates estimated read time based on word count.

### parseHeadings(markdown: string, maxLevel: number)
Parses markdown headings for table of contents.

### getCategoryInfo(categoryId: string, articleCount: number)
Returns category metadata (name, icon, color, etc.).

## Hooks

### useHelpArticles()
Fetches help articles from Firestore with static fallback.

### useTrackArticleView(articleId: string)
Tracks article views in localStorage.

### useHeadingIds(content: string, maxLevel: number)
Adds IDs to heading elements for ToC navigation.

## Testing

All components have comprehensive tests in `__tests__/` directory.

Run tests:
```bash
npm run test
```

## Styling

All components use:
- Tailwind CSS utility classes
- Dashboard design tokens (bg-card, text-foreground, etc.)
- Semantic colors (green/yellow/red for difficulty)
- Responsive breakpoints (sm, md, lg, xl)

## Accessibility

All components follow WCAG 2.1 AA guidelines:
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- Semantic HTML

## Performance

Optimizations:
- Debounced search (300ms)
- Memoized filtering and suggestions
- Lazy-loaded markdown renderer
- Code splitting
- Static data fallback

