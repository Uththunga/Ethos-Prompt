import type { PromptTemplate, TemplateCategory } from '../types';

// Mock template data - in a real implementation, this would come from an API
export class TemplateService {
  private static instance: TemplateService;
  private templates: PromptTemplate[] = [];
  private categories: TemplateCategory[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  private initializeMockData() {
    // Initialize categories
    this.categories = [
      {
        id: 'content',
        name: 'Content Creation',
        description: 'Writing, blogging, marketing content',
        icon: 'BookOpen',
        color: 'blue'
      },
      {
        id: 'analysis',
        name: 'Data Analysis',
        description: 'Research, summarization, insights',
        icon: 'BarChart',
        color: 'green'
      },
      {
        id: 'support',
        name: 'Customer Support',
        description: 'Help desk, FAQ, responses',
        icon: 'MessageSquare',
        color: 'purple'
      },
      {
        id: 'development',
        name: 'Development',
        description: 'Code review, documentation',
        icon: 'Code',
        color: 'orange'
      },
      {
        id: 'business',
        name: 'Business',
        description: 'Proposals, reports, planning',
        icon: 'Briefcase',
        color: 'red'
      },
      {
        id: 'education',
        name: 'Education',
        description: 'Tutoring, explanations, quizzes',
        icon: 'GraduationCap',
        color: 'indigo'
      }
    ];

    // Initialize templates
    this.templates = [
      {
        id: '1',
        title: 'Document Summarizer',
        description: 'Extract key points and insights from any document with RAG support',
        content: `You are an expert document analyst. Please provide a comprehensive summary of the following document:

{{document_content}}

Based on the provided context: {{context}}

Please structure your summary as follows:

## Executive Summary
Provide a brief 2-3 sentence overview of the main topic and purpose.

## Key Points
- List the most important findings, arguments, or information
- Include specific details and data points where relevant
- Highlight any conclusions or recommendations

## Insights & Analysis
- What are the implications of the information presented?
- Are there any patterns, trends, or notable observations?
- What questions does this document raise?

## Actionable Items
- What specific actions or next steps are suggested?
- Are there any deadlines or time-sensitive elements?
- Who are the key stakeholders mentioned?

Focus on accuracy and clarity. If any information is unclear or missing, please note this in your summary.`,
        category: this.categories[1], // Data Analysis
        tags: ['summarization', 'analysis', 'documents', 'rag'],
        variables: [
          {
            name: 'document_content',
            type: 'string',
            description: 'The main document content to summarize',
            required: true
          },
          {
            name: 'context',
            type: 'string',
            description: 'Additional context from RAG retrieval',
            required: false
          }
        ],
        difficulty: 'beginner',
        useCase: ['research', 'content-review', 'knowledge-extraction'],
        industry: ['general', 'business', 'academic'],
        rating: 4.8,
        usageCount: 1250,
        author: 'PromptLibrary Team',
        isOfficial: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        title: 'SEO Blog Post Writer',
        description: 'Generate engaging, SEO-optimized blog posts with proper structure',
        content: `You are an expert content writer and SEO specialist. Create a comprehensive blog post about {{topic}} for {{target_audience}}.

## Content Requirements:
- **Target Audience**: {{target_audience}}
- **Tone**: {{tone}}
- **Word Count**: Approximately {{word_count}} words
- **SEO Focus**: Include relevant keywords naturally

## Blog Post Structure:

### 1. Compelling Headline
Create an attention-grabbing headline that includes the main keyword and promises value.

### 2. Introduction (150-200 words)
- Hook the reader with an interesting fact, question, or statistic
- Clearly state what the post will cover
- Include the main keyword naturally
- Preview the value readers will get

### 3. Main Content Sections
Organize the content into 3-5 main sections with:
- Clear H2 subheadings that include related keywords
- Actionable information and practical tips
- Examples, case studies, or data to support points
- Bullet points or numbered lists for easy scanning

### 4. Conclusion & Call-to-Action
- Summarize the key takeaways
- Include a clear call-to-action
- Encourage engagement (comments, shares, etc.)

## SEO Guidelines:
- Use the main keyword in the title, first paragraph, and naturally throughout
- Include related keywords and synonyms
- Write meta description-worthy summary sentences
- Ensure content is valuable and answers user intent
- Use internal linking opportunities where relevant

Make the content engaging, informative, and actionable for the target audience.`,
        category: this.categories[0], // Content Creation
        tags: ['content-creation', 'blogging', 'seo', 'marketing'],
        variables: [
          {
            name: 'topic',
            type: 'string',
            description: 'The main topic for the blog post',
            required: true
          },
          {
            name: 'target_audience',
            type: 'string',
            description: 'Who is the target audience (e.g., small business owners, developers)',
            required: true
          },
          {
            name: 'tone',
            type: 'string',
            description: 'Writing tone (professional, casual, friendly, authoritative)',
            required: false,
            defaultValue: 'professional'
          },
          {
            name: 'word_count',
            type: 'number',
            description: 'Target word count for the post',
            required: false,
            defaultValue: 1200
          }
        ],
        difficulty: 'intermediate',
        useCase: ['content-marketing', 'blogging', 'seo'],
        industry: ['marketing', 'media', 'business'],
        rating: 4.6,
        usageCount: 890,
        author: 'Content Team',
        isOfficial: true,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        title: 'Customer Support Response Generator',
        description: 'Create empathetic and helpful customer support responses',
        content: `You are a professional customer support representative known for exceptional service. Please respond to the following customer inquiry with empathy, clarity, and helpfulness.

## Customer Information:
**Customer Message**: {{customer_message}}
**Customer Context**: {{customer_context}}
**Issue Category**: {{issue_category}}

## Response Guidelines:

### 1. Acknowledge & Empathize
- Thank the customer for reaching out
- Acknowledge their concern or frustration
- Show understanding of their situation

### 2. Provide Clear Solution
- Address their specific issue directly
- Provide step-by-step instructions if needed
- Offer alternative solutions when applicable
- Include relevant links or resources

### 3. Professional Tone
- Be friendly but professional
- Use positive language
- Avoid technical jargon unless necessary
- Personalize the response with their name if available

### 4. Next Steps
- Clearly outline what happens next
- Provide timeline expectations
- Offer additional assistance
- Include contact information for follow-up

### 5. Closing
- Thank them for their patience
- Invite them to reach out with any questions
- End with a professional signature

## Response Format:
Write a complete email response that addresses all aspects of their inquiry while maintaining a helpful and professional tone.

Remember: The goal is to resolve their issue while creating a positive customer experience that builds loyalty and trust.`,
        category: this.categories[2], // Customer Support
        tags: ['customer-service', 'support', 'communication', 'email'],
        variables: [
          {
            name: 'customer_message',
            type: 'string',
            description: 'The customer\'s original message or complaint',
            required: true
          },
          {
            name: 'customer_context',
            type: 'string',
            description: 'Additional context about the customer or their account',
            required: false
          },
          {
            name: 'issue_category',
            type: 'string',
            description: 'Type of issue (billing, technical, product, etc.)',
            required: false
          }
        ],
        difficulty: 'beginner',
        useCase: ['customer-support', 'help-desk', 'communication'],
        industry: ['retail', 'saas', 'service'],
        rating: 4.7,
        usageCount: 2100,
        author: 'Support Team',
        isOfficial: true,
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-25')
      },
      {
        id: '4',
        title: 'Code Review Assistant',
        description: 'Comprehensive code review with security, performance, and best practices analysis',
        content: `You are a senior software engineer and code review expert. Please provide a thorough review of the following code submission.

## Code Details:
**Programming Language**: {{language}}
**Context/Purpose**: {{context}}

**Code to Review**:
\`\`\`{{language}}
{{code}}
\`\`\`

## Review Areas:

### 1. Code Quality & Best Practices
- **Readability**: Is the code easy to read and understand?
- **Naming**: Are variables, functions, and classes well-named?
- **Structure**: Is the code well-organized and follows language conventions?
- **Comments**: Are comments helpful and not redundant?

### 2. Functionality & Logic
- **Correctness**: Does the code do what it's supposed to do?
- **Edge Cases**: Are potential edge cases handled?
- **Error Handling**: Is error handling appropriate and comprehensive?
- **Input Validation**: Are inputs properly validated?

### 3. Performance Considerations
- **Efficiency**: Are there any performance bottlenecks?
- **Memory Usage**: Is memory used efficiently?
- **Scalability**: Will this code scale well?
- **Database Queries**: Are database operations optimized?

### 4. Security Analysis
- **Vulnerabilities**: Are there any security risks?
- **Input Sanitization**: Is user input properly sanitized?
- **Authentication/Authorization**: Are security controls in place?
- **Data Exposure**: Is sensitive data properly protected?

### 5. Maintainability
- **Modularity**: Is the code modular and reusable?
- **Testing**: Is the code testable? Are tests needed?
- **Documentation**: Is the code self-documenting?
- **Dependencies**: Are dependencies appropriate and minimal?

## Review Format:

### Summary
Provide a brief overall assessment of the code quality.

### Strengths
List what the code does well.

### Issues Found
For each issue, provide:
- **Severity**: Critical/High/Medium/Low
- **Description**: What the issue is
- **Location**: Line numbers or code sections
- **Recommendation**: How to fix it
- **Example**: Show improved code if helpful

### Suggestions for Improvement
Additional recommendations for enhancement.

### Security Considerations
Specific security-related observations.

### Next Steps
Recommended actions before merging/deploying.

Be constructive and specific in your feedback. Focus on helping the developer improve while maintaining code quality standards.`,
        category: this.categories[3], // Development
        tags: ['code-review', 'development', 'quality-assurance', 'security'],
        variables: [
          {
            name: 'language',
            type: 'string',
            description: 'Programming language (e.g., JavaScript, Python, Java)',
            required: true
          },
          {
            name: 'code',
            type: 'string',
            description: 'The code to review',
            required: true
          },
          {
            name: 'context',
            type: 'string',
            description: 'Context about what this code is supposed to do',
            required: false
          }
        ],
        difficulty: 'advanced',
        useCase: ['code-review', 'development', 'quality-assurance'],
        industry: ['technology', 'software'],
        rating: 4.9,
        usageCount: 650,
        author: 'Dev Team',
        isOfficial: true,
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-22')
      }
    ];
  }

  async getTemplates(filters?: {
    category?: string;
    difficulty?: string;
    searchTerm?: string;
    sortBy?: 'rating' | 'usage' | 'recent';
  }): Promise<PromptTemplate[]> {
    let filteredTemplates = [...this.templates];

    if (filters) {
      if (filters.category) {
        filteredTemplates = filteredTemplates.filter(t => t.category.id === filters.category);
      }

      if (filters.difficulty) {
        filteredTemplates = filteredTemplates.filter(t => t.difficulty === filters.difficulty);
      }

      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredTemplates = filteredTemplates.filter(t =>
          t.title.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters.sortBy) {
        filteredTemplates.sort((a, b) => {
          switch (filters.sortBy) {
            case 'rating':
              return b.rating - a.rating;
            case 'usage':
              return b.usageCount - a.usageCount;
            case 'recent':
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            default:
              return 0;
          }
        });
      }
    }

    return filteredTemplates;
  }

  async getCategories(): Promise<TemplateCategory[]> {
    return [...this.categories];
  }

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    return this.templates.find(t => t.id === id) || null;
  }

  async incrementUsage(id: string): Promise<void> {
    const template = this.templates.find(t => t.id === id);
    if (template) {
      template.usageCount++;
    }
  }
}

export const templateService = TemplateService.getInstance();
