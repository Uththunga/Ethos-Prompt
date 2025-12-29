#!/usr/bin/env python3
"""
Cache Warming Script - Pre-generate Top 100 FAQs

Runs marketing agent queries for common questions and populates the cache.
This ensures instant responses from day 1 of deployment.

Usage:
    python scripts/warm_cache.py --env staging
    python scripts/warm_cache.py --env production --limit 50
"""

import asyncio
import argparse
import json
import time
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Initialize Firebase (required for cache manager)
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase app if not already initialized
if not firebase_admin._apps:
    firebase_admin.initialize_app()

from src.rag.cache_manager import intelligent_response_cache

# Top 100 Marketing FAQs categorized by page context
FAQ_LIBRARY = {
    "services": [
        "What services do you offer?",
        "Tell me about your core services",
        "What are your main offerings?",
        "What kind of solutions do you provide?",
        "What can EthosPrompt help me with?",
        "What is intelligent application development?",
        "How do you build AI applications?",
        "What technologies do you use?",
        "What is your tech stack?",
        "Do you offer custom development?",
    ],
    "pricing": [
        "What are your pricing plans?",
        "How much do your services cost?",
        "Do you have a free tier?",
        "What is included in each plan?",
        "Can I get a quote?",
        "Is there a trial period?",
        "What payment methods do you accept?",
        "Are there any setup fees?",
        "Do you offer discounts for startups?",
        "What is your pricing model?",
    ],
    "integration": [
        "How does system integration work?",
        "What systems can you integrate with?",
        "Do you support API integration?",
        "Can you integrate with our existing tools?",
        "What is your integration process?",
        "How long does integration take?",
        "Do you provide integration support?",
        "Can you integrate with Salesforce?",
        "Do you support custom APIs?",
        "What data formats do you support?",
    ],
    "ai_capabilities": [
        "What AI capabilities do you offer?",
        "How does your AI agent work?",
        "What can your AI assistant do?",
        "Do you use machine learning?",
        "What LLM models do you use?",
        "How accurate is your AI?",
        "Can your AI learn from our data?",
        "Do you offer custom AI training?",
        "What is RAG?",
        "How do you ensure AI quality?",
    ],
    "business_automation": [
        "How can you automate our business processes?",
        "What processes can be automated?",
        "Tell me about business process optimization",
        "How do smart assistants help businesses?",
        "What is workflow automation?",
        "Can you automate customer support?",
        "Do you offer chatbot solutions?",
        "How do you improve efficiency?",
        "What are the benefits of automation?",
        "Can you integrate with our CRM?",
    ],
    "getting_started": [
        "How do I get started?",
        "What is the onboarding process?",
        "How long does implementation take?",
        "Do you offer training?",
        "What support do you provide?",
        "Can I schedule a demo?",
        "Do you have documentation?",
        "How quickly can we launch?",
        "What do I need to provide?",
        "Is there a setup guide?",
    ],
    "security": [
        "How secure is your platform?",
        "Do you comply with GDPR?",
        "Where is data stored?",
        "How do you handle PII?",
        "Are you SOC 2 compliant?",
        "Do you encrypt data?",
        "What are your security certifications?",
        "Can we host on-premise?",
        "How do you prevent data breaches?",
        "Do you have a privacy policy?",
    ],
    "support": [
        "What support channels do you offer?",
        "Do you provide 24/7 support?",
        "How fast do you respond?",
        "Do you have a knowledge base?",
        "Can I talk to a human?",
        "What is your SLA?",
        "Do you offer dedicated support?",
        "How do I report a bug?",
        "Do you have community forums?",
        "What is your response time?",
    ],
    "performance": [
        "How fast is your platform?",
        "What is your uptime guarantee?",
        "How do you handle scale?",
        "What is your infrastructure?",
        "Do you use cloud hosting?",
        "How many requests can you handle?",
        "What is your response time?",
        "Do you have performance metrics?",
        "How reliable is your service?",
        "What happens during downtime?",
    ],
    "comparison": [
        "How are you different from competitors?",
        "Why should I choose EthosPrompt?",
        "What makes you unique?",
        "How do you compare to ChatGPT?",
        "What is your competitive advantage?",
        "Are you better than [competitor]?",
        "What do customers say about you?",
        "Do you have case studies?",
        "What results have you achieved?",
        "Who are your clients?",
    ],
}

