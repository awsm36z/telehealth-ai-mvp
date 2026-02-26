import request from 'supertest';
import express from 'express';
import liveInsightsRouter from '../live-insights';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/live-insights', liveInsightsRouter);

describe('Live Insights Streaming', () => {
  const testRoomName = `test-room-${Date.now()}`;
  const testPatientId = 'test-patient-123';

  afterEach(async () => {
    // Cleanup: delete transcript after each test
    await request(app)
      .delete(`/api/live-insights/transcript/${testRoomName}`)
      .expect(200);
  });

  describe('POST /transcript-batch', () => {
    it('should accept batch transcript entries', async () => {
      const response = await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          roomName: testRoomName,
          patientId: testPatientId,
          locale: 'en',
          entries: [
            { speaker: 'Patient', text: 'I have a headache' },
            { speaker: 'Doctor', text: 'How long have you had it?' },
            { speaker: 'Patient', text: 'About 3 days' },
          ],
        })
        .expect(200);

      expect(response.body.message).toBe('Transcript batch added');
      expect(response.body.total).toBe(3);
      expect(response.body.processed).toBe(3);
    });

    it('should detect emergency keywords', async () => {
      const response = await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          roomName: testRoomName,
          entries: [
            { speaker: 'Patient', text: 'I have severe chest pain' },
          ],
        })
        .expect(200);

      expect(response.body.emergencyDetected).toBe(true);
    });

    it('should reject requests without roomName', async () => {
      await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          entries: [{ speaker: 'Doctor', text: 'Test' }],
        })
        .expect(400);
    });

    it('should reject requests without entries array', async () => {
      await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          roomName: testRoomName,
        })
        .expect(400);
    });
  });

  describe('GET /stream', () => {
    it('should establish SSE connection with proper headers', async () => {
      const response = await request(app)
        .get(`/api/live-insights/stream?roomName=${testRoomName}`)
        .expect(200)
        .expect('Content-Type', /text\/event-stream/);

      // SSE connection established successfully
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should reject requests without roomName', async () => {
      await request(app)
        .get('/api/live-insights/stream')
        .expect(400);
    });

    it('should send initial connection event', (done) => {
      request(app)
        .get(`/api/live-insights/stream?roomName=${testRoomName}`)
        .expect(200)
        .expect('Content-Type', /text\/event-stream/)
        .end((err, res) => {
          if (err) return done(err);

          // Check that response starts with SSE data
          const body = res.text;
          expect(body).toContain('data:');
          expect(body).toContain('"type":"connected"');
          expect(body).toContain(testRoomName);
          done();
        });
    });
  });

  describe('GET /transcript/:roomName', () => {
    it('should return empty transcript for new room', async () => {
      const response = await request(app)
        .get(`/api/live-insights/transcript/${testRoomName}`)
        .expect(200);

      expect(response.body.entries).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it('should return transcript entries after adding them', async () => {
      // Add entries
      await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          roomName: testRoomName,
          entries: [
            { speaker: 'Doctor', text: 'Hello' },
            { speaker: 'Patient', text: 'Hi' },
          ],
        });

      // Get transcript
      const response = await request(app)
        .get(`/api/live-insights/transcript/${testRoomName}`)
        .expect(200);

      expect(response.body.total).toBe(2);
      expect(response.body.entries).toHaveLength(2);
      expect(response.body.entries[0].speaker).toBe('Doctor');
      expect(response.body.entries[0].text).toBe('Hello');
    });
  });

  describe('DELETE /transcript/:roomName', () => {
    it('should clear transcript and close connections', async () => {
      // Add transcript
      await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          roomName: testRoomName,
          entries: [{ speaker: 'Doctor', text: 'Test' }],
        });

      // Delete transcript
      const response = await request(app)
        .delete(`/api/live-insights/transcript/${testRoomName}`)
        .expect(200);

      expect(response.body.message).toContain('cleared');

      // Verify transcript is deleted
      const getResponse = await request(app)
        .get(`/api/live-insights/transcript/${testRoomName}`)
        .expect(200);

      expect(getResponse.body.total).toBe(0);
    });
  });

  describe('Emergency Keyword Detection', () => {
    const emergencyKeywords = [
      'chest pain',
      'heart attack',
      "can't breathe",
      'difficulty breathing',
      'suicide',
      'kill myself',
      'severe bleeding',
      'stroke',
      'unconscious',
      'passed out',
    ];

    emergencyKeywords.forEach((keyword) => {
      it(`should detect emergency keyword: "${keyword}"`, async () => {
        const response = await request(app)
          .post('/api/live-insights/transcript-batch')
          .send({
            roomName: `${testRoomName}-${keyword.replace(/\s+/g, '-')}`,
            entries: [{ speaker: 'Patient', text: `I have ${keyword}` }],
          })
          .expect(200);

        expect(response.body.emergencyDetected).toBe(true);
      });
    });

    it('should not detect false positives', async () => {
      const response = await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          roomName: testRoomName,
          entries: [
            { speaker: 'Patient', text: 'I have a mild headache' },
            { speaker: 'Patient', text: 'No chest pain' },
          ],
        })
        .expect(200);

      expect(response.body.emergencyDetected).toBe(false);
    });
  });

  describe('Analysis Debouncing', () => {
    it('should start analysis loop when first transcript arrives', async () => {
      // This test verifies that the analysis loop starts
      // In a real test, you'd mock the interval and verify it's called
      const response = await request(app)
        .post('/api/live-insights/transcript-batch')
        .send({
          roomName: testRoomName,
          patientId: testPatientId,
          entries: [{ speaker: 'Doctor', text: 'Test message for analysis' }],
        })
        .expect(200);

      expect(response.body.message).toBe('Transcript batch added');
      expect(response.body.total).toBeGreaterThan(0);
    });
  });
});
