# Product Requirements Document: AI-Powered Telehealth PoC

## Document Control
- **Version:** 1.0 PoC
- **Date:** February 5, 2026
- **Status:** Draft - Proof of Concept
- **Owner:** Product Team
- **Timeline:** 8-12 weeks to MVP

---

## Executive Summary

### Purpose
This PRD defines a Proof of Concept (PoC) for an AI-powered telehealth application that validates the core value proposition: **LLM-driven patient triage combined with AI-generated clinical insights to improve remote healthcare consultations.**

### PoC Goals
1. **Validate** that LLM-based triage can effectively gather patient health information
2. **Test** whether AI-generated insights are useful to doctors during consultations
3. **Prove** the technical feasibility of integrating LLM analysis with video consultations
4. **Learn** user behavior and preferences with minimal feature set
5. **Iterate** quickly based on real user feedback

### What's In Scope (PoC)
- ✅ Manual biometric data entry
- ✅ LLM-powered intelligent triage questions
- ✅ Patient history storage
- ✅ AI-generated health insights for doctors
- ✅ Patient view of their insights
- ✅ Video consultation initiation
- ✅ Basic user authentication

### What's Out of Scope (PoC)
- ❌ Bluetooth device connectivity
- ❌ Prescription management
- ❌ Real-time transcription
- ❌ Medication database searches
- ❌ Follow-up messaging
- ❌ Appointment scheduling system
- ❌ Payment processing
- ❌ EHR integration

### Success Criteria
- 50+ patient users complete triage flow
- 10+ doctors use the platform for consultations
- 70%+ doctors find AI insights "useful" or "very useful"
- 80%+ triage completion rate
- Collect qualitative feedback for full product development

---

## Product Overview

### Problem Statement
Traditional telehealth consultations lack structured data collection and clinical decision support, leading to:
- Incomplete patient histories
- Time wasted gathering basic information during video calls
- Doctors making decisions with limited context
- Inconsistent quality of remote care

### PoC Solution
A streamlined mobile/web app that:
1. **Guides patients** through intelligent triage questions using LLM
2. **Collects** symptoms and biometric data in a structured format
3. **Generates** AI-powered health insights for doctor review
4. **Enables** informed video consultations with rich patient context

### Key Innovation
Using LLM to conduct **dynamic, conversational triage** that adapts questions based on patient responses—mimicking how a skilled triage nurse would interview a patient.

---

## User Personas (PoC Focus)

### Primary Persona: Early Adopter Patient
- **Name:** Alex, 32
- **Profile:** Tech-savvy, comfortable with apps, has non-emergency health concern
- **Goal:** Get quick medical advice without in-person visit
- **Motivation:** Willing to try new healthcare technology

### Primary Persona: Tech-Forward Doctor
- **Name:** Dr. Kim, 38
- **Profile:** Open to technology, interested in telehealth innovation
- **Goal:** Provide quality remote care efficiently
- **Motivation:** Curious about AI-assisted clinical decision support

---

## Functional Requirements

### 1. User Authentication

#### 1.1 Patient Registration
- **FR-1.1.1:** System shall allow patients to create accounts with email and password
- **FR-1.1.2:** System shall send email verification link
- **FR-1.1.3:** System shall collect basic information:
  - Full name
  - Date of birth
  - Gender
  - Email
  - Phone number (optional)

#### 1.2 Doctor Registration
- **FR-1.2.1:** System shall allow doctors to create accounts with email and password
- **FR-1.2.2:** System shall collect doctor information:
  - Full name
  - Medical license number
  - Specialization
  - Email
- **FR-1.2.3:** System shall mark doctor accounts for manual verification (admin approval)

#### 1.3 Authentication
- **FR-1.3.1:** System shall support email/password login
- **FR-1.3.2:** System shall implement password reset via email
- **FR-1.3.3:** System shall maintain login sessions for 7 days

---

### 2. Patient Profile & Medical History

#### 2.1 Medical Profile Setup
- **FR-2.1.1:** System shall prompt patients to complete one-time medical history during first login:
  - Current medical conditions (free text)
  - Current medications (free text)
  - Known allergies (free text)
  - Pregnancy status (Yes/No/Prefer not to say)
  - Recent surgeries (free text, optional)

#### 2.2 Profile Management
- **FR-2.2.1:** System shall allow patients to view and edit their medical profile
- **FR-2.2.2:** System shall timestamp all profile changes
- **FR-2.2.3:** System shall maintain history of profile changes

---

### 3. Manual Biometric Entry

