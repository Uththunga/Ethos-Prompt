#!/bin/bash

# Performance Test Runner for RAG Prompt Library
# Compiles and runs the TypeScript performance test

set -e

echo "🚀 Running API Performance Test..."
echo "=================================="

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "functions" ]; then
    echo "❌ Please run from project root directory"
    exit 1
fi

# Check if Node.js is available
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

# Check if TypeScript is available
if ! command -v npx >/dev/null 2>&1; then
    echo "❌ npx is required but not available"
    exit 1
fi

# Install dependencies if needed
if [ ! -f "scripts/package.json" ]; then
    echo "📦 Setting up test dependencies..."
    cd scripts
    npm init -y
    npm install --save-dev typescript @types/node ts-node
    cd ..
fi

# Set default API base URL if not provided
if [ -z "$API_BASE_URL" ]; then
    export API_BASE_URL="http://localhost:5001"
    echo "🔗 Using default API base URL: $API_BASE_URL"
fi

# Run the performance test
echo "🏃 Executing performance test..."
cd scripts
npx ts-node performance-test.ts
cd ..

echo ""
echo "✅ Performance test completed!"
echo "📄 Check performance-test-report.json for detailed results"
