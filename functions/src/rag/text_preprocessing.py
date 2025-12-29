"""
Advanced Text Preprocessing for Search and NLP
"""
import re
import string
from typing import List, Set, Dict, Any, Optional
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.chunk import ne_chunk
from nltk.tag import pos_tag

# Download required NLTK data
required_nltk_data = ['punkt', 'stopwords', 'wordnet', 'averaged_perceptron_tagger', 'maxent_ne_chunker', 'words']
for data in required_nltk_data:
    try:
        nltk.data.find(f'tokenizers/{data}')
    except LookupError:
        try:
            nltk.data.find(f'corpora/{data}')
        except LookupError:
            try:
                nltk.data.find(f'taggers/{data}')
            except LookupError:
                try:
                    nltk.data.find(f'chunkers/{data}')
                except LookupError:
                    nltk.download(data, quiet=True)

class TextPreprocessor:
    """Advanced text preprocessing with multiple strategies"""

    def __init__(self, language: str = 'english'):
        """
        Initialize text preprocessor

        Args:
            language: Language for stopwords and stemming
        """
        self.language = language
        self.stemmer = PorterStemmer()
        self.lemmatizer = WordNetLemmatizer()
        self.stop_words = set(stopwords.words(language))

        # Add custom stopwords for technical content
        self.custom_stopwords = {
            'using', 'used', 'use', 'also', 'would', 'could', 'should',
            'may', 'might', 'must', 'shall', 'will', 'can', 'need',
            'want', 'like', 'get', 'got', 'going', 'go', 'come', 'came'
        }
        self.stop_words.update(self.custom_stopwords)

        # Technical terms to preserve
        self.preserve_terms = {
            'api', 'ai', 'ml', 'nlp', 'gpu', 'cpu', 'ram', 'ssd', 'hdd',
            'http', 'https', 'json', 'xml', 'csv', 'pdf', 'sql', 'nosql',
            'rest', 'soap', 'oauth', 'jwt', 'ssl', 'tls', 'tcp', 'udp',
            'html', 'css', 'js', 'python', 'java', 'cpp', 'csharp'
        }

    def basic_clean(self, text: str) -> str:
        """
        Basic text cleaning

        Args:
            text: Raw text to clean

        Returns:
            Cleaned text
        """
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters but preserve some punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\-\(\)]', ' ', text)

        # Remove multiple punctuation
        text = re.sub(r'[\.]{2,}', '.', text)
        text = re.sub(r'[\!\?]{2,}', '!', text)

        return text.strip()

    def tokenize(self, text: str, method: str = 'word') -> List[str]:
        """
        Tokenize text using different methods

        Args:
            text: Text to tokenize
            method: Tokenization method ('word', 'sentence')

        Returns:
            List of tokens
        """
        if method == 'word':
            return word_tokenize(text)
        elif method == 'sentence':
            return sent_tokenize(text)
        else:
            raise ValueError(f"Unknown tokenization method: {method}")

    def remove_stopwords(self, tokens: List[str], preserve_technical: bool = True) -> List[str]:
        """
        Remove stopwords from token list

        Args:
            tokens: List of tokens
            preserve_technical: Whether to preserve technical terms

        Returns:
            Filtered tokens
        """
        filtered_tokens = []

        for token in tokens:
            token_lower = token.lower()

            # Preserve technical terms
            if preserve_technical and token_lower in self.preserve_terms:
                filtered_tokens.append(token_lower)
            # Remove stopwords
            elif token_lower not in self.stop_words and len(token) > 2:
                filtered_tokens.append(token_lower)

        return filtered_tokens

    def stem_tokens(self, tokens: List[str]) -> List[str]:
        """
        Apply stemming to tokens

        Args:
            tokens: List of tokens to stem

        Returns:
            Stemmed tokens
        """
        return [self.stemmer.stem(token) for token in tokens]

    def lemmatize_tokens(self, tokens: List[str]) -> List[str]:
        """
        Apply lemmatization to tokens

        Args:
            tokens: List of tokens to lemmatize

        Returns:
            Lemmatized tokens
        """
        return [self.lemmatizer.lemmatize(token) for token in tokens]

    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """
        Extract named entities from text

        Args:
            text: Text to analyze

        Returns:
            List of entities with types
        """
        tokens = word_tokenize(text)
        pos_tags = pos_tag(tokens)
        chunks = ne_chunk(pos_tags)

        entities = []
        for chunk in chunks:
            if hasattr(chunk, 'label'):
                entity_text = ' '.join([token for token, pos in chunk.leaves()])
                entities.append({
                    'text': entity_text,
                    'type': chunk.label(),
                    'tokens': [token for token, pos in chunk.leaves()]
                })

        return entities

    def preprocess_for_search(self, text: str, strategy: str = 'balanced') -> List[str]:
        """
        Comprehensive preprocessing for search indexing

        Args:
            text: Text to preprocess
            strategy: Preprocessing strategy ('aggressive', 'balanced', 'minimal')

        Returns:
            Processed tokens
        """
        # Basic cleaning
        cleaned_text = self.basic_clean(text)

        # Tokenization
        tokens = self.tokenize(cleaned_text, method='word')

        # Filter tokens based on strategy
        if strategy == 'minimal':
            # Keep most tokens, only remove obvious noise
            tokens = [token.lower() for token in tokens if token.isalpha() and len(token) > 1]

        elif strategy == 'balanced':
            # Remove stopwords but preserve technical terms
            tokens = [token.lower() for token in tokens if token.isalpha()]
            tokens = self.remove_stopwords(tokens, preserve_technical=True)
            tokens = self.stem_tokens(tokens)

        elif strategy == 'aggressive':
            # Heavy preprocessing with lemmatization
            tokens = [token.lower() for token in tokens if token.isalpha()]
            tokens = self.remove_stopwords(tokens, preserve_technical=False)
            tokens = self.lemmatize_tokens(tokens)

        else:
            raise ValueError(f"Unknown preprocessing strategy: {strategy}")

        # Final filtering
        tokens = [token for token in tokens if len(token) > 2]

        return tokens

    def preprocess_query(self, query: str) -> List[str]:
        """
        Preprocess search query with lighter processing

        Args:
            query: Search query

        Returns:
            Processed query tokens
        """
        # Light cleaning for queries
        cleaned_query = self.basic_clean(query)

        # Tokenize
        tokens = self.tokenize(cleaned_query, method='word')

        # Light filtering - preserve more terms for queries
        tokens = [
            token.lower() for token in tokens
            if token.isalpha() and len(token) > 1 and token.lower() not in self.stop_words
        ]

        # Light stemming
        tokens = self.stem_tokens(tokens)

        return tokens

    def extract_keywords(self, text: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Extract important keywords from text

        Args:
            text: Text to analyze
            top_k: Number of top keywords to return

        Returns:
            List of keywords with scores
        """
        # Preprocess text
        tokens = self.preprocess_for_search(text, strategy='balanced')

        # Calculate term frequencies
        from collections import Counter
        term_freq = Counter(tokens)

        # Simple keyword scoring (can be enhanced with TF-IDF)
        total_tokens = len(tokens)
        keywords = []

        for term, freq in term_freq.most_common(top_k):
            score = freq / total_tokens
            keywords.append({
                'term': term,
                'frequency': freq,
                'score': score
            })

        return keywords



# --- Lightweight normalization utilities (for pipeline-wide reuse) ---
try:  # Optional language detection
    from langdetect import detect as _langdetect_detect  # type: ignore
    _LANGDETECT_AVAILABLE = True
except Exception:  # pragma: no cover
    _LANGDETECT_AVAILABLE = False

_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x84\x86-\x9f]")
_MULTI_WS_RE = re.compile(r"\s+")
_HTML_TAG_RE = re.compile(r"<[^>]+>")


def normalize_unicode(text: str) -> str:
    try:
        import unicodedata
        t = unicodedata.normalize("NFC", text or "")
    except Exception:
        t = text or ""
    # Remove zero-width and BOM; normalize NBSP to space
    t = t.replace("\u200b", "").replace("\ufeff", "").replace("\xa0", " ")
    return _CONTROL_CHARS_RE.sub(" ", t)


def normalize_whitespace(text: str) -> str:
    return _MULTI_WS_RE.sub(" ", text or "").strip()


def strip_html(text: str) -> str:
    if not text:
        return ""
    try:
        from bs4 import BeautifulSoup  # type: ignore
        return BeautifulSoup(text, "html.parser").get_text(" ")
    except Exception:
        return _HTML_TAG_RE.sub(" ", text)


def remove_special_chars(text: str) -> str:
    t = (text or "").replace("\u200b", "").replace("\ufeff", "").replace("\xa0", " ")
    return t


def detect_language(text: str) -> str | None:
    t = (text or "").strip()
    if len(t) < 20:
        return None
    if _LANGDETECT_AVAILABLE:
        try:
            return _langdetect_detect(t)
        except Exception:
            return None
    return None


def preprocess_text(text: str, *, strip_tags: bool = True) -> Dict[str, Any]:
    t = text or ""
    if strip_tags:
        t = strip_html(t)
    t = normalize_unicode(t)
    t = remove_special_chars(t)
    t = normalize_whitespace(t)
    lang = detect_language(t)
    return {
        "text": t,
        "language": lang,
        "original_length": len(text or ""),
        "cleaned_length": len(t),
    }

# Global preprocessor instance (optional)
text_preprocessor: Optional['TextPreprocessor'] = None
try:
    text_preprocessor = TextPreprocessor()
except Exception:
    pass
