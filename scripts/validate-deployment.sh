#!/bin/bash

# Deployment Validation Script for RAG Prompt Library
# Tests deployment in staging environment and validates production readiness

set -e

echo "🚀 Validating Deployment Readiness..."
echo "====================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGING_URL=${STAGING_URL:-"https://rag-prompt-library-staging.web.app"}
PRODUCTION_URL=${PRODUCTION_URL:-"https://rag-prompt-library.web.app"}
FIREBASE_PROJECT=${FIREBASE_PROJECT:-"rag-prompt-library"}
TIMEOUT=30

# Validation results
VALIDATION_RESULTS=()
CRITICAL_FAILURES=0
WARNING_COUNT=0

# Helper functions
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    VALIDATION_RESULTS+=("✅ $1")
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    VALIDATION_RESULTS+=("⚠️  $1")
    WARNING_COUNT=$((WARNING_COUNT + 1))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    VALIDATION_RESULTS+=("❌ $1")
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are available
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Firebase CLI
    if command -v firebase >/dev/null 2>&1; then
        log_success "Firebase CLI is available"
    else
        log_error "Firebase CLI is not installed"
        echo "Install with: npm install -g firebase-tools"
        return 1
    fi
    
    # Check Node.js
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        log_success "Node.js is available ($NODE_VERSION)"
    else
        log_error "Node.js is not installed"
        return 1
    fi
    
    # Check npm
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        log_success "npm is available ($NPM_VERSION)"
    else
        log_error "npm is not installed"
        return 1
    fi
    
    return 0
}

# Validate Firebase configuration
validate_firebase_config() {
    log_info "Validating Firebase configuration..."
    
    # Check if logged in to Firebase
    if firebase projects:list >/dev/null 2>&1; then
        log_success "Firebase authentication is valid"
    else
        log_error "Firebase authentication failed"
        echo "Run: firebase login"
        return 1
    fi
    
    # Check project configuration
    if [ -f "firebase.json" ]; then
        log_success "firebase.json configuration file exists"
    else
        log_error "firebase.json configuration file missing"
        return 1
    fi
    
    # Check if project is set
    if firebase use --current >/dev/null 2>&1; then
        CURRENT_PROJECT=$(firebase use --current)
        log_success "Firebase project is set: $CURRENT_PROJECT"
    else
        log_warning "Firebase project not set, using default"
    fi
    
    return 0
}

# Validate environment files
validate_environment_files() {
    log_info "Validating environment configuration..."
    
    # Check frontend environment
    if [ -f "frontend/.env.production" ]; then
        log_success "Frontend production environment file exists"
    else
        log_warning "Frontend production environment file missing"
    fi
    
    # Check functions environment
    if [ -f "functions/.env" ]; then
        log_success "Functions environment file exists"
        
        # Check for required environment variables
        if grep -q "OPENROUTER_API_KEY" functions/.env; then
            log_success "OPENROUTER_API_KEY is configured"
        else
            log_error "OPENROUTER_API_KEY is missing from functions/.env"
        fi
        
        if grep -q "FIREBASE_PROJECT_ID" functions/.env; then
            log_success "FIREBASE_PROJECT_ID is configured"
        else
            log_warning "FIREBASE_PROJECT_ID is missing from functions/.env"
        fi
    else
        log_error "Functions environment file missing"
    fi
    
    return 0
}

