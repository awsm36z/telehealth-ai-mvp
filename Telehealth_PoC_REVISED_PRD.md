# Telehealth AI - Concierge MVP (Revised PoC)
## Product Requirements Document v2.0

**Timeline:** 4 weeks
**Budget:** $3,000
**Goal:** Validate that AI-generated clinical insights improve doctor consultations
**Approach:** Manual, concierge-style, no custom code

---

## Executive Summary

### What Changed from v1.0
- ❌ **Removed:** Custom software development (no code until validated)
- ❌ **Removed:** Multi-doctor marketplace (too complex)
- ❌ **Removed:** Video platform integration (use Zoom)
- ❌ **Removed:** 12-week timeline (too slow)
- ✅ **Added:** Manual concierge approach (test value, not tech)
- ✅ **Added:** Clear monetization (charge from day 1)
- ✅ **Added:** Single-doctor focus (solve cold start)
- ✅ **Added:** 4-week rapid validation (fail fast or succeed fast)

### The One-Sentence Pitch
**"A concierge-style pilot where we manually create AI-powered patient insights for one doctor to prove they improve consultations before building any software."**

---

## The Problem We're Testing

### Hypothesis
Doctors conducting telehealth consultations lack structured patient data, leading to:
- Incomplete patient understanding
- Repetitive questioning during limited consultation time
- Sub-optimal clinical decisions
- Lower quality of care vs. in-person visits

### Solution Hypothesis
If we provide doctors with AI-generated insights BEFORE the consultation (based on structured patient intake), they will:
- Feel more prepared
- Conduct more efficient consultations
- Make better clinical decisions
- Rate the experience 4+/5 on usefulness

### What We're NOT Testing Yet
- ❌ Scale (can this work with 100 doctors?)
- ❌ Technology (is our LLM integration fast enough?)
- ❌ Business model viability (can we make $1M ARR?)
- ❌ Regulatory compliance (HIPAA, etc.)

**We're ONLY testing:** *Do doctors find AI insights valuable?*

---

## Success Criteria (Go/No-Go)

### ✅ GO Decision (Proceed to build software)

Must achieve **ALL** of these:

| Metric | Target | How We Measure |
|--------|--------|----------------|
| Doctor finds insights useful | 4.0+/5.0 avg | Post-consultation survey |
| Insights influence consultation | 70%+ of time | Doctor interview: "Did insights change your approach?" |
| Patient completes triage | 80%+ completion | Typeform analytics |
| Patient satisfaction | 4.0+/5.0 avg | Post-consultation survey |
| Willingness to pay | 60%+ pay upfront | Stripe conversion rate |
| Cost per acquisition | <$30/patient | Total ad spend / patients acquired |

### ❌ NO-GO Decision (Pivot or stop)

If **ANY** of these occur:

- Doctor rates insights <3.0/5.0 average
- Doctor says "insights didn't help" in >50% of cases
- Patient drop-off rate >50% during triage
- Willingness to pay <40%
- CAC >$50 (unsustainable economics)
- Zero organic referrals or word-of-mouth

---

## 4-Week Timeline

### Week 1: Setup & Preparation

**Goal:** Recruit doctor, create manual process, test with internal team

#### Tasks
1. **Recruit 1 Doctor Partner** (Days 1-3)
   - Offer: $2,000 for 20 hours commitment (10 consultations @ ~2 hours each)
   - Requirements:
     - Primary care or family medicine
     - Comfortable with telehealth
     - Willing to provide feedback
     - Available for 2-3 consultations/week
   - Sources:
     - Personal network (highest priority)
     - Medical school alumni network
     - Local medical associations
     - SERMO or Doximity postings

2. **Create Patient Intake Form** (Day 4)
   - Tool: Typeform (Professional plan, $50/month)
   - Sections:
     - Basic info (name, age, gender, contact)
     - Chief complaint (free text)
     - Current symptoms (structured + free text)
     - Medical history (conditions, medications, allergies)
     - Biometric readings (optional manual entry)
   - Time to build: 3-4 hours
   - Test with 3 internal team members

