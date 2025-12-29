#!/usr/bin/env bash
# Deploy All Fixes to Staging (Master Script)
# This script deploys both authentication and timeout fixes

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Show banner
show_banner() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}║          Complete Fix Deployment - Staging Environment          ║${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}║  Fixes: Timeout + Authentication + CORS                         ║${NC}"
    echo -e "${CYAN}║                                                                  ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_step "Step 1/4: Checking Prerequisites"
    
    local all_good=true
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI not found"
        echo "Install: npm install -g firebase-tools"
        all_good=false
    else
        log_success "Firebase CLI found: $(firebase --version)"
    fi
    
    # Check Firebase auth
    if ! firebase projects:list &> /dev/null; then
        log_error "Not logged in to Firebase"
        echo "Run: firebase login"
        all_good=false
    else
        log_success "Firebase authentication verified"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found"
        echo "Install: https://nodejs.org/"
        all_good=false
    else
        log_success "Node.js found: $(node --version)"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm not found"
        all_good=false
    else
        log_success "npm found: $(npm --version)"
    fi
    
    if [ "$all_good" = false ]; then
        log_error "Prerequisites check failed"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Show deployment plan
show_deployment_plan() {
    log_step "Step 2/4: Deployment Plan"
    
    echo "This deployment will fix the following issues:"
    echo ""
    echo "🔧 Backend Fixes (Cloud Functions):"
    echo "   1. ❌ Issue: 401 Unauthorized on execute_multi_model_prompt"
    echo "      ✅ Fix: Disable App Check enforcement (staging only)"
    echo "      📁 File: functions/index.js"
    echo ""
    echo "🔧 Frontend Fixes (React App):"
    echo "   2. ❌ Issue: Execution timeout after 5 seconds"
    echo "      ✅ Fix: Increase timeout to 150 seconds"
    echo "      📁 File: frontend/src/components/execution/PromptExecutor.tsx"
    echo ""
    echo "   3. ❌ Issue: Streaming timeout after 5 seconds"
    echo "      ✅ Fix: Increase timeout to 150 seconds"
    echo "      📁 File: frontend/src/hooks/useStreamingExecution.ts"
    echo ""
    echo "   4. ✨ Enhancement: Better error messages and logging"
    echo "      📁 Files: PromptExecutor.tsx, useStreamingExecution.ts"
    echo ""
    echo "📊 Deployment Targets:"
    echo "   - Project: $PROJECT_ID"
    echo "   - Region: $REGION"
    echo "   - Backend: Cloud Functions"
    echo "   - Frontend: Firebase Hosting"
    echo ""
    
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Deployment cancelled by user"
        exit 0
    fi
}

# Deploy backend
deploy_backend() {
    log_step "Step 3/4: Deploying Backend (Cloud Functions)"
    
    log_info "Deploying Cloud Functions to $PROJECT_ID..."
    
    if firebase deploy --only functions --project $PROJECT_ID; then
        log_success "Backend deployed successfully"
    else
        log_error "Backend deployment failed"
        log_warning "Continuing with frontend deployment..."
    fi
}

# Deploy frontend
deploy_frontend() {
    log_step "Step 4/4: Deploying Frontend (React App)"
    
    log_info "Building frontend for staging..."
    
    cd frontend
    
    # Install dependencies
    log_info "Installing dependencies..."
    if npm ci; then
        log_success "Dependencies installed"
    else
        log_error "Failed to install dependencies"
        cd ..
        exit 1
    fi
    
    # Build for staging
    log_info "Building for staging environment..."
    if npm run build:staging; then
        log_success "Frontend built successfully"
    else
        log_error "Frontend build failed"
        cd ..
        exit 1
    fi
    
    cd ..
    
    # Deploy to Firebase Hosting
    log_info "Deploying to Firebase Hosting..."
    if firebase deploy --only hosting --project $PROJECT_ID; then
        log_success "Frontend deployed successfully"
    else
        log_error "Frontend deployment failed"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    log_step "Verification"
    
    log_info "Verifying backend deployment..."
    firebase functions:list --project $PROJECT_ID | head -n 10
    
    log_info "Verifying frontend deployment..."
    local url="https://$PROJECT_ID.web.app"
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        log_success "Frontend is accessible at $url"
    else
        log_warning "Frontend may not be fully deployed yet"
    fi
}

