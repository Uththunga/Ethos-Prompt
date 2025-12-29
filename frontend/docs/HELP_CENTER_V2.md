# Help Center V2 - Documentation

## Overview

The Help Center V2 is a complete redesign of the help system, focusing on a simplified, text-based interactive experience that maintains visual consistency with the Dashboard. This version removes video content and provides an intuitive, accessible help experience.

## Features

### ✅ Core Features

- **Text-Based Content**: All help articles use markdown with syntax-highlighted code blocks
- **Smart Search**: Debounced search with autocomplete suggestions and keyword highlighting
- **Category Navigation**: 6 main categories with icon-based cards
- **Interactive Elements**: 
  - Table of Contents with smooth scrolling
  - Code blocks with copy-to-clipboard
  - FAQ accordions with search
  - Related articles based on tags and categories
  - Recently viewed articles tracker
  - Feedback widget (thumbs up/down)
- **Responsive Design**: Mobile-first approach with breakpoint-specific layouts
- **Accessibility**: WCAG 2.1 AA compliant with ARIA labels and keyboard navigation

### 🎨 Visual Consistency

All components use Dashboard design tokens:
- Colors: `bg-card`, `text-foreground`, `border-border`, etc.
- Semantic colors preserved: Green (beginner), Yellow (intermediate), Red (advanced)
- Typography: Consistent font sizes and weights
- Spacing: Standard padding and margins
- Hover states: Matching transition effects

## Architecture

### Component Structure

```
src/components/help/
├── HelpCenterV2.tsx          # Main container (orchestrates views)
├── HelpSearchBar.tsx          # Debounced search with suggestions
├── HelpCategoryList.tsx       # Category grid with icons
├── HelpResultsList.tsx        # Article list with highlighting
├── HelpArticleView.tsx        # Full article view
├── TableOfContents.tsx        # ToC with anchor links
├── CodeBlock.tsx              # Syntax-highlighted code with copy
├── FAQAccordion.tsx           # Accessible accordion
├── RelatedArticles.tsx        # Related content recommendations
├── RecentlyViewed.tsx         # Recently viewed tracker
└── FeedbackWidget.tsx         # Article feedback
```

### Data Flow

```
Static Data (articles.json)
    ↓
useHelpArticles Hook (with Firestore fallback)
    ↓
HelpCenterV2 (routing & filtering)
    ↓
├── HelpCategoryList (category view)
├── HelpResultsList (search results)
└── HelpArticleView (article detail)
```

### Routing

- `/dashboard/help` - Category grid
- `/dashboard/help/:category` - Category articles
- `/dashboard/help/:category/:slug` - Article detail

## Feature Flag

The Help Center V2 is controlled by the `VITE_HELP_CENTER_V2` environment variable.

### Enabling V2

```bash
# .env or .env.local
VITE_HELP_CENTER_V2=true
```

### Disabling V2 (Fallback to Original)

```bash
VITE_HELP_CENTER_V2=false
```

## Content Management

### Article Structure

```typescript
interface HelpArticle {
  id: string;
  slug: string;                    // URL-friendly identifier
  title: string;
  excerpt: string;
  content: string;                 // Markdown content
  category: 'getting-started' | 'core-features' | 'account-settings' | 
            'troubleshooting' | 'api' | 'best-practices';
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;             // ISO date string
  featured?: boolean;
  steps?: ArticleStep[];           // Step-by-step guides
  faqs?: FAQ[];                    // Frequently asked questions
}
```

### Adding New Articles

#### Option 1: Static Data (Development)

Edit `src/data/help/articles.json`:

```json
{
  "id": "unique-id",
  "slug": "url-friendly-slug",
  "title": "Article Title",
  "excerpt": "Brief description",
  "content": "# Markdown Content\n\n...",
  "category": "getting-started",
  "tags": ["tag1", "tag2"],
  "difficulty": "beginner",
  "lastUpdated": "2025-01-15",
  "featured": true
}
```

#### Option 2: Firestore (Production)

Add documents to the `helpArticles` collection in Firestore with the same structure.

### Content Guidelines

