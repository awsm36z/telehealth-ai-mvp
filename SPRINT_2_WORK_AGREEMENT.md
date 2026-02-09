# SPRINT 2 PROJECT AGREEMENT
## TeleHealth AI - End-to-End Consultation Flow

**Effective Date:** February 10, 2026  
**Sprint Period:** February 10-21, 2026 (2 weeks, 15 hrs/week = 30 hours total)  
**Agreement Type:** Statement of Work (SOW) / Sprint Contract

---

## 1. PARTIES

**CLIENT:**  
[Your Full Name/Company Name]

**CONTRACTOR (Developer):**  
[Developer Name]

**Governing Agreement:**  
This SOW is executed under the main Freelance Developer Agreement dated February 7, 2026 ("Master Agreement"). All terms of Master Agreement apply except where specifically modified below.

---

## 2. SPRINT OBJECTIVE

### 2.1 Goal

**Build and validate the complete patient-to-doctor consultation flow with real users.**

### 2.2 Core Deliverable

Functional end-to-end consultation system where:

1. ✅ **Patient Journey:**
   - Registers/logs in
   - Completes AI triage chat
   - Enters comprehensive biometrics
   - Requests video consultation
   - Connects with doctor via video

2. ✅ **Doctor Journey:**
   - Views patient in queue
   - Reviews AI insights
   - Reviews chat transcript
   - Reviews patient biometrics
   - Joins video call with patient
   - Takes notes during call
   - Complete consultation

### 2.3 Validation

Complete 3 real consultations with actual users (friends, family, or early adopters) and document findings.

---

## 3. DELIVERABLES & SCHEDULE

### 3.1 Phase 1: Foundation (Hours: 0-3, Day 1)

**Deliverable:** OpenAI Integration + Comprehensive Biometrics Working

**Tasks:**
1. Verify/update valid OpenAI API key in `/backend/.env`
2. Test AI triage endpoint functionality
   - POST to `/api/triage/chat` returns appropriate responses
   - Response time <5 seconds
3. Expand BiometricEntryScreen to include:
   - Blood pressure (systolic/diastolic)
   - Heart rate (bpm)
   - Temperature (°F)
   - Weight (lbs)
   - Blood oxygen (SpO2 %)
   - Respiratory rate (breaths/min)
   - Pain level (1-10 scale)
   - Medical history (checkboxes)
4. Backend API stores all biometrics
5. Doctor can view all biometrics in patient view

**Acceptance Criteria:**
- [ ] OpenAI API working with valid key
- [ ] All 8 biometric fields render properly in mobile UI
- [ ] Input validation on all fields (ranges, format)
- [ ] Data persists to backend
- [ ] Doctor dashboard displays all metrics
- [ ] No critical bugs or crashes

**Files Modified:**
- `backend/.env`
- `backend/src/routes/triage.ts` (test)
- `mobile/src/screens/patient/BiometricEntryScreen.tsx`
- `backend/src/routes/patients.ts` (if needed for biometric storage)

**Time Estimate:** 3 hours  
**Deadline:** Monday 6:00 PM (Feb 10)

---

### 3.2 Phase 2: Video Integration (Hours: 3-7, Days 1-2)

**Deliverable:** Video Calling Platform Integrated on Both Patient and Doctor Sides

**Platform:** Daily.co (recommended)
- Free tier: 10,000 min/month
- React Native SDK available
- Built-in recording capability

**Tasks:**

**2A: Setup Daily.co (15 min)**
1. Sign up at daily.co and get API key
2. Create test room configuration
3. Store API credentials in backend `.env`

**2B: Patient Video Integration (2 hours)**
1. Create `mobile/src/screens/patient/VideoCallScreen.tsx`
2. Add "Join Consultation" button on PatientHomeScreen after triage completion
3. Implement Daily.co SDK integration
4. Handle video/audio permissions (iOS + Android)
5. Display doctor when available
6. Allow ending call
7. Basic error handling

**2C: Doctor Video Integration (2 hours)**
1. Create `mobile/src/screens/doctor/VideoCallScreen.tsx`
2. Add "Start Video Call" button on DoctorDashboardScreen
3. Join same room as patient
4. Display patient on video
5. Handle disconnection/errors
6. Same SDK integration as patient side

