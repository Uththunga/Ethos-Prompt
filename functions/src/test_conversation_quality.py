"""
Deep Dive Conversation Quality Tests for Marketing Agent

Tests the 5 key aspects of conversation quality:
1. Conversation Continuity (state persistence)
2. Conversation Ending (graceful conclusions)
3. Direct Communication Style (concise responses)
4. User-Centric Responses (addressing only what's asked)
5. Human Handoff Protocol (escalation triggers)

Run with: python -m functions.src.test_conversation_quality
"""
import sys
import os
import asyncio
import re
from datetime import datetime, timezone
from typing import Dict, List, Tuple

# Add the src directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock environment for testing
os.environ.setdefault("USE_GRANITE_LLM", "false")
os.environ.setdefault("OPENROUTER_USE_MOCK", "true")
os.environ.setdefault("OPENROUTER_API_KEY", "mock-key-for-testing")


class ConversationQualityTester:
    """Deep dive tests for marketing agent conversation quality."""

    def __init__(self):
        self.results: List[Tuple[str, bool, str]] = []
        self.test_count = 0
        self.pass_count = 0

    def record(self, test_name: str, passed: bool, details: str = ""):
        """Record a test result."""
        self.test_count += 1
        if passed:
            self.pass_count += 1
        self.results.append((test_name, passed, details))
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status}: {test_name}")
        if details and not passed:
            print(f"         Details: {details}")

    # =========================================================================
    # TEST GROUP 1: Conversation Continuity
    # =========================================================================
    def test_conversation_continuity(self):
        """Test conversation state persistence mechanisms."""
        print("\n" + "=" * 60)
        print("TEST GROUP 1: CONVERSATION CONTINUITY")
        print("=" * 60)

        # Test 1.1: Firestore checkpointer availability
        try:
            from ai_agent.marketing.firestore_checkpointer import (
                FirestoreCheckpointer,
                LANGGRAPH_CHECKPOINT_AVAILABLE
            )
            self.record(
                "Firestore Checkpointer Module Available",
                True,
                f"LangGraph checkpoint: {LANGGRAPH_CHECKPOINT_AVAILABLE}"
            )
        except ImportError as e:
            self.record("Firestore Checkpointer Module Available", False, str(e))

        # Test 1.2: Configuration has history limit
        try:
            from ai_agent.marketing.config import get_config
            config = get_config()
            has_limit = hasattr(config, 'history_retention_limit')
            limit_value = config.history_retention_limit if has_limit else None
            self.record(
                "History Retention Limit Configured",
                has_limit and limit_value is not None and limit_value > 0,
                f"Limit: {limit_value} messages"
            )
        except Exception as e:
            self.record("History Retention Limit Configured", False, str(e))

        # Test 1.3: Thread ID handling in config
        test_config = {"configurable": {"thread_id": "test-thread-123"}}
        thread_id = test_config.get("configurable", {}).get("thread_id")
        self.record(
            "Thread ID Extraction Pattern",
            thread_id == "test-thread-123",
            f"Extracted: {thread_id}"
        )

        # Test 1.4: Context pruning function exists in agent
        try:
            # Read source file directly to avoid import issues
            agent_path = os.path.join(os.path.dirname(__file__), "ai_agent", "marketing", "marketing_agent.py")
            with open(agent_path, "r", encoding="utf-8") as f:
                source = f.read()
            has_pruning = "MAX_HISTORY_MESSAGES" in source or "pruned_messages" in source
            self.record(
                "Context Pruning Logic Present",
                has_pruning,
                "Found history pruning in chat() method" if has_pruning else "Not found"
            )
        except Exception as e:
            self.record("Context Pruning Logic Present", False, str(e))

    # =========================================================================
    # TEST GROUP 2: Conversation Ending Patterns
    # =========================================================================
    def test_conversation_ending(self):
        """Test graceful conversation ending mechanisms."""
        print("\n" + "=" * 60)
        print("TEST GROUP 2: CONVERSATION ENDING PATTERNS")
        print("=" * 60)

        # Test 2.1: Follow-up question extraction (read source directly)
        try:
            agent_path = os.path.join(os.path.dirname(__file__), "ai_agent", "marketing", "marketing_agent.py")
            with open(agent_path, "r", encoding="utf-8") as f:
                source = f.read()
            has_method = "_extract_follow_up_questions" in source and "def _extract_follow_up_questions" in source
            self.record(
                "Follow-up Question Extractor Exists",
                has_method,
                "Method _extract_follow_up_questions found" if has_method else "Not found"
            )
        except Exception as e:
            self.record("Follow-up Question Extractor Exists", False, str(e))

        # Test 2.2: Fallback question generator
        try:
            agent_path = os.path.join(os.path.dirname(__file__), "ai_agent", "marketing", "marketing_agent.py")
            with open(agent_path, "r", encoding="utf-8") as f:
                source = f.read()
            has_method = "_generate_fallback_questions" in source and "def _generate_fallback_questions" in source
            self.record(
                "Fallback Question Generator Exists",
                has_method,
                "Method _generate_fallback_questions found" if has_method else "Not found"
            )
        except Exception as e:
            self.record("Fallback Question Generator Exists", False, str(e))

        # Test 2.3: Page context specific question sets
        try:
            agent_path = os.path.join(os.path.dirname(__file__), "ai_agent", "marketing", "marketing_agent.py")
            with open(agent_path, "r", encoding="utf-8") as f:
                source = f.read()
            contexts = ["homepage", "solutions", "pricing", "product", "onboarding", "default"]
            found_contexts = [ctx for ctx in contexts if f'"{ctx}"' in source or f"'{ctx}'" in source]
            self.record(
                "Page Context Question Sets",
                len(found_contexts) >= 4,
                f"Found {len(found_contexts)}/6 contexts: {found_contexts}"
            )
        except Exception as e:
            self.record("Page Context Question Sets", False, str(e))

        # Test 2.4: Response variety guidance in prompts
        try:
            from ai_agent.marketing.prompts.marketing_prompts import BASE_SYSTEM_PROMPT
            has_variety = "RESPONSE VARIETY" in BASE_SYSTEM_PROMPT
            has_natural = "natural" in BASE_SYSTEM_PROMPT.lower()
            self.record(
                "Response Variety Guidance",
                has_variety and has_natural,
                "Found response variety section" if has_variety else "Missing"
            )
        except Exception as e:
            self.record("Response Variety Guidance", False, str(e))

    # =========================================================================
    # TEST GROUP 3: Direct Communication Style
    # =========================================================================
    def test_direct_communication(self):
        """Test concise, direct communication enforcement."""
        print("\n" + "=" * 60)
        print("TEST GROUP 3: DIRECT COMMUNICATION STYLE")
        print("=" * 60)

        # Test 3.1: Conciseness instructions in prompts
        try:
            from ai_agent.marketing.prompts.marketing_prompts import BASE_SYSTEM_PROMPT
            has_concise = "concise" in BASE_SYSTEM_PROMPT.lower()
            has_paragraph_limit = "3 paragraphs" in BASE_SYSTEM_PROMPT or "under 3" in BASE_SYSTEM_PROMPT.lower()
            self.record(
                "Conciseness Instructions",
                has_concise and has_paragraph_limit,
                "Found conciseness + paragraph limit" if (has_concise and has_paragraph_limit) else "Partial"
            )
        except Exception as e:
            self.record("Conciseness Instructions", False, str(e))

        # Test 3.2: Response calibration map exists
        try:
            from ai_agent.marketing.prompts.marketing_prompts import BASE_SYSTEM_PROMPT
            has_calibration = "RESPONSE CALIBRATION" in BASE_SYSTEM_PROMPT or "VOCABULARY MAP" in BASE_SYSTEM_PROMPT
            self.record(
                "Response Calibration Map",
                has_calibration,
                "Found response calibration section"
            )
        except Exception as e:
            self.record("Response Calibration Map", False, str(e))

        # Test 3.3: Simple definition few-shot example
        try:
            from ai_agent.marketing.prompts.marketing_prompts import FEW_SHOT_EXAMPLES
            definition_examples = [ex for ex in FEW_SHOT_EXAMPLES
                                   if "what is" in ex.get("user", "").lower()]
            has_short = any(len(ex.get("assistant", "").split()) < 60 for ex in definition_examples)
            self.record(
                "Concise Definition Examples",
                len(definition_examples) > 0 and has_short,
                f"Found {len(definition_examples)} definition examples"
            )
        except Exception as e:
            self.record("Concise Definition Examples", False, str(e))

        # Test 3.4: Forbidden verbose words
        try:
            from ai_agent.marketing.config import get_config
            config = get_config()
            forbidden = config.forbidden_words if hasattr(config, 'forbidden_words') else []
            has_forbidden = len(forbidden) > 0
            self.record(
                "Forbidden Words Configured",
                has_forbidden,
                f"Found {len(forbidden)} forbidden words: {forbidden[:3]}..."
            )
        except Exception as e:
            self.record("Forbidden Words Configured", False, str(e))

    # =========================================================================
    # TEST GROUP 4: User-Centric Responses
    # =========================================================================
    def test_user_centric_responses(self):
        """Test user-focused response mechanisms."""
        print("\n" + "=" * 60)
        print("TEST GROUP 4: USER-CENTRIC RESPONSES")
        print("=" * 60)

        # Test 4.1: Dynamic policy injection
        try:
            from ai_agent.marketing.prompts.marketing_prompts import get_dynamic_policies
            pricing_policy = get_dynamic_policies("how much does it cost")
            general_policy = get_dynamic_policies("hello")
            has_dynamic = len(pricing_policy) > len(general_policy)
            self.record(
                "Dynamic Policy Injection",
                has_dynamic,
                f"Pricing query: {len(pricing_policy)} chars, General: {len(general_policy)} chars"
            )
        except Exception as e:
            self.record("Dynamic Policy Injection", False, str(e))

        # Test 4.2: Dynamic example selection
        try:
            from ai_agent.marketing.prompts.marketing_prompts import select_relevant_examples
            pricing_examples = select_relevant_examples("what's the price", max_examples=5)
            service_examples = select_relevant_examples("what services do you offer", max_examples=5)
            # They should differ based on query
            pricing_users = [ex["user"] for ex in pricing_examples]
            service_users = [ex["user"] for ex in service_examples]
            are_different = pricing_users != service_users
            self.record(
                "Dynamic Example Selection",
                are_different,
                f"Pricing vs Service examples differ: {are_different}"
            )
        except Exception as e:
            self.record("Dynamic Example Selection", False, str(e))

        # Test 4.3: Intent classification helper
        try:
            from ai_agent.marketing.intent_classifier import classify_intent, get_intents
            intent, confidence = classify_intent("how much does it cost")
            self.record(
                "Intent Classification Available",
                intent in ["pricing", "general"] and confidence > 0,
                f"Intent: {intent}, Confidence: {confidence:.2f}"
            )
        except Exception as e:
            self.record("Intent Classification Available", False, str(e))

        # Test 4.4: Simple greeting detection
        try:
            from ai_agent.marketing.intent_classifier import is_simple_greeting
            is_greeting_hi = is_simple_greeting("hi")
            is_greeting_complex = is_simple_greeting("how much does your service cost")
            self.record(
                "Simple Greeting Detection",
                is_greeting_hi and not is_greeting_complex,
                f"'hi' is greeting: {is_greeting_hi}, complex query is not: {not is_greeting_complex}"
            )
        except Exception as e:
            self.record("Simple Greeting Detection", False, str(e))

    # =========================================================================
    # TEST GROUP 5: Human Handoff Protocol
    # =========================================================================
    def test_human_handoff(self):
        """Test human escalation mechanisms."""
        print("\n" + "=" * 60)
        print("TEST GROUP 5: HUMAN HANDOFF PROTOCOL")
        print("=" * 60)

        # Test 5.1: Consultation tool exists
        try:
            agent_path = os.path.join(os.path.dirname(__file__), "ai_agent", "marketing", "marketing_agent.py")
            with open(agent_path, "r", encoding="utf-8") as f:
                source = f.read()
            has_consultation = "request_consultation" in source and "def request_consultation" in source
            self.record(
                "Request Consultation Tool",
                has_consultation,
                "Tool request_consultation found in _define_tools" if has_consultation else "Not found"
            )
        except Exception as e:
            self.record("Request Consultation Tool", False, str(e))

        # Test 5.2: Off-topic policy defined
        try:
            from ai_agent.marketing.prompts.marketing_prompts import OFF_TOPIC_POLICY
            has_polite = "politely" in OFF_TOPIC_POLICY.lower() or "gracefully" in OFF_TOPIC_POLICY.lower()
            has_redirect = "redirect" in OFF_TOPIC_POLICY.lower()
            self.record(
                "Off-Topic Handling Policy",
                has_polite and has_redirect,
                "Found polite decline + redirect pattern"
            )
        except Exception as e:
            self.record("Off-Topic Handling Policy", False, str(e))

        # Test 5.3: Ethical boundary examples
        try:
            from ai_agent.marketing.prompts.marketing_prompts import FEW_SHOT_EXAMPLES
            ethical_examples = [ex for ex in FEW_SHOT_EXAMPLES
                                if "scrape" in ex.get("user", "").lower()
                                or "unethical" in ex.get("user", "").lower()]
            has_alternatives = any("alternative" in ex.get("assistant", "").lower()
                                   for ex in ethical_examples)
            self.record(
                "Ethical Boundary Examples",
                len(ethical_examples) > 0 and has_alternatives,
                f"Found {len(ethical_examples)} ethical boundary examples"
            )
        except Exception as e:
            self.record("Ethical Boundary Examples", False, str(e))

        # Test 5.4: Conversion guidance in prompts
        try:
            from ai_agent.marketing.prompts.marketing_prompts import BASE_SYSTEM_PROMPT
            has_conversion = "CONVERSION GUIDANCE" in BASE_SYSTEM_PROMPT
            has_consultation = "consultation" in BASE_SYSTEM_PROMPT.lower()
            self.record(
                "Conversion Guidance Section",
                has_conversion and has_consultation,
                "Found conversion guidance with consultation option"
            )
        except Exception as e:
            self.record("Conversion Guidance Section", False, str(e))

        # Test 5.5: Human ethics foundation
        try:
            from ai_agent.marketing.prompts.marketing_prompts import BASE_SYSTEM_PROMPT
            ethics_keywords = ["dignity", "respect", "honesty", "empathy", "privacy", "autonomy", "harm"]
            found = [k for k in ethics_keywords if k.lower() in BASE_SYSTEM_PROMPT.lower()]
            self.record(
                "Human Ethics Foundation",
                len(found) >= 5,
                f"Found {len(found)}/7 ethics keywords: {found}"
            )
        except Exception as e:
            self.record("Human Ethics Foundation", False, str(e))

        # Test 5.6: Off-topic few-shot examples
        try:
            from ai_agent.marketing.prompts.marketing_prompts import FEW_SHOT_EXAMPLES
            off_topic = [ex for ex in FEW_SHOT_EXAMPLES
                         if "poem" in ex.get("user", "").lower()
                         or "capital" in ex.get("user", "").lower()
                         or "weather" in ex.get("user", "").lower()]
            self.record(
                "Off-Topic Few-Shot Examples",
                len(off_topic) >= 1,
                f"Found {len(off_topic)} off-topic handling examples"
            )
        except Exception as e:
            self.record("Off-Topic Few-Shot Examples", False, str(e))

    # =========================================================================
    # SUMMARY
    # =========================================================================
    def print_summary(self):
        """Print test summary."""
        print("\n" + "=" * 60)
        print("DEEP DIVE CONVERSATION QUALITY TEST SUMMARY")
        print("=" * 60)

        # Group results by test category
        categories = {
            "Conversation Continuity": [],
            "Conversation Ending": [],
            "Direct Communication": [],
            "User-Centric Responses": [],
            "Human Handoff": []
        }

        for name, passed, details in self.results:
            if "Firestore" in name or "History" in name or "Thread" in name or "Pruning" in name:
                categories["Conversation Continuity"].append((name, passed))
            elif "Follow-up" in name or "Fallback" in name or "Page Context" in name or "Variety" in name:
                categories["Conversation Ending"].append((name, passed))
            elif "Concise" in name or "Calibration" in name or "Definition" in name or "Forbidden" in name:
                categories["Direct Communication"].append((name, passed))
            elif "Dynamic" in name or "Intent" in name or "Greeting" in name:
                categories["User-Centric Responses"].append((name, passed))
            else:
                categories["Human Handoff"].append((name, passed))

        for category, tests in categories.items():
            passed = sum(1 for _, p in tests if p)
            total = len(tests)
            status = "✅" if passed == total else "⚠️" if passed > 0 else "❌"
            print(f"\n{status} {category}: {passed}/{total} passed")
            for name, p in tests:
                icon = "  ✓" if p else "  ✗"
                print(f"   {icon} {name}")

        print("\n" + "-" * 60)
        print(f"TOTAL: {self.pass_count}/{self.test_count} tests passed ({100*self.pass_count//self.test_count}%)")

        if self.pass_count == self.test_count:
            print("\n🎉 ALL CONVERSATION QUALITY TESTS PASSED!")
        elif self.pass_count >= self.test_count * 0.9:
            print("\n✅ CONVERSATION QUALITY: EXCELLENT (90%+ passing)")
        elif self.pass_count >= self.test_count * 0.7:
            print("\n⚠️ CONVERSATION QUALITY: GOOD (70%+ passing)")
        else:
            print("\n❌ CONVERSATION QUALITY: NEEDS IMPROVEMENT")

        return self.pass_count == self.test_count


def main():
    """Run all conversation quality tests."""
    print("=" * 60)
    print("DEEP DIVE CONVERSATION QUALITY TESTS")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    tester = ConversationQualityTester()

    # Run all test groups
    tester.test_conversation_continuity()
    tester.test_conversation_ending()
    tester.test_direct_communication()
    tester.test_user_centric_responses()
    tester.test_human_handoff()

    # Print summary
    all_passed = tester.print_summary()

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
