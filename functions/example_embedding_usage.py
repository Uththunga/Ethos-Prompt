#!/usr/bin/env python3
"""
Example: How Google Embeddings with OpenRouter Fallback Works
Demonstrates where and how the embedding service is used in the RAG system
"""
import os
import sys
import asyncio
import logging

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def demonstrate_embedding_usage():
    """Show where and how embeddings are used in the system"""
    
    print("🔍 Google Embeddings with OpenRouter Fallback - Usage Examples")
    print("=" * 70)
    
    # 1. AUTOMATIC USAGE - Global Service Instance
    print("\n1. 📋 AUTOMATIC USAGE - Document Processing Pipeline")
    print("-" * 50)
    
    try:
        from rag.embedding_service import embedding_service
        from rag.document_processor import DocumentProcessingPipeline
        
        print(f"✅ Global embedding service provider: {embedding_service.provider}")
        print(f"✅ Default model: {embedding_service.default_model}")
        print(f"✅ Service available: {embedding_service.is_available()}")
        
        # Document processor automatically uses the global service
        doc_processor = DocumentProcessingPipeline()
        print(f"✅ Document processor embedding model: {doc_processor.config['embedding_model']}")
        
        print("\n   📝 How it works:")
        print("   • Document processor imports: from .embedding_service import embedding_service")
        print("   • Calls: await embedding_service.generate_batch_embeddings(chunk_texts)")
        print("   • Uses Google embeddings by default")
        print("   • Falls back to OpenRouter→OpenAI if Google fails")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 2. MANUAL USAGE - Direct Service Creation
    print("\n2. 🔧 MANUAL USAGE - Direct Service Creation")
    print("-" * 50)
    
    try:
        from rag.embedding_service import EmbeddingService
        
        # Primary: Google embeddings
        google_service = EmbeddingService(provider='google')
        print(f"✅ Google service: {google_service.provider} - {google_service.default_model}")
        
        # Fallback: OpenAI via OpenRouter
        openai_service = EmbeddingService(provider='openai')
        print(f"✅ OpenAI service: {openai_service.provider} - {openai_service.default_model}")
        print(f"✅ Uses OpenRouter endpoint: https://openrouter.ai/api/v1")
        
        print("\n   📝 How fallback works:")
        print("   • If Google API fails → automatically tries OpenAI via OpenRouter")
        print("   • Same OPENROUTER_API_KEY used for both LLM and embedding fallback")
        print("   • No separate OpenAI API key needed")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 3. WHERE IT'S USED - System Integration Points
    print("\n3. 🏗️ WHERE EMBEDDINGS ARE USED - System Integration")
    print("-" * 50)
    
    integration_points = [
        {
            "component": "Document Processing",
            "file": "functions/src/rag/document_processor.py",
            "usage": "await embedding_service.generate_batch_embeddings(chunk_texts)",
            "purpose": "Convert document chunks to embeddings for storage"
        },
        {
            "component": "Semantic Search",
            "file": "functions/src/rag/semantic_search.py",
            "usage": "await embedding_service.generate_embedding(query)",
            "purpose": "Convert search queries to embeddings for similarity matching"
        },
        {
            "component": "Context Retrieval",
            "file": "functions/src/rag/context_retriever.py", 
            "usage": "embedding_result = await embedding_service.generate_embedding(query)",
            "purpose": "Find relevant context for RAG responses"
        },
        {
            "component": "Vector Store",
            "file": "functions/src/rag/vector_store.py",
            "usage": "Receives embeddings from embedding service",
            "purpose": "Store and search embeddings in FAISS/Pinecone"
        }
    ]
    
    for point in integration_points:
        print(f"\n   📍 {point['component']}")
        print(f"      File: {point['file']}")
        print(f"      Usage: {point['usage']}")
        print(f"      Purpose: {point['purpose']}")
    
    # 4. CONFIGURATION - Environment Variables
    print("\n4. ⚙️ CONFIGURATION - Environment Variables")
    print("-" * 50)
    
    env_vars = {
        "GOOGLE_API_KEY": {
            "required": True,
            "purpose": "Primary embedding provider (Google text-embedding-004)",
            "cost": "~$0.00001 per 1K tokens"
        },
        "OPENROUTER_API_KEY": {
            "required": True, 
            "purpose": "LLM access + OpenAI embeddings fallback",
            "cost": "Variable based on model usage"
        },
        "COHERE_API_KEY": {
            "required": True,
            "purpose": "Cohere LLM and reranking (not embeddings)",
            "cost": "Variable based on usage"
        }
    }
    
    for var, info in env_vars.items():
        status = "✅ SET" if os.getenv(var) else "❌ NOT SET"
        required = "REQUIRED" if info["required"] else "OPTIONAL"
        print(f"\n   {status} {var} ({required})")
        print(f"      Purpose: {info['purpose']}")
        print(f"      Cost: {info['cost']}")
    
    # 5. FALLBACK MECHANISM - How it Works
    print("\n5. 🔄 FALLBACK MECHANISM - How it Works")
    print("-" * 50)
    
    print("""
   📋 Automatic Fallback Flow:
   
   1. 🎯 PRIMARY: Google Embeddings
      ├── Uses GOOGLE_API_KEY
      ├── Model: text-embedding-004 (768 dimensions)
      ├── Cost: ~$0.00001 per 1K tokens
      └── Endpoint: https://generativelanguage.googleapis.com/
   
   2. 🔄 FALLBACK: OpenAI via OpenRouter
      ├── Uses OPENROUTER_API_KEY (same as LLM)
      ├── Model: text-embedding-3-small (1536 dimensions)
      ├── Cost: ~$0.00002 per 1K tokens
      └── Endpoint: https://openrouter.ai/api/v1
   
   3. 🚨 TRIGGER CONDITIONS:
      ├── Google API unavailable
      ├── Google API rate limited
      ├── Google API key invalid
      └── Network issues with Google
   
   4. ✅ BENEFITS:
      ├── No service interruption
      ├── Unified API key management
      ├── Cost optimization (Google primary)
      └── High availability
    """)
    
    # 6. TESTING - How to Validate
    print("\n6. 🧪 TESTING - How to Validate")
    print("-" * 50)
    
    print("""
   📋 Test Commands:
   
   # Test implementation (no API keys needed)
   python test_google_embeddings_integration.py
   
   # Test with your API keys
   export GOOGLE_API_KEY="your-google-key"
   export OPENROUTER_API_KEY="your-openrouter-key"
   python test_google_embeddings_integration.py
   
   # Test document processing
   python -c "
   import sys; sys.path.append('src')
   from rag.document_processor import DocumentProcessingPipeline
   proc = DocumentProcessingPipeline()
   print('Embedding model:', proc.config['embedding_model'])
   "
    """)

