# Telehealth App - Issues & Tasks

## Issue #1: Migrate Backend to Cloud Infrastructure
**Priority:** High  
**Status:** Not Started  
**Type:** Infrastructure  

### Description
The backend is currently running locally. We need to move it to a remote cloud-hosted environment for production readiness and continuous availability.

### Requirements
- [ ] Choose cloud provider (AWS, Azure, GCP, Heroku, Render, etc.)
- [ ] Set up cloud infrastructure (database, server, environment)
- [ ] Configure CI/CD pipeline for automated deployments
- [ ] Update backend connection URLs in mobile app
- [ ] Set up environment variables for cloud endpoints
- [ ] Configure CORS and security for cloud backend
- [ ] Test end-to-end integration with cloud backend
- [ ] Document deployment process

### Acceptance Criteria
- Backend API is accessible from a public URL
- Mobile app successfully connects to cloud backend
- All API endpoints function correctly
- Environment properly switches between dev/staging/prod

### Notes
- Consider using Render (already in render.yaml), AWS Lambda, or Firebase Functions
- Ensure database migrations are handled during deployment

---

## Issue #2: Implement Persistent Authentication
**Priority:** High  
**Status:** Not Started  
**Type:** Feature - Auth  

### Description
User login state should persist even after the app is closed and reopened, or if the process is killed. Currently, authentication is lost.

### Requirements
- [ ] Implement local secure token storage (AsyncStorage with encryption)
- [ ] Add token refresh mechanism
- [ ] Implement auto-login on app launch
- [ ] Handle expired tokens gracefully
- [ ] Add logout functionality that clears stored credentials
- [ ] Implement biometric unlock support (optional enhancement)
- [ ] Add session timeout with warning

### Acceptance Criteria
- User login persists across app restarts
- Killing the app process does not clear authentication
- Expired tokens are automatically refreshed
- User is redirected to login only when necessary
- Sensitive data is encrypted in local storage

### Technical Approach
- Use `@react-native-async-storage/async-storage` for token storage
- Implement secure storage with react-native-sensitive-info
- Add token refresh logic in API interceptor

### Notes
- Consider refresh token rotation
- Implement secure logout with token revocation

---

## Issue #3: Add Multilingual Support (i18n)
**Priority:** High  
**Status:** Not Started  
**Type:** Feature - Localization  

### Description
Enable the app to support multiple languages: English, French, and Darija (Moroccan Arabic). This requires comprehensive i18n implementation.

### Languages
- [x] English (default)
- [ ] French (Français)
- [ ] Darija (Moroccan Arabic - Darija/دارجة)

### Requirements
- [ ] Set up i18n framework (react-i18next or similar)
- [ ] Create translation files for all UI strings
- [ ] Implement language selection screen/setting
- [ ] Persist user language preference
- [ ] Support RTL layout for Arabic
- [ ] Translate all screens:
  - [ ] Auth screens (Login, Register)
  - [ ] Doctor screens (Dashboard, Patient Details, Video Call)
  - [ ] Patient screens (Home, Triage, Insights, Video Call)
  - [ ] Common components (navigation, modals, alerts)
- [ ] Translate backend messages/alerts
- [ ] Add language switcher in settings
- [ ] Test text rendering for each language

### Acceptance Criteria
- Users can select preferred language in app
- All UI text is translated to selected language
- RTL support works correctly for Arabic
- Language preference persists across sessions
- Date/time formatting respects locale

### Technical Approach
- Use `react-i18next` and `i18next`
- Create JSON translation files in `src/i18n/translations/`
- Add RTL support with `react-native-rtl`
- Implement language detection and switching

### Notes
- Darija translations may require human review for colloquial accuracy
- Consider accessibility (TTS) for different languages

---

## Issue #4: Locate and Fix Bugs
**Priority:** High  
**Status:** Not Started  
**Type:** Bug Track  

### Description
Identify, document, and fix bugs across the application. This is an ongoing task that requires systematic testing and bug reporting.

