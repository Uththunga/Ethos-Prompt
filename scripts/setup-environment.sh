#!/bin/bash

# RAG Prompt Library - Environment Setup Script
# This script sets up the environment configuration for different deployment stages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment..."
    
    # Check for required commands
    if ! command_exists "node"; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    if ! command_exists "npm"; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command_exists "firebase"; then
        print_warning "Firebase CLI is not installed. Installing..."
        npm install -g firebase-tools
    fi
    
    print_success "Environment validation completed"
}

# Function to setup frontend environment
setup_frontend_env() {
    local env_type=$1
    print_status "Setting up frontend environment for: $env_type"
    
    cd frontend
    
    case $env_type in
        "development")
            if [ ! -f ".env" ]; then
                cp .env.development .env
                print_success "Created .env from .env.development"
            else
                print_warning ".env already exists, skipping creation"
            fi
            ;;
        "production")
            if [ ! -f ".env.production.local" ]; then
                cp .env.production .env.production.local
                print_success "Created .env.production.local from .env.production"
            else
                print_warning ".env.production.local already exists, skipping creation"
            fi
            ;;
        *)
            print_error "Unknown environment type: $env_type"
            exit 1
            ;;
    esac
    
    cd ..
}

# Function to setup backend environment
setup_backend_env() {
    local env_type=$1
    print_status "Setting up backend environment for: $env_type"
    
    cd functions
    
    if [ ! -f ".env" ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
        print_warning "Please edit functions/.env and add your API keys"
    else
        print_warning "functions/.env already exists, skipping creation"
    fi
    
    cd ..
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd functions
    npm install
    pip install -r requirements.txt
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to setup Firebase emulators
setup_emulators() {
    print_status "Setting up Firebase emulators..."
    
    # Check if firebase.json exists
    if [ ! -f "firebase.json" ]; then
        print_error "firebase.json not found. Please run 'firebase init' first."
        exit 1
    fi
    
    # Install emulator dependencies
    firebase setup:emulators:firestore
    firebase setup:emulators:auth
    firebase setup:emulators:functions
    firebase setup:emulators:storage
    
    print_success "Firebase emulators setup completed"
}

# Function to validate configuration
validate_config() {
    print_status "Validating configuration..."
    
    # Check frontend config
    if [ -f "frontend/.env" ]; then
        print_success "Frontend environment configuration found"
    else
        print_warning "Frontend environment configuration not found"
    fi
    
    # Check backend config
    if [ -f "functions/.env" ]; then
        print_success "Backend environment configuration found"
    else
        print_warning "Backend environment configuration not found"
    fi
    
    # Check Firebase config
    if [ -f "firebase.json" ]; then
        print_success "Firebase configuration found"
    else
        print_warning "Firebase configuration not found"
    fi
}

# Function to display next steps
show_next_steps() {
    print_status "Setup completed! Next steps:"
    echo ""
    echo "1. Edit environment files with your actual values:"
    echo "   - frontend/.env (for development)"
    echo "   - frontend/.env.production.local (for production)"
    echo "   - functions/.env (for backend)"
    echo ""
    echo "2. Add your API keys:"
    echo "   - OpenRouter API key in functions/.env"
    echo "   - OpenAI API key in functions/.env (if using OpenAI embeddings)"
    echo ""
    echo "3. Start development:"
    echo "   - Run 'npm run dev' in frontend/ for frontend development"
    echo "   - Run 'firebase emulators:start' for backend development"
    echo ""
    echo "4. Deploy to production:"
    echo "   - Run 'npm run build' in frontend/"
    echo "   - Run 'firebase deploy' for full deployment"
    echo ""
}

# Main function
main() {
    local env_type=${1:-"development"}
    
    print_status "RAG Prompt Library - Environment Setup"
    print_status "Environment: $env_type"
    echo ""
    
    validate_environment
    setup_frontend_env "$env_type"
    setup_backend_env "$env_type"
    
    if [ "$env_type" = "development" ]; then
        setup_emulators
    fi
    
    install_dependencies
    validate_config
    show_next_steps
    
    print_success "Environment setup completed successfully!"
}

# Check if script is being run directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
