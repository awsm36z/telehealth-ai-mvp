import request from 'supertest';
import express from 'express';
import videoRouter from '../video';

const app = express();
app.use(express.json());
app.use('/api/video', videoRouter);

describe('Video Call API', () => {
  let createdRoomName: string;

  describe('POST /api/video/create-room', () => {
    it('should create a video room successfully', async () => {
      const response = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: 'test-patient-1' })
        .expect(200);

      expect(response.body).toHaveProperty('roomName');
      expect(response.body).toHaveProperty('roomUrl');
      expect(response.body).toHaveProperty('message');
      expect(response.body.roomName).toContain('consultation-test-patient-1');

      createdRoomName = response.body.roomName;
    });

    it('should return 400 if patientId is missing', async () => {
      const response = await request(app)
        .post('/api/video/create-room')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Patient ID is required');
    });
  });

  describe('POST /api/video/join-room', () => {
    it('should generate a token for joining a room', async () => {
      // First create a room
      const createResponse = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: 'test-patient-2' });

      const roomName = createResponse.body.roomName;

      const response = await request(app)
        .post('/api/video/join-room')
        .send({
          roomName,
          userId: 'doctor-1',
          userName: 'Dr. Test',
          userType: 'doctor',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('roomUrl');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/video/join-room')
        .send({ roomName: 'test-room' })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent room', async () => {
      const response = await request(app)
        .post('/api/video/join-room')
        .send({
          roomName: 'non-existent-room',
          userId: 'doctor-1',
          userName: 'Dr. Test',
          userType: 'doctor',
        })
        .expect(404);

      expect(response.body).toHaveProperty('message', 'Room not found');
    });
  });

  describe('GET /api/video/active-calls', () => {
    it('should return list of active calls', async () => {
      const response = await request(app)
        .get('/api/video/active-calls')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should include created rooms in active calls', async () => {
      // Create a room
      const createResponse = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: 'test-patient-3' });

      const roomName = createResponse.body.roomName;

      const response = await request(app)
        .get('/api/video/active-calls')
        .expect(200);

      const call = response.body.find((c: any) => c.roomName === roomName);
      expect(call).toBeDefined();
      expect(call.patientId).toBe('test-patient-3');
      expect(call.status).toBe('waiting');
    });
  });

  describe('POST /api/video/end-call', () => {
    it('should end a call successfully', async () => {
      // Create a room first
      const createResponse = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: 'test-patient-4' });

      const roomName = createResponse.body.roomName;

      const response = await request(app)
        .post('/api/video/end-call')
        .send({ roomName })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Call ended successfully');
      expect(response.body.callInfo.status).toBe('completed');
    });

    it('should return 400 if roomName is missing', async () => {
      await request(app)
        .post('/api/video/end-call')
        .send({})
        .expect(400);
    });

    it('should return 404 for non-existent call', async () => {
      await request(app)
        .post('/api/video/end-call')
        .send({ roomName: 'non-existent-room' })
        .expect(404);
    });
  });

  describe('Call Status Flow', () => {
    it('should update status to active when doctor joins', async () => {
      // Patient creates room
      const createResponse = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: 'flow-test-patient' });

      const roomName = createResponse.body.roomName;

      // Verify initial status is waiting
      let activeCallsResponse = await request(app).get('/api/video/active-calls');
      let call = activeCallsResponse.body.find((c: any) => c.roomName === roomName);
      expect(call.status).toBe('waiting');

      // Doctor joins
      await request(app)
        .post('/api/video/join-room')
        .send({
          roomName,
          userId: 'doctor-1',
          userName: 'Dr. Test',
          userType: 'doctor',
        });

      // Verify status changed to active
      activeCallsResponse = await request(app).get('/api/video/active-calls');
      call = activeCallsResponse.body.find((c: any) => c.roomName === roomName);
      expect(call.status).toBe('active');
    });

    it('should not show completed calls in active calls', async () => {
      // Create and end a call
      const createResponse = await request(app)
        .post('/api/video/create-room')
        .send({ patientId: 'completed-test-patient' });

      const roomName = createResponse.body.roomName;

      await request(app)
        .post('/api/video/end-call')
        .send({ roomName });

      // Verify it's not in active calls
      const activeCallsResponse = await request(app).get('/api/video/active-calls');
      const call = activeCallsResponse.body.find((c: any) => c.roomName === roomName);
      expect(call).toBeUndefined();
    });
  });
});
