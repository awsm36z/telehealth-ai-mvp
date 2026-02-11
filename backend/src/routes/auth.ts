import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { patientProfiles, users } from '../storage';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/auth/register
 * Register a new user (patient or doctor)
 */
router.post(
  '/register',
  [
    body().custom((value) => {
      const fullName = value?.fullName || value?.name;
      if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
        throw new Error('Full name is required');
      }
      return true;
    }),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('userType').isIn(['patient', 'doctor']).withMessage('User type must be patient or doctor'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, userType, dateOfBirth, licenseNumber } = req.body;
      const fullName = req.body.fullName || req.body.name;
      const phone = req.body.phone || null;

      // Check if user exists
      const existingUser = users.find((u) => u.email === email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = {
        id: (users.length + 1).toString(),
        fullName,
        email,
        password: hashedPassword,
        phone,
        type: userType,
        dateOfBirth: userType === 'patient' ? dateOfBirth : undefined,
        licenseNumber: userType === 'doctor' ? licenseNumber : undefined,
        createdAt: new Date().toISOString(),
      };

      users.push(user);

      // If patient, add to patient profiles
      if (userType === 'patient') {
        patientProfiles[user.id] = {
          id: user.id,
          name: fullName,
          email: user.email,
          phone,
          age: undefined,
          gender: undefined,
          dateOfBirth,
          triageData: null,
          createdAt: new Date().toISOString(),
        };
        console.log(`✅ Created patient profile for ${fullName} (ID: ${user.id})`);
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, type: user.type },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          type: user.type,
        },
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('userType').isIn(['patient', 'doctor']).withMessage('User type must be patient or doctor'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, userType } = req.body;

      // Find user
      const user = users.find((u) => u.email === email && u.type === userType);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, type: user.type },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          type: user.type,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }
);

export default router;
