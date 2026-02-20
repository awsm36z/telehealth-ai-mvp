import request from 'supertest';
import express from 'express';
import consultationsRouter from '../consultations';
import { consultationHistory, consultationNotes, patientProfiles } from '../../storage';

const app = express();
app.use(express.json());
app.use('/api/consultations', consultationsRouter);

describe('Consultations API', () => {
  beforeEach(() => {
    Object.keys(consultationNotes).forEach(key => delete consultationNotes[key]);
    Object.keys(consultationHistory).forEach(key => delete consultationHistory[key]);
    Object.keys(patientProfiles).forEach(key => delete patientProfiles[key]);
  });

  describe('PUT /api/consultations/:patientId/notes', () => {
    it('should save consultation notes', async () => {
      const response = await request(app)
        .put('/api/consultations/patient-1/notes')
        .send({ notes: 'Patient reports improvement', roomName: 'room-123' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Notes saved');
      expect(response.body.data.notes).toBe('Patient reports improvement');
      expect(response.body.data.roomName).toBe('room-123');
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 400 if notes is missing', async () => {
      const response = await request(app)
        .put('/api/consultations/patient-1/notes')
        .send({ roomName: 'room-123' });

      expect(response.status).toBe(400);
    });

    it('should update existing notes', async () => {
      await request(app)
        .put('/api/consultations/patient-1/notes')
        .send({ notes: 'First note' });

      const response = await request(app)
        .put('/api/consultations/patient-1/notes')
        .send({ notes: 'Updated note' });

      expect(response.status).toBe(200);
      expect(response.body.data.notes).toBe('Updated note');
    });
  });

  describe('GET /api/consultations/:patientId/notes', () => {
    it('should return 404 when no notes exist', async () => {
      const response = await request(app).get('/api/consultations/unknown/notes');
      expect(response.status).toBe(404);
    });

    it('should return saved notes', async () => {
      consultationNotes['patient-1'] = {
        notes: 'Prescribed antibiotics',
        roomName: 'room-123',
        updatedAt: '2025-01-01T00:00:00.000Z',
        patientId: 'patient-1',
      };

      const response = await request(app).get('/api/consultations/patient-1/notes');
      expect(response.status).toBe(200);
      expect(response.body.notes).toBe('Prescribed antibiotics');
    });
  });

  describe('POST /api/consultations/:patientId/complete', () => {
    it('should persist doctor and patient language metadata', async () => {
      patientProfiles['patient-42'] = {
        id: 'patient-42',
        name: 'Patient',
        email: 'p@example.com',
        language: 'fr',
      };

      const response = await request(app)
        .post('/api/consultations/patient-42/complete')
        .send({
          roomName: 'room-42',
          doctorName: 'Dr. Test',
          doctorLanguage: 'en',
          patientLanguage: 'fr',
        })
        .expect(200);

      expect(response.body.data.doctorLanguage).toBe('en');
      expect(response.body.data.patientLanguage).toBe('fr');
    });
  });
});
