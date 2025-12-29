#!/bin/bash

# RAG Prompt Library Deployment Script
# This script handles deployment to various environments

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="rag-prompt-library"
DOCKER_REGISTRY="gcr.io"  # Change to your registry
ENVIRONMENT=${1:-"development"}

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

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed"
        exit 1
    fi
    
    log_success "All dependencies are available"
}

setup_environment() {
    log_info "Setting up environment for: $ENVIRONMENT"
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        log_warning ".env file not found, creating template..."
        cat > .env << EOF
# AI Provider API Keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# Vector Database
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-east-1-aws

# Cache
REDIS_URL=redis://localhost:6379

# Firebase
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json

# Frontend
REACT_APP_API_URL=http://localhost:8080
REACT_APP_FIREBASE_CONFIG={}
EOF
        log_warning "Please update .env file with your actual API keys"
    fi
    
    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
}

build_images() {
    log_info "Building Docker images..."
    
    # Build AI service
    log_info "Building AI service image..."
    docker build -t ${PROJECT_NAME}-ai:${ENVIRONMENT} ./functions
    
    # Build frontend
    log_info "Building frontend image..."
    docker build -f Dockerfile.frontend -t ${PROJECT_NAME}-frontend:${ENVIRONMENT} .
    
    log_success "Docker images built successfully"
}

deploy_local() {
    log_info "Deploying to local environment..."
    
    # Stop existing containers
    docker-compose down
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        log_success "AI service is healthy"
    else
        log_error "AI service health check failed"
        exit 1
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend is healthy"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    log_success "Local deployment completed successfully"
    log_info "Services available at:"
    log_info "  - Frontend: http://localhost:3000"
    log_info "  - AI API: http://localhost:8080"
    log_info "  - Redis: localhost:6379"
}

deploy_firebase() {
    log_info "Deploying to Firebase..."
    
    # Check if Firebase CLI is installed
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI is not installed"
        log_info "Install it with: npm install -g firebase-tools"
        exit 1
    fi
    
    # Deploy functions
    log_info "Deploying Firebase Functions..."
    cd functions
    firebase deploy --only functions
    cd ..
    
    # Deploy hosting (if configured)
    if [ -f firebase.json ] && grep -q "hosting" firebase.json; then
        log_info "Deploying Firebase Hosting..."
        npm run build
        firebase deploy --only hosting
    fi
    
    log_success "Firebase deployment completed"
}

deploy_gcp() {
    log_info "Deploying to Google Cloud Platform..."
    
    # Check if gcloud CLI is installed
    if ! command -v gcloud &> /dev/null; then
        log_error "Google Cloud CLI is not installed"
        exit 1
    fi
    
    # Set project
    if [ -z "$GCP_PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID environment variable is not set"
        exit 1
    fi
    
    gcloud config set project $GCP_PROJECT_ID
    
    # Build and push images
    log_info "Building and pushing images to Container Registry..."
    
    # AI Service
    docker tag ${PROJECT_NAME}-ai:${ENVIRONMENT} ${DOCKER_REGISTRY}/${GCP_PROJECT_ID}/${PROJECT_NAME}-ai:${ENVIRONMENT}
    docker push ${DOCKER_REGISTRY}/${GCP_PROJECT_ID}/${PROJECT_NAME}-ai:${ENVIRONMENT}
    
    # Frontend
    docker tag ${PROJECT_NAME}-frontend:${ENVIRONMENT} ${DOCKER_REGISTRY}/${GCP_PROJECT_ID}/${PROJECT_NAME}-frontend:${ENVIRONMENT}
    docker push ${DOCKER_REGISTRY}/${GCP_PROJECT_ID}/${PROJECT_NAME}-frontend:${ENVIRONMENT}
    
    # Deploy to Cloud Run
    log_info "Deploying to Cloud Run..."
    
    # Deploy AI service
    gcloud run deploy ${PROJECT_NAME}-ai \
        --image ${DOCKER_REGISTRY}/${GCP_PROJECT_ID}/${PROJECT_NAME}-ai:${ENVIRONMENT} \
        --platform managed \
        --region us-central1 \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --max-instances 10
    
    # Deploy frontend
    gcloud run deploy ${PROJECT_NAME}-frontend \
        --image ${DOCKER_REGISTRY}/${GCP_PROJECT_ID}/${PROJECT_NAME}-frontend:${ENVIRONMENT} \
        --platform managed \
        --region us-central1 \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 5
    
    log_success "GCP deployment completed"
}

run_tests() {
    log_info "Running tests..."
    
    # Backend tests
    log_info "Running backend tests..."
    cd functions
    python -m pytest tests/ -v
    cd ..
    
    # Frontend tests
    log_info "Running frontend tests..."
    npm test -- --watchAll=false
    
    log_success "All tests passed"
}

cleanup() {
    log_info "Cleaning up..."
    
    # Remove unused Docker images
    docker image prune -f
    
    log_success "Cleanup completed"
}

show_help() {
    echo "RAG Prompt Library Deployment Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "Environments:"
    echo "  development  - Deploy locally with Docker Compose"
    echo "  firebase     - Deploy to Firebase"
    echo "  gcp          - Deploy to Google Cloud Platform"
    echo ""
    echo "Options:"
    echo "  --test       - Run tests before deployment"
    echo "  --build-only - Only build images, don't deploy"
    echo "  --cleanup    - Clean up after deployment"
    echo "  --help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development --test"
    echo "  $0 firebase"
    echo "  $0 gcp --cleanup"
}

# Main execution
main() {
    log_info "Starting deployment for environment: $ENVIRONMENT"
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --test)
                RUN_TESTS=true
                shift
                ;;
            --build-only)
                BUILD_ONLY=true
                shift
                ;;
            --cleanup)
                CLEANUP=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Check dependencies
    check_dependencies
    
    # Setup environment
    setup_environment
    
    # Run tests if requested
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    # Build images
    build_images
    
    # Deploy based on environment
    if [ "$BUILD_ONLY" != true ]; then
        case $ENVIRONMENT in
            development|local)
                deploy_local
                ;;
            firebase)
                deploy_firebase
                ;;
            gcp|cloud)
                deploy_gcp
                ;;
            *)
                log_error "Unknown environment: $ENVIRONMENT"
                show_help
                exit 1
                ;;
        esac
    fi
    
    # Cleanup if requested
    if [ "$CLEANUP" = true ]; then
        cleanup
    fi
    
    log_success "Deployment completed successfully!"
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