**Acceptance Criteria:**
- [ ] Daily.co rooms created and accessible
- [ ] Patient can join video room
- [ ] Doctor can join same room
- [ ] Video/audio transmits both directions
- [ ] Both can see/hear each other
- [ ] Can end call properly
- [ ] Video quality acceptable (>720p if possible)
- [ ] No permission dialogs blocking flow
- [ ] Handles poor connectivity gracefully

**Files to Create:**
- `mobile/src/screens/patient/VideoCallScreen.tsx`
- `mobile/src/screens/doctor/VideoCallScreen.tsx`
- `mobile/package.json` (add `@daily-co/react-native-daily-js`)

**Files to Update:**
- `mobile/src/navigation/PatientNavigator.tsx` (add route)
- `mobile/src/navigation/DoctorNavigator.tsx` (add route)
- `backend/.env` (Daily.co credentials)

**Time Estimate:** 4 hours  
**Deadline:** Tuesday 6:00 PM (Feb 11)

---

### 3.3 Phase 3: Doctor Dashboard & Views (Hours: 7-12, Days 2-3)

**Deliverable:** Doctor Can Review Complete Patient Information Before and During Video Call

**Tasks:**

**3A: AI Insights Display (1.5 hours)**
1. Create insights display component showing:
   - Summary of patient presentation
   - Key findings from triage
   - Possible conditions (differential diagnosis with "may indicate" language)
   - Recommended questions for doctor
   - Red flags (if any critical symptoms)
2. Expand/collapse sections for readability
3. Highlight abnormal biometric values
4. Format for readability on mobile

**3B: Chat Transcript Display (1 hour)**
1. Display full triage conversation with timestamp
2. Color-code AI vs. patient messages
3. Preserve formatting and emojis
4. Scrollable if conversation is long
5. Quote triage conversation in clinical context

**3C: Biometrics Sidebar (1 hour)**
1. Persistent sidebar showing vitals during video call:
   - Blood pressure with ⚠️ flag if >140/90
   - Heart rate with emoji status
   - Temperature with clinical interpretation
   - Respiratory rate
   - SpO2 with clinical interpretation
   - Weight
   - Pain level
2. Flag abnormal values clearly
3. Collapsible to show video full-screen
4. Display allergies and current medications
5. Medical history summary

**3D: Patient Information View (1 hour)**
1. Patient demographics card
2. Medical history summary
3. Current medications list
4. Known allergies section
5. Quick access buttons (call patient, send message, etc.)

**Acceptance Criteria:**
- [ ] Insights display is clean and readable
- [ ] All information visible before video call starts
- [ ] Chat transcript shows full conversation
- [ ] Biometrics sidebar visible during call
- [ ] Abnormal values flagged clearly
- [ ] Modal/navigation clear (not confusing)
- [ ] Readable on both portrait and landscape
- [ ] No sensitive data exposed unnecessarily

**Files to Create:**
- `mobile/src/components/InsightsDisplay.tsx`
- `mobile/src/components/ChatTranscript.tsx`
- `mobile/src/components/BiometricsSidebar.tsx`
- `mobile/src/screens/doctor/PatientChartScreen.tsx` (new)

**Files to Update:**
- `mobile/src/screens/doctor/DoctorDashboardScreen.tsx`
- `mobile/src/screens/doctor/VideoCallScreen.tsx`

**Time Estimate:** 4.5 hours  
**Deadline:** Wednesday 6:00 PM (Feb 12)

---

### 3.4 Phase 4: Consultation Features (Hours: 12-14, Day 3)

**Deliverable:** Doctor Can Take Notes and Ask AI During Consultation

**Tasks:**

**4A: In-Call Notes (1 hour)**
1. Add text area at bottom of video call screen
2. Doctor can type consultation notes
3. Auto-save every 30 seconds to backend
4. Notes persist after call ends
5. Notes visible after consultation completes

**4B: Ask AI During Call (30 min)**
1. Add "Ask AI" button/modal in video call
2. Doctor can type clinical question:
   - "What are common complications of strep throat?"
   - "Should I order a throat culture given these symptoms?"
3. Display AI response within modal
4. AI context includes patient data
5. Response latency <5 seconds

**Backend Support:**
- Create `/api/consultations` endpoints:
  - POST create consultation session
  - POST save notes
  - POST ask AI (during consultation)
  - GET retrieve consultation notes

