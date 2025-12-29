"""
Intent Classification for Query Understanding
"""
import logging
import re
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)

@dataclass
class IntentFeatures:
    """Features extracted for intent classification"""
    question_words: List[str]
    action_words: List[str]
    entity_types: List[str]
    query_length: int
    has_question_mark: bool
    comparative_indicators: List[str]
    temporal_indicators: List[str]

@dataclass
class IntentPrediction:
    """Intent prediction with confidence and reasoning"""
    intent: str
    confidence: float
    sub_intent: Optional[str]
    features_used: List[str]
    reasoning: str
    alternative_intents: List[Tuple[str, float]]

class IntentClassifier:
    """
    Advanced intent classifier for search queries
    """
    
    def __init__(self):
        """Initialize intent classifier"""
        
        # Question word patterns
        self.question_words = {
            'what': ['factual', 'definition'],
            'how': ['procedural', 'factual'],
            'why': ['factual', 'analytical'],
            'when': ['factual', 'temporal'],
            'where': ['factual', 'location'],
            'who': ['factual', 'entity'],
            'which': ['comparative', 'specific'],
            'whose': ['factual', 'entity']
        }
        
        # Action word patterns
        self.action_words = {
            'compare': 'comparative',
            'analyze': 'analytical',
            'explain': 'factual',
            'describe': 'factual',
            'find': 'exploratory',
            'search': 'exploratory',
            'show': 'specific',
            'list': 'specific',
            'create': 'procedural',
            'generate': 'procedural',
            'build': 'procedural',
            'make': 'procedural',
            'learn': 'educational',
            'understand': 'educational',
            'teach': 'educational'
        }
        
        # Comparative indicators
        self.comparative_indicators = [
            'vs', 'versus', 'compared to', 'better than', 'worse than',
            'best', 'worst', 'difference', 'similar', 'like',
            'pros and cons', 'advantages', 'disadvantages'
        ]
        
        # Temporal indicators
        self.temporal_indicators = [
            'when', 'time', 'date', 'year', 'month', 'day',
            'before', 'after', 'during', 'since', 'until',
            'recent', 'latest', 'current', 'now', 'today'
        ]
        
        # Entity type patterns
        self.entity_patterns = {
            'person': r'\b(who|person|people|individual|someone)\b',
            'organization': r'\b(company|organization|corp|inc|ltd)\b',
            'location': r'\b(where|place|location|city|country|state)\b',
            'technology': r'\b(software|hardware|system|platform|tool)\b',
            'concept': r'\b(concept|idea|theory|principle|method)\b'
        }
        
        # Intent scoring weights
        self.intent_weights = {
            'question_word': 0.3,
            'action_word': 0.25,
            'pattern_match': 0.2,
            'entity_type': 0.1,
            'length_factor': 0.05,
            'structure': 0.1
        }
        
        logger.info("Intent classifier initialized")
    
    def _extract_features(self, query: str) -> IntentFeatures:
        """
        Extract features from query for classification
        
        Args:
            query: Query string
            
        Returns:
            Extracted features
        """
        query_lower = query.lower()
        words = query_lower.split()
        
        # Extract question words
        question_words = [word for word in words if word in self.question_words]
        
        # Extract action words
        action_words = [word for word in words if word in self.action_words]
        
        # Extract entity types
        entity_types = []
        for entity_type, pattern in self.entity_patterns.items():
            if re.search(pattern, query_lower):
                entity_types.append(entity_type)
        
        # Extract comparative indicators
        comparative_indicators = [
            indicator for indicator in self.comparative_indicators
            if indicator in query_lower
        ]
        
        # Extract temporal indicators
        temporal_indicators = [
            indicator for indicator in self.temporal_indicators
            if indicator in query_lower
        ]
        
        return IntentFeatures(
            question_words=question_words,
            action_words=action_words,
            entity_types=entity_types,
            query_length=len(words),
            has_question_mark='?' in query,
            comparative_indicators=comparative_indicators,
            temporal_indicators=temporal_indicators
        )
    
    def _score_intent(self, intent: str, features: IntentFeatures, query: str) -> float:
        """
        Score an intent based on features
        
        Args:
            intent: Intent to score
            features: Extracted features
            query: Original query
            
        Returns:
            Intent score
        """
        score = 0.0
        query_lower = query.lower()
        
        # Question word scoring
        for qword in features.question_words:
            if intent in self.question_words.get(qword, []):
                score += self.intent_weights['question_word']
        
        # Action word scoring
        for aword in features.action_words:
            if self.action_words.get(aword) == intent:
                score += self.intent_weights['action_word']
        
        # Pattern-based scoring
        pattern_score = 0
        
        if intent == 'factual':
            if features.has_question_mark:
                pattern_score += 0.2
            if any(word in query_lower for word in ['what', 'define', 'explain']):
                pattern_score += 0.3
        
        elif intent == 'procedural':
            if 'how to' in query_lower:
                pattern_score += 0.4
            if any(word in query_lower for word in ['steps', 'guide', 'tutorial']):
                pattern_score += 0.2
        
        elif intent == 'comparative':
            if features.comparative_indicators:
                pattern_score += 0.4
            if any(word in query_lower for word in ['best', 'better', 'compare']):
                pattern_score += 0.2
        
        elif intent == 'exploratory':
            if any(word in query_lower for word in ['find', 'search', 'explore']):
                pattern_score += 0.3
            if not features.question_words and not features.has_question_mark:
                pattern_score += 0.1
        
        elif intent == 'specific':
            if any(word in query_lower for word in ['show', 'list', 'give me']):
                pattern_score += 0.3
            if features.entity_types:
                pattern_score += 0.2
        
        elif intent == 'analytical':
            if any(word in query_lower for word in ['analyze', 'examine', 'study']):
                pattern_score += 0.4
            if 'why' in features.question_words:
                pattern_score += 0.2
        
        score += pattern_score * self.intent_weights['pattern_match']
        
        # Entity type scoring
        if features.entity_types:
            score += len(features.entity_types) * self.intent_weights['entity_type']
        
        # Length factor
        if intent == 'specific' and features.query_length <= 3:
            score += self.intent_weights['length_factor']
        elif intent == 'analytical' and features.query_length >= 6:
            score += self.intent_weights['length_factor']
        
        # Structure scoring
        if intent == 'factual' and features.has_question_mark:
            score += self.intent_weights['structure']
        
        return min(1.0, score)  # Cap at 1.0
    
    def classify_intent(self, query: str) -> IntentPrediction:
        """
        Classify query intent with confidence scoring
        
        Args:
            query: Query string
            
        Returns:
            Intent prediction
        """
        # Extract features
        features = self._extract_features(query)
        
        # Define possible intents
        intents = ['factual', 'procedural', 'comparative', 'exploratory', 
                  'specific', 'analytical', 'educational']
        
        # Score all intents
        intent_scores = {}
        for intent in intents:
            score = self._score_intent(intent, features, query)
            intent_scores[intent] = score
        
        # Find best intent
        best_intent = max(intent_scores.items(), key=lambda x: x[1])
        intent_name = best_intent[0]
        confidence = best_intent[1]
        
        # If confidence is too low, default to exploratory
        if confidence < 0.3:
            intent_name = 'exploratory'
            confidence = 0.5
        
        # Determine sub-intent
        sub_intent = self._determine_sub_intent(intent_name, features, query)
        
        # Get alternative intents
        sorted_intents = sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)
        alternative_intents = [(intent, score) for intent, score in sorted_intents[1:3]]
        
        # Determine features used
        features_used = []
        if features.question_words:
            features_used.append(f"question_words: {features.question_words}")
        if features.action_words:
            features_used.append(f"action_words: {features.action_words}")
        if features.comparative_indicators:
            features_used.append("comparative_indicators")
        if features.entity_types:
            features_used.append(f"entity_types: {features.entity_types}")
        
        # Generate reasoning
        reasoning = self._generate_reasoning(intent_name, confidence, features, query)
        
        return IntentPrediction(
            intent=intent_name,
            confidence=confidence,
            sub_intent=sub_intent,
            features_used=features_used,
            reasoning=reasoning,
            alternative_intents=alternative_intents
        )
    
    def _determine_sub_intent(self, intent: str, features: IntentFeatures, query: str) -> Optional[str]:
        """
        Determine sub-intent based on main intent and features
        
        Args:
            intent: Main intent
            features: Extracted features
            query: Original query
            
        Returns:
            Sub-intent if applicable
        """
        query_lower = query.lower()
        
        if intent == 'factual':
            if 'definition' in query_lower or 'define' in query_lower:
                return 'definition'
            elif 'explain' in query_lower:
                return 'explanation'
            elif features.entity_types:
                return 'entity_info'
        
        elif intent == 'procedural':
            if 'tutorial' in query_lower:
                return 'tutorial'
            elif 'guide' in query_lower:
                return 'guide'
            elif 'steps' in query_lower:
                return 'step_by_step'
        
        elif intent == 'comparative':
            if 'best' in query_lower or 'recommend' in query_lower:
                return 'recommendation'
            elif 'difference' in query_lower:
                return 'difference'
            elif 'vs' in query_lower or 'versus' in query_lower:
                return 'comparison'
        
        elif intent == 'exploratory':
            if 'discover' in query_lower:
                return 'discovery'
            elif 'research' in query_lower:
                return 'research'
        
        return None
    
    def _generate_reasoning(self, intent: str, confidence: float, 
                          features: IntentFeatures, query: str) -> str:
        """
        Generate human-readable reasoning for the classification
        
        Args:
            intent: Classified intent
            confidence: Confidence score
            features: Extracted features
            query: Original query
            
        Returns:
            Reasoning string
        """
        reasons = []
        
        if features.question_words:
            reasons.append(f"Contains question words: {', '.join(features.question_words)}")
        
        if features.action_words:
            reasons.append(f"Contains action words: {', '.join(features.action_words)}")
        
        if features.comparative_indicators:
            reasons.append("Contains comparative language")
        
        if features.has_question_mark:
            reasons.append("Has question mark")
        
        if features.entity_types:
            reasons.append(f"References entities: {', '.join(features.entity_types)}")
        
        if not reasons:
            reasons.append("Based on overall query structure and content")
        
        reasoning = f"Classified as '{intent}' (confidence: {confidence:.2f}) because: " + "; ".join(reasons)
        
        return reasoning


# Global instance for use across the application
intent_classifier = IntentClassifier()