async def warm_cache_for_category(category: str, questions: list, agent, throttle_ms: int = 1000):
    """
    Warm cache for a specific category of questions.

    Args:
        category: Page context category
        questions: List of questions to pre-generate
        agent: Marketing agent instance
        throttle_ms: Milliseconds to wait between requests (to avoid rate limiting)
    """
    print(f"\n📂 Warming cache for category: {category}")
    print(f"   Questions: {len(questions)}")

    success_count = 0
    skip_count = 0
    error_count = 0

    for i, question in enumerate(questions, 1):
        try:
            # Check if already cached
            cached = intelligent_response_cache.get_cached_response(question, category)
            if cached:
                print(f"   [{i}/{len(questions)}] ⏭️  Skipped (already cached): {question[:50]}...")
                skip_count += 1
                continue

            # Generate response
            print(f"   [{i}/{len(questions)}] 🔄 Generating: {question[:50]}...")
            start_time = time.time()

            context = {"conversation_id": f"cache-warm-{category}-{i}", "page_context": category}
            response = await agent.chat(question, context)

            elapsed = time.time() - start_time

            # Cache the response
            cache_success = intelligent_response_cache.cache_response_safe(
                query=question,
                response=response['response'],
                page_context=category,
                metadata={'source': 'cache_warming', 'model': 'granite-3.0-8b'}
            )

            if cache_success:
                print(f"   [{i}/{len(questions)}] ✅ Cached ({elapsed:.2f}s): {question[:50]}...")
                success_count += 1
            else:
                print(f"   [{i}/{len(questions)}] ⚠️  Failed to cache (PII/Quality): {question[:50]}...")
                skip_count += 1

            # Throttle to avoid rate limiting
            await asyncio.sleep(throttle_ms / 1000)

        except Exception as e:
            print(f"   [{i}/{len(questions)}] ❌ Error: {question[:50]}... - {e}")
            error_count += 1

    return {
        "category": category,
        "total": len(questions),
        "success": success_count,
        "skipped": skip_count,
        "errors": error_count
    }

async def main():
    parser = argparse.ArgumentParser(description="Warm cache with top FAQs")
    parser.add_argument("--env", default="staging", choices=["staging", "production"],
                       help="Environment to warm cache for")
    parser.add_argument("--limit", type=int, default=None,
                       help="Limit number of questions per category (for testing)")
    parser.add_argument("--categories", nargs="+", default=None,
                       help="Specific categories to warm (space-separated)")
    parser.add_argument("--throttle", type=int, default=1000,
                       help="Milliseconds to wait between requests (default: 1000)")

    args = parser.parse_args()

    print("=" * 60)
    print("🔥 CACHE WARMING SCRIPT")
    print("=" * 60)
    print(f"Environment: {args.env}")
    print(f"Throttle: {args.throttle}ms")

    # Set environment
    os.environ['ENVIRONMENT'] = args.env

    # Import agent (after setting environment)
    try:
        from src.ai_agent.marketing.marketing_agent import get_marketing_agent
        from firebase_admin import firestore
        db = firestore.client()
        agent = get_marketing_agent(db=db)
        print("✅ Marketing agent initialized")
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        return

    # Filter categories if specified
    categories_to_warm = FAQ_LIBRARY
    if args.categories:
        categories_to_warm = {k: v for k, v in FAQ_LIBRARY.items() if k in args.categories}

    # Limit questions if specified
    if args.limit:
        categories_to_warm = {k: v[:args.limit] for k, v in categories_to_warm.items()}

    # Calculate total
    total_questions = sum(len(questions) for questions in categories_to_warm.values())
    print(f"Total questions to process: {total_questions}")
    print(f"Categories: {list(categories_to_warm.keys())}")

    # Warm cache
    start_time = time.time()
    results = []

    for category, questions in categories_to_warm.items():
        result = await warm_cache_for_category(category, questions, agent, args.throttle)
        results.append(result)

    total_time = time.time() - start_time

    # Summary
    print("\n" + "=" * 60)
    print("📊 CACHE WARMING SUMMARY")
    print("=" * 60)

    total_success = sum(r['success'] for r in results)
    total_skipped = sum(r['skipped'] for r in results)
    total_errors = sum(r['errors'] for r in results)

    for result in results:
        print(f"\n{result['category']}:")
        print(f"  ✅ Cached: {result['success']}")
        print(f"  ⏭️  Skipped: {result['skipped']}")
        print(f"  ❌ Errors: {result['errors']}")

    print(f"\n{'=' * 60}")
    print(f"Total Cached: {total_success}/{total_questions}")
    print(f"Total Skipped: {total_skipped}")
    print(f"Total Errors: {total_errors}")
    print(f"Total Time: {total_time/60:.2f} minutes")
    print(f"Avg Time per Question: {total_time/total_questions:.2f}s")

    # Cache stats
    stats = intelligent_response_cache.get_response_stats()
    print(f"\n📈 Cache Statistics:")
    print(f"  Cache Hit Rate: {stats['cache_hit_rate_percent']}%")
    print(f"  Total Cache Attempts: {stats['total_cache_attempts']}")
    print(f"  Successful Caches: {stats['successful_caches']}")
    print(f"  PII Rejections: {stats['pii_rejections']}")
    print(f"  Quality Rejections: {stats['quality_rejections']}")

    print("\n✅ Cache warming complete!")

if __name__ == "__main__":
    asyncio.run(main())