#### 3.1 Biometric Data Input
- **FR-3.1.1:** System shall provide form for patients to manually enter biometrics:
  - **Blood Pressure:** Systolic and Diastolic (mmHg)
  - **Heart Rate:** Beats per minute (BPM)
  - **Temperature:** Degrees (°F or °C with unit selector)
  - **Weight:** Pounds or Kilograms (with unit selector)
  - **Blood Oxygen:** SpO2 percentage (optional)
  - **Blood Sugar:** mg/dL or mmol/L (optional, with meal context)

- **FR-3.1.2:** System shall validate data ranges:
  - Blood Pressure: 60-250 mmHg
  - Heart Rate: 30-200 BPM
  - Temperature: 90-110°F (32-43°C)
  - Weight: 20-500 lbs (10-227 kg)
  - Blood Oxygen: 70-100%
  - Blood Sugar: 20-600 mg/dL

- **FR-3.1.3:** System shall allow patients to skip optional fields
- **FR-3.1.4:** System shall display warning for abnormal values with "Are you sure?" confirmation
- **FR-3.1.5:** System shall timestamp all biometric entries
- **FR-3.1.6:** System shall allow patients to add notes to biometric entries (free text)

#### 3.2 Biometric History
- **FR-3.2.1:** System shall store all biometric entries in patient profile
- **FR-3.2.2:** System shall display biometric history in chronological order
- **FR-3.2.3:** System shall show basic trend indicators (up/down arrows) for repeat measurements

---

### 4. LLM-Powered Triage

#### 4.1 Triage Session Initiation
- **FR-4.1.1:** System shall provide "Start Consultation" button on patient home screen
- **FR-4.1.2:** System shall initiate new triage session when button clicked
- **FR-4.1.3:** System shall prompt patient to enter biometrics if not recently entered (within 24 hours)

#### 4.2 Intelligent Triage Conversation
- **FR-4.2.1:** System shall use LLM to conduct conversational triage with patient
- **FR-4.2.2:** System shall start with opening question: "What brings you here today?" or "How can I help you?"
- **FR-4.2.3:** System shall ask follow-up questions based on patient responses covering:
  - **Chief Complaint:** Primary symptoms and concerns
  - **Symptom Details:**
    - Onset (when did it start?)
    - Duration (how long has it lasted?)
    - Severity (on scale of 1-10)
    - Location (where exactly?)
    - Character (what does it feel like? sharp, dull, burning, etc.)
    - Aggravating factors (what makes it worse?)
    - Relieving factors (what makes it better?)
    - Associated symptoms (any other symptoms?)
  - **Impact:** How is this affecting daily activities?
  - **Previous Episodes:** Have you experienced this before?
  - **Attempted Treatments:** What have you tried so far?
  - **Urgency Assessment:** Any red flags requiring emergency care?

- **FR-4.2.4:** System shall adapt questions dynamically based on patient responses
  - Example: If patient mentions chest pain, ask about radiation, associated shortness of breath, diaphoresis
  - Example: If patient mentions headache, ask about location, aura, photophobia, nausea

- **FR-4.2.5:** System shall limit triage to maximum 15 questions to avoid fatigue
- **FR-4.2.6:** System shall provide "I don't know" or "Skip" option for each question
- **FR-4.2.7:** System shall allow patients to go back and edit previous responses

#### 4.3 Triage Conversation Interface
- **FR-4.3.1:** System shall display triage as chat-style conversation
- **FR-4.3.2:** System shall show typing indicator while LLM generates next question
- **FR-4.3.3:** System shall support text input for patient responses
- **FR-4.3.4:** System shall show progress indicator (e.g., "5 of ~10 questions")
- **FR-4.3.5:** System shall auto-save responses continuously

#### 4.4 Triage Completion
- **FR-4.4.1:** System shall detect when sufficient information is gathered
- **FR-4.4.2:** System shall provide summary of triage session to patient for review
- **FR-4.4.3:** System shall allow patient to add any additional information
- **FR-4.4.4:** System shall confirm triage completion and save session

#### 4.5 Emergency Detection
- **FR-4.5.1:** System shall identify potential emergency situations (red flags):
  - Chest pain with radiation
  - Difficulty breathing at rest
  - Severe abdominal pain
  - Sudden severe headache
  - Loss of consciousness
  - Severe bleeding
  - Suicidal ideation
- **FR-4.5.2:** System shall display emergency warning: "Your symptoms may require immediate emergency care. Please call 911 or go to the nearest emergency room."
- **FR-4.5.3:** System shall provide option to continue with consultation or exit
- **FR-4.5.4:** System shall flag emergency cases for doctor review

