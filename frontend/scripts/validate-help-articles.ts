/**
 * Help Articles Content Validation Script
 * 
 * Validates articles.json for:
 * - JSON syntax
 * - Required fields
 * - Data types
 * - Content quality
 * - Cross-references
 * - Markdown syntax
 * 
 * Usage:
 *   npm run validate-help-articles
 *   npm run validate-help-articles -- --verbose
 *   npm run validate-help-articles -- --fix
 */

import * as fs from 'fs';
import * as path from 'path';

// Types
interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  subcategory?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  views?: number;
  helpful?: number;
  rating?: number;
  estimatedReadTime?: number;
  featured?: boolean;
  prerequisites?: string[];
  relatedArticles?: string[];
  faqs?: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

interface ValidationError {
  articleId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// Parse command line arguments
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose');
const shouldFix = args.includes('--fix');

// Load articles
const articlesPath = path.join(__dirname, '../src/data/help/articles.json');
let articles: HelpArticle[];

try {
  const articlesData = fs.readFileSync(articlesPath, 'utf8');
  articles = JSON.parse(articlesData);
  console.log(`✅ Loaded ${articles.length} articles from ${articlesPath}\n`);
} catch (error) {
  console.error('❌ Failed to load articles.json:', error);
  process.exit(1);
}

// Validation errors
const errors: ValidationError[] = [];

// Validation functions
function validateRequiredFields(article: HelpArticle) {
  const requiredFields = ['id', 'slug', 'title', 'content', 'excerpt', 'category', 'tags', 'difficulty', 'lastUpdated'];
  
  for (const field of requiredFields) {
    if (!(field in article) || article[field as keyof HelpArticle] === undefined) {
      errors.push({
        articleId: article.id || 'unknown',
        field,
        message: `Missing required field: ${field}`,
        severity: 'error',
      });
    }
  }
}

function validateDataTypes(article: HelpArticle) {
  // String fields
  const stringFields = ['id', 'slug', 'title', 'content', 'excerpt', 'category', 'difficulty', 'lastUpdated'];
  for (const field of stringFields) {
    if (field in article && typeof article[field as keyof HelpArticle] !== 'string') {
      errors.push({
        articleId: article.id,
        field,
        message: `Field ${field} must be a string`,
        severity: 'error',
      });
    }
  }

  // Array fields
  if (!Array.isArray(article.tags)) {
    errors.push({
      articleId: article.id,
      field: 'tags',
      message: 'Tags must be an array',
      severity: 'error',
    });
  }

  if (article.prerequisites && !Array.isArray(article.prerequisites)) {
    errors.push({
      articleId: article.id,
      field: 'prerequisites',
      message: 'Prerequisites must be an array',
      severity: 'error',
    });
  }

  if (article.relatedArticles && !Array.isArray(article.relatedArticles)) {
    errors.push({
      articleId: article.id,
      field: 'relatedArticles',
      message: 'Related articles must be an array',
      severity: 'error',
    });
  }

  // Number fields
  if (article.estimatedReadTime !== undefined && typeof article.estimatedReadTime !== 'number') {
    errors.push({
      articleId: article.id,
      field: 'estimatedReadTime',
      message: 'Estimated read time must be a number',
      severity: 'error',
    });
  }

  // Boolean fields
  if (article.featured !== undefined && typeof article.featured !== 'boolean') {
    errors.push({
      articleId: article.id,
      field: 'featured',
      message: 'Featured must be a boolean',
      severity: 'error',
    });
  }
}

function validateEnums(article: HelpArticle) {
  const validCategories = ['getting-started', 'core-features', 'account-settings', 'troubleshooting', 'api', 'best-practices'];
  if (!validCategories.includes(article.category)) {
    errors.push({
      articleId: article.id,
      field: 'category',
      message: `Invalid category: ${article.category}. Must be one of: ${validCategories.join(', ')}`,
      severity: 'error',
    });
  }

  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(article.difficulty)) {
    errors.push({
      articleId: article.id,
      field: 'difficulty',
      message: `Invalid difficulty: ${article.difficulty}. Must be one of: ${validDifficulties.join(', ')}`,
      severity: 'error',
    });
  }
}

