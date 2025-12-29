# Team Responsibility Matrix — Critical Gaps Remediation

**Reference**: Multi-Role Expert Team structure from `.augment/rules/machan.md`

---

## RACI Matrix

**Legend**:
- **R** = Responsible (does the work)
- **A** = Accountable (final approval)
- **C** = Consulted (provides input)
- **I** = Informed (kept updated)

---

## Phase 1: Staging Environment Configuration (P0)

| Task | Backend Dev | Frontend Dev | QA Engineer | DevOps | Tech Writer |
|------|-------------|--------------|-------------|---------|-------------|
| **1.1: Create Firebase Project** | I | I | I | **R/A** | I |
| **1.2: Configure Environment** | **R/A** | C | I | C | I |
| **1.3: Deploy Rules/Indexes** | **R/A** | I | I | C | I |
| **1.4: Deploy Functions** | **R/A** | I | C | C | I |
| **1.5: Deploy Frontend** | C | **R/A** | I | C | I |
| **1.6: GitHub Secrets** | C | C | I | **R/A** | I |
| **1.7: Smoke Tests** | **R** | I | **R/A** | C | I |
| **1.8: Documentation** | C | C | C | C | **R/A** |

---

## Phase 2: E2E Test CI/CD Integration (P1)

| Task | Backend Dev | Frontend Dev | QA Engineer | DevOps | Tech Writer |
|------|-------------|--------------|-------------|---------|-------------|
| **3.1: Verify E2E Config** | I | C | **R/A** | C | I |
| **3.2: Update ci.yml** | I | I | C | **R/A** | I |
| **3.3: Update test.yml** | I | I | C | **R/A** | I |
| **3.4: Verify ci-cd.yml** | I | I | C | **R/A** | I |
| **3.5: Package.json Scripts** | I | **R/A** | C | I | I |
| **3.6: E2E Testing Guide** | C | C | **R** | C | **A** |
| **3.7: Test via PR** | I | I | **R** | **R/A** | I |

---

## Phase 3: Performance Budget Verification (P2)

| Task | Backend Dev | Frontend Dev | QA Engineer | DevOps | Tech Writer |
|------|-------------|--------------|-------------|---------|-------------|
| **4.1: Check Script Exists** | I | **R/A** | I | I | I |
| **4.2: Create/Update Script** | I | **R/A** | I | C | I |
| **4.3: Test Locally & CI** | I | **R/A** | C | C | I |
| **4.4: Document Budgets** | C | **R** | C | C | **A** |

---

## Detailed Role Responsibilities

### Backend Developer

**Core Expertise** (from machan.md):
- Firebase Cloud Functions (Node.js 18)
- Firestore database architecture, security rules, indexes
- Secure authentication flows
- API performance optimization

**Tasks in This Workflow**:
1. **Task 1.2**: Configure Firebase Functions environment variables
   - Set openrouter.api_key, app.environment, CORS, rate limits
   - Validate configuration with `firebase functions:config:get`

2. **Task 1.3**: Deploy Firestore rules and indexes
   - Deploy security rules to staging
   - Deploy composite indexes
   - Monitor index build status

3. **Task 1.4**: Deploy Cloud Functions to staging
   - Run function tests before deployment
   - Deploy all functions to australia-southeast1
   - Verify endpoints (health, execute_prompt, etc.)
   - Monitor function logs for errors

4. **Task 1.7**: Support smoke testing
   - Test health endpoint
   - Test OpenRouter connectivity
   - Review function logs
   - Debug any backend issues

**Time Commitment**: 3.5 hours (Day 1)

---

### Frontend Developer

**Core Expertise** (from machan.md):
- React 18 + TypeScript + Vite
- Tailwind CSS and Radix UI
- State management (React Query, Context API)
- Performance optimization (code splitting, lazy loading)

**Tasks in This Workflow**:
1. **Task 1.5**: Deploy frontend to staging hosting
   - Configure frontend/.env.staging
   - Build with `npm run build:staging`
   - Deploy to Firebase Hosting
   - Verify staging URL loads correctly

2. **Task 3.5**: Validate E2E scripts in package.json
   - Confirm test:e2e scripts exist
   - Test scripts locally if needed

3. **Task 4.3**: Test performance budgets
   - Run local build
   - Execute budget checker
   - Verify CI integration
   - Test failure scenarios
   - Optimize if budgets fail

**Time Commitment**: 1.5 hours (Day 1 + parallel)

---

### QA Engineer

**Core Expertise** (from machan.md):
- Comprehensive testing strategies (unit, integration, e2e)
- Playwright E2E testing
- CI/CD pipeline testing
- Quality gate enforcement

**Tasks in This Workflow**:
1. **Task 1.7**: Lead smoke testing
   - Test authentication flow (signup, login, logout)
   - Test prompt creation and execution
   - Test document upload
   - Test RAG-enabled execution
   - Verify UI/UX quality
   - Document any issues found

