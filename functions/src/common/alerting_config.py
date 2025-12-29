"""
GCP Monitoring Alerting Policies Configuration
Define alerting rules for production monitoring

These policies can be created via:
1. GCP Console: Monitoring > Alerting > Create Policy
2. Terraform (recommended for IaC)
3. gcloud CLI commands (see below)
"""

# ============================================================================
# Alerting Policy Definitions
# ============================================================================

ALERTING_POLICIES = {
    "high_error_rate": {
        "display_name": "Marketing Agent - High Error Rate",
        "documentation": {
            "content": """
## High Error Rate Detected

The marketing agent is experiencing an elevated error rate.

### Severity: **CRITICAL**

### Threshold: >5% error rate over 5 minutes

### Possible Causes:
- LLM API outage (OpenRouter or Watsonx)
- Knowledge base retrieval failures
- Invalid configuration
- Network connectivity issues

### Immediate Actions:
1. Check Cloud Run logs for error details
2. Verify LLM API status (OpenRouter/Watsonx dashboard)
3. Check Firestore connectivity
4. Review recent deployments

### Escalation:
If error rate >10% for >10 minutes, page on-call engineer.
            """,
            "mime_type": "text/markdown"
        },
        "conditions": [{
            "display_name": "Error rate > 5%",
            "condition_threshold": {
                "filter": 'resource.type="cloud_run_revision" AND metric.type="marketing_agent_requests_total" AND metric.label.status="error"',
                "aggregations": [{
                    "alignment_period": "300s",  # 5 minutes
                    "per_series_aligner": "ALIGN_RATE",
                    "cross_series_reducer": "REDUCE_SUM"
                }],
                "comparison": "COMPARISON_GT",
                "threshold_value": 0.05,  # 5%
                "duration": "300s"
            }
        }],
        "notification_channels": ["EMAIL", "SLACK"],
        "severity": "CRITICAL"
    },

    "high_latency": {
        "display_name": "Marketing Agent - High Latency",
        "documentation": {
            "content": """
## High Latency Detected

Marketing agent response times are elevated.

### Severity: **WARNING**

### Threshold: P95 latency >5 seconds over 10 minutes

### Possible Causes:
- LLM API slowness
- Knowledge base search performance degradation
- Cold starts (Cloud Run scaling)
- Large context windows

### Immediate Actions:
1. Check LLM API latency metrics
2. Review Cloud Run instance count (scaling issues?)
3. Analyze slow queries in logs
4. Check for large tool call chains

### Optimization:
- Consider increasing Cloud Run min instances
- Review prompt length and context size
- Optimize KB retrieval queries
            """,
            "mime_type": "text/markdown"
        },
        "conditions": [{
            "display_name": "P95 latency > 5s",
            "condition_threshold": {
                "filter": 'resource.type="cloud_run_revision" AND metric.type="marketing_agent_request_duration_seconds"',
                "aggregations": [{
                    "alignment_period": "600s",  # 10 minutes
                    "per_series_aligner": "ALIGN_DELTA",
                    "cross_series_reducer": "REDUCE_PERCENTILE_95"
                }],
                "comparison": "COMPARISON_GT",
                "threshold_value": 5.0,  # 5 seconds
                "duration": "600s"
            }
        }],
        "notification_channels": ["EMAIL"],
        "severity": "WARNING"
    },

    "high_cost": {
        "display_name": "Marketing Agent - High API Cost",
        "documentation": {
            "content": """
## High API Cost Alert

Marketing agent API costs are elevated.

### Severity: **WARNING**

### Threshold: >$10/hour

### Possible Causes:
- Increased traffic
- Inefficient prompts (excessive tokens)
- Tool call loops
- Expensive model usage

### Immediate Actions:
1. Review token usage metrics
2. Check for prompt optimization opportunities
3. Analyze tool call patterns
4. Review model selection (Granite vs OpenRouter)

### Cost Optimization:
- Switch to IBM Granite (lower cost)
- Reduce max_tokens parameter
- Optimize system prompt length
- Implement response caching
            """,
            "mime_type": "text/markdown"
        },
        "conditions": [{
            "display_name": "Cost > $10/hour",
            "condition_threshold": {
                "filter": 'resource.type="cloud_run_revision" AND metric.type="marketing_agent_cost_usd_total"',
                "aggregations": [{
                    "alignment_period": "3600s",  # 1 hour
                    "per_series_aligner": "ALIGN_RATE",
                    "cross_series_reducer": "REDUCE_SUM"
                }],
                "comparison": "COMPARISON_GT",
                "threshold_value": 10.0,  # $10/hour
                "duration": "3600s"
            }
        }],
        "notification_channels": ["EMAIL"],
        "severity": "WARNING"
    },

    "no_requests": {
        "display_name": "Marketing Agent - No Requests",
        "documentation": {
            "content": """
## No Requests Detected

Marketing agent has received no requests for an extended period.

### Severity: **INFO**

### Threshold: 0 requests for 30 minutes

### Possible Causes:
- Frontend integration issue
- Deployment failure
- DNS/routing problem
- Intentional downtime

### Immediate Actions:
1. Check frontend integration
2. Verify Cloud Run service is running
3. Test endpoint manually
4. Review recent deployments
            """,
            "mime_type": "text/markdown"
        },
        "conditions": [{
            "display_name": "No requests for 30 min",
            "condition_threshold": {
                "filter": 'resource.type="cloud_run_revision" AND metric.type="marketing_agent_requests_total"',
                "aggregations": [{
                    "alignment_period": "1800s",  # 30 minutes
                    "per_series_aligner": "ALIGN_RATE",
                    "cross_series_reducer": "REDUCE_SUM"
                }],
                "comparison": "COMPARISON_LT",
                "threshold_value": 0.001,  # ~0 requests
                "duration": "1800s"
            }
        }],
        "notification_channels": ["EMAIL"],
        "severity": "INFO"
    }
}


