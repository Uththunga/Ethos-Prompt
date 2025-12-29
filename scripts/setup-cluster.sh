#!/bin/bash

# GKE Cluster Setup Script for RAG Prompt Library
set -e

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
CLUSTER_NAME_PROD="rag-ai-production"
CLUSTER_NAME_STAGING="rag-ai-staging"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v helm &> /dev/null; then
        log_error "helm is not installed"
        exit 1
    fi
    
    log_success "All prerequisites are available"
}

# Setup GCP project
setup_project() {
    log_info "Setting up GCP project: $PROJECT_ID"
    
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    log_info "Enabling required APIs..."
    gcloud services enable container.googleapis.com
    gcloud services enable compute.googleapis.com
    gcloud services enable monitoring.googleapis.com
    gcloud services enable logging.googleapis.com
    gcloud services enable cloudresourcemanager.googleapis.com
    
    log_success "GCP project setup completed"
}

# Create production cluster
create_production_cluster() {
    log_info "Creating production GKE cluster: $CLUSTER_NAME_PROD"
    
    gcloud container clusters create $CLUSTER_NAME_PROD \
        --region=$REGION \
        --node-locations=$REGION-a,$REGION-b,$REGION-c \
        --num-nodes=2 \
        --min-nodes=1 \
        --max-nodes=10 \
        --enable-autoscaling \
        --machine-type=e2-standard-4 \
        --disk-size=50GB \
        --disk-type=pd-ssd \
        --enable-autorepair \
        --enable-autoupgrade \
        --enable-network-policy \
        --enable-ip-alias \
        --enable-shielded-nodes \
        --shielded-secure-boot \
        --shielded-integrity-monitoring \
        --enable-autorepair \
        --enable-autoupgrade \
        --maintenance-window-start="2023-01-01T09:00:00Z" \
        --maintenance-window-end="2023-01-01T17:00:00Z" \
        --maintenance-window-recurrence="FREQ=WEEKLY;BYDAY=SA" \
        --workload-pool=$PROJECT_ID.svc.id.goog \
        --enable-stackdriver-kubernetes \
        --logging=SYSTEM,WORKLOAD \
        --monitoring=SYSTEM
    
    log_success "Production cluster created successfully"
}

# Create staging cluster
create_staging_cluster() {
    log_info "Creating staging GKE cluster: $CLUSTER_NAME_STAGING"
    
    gcloud container clusters create $CLUSTER_NAME_STAGING \
        --region=$REGION \
        --node-locations=$REGION-a \
        --num-nodes=1 \
        --min-nodes=1 \
        --max-nodes=3 \
        --enable-autoscaling \
        --machine-type=e2-standard-2 \
        --disk-size=30GB \
        --disk-type=pd-standard \
        --enable-autorepair \
        --enable-autoupgrade \
        --enable-network-policy \
        --enable-ip-alias \
        --workload-pool=$PROJECT_ID.svc.id.goog \
        --enable-stackdriver-kubernetes \
        --logging=SYSTEM \
        --monitoring=SYSTEM
    
    log_success "Staging cluster created successfully"
}

# Setup NGINX Ingress Controller
setup_nginx_ingress() {
    local cluster_name=$1
    log_info "Setting up NGINX Ingress Controller for $cluster_name"
    
    gcloud container clusters get-credentials $cluster_name --region=$REGION
    
    # Add NGINX Ingress Helm repo
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    # Install NGINX Ingress Controller
    helm install nginx-ingress ingress-nginx/ingress-nginx \
        --namespace nginx-ingress \
        --create-namespace \
        --set controller.service.type=LoadBalancer \
        --set controller.metrics.enabled=true \
        --set controller.podAnnotations."prometheus\.io/scrape"=true \
        --set controller.podAnnotations."prometheus\.io/port"=10254
    
    log_success "NGINX Ingress Controller installed"
}

# Setup Cert Manager
setup_cert_manager() {
    local cluster_name=$1
    log_info "Setting up Cert Manager for $cluster_name"
    
    gcloud container clusters get-credentials $cluster_name --region=$REGION
    
    # Install Cert Manager
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
    
    # Wait for cert-manager to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=300s
    
    # Create ClusterIssuer for Let's Encrypt
    if [[ $cluster_name == *"production"* ]]; then
        cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
    else
        cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@example.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
    fi
    
    log_success "Cert Manager installed and configured"
}

# Setup monitoring
setup_monitoring() {
    local cluster_name=$1
    log_info "Setting up monitoring for $cluster_name"
    
    gcloud container clusters get-credentials $cluster_name --region=$REGION
    
    # Add Prometheus Helm repo
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    # Install Prometheus and Grafana
    helm install monitoring prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
        --set grafana.adminPassword=admin123 \
        --set grafana.service.type=LoadBalancer
    
    log_success "Monitoring stack installed"
}

# Create service accounts
create_service_accounts() {
    log_info "Creating service accounts..."
    
    # Create service account for production
    gcloud iam service-accounts create rag-ai-backend \
        --display-name="RAG AI Backend Service Account"
    
    gcloud iam service-accounts create rag-ai-backend-staging \
        --display-name="RAG AI Backend Staging Service Account"
    
    # Grant necessary permissions
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:rag-ai-backend@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/storage.objectViewer"
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
        --member="serviceAccount:rag-ai-backend@$PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
    
    # Enable Workload Identity
    gcloud iam service-accounts add-iam-policy-binding \
        rag-ai-backend@$PROJECT_ID.iam.gserviceaccount.com \
        --role roles/iam.workloadIdentityUser \
        --member "serviceAccount:$PROJECT_ID.svc.id.goog[production/rag-ai-backend]"
    
    gcloud iam service-accounts add-iam-policy-binding \
        rag-ai-backend-staging@$PROJECT_ID.iam.gserviceaccount.com \
        --role roles/iam.workloadIdentityUser \
        --member "serviceAccount:$PROJECT_ID.svc.id.goog[staging/rag-ai-backend]"
    
    log_success "Service accounts created and configured"
}

# Main execution
main() {
    log_info "Starting GKE cluster setup for RAG Prompt Library"
    
    if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-project-id" ]; then
        log_error "Please provide a valid GCP project ID"
        echo "Usage: $0 <PROJECT_ID> [REGION]"
        exit 1
    fi
    
    check_prerequisites
    setup_project
    create_service_accounts
    
    # Create clusters
    create_production_cluster
    create_staging_cluster
    
    # Setup infrastructure for both clusters
    setup_nginx_ingress $CLUSTER_NAME_PROD
    setup_nginx_ingress $CLUSTER_NAME_STAGING
    
    setup_cert_manager $CLUSTER_NAME_PROD
    setup_cert_manager $CLUSTER_NAME_STAGING
    
    setup_monitoring $CLUSTER_NAME_PROD
    setup_monitoring $CLUSTER_NAME_STAGING
    
    log_success "GKE cluster setup completed successfully!"
    log_info "Production cluster: $CLUSTER_NAME_PROD"
    log_info "Staging cluster: $CLUSTER_NAME_STAGING"
    log_info "Region: $REGION"
    
    log_info "Next steps:"
    log_info "1. Update DNS records to point to the LoadBalancer IPs"
    log_info "2. Create secrets for API keys using kubectl"
    log_info "3. Deploy the application using the CI/CD pipeline"
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