2. **Task 3.1**: Verify E2E test configuration
   - Review playwright.config.ts
   - Count tests in e2e/*.spec.ts
   - Run tests locally to ensure baseline

3. **Task 3.7**: Validate E2E in CI
   - Monitor PR workflow execution
   - Review Playwright reports
   - Verify all browsers pass
   - Check for flaky tests
   - Approve PR if all tests pass

**Time Commitment**: 2 hours (Day 1 + Day 2)

---

### DevOps Engineer

**Core Expertise** (from machan.md):
- Firebase infrastructure and deployment
- GitHub Actions CI/CD workflows
- Secrets management
- Monitoring and alerting

**Tasks in This Workflow**:
1. **Task 1.1**: Create Firebase staging project
   - Create project in Firebase Console
   - Link locally with Firebase CLI
   - Enable all required services
   - Configure billing and budget alerts

2. **Task 1.6**: Configure GitHub Secrets
   - Generate Firebase service account
   - Add secrets to GitHub repo
   - Verify workflow references

3. **Task 3.2-3.4**: Update CI/CD workflows
   - Add E2E jobs to ci.yml
   - Add E2E jobs to test.yml
   - Verify ci-cd.yml E2E integration
   - Validate workflow syntax

4. **Task 3.7**: Test E2E via PR
   - Create feature branch
   - Open pull request
   - Monitor workflow execution
   - Merge when all checks pass

**Time Commitment**: 2.5 hours (Day 1 + Day 2)

---

### Tech Writer

**Core Expertise** (from machan.md):
- Technical documentation
- Runbooks and guides
- Architecture Decision Records (ADRs)
- User-facing documentation

**Tasks in This Workflow**:
1. **Task 1.8**: Document staging environment
   - Create STAGING_DEPLOYMENT_GUIDE.md
   - Update README with environments section
   - Include rollback procedures

2. **Task 3.6**: Create E2E Testing Guide
   - Document local setup
   - Document CI integration
   - Include best practices
   - Add troubleshooting section

3. **Task 4.4**: Document performance budgets
   - Create PERFORMANCE_BUDGETS.md
   - Document budget thresholds
   - Include optimization strategies
   - Update README

**Time Commitment**: 1.5 hours (completed in advance)

---

## Communication & Handoffs

### Critical Handoff Points

1. **DevOps → Backend** (After Task 1.1)
   - Handoff: Firebase project created and linked
   - Required info: Project ID, region, enabled services
   - Communication: Slack/Email with project details

2. **Backend → Frontend** (After Task 1.4)
   - Handoff: Functions deployed and verified
   - Required info: Function URLs, health check status
   - Communication: Confirm in task tracking system

3. **Frontend → DevOps** (After Task 1.5)
   - Handoff: Frontend deployed to staging
   - Required info: Hosting URL, build status
   - Communication: Share staging URL for verification

4. **DevOps → QA + Backend** (After Task 1.6)
   - Handoff: GitHub secrets configured
   - Required info: Secret names, workflow status
   - Communication: Ready for smoke testing

5. **QA + Backend → All** (After Task 1.7)
   - Handoff: Smoke tests complete
   - Required info: Test results, any issues found
   - Communication: Decision Gate 1 approval

---

## Decision Authority

### Decision Gate 1: Staging Environment Ready
**Authority**: Backend Developer + QA Engineer (joint approval)
**Criteria**: All smoke tests pass, no critical errors
**Action if FAIL**: Backend Developer leads debugging

### Decision Gate 2: E2E CI/CD Validated
**Authority**: DevOps Engineer + QA Engineer (joint approval)
**Criteria**: All E2E tests pass in CI, deploy gating works
**Action if FAIL**: DevOps Engineer fixes workflows, QA Engineer fixes tests

### Decision Gate 3: Performance Budgets Verified
**Authority**: Frontend Developer (sole approval)
**Criteria**: Build succeeds, budgets pass, CI integration works
**Action if FAIL**: Frontend Developer optimizes or requests budget adjustment

---

## Escalation Path

### Level 1: Peer Support (0-30 minutes)
- Ask team member with relevant expertise
- Check documentation and guides
- Search existing issues/solutions

### Level 2: Team Lead (30 minutes - 2 hours)
- Escalate to Project Lead if blocked >30 minutes
- Provide context: task, blocker, attempted solutions
- Request guidance or resources

### Level 3: Emergency Sync (>2 hours)
- Schedule emergency team call if critical path blocked >2 hours
- All relevant roles attend
- Document decisions and action items

---

## Success Metrics by Role

### Backend Developer
- ✅ Functions deploy without errors
- ✅ All endpoints return 200 OK
- ✅ No critical errors in logs
- ✅ Performance within acceptable range

### Frontend Developer
- ✅ Build completes successfully
- ✅ Performance budgets pass
- ✅ Staging URL loads without errors
- ✅ UI/UX matches production quality

### QA Engineer
- ✅ All smoke tests pass
- ✅ E2E tests pass in CI (all browsers)
- ✅ No flaky tests detected
- ✅ Quality gates enforced

### DevOps Engineer
- ✅ Infrastructure provisioned correctly
- ✅ CI/CD workflows execute successfully
- ✅ Secrets configured securely
- ✅ Monitoring and alerts active

### Tech Writer
- ✅ All documentation accurate and complete
- ✅ Runbooks tested and validated
- ✅ README updated with new sections
- ✅ ADRs capture key decisions

---

## Post-Completion Checklist

### Backend Developer
- [ ] Review function performance metrics
- [ ] Document any configuration changes
- [ ] Update API documentation if needed

### Frontend Developer
- [ ] Review bundle size trends
- [ ] Document any build optimizations
- [ ] Update component documentation if needed

### QA Engineer
- [ ] Archive test reports
- [ ] Document any test improvements
- [ ] Update test coverage metrics

### DevOps Engineer
- [ ] Configure monitoring alerts for staging
- [ ] Document infrastructure changes
- [ ] Update deployment runbooks

### Tech Writer
- [ ] Final documentation review
- [ ] Update changelog
- [ ] Prepare release notes

---

**Document Owner**: DevOps Engineer  
**Maintained By**: All team members  
**Review Frequency**: After each phase completion