**Acceptance Criteria:**
- [ ] Doctor can type and save notes during call
- [ ] Notes are saved to database
- [ ] Notes persist after call
- [ ] Ask AI button functional
- [ ] AI responses are clinically relevant
- [ ] No latency issues
- [ ] Notes secure and linked to patient

**Files to Create:**
- `backend/src/routes/consultations.ts`
- `mobile/src/components/ConsultationNotes.tsx`
- `mobile/src/components/AskAIModal.tsx`

**Files to Update:**
- `mobile/src/screens/doctor/VideoCallScreen.tsx`

**Time Estimate:** 1.5 hours  
**Deadline:** Thursday 6:00 PM (Feb 13)

---

### 3.5 Phase 5: Testing & Validation (Hours: 14-30, Days 3-4)

**Deliverable:** 3 Successful Real Consultations + Documentation

**Tasks:**

**5A: End-to-End Flow Testing (1 hour)**
1. Complete flow testing without errors:
   - Patient registration
   - AI triage (5+ exchanges)
   - Biometric entry
   - Consultation request
   - Doctor sees patient in queue
   - Doctor reviews all information
   - Video call connection
   - Both see/hear each other
   - Consultation completes
2. Document any bugs found
3. Test on 2+ devices
4. Test on WiFi and mobile network

**5B: Real User Consultations (3 consultations × 20-30 min = 1.5-2 hours)**

**Participant Selection:**
- 3 Patients: Friends/family with real health questions (NOT actors)
- 1 Doctor: Medical advisor, physician friend, or experienced clinician

**Consultation Process:**
1. Brief participants on app flow (5 min)
2. Patient navigates app independently (10 min)
3. Doctor logs in and reviews (5 min)
4. Video consultation (10-15 min)
5. Post-consultation interview (5 min)

**Data to Collect:**
- Completion rate (did they finish?)
- Time to complete triage (mins)
- Video call quality (1-5 scale)
- Patient satisfaction (1-5 scale)
- Doctor usefulness of insights (1-5 scale)
- Friction points (what was confusing?)
- Would use again? (Yes/No)
- Top 3 feature requests

**5C: Documentation (1 hour)**
1. Summarize findings in document:
   - How many consultations completed: X/3
   - Average completion time
   - Video quality feedback
   - Doctor feedback on insights usefulness
   - Patient feedback on experience
   - Top issues/bugs found
   - Top feature requests
   - Recommendation: Ready for more testing? Or iterate first?

**Acceptance Criteria:**
- [ ] All 3 consultations completed successfully
- [ ] No critical crashes during consultations
- [ ] Video quality acceptable
- [ ] Feedback documented
- [ ] Issues/bugs list created
- [ ] Next action items clear

**Deliverables:**
- `SPRINT_2_RESULTS.md` - Comprehensive findings

**Time Estimate:** 10 hours  
**Deadline:** Friday 6:00 PM (Feb 14)

---

## 4. TOTAL HOURS & BUDGET

| Phase | Hours | Notes |
|-------|-------|-------|
| Phase 1: Foundation | 3 | - |
| Phase 2: Video | 4 | - |
| Phase 3: Doctor Dashboard | 4.5 | - |
| Phase 4: Consultation Features | 1.5 | - |
| Phase 5: Testing, Unit Tests, Evals & User Validation | 10 | Must include unit tests and eval suite |
| **TOTAL Estimated** | **23** | Estimated hours (may vary) |
| **Weekly Cap** | **16** | Maximum billable hours per week |
| **Sprint Completion Calc.** | Various | Hours × $25/hr, **capped at $400 max/sprint** |

**Rate:** $25/hour (Early-stage startup rate)  
**Maximum Payment:** $400 per sprint (all-or-nothing)

**CRITICAL: Payment Contingent On:**
1. ✅ ALL sprint tasks 100% complete
2. ✅ Unit tests written and passing (>70% coverage)
3. ✅ Evaluation suite run -passed (no critical failures)
4. ✅ Application successfully runs
5. ✅ All tests and evals passing
6. ✅ Code merged to main
7. ✅ Demo provided
8. ✅ Client approval

**If ANY requirement above is not met: NO PAYMENT issued**

---

## 5. QUALITY STANDARDS

### 5.1 Code Quality

