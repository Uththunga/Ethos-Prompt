# Simple Cache Warming Script
# Makes HTTP calls to staging API to warm cache

$url = "https://marketing-api-857724136585.australia-southeast1.run.app/api/ai/marketing-chat/stream"

$questions = @(
    # Pricing & Plans (top queries)
    "What are your pricing plans?",
    "How much do your services cost?",
    "Do you have a free tier?",

    # Services & Capabilities
    "What services do you offer?",
    "Tell me about your core services",
    "What AI capabilities do you offer?",
    "What is intelligent application development?",

    # Integration & Technical
    "How does system integration work?",
    "Can you integrate with our existing tools?",
    "What systems can you integrate with?",

    # Getting Started
    "How do I get started?",
    "What is the onboarding process?",
    "How long does implementation take?",

    # Security & Compliance
    "How secure is your platform?",
    "Do you comply with GDPR?",
    "Where is data stored?",

    # Support & Performance
    "What support channels do you offer?",
    "How fast is your platform?",
    "What is your uptime guarantee?",

    # Business Value
    "How are you different from competitors?"
)

Write-Host "============================================================"
Write-Host "Cache Warming: $($questions.Count) questions (expanded)" -ForegroundColor Cyan
Write-Host "Estimated time: ~$($questions.Count * 2) seconds"
Write-Host "============================================================"

$success = 0
$errors = 0

for ($i = 0; $i -lt $questions.Count; $i++) {
    $q = $questions[$i]
    $num = $i + 1

    Write-Host "[$num/$($questions.Count)] $($q.Substring(0, [Math]::Min(40, $q.Length)))..." -NoNewline

    try {
        $encodedQ = [Uri]::EscapeDataString($q)
        $fullUrl = "$url`?message=$encodedQ`&page_context=unknown"

        $null = Invoke-WebRequest -Uri $fullUrl -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop

        Write-Host " OK" -ForegroundColor Green
        $success++
    }
    catch {
        Write-Host " ERROR" -ForegroundColor Red
        $errors++
    }

    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Complete: $success/$($questions.Count) cached successfully"
