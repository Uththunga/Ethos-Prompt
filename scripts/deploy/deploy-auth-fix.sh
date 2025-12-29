#!/usr/bin/env bash
# Deploy Authentication Fix to Staging
# This script deploys the App Check fix for execute_multi_model_prompt

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
    log_success "Firebase CLI found: $(firebase --version)"
    
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
}

# Show summary of changes
show_changes() {
    log_step "Summary of Changes"
    
    echo "This deployment fixes the following issues:"
    echo ""
    echo "1. ❌ Issue: execute_multi_model_prompt returns 401 Unauthorized"
    echo "   ✅ Fix: Disabled App Check enforcement (staging only)"
    echo "   📁 File: functions/index.js (lines 716-717)"
    echo ""
    echo "2. ❌ Issue: CORS errors on streaming execution"
    echo "   ℹ️  Status: CORS config already correct, may be auth-related"
    echo "   📁 File: functions/main.py (already configured)"
    echo ""
    echo "3. ❌ Issue: Unauthenticated errors"
    echo "   ℹ️  Action: Verify user is logged in before testing"
    echo ""
    
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Deployment cancelled by user"
        exit 0
    fi
}

# Deploy functions
deploy_functions() {
    log_step "Deploying Cloud Functions to Staging"
    
    log_info "Deploying to project: $PROJECT_ID"
    log_info "Region: $REGION"
    
    # Deploy only functions (faster than full deploy)
    log_info "Deploying functions..."
    firebase deploy --only functions --project $PROJECT_ID
    
    if [ $? -eq 0 ]; then
        log_success "Functions deployed successfully"
    else
        log_error "Function deployment failed"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    log_step "Verifying Deployment"
    
    log_info "Listing deployed functions..."
    firebase functions:list --project $PROJECT_ID
    
    log_success "Deployment verified"
}

# Show testing instructions
show_testing_instructions() {
    log_step "Testing Instructions"
    
    echo "📋 Critical: User MUST be logged in to test"
    echo ""
    echo "1. Navigate to: https://$PROJECT_ID.web.app"
    echo ""
    echo "2. 🔐 LOG IN (REQUIRED)"
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
    echo "6. Check for errors:"
    echo "   ✅ Should NOT see: '401 Unauthorized'"
    echo "   ✅ Should NOT see: 'Unauthenticated'"
    echo "   ✅ Should NOT see: 'CORS error'"
    echo "   ✅ Should see: Execution success"
    echo ""
}

# Show debugging commands
show_debugging_commands() {
    log_step "Debugging Commands"
    
    echo "If issues persist, use these commands:"
    echo ""
    echo "1. Watch function logs:"
    echo "   firebase functions:log --project $PROJECT_ID --limit 50"
    echo ""
    echo "2. Check specific function:"
    echo "   firebase functions:log --project $PROJECT_ID --only execute_multi_model_prompt"
    echo ""
    echo "3. Test authentication in browser console:"
    echo "   firebase.auth().currentUser"
    echo "   firebase.auth().currentUser?.getIdToken().then(console.log)"
    echo ""
    echo "4. Check Firebase config:"
    echo "   console.log(firebase.app().options)"
    echo ""
    echo "5. Monitor real-time logs:"
    echo "   firebase functions:log --project $PROJECT_ID --tail"
    echo ""
}

# Show next steps
show_next_steps() {
    log_step "Next Steps"
    
    echo "✅ Backend Deployment Complete!"
    echo ""
    echo "📋 Now deploy frontend timeout fix:"
    echo ""
    echo "Windows:"
    echo "  .\\deploy-timeout-fix.ps1"
    echo ""
    echo "Linux/Mac:"
    echo "  ./deploy-timeout-fix.sh"
    echo ""
    echo "Or manually:"
    echo "  cd frontend"
    echo "  npm run build:staging"
    echo "  cd .."
    echo "  firebase deploy --only hosting --project $PROJECT_ID"
    echo ""
    echo "📊 Monitoring:"
    echo "  - Firebase Console: https://console.firebase.google.com/project/$PROJECT_ID"
    echo "  - Functions Logs: firebase functions:log --project $PROJECT_ID"
    echo ""
}

# Main deployment flow
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║     Authentication Fix - Backend Deployment (Staging)     ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    show_changes
    deploy_functions
    verify_deployment
    show_testing_instructions
    show_debugging_commands
    show_next_steps
    
    echo ""
    log_success "🎉 Backend deployment completed successfully!"
    echo ""
    log_warning "⚠️  IMPORTANT: User must be logged in to test prompt execution"
    echo ""
}

# Run main function
main

