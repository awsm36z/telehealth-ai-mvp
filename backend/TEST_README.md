# 🧪 TeleHealth AI - Test Suite Documentation

## Test Coverage

### Backend Tests

#### 1. **Patients API Tests** (`src/routes/__tests__/patients.test.ts`)
Tests all biometric-related endpoints and data management.

**Coverage:**
- ✅ POST /api/patients/:id/biometrics - Save biometric data
  - Valid complete data
  - Partial data
  - Missing data (error handling)
  - Multiple patients (data isolation)
  - Extreme values
  - Unit preservation
- ✅ GET /api/patients/:id/biometrics - Retrieve biometric data
  - Saved data retrieval
  - Non-existent patient (returns null)
- ✅ GET /api/patients/:id - Complete patient data
  - Profile, biometrics, insights, transcript
  - Non-existent patient (404)
- ✅ GET /api/patients/queue - Patient queue
  - Queue listing

**Test Count:** 13 tests

#### 2. **Triage API Tests** (`src/routes/__tests__/triage.test.ts`)
Tests AI-powered triage conversation and insights generation.

**Coverage:**
- ✅ POST /api/triage/chat - Triage conversation
  - Initial message processing
  - Context maintenance across messages
  - Missing messages (error handling)
  - Invalid format (error handling)
  - OpenAI API integration (skipped if no API key)
- ✅ POST /api/triage/insights - Insights generation
  - Insights from conversation
  - Missing messages (error handling)

**Test Count:** 6 tests (4 skipped without API key)

#### 3. **Auth API Tests** (`src/routes/__tests__/auth.test.ts`)
Tests authentication and authorization.

**Coverage:**
- ✅ POST /api/auth/register - User registration
  - Patient registration
  - Doctor registration
  - Missing fields (error handling)
  - Invalid userType
  - Duplicate email
- ✅ POST /api/auth/login - User login
  - Correct credentials
  - Incorrect password
  - Non-existent email
  - Missing fields
  - Wrong userType
- ✅ Security Tests
  - Password not in response
  - JWT token generation

**Test Count:** 14 tests

#### 4. **Integration Tests** (`src/__tests__/integration.test.ts`)
End-to-end flow tests for complete patient journey.

**Coverage:**
- ✅ Patient Registration and Login
- ✅ AI Triage Conversation (multi-turn)
- ✅ Biometric Entry (comprehensive data)
- ✅ AI Insights Generation
- ✅ Doctor View (complete patient data)
- ✅ Data Persistence and Isolation
- ✅ Error Handling
- ✅ Performance Tests

**Test Count:** 13 tests (2 skipped without API key)

---

## Running Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run Specific Test Suite
```bash
npm test patients.test.ts
npm test triage.test.ts
npm test auth.test.ts
npm test integration.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

### Run Only Fast Tests (Skip API-dependent)
```bash
npm test -- --testPathIgnorePatterns=integration
```

---

## Test Configuration

**Framework:** Jest + TypeScript
**HTTP Testing:** Supertest
**Test Timeout:** 10 seconds (20s for API calls)
**Coverage Target:** 80%+

### Environment Variables
```bash
# Optional: For AI-dependent tests
OPENAI_API_KEY=sk-your-key-here
```

Tests that require OpenAI API will be skipped if the key is not provided, allowing tests to run in CI/CD without API credits.

---

## Test Statistics

**Total Tests:** 46
**Unit Tests:** 33
**Integration Tests:** 13
**Performance Tests:** 2

**Coverage Areas:**
- ✅ Biometric data management
- ✅ AI triage conversations
- ✅ Authentication & authorization
- ✅ Insights generation
- ✅ Patient data retrieval
- ✅ Error handling
- ✅ Data isolation
- ✅ Security (JWT, password hashing)
- ✅ API performance

---

## Adding New Tests

### 1. Unit Test Template
```typescript
import request from 'supertest';
import express from 'express';
import yourRouter from '../your-route';

const app = express();
app.use(express.json());
app.use('/api/your-route', yourRouter);

describe('Your Feature', () => {
  it('should do something', async () => {
    const response = await request(app)
      .get('/api/your-route')
      .expect(200);

    expect(response.body).toHaveProperty('expectedField');
  });
});
```

### 2. Integration Test Template
```typescript
describe('Feature Flow', () => {
  it('should complete the flow', async () => {
    // Step 1
    const step1 = await request(app).post('/api/step1').send(data);

    // Step 2 using result from step 1
    const step2 = await request(app)
      .get(`/api/step2/${step1.body.id}`)
      .expect(200);

    expect(step2.body).toMatchObject(expectedResult);
  });
});
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
      - run: cd backend && npm test -- --coverage
```

---

## Best Practices

1. **Isolation:** Each test should be independent
2. **Cleanup:** Tests should not affect each other
3. **Fast:** Unit tests should run quickly (<100ms)
4. **Descriptive:** Test names should clearly describe what they test
5. **Coverage:** Aim for 80%+ code coverage
6. **Mocking:** Use mocks for external dependencies when appropriate

---

## Known Limitations

1. **In-Memory Storage:** Tests use in-memory storage instead of database
2. **API Key Required:** Some tests need OpenAI API key (auto-skipped if missing)
3. **No Database:** Tests don't test database interactions (will need updating when DB is added)
4. **No WebSocket Tests:** Video call WebSocket functionality not tested yet

---

## Future Test Additions

### Planned Tests
- [ ] Video call integration tests (Daily.co)
- [ ] WebSocket connection tests
- [ ] Database integration tests
- [ ] Load testing (stress tests)
- [ ] Security penetration tests
- [ ] Frontend component tests (React Native)
- [ ] E2E tests with mobile simulator

### Test Coverage Goals
- Backend API: 80%+ ✅ (Current)
- Business Logic: 90%+
- Critical Paths: 100%
