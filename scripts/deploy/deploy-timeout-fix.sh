#!/usr/bin/env bash
# Deploy Timeout Fix to Staging
# This script deploys the prompt execution timeout fix to the staging environment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_ID="rag-prompt-library-staging"
REGION="australia-southeast1"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_step() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI not found. Please install it first:"
        echo "npm install -g firebase-tools"
        exit 1
    fi
    log_success "Firebase CLI found"
    
    # Check if logged in to Firebase
    if ! firebase projects:list &> /dev/null; then
        log_error "Not logged in to Firebase. Please run:"
        echo "firebase login"
        exit 1
    fi
    log_success "Firebase authentication verified"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    log_success "Node.js found: $(node --version)"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm not found. Please install npm"
        exit 1
    fi
    log_success "npm found: $(npm --version)"
}

# Show summary of changes
show_changes() {
    log_step "Summary of Changes"
    
    echo "This deployment includes the following fixes:"
    echo ""
    echo "1. Frontend Watchdog Timer Fix"
    echo "   - File: frontend/src/components/execution/PromptExecutor.tsx"
    echo "   - Change: 5s → 150s timeout (staging)"
    echo "   - Impact: Prevents false-positive timeouts"
    echo ""
    echo "2. Streaming Execution Timeout Fix"
    echo "   - File: frontend/src/hooks/useStreamingExecution.ts"
    echo "   - Change: 5s → 150s timeout (staging)"
    echo "   - Impact: Consistent timeout across all execution modes"
    echo ""
    echo "3. Enhanced Error Handling"
    echo "   - Better error messages for users"
    echo "   - Comprehensive logging for debugging"
    echo "   - Model performance suggestions"
    echo ""
    
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Deployment cancelled by user"
        exit 0
    fi
}

# Build frontend
build_frontend() {
    log_step "Building Frontend for Staging"
    
    cd frontend
    
    log_info "Installing dependencies..."
    npm ci
    log_success "Dependencies installed"
    
    log_info "Building frontend with staging configuration..."
    npm run build:staging
    log_success "Frontend built successfully"
    
    cd ..
}

# Deploy to Firebase Hosting
deploy_hosting() {
    log_step "Deploying to Firebase Hosting (Staging)"
    
    log_info "Deploying to project: $PROJECT_ID"
    firebase deploy --only hosting --project $PROJECT_ID
    log_success "Frontend deployed successfully"
    
    echo ""
    log_success "Deployment URL: https://$PROJECT_ID.web.app"
}

# Verify deployment
verify_deployment() {
    log_step "Verifying Deployment"
    
    local url="https://$PROJECT_ID.web.app"
    
    log_info "Checking if site is accessible..."
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        log_success "Site is accessible"
    else
        log_warning "Site may not be fully deployed yet. Please check manually."
    fi
    
    echo ""
    log_info "Please verify the fix by:"
    echo "1. Navigate to: $url/dashboard/prompts/KIcc8OOyJhcoQh5oZzCU/execute"
    echo "2. Execute the prompt"
    echo "3. Check browser console for logs:"
    echo "   - 🚀 Starting prompt execution"
    echo "   - ✅ Prompt execution completed successfully"
    echo "   - 🏁 Execution finished"
    echo "4. Verify execution completes without timeout"
}

# Show next steps
show_next_steps() {
    log_step "Next Steps"
    
    echo "✅ Deployment Complete!"
    echo ""
    echo "📋 Testing Checklist:"
    echo ""
    echo "1. Test Normal Execution:"
    echo "   - URL: https://$PROJECT_ID.web.app/dashboard/prompts/KIcc8OOyJhcoQh5oZzCU/execute"
    echo "   - Expected: Completes in 10-20 seconds"
    echo "   - Check: No timeout errors"
    echo ""
    echo "2. Test Slow Model:"
    echo "   - Select: Llama 3.3 70B or similar"
    echo "   - Expected: Completes in 30-60 seconds"
    echo "   - Check: No false-positive timeouts"
    echo ""
    echo "3. Monitor Logs:"
    echo "   - Browser Console: Check for execution logs"
    echo "   - Firebase Functions: firebase functions:log --project $PROJECT_ID"
    echo ""
    echo "4. Report Issues:"
    echo "   - If timeouts still occur, check PROMPT_EXECUTION_TIMEOUT_FIX_REPORT.md"
    echo "   - Collect browser console logs"
    echo "   - Note execution time and model used"
    echo ""
    echo "📊 Monitoring:"
    echo "   - Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
    echo "   - Functions Logs: firebase functions:log --project $PROJECT_ID"
    echo ""
}

# Main deployment flow
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║     Prompt Execution Timeout Fix - Staging Deployment     ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    show_changes
    build_frontend
    deploy_hosting
    verify_deployment
    show_next_steps
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
}

# Run main function
main