---

### 5. AI-Generated Health Insights

#### 5.1 Insight Generation
- **FR-5.1.1:** System shall automatically generate health insights after triage completion
- **FR-5.1.2:** System shall analyze the following data using LLM:
  - Patient's chief complaint and symptom responses
  - Biometric readings (if entered)
  - Medical history (conditions, medications, allergies)
  - Previous triage sessions (if any)

#### 5.2 Insight Content
- **FR-5.2.1:** System shall generate structured insights including:
  - **Summary:** Concise 2-3 sentence overview of patient presentation
  - **Key Findings:** Bullet list of notable symptoms and biometrics
  - **Possible Conditions:** 3-5 differential diagnoses with brief rationale (presented as "Consider:" not definitive diagnoses)
  - **Recommended Questions:** Additional questions doctor might want to ask
  - **Red Flags:** Any concerning symptoms requiring immediate attention
  - **Clinical Context:** Relevant medical history considerations

- **FR-5.2.2:** System shall include confidence indicator for insights (High/Medium/Low)
- **FR-5.2.3:** System shall cite which data points informed each insight
- **FR-5.2.4:** System shall include disclaimer: "AI-generated insights for clinical decision support only. Not a diagnosis."

#### 5.3 Insight Quality Controls
- **FR-5.3.1:** System shall not provide definitive diagnoses
- **FR-5.3.2:** System shall use language like "Consider," "Possible," "May indicate"
- **FR-5.3.3:** System shall recommend doctor evaluation for any serious conditions
- **FR-5.3.4:** System shall highlight missing information that would improve insights

---

### 6. Patient View of Insights

#### 6.1 Insight Display to Patient
- **FR-6.1.1:** System shall show generated insights to patient after triage completion
- **FR-6.1.2:** System shall display patient-friendly version of insights:
  - **What We Learned:** Summary of information gathered
  - **Next Steps:** What to expect from doctor consultation
  - **Preparation Tips:** What patient can prepare to discuss

- **FR-6.1.3:** System shall NOT show differential diagnosis list to patients (doctor-only)
- **FR-6.1.4:** System shall include clear disclaimer: "These insights help prepare for your consultation. Only a doctor can provide a diagnosis."

#### 6.2 Patient Action Options
- **FR-6.2.1:** System shall provide two options after insights:
  - **"Schedule Video Consultation"** - Primary CTA button
  - **"Save for Later"** - Secondary option to save without scheduling
- **FR-6.2.2:** System shall save insights to patient's consultation history regardless of action

---

### 7. Doctor Dashboard

#### 7.1 Patient Queue
- **FR-7.1.1:** System shall display list of patients who completed triage
- **FR-7.1.2:** System shall show for each patient:
  - Patient name
  - Age and gender
  - Chief complaint (brief)
  - Triage completion time
  - Status: "Waiting for consultation" or "In progress"
  - Emergency flag (if applicable)

#### 7.2 Patient Chart Access
- **FR-7.2.1:** System shall allow doctor to select patient from queue
- **FR-7.2.2:** System shall display comprehensive patient information:
  - Basic demographics
  - Medical history (conditions, medications, allergies)
  - Current biometric readings
  - Complete triage conversation transcript
  - AI-generated insights (full version with differential diagnoses)
  - Previous consultation history (if any)

#### 7.3 Pre-Consultation Review
- **FR-7.3.1:** System shall highlight AI insights prominently
- **FR-7.3.2:** System shall allow doctor to expand/collapse insight sections
- **FR-7.3.3:** System shall provide "Start Video Consultation" button when doctor is ready

---

### 8. Video Consultation

#### 8.1 Consultation Initiation
- **FR-8.1.1:** System shall allow patient to initiate consultation request from insights screen
- **FR-8.1.2:** System shall notify available doctors of consultation request
- **FR-8.1.3:** System shall allow doctor to accept consultation request
- **FR-8.1.4:** System shall notify patient when doctor accepts

**Note for PoC:** Simplified "on-demand" model without scheduling. Doctor availability managed manually.

#### 8.2 Video Call Features
- **FR-8.2.1:** System shall initiate video call between patient and doctor
- **FR-8.2.2:** System shall support minimum video quality: 480p
- **FR-8.2.3:** System shall support audio with echo cancellation
- **FR-8.2.4:** System shall provide mute audio/disable video controls
- **FR-8.2.5:** System shall display call duration timer
- **FR-8.2.6:** System shall provide "End Call" button for both parties

