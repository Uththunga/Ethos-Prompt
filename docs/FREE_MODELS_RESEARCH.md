# Free AI Models Research for OpenRouter Integration

## RAG Prompt Library - Zero-Cost AI Model Configuration

**Date**: January 2025
**Status**: Research Phase
**Objective**: Identify and configure 8-10 stable, high-quality free models from OpenRouter.ai for default application use

---

## Executive Summary

This document provides comprehensive research on free AI models available through OpenRouter.ai. The goal is to configure the RAG Prompt Library to use **only free models by default**, ensuring zero cost to the application while allowing users to optionally use paid models with their own API keys.

### Key Findings

Based on research from OpenRouter.ai (as of January 2025), the following free models are available:

1. **xAI: Grok 4 Fast (free)** - High-performance model with 2M context
2. **DeepSeek: DeepSeek V3** - Excellent reasoning capabilities
3. **Z.AI: GLM 4.5 Air (free)** - Lightweight and fast
4. **TNG: DeepSeek R1T2 Chimera (free)** - Specialized reasoning model
5. **Google: Gemma 2 27B** - Strong general-purpose model
6. **Meta: Llama 3.1 8B Instruct (Free)** - Versatile instruction-following
7. **Mistral: Mistral 7B Instruct (Free)** - Fast and efficient
8. **Qwen: Qwen 2.5 7B Instruct (Free)** - Multilingual capabilities

---

## Detailed Free Models Analysis

### 1. xAI: Grok 4 Fast (free)

**Model ID**: `x-ai/grok-4-fast:free`

**Specifications**:

- **Context Length**: 2,048,000 tokens (2M)
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Parameters**: 31.5B tokens processed

**Capabilities**:

- High-speed inference
- Large context window for complex prompts
- General-purpose text generation
- Code generation and analysis

**Best Use Cases**:

- Long-form content generation
- Complex prompt engineering
- Multi-turn conversations
- Document analysis with large context

**Limitations**:

- Prompts and completions may be used by xAI or OpenRouter to improve future models
- May have rate limiting during peak usage

**Recommended For**: Default model for general-purpose tasks

---

### 2. DeepSeek: DeepSeek V3

**Model ID**: `deepseek/deepseek-v3:free`

**Specifications**:

- **Context Length**: 163,840 tokens
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Specialty**: Advanced reasoning and analysis

**Capabilities**:

- Strong reasoning capabilities
- Code generation and debugging
- Mathematical problem-solving
- Logical analysis

**Best Use Cases**:

- Technical documentation
- Code review and optimization
- Problem-solving prompts
- Analytical tasks

**Limitations**:

- May be slower than other models
- Best for reasoning-heavy tasks

**Recommended For**: Technical and analytical prompts

---

### 3. Z.AI: GLM 4.5 Air (free)

**Model ID**: `z-ai/glm-4.5-air:free`

**Specifications**:

- **Context Length**: 1,048,576 tokens (1M)
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Specialty**: Lightweight and fast

**Capabilities**:

- Fast response times
- Efficient token usage
- General text generation
- Multilingual support

**Best Use Cases**:

- Quick responses
- Simple prompts
- Real-time applications
- High-throughput scenarios

**Limitations**:

- May have less nuanced responses than larger models
- Better for straightforward tasks

**Recommended For**: Fast, simple prompt executions

---

### 4. TNG: DeepSeek R1T2 Chimera (free)

**Model ID**: `tngtech/deepseek-r1t-chimera:free`

**Specifications**:

- **Context Length**: 163,840 tokens
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Created**: April 27, 2025
- **Specialty**: Reasoning and thinking

**Capabilities**:

- Advanced reasoning
- Step-by-step problem solving
- Chain-of-thought processing
- Complex task decomposition

**Best Use Cases**:

- Multi-step reasoning
- Complex problem-solving
- Educational content
- Prompt optimization

**Limitations**:

- May be verbose in responses
- Newer model (less battle-tested)

**Recommended For**: Complex reasoning tasks

---

### 5. Google: Gemma 2 27B

**Model ID**: `google/gemma-2-27b-it:free`

**Specifications**:

- **Context Length**: 8,192 tokens
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Parameters**: 27 billion

**Capabilities**:

- Strong instruction following
- Balanced performance
- Good for general tasks
- Reliable and stable

**Best Use Cases**:

- General-purpose prompts
- Content creation
- Summarization
- Q&A tasks

**Limitations**:

- Smaller context window (8K)
- May struggle with very long documents

**Recommended For**: Balanced general-purpose use

---

### 6. Meta: Llama 3.1 8B Instruct (Free)

**Model ID**: `meta-llama/llama-3.1-8b-instruct:free`

**Specifications**:

- **Context Length**: 131,072 tokens (128K)
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Parameters**: 8 billion

**Capabilities**:

- Excellent instruction following
- Versatile across tasks
- Good code generation
- Strong reasoning

**Best Use Cases**:

- Instruction-based prompts
- Code generation
- Creative writing
- Conversational AI

**Limitations**:

- Smaller parameter count
- May be less capable than larger models

**Recommended For**: Instruction-following tasks

---

### 7. Mistral: Mistral 7B Instruct (Free)

