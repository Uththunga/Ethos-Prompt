# Creating Sample Marketplace Data

Since we can't run the initialization script without proper authentication, here's how to manually create sample data through the Firebase Console:

## 1. Access Firebase Console
1. Go to https://console.firebase.google.com/project/rag-prompt-library/firestore
2. Navigate to Firestore Database

## 2. Create Template Categories Collection

Create a new collection called `template_categories` with these documents:

### Document ID: `writing`
```json
{
  "name": "Writing & Content",
  "description": "Templates for content creation, copywriting, and creative writing",
  "icon": "✍️",
  "count": 0
}
```

### Document ID: `coding`
```json
{
  "name": "Code & Development", 
  "description": "Programming, debugging, and software development templates",
  "icon": "💻",
  "count": 0
}
```

### Document ID: `analysis`
```json
{
  "name": "Data Analysis",
  "description": "Templates for data analysis, research, and insights", 
  "icon": "📊",
  "count": 0
}
```

### Document ID: `business`
```json
{
  "name": "Business & Strategy",
  "description": "Business planning, strategy, and professional templates",
  "icon": "💼", 
  "count": 0
}
```

## 3. Create Sample Templates Collection

Create a new collection called `marketplace_templates` with these sample documents:

### Sample Template 1: Blog Post Writer
```json
{
  "title": "Blog Post Writer",
  "description": "Create engaging blog posts on any topic with proper structure and SEO optimization.",
  "content": "Write a comprehensive blog post about {topic}.\n\nStructure:\n1. Compelling headline\n2. Introduction that hooks the reader\n3. Main content with subheadings\n4. Conclusion with call-to-action\n\nRequirements:\n- Target audience: {audience}\n- Tone: {tone}\n- Word count: {word_count}\n- Include relevant keywords for SEO\n\nMake it engaging, informative, and actionable.",
  "category": "writing",
  "tags": ["blog", "content", "seo", "writing"],
  "author": {
    "uid": "system",
    "displayName": "PromptLibrary Team",
    "email": "team@promptlibrary.com",
    "verified": true,
    "rating": 5.0,
    "totalTemplates": 10
  },
  "isPublic": true,
  "isPremium": false,
  "downloads": 1250,
  "likes": 89,
  "views": 3420,
  "rating": 4.8,
  "ratingCount": 156,
  "ratings": [],
  "variables": [
    {
      "name": "topic",
      "type": "string", 
      "description": "The main topic of the blog post",
      "required": true
    },
    {
      "name": "audience",
      "type": "string",
      "description": "Target audience", 
      "required": true
    },
    {
      "name": "tone",
      "type": "string",
      "description": "Writing tone (professional, casual, etc.)",
      "required": false,
      "default": "professional"
    },
    {
      "name": "word_count", 
      "type": "number",
      "description": "Desired word count",
      "required": false,
      "default": "800"
    }
  ],
  "status": "approved",
  "createdAt": "2025-01-28T10:00:00.000Z",
  "updatedAt": "2025-01-28T10:00:00.000Z", 
  "publishedAt": "2025-01-28T10:00:00.000Z"
}
```

### Sample Template 2: Code Review Assistant
```json
{
  "title": "Code Review Assistant",
  "description": "Comprehensive code review template for identifying bugs, improvements, and best practices.",
  "content": "Review the following code and provide detailed feedback:\n\n```{language}\n{code}\n```\n\nPlease analyze:\n1. **Code Quality**: Structure, readability, and maintainability\n2. **Performance**: Potential optimizations and bottlenecks\n3. **Security**: Vulnerabilities and security best practices\n4. **Best Practices**: Language-specific conventions and patterns\n5. **Bugs**: Potential issues and edge cases\n\nProvide specific suggestions for improvement with examples where applicable.",
  "category": "coding",
  "tags": ["code-review", "debugging", "best-practices", "programming"],
  "author": {
    "uid": "system",
    "displayName": "PromptLibrary Team", 
    "email": "team@promptlibrary.com",
    "verified": true,
    "rating": 5.0,
    "totalTemplates": 10
  },
  "isPublic": true,
  "isPremium": false,
  "downloads": 890,
  "likes": 67,
  "views": 2100,
  "rating": 4.7,
  "ratingCount": 89,
  "ratings": [],
  "variables": [
    {
      "name": "language",
      "type": "string",
      "description": "Programming language",
      "required": true
    },
    {
      "name": "code", 
      "type": "text",
      "description": "Code to review",
      "required": true
    }
  ],
  "status": "approved",
  "createdAt": "2025-01-28T10:00:00.000Z",
  "updatedAt": "2025-01-28T10:00:00.000Z",
  "publishedAt": "2025-01-28T10:00:00.000Z"
}
```

## 4. Test the Marketplace

After creating this data:
1. Visit https://rag-prompt-library.web.app/marketplace
2. You should see the categories in the filter dropdown
3. You should see the sample templates in the main grid
4. The search and filtering should work properly

## 5. Alternative: Use Firebase CLI with Authentication

If you have Firebase CLI authentication set up:
```bash
firebase auth:login
node scripts/init-marketplace.js
```

This will authenticate you and allow the script to run properly.
