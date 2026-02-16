# Implementation Plan: Issues #36, #35, #31/#32

## Issue #36: Patient Not Showing in Doctor's Queue

### Root Cause Analysis

I traced the full flow from patient registration through triage to the waiting room and the doctor's dashboard. Here's what happens:

1. **Patient registers** -> `auth.ts` creates user with `id = (users.length + 1).toString()` and stores in `patientProfiles[user.id]`
2. **Patient does triage** -> `TriageChatScreen` sends `patientId` (from AsyncStorage `userId`) to `triage.ts`, which stores `patientInsights[patientId]` and `patientTriageData[patientId]`
3. **Patient enters waiting room** -> `WaitingRoomScreen` calls `api.createVideoRoom(userId)` which creates a room in `activeCalls` with `patientId` and `status: 'waiting'`
4. **Doctor's dashboard** -> Fetches `/api/patients/queue` (builds from `activeCalls`) AND `/api/video/active-calls`

The backend `patients/queue` endpoint already correctly builds the queue from `activeCalls` — it iterates active/waiting calls and enriches them with profile data. The doctor dashboard also correctly filters `patientsForDisplay` by `activePatientIds`.

**The actual bug**: The `create-room` endpoint in `video.ts` stores `call.patientId = req.body.patientId`. The WaitingRoomScreen reads `userId` from AsyncStorage. But when the backend server restarts (which happens frequently during development), the in-memory `users` array resets, so `users.length + 1` starts over at `"1"` for newly registered users. However, there's already a hardcoded profile for ID `"1"` (Sarah Johnson). This means:

- If the server restarts and a user re-registers, they get a new ID, but their old AsyncStorage still has the old ID
- More critically: the `activeCalls` storage is also reset on server restart, so any rooms the patient created before are gone

**The real problem** is likely a **timing/data flow issue**: The patient creates a room (stored in `activeCalls`), but the doctor's queue depends on BOTH `activeCalls` having the entry AND the `patientProfiles` having the patient. If the patient registered on a previous server session, `patientProfiles` won't have them (it resets to just the hardcoded Sarah Johnson entry).

**Fix**: The `patients/queue` endpoint should not depend on `patientProfiles` for showing patients. It already mostly works (it falls back to `Patient ${patientId}`) but there could be filtering issues. The linter already improved the queue endpoint to use `activeCalls` as the source of truth.

However, there's another subtle issue: when `DATA_STORE_MODE=postgres` is set, the storage is persisted. But without it, everything is in-memory. The real fix needs to ensure that when a patient creates a room, the patient's profile data is also available for the doctor. The fix should:

1. **Ensure `create-room` also stores/updates the patient profile** if it doesn't exist yet — pull profile data from the registration or store a minimal profile
2. **Ensure the `triageChat` endpoint stores the patient profile** when it has a `patientId` — it already stores triage data and insights, but should also ensure the profile exists

### Implementation Steps

1. In `video.ts` `create-room` endpoint: After creating the room, ensure a minimal `patientProfiles` entry exists for the patient
2. In `triage.ts`: When triage completes with a `patientId`, ensure `patientProfiles[patientId]` exists (create a minimal one if not)
3. Add a debug log in the queue endpoint so we can verify the flow

---

## Issue #35: Expo Upgrade to v54

### Current State
- Expo SDK 50 (`expo: ~50.0.0`)
- React Native 0.73.6
- React 18.2.0

### Upgrade Path (per issue: one version at a time)
- 50 → 51 → 52 → 53 → 54

### Approach
Use `npx expo install expo@^XX --fix` for each version jump. This auto-fixes compatible dependency versions. Then run `npx expo-doctor` to check for issues.

### Key Breaking Changes to Watch For
- **SDK 51**: New architecture opt-in, React Native 0.74, expo-camera v15
- **SDK 52**: React Native 0.76, New Architecture default, expo-splash-screen changes
- **SDK 53**: React Native 0.77, further deprecations
- **SDK 54**: Latest, React Native 0.78+

### Implementation Steps
1. Upgrade 50→51: `npx expo install expo@^51 --fix`, fix breakages, verify builds
2. Upgrade 51→52: Same process
3. Upgrade 52→53: Same process
4. Upgrade 53→54: Same process
5. After each step: `npx expo-doctor`, fix any flagged issues
6. Final verification: ensure the app starts on simulator

---

## Issues #31/#32: Add Multilingual Support (i18n)

### Languages
- English (default)
- French (Français)
- Darija (Moroccan Arabic - دارجة)

### Technical Approach for a Medical App

For a healthcare application, i18n requires extra care:
- **Medical terminology** must be accurately translated — mistranslation could lead to patient harm
- **RTL support** for Darija (Arabic script) requires layout mirroring
- **Regulatory compliance** — medical disclaimers must be translated accurately
- **Emergency content** (911 instructions) must be locale-appropriate

### Library Choice: `react-i18next` + `i18next`
- Industry standard, well-maintained
- Built-in pluralization, interpolation, namespacing
- React Native compatible
- `expo-localization` for device language detection

### Implementation Steps

1. **Install dependencies**: `i18next`, `react-i18next`, `expo-localization`
2. **Create i18n config** at `src/i18n/index.ts`
3. **Create translation files**:
   - `src/i18n/translations/en.json` (English)
   - `src/i18n/translations/fr.json` (French)
   - `src/i18n/translations/ar.json` (Darija/Arabic)
4. **Wrap app in I18nextProvider**
5. **Add language switcher** to Settings/Profile screens
6. **Persist language preference** in AsyncStorage
7. **RTL support**: Use `I18nManager` from React Native for Arabic
8. **Replace all hardcoded strings** across screens with `t()` calls
9. **Translate backend messages** (error responses, AI system prompts — but NOT the AI conversation itself, which should remain in the patient's language)

### Screens to Translate (in priority order)
1. LoginScreen, RegisterScreen (patient onboarding)
2. PatientHomeScreen (main patient view)
3. TriageChatScreen (critical — medical context)
4. BiometricEntryScreen (medical terms)
5. InsightsScreen, WaitingRoomScreen
6. ProfileScreen, HistoryScreen
7. DoctorDashboardScreen, DoctorProfileScreen
8. PatientDetailsScreen, DoctorVideoCallScreen

### RTL Considerations
- Darija uses Arabic script → RTL layout
- `I18nManager.forceRTL(true)` when Arabic is selected
- May require app restart for full RTL to take effect
- Test all layouts in RTL mode
