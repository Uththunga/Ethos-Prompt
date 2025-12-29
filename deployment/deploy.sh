#!/bin/bash

# RAG Prompt Library - Production Deployment Script
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="rag-prompt-library"
ENVIRONMENT="production"
DOMAIN="rag-prompt-library.com"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install it first."
        exit 1
    fi
    
    # Check if logged into Firebase
    if ! firebase projects:list &> /dev/null; then
        log_error "Not logged into Firebase. Please run 'firebase login' first."
        exit 1
    fi
    
    log_success "All prerequisites met"
}

run_tests() {
    log_info "Running comprehensive test suite..."
    
    # Frontend tests
    log_info "Running frontend tests..."
    cd frontend
    npm test -- --coverage --watchAll=false
    cd ..
    
    # Backend tests
    log_info "Running backend tests..."
    cd functions
    npm test
    cd ..
    
    # Integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    # Security tests
    log_info "Running security tests..."
    npm run test:security
    
    log_success "All tests passed"
}

security_scan() {
    log_info "Running security scans..."
    
    # Dependency vulnerability scan
    log_info "Scanning dependencies for vulnerabilities..."
    cd frontend && npm audit --audit-level=high && cd ..
    cd functions && npm audit --audit-level=high && cd ..
    
    # Code security scan
    log_info "Running code security analysis..."
    npm run security:scan
    
    # Configuration security check
    log_info "Checking configuration security..."
    npm run security:config
    
    log_success "Security scans completed"
}

build_application() {
    log_info "Building application for production..."
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    cd frontend
    npm ci --production
    
    # Build frontend
    log_info "Building frontend..."
    npm run build
    cd ..
    
    # Install backend dependencies
    log_info "Installing backend dependencies..."
    cd functions
    npm ci --production
    
    # Build backend
    log_info "Building backend..."
    npm run build
    cd ..
    
    log_success "Application built successfully"
}

deploy_database() {
    log_info "Deploying database configuration..."
    
    # Deploy Firestore rules
    log_info "Deploying Firestore security rules..."
    firebase deploy --only firestore:rules --project $PROJECT_ID
    
    # Deploy Firestore indexes
    log_info "Deploying Firestore indexes..."
    firebase deploy --only firestore:indexes --project $PROJECT_ID
    
    # Verify database deployment
    log_info "Verifying database deployment..."
    npm run verify:database
    
    log_success "Database deployed successfully"
}

deploy_backend() {
    log_info "Deploying backend services..."
    
    # Set environment configuration
    log_info "Setting environment configuration..."
    firebase functions:config:set \
        app.environment="$ENVIRONMENT" \
        app.domain="$DOMAIN" \
        security.encryption_enabled="true" \
        monitoring.enabled="true" \
        --project $PROJECT_ID
    
    # Deploy Cloud Functions
    log_info "Deploying Cloud Functions..."
    firebase deploy --only functions --project $PROJECT_ID
    
    # Verify backend deployment
    log_info "Verifying backend deployment..."
    npm run verify:functions
    
    log_success "Backend deployed successfully"
}

deploy_frontend() {
    log_info "Deploying frontend application..."
    
    # Deploy to Firebase Hosting
    log_info "Deploying to Firebase Hosting..."
    firebase deploy --only hosting --project $PROJECT_ID
    
    # Verify frontend deployment
    log_info "Verifying frontend deployment..."
    npm run verify:frontend
    
    log_success "Frontend deployed successfully"
}

deploy_monitoring() {
    log_info "Deploying monitoring and alerting..."
    
    # Deploy monitoring configuration
    log_info "Setting up monitoring..."
    npm run deploy:monitoring
    
    # Deploy alerting rules
    log_info "Setting up alerting..."
    npm run deploy:alerts
    
    # Deploy scaling rules
    log_info "Setting up auto-scaling..."
    npm run deploy:scaling
    
    log_success "Monitoring and alerting deployed"
}

run_smoke_tests() {
    log_info "Running post-deployment smoke tests..."
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    npm run test:smoke:api
    
    # Test frontend functionality
    log_info "Testing frontend functionality..."
    npm run test:smoke:frontend
    
    # Test authentication
    log_info "Testing authentication..."
    npm run test:smoke:auth
    
    # Test database connectivity
    log_info "Testing database connectivity..."
    npm run test:smoke:database
    
    log_success "Smoke tests passed"
}

verify_deployment() {
    log_info "Verifying complete deployment..."
    
    # Check service health
    log_info "Checking service health..."
    curl -f "https://$DOMAIN/api/health" || {
        log_error "Health check failed"
        exit 1
    }
    
    # Check frontend accessibility
    log_info "Checking frontend accessibility..."
    curl -f "https://$DOMAIN" || {
        log_error "Frontend accessibility check failed"
        exit 1
    }
    
    # Verify SSL certificate
    log_info "Verifying SSL certificate..."
    echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
    
    # Check monitoring
    log_info "Verifying monitoring..."
    npm run verify:monitoring
    
    log_success "Deployment verification completed"
}

setup_monitoring_alerts() {
    log_info "Setting up production monitoring alerts..."
    
    # Create monitoring dashboard
    log_info "Creating monitoring dashboard..."
    npm run create:dashboard
    
    # Set up alert notifications
    log_info "Configuring alert notifications..."
    npm run setup:notifications
    
    # Test alert system
    log_info "Testing alert system..."
    npm run test:alerts
    
    log_success "Monitoring alerts configured"
}

backup_current_deployment() {
    log_info "Creating backup of current deployment..."
    
    # Backup database
    log_info "Backing up database..."
    gcloud firestore export gs://$PROJECT_ID-backups/pre-deployment-$(date +%Y%m%d-%H%M%S) --project $PROJECT_ID
    
    # Backup configuration
    log_info "Backing up configuration..."
    firebase functions:config:get > config-backup-$(date +%Y%m%d-%H%M%S).json
    
    log_success "Backup completed"
}

main() {
    log_info "Starting production deployment for RAG Prompt Library"
    log_info "Project: $PROJECT_ID"
    log_info "Environment: $ENVIRONMENT"
    log_info "Domain: $DOMAIN"
    
    # Confirmation prompt
    read -p "Are you sure you want to deploy to production? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    # Deployment steps
    check_prerequisites
    backup_current_deployment
    run_tests
    security_scan
    build_application
    deploy_database
    deploy_backend
    deploy_frontend
    deploy_monitoring
    run_smoke_tests
    verify_deployment
    setup_monitoring_alerts
    
    log_success "🎉 Production deployment completed successfully!"
    log_info "Application is now live at: https://$DOMAIN"
    log_info "Monitoring dashboard: https://$DOMAIN/admin/monitoring"
    log_info "API documentation: https://$DOMAIN/api/docs"
    
    # Post-deployment checklist
    echo
    log_info "Post-deployment checklist:"
    echo "  [ ] Monitor application for first 30 minutes"
    echo "  [ ] Verify all critical user flows"
    echo "  [ ] Check error rates and performance metrics"
    echo "  [ ] Notify stakeholders of successful deployment"
    echo "  [ ] Update status page"
    echo "  [ ] Schedule post-deployment review"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
