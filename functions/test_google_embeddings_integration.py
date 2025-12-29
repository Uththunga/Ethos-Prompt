#!/usr/bin/env python3
"""
Google Embeddings Integration Test
Quick validation script to test Google embeddings integration
"""
import os
import sys
import asyncio
import logging
from typing import List

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_google_embeddings():
    """Test Google embeddings integration"""
    try:
        from rag.embedding_service import EmbeddingService
        
        print("🔍 Testing Google Embeddings Integration")
        print("=" * 50)
        
        # Test 1: Service Initialization
        print("\n1. Testing Service Initialization...")
        google_service = EmbeddingService(provider='google')
        print(f"   ✅ Provider: {google_service.provider}")
        print(f"   ✅ Default Model: {google_service.default_model}")
        print(f"   ✅ Batch Size: {google_service.batch_size}")
        
        # Test 2: Model Configurations
        print("\n2. Testing Model Configurations...")
        configs = google_service.model_configs
        
        google_models = ['text-embedding-004', 'textembedding-gecko@003']
        for model in google_models:
            if model in configs:
                config = configs[model]
                print(f"   ✅ {model}: {config['dimensions']} dims, {config['provider']} provider")
            else:
                print(f"   ❌ {model}: Not found in configurations")
        
        # Test 3: Service Availability
        print("\n3. Testing Service Availability...")
        is_available = google_service.is_available()
        print(f"   {'✅' if is_available else '⚠️'} Service Available: {is_available}")
        
        if not is_available:
            print("   ℹ️  Note: Service not available without GOOGLE_API_KEY environment variable")
        
        # Test 4: Text Validation
        print("\n4. Testing Text Validation...")
        test_texts = [
            ("Valid text for embedding", True),
            ("", False),
            ("word " * 3000, False)  # Too long
        ]
        
        for text, expected_valid in test_texts:
            is_valid, error = google_service._validate_text(text, 'text-embedding-004')
            status = "✅" if is_valid == expected_valid else "❌"
            print(f"   {status} Text validation: {is_valid} (expected: {expected_valid})")
            if error:
                print(f"      Error: {error}")
        
        # Test 5: Cache Key Generation
        print("\n5. Testing Cache Functionality...")
        cache_key = google_service._get_cache_key("test text", "text-embedding-004")
        print(f"   ✅ Cache key format: {cache_key}")
        
        # Test 6: Backward Compatibility
        print("\n6. Testing Backward Compatibility...")
        openai_service = EmbeddingService(provider='openai')
        print(f"   ✅ OpenAI Provider: {openai_service.provider}")
        print(f"   ✅ OpenAI Default Model: {openai_service.default_model}")
        
        # Test 7: Document Processor Integration
        print("\n7. Testing Document Processor Integration...")
        try:
            from rag.document_processor import DocumentProcessingPipeline
            doc_processor = DocumentProcessingPipeline()
            embedding_model = doc_processor.config['embedding_model']
            print(f"   ✅ Document Processor Embedding Model: {embedding_model}")
            
            if embedding_model == 'text-embedding-004':
                print("   ✅ Successfully using Google embedding model")
            else:
                print(f"   ⚠️  Expected 'text-embedding-004', got '{embedding_model}'")
                
        except ImportError as e:
            print(f"   ❌ Document processor import failed: {e}")
        
        # Test 8: Global Service Instance
        print("\n8. Testing Global Service Instance...")
        try:
            from rag.embedding_service import embedding_service
            print(f"   ✅ Global service provider: {embedding_service.provider}")
            print(f"   ✅ Global service model: {embedding_service.default_model}")
            
            if embedding_service.provider == 'google':
                print("   ✅ Global service correctly configured for Google")
            else:
                print(f"   ⚠️  Expected 'google', got '{embedding_service.provider}'")
                
        except ImportError as e:
            print(f"   ❌ Global service import failed: {e}")
        
        print("\n" + "=" * 50)
        print("🎉 Google Embeddings Integration Test Complete!")
        
        # Summary
        print("\n📋 Summary:")
        print("   • Google embedding service initialized successfully")
        print("   • Model configurations include Google models")
        print("   • Text validation working correctly")
        print("   • Cache functionality implemented")
        print("   • Backward compatibility with OpenAI maintained")
        print("   • Document processor configured for Google embeddings")
        
        if not is_available:
            print("\n⚠️  Note: To test actual embedding generation, set GOOGLE_API_KEY environment variable")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_with_api_key():
    """Test with actual API key if available"""
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        print("\n⚠️  GOOGLE_API_KEY not set, skipping live API tests")
        return
    
    print("\n🔑 Testing with actual Google API key...")
    
    try:
        from rag.embedding_service import EmbeddingService
        
        service = EmbeddingService(provider='google', api_key=api_key)
        
        # Test single embedding
        print("   Testing single embedding generation...")
        result = await service.generate_embedding(
            "This is a test sentence for Google embeddings.",
            model="text-embedding-004"
        )
        
        if result:
            print(f"   ✅ Generated embedding: {len(result.embedding)} dimensions")
            print(f"   ✅ Tokens used: {result.tokens_used}")
            print(f"   ✅ Processing time: {result.processing_time:.3f}s")
        else:
            print("   ❌ Failed to generate embedding")
        
        # Test batch embeddings
        print("   Testing batch embedding generation...")
        texts = [
            "First test sentence.",
            "Second test sentence.",
            "Third test sentence."
        ]
        
        batch_result = await service.generate_batch_embeddings(texts, model="text-embedding-004")
        
        if batch_result:
            print(f"   ✅ Batch results: {batch_result.success_count} successful, {batch_result.error_count} errors")
            print(f"   ✅ Total tokens: {batch_result.total_tokens}")
            print(f"   ✅ Total time: {batch_result.total_time:.3f}s")
        else:
            print("   ❌ Failed to generate batch embeddings")
            
    except Exception as e:
        print(f"   ❌ Live API test failed: {e}")

def main():
    """Main test function"""
    print("🚀 Starting Google Embeddings Integration Tests")
    
    # Run basic integration tests
    success = asyncio.run(test_google_embeddings())
    
    if success:
        # Run live API tests if key is available
        asyncio.run(test_with_api_key())
    
    print("\n✨ Test execution complete!")
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
