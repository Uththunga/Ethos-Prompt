"""
Simple Firebase Function for Document Upload - CORS Bypass
"""
import json
import base64
import datetime
import time
from typing import Any, Dict

from firebase_functions import https_fn, options
from firebase_admin import initialize_app, firestore, storage

# Initialize Firebase Admin
initialize_app()

# Initialize Firestore
db = firestore.client()

@https_fn.on_call(
    memory=options.MemoryOption.MB_512,
    timeout_sec=300,  # 5 minutes for file uploads
    cors=options.CorsOptions(
        cors_origins=[
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5000"
        ],
        cors_methods=["GET", "POST", "OPTIONS"]
    )
)
def upload_document_via_function(req: https_fn.CallableRequest) -> Dict[str, Any]:
    """Upload document via Firebase Function to bypass CORS issues"""
    try:
        # Validate request
        if not req.auth:
            raise ValueError("Authentication required")

        user_id = req.auth.uid
        data = req.data

        # Validate required fields
        if 'file_data' not in data or 'file_name' not in data:
            raise ValueError("Missing required fields: file_data, file_name")

        file_data = data['file_data']  # Base64 encoded file data
        file_name = data['file_name']
        file_type = data.get('file_type', 'application/octet-stream')

        # Validate file size (10MB limit)
        try:
            decoded_data = base64.b64decode(file_data)
            file_size = len(decoded_data)
            
            if file_size > 10 * 1024 * 1024:  # 10MB
                raise ValueError("File size exceeds 10MB limit")
                
        except Exception as e:
            raise ValueError(f"Invalid file data: {str(e)}")

        # Create unique file path
        timestamp = int(time.time() * 1000)
        safe_file_name = f"{timestamp}_{file_name}"
        file_path = f"documents/{user_id}/{safe_file_name}"

        # Upload to Firebase Storage using Admin SDK
        bucket = storage.bucket()
        blob = bucket.blob(file_path)
        
        # Set content type
        blob.content_type = file_type
        
        # Upload the file
        blob.upload_from_string(decoded_data, content_type=file_type)
        
        # Get download URL
        download_url = blob.generate_signed_url(
            expiration=datetime.timedelta(days=365),  # 1 year expiration
            method='GET'
        )

        # Create document metadata in Firestore
        doc_ref = db.collection('rag_documents').add({
            'filename': file_name,
            'originalName': file_name,
            'filePath': file_path,
            'downloadURL': download_url,
            'uploadedBy': user_id,
            'uploadedAt': firestore.SERVER_TIMESTAMP,
            'size': file_size,
            'type': file_type,
            'status': 'uploaded',
            'processingStartedAt': None,
            'processedAt': None,
            'chunks': [],
            'metadata': {
                'originalSize': file_size,
                'contentType': file_type,
                'uploadMethod': 'function'
            }
        })

        return {
            'success': True,
            'documentId': doc_ref[1].id,
            'downloadURL': download_url,
            'filePath': file_path,
            'message': 'Document uploaded successfully via function'
        }

    except Exception as e:
        print(f"Error uploading document via function: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }
