# 🎯 Sprint 2: End-to-End Flow Validation

**Duration:** 15 coding hours (3-4 days)  
**Goal:** Complete patient-to-doctor consultation flow  
**Outcome:** 3 real consultations with actual users

---

## 🎪 The Startup Pivot: Build to Learn

You're doing this RIGHT. Instead of obsessing over safety tests before validation, you're:
1. Building the FULL flow
2. Testing with REAL users
3. Learning what actually matters

This is the Concierge MVP approach done correctly.

---

## 🎯 Sprint Goal

**Build and validate the complete consultation flow:**

```
Patient Journey:
1. Register/Login ✅ (already working)
2. AI Triage Chat → Get symptoms and info
3. Enter Biometrics → Comprehensive vitals
4. Request Video Consultation
5. Connect with Doctor via Video

Doctor Journey:
1. See patient in queue
2. Review AI Insights
3. Review Chat Transcript
4. Review Biometrics
5. Join Video Call
6. Take Notes During Call
7. Ask AI for insights during consultation
8. Complete consultation
```

---

## ⏱️ 15-Hour Breakdown

### Phase 1: Foundation (3 hours)
- [ ] Fix OpenAI API key (30 min)
- [ ] Add comprehensive biometrics (2 hours)
- [ ] Test AI triage works (30 min)

### Phase 2: Video Integration (4 hours)
- [ ] Choose video platform (Daily.co recommended - easiest)
- [ ] Integrate video on patient side (2 hours)
- [ ] Integrate video on doctor side (2 hours)

### Phase 3: Doctor Dashboard (5 hours)
- [ ] Display AI insights on doctor view (1.5 hours)
- [ ] Display chat transcript (1 hour)
- [ ] Display biometrics in sidebar (1 hour)
- [ ] In-call note-taking (1 hour)
- [ ] Ask AI during consultation (0.5 hour)

### Phase 4: E2E Testing (3 hours)
- [ ] End-to-end flow testing (1 hour)
- [ ] Fix critical bugs (1 hour)
- [ ] Run 3 real consultations (1 hour)

---

## 📋 Detailed Tasks

### Task 1: Fix OpenAI API Key (30 min)
**Priority:** P0 - Blocks everything  
**Estimate:** 30 minutes

**Steps:**
1. Get valid API key from platform.openai.com
2. Update `backend/.env`
3. Restart backend
4. Test with curl:
   ```bash
   curl -X POST http://localhost:3000/api/triage/chat \
     -H "Content-Type: application/json" \
     -d '{"messages": [{"role": "user", "content": "I have a headache"}]}'
   ```

**Acceptance Criteria:**
- [ ] AI responds with appropriate triage question
- [ ] No 401 errors
- [ ] Response time <5 seconds

---

### Task 2: Comprehensive Biometrics Entry (2 hours)
**Priority:** P0 - Needed for doctor review  
**Estimate:** 2 hours

**Current Biometrics:**
- Blood Pressure
- Heart Rate
- Temperature
- Weight
- Blood Oxygen (optional)
- Blood Sugar (optional)

**Add These Key Vitals:**
- Respiratory Rate (breaths/min)
- Height (for BMI calculation)
- Pain Level (1-10 scale with body diagram)
- Allergies (text list)
- Current Medications (text list)
- Medical History (checkboxes: Diabetes, Hypertension, Heart Disease, Asthma, etc.)

**Files to Update:**
- `mobile/src/screens/patient/BiometricEntryScreen.tsx`
- `backend/src/routes/patients.ts` (if needed)

**Acceptance Criteria:**
- [ ] All new fields render properly
- [ ] Validation for each field
- [ ] Data saves to backend
- [ ] Doctor can view all biometrics

---

### Task 3: Video Integration - Choose Platform (15 min)
**Priority:** P0  
**Recommendation:** Daily.co (easiest integration)

**Why Daily.co:**
- Free tier: 10,000 minutes/month
- React Native SDK available
- 1-hour integration time
- No infrastructure management
- Built-in recording

**Alternative:** Twilio Video (more complex, 2-3 hours)

**Action:**
1. Sign up at daily.co
2. Get API key
3. Create test room

---

### Task 4: Video Patient Side (2 hours)
**Priority:** P0  
**Estimate:** 2 hours

**Implementation:**
1. Install Daily React Native SDK
2. Create `VideoCallScreen.tsx`
3. Add "Join Consultation" button after insights
4. Handle video/audio permissions
5. Show doctor when they join

**Files to Create/Update:**
- `mobile/package.json` - Add `@daily-co/react-native-daily-js`
- `mobile/src/screens/patient/VideoCallScreen.tsx` (new)
- `mobile/src/navigation/PatientNavigator.tsx` - Add route

**Basic Implementation:**
```typescript
// VideoCallScreen.tsx
import Daily from '@daily-co/react-native-daily-js';

const VideoCallScreen = () => {
  const callObject = Daily.createCallObject();
  
  useEffect(() => {
    callObject.join({ url: roomUrl });
    return () => callObject.destroy();
  }, []);

  return (
    <View>
      <Daily.View callObject={callObject} />
      <Button onPress={() => callObject.leave()}>End Call</Button>
    </View>
  );
};
```

**Acceptance Criteria:**
- [ ] Patient can join video room
- [ ] Video/audio works
- [ ] Can end call
- [ ] UI shows doctor when they join

---

### Task 5: Video Doctor Side (2 hours)
**Priority:** P0  
**Estimate:** 2 hours

**Implementation:**
1. Add "Start Video Call" button on patient chart
2. Create same video call screen
3. Join same room as patient

**Files to Update:**
- `mobile/src/screens/doctor/DoctorDashboardScreen.tsx`
- `mobile/src/screens/doctor/VideoCallScreen.tsx` (new)

**Acceptance Criteria:**
- [ ] Doctor can join patient's room
- [ ] Both can see/hear each other
- [ ] Call quality is acceptable

---

### Task 6: Display AI Insights (1.5 hours)
**Priority:** P0  
**Estimate:** 1.5 hours

**What to Display:**
- Summary of patient presentation
- Key findings from triage
- Possible conditions (differential diagnosis)
- Recommended questions
- Red flags (if any)

**Files to Update:**
- `mobile/src/screens/doctor/PatientChartScreen.tsx` (new or update)
- Create insights display component

**UI Layout:**
```
+---------------------------+
| Patient: John Doe, 32M    |
|---------------------------|
| 🤖 AI INSIGHTS            |
|                           |
| Summary: Patient presents |
| with sore throat...       |
|                           |
| Key Findings:             |
| • Fever 101.5°F           |
| • Sore throat 7/10        |
|                           |
| Consider:                 |
| • Strep throat (High)     |
| • Viral pharyngitis       |
+---------------------------+
```

**Acceptance Criteria:**
- [ ] Insights display in clean, readable format
- [ ] Can expand/collapse sections
- [ ] Highlights red flags prominently

---

### Task 7: Display Chat Transcript (1 hour)
**Priority:** P1  
**Estimate:** 1 hour

**Display Format:**
```
💬 TRIAGE CONVERSATION

AI: What brings you here today?
Patient: I have a sore throat

AI: How long have you had this?
Patient: About 3 days

AI: On a scale of 1-10, how severe?
Patient: Maybe a 7
```

**Files to Update:**
- `mobile/src/screens/doctor/PatientChartScreen.tsx`

**Acceptance Criteria:**
- [ ] Full conversation visible
- [ ] Timestamps shown
- [ ] Scrollable if long
- [ ] Color-coded (AI vs Patient)

---

### Task 8: Display Biometrics Sidebar (1 hour)
**Priority:** P0  
**Estimate:** 1 hour

**Sidebar During Video Call:**
```
+----------------+
| 📊 VITALS      |
|----------------|
| BP: 145/92 ⚠️  |
| HR: 78 bpm     |
| Temp: 101.5°F  |
| Resp: 18/min   |
| SpO2: 98%      |
|                |
| 💊 MEDS        |
| Lisinopril 10mg|
|                |
| ⚠️ ALLERGIES   |
| Penicillin     |
+----------------+
```

**Files to Update:**
- `mobile/src/screens/doctor/VideoCallScreen.tsx`

**Acceptance Criteria:**
- [ ] Biometrics visible during call
- [ ] Flag abnormal values
- [ ] Collapsible sidebar

---

### Task 9: In-Call Notes (1 hour)
**Priority:** P1  
**Estimate:** 1 hour

**Feature:**
- Text area at bottom of video call
- Save notes to backend
- Auto-save every 30 seconds

**Files to Update:**
- `mobile/src/screens/doctor/VideoCallScreen.tsx`
- `backend/src/routes/consultations.ts` (new)

**Acceptance Criteria:**
- [ ] Can type notes during call
- [ ] Notes auto-save
- [ ] Notes persist after call ends

---

### Task 10: Ask AI During Consultation (30 min)
**Priority:** P2  
**Estimate:** 30 minutes

**Feature:**
Doctor can click "Ask AI" and type:
- "What are common complications of strep throat?"
- "Should I order a throat culture?"

AI responds with clinical guidance.

**Implementation:**
- Add "Ask AI" button
- Modal with input field
- Call backend API
- Display AI response

