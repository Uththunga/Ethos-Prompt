#!/bin/bash

# Production Monitoring Setup Script
# Configures Google Cloud Monitoring, alerting policies, and dashboards

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="rag-prompt-library-prod"
NOTIFICATION_EMAIL="alerts@ragpromptlibrary.com"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
PAGERDUTY_KEY="${PAGERDUTY_KEY:-}"

echo -e "${BLUE}=== Setting up Production Monitoring ===${NC}"
echo "Project ID: $PROJECT_ID"
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
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_status "FAIL" "Google Cloud CLI not installed"
        exit 1
    fi
    
    # Check if authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 >/dev/null 2>&1; then
        print_status "FAIL" "Not authenticated with Google Cloud"
        exit 1
    fi
    
    # Set project
    gcloud config set project "$PROJECT_ID" >/dev/null 2>&1
    
    print_status "PASS" "Prerequisites checked"
}

# Function to enable required APIs
enable_apis() {
    print_status "INFO" "Enabling required APIs..."
    
    local apis=(
        "monitoring.googleapis.com"
        "logging.googleapis.com"
        "cloudfunctions.googleapis.com"
        "firestore.googleapis.com"
        "firebase.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        if gcloud services enable "$api" --project="$PROJECT_ID" >/dev/null 2>&1; then
            print_status "PASS" "Enabled $api"
        else
            print_status "WARN" "Could not enable $api (may already be enabled)"
        fi
    done
}

# Function to create notification channels
create_notification_channels() {
    print_status "INFO" "Creating notification channels..."
    
    # Email notification channel
    cat > email-channel.json << EOF
{
  "type": "email",
  "displayName": "Production Alerts Email",
  "description": "Email notifications for production alerts",
  "labels": {
    "email_address": "$NOTIFICATION_EMAIL"
  }
}
EOF
    
    if EMAIL_CHANNEL=$(gcloud alpha monitoring channels create --channel-content-from-file=email-channel.json --project="$PROJECT_ID" --format="value(name)" 2>/dev/null); then
        print_status "PASS" "Created email notification channel"
        echo "EMAIL_CHANNEL_ID=$EMAIL_CHANNEL" >> monitoring-config.env
    else
        print_status "WARN" "Could not create email notification channel"
    fi
    
    # Slack notification channel (if webhook URL provided)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        cat > slack-channel.json << EOF
{
  "type": "slack",
  "displayName": "Production Alerts Slack",
  "description": "Slack notifications for production alerts",
  "labels": {
    "url": "$SLACK_WEBHOOK_URL"
  }
}
EOF
        
        if SLACK_CHANNEL=$(gcloud alpha monitoring channels create --channel-content-from-file=slack-channel.json --project="$PROJECT_ID" --format="value(name)" 2>/dev/null); then
            print_status "PASS" "Created Slack notification channel"
            echo "SLACK_CHANNEL_ID=$SLACK_CHANNEL" >> monitoring-config.env
        else
            print_status "WARN" "Could not create Slack notification channel"
        fi
    fi
    
    # Cleanup temp files
    rm -f email-channel.json slack-channel.json
}

# Function to create alerting policies
create_alerting_policies() {
    print_status "INFO" "Creating alerting policies..."
    
    # Load notification channel IDs
    if [ -f monitoring-config.env ]; then
        source monitoring-config.env
    fi
    
    # High error rate alert
    cat > high-error-rate-policy.json << EOF
{
  "displayName": "High Error Rate",
  "documentation": {
    "content": "Alert when HTTP 5xx error rate exceeds 5% for 2 minutes"
  },
  "conditions": [
    {
      "displayName": "HTTP 5xx error rate",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_function\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_count\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 0.05,
        "duration": "120s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM",
            "groupByFields": ["resource.label.function_name"]
          }
        ]
      }
    }
  ],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["$EMAIL_CHANNEL_ID"],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
    
    if gcloud alpha monitoring policies create --policy-from-file=high-error-rate-policy.json --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created high error rate alert policy"
    else
        print_status "WARN" "Could not create high error rate alert policy"
    fi
    
    # High response time alert
    cat > high-response-time-policy.json << EOF
{
  "displayName": "High Response Time",
  "documentation": {
    "content": "Alert when 95th percentile response time exceeds 2 seconds for 5 minutes"
  },
  "conditions": [
    {
      "displayName": "Function execution time",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_function\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_times\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 2000,
        "duration": "300s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_DELTA",
            "crossSeriesReducer": "REDUCE_PERCENTILE_95",
            "groupByFields": ["resource.label.function_name"]
          }
        ]
      }
    }
  ],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["$EMAIL_CHANNEL_ID"],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
