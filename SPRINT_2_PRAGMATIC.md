# 🚀 Sprint 2: End-to-End Flow - Pragmatic 15-Hour Plan

**Duration:** 15 coding hours (3 days)
**Goal:** Complete patient-to-doctor consultation flow with real user validation
**Outcome:** 3 successful consultations with actual users

---

## 🎯 Core Features to Build

### Patient Journey
1. ✅ Register/Login (already working)
2. **AI Triage Chat** → Patient describes symptoms to AI
3. **Enter Biometrics** → Comprehensive manual entry of vitals
4. **Request Consultation** → Join video call with doctor

### Doctor Journey
1. **See Patient in Queue** → View waiting patients
2. **Review Patient Data:**
   - 🤖 **AI Insights** - Summary, key findings, possible conditions, red flags
   - 💬 **Full Chat Transcript** - Complete patient-AI triage conversation
   - 📊 **Biometrics** - All vital signs and medical history
3. **Join Video Call** → Connect with patient via video
4. **During Call:**
   - View all patient data in sidebar
   - Take notes (optional for v1)
   - Ask AI questions (optional for v1)
5. **Complete Consultation**

---

## 📋 Sprint Tasks with GitHub Links

### **Day 1: Foundation & Video (5 hours)**

#### 1. Fix OpenAI API Key (30 min) - **BLOCKING**
- **Issue:** [#10 - Fix OpenAI API Key Configuration](https://github.com/awsm36z/telehealth-ai-mvp/issues/10)
- **Priority:** P0 - Must complete first
- Get valid API key from platform.openai.com (starts with `sk-`)
- Update `backend/.env`
- Test AI triage works

#### 2. Add Comprehensive Biometrics (1.5 hours)
- **Issue:** [#11 - Add Comprehensive Biometrics Entry](https://github.com/awsm36z/telehealth-ai-mvp/issues/11)
- **Priority:** P0
- Add essential vitals to biometric entry form:
  - ✅ Existing: Blood Pressure, Heart Rate, Temperature, Blood Oxygen, Blood Sugar
  - ➕ **Add:** Height (cm), Weight (kg), Respiratory Rate (breaths/min), Pain Level (1-10)
- All manually entered by patient (no device readings)
- Update `mobile/src/screens/patient/BiometricEntryScreen.tsx`

#### 3. Video Platform Setup (30 min)
- **Issue:** [#12 - Choose and Setup Video Platform (Daily.co)](https://github.com/awsm36z/telehealth-ai-mvp/issues/12)
- **Priority:** P0
- Sign up at daily.co (free tier: 10,000 min/month)
- Get API key
- Create test room
- **Recommendation:** Use Daily.co prebuilt UI for faster integration

#### 4. Patient Video Integration (1.5 hours)
- **Issue:** [#13 - Integrate Video on Patient Side](https://github.com/awsm36z/telehealth-ai-mvp/issues/13)
- **Priority:** P0
- Install react-native-webview
- Create VideoCallScreen using Daily.co iframe
- Add "Join Consultation" button after triage
- Handle permissions

#### 5. Doctor Video Integration (1 hour)
- **Issue:** [#14 - Integrate Video on Doctor Side](https://github.com/awsm36z/telehealth-ai-mvp/issues/14)
- **Priority:** P0
- Add "Start Video Call" button on patient view
- Join same Daily.co room as patient
- Both can see/hear each other

---

### **Day 2: Doctor Dashboard (5 hours)**

#### 6. Display AI Insights on Doctor View (1.5 hours)
- **Issue:** [#15 - Display AI Insights on Doctor Dashboard](https://github.com/awsm36z/telehealth-ai-mvp/issues/15)
- **Priority:** P0
- **What Doctor Sees:**
  - Summary of patient presentation
  - Key findings from triage
  - Possible conditions (differential diagnosis)
  - Recommended questions
  - Red flags (if any)
- Create `PatientChartScreen.tsx` or update existing
- Clean, collapsible UI layout

#### 7. Display Full Chat Transcript (1 hour)
- **Issue:** [#16 - Display Chat Transcript on Doctor View](https://github.com/awsm36z/telehealth-ai-mvp/issues/16)
- **Priority:** P1
- **What Doctor Sees:**
  - Complete patient-AI triage conversation
  - Color-coded messages (AI vs Patient)
  - Timestamps
  - Scrollable format
- Display below AI insights on patient chart

#### 8. Display Biometrics in Sidebar (1 hour)
- **Issue:** [#17 - Display Biometrics Sidebar During Video Call](https://github.com/awsm36z/telehealth-ai-mvp/issues/17)
- **Priority:** P0
- **What Doctor Sees During Video Call:**
  - All vital signs (BP, HR, Temp, SpO2, Respiratory Rate, etc.)
  - Height, Weight, BMI (auto-calculated)
  - Pain level
  - Medications
  - Allergies
  - Medical history
- Flag abnormal values with ⚠️
- Collapsible sidebar

#### 9. Room Coordination Backend (1.5 hours)
- **New Task** (not in original issues)
- Create backend API to manage video rooms
- Store patient-doctor room mapping
- Endpoints:
  - `POST /api/consultations/create-room` - Patient creates room
  - `GET /api/consultations/:patientId/room` - Doctor gets room URL
  - `POST /api/consultations/:id/complete` - Mark consultation complete

---

### **Day 3: Testing & Validation (5 hours)**

#### 10. End-to-End Flow Testing (2 hours)
- **Issue:** [#20 - End-to-End Flow Testing](https://github.com/awsm36z/telehealth-ai-mvp/issues/20)
- **Priority:** P0
- **Test Complete Flow:**
  1. Patient registers/logs in
  2. Patient completes AI triage (asks symptoms)
  3. Patient enters comprehensive biometrics
  4. Patient requests consultation (creates video room)
  5. Doctor sees patient in queue
  6. Doctor reviews: AI insights + chat transcript + biometrics
  7. Doctor starts video call (joins patient's room)
  8. Both connect successfully
  9. Doctor can see all patient data during call
  10. Consultation completes
- **Acceptance:** No crashes, data persists, video works

#### 11. Bug Fixes (2 hours)
- **Buffer Time**
- Fix any issues found during E2E testing
- Common issues to watch for:
  - Video connection failures
  - State sync between patient/doctor
  - Data not loading on doctor side
  - Permissions issues

#### 12. Real User Testing (1 hour)
- **Issue:** [#21 - Real User Testing - 3 Consultations](https://github.com/awsm36z/telehealth-ai-mvp/issues/21)
- **Priority:** P0
- **Participants:**
  - 3 patients (friends/family with health questions)
  - 1 doctor (medical advisor or physician)
- **Process:**
  1. Brief participants (5 min)
  2. Patient uses app independently
  3. Doctor reviews and joins call
  4. Observe interaction (15 min each)
  5. Interview feedback (5 min each)
- **Data to Collect:**
  - Completion rate
  - Video quality rating
  - Doctor found insights useful? (1-5)
  - Patient satisfaction (1-5)
  - Friction points
  - Must-have features

---

## 📦 Out of Scope for V1 (Add Later)

These are **optional** and can be added in v1.1 after user validation:

- ❌ [#18 - In-Call Note-Taking](https://github.com/awsm36z/telehealth-ai-mvp/issues/18) (P1) - Add in v1.1
- ❌ [#19 - Ask AI During Consultation](https://github.com/awsm36z/telehealth-ai-mvp/issues/19) (P2) - Add in v1.1
- ❌ Advanced biometrics (device integration)
- ❌ Emergency detection improvements
- ❌ Medical disclaimers (add after validation)

**Why skip these?** Focus on validating core flow first. If users love it, add these features. If they don't, you'll know what to fix first.

---

## 🎯 Success Criteria

### Must Have (P0):
- ✅ Patient can complete full flow: triage → biometrics → video
- ✅ Doctor can see: AI insights + chat transcript + biometrics
- ✅ Video call works (acceptable quality)
- ✅ 3 successful real consultations completed

### Nice to Have (P1):
- ✅ Clean, intuitive UI
- ✅ No crashes during testing
- ✅ Data persists correctly

### Out of Scope:
- ❌ Perfect eval scores (focus on working flow)
- ❌ Emergency detection (defer to next sprint)
- ❌ HIPAA compliance (PoC only)

---

## 📊 Validation Questions

After 3 consultations, answer these:

### 1. Patient Experience
- Did triage feel natural? (Yes/No)
- Was anything confusing? (List)
- Would you use this again? (Yes/No)
- Most frustrating part?

### 2. Doctor Experience
- Were AI insights useful? (1-5)
- Did chat transcript help? (Yes/No)
- Were biometrics sufficient? (Yes/No)
- Would you use this in practice? (Yes/No)
- What's missing?

### 3. Technical
- Video quality acceptable? (Yes/No)
- Any crashes or errors? (List)
- Performance issues? (List)

---

## 🔄 Post-Sprint Decision Tree

```
Did 3 consultations complete successfully?
├─ YES → Both patient & doctor liked it?
│  ├─ YES ✅ → Sprint 3: Add safety features, scale to 20-50 users
│  └─ NO ⚠️  → Iterate on specific friction points
└─ NO ❌ → Fix blocking issues before proceeding
```

---

## 🛠️ Technical Implementation Notes

### Video Integration (Fastest Approach)
Use Daily.co prebuilt UI via WebView instead of native SDK:

```typescript
// Patient creates room
const response = await fetch('https://api.daily.co/v1/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${DAILY_API_KEY}`
  },
  body: JSON.stringify({ name: `consultation-${patientId}` })
});
const { url } = await response.json();

// Both patient and doctor join via WebView
<WebView
  source={{ uri: url }}
  mediaPlaybackRequiresUserAction={false}
  allowsInlineMediaPlayback
/>
```

**Why this approach?**
- ✅ No native SDK integration (saves 2-3 hours)
- ✅ Works immediately on iOS/Android
- ✅ No permission issues
- ✅ Built-in UI (no custom video layout needed)

### Data Flow Architecture

```
Patient Side:
  Triage Chat → Store messages locally
  AI Insights → Generate after chat
  Biometrics → Submit to backend
  Create Room → POST /api/consultations/create-room

Backend:
  Store: messages, insights, biometrics, room URL
  Link: patientId → consultation → roomUrl

Doctor Side:
  Fetch: GET /api/patients/:id
  Returns: {
    insights: {...},
    chatTranscript: [...],
    biometrics: {...},
    roomUrl: "https://..."
  }
```

---

## ⏱️ Hour-by-Hour Breakdown

### Day 1 (5 hours)
- 0:00-0:30 → Fix API key, test AI triage
- 0:30-2:00 → Add biometrics fields (height, weight, respiratory rate, pain level)
- 2:00-2:30 → Daily.co signup, test room
- 2:30-4:00 → Patient video (WebView implementation)
- 4:00-5:00 → Doctor video (join same room)

### Day 2 (5 hours)
- 0:00-1:30 → Display AI insights on doctor view
- 1:30-2:30 → Display chat transcript
- 2:30-3:30 → Display biometrics sidebar
- 3:30-5:00 → Backend room coordination API

### Day 3 (5 hours)
- 0:00-2:00 → End-to-end testing (find and document bugs)
- 2:00-4:00 → Fix critical bugs
- 4:00-5:00 → Real user testing (3 consultations)

---

## 📚 Key Files to Modify

### Patient Side
- `mobile/src/screens/patient/BiometricEntryScreen.tsx` - Add fields
- `mobile/src/screens/patient/VideoCallScreen.tsx` - NEW: Video call
- `mobile/src/navigation/PatientNavigator.tsx` - Add video route

### Doctor Side
- `mobile/src/screens/doctor/PatientChartScreen.tsx` - NEW: Insights + transcript + biometrics
- `mobile/src/screens/doctor/VideoCallScreen.tsx` - NEW: Video with sidebar
- `mobile/src/screens/doctor/DoctorDashboardScreen.tsx` - Link to patient chart

### Backend
- `backend/src/routes/consultations.ts` - NEW: Room management
- `backend/src/routes/patients.ts` - Return full patient data for doctor
- `backend/src/routes/triage.ts` - Already exists (fix API key)

---

## 🚀 Getting Started

### Pre-Sprint Checklist
- [ ] Get valid OpenAI API key (starts with `sk-`)
- [ ] Sign up for Daily.co account
- [ ] Test Daily.co iframe works in Expo WebView (15 min test)
- [ ] Clear calendar for 3 focused days
- [ ] Line up 3 test participants (patients + doctor)

### Start Here
1. **Issue #10** - Fix API key (BLOCKING all AI features)
2. **Issue #12** - Setup Daily.co (BLOCKING video features)
3. Then proceed with other issues in order

---

## 🎊 Why This Plan Works

### Startup MVP Best Practices
- ✅ **Build for learning, not perfection** - Focus on validating core value prop
- ✅ **Real users ASAP** - 3 consultations teach more than 100 hours of coding
- ✅ **Scope ruthlessly** - V1 has minimum features to test hypothesis
- ✅ **Technical shortcuts OK** - Prebuilt video UI, simple backend, manual data entry
- ✅ **Measure what matters** - User satisfaction > code quality at this stage

### What You'll Learn
After this sprint, you'll KNOW:
- Does the patient-to-doctor flow make sense?
- Do doctors find AI insights actually useful?
- Is video quality good enough for medical consultations?
- What features are must-haves vs nice-to-haves?
- Should you keep building this or pivot?

**This is how successful startups validate ideas.** 🚀

---

## 📌 Quick Links

### GitHub Issues (Sprint 2)
- [#10 - Fix OpenAI API Key](https://github.com/awsm36z/telehealth-ai-mvp/issues/10) - P0 (30 min)
- [#11 - Add Comprehensive Biometrics](https://github.com/awsm36z/telehealth-ai-mvp/issues/11) - P0 (1.5 hours)
- [#12 - Setup Video Platform](https://github.com/awsm36z/telehealth-ai-mvp/issues/12) - P0 (30 min)
- [#13 - Patient Video Integration](https://github.com/awsm36z/telehealth-ai-mvp/issues/13) - P0 (1.5 hours)
- [#14 - Doctor Video Integration](https://github.com/awsm36z/telehealth-ai-mvp/issues/14) - P0 (1 hour)
- [#15 - Display AI Insights](https://github.com/awsm36z/telehealth-ai-mvp/issues/15) - P0 (1.5 hours)
- [#16 - Display Chat Transcript](https://github.com/awsm36z/telehealth-ai-mvp/issues/16) - P1 (1 hour)
- [#17 - Display Biometrics Sidebar](https://github.com/awsm36z/telehealth-ai-mvp/issues/17) - P0 (1 hour)
- [#20 - End-to-End Testing](https://github.com/awsm36z/telehealth-ai-mvp/issues/20) - P0 (2 hours)
- [#21 - Real User Testing](https://github.com/awsm36z/telehealth-ai-mvp/issues/21) - P0 (1 hour)

### Optional (v1.1)
- [#18 - In-Call Note-Taking](https://github.com/awsm36z/telehealth-ai-mvp/issues/18) - P1
- [#19 - Ask AI During Consultation](https://github.com/awsm36z/telehealth-ai-mvp/issues/19) - P2

### Repository
- [GitHub Repo](https://github.com/awsm36z/telehealth-ai-mvp)
- [Sprint 1 Issues](https://github.com/awsm36z/telehealth-ai-mvp/issues?q=is%3Aissue+label%3Asprint-1)
- [Sprint 2 Issues](https://github.com/awsm36z/telehealth-ai-mvp/issues?q=is%3Aissue+label%3Asprint-2)

---

**Sprint Start:** Now
**Sprint End:** 3 days (15 coding hours)
**Next Steps:** User feedback determines Sprint 3

**Let's build this! 🚀**