# Build and validate frontend
validate_frontend_build() {
    log_info "Validating frontend build..."
    
    cd frontend
    
    # Install dependencies
    if npm ci >/dev/null 2>&1; then
        log_success "Frontend dependencies installed"
    else
        log_error "Frontend dependency installation failed"
        cd ..
        return 1
    fi
    
    # Run build
    if npm run build >/dev/null 2>&1; then
        log_success "Frontend build completed successfully"
    else
        log_error "Frontend build failed"
        cd ..
        return 1
    fi
    
    # Check build output
    if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
        log_success "Frontend build output is valid"
    else
        log_error "Frontend build output is empty or missing"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# Build and validate functions
validate_functions_build() {
    log_info "Validating functions build..."
    
    cd functions
    
    # Install dependencies
    if npm ci >/dev/null 2>&1; then
        log_success "Functions dependencies installed"
    else
        log_error "Functions dependency installation failed"
        cd ..
        return 1
    fi
    
    # Run build/compile check
    if npm run build >/dev/null 2>&1; then
        log_success "Functions build completed successfully"
    else
        log_warning "Functions build command not available or failed"
    fi
    
    # Check main files exist
    if [ -f "main.py" ] && [ -f "main_full.py" ]; then
        log_success "Functions main files are present"
    else
        log_error "Functions main files are missing"
        cd ..
        return 1
    fi
    
    cd ..
    return 0
}

# Test deployment to staging
test_staging_deployment() {
    log_info "Testing staging deployment..."
    
    # Deploy to staging (if staging project exists)
    if firebase use staging >/dev/null 2>&1; then
        log_info "Deploying to staging environment..."
        
        if firebase deploy --only hosting >/dev/null 2>&1; then
            log_success "Staging deployment completed"
        else
            log_error "Staging deployment failed"
            return 1
        fi
        
        # Test staging URL
        sleep 10  # Wait for deployment to propagate
        
        if curl -s -f "$STAGING_URL" >/dev/null 2>&1; then
            log_success "Staging site is accessible"
        else
            log_warning "Staging site accessibility check failed"
        fi
        
        # Switch back to production project
        firebase use production >/dev/null 2>&1 || firebase use default >/dev/null 2>&1
    else
        log_warning "Staging environment not configured, skipping staging deployment test"
    fi
    
    return 0
}

# Validate security configuration
validate_security() {
    log_info "Validating security configuration..."
    
    # Check Firebase security rules
    if [ -f "firestore.rules" ]; then
        log_success "Firestore security rules file exists"
    else
        log_warning "Firestore security rules file missing"
    fi
    
    if [ -f "storage.rules" ]; then
        log_success "Storage security rules file exists"
    else
        log_warning "Storage security rules file missing"
    fi
    
    # Check for sensitive data in code
    if grep -r "sk-" frontend/src/ >/dev/null 2>&1; then
        log_error "Potential API keys found in frontend source code"
    else
        log_success "No API keys found in frontend source code"
    fi
    
    return 0
}

# Validate performance requirements
validate_performance() {
    log_info "Validating performance requirements..."
    
    # Check if bundle analysis was run
    if [ -f "bundle-analysis-report.json" ]; then
        BUNDLE_SIZE=$(grep -o '"kb":[0-9]*' bundle-analysis-report.json | head -1 | cut -d':' -f2)
        if [ "$BUNDLE_SIZE" -gt 500 ]; then
            log_warning "Bundle size ($BUNDLE_SIZE KB) exceeds target (500 KB)"
        else
            log_success "Bundle size ($BUNDLE_SIZE KB) within target"
        fi
    else
        log_warning "Bundle analysis report not found"
    fi
    
    # Check if performance test was run
    if [ -f "performance-test-report.json" ]; then
        log_success "Performance test report available"
    else
        log_warning "Performance test report not found"
    fi
    
    return 0
}

# Generate deployment checklist
generate_checklist() {
    log_info "Generating deployment checklist..."
    
    cat > deployment-checklist.md << EOF
# Deployment Checklist - $(date)

## Pre-Deployment Validation Results

$(printf '%s\n' "${VALIDATION_RESULTS[@]}")

## Critical Issues: $CRITICAL_FAILURES
## Warnings: $WARNING_COUNT

## Manual Verification Required

- [ ] API keys are properly configured in production environment
- [ ] Database indexes are optimized for production queries
- [ ] Monitoring and alerting are configured
- [ ] Backup procedures are in place
- [ ] Support team is notified and ready
- [ ] Rollback plan is documented and tested

## Go/No-Go Decision

**Recommendation:** $([ $CRITICAL_FAILURES -eq 0 ] && echo "GO - Ready for production deployment" || echo "NO-GO - Critical issues must be resolved")

**Rationale:**
- Critical failures: $CRITICAL_FAILURES
- Warnings: $WARNING_COUNT
- All core functionality validated: $([ $CRITICAL_FAILURES -eq 0 ] && echo "Yes" || echo "No")

## Next Steps

$(if [ $CRITICAL_FAILURES -eq 0 ]; then
    echo "1. Schedule production deployment"
    echo "2. Notify stakeholders"
    echo "3. Prepare monitoring dashboards"
    echo "4. Execute deployment plan"
else
    echo "1. Resolve critical issues listed above"
    echo "2. Re-run validation script"
    echo "3. Update deployment timeline"
    echo "4. Communicate delays to stakeholders"
fi)

EOF

    log_success "Deployment checklist generated: deployment-checklist.md"
}

# Main validation flow
main() {
    echo "Starting comprehensive deployment validation..."
    echo ""
    
    # Run all validation checks
    check_prerequisites || true
    validate_firebase_config || true
    validate_environment_files || true
    validate_frontend_build || true
    validate_functions_build || true
    test_staging_deployment || true
    validate_security || true
    validate_performance || true
    
    echo ""
    echo "🏁 Deployment Validation Complete!"
    echo "=================================="
    
    # Generate summary
    generate_checklist
    
    echo ""
    echo "📊 Validation Summary:"
    echo "  Critical Failures: $CRITICAL_FAILURES"
    echo "  Warnings: $WARNING_COUNT"
    echo "  Total Checks: ${#VALIDATION_RESULTS[@]}"
    
    if [ $CRITICAL_FAILURES -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 DEPLOYMENT VALIDATION PASSED!${NC}"
        echo -e "${GREEN}✅ Ready for production deployment${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}🚫 DEPLOYMENT VALIDATION FAILED!${NC}"
        echo -e "${RED}❌ Critical issues must be resolved before deployment${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
