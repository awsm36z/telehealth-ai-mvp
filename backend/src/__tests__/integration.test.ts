/**
 * Integration Tests - End-to-End Flow
 * Tests the complete patient-to-doctor consultation flow
 */

import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRouter from '../routes/auth';
import triageRouter from '../routes/triage';
import patientsRouter from '../routes/patients';
import insightsRouter from '../routes/insights';

// Create test app with all routes
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/triage', triageRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/insights', insightsRouter);

describe('Integration Tests - Complete Patient Flow', () => {
  let patientToken: string;
  let patientId: string;
  let sessionId: string;

  describe('1. Patient Registration and Login', () => {
    it('should register a new patient', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `integration_test_${Date.now()}@example.com`,
          password: 'Test123!',
          userType: 'patient',
          name: 'Integration Test Patient',
        })
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');

      patientToken = response.body.token;
      patientId = response.body.user.id;
    });

    it('should login the patient', async () => {
      // First register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: `login_test_${Date.now()}@example.com`,
          password: 'Test123!',
          userType: 'patient',
          name: 'Login Test',
        });

      // Then login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerResponse.body.user.email,
          password: 'Test123!',
          userType: 'patient',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
    });
  });

  describe('2. AI Triage Conversation', () => {
    const skipIfNoApiKey = process.env.OPENAI_API_KEY ? it : it.skip;

    skipIfNoApiKey('should complete a triage conversation', async () => {
      // First message
      const firstResponse = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat and fever' }
          ]
        })
        .expect(200);

      expect(firstResponse.body).toHaveProperty('sessionId');
      sessionId = firstResponse.body.sessionId;

      // Second message
      const secondResponse = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat and fever' },
            { role: 'ai', content: firstResponse.body.message },
            { role: 'user', content: 'About 3 days' }
          ]
        })
        .expect(200);

      expect(secondResponse.body.sessionId).toBe(sessionId);
    }, 20000);
  });

  describe('3. Biometric Entry', () => {
    it('should save comprehensive biometric data', async () => {
      const biometrics = {
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        heartRate: '75',
        temperature: '101.5',
        temperatureUnit: 'F',
        weight: '165',
        weightUnit: 'lbs',
        height: '175',
        heightUnit: 'cm',
        respiratoryRate: '18',
        painLevel: '6',
        bloodOxygen: '97',
        bloodSugar: '95',
        bloodSugarContext: 'fasting',
        notes: 'Fever started yesterday',
      };

      const response = await request(app)
        .post('/api/patients/test-patient-1/biometrics')
        .send(biometrics)
        .expect(200);

      expect(response.body.data).toMatchObject(biometrics);
    });

    it('should retrieve saved biometrics', async () => {
      const response = await request(app)
        .get('/api/patients/test-patient-1/biometrics')
        .expect(200);

      expect(response.body).toHaveProperty('heartRate', '75');
      expect(response.body).toHaveProperty('painLevel', '6');
    });
  });

  describe('4. AI Insights Generation', () => {
    const skipIfNoApiKey = process.env.OPENAI_API_KEY ? it : it.skip;

    skipIfNoApiKey('should generate insights from conversation', async () => {
      const messages = [
        { role: 'user', content: 'I have a sore throat and fever' },
        { role: 'ai', content: 'How long have you had these symptoms?' },
        { role: 'user', content: 'About 3 days, and the fever is 101.5°F' },
        { role: 'ai', content: 'Do you have any other symptoms?' },
        { role: 'user', content: 'Yes, I have body aches and fatigue' }
      ];

      const response = await request(app)
        .post('/api/triage/insights')
        .send({ messages })
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('keyFindings');
      expect(response.body).toHaveProperty('possibleConditions');
      expect(response.body.keyFindings).toEqual(expect.arrayContaining([
        expect.stringMatching(/fever|sore throat/i)
      ]));
    }, 20000);
  });

  describe('5. Doctor View - Complete Patient Data', () => {
    it('should retrieve complete patient data for doctor review', async () => {
      const response = await request(app)
        .get('/api/patients/1')
        .expect(200);

      expect(response.body).toHaveProperty('profile');
      expect(response.body).toHaveProperty('biometrics');
      expect(response.body).toHaveProperty('insights');
      expect(response.body).toHaveProperty('chatTranscript');
    });

    it('should show patient in queue', async () => {
      const response = await request(app)
        .get('/api/patients/queue')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('status');
    });
  });

  describe('6. Data Persistence and Isolation', () => {
    it('should maintain separate data for different patients', async () => {
      // Patient 1 data
      await request(app)
        .post('/api/patients/patient1/biometrics')
        .send({ heartRate: '70', painLevel: '2' });

      // Patient 2 data
      await request(app)
        .post('/api/patients/patient2/biometrics')
        .send({ heartRate: '90', painLevel: '8' });

      // Verify isolation
      const patient1Response = await request(app)
        .get('/api/patients/patient1/biometrics');

      const patient2Response = await request(app)
        .get('/api/patients/patient2/biometrics');

      expect(patient1Response.body.heartRate).toBe('70');
      expect(patient1Response.body.painLevel).toBe('2');
      expect(patient2Response.body.heartRate).toBe('90');
      expect(patient2Response.body.painLevel).toBe('8');
    });
  });

  describe('7. Error Handling', () => {
    it('should handle missing data gracefully', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      await request(app)
        .post('/api/patients/1/biometrics')
        .send({})
        .expect(400);

      await request(app)
        .post('/api/triage/chat')
        .send({})
        .expect(400);
    });

    it('should return appropriate status codes', async () => {
      // 404 for non-existent resources
      await request(app)
        .get('/api/patients/nonexistent')
        .expect(404);

      // 401 for invalid credentials
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrong',
          userType: 'patient',
        })
        .expect(401);
    });
  });
});

describe('Performance Tests', () => {
  it('should handle multiple concurrent biometric saves', async () => {
    const promises = [];

    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app)
          .post(`/api/patients/perf-test-${i}/biometrics`)
          .send({
            heartRate: `${70 + i}`,
            painLevel: `${i % 10}`,
          })
      );
    }

    const responses = await Promise.all(promises);

    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });

  it('should respond quickly to biometric saves', async () => {
    const start = Date.now();

    await request(app)
      .post('/api/patients/speed-test/biometrics')
      .send({
        heartRate: '72',
        temperature: '98.6',
      })
      .expect(200);

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000); // Should respond in less than 1 second
  });
});
