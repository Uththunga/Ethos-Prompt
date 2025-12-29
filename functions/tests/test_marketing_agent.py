"""
Unit Tests for Marketing Agent

Tests core functions without requiring full agent initialization.
"""
import pytest
import sys
import os

# Add the parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestValidateInputMessage:
    """Tests for validate_input_message logic"""

    @pytest.fixture
    def config(self):
        """Create mock config"""
        class MockConfig:
            max_input_length = 5000
        return MockConfig()

    def validate_input_message(self, message, config):
        """Copy of validation logic for isolated testing"""
        if not message or not isinstance(message, str):
            raise ValueError("Message must be a non-empty string")
        message = message.strip()
        if not message:
            raise ValueError("Message cannot be empty or only whitespace")
        if len(message) > config.max_input_length:
            raise ValueError(
                f"Message too long: {len(message)} chars (max: {config.max_input_length})"
            )
        return message

    def test_valid_message(self, config):
        """Test valid message passes validation"""
        result = self.validate_input_message("Hello, I need help with pricing", config)
        assert result == "Hello, I need help with pricing"

    def test_message_with_whitespace(self, config):
        """Test whitespace is trimmed"""
        result = self.validate_input_message("  Hello world  ", config)
        assert result == "Hello world"

    def test_empty_message_raises(self, config):
        """Test empty message raises ValueError"""
        with pytest.raises(ValueError, match="non-empty string"):
            self.validate_input_message("", config)

    def test_whitespace_only_raises(self, config):
        """Test whitespace-only message raises ValueError"""
        with pytest.raises(ValueError, match="empty or only whitespace"):
            self.validate_input_message("   ", config)

    def test_none_message_raises(self, config):
        """Test None message raises ValueError"""
        with pytest.raises(ValueError, match="non-empty string"):
            self.validate_input_message(None, config)

    def test_too_long_message_raises(self, config):
        """Test message exceeding max_input_length raises ValueError"""
        long_message = "x" * 6000
        with pytest.raises(ValueError, match="too long"):
            self.validate_input_message(long_message, config)

    def test_unicode_message(self, config):
        """EDGE-001: Test unicode characters are handled correctly"""
        result = self.validate_input_message("Hello 你好 مرحبا שלום", config)
        assert result == "Hello 你好 مرحبا שלום"

    def test_emoji_message(self, config):
        """EDGE-001: Test emoji characters are handled correctly"""
        result = self.validate_input_message("What's the pricing? 💰🚀", config)
        assert "💰🚀" in result

    def test_mixed_unicode_emoji(self, config):
        """EDGE-001: Test mixed unicode and emoji"""
        message = "Need help with AI助手 🤖 für mein Geschäft"
        result = self.validate_input_message(message, config)
        assert result == message


class TestCleanSources:
    """Tests for _clean_sources method logic"""

    def clean_sources(self, sources):
        """Copy of clean_sources logic for isolated testing"""
        return [
            {k: v for k, v in src.items() if k != "score"}
            for src in sources
        ]

    def test_removes_score_field(self):
        """Test score field is removed from sources"""
        sources = [
            {"title": "Doc 1", "url": "/doc1", "score": 0.95},
            {"title": "Doc 2", "url": "/doc2", "score": 0.88}
        ]
        cleaned = self.clean_sources(sources)
        assert "score" not in cleaned[0]
        assert "score" not in cleaned[1]
        assert cleaned[0]["title"] == "Doc 1"

    def test_handles_empty_sources(self):
        """Test empty sources list is handled"""
        sources = []
        cleaned = self.clean_sources(sources)
        assert cleaned == []

    def test_sources_without_score(self):
        """Test sources without score field are unchanged"""
        sources = [{"title": "Doc 1", "url": "/doc1"}]
        cleaned = self.clean_sources(sources)
        assert cleaned[0] == {"title": "Doc 1", "url": "/doc1"}


