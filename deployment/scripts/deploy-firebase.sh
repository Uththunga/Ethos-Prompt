#!/bin/bash

# Firebase Production Deployment Script
# Deploys Cloud Functions, Firestore rules, and storage configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="rag-prompt-library-prod"
STAGING_PROJECT_ID="rag-prompt-library-staging"
BACKUP_DIR="deployment/backups/$(date +%Y%m%d-%H%M%S)"
LOG_FILE="deployment/logs/firebase-deploy-$(date +%Y%m%d-%H%M%S).log"

# Create directories if they don't exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Logging
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo -e "${BLUE}=== Firebase Production Deployment ===${NC}"
echo "Started at: $(date)"
echo "Project ID: $PROJECT_ID"
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

# Function to check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        print_status "FAIL" "Firebase CLI not installed"
        exit 1
    fi
    
    # Check if logged in
    if ! firebase projects:list >/dev/null 2>&1; then
        print_status "FAIL" "Not logged in to Firebase CLI"
        exit 1
    fi
    
    # Check if project exists
    if ! firebase projects:list | grep -q "$PROJECT_ID"; then
        print_status "FAIL" "Project $PROJECT_ID not found"
        exit 1
    fi
    
    print_status "PASS" "All prerequisites met"
}

# Function to backup current configuration
backup_current_config() {
    print_status "INFO" "Backing up current configuration..."
    
    # Backup Firestore rules
    if firebase firestore:rules:get --project="$PROJECT_ID" > "$BACKUP_DIR/firestore.rules.backup" 2>/dev/null; then
        print_status "PASS" "Firestore rules backed up"
    else
        print_status "WARN" "Could not backup Firestore rules"
    fi
    
    # Backup Storage rules
    if firebase storage:rules:get --project="$PROJECT_ID" > "$BACKUP_DIR/storage.rules.backup" 2>/dev/null; then
        print_status "PASS" "Storage rules backed up"
    else
        print_status "WARN" "Could not backup Storage rules"
    fi
    
    # Backup Firestore indexes
    if firebase firestore:indexes --project="$PROJECT_ID" --format=json > "$BACKUP_DIR/firestore.indexes.backup.json" 2>/dev/null; then
        print_status "PASS" "Firestore indexes backed up"
    else
        print_status "WARN" "Could not backup Firestore indexes"
    fi
    
    print_status "INFO" "Backup completed in $BACKUP_DIR"
}

# Function to validate configuration files
validate_config_files() {
    print_status "INFO" "Validating configuration files..."
    
    # Check firebase.json
    if [ ! -f "firebase.json" ]; then
        print_status "FAIL" "firebase.json not found"
        exit 1
    fi
    
    # Validate firebase.json syntax
    if ! python -m json.tool firebase.json >/dev/null 2>&1; then
        print_status "FAIL" "firebase.json has invalid JSON syntax"
        exit 1
    fi
    
    # Check Firestore rules
    if [ ! -f "firestore.rules" ]; then
        print_status "FAIL" "firestore.rules not found"
        exit 1
    fi
    
    # Check Storage rules
    if [ ! -f "storage.rules" ]; then
        print_status "FAIL" "storage.rules not found"
        exit 1
    fi
    
    # Check Firestore indexes
    if [ ! -f "firestore.indexes.json" ]; then
        print_status "FAIL" "firestore.indexes.json not found"
        exit 1
    fi
    
    # Check Functions directory
    if [ ! -d "functions" ]; then
        print_status "FAIL" "functions directory not found"
        exit 1
    fi
    
    # Check Functions requirements
    if [ ! -f "functions/requirements.txt" ]; then
        print_status "FAIL" "functions/requirements.txt not found"
        exit 1
    fi
    
    # Check main function file
    if [ ! -f "functions/main.py" ]; then
        print_status "FAIL" "functions/main.py not found"
        exit 1
    fi
    
    print_status "PASS" "All configuration files validated"
}

# Function to deploy Firestore rules
deploy_firestore_rules() {
    print_status "INFO" "Deploying Firestore rules..."
    
    if firebase deploy --only firestore:rules --project="$PROJECT_ID"; then
        print_status "PASS" "Firestore rules deployed successfully"
    else
        print_status "FAIL" "Failed to deploy Firestore rules"
        return 1
    fi
}

# Function to deploy Firestore indexes
deploy_firestore_indexes() {
    print_status "INFO" "Deploying Firestore indexes..."
    
    if firebase deploy --only firestore:indexes --project="$PROJECT_ID"; then
        print_status "PASS" "Firestore indexes deployed successfully"
    else
        print_status "FAIL" "Failed to deploy Firestore indexes"
        return 1
    fi
}

# Function to deploy Storage rules
deploy_storage_rules() {
    print_status "INFO" "Deploying Storage rules..."
    
    if firebase deploy --only storage --project="$PROJECT_ID"; then
        print_status "PASS" "Storage rules deployed successfully"
    else
        print_status "FAIL" "Failed to deploy Storage rules"
        return 1
    fi
}

