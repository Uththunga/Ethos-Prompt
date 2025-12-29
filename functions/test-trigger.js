const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

async function testDocumentTrigger() {
  console.log('🧪 Testing document trigger...');
  
  try {
    // Create a test document in rag_documents collection
    const testDoc = {
      filename: 'test-trigger.txt',
      originalName: 'test-trigger.txt',
      filePath: 'test/test-trigger.txt',
      downloadURL: 'https://example.com/test.txt',
      uploadedBy: 'test-user-id',
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      size: 100,
      type: 'text/plain',
      status: 'uploaded',
      processingStartedAt: null,
      processedAt: null,
      chunks: [],
      metadata: {
        originalSize: 100,
        contentType: 'text/plain'
      }
    };

    console.log('📝 Creating test document in rag_documents collection...');
    const docRef = await db.collection('rag_documents').add(testDoc);
    console.log('✅ Test document created with ID:', docRef.id);
    
    console.log('⏳ Waiting 15 seconds for function to trigger...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Check if the document status was updated by the function
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('📊 Document status after trigger:', updatedData.status);
    console.log('📊 Full document data:', JSON.stringify(updatedData, null, 2));
    
    if (updatedData.status === 'completed') {
      console.log('🎉 SUCCESS: Function triggered and processed the document!');
    } else if (updatedData.status === 'processing') {
      console.log('⏳ Document is still processing...');
    } else if (updatedData.status === 'failed') {
      console.log('❌ Document processing failed:', updatedData.error);
    } else {
      console.log('⚠️  Function may not have triggered - status still "uploaded"');
    }
    
    // Clean up test document
    await docRef.delete();
    console.log('🧹 Test document cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testDocumentTrigger();
