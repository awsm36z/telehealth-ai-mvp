import request from 'supertest';
import express from 'express';
import triageRouter from '../triage';
import { patientBiometrics } from '../../storage';

const app = express();
app.use(express.json());
app.use('/api/triage', triageRouter);

describe('Triage with Biometric Analysis', () => {
  beforeEach(() => {
    // Clear biometrics before each test
    Object.keys(patientBiometrics).forEach(key => delete patientBiometrics[key]);
  });

  describe('Initial Greeting', () => {
    it('should return standard greeting when no biometrics exist', async () => {
      const response = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId: 'test-patient-1',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.complete).toBe(false);
      expect(response.body.message).toContain('What brings you here today?');
    });

    const skipIfNoApiKey = process.env.OPENAI_API_KEY ? it : it.skip;

    skipIfNoApiKey('should analyze biometrics when they exist', async () => {
      // Set up biometrics for test patient
      patientBiometrics['test-patient-2'] = {
        bloodPressureSystolic: '140',
        bloodPressureDiastolic: '90',
        heartRate: '95',
        temperature: '101.5',
        temperatureUnit: 'F',
        painLevel: '7',
        respiratoryRate: '20',
        bloodOxygen: '96',
        notes: 'Feeling unwell since yesterday',
      };

      const response = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId: 'test-patient-2',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.complete).toBe(false);

      // The response should mention the biometric readings
      const message = response.body.message.toLowerCase();

      // Should contain a greeting
      expect(message).toMatch(/hello|hi|greet/i);

      // Should mention some concerning values or acknowledge vitals
      // (elevated temp, high pain level, or elevated blood pressure)
      expect(message.length).toBeGreaterThan(100); // Should be more detailed than standard greeting

      // Should still ask what brings them here
      expect(message).toContain('what brings you');
    }, 20000);

    skipIfNoApiKey('should handle normal biometrics appropriately', async () => {
      // Set up normal biometrics
      patientBiometrics['test-patient-3'] = {
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        heartRate: '72',
        temperature: '98.6',
        temperatureUnit: 'F',
        painLevel: '1',
        respiratoryRate: '16',
        bloodOxygen: '98',
      };

      const response = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId: 'test-patient-3',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      const message = response.body.message;

      // Should acknowledge the vitals were reviewed
      expect(message.length).toBeGreaterThan(50);

      // Should ask what brings them here
      expect(message.toLowerCase()).toContain('what brings you');
    }, 20000);
  });

  describe('Biometric Context in Conversation', () => {
    const skipIfNoApiKey = process.env.OPENAI_API_KEY ? it : it.skip;

    skipIfNoApiKey('should continue conversation normally after initial greeting', async () => {
      const response = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat' }
          ],
          patientId: 'test-patient-4',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      // Should not fail even without biometrics
    }, 20000);
  });

  describe('Data Isolation', () => {
    const skipIfNoApiKey = process.env.OPENAI_API_KEY ? it : it.skip;

    skipIfNoApiKey('should not mix biometrics between patients', async () => {
      // Patient A with high temperature
      patientBiometrics['patient-a'] = {
        temperature: '103',
        temperatureUnit: 'F',
      };

      // Patient B with normal temperature
      patientBiometrics['patient-b'] = {
        temperature: '98.6',
        temperatureUnit: 'F',
      };

      const responseA = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId: 'patient-a',
        });

      const responseB = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
          patientId: 'patient-b',
        });

      // Both should have different responses (one with concern about fever, one normal)
      expect(responseA.body.message).not.toEqual(responseB.body.message);
    }, 20000);
  });
});
