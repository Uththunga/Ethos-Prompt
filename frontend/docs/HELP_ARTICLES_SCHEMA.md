# Help Articles Firestore Schema

## Overview

The `helpArticles` collection stores all help documentation articles for the EthosPrompt dashboard help center.

## Collection Structure

```
helpArticles/
├── {articleId}/
│   ├── (document fields)
│   └── versions/
│       ├── v1/
│       ├── v2/
│       └── v3/
```

## Document Schema

### Main Document (`helpArticles/{articleId}`)

```typescript
interface HelpArticle {
  // Identifiers
  id: string;                    // Unique article ID (same as document ID)
  slug: string;                  // URL-friendly slug for routing
  
  // Content
  title: string;                 // Article title
  excerpt: string;               // Short description (150-200 chars)
  content: string;               // Full markdown content
  
  // Organization
  category: string;              // Primary category (getting-started, core-features, etc.)
  subcategory?: string;          // Optional subcategory
  tags: string[];                // Searchable tags
  
  // Metadata
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  featured: boolean;             // Show in featured articles
  estimatedReadTime: number;     // Reading time in minutes
  
  // Relationships
  prerequisites?: string[];      // Article slugs that should be read first
  relatedArticles?: string[];    // Related article slugs
  
  // Analytics
  views: number;                 // Total view count
  helpful: number;               // "Was this helpful?" positive count
  rating: number;                // Average rating (0-5)
  
  // Versioning
  version: number;               // Current version number
  createdAt: Timestamp;          // Document creation timestamp
  updatedAt: Timestamp;          // Last update timestamp
  lastUpdated: Timestamp;        // Content last updated (from articles.json)
  
  // Optional
  faqs?: FAQ[];                  // Frequently asked questions
}

interface FAQ {
  id: string;                    // Unique FAQ ID
  question: string;              // Question text
  answer: string;                // Answer text
}
```

### Version Subcollection (`helpArticles/{articleId}/versions/{versionId}`)

```typescript
interface ArticleVersion extends HelpArticle {
  versionNumber: number;         // Version number (1, 2, 3, ...)
  versionedAt: Timestamp;        // When this version was created
}
```

## Field Descriptions

### Identifiers

- **id**: Unique identifier, matches document ID. Use kebab-case (e.g., `creating-first-prompt`)
- **slug**: URL-friendly identifier for routing. Same as `id` in most cases

### Content

- **title**: Human-readable title (e.g., "Creating Your First Prompt")
- **excerpt**: Brief summary shown in search results and article lists (150-200 characters)
- **content**: Full article content in Markdown format. Supports:
  - Headings (H1-H6)
  - Code blocks with syntax highlighting
  - Callouts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`, `> [!DANGER]`)
  - Lists (ordered and unordered)
  - Links and images
  - Tables

### Organization

- **category**: Primary category. Valid values:
  - `getting-started`: Onboarding and basics
  - `core-features`: Main product features
  - `account-settings`: User account management
  - `troubleshooting`: Problem solving
  - `api`: API documentation
  - `best-practices`: Tips and recommendations

- **subcategory**: Optional subcategory for finer organization (e.g., `prompts`, `rag`, `documents`)

- **tags**: Array of searchable keywords (e.g., `["prompts", "variables", "templates"]`)

### Metadata

- **difficulty**: Skill level required:
  - `beginner`: No prior knowledge needed
  - `intermediate`: Some familiarity with concepts
  - `advanced`: Deep technical knowledge required

- **featured**: Boolean flag for highlighting important articles

- **estimatedReadTime**: Reading time in minutes (calculated at ~200 words/minute)

### Relationships

- **prerequisites**: Array of article slugs that should be read before this article
- **relatedArticles**: Array of related article slugs for cross-referencing

### Analytics

- **views**: Total number of times article was viewed (incremented on page load)
- **helpful**: Count of positive "Was this helpful?" responses
- **rating**: Average user rating (0-5 stars)

### Versioning

- **version**: Current version number (starts at 1, increments on updates)
- **createdAt**: When document was first created in Firestore
- **updatedAt**: Last time document was modified
- **lastUpdated**: Content last updated date (from source articles.json)

## Indexes

Required composite indexes for efficient queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "helpArticles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "featured", "order": "DESCENDING" },
        { "fieldPath": "views", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "helpArticles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "difficulty", "order": "ASCENDING" },
        { "fieldPath": "views", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "helpArticles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tags", "arrayConfig": "CONTAINS" },
        { "fieldPath": "views", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Help articles are publicly readable
    match /helpArticles/{articleId} {
      // Anyone can read
      allow read: if true;
      
      // Only admins can write
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Allow incrementing view count
      allow update: if request.auth != null &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['views']) &&
                       request.resource.data.views == resource.data.views + 1;
      
      // Version subcollection
      match /versions/{versionId} {
        allow read: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
        allow write: if request.auth != null && 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      }
    }
  }
}
```

## Common Queries

### Get all featured articles

```typescript
const featuredArticles = await db.collection('helpArticles')
  .where('featured', '==', true)
  .orderBy('views', 'desc')
  .limit(10)
  .get();
```

### Get articles by category

```typescript
const categoryArticles = await db.collection('helpArticles')
  .where('category', '==', 'core-features')
  .orderBy('title', 'asc')
  .get();
```

### Search by tags

```typescript
const taggedArticles = await db.collection('helpArticles')
  .where('tags', 'array-contains', 'rag')
  .orderBy('views', 'desc')
  .get();
```

### Get beginner articles

```typescript
const beginnerArticles = await db.collection('helpArticles')
  .where('difficulty', '==', 'beginner')
  .orderBy('views', 'desc')
  .limit(20)
  .get();
```

### Increment view count

```typescript
await db.collection('helpArticles').doc(articleId).update({
  views: FieldValue.increment(1)
});
```

## Migration

See `frontend/scripts/migrate-help-articles.ts` for migration from legacy schema.

## Seeding

See `frontend/scripts/seed-help-articles.ts` for seeding from `articles.json`.

## Best Practices

1. **Always use transactions** when updating analytics fields (views, helpful, rating)
2. **Create versions** before major content updates using the versions subcollection
3. **Keep content in sync** between Firestore and `articles.json` (Firestore is source of truth for production)
4. **Monitor query costs** - use appropriate indexes and limit result sets
5. **Cache aggressively** - help articles change infrequently, cache for 5-10 minutes
6. **Validate data** - ensure all required fields are present before writing
7. **Use batch writes** when seeding or migrating multiple articles

