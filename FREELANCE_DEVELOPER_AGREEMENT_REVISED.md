# FREELANCE DEVELOPER AGREEMENT
## Telehealth AI MVP Project

**Effective Date:** February 7, 2026  
**Last Updated:** February 7, 2026

---

## 1. PARTIES

**CLIENT (Company):**  
[Your Full Name/Company Legal Name]  
[Address]  
[Email]  
[Phone]

**CONTRACTOR (Developer):**  
[Developer Full Name]  
[Address]  
[Email]  
[Phone]

---

## 2. ENGAGEMENT & SCOPE

### 2.1 Independent Contractor Relationship

Developer is an independent contractor, NOT an employee. This Agreement creates an independent contractor relationship only. No employment relationship, partnership, or joint venture is created.

Developer will:
- Be responsible for own taxes, insurance, and benefits
- Set own work schedule (within agreed hours)
- Use own equipment
- Control work methods and processes

Client will NOT provide:
- Employment benefits (health insurance, retirement, paid time off)
- Workers' compensation insurance
- Unemployment insurance

### 2.2 Project Scope

**Project:** TeleHealth AI MVP - Mobile Application + Backend  
**Duration:** Sprint-based (this agreement covers 4-12 weeks initially)  
**Platform:** React Native/Expo (Mobile) + Node.js/Express (Backend)  
**Deliverables:** See Section 3 and attached Exhibit A

### 2.3 Work Arrangement

**Work Location:** Flexible - choose one:
- ✅ **Fully Remote** - All work conducted remotely via video calls (recommended)
- ✅ **Hybrid** - 2-3 days in-person (negotiated weekly), 2-3 days remote
- ✅ **In-Person** - 3-4 days in-person (Client location), 1-2 days flexible

Work arrangement to be decided **before signing** and can be renegotiated quarterly.

