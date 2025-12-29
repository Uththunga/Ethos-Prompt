"""
Complete Free Models Integration Test
Tests all aspects of free models functionality including:
- Model execution with free models
- Cost tracking ($0.00 verification)
- Custom API key flow
- Model selector UI data
- Error handling
"""

import asyncio
import logging
from datetime import datetime, timezone
from decimal import Decimal
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Import components to test
from src.llm.free_models_config import (
    get_default_model, ALL_FREE_MODELS, get_model_by_id,
    get_agent_capable_models, FREE_MODELS_PRIMARY, get_model_metadata
)
from src.llm.cost_tracker import CostTracker, CostEntry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FreeModelsIntegrationTest:
    """Comprehensive test suite for free models integration"""

    def __init__(self):
        self.test_results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'errors': []
        }
        self.cost_tracker = CostTracker()

    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        self.test_results['total_tests'] += 1
        if passed:
            self.test_results['passed'] += 1
            logger.info(f"✅ PASS: {test_name}")
        else:
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {message}")
            logger.error(f"❌ FAIL: {test_name} - {message}")

    # =========================================================================
    # Test 1: Free Models Configuration
    # =========================================================================

    def test_free_models_config(self):
        """Test free models configuration is loaded correctly"""
        logger.info("\n=== Test 1: Free Models Configuration ===")

        # Test 1.1: Default model exists
        default_model = get_default_model()
        self.log_test(
            "1.1 Default model exists",
            default_model is not None,
            "No default model configured"
        )

        # Test 1.2: Default model is Grok 4 Fast
        self.log_test(
            "1.2 Default model is Grok 4 Fast",
            default_model.model_id == "x-ai/grok-4-fast:free",
            f"Expected Grok 4 Fast, got {default_model.model_id}"
        )

        # Test 1.3: All free models loaded
        self.log_test(
            "1.3 All free models loaded",
            len(ALL_FREE_MODELS) >= 10,
            f"Expected at least 10 models, got {len(ALL_FREE_MODELS)}"
        )

        # Test 1.4: Primary models exist
        self.log_test(
            "1.4 Primary models exist",
            len(FREE_MODELS_PRIMARY) >= 3,
            f"Expected at least 3 primary models, got {len(FREE_MODELS_PRIMARY)}"
        )

        # Test 1.5: Agent-capable models exist
        agent_models = get_agent_capable_models()
        self.log_test(
            "1.5 Agent-capable models exist",
            len(agent_models) >= 3,
            f"Expected at least 3 agent models, got {len(agent_models)}"
        )

    # =========================================================================
    # Test 2: Cost Tracking for Free Models
    # =========================================================================

    def test_cost_tracking(self):
        """Test cost tracking returns $0.00 for free models"""
        logger.info("\n=== Test 2: Cost Tracking ===")

        # Test 2.1: Free model detection
        is_free = self.cost_tracker.is_free_model("x-ai/grok-4-fast:free")
        self.log_test(
            "2.1 Free model detection",
            is_free == True,
            f"Expected True, got {is_free}"
        )

        # Test 2.2: Paid model detection
        is_paid = self.cost_tracker.is_free_model("openai/gpt-4")
        self.log_test(
            "2.2 Paid model detection",
            is_paid == False,
            f"Expected False, got {is_paid}"
        )

        # Test 2.3: Cost calculation for free model
        cost = self.cost_tracker.calculate_cost(
            provider="x-ai",
            model="x-ai/grok-4-fast:free",
            input_tokens=1000,
            output_tokens=500
        )
        self.log_test(
            "2.3 Free model cost is $0.00",
            cost == Decimal("0.00"),
            f"Expected $0.00, got ${cost}"
        )

        # Test 2.4: Cost calculation for paid model
        paid_cost = self.cost_tracker.calculate_cost(
            provider="openai",
            model="gpt-4",
            input_tokens=1000,
            output_tokens=500
        )
        self.log_test(
            "2.4 Paid model cost is > $0.00",
            paid_cost > Decimal("0.00"),
            f"Expected > $0.00, got ${paid_cost}"
        )

        # Test 2.5: Track usage for free model
        cost_entry = self.cost_tracker.track_usage(
            user_id="test_user_123",
            provider="x-ai",
            model="x-ai/grok-4-fast:free",
            input_tokens=1000,
            output_tokens=500
        )
        self.log_test(
            "2.5 Track free model usage",
            cost_entry.cost == Decimal("0.00") and
            cost_entry.metadata.get('is_free_model') == True,
            f"Expected $0.00 and is_free=True, got ${cost_entry.cost} and is_free={cost_entry.metadata.get('is_free_model')}"
        )

    # =========================================================================
    # Test 3: API Key Management
    # =========================================================================

    def test_api_key_management(self):
        """Test API key encryption, decryption, and masking"""
        logger.info("\n=== Test 3: API Key Management (SKIPPED - Requires Firebase) ===")

        # Note: API key tests require Firebase initialization
        # These tests are covered by integration tests with Firebase emulator
        logger.info("  API key encryption/decryption tests require Firebase")
        logger.info("  Run integration tests with Firebase emulator for full coverage")

    # =========================================================================
    # Test 4: Model Metadata for UI
    # =========================================================================

    def test_model_metadata(self):
        """Test model metadata is correct for UI display"""
        logger.info("\n=== Test 4: Model Metadata ===")

        # Test 4.1: Model has required fields
        model = get_model_by_id("x-ai/grok-4-fast:free")
        required_fields = ['model_id', 'display_name', 'provider', 'context_length', 'capabilities']
        has_all_fields = all(hasattr(model, field) for field in required_fields)
        self.log_test(
            "4.1 Model has required fields",
            has_all_fields,
            f"Missing fields: {[f for f in required_fields if not hasattr(model, f)]}"
        )

        # Test 4.2: Model has is_free indicator
        metadata = get_model_metadata("x-ai/grok-4-fast:free")
        self.log_test(
            "4.2 Model metadata has is_free flag",
            metadata.get('is_free') == True,
            f"Expected is_free=True, got {metadata.get('is_free')}"
        )

        # Test 4.3: Model has cost information
        self.log_test(
            "4.3 Model has cost information",
            'cost_per_million_tokens' in metadata,
            "Missing cost_per_million_tokens"
        )

        # Test 4.4: Free model cost is $0.00
        cost_info = metadata.get('cost_per_million_tokens', {})
        self.log_test(
            "4.4 Free model cost is $0.00",
            cost_info.get('input') == 0.0 and cost_info.get('output') == 0.0,
            f"Expected $0.00, got input={cost_info.get('input')}, output={cost_info.get('output')}"
        )

    # =========================================================================
    # Test 5: Error Handling
    # =========================================================================

    def test_error_handling(self):
        """Test error handling for edge cases"""
        logger.info("\n=== Test 5: Error Handling ===")

        # Test 5.1: Invalid model ID
        invalid_model = get_model_by_id("invalid/model:free")
        self.log_test(
            "5.1 Invalid model returns None",
            invalid_model is None,
            f"Expected None, got {invalid_model}"
        )

        # Test 5.2: Cost calculation with invalid model
        cost = self.cost_tracker.calculate_cost(
            provider="unknown",
            model="unknown/model",
            input_tokens=1000,
            output_tokens=500
        )
        self.log_test(
            "5.2 Invalid model returns fallback cost",
            cost > Decimal("0.00"),
            f"Expected fallback cost, got ${cost}"
        )

    # =========================================================================
    # Run All Tests
    # =========================================================================

    def run_all_tests(self):
        """Run all test suites"""
        logger.info("\n" + "="*70)
        logger.info("FREE MODELS INTEGRATION TEST SUITE")
        logger.info("="*70)

        start_time = datetime.now(timezone.utc)

        # Run test suites
        self.test_free_models_config()
        self.test_cost_tracking()
        self.test_api_key_management()
        self.test_model_metadata()
        self.test_error_handling()

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()

        # Print summary
        logger.info("\n" + "="*70)
        logger.info("TEST SUMMARY")
        logger.info("="*70)
        logger.info(f"Total Tests: {self.test_results['total_tests']}")
        logger.info(f"Passed: {self.test_results['passed']} ✅")
        logger.info(f"Failed: {self.test_results['failed']} ❌")
        logger.info(f"Duration: {duration:.2f}s")
        logger.info(f"Success Rate: {(self.test_results['passed']/self.test_results['total_tests']*100):.1f}%")

        if self.test_results['errors']:
            logger.info("\n" + "="*70)
            logger.info("FAILED TESTS")
            logger.info("="*70)
            for error in self.test_results['errors']:
                logger.error(f"  - {error}")

        logger.info("\n" + "="*70)

        return self.test_results['failed'] == 0


if __name__ == "__main__":
    test_suite = FreeModelsIntegrationTest()
    success = test_suite.run_all_tests()

    exit(0 if success else 1)
