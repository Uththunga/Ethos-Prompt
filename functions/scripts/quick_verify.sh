#!/bin/bash
# Quick API Key Verification Script
# Task 1.1: Environment Setup & API Key Verification

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Quick API Key Verification - Task 1.1${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Load .env file
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}✗ .env file not found${NC}"
    echo -e "${YELLOW}ℹ Create .env file from .env.example${NC}"
    exit 1
fi

# Check OpenRouter API Key
echo -e "\n${BLUE}Checking OpenRouter API Key...${NC}"
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${RED}✗ OPENROUTER_API_KEY not set${NC}"
    exit 1
else
    echo -e "${GREEN}✓ OPENROUTER_API_KEY is set${NC}"
    echo -e "${BLUE}ℹ Key: ${OPENROUTER_API_KEY:0:20}...${NC}"
fi

# Test OpenRouter API
echo -e "\n${BLUE}Testing OpenRouter API connection...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -H "HTTP-Referer: https://react-app-000730.web.app" \
  -H "X-Title: Prompt Library Dashboard" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Test"}],
    "max_tokens": 10
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ OpenRouter API connection successful!${NC}"
    echo -e "${BLUE}ℹ Response: $(echo $BODY | jq -r '.choices[0].message.content' 2>/dev/null || echo 'OK')${NC}"
elif [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${RED}✗ Authentication failed - Invalid API key${NC}"
    exit 1
elif [ "$HTTP_CODE" -eq 429 ]; then
    echo -e "${YELLOW}⚠ Rate limited (API key is valid)${NC}"
else
    echo -e "${RED}✗ API request failed with status code: $HTTP_CODE${NC}"
    exit 1
fi

# Check Google Embeddings API Key
echo -e "\n${BLUE}Checking Google Embeddings API Key...${NC}"
if [ -z "$GOOGLE_EMBEDDINGS_API_KEY" ]; then
    echo -e "${RED}✗ GOOGLE_EMBEDDINGS_API_KEY not set${NC}"
    exit 1
else
    echo -e "${GREEN}✓ GOOGLE_EMBEDDINGS_API_KEY is set${NC}"
    echo -e "${BLUE}ℹ Key: ${GOOGLE_EMBEDDINGS_API_KEY:0:20}...${NC}"
fi

# Check Firebase Project ID
echo -e "\n${BLUE}Checking Firebase Configuration...${NC}"
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo -e "${RED}✗ FIREBASE_PROJECT_ID not set${NC}"
    exit 1
else
    echo -e "${GREEN}✓ FIREBASE_PROJECT_ID: $FIREBASE_PROJECT_ID${NC}"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✓ All verifications passed!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${BLUE}Next steps:${NC}"
echo -e "1. Mark Task 1.1 as COMPLETE"
echo -e "2. Start Task 1.2: Audit Current Execution Implementation"
echo -e "3. Run: python scripts/verify_api_keys.py (for detailed verification)"
echo ""

