"""
Response Synthesis Engine - Advanced response generation with context integration
"""
import logging
import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

@dataclass
class SourceCitation:
    document_id: str
    document_name: str
    chunk_id: str
    content_preview: str
    relevance_score: float
    page_number: Optional[int] = None
    section: Optional[str] = None

@dataclass
class SynthesisContext:
    query: str
    retrieved_chunks: List[Dict[str, Any]]
    conversation_history: Optional[List[Dict[str, str]]] = None
    user_preferences: Optional[Dict[str, Any]] = None
    response_style: str = "informative"
    max_response_length: int = 1000
    include_citations: bool = True
    confidence_threshold: float = 0.7

@dataclass
class SynthesizedResponse:
    content: str
    citations: List[SourceCitation]
    confidence_score: float
    synthesis_method: str
    metadata: Dict[str, Any]
    quality_metrics: Dict[str, float]

class ResponseSynthesisEngine:
    """
    Advanced response synthesis with context integration and quality optimization
    """

    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager

        # Response templates for different styles
        self.response_templates = {
            "informative": {
                "intro": "Based on the available information, ",
                "structure": "direct_answer",
                "tone": "professional"
            },
            "conversational": {
                "intro": "Here's what I found: ",
                "structure": "narrative",
                "tone": "friendly"
            },
            "academic": {
                "intro": "According to the sources, ",
                "structure": "structured",
                "tone": "formal"
            },
            "concise": {
                "intro": "",
                "structure": "bullet_points",
                "tone": "brief"
            }
        }

        # Quality metrics weights
        self.quality_weights = {
            "relevance": 0.3,
            "completeness": 0.25,
            "coherence": 0.2,
            "accuracy": 0.15,
            "clarity": 0.1
        }

    async def synthesize_response(self, context: SynthesisContext) -> SynthesizedResponse:
        """
        Synthesize a comprehensive response from retrieved context
        """
        try:
            # Filter and rank chunks by relevance
            relevant_chunks = self._filter_relevant_chunks(
                context.retrieved_chunks,
                context.confidence_threshold
            )

            if not relevant_chunks:
                return self._generate_no_context_response(context)

            # Prepare context for synthesis
            synthesis_prompt = self._prepare_synthesis_prompt(context, relevant_chunks)

            # Generate response using LLM
            if self.llm_manager:
                response = await self._generate_with_llm(synthesis_prompt, context)
            else:
                response = self._generate_template_response(context, relevant_chunks)

            # Extract citations
            citations = self._extract_citations(relevant_chunks)

            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(
                response, context.query, relevant_chunks
            )

            # Calculate overall confidence
            confidence_score = self._calculate_confidence_score(
                relevant_chunks, quality_metrics
            )

            return SynthesizedResponse(
                content=response,
                citations=citations,
                confidence_score=confidence_score,
                synthesis_method="llm_enhanced" if self.llm_manager else "template_based",
                metadata={
                    "chunks_used": len(relevant_chunks),
                    "response_style": context.response_style,
                    "synthesis_time": datetime.now().isoformat(),
                    "has_conversation_context": bool(context.conversation_history)
                },
                quality_metrics=quality_metrics
            )

        except Exception as e:
            logger.error(f"Response synthesis failed: {e}")
            return self._generate_error_response(context, str(e))

    def _filter_relevant_chunks(self, chunks: List[Dict[str, Any]], threshold: float) -> List[Dict[str, Any]]:
        """Filter chunks by relevance threshold"""
        relevant_chunks = []

        for chunk in chunks:
            score = chunk.get('score', 0.0)
            if score >= threshold:
                relevant_chunks.append(chunk)

        # Sort by relevance score
        relevant_chunks.sort(key=lambda x: x.get('score', 0.0), reverse=True)

        # Limit to top 5 chunks to avoid overwhelming the response
        return relevant_chunks[:5]

    def _prepare_synthesis_prompt(self, context: SynthesisContext, chunks: List[Dict[str, Any]]) -> str:
        """Prepare prompt for LLM-based synthesis"""
        template = self.response_templates.get(context.response_style, self.response_templates["informative"])

        # Prepare context information
        context_info = []
        for i, chunk in enumerate(chunks, 1):
            content = chunk.get('content', '')
            source = chunk.get('metadata', {}).get('filename', f'Source {i}')
            context_info.append(f"[Source {i} - {source}]: {content}")

        context_text = "\n\n".join(context_info)

        # Include conversation history if available
        conversation_context = ""
        if context.conversation_history:
            recent_messages = context.conversation_history[-3:]  # Last 3 messages
            conversation_context = "\n\nConversation Context:\n" + "\n".join([
                f"{msg.get('role', 'user')}: {msg.get('content', '')}"
                for msg in recent_messages
            ])

        # Construct synthesis prompt
        prompt = f"""You are an AI assistant tasked with synthesizing a comprehensive response based on the provided context.

Query: {context.query}

Context Information:
{context_text}
{conversation_context}

Instructions:
1. Provide a {template['tone']} response in a {template['structure']} format
2. Base your answer primarily on the provided context
3. If the context doesn't fully answer the question, acknowledge the limitations
4. Keep the response under {context.max_response_length} characters
5. Be accurate and avoid speculation beyond the provided information

Response Style: {context.response_style}
{template['intro']}"""

        return prompt

    async def _generate_with_llm(self, prompt: str, context: SynthesisContext) -> str:
        """Generate response using LLM"""
        try:
            response = await self.llm_manager.generate_response(
                prompt,
                max_tokens=min(context.max_response_length // 4, 500),  # Rough token estimation
                temperature=0.3  # Lower temperature for more focused responses
            )
            return response.content

        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return self._generate_template_response(context, [])

    def _generate_template_response(self, context: SynthesisContext, chunks: List[Dict[str, Any]]) -> str:
        """Generate response using templates when LLM is not available"""
        template = self.response_templates.get(context.response_style, self.response_templates["informative"])

        if not chunks:
            return f"I couldn't find specific information to answer your question about '{context.query}'. Please try rephrasing your question or providing more context."

        # Extract key information from chunks
        key_points = []
        for chunk in chunks[:3]:  # Use top 3 chunks
            content = chunk.get('content', '')
            # Extract first sentence or first 100 characters
            first_sentence = content.split('.')[0] if '.' in content else content[:100]
            if first_sentence.strip():
                key_points.append(first_sentence.strip())

        # Construct response based on style
        if template['structure'] == 'bullet_points':
            response = f"{template['intro']}Here are the key points:\n\n"
            for i, point in enumerate(key_points, 1):
                response += f"{i}. {point}\n"
        else:
            response = f"{template['intro']}{' '.join(key_points)}"

        return response[:context.max_response_length]

    def _extract_citations(self, chunks: List[Dict[str, Any]]) -> List[SourceCitation]:
        """Extract citation information from chunks"""
        citations = []

        for chunk in chunks:
            metadata = chunk.get('metadata', {})

            citation = SourceCitation(
                document_id=metadata.get('document_id', 'unknown'),
                document_name=metadata.get('filename', 'Unknown Document'),
                chunk_id=chunk.get('chunk_id', 'unknown'),
                content_preview=chunk.get('content', '')[:150] + "...",
                relevance_score=chunk.get('score', 0.0),
                page_number=metadata.get('page_number'),
                section=metadata.get('section')
            )

            citations.append(citation)

        return citations

    def _calculate_quality_metrics(self, response: str, query: str, chunks: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate quality metrics for the synthesized response"""
        metrics = {}

        # Relevance: How well does the response address the query
        query_terms = set(re.findall(r'\b\w+\b', query.lower()))
        response_terms = set(re.findall(r'\b\w+\b', response.lower()))
        relevance = len(query_terms.intersection(response_terms)) / len(query_terms) if query_terms else 0
        metrics['relevance'] = min(1.0, relevance)

        # Completeness: How much of the available context is utilized
        if chunks:
            context_terms = set()
            for chunk in chunks:
                chunk_terms = set(re.findall(r'\b\w+\b', chunk.get('content', '').lower()))
                context_terms.update(chunk_terms)

            utilized_terms = response_terms.intersection(context_terms)
            completeness = len(utilized_terms) / len(context_terms) if context_terms else 0
            metrics['completeness'] = min(1.0, completeness)
        else:
            metrics['completeness'] = 0.0

        # Coherence: Basic coherence check (sentence structure)
        sentences = response.split('.')
        valid_sentences = [s for s in sentences if len(s.strip()) > 10]
        coherence = len(valid_sentences) / len(sentences) if sentences else 0
        metrics['coherence'] = min(1.0, coherence)

        # Accuracy: Based on source confidence (simplified)
        if chunks:
            avg_source_confidence = sum(chunk.get('score', 0) for chunk in chunks) / len(chunks)
            metrics['accuracy'] = avg_source_confidence
        else:
            metrics['accuracy'] = 0.0

        # Clarity: Based on readability (simplified)
        words = len(re.findall(r'\b\w+\b', response))
        sentences_count = len([s for s in response.split('.') if s.strip()])
        avg_sentence_length = words / sentences_count if sentences_count > 0 else 0

        # Optimal sentence length is around 15-20 words
        clarity = 1.0 - abs(avg_sentence_length - 17.5) / 17.5 if avg_sentence_length > 0 else 0
        metrics['clarity'] = max(0.0, min(1.0, clarity))

        return metrics

    def _calculate_confidence_score(self, chunks: List[Dict[str, Any]], quality_metrics: Dict[str, float]) -> float:
        """Calculate overall confidence score"""
        if not chunks:
            return 0.1

        # Base confidence on source quality
        source_confidence = sum(chunk.get('score', 0) for chunk in chunks) / len(chunks)

        # Weight by quality metrics
        quality_score = sum(
            metrics_value * self.quality_weights.get(metric, 0.2)
            for metric, metrics_value in quality_metrics.items()
        )

        # Combine source confidence and quality score
        overall_confidence = (source_confidence * 0.6) + (quality_score * 0.4)

        return min(1.0, max(0.1, overall_confidence))

    def _generate_no_context_response(self, context: SynthesisContext) -> SynthesizedResponse:
        """Generate response when no relevant context is found"""
        response = f"I don't have enough relevant information to answer your question about '{context.query}'. Could you please provide more context or try rephrasing your question?"

        return SynthesizedResponse(
            content=response,
            citations=[],
            confidence_score=0.1,
            synthesis_method="no_context",
            metadata={
                "chunks_used": 0,
                "response_style": context.response_style,
                "synthesis_time": datetime.now().isoformat()
            },
            quality_metrics={
                "relevance": 0.0,
                "completeness": 0.0,
                "coherence": 1.0,
                "accuracy": 0.0,
                "clarity": 1.0
            }
        )

    def _generate_error_response(self, context: SynthesisContext, error: str) -> SynthesizedResponse:
        """Generate response when synthesis fails"""
        response = "I encountered an error while processing your request. Please try again."

        return SynthesizedResponse(
            content=response,
            citations=[],
            confidence_score=0.0,
            synthesis_method="error",
            metadata={
                "error": error,
                "synthesis_time": datetime.now().isoformat()
            },
            quality_metrics={
                "relevance": 0.0,
                "completeness": 0.0,
                "coherence": 0.0,
                "accuracy": 0.0,
                "clarity": 0.0
            }
        )

    def get_supported_styles(self) -> List[str]:
        """Get list of supported response styles"""
        return list(self.response_templates.keys())

    def update_quality_weights(self, weights: Dict[str, float]):
        """Update quality metric weights"""
        total_weight = sum(weights.values())
        if abs(total_weight - 1.0) > 0.01:
            raise ValueError("Quality weights must sum to 1.0")

        self.quality_weights.update(weights)

# Global instance
response_synthesis_engine = ResponseSynthesisEngine()