class TestExtractFollowUpQuestions:
    """Tests for _extract_follow_up_questions method logic"""

    def extract_follow_up_questions(self, response_text, max_questions=3):
        """Copy of extraction logic for isolated testing"""
        try:
            if "You might also want to know:" in response_text:
                parts = response_text.split("You might also want to know:")
                if len(parts) > 1:
                    questions_section = parts[1].strip()
                    questions = []
                    for line in questions_section.split('\n'):
                        line = line.strip()
                        if line and (line[0].isdigit() or line.startswith('-')):
                            question = line.lstrip('0123456789.-) ').strip()
                            if question:
                                questions.append(question)
                    return questions[:max_questions]
            return []
        except Exception:
            return []

    def test_extracts_numbered_questions(self):
        """Test extraction of numbered follow-up questions"""
        response = """Here is some information.

You might also want to know:
1. What are the pricing plans?
2. How does integration work?
3. What support is available?
"""
        questions = self.extract_follow_up_questions(response)
        assert len(questions) == 3
        assert "What are the pricing plans?" in questions

    def test_no_questions_section(self):
        """Test response without follow-up questions returns empty list"""
        response = "Here is some information about our services."
        questions = self.extract_follow_up_questions(response)
        assert questions == []

    def test_max_three_questions(self):
        """Test max 3 questions are returned"""
        response = """Info here.

You might also want to know:
1. Q1?
2. Q2?
3. Q3?
4. Q4?
5. Q5?
"""
        questions = self.extract_follow_up_questions(response)
        assert len(questions) == 3

    def test_dash_prefixed_questions(self):
        """Test extraction of dash-prefixed questions"""
        response = """Info.

You might also want to know:
- First question?
- Second question?
"""
        questions = self.extract_follow_up_questions(response)
        assert len(questions) == 2


class TestHallucinationCheck:
    """Tests for hallucination detection logic"""

    def calculate_overlap_ratio(self, response, context):
        """Calculate keyword overlap ratio for grounding check"""
        response_words = set(response.lower().split())
        context_words = set(context.lower().split())
        overlap = len(response_words & context_words)
        total = len(response_words)
        return overlap / total if total > 0 else 0

    def test_high_overlap_grounded(self):
        """Test high keyword overlap returns grounded score"""
        response = "EthosPrompt offers AI business solutions with smart assistants."
        context = "EthosPrompt provides AI powered business solutions including smart assistants."
        ratio = self.calculate_overlap_ratio(response, context)
        assert ratio > 0.3  # High overlap indicates grounded

    def test_no_overlap_hallucinated(self):
        """Test no keyword overlap returns low score"""
        response = "We specialize in quantum computing solutions."
        context = "EthosPrompt provides AI assistants for businesses."
        ratio = self.calculate_overlap_ratio(response, context)
        assert ratio < 0.3  # Low overlap indicates possible hallucination

    def test_empty_response(self):
        """Test empty response returns 0"""
        response = ""
        context = "Some context"
        ratio = self.calculate_overlap_ratio(response, context)
        assert ratio == 0


class TestConfig:
    """Tests for MarketingAgentConfig"""

    def test_config_import(self):
        """Test config can be imported"""
        from src.ai_agent.marketing.config import MarketingAgentConfig
        config = MarketingAgentConfig()
        assert config is not None

    def test_default_values(self):
        """Test default config values"""
        from src.ai_agent.marketing.config import MarketingAgentConfig
        config = MarketingAgentConfig()
        assert config.max_input_length > 0
        assert config.grounding_threshold == 0.6

    def test_custom_values(self):
        """Test custom config values"""
        from src.ai_agent.marketing.config import MarketingAgentConfig
        config = MarketingAgentConfig(
            temperature=0.3,
            max_tokens=250,
            grounding_threshold=0.7
        )
        assert config.temperature == 0.3
        assert config.max_tokens == 250
        assert config.grounding_threshold == 0.7


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
