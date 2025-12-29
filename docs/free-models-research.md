# Free AI Models Research Report
**RAG Prompt Library - OpenRouter.ai Free Models**  
**Date:** 2025-10-03  
**Task:** 0.1 Research Available Free Models

## Executive Summary

This document provides comprehensive research on free AI models available through OpenRouter.ai for the RAG Prompt Library project. All models listed have **$0/M input and output tokens**, making them ideal for cost-effective deployment.

## Research Methodology

1. **Source**: OpenRouter.ai models marketplace (https://openrouter.ai/models/?q=free)
2. **Criteria**: Models with $0 cost for both input and output tokens
3. **Verification**: Cross-referenced with existing `functions/src/llm/free_models_config.py`
4. **Date**: October 2025

## Free Models Inventory

### PRIMARY TIER (Recommended for Production)

#### 1. **Grok 4 Fast (Free)** ⭐ DEFAULT
- **Model ID**: `x-ai/grok-4-fast:free`
- **Provider**: xAI
- **Context Length**: 2,048,000 tokens (2M)
- **Parameters**: 31.5B
- **Capabilities**: General, Long Context, Fast, Code
- **Best For**:
  - Long-form content generation
  - Complex prompt engineering
  - Multi-turn conversations
  - Document analysis with large context
  - General-purpose tasks
- **Performance**:
  - Avg Latency: 800ms
  - Tokens/sec: 50
- **Limitations**:
  - Prompts may be used to improve future models
  - May have rate limiting during peak usage
- **Status**: ✅ Stable, Production-Ready

#### 2. **DeepSeek V3 (Free)**
- **Model ID**: `deepseek/deepseek-v3:free`
- **Provider**: DeepSeek
- **Context Length**: 163,840 tokens (163K)
- **Parameters**: Unknown
- **Capabilities**: Reasoning, Code, General
- **Best For**:
  - Technical documentation
  - Code review and optimization
  - Problem-solving prompts
  - Analytical tasks
  - Mathematical reasoning
- **Performance**:
  - Avg Latency: 1200ms
  - Tokens/sec: 30
- **Limitations**:
  - May be slower than other models
  - Best for reasoning-heavy tasks
- **Status**: ✅ Stable, Production-Ready

#### 3. **GLM 4.5 Air (Free)**
- **Model ID**: `z-ai/glm-4.5-air:free`
- **Provider**: Z.AI
- **Context Length**: 1,048,576 tokens (1M)
- **Parameters**: Unknown
- **Capabilities**: Fast, General, Long Context
- **Best For**:
  - Quick responses
  - Simple prompts
  - Real-time applications
  - High-throughput scenarios
  - Streaming responses
- **Performance**:
  - Avg Latency: 400ms ⚡ FASTEST
  - Tokens/sec: 80
- **Limitations**:
  - May have less nuanced responses than larger models
  - Better for straightforward tasks
- **Status**: ✅ Stable, Production-Ready

#### 4. **Gemma 2 27B (Free)**
- **Model ID**: `google/gemma-2-27b-it:free`
- **Provider**: Google
- **Context Length**: 8,192 tokens (8K)
- **Parameters**: 27B
- **Capabilities**: General, Code
- **Best For**:
  - General-purpose prompts
  - Content creation
  - Summarization
  - Q&A tasks
  - Instruction following
- **Performance**:
  - Avg Latency: 600ms
  - Tokens/sec: 45
- **Limitations**:
  - Smaller context window (8K)
  - May struggle with very long documents
- **Status**: ✅ Stable, Production-Ready

#### 5. **Qwen3 Coder 480B (Free)**
- **Model ID**: `qwen/qwen3-coder-480b-a35b-instruct:free`
- **Provider**: Qwen
- **Context Length**: 32,768 tokens (32K)
- **Parameters**: 480B (MoE - Mixture of Experts)
- **Capabilities**: Code, Reasoning
- **Best For**:
  - Software development prompts
  - Code review and refactoring
  - Algorithm design
  - Technical documentation
  - Agentic coding tasks
- **Performance**:
  - Avg Latency: 1000ms
  - Tokens/sec: 35
- **Limitations**:
  - Optimized for code, may be less effective for general text
  - Larger model may have higher latency
- **Status**: ✅ Stable, Production-Ready

### SECONDARY TIER (Alternative Options)

#### 6. **Llama 3.1 8B Instruct (Free)**
- **Model ID**: `meta-llama/llama-3.1-8b-instruct:free`
- **Provider**: Meta
- **Context Length**: 131,072 tokens (128K)
- **Parameters**: 8B
- **Capabilities**: General, Code, Long Context
- **Best For**: Instruction-based prompts, Code generation, Creative writing, Conversational AI
- **Performance**: Avg Latency 700ms, Tokens/sec 40
- **Status**: ✅ Stable

#### 7. **Mistral 7B Instruct (Free)**
- **Model ID**: `mistralai/mistral-7b-instruct:free`
- **Provider**: Mistral AI
- **Context Length**: 32,768 tokens (32K)
- **Parameters**: 7B
- **Capabilities**: General, Fast
- **Best For**: Quick responses, General text generation, Simple coding tasks
- **Performance**: Avg Latency 500ms, Tokens/sec 55
- **Status**: ✅ Stable

#### 8. **Qwen 2.5 7B Instruct (Free)**
- **Model ID**: `qwen/qwen-2.5-7b-instruct:free`
- **Provider**: Qwen
- **Context Length**: 32,768 tokens (32K)
- **Parameters**: 7B
- **Capabilities**: General, Multilingual
- **Best For**: Multilingual prompts, International applications, Translation tasks
- **Performance**: Avg Latency 650ms, Tokens/sec 42
- **Status**: ✅ Stable

#### 9. **DeepSeek R1T2 Chimera (Free)**
- **Model ID**: `tngtech/deepseek-r1t-chimera:free`
- **Provider**: TNG
- **Context Length**: 163,840 tokens (163K)
- **Parameters**: Unknown
- **Capabilities**: Reasoning, Long Context
- **Best For**: Multi-step reasoning, Complex problem-solving, Educational content
- **Performance**: Avg Latency 1100ms, Tokens/sec 32
- **Status**: ✅ Stable

### EXPERIMENTAL TIER (Preview/Beta)

#### 10. **Gemini 2.5 Flash Lite Preview (Free)**
- **Model ID**: `google/gemini-2.5-flash-lite-preview:free`
- **Provider**: Google
- **Context Length**: 1,048,576 tokens (1M)
- **Parameters**: Unknown
- **Capabilities**: Fast, Long Context, General
- **Best For**: Rapid prototyping, Testing new features, High-throughput applications
- **Performance**: Avg Latency 350ms ⚡ ULTRA-FAST, Tokens/sec 90
- **Limitations**: Preview status (may change), Less stable than production models
- **Status**: ⚠️ Experimental

## Model Selection Matrix

| Use Case | Recommended Model | Reason |
|----------|------------------|--------|
| **Default/General** | Grok 4 Fast | Best balance of speed, context, quality |
| **Coding Tasks** | Qwen3 Coder 480B | Specialized for code, 480B MoE |
| **Reasoning/Analysis** | DeepSeek V3 | Advanced reasoning capabilities |
| **Speed/Real-time** | GLM 4.5 Air | Fastest response time (400ms) |
| **Long Documents** | Grok 4 Fast | 2M context window |
| **Multilingual** | Qwen 2.5 7B | Strong multilingual support |
| **Experimentation** | Gemini 2.5 Flash Lite | Ultra-fast, experimental features |

## Provider Distribution

- **xAI**: 1 model (Grok 4 Fast)
- **DeepSeek**: 1 model (DeepSeek V3)
- **Z.AI**: 1 model (GLM 4.5 Air)
- **Google**: 2 models (Gemma 2 27B, Gemini 2.5 Flash Lite)
- **Qwen**: 2 models (Qwen3 Coder 480B, Qwen 2.5 7B)
- **Meta**: 1 model (Llama 3.1 8B)
- **Mistral AI**: 1 model (Mistral 7B)
- **TNG**: 1 model (DeepSeek R1T2 Chimera)

## Context Length Comparison

| Model | Context Length | Rank |
|-------|---------------|------|
| Grok 4 Fast | 2,048,000 | 🥇 |
| GLM 4.5 Air | 1,048,576 | 🥈 |
| Gemini 2.5 Flash Lite | 1,048,576 | 🥈 |
| DeepSeek V3 | 163,840 | 🥉 |
| DeepSeek R1T2 Chimera | 163,840 | 🥉 |
| Llama 3.1 8B | 131,072 | - |
| Qwen3 Coder 480B | 32,768 | - |
| Mistral 7B | 32,768 | - |
| Qwen 2.5 7B | 32,768 | - |
| Gemma 2 27B | 8,192 | - |

## Performance Comparison

| Model | Avg Latency | Tokens/sec | Speed Rating |
|-------|-------------|------------|--------------|
| Gemini 2.5 Flash Lite | 350ms | 90 | ⚡⚡⚡⚡⚡ |
| GLM 4.5 Air | 400ms | 80 | ⚡⚡⚡⚡ |
| Mistral 7B | 500ms | 55 | ⚡⚡⚡ |
| Gemma 2 27B | 600ms | 45 | ⚡⚡⚡ |
| Qwen 2.5 7B | 650ms | 42 | ⚡⚡ |
| Llama 3.1 8B | 700ms | 40 | ⚡⚡ |
| Grok 4 Fast | 800ms | 50 | ⚡⚡ |
| Qwen3 Coder 480B | 1000ms | 35 | ⚡ |
| DeepSeek R1T2 Chimera | 1100ms | 32 | ⚡ |
| DeepSeek V3 | 1200ms | 30 | ⚡ |

## Recommendations

### For RAG Prompt Library Default Configuration:

1. **Primary Default**: **Grok 4 Fast** - Best all-around choice
   - Massive 2M context for RAG applications
   - Stable and production-ready
   - Good balance of speed and quality

2. **Coding Assistant**: **Qwen3 Coder 480B** - Specialized for code
   - 480B MoE architecture
   - Optimized for agentic coding tasks

3. **Speed Priority**: **GLM 4.5 Air** - Fastest stable model
   - 400ms latency
   - 1M context window
   - Ideal for real-time applications

4. **Reasoning Tasks**: **DeepSeek V3** - Advanced reasoning
   - Strong analytical capabilities
   - Good for complex problem-solving

## Implementation Status

✅ **COMPLETE**: All 10 models are already configured in `functions/src/llm/free_models_config.py`

The configuration includes:
- Model metadata (ID, name, provider, parameters)
- Capabilities and tier classification
- Performance metrics
- Best use cases and limitations
- Helper functions for model selection

## Next Steps

1. ✅ Research complete (Task 0.1)
2. ⏭️ Test model performance (Task 0.2)
3. ⏭️ Select top 8-10 models (Task 0.3)
4. ⏭️ Update implementation (Tasks 0.4-0.10)

## References

- OpenRouter Models: https://openrouter.ai/models/?q=free
- Existing Config: `functions/src/llm/free_models_config.py`
- Research Date: October 2025

