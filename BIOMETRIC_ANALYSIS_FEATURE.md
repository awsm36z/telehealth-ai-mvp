# AI Biometric Analysis Feature

## Overview
The AI triage chat now analyzes patient biometrics before asking symptom questions. When a patient starts a triage session, the AI will:

1. Check if the patient has entered biometrics
2. If biometrics exist, analyze them as a medical professional would
3. Provide a brief clinical assessment noting any concerning values
4. Then ask "What brings you here today?"

## How It Works

### Flow
1. **Patient enters biometrics** (BiometricEntryScreen)
   - Blood pressure, heart rate, temperature, pain level, etc.
   - Saved to backend: `POST /api/patients/:id/biometrics`

2. **Patient starts triage chat** (TriageChatScreen)
   - Screen loads and makes initial API call
   - Sends special `__INITIAL_GREETING__` message with patientId

3. **Backend analyzes biometrics**
   - Fetches biometrics for the patient
   - Formats vital signs for AI analysis
   - AI generates personalized greeting with clinical assessment

4. **Patient receives contextualized greeting**
   - If biometrics exist: AI acknowledges vitals and notes concerns
   - If no biometrics: Standard greeting
   - Then conversation proceeds normally

### Example Greetings

**With Normal Biometrics:**
```
Hello! I've reviewed your vital signs - your blood pressure (120/80), heart rate (72 bpm), and temperature (98.6°F) are all within normal ranges. What brings you here today?
```

**With Concerning Biometrics:**
```
Hello! I've reviewed your biometric readings. I notice your temperature is elevated at 101.5°F, and your pain level is 7/10, which indicates you're experiencing significant discomfort. What brings you here today?
```

**Without Biometrics:**
```
Hello! I'm here to help understand your symptoms. Let's start with a simple question: What brings you here today?
```

## Technical Implementation

### Backend Changes

#### 1. Shared Storage Module
**File:** `backend/src/storage/index.ts`
- Centralized in-memory storage for biometrics, profiles, and triage sessions
- Allows data sharing between routes

#### 2. Triage Route Updates
**File:** `backend/src/routes/triage.ts`

**New Function:**
```typescript
formatBiometrics(biometrics: any): string
```
Formats biometric data into human-readable format for AI analysis.

**Enhanced Endpoint:**
```typescript
POST /api/triage/chat
```
- Accepts `patientId` parameter
- Handles `__INITIAL_GREETING__` special message
- Fetches and analyzes biometrics if available
- Returns personalized greeting

**Request Body:**
```json
{
  "messages": [{ "role": "user", "content": "__INITIAL_GREETING__" }],
  "patientId": "1"
}
```

**Response:**
```json
{
  "message": "Hello! I've reviewed your vital signs...",
  "complete": false,
  "sessionId": "1234567890"
}
```

### Mobile App Changes

#### 1. API Client Update
**File:** `mobile/src/utils/api.ts`
- `triageChat` now accepts optional `patientId` parameter

#### 2. Triage Screen Update
**File:** `mobile/src/screens/patient/TriageChatScreen.tsx`

**New Behavior:**
- Fetches initial greeting on component mount via `fetchInitialGreeting()`
- Shows "Analyzing your health data..." loading state
- Passes `patientId: '1'` (demo patient) to API

**New State:**
```typescript
const [isLoading, setIsLoading] = useState(true);
```

## Testing

### Manual Testing in Simulator

1. **Enter Biometrics First:**
   ```
   - Navigate to "Enter Biometrics"
   - Fill in values (especially temperature, heart rate, pain level)
   - Save biometrics
   ```

2. **Start Triage Chat:**
   ```
   - Go back to home
   - Tap "Start AI Triage"
   - Observe the initial greeting
   - Should mention the biometric values you entered
   ```

3. **Test Without Biometrics:**
   ```
   - Clear app data or use different patient ID
   - Start triage without entering biometrics
   - Should see standard greeting
   ```

### Automated Tests

**File:** `backend/src/routes/__tests__/triage-biometrics.test.ts`

**Test Coverage:**
- ✅ Standard greeting when no biometrics exist
- ✅ Biometric analysis with concerning values (requires API key)
- ✅ Biometric analysis with normal values (requires API key)
- ✅ Data isolation between patients

**Run Tests:**
```bash
cd backend
npm test triage-biometrics.test.ts
```

**With OpenAI API Key:**
```bash
OPENAI_API_KEY=your-key npm test triage-biometrics.test.ts
```

## Files Modified

### Backend
- `backend/src/storage/index.ts` (new)
- `backend/src/routes/triage.ts` (modified)
- `backend/src/routes/patients.ts` (modified - uses shared storage)
- `backend/src/routes/__tests__/triage-biometrics.test.ts` (new)

### Mobile
- `mobile/src/utils/api.ts` (modified)
- `mobile/src/screens/patient/TriageChatScreen.tsx` (modified)

## Future Enhancements

### Authentication Integration
Currently uses hardcoded `patientId: '1'`. Should be replaced with:
```typescript
const { user } = useAuth(); // From AuthContext
const patientId = user?.id;
```

### Database Integration
Replace in-memory storage with persistent database:
- PostgreSQL or MongoDB
- Proper data persistence
- Multi-user support

### Enhanced Analysis
- Trend analysis (compare with previous biometrics)
- Risk scoring based on vital sign combinations
- Automated red flag detection (emergency values)

### UI Improvements
- Show biometric values in chat interface
- Visual indicators for concerning values
- Option to update biometrics during chat

## Known Limitations

1. **Demo Patient ID:** Currently hardcoded to '1'
2. **In-Memory Storage:** Data lost on server restart
3. **No Authentication:** Patient ID should come from auth context
4. **Single Session:** Biometrics are global per patient, not per session

## API Documentation

### POST /api/triage/chat

**Purpose:** Start or continue triage conversation

**Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "message text" }
  ],
  "patientId": "string (optional)",
  "sessionId": "string (optional)"
}
```

**Special Messages:**
- `__INITIAL_GREETING__`: Triggers biometric analysis and initial greeting

**Response:**
```json
{
  "message": "AI response text",
  "complete": false,
  "sessionId": "session-id"
}
```

## Debugging

**Backend Logs:**
```
🔑 OpenAI API Key loaded: sk-proj-...
✅ Saved biometrics for patient 1: { ... }
POST /api/triage/chat 200 1672.240 ms
```

**Mobile Logs:**
```
📤 Sending triage request to: http://localhost:3000/api/triage/chat
✅ Triage response received: { message: "...", complete: false }
```

**Common Issues:**

1. **"What brings you here today?" without biometrics:**
   - Check if biometrics were saved for patient ID '1'
   - Verify backend has access to shared storage
   - Check backend logs for biometric data

2. **Loading indefinitely:**
   - Check backend is running on port 3000
   - Verify OpenAI API key is set
   - Check mobile app can reach backend

3. **Generic error message:**
   - Check OpenAI API key is valid
   - Verify backend logs for errors
   - Ensure network connection is stable