**All Code Must (PAYMENT DEPENDS ON THIS):**
- ✅ Be functional (work for happy path + basic errors)
- ✅ Have clear commit messages
- ✅ Include comments on complex logic
- ✅ Follow TypeScript best practices
- ✅ Have **>70% test coverage for new code (MANDATORY - Required for payment)**
- ✅ Pass linting (ESLint)
- ✅ Be merged to main branch (not just PR)
- ✅ **ALL unit tests must PASS (0 failures)**

### 5.2 Testing Requirements (MANDATORY - PAYMENT CONTINGENT)

**Unit Tests (REQUIRED FOR PAYMENT):**
- New API endpoints: 100% coverage required - **ALL TESTS MUST PASS**
- New React components: >80% coverage required - **ALL TESTS MUST PASS**
- Utilities and helpers: >70% coverage required - **ALL TESTS MUST PASS**
- Any failing test = **NO PAYMENT issued**
- Coverage report: `npm test -- --coverage` (include in submission)

**Evaluation Suite (REQUIRED FOR PAYMENT):**
- Run full healthcare AI eval suite: `npm run eval`
- Emergency detection: **Must pass >90% of tests (no critical failures)**
- Safety compliance: **Must pass >90% of tests**
- Overall eval score: **Must achieve >80% pass rate**
- Any critical failure = **NO PAYMENT issued**
- Include eval-report.json in submission
- Document all results in SPRINT_2_RESULTS.md

**Integration Testing:**
- Full flow tested end-to-end (no critical crashes)
- Video call tested on 2+ devices
- Backend/mobile communication verified
- **Application must run successfully**

**User Testing:**
- 3 real consultations successfully completed
- No critical crashes during consultations
- Feedback from all 3 users documented

### 5.3 Documentation

**Code:**
- README for major features
- Comments on non-obvious logic
- Clear git commit messages

**Testing Results (MUST INCLUDE):**
- Unit test output with coverage %
- Eval report (eval-report.json)
- Any known issues listed with severity

**Results:**
- SPRINT_2_RESULTS.md with detailed findings
- All test outputs included

---

## 6. ACCEPTANCE CRITERIA & PAYMENT

### 6.1 Acceptance Process (ALL-OR-NOTHING)

**Developer Submits to Client:**
1. All code merged to main branch (clean git history)
2. Git commit log with clear messages
3. Demo video (5-10 min) or live demo showing end-to-end flow
4. **Unit test coverage report** (`npm test -- --coverage`)
5. **Evaluation suite results** (eval-report.json from `npm run eval`)
6. **SPRINT_2_RESULTS.md** with all findings
7. Known issues list (if any) with severity levels

**Submission Deadline:** Friday, February 14, 2026 at 6:00 PM

### 6.2 Client Review & Payment Decision (ALL-OR-NOTHING MODEL)

**Client Reviews All Requirements (ALL must be met for payment):**

**Technical Requirements (ALL must pass):**
1. ✅ ALL sprint deliverables 100% complete (nothing partial)
2. ✅ Code merged to main branch
3. ✅ Code quality meets standards (clean, documented, tested)
4. ✅ Unit test coverage >70% minimum
5. ✅ **ALL unit tests PASSING** (0 test failures)
6. ✅ Application runs successfully end-to-end
7. ✅ No critical bugs blocking core functionality

**Testing Requirements (ALL must pass):**
8. ✅ **Evaluation suite executed** (`npm run eval`)
9. ✅ **Emergency detection:** >90% pass rate (critical - no failures)
10. ✅ **Safety compliance:** >90% pass rate
11. ✅ **Overall eval score:** >80% pass rate
12. ✅ **No critical failures** in any eval category

**User Testing Requirements:**
13. ✅ 3 real consultations completed successfully
14. ✅ All user feedback documented
15. ✅ SPRINT_2_RESULTS.md complete with all findings

**PAYMENT DECISION:**

**If ALL 15 requirements above are met:**
- ✅ **APPROVED** → Payment issued immediately
- Amount: Hours worked × $25/hr, **capped at $400 maximum**
- Timeline: Within 5 business days of approval

