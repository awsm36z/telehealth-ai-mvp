import request from 'supertest';
import express from 'express';
import authRouter from '../auth';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new patient', async () => {
      const userData = {
        fullName: 'Test Patient',
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        phone: '555-1234',
        userType: 'patient',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
      expect(response.body.user).toHaveProperty('type', 'patient');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should register a new doctor', async () => {
      const userData = {
        fullName: 'Dr. Test',
        email: `doctor_${Date.now()}@example.com`,
        password: 'password123',
        phone: '555-5678',
        userType: 'doctor',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.user).toHaveProperty('type', 'doctor');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test',
          password: 'password123',
          userType: 'patient',
        })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 400 for duplicate email', async () => {
      const userData = {
        fullName: 'Test Patient',
        email: `duplicate_${Date.now()}@example.com`,
        password: 'password123',
        phone: '555-1234',
        userType: 'patient',
      };

      await request(app).post('/api/auth/register').send(userData).expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      fullName: 'Login Test',
      email: `logintest_${Date.now()}@example.com`,
      password: 'password123',
      phone: '555-9999',
      userType: 'patient',
    };

    beforeAll(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          userType: testUser.userType,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
    });

    it('should return 401 for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
          userType: testUser.userType,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
          userType: 'patient',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});
