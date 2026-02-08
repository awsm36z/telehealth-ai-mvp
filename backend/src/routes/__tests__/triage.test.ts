import request from 'supertest';
import express from 'express';
import triageRouter from '../triage';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/triage', triageRouter);

describe('Triage API', () => {
  describe('POST /api/triage/chat', () => {
    // Skip if no API key for CI/CD
    const skipIfNoApiKey = process.env.OPENAI_API_KEY ? it : it.skip;

    skipIfNoApiKey('should process initial triage message', async () => {
      const response = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a headache' }
          ]
        })
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('complete');
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    }, 15000); // 15s timeout for API call

    skipIfNoApiKey('should maintain conversation context', async () => {
      const firstResponse = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat' }
          ]
        })
        .expect(200);

      const sessionId = firstResponse.body.sessionId;

      const secondResponse = await request(app)
        .post('/api/triage/chat')
        .send({
          messages: [
            { role: 'user', content: 'I have a sore throat' },
            { role: 'ai', content: firstResponse.body.message },
            { role: 'user', content: 'About 3 days' }
          ]
        })
        .expect(200);

      expect(secondResponse.body).toHaveProperty('message');
      expect(secondResponse.body.sessionId).toBe(sessionId);
    }, 15000);

    it('should return 400 for missing messages', async () => {
      const response = await request(app)
        .post('/api/triage/chat')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Messages are required');
    });

    it('should return 400 for empty messages array', async () => {
      const response = await request(app)
        .post('/api/triage/chat')
        .send({ messages: [] })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Messages are required');
    });

    it('should handle invalid message format', async () => {
      const response = await request(app)
        .post('/api/triage/chat')
        .send({ messages: [{ invalid: 'format' }] })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/triage/insights', () => {
    const skipIfNoApiKey = process.env.OPENAI_API_KEY ? it : it.skip;

    skipIfNoApiKey('should generate insights from conversation', async () => {
      const messages = [
        { role: 'user', content: 'I have a headache and fever' },
        { role: 'ai', content: 'How long have you had these symptoms?' },
        { role: 'user', content: 'About 2 days' },
        { role: 'ai', content: 'On a scale of 1-10, how severe is the headache?' },
        { role: 'user', content: 'About 7' }
      ];

      const response = await request(app)
        .post('/api/triage/insights')
        .send({ messages })
        .expect(200);

      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('keyFindings');
      expect(response.body).toHaveProperty('possibleConditions');
      expect(response.body).toHaveProperty('nextSteps');
      expect(Array.isArray(response.body.keyFindings)).toBe(true);
      expect(Array.isArray(response.body.possibleConditions)).toBe(true);
      expect(Array.isArray(response.body.nextSteps)).toBe(true);
    }, 15000);

    it('should return 400 for missing messages', async () => {
      const response = await request(app)
        .post('/api/triage/insights')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Messages are required');
    });
  });
});
