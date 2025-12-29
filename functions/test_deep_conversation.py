"""
Deep Conversation Performance Test
Tests multi-turn conversations with the marketing agent.

Run: python test_deep_conversation.py
"""

import asyncio
import aiohttp
import time
from datetime import datetime
from typing import Dict, List, Any
import statistics

API_URL = "https://marketing-api-zcr2ek5dsa-ts.a.run.app/api/ai/marketing-chat"

# Multi-turn conversation scenarios
CONVERSATION_FLOWS = [
    {
        "name": "Lead Qualification Flow",
        "description": "Visitor interested in services → pricing → consultation",
        "steps": [
            {"message": "Hi, I'm interested in AI for my business", "page_context": "homepage"},
            {"message": "Tell me more about the Smart Business Assistant", "page_context": "services"},
            {"message": "How much would this cost for a mid-size company?", "page_context": "pricing"},
            {"message": "Can I book a consultation?", "page_context": "contact"},
            {"message": "Thanks, that's all I needed. Cheers!", "page_context": "contact", "expect_exit": True},
        ]
    },
    {
        "name": "Technical Deep Dive",
        "description": "Developer asking technical questions",
        "steps": [
            {"message": "What tech stack do you use?", "page_context": "product"},
            {"message": "How does the RAG system work?", "page_context": "product"},
            {"message": "What about security and compliance?", "page_context": "product"},
            {"message": "Can you integrate with our Salesforce?", "page_context": "solutions"},
            {"message": "Got it, no worries. Thanks!", "page_context": "solutions", "expect_exit": True},
        ]
    },
    {
        "name": "Quick Inquiry",
        "description": "Fast visitor who just wants basics",
        "steps": [
            {"message": "Hi", "page_context": "homepage"},
            {"message": "What do you do?", "page_context": "homepage"},
            {"message": "Thanks!", "page_context": "homepage", "expect_exit": True},
        ]
    },
    {
        "name": "Competitor Comparison",
        "description": "Visitor comparing options",
        "steps": [
            {"message": "How are you different from other AI companies?", "page_context": "homepage"},
            {"message": "What makes your pricing competitive?", "page_context": "pricing"},
            {"message": "Do you have case studies?", "page_context": "solutions"},
            {"message": "What ROI can I expect?", "page_context": "solutions"},
            {"message": "That's helpful, cheers mate!", "page_context": "solutions", "expect_exit": True},
        ]
    },
    {
        "name": "Australian Business Owner",
        "description": "Direct Australian style conversation",
        "steps": [
            {"message": "G'day, need help with customer service automation", "page_context": "homepage"},
            {"message": "How quick can you get this running?", "page_context": "services"},
            {"message": "What's the damage gonna be? Ballpark figure", "page_context": "pricing"},
            {"message": "Too easy, legend!", "page_context": "pricing", "expect_exit": True},
        ]
    },
]


class ConversationMetrics:
    def __init__(self):
        self.conversations: List[Dict] = []
        self.all_latencies: List[float] = []
        self.all_word_counts: List[int] = []
        self.exit_signal_success: int = 0
        self.exit_signal_total: int = 0

    def add_conversation(self, name: str, results: List[Dict], total_time: float):
        latencies = [r["latency"] for r in results if r.get("success")]
        word_counts = [r["words"] for r in results if r.get("success")]

        self.all_latencies.extend(latencies)
        self.all_word_counts.extend(word_counts)

        # Count exit signals
        for r in results:
            if r.get("expect_exit"):
                self.exit_signal_total += 1
                if r.get("followups", 0) == 0:
                    self.exit_signal_success += 1

        self.conversations.append({
            "name": name,
            "turns": len(results),
            "total_time": total_time,
            "avg_latency": statistics.mean(latencies) if latencies else 0,
            "avg_words": statistics.mean(word_counts) if word_counts else 0,
            "results": results
        })


