"""
Example: Using Centralized Configuration in Marketing Agent

This demonstrates how to refactor the marketing agent to use
the new Pydantic-based configuration system.
"""

from src.config.marketing_config import get_config, MarketingAgentConfig
from src.common.monitoring import AgentMonitoring

# ============================================================================
# Example 1: Basic Usage
# ============================================================================

def example_basic_usage():
    """Load and use configuration"""
    # Get configuration (singleton)
    config = get_config()

    # Access configuration values
    print(f"Environment: {config.environment}")
    print(f"LLM Provider: {config.llm_provider}")
    print(f"Temperature: {config.temperature}")
    print(f"Max Tokens: {config.max_tokens}")

    # Use helper methods
    llm_config = config.get_llm_config()
    print(f"LLM Config: {llm_config}")

    # Check environment
    if config.is_production():
        print("Running in production mode")
    else:
        print("Running in development mode")


# ============================================================================
# Example 2: Refactored Marketing Agent Initialization
# ============================================================================

class MarketingAgentRefactored:
    """Marketing Agent using centralized configuration"""

    def __init__(self, db=None):
        # Load configuration
        self.config = get_config()
        self.db = db

        # Initialize monitoring
        self.monitoring = AgentMonitoring(
            service="marketing-api",
            environment=self.config.environment
        )

        # Initialize LLM based on config
        self.llm = self._initialize_llm()

        # Initialize retriever with config
        self.retriever = self._initialize_retriever()

    def _initialize_llm(self):
        """Initialize LLM using configuration"""
        llm_config = self.config.get_llm_config()

        if self.config.llm_provider == 'openrouter':
            from langchain_openai import ChatOpenAI

            return ChatOpenAI(
                model=llm_config['model'],
                openai_api_key=llm_config['api_key'],
                openai_api_base="https://openrouter.ai/api/v1",
                temperature=llm_config['temperature'],
                max_tokens=llm_config['max_tokens'],
                streaming=llm_config['streaming']
            )

        else:  # granite
            from llm.watsonx_client import WatsonxGraniteLangChain

            return WatsonxGraniteLangChain(
                model=llm_config['model'],
                api_key=llm_config['api_key'],
                project_id=llm_config['project_id'],
                temperature=llm_config['temperature'],
                max_tokens=llm_config['max_tokens'],
                streaming=llm_config['streaming']
            )

    def _initialize_retriever(self):
        """Initialize retriever using configuration"""
        from src.ai_agent.marketing.marketing_retriever import MarketingRetriever

        retrieval_config = self.config.get_retrieval_config()

        return MarketingRetriever(
            db=self.db,
            top_k=retrieval_config['top_k'],
            use_hybrid=retrieval_config['use_hybrid'],
            semantic_weight=retrieval_config['semantic_weight'],
            bm25_weight=retrieval_config['bm25_weight'],
            use_reranking=retrieval_config['use_reranking']
        )


# ============================================================================
# Example 3: Configuration Validation
# ============================================================================

def example_validation():
    """Demonstrate configuration validation"""
    try:
        # This will fail validation
        invalid_config = MarketingAgentConfig(
            temperature=3.0,  # Invalid: must be <= 2.0
            max_tokens=5000,  # Invalid: must be <= 4000
            retrieval_semantic_weight=0.8,
            retrieval_bm25_weight=0.3  # Invalid: weights don't sum to 1.0
        )
    except Exception as e:
        print(f"Validation error: {e}")

    # Valid configuration
    valid_config = MarketingAgentConfig(
        temperature=0.7,
        max_tokens=800,
        retrieval_semantic_weight=0.7,
        retrieval_bm25_weight=0.3
    )
    valid_config.validate_weights()  # Passes
    print("Configuration is valid!")


# ============================================================================
# Example 4: Environment-Specific Configuration
# ============================================================================

def example_environment_configs():
    """Use environment-specific presets"""
    from src.config.marketing_config import (
        get_development_config,
        get_production_config,
        get_test_config
    )

    # Development
    dev_config = get_development_config()
    print(f"Dev: {dev_config.llm_provider}, temp={dev_config.temperature}")

    # Production
    prod_config = get_production_config()
    print(f"Prod: {prod_config.llm_provider}, temp={prod_config.temperature}")

    # Testing
    test_config = get_test_config()
    print(f"Test: mock_mode={test_config.use_mock_mode}")


# ============================================================================
# Example 5: Dynamic Configuration Updates
# ============================================================================

def example_dynamic_updates():
    """Reload configuration at runtime"""
    from src.config.marketing_config import reload_config
    import os

    # Get initial config
    config = get_config()
    print(f"Initial temperature: {config.temperature}")

    # Update environment variable
    os.environ['MARKETING_AGENT_TEMPERATURE'] = '0.8'

    # Reload configuration
    new_config = reload_config()
    print(f"New temperature: {new_config.temperature}")


# ============================================================================
# Migration Guide
# ============================================================================

"""
MIGRATION STEPS:

1. Update marketing_agent.py:

   # Old way:
   self.temperature = 0.6
   self.max_tokens = 400
   self.api_key = os.getenv("OPENROUTER_API_KEY")

   # New way:
   from src.config.marketing_config import get_config
   self.config = get_config()
   self.temperature = self.config.temperature
   self.max_tokens = self.config.max_tokens
   self.api_key = self.config.get_llm_config()['api_key']

2. Update environment variables:

   # Old:
   OPENROUTER_API_KEY=...
   OPENROUTER_MODEL=...

   # New:
   MARKETING_AGENT_OPENROUTER_API_KEY=...
   MARKETING_AGENT_OPENROUTER_MODEL=...

3. Update tests:

   # Old:
   @pytest.fixture
   def mock_env_vars(monkeypatch):
       monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

   # New:
   @pytest.fixture
   def mock_env_vars(monkeypatch):
       monkeypatch.setenv("MARKETING_AGENT_OPENROUTER_API_KEY", "test-key")

   # Or use test preset:
   from src.config.marketing_config import get_test_config
   config = get_test_config()

4. Benefits:
   - Type safety (Pydantic validation)
   - Centralized configuration
   - Environment-specific presets
   - Easy testing
   - Auto-completion in IDE
   - Clear documentation
"""