**Model ID**: `mistralai/mistral-7b-instruct:free`

**Specifications**:

- **Context Length**: 32,768 tokens (32K)
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Parameters**: 7 billion

**Capabilities**:

- Fast inference
- Efficient token usage
- Good instruction following
- Balanced performance

**Best Use Cases**:

- Quick responses
- General text generation
- Simple coding tasks
- Conversational prompts

**Limitations**:

- Smaller model size
- May lack depth for complex tasks

**Recommended For**: Fast, efficient prompts

---

### 8. Qwen: Qwen 2.5 7B Instruct (Free)

**Model ID**: `qwen/qwen-2.5-7b-instruct:free`

**Specifications**:

- **Context Length**: 32,768 tokens (32K)
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Parameters**: 7 billion

**Capabilities**:

- Multilingual support
- Strong Chinese language capabilities
- Good general performance
- Efficient inference

**Best Use Cases**:

- Multilingual prompts
- International applications
- General text generation
- Translation tasks

**Limitations**:

- Smaller parameter count
- May be less capable for English-only tasks

**Recommended For**: Multilingual applications

---

## Additional Free Models to Consider

### 9. Qwen: Qwen3-Coder-480B-A35B-Instruct

**Model ID**: `qwen/qwen3-coder-480b-a35b-instruct:free`

**Specifications**:

- **Type**: Mixture-of-Experts (MoE)
- **Specialty**: Code generation
- **Pricing**: $0/M input and output tokens

**Capabilities**:

- Advanced code generation
- Agentic coding tasks
- Multi-language support
- Code optimization

**Best Use Cases**:

- Software development prompts
- Code review and refactoring
- Algorithm design
- Technical documentation

---

### 10. Google: Gemini 2.5 Flash Lite Preview

**Model ID**: `google/gemini-2.5-flash-lite-preview:free`

**Specifications**:

- **Context Length**: 1,048,576 tokens (1M)
- **Pricing**: $0/M input tokens, $0/M output tokens
- **Type**: Preview/Experimental

**Capabilities**:

- Very fast inference
- Large context window
- Multimodal capabilities (text, images)
- Experimental features

**Best Use Cases**:

- Rapid prototyping
- Testing new features
- High-throughput applications
- Multimodal prompts

**Limitations**:

- Preview status (may change)
- Less stable than production models

---

## Recommended Default Configuration

### Primary Free Models (Top 5)

1. **Default Model**: `x-ai/grok-4-fast:free`

   - Reason: Best balance of speed, context, and quality

2. **Reasoning Model**: `deepseek/deepseek-v3:free`

   - Reason: Superior for analytical tasks

3. **Fast Model**: `z-ai/glm-4.5-air:free`

   - Reason: Fastest response times

4. **Balanced Model**: `google/gemma-2-27b-it:free`

   - Reason: Reliable general-purpose performance

5. **Code Model**: `qwen/qwen3-coder-480b-a35b-instruct:free`
   - Reason: Best for coding tasks

### Secondary Free Models (Alternatives)

6. **Instruction Model**: `meta-llama/llama-3.1-8b-instruct:free`
7. **Efficient Model**: `mistralai/mistral-7b-instruct:free`
8. **Multilingual Model**: `qwen/qwen-2.5-7b-instruct:free`

---

## Implementation Strategy

### Phase 1: Configuration

- Create `free_models_config.py` with model definitions
- Set `x-ai/grok-4-fast:free` as default model
- Configure model metadata and capabilities

### Phase 2: Backend Integration

- Update `openrouter_client.py` to use free models
- Remove paid model API key from default configuration
- Add custom API key support for user-provided keys

### Phase 3: Frontend Updates

- Add "FREE" badges to model selector
- Implement custom API key input for paid models
- Update cost tracking to show $0.00 for free models

### Phase 4: Testing

- Test each free model with sample prompts
- Verify zero-cost tracking
- Validate custom API key flow

---

## Cost Comparison

### Free Models (Default)

- **Cost per 1M tokens**: $0.00
- **Monthly cost (unlimited usage)**: $0.00
- **User cost**: $0.00

### Paid Models (User API Key Required)

- **GPT-4 Turbo**: $10/M input, $30/M output
- **Claude 3.5 Sonnet**: $3/M input, $15/M output
- **Gemini Pro**: $0.50/M input, $1.50/M output

**Savings**: 100% cost reduction by using free models

---

## Next Steps

1. ✅ Complete free models research
2. ⏳ Test free models performance (Task 0.2)
3. ⏳ Select top 8-10 models (Task 0.3)
4. ⏳ Create configuration files (Task 0.4)
5. ⏳ Update backend implementation (Tasks 0.5-0.6)
6. ⏳ Update frontend UI (Task 0.7)
7. ⏳ Update cost tracking (Task 0.8)
8. ⏳ Create documentation (Task 0.9)
9. ⏳ Integration testing (Task 0.10)

---

## References

- OpenRouter Models Page: https://openrouter.ai/models
- OpenRouter Free Models: https://openrouter.ai/models/?q=free
- OpenRouter Documentation: https://openrouter.ai/docs
- OpenRouter API Reference: https://openrouter.ai/docs/api-reference

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Status**: Research Complete, Implementation Pending
