"""
Chunking Strategies - Intelligent document chunking for RAG
"""
import re
import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from abc import ABC, abstractmethod
import math
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class Chunk:
    content: str
    metadata: Dict[str, Any]
    chunk_id: str
    start_index: int
    end_index: int
    token_count: int
    overlap_with_previous: int = 0
    overlap_with_next: int = 0

@dataclass
class ChunkingResult:
    chunks: List[Chunk]
    total_chunks: int
    total_tokens: int
    strategy_used: str
    metadata: Dict[str, Any]

    @property
    def strategy(self) -> str:
        """Alias for strategy_used (for backward compatibility with tests)"""
        return self.strategy_used

class ChunkingStrategy(ABC):
    """
    Abstract base class for chunking strategies
    """

    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.name = self.__class__.__name__

    @abstractmethod
    def chunk(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> ChunkingResult:
        """Chunk text into smaller pieces"""
        pass

    def estimate_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        # Simple approximation: 1 token ≈ 4 characters
        return len(text) // 4

    def create_chunk_id(self, doc_id: str, chunk_index: int) -> str:
        """Create unique chunk ID"""
        return f"{doc_id}_chunk_{chunk_index:04d}"

class FixedSizeChunking(ChunkingStrategy):
    """
    Simple fixed-size chunking with overlap
    """

    def chunk(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> ChunkingResult:
        """Chunk text into fixed-size pieces"""
        metadata = metadata or {}
        chunks = []

        # Safety limit to prevent memory issues
        MAX_CHUNKS = 10000

        # Calculate character-based chunk size (approximate)
        char_chunk_size = self.chunk_size * 4  # 4 chars per token estimate
        char_overlap = self.overlap * 4

        start = 0
        chunk_index = 0
        doc_id = metadata.get('document_id', 'doc')

        while start < len(text):
            # Safety check: prevent infinite loops
            if chunk_index >= MAX_CHUNKS:
                logger.warning(f"Reached max chunks limit ({MAX_CHUNKS}). Stopping chunking.")
                break

            # Calculate end position
            end = min(start + char_chunk_size, len(text))

            # Extract chunk content
            chunk_content = text[start:end]

            # Skip empty chunks
            if not chunk_content.strip():
                start = end
                continue

            # Calculate overlaps
            overlap_prev = min(char_overlap, start) if start > 0 else 0
            overlap_next = min(char_overlap, len(text) - end) if end < len(text) else 0

            # Create chunk
            chunk = Chunk(
                content=chunk_content,
                metadata={
                    **metadata,
                    'chunk_index': chunk_index,
                    'chunk_type': 'fixed_size',
                    'start_char': start,
                    'end_char': end
                },
                chunk_id=self.create_chunk_id(doc_id, chunk_index),
                start_index=start,
                end_index=end,
                token_count=self.estimate_tokens(chunk_content),
                overlap_with_previous=overlap_prev,
                overlap_with_next=overlap_next
            )

            chunks.append(chunk)
            chunk_index += 1

            # Move start position with overlap
            start = end - char_overlap if end < len(text) else end

        total_tokens = sum(chunk.token_count for chunk in chunks)

        return ChunkingResult(
            chunks=chunks,
            total_chunks=len(chunks),
            total_tokens=total_tokens,
            strategy_used='fixed_size',
            metadata={
                'chunk_size': self.chunk_size,
                'overlap': self.overlap,
                'char_chunk_size': char_chunk_size,
                'char_overlap': char_overlap
            }
        )

class SemanticChunking(ChunkingStrategy):
    """
    Semantic chunking based on sentence and paragraph boundaries
    """

    def __init__(self, chunk_size: int = 1000, overlap: int = 200, min_chunk_size: int = 100,
                 respect_paragraphs: bool = True):
        super().__init__(chunk_size, overlap)
        self.min_chunk_size = min_chunk_size
        self.respect_paragraphs = respect_paragraphs

    def chunk(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> ChunkingResult:
        """Chunk text based on semantic boundaries"""
        metadata = metadata or {}
        chunks = []

        # Safety limit to prevent memory issues
        MAX_CHUNKS = 10000

        # Split into sentences
        sentences = self._split_sentences(text)

        # Group sentences into chunks
        current_chunk: List[str] = []
        current_size = 0
        chunk_index = 0
        doc_id = metadata.get('document_id', 'doc')

        for sentence in sentences:
            # Safety check: prevent infinite loops
            if chunk_index >= MAX_CHUNKS:
                logger.warning(f"Reached max chunks limit ({MAX_CHUNKS}). Stopping chunking.")
                break

            sentence_tokens = self.estimate_tokens(sentence)

            # Check if adding this sentence would exceed chunk size
            if current_size + sentence_tokens > self.chunk_size and current_chunk:
                # Create chunk from current sentences
                chunk_content = ' '.join(current_chunk)

                if self.estimate_tokens(chunk_content) >= self.min_chunk_size:
                    chunk = self._create_semantic_chunk(
                        chunk_content, chunk_index, doc_id, metadata, text
                    )
                    chunks.append(chunk)
                    chunk_index += 1

                # Start new chunk with overlap
                overlap_sentences = self._get_overlap_sentences(current_chunk)
                current_chunk = overlap_sentences + [sentence]
                current_size = sum(self.estimate_tokens(s) for s in current_chunk)
            else:
                current_chunk.append(sentence)
                current_size += sentence_tokens

        # Add final chunk
        if current_chunk and chunk_index < MAX_CHUNKS:
            chunk_content = ' '.join(current_chunk)
            if self.estimate_tokens(chunk_content) >= self.min_chunk_size:
                chunk = self._create_semantic_chunk(
                    chunk_content, chunk_index, doc_id, metadata, text
                )
                chunks.append(chunk)

        total_tokens = sum(chunk.token_count for chunk in chunks)

        return ChunkingResult(
            chunks=chunks,
            total_chunks=len(chunks),
            total_tokens=total_tokens,
            strategy_used='semantic',
            metadata={
                'chunk_size': self.chunk_size,
                'overlap': self.overlap,
                'min_chunk_size': self.min_chunk_size,
                'sentence_count': len(sentences)
            }
        )

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences while avoiding common abbreviation splits (best-effort)"""
        if not text:
            return []

        # Optionally respect paragraph boundaries first
        parts = text.split('\n\n') if self.respect_paragraphs else [text]
        sentences: List[str] = []

        splitter = re.compile(r"(?<=[.!?])\s+")
        abbrev_set = {"Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.", "St.", "vs.", "e.g.", "i.e.", "etc."}

        for part in parts:
            p = part.strip()
            if not p:
                continue
            segs = [s.strip() for s in splitter.split(p) if s.strip()]
            if not segs:
                continue

            # Merge segments that were split after abbreviations
            merged: List[str] = []
            for seg in segs:
                if merged:
                    prev = merged[-1]
                    last_token = prev.split()[-1] if prev.split() else ""
                    if last_token in abbrev_set:
                        merged[-1] = prev + " " + seg
                        continue
                merged.append(seg)

            sentences.extend(merged)

        return sentences

    def _get_overlap_sentences(self, sentences: List[str]) -> List[str]:
        """Get sentences for overlap"""
        overlap_tokens = 0
        overlap_sentences: List[str] = []

        # Take sentences from the end until we reach overlap size
        for sentence in reversed(sentences):
            sentence_tokens = self.estimate_tokens(sentence)
            if overlap_tokens + sentence_tokens <= self.overlap:
                overlap_sentences.insert(0, sentence)
                overlap_tokens += sentence_tokens
            else:
                break

        return overlap_sentences

    def _create_semantic_chunk(
        self,
        content: str,
        chunk_index: int,
        doc_id: str,
        metadata: Dict[str, Any],
        full_text: str
    ) -> Chunk:
        """Create a semantic chunk"""
        start_index = full_text.find(content)
        if start_index == -1:
            # Fallback: compute approximate indices using whitespace-collapsed search
            norm_full = re.sub(r"\s+", " ", full_text).strip()
            norm_content = re.sub(r"\s+", " ", content).strip()
            approx = norm_full.find(norm_content)
            start_index = max(0, approx)
        end_index = min(len(full_text), start_index + len(content))

        enriched_meta = {
            **metadata,
            'chunk_index': chunk_index,
            'chunk_type': 'semantic',
            'sentence_count': len(self._split_sentences(content)),
            'char_count': len(content),
            'position': {'start_char': start_index, 'end_char': end_index},
            'created_at': datetime.utcnow().isoformat() + 'Z'
        }

        return Chunk(
            content=content,
            metadata=enriched_meta,
            chunk_id=self.create_chunk_id(doc_id, chunk_index),
            start_index=start_index,
            end_index=end_index,
            token_count=self.estimate_tokens(content)
        )

class HierarchicalChunking(ChunkingStrategy):
    """
    Hierarchical chunking based on document structure (headers, paragraphs)
    """

    def chunk(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> ChunkingResult:
        """Chunk text based on hierarchical structure"""
        metadata = metadata or {}
        chunks = []

        # Detect structure
        sections = self._detect_sections(text)

        chunk_index = 0
        doc_id = metadata.get('document_id', 'doc')

        for section in sections:
            # If section is too large, sub-chunk it
            if self.estimate_tokens(section['content']) > self.chunk_size:
                sub_chunks = self._sub_chunk_section(section, chunk_index, doc_id, metadata)
                chunks.extend(sub_chunks)
                chunk_index += len(sub_chunks)
            else:
                # Use section as single chunk
                chunk = Chunk(
                    content=section['content'],
                    metadata={
                        **metadata,
                        'chunk_index': chunk_index,
                        'chunk_type': 'hierarchical',
                        'section_level': section['level'],
                        'section_title': section['title']
                    },
                    chunk_id=self.create_chunk_id(doc_id, chunk_index),
                    start_index=section['start'],
                    end_index=section['end'],
                    token_count=self.estimate_tokens(section['content'])
                )
                chunks.append(chunk)
                chunk_index += 1

        total_tokens = sum(chunk.token_count for chunk in chunks)

        return ChunkingResult(
            chunks=chunks,
            total_chunks=len(chunks),
            total_tokens=total_tokens,
            strategy_used='hierarchical',
            metadata={
                'chunk_size': self.chunk_size,
                'sections_detected': len(sections)
            }
        )

    def _detect_sections(self, text: str) -> List[Dict[str, Any]]:
        """Detect document sections based on headers and paragraphs"""
        sections = []

        # Split by double newlines (paragraphs)
        paragraphs = text.split('\n\n')

        current_pos = 0
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check if paragraph is a header
            level = self._detect_header_level(para)
            title = para if level > 0 else None

            section = {
                'content': para,
                'start': current_pos,
                'end': current_pos + len(para),
                'level': level,
                'title': title
            }

            sections.append(section)
            current_pos += len(para) + 2  # +2 for \n\n

        return sections

    def _detect_header_level(self, text: str) -> int:
        """Detect if text is a header and its level"""
        # Markdown-style headers
        if text.startswith('#'):
            return len(text) - len(text.lstrip('#'))

        # All caps might be a header
        if text.isupper() and len(text) < 100:
            return 1

        # Short lines might be headers
        if len(text) < 50 and '\n' not in text:
            return 2

        return 0  # Not a header

    def _sub_chunk_section(
        self,
        section: Dict[str, Any],
        start_chunk_index: int,
        doc_id: str,
        metadata: Dict[str, Any]
    ) -> List[Chunk]:
        """Sub-chunk a large section"""
        # Use semantic chunking for large sections
        semantic_chunker = SemanticChunking(self.chunk_size, self.overlap)
        result = semantic_chunker.chunk(section['content'], metadata)

        # Update chunk metadata and IDs
        sub_chunks = []
        for i, chunk in enumerate(result.chunks):
            chunk.chunk_id = self.create_chunk_id(doc_id, start_chunk_index + i)
            chunk.metadata.update({
                'chunk_index': start_chunk_index + i,
                'chunk_type': 'hierarchical_sub',
                'parent_section_level': section['level'],
                'parent_section_title': section['title']
            })
            sub_chunks.append(chunk)

        return sub_chunks

class SlidingWindowChunking(ChunkingStrategy):
    """
    Sliding window chunking with configurable step size
    """

    def __init__(self, chunk_size: int = 1000, step_size: int = 500):
        super().__init__(chunk_size, chunk_size - step_size)  # overlap = chunk_size - step_size
        self.step_size = step_size

    def chunk(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> ChunkingResult:
        """Chunk text using sliding window approach"""
        metadata = metadata or {}
        chunks = []

        char_chunk_size = self.chunk_size * 4
        char_step_size = self.step_size * 4

        chunk_index = 0
        doc_id = metadata.get('document_id', 'doc')

        start = 0
        while start < len(text):
            end = min(start + char_chunk_size, len(text))
            chunk_content = text[start:end]

            if not chunk_content.strip():
                start += char_step_size
                continue

            chunk = Chunk(
                content=chunk_content,
                metadata={
                    **metadata,
                    'chunk_index': chunk_index,
                    'chunk_type': 'sliding_window',
                    'step_size': self.step_size
                },
                chunk_id=self.create_chunk_id(doc_id, chunk_index),
                start_index=start,
                end_index=end,
                token_count=self.estimate_tokens(chunk_content)
            )

            chunks.append(chunk)
            chunk_index += 1

            # Move by step size
            start += char_step_size

            # Break if we've reached the end
            if end >= len(text):
                break

        total_tokens = sum(chunk.token_count for chunk in chunks)

        return ChunkingResult(
            chunks=chunks,
            total_chunks=len(chunks),
            total_tokens=total_tokens,
            strategy_used='sliding_window',
            metadata={
                'chunk_size': self.chunk_size,
                'step_size': self.step_size,
                'overlap': self.overlap
            }
        )

class ChunkingManager:
    """
    Manager for different chunking strategies with automatic strategy selection
    """

    def __init__(self):
        self.strategies = {
            'fixed_size': FixedSizeChunking(),
            'semantic': SemanticChunking(),
            'hierarchical': HierarchicalChunking(),
            'sliding_window': SlidingWindowChunking()
        }

        # Strategy selection rules
        self.strategy_rules = {
            'short_text': 'fixed_size',      # < 2000 tokens
            'structured_text': 'hierarchical', # Has headers/sections
            'narrative_text': 'semantic',     # Prose, articles
            'technical_text': 'sliding_window', # Code, logs
            'default': 'semantic'
        }

    def auto_select_strategy(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> str:
        """Automatically select the best chunking strategy"""
        metadata = metadata or {}

        # Get text characteristics
        token_count = len(text) // 4  # Rough estimate

        # Check for structured content
        if self._has_structure(text):
            return 'hierarchical'

        # Check file type hints
        file_type = metadata.get('file_type', '').lower()
        if file_type in ['log', 'json', 'xml', 'csv']:
            return 'sliding_window'

        # Detect code-like patterns
        if re.search(r"```|\{[^\n]*\}|;\s*$|\bdef\b|\bclass\b", text, re.MULTILINE):
            return 'sliding_window'

        # Short text
        if token_count < 2000:
            return 'fixed_size'

        # Default to semantic for most text
        return 'semantic'

    def suggest_defaults(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, int]:
        """Suggest default chunk_size and overlap based on text length and type"""
        metadata = metadata or {}
        tokens = len(text) // 4
        file_type = (metadata.get('file_type') or '').lower()

        if tokens < 800:
            return {'chunk_size': 400, 'overlap': 80}
        if file_type in {'code', 'log', 'json', 'xml'}:
            return {'chunk_size': 800, 'overlap': 200}
        if tokens > 6000:
            return {'chunk_size': 1200, 'overlap': 200}
        return {'chunk_size': 1000, 'overlap': 200}

    def _has_structure(self, text: str) -> bool:
        """Check if text has hierarchical structure"""
        # Look for markdown headers
        header_count = len(re.findall(r'^#+\s+', text, re.MULTILINE))
        if header_count > 2:
            return True

        # Look for numbered sections
        numbered_sections = len(re.findall(r'^\d+\.\s+', text, re.MULTILINE))
        if numbered_sections > 2:
            return True

        # Look for all-caps headers
        caps_headers = len(re.findall(r'^[A-Z\s]{5,50}$', text, re.MULTILINE))
        if caps_headers > 2:
            return True

        return False

    def chunk_document(
        self,
        text: str,
        strategy: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        chunk_size: int = 1000,
        overlap: int = 200
    ) -> ChunkingResult:
        """Chunk document using specified or auto-selected strategy"""

        # Auto-select strategy if not specified
        if strategy is None:
            strategy = self.auto_select_strategy(text, metadata)

        # Get strategy instance
        if strategy not in self.strategies:
            logger.warning(f"Unknown strategy '{strategy}', using default")
            strategy = 'semantic'

        chunker = self.strategies[strategy]

        # Update chunker parameters if provided
        if chunk_size != 1000:
            chunker.chunk_size = chunk_size
        if overlap != 200:
            chunker.overlap = overlap

        # Perform chunking
        try:
            result = chunker.chunk(text, metadata)

            # Add quality metrics
            meta = metadata or {}
            result.metadata.update({
                'auto_selected': strategy != meta.get('requested_strategy'),
                'text_length': len(text),
                'avg_chunk_size': result.total_tokens / result.total_chunks if result.total_chunks > 0 else 0,
                'chunking_efficiency': self._calculate_efficiency(result)
            })

            return result

        except Exception as e:
            logger.error(f"Chunking failed with strategy '{strategy}': {e}")

            # Fallback to fixed size chunking
            fallback_chunker = FixedSizeChunking(chunk_size, overlap)
            result = fallback_chunker.chunk(text, metadata)
            result.strategy_used = f"fixed_size_fallback_from_{strategy}"
            result.metadata['fallback_reason'] = str(e)

            return result

    def _calculate_efficiency(self, result: ChunkingResult) -> float:
        """Calculate chunking efficiency score"""
        if result.total_chunks == 0:
            return 0.0

        # Factors for efficiency:
        # 1. Chunk size consistency
        chunk_sizes = [chunk.token_count for chunk in result.chunks]
        avg_size = sum(chunk_sizes) / len(chunk_sizes)
        size_variance = sum((size - avg_size) ** 2 for size in chunk_sizes) / len(chunk_sizes)
        size_consistency = 1.0 / (1.0 + size_variance / (avg_size ** 2))

        # 2. Overlap efficiency (not too much, not too little)
        target_overlap = result.metadata.get('overlap', 200)
        actual_overlaps = [chunk.overlap_with_previous for chunk in result.chunks[1:]]
        if actual_overlaps:
            avg_overlap = sum(actual_overlaps) / len(actual_overlaps)
            overlap_efficiency = 1.0 - abs(avg_overlap - target_overlap) / target_overlap
        else:
            overlap_efficiency = 1.0

        # Combined efficiency score
        efficiency = (size_consistency * 0.7) + (overlap_efficiency * 0.3)
        return min(1.0, max(0.0, efficiency))

    def get_strategy_info(self, strategy: Optional[str] = None) -> Dict[str, Any]:
        """Get information about chunking strategies"""
        if strategy:


            if strategy in self.strategies:
                chunker = self.strategies[strategy]
                return {
                    'name': strategy,
                    'class': chunker.__class__.__name__,
                    'default_chunk_size': chunker.chunk_size,
                    'default_overlap': chunker.overlap,
                    'description': chunker.__doc__.strip() if chunker.__doc__ else ''


                }
            else:
                return {'error': f"Strategy '{strategy}' not found"}
        else:
            # Return info for all strategies
            return {
                name: {
                    'class': chunker.__class__.__name__,
                    'default_chunk_size': chunker.chunk_size,
                    'default_overlap': chunker.overlap,
                    'description': chunker.__doc__.strip() if chunker.__doc__ else ''
                }
                for name, chunker in self.strategies.items()
            }

# Global instance
chunking_manager = ChunkingManager()


# Convenience wrapper for callers/tests
def semantic_chunker(
    text: str,
    *,
    chunk_size: int = 1000,
    overlap: int = 200,
    min_chunk_size: int = 100,
    respect_paragraphs: bool = True,
    metadata: Dict[str, Any] | None = None,
) -> ChunkingResult:
    sc = SemanticChunking(chunk_size=chunk_size, overlap=overlap,
                          min_chunk_size=min_chunk_size, respect_paragraphs=respect_paragraphs)
    return sc.chunk(text, metadata or {})


# Simple deduplication for chunks based on content hashing and Jaccard similarity
from hashlib import md5

def _token_set(text: str) -> set[str]:
    return set(w.strip(".,;:!?").lower() for w in text.split() if w.strip())

def deduplicate_chunks(chunks: List[Chunk], similarity_threshold: float = 0.9) -> List[Chunk]:
    filtered: List[Chunk] = []
    seen_hashes: set[str] = set()

    for ch in chunks:
        content = ch.content or ""
        h = md5(content.encode("utf-8", errors="ignore")).hexdigest()
        if h in seen_hashes:
            continue

        duplicate = False
        toks = _token_set(content)
        for kept in filtered:
            ktoks = _token_set(kept.content)
            if not toks or not ktoks:
                continue
            inter = len(toks & ktoks)
            union = len(toks | ktoks)
            sim = inter / union if union else 0.0
            if sim >= similarity_threshold:
                duplicate = True
                break

        if not duplicate:
            filtered.append(ch)
            seen_hashes.add(h)

    return filtered

# Basic chunk quality validation heuristics
def validate_chunk_quality(content: str, *, min_chars: int = 50, min_tokens: int = 10) -> Dict[str, Any]:
    text = (content or "").strip()
    tokens = text.split()
    sentences = re.split(r"(?<=[.!?])\s+", text) if text else []

    too_short = len(text) < min_chars or len(tokens) < min_tokens
    ends_with_punct = bool(text) and text[-1] in ".!?"
    starts_with_cap = bool(text) and text[0].isupper()

    avg_sent_len = (sum(len(s.split()) for s in sentences) / len(sentences)) if sentences else 0.0

    return {
        "too_short": too_short,
        "ends_with_punctuation": ends_with_punct,
        "starts_with_capital": starts_with_cap,
        "avg_sentence_length": avg_sent_len,
        "token_count": len(tokens),
        "char_count": len(text),
        "is_readable": not too_short and ends_with_punct and avg_sent_len >= 4,
    }