EOF
    
    if gcloud alpha monitoring policies create --policy-from-file=high-response-time-policy.json --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created high response time alert policy"
    else
        print_status "WARN" "Could not create high response time alert policy"
    fi
    
    # Database connection errors
    cat > database-error-policy.json << EOF
{
  "displayName": "Database Connection Errors",
  "documentation": {
    "content": "Alert when Firestore connection errors exceed 10 in 1 minute"
  },
  "conditions": [
    {
      "displayName": "Firestore errors",
      "conditionThreshold": {
        "filter": "resource.type=\"firestore_database\" AND metric.type=\"firestore.googleapis.com/api/request_count\" AND metric.label.response_code!=\"OK\"",
        "comparison": "COMPARISON_GREATER_THAN",
        "thresholdValue": 10,
        "duration": "60s",
        "aggregations": [
          {
            "alignmentPeriod": "60s",
            "perSeriesAligner": "ALIGN_RATE",
            "crossSeriesReducer": "REDUCE_SUM"
          }
        ]
      }
    }
  ],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["$EMAIL_CHANNEL_ID"],
  "alertStrategy": {
    "autoClose": "900s"
  }
}
EOF
    
    if gcloud alpha monitoring policies create --policy-from-file=database-error-policy.json --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created database error alert policy"
    else
        print_status "WARN" "Could not create database error alert policy"
    fi
    
    # Cleanup temp files
    rm -f *-policy.json
}

# Function to create uptime checks
create_uptime_checks() {
    print_status "INFO" "Creating uptime checks..."
    
    # Main application uptime check
    cat > main-app-uptime.json << EOF
{
  "displayName": "Main Application Uptime",
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$PROJECT_ID",
      "host": "app.ragpromptlibrary.com"
    }
  },
  "httpCheck": {
    "path": "/",
    "port": 443,
    "useSsl": true,
    "validateSsl": true
  },
  "period": "60s",
  "timeout": "10s"
}
EOF
    
    if gcloud monitoring uptime create --uptime-check-config-from-file=main-app-uptime.json --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created main application uptime check"
    else
        print_status "WARN" "Could not create main application uptime check"
    fi
    
    # API health uptime check
    cat > api-health-uptime.json << EOF
{
  "displayName": "API Health Check",
  "monitoredResource": {
    "type": "uptime_url",
    "labels": {
      "project_id": "$PROJECT_ID",
      "host": "api.ragpromptlibrary.com"
    }
  },
  "httpCheck": {
    "path": "/health",
    "port": 443,
    "useSsl": true,
    "validateSsl": true
  },
  "period": "30s",
  "timeout": "5s"
}
EOF
    
    if gcloud monitoring uptime create --uptime-check-config-from-file=api-health-uptime.json --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created API health uptime check"
    else
        print_status "WARN" "Could not create API health uptime check"
    fi
    
    # Cleanup temp files
    rm -f *-uptime.json
}