### Sub-tasks
- [ ] Run test suite and fix failing tests
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Perform manual testing on different devices
- [ ] Review console logs for errors/warnings
- [ ] Check API error handling
- [ ] Validate form inputs
- [ ] Test video call functionality
- [ ] Test biometric data entry and storage
- [ ] Verify authentication flows
- [ ] Check state management for race conditions

### Known Issues (To Investigate)
- [ ] Server startup issues (review exit codes in terminal history)
- [ ] Port conflicts on local development

### Acceptance Criteria
- No critical errors in console
- All manual tests pass
- API error responses handled gracefully
- Error tracking implemented and monitoring

### Technical Approach
- Review test files in `backend/src/__tests__/` and `mobile/src/`
- Add Sentry integration for production error tracking
- Implement comprehensive error boundaries in mobile app
- Add proper error logging in backend

---

## Issue #5: Tablet UI Testing & Optimization
**Priority:** Medium  
**Status:** Not Started  
**Type:** QA/Testing  

### Description
Test and optimize the UI across various tablet devices and screen sizes to ensure responsive design and usability.

### Requirements
- [ ] Test on iPad (multiple sizes: 7.9", 10.2", 10.9", 12.9")
- [ ] Test on Android tablets (various screen densities)
- [ ] Verify responsive layout at different orientations
- [ ] Test touch interactions and gestures
- [ ] Verify video call UI works on larger screens
- [ ] Check navigation usability on tablets
- [ ] Test form input on tablets
- [ ] Optimize spacing and font sizes for tablets
- [ ] Test accessibility features on tablets

### Devices to Test
- [ ] iPad Mini (8.3")
- [ ] iPad (10.2")
- [ ] iPad Air (10.9")
- [ ] iPad Pro (12.9")
- [ ] Samsung Galaxy Tab S7+ (12.4")
- [ ] Lenovo Tab P12 (12.6")

### Acceptance Criteria
- UI layout is responsive and readable on all tablet sizes
- No horizontal scrolling on any tablet size
- Video call interface is usable on tablets
- Touch targets maintain minimum 44x44pt size
- Orientation changes work smoothly
- Performance is acceptable on mid-range tablets

### Testing Steps
1. Build app for tablet devices
2. Test each screen across different tablet sizes
3. Document any layout issues found
4. Create responsive layout fixes
5. Regression test after fixes

### Technical Approach
- Use Dimensions API to detect tablet screens
- Implement max-width constraints for large screens
- Test with React Native's tablet emulators
- Consider tablet-specific UI variants for some screens

---

## Tracking & Labels

### Priority Levels
- **Critical:** Blocks deployment/core functionality broken
- **High:** Important feature/bug affecting user experience
- **Medium:** Nice-to-have or non-blocking issues
- **Low:** Minor improvements, can be deferred

### Types
- **Feature:** New functionality to add
- **Bug:** Existing issue to fix
- **Infrastructure:** DevOps, deployment, environment
- **QA/Testing:** Testing, validation, quality assurance
- **Auth:** Authentication and security related
- **Localization:** i18n and language support

### Status
- **Not Started:** Not yet begun
- **In Progress:** Currently being worked on
- **In Review:** Awaiting review/approval
- **Done:** Completed and merged
- **Blocked:** Waiting on dependency or external factor

---

## Quick Reference

| Issue | Priority | Type | Dependencies |
|-------|----------|------|---------------|
| #1 - Cloud Backend | High | Infrastructure | - |
| #2 - Persistent Auth | High | Auth | #1 (partial) |
| #3 - Multilingual Support | High | Feature | #2 (not blocking) |
| #4 - Locate & Fix Bugs | High | Bug | Continuous |
| #5 - Tablet UI Testing | Medium | QA/Testing | All other features |

---

## How to Use This Document

1. Update the Status field as work progresses
2. Check off sub-tasks as they're completed
3. Add notes and blockers as you discover them
4. Link to pull requests/commits when fixing issues
5. Update dates when issues are started/completed
