import request from 'supertest';
import express from 'express';
import messagesRouter from '../messages';
import { consultationMessages } from '../../storage';

const app = express();
app.use(express.json());
app.use('/api/messages', messagesRouter);

describe('Messages API', () => {
  beforeEach(() => {
    Object.keys(consultationMessages).forEach((key) => delete consultationMessages[key]);
  });

  it('stores sender language metadata with thread messages', async () => {
    const post = await request(app)
      .post('/api/messages/patient-1')
      .send({
        senderType: 'doctor',
        senderName: 'Dr. Test',
        senderLanguage: 'ar',
        message: 'Follow-up after call',
      })
      .expect(201);

    expect(post.body.data.senderLanguage).toBe('ar');

    const list = await request(app)
      .get('/api/messages/patient-1')
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body[0].senderLanguage).toBe('ar');
  });

  it('defaults senderLanguage to en when missing', async () => {
    const post = await request(app)
      .post('/api/messages/patient-2')
      .send({
        senderType: 'patient',
        senderName: 'Patient',
        message: 'Need update',
      })
      .expect(201);

    expect(post.body.data.senderLanguage).toBe('en');
  });
});