# Function to create custom dashboards
create_dashboards() {
    print_status "INFO" "Creating monitoring dashboards..."
    
    # Create operations dashboard
    cat > operations-dashboard.json << EOF
{
  "displayName": "RAG Prompt Library - Operations",
  "mosaicLayout": {
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Function Execution Count",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_function\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_count\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_RATE",
                      "crossSeriesReducer": "REDUCE_SUM",
                      "groupByFields": ["resource.label.function_name"]
                    }
                  }
                }
              }
            ]
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "xPos": 6,
        "widget": {
          "title": "Function Execution Time",
          "xyChart": {
            "dataSets": [
              {
                "timeSeriesQuery": {
                  "timeSeriesFilter": {
                    "filter": "resource.type=\"cloud_function\" AND metric.type=\"cloudfunctions.googleapis.com/function/execution_times\"",
                    "aggregation": {
                      "alignmentPeriod": "60s",
                      "perSeriesAligner": "ALIGN_DELTA",
                      "crossSeriesReducer": "REDUCE_PERCENTILE_95",
                      "groupByFields": ["resource.label.function_name"]
                    }
                  }
                }
              }
            ]
          }
        }
      }
    ]
  }
}
EOF
    
    if gcloud monitoring dashboards create --config-from-file=operations-dashboard.json --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created operations dashboard"
    else
        print_status "WARN" "Could not create operations dashboard"
    fi
    
    # Cleanup temp files
    rm -f *-dashboard.json
}

# Function to setup log-based metrics
setup_log_metrics() {
    print_status "INFO" "Setting up log-based metrics..."
    
    # Error rate metric
    if gcloud logging metrics create error_rate \
        --description="Rate of application errors" \
        --log-filter='severity>=ERROR AND resource.type="cloud_function"' \
        --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created error rate log metric"
    else
        print_status "WARN" "Could not create error rate log metric (may already exist)"
    fi
    
    # User activity metric
    if gcloud logging metrics create user_activity \
        --description="User activity events" \
        --log-filter='jsonPayload.event_type="user_action" AND resource.type="cloud_function"' \
        --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created user activity log metric"
    else
        print_status "WARN" "Could not create user activity log metric (may already exist)"
    fi
    
    # Security events metric
    if gcloud logging metrics create security_events \
        --description="Security-related events" \
        --log-filter='jsonPayload.event_type="security" OR jsonPayload.event_type="auth_failure"' \
        --project="$PROJECT_ID" >/dev/null 2>&1; then
        print_status "PASS" "Created security events log metric"
    else
        print_status "WARN" "Could not create security events log metric (may already exist)"
    fi
}

# Function to configure log retention
configure_log_retention() {
    print_status "INFO" "Configuring log retention policies..."
    
    # Set retention for different log types
    local log_buckets=(
        "_Default:90"
        "security-logs:730"
        "audit-logs:365"
        "debug-logs:30"
    )
    
    for bucket_config in "${log_buckets[@]}"; do
        IFS=':' read -r bucket_name retention_days <<< "$bucket_config"
        
        if gcloud logging buckets update "$bucket_name" \
            --location=global \
            --retention-days="$retention_days" \
            --project="$PROJECT_ID" >/dev/null 2>&1; then
            print_status "PASS" "Set retention for $bucket_name to $retention_days days"
        else
            print_status "WARN" "Could not set retention for $bucket_name"
        fi
    done
}

# Main function
main() {
    check_prerequisites
    enable_apis
    create_notification_channels
    create_alerting_policies
    create_uptime_checks
    create_dashboards
    setup_log_metrics
    configure_log_retention
    
    print_status "INFO" "Monitoring setup completed"
    print_status "INFO" "Configuration saved to monitoring-config.env"
    
    echo -e "\n${BLUE}=== Next Steps ===${NC}"
    echo "1. Verify notification channels are working"
    echo "2. Test alert policies with synthetic events"
    echo "3. Review and customize dashboard layouts"
    echo "4. Set up additional custom metrics as needed"
    echo "5. Configure team access to monitoring resources"
}

# Run main function
main "$@"
