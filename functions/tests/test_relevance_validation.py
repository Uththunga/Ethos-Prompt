"""
Relevance Validation Tests for Hybrid Search System
"""
import pytest
import asyncio
import statistics
from typing import List, Dict, Any, Tuple

from src.rag.bm25_search_engine import EnhancedBM25SearchEngine, Document
from src.rag.hybrid_search_engine import HybridSearchEngine, SearchType
from src.rag.result_fusion import ReciprocalRankFusion

class TestSearchRelevance:
    """Tests to validate search relevance and quality"""
    
    @pytest.fixture
    def relevance_test_documents(self) -> List[Document]:
        """Curated documents for relevance testing"""
        return [
            # AI/ML Documents (highly relevant to AI queries)
            Document(
                id="ai_1",
                content="Artificial intelligence (AI) is a branch of computer science that aims to create "
                        "intelligent machines. Machine learning is a subset of AI that enables computers "
                        "to learn and improve from experience without being explicitly programmed.",
                metadata={"filename": "ai_introduction.txt", "category": "ai", "relevance_score": 1.0}
            ),
            Document(
                id="ai_2", 
                content="Deep learning is a machine learning technique based on artificial neural networks. "
                        "Convolutional neural networks (CNNs) are particularly effective for image recognition "
                        "and computer vision tasks.",
                metadata={"filename": "deep_learning.txt", "category": "ai", "relevance_score": 0.9}
            ),
            Document(
                id="ai_3",
                content="Natural language processing (NLP) enables computers to understand, interpret, "
                        "and generate human language. Modern NLP uses transformer architectures and "
                        "attention mechanisms for better language understanding.",
                metadata={"filename": "nlp_overview.txt", "category": "ai", "relevance_score": 0.8}
            ),
            
            # Database Documents (relevant to database queries)
            Document(
                id="db_1",
                content="Database management systems (DBMS) are software applications that interact with "
                        "users, applications, and the database to capture and analyze data. SQL is the "
                        "standard language for relational database management.",
                metadata={"filename": "database_intro.txt", "category": "database", "relevance_score": 1.0}
            ),
            Document(
                id="db_2",
                content="NoSQL databases provide flexible data models for modern applications. Document "
                        "databases, key-value stores, and graph databases offer alternatives to traditional "
                        "relational databases for specific use cases.",
                metadata={"filename": "nosql_guide.txt", "category": "database", "relevance_score": 0.9}
            ),
            
            # Web Development Documents
            Document(
                id="web_1",
                content="Web development involves creating websites and web applications. Frontend development "
                        "focuses on user interfaces using HTML, CSS, and JavaScript. Backend development "
                        "handles server-side logic and database interactions.",
                metadata={"filename": "web_dev_basics.txt", "category": "web", "relevance_score": 1.0}
            ),
            Document(
                id="web_2",
                content="RESTful APIs provide a standardized way for applications to communicate over HTTP. "
                        "API endpoints use HTTP methods like GET, POST, PUT, and DELETE to perform operations "
                        "on resources.",
                metadata={"filename": "rest_api_guide.txt", "category": "web", "relevance_score": 0.8}
            ),
            
            # Partially Relevant Documents
            Document(
                id="mixed_1",
                content="Cloud computing platforms provide infrastructure for deploying applications. "
                        "Many cloud services include machine learning capabilities and database services "
                        "for modern application development.",
                metadata={"filename": "cloud_computing.txt", "category": "mixed", "relevance_score": 0.5}
            ),
            
            # Low Relevance Documents
            Document(
                id="irrelevant_1",
                content="Cooking recipes and culinary techniques have evolved over centuries. Traditional "
                        "cooking methods are being supplemented by modern kitchen appliances and techniques "
                        "for food preparation.",
                metadata={"filename": "cooking_guide.txt", "category": "cooking", "relevance_score": 0.0}
            ),
            Document(
                id="irrelevant_2",
                content="Gardening involves growing plants for food, medicine, or decorative purposes. "
                        "Soil preparation, watering schedules, and pest control are important aspects "
                        "of successful gardening.",
                metadata={"filename": "gardening_tips.txt", "category": "gardening", "relevance_score": 0.0}
            )
        ]
    
    @pytest.fixture
    async def relevance_hybrid_engine(self, relevance_test_documents) -> HybridSearchEngine:
        """Initialize hybrid engine with relevance test documents"""
        engine = HybridSearchEngine()
        await engine.index_documents(relevance_test_documents)
        return engine
    
    def calculate_relevance_metrics(self, results: List[Any], query_category: str, 
                                  relevance_test_documents: List[Document]) -> Dict[str, float]:
        """Calculate relevance metrics for search results"""
        if not results:
            return {"precision": 0.0, "recall": 0.0, "f1": 0.0, "ndcg": 0.0}
        
        # Create relevance mapping
        doc_relevance = {doc.id: doc.metadata.get("relevance_score", 0.0) 
                        for doc in relevance_test_documents}
        
        # Calculate precision (relevant results / total results)
        relevant_results = sum(1 for r in results if doc_relevance.get(r.document_id, 0) > 0.5)
        precision = relevant_results / len(results) if results else 0.0
        
        # Calculate recall (relevant results found / total relevant documents)
        total_relevant = sum(1 for doc in relevance_test_documents 
                           if doc.metadata.get("relevance_score", 0) > 0.5)
        recall = relevant_results / total_relevant if total_relevant > 0 else 0.0
        
        # Calculate F1 score
        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        
        # Calculate NDCG (Normalized Discounted Cumulative Gain)
        dcg = 0.0
        for i, result in enumerate(results[:10]):  # Top 10 results
            relevance = doc_relevance.get(result.document_id, 0.0)
            dcg += relevance / (1 + i)  # Simple DCG formula
        
        # Ideal DCG (if results were perfectly ordered)
        ideal_relevances = sorted([doc.metadata.get("relevance_score", 0.0) 
                                 for doc in relevance_test_documents], reverse=True)[:10]
        idcg = sum(rel / (1 + i) for i, rel in enumerate(ideal_relevances))
        
        ndcg = dcg / idcg if idcg > 0 else 0.0
        
        return {
            "precision": precision,
            "recall": recall,
            "f1": f1,
            "ndcg": ndcg
        }
    
    @pytest.mark.asyncio
    async def test_ai_query_relevance(self, relevance_hybrid_engine, relevance_test_documents):
        """Test relevance for AI-related queries"""
        ai_queries = [
            "artificial intelligence machine learning",
            "deep learning neural networks",
            "natural language processing",
            "AI algorithms",
            "machine learning models"
        ]
        
        all_metrics = []
        
        for query in ai_queries:
            # Test hybrid search
            response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            metrics = self.calculate_relevance_metrics(
                response.results, "ai", relevance_test_documents
            )
            all_metrics.append(metrics)
            
            # AI documents should rank highly
            top_result_ids = [r.document_id for r in response.results[:3]]
            ai_docs_in_top3 = sum(1 for doc_id in top_result_ids if doc_id.startswith("ai_"))
            
            assert ai_docs_in_top3 >= 1, f"No AI documents in top 3 for query: {query}"
            assert metrics["precision"] > 0.5, f"Low precision {metrics['precision']:.2f} for query: {query}"
        
        # Average metrics across all AI queries
        avg_metrics = {
            metric: statistics.mean([m[metric] for m in all_metrics])
            for metric in all_metrics[0].keys()
        }
        
        # AI queries should have good relevance metrics
        assert avg_metrics["precision"] > 0.7, f"Average precision {avg_metrics['precision']:.2f} too low"
        assert avg_metrics["recall"] > 0.6, f"Average recall {avg_metrics['recall']:.2f} too low"
        assert avg_metrics["f1"] > 0.6, f"Average F1 {avg_metrics['f1']:.2f} too low"
        
        print(f"AI Query Relevance Metrics:")
        for metric, value in avg_metrics.items():
            print(f"  {metric}: {value:.3f}")
    
    @pytest.mark.asyncio
    async def test_database_query_relevance(self, relevance_hybrid_engine, relevance_test_documents):
        """Test relevance for database-related queries"""
        db_queries = [
            "database management systems",
            "SQL queries",
            "NoSQL databases",
            "data storage",
            "database design"
        ]
        
        all_metrics = []
        
        for query in db_queries:
            response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            metrics = self.calculate_relevance_metrics(
                response.results, "database", relevance_test_documents
            )
            all_metrics.append(metrics)
            
            # Database documents should rank highly
            top_result_ids = [r.document_id for r in response.results[:3]]
            db_docs_in_top3 = sum(1 for doc_id in top_result_ids if doc_id.startswith("db_"))
            
            assert db_docs_in_top3 >= 1, f"No database documents in top 3 for query: {query}"
        
        avg_metrics = {
            metric: statistics.mean([m[metric] for m in all_metrics])
            for metric in all_metrics[0].keys()
        }
        
        assert avg_metrics["precision"] > 0.6, f"Database precision {avg_metrics['precision']:.2f} too low"
        
        print(f"Database Query Relevance Metrics:")
        for metric, value in avg_metrics.items():
            print(f"  {metric}: {value:.3f}")
    
    @pytest.mark.asyncio
    async def test_hybrid_vs_single_method_relevance(self, relevance_hybrid_engine, relevance_test_documents):
        """Test that hybrid search improves relevance over single methods"""
        test_queries = [
            "artificial intelligence machine learning",
            "database management SQL",
            "web development APIs"
        ]
        
        hybrid_better_count = 0
        total_comparisons = 0
        
        for query in test_queries:
            # Get results from all search types
            semantic_response = await relevance_hybrid_engine.search(query, SearchType.SEMANTIC)
            keyword_response = await relevance_hybrid_engine.search(query, SearchType.KEYWORD)
            hybrid_response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            
            # Calculate metrics for each
            semantic_metrics = self.calculate_relevance_metrics(
                semantic_response.results, "mixed", relevance_test_documents
            )
            keyword_metrics = self.calculate_relevance_metrics(
                keyword_response.results, "mixed", relevance_test_documents
            )
            hybrid_metrics = self.calculate_relevance_metrics(
                hybrid_response.results, "mixed", relevance_test_documents
            )
            
            # Check if hybrid is better than at least one single method
            if (hybrid_metrics["f1"] >= semantic_metrics["f1"] or 
                hybrid_metrics["f1"] >= keyword_metrics["f1"]):
                hybrid_better_count += 1
            
            total_comparisons += 1
            
            print(f"Query: {query}")
            print(f"  Semantic F1: {semantic_metrics['f1']:.3f}")
            print(f"  Keyword F1: {keyword_metrics['f1']:.3f}")
            print(f"  Hybrid F1: {hybrid_metrics['f1']:.3f}")
        
        # Hybrid should be better or equal in most cases
        improvement_rate = hybrid_better_count / total_comparisons
        assert improvement_rate >= 0.7, \
               f"Hybrid search only better in {improvement_rate:.1%} of cases"
    
    @pytest.mark.asyncio
    async def test_irrelevant_query_handling(self, relevance_hybrid_engine):
        """Test handling of queries with no relevant documents"""
        irrelevant_queries = [
            "cooking recipes ingredients",
            "gardening plants flowers",
            "sports football basketball",
            "music instruments piano guitar"
        ]
        
        for query in irrelevant_queries:
            response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            
            # Should return some results but with low scores
            if response.results:
                top_score = response.results[0].score
                assert top_score < 0.7, \
                       f"Irrelevant query '{query}' returned high score {top_score:.2f}"
            
            # Should not crash or return errors
            assert isinstance(response.results, list)
    
    @pytest.mark.asyncio
    async def test_query_intent_impact_on_relevance(self, relevance_hybrid_engine, relevance_test_documents):
        """Test that query intent affects search relevance appropriately"""
        # Factual queries (should favor exact matches)
        factual_queries = [
            "what is artificial intelligence",
            "define machine learning",
            "explain neural networks"
        ]
        
        # Exploratory queries (should favor broader context)
        exploratory_queries = [
            "artificial intelligence applications",
            "machine learning in business",
            "neural network architectures"
        ]
        
        factual_metrics = []
        exploratory_metrics = []
        
        for query in factual_queries:
            response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            metrics = self.calculate_relevance_metrics(
                response.results, "ai", relevance_test_documents
            )
            factual_metrics.append(metrics)
        
        for query in exploratory_queries:
            response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            metrics = self.calculate_relevance_metrics(
                response.results, "ai", relevance_test_documents
            )
            exploratory_metrics.append(metrics)
        
        # Both should have reasonable performance
        avg_factual_f1 = statistics.mean([m["f1"] for m in factual_metrics])
        avg_exploratory_f1 = statistics.mean([m["f1"] for m in exploratory_metrics])
        
        assert avg_factual_f1 > 0.5, f"Factual query F1 {avg_factual_f1:.2f} too low"
        assert avg_exploratory_f1 > 0.5, f"Exploratory query F1 {avg_exploratory_f1:.2f} too low"
        
        print(f"Intent-based relevance:")
        print(f"  Factual queries F1: {avg_factual_f1:.3f}")
        print(f"  Exploratory queries F1: {avg_exploratory_f1:.3f}")
    
    @pytest.mark.asyncio
    async def test_spell_correction_relevance_impact(self, relevance_hybrid_engine, relevance_test_documents):
        """Test that spell correction improves relevance"""
        correct_queries = [
            "artificial intelligence",
            "machine learning",
            "database management"
        ]
        
        misspelled_queries = [
            "artifical inteligence",
            "machien lerning", 
            "databse managment"
        ]
        
        correct_metrics = []
        misspelled_metrics = []
        
        for query in correct_queries:
            response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            metrics = self.calculate_relevance_metrics(
                response.results, "mixed", relevance_test_documents
            )
            correct_metrics.append(metrics)
        
        for query in misspelled_queries:
            response = await relevance_hybrid_engine.search(query, SearchType.HYBRID)
            metrics = self.calculate_relevance_metrics(
                response.results, "mixed", relevance_test_documents
            )
            misspelled_metrics.append(metrics)
        
        # Misspelled queries should still achieve reasonable relevance due to correction
        avg_correct_f1 = statistics.mean([m["f1"] for m in correct_metrics])
        avg_misspelled_f1 = statistics.mean([m["f1"] for m in misspelled_metrics])
        
        # Misspelled should be at least 70% as good as correct
        relevance_retention = avg_misspelled_f1 / avg_correct_f1 if avg_correct_f1 > 0 else 0
        assert relevance_retention > 0.7, \
               f"Spell correction only retains {relevance_retention:.1%} of relevance"
        
        print(f"Spell correction impact:")
        print(f"  Correct queries F1: {avg_correct_f1:.3f}")
        print(f"  Misspelled queries F1: {avg_misspelled_f1:.3f}")
        print(f"  Relevance retention: {relevance_retention:.1%}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
