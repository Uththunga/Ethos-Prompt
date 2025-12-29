#!/bin/bash
# Create Firestore indexes for intelligent caching
# Run with: ./scripts/create_firestore_indexes.sh

set -e  # Exit on error

PROJECT_ID=${1:-"your-project-id"}
echo "Creating Firestore indexes for project: $PROJECT_ID"
echo "================================================"

# Set project
gcloud config set project $PROJECT_ID

echo ""
echo "1. Creating composite index for cache queries by context + timestamp..."
gcloud firestore indexes composite create \
  --collection-group=cache_responses \
  --field-config field-path=page_context,order=ASCENDING \
  --field-config field-path=cached_at,order=DESCENDING \
  --async \
  || echo "⚠️  Index may already exist"

echo ""
echo "2. Creating index for quality score queries..."
gcloud firestore indexes composite create \
  --collection-group=cache_responses \
  --field-config field-path=quality_score,order=DESCENDING \
  --field-config field-path=cached_at,order=DESCENDING \
  --async \
  || echo "⚠️  Index may already exist"

echo ""
echo "3. Creating index for hit count analytics..."
gcloud firestore indexes composite create \
  --collection-group=cache_responses \
  --field-config field-path=page_context,order=ASCENDING \
  --field-config field-path=hit_count,order=DESCENDING \
  --async \
  || echo "⚠️  Index may already exist"

echo ""
echo "4. Creating index for TTL cleanup..."
gcloud firestore indexes composite create \
  --collection-group=cache_responses \
  --field-config field-path=cached_at,order=ASCENDING \
  --async \
  || echo "⚠️  Index may already exist"

echo ""
echo "================================================"
echo "✅ Index creation initiated!"
echo ""
echo "Note: Indexes may take several minutes to build."
echo "Check status with:"
echo "  gcloud firestore indexes composite list"
echo ""
echo "Or visit:"
echo "  https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