3. **Create AI Prompts** (Day 5)
   - Tool: ChatGPT Plus ($20/month) or Claude Pro
   - Create prompts for:
     - Patient intake → structured triage questions
     - Patient data → clinical insights document
   - Test prompts with 3 mock patients
   - Iterate until output is doctor-friendly

4. **Set Up Operations** (Day 5)
   - Calendly: Doctor availability calendar
   - Zoom: Video consultation links
   - Stripe: Payment link ($39 per consultation)
   - Google Drive: Folder for patient insights docs
   - Notion: Patient tracking database

5. **Create Templates** (Days 6-7)
   - Doctor insights template (Google Doc)
   - Patient confirmation email
   - Post-consultation survey (doctor + patient)
   - Process documentation (for YOU to follow)

**Week 1 Deliverables:**
- ✅ 1 doctor committed
- ✅ Working intake form
- ✅ Tested AI prompts
- ✅ All tools set up
- ✅ Process documented

**Week 1 Budget:** $2,070
- Doctor: $2,000
- Typeform: $50
- ChatGPT Plus: $20

---

### Week 2: First 5 Patients (Learning Mode)

**Goal:** Run end-to-end process manually, learn what works/doesn't work

#### Patient Acquisition
- **Source:** Doctor's existing patient base
  - Ask doctor to email 20 existing patients
  - Offer: "Free AI-enhanced consultation" (first 5 only)
- **Fallback:** Personal network
  - Friends/family who need consultation
  - Offer 50% discount ($19 instead of $39)

#### Process Flow (Per Patient)

```
STEP 1: Patient Intake (15-20 min, patient time)
→ Patient receives Typeform link
→ Patient completes intake questions
→ Patient enters biometrics (if available)
→ Notification sent to you when complete

STEP 2: Insights Generation (20-30 min, your time)
→ YOU review Typeform responses
→ YOU copy data into ChatGPT with prompt
→ YOU copy output into insights template
→ YOU format and refine insights
→ YOU share Google Doc with doctor

STEP 3: Doctor Review (5-10 min, doctor time)
→ Doctor receives email: "New patient ready"
→ Doctor reviews insights document
→ Doctor books consultation time in Calendly
→ Auto-generated Zoom link sent to patient

STEP 4: Consultation (20-30 min, doctor + patient)
→ Patient joins Zoom at scheduled time
→ Doctor conducts consultation with insights visible
→ Doctor takes notes (Google Doc or notepad)

STEP 5: Feedback Collection (5 min each)
→ YOU send survey to patient (Typeform)
→ YOU send survey to doctor (Google Form)
→ YOU conduct quick Zoom debrief with doctor (10 min)

TOTAL TIME PER PATIENT:
- Your time: 30-40 min
- Doctor time: 35-40 min
- Patient time: 40-50 min
```

#### Metrics to Track (Week 2)

Create a simple spreadsheet to track:

| Patient ID | Intake Completed? | Time Taken | Payment? | Consultation Done? | Doctor Rating | Patient Rating | Key Feedback |
|------------|-------------------|------------|----------|-------------------|---------------|----------------|--------------|
| P01 | Yes | 12 min | Yes | Yes | 4/5 | 5/5 | "Insights helped with..." |
| P02 | No (dropped) | - | No | No | - | - | Abandoned at Q7 |

#### What to Learn
1. **Intake Quality**
   - Which questions are confusing?
   - Where do patients drop off?
   - What takes too long?
   - What's missing that doctor needs?

2. **Insights Quality**
   - Did doctor find them useful? Why/why not?
   - What would make them more useful?
   - Did insights change consultation approach?
   - Were there errors or hallucinations?

3. **Process Friction**
   - What's annoying for patients?
   - What's annoying for doctor?
   - What's annoying for you (operator)?
   - Where are handoffs breaking?

4. **Economics**
   - How much would patients pay?
   - What's too expensive?
   - How long does each step take?
   - Is this scalable?

**Week 2 Deliverables:**
- ✅ 5 completed consultations
- ✅ Detailed feedback from doctor
- ✅ Identified improvements needed
- ✅ Updated prompts and process

