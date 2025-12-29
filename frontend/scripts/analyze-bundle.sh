#!/bin/bash

# Bundle Analysis Script
# Analyzes bundle size and generates reports

set -e

echo "🔍 Analyzing bundle size..."

# Build with analyzer
cd "$(dirname "$0")/.."
ANALYZE=true npm run build

# Check if stats.html was generated
if [ -f "dist/stats.html" ]; then
  echo "✅ Bundle analysis complete! Report: dist/stats.html"
  
  # Extract bundle sizes
  echo ""
  echo "📊 Bundle Size Summary:"
  du -sh dist/assets/js/*.js | sort -h
  
  # Check for large chunks
  echo ""
  echo "⚠️  Checking for oversized chunks (>500KB)..."
  find dist/assets/js -name "*.js" -size +500k -exec ls -lh {} \; | awk '{print $5, $9}'
  
  # Total size
  echo ""
  echo "📦 Total bundle size:"
  du -sh dist/
else
  echo "❌ Bundle analysis failed - stats.html not generated"
  exit 1
fi