# ============================================================================
# gcloud CLI Commands to Create Policies
# ============================================================================

GCLOUD_COMMANDS = """
# Create notification channels first
gcloud alpha monitoring channels create \\
  --display-name="Marketing Agent Email" \\
  --type=email \\
  --channel-labels=email_address=alerts@ethosprompt.com

gcloud alpha monitoring channels create \\
  --display-name="Marketing Agent Slack" \\
  --type=slack \\
  --channel-labels=url=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Create alerting policies (requires notification channel IDs from above)
# High Error Rate
gcloud alpha monitoring policies create \\
  --notification-channels=CHANNEL_ID_1,CHANNEL_ID_2 \\
  --display-name="Marketing Agent - High Error Rate" \\
  --condition-display-name="Error rate > 5%" \\
  --condition-threshold-value=0.05 \\
  --condition-threshold-duration=300s \\
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="marketing_agent_requests_total" AND metric.label.status="error"'

# High Latency
gcloud alpha monitoring policies create \\
  --notification-channels=CHANNEL_ID_1 \\
  --display-name="Marketing Agent - High Latency" \\
  --condition-display-name="P95 latency > 5s" \\
  --condition-threshold-value=5.0 \\
  --condition-threshold-duration=600s \\
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="marketing_agent_request_duration_seconds"'

# High Cost
gcloud alpha monitoring policies create \\
  --notification-channels=CHANNEL_ID_1 \\
  --display-name="Marketing Agent - High API Cost" \\
  --condition-display-name="Cost > $10/hour" \\
  --condition-threshold-value=10.0 \\
  --condition-threshold-duration=3600s \\
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="marketing_agent_cost_usd_total"'
"""


# ============================================================================
# Log-Based Metrics (Alternative to Prometheus)
# ============================================================================

