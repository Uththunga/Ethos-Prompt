#!/bin/bash
#
# Simple Cache Warming Script - HTTP Based
# Calls staging API to warm cache with FAQ questions
#
# Usage: ./warm_cache_http.sh

STAGING_URL="https://marketing-api-857724136585.australia-southeast1.run.app"
ENDPOINT="/api/ai/marketing-chat/stream"

echo "============================================================"
echo "🔥 HTTP CACHE WARMING SCRIPT"
echo "============================================================"
echo "Staging URL: $STAGING_URL"
echo ""

# Top 20 FAQ questions to warm cache
questions=(
  "What are your pricing plans?"
  "What services do you offer?"
  "Tell me about your core services"
  "How does system integration work?"
  "What AI capabilities do you offer?"
  "How can you automate our business processes?"
  "How do I get started?"
  "How secure is your platform?"
  "What support channels do you offer?"
  "How fast is your platform?"
  "How are you different from competitors?"
  "Do you have a free tier?"
  "What is intelligent application development?"
  "Can you integrate with our existing tools?"
  "How does your AI agent work?"
  "What is workflow automation?"
  "What is the onboarding process?"
  "Do you comply with GDPR?"
  "Do you provide 24/7 support?"
  "What is your uptime guarantee?"
)

total=${#questions[@]}
success=0
errors=0

echo "Total questions to cache: $total"
echo ""

for i in "${!questions[@]}"; do
  question="${questions[$i]}"
  num=$((i+1))

  echo "[$num/$total] Processing: ${question:0:50}..."

  # Call API using curl (consume response to trigger caching)
  response=$(curl -s -X GET "$STAGING_URL$ENDPOINT?message=$(echo "$question" | jq -sRr @uri)&page_context=unknown" \
    -H "Accept: text/event-stream" \
    --max-time 30)

  if [ $? -eq 0 ]; then
    echo "[$num/$total] ✅ Cached successfully"
    ((success++))
  else
    echo "[$num/$total] ❌ Error"
    ((errors++))
  fi

  # Throttle: wait 2 seconds between requests
  sleep 2
done

echo ""
echo "============================================================"
echo "📊 CACHE WARMING SUMMARY"
echo "============================================================"
echo "Total: $total"
echo "Success: $success"
echo "Errors: $errors"
echo ""
echo "✅ Cache warming complete!"
