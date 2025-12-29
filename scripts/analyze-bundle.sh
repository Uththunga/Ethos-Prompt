#!/bin/bash

# Bundle Size Analysis Script for RAG Prompt Library
# Analyzes and validates bundle size against 500KB target

set -e

echo "🔍 Analyzing bundle size..."
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TARGET_SIZE_KB=500
FRONTEND_DIR="frontend"
BUILD_DIR="$FRONTEND_DIR/dist"
SCRIPTS_DIR="scripts"

# Ensure we're in the project root
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found. Please run from project root.${NC}"
    exit 1
fi

# Change to frontend directory
cd "$FRONTEND_DIR"

echo -e "${BLUE}📦 Building production bundle...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully${NC}"

# Check if build directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build directory not found${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Analyzing bundle size...${NC}"

# Calculate total bundle size
TOTAL_SIZE_BYTES=0
JS_SIZE_BYTES=0
CSS_SIZE_BYTES=0

# Function to convert bytes to KB (Windows compatible)
bytes_to_kb() {
    echo $(($1 / 1024))
}

# Analyze JavaScript files
if [ -d "dist/assets" ]; then
    for file in dist/assets/*.js; do
        if [ -f "$file" ]; then
            SIZE=$(stat -c%s "$file" 2>/dev/null || wc -c < "$file" 2>/dev/null || echo 0)
            JS_SIZE_BYTES=$((JS_SIZE_BYTES + SIZE))
            TOTAL_SIZE_BYTES=$((TOTAL_SIZE_BYTES + SIZE))
            SIZE_KB=$(bytes_to_kb $SIZE)
            echo "  JS: $(basename "$file") - ${SIZE_KB}KB"
        fi
    done

    # Analyze CSS files
    for file in dist/assets/*.css; do
        if [ -f "$file" ]; then
            SIZE=$(stat -c%s "$file" 2>/dev/null || wc -c < "$file" 2>/dev/null || echo 0)
            CSS_SIZE_BYTES=$((CSS_SIZE_BYTES + SIZE))
            TOTAL_SIZE_BYTES=$((TOTAL_SIZE_BYTES + SIZE))
            SIZE_KB=$(bytes_to_kb $SIZE)
            echo "  CSS: $(basename "$file") - ${SIZE_KB}KB"
        fi
    done
fi

# Convert to KB
TOTAL_SIZE_KB=$(bytes_to_kb $TOTAL_SIZE_BYTES)
JS_SIZE_KB=$(bytes_to_kb $JS_SIZE_BYTES)
CSS_SIZE_KB=$(bytes_to_kb $CSS_SIZE_BYTES)

echo ""
echo -e "${BLUE}📈 Bundle Size Summary:${NC}"
echo "=================================="
echo -e "JavaScript: ${YELLOW}${JS_SIZE_KB}KB${NC}"
echo -e "CSS: ${YELLOW}${CSS_SIZE_KB}KB${NC}"
echo -e "Total: ${YELLOW}${TOTAL_SIZE_KB}KB${NC}"
echo -e "Target: ${YELLOW}${TARGET_SIZE_KB}KB${NC}"

# Check against target
if [ "$TOTAL_SIZE_KB" -gt "$TARGET_SIZE_KB" ]; then
    EXCESS_KB=$((TOTAL_SIZE_KB - TARGET_SIZE_KB))
    echo ""
    echo -e "${RED}❌ Bundle size exceeds target by ${EXCESS_KB}KB${NC}"
    echo -e "${RED}   Current: ${TOTAL_SIZE_KB}KB > Target: ${TARGET_SIZE_KB}KB${NC}"

    echo ""
    echo -e "${YELLOW}💡 Optimization suggestions:${NC}"
    echo "   • Enable code splitting"
    echo "   • Use dynamic imports for large dependencies"
    echo "   • Remove unused dependencies"
    echo "   • Enable tree shaking"
    echo "   • Compress images and assets"

    exit 1
else
    UNDER_TARGET_KB=$((TARGET_SIZE_KB - TOTAL_SIZE_KB))
    echo ""
    echo -e "${GREEN}✅ Bundle size within target${NC}"
    echo -e "${GREEN}   Current: ${TOTAL_SIZE_KB}KB < Target: ${TARGET_SIZE_KB}KB${NC}"
    echo -e "${GREEN}   Remaining budget: ${UNDER_TARGET_KB}KB${NC}"
fi

# Generate detailed analysis if webpack-bundle-analyzer is available
echo ""
echo -e "${BLUE}🔍 Generating detailed analysis...${NC}"

if command -v npx >/dev/null 2>&1; then
    if npm list webpack-bundle-analyzer >/dev/null 2>&1; then
        echo -e "${BLUE}📊 Opening bundle analyzer...${NC}"
        npx webpack-bundle-analyzer dist/assets/*.js --mode static --report ../bundle-report.html --no-open
        echo -e "${GREEN}✅ Bundle report generated: bundle-report.html${NC}"
    else
        echo -e "${YELLOW}⚠️  webpack-bundle-analyzer not installed. Install with: npm install --save-dev webpack-bundle-analyzer${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  npx not available${NC}"
fi

# Create performance report
REPORT_FILE="../bundle-analysis-report.json"
cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "bundleSize": {
    "total": {
      "bytes": $TOTAL_SIZE_BYTES,
      "kb": $TOTAL_SIZE_KB
    },
    "javascript": {
      "bytes": $JS_SIZE_BYTES,
      "kb": $JS_SIZE_KB
    },
    "css": {
      "bytes": $CSS_SIZE_BYTES,
      "kb": $CSS_SIZE_KB
    }
  },
  "target": {
    "kb": $TARGET_SIZE_KB
  },
  "status": "$([ "$TOTAL_SIZE_KB" -le "$TARGET_SIZE_KB" ] && echo "PASS" || echo "FAIL")",
  "withinTarget": $([ "$TOTAL_SIZE_KB" -le "$TARGET_SIZE_KB" ] && echo "true" || echo "false")
}
EOF

echo -e "${GREEN}✅ Analysis report saved: bundle-analysis-report.json${NC}"

echo ""
echo -e "${GREEN}🎯 Bundle size analysis completed!${NC}"

# Return to project root
cd ..

exit 0
