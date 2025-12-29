#!/bin/bash

# Setup Cloud Monitoring Alerts for RAG Prompt Library
# This script creates monitoring alerts for Cloud Functions

PROJECT_ID="rag-prompt-library"
REGION="australia-southeast1"

echo "🔧 Setting up Cloud Monitoring Alerts for $PROJECT_ID..."
echo ""

# Set the project
gcloud config set project $PROJECT_ID

# Create notification channel (Email)
echo "📧 Creating email notification channel..."
NOTIFICATION_CHANNEL=$(gcloud alpha monitoring channels create \
  --display-name="Primary Email Alert" \
  --type=email \
  --channel-labels=email_address=your-email@example.com \
  --format="value(name)")

echo "✅ Notification channel created: $NOTIFICATION_CHANNEL"
echo ""

# Alert 1: Function Error Rate High
echo "🚨 Creating Alert: Function Error Rate High..."
cat > /tmp/alert-error-rate.yaml <<EOF
displayName: "Cloud Function Error Rate High"
documentation:
  content: "Cloud Function error rate exceeded 5% for 5 minutes. Check logs at https://console.cloud.google.com/logs/query?project=$PROJECT_ID"
  mimeType: "text/markdown"
conditions:
  - displayName: "Error rate > 5%"
    conditionThreshold:
      filter: |
        resource.type = "cloud_function"
        metric.type = "cloudfunctions.googleapis.com/function/execution_count"
        metric.label.status != "ok"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
          groupByFields:
            - resource.function_name
      comparison: COMPARISON_GT
      thresholdValue: 0.05
      duration: 300s
notificationChannels:
  - $NOTIFICATION_CHANNEL
alertStrategy:
  autoClose: 604800s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-error-rate.yaml
echo "✅ Alert created: Function Error Rate High"
echo ""

# Alert 2: Function Execution Time Near Timeout
echo "🚨 Creating Alert: Function Near Timeout..."
cat > /tmp/alert-timeout.yaml <<EOF
displayName: "Cloud Function Near Timeout"
documentation:
  content: "Cloud Function execution time is approaching timeout limit (540s). Optimize function or increase timeout."
  mimeType: "text/markdown"
conditions:
  - displayName: "Execution time > 500s"
    conditionThreshold:
      filter: |
        resource.type = "cloud_function"
        metric.type = "cloudfunctions.googleapis.com/function/execution_times"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_DELTA
          crossSeriesReducer: REDUCE_PERCENTILE_95
          groupByFields:
            - resource.function_name
      comparison: COMPARISON_GT
      thresholdValue: 500000
      duration: 60s
notificationChannels:
  - $NOTIFICATION_CHANNEL
alertStrategy:
  autoClose: 604800s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-timeout.yaml
echo "✅ Alert created: Function Near Timeout"
echo ""

# Alert 3: High Memory Usage
echo "🚨 Creating Alert: High Memory Usage..."
cat > /tmp/alert-memory.yaml <<EOF
displayName: "Cloud Function High Memory Usage"
documentation:
  content: "Cloud Function memory usage exceeded 90% of allocated memory. Consider increasing memory allocation."
  mimeType: "text/markdown"
conditions:
  - displayName: "Memory usage > 90%"
    conditionThreshold:
      filter: |
        resource.type = "cloud_function"
        metric.type = "cloudfunctions.googleapis.com/function/user_memory_bytes"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_MAX
          crossSeriesReducer: REDUCE_MAX
          groupByFields:
            - resource.function_name
      comparison: COMPARISON_GT
      thresholdValue: 943718400
      duration: 300s
notificationChannels:
  - $NOTIFICATION_CHANNEL
alertStrategy:
  autoClose: 604800s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-memory.yaml
echo "✅ Alert created: High Memory Usage"
echo ""

# Alert 4: Function Invocation Spike
echo "🚨 Creating Alert: Function Invocation Spike..."
cat > /tmp/alert-invocation-spike.yaml <<EOF
displayName: "Cloud Function Invocation Spike"
documentation:
  content: "Unusual spike in function invocations detected. May indicate abuse or DDoS attack."
  mimeType: "text/markdown"
conditions:
  - displayName: "Invocations > 1000/min"
    conditionThreshold:
      filter: |
        resource.type = "cloud_function"
        metric.type = "cloudfunctions.googleapis.com/function/execution_count"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
          groupByFields:
            - resource.function_name
      comparison: COMPARISON_GT
      thresholdValue: 1000
      duration: 60s
notificationChannels:
  - $NOTIFICATION_CHANNEL
alertStrategy:
  autoClose: 604800s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-invocation-spike.yaml
echo "✅ Alert created: Function Invocation Spike"
echo ""

# Alert 5: Firestore Read/Write Spike
echo "🚨 Creating Alert: Firestore Operation Spike..."
cat > /tmp/alert-firestore-spike.yaml <<EOF
displayName: "Firestore Operation Spike"
documentation:
  content: "Unusual spike in Firestore operations detected. Check for N+1 queries or inefficient data access patterns."
  mimeType: "text/markdown"
conditions:
  - displayName: "Document reads > 10000/min"
    conditionThreshold:
      filter: |
        resource.type = "firestore_instance"
        metric.type = "firestore.googleapis.com/document/read_count"
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
          crossSeriesReducer: REDUCE_SUM
      comparison: COMPARISON_GT
      thresholdValue: 10000
      duration: 300s
notificationChannels:
  - $NOTIFICATION_CHANNEL
alertStrategy:
  autoClose: 604800s
EOF

gcloud alpha monitoring policies create --policy-from-file=/tmp/alert-firestore-spike.yaml
echo "✅ Alert created: Firestore Operation Spike"
echo ""

# Clean up temp files
rm -f /tmp/alert-*.yaml

echo ""
echo "🎉 Cloud Monitoring Alerts Setup Complete!"
echo ""
echo "📊 View alerts at: https://console.cloud.google.com/monitoring/alerting/policies?project=$PROJECT_ID"
echo ""
echo "⚠️  IMPORTANT: Update the email address in the notification channel:"
echo "   1. Go to: https://console.cloud.google.com/monitoring/alerting/notifications?project=$PROJECT_ID"
echo "   2. Edit the 'Primary Email Alert' channel"
echo "   3. Update email address to your actual email"
echo ""

