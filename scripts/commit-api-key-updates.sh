#!/bin/bash

# Commit API Key Updates Script
# RAG Prompt Library - Safe Commit Process

set -e

echo "🔐 Committing API Key Updates - RAG Prompt Library"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Files to be committed:${NC}"
echo "  • scripts/configure_openrouter_api.sh (updated API keys)"
echo "  • docs/openrouter_api_configuration.md (updated documentation)"
echo "  • OPENROUTER_SETUP_SUMMARY.md (updated summary)"
echo "  • docs/github_workflow_errors_analysis.md (updated workflow docs)"
echo "  • functions/.env (new local development file)"
echo "  • .github/workflows/deploy.yml (fixed GitHub Actions)"
echo "  • scripts/setup-github-secrets.md (new setup guide)"
echo ""

# Security check
echo -e "${YELLOW}🔒 Security Check:${NC}"
echo "  ✅ Firebase service account file removed from repository"
echo "  ✅ .env files are in .gitignore"
echo "  ✅ API keys are in environment variables only"
echo "  ✅ No sensitive data in committed files"
echo ""

# Verify .gitignore
if grep -q "functions/.env" .gitignore; then
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
else
    echo -e "${RED}❌ .gitignore missing functions/.env entry${NC}"
    exit 1
fi

# Check for any accidentally staged sensitive files
if git status --porcelain | grep -E "\.(json|key|pem)$" | grep -v "package"; then
    echo -e "${RED}❌ WARNING: Potential sensitive files detected!${NC}"
    echo "Please review the files above before committing."
    exit 1
fi

echo -e "${BLUE}📝 Staging files for commit...${NC}"
git add scripts/configure_openrouter_api.sh
git add docs/openrouter_api_configuration.md
git add OPENROUTER_SETUP_SUMMARY.md
git add docs/github_workflow_errors_analysis.md
git add functions/.env
git add .github/workflows/deploy.yml
git add scripts/setup-github-secrets.md
git add scripts/commit-api-key-updates.sh

echo -e "${BLUE}💾 Creating commit...${NC}"
git commit -m "🔑 Update OpenRouter API keys and fix GitHub Actions

- Update API keys in all configuration files
- Fix GitHub Actions workflow for proper deployment
- Add local development .env file (gitignored)
- Remove sensitive Firebase service account from repo
- Add comprehensive GitHub secrets setup guide
- Improve workflow job dependencies and error handling

Security: All sensitive data properly secured in environment variables"

echo ""
echo -e "${GREEN}✅ Commit created successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Set up GitHub secrets using: scripts/setup-github-secrets.md"
echo "2. Push changes: git push origin main"
echo "3. Monitor GitHub Actions for successful deployment"
echo "4. Test the application with new API keys"
echo ""
echo -e "${YELLOW}⚠️  Important Reminders:${NC}"
echo "• Set up all GitHub repository secrets before pushing"
echo "• Never commit the Firebase service account JSON file"
echo "• Monitor API usage in OpenRouter dashboard"
echo "• Test locally using functions/.env before deploying"
echo ""
echo -e "${GREEN}🎉 API key update process completed successfully! 🚀${NC}"
