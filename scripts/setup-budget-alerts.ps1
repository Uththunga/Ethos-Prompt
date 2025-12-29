# Setup Budget Alerts for RAG Prompt Library (PowerShell)
# This script creates budget alerts to prevent unexpected costs

$PROJECT_ID = "rag-prompt-library"
$BILLING_ACCOUNT_ID = "" # Will be fetched automatically

Write-Host "💰 Setting up Budget Alerts for $PROJECT_ID..." -ForegroundColor Cyan
Write-Host ""

# Set the project
gcloud config set project $PROJECT_ID

# Get billing account ID
Write-Host "🔍 Fetching billing account..." -ForegroundColor Yellow
$BILLING_ACCOUNT_ID = gcloud billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>$null

if ([string]::IsNullOrEmpty($BILLING_ACCOUNT_ID)) {
    Write-Host "❌ Error: Could not fetch billing account. Please ensure billing is enabled for the project." -ForegroundColor Red
    Write-Host ""
    Write-Host "To enable billing:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID"
    Write-Host "2. Link a billing account to the project"
    Write-Host ""
    exit 1
}

# Extract just the billing account ID (format: billingAccounts/XXXXXX-XXXXXX-XXXXXX)
$BILLING_ACCOUNT_ID = $BILLING_ACCOUNT_ID -replace "billingAccounts/", ""
Write-Host "✅ Billing account found: $BILLING_ACCOUNT_ID" -ForegroundColor Green
Write-Host ""

# Create budget with multiple thresholds
Write-Host "📊 Creating monthly budget with alert thresholds..." -ForegroundColor Yellow

$budgetConfig = @"
{
  "displayName": "RAG Prompt Library Monthly Budget",
  "budgetFilter": {
    "projects": ["projects/$PROJECT_ID"]
  },
  "amount": {
    "specifiedAmount": {
      "currencyCode": "USD",
      "units": "100"
    }
  },
  "thresholdRules": [
    {
      "thresholdPercent": 0.5,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 0.75,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 0.9,
      "spendBasis": "CURRENT_SPEND"
    },
    {
      "thresholdPercent": 1.0,
      "spendBasis": "CURRENT_SPEND"
    }
  ],
  "allUpdatesRule": {
    "pubsubTopic": "projects/$PROJECT_ID/topics/budget-alerts",
    "schemaVersion": "1.0"
  }
}
"@

$budgetConfig | Out-File -FilePath "$env:TEMP\budget-config.json" -Encoding UTF8

# Create Pub/Sub topic for budget alerts (if it doesn't exist)
Write-Host "📢 Creating Pub/Sub topic for budget alerts..." -ForegroundColor Yellow
gcloud pubsub topics create budget-alerts --project=$PROJECT_ID 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Pub/Sub topic created: budget-alerts" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Pub/Sub topic already exists: budget-alerts" -ForegroundColor Cyan
}
Write-Host ""

# Create the budget using REST API (gcloud doesn't have direct budget creation)
Write-Host "💵 Creating budget via API..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Note: Budget creation requires manual setup via Console or REST API" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please complete the following steps manually:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://console.cloud.google.com/billing/$BILLING_ACCOUNT_ID/budgets?project=$PROJECT_ID" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'CREATE BUDGET'" -ForegroundColor White
Write-Host ""
Write-Host "3. Configure the budget:" -ForegroundColor White
Write-Host "   - Name: RAG Prompt Library Monthly Budget" -ForegroundColor Gray
Write-Host "   - Time range: Monthly" -ForegroundColor Gray
Write-Host "   - Projects: $PROJECT_ID" -ForegroundColor Gray
Write-Host "   - Budget amount: `$100 USD per month" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Set alert thresholds:" -ForegroundColor White
Write-Host "   - 50% of budget (`$50)" -ForegroundColor Gray
Write-Host "   - 75% of budget (`$75)" -ForegroundColor Gray
Write-Host "   - 90% of budget (`$90)" -ForegroundColor Gray
Write-Host "   - 100% of budget (`$100)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Configure notifications:" -ForegroundColor White
Write-Host "   - Email billing admins and users" -ForegroundColor Gray
Write-Host "   - Connect to Pub/Sub topic: budget-alerts" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Click 'FINISH'" -ForegroundColor White
Write-Host ""

# Create a Cloud Function to handle budget alerts (optional)
Write-Host "🔔 Creating budget alert handler..." -ForegroundColor Yellow
Write-Host ""

$functionCode = @"
const functions = require('@google-cloud/functions-framework');
const { Logging } = require('@google-cloud/logging');

const logging = new Logging();
const log = logging.log('budget-alerts');

