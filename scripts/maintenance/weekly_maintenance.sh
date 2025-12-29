#!/bin/bash
# Weekly Maintenance Script

echo "🔄 Starting weekly maintenance..."

# Update dependencies
npm audit fix
npm update

# Run security scans
npm audit

# Check system health
node scripts/health_check.js

# Generate weekly reports
node scripts/generate_weekly_report.js

echo "✅ Weekly maintenance completed"