**If ANY of the following are true:**
- ❌ Sprint deliverables incomplete
- ❌ Unit test coverage below 70%
- ❌ One or more unit tests failing
- ❌ Eval suite not run or critical failures present
- ❌ Emergency detection below 90% pass rate
- ❌ Safety compliance below 90% pass rate
- ❌ Overall eval below 80% pass rate
- ❌ Application crashes or fails to run properly
- ❌ Code not merged or poor quality
- ❌ Fewer than 3 consultations completed
- ❌ Documentation incomplete

**Then: ❌ NO PAYMENT issued**

### 6.3 Remediation Process (If Requirements Not Met)

**If some requirements not met (but not fundamental failures):**
1. Client lists specific issues in writing
2. Developer has **2 business days** to remedy
3. Issues re-tested by Client
4. If fixed: Payment issued upon resubmission
5. If not fixed: No payment, potential termination

**If fundamental failures (too many critical issues):**
- No payment
- Project may be terminated
- Try to resolve via mediation if desired

### 6.4 Payment Terms

**Rate:** $25/hour USD  
**Weekly Cap:** 16 hours maximum per week  
**Sprint Cap:** $400 maximum per sprint  
**Payment Method:** [Bank transfer / PayPal / Developer chooses]  
**Payment Timing:** Within 5 business days of approval (if all requirements met)  

**Example Payments:**
- 16 hours × $25 = $400 (reaches cap)
- 10 hours × $25 = $250 (under cap, paid in full)
- 20 hours × $25 = $500 capped at $400 (hits cap)

**Invoice:** Developer submits timesheet with test coverage % and eval scores

---

## 7. SCOPE & CHANGE CONTROL

### 7.1 Out of Scope (Not Included)

❌ Emergency detection system  
❌ Advanced AI safety guardrails  
❌ HIPAA compliance audit  
❌ FDA medical device registration  
❌ Production deployment/DevOps  
❌ Database optimization or scaling  
❌ Mobile app store submission preparation  

### 7.2 Scope Changes

If requirements change mid-sprint:
1. Impact must be assessed (hours/timeline)
2. Written change request from Client
3. Developer estimates hours needed
4. Parties agree on timeline/budget change
5. Revised SOW signed by both parties

**Example:** If Client requests prescription management during Sprint 2, this would extend timeline and increase hours.

---

## 8. COMMUNICATION & MEETINGS

### 8.1 Synchronous Meetings

**Standup (2x per week, 15 min):**
- Monday 10:00 AM - Sprint planning
- Thursday 10:00 AM - Mid-sprint check-in
- Format: Video call or Slack update
- Developer updates: What done, what next, blockers

**Demo (Friday, 30 min):**
- Friday 5:00 PM - Sprint demo & feedback
- Developer demonstrates working features
- Client provides feedback for next sprint
- Test results discussion

**Optional:** Flexible times, developer preference

### 8.2 Asynchronous Communication

**Primary Channel:** Slack or email  
**Response Time:** Within 24 hours during sprint  
**Code Review:** GitHub PRs with feedback  

### 8.3 Escalation

If blockers occur:
1. Notify Client ASAP (same day)
2. Propose solutions
3. Agree on path forward
4. Document decision

---

## 9. KNOWN RISKS & MITIGATION

### 9.1 Technology Risks

**Risk:** Daily.co integration takes longer than expected  
**Mitigation:** Test integration early, have fallback plan if integration complex

**Risk:** Video quality poor on mobile networks  
**Mitigation:** Test on multiple networks, adjust video settings if needed

**Risk:** OpenAI API rate limits or outages  
**Mitigation:** Implement error handling, use test API mode during development

### 9.2 User Testing Risks

**Risk:** Can't find 3 willing test users  
**Mitigation:** Start recruiting early, use friends/family, offer $50 amazon gift cards

**Risk:** Users experience technical issues blocking feedback  
**Mitigation:** Have backup device, backup video platform, be ready to troubleshoot

---

## 10. SUCCESS CRITERIA

### 10.1 Must Have (Non-negotiable)
- ✅ Patient can complete full flow without crashing
- ✅ Doctor can see insights, transcript, biometrics
- ✅ Video call works (both directions)
- ✅ 3 real consultations completed with feedback

### 10.2 Nice to Have
- ✅ Beautiful UI polish
- ✅ Smooth user experience
- ✅ Fast loading times
- ✅ Consultation notes working perfectly

### 10.3 Post-Sprint Decision