**Week 2 Budget:** $50
- Survey incentives ($10 gift cards)

---

### Week 3: Iterate & Scale to 15 More (20 Total)

**Goal:** Implement improvements, test at slightly larger scale

#### Improvements to Make
Based on Week 2 learnings:
- **Intake Form:** Remove confusing questions, add missing ones
- **AI Prompts:** Refine to generate more useful insights
- **Process:** Eliminate manual steps that can be automated simply
- **Communication:** Better emails, clearer instructions

#### Patient Acquisition (15 more)
- **5 from doctor's patients** (if available)
- **10 from external sources:**
  - Local Facebook groups (post in health/wellness communities)
  - Reddit (r/AskDocs, r/telehealth, local city subreddits)
  - Nextdoor (neighborhood platform)
  - Friends/family referrals (offer $10 referral bonus)

**Messaging for external acquisition:**
```
"Free/Discounted AI-Enhanced Doctor Consultation (Pilot Program)

We're piloting a new telehealth service that uses AI to help doctors
better understand your symptoms before your consultation.

What you get:
✓ Intelligent symptom questionnaire
✓ 20-min video consultation with Dr. [Name]
✓ Personalized health insights

Cost: $29 (normally $39) - Limited spots available

This is a pilot program to improve telehealth quality. We'd love your
feedback!

Book here: [link]"
```

#### Run Same Process, Track Same Metrics
- Continue manual insights generation
- Continue detailed feedback collection
- Track patterns across all 20 patients

#### Weekly Check-In with Doctor (30 min)
- How's it going overall?
- Are insights getting better?
- What would make you use this regularly?
- Would you pay for this tool? How much?

**Week 3 Deliverables:**
- ✅ 20 total consultations completed
- ✅ Quantitative data on all metrics
- ✅ Qualitative themes identified
- ✅ Doctor interview insights

**Week 3 Budget:** $600
- Patient acquisition: $500 (Facebook ads, incentives)
- Survey incentives: $100

---

### Week 4: Analysis & Go/No-Go Decision

**Goal:** Synthesize learnings, make informed decision about next steps

#### Analysis Tasks

**1. Quantitative Analysis** (Day 1-2)
- Calculate averages for all metrics
- Create visualizations (simple charts)
- Compare to success criteria
- Identify trends

**2. Qualitative Analysis** (Day 2-3)
- Review all feedback comments
- Identify common themes
- Extract quotes and stories
- Find unexpected insights

**3. Doctor Deep Dive** (Day 3)
- 60-min interview with doctor
- Questions:
  - "If this tool existed today, would you use it? How often?"
  - "Would you pay for it? How much?"
  - "What would prevent you from using it?"
  - "How does this compare to your current workflow?"
  - "What would make this 10x better?"

**4. Economics Analysis** (Day 4)
- Calculate:
  - Total cost: $________
  - Total revenue: $________ (if charging)
  - Cost per patient acquired: $________
  - Time per patient (your time): ________ min
  - Profit per consultation: $________
- Model scale:
  - If 100 consultations/month, what's required?
  - If 1,000 consultations/month, what's required?

**5. Go/No-Go Decision** (Day 5)
- Review success criteria
- Calculate scores for each metric
- Overall assessment:
  - **GO:** Proceed to build software (Weeks 5-12)
  - **PIVOT:** Change approach based on learnings
  - **STOP:** Insights aren't valuable, pursue different idea

**6. Next Steps Planning** (Day 6-7)
- If GO:
  - Define v1.0 software requirements
  - Prioritize features based on learnings
  - Create 8-week build plan
  - Calculate budget for build phase
- If PIVOT:
  - Identify what needs to change
  - Design new experiment
  - Plan 4-week test
- If STOP:
  - Document learnings
  - Explore adjacent ideas
  - Decide on next venture

**Week 4 Deliverables:**
- ✅ Complete analysis report
- ✅ Go/No-Go decision made
- ✅ Next steps plan (if GO)
- ✅ Lessons learned document

**Week 4 Budget:** $200
- Extended interviews ($100)
- Tools/misc ($100)

---

## Operational Details

### Tools Stack (No-Code)

