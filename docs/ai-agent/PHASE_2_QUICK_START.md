# Phase 2: Quick Start Guide

**Date**: October 17, 2025  
**Project**: EthosPrompt - Molē AI Agent Phase 2  
**Purpose**: Quick reference for starting Phase 2 implementation

---

## 🚀 GETTING STARTED

### Prerequisites
- ✅ Phase 1 (Marketing Agent) completed
- ✅ Development environment set up
- ✅ Python 3.11+ installed
- ✅ Node.js 18+ installed
- ✅ Firebase CLI configured
- ✅ OpenRouter API key available

### First Steps
1. **Review Documentation**
   - Read `PHASE_2_TASK_BREAKDOWN.md` (this provides full task details)
   - Review `MOLE_IMPLEMENTATION_PLAN_PART2.md` (original plan)
   - Check `PHASE_1_FINAL_COMPLETION_REPORT.md` (what's already done)

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/phase-2-prompt-library-agent
   ```

3. **Start with Task 2.1.1**
   - Create system architecture diagram
   - Document in `docs/ai-agent/PHASE_2_ARCHITECTURE.md`

---

## 📋 TASK CHECKLIST (First Week)

### Day 1-2: Architecture & Design (2.1)
- [ ] 2.1.1: Create system architecture diagram (Mermaid)
- [ ] 2.1.2: Define agent type and pattern selection
- [ ] 2.1.3: Design tool schemas (Pydantic models)
- [ ] 2.1.4: Design security and authentication model
- [ ] 2.1.5: Define user context schema

**Deliverables**: 5 documentation files + 2 code files

### Day 3-5: Tool Implementation (2.2)
- [ ] 2.2.1: Implement create_prompt tool
- [ ] 2.2.2: Implement execute_prompt tool
- [ ] 2.2.3: Implement search_user_prompts tool
- [ ] 2.2.4: Implement get_execution_history tool
- [ ] 2.2.5: Implement analyze_prompt_performance tool
- [ ] 2.2.6: Implement suggest_improvements tool (most complex)
- [ ] 2.2.7: Create tool registry and factory

**Deliverables**: 8 Python files in `functions/src/ai_agent/prompt_library/tools/`

---

## 🔑 KEY DECISIONS TO MAKE

### 1. Agent Pattern
**Decision**: OpenAI Functions Agent vs ReAct Agent  
**Recommendation**: OpenAI Functions Agent (better for structured outputs)  
**Document in**: Task 2.1.2

### 2. LLM Model Selection
**Options**:
- **Testing**: `x-ai/grok-2-1212:free` (zero cost)
- **Production**: `openai/gpt-4-turbo` or `anthropic/claude-3.5-sonnet`

**Recommendation**: Use free model for all testing, decide on production model later

### 3. Rate Limiting
**Recommendation**: 100 requests/hour per authenticated user  
**Rationale**: Prevents abuse while allowing normal usage  
**Adjustable**: Can increase based on usage patterns

### 4. Cost Budget
**Recommendation**: $50/month threshold for alerts  
**Rationale**: Allows ~5,000 requests/month with paid models  
**Monitoring**: Track per-user costs in Firestore

---

## 📁 FILE STRUCTURE

### Backend Structure
```
functions/src/ai_agent/prompt_library/
├── __init__.py
├── tool_schemas.py              # Task 2.1.3
├── prompt_library_agent.py      # Task 2.3.1-2.3.6
├── prompts.py                   # Task 2.3.4
└── tools/
    ├── __init__.py              # Task 2.2.7
    ├── create_prompt.py         # Task 2.2.1
    ├── execute_prompt.py        # Task 2.2.2
    ├── search_prompts.py        # Task 2.2.3
    ├── get_history.py           # Task 2.2.4
    ├── analyze_performance.py   # Task 2.2.5
    └── suggest_improvements.py  # Task 2.2.6
```

### Frontend Structure
```
frontend/src/
├── types/
│   └── dashboardContext.ts      # Task 2.1.5
├── services/
│   └── promptLibraryChatService.ts  # Task 2.6.1
├── hooks/
│   └── useDashboardContext.ts   # Task 2.6.3
└── components/dashboard/
    ├── DashboardChatPanel.tsx   # Task 2.6.2
    ├── QuickActions.tsx         # Task 2.6.5
    └── ToolExecutionIndicator.tsx  # Task 2.6.6
```

---

## 🛠️ DEVELOPMENT WORKFLOW

### For Each Task
1. **Read task description** in task list
2. **Check dependencies** - ensure prerequisite tasks are complete
3. **Create/modify files** as specified
4. **Write code** following existing patterns from Phase 1
5. **Test locally** with Firebase emulators
6. **Update task state** to IN_PROGRESS → COMPLETE
7. **Commit changes** with descriptive message

### Commit Message Format
```
feat(phase2): [Task ID] Brief description

- Detailed change 1
- Detailed change 2

Task: 2.X.Y
```

Example:
```
feat(phase2): [2.2.1] Implement create_prompt tool

- Add CreatePromptInput Pydantic schema
- Implement create_prompt function with Firestore integration
- Add input validation and error handling
- Return formatted success message with prompt ID

Task: 2.2.1
```

---

## 🧪 TESTING STRATEGY

### Unit Tests (As You Go)
- Write tests immediately after implementing each component
- Use pytest for backend, Vitest for frontend
- Aim for >80% coverage per file

### Integration Tests (After Sections)
- Test after completing each major section (2.2, 2.3, etc.)
- Use Firebase emulators for realistic testing
- Test cross-component interactions

### E2E Tests (Before Deployment)
- Write E2E tests after UI is complete (Task 2.7.6)
- Use Playwright for browser automation
- Test complete user flows

---

## 🔒 SECURITY CHECKLIST

### Authentication
- [ ] Validate Firebase Auth tokens on every request
- [ ] Extract user_id from token, never trust client
- [ ] Return 401 for invalid/missing tokens
- [ ] Implement token refresh handling

### Authorization
- [ ] Filter all Firestore queries by user_id
- [ ] Never allow cross-user data access
- [ ] Validate user owns resources before operations
- [ ] Implement role-based access if needed

### Input Validation
- [ ] Validate all inputs with Pydantic schemas
- [ ] Sanitize user-provided content
- [ ] Limit input sizes (max prompt length, etc.)
- [ ] Prevent injection attacks

### Rate Limiting
- [ ] Implement per-user rate limiting
- [ ] Track requests in Firestore or memory
- [ ] Return 429 with retry-after header
- [ ] Log rate limit violations

---

## 📊 PROGRESS TRACKING

### Daily Standup Questions
1. What tasks did I complete yesterday?
2. What tasks am I working on today?
3. Are there any blockers?
4. Am I on track with the timeline?

### Weekly Review
- Review completed tasks vs. planned
- Update timeline if needed
- Identify risks and mitigation strategies
- Celebrate wins! 🎉

### Task State Updates
Use the task management tools to update states:
```typescript
// Mark task as in progress
update_tasks({ tasks: [{ task_id: "xxx", state: "IN_PROGRESS" }] })

// Mark task as complete
update_tasks({ tasks: [{ task_id: "xxx", state: "COMPLETE" }] })
```

---

## 🐛 TROUBLESHOOTING

### Common Issues

**Issue**: Pydantic validation errors  
**Solution**: Check schema definitions match input data types

**Issue**: Firebase Auth token validation fails  
**Solution**: Ensure token is passed in Authorization header as `Bearer <token>`

**Issue**: Firestore queries return empty results  
**Solution**: Check user_id filter and collection names

**Issue**: LangGraph agent not calling tools  
**Solution**: Verify tool descriptions are clear and model supports function calling

**Issue**: Rate limiting too strict  
**Solution**: Adjust thresholds in rate_limiter.py

---

## 📚 REFERENCE LINKS

### Documentation
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [OpenRouter API](https://openrouter.ai/docs)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Pydantic](https://docs.pydantic.dev/)

### Internal Docs
- `PHASE_2_TASK_BREAKDOWN.md` - Full task list
- `MOLE_IMPLEMENTATION_PLAN_PART2.md` - Original plan
- `LANGCHAIN_RESEARCH_OCT_2025.md` - LangGraph patterns
- `PHASE_1_FINAL_COMPLETION_REPORT.md` - Phase 1 reference

### Code Examples
- Phase 1 Marketing Agent: `functions/src/ai_agent/marketing/`
- Phase 1 Frontend: `frontend/src/components/marketing/`

---

## ✅ DEFINITION OF DONE

### For Each Task
- [ ] Code written and follows project conventions
- [ ] Tests written and passing (>80% coverage)
- [ ] Documentation updated
- [ ] No linting errors
- [ ] No TypeScript errors
- [ ] Peer review completed (if applicable)
- [ ] Task state updated to COMPLETE

### For Each Section (2.1, 2.2, etc.)
- [ ] All tasks in section complete
- [ ] Integration tests passing
- [ ] Documentation complete
- [ ] Code committed and pushed
- [ ] Section review completed

### For Phase 2 Overall
- [ ] All 59 tasks complete
- [ ] All tests passing (>80% coverage)
- [ ] Staging deployment successful
- [ ] UAT completed with positive feedback
- [ ] Production deployment successful
- [ ] Monitoring and alerts configured
- [ ] Completion report written

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- **Response Time**: <2s for simple queries, <5s for complex
- **Error Rate**: <1%
- **Test Coverage**: >80%
- **Uptime**: >99.5%

### Business Metrics
- **Daily Active Users**: >30% of dashboard users
- **Prompts Created via Agent**: >20% of total
- **User Satisfaction**: >4/5 stars
- **Cost per Conversation**: <$0.10

### Quality Metrics
- **Task Completion Rate**: >75%
- **Tool Usage**: >5 tool calls per day
- **Conversation Length**: >3 messages average

---

## 🚀 READY TO START?

1. ✅ Review this guide
2. ✅ Review `PHASE_2_TASK_BREAKDOWN.md`
3. ✅ Create feature branch
4. ✅ Start with Task 2.1.1
5. ✅ Update task state to IN_PROGRESS
6. ✅ Begin implementation!

**Good luck with Phase 2! 🎉**

---

**Document Version**: 1.0  
**Created**: October 17, 2025  
**Next Update**: As needed during implementation

