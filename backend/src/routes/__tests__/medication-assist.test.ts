import request from 'supertest';
import express from 'express';
import medicationAssistRouter from '../medication-assist';
import { patientProfiles } from '../../storage';

const app = express();
app.use(express.json());
app.use('/api/medication-assist', medicationAssistRouter);

describe('Medication Assist API', () => {
  beforeEach(() => {
    Object.keys(patientProfiles).forEach((key) => delete patientProfiles[key]);
    delete process.env.OPENAI_API_KEY;
  });

  it('returns fallback insights with Morocco medication catalog and disclaimer', async () => {
    patientProfiles['patient-ma'] = {
      id: 'patient-ma',
      name: 'Patient Morocco',
      email: 'ma@example.com',
      language: 'fr',
      createdAt: new Date().toISOString(),
    };

    const response = await request(app)
      .post('/api/medication-assist/insights')
      .send({ patientId: 'patient-ma', locale: 'MA' })
      .expect(200);

    expect(response.body).toHaveProperty('disclaimer');
    expect(response.body.disclaimer.toLowerCase()).toContain('not a prescription');
    expect(Array.isArray(response.body.possibleMedication)).toBe(true);
    expect(response.body.possibleMedication.length).toBeGreaterThan(0);
    expect(response.body.possibleMedication[0].market).toBe('Morocco catalog');
  });

  it('returns fallback chat answer with disclaimer when OpenAI key is not configured', async () => {
    const response = await request(app)
      .post('/api/medication-assist/chat')
      .send({
        patientId: 'patient-ma',
        locale: 'MA',
        question: 'What medications can be considered for influenza symptoms?',
      })
      .expect(200);

    expect(response.body).toHaveProperty('answer');
    expect(response.body).toHaveProperty('disclaimer');
    expect(response.body.disclaimer.toLowerCase()).toContain('doctor must independently verify');
  });

  it('returns 400 for missing medication chat question', async () => {
    const response = await request(app)
      .post('/api/medication-assist/chat')
      .send({ patientId: 'patient-ma', locale: 'MA' })
      .expect(400);

    expect(response.body.message).toContain('question is required');
  });
});
