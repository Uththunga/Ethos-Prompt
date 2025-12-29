# RAG Prompt Library - Production Deployment Guide

## Overview

This guide covers deploying the RAG Prompt Library to production using Firebase hosting and Cloud Functions. The application is currently deployed and running at:

- **Frontend**: https://react-app-000730.web.app
- **Functions**: https://australia-southeast1-react-app-000730.cloudfunctions.net
- **Region**: Australia Southeast 1

## Prerequisites

### Required Software
- **Node.js** 18+ with npm
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Git** for version control

### Required Accounts & Services
- **Firebase Project** with Blaze plan (required for Cloud Functions)
- **Google Cloud Platform** account (automatically linked with Firebase)
- **API Keys** (for future AI integration):
  - OpenRouter API key (planned for AI features)
  - OpenAI API key (planned for embeddings)
  - Google AI API key (planned for Gemini models)

### Current Production Configuration
- **Firebase Project ID**: `react-app-000730`
- **Hosting URL**: `react-app-000730.web.app`
- **Functions Region**: `australia-southeast1`
- **Storage Bucket**: `react-app-000730.appspot.com`

## Quick Start (Production Deployment)

### 1. Clone Repository
```bash
git clone https://github.com/your-org/react-app-000730.git
cd react-app-000730
```

### 2. Install Dependencies
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies (Node.js functions)
cd ../functions
npm install
cd ..
```

### 3. Firebase Authentication
```bash
# Login to Firebase
firebase login

# Set the project
firebase use react-app-000730
```

### 4. Environment Configuration

**Frontend Environment (frontend/.env)**
```bash
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=react-app-000730.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=react-app-000730
VITE_FIREBASE_STORAGE_BUCKET=react-app-000730.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Application Configuration
VITE_APP_NAME="RAG Prompt Library"
VITE_APP_VERSION="1.0.0"
VITE_ENVIRONMENT="production"
```

**Functions Environment (functions/.env)**
```bash
# AI Provider API Keys (for future use)
# OPENROUTER_API_KEY=sk-or-v1-...
# OPENAI_API_KEY=sk-...
# GOOGLE_AI_API_KEY=AIzaSy...

# Application Settings
ENVIRONMENT=production
CORS_ORIGINS=https://react-app-000730.web.app
```

**Note**: API keys are currently optional as the deployed functions use mock responses. They will be required when full AI integration is implemented.

### 5. Configure Firebase Functions Secrets
```bash
# Set secrets for Cloud Functions (recommended for production)
firebase functions:secrets:set OPENROUTER_API_KEY
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set GOOGLE_AI_API_KEY
```

## Production Deployment

### 6. Build and Deploy
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Firebase Hosting and Functions
cd ..
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
```

### 7. Verify Deployment
```bash
# Check hosting status
firebase hosting:sites:list

# Check functions status
firebase functions:list

# Test the deployment
curl https://react-app-000730.web.app

# Test Firebase Functions (requires Firebase SDK, not direct HTTP calls)
# Use the frontend application or Firebase SDK to test function calls
```

### 8. Monitor Deployment
- **Firebase Console**: https://console.firebase.google.com/project/react-app-000730
- **Hosting**: https://console.firebase.google.com/project/react-app-000730/hosting
- **Functions**: https://console.firebase.google.com/project/react-app-000730/functions
- **Analytics**: https://console.firebase.google.com/project/react-app-000730/analytics

## Local Development

### Option 1: Firebase Emulators (Recommended)
```bash
# Install Firebase emulators
firebase init emulators

# Start emulators
firebase emulators:start

# Start frontend development server
cd frontend
npm run dev
```

**Services Available:**
- Frontend: http://localhost:5173
- Firebase Emulator UI: http://localhost:4000
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- Auth: http://localhost:9099

### Option 2: Manual Setup
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Backend
cd functions
python main.py

# Terminal 3: Start Frontend
npm run dev
```

### Development Tools
```bash
# Run tests
npm test
cd functions && python -m pytest tests/

# Linting
npm run lint
cd functions && flake8 src/

# Type checking
npm run type-check
cd functions && mypy src/
```

## Firebase Deployment

### 1. Firebase Setup
```bash
# Login to Firebase
firebase login

# Initialize project (if not done)
firebase init

# Select:
# - Functions (Python)
# - Hosting
# - Firestore
# - Storage
```

### 2. Configure Firebase
```bash
# Set project
firebase use your-project-id

# Deploy security rules
firebase deploy --only firestore:rules,storage
```

### 3. Deploy Functions
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:ai_service
```

### 4. Deploy Frontend
```bash
# Build frontend
npm run build

# Deploy hosting
firebase deploy --only hosting
```

### 5. Complete Deployment
```bash
# Deploy everything
firebase deploy

# Or use deployment script
./deploy.sh firebase
```

## Google Cloud Platform Deployment

### 1. GCP Setup
```bash
# Set project
export GCP_PROJECT_ID=your-project-id
gcloud config set project $GCP_PROJECT_ID

# Enable APIs
gcloud services enable container.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Create Kubernetes Cluster
```bash
# Run cluster setup script
./scripts/setup-cluster.sh $GCP_PROJECT_ID us-central1