functions.cloudEvent('budgetAlert', async (cloudEvent) => {
  const pubsubData = cloudEvent.data;
  const budgetData = JSON.parse(
    Buffer.from(pubsubData.message.data, 'base64').toString()
  );

  const costAmount = budgetData.costAmount;
  const budgetAmount = budgetData.budgetAmount;
  const percentUsed = (costAmount / budgetAmount) * 100;

  const metadata = {
    resource: { type: 'cloud_function' },
    severity: percentUsed >= 90 ? 'ERROR' : 'WARNING',
  };

  const entry = log.entry(metadata, {
    message: \`Budget Alert: \${percentUsed.toFixed(2)}% of budget used\`,
    costAmount: costAmount,
    budgetAmount: budgetAmount,
    budgetDisplayName: budgetData.budgetDisplayName,
  });

  await log.write(entry);

  // TODO: Add additional actions here:
  // - Send email via SendGrid
  // - Post to Slack
  // - Trigger cost optimization workflows
  // - Disable non-essential services at 100%

  console.log(\`Budget alert processed: \${percentUsed.toFixed(2)}% used\`);
});
"@

$functionCode | Out-File -FilePath "$env:TEMP\budget-function.js" -Encoding UTF8

Write-Host "📝 Budget alert handler code created at: $env:TEMP\budget-function.js" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy the budget alert handler:" -ForegroundColor Cyan
Write-Host "1. Create a new directory: mkdir functions/budget-alerts" -ForegroundColor Gray
Write-Host "2. Copy the function code to: functions/budget-alerts/index.js" -ForegroundColor Gray
Write-Host "3. Deploy with:" -ForegroundColor Gray
Write-Host "   gcloud functions deploy budgetAlert \" -ForegroundColor Gray
Write-Host "     --gen2 \" -ForegroundColor Gray
Write-Host "     --runtime=nodejs18 \" -ForegroundColor Gray
Write-Host "     --region=australia-southeast1 \" -ForegroundColor Gray
Write-Host "     --source=functions/budget-alerts \" -ForegroundColor Gray
Write-Host "     --entry-point=budgetAlert \" -ForegroundColor Gray
Write-Host "     --trigger-topic=budget-alerts" -ForegroundColor Gray
Write-Host ""

# Create cost monitoring dashboard
Write-Host "📊 Creating cost monitoring dashboard..." -ForegroundColor Yellow
Write-Host ""
Write-Host "To create a cost monitoring dashboard:" -ForegroundColor Cyan
Write-Host "1. Go to: https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID" -ForegroundColor White
Write-Host "2. Click 'CREATE DASHBOARD'" -ForegroundColor White
Write-Host "3. Name it: 'Cost Monitoring'" -ForegroundColor White
Write-Host "4. Add the following widgets:" -ForegroundColor White
Write-Host ""
Write-Host "   Widget 1: Cloud Functions Invocations" -ForegroundColor Gray
Write-Host "   - Metric: cloudfunctions.googleapis.com/function/execution_count" -ForegroundColor Gray
Write-Host "   - Aggregation: Sum" -ForegroundColor Gray
Write-Host "   - Group by: function_name" -ForegroundColor Gray
Write-Host ""
Write-Host "   Widget 2: Firestore Operations" -ForegroundColor Gray
Write-Host "   - Metric: firestore.googleapis.com/document/read_count" -ForegroundColor Gray
Write-Host "   - Aggregation: Sum" -ForegroundColor Gray
Write-Host ""
Write-Host "   Widget 3: Cloud Storage Bandwidth" -ForegroundColor Gray
Write-Host "   - Metric: storage.googleapis.com/network/sent_bytes_count" -ForegroundColor Gray
Write-Host "   - Aggregation: Sum" -ForegroundColor Gray
Write-Host ""
Write-Host "   Widget 4: Function Execution Time" -ForegroundColor Gray
Write-Host "   - Metric: cloudfunctions.googleapis.com/function/execution_times" -ForegroundColor Gray
Write-Host "   - Aggregation: 95th percentile" -ForegroundColor Gray
Write-Host ""

# Clean up temp files
Remove-Item "$env:TEMP\budget-config.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Budget Alert Setup Instructions Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "✅ Pub/Sub topic created: budget-alerts" -ForegroundColor Green
Write-Host "⏳ Budget creation: Manual setup required (see instructions above)" -ForegroundColor Yellow
Write-Host "⏳ Budget alert handler: Code generated (deployment optional)" -ForegroundColor Yellow
Write-Host "⏳ Cost monitoring dashboard: Manual setup required" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "- Budgets: https://console.cloud.google.com/billing/$BILLING_ACCOUNT_ID/budgets?project=$PROJECT_ID" -ForegroundColor White
Write-Host "- Billing: https://console.cloud.google.com/billing/$BILLING_ACCOUNT_ID?project=$PROJECT_ID" -ForegroundColor White
Write-Host "- Monitoring: https://console.cloud.google.com/monitoring?project=$PROJECT_ID" -ForegroundColor White
Write-Host ""

