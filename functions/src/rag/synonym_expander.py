"""
Synonym Expansion for Query Enhancement
"""
import logging
import json
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass
from pathlib import Path

import nltk
from nltk.corpus import wordnet

logger = logging.getLogger(__name__)

@dataclass
class SynonymExpansion:
    """Synonym expansion result"""
    original_term: str
    synonyms: List[str]
    source: str  # 'wordnet', 'domain', 'custom'
    confidence: float

class SynonymExpander:
    """
    Advanced synonym expansion with domain-specific knowledge
    """
    
    def __init__(self):
        """Initialize synonym expander"""
        
        # Domain-specific synonyms
        self.domain_synonyms = {
            # Technology terms
            'ai': ['artificial intelligence', 'machine intelligence', 'cognitive computing'],
            'ml': ['machine learning', 'automated learning', 'statistical learning'],
            'nlp': ['natural language processing', 'text processing', 'computational linguistics'],
            'api': ['application programming interface', 'web service', 'endpoint'],
            'database': ['data store', 'repository', 'data warehouse', 'datastore'],
            'algorithm': ['method', 'procedure', 'technique', 'approach'],
            'model': ['framework', 'system', 'architecture', 'structure'],
            'neural network': ['deep learning', 'neural net', 'artificial neural network'],
            'gpu': ['graphics processing unit', 'graphics card', 'video card'],
            'cpu': ['central processing unit', 'processor', 'chip'],
            
            # Business terms
            'roi': ['return on investment', 'profitability', 'investment return'],
            'kpi': ['key performance indicator', 'metric', 'performance measure'],
            'crm': ['customer relationship management', 'customer management'],
            'erp': ['enterprise resource planning', 'business system'],
            'saas': ['software as a service', 'cloud software', 'web application'],
            'b2b': ['business to business', 'enterprise', 'commercial'],
            'b2c': ['business to consumer', 'retail', 'consumer'],
            
            # Academic terms
            'research': ['study', 'investigation', 'analysis', 'examination'],
            'methodology': ['approach', 'method', 'technique', 'procedure'],
            'hypothesis': ['theory', 'assumption', 'proposition', 'conjecture'],
            'analysis': ['examination', 'evaluation', 'assessment', 'review'],
            'framework': ['structure', 'model', 'system', 'architecture'],
            
            # General terms
            'document': ['file', 'text', 'content', 'paper', 'article'],
            'information': ['data', 'content', 'knowledge', 'details'],
            'search': ['find', 'query', 'retrieve', 'lookup', 'seek'],
            'create': ['generate', 'make', 'produce', 'build', 'develop'],
            'analyze': ['examine', 'study', 'investigate', 'evaluate'],
            'compare': ['contrast', 'evaluate', 'assess', 'examine'],
            'explain': ['describe', 'clarify', 'elucidate', 'illustrate'],
            'understand': ['comprehend', 'grasp', 'learn', 'know'],
            'improve': ['enhance', 'optimize', 'better', 'upgrade'],
            'implement': ['execute', 'deploy', 'apply', 'realize'],
        }
        
        # Contextual synonym groups
        self.contextual_groups = {
            'technology': {
                'fast': ['efficient', 'optimized', 'high-performance', 'rapid'],
                'slow': ['inefficient', 'bottleneck', 'delayed', 'lagging'],
                'big': ['large-scale', 'enterprise', 'massive', 'high-volume'],
                'small': ['lightweight', 'minimal', 'compact', 'micro'],
                'new': ['modern', 'latest', 'cutting-edge', 'state-of-the-art'],
                'old': ['legacy', 'deprecated', 'outdated', 'traditional'],
            },
            'business': {
                'good': ['profitable', 'successful', 'effective', 'valuable'],
                'bad': ['unprofitable', 'ineffective', 'costly', 'problematic'],
                'big': ['enterprise', 'large-scale', 'corporate', 'major'],
                'small': ['startup', 'boutique', 'niche', 'specialized'],
                'fast': ['agile', 'rapid', 'quick', 'efficient'],
                'slow': ['delayed', 'inefficient', 'sluggish', 'bottlenecked'],
            },
            'academic': {
                'important': ['significant', 'crucial', 'vital', 'essential'],
                'new': ['novel', 'innovative', 'recent', 'contemporary'],
                'old': ['established', 'traditional', 'classical', 'historical'],
                'good': ['effective', 'successful', 'valid', 'sound'],
                'bad': ['flawed', 'ineffective', 'problematic', 'invalid'],
            }
        }
        
        # Load custom synonyms if available
        self.custom_synonyms = self._load_custom_synonyms()
        
        logger.info("Synonym expander initialized")
    
    def _load_custom_synonyms(self) -> Dict[str, List[str]]:
        """
        Load custom synonyms from file if available
        
        Returns:
            Custom synonyms dictionary
        """
        try:
            synonyms_file = Path(__file__).parent.parent.parent / "data" / "synonyms.json"
            if synonyms_file.exists():
                with open(synonyms_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load custom synonyms: {e}")
        
        return {}
    
    def _get_wordnet_synonyms(self, term: str, max_synonyms: int = 3) -> List[str]:
        """
        Get synonyms from WordNet
        
        Args:
            term: Term to find synonyms for
            max_synonyms: Maximum number of synonyms to return
            
        Returns:
            List of WordNet synonyms
        """
        synonyms = set()
        
        try:
            # Get synsets for the term
            synsets = wordnet.synsets(term)
            
            for synset in synsets[:2]:  # Limit to first 2 synsets
                for lemma in synset.lemmas():
                    synonym = lemma.name().lower().replace('_', ' ')
                    if synonym != term.lower() and len(synonym) > 2:
                        synonyms.add(synonym)
                        
                        if len(synonyms) >= max_synonyms:
                            break
                
                if len(synonyms) >= max_synonyms:
                    break
        
        except Exception as e:
            logger.debug(f"Error getting WordNet synonyms for '{term}': {e}")
        
        return list(synonyms)[:max_synonyms]
    
    def _get_domain_synonyms(self, term: str) -> List[str]:
        """
        Get domain-specific synonyms
        
        Args:
            term: Term to find synonyms for
            
        Returns:
            List of domain synonyms
        """
        term_lower = term.lower()
        
        # Check direct domain synonyms
        if term_lower in self.domain_synonyms:
            return self.domain_synonyms[term_lower].copy()
        
        # Check custom synonyms
        if term_lower in self.custom_synonyms:
            return self.custom_synonyms[term_lower].copy()
        
        return []
    
    def _get_contextual_synonyms(self, term: str, context: Optional[str] = None) -> List[str]:
        """
        Get contextual synonyms based on domain context
        
        Args:
            term: Term to find synonyms for
            context: Domain context ('technology', 'business', 'academic')
            
        Returns:
            List of contextual synonyms
        """
        if not context or context not in self.contextual_groups:
            return []
        
        term_lower = term.lower()
        context_synonyms = self.contextual_groups[context]
        
        if term_lower in context_synonyms:
            return context_synonyms[term_lower].copy()
        
        return []
    
    def _detect_context(self, query: str) -> Optional[str]:
        """
        Detect domain context from query
        
        Args:
            query: Full query string
            
        Returns:
            Detected context or None
        """
        query_lower = query.lower()
        
        # Technology indicators
        tech_indicators = ['ai', 'ml', 'algorithm', 'software', 'code', 'api', 'database', 'system']
        if any(indicator in query_lower for indicator in tech_indicators):
            return 'technology'
        
        # Business indicators
        business_indicators = ['business', 'company', 'market', 'sales', 'revenue', 'profit', 'customer']
        if any(indicator in query_lower for indicator in business_indicators):
            return 'business'
        
        # Academic indicators
        academic_indicators = ['research', 'study', 'analysis', 'paper', 'theory', 'methodology']
        if any(indicator in query_lower for indicator in academic_indicators):
            return 'academic'
        
        return None
    
    def expand_term(self, term: str, query_context: Optional[str] = None, 
                   max_synonyms: int = 5) -> SynonymExpansion:
        """
        Expand a single term with synonyms
        
        Args:
            term: Term to expand
            query_context: Full query for context detection
            max_synonyms: Maximum number of synonyms to return
            
        Returns:
            Synonym expansion result
        """
        all_synonyms = []
        sources_used = []
        
        # Get domain-specific synonyms first (highest priority)
        domain_synonyms = self._get_domain_synonyms(term)
        if domain_synonyms:
            all_synonyms.extend(domain_synonyms[:max_synonyms//2])
            sources_used.append('domain')
        
        # Get contextual synonyms
        if query_context:
            context = self._detect_context(query_context)
            if context:
                contextual_synonyms = self._get_contextual_synonyms(term, context)
                if contextual_synonyms:
                    all_synonyms.extend(contextual_synonyms[:2])
                    sources_used.append('contextual')
        
        # Fill remaining slots with WordNet synonyms
        remaining_slots = max_synonyms - len(all_synonyms)
        if remaining_slots > 0:
            wordnet_synonyms = self._get_wordnet_synonyms(term, remaining_slots)
            if wordnet_synonyms:
                all_synonyms.extend(wordnet_synonyms)
                sources_used.append('wordnet')
        
        # Remove duplicates while preserving order
        unique_synonyms = []
        seen = set()
        for synonym in all_synonyms:
            if synonym.lower() not in seen:
                unique_synonyms.append(synonym)
                seen.add(synonym.lower())
        
        # Calculate confidence based on sources
        confidence = 0.0
        if 'domain' in sources_used:
            confidence += 0.8
        if 'contextual' in sources_used:
            confidence += 0.6
        if 'wordnet' in sources_used:
            confidence += 0.4
        
        confidence = min(1.0, confidence)
        
        return SynonymExpansion(
            original_term=term,
            synonyms=unique_synonyms[:max_synonyms],
            source=', '.join(sources_used) if sources_used else 'none',
            confidence=confidence
        )
    
    def expand_query(self, query: str, max_synonyms_per_term: int = 3) -> Dict[str, SynonymExpansion]:
        """
        Expand all terms in a query
        
        Args:
            query: Query to expand
            max_synonyms_per_term: Maximum synonyms per term
            
        Returns:
            Dictionary mapping terms to their expansions
        """
        # Simple tokenization (can be enhanced)
        words = query.lower().split()
        
        # Filter words (remove very short words, numbers, etc.)
        terms_to_expand = [
            word for word in words 
            if len(word) > 2 and word.isalpha()
        ]
        
        expansions = {}
        
        for term in terms_to_expand:
            expansion = self.expand_term(term, query, max_synonyms_per_term)
            if expansion.synonyms:  # Only include if synonyms were found
                expansions[term] = expansion
        
        return expansions
    
    def get_expanded_tokens(self, query: str, include_original: bool = True) -> List[str]:
        """
        Get all tokens including expansions for search
        
        Args:
            query: Query to expand
            include_original: Whether to include original terms
            
        Returns:
            List of all tokens including synonyms
        """
        original_tokens = query.lower().split()
        
        if include_original:
            all_tokens = original_tokens.copy()
        else:
            all_tokens = []
        
        # Get expansions
        expansions = self.expand_query(query)
        
        for term, expansion in expansions.items():
            all_tokens.extend(expansion.synonyms)
        
        # Remove duplicates while preserving order
        unique_tokens = []
        seen = set()
        for token in all_tokens:
            if token not in seen:
                unique_tokens.append(token)
                seen.add(token)
        
        return unique_tokens


# Global instance for use across the application
synonym_expander = SynonymExpander()