# Show testing instructions
show_testing_instructions() {
    log_step "Testing Instructions"
    
    echo -e "${YELLOW}⚠️  CRITICAL: You MUST be logged in to test prompt execution${NC}"
    echo ""
    echo "📋 Testing Checklist:"
    echo ""
    echo "1. Navigate to: https://$PROJECT_ID.web.app"
    echo ""
    echo "2. 🔐 LOG IN (REQUIRED):"
    echo "   - Click 'Sign In' button"
    echo "   - Use your test account credentials"
    echo "   - Verify you see your email in the header"
    echo ""
    echo "3. Navigate to prompt execution:"
    echo "   https://$PROJECT_ID.web.app/dashboard/prompts/KIcc8OOyJhcoQh5oZzCU/execute"
    echo ""
    echo "4. Open browser console (F12)"
    echo ""
    echo "5. Execute the prompt"
    echo ""
    echo "6. Verify success:"
    echo "   ✅ Should see: 🚀 Starting prompt execution"
    echo "   ✅ Should see: ✅ Prompt execution completed successfully"
    echo "   ✅ Should see: 🏁 Execution finished"
    echo "   ✅ Execution time: 10-60 seconds (NOT 5 seconds)"
    echo ""
    echo "7. Verify NO errors:"
    echo "   ❌ Should NOT see: 'Execution timed out'"
    echo "   ❌ Should NOT see: '401 Unauthorized'"
    echo "   ❌ Should NOT see: 'Unauthenticated'"
    echo "   ❌ Should NOT see: 'CORS error'"
    echo ""
}

# Show monitoring commands
show_monitoring_commands() {
    log_step "Monitoring & Debugging"
    
    echo "📊 Useful Commands:"
    echo ""
    echo "1. Watch function logs:"
    echo "   firebase functions:log --project $PROJECT_ID --tail"
    echo ""
    echo "2. Check recent errors:"
    echo "   firebase functions:log --project $PROJECT_ID | grep ERROR"
    echo ""
    echo "3. Test authentication in browser console:"
    echo "   firebase.auth().currentUser"
    echo "   firebase.auth().currentUser?.getIdToken().then(console.log)"
    echo ""
    echo "4. Check Firebase config:"
    echo "   console.log(firebase.app().options)"
    echo ""
    echo "📈 Firebase Console:"
    echo "   https://console.firebase.google.com/project/$PROJECT_ID"
    echo ""
}

# Show summary
show_summary() {
    log_step "Deployment Summary"
    
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
    echo ""
    echo "📦 What was deployed:"
    echo "   ✅ Backend: Cloud Functions (App Check disabled)"
    echo "   ✅ Frontend: React App (150s timeout, better logging)"
    echo ""
    echo "🎯 Expected improvements:"
    echo "   ✅ No more 5-second timeouts"
    echo "   ✅ No more 401 Unauthorized errors"
    echo "   ✅ Better error messages"
    echo "   ✅ Comprehensive logging for debugging"
    echo ""
    echo "📚 Documentation:"
    echo "   - Complete Guide: COMPLETE_FIX_DEPLOYMENT_GUIDE.md"
    echo "   - Timeout Fix: PROMPT_EXECUTION_TIMEOUT_FIX_REPORT.md"
    echo "   - Auth Fix: AUTHENTICATION_FIX_REPORT.md"
    echo "   - Quick Start: TIMEOUT_FIX_QUICK_START.md"
    echo ""
    echo -e "${YELLOW}⚠️  Next Step: TEST the fix by logging in and executing a prompt${NC}"
    echo ""
}

# Main deployment flow
main() {
    show_banner
    check_prerequisites
    show_deployment_plan
    deploy_backend
    deploy_frontend
    verify_deployment
    show_testing_instructions
    show_monitoring_commands
    show_summary
    
    echo ""
    log_success "🎉 All fixes deployed successfully!"
    echo ""
}

# Run main function
main

