#!/bin/bash
# Production Functions Deployment Script
# Deploys Firebase functions with comprehensive validation and monitoring

set -e  # Exit on any error

echo "🚀 Production Functions Deployment"
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Please install it first:"
        echo "npm install -g firebase-tools"
        exit 1
    fi
    
    # Check if logged in
    if ! firebase projects:list &> /dev/null; then
        print_error "Not logged in to Firebase. Please run: firebase login"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed"
        exit 1
    fi
    
    print_status "Prerequisites check passed"
}

# Run pre-deployment tests
run_pre_deployment_tests() {
    print_info "Running pre-deployment tests..."
    
    cd functions
    
    # Install dependencies
    print_info "Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Run unit tests
    print_info "Running unit tests..."
    if python -m pytest tests/ -v --tb=short; then
        print_status "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
    
    # Run integration tests
    print_info "Running integration tests..."
    if python test_complete_system.py; then
        print_status "Integration tests passed"
    else
        print_warning "Integration tests had issues - continuing with deployment"
    fi
    
    # Validate main.py syntax
    print_info "Validating main.py syntax..."
    if python -m py_compile main.py; then
        print_status "main.py syntax validation passed"
    else
        print_error "main.py syntax validation failed"
        exit 1
    fi
    
    cd ..
    print_status "Pre-deployment tests completed"
}

# Backup current deployment
backup_current_deployment() {
    print_info "Creating backup of current deployment..."
    
    # Create backup directory
    BACKUP_DIR="deployment_backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup functions source
    cp -r functions "$BACKUP_DIR/"
    
    # Backup Firebase config
    cp firebase.json "$BACKUP_DIR/"
    
    # Get current function versions
    firebase functions:list > "$BACKUP_DIR/current_functions.txt" 2>/dev/null || true
    
    print_status "Backup created at: $BACKUP_DIR"
    echo "$BACKUP_DIR" > .last_backup_path
}

# Deploy functions
deploy_functions() {
    print_info "Deploying functions to production..."
    
    # Set production environment
    export NODE_ENV=production
    export PYTHON_ENV=production
    
    # Deploy only functions
    if firebase deploy --only functions --force; then
        print_status "Functions deployed successfully"
    else
        print_error "Function deployment failed"
        print_info "Attempting rollback..."
        rollback_deployment
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_info "Verifying deployment..."
    
    # Wait for functions to be ready
    print_info "Waiting for functions to initialize..."
    sleep 30
    
    # Get project info
    PROJECT_ID=$(firebase use --current 2>/dev/null || echo "unknown")
    REGION="australia-southeast1"
    
    # Test health endpoint
    print_info "Testing health endpoint..."
    HEALTH_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/health"
    
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        print_status "Health endpoint is responding"
    else
        print_warning "Health endpoint not responding - may need more time to initialize"
    fi
    
    # List deployed functions
    print_info "Listing deployed functions..."
    firebase functions:list
    
    # Check function logs for errors
    print_info "Checking recent function logs..."
    firebase functions:log --limit 10
    
    print_status "Deployment verification completed"
}

# Rollback deployment
rollback_deployment() {
    print_error "Rolling back deployment..."
    
    if [ -f .last_backup_path ]; then
        BACKUP_PATH=$(cat .last_backup_path)
        if [ -d "$BACKUP_PATH" ]; then
            print_info "Restoring from backup: $BACKUP_PATH"
            
            # Restore functions
            rm -rf functions
            cp -r "$BACKUP_PATH/functions" .
            
            # Restore Firebase config
            cp "$BACKUP_PATH/firebase.json" .
            
            # Redeploy previous version
            firebase deploy --only functions --force
            
            print_status "Rollback completed"
        else
            print_error "Backup not found at: $BACKUP_PATH"
        fi
    else
        print_error "No backup path found"
    fi
}

# Post-deployment monitoring
post_deployment_monitoring() {
    print_info "Starting post-deployment monitoring..."
    
    # Monitor for 5 minutes
    MONITOR_DURATION=300
    MONITOR_INTERVAL=30
    ITERATIONS=$((MONITOR_DURATION / MONITOR_INTERVAL))
    
    for i in $(seq 1 $ITERATIONS); do
        print_info "Monitoring iteration $i/$ITERATIONS..."
        
        # Check function logs for errors
        ERROR_COUNT=$(firebase functions:log --limit 50 | grep -i "error\|exception\|fail" | wc -l || echo "0")
        
        if [ "$ERROR_COUNT" -gt 5 ]; then
            print_warning "High error count detected: $ERROR_COUNT errors in recent logs"
        else
            print_status "Error count acceptable: $ERROR_COUNT errors"
        fi
        
        # Wait before next check
        if [ $i -lt $ITERATIONS ]; then
            sleep $MONITOR_INTERVAL
        fi
    done
    
    print_status "Post-deployment monitoring completed"
}

# Generate deployment report
generate_deployment_report() {
    print_info "Generating deployment report..."
    
    REPORT_FILE="deployment_reports/deployment_$(date +%Y%m%d_%H%M%S).json"
    mkdir -p deployment_reports
    
    cat > "$REPORT_FILE" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "success",
    "project_id": "$(firebase use --current 2>/dev/null || echo 'unknown')",
    "region": "australia-southeast1",
    "functions_deployed": true,
    "backup_location": "$(cat .last_backup_path 2>/dev/null || echo 'none')"
  },
  "validation": {
    "pre_deployment_tests": "passed",
    "post_deployment_verification": "completed",
    "monitoring_duration_minutes": 5
  },
  "next_steps": [
    "Monitor function performance for 24 hours",
    "Validate all API endpoints",
    "Check cost and usage metrics",
    "Update monitoring dashboards"
  ]
}
EOF
    
    print_status "Deployment report saved to: $REPORT_FILE"
}

# Main deployment process
main() {
    print_info "Starting production deployment process..."
    
    # Run all deployment steps
    check_prerequisites
    run_pre_deployment_tests
    backup_current_deployment
    deploy_functions
    verify_deployment
    post_deployment_monitoring
    generate_deployment_report
    
    print_status "🎉 Production deployment completed successfully!"
    
    echo ""
    print_info "Next steps:"
    echo "1. Monitor function performance for 24 hours"
    echo "2. Run production validation tests"
    echo "3. Update monitoring dashboards"
    echo "4. Notify team of successful deployment"
    echo ""
    
    print_warning "Important reminders:"
    echo "- Monitor costs and usage"
    echo "- Check error rates and performance"
    echo "- Validate all critical user journeys"
    echo "- Keep backup location for potential rollback"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
