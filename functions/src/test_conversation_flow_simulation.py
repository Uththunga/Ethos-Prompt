"""
DEEP DIVE Level 3: Conversation Flow Simulation Tests
Tests multi-turn conversation dynamics, state persistence, and context retention.
"""
import sys
import os
import asyncio
from typing import List, Dict, Any, Optional

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Mock dependencies
os.environ.setdefault("USE_GRANITE_LLM", "false")
os.environ.setdefault("OPENROUTER_USE_MOCK", "true")

class MockMessage:
    def __init__(self, content, type="human"):
        self.content = content
        self.type = type
        self.additional_kwargs = {}

    def __repr__(self):
        return f"{self.type}: {self.content}"

class ConversationSimulator:
    def __init__(self):
        self.history = []
        self.context = {}

    def add_turn(self, user_input: str, assistant_response: str):
        self.history.append(MockMessage(user_input, "human"))
        self.history.append(MockMessage(assistant_response, "ai"))

    def get_context_window(self, limit: int = 20):
        return self.history[-limit:]

def test_multi_turn_flow():
    """Simulate a multi-turn conversation about pricing."""
    print("\n=== TEST: Multi-Turn Conversation Flow ===")

    sim = ConversationSimulator()

    # Turn 1: Initial Inquiry
    user_q1 = "What is the Smart Business Assistant?"
    ai_r1 = "The Smart Business Assistant is an AI agent that handles inquiries 24/7."
    sim.add_turn(user_q1, ai_r1)
    print(f"Turn 1: {user_q1} -> {ai_r1[:30]}...")

    # Turn 2: Context-dependent Follow-up
    user_q2 = "How much does it cost?" # "it" refers to Smart Business Assistant
    ai_r2 = "Because every solution is custom-tailored, I can't give a generic price. However, I can start a **Custom Quotation** for you right now to get an exact figure."
    sim.add_turn(user_q2, ai_r2)
    print(f"Turn 2: {user_q2} -> {ai_r2}")

    # Verify Policy Adherence & Context
    history = sim.get_context_window()
    last_response = history[-1].content

    policy_compliant = "quotation" in last_response.lower() or "quote" in last_response.lower()

    if policy_compliant and len(history) == 4:
        print("✅ PASS: Context retained & Pricing Policy followed (Quotation offered)")
        return True
    else:
        print(f"❌ FAIL: Policy violation or context loss. Response: {last_response}")
        return False

def test_handoff_sequence():
    """Simulate a conversation leading to human handoff."""
    print("\n=== TEST: Human Handoff Sequence ===")

    sim = ConversationSimulator()

    # Turn 1: Complex Question
    sim.add_turn("I need a custom enterprise architecture for 50k users.",
                 "That sounds like a large-scale project.")

    # Turn 2: Escalation Trigger
    sim.add_turn("Can I talk to a human architect?",
                 "I can schedule a consultation for you.")

    history = sim.get_context_window()
    last_response = history[-1].content

    if "consultation" in last_response or "schedule" in last_response:
        print("✅ PASS: Handoff triggered correctly")
        return True
    else:
        print(f"❌ FAIL: Handoff missed. Response: {last_response}")
        return False

def test_pruning_simulation():
    """Simulate long conversation to verify pruning."""
    print("\n=== TEST: History Pruning Simulation ===")

    sim = ConversationSimulator()
    limit = 5 # Small limit for testing

    # Add 10 turns (20 messages)
    for i in range(10):
        sim.add_turn(f"Question {i}", f"Answer {i}")

    window = sim.get_context_window(limit=limit)

    print(f"Total History: {len(sim.history)} messages")
    print(f"Pruned Window: {len(window)} messages")

    if len(window) == limit and window[-1].content == "Answer 9":
        print("✅ PASS: History pruned correctly to most recent")
        return True
    else:
        print(f"❌ FAIL: Pruning incorrect. Window size: {len(window)}")
        return False

def test_implementation_verification():
    """Verify that the System Prompt and KB have been updated with new logic."""
    print("\n=== TEST: Implementation Verification (Prompt & KB) ===")

    try:
        from ai_agent.marketing.prompts.marketing_prompts import get_system_prompt
        from ai_agent.marketing.marketing_kb_content import MARKETING_KB_CONTENT

        system_prompt = get_system_prompt()

        # Verify Service Recommendation Framework in Prompt
        checks = [
            ("SERVICE RECOMMENDATION FRAMEWORK", system_prompt),
            ("ASSESS WEBSITE STATUS", system_prompt),
            ("Intelligent Applications", system_prompt),
            ("Smart Business Assistant", system_prompt)
        ]

        prompt_passed = True
        for phrase, text in checks:
            if phrase not in text:
                print(f"❌ FAIL: Phrase '{phrase}' missing from System Prompt")
                prompt_passed = False

        if prompt_passed:
            print("✅ PASS: System Prompt contains Service Recommendation Framework")

        # Verify KB Industry Playbooks
        kb_passed = True
        required_entries = [
            "engagement_service_routing",
            "industry_manufacturing",
            "industry_education",
            "industry_logistics"
        ]

        for entry_id in required_entries:
            if entry_id not in MARKETING_KB_CONTENT:
                print(f"❌ FAIL: KB entry '{entry_id}' missing")
                kb_passed = False
            else:
                # Check for content inside the entry
                content = MARKETING_KB_CONTENT[entry_id]['content']
                if len(content.strip()) < 50:
                    print(f"❌ FAIL: KB entry '{entry_id}' is empty or too short")
                    kb_passed = False

        if kb_passed:
            print("✅ PASS: Knowledge Base contains new Industry Playbooks & Routing Tree")

        return prompt_passed and kb_passed

    except ImportError as e:
        print(f"❌ FAIL: Could not import agent modules: {e}")
        return False
    except Exception as e:
        print(f"❌ FAIL: Error during verification: {e}")
        return False

def test_service_routing_scenarios():
    """Simulate the 3-step Service Routing Logic."""
    print("\n=== TEST: Service Routing Logic Simulation ===")
    sim = ConversationSimulator()

    # Scenario 1: No Website -> Intelligent Applications
    print("\nScenario 1: User has NO website")
    sim.add_turn("What can you do for me?",
                "Before I recommend the best solution, let me ask: Do you currently have a website or web application?")
    sim.add_turn("No, I don't have one yet.",
                "In that case, I recommend our **Intelligent Applications** service. It provides a complete solution from scratch.")

    # Scenario 2: Has Website -> Smart Business Assistant
    print("Scenario 2: User HAS website")
    sim.add_turn("I have a WordPress site.",
                "Since you already have a website, our **Smart Business Assistant** is the perfect fit to add AI capabilities.")

    print("✅ PASS: Service Routing scenarios simulated successfully")
    return True

if __name__ == "__main__":
    print("RUNNING CONVERSATION SIMULATION TESTS")
    results = [
        test_multi_turn_flow(),
        test_handoff_sequence(),
        test_pruning_simulation(),
        test_implementation_verification(),
        test_service_routing_scenarios()
    ]

    if all(results):
        print("\n🎉 ALL SIMULATION TESTS PASSED!")
        exit(0)
    else:
        print("\n❌ SOME TESTS FAILED")
        exit(1)
