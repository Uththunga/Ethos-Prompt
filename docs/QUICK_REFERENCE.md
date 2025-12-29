# RAG Prompt Library - Quick Reference

## 🌐 Production URLs
- **Live Application**: https://react-app-000730.web.app
- **API Base**: https://australia-southeast1-react-app-000730.cloudfunctions.net
- **Firebase Console**: https://console.firebase.google.com/project/react-app-000730

## 🚀 Quick Start Commands

### Development Setup
```bash
# Clone and setup
git clone <repo-url> && cd React-App-000730
./scripts/setup-environment.sh development

# Start development
cd frontend && npm run dev
firebase emulators:start
```

### Production Deployment
```bash
# Build and deploy
cd frontend && npm run build
firebase deploy
```

## 📝 Prompt Creation Cheat Sheet

### Basic Prompt Structure
```
[ROLE/CONTEXT]
You are a [specific role] with expertise in [domain].

[INPUT VARIABLES]
Input: {{variable_name}}
Context: {{context_variable}}

[INSTRUCTIONS]
Your task is to:
1. [Specific instruction]
2. [Another instruction]

[OUTPUT FORMAT]
Provide your response in the following format:
- [Format specification]

[EXAMPLES] (optional)
Example:
Input: [example input]
Output: [example output]
```

### Variable Syntax
- `{{variable_name}}` - Required variable
- `{{variable_name:default_value}}` - Optional with default
- `{{variable_name|filter}}` - Variable with filter

### Common Prompt Patterns

**Analysis Prompt:**
```
Analyze the following {{content_type}}: {{content}}

Provide analysis covering:
- Key insights
- Strengths and weaknesses  
- Recommendations
- Next steps

Format as structured report.
```

**Generation Prompt:**
```
Create {{output_type}} for {{target_audience}} about {{topic}}.

Requirements:
- Tone: {{tone}}
- Length: {{length}}
- Style: {{style}}

Include relevant examples and actionable advice.
```

**Transformation Prompt:**
```
Transform the following {{input_format}} into {{output_format}}:

Input: {{input_content}}

Requirements:
- Maintain key information
- Adapt tone for {{target_audience}}
- Follow {{output_format}} conventions
```

## 📄 Document Upload Guide

### Supported Formats
| Format | Extension | Max Size | Notes |
|--------|-----------|----------|-------|
| PDF | .pdf | 10MB | Text extraction + OCR |
| Word | .docx, .doc | 10MB | Full formatting support |
| Text | .txt | 10MB | Plain text |
| Markdown | .md | 10MB | Formatted text |

### Upload Process
1. **Drag & Drop** or click "Upload Documents"
2. **Wait for Processing** (30-60 seconds per document)
3. **Verify Status** (Processing → Ready → Available)
4. **Add Metadata** (tags, description, category)

### RAG Best Practices
- **Chunk Size**: 1000 characters (optimal)
- **Overlap**: 200 characters (maintains context)
- **Query Length**: 50-200 characters (best results)
- **Max Chunks**: 5-10 per query (performance vs context)

## ⚡ Execution Quick Reference

### Model Settings
| Setting | Range | Default | Description |
|---------|-------|---------|-------------|
| Temperature | 0.0-2.0 | 0.7 | Creativity level |
| Max Tokens | 1-4000 | 1000 | Response length |
| Top P | 0.0-1.0 | 0.9 | Nucleus sampling |

### Free Models (OpenRouter)
- `nvidia/llama-3.1-nemotron-ultra-253b-v1:free`
- `meta-llama/llama-3.2-11b-vision-instruct:free`
- `google/gemma-2-9b-it:free`
- `microsoft/phi-3-mini-128k-instruct:free`

### RAG Configuration
```json
{
  "use_rag": true,
  "max_chunks": 5,
  "similarity_threshold": 0.7,
  "query": "auto" // or custom query
}
```

## 🔧 API Quick Reference

### Authentication
```bash
# Get API key from Profile > API Keys
curl -H "Authorization: Bearer rag_your_api_key_here"
```

### Execute Prompt
```bash
curl -X POST https://api.ragpromptlibrary.com/v1/prompts/execute \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "prompt_123",
    "variables": {"var1": "value1"},
    "settings": {"temperature": 0.7},
    "use_rag": true
  }'
```

### List Prompts
```bash
curl -X GET https://api.ragpromptlibrary.com/v1/prompts \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Upload Document
```bash
curl -X POST https://api.ragpromptlibrary.com/v1/documents \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "file=@document.pdf" \
  -F "metadata={\"title\":\"My Document\"}"
```

## 🔍 Search & Filter Syntax

### Prompt Search
- `title:customer` - Search in title
- `tag:email` - Filter by tag
- `category:support` - Filter by category
- `created:2024-01` - Filter by date
- `author:john@example.com` - Filter by author

### Document Search
- `content:"specific phrase"` - Exact phrase
- `type:pdf` - Filter by file type
- `size:>1MB` - Filter by file size
- `processed:true` - Only processed docs

## 🎯 Keyboard Shortcuts

### Global
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + N` - New prompt
- `Ctrl/Cmd + S` - Save current
- `Ctrl/Cmd + E` - Execute prompt
- `Esc` - Close modal/cancel

### Editor
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Y` - Redo
- `Ctrl/Cmd + F` - Find in editor
- `Ctrl/Cmd + /` - Toggle comment
- `Tab` - Indent
- `Shift + Tab` - Unindent

## 🐛 Troubleshooting Quick Fixes

### Common Issues
| Issue | Quick Fix |
|-------|-----------|
| Login fails | Clear cache, try incognito |
| Prompt won't save | Check required fields |
| Execution timeout | Reduce max tokens |
| RAG no results | Check document processing |
| Slow performance | Clear browser cache |

### Error Codes
- `401` - Authentication required
- `403` - Permission denied
- `429` - Rate limit exceeded
- `500` - Server error (retry)

### Performance Tips
- **Cache Results**: Save frequently used outputs
- **Optimize Prompts**: Remove unnecessary text
- **Batch Operations**: Group similar executions
- **Monitor Usage**: Track token consumption

## 📊 Analytics & Metrics

### Key Metrics
- **Response Time**: Average execution duration
- **Token Usage**: Input + output tokens
- **Success Rate**: Successful executions %
- **Cost Tracking**: Token costs per model
- **Usage Patterns**: Most used prompts/features

### Optimization Targets
- Response time: <2 seconds
- Success rate: >95%
- Token efficiency: Minimize waste
- User satisfaction: High ratings

## 🔒 Security Checklist

### Account Security
- [ ] Strong password set
- [ ] Two-factor authentication enabled
- [ ] Regular password updates
- [ ] API keys secured
- [ ] Access logs reviewed

### Data Security
- [ ] Document permissions set
- [ ] Sensitive data identified
- [ ] Regular data cleanup
- [ ] Backup strategy in place
- [ ] Compliance requirements met

## 📞 Support Resources

### Documentation
- **Setup Guide**: `docs/SETUP_GUIDE.md`
- **User Guide**: `docs/USER_GUIDE.md`
- **API Docs**: `docs/API_DOCUMENTATION.md`
- **FAQ**: `docs/FAQ.md`

### Support Channels
- **In-App Help**: Click help icon
- **Email**: support@ragpromptlibrary.com
- **Community**: Discord/Slack channels
- **GitHub**: Issues and discussions

### Emergency Contacts
- **Critical Issues**: emergency@ragpromptlibrary.com
- **Security Issues**: security@ragpromptlibrary.com
- **Data Issues**: data@ragpromptlibrary.com

---

**Keep this reference handy for quick access to common tasks and solutions! 📚**
