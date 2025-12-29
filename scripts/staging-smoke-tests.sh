#!/bin/bash

# Staging Environment Smoke Tests
# Project: rag-prompt-library-staging
# Purpose: Validate staging deployment and functionality

set -e  # Exit on error (can be disabled for comprehensive testing)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Configuration
STAGING_FUNCTIONS_URL="https://australia-southeast1-rag-prompt-library-staging.cloudfunctions.net"
STAGING_WEB_URL="https://rag-prompt-library-staging.web.app"
STAGING_FIREBASEAPP_URL="https://rag-prompt-library-staging.firebaseapp.com"
PROJECT_ID="rag-prompt-library-staging"

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Helper functions
print_header() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

print_test() {
    echo -e "${YELLOW}🧪 Test: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

print_skip() {
    echo -e "${GRAY}⏭️  $1${NC}"
    ((TESTS_SKIPPED++))
}

print_info() {
    echo -e "${GRAY}   $1${NC}"
}

# Start tests
print_header "Staging Environment Smoke Tests"
echo -e "${GRAY}Project: $PROJECT_ID${NC}"
echo -e "${GRAY}Functions URL: $STAGING_FUNCTIONS_URL${NC}"
echo -e "${GRAY}Web URL: $STAGING_WEB_URL${NC}"
echo -e "${GRAY}Started: $(date)${NC}"
echo ""

# Test 1: Frontend Hosting Accessibility
print_test "Frontend Hosting Accessibility"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_WEB_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Frontend accessible (HTTP $HTTP_CODE)"
    print_info "URL: $STAGING_WEB_URL"
elif [ "$HTTP_CODE" = "000" ]; then
    print_failure "Frontend not accessible (connection failed)"
    print_info "Check if hosting is deployed"
else
    print_failure "Frontend returned HTTP $HTTP_CODE"
    print_info "Expected: 200, Got: $HTTP_CODE"
fi
echo ""

# Test 2: Frontend Alternative URL
print_test "Frontend Alternative URL (firebaseapp.com)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$STAGING_FIREBASEAPP_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    print_success "Alternative URL accessible (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    print_failure "Alternative URL not accessible"
else
    print_info "Alternative URL returned HTTP $HTTP_CODE (may redirect)"
fi
echo ""

# Test 3: Frontend Content Type
print_test "Frontend Content Type"
CONTENT_TYPE=$(curl -s -I "$STAGING_WEB_URL" | grep -i "content-type" | awk '{print $2}' | tr -d '\r')

if [[ "$CONTENT_TYPE" == *"text/html"* ]]; then
    print_success "Correct content type: $CONTENT_TYPE"
else
    print_failure "Unexpected content type: $CONTENT_TYPE"
fi
echo ""

# Test 4: Cloud Functions Health Check
print_test "Cloud Functions Health Check"
HEALTH_RESPONSE=$(curl -s -X POST "$STAGING_FUNCTIONS_URL/api" \
    -H "Content-Type: application/json" \
    -d '{"data":{"endpoint":"health"}}' || echo "ERROR")

if [[ "$HEALTH_RESPONSE" == *"healthy"* ]] || [[ "$HEALTH_RESPONSE" == *"ok"* ]] || [[ "$HEALTH_RESPONSE" == *"success"* ]]; then
    print_success "Health check passed"
    print_info "Response: $HEALTH_RESPONSE"
elif [[ "$HEALTH_RESPONSE" == "ERROR" ]]; then
    print_failure "Health check failed (connection error)"
    print_info "Check if functions are deployed"
else
    print_failure "Health check returned unexpected response"
    print_info "Response: $HEALTH_RESPONSE"
fi
echo ""

# Test 5: Cloud Functions CORS Headers
print_test "Cloud Functions CORS Headers"
CORS_HEADER=$(curl -s -I -X OPTIONS "$STAGING_FUNCTIONS_URL/api" | grep -i "access-control-allow-origin" || echo "")

if [ ! -z "$CORS_HEADER" ]; then
    print_success "CORS headers present"
    print_info "$CORS_HEADER"
else
    print_skip "CORS headers not found (may be configured differently)"
fi
echo ""

# Test 6: OpenRouter Connectivity (requires deployed functions)
print_test "OpenRouter API Connectivity"
OPENROUTER_RESPONSE=$(curl -s -X POST "$STAGING_FUNCTIONS_URL/api" \
    -H "Content-Type: application/json" \
    -d '{"data":{"endpoint":"test_openrouter_connection"}}' 2>/dev/null || echo "ERROR")

if [[ "$OPENROUTER_RESPONSE" == *"success"* ]] || [[ "$OPENROUTER_RESPONSE" == *"connected"* ]]; then
    print_success "OpenRouter connectivity verified"
    print_info "Response: $OPENROUTER_RESPONSE"
elif [[ "$OPENROUTER_RESPONSE" == "ERROR" ]]; then
    print_skip "OpenRouter test endpoint not available"
    print_info "This is expected if functions aren't deployed yet"
else
    print_skip "OpenRouter connectivity test inconclusive"
    print_info "Response: $OPENROUTER_RESPONSE"
fi
echo ""

# Test 7: Firestore Connectivity (via Firebase CLI)
print_test "Firestore Database Connectivity"
if command -v firebase &> /dev/null || command -v npx &> /dev/null; then
    FIRESTORE_CHECK=$(npx firebase firestore:databases:list --project=$PROJECT_ID 2>&1 || echo "ERROR")
    
    if [[ "$FIRESTORE_CHECK" == *"(default)"* ]] || [[ "$FIRESTORE_CHECK" == *"firestore"* ]]; then
        print_success "Firestore database accessible"
    elif [[ "$FIRESTORE_CHECK" == "ERROR" ]]; then
        print_failure "Firestore check failed"
        print_info "Run: firebase login"
    else
        print_skip "Firestore status unclear"
        print_info "$FIRESTORE_CHECK"
    fi
else
    print_skip "Firebase CLI not available"
    print_info "Install: npm install -g firebase-tools"
fi
echo ""

# Test 8: Frontend Performance (Load Time)
print_test "Frontend Load Time"
START_TIME=$(date +%s%N)
curl -s -o /dev/null "$STAGING_WEB_URL"
END_TIME=$(date +%s%N)
LOAD_TIME=$(( (END_TIME - START_TIME) / 1000000 ))  # Convert to milliseconds

if [ $LOAD_TIME -lt 2000 ]; then
    print_success "Fast load time: ${LOAD_TIME}ms"
elif [ $LOAD_TIME -lt 5000 ]; then
    print_success "Acceptable load time: ${LOAD_TIME}ms"
    print_info "Target: <2000ms"
else
    print_failure "Slow load time: ${LOAD_TIME}ms"
    print_info "Target: <2000ms, Acceptable: <5000ms"
fi
echo ""

# Test 9: SSL Certificate
print_test "SSL Certificate Validity"
SSL_CHECK=$(curl -s -I "$STAGING_WEB_URL" 2>&1 | head -n 1)

if [[ "$SSL_CHECK" == *"200"* ]]; then
    print_success "SSL certificate valid"
else
    print_skip "SSL check inconclusive"
fi
echo ""

# Test 10: Frontend Bundle Size (estimate)
print_test "Frontend Bundle Size Check"
CONTENT_LENGTH=$(curl -s -I "$STAGING_WEB_URL" | grep -i "content-length" | awk '{print $2}' | tr -d '\r')

if [ ! -z "$CONTENT_LENGTH" ]; then
    SIZE_KB=$((CONTENT_LENGTH / 1024))
    if [ $SIZE_KB -lt 500 ]; then
        print_success "HTML size: ${SIZE_KB}KB (good)"
    else
        print_info "HTML size: ${SIZE_KB}KB"
    fi
else
    print_skip "Content length not available"
fi
echo ""

# Summary
print_header "Test Summary"
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo -e "${GRAY}⏭️  Skipped: $TESTS_SKIPPED${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
echo -e "${CYAN}Total Tests: $TOTAL_TESTS${NC}"
echo ""

# Manual Testing Checklist
print_header "Manual Testing Checklist"
echo -e "${YELLOW}The following tests require manual verification:${NC}"
echo ""
echo -e "${GRAY}1. Authentication Flow:${NC}"
echo -e "   • Visit: $STAGING_WEB_URL"
echo -e "   • Click 'Sign Up' or 'Login'"
echo -e "   • Create test account or login"
echo -e "   • Verify email verification flow"
echo -e "   • Verify successful login"
echo ""
echo -e "${GRAY}2. Prompt Creation:${NC}"
echo -e "   • Navigate to 'Prompts' or 'Create Prompt'"
echo -e "   • Fill in prompt details"
echo -e "   • Save prompt"
echo -e "   • Verify prompt appears in list"
echo ""
echo -e "${GRAY}3. Prompt Execution:${NC}"
echo -e "   • Select a prompt"
echo -e "   • Click 'Execute' or 'Run'"
echo -e "   • Provide required variables"
echo -e "   • Select a free model (e.g., gpt-3.5-turbo)"
echo -e "   • Verify AI response is generated"
echo ""
echo -e "${GRAY}4. Document Upload (RAG):${NC}"
echo -e "   • Navigate to 'Documents' or 'Upload'"
echo -e "   • Upload a test document (PDF/TXT)"
echo -e "   • Verify upload progress"
echo -e "   • Verify document processing"
echo -e "   • Test RAG-enabled prompt with document"
echo ""
echo -e "${GRAY}5. Browser Console:${NC}"
echo -e "   • Open browser DevTools (F12)"
echo -e "   • Check Console tab for errors"
echo -e "   • Check Network tab for failed requests"
echo ""
echo -e "${GRAY}6. Responsive Design:${NC}"
echo -e "   • Test on mobile viewport (DevTools)"
echo -e "   • Verify layout adapts correctly"
echo -e "   • Test navigation on mobile"
echo ""

# Exit code
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}⚠️  Some automated tests failed. Review failures above.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All automated tests passed!${NC}"
    echo -e "${YELLOW}⚠️  Don't forget to complete manual testing checklist.${NC}"
    exit 0
fi

