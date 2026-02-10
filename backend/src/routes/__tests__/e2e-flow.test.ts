import request from 'supertest';
import express from 'express';
import authRoutes from '../auth';
import triageRoutes from '../triage';
import insightsRoutes from '../insights';
import patientsRoutes from '../patients';
import videoRoutes from '../video';
import consultationsRoutes from '../consultations';
import aiAssistRoutes from '../ai-assist';
import {
  patientBiometrics,
  patientProfiles,
  triageSessions,
  patientInsights,
  patientTriageData,
  consultationNotes,
} from '../../storage';

// Mock OpenAI for triage and AI assist
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockImplementation(({ messages }) => {
          const lastMessage = messages[messages.length - 1];
          const content = lastMessage?.content || '';

          // If it's an initial greeting with biometrics
          if (content.includes('PATIENT BIOMETRICS')) {
            return {
              choices: [{
                message: {
                  content: "Hello! I've reviewed your vitals. Your blood pressure is 120/80 mmHg which is normal, and your heart rate is 72 bpm. What brings you here today?",
                },
              }],
            };
          }

          // If it's a triage question (system prompt mentions triage)
          const systemContent = messages[0]?.content || '';
          if (systemContent.includes('medical triage assistant')) {
            // Count user messages to decide when to complete
            const userMessages = messages.filter((m: any) => m.role === 'user');
            if (userMessages.length >= 3) {
              return {
                choices: [{
                  message: {
                    content: "Thank you for sharing all this information. I'll connect you with a doctor now who can help you further. [TRIAGE_COMPLETE]",
                  },
                }],
              };
            }
            return {
              choices: [{
                message: {
                  content: 'How long have you been experiencing these symptoms?',
                },
              }],
            };
          }

          // If it's an insights generation request
          if (content.includes('clinical decision support')) {
            return {
              choices: [{
                message: {
                  content: JSON.stringify({
                    summary: 'Patient presents with sore throat and mild fever for 3 days.',
                    keyFindings: [
                      'Sore throat for 3 days',
                      'Mild fever (100.4°F)',
                      'No difficulty breathing',
                    ],
                    possibleConditions: [
                      {
                        name: 'Pharyngitis',
                        description: 'Throat inflammation consistent with symptoms',
                        confidence: 'High',
                      },
                      {
                        name: 'Upper Respiratory Infection',
                        description: 'Common presentation with these symptoms',
                        confidence: 'Medium',
                      },
                    ],
                    nextSteps: [
                      'Assess throat for redness/swelling',
                      'Consider rapid strep test',
                      'Review medication allergies',
                    ],
                  }),
                },
              }],
            };
          }

          // AI assist question from doctor
          if (content.includes('common complications')) {
            return {
              choices: [{
                message: {
                  content: 'For pharyngitis, common complications include peritonsillar abscess, rheumatic fever (if strep), and post-streptococcal glomerulonephritis. Consider rapid strep test per AHA guidelines.',
                },
              }],
            };
          }

          return {
            choices: [{
              message: { content: 'Mock AI response' },
            }],
          };
        }),
      },
    },
  }));
});

// Build the full Express app
function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/triage', triageRoutes);
  app.use('/api/insights', insightsRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/video', videoRoutes);
  app.use('/api/consultations', consultationsRoutes);
  app.use('/api/ai-assist', aiAssistRoutes);
  return app;
}

