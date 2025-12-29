#!/bin/bash

# Production Validation Script
# This script runs comprehensive validation checks before production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL="https://app.ragpromptlibrary.com"
API_URL="https://api.ragpromptlibrary.com/v1"
STAGING_URL="https://staging.ragpromptlibrary.com"
TIMEOUT=30
MAX_RETRIES=3

# Logging
LOG_FILE="validation-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo -e "${BLUE}=== RAG Prompt Library Production Validation ===${NC}"
echo "Started at: $(date)"
echo "Log file: $LOG_FILE"
echo ""

# Function to print status
print_status() {
    local status=$1
    local message=$2
    case $status in
        "PASS")
            echo -e "${GREEN}✓ PASS${NC}: $message"
            ;;
        "FAIL")
            echo -e "${RED}✗ FAIL${NC}: $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠ WARN${NC}: $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ INFO${NC}: $message"
            ;;
    esac
}

# Function to make HTTP requests with retry
http_request() {
    local url=$1
    local method=${2:-GET}
    local expected_status=${3:-200}
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        response=$(curl -s -w "%{http_code}" -m $TIMEOUT -X "$method" "$url" 2>/dev/null || echo "000")
        status_code="${response: -3}"
        
        if [ "$status_code" = "$expected_status" ]; then
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            sleep 2
        fi
    done
    
    return 1
}

# Function to check SSL certificate
check_ssl() {
    local domain=$1
    local expiry_days
    
    expiry_date=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -n "$expiry_date" ]; then
        expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry_date" +%s 2>/dev/null)
        current_timestamp=$(date +%s)
        expiry_days=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $expiry_days -gt 30 ]; then
            print_status "PASS" "SSL certificate for $domain expires in $expiry_days days"
        elif [ $expiry_days -gt 7 ]; then
            print_status "WARN" "SSL certificate for $domain expires in $expiry_days days (renew soon)"
        else
            print_status "FAIL" "SSL certificate for $domain expires in $expiry_days days (urgent renewal needed)"
            return 1
        fi
    else
        print_status "FAIL" "Could not retrieve SSL certificate for $domain"
        return 1
    fi
}

# Function to check DNS resolution
check_dns() {
    local domain=$1
    
    if nslookup "$domain" >/dev/null 2>&1; then
        print_status "PASS" "DNS resolution for $domain"
    else
        print_status "FAIL" "DNS resolution failed for $domain"
        return 1
    fi
}

# Function to check Firebase project configuration
check_firebase_config() {
    print_status "INFO" "Checking Firebase configuration..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        print_status "FAIL" "Firebase CLI not installed"
        return 1
    fi
    
    # Check Firebase project
    if firebase projects:list --json >/dev/null 2>&1; then
        print_status "PASS" "Firebase CLI authenticated"
    else
        print_status "FAIL" "Firebase CLI not authenticated"
        return 1
    fi
    
    # Check Firestore indexes
    if firebase firestore:indexes --project=rag-prompt-library-prod >/dev/null 2>&1; then
        print_status "PASS" "Firestore indexes accessible"
    else
        print_status "WARN" "Could not verify Firestore indexes"
    fi
}

# Function to run security checks
run_security_checks() {
    print_status "INFO" "Running security checks..."
    
    # Check for HTTPS enforcement
    if http_request "http://app.ragpromptlibrary.com" "GET" "301"; then
        print_status "PASS" "HTTP to HTTPS redirect working"
    else
        print_status "FAIL" "HTTP to HTTPS redirect not working"
        return 1
    fi
    
    # Check security headers
    headers=$(curl -s -I "$PRODUCTION_URL" 2>/dev/null)
    
    if echo "$headers" | grep -i "strict-transport-security" >/dev/null; then
        print_status "PASS" "HSTS header present"
    else
        print_status "WARN" "HSTS header missing"
    fi
    
    if echo "$headers" | grep -i "content-security-policy" >/dev/null; then
        print_status "PASS" "CSP header present"
    else
        print_status "WARN" "CSP header missing"
    fi
    
    if echo "$headers" | grep -i "x-frame-options" >/dev/null; then
        print_status "PASS" "X-Frame-Options header present"
    else
        print_status "WARN" "X-Frame-Options header missing"
    fi
}

# Function to test API endpoints
test_api_endpoints() {
    print_status "INFO" "Testing API endpoints..."
    
    # Health check
    if http_request "$API_URL/health" "GET" "200"; then
        print_status "PASS" "API health check"
    else
        print_status "FAIL" "API health check failed"
        return 1
    fi
    
    # API info endpoint
    if http_request "$API_URL/info" "GET" "200"; then
        print_status "PASS" "API info endpoint"
    else
        print_status "WARN" "API info endpoint not accessible"
    fi
    
    # Test rate limiting (should return 429 after many requests)
    print_status "INFO" "Testing rate limiting..."
    rate_limit_triggered=false
    for i in {1..20}; do
        if ! http_request "$API_URL/health" "GET" "200"; then
            rate_limit_triggered=true
            break
        fi
        sleep 0.1
    done
    
    if [ "$rate_limit_triggered" = true ]; then
        print_status "PASS" "Rate limiting is working"
    else
        print_status "WARN" "Rate limiting may not be configured"
    fi
}