**Schedule:**
- Target: 15 hours per week
- Flexibility: Developer can choose work hours (morning/afternoon/evening)
- Meetings: 2-3 synchronous meetings per week (standup, planning, review)
- Timezone: [Developer's timezone or create plan for multi-timezone]

---

## 3. COMPENSATION

### 3.1 Hourly Rate & Structure

**Hourly Rate:** $25 USD per hour

**Hours Per Week:**
- Regular work: Up to 15 hours per week
- Sprint coordination/planning: Up to 1 additional hour per week
- **Total Cap:** 16 hours per week maximum
- Hours beyond 16: Requires written approval in advance

**Rate Structure:**
- Early-stage startup rate (discounted)
- Rate includes all labor (coding, meetings, documentation, support, testing)

### 3.2 Sprint-Based Payment (All-or-Nothing Model)

**Payment Trigger:** Payment is contingent on COMPLETION OF ALL sprint tasks:

**Payment Released Only When ALL of the Following Are Met:**
1. ✅ All sprint deliverables are 100% complete and functional
2. ✅ Unit tests written and passing (>70% code coverage minimum)
3. ✅ Evaluation suite (evals) run and passing (no critical failures)
4. ✅ Application successfully runs without critical bugs
5. ✅ All code merged to main branch with clean commits
6. ✅ Demo video or live demonstration provided
7. ✅ Code reviewed and approved by Client

**Payment Cap Per Sprint:**
- Maximum payment per sprint: **$400** (regardless of hours logged)
- Formula: Hours worked × $25/hr, **capped at $400 total**
- Example: 16 hours × $25 = $400 (max reached)
- Example: 10 hours × $25 = $250 (paid in full)

**Payment Schedule:**
- After sprint completion and acceptance: Payment within 5 business days
- Payment method: [Developer chooses: Bank transfer / PayPal / Stripe]

**Non-Payment: All-or-Nothing**

If ANY of the following are true, **NO PAYMENT is issued**:
- Sprint deliverables incomplete (>90% must be done)
- Critical bugs blocking functionality
- Unit tests missing or failing
- Evals show critical failures (emergency detection fails, safety violations, etc.)
- Application crashes or doesn't run
- Code quality below standards
- Missing or inadequate testing

**Partial Credit:**
If >90% of work is complete but some tests/evals fail:
- Client may provide written feedback
- Developer has 2 business days to fix
- Fixed work reviewed and paid upon completion
- Otherwise: No payment until fully corrected

**Payment Dispute Process:**
1. Client notifies Developer in writing of why payment withheld
2. Client lists specific issues (bugs, failing tests, missing features)
3. Developer has 2 business days to remedy
4. Issues re-tested by Client
5. If resolved: Payment issued
6. If unresolved: Negotiate in good faith for 5 days

---

## 4. DELIVERABLES & ACCEPTANCE

### 4.1 Weekly Work Plan

**By Sunday 8:00 PM Each Week:**
- Developer and Client agree in writing on next week's deliverables
- Format: Email, Slack, or shared document
- Includes: Description, acceptance criteria, estimated hours, deadline

**Example Work Plan:**
```
Week of February 10-14, 2026
Deliverable: User authentication API endpoints + mobile integration
Estimated Hours: 15 hours
Acceptance Criteria:
  ✓ Registration endpoint (POST /api/auth/register) working
  ✓ Login endpoint functional with JWT tokens
  ✓ Mobile screens integrated (registration + login flows)
  ✓ Input validation + error handling implemented
  ✓ >80% code coverage (unit tests)
  ✓ Code reviewed and merged to main branch
  ✓ Demo video (2-3 min) showing end-to-end flow
Due: Friday 6:00 PM
```

### 4.2 Deliverable Submission

**Developer Submits:**
1. Git commits with clear messages (merged to main or in PR)
2. Brief summary of what was built (1 paragraph)
3. Any known limitations or follow-up items
4. Demo video (if applicable - 2-5 min mobile demo)
5. Time log (if requested)

**Submission Deadline:** By agreed date (typically Friday evening)

### 4.3 Acceptance Criteria & Client Review

**Client Reviews Within 3 Business Days:**
- Code functionality
- Code quality (readability, documentation, tests)
- Alignment with requirements

**Client Response:**
1. ✅ **ACCEPTED** → Payment processed immediately
2. ✅ **ACCEPTED w/ Minor Notes** → Payment processed, notes for next sprint
3. ❌ **NEEDS REVISIONS** → Specific issues listed, 3-day deadline to fix

**If Revisions Needed:**
- Developer has 3 business days to address
- Major issues (>50% incomplete): NO payment until rectified
- Minor issues (<50% complete): Payment prorated (~50-75%)
- Can negotiate extension if complex

**Objective Quality Standards:**
- Code is functional and handles happy path + basic error cases
- Code follows TypeScript/React best practices
- Code is documented (comments on complex logic)
- Git history is clean with sensible commits
- Tests provided for critical functionality (>70% coverage target)

---

## 5. SCHEDULE & ATTENDANCE

### 5.1 Working Hours

**Flexibility:**
- Developer chooses work hours within 24-hour period
- Must attend 2-3 weekly sync meetings (developer chooses preference)
- Meetings scheduled in advance (48 hours notice minimum)
- If timezone makes sync impossible: Async updates acceptable

**Schedule Communication:**
- Share weekly calendar availability by Sunday
- Adjust as needed (provide 3 days notice)

### 5.2 Meeting Attendance

**Required Meetings:**
- **Standup** (2x weekly, 15 min): Quick progress update
- **Plannng** (1x weekly, 30 min): Sprint planning for next week
- **Review** (1x weekly, 30 min): Demo & feedback on deliverables

**Flexibility:**
- Can attend async (video recording) if timezone difficult
- Can move meetings if same week
- Can delegate to async Slack updates if needed (discuss first)

### 5.3 Absence & Time Off

**Personal Time:**
- Developer entitled to 2 "no-work" weeks per year (unpaid)
- Must provide 2 weeks' notice
- Can be taken in 2-3 day increments

**Sick Leave:**
- Developer not required to work if sick/injured
- Notify Client ASAP (day-of is fine)
- No documentation required (trust-based)
- No payment for missed hours

**Emergency:**
- Keep Client informed about any extended unavailability
- Try to provide 24 hours notice

### 5.4 Unexcused Absence Policy

**First Absence:** No penalty, but discuss availability  
**Second Absence:** Email reminder about commitment  
**Third Absence:** Client may terminate agreement (1 week notice)

---

## 6. INTELLECTUAL PROPERTY

### 6.1 Ownership of Work Product

**Developer Assigns to Client:**
All work created under this Agreement, including:
- Source code (frontend, backend, scripts)
- Database schemas, API designs
- UI designs, mockups, graphics
- Documentation, comments, README files
- Test code
- Configurations (environment configs, build scripts)

**Effective:** Upon creation (automatically)

### 6.2 Pre-Existing IP

**Developer's Pre-Existing Code:**
Developer may use pre-existing code, libraries, or frameworks IF:
1. Disclosed in writing before use
2. Developer has right to use/transfer
3. Open-source license compatible (MIT, BSD, Apache 2.0 preferred)

**Licensed IP:**
- Open-source libraries owned by their respective creators
- Client receives perpetual license to use in this project

### 6.3 Open Source Compliance

**Allowed Without Approval:**
- Popular dependencies (React, Express, TypeScript, etc.)
- MIT, BSD, Apache 2.0 licensed code

**Requires Approval:**
- GPL or copyleft licenses
- Commercial/proprietary libraries
- Unusual or restrictive licenses

**Client's Rights:**
- Use code perpetually in project
- Modify as needed
- Cannot guarantee future maintainability

---

## 7. CONFIDENTIALITY

### 7.1 What's Confidential

Developer agrees not to disclose:
- Source code and technical architecture
- Product roadmap and features
- Business metrics (users, revenue, plans)
- Customer information
- API keys and credentials

### 7.2 Confidentiality Obligations

**Duration:** 3 years after Agreement termination (reasonable for startup)

**Developer May:**
- Use general skills/knowledge gained
- Reference project in portfolio (with permission)
- Discuss project work in job interviews
- Build competing products after project ends

**Developer Cannot:**
- Share code without written permission
- Disclose customer/user data
- Share business plans or roadmap
- Copy technical architecture

---

## 8. NON-COMPETE (Narrow & Reasonable)

### 8.1 Limited Non-Compete

**Duration:** 6 months after project completion  
**Geographic Scope:** Client's target market (healthcare telehealth in US)  
**Industry Scope:** AI-powered telehealth triage applications

**Developer Agrees Not To:**
- Build direct competing product (telehealth + AI triage)
- Work for direct competitor (companies like carbon, babylon, etc.)
- Solicit Client's customers or team members

### 8.2 What's Allowed

Developer CAN:
- Work on general healthcare projects
- Build telehealth apps without AI triage
- Work for non-competing healthcare companies
- Build in other industries entirely
- Start own business in non-competing space

### 8.3 Enforceability

This clause is narrowly tailored to be enforceable. It's limited in time (6 months), scope (specific to telehealth AI triage), and geography (US).

---

## 9. REPRESENTATIONS & WARRANTIES

### 9.1 Developer Warrants

1. **Authority:** Full legal right to enter agreement
2. **Skills:** Possesses necessary technical skills
3. **Original Work:** Work Product will be original (unless disclosed)
4. **No Conflicts:** Not subject to conflicting agreements
5. **Compliance:** Will follow agreed technical standards
6. **Accuracy:** Time records will be accurate
7. **Legal Compliance:** Will comply with applicable laws

### 9.2 Client Warrants

1. **Authority:** Has right to enter agreement
2. **Payment:** Will pay for approved work
3. **Cooperation:** Will provide timely feedback/decisions

### 9.3 Disclaimer

Work provided "AS IS" without warranties of merchantability or fitness for particular purpose. Developer not responsible for:
- Server availability/uptime
- Data loss or corruption
- Third-party service failures

---

## 10. TERMINATION

### 10.1 At-Will Termination

Either party may terminate at any time with written notice:

**By Client:** 1 week notice (or 24 hours for cause)  
**By Developer:** 1 week notice (allows transition)

**Final Payment:** Within 5 business days of termination for completed work

### 10.2 Termination for Cause

Client may terminate immediately (no notice) IF:
- Developer materially breaches this Agreement
- Developer fails to deliver on 2+ consecutive sprints
- Developer violates confidentiality
- Developer commits fraud or illegal act

**Determination Process:**
- Client provides written notice of cause
- Developer has 3 business days to remedy
- If not remedied: Termination effective immediately

### 10.3 Upon Termination

**Developer Must:**
1. Stop work immediately
2. Return all Client property
3. Transfer code access (GitHub, servers, etc.)
4. Provide 2-3 hours of transition assistance (optional, unpaid)

**Client Must:**
1. Pay for completed, approved work (prorated to percentage complete)
2. Return Developer's personal work (if any)

**What Survives:**
- Section 6 (IP Assignment)
- Section 7 (Confidentiality - 3 years)
- Section 8 (Non-Compete - 6 months)

---

## 11. LIABILITY

### 11.1 Limitation of Liability

**Developer's Liability Cap:**
Total liability ≤ **$5,000** OR **3 months of fees paid**, whichever is less

**Exceptions:**
- Breaches of confidentiality (Sec. 7)
- IP infringement (Sec. 6)
- Gross negligence/willful misconduct

### 11.2 Excluded Damages

Neither party liable for:
- Lost profits
- Lost revenue
- Indirect damages
- Consequential damages
- Punitive damages

---

## 12. GENERAL PROVISIONS

### 12.1 Entire Agreement

This document is the complete agreement. Prior discussions, proposals, and emails are superseded.

### 12.2 Amendments

Changes must be in writing and signed by both parties. Email confirmation acceptable.

### 12.3 Governing Law

Agreement governed by laws of **[State]** without regard to conflicts of law.

### 12.4 Dispute Resolution

1. **Negotiation** (30 days): Good faith discussion between parties
2. **Mediation** (30 days): Non-binding mediation with neutral third party (costs split 50/50)
3. **Litigation**: Small claims or court in [County/State] jurisdiction

**Prevailing Party:** Entitled to reasonable attorney fees

### 12.5 Severability

If any provision is invalid, remaining provisions stay in effect.

### 12.6 Assignment

- **Developer:** Cannot assign without written consent
- **Client:** May assign freely (including to acquirer/successor)

### 12.7 Independent Contractor Tax

Developer responsible for:
- Self-employment taxes (Social Security, Medicare)
- Federal and state income taxes
- Business licenses and permits

**Form 1099-NEC:** Client will issue if payments exceed $600 in calendar year

### 12.8 No Benefits

Developer not entitled to:
- Health insurance
- Retirement benefits
- Paid time off
- Unemployment insurance
- Workers' compensation

---

## 13. SPECIAL PROVISIONS (Startup-Friendly)

### 13.1 Equity Option (Optional)

Client may offer Developer option to purchase equity:
- **Typical Grant:** 0.25-0.5% of company
- **Vesting:** 1-year cliff, 4-year total (standard)
- **Exercise Price:** FMV at grant (startup board approval)
- **Details:** Separate option agreement

*Note: Not required for engagement*

### 13.2 Rate Increase Opportunity

Rate increases possible after consistent successful sprints:
- After 3 consecutive sprints completed successfully: Rate review to **$30/hr**
- After 6 consecutive sprints completed successfully: Rate review to **$35/hr**
- "Successful sprint" = All tasks + tests + evals passed, no revisions needed

### 13.3 Referral Bonus

If Developer refers another contractor who is hired:
- Developer receives **$500 referral bonus** when contractor starts
- Additional **$500** if contractor completes 4-week trial
- Max: Limited to 2 referrals per Developer

### 13.4 Portfolio Rights

Developer may:
- Show project in portfolio (with Client's logo/permission)
- Discuss project in case study on own website
- List as professional experience on resume
- Share GitHub link (if public)

**Exception:** Don't reveal business metrics, financial data, or customer lists

---

## 14. SIGNATURES

**This Agreement is legally binding. Both parties should consult legal counsel before signing.**

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

### DEVELOPER SIGNATURE

**Full Name (Print):**  
_________________________________

**Signature:**  
_________________________________

**Date:**  
_________________________________

**Email:**  
_________________________________

---

## EXHIBIT A: PROJECT SPECIFICATIONS

### A.1 Technology Stack

**Frontend:**
- React Native / Expo
- TypeScript
- Redux or Context API for state management

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL or similar database
- OpenAI API integration

**Deployment:**
- Mobile: Expo (dev) / App Store + Google Play (production)
- Backend: [Cloud provider - AWS/GCP/Heroku/Railway]

### A.2 Initial Project Scope

**Each Sprint (Standard Structure):**
- Features as defined in specific sprint SOW
- Unit tests (>70% coverage minimum)
- Evaluation suite run with passing scores
- Code quality standards met
- Application runs successfully
- Demo or live demonstration
- All acceptance criteria met

**Payment contingent on ALL above being complete before any funds released.**

### A.3 Acceptance Criteria (General)

Each sprint deliverable must meet:
1. ✅ Functional - Works for happy path
2. ✅ Documented - README/comments explain features
3. ✅ Tested - >70% code coverage for new code
4. ✅ Clean - Follows agreed code style
5. ✅ Committed - Logical git history

### A.4 Weekly Deliverables Template

**Week $[N]:** [Sprint Theme]

**Estimated Hours:** 15 hours

**Deliverables:**
- [ ] [Feature A] - estimated X hours
- [ ] [Feature B] - estimated Y hours
- [ ] Tests for above - estimated Z hours
- [ ] Documentation/demo - estimated 1 hour

**Acceptance Criteria:**
- [ ] Code merged to main
- [ ] Tests pass (>70% coverage)
- [ ] Demo video or live demo
- [ ] No critical bugs

---

## APPENDIX: WEEKLY TIMESHEET TEMPLATE

**Week of:** [Date]

| Day | Task | Hours | Description |
|-----|------|-------|-------------|
| Mon | API development | 3 | Implemented user registration endpoint |
| Tue | Mobile UI | 3 | Built registration screens |
| Wed | Testing | 3 | Unit tests for auth logic |
| Thu | Integration | 3 | Connected mobile to backend |
| Fri | Review | 2 | Code review and demo |
| **Total** | | **15** | |

**Git Commits:**
- [Link to PR or commits]

**Demo Video:**
- [Link to Loom/YouTube]

**Notes:**
- [Any blockers, questions, or async decisions made]

**Submitted By:** [Developer]  
**Date:** [Date]

---

## FINAL NOTES FOR BOTH PARTIES

**For Client:**
1. This agreement is founder-friendly while remaining fair to Developer
2. Rate reflects startup/early-stage phase ($25/hr) - good value for building quality code
3. Weekly deliverables create accountability
4. Payment is quick/easy to motivate good work
5. Recommend providing clear feedback quickly

**For Developer:**
1. This engagement offers genuine learning and experience
2. Startup environment teaches real product development
3. Potential for equity and rate increases
4. Portfolio opportunity for future roles
5. Work arrangement is flexible (remote-friendly)

**For Both:**
1. Communication is key - flag issues early
2. Weekly planning prevents misalignment
3. Trust-based relationship works better than prescriptive
4. This is startup pace - scope will change
5. Have difficult conversations early

---

**Document Version:** 1.1  
**Status:** Ready for Signature  
**Last Updated:** February 7, 2026