# Or manually create cluster
gcloud container clusters create rag-ai-production \
  --region=us-central1 \
  --num-nodes=3 \
  --enable-autoscaling \
  --min-nodes=1 \
  --max-nodes=10
```

### 3. Deploy to Kubernetes
```bash
# Get cluster credentials
gcloud container clusters get-credentials rag-ai-production --region=us-central1

# Create secrets
kubectl create secret generic rag-ai-secrets \
  --from-literal=openai-api-key=$OPENAI_API_KEY \
  --from-literal=anthropic-api-key=$ANTHROPIC_API_KEY \
  --from-literal=redis-url=$REDIS_URL

# Deploy application
kubectl apply -f k8s/production/deployment.yaml

# Check deployment status
kubectl get pods
kubectl get services
```

### 4. Cloud Run Deployment (Alternative)
```bash
# Build and deploy backend
gcloud run deploy rag-ai-backend \
  --source ./functions \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Build and deploy frontend
gcloud run deploy rag-ai-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Production Configuration

### 1. Security Setup
```bash
# Create SSL certificates
kubectl apply -f k8s/production/ssl-certificates.yaml

# Configure WAF rules
gcloud compute security-policies create rag-ai-security-policy
```

### 2. Monitoring Setup
```bash
# Deploy monitoring stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Configure alerts
kubectl apply -f monitoring/alert-rules.yml
```

### 3. Backup Configuration
```bash
# Setup automated backups
gcloud sql backups create --instance=rag-ai-db
gcloud storage buckets create gs://rag-ai-backups
```

## Environment-Specific Configurations

### Development
```yaml
# docker-compose.override.yml
version: '3.8'
services:
  ai-service:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    volumes:
      - ./functions:/app
```

### Staging
```yaml
# k8s/staging/config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rag-ai-config
data:
  ENVIRONMENT: "staging"
  LOG_LEVEL: "info"
  RATE_LIMIT_REQUESTS_PER_MINUTE: "200"
```

### Production
```yaml
# k8s/production/config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rag-ai-config
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "warning"
  RATE_LIMIT_REQUESTS_PER_MINUTE: "1000"
  ENABLE_CACHING: "true"
```

## Monitoring & Maintenance

### Health Checks
```bash
# API health
curl https://api.example.com/health

# System status
curl https://api.example.com/api/ai/system-status

# Kubernetes health
kubectl get pods --all-namespaces
```

### Log Monitoring
```bash
# View application logs
kubectl logs -f deployment/rag-ai-backend

# View all logs
kubectl logs -f -l app=rag-ai-backend

# Firebase function logs
firebase functions:log
```

### Performance Monitoring
```bash
# Check resource usage
kubectl top pods
kubectl top nodes

# Monitor metrics
kubectl port-forward svc/prometheus-server 9090:80
# Open http://localhost:9090
```

## Troubleshooting

### Common Issues

**1. API Key Errors**
```bash
# Check secrets
kubectl get secrets
kubectl describe secret rag-ai-secrets

# Update secrets
kubectl delete secret rag-ai-secrets
kubectl create secret generic rag-ai-secrets --from-env-file=.env
```

**2. Database Connection Issues**
```bash
# Check Redis connection
redis-cli ping

# Check Firestore rules
firebase firestore:rules:get
```

**3. Build Failures**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild images
docker-compose build --no-cache
```

**4. Memory Issues**
```bash
# Check memory usage
kubectl top pods

# Increase memory limits
kubectl patch deployment rag-ai-backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"limits":{"memory":"2Gi"}}}]}}}}'
```

### Debug Commands
```bash
# Debug pod
kubectl exec -it <pod-name> -- /bin/bash

# Port forward for debugging
kubectl port-forward pod/<pod-name> 8080:8080

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Scaling

### Horizontal Scaling
```bash
# Scale deployment
kubectl scale deployment rag-ai-backend --replicas=5

# Auto-scaling
kubectl autoscale deployment rag-ai-backend --cpu-percent=70 --min=3 --max=10
```

### Vertical Scaling
```bash
# Update resource limits
kubectl patch deployment rag-ai-backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","resources":{"requests":{"cpu":"1000m","memory":"2Gi"},"limits":{"cpu":"2000m","memory":"4Gi"}}}]}}}}'
```

## Backup & Recovery

### Database Backup
```bash
# Firestore backup
gcloud firestore export gs://rag-ai-backups/firestore-backup-$(date +%Y%m%d)

# Redis backup
redis-cli --rdb /backup/redis-backup-$(date +%Y%m%d).rdb
```

### Application Backup
```bash
# Backup configuration
kubectl get configmaps -o yaml > config-backup.yaml
kubectl get secrets -o yaml > secrets-backup.yaml

# Backup persistent volumes
kubectl get pv -o yaml > pv-backup.yaml
```

## Security Checklist

- [ ] API keys stored in secrets, not environment variables
- [ ] HTTPS enabled for all endpoints
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] Security headers configured
- [ ] Network policies applied
- [ ] Regular security updates scheduled
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery tested

## Support

- **Documentation**: [docs.example.com](https://docs.example.com)
- **Status Page**: [status.example.com](https://status.example.com)
- **Support Email**: support@example.com
- **Emergency Contact**: +1-555-0123
