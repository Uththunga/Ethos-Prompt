# API Integration Tutorials

## Tutorial 1: Getting Started with Prompt Execution

### Step 1: Setup and Authentication

```javascript
// Install the SDK
// npm install @rag-prompt-library/sdk

import { RAGPromptLibrary } from '@rag-prompt-library/sdk';

const client = new RAGPromptLibrary({
  apiKey: process.env.RAG_API_KEY, // Get from dashboard
  baseURL: 'https://api.ragpromptlibrary.com/v1'
});
```

### Step 2: Create Your First Prompt

```javascript
async function createContentPrompt() {
  const prompt = await client.prompts.create({
    title: 'Blog Post Generator',
    content: `Write a {{word_count}}-word blog post about {{topic}}.
    
Target audience: {{audience}}
Tone: {{tone}}
Key points to cover: {{key_points}}

Make it engaging and SEO-friendly.`,
    category: 'content',
    tags: ['blog', 'content', 'seo'],
    variables: [
      {
        name: 'topic',
        type: 'text',
        required: true,
        description: 'Main topic of the blog post'
      },
      {
        name: 'word_count',
        type: 'number',
        required: true,
        description: 'Target word count'
      },
      {
        name: 'audience',
        type: 'text',
        required: true,
        description: 'Target audience'
      },
      {
        name: 'tone',
        type: 'select',
        options: ['professional', 'casual', 'technical', 'friendly'],
        required: true,
        description: 'Writing tone'
      },
      {
        name: 'key_points',
        type: 'textarea',
        required: false,
        description: 'Key points to include'
      }
    ],
    model_config: {
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 1000
    }
  });
  
  console.log('Prompt created:', prompt.id);
  return prompt;
}
```

### Step 3: Execute the Prompt

```javascript
async function generateBlogPost(promptId) {
  const result = await client.prompts.execute(promptId, {
    variables: {
      topic: 'Sustainable Web Development',
      word_count: 800,
      audience: 'web developers',
      tone: 'professional',
      key_points: 'Green hosting, efficient code, performance optimization'
    }
  });
  
  console.log('Generated content:', result.result);
  console.log('Cost:', `$${result.cost.toFixed(4)}`);
  console.log('Tokens used:', result.usage.total_tokens);
  
  return result;
}
```

### Step 4: Complete Example

```javascript
async function main() {
  try {
    // Create prompt
    const prompt = await createContentPrompt();
    
    // Execute prompt
    const result = await generateBlogPost(prompt.id);
    
    // Save result to file
    const fs = require('fs');
    fs.writeFileSync('generated-blog-post.md', result.result);
    
    console.log('Blog post saved to generated-blog-post.md');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Tutorial 2: Document Upload and RAG Integration

### Step 1: Upload and Process Documents

```javascript
async function uploadDocument(filePath) {
  const fs = require('fs');
  const fileBuffer = fs.readFileSync(filePath);
  
  // Upload document
  const document = await client.documents.upload({
    file: fileBuffer,
    filename: 'company-handbook.pdf',
    name: 'Company Employee Handbook',
    description: 'Complete employee handbook with policies and procedures',
    tags: ['handbook', 'policies', 'hr'],
    folder: 'hr-documents'
  });
  
  console.log('Document uploaded:', document.id);
  
  // Wait for processing
  const processedDoc = await client.documents.waitForProcessing(document.id, {
    timeout: 300000, // 5 minutes
    pollInterval: 5000 // Check every 5 seconds
  });
  
  console.log(`Document processed: ${processedDoc.chunks_created} chunks created`);
  return processedDoc;
}
```

### Step 2: Create RAG-Enabled Prompt

```javascript
async function createRAGPrompt(documentIds) {
  const prompt = await client.prompts.create({
    title: 'HR Policy Assistant',
    content: `Based on the company handbook, answer the following question:

Question: {{question}}

Instructions:
- Use only information from the uploaded company handbook
- Provide specific policy references when possible
- If the information isn't available in the handbook, clearly state this
- Include relevant section numbers or page references

Answer:`,
    category: 'hr',
    tags: ['rag', 'hr', 'policies'],
    variables: [
      {
        name: 'question',
        type: 'textarea',
        required: true,
        description: 'HR-related question'
      }
    ],
    document_ids: documentIds, // Link to uploaded documents
    model_config: {
      model: 'gpt-4',
      temperature: 0.1, // Low temperature for factual responses
      max_tokens: 500
    }
  });
  
  return prompt;
}
```

### Step 3: Execute RAG Queries

```javascript
async function askHRQuestion(promptId, question) {
  const result = await client.prompts.execute(promptId, {
    variables: { question },
    rag_config: {
      search_mode: 'hybrid', // Use both semantic and keyword search
      max_chunks: 5, // Limit context to top 5 relevant chunks
      threshold: 0.7 // Minimum similarity threshold
    }
  });
  
  return result;
}
```

### Step 4: Complete RAG Workflow

```javascript
async function ragWorkflow() {
  try {
    // 1. Upload document
    const document = await uploadDocument('./company-handbook.pdf');
    
    // 2. Create RAG prompt
    const prompt = await createRAGPrompt([document.id]);
    
    // 3. Ask questions
    const questions = [
      'What is the vacation policy?',
      'How do I request time off?',
      'What are the remote work guidelines?'
    ];
    
    for (const question of questions) {
      console.log(`\nQuestion: ${question}`);
      const answer = await askHRQuestion(prompt.id, question);
      console.log(`Answer: ${answer.result}`);
      console.log(`Cost: $${answer.cost.toFixed(4)}`);
    }
  } catch (error) {
    console.error('RAG workflow error:', error.message);
  }
}

