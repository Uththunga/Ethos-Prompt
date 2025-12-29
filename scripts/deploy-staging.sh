#!/bin/bash
# Deploy RAG Prompt Library to Staging Environment
# Comprehensive deployment script for all components
#
# Usage: bash scripts/deploy-staging.sh [component]
# Components: all, firestore, functions, frontend, test
# Default: all

set -e  # Exit on error

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="rag-prompt-library-staging"
REGION="australia-southeast1"
COMPONENT="${1:-all}"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_step() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Print header
echo ""
echo "============================================"
echo "🚀 RAG Prompt Library - Staging Deployment"
echo "============================================"
echo ""
log_info "Project: $PROJECT_ID"
log_info "Region: $REGION"
log_info "Component: $COMPONENT"
echo ""

# Verify Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    log_error "Firebase CLI not found. Please install it:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Verify logged in
log_info "Verifying Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    log_error "Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi
log_success "Firebase authentication verified"

# Set Firebase project
log_info "Setting Firebase project to staging..."
firebase use staging
log_success "Using project: $PROJECT_ID"

# Function: Deploy Firestore Rules and Indexes
deploy_firestore() {
    log_step "Step 1: Deploy Firestore Rules and Indexes"
    
    log_info "Deploying Firestore security rules..."
    firebase deploy --only firestore:rules --project $PROJECT_ID
    log_success "Firestore rules deployed"
    
    log_info "Deploying Firestore indexes..."
    firebase deploy --only firestore:indexes --project $PROJECT_ID
    log_success "Firestore indexes deployed"
    
    log_warning "Note: Index builds may take several minutes to complete"
    log_info "Monitor index status at:"
    echo "https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
}

# Function: Deploy Cloud Functions
deploy_functions() {
    log_step "Step 2: Deploy Cloud Functions"
    
    log_info "Installing function dependencies..."
    cd functions
    npm ci
    log_success "Dependencies installed"
    
    log_info "Running linter..."
    npm run lint || log_warning "Linting warnings detected (non-blocking)"
    
    log_info "Deploying Cloud Functions..."
    cd ..
    firebase deploy --only functions --project $PROJECT_ID
    log_success "Cloud Functions deployed"
    
    log_info "Verifying health endpoint..."
    sleep 10  # Wait for functions to be ready
    
    HEALTH_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/api"
    HEALTH_RESPONSE=$(curl -s -X POST "$HEALTH_URL" \
        -H "Content-Type: application/json" \
        -d '{"data":{"endpoint":"health"}}' || echo "ERROR")
    
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        log_success "Health check passed"
    else
        log_warning "Health check returned unexpected response: $HEALTH_RESPONSE"
    fi
}

# Function: Deploy Frontend
deploy_frontend() {
    log_step "Step 3: Deploy Frontend to Firebase Hosting"
    
    log_info "Installing frontend dependencies..."
    cd frontend
    npm ci
    log_success "Dependencies installed"
    
    log_info "Building frontend for staging..."
    npm run build:staging
    log_success "Frontend built successfully"
    
    log_info "Checking performance budgets..."
    npm run check:budget || log_warning "Performance budget warnings detected (non-blocking)"
    
    log_info "Deploying to Firebase Hosting..."
    cd ..
    firebase deploy --only hosting --project $PROJECT_ID
    log_success "Frontend deployed"
    
    log_info "Frontend URL: https://$PROJECT_ID.web.app"
    log_info "Verifying frontend accessibility..."
    sleep 5
    
    FRONTEND_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$PROJECT_ID.web.app" || echo "000")
    if [ "$FRONTEND_HTTP_CODE" = "200" ]; then
        log_success "Frontend accessible (HTTP $FRONTEND_HTTP_CODE)"
    else
        log_warning "Frontend returned HTTP $FRONTEND_HTTP_CODE"
    fi
}

# Function: Run Smoke Tests
run_smoke_tests() {
    log_step "Step 4: Run Smoke Tests"
    
    if [ -f "scripts/staging-smoke-tests.sh" ]; then
        log_info "Running automated smoke tests..."
        bash scripts/staging-smoke-tests.sh
    else
        log_warning "Smoke test script not found at scripts/staging-smoke-tests.sh"
        log_info "Skipping automated tests"
    fi
}

# Main deployment logic
case $COMPONENT in
    firestore)
        deploy_firestore
        ;;
    functions)
        deploy_functions
        ;;
    frontend)
        deploy_frontend
        ;;
    test)
        run_smoke_tests
        ;;
    all)
        deploy_firestore
        deploy_functions
        deploy_frontend
        run_smoke_tests
        ;;
    *)
        log_error "Invalid component: $COMPONENT"
        echo "Valid components: all, firestore, functions, frontend, test"
        exit 1
        ;;
esac

# Print summary
echo ""
log_step "Deployment Summary"
log_success "Deployment completed successfully!"
echo ""
log_info "Staging Environment URLs:"
echo "  Frontend: https://$PROJECT_ID.web.app"
echo "  Functions: https://$REGION-$PROJECT_ID.cloudfunctions.net"
echo "  Console: https://console.firebase.google.com/project/$PROJECT_ID"
echo ""
log_info "Next Steps:"
echo "  1. Run manual tests (see smoke test script output)"
echo "  2. Verify all features working correctly"
echo "  3. Check Firebase Console for any errors"
echo "  4. Monitor function logs: firebase functions:log --project $PROJECT_ID"
echo ""
log_success "Staging deployment complete! 🎉"