| Function | Tool | Cost | Setup Time |
|----------|------|------|------------|
| Patient intake | Typeform | $50/mo | 2 hours |
| AI insights | ChatGPT Plus | $20/mo | 1 hour |
| Scheduling | Calendly | Free | 30 min |
| Video calls | Zoom Basic | Free | 15 min |
| Payments | Stripe | 2.9% + $0.30 | 20 min |
| Documentation | Google Docs | Free | 15 min |
| Tracking | Google Sheets | Free | 1 hour |
| Surveys | Typeform/Forms | Free | 30 min |

**Total monthly cost:** $70
**Total setup time:** 5-6 hours

---

### Patient Intake Questions (Triage)

**Section 1: Basic Information**
1. Full name
2. Date of birth
3. Gender
4. Email
5. Phone number

**Section 2: Chief Complaint**
6. What brings you here today? (Free text, 500 char limit)
7. When did this start? (Date picker + "ongoing" option)
8. How severe is this issue? (Scale 1-10 with emoji)

**Section 3: Symptom Details**
9. Have you had this issue before? (Yes/No/Not sure)
10. What makes it better? (Free text, optional)
11. What makes it worse? (Free text, optional)
12. Any other symptoms? (Multi-select + free text)

**Section 4: Biometric Data** (Optional)
13. Recent blood pressure? (If available)
14. Recent temperature? (If available)
15. Current weight? (If available)

**Section 5: Medical History**
16. Current medical conditions? (Free text)
17. Current medications? (Free text)
18. Known allergies? (Free text)
19. Are you pregnant or possibly pregnant? (Yes/No/N/A)

**Section 6: Context**
20. Anything else the doctor should know? (Free text, optional)

**Total questions:** 20 (5-10 min to complete)

---

### AI Prompt Template

#### Prompt for Generating Insights

```
You are a medical assistant helping prepare clinical insights for a doctor's
telehealth consultation.

PATIENT DATA:
---
Name: {name}
Age: {age}
Gender: {gender}

Chief Complaint: {chief_complaint}
Duration: {duration}
Severity: {severity}/10

Symptom Details:
- Makes it better: {better}
- Makes it worse: {worse}
- Associated symptoms: {other_symptoms}
- Previous episodes: {previous}

Biometrics (if provided):
- Blood Pressure: {bp}
- Temperature: {temp}
- Weight: {weight}

Medical History:
- Conditions: {conditions}
- Medications: {medications}
- Allergies: {allergies}
- Pregnancy status: {pregnancy}

Additional context: {additional_info}
---

Generate structured clinical insights for the doctor in the following format:

# PATIENT SUMMARY
[2-3 sentence overview of the patient presentation]

# KEY FINDINGS
• [Notable symptom 1]
• [Notable symptom 2]
• [Notable biometric or history item]
• [Etc.]

# DIFFERENTIAL DIAGNOSES TO CONSIDER
1. **[Condition 1]** - [Brief rationale]
2. **[Condition 2]** - [Brief rationale]
3. **[Condition 3]** - [Brief rationale]

# RECOMMENDED QUESTIONS FOR CONSULTATION
• [Additional question to clarify diagnosis]
• [Question about risk factors]
• [Question about symptom progression]

# RED FLAGS / URGENT CONCERNS
[Any symptoms requiring immediate attention, or "None identified"]

# CLINICAL CONTEXT
• [Relevant medical history considerations]
• [Medication interactions to consider]
• [Special population notes (pregnancy, elderly, etc.)]

IMPORTANT:
- Use probabilistic language ("consider," "may indicate," "possible")
- Do NOT provide definitive diagnoses
- Highlight any missing information that would be helpful
- Include confidence level (High/Medium/Low) for each differential diagnosis
```

---

### Doctor Insights Template

Create a Google Doc template that looks like this:

```
═══════════════════════════════════════════════════
           PATIENT CONSULTATION INSIGHTS
                    [Patient Name]
        Consultation Date: [Date] | Time: [Time]
═══════════════════════════════════════════════════

🔍 PATIENT SUMMARY
────────────────────────────────────────────────────
[AI-generated 2-3 sentence overview]


📊 KEY FINDINGS
────────────────────────────────────────────────────
• [Finding 1]
• [Finding 2]
• [Finding 3]


💭 DIFFERENTIAL DIAGNOSES TO CONSIDER
────────────────────────────────────────────────────
1. [Diagnosis 1] - [Rationale] [Confidence: High/Med/Low]
2. [Diagnosis 2] - [Rationale] [Confidence: High/Med/Low]
3. [Diagnosis 3] - [Rationale] [Confidence: High/Med/Low]


❓ RECOMMENDED QUESTIONS
────────────────────────────────────────────────────
• [Question 1]
• [Question 2]
• [Question 3]


⚠️ RED FLAGS / URGENT CONCERNS
────────────────────────────────────────────────────
[Any urgent items or "None identified"]


🏥 CLINICAL CONTEXT
────────────────────────────────────────────────────
• Medical History: [Relevant conditions]
• Current Medications: [List]
• Allergies: [List]
• Special Considerations: [Pregnancy, age, etc.]


📋 RAW PATIENT DATA
────────────────────────────────────────────────────
[Collapse this section - full intake form responses]


───────────────────────────────────────────────────
                 DOCTOR'S NOTES
         [Space for doctor to add notes during call]
───────────────────────────────────────────────────


═══════════════════════════════════════════════════
        AI-Generated Insights for Clinical Support Only
                     Not a Diagnosis
═══════════════════════════════════════════════════
```

---

### Feedback Surveys

#### Doctor Post-Consultation Survey

**1. How useful were the AI-generated insights for this consultation?**
- 5 - Extremely useful, significantly improved consultation
- 4 - Very useful, helped quite a bit
- 3 - Somewhat useful, helped a little
- 2 - Slightly useful, didn't help much
- 1 - Not useful at all

**2. Did the insights influence your clinical approach?**
- Yes, significantly
- Yes, somewhat
- A little bit
- No, not at all

**3. What was most helpful about the insights?** (Free text)

**4. What was least helpful or could be improved?** (Free text)

**5. Compared to a typical telehealth consultation WITHOUT these insights, this was:**
- Much better
- Somewhat better
- About the same
- Somewhat worse
- Much worse

**6. Would you use a tool like this regularly if it existed?**
- Definitely yes
- Probably yes
- Maybe
- Probably not
- Definitely not

**7. How much would you pay per month for this tool?**
- $0 (would only use if free)
- $10-25/month
- $25-50/month
- $50-100/month
- $100-200/month
- $200+/month

**8. Any other feedback?** (Free text)

---

#### Patient Post-Consultation Survey

**1. How easy was the intake questionnaire to complete?**
- 5 - Very easy
- 4 - Easy
- 3 - Neutral
- 2 - Difficult
- 1 - Very difficult

**2. How long did the intake take you?** (Minutes)

**3. How satisfied were you with your consultation?**
- 5 - Very satisfied
- 4 - Satisfied
- 3 - Neutral
- 2 - Dissatisfied
- 1 - Very dissatisfied

**4. Did the doctor seem well-prepared for your consultation?**
- Yes, very prepared
- Somewhat prepared
- Not sure
- Not well prepared

**5. Would you use this service again?**
- Definitely yes
- Probably yes
- Maybe
- Probably not
- Definitely not

**6. How likely are you to recommend this to a friend?** (NPS: 0-10)

**7. At what price would this be a good value?**
- $0-20 per consultation
- $20-40 per consultation
- $40-60 per consultation
- $60+ per consultation

**8. What did you like most?** (Free text)

**9. What could be improved?** (Free text)

---

## Budget Breakdown

### Total 4-Week Budget: $2,920

| Item | Cost | Notes |
|------|------|-------|
| **Doctor Compensation** | $2,000 | 20 hours @ $100/hr |
| **Tools** | | |
| ├─ Typeform Pro (1 month) | $50 | Patient intake |
| ├─ ChatGPT Plus (1 month) | $20 | AI insights |
| ├─ Calendly (free tier) | $0 | Scheduling |
| ├─ Zoom (free tier) | $0 | Video calls |
| ├─ Stripe (2.9% + $0.30/txn) | ~$100 | Payment processing |
| ├─ Google Workspace (optional) | $0 | Using free tier |
| **Patient Acquisition** | $500 | Facebook ads, incentives |
| **Survey Incentives** | $150 | Gift cards for feedback |
| **Interviews** | $100 | Extended feedback sessions |
| **Miscellaneous** | $100 | Buffer |

