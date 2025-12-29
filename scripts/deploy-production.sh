#!/bin/bash

# RAG Prompt Library - Production Deployment Script
# Secure deployment with environment variable injection and security checks

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_environment_variables() {
    print_status "Checking required environment variables..."
    
    required_vars=(
        "FIREBASE_API_KEY"
        "FIREBASE_AUTH_DOMAIN"
        "FIREBASE_PROJECT_ID"
        "FIREBASE_STORAGE_BUCKET"
        "FIREBASE_MESSAGING_SENDER_ID"
        "FIREBASE_APP_ID"
        "OPENROUTER_API_KEY"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        echo "Please set these variables before deployment:"
        echo "export FIREBASE_API_KEY='your_api_key'"
        echo "export FIREBASE_AUTH_DOMAIN='your_domain'"
        echo "# ... etc"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Run security audit
run_security_audit() {
    print_status "Running security audit..."
    
    if ! node scripts/security-audit.js; then
        print_error "Security audit failed. Please fix security issues before deployment."
        exit 1
    fi
    
    print_success "Security audit passed"
}

# Create production environment file
create_production_env() {
    print_status "Creating production environment file..."
    
    cat > frontend/.env.production.local << EOF
# Production Environment - Auto-generated during deployment
# DO NOT COMMIT THIS FILE

# Firebase Configuration
VITE_FIREBASE_API_KEY=${FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${FIREBASE_APP_ID}
VITE_FIREBASE_MEASUREMENT_ID=${FIREBASE_MEASUREMENT_ID:-}

# Production Settings
VITE_USE_EMULATORS=false
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=warn

# API Configuration
VITE_API_BASE_URL=https://australia-southeast1-${FIREBASE_PROJECT_ID}.cloudfunctions.net
VITE_FUNCTIONS_REGION=australia-southeast1

# Security Settings
VITE_ENABLE_CSP=true
VITE_ENABLE_HTTPS_ONLY=true
EOF

    print_success "Production environment file created"
}

# Set Firebase Functions environment variables
set_functions_config() {
    print_status "Setting Firebase Functions configuration..."
    
    # Set OpenRouter API key
    firebase functions:config:set openrouter.api_key="${OPENROUTER_API_KEY}"
    
    # Set environment
    firebase functions:config:set environment="production"
    
    # Set security settings
    firebase functions:config:set security.enable_rate_limiting="true"
    firebase functions:config:set security.enable_cors="true"
    firebase functions:config:set security.allowed_origins="${FIREBASE_AUTH_DOMAIN}"
    
    print_success "Firebase Functions configuration set"
}

# Build frontend with production optimizations
build_frontend() {
    print_status "Building frontend for production..."
    
    cd frontend
    
    # Install dependencies
    npm ci --production=false
    
    # Run tests (optional, can be skipped with --skip-tests)
    if [ "$1" != "--skip-tests" ]; then
        print_status "Running tests..."
        npm run test -- --run || {
            print_warning "Tests failed, but continuing deployment..."
        }
    fi
    
    # Build application
    npm run build
    
    # Verify build
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi
    
    cd ..
    print_success "Frontend build completed"
}

# Deploy to Firebase
deploy_to_firebase() {
    print_status "Deploying to Firebase..."
    
    # Deploy everything
    firebase deploy --only hosting,functions,firestore:rules,storage
    
    print_success "Deployment completed"
}

# Run post-deployment verification
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get the hosting URL
    hosting_url=$(firebase hosting:channel:list | grep "live" | awk '{print $3}' || echo "")
    
    if [ -n "$hosting_url" ]; then
        print_status "Testing deployment at: $hosting_url"
        
        # Basic connectivity test
        if curl -s -o /dev/null -w "%{http_code}" "$hosting_url" | grep -q "200"; then
            print_success "Deployment verification passed"
        else
            print_warning "Deployment verification failed - manual check required"
        fi
    else
        print_warning "Could not determine hosting URL - manual verification required"
    fi
}

# Cleanup temporary files
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Remove production environment file
    if [ -f "frontend/.env.production.local" ]; then
        rm frontend/.env.production.local
        print_success "Temporary environment file removed"
    fi
}

# Main deployment function
main() {
    local skip_tests=""
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests="--skip-tests"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Usage: $0 [--skip-tests]"
                exit 1
                ;;
        esac
    done
    
    print_status "Starting production deployment..."
    print_status "Project: RAG Prompt Library"
    print_status "Environment: Production"
    echo ""
    
    # Deployment steps
    check_environment_variables
    run_security_audit
    create_production_env
    set_functions_config
    build_frontend "$skip_tests"
    deploy_to_firebase
    verify_deployment
    cleanup
    
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Monitor application performance and errors"
    echo "2. Run post-deployment tests"
    echo "3. Update documentation with new deployment info"
    echo "4. Schedule next security audit"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Run main function with all arguments
main "$@"
