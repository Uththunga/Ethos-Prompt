"""
Query Expansion - Enhance search queries with synonyms, context, and related terms
"""
import logging
import re
from typing import Dict, Any, List, Optional, Set, Tuple
from dataclasses import dataclass
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

@dataclass
class ExpandedQuery:
    original_query: str
    expanded_query: str
    expansion_terms: List[str]
    expansion_method: str
    confidence_score: float
    metadata: Dict[str, Any]

@dataclass
class QueryAnalysis:
    query: str
    intent: str
    entities: List[str]
    key_terms: List[str]
    query_type: str  # question, command, search, etc.
    complexity: str  # simple, medium, complex
    domain: str      # technical, general, specific

class QueryExpansionEngine:
    """
    Advanced query expansion with multiple strategies
    """

    def __init__(self, llm_manager=None):
        self.llm_manager = llm_manager

        # Synonym dictionary (in production, use WordNet or similar)
        self.synonyms = {
            'create': ['build', 'make', 'develop', 'generate', 'construct'],
            'fix': ['repair', 'solve', 'resolve', 'debug', 'troubleshoot'],
            'help': ['assist', 'support', 'guide', 'aid'],
            'learn': ['study', 'understand', 'master', 'grasp'],
            'fast': ['quick', 'rapid', 'speedy', 'swift'],
            'easy': ['simple', 'straightforward', 'basic'],
            'difficult': ['hard', 'complex', 'challenging', 'complicated'],
            'good': ['excellent', 'great', 'quality', 'effective'],
            'bad': ['poor', 'ineffective', 'problematic'],
            'big': ['large', 'huge', 'massive', 'extensive'],
            'small': ['tiny', 'minimal', 'compact', 'little']
        }

        # Domain-specific expansions
        self.domain_expansions = {
            'programming': {
                'code': ['script', 'program', 'implementation', 'source'],
                'bug': ['error', 'issue', 'problem', 'defect'],
                'function': ['method', 'procedure', 'routine'],
                'variable': ['parameter', 'argument', 'value'],
                'database': ['db', 'storage', 'repository', 'data store']
            },
            'machine_learning': {
                'model': ['algorithm', 'network', 'classifier'],
                'training': ['learning', 'fitting', 'optimization'],
                'data': ['dataset', 'samples', 'examples'],
                'accuracy': ['performance', 'precision', 'recall']
            },
            'web_development': {
                'frontend': ['client-side', 'UI', 'interface'],
                'backend': ['server-side', 'API', 'service'],
                'framework': ['library', 'toolkit', 'platform']
            }
        }

        # Enhanced abbreviations and expansions
        self.abbreviations = {
            'ai': 'artificial intelligence',
            'ml': 'machine learning',
            'dl': 'deep learning',
            'nlp': 'natural language processing',
            'cv': 'computer vision',
            'api': 'application programming interface',
            'ui': 'user interface',
            'ux': 'user experience',
            'db': 'database',
            'js': 'javascript',
            'ts': 'typescript',
            'css': 'cascading style sheets',
            'html': 'hypertext markup language',
            'sql': 'structured query language',
            'nosql': 'not only sql',
            'rest': 'representational state transfer',
            'graphql': 'graph query language',
            'json': 'javascript object notation',
            'xml': 'extensible markup language',
            'yaml': 'yaml ain\'t markup language',
            'http': 'hypertext transfer protocol',
            'https': 'hypertext transfer protocol secure',
            'tcp': 'transmission control protocol',
            'udp': 'user datagram protocol',
            'dns': 'domain name system',
            'cdn': 'content delivery network',
            'aws': 'amazon web services',
            'gcp': 'google cloud platform',
            'k8s': 'kubernetes',
            'ci': 'continuous integration',
            'cd': 'continuous deployment',
            'devops': 'development operations',
            'sre': 'site reliability engineering',
            'iot': 'internet of things',
            'ar': 'augmented reality',
            'vr': 'virtual reality',
            'gpu': 'graphics processing unit',
            'cpu': 'central processing unit',
            'ram': 'random access memory',
            'ssd': 'solid state drive',
            'hdd': 'hard disk drive'
        }

        # Query intent patterns for better understanding
        self.intent_patterns = {
            'how_to': [r'how to', r'how do i', r'how can i', r'steps to', r'guide to', r'tutorial'],
            'what_is': [r'what is', r'what are', r'define', r'explain', r'meaning of', r'definition'],
            'troubleshoot': [r'error', r'problem', r'issue', r'not working', r'failed', r'broken'],
            'compare': [r'vs', r'versus', r'compare', r'difference between', r'better than', r'which'],
            'best_practice': [r'best practice', r'recommended', r'should i', r'proper way', r'standard'],
            'example': [r'example', r'sample', r'demo', r'tutorial', r'walkthrough', r'case study'],
            'list': [r'list of', r'types of', r'kinds of', r'examples of', r'all'],
            'performance': [r'optimize', r'improve', r'faster', r'performance', r'speed up'],
            'security': [r'secure', r'protect', r'safety', r'vulnerability', r'authentication']
        }

        # Contextual expansion weights
        self.expansion_weights = {
            'synonym': 0.8,
            'domain': 0.9,
            'abbreviation': 1.0,
            'llm_generated': 0.7,
            'contextual': 0.85
        }

    async def expand_query(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        expansion_methods: Optional[List[str]] = None
    ) -> ExpandedQuery:
        """
        Expand query using multiple methods
        """
        if not query or not query.strip():
            return ExpandedQuery(
                original_query=query,
                expanded_query=query,
                expansion_terms=[],
                expansion_method="none",
                confidence_score=0.0,
                metadata={"error": "Empty query"}
            )

        # Analyze query
        analysis = self._analyze_query(query)

        # Default expansion methods
        if expansion_methods is None:
            expansion_methods = ['synonyms', 'abbreviations', 'domain_specific']

            # Add LLM expansion for complex queries
            if analysis.complexity in ['medium', 'complex'] and self.llm_manager:
                expansion_methods.append('llm_based')

        # Apply expansion methods
        expanded_terms = set()
        expansion_metadata = {}

        for method in expansion_methods:
            if method == 'synonyms':
                terms = self._expand_with_synonyms(query, analysis)
                expanded_terms.update(terms)
                expansion_metadata['synonyms'] = terms

            elif method == 'abbreviations':
                terms = self._expand_abbreviations(query)
                expanded_terms.update(terms)
                expansion_metadata['abbreviations'] = terms

            elif method == 'domain_specific':
                terms = self._expand_domain_specific(query, analysis)
                expanded_terms.update(terms)
                expansion_metadata['domain_specific'] = terms

            elif method == 'context_based' and context:
                terms = self._expand_with_context(query, context)
                expanded_terms.update(terms)
                expansion_metadata['context_based'] = terms

            elif method == 'llm_based' and self.llm_manager:
                terms = await self._expand_with_llm(query, analysis)
                expanded_terms.update(terms)
                expansion_metadata['llm_based'] = terms

        # Remove original query terms to avoid duplication
        original_terms = set(query.lower().split())
        expanded_terms = expanded_terms - original_terms

        # Create expanded query
        if expanded_terms:
            expanded_query = f"{query} {' '.join(expanded_terms)}"
            confidence_score = self._calculate_confidence_score(
                query, list(expanded_terms), expansion_methods
            )
        else:
            expanded_query = query
            confidence_score = 1.0

        return ExpandedQuery(
            original_query=query,
            expanded_query=expanded_query,
            expansion_terms=list(expanded_terms),
            expansion_method='+'.join(expansion_methods),
            confidence_score=confidence_score,
            metadata={
                'analysis': analysis.__dict__,
                'expansion_details': expansion_metadata,
                'methods_used': expansion_methods
            }
        )

    def _analyze_query(self, query: str) -> QueryAnalysis:
        """
        Analyze query to understand intent and structure
        """
        query_lower = query.lower()

        # Determine intent
        intent = "search"  # default
        if any(word in query_lower for word in ['how', 'what', 'why', 'when', 'where']):
            intent = "question"
        elif any(word in query_lower for word in ['create', 'make', 'build', 'generate']):
            intent = "creation"
        elif any(word in query_lower for word in ['fix', 'solve', 'debug', 'troubleshoot']):
            intent = "troubleshooting"
        elif any(word in query_lower for word in ['explain', 'describe', 'tell me']):
            intent = "explanation"

        # Extract entities (simple approach)
        entities = []
        # Look for capitalized words (potential proper nouns)
        entities.extend(re.findall(r'\b[A-Z][a-z]+\b', query))
        # Look for technical terms
        tech_terms = re.findall(r'\b(?:API|JSON|XML|HTTP|SQL|CSS|HTML|JS)\b', query, re.IGNORECASE)
        entities.extend(tech_terms)

        # Extract key terms (words longer than 3 characters, excluding common words)
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'will', 'with'}
        words = re.findall(r'\b[a-zA-Z]{4,}\b', query_lower)
        key_terms = [word for word in words if word not in stop_words]

        # Determine query type
        query_type = "search"
        if query.endswith('?'):
            query_type = "question"
        elif any(word in query_lower for word in ['show', 'list', 'find', 'search']):
            query_type = "search"
        elif any(word in query_lower for word in ['create', 'make', 'build']):
            query_type = "command"

        # Determine complexity
        word_count = len(query.split())
        if word_count <= 3:
            complexity = "simple"
        elif word_count <= 8:
            complexity = "medium"
        else:
            complexity = "complex"

        # Determine domain
        domain = "general"
        if any(term in query_lower for term in ['code', 'programming', 'function', 'variable', 'algorithm']):
            domain = "programming"
        elif any(term in query_lower for term in ['machine learning', 'model', 'training', 'neural']):
            domain = "machine_learning"
        elif any(term in query_lower for term in ['web', 'frontend', 'backend', 'html', 'css']):
            domain = "web_development"
        elif any(term in query_lower for term in ['database', 'sql', 'query', 'table']):
            domain = "database"

        return QueryAnalysis(
            query=query,
            intent=intent,
            entities=entities,
            key_terms=key_terms,
            query_type=query_type,
            complexity=complexity,
            domain=domain
        )

    def _expand_with_synonyms(self, query: str, analysis: Optional[QueryAnalysis] = None) -> List[str]:
        """
        Expand query with synonyms
        """
        expanded_terms = []
        query_words = query.lower().split()

        for word in query_words:
            if word in self.synonyms:
                # Add 1-2 most relevant synonyms
                synonyms = self.synonyms[word][:2]
                expanded_terms.extend(synonyms)

        return expanded_terms

    def _expand_abbreviations(self, query: str) -> List[str]:
        """
        Expand abbreviations in query
        """
        expanded_terms = []
        query_words = query.lower().split()

        for word in query_words:
            if word in self.abbreviations:
                expanded_terms.append(self.abbreviations[word])

        return expanded_terms

    def _expand_domain_specific(self, query: str, analysis: QueryAnalysis) -> List[str]:
        """
        Expand with domain-specific terms
        """
        expanded_terms = []

        if analysis.domain in self.domain_expansions:
            domain_dict = self.domain_expansions[analysis.domain]
            query_words = query.lower().split()

            for word in query_words:
                if word in domain_dict:
                    # Add 1-2 domain-specific expansions
                    expansions = domain_dict[word][:2]
                    expanded_terms.extend(expansions)

        return expanded_terms

    def _expand_with_context(self, query: str, context: Dict[str, Any]) -> List[str]:
        """
        Expand query with contextual information
        """
        expanded_terms = []

        # Extract terms from conversation history
        if 'conversation_history' in context:
            history = context['conversation_history']
            for message in history[-3:]:  # Last 3 messages
                if message.get('role') == 'user':
                    content = message.get('content', '')
                    # Extract important words from recent messages
                    words = re.findall(r'\b[a-zA-Z]{4,}\b', content.lower())
                    # Add words that might be related
                    for word in words[:3]:  # Limit to 3 words per message
                        if word not in query.lower():
                            expanded_terms.append(word)

        # Extract terms from user profile/preferences
        if 'user_preferences' in context:
            prefs = context['user_preferences']
            if 'interests' in prefs:
                expanded_terms.extend(prefs['interests'][:2])

        return expanded_terms[:5]  # Limit context expansion

    async def _expand_with_llm(self, query: str, analysis: QueryAnalysis) -> List[str]:
        """
        Use LLM to generate query expansions
        """
        if not self.llm_manager:
            return []

        try:
            expansion_prompt = f"""
            Given the search query: "{query}"

            Query analysis:
            - Intent: {analysis.intent}
            - Domain: {analysis.domain}
            - Key terms: {', '.join(analysis.key_terms)}

            Please suggest 3-5 related terms or synonyms that would help improve search results.
            Focus on terms that are semantically related and would help find relevant content.

            Return only the terms, separated by commas, without explanations.

            Related terms:
            """

            response = await self.llm_manager.generate_response(expansion_prompt)

            if response and response.content:
                # Parse the response to extract terms
                terms_text = response.content.strip()
                terms = [term.strip() for term in terms_text.split(',')]
                # Clean and validate terms
                valid_terms = []
                for term in terms:
                    # Remove quotes and clean
                    term = re.sub(r'["\']', '', term).strip()
                    # Only include reasonable terms
                    if len(term) > 2 and len(term) < 30 and term.isalpha():
                        valid_terms.append(term.lower())

                return valid_terms[:5]  # Limit to 5 terms

        except Exception as e:
            logger.warning(f"LLM-based query expansion failed: {e}")

        return []

    def _calculate_confidence_score(
        self,
        original_query: str,
        expanded_terms: List[str],
        methods: List[str]
    ) -> float:
        """
        Calculate confidence score for the expansion
        """
        if not expanded_terms:
            return 1.0

        # Base confidence based on number of expansion methods
        base_confidence = min(0.9, len(methods) * 0.2)

        # Adjust based on expansion ratio
        original_length = len(original_query.split())
        expansion_ratio = len(expanded_terms) / original_length

        # Prefer moderate expansion (not too little, not too much)
        if 0.2 <= expansion_ratio <= 0.8:
            ratio_bonus = 0.1
        else:
            ratio_bonus = 0.0

        # Bonus for using LLM
        llm_bonus = 0.1 if 'llm_based' in methods else 0.0

        confidence = base_confidence + ratio_bonus + llm_bonus
        return min(1.0, confidence)

    def get_expansion_suggestions(self, partial_query: str) -> List[str]:
        """
        Get expansion suggestions for partial queries (autocomplete)
        """
        suggestions: List[str] = []

        if len(partial_query) < 2:
            return suggestions

        partial_lower = partial_query.lower()

        # Check synonyms
        for word, synonyms in self.synonyms.items():
            if word.startswith(partial_lower):
                suggestions.extend([f"{partial_query} {syn}" for syn in synonyms[:2]])

        # Check abbreviations
        for abbr, expansion in self.abbreviations.items():
            if abbr.startswith(partial_lower):
                suggestions.append(f"{partial_query} {expansion}")

        return suggestions[:5]

    async def analyze_query_intent(self, query: str) -> Dict[str, Any]:
        """Analyze query to understand intent and structure"""
        query_lower = query.lower()

        # Detect intent
        detected_intent = 'general'
        for intent, patterns in self.intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, query_lower):
                    detected_intent = intent
                    break
            if detected_intent != 'general':
                break

        # Extract entities (simple approach)
        entities = re.findall(r'\b[A-Z][a-z]+\b', query)

        # Extract key terms
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        words = re.findall(r'\b\w+\b', query_lower)
        key_terms = [word for word in words if len(word) > 2 and word not in stop_words]

        # Determine query type
        if '?' in query:
            query_type = 'question'
        elif any(word in query_lower for word in ['create', 'make', 'build']):
            query_type = 'command'
        else:
            query_type = 'search'

        return {
            'query': query,
            'intent': detected_intent,
            'entities': entities,
            'key_terms': key_terms,
            'query_type': query_type,
            'complexity': 'complex' if len(words) > 10 else 'simple'
        }

    async def generate_query_variations(self, query: str, num_variations: int = 3) -> List[str]:
        """Generate multiple variations of the query"""
        variations = [query]

        # Synonym-based variation
        # Synonym-based variation
        synonyms = self._expand_with_synonyms(query)
        if synonyms:
            variations.append(f"{query} {synonyms[0]}")

        # Abbreviation expansion
        abbrevs = self._expand_abbreviations(query)
        if abbrevs:
            variations.append(f"{query} {' '.join(abbrevs)}")

        # Question form
        if not query.endswith('?'):
            variations.append(f"What is {query}?")

        return list(dict.fromkeys(variations))[:num_variations]

# Global instance
query_expansion_engine = QueryExpansionEngine()