# Function to deploy Cloud Functions
deploy_functions() {
    print_status "INFO" "Deploying Cloud Functions..."
    
    # Set production environment variables
    print_status "INFO" "Setting production environment variables..."
    
    # Note: In a real deployment, these would be set from secure storage
    firebase functions:config:set \
        openai.api_key="$OPENAI_API_KEY" \
        app.environment="production" \
        app.debug="false" \
        --project="$PROJECT_ID" || {
        print_status "WARN" "Could not set some environment variables"
    }
    
    # Deploy functions
    if firebase deploy --only functions --project="$PROJECT_ID"; then
        print_status "PASS" "Cloud Functions deployed successfully"
    else
        print_status "FAIL" "Failed to deploy Cloud Functions"
        return 1
    fi
}

# Function to verify deployment
verify_deployment() {
    print_status "INFO" "Verifying deployment..."
    
    # Wait for functions to be ready
    sleep 30
    
    # Test Firestore rules
    print_status "INFO" "Testing Firestore rules..."
    if firebase firestore:rules:test --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Firestore rules test passed"
    else
        print_status "WARN" "Firestore rules test failed or not available"
    fi
    
    # Check function endpoints
    print_status "INFO" "Checking function endpoints..."
    
    # Get the function URL
    FUNCTION_URL=$(firebase functions:list --project="$PROJECT_ID" 2>/dev/null | grep "https://" | head -1 | awk '{print $2}' || echo "")
    
    if [ -n "$FUNCTION_URL" ]; then
        if curl -s -f "$FUNCTION_URL/health" >/dev/null 2>&1; then
            print_status "PASS" "Function health check passed"
        else
            print_status "WARN" "Function health check failed"
        fi
    else
        print_status "WARN" "Could not determine function URL"
    fi
    
    # Check Firestore connectivity
    print_status "INFO" "Testing Firestore connectivity..."
    if firebase firestore:databases:list --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Firestore connectivity verified"
    else
        print_status "FAIL" "Firestore connectivity failed"
        return 1
    fi
}

# Function to rollback on failure
rollback_deployment() {
    print_status "WARN" "Rolling back deployment..."
    
    # Restore Firestore rules
    if [ -f "$BACKUP_DIR/firestore.rules.backup" ]; then
        cp "$BACKUP_DIR/firestore.rules.backup" firestore.rules
        firebase deploy --only firestore:rules --project="$PROJECT_ID" >/dev/null 2>&1
        print_status "INFO" "Firestore rules rolled back"
    fi
    
    # Restore Storage rules
    if [ -f "$BACKUP_DIR/storage.rules.backup" ]; then
        cp "$BACKUP_DIR/storage.rules.backup" storage.rules
        firebase deploy --only storage --project="$PROJECT_ID" >/dev/null 2>&1
        print_status "INFO" "Storage rules rolled back"
    fi
    
    print_status "WARN" "Rollback completed"
}

# Function to update security rules for production
update_security_rules() {
    print_status "INFO" "Updating security rules for production..."
    
    # Create production-specific Firestore rules
    cat > firestore.rules.prod << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Prompts - users can only access their own or shared prompts
    match /prompts/{promptId} {
      allow read, write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.isPublic == true);
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Documents - users can only access their own documents
    match /documents/{documentId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Workspaces - members can access workspace data
    match /workspaces/{workspaceId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.ownerId;
    }
    
    // Executions - users can only access their own executions
    match /executions/{executionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Beta users - read-only access to own data
    match /betaUsers/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
EOF

    # Backup original rules and use production rules
    cp firestore.rules firestore.rules.original
    cp firestore.rules.prod firestore.rules
    
    print_status "PASS" "Security rules updated for production"
}

# Main deployment function
main() {
    local exit_code=0
    
    # Check prerequisites
    check_prerequisites || exit 1
    
    # Backup current configuration
    backup_current_config
    
    # Validate configuration files
    validate_config_files || exit 1
    
    # Update security rules for production
    update_security_rules
    
    # Deploy components in order
    echo -e "\n${BLUE}=== Deploying Firestore Rules ===${NC}"
    deploy_firestore_rules || { rollback_deployment; exit 1; }
    
    echo -e "\n${BLUE}=== Deploying Firestore Indexes ===${NC}"
    deploy_firestore_indexes || { rollback_deployment; exit 1; }
    
    echo -e "\n${BLUE}=== Deploying Storage Rules ===${NC}"
    deploy_storage_rules || { rollback_deployment; exit 1; }
    
    echo -e "\n${BLUE}=== Deploying Cloud Functions ===${NC}"
    deploy_functions || { rollback_deployment; exit 1; }
    
    echo -e "\n${BLUE}=== Verifying Deployment ===${NC}"
    verify_deployment || exit_code=1
    
    echo -e "\n${BLUE}=== Deployment Summary ===${NC}"
    echo "Completed at: $(date)"
    echo "Project: $PROJECT_ID"
    echo "Backup location: $BACKUP_DIR"
    echo "Log file: $LOG_FILE"
    
    if [ $exit_code -eq 0 ]; then
        print_status "PASS" "Firebase deployment completed successfully"
    else
        print_status "WARN" "Firebase deployment completed with warnings"
    fi
    
    return $exit_code
}

# Handle script interruption
trap 'echo -e "\n${RED}Deployment interrupted${NC}"; rollback_deployment; exit 1' INT TERM

# Run main function
main "$@"