#### 8.3 In-Call Information Display (Doctor View)
- **FR-8.3.1:** System shall display patient information panel alongside video:
  - Patient name and age
  - Chief complaint
  - Key biometric values
  - AI insights summary (collapsible)
- **FR-8.3.2:** System shall allow doctor to expand full patient chart during call
- **FR-8.3.3:** System shall keep insights accessible throughout call

#### 8.4 Consultation Completion
- **FR-8.4.1:** System shall prompt doctor to add brief notes after call ends
- **FR-8.4.2:** System shall save consultation as "completed" with timestamp
- **FR-8.4.3:** System shall notify patient that consultation is complete

---

### 9. Consultation History

#### 9.1 Patient History View
- **FR-9.1.1:** System shall display list of patient's past consultations
- **FR-9.1.2:** System shall show for each consultation:
  - Date and time
  - Chief complaint
  - Doctor name
  - Status (completed)
- **FR-9.1.3:** System shall allow patient to view details of past consultations:
  - Triage responses
  - Biometrics captured
  - Patient-friendly insights

#### 9.2 Doctor History View
- **FR-9.2.1:** System shall display doctor's consultation history
- **FR-9.2.2:** System shall allow doctor to view past patient consultations
- **FR-9.2.3:** System shall display all historical patient data when viewing past consultations

---

## Non-Functional Requirements (PoC)

### 10. Security & Privacy

#### 10.1 Data Security
- **NFR-10.1.1:** System shall encrypt all data in transit (TLS 1.3)
- **NFR-10.1.2:** System shall encrypt all data at rest (AES-256)
- **NFR-10.1.3:** System shall implement secure password storage (bcrypt/Argon2)
- **NFR-10.1.4:** System shall implement session timeout after 30 minutes inactivity

#### 10.2 Privacy
- **NFR-10.2.1:** System shall comply with HIPAA requirements (Business Associate Agreement for PoC)
- **NFR-10.2.2:** System shall maintain audit logs for all data access
- **NFR-10.2.3:** System shall display privacy policy during registration
- **NFR-10.2.4:** System shall obtain consent for LLM processing of health data

#### 10.3 Access Control
- **NFR-10.3.1:** System shall implement role-based access (Patient, Doctor, Admin)
- **NFR-10.3.2:** System shall prevent patients from accessing other patients' data
- **NFR-10.3.3:** System shall only allow doctors to access data of patients who initiated consultation

---

### 11. Performance (PoC Targets)

- **NFR-11.1:** System shall load pages within 3 seconds on 4G connection
- **NFR-11.2:** System shall generate LLM triage questions within 5 seconds
- **NFR-11.3:** System shall generate AI insights within 15 seconds
- **NFR-11.4:** System shall initiate video calls within 5 seconds
- **NFR-11.5:** System shall support concurrent 10+ video consultations

---

### 12. Usability (PoC)

- **NFR-12.1:** System shall be mobile-responsive (works on phones and tablets)
- **NFR-12.2:** System shall use clear, plain language (8th-grade reading level)
- **NFR-12.3:** System shall provide help text for medical terms
- **NFR-12.4:** System shall support Chrome, Safari, Firefox latest versions

---

### 13. Reliability (PoC)

- **NFR-13.1:** System shall target 95% uptime (acceptable for PoC)
- **NFR-13.2:** System shall auto-save triage responses every 30 seconds
- **NFR-13.3:** System shall handle video call disconnections with reconnection prompt

---

## Technical Architecture (PoC)

### 14. Technology Stack

#### 14.1 Frontend
- **Framework:** React.js with TypeScript
- **Mobile:** Progressive Web App (PWA) for mobile access
- **UI Library:** Material-UI or Tailwind CSS
- **Video:** WebRTC via Twilio Video or Daily.co
- **State Management:** React Context API or Zustand

#### 14.2 Backend
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript
- **API:** RESTful APIs
- **Authentication:** JWT tokens

#### 14.3 Database
- **Primary DB:** PostgreSQL
- **ORM:** Prisma or TypeORM
- **Schema:**
  - Users (patients, doctors)
  - Profiles (medical history)
  - BiometricEntries
  - TriageSessions (includes LLM conversation)
  - Insights (AI-generated)
  - Consultations
  - AuditLogs

#### 14.4 AI/LLM Integration
- **Primary LLM:** OpenAI GPT-4 or Anthropic Claude via API
- **Prompt Engineering:** Structured prompts for triage and insight generation
- **Context Management:** Include relevant patient data in LLM context
- **Safety:** Content moderation and output validation

#### 14.5 Video Infrastructure
- **Option 1:** Twilio Video (WebRTC-based)
- **Option 2:** Daily.co (simpler integration)
- **Option 3:** Agora.io

