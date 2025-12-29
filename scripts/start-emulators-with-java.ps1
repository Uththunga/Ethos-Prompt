# Start Firebase Emulators with Portable JDK
# This script sets up the Java environment and starts Firebase emulators

$ErrorActionPreference = 'Stop'

# Colors for output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "Firebase Emulators Startup Script" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

# Get script directory and project root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Set JAVA_HOME to portable JDK
$jdkPath = Join-Path $projectRoot ".tools\jdk\temurin-17\jdk-17.0.16+8"

if (-not (Test-Path $jdkPath)) {
    Write-ColorOutput "Portable JDK not found at: $jdkPath" "Red"
    Write-ColorOutput "   Downloading JDK..." "Yellow"

    # Download JDK
    & powershell -ExecutionPolicy Bypass -File "$scriptDir\download-portable-jdk.ps1"

    if (-not (Test-Path $jdkPath)) {
        Write-ColorOutput "Failed to download JDK" "Red"
        exit 1
    }
}

# Set environment variables
$env:JAVA_HOME = $jdkPath
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-ColorOutput "Java environment configured" "Green"
Write-ColorOutput "   JAVA_HOME: $env:JAVA_HOME" "Gray"

# Verify Java installation
try {
    $javaVersion = & java -version 2>&1 | Select-Object -First 1
    Write-ColorOutput "   Java Version: $javaVersion" "Gray"
} catch {
    Write-ColorOutput "Failed to verify Java installation" "Red"
    exit 1
}

Write-ColorOutput "`nStarting Firebase Emulators..." "Cyan"
Write-ColorOutput "   This may take a moment on first run...`n" "Gray"

# Check if firebase is installed
try {
    $firebaseVersion = & firebase --version 2>&1
    Write-ColorOutput "   Firebase CLI: $firebaseVersion" "Gray"
} catch {
    Write-ColorOutput "Firebase CLI not found. Please install it:" "Red"
    Write-ColorOutput "   npm install -g firebase-tools" "Yellow"
    exit 1
}

# Start emulators
Write-ColorOutput "`nLaunching emulators..." "Cyan"
Write-ColorOutput "   Press Ctrl+C to stop`n" "Gray"

try {
    # Start Firebase emulators
    & firebase emulators:start --only auth,firestore,functions,storage
} catch {
    Write-ColorOutput "`nEmulators failed to start: $_" "Red"
    exit 1
}
