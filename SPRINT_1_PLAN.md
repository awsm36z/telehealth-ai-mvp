# 🎯 Sprint 1: Safety First + User Validation

**Duration:** 2 weeks (Feb 8 - Feb 21, 2026)  
**Goal:** Make app safe for users + Validate core value proposition  
**GitHub Milestone:** [Sprint 1](https://github.com/awsm36z/telehealth-ai-mvp/milestone/1)

---

## 📊 Current State Assessment

### What We've Built ✅
- Complete React Native mobile app (10+ screens)
- Node.js/Express backend with TypeScript
- OpenAI GPT-4 integration architecture
- JWT authentication
- Professional UI/UX
- Comprehensive evaluation framework
- GitHub repository with proper documentation

### Critical Issues 🚨

| Issue | Severity | Impact | Status |
|-------|----------|--------|--------|
| Invalid OpenAI API Key | P0 | Blocks all AI features | [#1](https://github.com/awsm36z/telehealth-ai-mvp/issues/1) |
| Emergency Detection: 0% | P0 | Patient safety risk | [#2](https://github.com/awsm36z/telehealth-ai-mvp/issues/2) |
| Missing Disclaimers | P0 | Legal/compliance risk | [#3](https://github.com/awsm36z/telehealth-ai-mvp/issues/3) |
| No User Validation | P0 | Market risk | [#5](https://github.com/awsm36z/telehealth-ai-mvp/issues/5) |

### Eval Results
- **Overall Pass Rate:** 22% (4/18 tests)
- **Emergency Detection:** 0% ❌
- **Safety Compliance:** 68/100 ⚠️
- **Triage Quality:** 55/100 ⚠️
- **Empathy:** 65/100 ⚠️
- **Insights:** 50/100 ❌

---

## 🎯 Sprint Goals

### Primary Goal
**Make the app safe and validate it works with real users**

### Success Criteria
- ✅ Emergency detection: 100% pass rate
- ✅ Safety compliance: >90% pass rate
- ✅ Overall eval score: >80%
- ✅ 10 patient consultations completed
- ✅ 3 doctors provide feedback
- ✅ Qualitative insights documented

---

## 📋 Sprint Backlog

### Week 1: Fix Critical Safety Issues

#### Day 1-2: API Key & Emergency Detection
- [ ] **#1: Fix OpenAI API Key** (30 min) - P0
  - Get valid key from platform.openai.com
  - Update backend/.env
  - Test and verify
  
- [ ] **#2: Fix Emergency Detection** (2-3 hours) - P0
  - Update triage system prompt
  - Add emergency keywords
  - Test all 3 emergency scenarios
  - Achieve 100% pass rate

#### Day 3-4: Safety & Compliance
- [ ] **#3: Add Medical Disclaimers** (3-4 hours) - P0
  - Add disclaimers to all AI responses
  - Update UI to display disclaimers
  - Test safety scenarios
  - Achieve >90% safety score

#### Day 5: Quality Improvements
- [ ] **#4: Improve Triage (OPQRST)** (4-5 hours) - P1
  - Implement OPQRST framework
  - Test triage quality scenarios
  - Achieve >80% triage score

- [ ] **#6: Improve Empathy** (2-3 hours) - P1
  - Add empathetic language
  - Test empathy scenarios
  - Achieve >75% empathy score

### Week 2: User Validation

#### Day 6-7: Prepare for User Testing
- [ ] Recruit 10 patients (friends/family + incentivized testers)
- [ ] Recruit 3 doctors
- [ ] Prepare interview questions
- [ ] Set up screen recording

#### Day 8-12: Conduct User Tests
- [ ] **#5: User Testing** (20-30 hours) - P0
  - Run 10 patient consultations
  - Interview each participant
  - Get 3 doctor reviews
  - Document all feedback

#### Day 13-14: Analysis & Iteration
- [ ] Analyze user feedback
- [ ] Identify top 3 friction points
- [ ] Identify top 3 strengths
- [ ] Prioritize changes for next sprint
- [ ] Present findings

### Nice-to-Have (If Time Permits)
- [ ] **#7: Improve Insights** (3-4 hours) - P1
- [ ] **#8: Add Analytics** (4-6 hours) - P2
- [ ] **#9: Add Error Monitoring** (2-3 hours) - P2

---

## 🎪 The Startup Founder's Perspective

### Why This Sprint Matters

You've fallen into the **"Build Trap"** that kills 90% of startups:
- ✅ Great tech execution
- ❌ Zero market validation

This sprint course-corrects by:
1. **Fixing safety issues** - Can't test with users if app is unsafe
2. **Getting real feedback** - Learn what actually matters to users
3. **Measuring what matters** - Completion rate, satisfaction, usefulness

### The Pivot to Concierge MVP

Instead of building more features, we're testing the **core hypothesis**:

> "Do AI-generated triage insights help doctors provide better telehealth consultations?"

**If YES:** 
- Users complete triage
- Doctors find insights useful
- Both want to use it again

→ **Build more features**

**If NO:**
- Low completion rate
- Doctors ignore insights
- Friction points everywhere

→ **Pivot or iterate**

### What Good Looks Like

**By end of Sprint 1:**
- ✅ All eval tests passing >80%
- ✅ 10 documented user consultations
- ✅ Clear data on what works/doesn't
- ✅ Roadmap for next sprint based on learnings

**Red Flags to Watch:**
- 🚩 <50% triage completion rate → Questions too complex
- 🚩 Doctors don't read insights → Not useful/too long
- 🚩 Patients confused by AI → UX issues
- 🚩 Technical failures → Infrastructure problems

---

## 📊 Metrics to Track

### Quantitative
- **Triage Completion Rate:** % who finish after starting (target: >75%)
- **Average Triage Duration:** Minutes to complete (target: <10 min)
- **Eval Pass Rate:** Overall test score (target: >80%)
- **Doctor Usefulness Rating:** 1-5 scale (target: >3.5)
- **Patient Satisfaction:** 1-5 scale (target: >3.5)

### Qualitative
- Top 3 friction points
- Top 3 strengths
- Feature requests
- Confusion points
- Emotional reactions

---

## 🔄 Daily Standup Format

**What did you do yesterday?**
**What will you do today?**
**Any blockers?**

Focus on:
- Eval test results
- User testing progress
- Blockers to user validation

---

## 🎬 Definition of Done

### For Each Issue
- [ ] Code implemented
- [ ] Eval tests passing
- [ ] Manually tested
- [ ] Committed to GitHub
- [ ] Issue closed

### For Sprint
- [ ] All P0 issues closed
- [ ] Eval score >80%
- [ ] 10 user consultations completed
- [ ] Feedback documented
- [ ] Sprint retrospective conducted
- [ ] Next sprint planned

---

## 🚀 Next Sprint Preview (Tentative)

Based on user feedback, Sprint 2 will likely focus on:
- Fixing top 3 user friction points
- Improving features users loved
- Adding 1-2 most requested features
- Getting to 50 total consultations

But we **won't plan Sprint 2 until Sprint 1 learnings** are analyzed.

---

## 📚 Resources

### Documentation
- [PRD](Telehealth_App_PoC_PRD.md) - Original requirements
- [Revised PRD](Telehealth_PoC_REVISED_PRD.md) - Concierge MVP approach
- [Eval Findings](EVAL_FINDINGS.md) - Detailed test results
- [Running Status](RUNNING_STATUS.md) - Current system state

### Testing
- Run evals: `cd evals && npm run eval`
- Backend: `cd backend && npm run dev`
- Mobile: `cd mobile && npx expo start`

### GitHub
- [Issues](https://github.com/awsm36z/telehealth-ai-mvp/issues)
- [Milestone](https://github.com/awsm36z/telehealth-ai-mvp/milestone/1)
- [Repository](https://github.com/awsm36z/telehealth-ai-mvp)

---

## 🎯 The Bottom Line

**As a VC/founder, here's what I care about:**

1. **Can you ship fast?** → This sprint tests that
2. **Do users want this?** → User testing answers this
3. **Is it safe?** → Eval framework ensures this
4. **Can you iterate?** → Data-driven decisions prove this

**This sprint is make-or-break:**
- If it goes well → You have a validated MVP worth investing in
- If it doesn't → You learn fast and pivot before wasting more time

**Let's prove this works.** 🚀

---

**Sprint Start:** Feb 8, 2026  
**Sprint Review:** Feb 21, 2026  
**Sprint Retrospective:** Feb 21, 2026
