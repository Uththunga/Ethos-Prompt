# 🔄 Git Workflow Guide - React Prompt Library

**Version:** 3.0
**Last Updated:** January 27, 2025
**Team Readiness Score:** 9.1/10 → Target: 9.5/10

---

## 📋 Table of Contents

1. [Branching Strategy](#branching-strategy)
2. [Commit Message Conventions](#commit-message-conventions)
3. [Pull Request Guidelines](#pull-request-guidelines)
4. [Code Review Checklist](#code-review-checklist)
5. [Release Management Workflow](#release-management-workflow)
6. [Git Hooks & Automation](#git-hooks--automation)
7. [Troubleshooting & Best Practices](#troubleshooting--best-practices)

---

## 🌳 Branching Strategy

### Branch Types

We follow a **Git Flow** inspired branching strategy with modern adaptations:

```
main (production)
├── develop (integration)
│   ├── feature/TASK-123-user-authentication
│   ├── feature/TASK-124-prompt-editor
│   └── feature/TASK-125-analytics-dashboard
├── release/v2.1.0
├── hotfix/critical-security-fix
└── bugfix/TASK-126-login-error
```

#### **Main Branches**

- **`main`** - Production-ready code, always deployable
- **`develop`** - Integration branch for features, staging environment

#### **Supporting Branches**

- **`feature/*`** - New features and enhancements
- **`bugfix/*`** - Bug fixes for develop branch
- **`hotfix/*`** - Critical fixes for production
- **`release/*`** - Release preparation and stabilization
- **`chore/*`** - Maintenance tasks, dependency updates

### Branch Naming Conventions

```bash
# Feature branches
feature/TASK-123-short-description
feature/user-authentication
feature/prompt-editor-improvements

# Bug fix branches
bugfix/TASK-456-login-error
bugfix/memory-leak-fix

# Hotfix branches
hotfix/security-vulnerability
hotfix/critical-crash-fix

# Release branches
release/v2.1.0
release/v2.1.0-rc.1

# Chore branches
chore/update-dependencies
chore/eslint-config-update
```

### Branch Lifecycle

#### **Feature Development**
```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/TASK-123-user-auth

# 2. Work on feature with regular commits
git add .
git commit -m "feat(auth): add login form validation"

# 3. Keep branch updated with develop
git checkout develop
git pull origin develop
git checkout feature/TASK-123-user-auth
git rebase develop

# 4. Push and create pull request
git push origin feature/TASK-123-user-auth
```

#### **Hotfix Process**
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. Make the fix
git add .
git commit -m "fix(security): patch XSS vulnerability"

# 3. Create PR to main AND develop
git push origin hotfix/critical-security-fix
```

---

## 📝 Commit Message Conventions

We follow **Conventional Commits** specification for consistent and semantic commit messages.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature for the user
- **fix**: Bug fix for the user
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **ci**: CI/CD pipeline changes
- **build**: Build system or external dependency changes

### Scopes

Common scopes for our project:

- **auth**: Authentication and authorization
- **ui**: User interface components
- **api**: API and backend services
- **db**: Database related changes
- **config**: Configuration changes
- **deps**: Dependency updates
- **docs**: Documentation updates

### Examples

```bash
# Good commit messages
feat(auth): add Google OAuth integration
fix(ui): resolve button alignment issue on mobile
docs(api): update Firebase integration guide
refactor(components): extract reusable Modal component
perf(queries): optimize prompt search with indexing
test(auth): add unit tests for login validation
chore(deps): update React to v18.3.1

# Bad commit messages
fix bug
update code
changes
WIP
asdf
```

### Commit Message Rules

1. **Use imperative mood** - "add feature" not "added feature"
2. **Keep first line under 72 characters**
3. **Capitalize first letter** of description
4. **No period** at the end of description
5. **Use body** for detailed explanation when needed
6. **Reference issues** in footer: `Closes #123`

### Advanced Examples

```bash
# With body and footer
feat(analytics): add real-time dashboard metrics

Implement WebSocket connection for live data updates.
Includes user session tracking and prompt execution stats.

Closes #234
Refs #235

# Breaking change
feat(api)!: restructure authentication endpoints

BREAKING CHANGE: Auth endpoints moved from /auth/* to /api/v2/auth/*
Migration guide available in docs/migration.md

Closes #456
```

---

## 🔍 Pull Request Guidelines

### PR Title Format

Follow the same convention as commit messages:

```
feat(auth): add Google OAuth integration
fix(ui): resolve mobile navigation issues
docs(setup): update development environment guide
```

### PR Description Template

```markdown
## 📋 Description
Brief description of changes and motivation.

## 🔄 Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## 🧪 Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## 📸 Screenshots (if applicable)
Before/after screenshots for UI changes.

## 📝 Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No console errors or warnings
- [ ] Responsive design tested
- [ ] Accessibility guidelines followed

## 🔗 Related Issues
Closes #123
Refs #456

## 📚 Additional Notes
Any additional information for reviewers.
```

### PR Size Guidelines

- **Small PR**: < 200 lines changed ✅ Preferred
- **Medium PR**: 200-500 lines changed ⚠️ Acceptable
- **Large PR**: > 500 lines changed ❌ Should be split

### PR Workflow

1. **Create PR** from feature branch to develop
2. **Add reviewers** (minimum 1, recommended 2)
3. **Add labels** (feature, bugfix, documentation, etc.)
4. **Link issues** using keywords (Closes #123)
5. **Wait for reviews** and address feedback
6. **Ensure CI passes** (tests, linting, build)
7. **Squash and merge** when approved

---

## ✅ Code Review Checklist

### For Authors (Self-Review)

#### **Before Creating PR**
- [ ] Code compiles without errors or warnings
- [ ] All tests pass locally
- [ ] ESLint and Prettier checks pass
- [ ] TypeScript type checking passes
- [ ] Manual testing completed
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions
- [ ] PR description is complete and clear

#### **Code Quality**
- [ ] Code is readable and well-commented
- [ ] Functions are small and focused
- [ ] No duplicate code
- [ ] Error handling is appropriate
- [ ] Security considerations addressed
- [ ] Performance implications considered

### For Reviewers

#### **Functionality**
- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error scenarios are covered
- [ ] User experience is intuitive
- [ ] Performance is acceptable

#### **Code Quality**
- [ ] Code is clean and readable
- [ ] Naming conventions are followed
- [ ] Code structure is logical
- [ ] No unnecessary complexity
- [ ] Proper separation of concerns

#### **Technical Standards**
- [ ] TypeScript types are correct
- [ ] React patterns are followed correctly
- [ ] Firebase integration is secure
- [ ] Accessibility guidelines followed
- [ ] Responsive design implemented

#### **Testing**
- [ ] Adequate test coverage
- [ ] Tests are meaningful
- [ ] Tests pass consistently
- [ ] Edge cases are tested

#### **Documentation**
- [ ] Code is self-documenting
- [ ] Complex logic is commented
- [ ] API changes are documented
- [ ] README updated if needed

### Review Response Guidelines

#### **For Authors**
- Respond to all feedback within 24 hours
- Ask questions if feedback is unclear
- Make requested changes promptly
- Thank reviewers for their time
- Resolve conversations when addressed

#### **For Reviewers**
- Provide constructive feedback
- Explain the "why" behind suggestions
- Distinguish between "must fix" and "nice to have"
- Approve when standards are met
- Be respectful and professional

### Review Labels

- **🟢 LGTM** - Looks Good To Me, ready to merge
- **🟡 Needs Changes** - Minor changes required
- **🔴 Major Issues** - Significant problems need addressing
- **💡 Suggestion** - Optional improvement
- **❓ Question** - Need clarification

---

## 🚀 Release Management Workflow

### Release Types

#### **Major Release (v2.0.0)**
- Breaking changes
- New major features
- Architecture changes
- Quarterly releases

#### **Minor Release (v2.1.0)**
- New features
- Enhancements
- Non-breaking changes
- Monthly releases

#### **Patch Release (v2.1.1)**
- Bug fixes
- Security patches
- Performance improvements
- As needed

### Release Process

#### **1. Release Planning**
```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v2.1.0

# Update version numbers
npm version minor --no-git-tag-version
```

#### **2. Release Preparation**
- [ ] Update CHANGELOG.md with release notes
- [ ] Update version in package.json files
- [ ] Run full test suite
- [ ] Update documentation
- [ ] Create release notes
- [ ] Notify team of release candidate

#### **3. Release Testing**
```bash
# Deploy to staging environment
npm run deploy:staging

# Run comprehensive tests
npm run test:all
npm run test:e2e
npm run lighthouse:ci
```

#### **4. Release Deployment**
```bash
# Merge release branch to main
git checkout main
git merge --no-ff release/v2.1.0
git tag -a v2.1.0 -m "Release version 2.1.0"

# Merge back to develop
git checkout develop
git merge --no-ff release/v2.1.0

# Push everything
git push origin main
git push origin develop
git push origin v2.1.0

# Deploy to production
npm run deploy:prod
```

#### **5. Post-Release**
- [ ] Verify production deployment
- [ ] Monitor error rates and performance
- [ ] Update project boards
- [ ] Send release announcement
- [ ] Delete release branch

### Release Notes Template

```markdown
# Release v2.1.0 - "Enhanced Analytics"

**Release Date:** January 27, 2025
**Team Readiness Score:** 9.5/10

## 🎉 New Features
- **Analytics Dashboard**: Real-time prompt execution metrics
- **Advanced Search**: Semantic search with AI-powered suggestions
- **Team Collaboration**: Shared workspaces and prompt libraries

## 🐛 Bug Fixes
- Fixed memory leak in prompt editor
- Resolved authentication timeout issues
- Improved mobile navigation responsiveness

## 🔧 Improvements
- 40% faster prompt execution
- Enhanced error handling and user feedback
- Updated design system with new components

## 🔒 Security
- Updated dependencies with security patches
- Enhanced input validation and sanitization
- Improved authentication flow security

## 📚 Documentation
- Updated API integration guide
- New team collaboration documentation
- Enhanced troubleshooting guides

## 🚨 Breaking Changes
None in this release.

## 📊 Metrics
- Bundle size reduced by 15%
- Test coverage increased to 85%
- Performance score improved to 95/100

## 🙏 Contributors
- @developer1 - Analytics dashboard implementation
- @developer2 - Search functionality improvements
- @developer3 - Security enhancements

## 📋 Migration Guide
No migration required for this release.

## 🔗 Links
- [Full Changelog](CHANGELOG.md)
- [Documentation](docs/)
- [Migration Guide](docs/migration.md)
```

---

## 🪝 Git Hooks & Automation

### Pre-commit Hooks

We use **Husky** for Git hooks automation:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run type-check",
      "pre-push": "npm run test:ci",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

### Lint-staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

### Commit Message Validation

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'ci',
        'build'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'ui',
        'api',
        'db',
        'config',
        'deps',
        'docs'
      ]
    ],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100]
  }
};
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run type checking
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci

      - name: Build project
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Firebase
        run: npm run deploy:prod
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## 🛠️ Troubleshooting & Best Practices

### Common Git Issues

#### **Merge Conflicts**
```bash
# When conflicts occur during merge/rebase
git status                    # See conflicted files
# Edit files to resolve conflicts
git add .                     # Stage resolved files
git commit                    # Complete merge
# or
git rebase --continue         # Continue rebase
```

#### **Accidental Commits**
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit message
git commit --amend -m "New message"
```

#### **Branch Cleanup**
```bash
# Delete merged local branches
git branch --merged | grep -v "\*\|main\|develop" | xargs -n 1 git branch -d

# Delete remote tracking branches
git remote prune origin

# Force delete unmerged branch
git branch -D feature/old-branch
```

### Best Practices

#### **Daily Workflow**
1. Start day by pulling latest develop
2. Create feature branch for each task
3. Make small, focused commits
4. Push regularly to backup work
5. Create PR when feature is complete
6. Address review feedback promptly

#### **Commit Best Practices**
- Commit early and often
- Each commit should be a logical unit
- Write meaningful commit messages
- Don't commit broken code
- Use interactive rebase to clean up history

#### **Branch Management**
- Keep branches short-lived (< 1 week)
- Delete branches after merging
- Regularly sync with develop
- Use descriptive branch names
- Don't work directly on main/develop

#### **Code Review Best Practices**
- Review your own code first
- Keep PRs small and focused
- Respond to feedback quickly
- Be respectful in discussions
- Learn from review comments

### Git Aliases

Add these to your `.gitconfig` for productivity:

```bash
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = !gitk
  lg = log --oneline --graph --decorate --all
  amend = commit --amend --no-edit
  pushf = push --force-with-lease
  cleanup = "!git branch --merged | grep -v '\\*\\|main\\|develop' | xargs -n 1 git branch -d"
```

### Emergency Procedures

#### **Hotfix Deployment**
1. Create hotfix branch from main
2. Make minimal fix
3. Test thoroughly
4. Create PR to main (expedited review)
5. Deploy immediately after merge
6. Merge hotfix to develop
7. Monitor production closely

#### **Rollback Procedure**
```bash
# Rollback to previous release
git checkout main
git reset --hard v2.0.1
git push --force-with-lease origin main

# Deploy previous version
npm run deploy:prod
```

---

## 📊 Workflow Metrics

### Key Performance Indicators

- **Lead Time**: Time from commit to production
- **Deployment Frequency**: How often we deploy
- **Mean Time to Recovery**: Time to fix production issues
- **Change Failure Rate**: Percentage of deployments causing issues

### Success Criteria

- ✅ All commits follow conventional format
- ✅ All PRs have proper reviews
- ✅ CI/CD pipeline passes consistently
- ✅ Release process is automated
- ✅ Team follows branching strategy
- ✅ Documentation is kept up-to-date

---

*This Git Workflow Guide ensures consistent, efficient, and collaborative development practices for the React Prompt Library team. Regular review and updates of these processes help maintain high code quality and team productivity.*