# Function to test frontend performance
test_frontend_performance() {
    print_status "INFO" "Testing frontend performance..."
    
    # Check if lighthouse is available
    if command -v lighthouse &> /dev/null; then
        print_status "INFO" "Running Lighthouse audit..."
        lighthouse_output=$(lighthouse "$PRODUCTION_URL" --only-categories=performance --output=json --quiet 2>/dev/null || echo "failed")
        
        if [ "$lighthouse_output" != "failed" ]; then
            performance_score=$(echo "$lighthouse_output" | jq -r '.categories.performance.score * 100' 2>/dev/null || echo "0")
            if [ "${performance_score%.*}" -ge 80 ]; then
                print_status "PASS" "Lighthouse performance score: $performance_score"
            else
                print_status "WARN" "Lighthouse performance score below 80: $performance_score"
            fi
        else
            print_status "WARN" "Could not run Lighthouse audit"
        fi
    else
        print_status "INFO" "Lighthouse not available, skipping performance audit"
    fi
    
    # Basic load time check
    start_time=$(date +%s%N)
    if http_request "$PRODUCTION_URL" "GET" "200"; then
        end_time=$(date +%s%N)
        load_time=$(( (end_time - start_time) / 1000000 ))
        
        if [ $load_time -lt 3000 ]; then
            print_status "PASS" "Page load time: ${load_time}ms"
        else
            print_status "WARN" "Page load time slow: ${load_time}ms"
        fi
    else
        print_status "FAIL" "Could not load main page"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    print_status "INFO" "Checking database connectivity..."
    
    # This would typically involve running a test query
    # For Firebase, we'll check if we can access Firestore
    if firebase firestore:databases:list --project=rag-prompt-library-prod >/dev/null 2>&1; then
        print_status "PASS" "Database connectivity"
    else
        print_status "FAIL" "Database connectivity failed"
        return 1
    fi
}

# Function to check external dependencies
check_external_dependencies() {
    print_status "INFO" "Checking external dependencies..."
    
    # Check OpenAI API
    if http_request "https://api.openai.com/v1/models" "GET" "401"; then
        print_status "PASS" "OpenAI API accessible"
    else
        print_status "WARN" "OpenAI API not accessible"
    fi
    
    # Check other external services as needed
    # Add more checks for your specific dependencies
}

# Function to run load test
run_load_test() {
    print_status "INFO" "Running basic load test..."
    
    if command -v ab &> /dev/null; then
        # Apache Bench load test
        ab_output=$(ab -n 100 -c 10 -q "$PRODUCTION_URL/" 2>/dev/null || echo "failed")
        
        if [ "$ab_output" != "failed" ]; then
            requests_per_second=$(echo "$ab_output" | grep "Requests per second" | awk '{print $4}' || echo "0")
            if [ "${requests_per_second%.*}" -gt 50 ]; then
                print_status "PASS" "Load test: $requests_per_second requests/second"
            else
                print_status "WARN" "Load test performance low: $requests_per_second requests/second"
            fi
        else
            print_status "WARN" "Could not run load test"
        fi
    else
        print_status "INFO" "Apache Bench not available, skipping load test"
    fi
}

# Main validation function
main() {
    local exit_code=0
    
    echo -e "${BLUE}=== Infrastructure Checks ===${NC}"
    check_dns "app.ragpromptlibrary.com" || exit_code=1
    check_dns "api.ragpromptlibrary.com" || exit_code=1
    check_ssl "app.ragpromptlibrary.com" || exit_code=1
    check_ssl "api.ragpromptlibrary.com" || exit_code=1
    
    echo -e "\n${BLUE}=== Security Checks ===${NC}"
    run_security_checks || exit_code=1
    
    echo -e "\n${BLUE}=== Firebase Configuration ===${NC}"
    check_firebase_config || exit_code=1
    
    echo -e "\n${BLUE}=== API Testing ===${NC}"
    test_api_endpoints || exit_code=1
    
    echo -e "\n${BLUE}=== Database Connectivity ===${NC}"
    check_database || exit_code=1
    
    echo -e "\n${BLUE}=== Frontend Performance ===${NC}"
    test_frontend_performance || exit_code=1
    
    echo -e "\n${BLUE}=== External Dependencies ===${NC}"
    check_external_dependencies
    
    echo -e "\n${BLUE}=== Load Testing ===${NC}"
    run_load_test
    
    echo -e "\n${BLUE}=== Validation Summary ===${NC}"
    echo "Completed at: $(date)"
    echo "Log file: $LOG_FILE"
    
    if [ $exit_code -eq 0 ]; then
        print_status "PASS" "All critical validations passed - READY FOR PRODUCTION"
    else
        print_status "FAIL" "Some validations failed - DO NOT DEPLOY"
    fi
    
    return $exit_code
}

# Run main function
main "$@"