ragWorkflow();
```

## Tutorial 3: Workspace Management

### Step 1: Create and Configure Workspace

```javascript
async function createTeamWorkspace() {
  const workspace = await client.workspaces.create({
    name: 'Marketing Team',
    description: 'Workspace for marketing content creation and campaigns',
    settings: {
      default_model: 'gpt-4',
      allow_public_prompts: false,
      require_approval: true,
      max_monthly_cost: 500.00
    }
  });
  
  console.log('Workspace created:', workspace.id);
  return workspace;
}
```

### Step 2: Invite Team Members

```javascript
async function inviteTeamMembers(workspaceId) {
  const members = [
    { email: 'sarah@company.com', role: 'admin' },
    { email: 'mike@company.com', role: 'editor' },
    { email: 'lisa@company.com', role: 'viewer' }
  ];
  
  for (const member of members) {
    try {
      const invitation = await client.workspaces.inviteMember(workspaceId, {
        email: member.email,
        role: member.role,
        message: `Welcome to our Marketing Team workspace! You've been added as a ${member.role}.`
      });
      
      console.log(`Invited ${member.email} as ${member.role}`);
    } catch (error) {
      console.error(`Failed to invite ${member.email}:`, error.message);
    }
  }
}
```

### Step 3: Create Shared Prompts

```javascript
async function createSharedPrompts(workspaceId) {
  const prompts = [
    {
      title: 'Social Media Post Generator',
      content: 'Create a {{platform}} post about {{topic}} for {{audience}}...',
      category: 'social-media',
      tags: ['social', 'marketing']
    },
    {
      title: 'Email Subject Line Generator',
      content: 'Generate compelling email subject lines for {{campaign_type}}...',
      category: 'email',
      tags: ['email', 'marketing']
    }
  ];
  
  for (const promptData of prompts) {
    const prompt = await client.prompts.create({
      ...promptData,
      workspace_id: workspaceId,
      is_shared: true
    });
    
    console.log(`Created shared prompt: ${prompt.title}`);
  }
}
```

### Step 4: Monitor Workspace Usage

```javascript
async function monitorWorkspaceUsage(workspaceId) {
  const analytics = await client.analytics.workspace(workspaceId, {
    period: 'month',
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  });
  
  console.log('Workspace Analytics:');
  console.log(`Total executions: ${analytics.summary.total_executions}`);
  console.log(`Total cost: $${analytics.summary.total_cost.toFixed(2)}`);
  console.log(`Active members: ${analytics.summary.active_members}`);
  
  console.log('\nTop prompts:');
  analytics.top_prompts.forEach((prompt, index) => {
    console.log(`${index + 1}. ${prompt.title} - ${prompt.executions} executions`);
  });
  
  return analytics;
}
```

## Tutorial 4: Building a Content Generation Pipeline

### Step 1: Pipeline Configuration

```javascript
class ContentPipeline {
  constructor(client) {
    this.client = client;
    this.prompts = {};
  }
  
  async initialize() {
    // Create pipeline prompts
    this.prompts.ideaGenerator = await this.createIdeaGeneratorPrompt();
    this.prompts.outlineCreator = await this.createOutlinePrompt();
    this.prompts.contentWriter = await this.createContentPrompt();
    this.prompts.seoOptimizer = await this.createSEOPrompt();
  }
  
