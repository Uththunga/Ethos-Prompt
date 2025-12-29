# RAG Prompt Library - Complete Setup Guide

This guide provides step-by-step instructions for setting up the RAG Prompt Library system for development and production environments.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Python 3.11+** - [Download](https://python.org/)
- **Git** - [Download](https://git-scm.com/)
- **Firebase CLI** - Will be installed during setup

### Required Accounts
- **Firebase Account** - [Sign up](https://firebase.google.com/)
- **OpenRouter Account** - [Sign up](https://openrouter.ai/) (for AI models)
- **GitHub Account** - [Sign up](https://github.com/) (for deployment)

## 🚀 Quick Start (Automated Setup)

### Windows
```powershell
# Clone the repository
git clone <repository-url>
cd React-App-000730

# Run automated setup
.\scripts\setup-environment.ps1 development
```

### Linux/Mac
```bash
# Clone the repository
git clone <repository-url>
cd React-App-000730

# Make script executable and run
chmod +x scripts/setup-environment.sh
./scripts/setup-environment.sh development
```

## 🔧 Manual Setup (Detailed)

### 1. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd React-App-000730

# Verify project structure
ls -la
# Should see: frontend/, functions/, docs/, scripts/, firebase.json
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm list --depth=0

# Copy environment template
cp .env.example .env

# Edit environment variables
# Windows: notepad .env
# Linux/Mac: nano .env
```

**Frontend Environment Variables (.env):**
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Development Settings
VITE_USE_EMULATORS=true
VITE_APP_ENVIRONMENT=development
```

### 3. Backend Setup

```bash
cd ../functions

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit environment variables
# Windows: notepad .env
# Linux/Mac: nano .env
```

**Backend Environment Variables (.env):**
```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_API_KEY_RAG=sk-or-v1-your-rag-api-key-here

# Model Configuration
PROMPT_GENERATION_MODEL=nvidia/llama-3.1-nemotron-ultra-253b-v1:free
RAG_PROCESSING_MODEL=nvidia/llama-3.1-nemotron-ultra-253b-v1:free

# Environment
PYTHON_ENV=development
NODE_ENV=development
```

### 4. Firebase Setup

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase use --add
# Select your Firebase project from the list

# Verify Firebase configuration
firebase projects:list
```

### 5. Development Environment

```bash
# Start frontend development server
cd frontend
npm run dev
# Frontend will be available at http://localhost:5173

# In a new terminal, start Firebase emulators
cd ..
firebase emulators:start
# Emulators will start on various ports (see output)
```

## 🔥 Firebase Configuration

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `rag-prompt-library`
4. Enable Google Analytics (recommended)
5. Choose or create Analytics account

### Enable Firebase Services

1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google sign-in
   - Add authorized domains if needed

2. **Firestore Database**
   - Go to Firestore Database
   - Create database in production mode
   - Choose location (us-central1 recommended)

3. **Cloud Storage**
   - Go to Storage
   - Get started with default rules
   - Choose same location as Firestore

4. **Cloud Functions**
   - Will be enabled automatically when deploying

### Firebase Configuration Values

Get your Firebase configuration:
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click on web app or "Add app" if none exists
4. Copy the configuration object

## 🔑 API Keys Setup

### OpenRouter API Keys

1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up/Login
3. Go to [API Keys](https://openrouter.ai/keys)
4. Create new API key
5. Copy the key to your `.env` files

### Optional: OpenAI API Key

If you want to use OpenAI models:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create API key
3. Add to functions/.env: `OPENAI_API_KEY=your_key_here`

## 🧪 Testing Setup

```bash
# Run frontend tests
cd frontend
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui
```

## 🚀 Production Deployment

### 1. Build Application

```bash
# Build frontend
cd frontend
npm run build

# Verify build
ls -la dist/
```

### 2. Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage
```

### 3. Production Environment Variables

For production, update environment variables:

**Frontend (.env.production):**
```env
VITE_USE_EMULATORS=false
VITE_APP_ENVIRONMENT=production
```

**Backend (Firebase Functions config):**
```bash
firebase functions:config:set openrouter.api_key="your_production_key"
firebase functions:config:set environment="production"
```

## 🔍 Verification

### Development Verification

```bash
# Check frontend
curl http://localhost:5173

# Check Firebase emulators
curl http://localhost:4000

# Run production readiness check
node scripts/production_readiness_check.js
```

### Production Verification

```bash
# Check deployed application
curl https://your-project.web.app

# Run API integration tests
node scripts/api_integration_test.js

# Check Firebase Functions
firebase functions:log
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase CLI not found**
   ```bash
   npm install -g firebase-tools
   ```

2. **Python dependencies fail**
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Node.js version issues**
   ```bash
   node --version  # Should be 18+
   nvm use 18      # If using nvm
   ```

4. **Firebase emulator connection issues**
   - Check if ports are available (4000, 5001, 8080, 9099, 9199)
   - Restart emulators: `firebase emulators:start --only firestore,auth,functions,storage`

5. **Build failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Getting Help

- **Documentation**: Check `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Logs**: Check browser console and Firebase Functions logs
- **Community**: Join our Discord/Slack for support

## 📚 Next Steps

After successful setup:

1. **Read the User Guide**: `docs/USER_GUIDE.md`
2. **Explore API Documentation**: `docs/API_DOCUMENTATION.md`
3. **Check Development Guidelines**: `docs/DEVELOPMENT_GUIDELINES.md`
4. **Review Security Best Practices**: `docs/SECURITY.md`

---

**Setup complete! 🎉 You're ready to start building with RAG Prompt Library.**
