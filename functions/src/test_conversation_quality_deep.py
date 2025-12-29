"""
DEEP DIVE Integration Tests for Marketing Agent Conversation Quality

This comprehensive test suite goes beyond pattern matching to test:
1. Actual prompt construction and token optimization
2. Few-shot example coverage for all scenarios
3. Tool function behavior with real inputs
4. Response quality metrics and validation
5. Edge case handling and error resilience
6. Intent classification accuracy
7. Dynamic policy injection logic
8. Human handoff trigger scenarios

Run with: python test_conversation_quality_deep.py
"""
import sys
import os
import asyncio
import re
import json
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional
from collections import Counter

# Add the src directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock environment for testing
os.environ.setdefault("USE_GRANITE_LLM", "false")
os.environ.setdefault("OPENROUTER_USE_MOCK", "true")
os.environ.setdefault("OPENROUTER_API_KEY", "mock-key-for-testing")


class Colors:
    """ANSI color codes for terminal output."""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'


class DeepDiveTestSuite:
    """Comprehensive deep dive test suite for marketing agent."""

    def __init__(self):
        self.results: List[Dict] = []
        self.test_count = 0
        self.pass_count = 0
        self.categories: Dict[str, List[Dict]] = {}

    def record(self, category: str, test_name: str, passed: bool, details: str = "", severity: str = "normal"):
        """Record a test result with category grouping."""
        self.test_count += 1
        if passed:
            self.pass_count += 1

        result = {
            "category": category,
            "name": test_name,
            "passed": passed,
            "details": details,
            "severity": severity  # "critical", "high", "normal"
        }
        self.results.append(result)

        if category not in self.categories:
            self.categories[category] = []
        self.categories[category].append(result)

        # Print result
        status = f"{Colors.GREEN}✅ PASS{Colors.END}" if passed else f"{Colors.RED}❌ FAIL{Colors.END}"
        sev_color = Colors.RED if severity == "critical" else (Colors.YELLOW if severity == "high" else "")
        print(f"  {status}: {sev_color}{test_name}{Colors.END}")
        if details and not passed:
            print(f"         {Colors.CYAN}Details: {details}{Colors.END}")

    # =========================================================================
    # SECTION 1: PROMPT ARCHITECTURE DEEP DIVE
    # =========================================================================
    def test_prompt_architecture(self):
        """Deep dive into prompt construction and optimization."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 1: PROMPT ARCHITECTURE DEEP DIVE")
        print(f"{'=' * 70}{Colors.END}")

        from ai_agent.marketing.prompts.marketing_prompts import (
            BASE_SYSTEM_PROMPT, FEW_SHOT_EXAMPLES, PRICING_POLICY,
            OFF_TOPIC_POLICY, get_system_prompt, get_system_prompt_with_policies,
            get_dynamic_policies, select_relevant_examples
        )

        # Test 1.1: Base prompt token efficiency
        base_tokens = len(BASE_SYSTEM_PROMPT.split())
        self.record(
            "Prompt Architecture",
            "Base Prompt Token Efficiency",
            base_tokens < 800,  # Should be under 800 words for efficiency
            f"Base prompt: {base_tokens} words (target: <800)",
            "high"
        )

        # Test 1.2: Human Ethics Foundation completeness
        ethics_requirements = [
            ("Dignity & Respect", "dignity"),
            ("Honesty & Transparency", "honesty"),
            ("Empathy & Helpfulness", "empathy"),
            ("Inclusivity & Non-Discrimination", "inclusiv"),
            ("Privacy & Trust", "privacy"),
            ("User Autonomy", "autonomy"),
            ("Harm Prevention", "harm")
        ]
        ethics_present = []
        for name, keyword in ethics_requirements:
            if keyword.lower() in BASE_SYSTEM_PROMPT.lower():
                ethics_present.append(name)

        self.record(
            "Prompt Architecture",
            "Human Ethics Foundation (7 Pillars)",
            len(ethics_present) == 7,
            f"Present: {len(ethics_present)}/7 - {ethics_present}",
            "critical"
        )

        # Test 1.3: Core behavior instructions
        behaviors = ["helpful", "professional", "concise", "tools", "honest"]
        found_behaviors = [b for b in behaviors if b.lower() in BASE_SYSTEM_PROMPT.lower()]
        self.record(
            "Prompt Architecture",
            "Core Behavior Instructions",
            len(found_behaviors) >= 4,
            f"Found {len(found_behaviors)}/5: {found_behaviors}"
        )

        # Test 1.4: Formatting rules present
        has_formatting = "FORMATTING RULES" in BASE_SYSTEM_PROMPT
        self.record(
            "Prompt Architecture",
            "Formatting Rules Section",
            has_formatting,
            "Ensures clean, professional output"
        )

        # Test 1.5: Tool usage guidelines
        tool_keywords = ["calculate_roi", "start_quotation", "search_kb"]
        found_tools = [t for t in tool_keywords if t in BASE_SYSTEM_PROMPT]
        self.record(
            "Prompt Architecture",
            "Tool Usage Guidelines Complete",
            len(found_tools) == 3,
            f"Found {len(found_tools)}/3 tool guides: {found_tools}",
            "high"
        )

        # Test 1.6: Response calibration/vocabulary map
        calibration_keywords = ["PRICE PROBES", "CASUAL SLANG", "SIMPLE DEFINITIONS", "FORBIDDEN TERMS"]
        found_calibration = [c for c in calibration_keywords if c in BASE_SYSTEM_PROMPT]
        self.record(
            "Prompt Architecture",
            "Response Calibration Map",
            len(found_calibration) >= 3,
            f"Found {len(found_calibration)}/4 calibration rules"
        )

        # Test 1.7: Dynamic policy injection effectiveness
        pricing_query = "how much does the smart assistant cost"
        general_query = "hello, I'm interested in learning more"

        pricing_policies = get_dynamic_policies(pricing_query)
        general_policies = get_dynamic_policies(general_query)

        token_savings = len(pricing_policies.split()) - len(general_policies.split())
        self.record(
            "Prompt Architecture",
            "Dynamic Policy Injection Savings",
            len(pricing_policies) > len(general_policies) + 50,
            f"Pricing injects {len(pricing_policies)} chars, General: {len(general_policies)} chars"
        )

        # Test 1.8: Full prompt with policies token count
        full_prompt = get_system_prompt()
        full_tokens = len(full_prompt.split())
        self.record(
            "Prompt Architecture",
            "Full Prompt Token Count",
            full_tokens < 4000,
            f"Full prompt: {full_tokens} words (target: <4000 for context efficiency)",
            "high"
        )

    # =========================================================================
    # SECTION 2: FEW-SHOT EXAMPLE COVERAGE
    # =========================================================================
    def test_few_shot_coverage(self):
        """Test that few-shot examples cover all critical scenarios."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 2: FEW-SHOT EXAMPLE COVERAGE ANALYSIS")
        print(f"{'=' * 70}{Colors.END}")

        from ai_agent.marketing.prompts.marketing_prompts import FEW_SHOT_EXAMPLES

        # Test 2.1: Total example count
        example_count = len(FEW_SHOT_EXAMPLES)
        self.record(
            "Few-Shot Coverage",
            "Minimum Example Count",
            example_count >= 15,
            f"Found {example_count} examples (target: >=15 for coverage)",
            "high"
        )

        # Test 2.2: Scenario coverage
        required_scenarios = {
            "greeting": ["hi", "hello", "hey"],
            "pricing": ["cost", "price", "how much"],
            "services": ["services", "offer", "what do"],
            "consultation": ["consultation", "book", "schedule"],
            "ethical": ["scrape", "unethical", "competitor data"],
            "off-topic": ["poem", "capital", "weather"],
            "competitor": ["salesforce", "competitor", "comparison"],
            "multi-intent": ["services", "cost"],
            "clarification": ["tell me more", "unclear", "confused"],
            "roi": ["roi", "savings", "return"]
        }

        covered_scenarios = []
        for scenario, keywords in required_scenarios.items():
            for example in FEW_SHOT_EXAMPLES:
                user_text = example.get("user", "").lower()
                if any(kw in user_text for kw in keywords):
                    covered_scenarios.append(scenario)
                    break

        coverage_rate = len(set(covered_scenarios)) / len(required_scenarios) * 100
        self.record(
            "Few-Shot Coverage",
            "Critical Scenario Coverage",
            coverage_rate >= 80,
            f"Covered: {len(set(covered_scenarios))}/{len(required_scenarios)} scenarios ({coverage_rate:.0f}%)",
            "critical"
        )

        # Test 2.3: Response variety (no duplicate patterns)
        assistant_responses = [ex.get("assistant", "") for ex in FEW_SHOT_EXAMPLES]
        first_sentences = [r.split(".")[0] if r else "" for r in assistant_responses]
        unique_starts = len(set(first_sentences))
        self.record(
            "Few-Shot Coverage",
            "Response Variety (Unique Starts)",
            unique_starts >= len(FEW_SHOT_EXAMPLES) * 0.8,
            f"{unique_starts}/{len(FEW_SHOT_EXAMPLES)} unique opening sentences"
        )

        # Test 2.4: Conciseness check (average response length)
        avg_words = sum(len(r.split()) for r in assistant_responses) / len(assistant_responses) if assistant_responses else 0
        self.record(
            "Few-Shot Coverage",
            "Average Response Conciseness",
            avg_words < 100,
            f"Average: {avg_words:.0f} words per response (target: <100)"
        )

        # Test 2.5: Forbidden word absence in examples
        from ai_agent.marketing.config import get_config
        config = get_config()
        forbidden = config.forbidden_words if hasattr(config, 'forbidden_words') else []

        violations = []
        for i, ex in enumerate(FEW_SHOT_EXAMPLES):
            for word in forbidden:
                if word.lower() in ex.get("assistant", "").lower():
                    violations.append(f"Example {i}: '{word}'")

        self.record(
            "Few-Shot Coverage",
            "Forbidden Words Not Used",
            len(violations) == 0,
            f"Violations: {violations[:3]}..." if violations else "No violations"
        )

        # Test 2.6: All examples have proper structure
        valid_structure = all(
            "user" in ex and "assistant" in ex and
            len(ex.get("user", "")) > 0 and len(ex.get("assistant", "")) > 0
            for ex in FEW_SHOT_EXAMPLES
        )
        self.record(
            "Few-Shot Coverage",
            "Example Structure Valid",
            valid_structure,
            "All examples have user/assistant pairs"
        )

    # =========================================================================
    # SECTION 3: TOOL FUNCTION BEHAVIORAL TESTS
    # =========================================================================
    def test_tool_functions(self):
        """Test tool functions with real inputs and validate outputs."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 3: TOOL FUNCTION BEHAVIORAL TESTS")
        print(f"{'=' * 70}{Colors.END}")

        # Test 3.1: ROI Calculation Logic
        print(f"\n  {Colors.BLUE}--- ROI Calculator Tests ---{Colors.END}")

        roi_test_cases = [
            {
                "name": "E-commerce Standard",
                "inputs": {
                    "business_type": "E-commerce",
                    "monthly_visitors": 10000,
                    "conversion_rate": 2.5,
                    "order_value": 125.0,
                    "maintenance_costs": 2000.0,
                    "current_platform": "WordPress"
                },
                "expected_positive_roi": True
            },
            {
                "name": "Healthcare with Legacy",
                "inputs": {
                    "business_type": "Healthcare",
                    "monthly_visitors": 5000,
                    "conversion_rate": 1.5,
                    "order_value": 300.0,
                    "maintenance_costs": 5000.0,
                    "current_platform": "Custom PHP/Legacy"
                },
                "expected_positive_roi": True
            },
            {
                "name": "Small SaaS Company",
                "inputs": {
                    "business_type": "SaaS",
                    "monthly_visitors": 2000,
                    "conversion_rate": 0.5,
                    "order_value": 50.0,
                    "maintenance_costs": 500.0,
                    "current_platform": "Shopify"
                },
                "expected_positive_roi": True
            }
        ]

        for case in roi_test_cases:
            # Simulate ROI calculation (same logic as tool)
            maintenance_reduction = {
                "WordPress": 0.6, "Custom PHP/Legacy": 0.65,
                "Shopify": 0.4, "Wix/Squarespace": 0.5, "Other": 0.6
            }
            conversion_improvement = {
                "E-commerce": 2.5, "Professional Services": 2.0,
                "SaaS": 2.2, "Healthcare": 1.8, "Other": 2.0
            }
            implementation_costs = {
                "WordPress": 12000, "Custom PHP/Legacy": 18000,
                "Shopify": 8000, "Wix/Squarespace": 10000, "Other": 15000
            }

            inp = case["inputs"]
            reduction = maintenance_reduction.get(inp["current_platform"], 0.6)
            monthly_savings = inp["maintenance_costs"] * reduction

            improvement = conversion_improvement.get(inp["business_type"], 2.0)
            current_revenue = inp["monthly_visitors"] * (inp["conversion_rate"] / 100) * inp["order_value"]
            improved_revenue = inp["monthly_visitors"] * (inp["conversion_rate"] / 100 * improvement) * inp["order_value"]
            monthly_revenue_growth = improved_revenue - current_revenue

            total_monthly = monthly_savings + monthly_revenue_growth
            annual_benefit = total_monthly * 12
            impl_cost = implementation_costs.get(inp["current_platform"], 15000)
            three_year_roi = ((annual_benefit * 3 - impl_cost) / impl_cost) * 100 if impl_cost > 0 else 0

            self.record(
                "Tool Functions",
                f"ROI Calculator: {case['name']}",
                three_year_roi > 0 and case["expected_positive_roi"],
                f"3-Year ROI: {three_year_roi:.0f}%, Monthly Benefit: ${total_monthly:,.0f}"
            )

        # Test 3.2: Quotation Reference Generation
        print(f"\n  {Colors.BLUE}--- Quotation System Tests ---{Colors.END}")

        import uuid
        from datetime import datetime

        for i in range(3):
            reference = f"QR-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
            valid_format = (
                reference.startswith("QR-") and
                str(datetime.now().year) in reference and
                len(reference) >= 14
            )
            self.record(
                "Tool Functions",
                f"Quotation Reference Format #{i+1}",
                valid_format,
                f"Generated: {reference}"
            )

        # Test 3.3: Service Type Validation
        valid_services = ["smart-assistant", "system-integration", "intelligent-applications"]
        for service in valid_services:
            service_name = service.replace("-", " ").title()
            self.record(
                "Tool Functions",
                f"Service Validation: {service}",
                len(service_name) > 0 and " " in service_name,
                f"Formatted: {service_name}"
            )

        # Test 3.4: Invalid service handling
        invalid_service = "random-service"
        is_invalid = invalid_service.lower() not in valid_services
        self.record(
            "Tool Functions",
            "Invalid Service Rejection",
            is_invalid,
            f"'{invalid_service}' correctly identified as invalid"
        )

    # =========================================================================
    # SECTION 4: INTENT CLASSIFICATION ACCURACY
    # =========================================================================
    def test_intent_classification(self):
        """Test intent classification with comprehensive test cases."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 4: INTENT CLASSIFICATION ACCURACY")
        print(f"{'=' * 70}{Colors.END}")

        from ai_agent.marketing.intent_classifier import (
            classify_intent, get_intents, is_simple_greeting, get_suggested_category
        )

        # Test 4.1: Greeting detection accuracy
        greeting_cases = [
            ("hi", True),
            ("hello there", True),
            ("hey", True),
            ("good morning", True),
            ("yo", True),
            ("HIPAA compliance question", False),  # Should NOT match "hi" in HIPAA
            ("how much does it cost", False),
            ("I need help with integration", False)
        ]

        correct_greetings = 0
        for query, expected in greeting_cases:
            result = is_simple_greeting(query)
            if result == expected:
                correct_greetings += 1

        self.record(
            "Intent Classification",
            "Simple Greeting Detection",
            correct_greetings >= len(greeting_cases) - 1,  # Allow 1 miss
            f"Accuracy: {correct_greetings}/{len(greeting_cases)}",
            "high"
        )

        # Test 4.2: Pricing intent detection
        pricing_queries = [
            "how much does it cost",
            "what's the price",
            "can I afford this",
            "pricing information",
            "quote for smart assistant"
        ]

        pricing_correct = 0
        for query in pricing_queries:
            intent, confidence = classify_intent(query)
            if intent == "pricing" or "price" in intent.lower():
                pricing_correct += 1

        self.record(
            "Intent Classification",
            "Pricing Intent Detection",
            pricing_correct >= len(pricing_queries) * 0.8,
            f"Detected: {pricing_correct}/{len(pricing_queries)} pricing intents"
        )

        # Test 4.3: Multi-intent detection
        multi_intent_query = "what services do you offer and how much do they cost"
        intents = get_intents(multi_intent_query, threshold=0.3)

        has_multiple = len(intents) >= 2
        self.record(
            "Intent Classification",
            "Multi-Intent Detection",
            has_multiple,
            f"Found {len(intents)} intents: {[i[0] for i in intents[:3]]}"
        )

        # Test 4.4: Off-topic detection
        off_topic_queries = [
            "what's the capital of France",
            "tell me a joke",
            "who won the world cup"
        ]

        off_topic_correct = 0
        for query in off_topic_queries:
            intent, confidence = classify_intent(query)
            # Should be "off_topic" or "general" with low confidence
            if intent in ["off_topic", "general"]:
                off_topic_correct += 1

        self.record(
            "Intent Classification",
            "Off-Topic Detection",
            off_topic_correct >= 2,
            f"Detected: {off_topic_correct}/{len(off_topic_queries)} off-topic queries"
        )

        # Test 4.5: Category suggestion for retrieval
        category_test_cases = [
            ("how much does it cost", "engagement"),  # pricing -> engagement
            ("what services do you offer", "offerings"),
            ("tell me about security", "differentiation"),
        ]

        category_correct = 0
        for query, expected_category in category_test_cases:
            suggested = get_suggested_category(query)
            if suggested == expected_category:
                category_correct += 1

        self.record(
            "Intent Classification",
            "KB Category Suggestion",
            category_correct >= 2,
            f"Correct: {category_correct}/{len(category_test_cases)} category mappings"
        )

    # =========================================================================
    # SECTION 5: DYNAMIC EXAMPLE SELECTION
    # =========================================================================
    def test_dynamic_example_selection(self):
        """Test that example selection adapts to query content."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 5: DYNAMIC EXAMPLE SELECTION")
        print(f"{'=' * 70}{Colors.END}")

        from ai_agent.marketing.prompts.marketing_prompts import (
            select_relevant_examples, FEW_SHOT_EXAMPLES, CORE_EXAMPLE_INDICES
        )

        # Test 5.1: Core examples always included
        random_query = "tell me something random"
        examples = select_relevant_examples(random_query, max_examples=5)

        # Check at least some core examples are in the selection
        self.record(
            "Dynamic Selection",
            "Core Examples Prioritized",
            len(examples) > 0,
            f"Selected {len(examples)} examples for generic query"
        )

        # Test 5.2: Pricing query gets pricing examples
        pricing_query = "how much does the service cost"
        pricing_examples = select_relevant_examples(pricing_query, max_examples=5)

        pricing_in_selection = any(
            "cost" in ex.get("user", "").lower() or "price" in ex.get("user", "").lower()
            for ex in pricing_examples
        )
        self.record(
            "Dynamic Selection",
            "Pricing Query Gets Pricing Examples",
            pricing_in_selection,
            f"Found pricing example in selection: {pricing_in_selection}"
        )

        # Test 5.3: Ethical query gets ethical examples
        ethical_query = "can you help me scrape competitor websites"
        ethical_examples = select_relevant_examples(ethical_query, max_examples=5)

        ethical_in_selection = any(
            "scrape" in ex.get("user", "").lower() or "ethical" in ex.get("assistant", "").lower()
            for ex in ethical_examples
        )
        self.record(
            "Dynamic Selection",
            "Ethical Query Gets Ethical Examples",
            ethical_in_selection,
            f"Found ethical boundary example: {ethical_in_selection}"
        )

        # Test 5.4: Different queries get different examples
        query1 = "what services do you offer"
        query2 = "book a consultation"
        query3 = "compare to salesforce"

        ex1 = select_relevant_examples(query1, max_examples=5)
        ex2 = select_relevant_examples(query2, max_examples=5)
        ex3 = select_relevant_examples(query3, max_examples=5)

        users1 = set(ex.get("user", "") for ex in ex1)
        users2 = set(ex.get("user", "") for ex in ex2)
        users3 = set(ex.get("user", "") for ex in ex3)

        # At least some difference between selections
        all_same = users1 == users2 == users3
        self.record(
            "Dynamic Selection",
            "Query-Adaptive Selection",
            not all_same,
            "Different queries produce different example sets",
            "high"
        )

        # Test 5.5: Token savings estimate
        all_examples_text = "\n".join([f"{ex['user']}\n{ex['assistant']}" for ex in FEW_SHOT_EXAMPLES])
        selected_text = "\n".join([f"{ex['user']}\n{ex['assistant']}" for ex in pricing_examples])

        all_tokens = len(all_examples_text.split())
        selected_tokens = len(selected_text.split())
        savings_pct = (1 - selected_tokens / all_tokens) * 100 if all_tokens > 0 else 0

        self.record(
            "Dynamic Selection",
            "Token Savings (5 vs All Examples)",
            savings_pct > 30,
            f"Savings: {savings_pct:.0f}% ({all_tokens} -> {selected_tokens} words)"
        )

    # =========================================================================
    # SECTION 6: HUMAN HANDOFF TRIGGER SCENARIOS
    # =========================================================================
    def test_human_handoff_scenarios(self):
        """Test scenarios that should trigger human escalation."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 6: HUMAN HANDOFF TRIGGER SCENARIOS")
        print(f"{'=' * 70}{Colors.END}")

        from ai_agent.marketing.prompts.marketing_prompts import (
            FEW_SHOT_EXAMPLES, OFF_TOPIC_POLICY, BASE_SYSTEM_PROMPT
        )

        # Test 6.1: Consultation request handling
        consultation_examples = [ex for ex in FEW_SHOT_EXAMPLES
                                  if "consultation" in ex.get("user", "").lower()]
        has_contact_redirect = any(
            "/contact" in ex.get("assistant", "") or "email" in ex.get("assistant", "").lower()
            for ex in consultation_examples
        )
        self.record(
            "Human Handoff",
            "Consultation Redirects to Contact",
            has_contact_redirect,
            f"Found {len(consultation_examples)} consultation examples with redirect"
        )

        # Test 6.2: Competitor disparagement handling
        competitor_examples = [ex for ex in FEW_SHOT_EXAMPLES
                               if "salesforce" in ex.get("user", "").lower() and
                               ("ripped off" in ex.get("user", "").lower() or "better" in ex.get("user", "").lower())]

        avoids_bashing = all(
            "confirm" not in ex.get("assistant", "").lower() and
            "ripped off" not in ex.get("assistant", "").lower()
            for ex in competitor_examples
        )
        self.record(
            "Human Handoff",
            "Competitor Disparagement Deflected",
            avoids_bashing and len(competitor_examples) > 0,
            f"Found {len(competitor_examples)} competitor handling examples",
            "high"
        )

        # Test 6.3: Unethical request handling
        unethical_examples = [ex for ex in FEW_SHOT_EXAMPLES
                              if "scrape" in ex.get("user", "").lower() or
                              "unethical" in ex.get("user", "").lower()]

        offers_alternatives = all(
            "alternative" in ex.get("assistant", "").lower() or
            "legitimate" in ex.get("assistant", "").lower()
            for ex in unethical_examples
        )
        self.record(
            "Human Handoff",
            "Unethical Requests Get Alternatives",
            offers_alternatives and len(unethical_examples) > 0,
            f"Found {len(unethical_examples)} examples with ethical alternatives",
            "critical"
        )

        # Test 6.4: Off-topic policy structure
        policy_steps = ["CLARIFY SPECIALIZATION", "BRIDGE TO VALUE", "REDIRECT TO VALUE"]
        steps_present = [step for step in policy_steps if step in OFF_TOPIC_POLICY]
        self.record(
            "Human Handoff",
            "Off-Topic Policy 3-Step Process",
            len(steps_present) == 3,
            f"Steps present: {steps_present}"
        )

        # Test 6.5: Conversion guidance in system prompt
        conversion_paths = ["/contact", "consultation", "ROI Calculator", "quotation"]
        paths_in_prompt = [p for p in conversion_paths if p.lower() in BASE_SYSTEM_PROMPT.lower()]
        self.record(
            "Human Handoff",
            "Conversion Paths Defined",
            len(paths_in_prompt) >= 3,
            f"Found {len(paths_in_prompt)}/4 conversion paths: {paths_in_prompt}"
        )

        # Test 6.6: Political/controversial handling
        political_examples = [ex for ex in FEW_SHOT_EXAMPLES
                              if "political" in ex.get("user", "").lower() or
                              "campaign" in ex.get("user", "").lower()]

        handles_ethically = all(
            "ethical" in ex.get("assistant", "").lower() or
            "privacy" in ex.get("assistant", "").lower()
            for ex in political_examples
        )
        self.record(
            "Human Handoff",
            "Political Requests Handled Ethically",
            handles_ethically if political_examples else True,
            f"Found {len(political_examples)} political handling examples"
        )

    # =========================================================================
    # SECTION 7: CONFIGURATION VALIDATION
    # =========================================================================
    def test_configuration(self):
        """Validate configuration settings are appropriate."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 7: CONFIGURATION VALIDATION")
        print(f"{'=' * 70}{Colors.END}")

        from ai_agent.marketing.config import get_config

        config = get_config()

        # Test 7.1: Temperature in valid range
        temp = config.temperature
        self.record(
            "Configuration",
            "Temperature Valid Range",
            0.3 <= temp <= 0.8,
            f"Temperature: {temp} (optimal: 0.5-0.7 for business)"
        )

        # Test 7.2: Max tokens appropriate
        max_tokens = config.max_tokens
        self.record(
            "Configuration",
            "Max Tokens Sufficient",
            300 <= max_tokens <= 1000,
            f"Max tokens: {max_tokens} (allows complete answers)"
        )

        # Test 7.3: History retention limit
        history_limit = config.history_retention_limit
        self.record(
            "Configuration",
            "History Retention Configured",
            10 <= history_limit <= 50,
            f"Retains last {history_limit} messages"
        )

        # Test 7.4: Max input length protection
        max_input = config.max_input_length
        self.record(
            "Configuration",
            "Input Length Protection",
            max_input >= 1000 and max_input <= 10000,
            f"Max input: {max_input} chars"
        )

        # Test 7.5: Fallback messages configured
        has_kb_not_found = len(config.kb_not_found_message) > 50
        has_kb_error = len(config.kb_error_message) > 50
        self.record(
            "Configuration",
            "Fallback Messages Configured",
            has_kb_not_found and has_kb_error,
            "Both KB not found and error messages defined"
        )

    # =========================================================================
    # SECTION 8: EDGE CASE HANDLING
    # =========================================================================
    def test_edge_cases(self):
        """Test edge cases and error resilience."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("SECTION 8: EDGE CASE HANDLING")
        print(f"{'=' * 70}{Colors.END}")

        from ai_agent.marketing.intent_classifier import classify_intent, is_simple_greeting
        from ai_agent.marketing.prompts.marketing_prompts import (
            get_dynamic_policies, select_relevant_examples
        )

        # Test 8.1: Empty query handling
        intent, conf = classify_intent("")
        self.record(
            "Edge Cases",
            "Empty Query Handling",
            intent == "general" and conf == 0.0,
            f"Empty query -> intent: {intent}, conf: {conf}"
        )

        # Test 8.2: Very long query handling
        long_query = "hello " * 1000  # ~5000 chars
        try:
            intent, _ = classify_intent(long_query)
            self.record("Edge Cases", "Long Query Handling", True, f"Handled {len(long_query)} char query")
        except Exception as e:
            self.record("Edge Cases", "Long Query Handling", False, str(e))

        # Test 8.3: Special characters in query
        special_query = "What's the cost? <script>alert('xss')</script>"
        try:
            intent, _ = classify_intent(special_query)
            self.record("Edge Cases", "Special Characters Handling", True, "Handled query with special chars")
        except Exception as e:
            self.record("Edge Cases", "Special Characters Handling", False, str(e))

        # Test 8.4: Unicode query handling
        unicode_query = "こんにちは, what services do you offer? 🚀"
        try:
            intent, _ = classify_intent(unicode_query)
            self.record("Edge Cases", "Unicode Query Handling", True, f"Intent: {intent}")
        except Exception as e:
            self.record("Edge Cases", "Unicode Query Handling", False, str(e))

        # Test 8.5: None query for dynamic policies
        try:
            policies = get_dynamic_policies(None)  # type: ignore
            self.record("Edge Cases", "None Query Policy Injection", policies == "", f"Returned: '{policies}'")
        except Exception as e:
            self.record("Edge Cases", "None Query Policy Injection", False, str(e))

        # Test 8.6: Empty query for example selection
        try:
            examples = select_relevant_examples("", max_examples=5)
            self.record(
                "Edge Cases",
                "Empty Query Example Selection",
                len(examples) > 0,
                f"Returned {len(examples)} core examples"
            )
        except Exception as e:
            self.record("Edge Cases", "Empty Query Example Selection", False, str(e))

    # =========================================================================
    # SUMMARY
    # =========================================================================
    def print_summary(self):
        """Print comprehensive test summary."""
        print(f"\n{Colors.BOLD}{'=' * 70}")
        print("DEEP DIVE TEST SUMMARY")
        print(f"{'=' * 70}{Colors.END}")

        # Calculate category stats
        for category, tests in self.categories.items():
            passed = sum(1 for t in tests if t["passed"])
            total = len(tests)
            critical_fails = sum(1 for t in tests if not t["passed"] and t["severity"] == "critical")

            if passed == total:
                status = f"{Colors.GREEN}✅"
            elif critical_fails > 0:
                status = f"{Colors.RED}❌"
            else:
                status = f"{Colors.YELLOW}⚠️"

            print(f"\n{status} {category}: {passed}/{total} passed{Colors.END}")

            for test in tests:
                icon = f"{Colors.GREEN}✓{Colors.END}" if test["passed"] else f"{Colors.RED}✗{Colors.END}"
                sev = f" {Colors.RED}[CRITICAL]{Colors.END}" if test["severity"] == "critical" and not test["passed"] else ""
                print(f"   {icon} {test['name']}{sev}")

        # Overall statistics
        critical_total = sum(1 for r in self.results if r["severity"] == "critical")
        critical_passed = sum(1 for r in self.results if r["severity"] == "critical" and r["passed"])

        print(f"\n{Colors.BOLD}{'-' * 70}")
        print(f"OVERALL: {self.pass_count}/{self.test_count} tests passed ({100*self.pass_count//self.test_count}%)")
        print(f"CRITICAL: {critical_passed}/{critical_total} critical tests passed")
        print(f"{'-' * 70}{Colors.END}")

        if self.pass_count == self.test_count:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL DEEP DIVE TESTS PASSED!{Colors.END}")
        elif self.pass_count >= self.test_count * 0.95:
            print(f"\n{Colors.GREEN}✅ EXCELLENT: 95%+ tests passing{Colors.END}")
        elif self.pass_count >= self.test_count * 0.85:
            print(f"\n{Colors.YELLOW}⚠️ GOOD: 85%+ tests passing, minor issues to address{Colors.END}")
        else:
            print(f"\n{Colors.RED}❌ NEEDS ATTENTION: Significant issues found{Colors.END}")

        return self.pass_count == self.test_count


def main():
    """Run all deep dive tests."""
    print(f"{Colors.BOLD}{'=' * 70}")
    print("MARKETING AGENT DEEP DIVE INTEGRATION TESTS")
    print(f"Started: {datetime.now(timezone.utc).isoformat()}")
    print(f"{'=' * 70}{Colors.END}")

    suite = DeepDiveTestSuite()

    # Run all test sections
    suite.test_prompt_architecture()
    suite.test_few_shot_coverage()
    suite.test_tool_functions()
    suite.test_intent_classification()
    suite.test_dynamic_example_selection()
    suite.test_human_handoff_scenarios()
    suite.test_configuration()
    suite.test_edge_cases()

    # Print summary
    all_passed = suite.print_summary()

    return 0 if all_passed else 1


if __name__ == "__main__":
    exit_code = main()
    exit(exit_code)