  async createIdeaGeneratorPrompt() {
    return await this.client.prompts.create({
      title: 'Content Idea Generator',
      content: `Generate 5 content ideas for {{industry}} targeting {{audience}}.
      
Focus on: {{focus_areas}}
Content type: {{content_type}}

For each idea, provide:
1. Title
2. Brief description
3. Key points to cover
4. Target keywords`,
      category: 'ideation',
      variables: [
        { name: 'industry', type: 'text', required: true },
        { name: 'audience', type: 'text', required: true },
        { name: 'focus_areas', type: 'textarea', required: true },
        { name: 'content_type', type: 'select', options: ['blog', 'video', 'podcast', 'social'], required: true }
      ]
    });
  }
  
  async generateContent(topic, industry, audience) {
    try {
      // Step 1: Generate ideas
      const ideas = await this.client.prompts.execute(this.prompts.ideaGenerator.id, {
        variables: {
          industry,
          audience,
          focus_areas: topic,
          content_type: 'blog'
        }
      });
      
      // Step 2: Create outline for first idea
      const outline = await this.client.prompts.execute(this.prompts.outlineCreator.id, {
        variables: {
          idea: ideas.result.split('\n')[0], // Use first idea
          target_length: '1000'
        }
      });
      
      // Step 3: Write content
      const content = await this.client.prompts.execute(this.prompts.contentWriter.id, {
        variables: {
          outline: outline.result,
          tone: 'professional',
          audience
        }
      });
      
      // Step 4: SEO optimization
      const optimized = await this.client.prompts.execute(this.prompts.seoOptimizer.id, {
        variables: {
          content: content.result,
          target_keywords: topic
        }
      });
      
      return {
        ideas: ideas.result,
        outline: outline.result,
        content: content.result,
        optimized: optimized.result,
        totalCost: ideas.cost + outline.cost + content.cost + optimized.cost
      };
    } catch (error) {
      console.error('Pipeline error:', error);
      throw error;
    }
  }
}

// Usage
async function runContentPipeline() {
  const pipeline = new ContentPipeline(client);
  await pipeline.initialize();
  
  const result = await pipeline.generateContent(
    'sustainable technology',
    'technology',
    'software developers'
  );
  
  console.log('Content generated successfully!');
  console.log(`Total cost: $${result.totalCost.toFixed(4)}`);
  
  // Save results
  const fs = require('fs');
  fs.writeFileSync('generated-content.json', JSON.stringify(result, null, 2));
}
```

## Tutorial 5: Error Handling and Monitoring

### Step 1: Comprehensive Error Handling

```javascript
class RobustRAGClient {
  constructor(options) {
    this.client = new RAGPromptLibrary(options);
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000
    };
  }
  
  async executeWithRetry(promptId, variables) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await this.client.prompts.execute(promptId, { variables });
      } catch (error) {
        lastError = error;
        
        // Don't retry certain errors
        if (error.code === 'INVALID_API_KEY' || error.code === 'INSUFFICIENT_PERMISSIONS') {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(2, attempt - 1),
          this.retryConfig.maxDelay
        );
        
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}
```

### Step 2: Usage Monitoring

```javascript
class UsageMonitor {
  constructor(client) {
    this.client = client;
    this.dailyUsage = {
      executions: 0,
      cost: 0,
      tokens: 0
    };
  }
  
  async trackExecution(promptId, variables) {
    const startTime = Date.now();
    
    try {
      const result = await this.client.prompts.execute(promptId, { variables });
      
      // Update usage tracking
      this.dailyUsage.executions++;
      this.dailyUsage.cost += result.cost;
      this.dailyUsage.tokens += result.usage.total_tokens;
      
      // Log successful execution
      console.log(`Execution completed in ${Date.now() - startTime}ms`);
      console.log(`Daily usage: ${this.dailyUsage.executions} executions, $${this.dailyUsage.cost.toFixed(4)}`);
      
      return result;
    } catch (error) {
      console.error(`Execution failed after ${Date.now() - startTime}ms:`, error.message);
      throw error;
    }
  }
  
  getDailyUsage() {
    return { ...this.dailyUsage };
  }
  
  resetDailyUsage() {
    this.dailyUsage = { executions: 0, cost: 0, tokens: 0 };
  }
}
```

These tutorials provide comprehensive, step-by-step guidance for integrating the RAG Prompt Library API into various applications and workflows.