function validateContentQuality(article: HelpArticle) {
  // Title length
  if (article.title.length < 10) {
    errors.push({
      articleId: article.id,
      field: 'title',
      message: 'Title is too short (< 10 characters)',
      severity: 'warning',
    });
  }

  if (article.title.length > 100) {
    errors.push({
      articleId: article.id,
      field: 'title',
      message: 'Title is too long (> 100 characters)',
      severity: 'warning',
    });
  }

  // Excerpt length
  if (article.excerpt.length < 50) {
    errors.push({
      articleId: article.id,
      field: 'excerpt',
      message: 'Excerpt is too short (< 50 characters)',
      severity: 'warning',
    });
  }

  if (article.excerpt.length > 250) {
    errors.push({
      articleId: article.id,
      field: 'excerpt',
      message: 'Excerpt is too long (> 250 characters)',
      severity: 'warning',
    });
  }

  // Content length
  if (article.content.length < 200) {
    errors.push({
      articleId: article.id,
      field: 'content',
      message: 'Content is too short (< 200 characters)',
      severity: 'warning',
    });
  }

  // Tags count
  if (article.tags.length === 0) {
    errors.push({
      articleId: article.id,
      field: 'tags',
      message: 'Article has no tags',
      severity: 'warning',
    });
  }

  if (article.tags.length > 10) {
    errors.push({
      articleId: article.id,
      field: 'tags',
      message: 'Too many tags (> 10)',
      severity: 'warning',
    });
  }
}

function validateMarkdown(article: HelpArticle) {
  const content = article.content;

  // Check for H1 heading
  if (!content.match(/^# /m)) {
    errors.push({
      articleId: article.id,
      field: 'content',
      message: 'Content should start with H1 heading (# Title)',
      severity: 'warning',
    });
  }

  // Check for multiple H1 headings
  const h1Count = (content.match(/^# /gm) || []).length;
  if (h1Count > 1) {
    errors.push({
      articleId: article.id,
      field: 'content',
      message: `Content has ${h1Count} H1 headings, should have only 1`,
      severity: 'warning',
    });
  }

  // Check for broken links
  const linkMatches = content.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
  for (const match of linkMatches) {
    const url = match[2];
    if (url.startsWith('/dashboard/help/') && !url.includes('{{')) {
      // Internal help link - validate it exists
      const slug = url.split('/').pop();
      const exists = articles.some(a => a.slug === slug);
      if (!exists) {
        errors.push({
          articleId: article.id,
          field: 'content',
          message: `Broken internal link: ${url}`,
          severity: 'error',
        });
      }
    }
  }
}

function validateCrossReferences(article: HelpArticle) {
  // Validate prerequisites exist
  if (article.prerequisites) {
    for (const prereq of article.prerequisites) {
      const exists = articles.some(a => a.slug === prereq);
      if (!exists) {
        errors.push({
          articleId: article.id,
          field: 'prerequisites',
          message: `Prerequisite article not found: ${prereq}`,
          severity: 'error',
        });
      }
    }
  }

  // Validate related articles exist
  if (article.relatedArticles) {
    for (const related of article.relatedArticles) {
      const exists = articles.some(a => a.slug === related);
      if (!exists) {
        errors.push({
          articleId: article.id,
          field: 'relatedArticles',
          message: `Related article not found: ${related}`,
          severity: 'error',
        });
      }
    }
  }
}

function validateUniqueIds() {
  const ids = new Set<string>();
  const slugs = new Set<string>();

  for (const article of articles) {
    if (ids.has(article.id)) {
      errors.push({
        articleId: article.id,
        field: 'id',
        message: `Duplicate article ID: ${article.id}`,
        severity: 'error',
      });
    }
    ids.add(article.id);

    if (slugs.has(article.slug)) {
      errors.push({
        articleId: article.id,
        field: 'slug',
        message: `Duplicate article slug: ${article.slug}`,
        severity: 'error',
      });
    }
    slugs.add(article.slug);
  }
}

// Run validations
console.log('🔍 Validating help articles...\n');

for (const article of articles) {
  validateRequiredFields(article);
  validateDataTypes(article);
  validateEnums(article);
  validateContentQuality(article);
  validateMarkdown(article);
  validateCrossReferences(article);
}

validateUniqueIds();

// Report results
console.log('📊 Validation Results:\n');

const errorCount = errors.filter(e => e.severity === 'error').length;
const warningCount = errors.filter(e => e.severity === 'warning').length;

if (errors.length === 0) {
  console.log('✅ All articles are valid!\n');
  process.exit(0);
} else {
  console.log(`❌ Found ${errorCount} errors and ${warningCount} warnings\n`);

  // Group errors by article
  const errorsByArticle = new Map<string, ValidationError[]>();
  for (const error of errors) {
    if (!errorsByArticle.has(error.articleId)) {
      errorsByArticle.set(error.articleId, []);
    }
    errorsByArticle.get(error.articleId)!.push(error);
  }

  // Print errors
  for (const [articleId, articleErrors] of errorsByArticle) {
    console.log(`\n📄 ${articleId}:`);
    for (const error of articleErrors) {
      const icon = error.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${icon} [${error.field}] ${error.message}`);
    }
  }

  console.log('\n');
  process.exit(errorCount > 0 ? 1 : 0);
}