async def run_conversation(session: aiohttp.ClientSession, flow: Dict, metrics: ConversationMetrics):
    """Run a multi-turn conversation"""
    conversation_id = None
    results = []
    start_time = time.time()

    print(f"\n  📞 {flow['name']}")
    print(f"     {flow['description']}")

    for i, step in enumerate(flow["steps"]):
        payload = {
            "message": step["message"],
            "page_context": step["page_context"],
        }
        if conversation_id:
            payload["conversation_id"] = conversation_id

        step_start = time.time()
        try:
            async with session.post(API_URL, json=payload) as response:
                latency = time.time() - step_start

                if response.status != 200:
                    results.append({"success": False, "error": f"HTTP {response.status}"})
                    print(f"     ❌ Turn {i+1}: HTTP {response.status}")
                    continue

                data = await response.json()

                if not data.get("success"):
                    results.append({"success": False, "error": "API error"})
                    print(f"     ❌ Turn {i+1}: API error")
                    continue

                # Save conversation ID for context
                if not conversation_id:
                    conversation_id = data.get("conversation_id")

                response_text = data.get("response", "")
                word_count = len(response_text.split())
                followups = data.get("suggested_questions", [])
                followup_count = len(followups) if followups else 0

                result = {
                    "success": True,
                    "latency": latency,
                    "words": word_count,
                    "followups": followup_count,
                    "message": step["message"][:30] + "...",
                    "response_preview": response_text[:60] + "..." if len(response_text) > 60 else response_text,
                    "expect_exit": step.get("expect_exit", False)
                }
                results.append(result)

                # Status indicator
                status = "✅"
                exit_note = ""
                if step.get("expect_exit"):
                    if followup_count == 0:
                        status = "🎯"
                        exit_note = " (exit respected)"
                    else:
                        status = "⚠️"
                        exit_note = f" (got {followup_count} followups)"

                print(f"     {status} Turn {i+1}: {latency:.1f}s, {word_count}w{exit_note}")

        except Exception as e:
            results.append({"success": False, "error": str(e)})
            print(f"     ❌ Turn {i+1}: {str(e)[:50]}")

        await asyncio.sleep(0.3)  # Small delay between turns

    total_time = time.time() - start_time
    metrics.add_conversation(flow["name"], results, total_time)

    # Conversation summary
    successful = sum(1 for r in results if r.get("success"))
    print(f"     📊 {successful}/{len(results)} turns successful, total: {total_time:.1f}s")


async def run_deep_tests():
    """Run all conversation flows"""
    print("=" * 70)
    print("DEEP CONVERSATION PERFORMANCE TEST")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 70)

    metrics = ConversationMetrics()

    async with aiohttp.ClientSession() as session:
        print(f"\n🧪 Running {len(CONVERSATION_FLOWS)} conversation scenarios...")

        for flow in CONVERSATION_FLOWS:
            await run_conversation(session, flow, metrics)
            await asyncio.sleep(1)  # Delay between conversations

    # Summary
    print("\n" + "=" * 70)
    print("DEEP CONVERSATION SUMMARY")
    print("=" * 70)

    total_turns = sum(c["turns"] for c in metrics.conversations)
    total_time = sum(c["total_time"] for c in metrics.conversations)

    print(f"\n📊 Conversations: {len(metrics.conversations)}")
    print(f"   Total Turns: {total_turns}")
    print(f"   Total Time: {total_time:.1f}s")

    if metrics.all_latencies:
        sorted_lat = sorted(metrics.all_latencies)
        n = len(sorted_lat)
        print(f"\n⏱️ Latency (per turn):")
        print(f"   Average: {statistics.mean(metrics.all_latencies):.2f}s")
        print(f"   Median:  {statistics.median(metrics.all_latencies):.2f}s")
        print(f"   P95:     {sorted_lat[int(n * 0.95)]:.2f}s")
        print(f"   Range:   {min(metrics.all_latencies):.2f}s - {max(metrics.all_latencies):.2f}s")

    if metrics.all_word_counts:
        print(f"\n📝 Response Length:")
        print(f"   Average: {statistics.mean(metrics.all_word_counts):.0f} words")
        print(f"   Range:   {min(metrics.all_word_counts)} - {max(metrics.all_word_counts)} words")

    print(f"\n🇦🇺 Exit Signal Detection:")
    print(f"   Success: {metrics.exit_signal_success}/{metrics.exit_signal_total}")
    if metrics.exit_signal_total > 0:
        rate = metrics.exit_signal_success / metrics.exit_signal_total * 100
        print(f"   Rate: {rate:.0f}%")

    # Conversation breakdown
    print("\n" + "-" * 70)
    print("CONVERSATION BREAKDOWN")
    print("-" * 70)

    for conv in metrics.conversations:
        print(f"\n📞 {conv['name']}")
        print(f"   Turns: {conv['turns']} | Time: {conv['total_time']:.1f}s | Avg: {conv['avg_latency']:.2f}s/turn | {conv['avg_words']:.0f} words/response")

    # Overall grade
    print("\n" + "=" * 70)
    avg_lat = statistics.mean(metrics.all_latencies) if metrics.all_latencies else 0
    avg_words = statistics.mean(metrics.all_word_counts) if metrics.all_word_counts else 0
    exit_rate = metrics.exit_signal_success / metrics.exit_signal_total * 100 if metrics.exit_signal_total > 0 else 0

    score = 0
    if avg_lat < 5: score += 25
    elif avg_lat < 10: score += 15
    if avg_words < 100: score += 25
    elif avg_words < 150: score += 15
    if exit_rate >= 80: score += 25
    elif exit_rate >= 50: score += 15
    if total_turns == sum(len(f["steps"]) for f in CONVERSATION_FLOWS): score += 25
    elif total_turns >= 15: score += 15

    if score >= 90:
        grade = "A+ - Outstanding"
    elif score >= 80:
        grade = "A - Excellent"
    elif score >= 70:
        grade = "B - Good"
    elif score >= 60:
        grade = "C - Acceptable"
    else:
        grade = "D - Needs Improvement"

    print(f"OVERALL GRADE: {grade} (Score: {score}/100)")
    print("=" * 70)

    return metrics


if __name__ == "__main__":
    asyncio.run(run_deep_tests())
