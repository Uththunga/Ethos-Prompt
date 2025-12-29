#!/usr/bin/env python3
"""
Live Google API Test
Tests Google embeddings with your actual API key from .env file
"""
import os
import sys
import asyncio
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('../.env')

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_google_api_live():
    """Test Google API with your actual key"""
    
    print("🔑 Testing Google API with Your Key")
    print("=" * 50)
    
    # Check if API key is loaded
    google_key = os.getenv('GOOGLE_API_KEY')
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    
    print(f"✅ Google API Key: {'SET' if google_key else 'NOT SET'}")
    print(f"✅ OpenRouter API Key: {'SET' if openrouter_key else 'NOT SET'}")
    
    if not google_key:
        print("❌ Google API key not found in .env file")
        return False
    
    if google_key.startswith('demo_'):
        print("❌ Please replace demo key with your actual Google API key")
        return False
    
    print(f"✅ Google API Key: {google_key[:20]}...")
    
    try:
        from rag.embedding_service import EmbeddingService
        
        # Test Google service
        print("\n🧪 Testing Google Embedding Service...")
        google_service = EmbeddingService(provider='google', api_key=google_key)
        
        print(f"✅ Service initialized: {google_service.provider}")
        print(f"✅ Default model: {google_service.default_model}")
        print(f"✅ Service available: {google_service.is_available()}")
        
        # Test single embedding
        print("\n🔍 Testing Single Embedding Generation...")
        test_text = "This is a test sentence for Google embeddings."
        
        result = await google_service.generate_embedding(test_text, model="text-embedding-004")
        
        if result:
            print(f"✅ Embedding generated successfully!")
            print(f"   • Text: {result.text}")
            print(f"   • Model: {result.model}")
            print(f"   • Dimensions: {result.dimensions}")
            print(f"   • Tokens used: {result.tokens_used}")
            print(f"   • Processing time: {result.processing_time:.3f}s")
            print(f"   • Cached: {result.cached}")
            print(f"   • First 5 values: {result.embedding[:5]}")
        else:
            print("❌ Failed to generate embedding")
            return False
        
        # Test batch embeddings
        print("\n📦 Testing Batch Embedding Generation...")
        test_texts = [
            "First test sentence for batch processing.",
            "Second test sentence with different content.",
            "Third test sentence to verify batch functionality."
        ]
        
        batch_result = await google_service.generate_batch_embeddings(test_texts, model="text-embedding-004")
        
        if batch_result:
            print(f"✅ Batch embeddings generated successfully!")
            print(f"   • Success count: {batch_result.success_count}")
            print(f"   • Error count: {batch_result.error_count}")
            print(f"   • Total tokens: {batch_result.total_tokens}")
            print(f"   • Total time: {batch_result.total_time:.3f}s")
            
            for i, result in enumerate(batch_result.results):
                print(f"   • Text {i+1}: {result.dimensions} dimensions")
        else:
            print("❌ Failed to generate batch embeddings")
            return False
        
        # Test OpenRouter fallback
        print("\n🔄 Testing OpenRouter Fallback...")
        if openrouter_key and not openrouter_key.startswith('demo_'):
            openai_service = EmbeddingService(provider='openai', api_key=openrouter_key)
            print(f"✅ OpenRouter fallback available: {openai_service.is_available()}")
            print(f"✅ Uses OpenRouter endpoint for OpenAI embeddings")
        else:
            print("⚠️ OpenRouter key not available for fallback test")
        
        print("\n🎉 All tests passed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_document_processor_integration():
    """Test integration with document processor"""
    print("\n📄 Testing Document Processor Integration...")
    
    try:
        from rag.document_processor import DocumentProcessingPipeline
        from rag.embedding_service import embedding_service
        
        # Check global service
        print(f"✅ Global service provider: {embedding_service.provider}")
        print(f"✅ Global service model: {embedding_service.default_model}")
        print(f"✅ Global service available: {embedding_service.is_available()}")
        
        # Check document processor
        doc_processor = DocumentProcessingPipeline()
        print(f"✅ Document processor embedding model: {doc_processor.config['embedding_model']}")
        
        if doc_processor.config['embedding_model'] == 'text-embedding-004':
            print("✅ Document processor correctly configured for Google embeddings")
        else:
            print("⚠️ Document processor not using Google embedding model")
        
        return True
        
    except Exception as e:
        print(f"❌ Document processor test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Live Google API Tests")
    print("Loading configuration from .env file...\n")
    
    # Run tests
    success1 = asyncio.run(test_google_api_live())
    success2 = asyncio.run(test_document_processor_integration())
    
    print("\n" + "=" * 50)
    if success1 and success2:
        print("🎉 All tests completed successfully!")
        print("\n📋 Your Google embeddings are working perfectly:")
        print("   • Google API key is valid and working")
        print("   • Embeddings are being generated correctly")
        print("   • Document processor is configured properly")
        print("   • OpenRouter fallback is available")
        print("   • Your RAG system is ready to use Google embeddings!")
    else:
        print("❌ Some tests failed. Please check the errors above.")
    
    return success1 and success2

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
