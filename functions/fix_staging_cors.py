#!/usr/bin/env python3
"""
Fix CORS configuration for staging environment
Adds staging URLs to all CORS configurations in main.py
"""

import re

# Read the main.py file
with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the old CORS origins list (without staging)
old_cors_pattern = r'''cors_origins=\[
            # Production origins
            "https://react-app-000730\.web\.app",
            "https://react-app-000730\.firebaseapp\.com",
            "https://rag-prompt-library\.web\.app",
            "https://rag-prompt-library\.firebaseapp\.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://127\.0\.0\.1:5000"
        \]'''

# Define the new CORS origins list (with staging)
new_cors_origins = '''cors_origins=[
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:3003",
            "http://localhost:5173",
            "http://127.0.0.1:5000"
        ]'''

# Replace all occurrences
updated_content = re.sub(old_cors_pattern, new_cors_origins, content)

# Count replacements
count = len(re.findall(old_cors_pattern, content))

# Write back
with open('main.py', 'w', encoding='utf-8') as f:
    f.write(updated_content)

print(f"✅ Updated {count} CORS configurations in main.py")
print("✅ Added staging URLs:")
print("   - https://rag-prompt-library-staging.web.app")
print("   - https://rag-prompt-library-staging.firebaseapp.com")