---

## Risks & Mitigation

### Risk #1: Can't Find Doctor
**Impact:** High | **Likelihood:** Medium

**Mitigation:**
- Start recruiting Week -2 (before official start)
- Offer competitive rate ($100/hr is above typical)
- Look in personal network first
- Have backup: Medical advisor consultants on Upwork
- Offer equity/advisor shares if bootstrap

---

### Risk #2: Can't Acquire Patients
**Impact:** High | **Likelihood:** Medium

**Mitigation:**
- Doctor's existing patients (easiest source)
- Personal network (friends/family)
- Offer free/discounted first 5 consultations
- Target parents (always need pediatric advice)
- Post in multiple channels simultaneously

---

### Risk #3: Insights Aren't Useful
**Impact:** High | **Likelihood:** Medium

**This is what we're testing! If true, that's valuable learning.**

**Mitigation:**
- Interview doctors BEFORE starting (show examples)
- Iterate prompts rapidly based on feedback
- Week 2: If insights are bad, spend Week 3 improving
- If still bad after iteration → NO-GO decision is correct

---

### Risk #4: LLM Generates Dangerous Info
**Impact:** Critical | **Likelihood:** Low

**Mitigation:**
- YOU review every insight before sharing with doctor
- Doctor oversight (they make final clinical decisions)
- Clear disclaimers on every document
- Frame as "research study" not clinical care
- Have doctor flag any concerning outputs immediately

---

### Risk #5: Regulatory/Legal Issues
**Impact:** Medium | **Likelihood:** Low (for pilot)

**Mitigation:**
- Frame as "research pilot" not clinical service
- Small scale (20 patients) = low regulatory attention
- Doctor maintains clinical responsibility
- Don't store PHI long-term
- Get verbal consent from participants
- Before scaling, hire healthcare attorney

---

### Risk #6: Takes Too Much Time (Not Scalable)
**Impact:** Medium | **Likelihood:** Medium

**This is expected for concierge MVP!**

**Mitigation:**
- 30-40 min per patient is FINE for PoC
- Goal: Learn what to automate, not prove scale
- Week 4: Identify what's most time-consuming
- Build automation for that specific thing first

---

## What Happens After Week 4?

### If GO (Insights are useful)

**Weeks 5-12: Build MVP Software** ($50-75K, 8 weeks)

Core features to build:
1. ✅ Automated patient intake (web form)
2. ✅ Automated insights generation (LLM API)
3. ✅ Doctor dashboard (view insights, patient queue)
4. ✅ Basic video integration (embed Zoom/Whereby)
5. ✅ Payment processing (Stripe integration)
6. ✅ User accounts (patients & doctors)

What NOT to build yet:
- ❌ Mobile apps (web-only MVP)
- ❌ Advanced scheduling
- ❌ Prescriptions
- ❌ Messaging/chat
- ❌ EHR integration

**Goal:** 100 consultations in first month after launch

---

### If PIVOT (Insights useful but needs changes)

**Examples of pivots based on learnings:**

**Pivot 1: Patient-Only Tool**
- If doctor finds it useful BUT won't pay
- Insight: Patients might pay for insights to share with their own doctor
- Build: Patient-facing symptom checker + insights ($9.99/month)

**Pivot 2: Different Format**
- If insights are useful but format is wrong
- Example: Audio briefing instead of document
- Example: Real-time suggestions during call instead of pre-call prep

**Pivot 3: Specific Niche**
- If works great for certain conditions but not others
- Example: Only chronic disease management
- Example: Only urgent care / acute illness

**Pivot 4: B2B Model**
- If individual doctor adoption is hard
- Partner with clinic/hospital system
- White-label solution

---

### If STOP (Insights not useful)

