import request from 'supertest';
import express from 'express';
import patientsRouter from '../patients';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/patients', patientsRouter);

describe('Patients API', () => {
  describe('POST /api/patients/:id/biometrics', () => {
    it('should save biometric data successfully', async () => {
      const biometricData = {
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        heartRate: '72',
        temperature: '98.6',
        temperatureUnit: 'F',
        weight: '150',
        weightUnit: 'lbs',
        height: '170',
        heightUnit: 'cm',
        respiratoryRate: '16',
        painLevel: '3',
        bloodOxygen: '98',
        bloodSugar: '100',
        bloodSugarContext: 'fasting',
        notes: 'Feeling good today',
      };

      const response = await request(app)
        .post('/api/patients/1/biometrics')
        .send(biometricData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Biometrics saved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject(biometricData);
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('patientId', '1');
    });

    it('should return 400 if biometrics data is missing', async () => {
      const response = await request(app)
        .post('/api/patients/1/biometrics')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Biometrics data is required');
    });

    it('should handle partial biometric data', async () => {
      const partialData = {
        bloodPressureSystolic: '120',
        bloodPressureDiastolic: '80',
        heartRate: '72',
      };

      const response = await request(app)
        .post('/api/patients/1/biometrics')
        .send(partialData)
        .expect(200);

      expect(response.body.data).toMatchObject(partialData);
    });

    it('should save biometrics for different patients', async () => {
      const patient1Data = { heartRate: '72', painLevel: '2' };
      const patient2Data = { heartRate: '80', painLevel: '5' };

      await request(app)
        .post('/api/patients/1/biometrics')
        .send(patient1Data)
        .expect(200);

      await request(app)
        .post('/api/patients/2/biometrics')
        .send(patient2Data)
        .expect(200);

      const patient1Response = await request(app)
        .get('/api/patients/1/biometrics')
        .expect(200);

      const patient2Response = await request(app)
        .get('/api/patients/2/biometrics')
        .expect(200);

      expect(patient1Response.body).toMatchObject(patient1Data);
      expect(patient2Response.body).toMatchObject(patient2Data);
    });
  });

  describe('GET /api/patients/:id/biometrics', () => {
    beforeEach(async () => {
      // Save test biometrics
      await request(app)
        .post('/api/patients/1/biometrics')
        .send({
          heartRate: '72',
          temperature: '98.6',
          painLevel: '3',
        });
    });

    it('should retrieve saved biometric data', async () => {
      const response = await request(app)
        .get('/api/patients/1/biometrics')
        .expect(200);

      expect(response.body).toHaveProperty('heartRate', '72');
      expect(response.body).toHaveProperty('temperature', '98.6');
      expect(response.body).toHaveProperty('painLevel', '3');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return null for non-existent patient', async () => {
      const response = await request(app)
        .get('/api/patients/999/biometrics')
        .expect(200);

      expect(response.body).toBeNull();
    });
  });

  describe('GET /api/patients/:id', () => {
    it('should retrieve complete patient data', async () => {
      const response = await request(app)
        .get('/api/patients/1')
        .expect(200);

      expect(response.body).toHaveProperty('profile');
      expect(response.body.profile).toHaveProperty('id', '1');
      expect(response.body.profile).toHaveProperty('name');
      expect(response.body).toHaveProperty('biometrics');
      expect(response.body).toHaveProperty('insights');
      expect(response.body).toHaveProperty('chatTranscript');
    });

    it('should return 404 for non-existent patient', async () => {
      const response = await request(app)
        .get('/api/patients/999')
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Patient not found');
    });
  });

  describe('GET /api/patients/queue', () => {
    it('should return patient queue', async () => {
      const response = await request(app)
        .get('/api/patients/queue')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('status');
      }
    });
  });

  describe('Biometric Validation Tests', () => {
    it('should handle extreme but valid values', async () => {
      const extremeData = {
        bloodPressureSystolic: '200',
        bloodPressureDiastolic: '120',
        heartRate: '150',
        temperature: '104',
        painLevel: '10',
      };

      const response = await request(app)
        .post('/api/patients/1/biometrics')
        .send(extremeData)
        .expect(200);

      expect(response.body.data).toMatchObject(extremeData);
    });

    it('should preserve unit selections', async () => {
      const dataWithUnits = {
        temperature: '37',
        temperatureUnit: 'C',
        weight: '70',
        weightUnit: 'kg',
        height: '170',
        heightUnit: 'cm',
      };

      const response = await request(app)
        .post('/api/patients/1/biometrics')
        .send(dataWithUnits)
        .expect(200);

      expect(response.body.data.temperatureUnit).toBe('C');
      expect(response.body.data.weightUnit).toBe('kg');
      expect(response.body.data.heightUnit).toBe('cm');
    });
  });
});
