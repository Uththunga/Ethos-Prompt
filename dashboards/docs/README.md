# Monitoring Dashboards Documentation

## Overview
This directory contains the production monitoring dashboards for the RAG Prompt Library application.

## Dashboards


### System Health Overview
- **File**: system_health.html
- **Description**: High-level system health and performance metrics
- **Widgets**: 4
- **Refresh**: 30 seconds

### API Performance Dashboard
- **File**: api_performance.html
- **Description**: Detailed API endpoint performance and usage metrics
- **Widgets**: 4
- **Refresh**: 30 seconds

### User Analytics Dashboard
- **File**: user_analytics.html
- **Description**: User behavior, engagement, and authentication metrics
- **Widgets**: 4
- **Refresh**: 30 seconds

### Infrastructure Monitoring
- **File**: infrastructure.html
- **Description**: Firebase services, database, and storage metrics
- **Widgets**: 4
- **Refresh**: 30 seconds

### Business Metrics Dashboard
- **File**: business_metrics.html
- **Description**: Key business indicators and usage patterns
- **Widgets**: 4
- **Refresh**: 30 seconds


## Usage

1. **View Dashboards**: Open `index.html` in a web browser
2. **Auto-refresh**: Dashboards automatically refresh every 30 seconds
3. **Data Collection**: Run `node scripts/collect_metrics.js` to start data collection

## Configuration

Dashboard configurations are stored in `configs/` directory.
Modify these files to customize dashboard layouts and metrics.

## Troubleshooting

- Ensure data collection script is running
- Check browser console for JavaScript errors
- Verify metric data files are being updated