**If Successful → Next Steps:**
1. Sprint 3: Implement safety guardrails, disclaimers
2. Expand to 20-50 consultations
3. Iterate based on feedback

**If Issues Found → Next Steps:**
1. Iterate on specific friction points
2. Don't add features until core flow solid
3. Potentially extend testing window

---

## 11. SIGNATURES

**This is a legal agreement for specifically defined work. Both parties should understand all terms.**

---

### CLIENT SIGNATURE

**Company/Individual Name (Print):**  
_________________________________

**Signature:**  
_________________________________

**Date:**  
_________________________________

**Email:**  
_________________________________

---

### CONTRACTOR SIGNATURE

**Full Name (Print):**  
_________________________________

**Signature:**  
_________________________________

**Date:**  
_________________________________

**Email:**  
_________________________________

---

## APPENDIX A: DETAILED TASK CHECKLIST

### Phase 1: Foundation Checklist
- [ ] Valid OpenAI API key obtained (starts with sk-)
- [ ] Backend `.env` updated with correct key
- [ ] `/api/triage/chat` endpoint tested working
- [ ] BiometricEntryScreen UI updated with all 8 fields
- [ ] Input validation on all biometric fields
- [ ] Backend stores all biometrics
- [ ] Doctor view displays all metrics
- [ ] No crashes on biometric entry
- [ ] Ready for Phase 2 start

### Phase 2: Video Integration Checklist
- [ ] Daily.co account created
- [ ] Daily.co credentials in backend `.env`
- [ ] Test room successfully created
- [ ] `VideoCallScreen.tsx` created (patient)
- [ ] `VideoCallScreen.tsx` created (doctor)
- [ ] Video/audio permissions requested properly
- [ ] Patient can join room
- [ ] Doctor can join same room
- [ ] Both can see/hear each other
- [ ] Video quality acceptable
- [ ] Graceful error handling
- [ ] Ready for Phase 3 start

### Phase 3: Doctor Dashboard Checklist
- [ ] InsightsDisplay component renders correctly
- [ ] Chat transcript shows full conversation
- [ ] BiometricsSidebar displays all vitals
- [ ] Abnormal values flagged (color/icon)
- [ ] Patient information card complete
- [ ] Allergies/medications displayed
- [ ] Medical history summary shown
- [ ] All readable in portrait + landscape
- [ ] Sidebar collapsible for full video view
- [ ] Ready for Phase 4 start

### Phase 4: Consultation Features Checklist
- [ ] Notes auto-save to backend
- [ ] Notes persist after call
- [ ] Ask AI button implemented
- [ ] AI responses relevant and fast (<5s)
- [ ] AI has patient context
- [ ] No crashes with Ask AI feature
- [ ] Ready for Phase 5 start

### Phase 5: Testing & Validation Checklist
- [ ] End-to-end flow tested (no critical bugs)
- [ ] Tested on 2+ devices
- [ ] Tested on WiFi and mobile network
- [ ] 3 real user consultations completed
- [ ] Feedback documented
- [ ] Issues list created
- [ ] SPRINT_2_RESULTS.md written
- [ ] Ready for submission

---

## APPENDIX B: SUBMISSION FORMAT

**Developer submits deliverables as follows:**

### 1. Code
```
✅ GitHub PR or main branch commits
✅ Clear commit messages
✅ Ready-to-merge state
```

### 2. Demo Video
```
Loom recording or similar showing:
- Patient registration → triage → biometrics
- Doctor dashboard review
- Video call working
- Notes/Ask AI features
- At least one user testing session (if recordable)
Duration: 5-10 minutes
```

### 3. Testing Results
```
File: SPRINT_2_RESULTS.md
Sections:
  - 3 consultations completed ✅
  - Feedback summary from each
  - Issues found (if any)
  - Bugs list
  - Feature requests
  - Recommendation for next sprint
```

### 4. Time Log
```
If requested by Client:
- Hourly breakdown by day
- What was accomplished each day
- Any overtime or blockers
```

### 5. Known Issues (if any)
```
- Issue description
- Impact (low/medium/high)
- Workaround (if available)
- When to address (now/later)
```

---

**Document Version:** 1.0  
**Status:** Ready for Signature  
**Created:** February 7, 2026  
**Sprint Start:** February 10, 2026  
**Sprint End:** February 14, 2026
