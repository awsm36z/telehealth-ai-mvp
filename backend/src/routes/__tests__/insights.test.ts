import request from 'supertest';
import express from 'express';
import insightsRouter from '../insights';
import { patientInsights, patientTriageData } from '../../storage';

const app = express();
app.use(express.json());
app.use('/api/insights', insightsRouter);

describe('Insights API', () => {
  beforeEach(() => {
    // Clear storage before each test
    Object.keys(patientInsights).forEach(key => delete patientInsights[key]);
    Object.keys(patientTriageData).forEach(key => delete patientTriageData[key]);
  });

  describe('GET /api/insights/:patientId', () => {
    it('should return 404 when no insights exist for patient', async () => {
      const response = await request(app).get('/api/insights/unknown-patient');
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('No insights available');
    });

    it('should return stored insights for a patient', async () => {
      // Store test insights
      patientInsights['patient-1'] = {
        summary: 'Patient presents with sore throat',
        keyFindings: ['Sore throat', 'Fever'],
        possibleConditions: [
          { name: 'Pharyngitis', description: 'Throat infection', confidence: 'High' },
        ],
        nextSteps: ['Schedule consultation'],
        generatedAt: '2025-01-01T00:00:00.000Z',
      };

      const response = await request(app).get('/api/insights/patient-1');
      expect(response.status).toBe(200);
      expect(response.body.patientId).toBe('patient-1');
      expect(response.body.summary).toBe('Patient presents with sore throat');
      expect(response.body.keyFindings).toHaveLength(2);
      expect(response.body.possibleConditions).toHaveLength(1);
      expect(response.body.possibleConditions[0].name).toBe('Pharyngitis');
    });
  });

  describe('GET /api/insights/:patientId/triage', () => {
    it('should return 404 when no triage data exists', async () => {
      const response = await request(app).get('/api/insights/unknown-patient/triage');
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('No triage data available');
    });

    it('should return stored triage conversation data', async () => {
      // Store test triage data
      patientTriageData['patient-1'] = {
        messages: [
          { role: 'ai', content: 'What brings you here today?' },
          { role: 'user', content: 'I have a sore throat' },
        ],
        completedAt: '2025-01-01T00:00:00.000Z',
      };

      const response = await request(app).get('/api/insights/patient-1/triage');
      expect(response.status).toBe(200);
      expect(response.body.patientId).toBe('patient-1');
      expect(response.body.messages).toHaveLength(2);
      expect(response.body.completedAt).toBeDefined();
    });
  });
});
