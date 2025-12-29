"""
Performance Validation Tests for Hybrid Search System
"""
import pytest
import asyncio
import time
import statistics
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor
try:
    import psutil
except Exception:
    pytest.skip("psutil not installed; skipping search performance tests", allow_module_level=True)
import gc

from src.rag.bm25_search_engine import EnhancedBM25SearchEngine, Document
from src.rag.hybrid_search_engine import HybridSearchEngine, SearchType
from src.rag.query_enhancement import QueryEnhancementPipeline

class TestSearchPerformance:
    """Performance tests for hybrid search system"""

    @pytest.fixture
    def large_document_set(self) -> List[Document]:
        """Generate a large set of documents for performance testing"""
        documents = []

        # Technology documents
        tech_content = [
            "Artificial intelligence and machine learning algorithms process data efficiently.",
            "Deep learning neural networks require significant computational resources.",
            "Natural language processing enables human-computer interaction.",
            "Computer vision systems analyze and interpret visual information.",
            "Robotics combines mechanical engineering with artificial intelligence.",
            "Cloud computing provides scalable infrastructure for applications.",
            "Database management systems store and retrieve information quickly.",
            "Web development frameworks simplify application creation.",
            "Mobile applications run on smartphones and tablets.",
            "Cybersecurity protects systems from malicious attacks."
        ]

        # Business documents
        business_content = [
            "Strategic planning involves setting long-term organizational goals.",
            "Market research analyzes consumer behavior and preferences.",
            "Financial management ensures optimal resource allocation.",
            "Human resources manages employee recruitment and development.",
            "Operations management optimizes business processes.",
            "Customer relationship management improves client satisfaction.",
            "Supply chain management coordinates product delivery.",
            "Quality assurance ensures products meet standards.",
            "Risk management identifies and mitigates potential threats.",
            "Innovation drives competitive advantage in markets."
        ]

        # Academic documents
        academic_content = [
            "Research methodology guides scientific investigation processes.",
            "Statistical analysis reveals patterns in experimental data.",
            "Literature review synthesizes existing knowledge.",
            "Hypothesis testing validates theoretical assumptions.",
            "Peer review ensures academic quality standards.",
            "Data collection methods determine research validity.",
            "Experimental design controls for confounding variables.",
            "Theoretical frameworks guide research questions.",
            "Publication standards ensure research dissemination.",
            "Academic collaboration enhances research outcomes."
        ]

        all_content = tech_content + business_content + academic_content

        # Generate 1000 documents
        for i in range(1000):
            content_base = all_content[i % len(all_content)]
            # Add variations to make documents unique
            content = f"{content_base} Document {i} contains additional information about " \
                     f"topic {i % 10} with specific details and examples. " \
                     f"This content is part of collection {i // 100} and has unique identifier {i}."

            doc = Document(
                id=f"doc_{i:04d}",
                content=content,
                metadata={
                    "filename": f"document_{i:04d}.txt",
                    "file_type": "text",
                    "category": ["technology", "business", "academic"][i % 3],
                    "created_at": f"2024-01-{(i % 30) + 1:02d}",
                    "size": len(content)
                }
            )
            documents.append(doc)

        return documents

    @pytest.fixture
    async def performance_hybrid_engine(self, large_document_set) -> HybridSearchEngine:
        """Initialize hybrid engine with large document set"""
        engine = HybridSearchEngine()
        await engine.index_documents(large_document_set)
        return engine

    @pytest.mark.asyncio
    async def test_indexing_performance(self, large_document_set):
        """Test document indexing performance"""
        engine = EnhancedBM25SearchEngine()

        start_time = time.time()
        await engine.index_documents(large_document_set)
        indexing_time = time.time() - start_time

        # Should index 1000 documents in reasonable time
        assert indexing_time < 30.0  # 30 seconds max
        assert engine.total_documents == 1000

        # Check memory usage
        stats = engine.get_index_stats()
        assert stats["total_documents"] == 1000
        assert stats["total_tokens"] > 0
        assert stats["index_size_mb"] < 100  # Should be under 100MB

        print(f"Indexed {len(large_document_set)} documents in {indexing_time:.2f}s")
        print(f"Index size: {stats['index_size_mb']:.2f}MB")

    @pytest.mark.asyncio
    async def test_search_latency_requirements(self, performance_hybrid_engine):
        """Test that search meets latency requirements"""
        test_queries = [
            "artificial intelligence",
            "machine learning algorithms",
            "natural language processing",
            "database management",
            "cloud computing infrastructure",
            "cybersecurity threats",
            "strategic planning",
            "market research analysis",
            "research methodology",
            "statistical analysis"
        ]

        latencies = []

        for query in test_queries:
            start_time = time.time()
            response = await performance_hybrid_engine.search(
                query, SearchType.HYBRID
            )
            latency = time.time() - start_time
            latencies.append(latency)

            # Each search should complete within 3 seconds (requirement)
            assert latency < 3.0, f"Query '{query}' took {latency:.2f}s (>3s limit)"
            assert len(response.results) > 0

        avg_latency = statistics.mean(latencies)
        p95_latency = statistics.quantiles(latencies, n=20)[18]  # 95th percentile

        # Performance targets
        assert avg_latency < 1.0, f"Average latency {avg_latency:.2f}s exceeds 1s target"
        assert p95_latency < 2.0, f"95th percentile latency {p95_latency:.2f}s exceeds 2s target"

        print(f"Average search latency: {avg_latency:.3f}s")
        print(f"95th percentile latency: {p95_latency:.3f}s")

    @pytest.mark.asyncio
    async def test_concurrent_search_performance(self, performance_hybrid_engine):
        """Test performance under concurrent load"""
        test_queries = [
            "artificial intelligence machine learning",
            "database management systems",
            "cloud computing scalability",
            "natural language processing",
            "cybersecurity risk management"
        ] * 20  # 100 total queries

        async def perform_search(query: str) -> float:
            start_time = time.time()
            await performance_hybrid_engine.search(query, SearchType.HYBRID)
            return time.time() - start_time

        # Run concurrent searches
        start_time = time.time()
        tasks = [perform_search(query) for query in test_queries]
        latencies = await asyncio.gather(*tasks)
        total_time = time.time() - start_time

        # Performance assertions
        avg_latency = statistics.mean(latencies)
        max_latency = max(latencies)
        throughput = len(test_queries) / total_time

        assert avg_latency < 2.0, f"Average concurrent latency {avg_latency:.2f}s too high"
        assert max_latency < 5.0, f"Max concurrent latency {max_latency:.2f}s too high"
        assert throughput > 10, f"Throughput {throughput:.1f} queries/s too low"

        print(f"Concurrent performance:")
        print(f"  - {len(test_queries)} queries in {total_time:.2f}s")
        print(f"  - Throughput: {throughput:.1f} queries/s")
        print(f"  - Average latency: {avg_latency:.3f}s")
        print(f"  - Max latency: {max_latency:.3f}s")

    @pytest.mark.asyncio
    async def test_memory_usage(self, performance_hybrid_engine):
        """Test memory usage during operations"""
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB

        # Perform multiple searches
        for i in range(50):
            await performance_hybrid_engine.search(
                f"test query {i} artificial intelligence",
                SearchType.HYBRID
            )

        # Force garbage collection
        gc.collect()

        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory

        # Memory increase should be reasonable
        assert memory_increase < 100, f"Memory increased by {memory_increase:.1f}MB"

        print(f"Memory usage: {initial_memory:.1f}MB -> {final_memory:.1f}MB "
              f"(+{memory_increase:.1f}MB)")

    @pytest.mark.asyncio
    async def test_search_type_performance_comparison(self, performance_hybrid_engine):
        """Compare performance across different search types"""
        test_query = "artificial intelligence machine learning algorithms"
        iterations = 10

        # Test each search type
        search_types = [SearchType.SEMANTIC, SearchType.KEYWORD, SearchType.HYBRID]
        performance_results = {}

        for search_type in search_types:
            latencies = []

            for _ in range(iterations):
                start_time = time.time()
                response = await performance_hybrid_engine.search(
                    test_query, search_type
                )
                latency = time.time() - start_time
                latencies.append(latency)

                assert len(response.results) >= 0  # Should not crash

            avg_latency = statistics.mean(latencies)
            performance_results[search_type.value] = {
                "avg_latency": avg_latency,
                "min_latency": min(latencies),
                "max_latency": max(latencies)
            }

        # Keyword search should be fastest
        assert performance_results["keyword"]["avg_latency"] <= \
               performance_results["hybrid"]["avg_latency"]

        # All should be under performance targets
        for search_type, results in performance_results.items():
            assert results["avg_latency"] < 2.0, \
                   f"{search_type} average latency {results['avg_latency']:.2f}s too high"

        print("Search type performance comparison:")
        for search_type, results in performance_results.items():
            print(f"  {search_type}: {results['avg_latency']:.3f}s avg "
                  f"({results['min_latency']:.3f}s - {results['max_latency']:.3f}s)")

    @pytest.mark.asyncio
    async def test_query_enhancement_performance(self):
        """Test query enhancement pipeline performance"""
        enhancer = QueryEnhancementPipeline()

        test_queries = [
            "artifical inteligence",  # Misspelled
            "machien lerning algoritms",  # Multiple misspellings
            "what is natural language processing",  # Question
            "compare database management systems",  # Comparative
            "how to implement neural networks",  # Procedural
            "AI ML NLP API",  # Acronyms
            "deep learning convolutional neural networks",  # Technical
            "business intelligence data analytics",  # Business terms
            "research methodology statistical analysis",  # Academic terms
            "cloud computing scalability performance"  # Multi-domain
        ]

        enhancement_times = []

        for query in test_queries:
            start_time = time.time()
            enhanced = await enhancer.enhance_query(query)
            enhancement_time = time.time() - start_time
            enhancement_times.append(enhancement_time)

            # Enhancement should complete quickly
            assert enhancement_time < 0.5, \
                   f"Query enhancement took {enhancement_time:.2f}s (>0.5s limit)"

            # Should produce valid results
            assert enhanced.original_query == query
            assert enhanced.corrected_query is not None
            assert enhanced.intent_classification.intent is not None

        avg_enhancement_time = statistics.mean(enhancement_times)
        max_enhancement_time = max(enhancement_times)

        assert avg_enhancement_time < 0.2, \
               f"Average enhancement time {avg_enhancement_time:.3f}s too high"

        print(f"Query enhancement performance:")
        print(f"  Average time: {avg_enhancement_time:.3f}s")
        print(f"  Max time: {max_enhancement_time:.3f}s")

    @pytest.mark.asyncio
    async def test_scalability_with_document_count(self):
        """Test how performance scales with document count"""
        document_counts = [100, 500, 1000]
        performance_data = []

        for doc_count in document_counts:
            # Create subset of documents
            documents = []
            for i in range(doc_count):
                doc = Document(
                    id=f"scale_doc_{i}",
                    content=f"Document {i} about artificial intelligence and machine learning. "
                            f"This document contains information about topic {i % 10}.",
                    metadata={"filename": f"scale_doc_{i}.txt", "file_type": "text"}
                )
                documents.append(doc)

            # Index and test
            engine = HybridSearchEngine()

            # Measure indexing time
            index_start = time.time()
            await engine.index_documents(documents)
            index_time = time.time() - index_start

            # Measure search time
            search_start = time.time()
            response = await engine.search("artificial intelligence", SearchType.HYBRID)
            search_time = time.time() - search_start

            performance_data.append({
                "doc_count": doc_count,
                "index_time": index_time,
                "search_time": search_time,
                "results_count": len(response.results)
            })

            # Performance should scale reasonably
            assert search_time < 3.0, \
                   f"Search time {search_time:.2f}s too high for {doc_count} docs"

        print("Scalability test results:")
        for data in performance_data:
            print(f"  {data['doc_count']} docs: "
                  f"index={data['index_time']:.2f}s, "
                  f"search={data['search_time']:.3f}s, "
                  f"results={data['results_count']}")

        # Search time should not increase dramatically with document count
        search_times = [data["search_time"] for data in performance_data]
        time_ratio = search_times[-1] / search_times[0]  # 1000 docs vs 100 docs
        assert time_ratio < 5.0, f"Search time ratio {time_ratio:.1f}x too high"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