#### 14.6 Hosting & Infrastructure
- **Cloud Provider:** AWS, Google Cloud, or Heroku (simpler for PoC)
- **Container:** Docker for deployment
- **CDN:** CloudFront or Cloudflare

---

## User Flows (PoC)

### 15. Primary User Journey: Patient

```
1. Patient Registration
   ↓
2. Complete Medical History Profile
   ↓
3. Patient Home Screen → "Start Consultation" button
   ↓
4. Enter Biometric Data (Blood pressure, temperature, etc.)
   ↓
5. LLM Triage Conversation
   - Answer 8-15 intelligent questions about symptoms
   - LLM adapts questions based on responses
   ↓
6. Triage Complete → AI Generating Insights (loading screen)
   ↓
7. View Patient-Friendly Insights
   - Summary of what was gathered
   - Next steps
   ↓
8. Click "Schedule Video Consultation"
   ↓
9. Waiting for Doctor (notification: "You'll be notified when a doctor is available")
   ↓
10. Notification: "Dr. Kim is ready for your consultation"
    ↓
11. Video Consultation
    - Discuss with doctor
    - Doctor has full context from AI insights
    ↓
12. Consultation Complete
    - Thank you message
    - Consultation saved to history
```

### 16. Primary User Journey: Doctor

```
1. Doctor Registration → Manual Approval by Admin
   ↓
2. Doctor Login → Dashboard
   ↓
3. View Patient Queue
   - See list of patients waiting for consultation
   - See chief complaints and emergency flags
   ↓
4. Select Patient → Review Patient Chart
   - Demographics
   - Medical history
   - Biometric readings
   - Complete triage conversation
   - **AI-Generated Insights** ← Key Feature
   ↓
5. Review AI Insights
   - Summary of patient presentation
   - Possible conditions to consider
   - Recommended questions
   - Red flags
   ↓
6. Click "Start Video Consultation"
   ↓
7. Video Call with Patient
   - Patient info and insights visible alongside video
   - Discuss symptoms and examination
   ↓
8. End Call → Add Brief Notes
   ↓
9. Mark Consultation as Complete
   ↓
10. Return to Dashboard → Next Patient
```

---

## LLM Prompt Engineering

### 17. Triage Prompt Structure

#### 17.1 System Prompt for Triage LLM
```
You are a medical triage assistant helping gather information from a patient before their video consultation with a doctor.

YOUR ROLE:
- Ask clear, concise questions to understand the patient's symptoms and concerns
- Ask follow-up questions based on their responses
- Use plain language that patients can understand
- Be empathetic and professional

GUIDELINES:
- Start with "What brings you here today?"
- Ask about symptom onset, duration, severity, location, character
- Ask about aggravating and relieving factors
- Ask about associated symptoms
- Identify any red flags requiring emergency care
- Limit to 15 questions maximum
- Adapt questions based on responses

IMPORTANT:
- Do NOT provide diagnoses or medical advice
- Do NOT recommend medications or treatments
- If patient describes emergency symptoms (chest pain, difficulty breathing, severe bleeding), immediately notify them to seek emergency care

EMERGENCY RED FLAGS:
- Chest pain with radiation
- Severe difficulty breathing
- Loss of consciousness
- Severe bleeding
- Sudden severe headache
- Suicidal thoughts

Patient Medical History:
{{PATIENT_MEDICAL_HISTORY}}

Recent Biometrics:
{{PATIENT_BIOMETRICS}}

Previous conversation:
{{CONVERSATION_HISTORY}}

Generate the next triage question or conclude if sufficient information is gathered.
```

#### 17.2 Insights Generation Prompt
```
You are a clinical decision support AI generating insights for a doctor reviewing a patient case before a video consultation.

PATIENT DATA:
- Demographics: {{DEMOGRAPHICS}}
- Medical History: {{MEDICAL_HISTORY}}
- Current Biometrics: {{BIOMETRICS}}
- Chief Complaint: {{CHIEF_COMPLAINT}}
- Triage Conversation: {{TRIAGE_TRANSCRIPT}}

GENERATE STRUCTURED INSIGHTS:

1. SUMMARY (2-3 sentences)
   - Concise overview of patient presentation

2. KEY FINDINGS (bullet list)
   - Notable symptoms
   - Relevant biometric values
   - Pertinent medical history

3. DIFFERENTIAL DIAGNOSIS (3-5 possibilities)
   - List possible conditions with brief rationale
   - Use language: "Consider..." not "Diagnosis is..."
   - Order by likelihood/severity

4. RECOMMENDED QUESTIONS (3-5 questions)
   - Additional questions doctor should ask during consultation

5. RED FLAGS (if any)
   - Concerning symptoms requiring immediate attention

6. CLINICAL CONTEXT
   - Relevant considerations from medical history
   - Medication interactions or contraindications to consider
   - Special populations (pregnancy, elderly, etc.)

IMPORTANT:
- Do NOT provide definitive diagnoses
- Use probabilistic language ("may indicate," "consider," "possible")
- Cite which data points support each insight
- Highlight missing information that would be helpful
- Include confidence level: High/Medium/Low

Generate insights now:
```