LOG_BASED_METRICS = {
    "request_count": {
        "name": "marketing_agent_requests",
        "description": "Count of marketing agent requests",
        "filter": 'jsonPayload.monitoring.event="agent_request_end"',
        "metric_kind": "DELTA",
        "value_type": "INT64",
        "labels": [
            {"key": "agent_type", "value_extractor": "EXTRACT(jsonPayload.monitoring.agent_type)"},
            {"key": "status", "value_extractor": "EXTRACT(jsonPayload.monitoring.success)"},
            {"key": "page_context", "value_extractor": "EXTRACT(jsonPayload.monitoring.page_context)"}
        ]
    },

    "request_latency": {
        "name": "marketing_agent_latency",
        "description": "Marketing agent request latency distribution",
        "filter": 'jsonPayload.monitoring.event="agent_request_end"',
        "metric_kind": "DELTA",
        "value_type": "DISTRIBUTION",
        "value_extractor": "EXTRACT(jsonPayload.monitoring.duration_ms)",
        "labels": [
            {"key": "agent_type", "value_extractor": "EXTRACT(jsonPayload.monitoring.agent_type)"},
            {"key": "page_context", "value_extractor": "EXTRACT(jsonPayload.monitoring.page_context)"}
        ]
    },

    "error_count": {
        "name": "marketing_agent_errors",
        "description": "Count of marketing agent errors",
        "filter": 'jsonPayload.monitoring.event="agent_error"',
        "metric_kind": "DELTA",
        "value_type": "INT64",
        "labels": [
            {"key": "agent_type", "value_extractor": "EXTRACT(jsonPayload.monitoring.agent_type)"},
            {"key": "error_type", "value_extractor": "EXTRACT(jsonPayload.monitoring.error_type)"}
        ]
    },

    "token_usage": {
        "name": "marketing_agent_tokens",
        "description": "Total tokens used by marketing agent",
        "filter": 'jsonPayload.monitoring.event="business_metrics"',
        "metric_kind": "DELTA",
        "value_type": "INT64",
        "value_extractor": "EXTRACT(jsonPayload.monitoring.total_tokens)",
        "labels": [
            {"key": "agent_type", "value_extractor": "EXTRACT(jsonPayload.monitoring.agent_type)"},
            {"key": "model", "value_extractor": "EXTRACT(jsonPayload.monitoring.model_name)"}
        ]
    },

    "cost": {
        "name": "marketing_agent_cost",
        "description": "Estimated API cost in USD",
        "filter": 'jsonPayload.monitoring.event="business_metrics"',
        "metric_kind": "DELTA",
        "value_type": "DOUBLE",
        "value_extractor": "EXTRACT(jsonPayload.monitoring.estimated_cost_usd)",
        "labels": [
            {"key": "agent_type", "value_extractor": "EXTRACT(jsonPayload.monitoring.agent_type)"},
            {"key": "model", "value_extractor": "EXTRACT(jsonPayload.monitoring.model_name)"}
        ]
    }
}


# ============================================================================
# Dashboard Configuration (JSON for GCP Monitoring)
# ============================================================================

DASHBOARD_CONFIG = {
    "displayName": "Marketing Agent - Production Monitoring",
    "mosaicLayout": {
        "columns": 12,
        "tiles": [
            {
                "width": 6,
                "height": 4,
                "widget": {
                    "title": "Request Rate (req/min)",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": 'metric.type="marketing_agent_requests_total"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_RATE"
                                    }
                                }
                            }
                        }]
                    }
                }
            },
            {
                "width": 6,
                "height": 4,
                "xPos": 6,
                "widget": {
                    "title": "Error Rate (%)",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": 'metric.type="marketing_agent_requests_total" AND metric.label.status="error"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_RATE"
                                    }
                                }
                            }
                        }]
                    }
                }
            },
            {
                "width": 6,
                "height": 4,
                "yPos": 4,
                "widget": {
                    "title": "Latency (P50, P95, P99)",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": 'metric.type="marketing_agent_request_duration_seconds"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_DELTA",
                                        "crossSeriesReducer": "REDUCE_PERCENTILE_50"
                                    }
                                }
                            }
                        }]
                    }
                }
            },
            {
                "width": 6,
                "height": 4,
                "xPos": 6,
                "yPos": 4,
                "widget": {
                    "title": "Token Usage (tokens/min)",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": 'metric.type="marketing_agent_tokens_total"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_RATE"
                                    }
                                }
                            }
                        }]
                    }
                }
            },
            {
                "width": 6,
                "height": 4,
                "yPos": 8,
                "widget": {
                    "title": "API Cost ($/hour)",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": 'metric.type="marketing_agent_cost_usd_total"',
                                    "aggregation": {
                                        "alignmentPeriod": "3600s",
                                        "perSeriesAligner": "ALIGN_RATE"
                                    }
                                }
                            }
                        }]
                    }
                }
            },
            {
                "width": 6,
                "height": 4,
                "xPos": 6,
                "yPos": 8,
                "widget": {
                    "title": "Tool Calls by Type",
                    "xyChart": {
                        "dataSets": [{
                            "timeSeriesQuery": {
                                "timeSeriesFilter": {
                                    "filter": 'metric.type="marketing_agent_tool_calls_total"',
                                    "aggregation": {
                                        "alignmentPeriod": "60s",
                                        "perSeriesAligner": "ALIGN_RATE",
                                        "groupByFields": ["metric.label.tool_name"]
                                    }
                                }
                            }
                        }]
                    }
                }
            }
        ]
    }
}
