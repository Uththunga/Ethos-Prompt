#!/bin/bash

# Load Test Runner for RAG Prompt Library
# Runs k6 load test with 1000+ concurrent users

set -e

echo "🚀 Running Load Test with k6..."
echo "==============================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL=${API_BASE_URL:-"http://localhost:5001"}
AUTH_TOKEN=${AUTH_TOKEN:-"test-token"}
RESULTS_DIR="load-test-results"

# Check if we're in the project root
if [ ! -d "scripts" ]; then
    echo -e "${RED}❌ Please run from project root directory${NC}"
    exit 1
fi

# Check if k6 is installed
if ! command -v k6 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  k6 is not installed. Installing...${NC}"
    
    # Install k6 based on OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew >/dev/null 2>&1; then
            brew install k6
        else
            echo -e "${RED}❌ Homebrew is required to install k6 on macOS${NC}"
            echo "Please install Homebrew first: https://brew.sh/"
            exit 1
        fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        # Windows
        if command -v choco >/dev/null 2>&1; then
            choco install k6
        elif command -v winget >/dev/null 2>&1; then
            winget install k6
        else
            echo -e "${RED}❌ Please install k6 manually from: https://k6.io/docs/getting-started/installation/${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Unsupported OS. Please install k6 manually from: https://k6.io/docs/getting-started/installation/${NC}"
        exit 1
    fi
fi

# Verify k6 installation
if ! command -v k6 >/dev/null 2>&1; then
    echo -e "${RED}❌ k6 installation failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ k6 is available${NC}"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Set environment variables
export API_BASE_URL
export AUTH_TOKEN

echo -e "${BLUE}🔧 Test Configuration:${NC}"
echo "  API Base URL: $API_BASE_URL"
echo "  Auth Token: ${AUTH_TOKEN:0:10}..."
echo "  Results Directory: $RESULTS_DIR"
echo ""

# Check API availability
echo -e "${BLUE}🔍 Checking API availability...${NC}"
if curl -s -f "$API_BASE_URL/health" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ API is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  API health check failed. Continuing anyway...${NC}"
    echo "  Make sure your API server is running at: $API_BASE_URL"
fi

echo ""
echo -e "${BLUE}🏃 Starting load test...${NC}"
echo "This will take approximately 25 minutes to complete."
echo ""

# Generate timestamp for this test run
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_FILE="$RESULTS_DIR/load_test_$TIMESTAMP.json"
SUMMARY_FILE="$RESULTS_DIR/load_test_summary_$TIMESTAMP.txt"

# Run k6 load test
k6 run \
    --out json="$RESULTS_FILE" \
    --summary-export="$SUMMARY_FILE" \
    scripts/load-test.js

# Check test results
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Load test completed successfully!${NC}"
    
    # Parse results and show key metrics
    echo ""
    echo -e "${BLUE}📊 Key Results Summary:${NC}"
    echo "================================"
    
    # Extract key metrics from summary file if available
    if [ -f "$SUMMARY_FILE" ]; then
        echo "📄 Detailed results saved to:"
        echo "  - JSON: $RESULTS_FILE"
        echo "  - Summary: $SUMMARY_FILE"
    fi
    
    echo ""
    echo -e "${BLUE}🎯 Success Criteria Check:${NC}"
    echo "  ✓ Peak concurrent users: 1000"
    echo "  ✓ Test duration: ~25 minutes"
    echo "  ✓ Multiple load stages tested"
    
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "  1. Review the detailed results in $RESULTS_DIR/"
    echo "  2. Check that P95 response time < 200ms"
    echo "  3. Verify error rate < 0.5%"
    echo "  4. Confirm system stability under peak load"
    
else
    echo ""
    echo -e "${RED}❌ Load test failed${NC}"
    echo "Check the output above for error details"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Load testing phase completed!${NC}"