async def test_fallback_mechanism():
    """Demonstrate the fallback mechanism"""
    print("\n7. 🔬 LIVE FALLBACK DEMONSTRATION")
    print("-" * 50)
    
    try:
        from rag.embedding_service import EmbeddingService
        
        # Test Google service
        google_service = EmbeddingService(provider='google')
        print(f"Google service available: {google_service.is_available()}")
        
        # Test OpenRouter fallback
        openai_service = EmbeddingService(provider='openai')
        print(f"OpenRouter fallback available: {openai_service.is_available()}")
        
        if google_service.is_available():
            print("✅ Primary Google embeddings ready")
        elif openai_service.is_available():
            print("⚠️ Using OpenRouter fallback (Google unavailable)")
        else:
            print("❌ Both services unavailable - check API keys")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")

def main():
    """Main demonstration function"""
    print("🚀 Starting Embedding Usage Demonstration\n")
    
    # Run demonstrations
    asyncio.run(demonstrate_embedding_usage())
    asyncio.run(test_fallback_mechanism())
    
    print("\n" + "=" * 70)
    print("✨ Demonstration Complete!")
    print("\n📋 Summary:")
    print("• Google embeddings are used automatically throughout the RAG system")
    print("• OpenRouter provides fallback using your existing OPENROUTER_API_KEY")
    print("• No separate OpenAI API key needed")
    print("• Fallback is transparent - same API, different provider")
    print("• Cost optimized: Google primary (cheaper), OpenRouter fallback")

if __name__ == "__main__":
    main()
