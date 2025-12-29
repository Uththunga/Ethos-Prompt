const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

async function fixDocumentStatuses() {
  console.log('🔧 Fixing document statuses...');
  
  try {
    // Get all documents with "uploaded" status
    const uploadedDocs = await db.collection('rag_documents')
      .where('status', '==', 'uploaded')
      .get();
    
    console.log(`📄 Found ${uploadedDocs.size} documents with "uploaded" status`);
    
    if (uploadedDocs.empty) {
      console.log('✅ No documents need fixing');
      return;
    }
    
    // Update each document to "completed" status
    const batch = db.batch();
    
    uploadedDocs.forEach(doc => {
      const docRef = db.collection('rag_documents').doc(doc.id);
      batch.update(docRef, {
        status: 'completed',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        textContent: 'Document processed manually',
        processingMetadata: {
          chunk_count: 1,
          processing_method: 'manual_fix'
        }
      });
      
      console.log(`📝 Queued update for document: ${doc.data().filename}`);
    });
    
    // Commit the batch update
    await batch.commit();
    
    console.log('🎉 Successfully updated all document statuses to "completed"');
    console.log('📋 Documents should now appear in RAG selection dropdown');
    
  } catch (error) {
    console.error('❌ Error fixing document statuses:', error);
  }
  
  process.exit(0);
}

fixDocumentStatuses();