---

## Success Metrics (PoC)

### 18. Key Metrics to Track

#### 18.1 Adoption Metrics
- Number of patient registrations
- Number of doctor registrations
- Number of completed triage sessions
- Number of video consultations completed

**Target:** 50 patients, 10 doctors, 40 consultations in 4-week pilot

#### 18.2 Engagement Metrics
- Triage completion rate (% who finish after starting)
- Average time to complete triage
- Average number of questions in triage session
- Video consultation completion rate

**Target:** >80% triage completion, <10 minutes average triage time

#### 18.3 Quality Metrics
- Doctor satisfaction with AI insights (survey: 5-point scale)
- Patient satisfaction with triage experience (survey: 5-point scale)
- Accuracy of AI insights (doctor feedback)
- Insight actionability (% of insights that inform consultation)

**Target:** >3.5/5 average satisfaction, >70% insights deemed useful

#### 18.4 Technical Metrics
- LLM response time (average)
- Video call quality (% of calls with issues)
- System uptime
- Error rate

**Target:** <5s LLM response, >90% video quality, >95% uptime

---

## Validation & Testing Plan

### 19. PoC Validation Approach

#### 19.1 Alpha Testing (Week 1-2)
- Internal team testing (5 team members)
- Test all core flows
- Identify critical bugs
- Refine LLM prompts

#### 19.2 Beta Testing (Week 3-6)
- Recruit 10 beta patients (team members + friends/family)
- Recruit 3 beta doctors (advisors or early partners)
- Conduct real consultations
- Gather qualitative feedback (interviews)

#### 19.3 Pilot Launch (Week 7-10)
- Expand to 50+ patients
- 10+ doctors
- Collect quantitative metrics
- Conduct user surveys
- Iterate on feedback

#### 19.4 Success Evaluation (Week 11-12)
- Analyze all metrics
- Conduct retrospective
- Determine: Proceed to full product or pivot?
- Create roadmap for v1.0 if successful

---

## Risks & Mitigation (PoC)

### 20. PoC-Specific Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| LLM generates inappropriate medical advice | High | Medium | Strict prompt engineering; Output validation; Doctor oversight required |
| LLM triage feels robotic/impersonal | Medium | High | Iterative prompt refinement; User testing; Add empathetic language |
| Doctors don't find insights useful | High | Medium | Interview doctors during design; Iterate on insight format; Show examples early |
| Poor video quality affects consultations | Medium | High | Use reliable video platform (Twilio/Daily); Bandwidth requirements; Fallback to audio-only |
| Low user adoption | High | Medium | Focus on specific use case; Recruit engaged early adopters; Incentivize participation |
| LLM costs too high | Medium | Medium | Monitor token usage; Optimize prompts; Consider local models for production |
| Privacy/security concerns | High | Low | HIPAA-compliant infrastructure; Clear privacy policy; Encryption; Limited data collection |
| Doctors overwhelmed by AI suggestions | Medium | Medium | Make insights skimmable; Use visual hierarchy; Allow hide/show |

---

## Out of Scope (Explicitly Deferred)

### 21. Features NOT in PoC

The following features are intentionally excluded from PoC to maintain focus and speed:

1. **Device Connectivity** - Bluetooth/wired biometric devices
2. **Appointment Scheduling** - Calendar-based scheduling system
3. **Prescription Management** - Digital prescriptions and pharmacy integration
4. **Medication Database** - Drug interaction checking and recommendations
5. **Follow-Up Messaging** - Asynchronous patient-doctor messaging
6. **Real-Time Transcription** - Call transcription and auto-documentation
7. **Payment Processing** - Billing and insurance integration
8. **EHR Integration** - HL7 FHIR or third-party EHR connections
9. **Advanced Analytics** - Population health, doctor performance dashboards
10. **Mobile Native Apps** - iOS/Android native apps (using PWA instead)
11. **Multi-Language Support** - English only for PoC
12. **Care Team Collaboration** - Multi-provider coordination
13. **Patient Education** - Post-visit educational content

