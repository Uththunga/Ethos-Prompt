# RAG Prompt Library - Environment Setup Script (PowerShell)
# This script sets up the environment configuration for different deployment stages

param(
    [Parameter(Position=0)]
    [ValidateSet("development", "production")]
    [string]$Environment = "development"
)

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if a command exists
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to validate environment
function Test-Environment {
    Write-Status "Validating environment..."
    
    # Check for required commands
    if (-not (Test-Command "node")) {
        Write-Error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error "npm is not installed. Please install npm."
        exit 1
    }
    
    if (-not (Test-Command "firebase")) {
        Write-Warning "Firebase CLI is not installed. Installing..."
        npm install -g firebase-tools
    }
    
    Write-Success "Environment validation completed"
}

# Function to setup frontend environment
function Set-FrontendEnvironment {
    param([string]$EnvType)
    Write-Status "Setting up frontend environment for: $EnvType"
    
    Push-Location "frontend"
    
    switch ($EnvType) {
        "development" {
            if (-not (Test-Path ".env")) {
                Copy-Item ".env.development" ".env"
                Write-Success "Created .env from .env.development"
            } else {
                Write-Warning ".env already exists, skipping creation"
            }
        }
        "production" {
            if (-not (Test-Path ".env.production.local")) {
                Copy-Item ".env.production" ".env.production.local"
                Write-Success "Created .env.production.local from .env.production"
            } else {
                Write-Warning ".env.production.local already exists, skipping creation"
            }
        }
        default {
            Write-Error "Unknown environment type: $EnvType"
            Pop-Location
            exit 1
        }
    }
    
    Pop-Location
}

# Function to setup backend environment
function Set-BackendEnvironment {
    param([string]$EnvType)
    Write-Status "Setting up backend environment for: $EnvType"
    
    Push-Location "functions"
    
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env from .env.example"
        Write-Warning "Please edit functions/.env and add your API keys"
    } else {
        Write-Warning "functions/.env already exists, skipping creation"
    }
    
    Pop-Location
}

# Function to install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Frontend dependencies
    Write-Status "Installing frontend dependencies..."
    Push-Location "frontend"
    npm install
    Pop-Location
    
    # Backend dependencies
    Write-Status "Installing backend dependencies..."
    Push-Location "functions"
    npm install
    
    # Check if Python is available for pip install
    if (Test-Command "pip") {
        pip install -r requirements.txt
    } elseif (Test-Command "python") {
        python -m pip install -r requirements.txt
    } else {
        Write-Warning "Python/pip not found. Please install Python dependencies manually."
    }
    
    Pop-Location
    
    Write-Success "Dependencies installed successfully"
}

# Function to setup Firebase emulators
function Set-FirebaseEmulators {
    Write-Status "Setting up Firebase emulators..."
    
    # Check if firebase.json exists
    if (-not (Test-Path "firebase.json")) {
        Write-Error "firebase.json not found. Please run 'firebase init' first."
        exit 1
    }
    
    # Install emulator dependencies
    firebase setup:emulators:firestore
    firebase setup:emulators:auth
    firebase setup:emulators:functions
    firebase setup:emulators:storage
    
    Write-Success "Firebase emulators setup completed"
}

# Function to validate configuration
function Test-Configuration {
    Write-Status "Validating configuration..."
    
    # Check frontend config
    if (Test-Path "frontend/.env") {
        Write-Success "Frontend environment configuration found"
    } else {
        Write-Warning "Frontend environment configuration not found"
    }
    
    # Check backend config
    if (Test-Path "functions/.env") {
        Write-Success "Backend environment configuration found"
    } else {
        Write-Warning "Backend environment configuration not found"
    }
    
    # Check Firebase config
    if (Test-Path "firebase.json") {
        Write-Success "Firebase configuration found"
    } else {
        Write-Warning "Firebase configuration not found"
    }
}

# Function to display next steps
function Show-NextSteps {
    Write-Status "Setup completed! Next steps:"
    Write-Host ""
    Write-Host "1. Edit environment files with your actual values:"
    Write-Host "   - frontend/.env (for development)"
    Write-Host "   - frontend/.env.production.local (for production)"
    Write-Host "   - functions/.env (for backend)"
    Write-Host ""
    Write-Host "2. Add your API keys:"
    Write-Host "   - OpenRouter API key in functions/.env"
    Write-Host "   - Google API key in functions/.env (for Google embeddings - primary)"
    Write-Host "   - OpenAI API key in functions/.env (for OpenAI embeddings - fallback)"
    Write-Host ""
    Write-Host "3. Start development:"
    Write-Host "   - Run 'npm run dev' in frontend/ for frontend development"
    Write-Host "   - Run 'firebase emulators:start' for backend development"
    Write-Host ""
    Write-Host "4. Deploy to production:"
    Write-Host "   - Run 'npm run build' in frontend/"
    Write-Host "   - Run 'firebase deploy' for full deployment"
    Write-Host ""
}

# Main execution
function Main {
    Write-Status "RAG Prompt Library - Environment Setup"
    Write-Status "Environment: $Environment"
    Write-Host ""
    
    Test-Environment
    Set-FrontendEnvironment $Environment
    Set-BackendEnvironment $Environment
    
    if ($Environment -eq "development") {
        Set-FirebaseEmulators
    }
    
    Install-Dependencies
    Test-Configuration
    Show-NextSteps
    
    Write-Success "Environment setup completed successfully!"
}

# Run main function
Main
