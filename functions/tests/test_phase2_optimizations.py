import sys
import os
from pathlib import Path

# Add functions dir to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.ai_agent.marketing.marketing_retriever import MarketingRetriever
from src.rag.cache_manager import IntelligentResponseCache
from src.ai_agent.marketing.config import get_config, reload_config

def test_phase2_optimizations():
    print("Testing Phase 2 Optimizations...")

    # 1. Test Adaptive Top-K
    print("\n1. Testing Adaptive Top-K Logic:")
    retriever = MarketingRetriever(db=None)

    # Simple query
    simple_q = "pricing plans"
    k_simple = retriever._get_adaptive_top_k(simple_q)
    print(f"  Query: '{simple_q}' (len={len(simple_q.split())}) -> k={k_simple}")
    assert k_simple == 3, f"Expected 3, got {k_simple}"

    # Medium query
    medium_q = "how does system integration work with my existing tools and platforms"
    k_medium = retriever._get_adaptive_top_k(medium_q)
    print(f"  Query: '{medium_q}' (len={len(medium_q.split())}) -> k={k_medium}")
    assert k_medium == 4, f"Expected 4, got {k_medium}"

    # Complex query
    complex_q = "I want to know about how your artificial intelligence agent handles data privacy and security compliance for enterprise customers in europe"
    k_complex = retriever._get_adaptive_top_k(complex_q)
    print(f"  Query: '{complex_q}' (len={len(complex_q.split())}) -> k={k_complex}")
    assert k_complex == 5, f"Expected 5, got {k_complex}"
    print("  ✅ Adaptive Top-K passed")

    # 2. Test Cache Similarity Threshold
    print("\n2. Testing Cache Similarity Threshold:")
    cache = IntelligentResponseCache()
    print(f"  Similarity Threshold: {cache.similarity_threshold}")
    assert cache.similarity_threshold == 0.75, f"Expected 0.75, got {cache.similarity_threshold}"
    print("  ✅ Cache Threshold passed")

    # 3. Test Max Tokens Config
    print("\n3. Testing Max Tokens Config:")
    # Reload config to ensure we get fresh values
    config = reload_config()
    print(f"  Max Tokens: {config.max_tokens}")
    assert config.max_tokens == 320, f"Expected 320, got {config.max_tokens}"
    print("  ✅ Max Tokens passed")

    print("\n✅ All Phase 2 Optimizations Verified!")

if __name__ == "__main__":
    try:
        test_phase2_optimizations()
    except Exception as e:
        print(f"\n❌ Test Failed: {e}")
        sys.exit(1)