These features will be considered for v1.0 based on PoC learnings.

---

## PoC Timeline & Milestones

### 22. Development Phases

#### Phase 1: Core Infrastructure (Week 1-2)
- Set up development environment
- Database schema design
- Authentication system
- Basic UI scaffolding

#### Phase 2: Triage & LLM Integration (Week 3-4)
- Biometric entry forms
- LLM triage conversation flow
- Prompt engineering and testing
- Triage session storage

#### Phase 3: Insights Generation (Week 5-6)
- AI insight generation engine
- Patient insight view
- Doctor dashboard and patient queue
- Chart review interface

#### Phase 4: Video Consultation (Week 7-8)
- Video platform integration
- In-call UI and data display
- Consultation completion flow
- History views

#### Phase 5: Testing & Polish (Week 9-10)
- Bug fixes and refinement
- Performance optimization
- Security review
- User acceptance testing

#### Phase 6: Pilot Launch (Week 11-12)
- Deploy to production
- Onboard pilot users
- Monitor and support
- Collect feedback

---

## Success Criteria & Go/No-Go Decision

### 23. PoC Evaluation

At the end of the PoC period, evaluate based on:

#### Go Decision (Proceed to v1.0) if:
- ✅ Doctor satisfaction with AI insights ≥3.5/5
- ✅ Triage completion rate ≥75%
- ✅ ≥30 successful consultations completed
- ✅ Positive qualitative feedback from both patients and doctors
- ✅ Technical feasibility proven (LLM latency, video quality acceptable)
- ✅ No critical safety concerns

#### No-Go Decision (Pivot or Stop) if:
- ❌ Doctors find insights not useful or misleading
- ❌ Patients abandon triage frequently (high drop-off)
- ❌ LLM generates inappropriate or unsafe content repeatedly
- ❌ Video quality issues prevent effective consultations
- ❌ Low adoption despite outreach efforts
- ❌ Economics don't work (LLM costs too high vs. value)

---

## Appendix

### A. Sample Triage Conversations

#### Example 1: Acute Illness
```
LLM: Hi! I'm here to gather some information before your video consultation with the doctor. What brings you here today?

Patient: I have a really bad sore throat

LLM: I'm sorry to hear that. How long have you had the sore throat?

Patient: About 3 days now

LLM: On a scale of 1-10, with 10 being the worst pain imaginable, how would you rate the severity?

Patient: Maybe a 7

LLM: Do you have any fever? I see you entered a temperature of 101.5°F earlier.

Patient: Yes, I've been feeling hot and cold

LLM: Are you experiencing any other symptoms like cough, runny nose, or difficulty swallowing?

Patient: Yes, it hurts a lot when I swallow

LLM: Have you noticed any white patches or pus on your tonsils?

Patient: I'm not sure, I haven't looked

LLM: That's okay. Have you tried any medications or remedies so far?

Patient: Just Tylenol and throat lozenges

LLM: Did the Tylenol help reduce your fever or pain?

Patient: A little bit but not much

LLM: Have you had strep throat or similar infections before?

Patient: Yes, I had strep last year

LLM: Thanks for that information. One more question - are you experiencing any difficulty breathing or severe neck swelling?

Patient: No, nothing like that

LLM: Thank you for answering these questions. I have enough information to help prepare for your consultation with the doctor. Let me generate some insights for you both.
```

#### Example 2: Chronic Condition Check-In
```
LLM: Hello! What brings you here today?

Patient: I wanted to check in about my blood pressure

LLM: I see you entered a blood pressure reading of 145/92 mmHg. How long have you been monitoring your blood pressure?

Patient: My doctor told me to check it daily for the past month

LLM: Has your blood pressure been consistently in this range, or is this higher than usual for you?

Patient: It's been going up the past week

LLM: Are you currently taking any blood pressure medication?

Patient: Yes, lisinopril 10mg once daily

LLM: Have you been taking it regularly, or did you miss any doses recently?

Patient: I take it every morning, haven't missed any

LLM: Good. Have you experienced any symptoms like headaches, dizziness, or chest discomfort?

Patient: A little lightheaded sometimes

LLM: When do you notice the lightheadedness - when standing up, or at other times?

Patient: When I stand up too quickly

LLM: Have you made any changes to your diet, exercise, or stress levels recently?

Patient: I've been really stressed at work lately

LLM: That's helpful context. Have you noticed any side effects from your medication like cough or swelling?

Patient: No side effects

LLM: Perfect. I have enough information to prepare for your consultation with the doctor. They'll be able to review your blood pressure trends and discuss your medication.
```