**Files to Update:**
- `mobile/src/screens/doctor/VideoCallScreen.tsx`
- `backend/src/routes/ai-assist.ts` (new)

**Acceptance Criteria:**
- [ ] Doctor can ask questions
- [ ] AI responds in <5 seconds
- [ ] Responses are clinically relevant

---

### Task 11: End-to-End Flow Test (1 hour)
**Priority:** P0  
**Estimate:** 1 hour

**Test Scenario:**
1. Patient registers
2. Patient completes AI triage
3. Patient enters biometrics
4. Patient requests consultation
5. Doctor sees patient in queue
6. Doctor reviews insights
7. Doctor starts video call
8. Both connect successfully
9. Doctor can see all info during call
10. Doctor takes notes
11. Consultation completes

**Acceptance Criteria:**
- [ ] Complete flow works without errors
- [ ] No crashes
- [ ] Data persists correctly
- [ ] Video quality acceptable

---

### Task 12: Real User Testing (1 hour)
**Priority:** P0  
**Estimate:** 1 hour (3 consultations × 20 min)

**Participants:**
- 3 patients (friends/family with real health questions)
- 1 doctor (medical advisor or physician friend)

**Process:**
1. Brief participants on flow
2. Patient uses app independently
3. Doctor reviews and joins call
4. Observe entire interaction
5. Interview after (5 min each)

**Data to Collect:**
- Completion rate
- Time to complete triage
- Video call quality
- Doctor usefulness rating (1-5)
- Patient satisfaction (1-5)
- Friction points
- Feature requests

**Acceptance Criteria:**
- [ ] 3 successful consultations
- [ ] Feedback documented
- [ ] Top issues identified

---

## 🚀 Implementation Order

**Day 1 (5 hours):**
1. Fix API key (30 min)
2. Add comprehensive biometrics (2 hours)
3. Choose video platform & setup (30 min)
4. Patient video integration (2 hours)

**Day 2 (5 hours):**
5. Doctor video integration (2 hours)
6. Display AI insights (1.5 hours)
7. Display chat transcript (1 hour)
8. Display biometrics sidebar (30 min)

**Day 3 (5 hours):**
9. In-call notes (1 hour)
10. Ask AI feature (30 min)
11. E2E testing (1 hour)
12. Real user testing (1 hour)
13. Document findings (1.5 hours)

---

## 📊 Success Criteria

### Must Have (P0):
- ✅ Patient can complete full flow
- ✅ Doctor can see insights, transcript, biometrics
- ✅ Video call works
- ✅ 3 real consultations completed

### Nice to Have (P1):
- ✅ In-call notes
- ✅ Ask AI during consultation
- ✅ Beautiful UI polish

### Out of Scope:
- ❌ Emergency detection (defer to next sprint)
- ❌ Medical disclaimers (add after validation)
- ❌ Perfect eval scores (focus on working flow)

---

## 🎯 Validation Questions

After 3 consultations, answer:

1. **Patient Experience:**
   - Did triage feel natural? (Yes/No)
   - Was anything confusing? (List)
   - Would use again? (Yes/No)

2. **Doctor Experience:**
   - Were insights useful? (1-5)
   - Did transcript help? (Yes/No)
   - Would use in practice? (Yes/No)

3. **Technical:**
   - Video quality acceptable? (Yes/No)
   - Any crashes or errors? (List)
   - Performance issues? (List)

---

## 🔄 Post-Sprint Decision

**If Successful (all 3 consultations complete, positive feedback):**
→ Sprint 3: Fix safety issues, add disclaimers, improve quality
→ Scale to 20-50 consultations

**If Issues Found:**
→ Iterate on specific friction points
→ Don't add features until core flow works

---

## 📚 Resources

### Video Platform Setup
- Daily.co: https://daily.co
- React Native SDK: https://docs.daily.co/reference/react-native

### Biometrics Reference
- Normal vital signs: https://www.ncbi.nlm.nih.gov/books/NBK553213/
- Clinical ranges for validation

### Testing
- Screen recording: Loom or Zoom
- User interview template: (create Google Doc)

---

## 🎊 Why This Sprint Works

**Startup Founder Perspective:**

Most founders fail because they:
- Build in isolation
- Optimize before validating
- Avoid real user feedback

This sprint forces you to:
- ✅ Get real feedback FAST
- ✅ Validate core value prop
- ✅ Learn what actually matters

**After this sprint, you'll KNOW:**
- Does the flow make sense?
- Do doctors find insights useful?
- Is video quality good enough?
- What to build next?

**This is how you build a successful startup.** 🚀

---

**Sprint Start:** Now  
**Sprint End:** 3-4 days  
**Next Steps:** Based on user feedback