1. **Markdown Formatting**:
   - Use `#` for headings (H1-H6)
   - Use ` ``` ` for code blocks with language specification
   - Use `**bold**` and `*italic*` for emphasis
   - Use `- ` for bullet lists

2. **Code Blocks**:
   ```markdown
   ```javascript
   const example = 'code here';
   ```
   ```

3. **Difficulty Levels**:
   - **Beginner**: Basic concepts, getting started
   - **Intermediate**: Advanced features, configuration
   - **Advanced**: Complex topics, optimization

4. **Tags**: Use lowercase, hyphenated tags (e.g., `prompt-engineering`, `rag-execution`)

## Categories

### 1. Getting Started (🚀)
- Quick start guides
- Onboarding tutorials
- Basic concepts

### 2. Core Features (📖)
- Prompts
- Documents
- RAG execution

### 3. Account & Settings (⚙️)
- Profile management
- Workspace configuration
- Preferences

### 4. Troubleshooting (🔧)
- Common issues
- Error messages
- Solutions

### 5. API & Integration (💻)
- API documentation
- Integration guides
- Code examples

### 6. Best Practices (💡)
- Advanced techniques
- Optimization strategies
- Tips and tricks

## Accessibility

### ARIA Labels

All interactive elements have proper ARIA labels:
- Search input: `role="search"`, `aria-label="Search help articles"`
- Suggestions: `role="listbox"`, `aria-expanded`
- Accordion: `aria-expanded`, `aria-controls`
- Navigation: `aria-label="Table of contents"`

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter**: Activate buttons and links
- **Escape**: Close modals and suggestions
- **Arrow Keys**: Navigate suggestions and accordion items
- **Space**: Toggle accordion items

### Screen Reader Support

- Semantic HTML (`<nav>`, `<article>`, `<aside>`)
- Descriptive labels for all controls
- Status announcements for dynamic content
- Skip-to-content links

## Testing

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Test Files

- `HelpSearchBar.test.tsx` - Search functionality, debouncing, keyboard navigation
- `HelpResultsList.test.tsx` - Keyword highlighting, difficulty badges
- `TableOfContents.test.tsx` - Heading parsing, anchor generation

### Manual Testing Checklist

- [ ] Search with debouncing works
- [ ] Keyword highlighting appears in results
- [ ] Category navigation works
- [ ] Article view renders markdown correctly
- [ ] Code blocks have copy buttons
- [ ] FAQ accordion expands/collapses
- [ ] Table of Contents scrolls to sections
- [ ] Related articles appear
- [ ] Recently viewed tracks articles
- [ ] Feedback widget submits
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Keyboard navigation works
- [ ] Screen reader announces content

## Performance

### Optimization Strategies

1. **Code Splitting**: Lazy-loaded Help Center component
2. **Debouncing**: 300ms debounce on search input
3. **Memoization**: useMemo for filtered articles and suggestions
4. **Static Data**: Fallback to JSON for fast initial load
5. **Lazy Images**: Images load on demand
6. **Virtual Scrolling**: For large article lists (future enhancement)

### Performance Targets

- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s
- Search Response: < 100ms (client-side)

## Migration Guide

### From Original Help Center

1. **Enable Feature Flag**: Set `VITE_HELP_CENTER_V2=true`
2. **Test Functionality**: Verify all features work
3. **Migrate Content**: Convert video tutorials to text guides
4. **Update Links**: Ensure all internal links use new routing
5. **Monitor Feedback**: Track user feedback via widget
6. **Gradual Rollout**: Use feature flag for A/B testing

### Rollback Plan

If issues arise, simply set `VITE_HELP_CENTER_V2=false` to revert to the original Help Center.

## Future Enhancements

### Planned Features

- [ ] Multi-language support (i18n)
- [ ] Advanced search filters (date, difficulty, category)
- [ ] Article versioning and history
- [ ] User comments and discussions
- [ ] Bookmark/favorite articles
- [ ] Print-friendly article view
- [ ] Export articles to PDF
- [ ] AI-powered search suggestions
- [ ] Video tutorials (optional, behind flag)

### Technical Debt

- Implement Firestore feedback mutation (currently console.log)
- Add analytics tracking for article views
- Optimize bundle size (code splitting for markdown renderer)
- Add service worker for offline support

## Support

For questions or issues:
- Check the troubleshooting guide
- Review the FAQ section
- Contact the development team

## License

Internal use only - RAG Prompt Library Project