### B. Sample AI-Generated Insights

#### Insight Example 1: Acute Sore Throat
```
SUMMARY:
32-year-old patient presenting with severe sore throat (7/10 severity) for 3 days, accompanied by fever (101.5°F), odynophagia (painful swallowing), and history of strep throat infection one year ago. Symptoms partially responsive to acetaminophen.

KEY FINDINGS:
• Sore throat severity: 7/10 for 3 days duration
• Fever: 101.5°F (38.6°C)
• Odynophagia (painful swallowing)
• Previous strep throat infection (1 year ago)
• Partial response to acetaminophen and lozenges
• No respiratory distress or severe neck swelling

DIFFERENTIAL DIAGNOSIS:
1. **Streptococcal Pharyngitis (Strep Throat)** - Consider given: severe odynophagia, fever, history of prior strep infection. Rapid strep test recommended.
2. **Viral Pharyngitis** - Possible given: 3-day duration, fever. However, severity and odynophagia more suggestive of bacterial cause.
3. **Infectious Mononucleosis** - Consider if: patient reports fatigue, enlarged lymph nodes. Less likely without these symptoms.
4. **Tonsillitis** - Possible given: severe throat pain and fever. Physical examination needed.

RECOMMENDED QUESTIONS:
• Can you open your mouth wide? Let me see your throat and tonsils - are there white patches or swelling?
• Are your lymph nodes swollen in your neck or jaw area?
• Do you have any fatigue or general malaise beyond the throat symptoms?
• Have you been in contact with anyone with similar symptoms?
• Any recent sick contacts or exposures?

RED FLAGS:
• None identified - no difficulty breathing, no severe neck swelling, no signs of airway compromise

CLINICAL CONTEXT:
• History of strep throat increases likelihood of recurrent infection
• Current temperature indicates systemic infection
• Consider Centor criteria for strep throat evaluation
• If strep confirmed, patient should complete full antibiotic course and avoid contagious contact

CONFIDENCE LEVEL: High
```

#### Insight Example 2: Hypertension Follow-Up
```
SUMMARY:
Patient with known hypertension on lisinopril 10mg daily presenting for blood pressure monitoring consultation. Recent readings elevated (145/92 mmHg today) with upward trend over past week. Patient reports medication compliance but increased work-related stress and orthostatic lightheadedness.

KEY FINDINGS:
• Blood pressure: 145/92 mmHg (Stage 2 hypertension)
• Current medication: Lisinopril 10mg daily (compliant)
• Recent trend: BP increasing over past week
• Orthostatic lightheadedness when standing quickly
• Increased stress at work recently
• No medication side effects reported

DIFFERENTIAL DIAGNOSIS:
1. **Inadequate Blood Pressure Control** - Consider: Current medication dose may be insufficient. Dose titration or additional agent may be needed.
2. **Stress-Induced Hypertension** - Possible given: Recent work stress and timing of BP elevation. May benefit from stress management.
3. **White Coat Hypertension** - Consider: Ensure home BP readings are accurate and taken correctly. May need ambulatory BP monitoring.
4. **Secondary Hypertension** - Less likely without new symptoms, but consider if BP continues to rise despite treatment.

RECOMMENDED QUESTIONS:
• What time of day do you take your lisinopril? Morning or evening?
• How are you taking your blood pressure at home? (position, time of day, which arm)
• Can you describe your typical daily sodium intake and diet?
• How many times per week do you exercise?
• Are you taking any over-the-counter medications or supplements?
• Any family history of difficult-to-control hypertension?

RED FLAGS:
• Mild concern: Orthostatic symptoms - monitor for excessive BP lowering if dose increased
• BP is Stage 2 but not hypertensive emergency range

CLINICAL CONTEXT:
• Patient is compliant with medication - good adherence
• Stress is modifiable risk factor - consider stress management techniques, meditation, exercise
• Orthostatic lightheadedness may limit aggressive medication increases - need to balance BP control with orthostatic tolerance
• Consider checking electrolytes (potassium) if on ACE inhibitor
• May need to increase lisinopril to 20mg or add second agent (e.g., amlodipine, HCTZ)
• Lifestyle modifications: sodium restriction (<2g/day), weight management, regular exercise

CONFIDENCE LEVEL: High
```

---

## Document Approval

| Role | Name | Date |
|------|------|------|
| Product Lead | | |
| Engineering Lead | | |
| Clinical Advisor | | |
| Security/Compliance | | |

---

**End of PoC PRD**
