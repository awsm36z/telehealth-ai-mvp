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

    it('should persist selected login language in profile', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
          userType: testUser.userType,
          language: 'fr',
        })
        .expect(200);

      expect(response.body.user.language).toBe('fr');

      const profile = await request(app)
        .get(`/api/auth/profile/${response.body.user.id}?userType=patient`)
        .expect(200);

      expect(profile.body.language).toBe('fr');
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

  describe('Profile Language APIs', () => {
    it('should update language preference via profile endpoint', async () => {
      const email = `lang_${Date.now()}@example.com`;
      const register = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Language User',
          email,
          password: 'password123',
          userType: 'doctor',
        })
        .expect(201);

      const userId = register.body.user.id;

      await request(app)
        .put(`/api/auth/profile/${userId}/language`)
        .send({ language: 'ar', userType: 'doctor' })
        .expect(200);

      const profile = await request(app)
        .get(`/api/auth/profile/${userId}?userType=doctor`)
        .expect(200);

      expect(profile.body.language).toBe('ar');
    });
  });
});
