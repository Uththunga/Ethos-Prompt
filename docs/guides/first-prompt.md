# First Prompt Tutorial

Step-by-step tutorial for creating and executing your first prompt with RAG capabilities.

## Overview

This tutorial will guide you through creating your first prompt in the RAG Prompt Library, from initial setup to execution with document integration.

**Time Required**: 15-20 minutes  
**Prerequisites**: Account setup completed (see [Quick Start Guide](quick-start.md))

## Step 1: Access the Prompt Editor

1. **Log in** to your RAG Prompt Library account
2. **Navigate** to the Dashboard
3. **Click** the "Create New Prompt" button
4. **Select** "Blank Prompt" template

## Step 2: Basic Prompt Setup

### Prompt Information
```
Name: My First AI Assistant
Description: A helpful AI assistant that can answer questions using uploaded documents
Category: General
Tags: tutorial, first-prompt, assistant
```

### Basic Prompt Template
```
You are a helpful AI assistant. Please answer the following question:

Question: {{question}}

Please provide a clear, concise answer based on the available information.
```

**Key Points:**
- Use `{{variable_name}}` for dynamic content
- Keep initial prompts simple and clear
- Add descriptive names and tags for organization

## Step 3: Add Variables

Variables make your prompts reusable and dynamic.

### Define Variables
1. **Click** "Add Variable" in the prompt editor
2. **Configure** the variable:
   ```
   Name: question
   Type: text
   Description: The question to ask the AI
   Default Value: What is artificial intelligence?
   Required: Yes
   ```

### Variable Types
- **Text**: Short text inputs
- **Textarea**: Long text inputs
- **Number**: Numeric values
- **Boolean**: True/false values
- **Select**: Dropdown options

## Step 4: Upload a Document

To demonstrate RAG capabilities, let's upload a document.

### Upload Process
1. **Navigate** to "Documents" section
2. **Click** "Upload Document"
3. **Select** a file (PDF, DOCX, TXT supported)
4. **Add metadata**:
   ```
   Title: AI Basics Guide
   Category: Reference
   Tags: ai, machine-learning, basics
   Description: Introductory guide to artificial intelligence
   ```
5. **Click** "Upload and Process"

### Processing Status
- **Uploading**: File is being uploaded
- **Processing**: Document is being analyzed and indexed
- **Ready**: Document is available for RAG queries
- **Error**: Processing failed (check file format and size)

## Step 5: Enable RAG Integration

### Configure RAG Settings
1. **In the prompt editor**, scroll to "RAG Settings"
2. **Enable** "Use RAG" toggle
3. **Select** documents to include:
   - Choose "AI Basics Guide" (uploaded in Step 4)
   - Or select "Auto-select relevant documents"
4. **Configure** retrieval settings:
   ```
   Max Documents: 3
   Similarity Threshold: 0.7
   Context Length: 2000 tokens
   ```

### RAG Template Enhancement
Update your prompt template to use RAG context:

```
You are a helpful AI assistant with access to relevant documents.

Question: {{question}}

Context from documents:
{{rag_context}}

Please answer the question using the provided context. If the context doesn't contain relevant information, say so clearly.
```

## Step 6: Configure AI Settings

### Model Selection
```
Provider: OpenAI
Model: gpt-4
Temperature: 0.7
Max Tokens: 500
Top P: 1.0
```

### Settings Explanation
- **Temperature**: Controls randomness (0.0 = deterministic, 1.0 = creative)
- **Max Tokens**: Maximum response length
- **Top P**: Controls diversity of word selection

## Step 7: Test Your Prompt

### Test Configuration
1. **Click** "Test Prompt" button
2. **Enter** test values:
   ```
   question: What are the main types of machine learning?
   ```
3. **Click** "Run Test"

### Expected Output
```
Based on the provided context, there are three main types of machine learning:

1. **Supervised Learning**: Uses labeled training data to learn patterns
2. **Unsupervised Learning**: Finds patterns in data without labels
3. **Reinforcement Learning**: Learns through interaction and feedback

This information comes from the AI Basics Guide document in your knowledge base.
```

### Troubleshooting Test Issues
- **No response**: Check AI provider settings and API keys
- **Generic response**: Ensure RAG is enabled and documents are processed
- **Error messages**: Review prompt syntax and variable definitions

## Step 8: Save and Organize

### Save Your Prompt
1. **Click** "Save Prompt"
2. **Verify** all settings are correct
3. **Add** to a collection (optional):
   ```
   Collection: Tutorial Prompts
   Description: Prompts created during tutorials
   ```

### Organization Tips
- Use descriptive names and tags
- Group related prompts in collections
- Add detailed descriptions for team collaboration

## Step 9: Share and Collaborate

### Sharing Options
1. **Public**: Anyone can view and use
2. **Team**: Only team members can access
3. **Private**: Only you can access

### Collaboration Features
- **Comments**: Add notes and feedback
- **Version History**: Track changes over time
- **Duplicate**: Create copies for experimentation

## Step 10: Advanced Features

### Conditional Logic
```
You are a helpful AI assistant.

{{#if use_formal_tone}}
Please provide a formal, professional response to: {{question}}
{{else}}
Please provide a casual, friendly response to: {{question}}
{{/if}}

Context: {{rag_context}}
```

### Multiple Document Types
- **Research Papers**: Academic and technical content
- **Manuals**: Step-by-step procedures
- **FAQs**: Common questions and answers
- **Code Documentation**: Technical specifications

### Performance Optimization
- **Token Management**: Monitor usage to control costs
- **Caching**: Enable for frequently used prompts
- **Batch Processing**: Process multiple queries efficiently

## Next Steps

### Immediate Actions
- [ ] Create 2-3 more prompts with different purposes
- [ ] Upload additional documents for your use case
- [ ] Experiment with different AI models and settings
- [ ] Share a prompt with a team member

### Learning Path
1. **Week 1**: Master basic prompt creation and RAG integration
2. **Week 2**: Explore advanced templating and conditional logic
3. **Week 3**: Set up team collaboration and workflows
4. **Week 4**: Optimize performance and monitor usage

### Resources
- [Complete User Guide](user-guide.md) - Comprehensive feature documentation
- [API Documentation](../api/) - Integration and automation
- [Performance Guide](performance-optimization.md) - Optimization strategies
- [Community Forum](https://community.ragpromptlibrary.com) - Get help and share ideas

## Common Patterns

### Question Answering
```
Answer this question using the provided context: {{question}}

Context: {{rag_context}}

If the context doesn't contain enough information, please say so.
```

### Document Summarization
```
Please summarize the following document in {{summary_length}} words:

Document: {{rag_context}}

Focus on the main points and key takeaways.
```

### Content Generation
```
Create {{content_type}} about {{topic}} using the following reference material:

References: {{rag_context}}

Make it engaging and informative for {{target_audience}}.
```

## Troubleshooting

### Common Issues
1. **RAG not working**: Ensure documents are fully processed
2. **Poor responses**: Adjust similarity threshold and context length
3. **Token limits**: Reduce context length or max tokens
4. **Slow responses**: Check document size and complexity

### Getting Help
- **Documentation**: Search this guide and the [User Guide](user-guide.md)
- **Support**: Email [support@ragpromptlibrary.com](mailto:support@ragpromptlibrary.com)
- **Community**: Join our [Discord server](https://discord.gg/ragpromptlibrary)

---

**Congratulations!** You've successfully created your first RAG-enabled prompt. Continue exploring the platform's features and building more sophisticated AI applications.

**Next Tutorial**: [Document Integration Guide](document-integration.md)