**Possible reasons:**
- Doctor: "I prefer to gather info myself during consultation"
- Doctor: "Insights are too generic / obvious"
- Doctor: "Takes longer to read insights than just talk to patient"
- Patients: "Triage is too tedious"

**What to do:**
1. Document lessons learned thoroughly
2. Interview doctor deeply: What WOULD be useful?
3. Explore adjacent ideas:
   - Maybe insights post-call for documentation?
   - Maybe insights for patients, not doctors?
   - Maybe focus on documentation/transcription instead?
4. Consider different problem space entirely

**Fail fast is SUCCESS** - You learned in 4 weeks and $3K instead of 6 months and $200K.

---

## Key Principles

### 1. Manual is Good
- Don't apologize for manual processes
- Manual = fast learning, easy changes
- Automate only what's proven valuable

### 2. Talk to Users Constantly
- Not just surveys - real conversations
- After every consultation: "How was that?"
- Users tell you what to build

### 3. Charge from Day 1
- Money is the best signal
- "Would you pay?" ≠ "Will you pay?"
- Even $1 eliminates tire-kickers

### 4. Fail Fast
- 4 weeks to learn, not 12
- If it's not working, know by Week 2
- Pivot or stop quickly

### 5. One Doctor is Enough
- Don't need 10 doctors for PoC
- Deep learning from 1 > shallow learning from 10
- Solve marketplace later

---

## FAQ

### Q: What if we can't find a doctor?
**A:** Start with a nurse practitioner or physician assistant. Or hire a medical advisor on contract ($150-200/hr) for 10 hours.

### Q: What if ChatGPT isn't good enough?
**A:** Try Claude, Gemini, or GPT-4. Spend time prompt engineering. If no LLM works, that's important learning (maybe not AI-native problem).

### Q: What about HIPAA compliance?
**A:** For 20-patient pilot, operate as research study. Get verbal consent. Don't store data long-term. Address HIPAA before scaling beyond pilot.

### Q: Can we do this faster than 4 weeks?
**A:** Week 1 setup could be done in 3-4 days if moving fast. But consultations need to happen over time (can't rush doctor-patient interactions).

### Q: What if doctor wants more than $2K?
**A:** Negotiate. Offer $150/hr or cap at $2,500. Or offer equity/advisor shares. Or find a doctor who's excited about the mission (ideal).

### Q: Should we charge patients for PoC?
**A:** Yes. Even if just $19-29. Proves willingness to pay. Can offer first 5 free to doctor's patients if needed for recruitment.

### Q: What about malpractice insurance?
**A:** Doctor should have their own coverage. You're providing triage tool, not practicing medicine. Get confirmation from doctor that their coverage includes telehealth.

---

## Success Stories: Who Did This Right

### Example 1: Stripe
- Started with manual payment processing
- Founders processed payments by hand
- Only automated after proving demand

### Example 2: DoorDash
- Launched with simple landing page
- Founders delivered food themselves
- Built tech after validating demand

### Example 3: Airbnb
- Founders photographed listings themselves
- Stayed at hosts' homes to understand experience
- Concierge approach before automation

### Example 4: Zappos
- Founder posted shoe photos online
- When order came in, bought shoes from store and shipped them
- No inventory until proven model

**Pattern:** Do things that don't scale → Learn → Build

---

## Conclusion

This revised PoC is **25x more capital-efficient** and **3x faster** than the original approach:

| Metric | Original PoC | Revised PoC | Improvement |
|--------|--------------|-------------|-------------|
| **Time** | 12 weeks | 4 weeks | 3x faster |
| **Cost** | $75,000+ | $2,920 | 25x cheaper |
| **Doctors** | 10 (hard) | 1 (achievable) | 10x simpler |
| **Patients** | 50 | 20 | Focused learning |
| **Code** | Full app | Zero | Infinitely simpler |
| **Risk** | High | Low | Much safer |

**The goal is not to build software. The goal is to learn if this is worth building.**

After 4 weeks, you'll know with confidence: **GO, PIVOT, or STOP.**

Then you can make an informed decision about next steps.

**Now go build! 🚀**