describe('End-to-End Flow Testing', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    // Clear all storage between tests
    Object.keys(patientBiometrics).forEach(k => delete patientBiometrics[k]);
    Object.keys(triageSessions).forEach(k => delete triageSessions[k]);
    Object.keys(patientInsights).forEach(k => delete patientInsights[k]);
    Object.keys(patientTriageData).forEach(k => delete patientTriageData[k]);
    Object.keys(consultationNotes).forEach(k => delete consultationNotes[k]);
    // Keep default profile but clean triageData
    Object.keys(patientProfiles).forEach(k => {
      if (k !== '1') delete patientProfiles[k];
    });
  });

  // ============================================================
  // 1. Patient Registration & Login
  // ============================================================
  describe('Step 1: Patient Registration & Login', () => {
    it('should register a new patient', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Patient',
          email: 'test@example.com',
          password: 'password123',
          phone: '555-0100',
          userType: 'patient',
          dateOfBirth: '1990-01-15',
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.fullName).toBe('Test Patient');
      expect(res.body.user.type).toBe('patient');
    });

    it('should prevent duplicate registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Patient',
          email: 'dupe@example.com',
          password: 'password123',
          phone: '555-0100',
          userType: 'patient',
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test Patient',
          email: 'dupe@example.com',
          password: 'password123',
          phone: '555-0100',
          userType: 'patient',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });

    it('should login with correct credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Login Test',
          email: 'login@example.com',
          password: 'password123',
          phone: '555-0101',
          userType: 'patient',
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
          userType: 'patient',
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrong',
          userType: 'patient',
        });

      expect(res.status).toBe(401);
    });

    it('should register a doctor', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Dr. Martinez',
          email: 'doctor@example.com',
          password: 'password123',
          phone: '555-0200',
          userType: 'doctor',
          licenseNumber: 'MD-12345',
        });

      expect(res.status).toBe(201);
      expect(res.body.user.type).toBe('doctor');
    });
  });

  // ============================================================
  // 2. Patient Biometrics Entry
  // ============================================================
  describe('Step 2: Patient Biometrics Entry', () => {
    it('should save patient biometrics', async () => {
      const biometricData = {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        temperature: 100.4,
        temperatureUnit: 'F',
        bloodOxygen: 98,
        respiratoryRate: 16,
        weight: 150,
        weightUnit: 'lbs',
        painLevel: 4,
        notes: 'Feeling feverish since yesterday',
      };

      const res = await request(app)
        .post('/api/patients/1/biometrics')
        .send(biometricData);

      expect(res.status).toBe(200);
      expect(res.body.data.heartRate).toBe(72);
      expect(res.body.data.patientId).toBe('1');
    });

    it('should retrieve saved biometrics', async () => {
      patientBiometrics['1'] = {
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        patientId: '1',
      };

      const res = await request(app).get('/api/patients/1/biometrics');
      expect(res.status).toBe(200);
      expect(res.body.heartRate).toBe(72);
    });

    it('should reject empty biometrics', async () => {
      const res = await request(app)
        .post('/api/patients/1/biometrics')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // 3. AI Triage Chat Flow
  // ============================================================
  describe('Step 3: AI Triage Chat', () => {
    it('should return initial greeting with biometric analysis', async () => {
      // First save biometrics
      patientBiometrics['1'] = {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
        temperature: 100.4,
        temperatureUnit: 'F',
      };

      const res = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId: '1',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      expect(res.body.complete).toBe(false);
      expect(res.body.sessionId).toBeDefined();
      // AI should reference biometrics
      expect(res.body.message.toLowerCase()).toContain('blood pressure');
    });

    it('should return default greeting without biometrics', async () => {
      const res = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId: '1',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('What brings you here today');
    });

    it('should continue triage conversation', async () => {
      const res = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat' },
          ],
          patientId: '1',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      expect(res.body.complete).toBe(false);
    });

    it('should complete triage after enough questions', async () => {
      const res = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat' },
            { role: 'ai', content: 'How long have you been experiencing this?' },
            { role: 'user', content: '3 days' },
            { role: 'ai', content: 'Any fever?' },
            { role: 'user', content: 'Yes, mild fever around 100°F' },
          ],
          patientId: '1',
        });

      expect(res.status).toBe(200);
      expect(res.body.complete).toBe(true);
      // Should not contain the tag in the displayed message
      expect(res.body.message).not.toContain('TRIAGE_COMPLETE');
      expect(res.body.insights).toBeDefined();
      expect(res.body.triageData).toBeDefined();
    });

    it('should store insights for patient after triage completes', async () => {
      await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat' },
            { role: 'ai', content: 'How long?' },
            { role: 'user', content: '3 days' },
            { role: 'ai', content: 'Any fever?' },
            { role: 'user', content: 'Yes' },
          ],
          patientId: '1',
        });

      // Verify insights are stored in shared storage
      expect(patientInsights['1']).toBeDefined();
      expect(patientInsights['1'].summary).toBeDefined();
      expect(patientInsights['1'].generatedAt).toBeDefined();

      // Verify triage data is stored
      expect(patientTriageData['1']).toBeDefined();
      expect(patientTriageData['1'].messages).toBeDefined();
      expect(patientTriageData['1'].completedAt).toBeDefined();
    });
  });

  // ============================================================
  // 4. Doctor Access to Patient Data
  // ============================================================
  describe('Step 4: Doctor Reviews Patient Data', () => {
    beforeEach(() => {
      // Set up completed triage data
      patientInsights['1'] = {
        summary: 'Patient presents with sore throat and mild fever for 3 days.',
        keyFindings: ['Sore throat for 3 days', 'Mild fever'],
        possibleConditions: [
          { name: 'Pharyngitis', description: 'Throat inflammation', confidence: 'High' },
        ],
        nextSteps: ['Rapid strep test'],
        generatedAt: new Date().toISOString(),
      };

      patientTriageData['1'] = {
        messages: [
          { role: 'ai', content: 'What brings you here today?' },
          { role: 'user', content: 'Sore throat' },
          { role: 'ai', content: 'How long?' },
          { role: 'user', content: '3 days' },
        ],
        completedAt: new Date().toISOString(),
      };

      patientBiometrics['1'] = {
        heartRate: 72,
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        temperature: 100.4,
        temperatureUnit: 'F',
      };
    });

    it('should retrieve patient queue', async () => {
      const res = await request(app).get('/api/patients/queue');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should retrieve patient insights', async () => {
      const res = await request(app).get('/api/insights/1');
      expect(res.status).toBe(200);
      expect(res.body.patientId).toBe('1');
      expect(res.body.summary).toContain('sore throat');
      expect(res.body.keyFindings).toHaveLength(2);
      expect(res.body.possibleConditions).toHaveLength(1);
    });

    it('should retrieve triage transcript', async () => {
      const res = await request(app).get('/api/insights/1/triage');
      expect(res.status).toBe(200);
      expect(res.body.patientId).toBe('1');
      expect(res.body.messages).toHaveLength(4);
      expect(res.body.completedAt).toBeDefined();
    });

    it('should retrieve patient biometrics', async () => {
      const res = await request(app).get('/api/patients/1/biometrics');
      expect(res.status).toBe(200);
      expect(res.body.heartRate).toBe(72);
      expect(res.body.temperature).toBe(100.4);
    });

    it('should retrieve complete patient data', async () => {
      const res = await request(app).get('/api/patients/1');
      expect(res.status).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.biometrics).toBeDefined();
      expect(res.body.insights).toBeDefined();
      expect(res.body.triageData).toBeDefined();
    });

    it('should return 404 for non-existent patient insights', async () => {
      const res = await request(app).get('/api/insights/999');
      expect(res.status).toBe(404);
    });
  });

  // ============================================================
  // 5. Video Call Lifecycle
  // ============================================================
  describe('Step 5: Video Call Lifecycle', () => {
    it('should complete full video call flow', async () => {
      // Patient creates room
      const createRes = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: '1', sessionId: 'session-1' });

      expect(createRes.status).toBe(200);
      expect(createRes.body.roomName).toBeDefined();
      const roomName = createRes.body.roomName;

      // Verify room appears in active calls
      const activeRes1 = await request(app).get('/api/video/active-calls');
      expect(activeRes1.status).toBe(200);
      const waitingCalls = activeRes1.body.filter((c: any) => c.status === 'waiting');
      expect(waitingCalls.length).toBeGreaterThan(0);

      // Doctor joins room
      const joinRes = await request(app)
        .post('/api/video/join-room')
        .send({
          roomName,
          userId: 'doctor-1',
          userName: 'Dr. Martinez',
          userType: 'doctor',
        });

      expect(joinRes.status).toBe(200);
      expect(joinRes.body.token).toBeDefined();

      // Verify call is now active
      const activeRes2 = await request(app).get('/api/video/active-calls');
      const activeCall = activeRes2.body.find((c: any) => c.roomName === roomName);
      expect(activeCall.status).toBe('active');

      // End call
      const endRes = await request(app)
        .post('/api/video/end-call')
        .send({ roomName });

      expect(endRes.status).toBe(200);

      // Verify call is no longer active
      const activeRes3 = await request(app).get('/api/video/active-calls');
      const completedCall = activeRes3.body.find((c: any) => c.roomName === roomName);
      expect(completedCall).toBeUndefined();
    });
  });

  // ============================================================
  // 6. Doctor Consultation Tools
  // ============================================================
  describe('Step 6: Doctor Consultation Tools', () => {
    it('should save and retrieve consultation notes', async () => {
      // Save notes
      const saveRes = await request(app)
        .put('/api/consultations/1/notes')
        .send({
          notes: 'Patient throat is red. Prescribed amoxicillin.',
          roomName: 'consultation-1',
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.data.notes).toContain('amoxicillin');

      // Retrieve notes
      const getRes = await request(app).get('/api/consultations/1/notes');
      expect(getRes.status).toBe(200);
      expect(getRes.body.notes).toContain('amoxicillin');
      expect(getRes.body.roomName).toBe('consultation-1');
    });

    it('should auto-update notes (simulate auto-save)', async () => {
      await request(app)
        .put('/api/consultations/1/notes')
        .send({ notes: 'Initial observation' });

      await request(app)
        .put('/api/consultations/1/notes')
        .send({ notes: 'Initial observation. Rapid strep test positive.' });

      const res = await request(app).get('/api/consultations/1/notes');
      expect(res.body.notes).toContain('Rapid strep test positive');
    });

    it('should handle AI assist questions', async () => {
      // Set up patient context
      patientInsights['1'] = {
        summary: 'Sore throat and fever',
        keyFindings: ['Sore throat'],
        possibleConditions: [{ name: 'Pharyngitis', confidence: 'High' }],
      };

      const res = await request(app)
        .post('/api/ai-assist/ask')
        .send({
          question: 'What are common complications of pharyngitis?',
          patientId: '1',
        });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBeDefined();
      expect(res.body.answer.length).toBeGreaterThan(0);
    });

    it('should reject AI assist without a question', async () => {
      const res = await request(app)
        .post('/api/ai-assist/ask')
        .send({ patientId: '1' });

      expect(res.status).toBe(400);
    });
  });

  // ============================================================
  // 7. Complete End-to-End Flow
  // ============================================================
  describe('Step 7: Complete Patient-to-Doctor Flow', () => {
    it('should complete the full consultation lifecycle', async () => {
      // 1. Register patient
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'E2E Patient',
          email: 'e2e@example.com',
          password: 'password123',
          phone: '555-9999',
          userType: 'patient',
        });
      expect(regRes.status).toBe(201);
      const patientId = regRes.body.user.id;

      // 2. Save biometrics
      const bioRes = await request(app)
        .post(`/api/patients/${patientId}/biometrics`)
        .send({
          heartRate: 88,
          bloodPressureSystolic: 135,
          bloodPressureDiastolic: 85,
          temperature: 101.2,
          temperatureUnit: 'F',
          bloodOxygen: 97,
          painLevel: 5,
        });
      expect(bioRes.status).toBe(200);

      // 3. Start triage (initial greeting)
      const greetRes = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId,
        });
      expect(greetRes.status).toBe(200);
      expect(greetRes.body.complete).toBe(false);

      // 4. Continue triage conversation until complete
      const triageRes = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a bad sore throat and fever' },
            { role: 'ai', content: 'How long have you had these symptoms?' },
            { role: 'user', content: 'Started 3 days ago' },
            { role: 'ai', content: 'Do you have any other symptoms?' },
            { role: 'user', content: 'Mild headache and fatigue' },
          ],
          patientId,
        });
      expect(triageRes.status).toBe(200);
      expect(triageRes.body.complete).toBe(true);
      expect(triageRes.body.insights).toBeDefined();

      // 5. Verify insights stored
      const insightsRes = await request(app).get(`/api/insights/${patientId}`);
      expect(insightsRes.status).toBe(200);
      expect(insightsRes.body.summary).toBeDefined();

      // 6. Verify triage transcript stored
      const triageDataRes = await request(app).get(`/api/insights/${patientId}/triage`);
      expect(triageDataRes.status).toBe(200);
      expect(triageDataRes.body.messages.length).toBeGreaterThan(0);

      // 7. Patient creates video room
      const roomRes = await request(app)
        .post('/api/video/create-room')
        .send({ patientId });
      expect(roomRes.status).toBe(200);
      const roomName = roomRes.body.roomName;

      // 8. Doctor checks queue
      const queueRes = await request(app).get('/api/patients/queue');
      expect(queueRes.status).toBe(200);

      // 9. Doctor sees active call
      const callsRes = await request(app).get('/api/video/active-calls');
      expect(callsRes.status).toBe(200);
      const patientCall = callsRes.body.find((c: any) => c.patientId === patientId);
      expect(patientCall).toBeDefined();

      // 10. Doctor fetches full patient data
      const patientDataRes = await request(app).get(`/api/patients/${patientId}`);
      expect(patientDataRes.status).toBe(200);
      expect(patientDataRes.body.profile).toBeDefined();
      expect(patientDataRes.body.biometrics).toBeDefined();
      expect(patientDataRes.body.insights).toBeDefined();

      // 11. Doctor joins video call
      const joinRes = await request(app)
        .post('/api/video/join-room')
        .send({
          roomName,
          userId: 'doctor-1',
          userName: 'Dr. Martinez',
          userType: 'doctor',
        });
      expect(joinRes.status).toBe(200);

      // 12. Doctor takes notes during call
      const notesRes = await request(app)
        .put(`/api/consultations/${patientId}/notes`)
        .send({
          notes: 'Throat examination: red, swollen tonsils. Prescribed antibiotics.',
          roomName,
        });
      expect(notesRes.status).toBe(200);

      // 13. Doctor asks AI for guidance
      const aiRes = await request(app)
        .post('/api/ai-assist/ask')
        .send({
          question: 'What are common complications of pharyngitis?',
          patientId,
        });
      expect(aiRes.status).toBe(200);
      expect(aiRes.body.answer).toBeDefined();

      // 14. End consultation
      const endRes = await request(app)
        .post('/api/video/end-call')
        .send({ roomName });
      expect(endRes.status).toBe(200);

      // 15. Verify notes persisted after call
      const savedNotesRes = await request(app).get(`/api/consultations/${patientId}/notes`);
      expect(savedNotesRes.status).toBe(200);
      expect(savedNotesRes.body.notes).toContain('antibiotics');

      // 16. Verify call is completed (no longer active)
      const finalCallsRes = await request(app).get('/api/video/active-calls');
      const endedCall = finalCallsRes.body.find((c: any) => c.roomName === roomName);
      expect(endedCall).toBeUndefined();
    });
  });

  // ============================================================
  // 8. Data Persistence & Integrity
  // ============================================================
  describe('Step 8: Data Persistence & Integrity', () => {
    it('should persist biometrics across routes', async () => {
      // Save via patients route
      await request(app)
        .post('/api/patients/1/biometrics')
        .send({ heartRate: 72, bloodPressureSystolic: 120, bloodPressureDiastolic: 80 });

      // Access via patients route
      const res = await request(app).get('/api/patients/1/biometrics');
      expect(res.body.heartRate).toBe(72);

      // Should also be visible in patient data
      const patientRes = await request(app).get('/api/patients/1');
      expect(patientRes.body.biometrics.heartRate).toBe(72);
    });

    it('should persist insights across routes', async () => {
      patientInsights['1'] = {
        summary: 'Test summary',
        keyFindings: ['Finding 1'],
        possibleConditions: [],
        generatedAt: new Date().toISOString(),
      };

      // Access via insights route
      const insightsRes = await request(app).get('/api/insights/1');
      expect(insightsRes.body.summary).toBe('Test summary');

      // Should also be visible in patient data
      const patientRes = await request(app).get('/api/patients/1');
      expect(patientRes.body.insights.summary).toBe('Test summary');
    });

    it('should handle concurrent video rooms', async () => {
      // Create two rooms for different patients
      const room1 = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: '1' });
      const room2 = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: '2' });

      expect(room1.body.roomName).not.toBe(room2.body.roomName);

      // Both should appear in active calls
      const active = await request(app).get('/api/video/active-calls');
      expect(active.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================================
  // 9. Error Handling
  // ============================================================
  describe('Step 9: Error Handling', () => {
    it('should return 404 for non-existent patient', async () => {
      const res = await request(app).get('/api/patients/999');
      expect(res.status).toBe(404);
    });

    it('should return 400 for missing triage messages', async () => {
      const res = await request(app)
        .post('/api/triage/chat')
        .send({ messages: [] });
      expect(res.status).toBe(400);
    });

    it('should return 400 for missing video room fields', async () => {
      const res = await request(app)
        .post('/api/video/create-room')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 404 for joining non-existent room', async () => {
      const res = await request(app)
        .post('/api/video/join-room')
        .send({
          roomName: 'nonexistent-room',
          userId: 'doc-1',
          userName: 'Doctor',
          userType: 'doctor',
        });
      expect(res.status).toBe(404);
    });

    it('should return 400 for registration with invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: '',
          email: 'not-an-email',
          password: 'short',
          phone: '',
          userType: 'invalid',
        });
      expect(res.status).toBe(400);
    });
  });
});
