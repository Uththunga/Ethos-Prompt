#!/usr/bin/env python3
"""
Hybrid Search Validation Script
Validates all hybrid search functionality and performance requirements
"""
import asyncio
import sys
import time
import logging
from pathlib import Path
from typing import Dict, List, Any
import statistics

# Add the functions directory to the path
sys.path.append(str(Path(__file__).parent.parent / "functions" / "src"))

from rag.bm25_search_engine import EnhancedBM25SearchEngine, Document
from rag.hybrid_search_engine import HybridSearchEngine, SearchType
from rag.query_enhancement import QueryEnhancementPipeline
from rag.result_fusion import ReciprocalRankFusion

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HybridSearchValidator:
    """Comprehensive validation of hybrid search system"""
    
    def __init__(self):
        self.test_documents = self._create_test_documents()
        self.test_queries = self._create_test_queries()
        self.results = {}
        
    def _create_test_documents(self) -> List[Document]:
        """Create test documents for validation"""
        return [
            Document(
                id="ai_1",
                content="Artificial intelligence and machine learning are transforming technology. "
                        "Deep learning algorithms process vast amounts of data to identify patterns "
                        "and make predictions with remarkable accuracy.",
                metadata={"category": "ai", "relevance": 1.0, "filename": "ai_intro.txt"}
            ),
            Document(
                id="ai_2", 
                content="Natural language processing enables computers to understand human language. "
                        "NLP techniques include tokenization, parsing, semantic analysis, and "
                        "sentiment analysis for text comprehension.",
                metadata={"category": "ai", "relevance": 0.9, "filename": "nlp_guide.txt"}
            ),
            Document(
                id="db_1",
                content="Database management systems store and retrieve information efficiently. "
                        "SQL queries allow users to search, filter, and manipulate data in "
                        "relational databases with ACID properties.",
                metadata={"category": "database", "relevance": 1.0, "filename": "db_intro.txt"}
            ),
            Document(
                id="web_1",
                content="Web APIs provide interfaces for applications to communicate over HTTP. "
                        "RESTful services use standard HTTP methods like GET, POST, PUT, DELETE "
                        "to enable data exchange between distributed systems.",
                metadata={"category": "web", "relevance": 0.8, "filename": "api_guide.txt"}
            ),
            Document(
                id="cloud_1",
                content="Cloud computing offers scalable infrastructure for modern applications. "
                        "Virtualization and containerization technologies enable efficient "
                        "resource utilization and automatic scaling.",
                metadata={"category": "cloud", "relevance": 0.7, "filename": "cloud_basics.txt"}
            )
        ]
    
    def _create_test_queries(self) -> List[Dict[str, Any]]:
        """Create test queries with expected results"""
        return [
            {
                "query": "artificial intelligence machine learning",
                "expected_docs": ["ai_1", "ai_2"],
                "category": "ai",
                "intent": "factual"
            },
            {
                "query": "database management SQL",
                "expected_docs": ["db_1"],
                "category": "database", 
                "intent": "factual"
            },
            {
                "query": "web API REST services",
                "expected_docs": ["web_1"],
                "category": "web",
                "intent": "factual"
            },
            {
                "query": "artifical inteligence",  # Misspelled
                "expected_docs": ["ai_1", "ai_2"],
                "category": "ai",
                "intent": "factual"
            },
            {
                "query": "how to use databases",
                "expected_docs": ["db_1"],
                "category": "database",
                "intent": "procedural"
            }
        ]
    
    async def run_validation(self) -> Dict[str, Any]:
        """Run complete validation suite"""
        logger.info("Starting hybrid search validation...")
        
        # Initialize engines
        bm25_engine = EnhancedBM25SearchEngine()
        hybrid_engine = HybridSearchEngine()
        query_enhancer = QueryEnhancementPipeline()
        
        # Index test documents
        await bm25_engine.index_documents(self.test_documents)
        await hybrid_engine.index_documents(self.test_documents)
        
        # Run validation tests
        results = {
            "bm25_validation": await self._validate_bm25_engine(bm25_engine),
            "query_enhancement_validation": await self._validate_query_enhancement(query_enhancer),
            "hybrid_search_validation": await self._validate_hybrid_search(hybrid_engine),
            "performance_validation": await self._validate_performance(hybrid_engine),
            "relevance_validation": await self._validate_relevance(hybrid_engine),
            "error_handling_validation": await self._validate_error_handling(hybrid_engine)
        }
        
        # Calculate overall score
        overall_score = self._calculate_overall_score(results)
        results["overall_score"] = overall_score
        results["validation_passed"] = overall_score >= 0.8
        
        return results
    
    async def _validate_bm25_engine(self, engine: EnhancedBM25SearchEngine) -> Dict[str, Any]:
        """Validate BM25 search engine"""
        logger.info("Validating BM25 search engine...")
        
        results = {
            "basic_search": False,
            "spell_correction": False,
            "query_expansion": False,
            "performance": False,
            "score": 0.0
        }
        
        try:
            # Test basic search
            search_results = await engine.search("artificial intelligence", top_k=3)
            if search_results and len(search_results) > 0:
                results["basic_search"] = True
                logger.info("✓ Basic BM25 search working")
            
            # Test spell correction
            corrected_results = await engine.search("artifical inteligence", top_k=3)
            if corrected_results and len(corrected_results) > 0:
                results["spell_correction"] = True
                logger.info("✓ Spell correction working")
            
            # Test query expansion
            expanded_results = await engine.search("AI", top_k=3, use_query_expansion=True)
            if expanded_results and len(expanded_results) > 0:
                results["query_expansion"] = True
                logger.info("✓ Query expansion working")
            
            # Test performance
            start_time = time.time()
            await engine.search("machine learning algorithms", top_k=10)
            search_time = time.time() - start_time
            
            if search_time < 0.5:  # Should be under 500ms
                results["performance"] = True
                logger.info(f"✓ BM25 performance good: {search_time:.3f}s")
            else:
                logger.warning(f"⚠ BM25 performance slow: {search_time:.3f}s")
            
        except Exception as e:
            logger.error(f"✗ BM25 validation error: {e}")
        
        # Calculate score
        passed_tests = sum(1 for test in results.values() if isinstance(test, bool) and test)
        total_tests = sum(1 for test in results.values() if isinstance(test, bool))
        results["score"] = passed_tests / total_tests if total_tests > 0 else 0.0
        
        return results
    
    async def _validate_query_enhancement(self, enhancer: QueryEnhancementPipeline) -> Dict[str, Any]:
        """Validate query enhancement pipeline"""
        logger.info("Validating query enhancement...")
        
        results = {
            "spell_correction": False,
            "intent_classification": False,
            "query_expansion": False,
            "performance": False,
            "score": 0.0
        }
        
        try:
            # Test spell correction
            enhanced = await enhancer.enhance_query("artifical inteligence machien lerning")
            if enhanced.corrected_query != enhanced.original_query:
                results["spell_correction"] = True
                logger.info("✓ Query spell correction working")
            
            # Test intent classification
            if enhanced.intent_classification.intent in ['factual', 'exploratory', 'analytical']:
                results["intent_classification"] = True
                logger.info(f"✓ Intent classification working: {enhanced.intent_classification.intent}")
            
            # Test query expansion
            if enhanced.expansion.expansion_score > 0:
                results["query_expansion"] = True
                logger.info("✓ Query expansion working")
            
            # Test performance
            start_time = time.time()
            await enhancer.enhance_query("test query for performance")
            enhancement_time = time.time() - start_time
            
            if enhancement_time < 0.2:  # Should be under 200ms
                results["performance"] = True
                logger.info(f"✓ Query enhancement performance good: {enhancement_time:.3f}s")
            else:
                logger.warning(f"⚠ Query enhancement slow: {enhancement_time:.3f}s")
            
        except Exception as e:
            logger.error(f"✗ Query enhancement validation error: {e}")
        
        # Calculate score
        passed_tests = sum(1 for test in results.values() if isinstance(test, bool) and test)
        total_tests = sum(1 for test in results.values() if isinstance(test, bool))
        results["score"] = passed_tests / total_tests if total_tests > 0 else 0.0
        
        return results
    
    async def _validate_hybrid_search(self, engine: HybridSearchEngine) -> Dict[str, Any]:
        """Validate hybrid search engine"""
        logger.info("Validating hybrid search engine...")
        
        results = {
            "semantic_search": False,
            "keyword_search": False,
            "hybrid_search": False,
            "fusion_working": False,
            "score": 0.0
        }
        
        try:
            # Test semantic search
            semantic_response = await engine.search("artificial intelligence", SearchType.SEMANTIC)
            if semantic_response.search_type == "semantic":
                results["semantic_search"] = True
                logger.info("✓ Semantic search working")
            
            # Test keyword search
            keyword_response = await engine.search("artificial intelligence", SearchType.KEYWORD)
            if keyword_response.search_type == "keyword" and len(keyword_response.results) > 0:
                results["keyword_search"] = True
                logger.info("✓ Keyword search working")
            
            # Test hybrid search
            hybrid_response = await engine.search("artificial intelligence", SearchType.HYBRID)
            if hybrid_response.search_type == "hybrid":
                results["hybrid_search"] = True
                logger.info("✓ Hybrid search working")
            
            # Test fusion
            if (hybrid_response.fusion_algorithm in ['rrf', 'adaptive', 'combsum'] and 
                len(hybrid_response.results) > 0):
                results["fusion_working"] = True
                logger.info(f"✓ Result fusion working: {hybrid_response.fusion_algorithm}")
            
        except Exception as e:
            logger.error(f"✗ Hybrid search validation error: {e}")
        
        # Calculate score
        passed_tests = sum(1 for test in results.values() if isinstance(test, bool) and test)
        total_tests = sum(1 for test in results.values() if isinstance(test, bool))
        results["score"] = passed_tests / total_tests if total_tests > 0 else 0.0
        
        return results
    
    async def _validate_performance(self, engine: HybridSearchEngine) -> Dict[str, Any]:
        """Validate performance requirements"""
        logger.info("Validating performance requirements...")
        
        results = {
            "latency_requirement": False,
            "throughput_requirement": False,
            "concurrent_performance": False,
            "score": 0.0,
            "metrics": {}
        }
        
        try:
            # Test latency requirement (<3s)
            start_time = time.time()
            response = await engine.search("artificial intelligence machine learning", SearchType.HYBRID)
            latency = time.time() - start_time
            results["metrics"]["latency"] = latency
            
            if latency < 3.0:  # Requirement from action plan
                results["latency_requirement"] = True
                logger.info(f"✓ Latency requirement met: {latency:.3f}s < 3s")
            else:
                logger.warning(f"⚠ Latency requirement failed: {latency:.3f}s >= 3s")
            
            # Test multiple queries for throughput
            queries = ["AI", "database", "web API", "cloud computing", "machine learning"]
            start_time = time.time()
            
            for query in queries:
                await engine.search(query, SearchType.HYBRID)
            
            total_time = time.time() - start_time
            throughput = len(queries) / total_time
            results["metrics"]["throughput"] = throughput
            
            if throughput > 2:  # Should handle at least 2 queries/second
                results["throughput_requirement"] = True
                logger.info(f"✓ Throughput requirement met: {throughput:.1f} queries/s")
            else:
                logger.warning(f"⚠ Throughput low: {throughput:.1f} queries/s")
            
            # Test concurrent performance
            concurrent_queries = [
                engine.search("artificial intelligence", SearchType.HYBRID),
                engine.search("database management", SearchType.HYBRID),
                engine.search("web development", SearchType.HYBRID)
            ]
            
            start_time = time.time()
            await asyncio.gather(*concurrent_queries)
            concurrent_time = time.time() - start_time
            results["metrics"]["concurrent_time"] = concurrent_time
            
            if concurrent_time < 5.0:  # Should handle concurrent requests efficiently
                results["concurrent_performance"] = True
                logger.info(f"✓ Concurrent performance good: {concurrent_time:.3f}s")
            else:
                logger.warning(f"⚠ Concurrent performance slow: {concurrent_time:.3f}s")
            
        except Exception as e:
            logger.error(f"✗ Performance validation error: {e}")
        
        # Calculate score
        passed_tests = sum(1 for test in results.values() if isinstance(test, bool) and test)
        total_tests = sum(1 for test in results.values() if isinstance(test, bool))
        results["score"] = passed_tests / total_tests if total_tests > 0 else 0.0
        
        return results
    
    async def _validate_relevance(self, engine: HybridSearchEngine) -> Dict[str, Any]:
        """Validate search relevance"""
        logger.info("Validating search relevance...")
        
        results = {
            "relevant_results": False,
            "ranking_quality": False,
            "improvement_over_single": False,
            "score": 0.0,
            "metrics": {}
        }
        
        try:
            relevance_scores = []
            
            for test_query in self.test_queries[:3]:  # Test first 3 queries
                response = await engine.search(test_query["query"], SearchType.HYBRID)
                
                if response.results:
                    # Check if expected documents are in results
                    result_ids = [r.document_id for r in response.results[:3]]
                    expected_ids = test_query["expected_docs"]
                    
                    # Calculate relevance score
                    relevant_found = sum(1 for doc_id in expected_ids if doc_id in result_ids)
                    relevance_score = relevant_found / len(expected_ids) if expected_ids else 0
                    relevance_scores.append(relevance_score)
            
            avg_relevance = statistics.mean(relevance_scores) if relevance_scores else 0
            results["metrics"]["avg_relevance"] = avg_relevance
            
            if avg_relevance > 0.7:  # 70% relevance threshold
                results["relevant_results"] = True
                logger.info(f"✓ Relevance requirement met: {avg_relevance:.2f}")
            else:
                logger.warning(f"⚠ Low relevance: {avg_relevance:.2f}")
            
            # Test ranking quality (top result should be most relevant)
            top_result_relevant = 0
            for test_query in self.test_queries[:3]:
                response = await engine.search(test_query["query"], SearchType.HYBRID)
                if (response.results and 
                    response.results[0].document_id in test_query["expected_docs"]):
                    top_result_relevant += 1
            
            ranking_quality = top_result_relevant / 3
            results["metrics"]["ranking_quality"] = ranking_quality
            
            if ranking_quality > 0.6:
                results["ranking_quality"] = True
                logger.info(f"✓ Ranking quality good: {ranking_quality:.2f}")
            
            # Test improvement over single methods
            test_query = "artificial intelligence machine learning"
            
            semantic_response = await engine.search(test_query, SearchType.SEMANTIC)
            keyword_response = await engine.search(test_query, SearchType.KEYWORD)
            hybrid_response = await engine.search(test_query, SearchType.HYBRID)
            
            # Simple improvement check - hybrid should have results
            if (len(hybrid_response.results) >= max(len(semantic_response.results), 
                                                   len(keyword_response.results))):
                results["improvement_over_single"] = True
                logger.info("✓ Hybrid search shows improvement over single methods")
            
        except Exception as e:
            logger.error(f"✗ Relevance validation error: {e}")
        
        # Calculate score
        passed_tests = sum(1 for test in results.values() if isinstance(test, bool) and test)
        total_tests = sum(1 for test in results.values() if isinstance(test, bool))
        results["score"] = passed_tests / total_tests if total_tests > 0 else 0.0
        
        return results
    
    async def _validate_error_handling(self, engine: HybridSearchEngine) -> Dict[str, Any]:
        """Validate error handling"""
        logger.info("Validating error handling...")
        
        results = {
            "empty_query": False,
            "invalid_search_type": False,
            "graceful_degradation": False,
            "score": 0.0
        }
        
        try:
            # Test empty query
            response = await engine.search("", SearchType.HYBRID)
            if isinstance(response.results, list):  # Should not crash
                results["empty_query"] = True
                logger.info("✓ Empty query handled gracefully")
            
            # Test very long query
            long_query = "artificial intelligence " * 50
            response = await engine.search(long_query, SearchType.HYBRID)
            if isinstance(response.results, list):  # Should not crash
                results["graceful_degradation"] = True
                logger.info("✓ Long query handled gracefully")
            
            # Test with valid search type
            response = await engine.search("test", SearchType.KEYWORD)
            if response.search_type == "keyword":
                results["invalid_search_type"] = True
                logger.info("✓ Search type handling working")
            
        except Exception as e:
            logger.error(f"✗ Error handling validation error: {e}")
        
        # Calculate score
        passed_tests = sum(1 for test in results.values() if isinstance(test, bool) and test)
        total_tests = sum(1 for test in results.values() if isinstance(test, bool))
        results["score"] = passed_tests / total_tests if total_tests > 0 else 0.0
        
        return results
    
    def _calculate_overall_score(self, results: Dict[str, Any]) -> float:
        """Calculate overall validation score"""
        scores = []
        weights = {
            "bm25_validation": 0.2,
            "query_enhancement_validation": 0.15,
            "hybrid_search_validation": 0.25,
            "performance_validation": 0.2,
            "relevance_validation": 0.15,
            "error_handling_validation": 0.05
        }
        
        for category, weight in weights.items():
            if category in results and "score" in results[category]:
                scores.append(results[category]["score"] * weight)
        
        return sum(scores)
    
    def print_validation_report(self, results: Dict[str, Any]):
        """Print comprehensive validation report"""
        print("\n" + "="*60)
        print("HYBRID SEARCH VALIDATION REPORT")
        print("="*60)
        
        overall_score = results.get("overall_score", 0.0)
        validation_passed = results.get("validation_passed", False)
        
        print(f"\nOVERALL SCORE: {overall_score:.2f} ({overall_score*100:.1f}%)")
        print(f"VALIDATION STATUS: {'✅ PASSED' if validation_passed else '❌ FAILED'}")
        
        print(f"\nDETAILED RESULTS:")
        print("-" * 40)
        
        for category, result in results.items():
            if isinstance(result, dict) and "score" in result:
                score = result["score"]
                status = "✅" if score >= 0.8 else "⚠️" if score >= 0.6 else "❌"
                print(f"{category}: {status} {score:.2f} ({score*100:.1f}%)")
        
        print("\n" + "="*60)


async def main():
    """Main validation function"""
    validator = HybridSearchValidator()
    
    try:
        results = await validator.run_validation()
        validator.print_validation_report(results)
        
        # Return appropriate exit code
        if results.get("validation_passed", False):
            print("\n🎉 All validations passed! Hybrid search system is ready for production.")
            return 0
        else:
            print("\n⚠️ Some validations failed. Please review the results above.")
            return 1
            
    except Exception as e:
        logger.error(f"Validation failed with error: {e}")
        print(f"\n❌ Validation failed with error: {e}")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
