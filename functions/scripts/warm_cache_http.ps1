# Cache Warming Script - PowerShell Version
# Calls staging API to warm cache with FAQ questions
#
# Usage: .\warm_cache_http.ps1

$STAGING_URL = "https://marketing-api-857724136585.australia-southeast1.run.app"
$ENDPOINT = "/api/ai/marketing-chat/stream"

Write-Host "============================================================"
Write-Host "🔥 HTTP CACHE WARMING SCRIPT" -ForegroundColor Yellow
Write-Host "============================================================"
Write-Host "Staging URL: $STAGING_URL"
Write-Host ""

# Top 20 FAQ questions to warm cache
$questions = @(
    "What are your pricing plans?",
    "What services do you offer?",
    "Tell me about your core services",
    "How does system integration work?",
    "What AI capabilities do you offer?",
    "How can you automate our business processes?",
    "How do I get started?",
    "How secure is your platform?",
    "What support channels do you offer?",
    "How fast is your platform?",
    "How are you different from competitors?",
    "Do you have a free tier?",
    "What is intelligent application development?",
    "Can you integrate with our existing tools?",
    "How does your AI agent work?",
    "What is workflow automation?",
    "What is the onboarding process?",
    "Do you comply with GDPR?",
    "Do you provide 24/7 support?",
    "What is your uptime guarantee?"
)

$total = $questions.Count
$success = 0
$errors = 0

Write-Host "Total questions to cache: $total"
Write-Host ""

for ($i = 0; $i -lt $questions.Count; $i++) {
    $question = $questions[$i]
    $num = $i + 1
    $truncated = ($question.Length -gt 50) ? $question.Substring(0, 50) : $question

    Write-Host "[$num/$total] Processing: $truncated..." -NoNewline

    try {
        # URL encode question
        Add-Type -AssemblyName System.Web
        $encodedQuestion = [System.Web.HttpUtility]::UrlEncode($question)
        $url = "$STAGING_URL$ENDPOINT" + "?message=$encodedQuestion" + "`&" + "page_context=unknown"

        # Call API (consume response to trigger caching)
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 30 -UseBasicParsing

        Write-Host " ✅ Cached successfully" -ForegroundColor Green
        $success++
    }
    catch {
        Write-Host " ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }

    # Throttle: wait 2 seconds between requests
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "============================================================"
Write-Host "📊 CACHE WARMING SUMMARY" -ForegroundColor Yellow
Write-Host "============================================================"
Write-Host "Total: $total"
Write-Host "Success: $success" -ForegroundColor Green
Write-Host "Errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "✅ Cache warming complete!" -ForegroundColor Green
