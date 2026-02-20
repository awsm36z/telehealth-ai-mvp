// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from '@sentry/node';

// Initialize Sentry error monitoring (Issue #9)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
  console.log('🛡️ Sentry error monitoring initialized');
}

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initStorage, flushStorage } from './storage';

// Import routes
import authRoutes from './routes/auth';
import triageRoutes from './routes/triage';
import insightsRoutes from './routes/insights';
import patientsRoutes from './routes/patients';
import videoRoutes from './routes/video';
import consultationsRoutes from './routes/consultations';
import aiAssistRoutes from './routes/ai-assist';
import analyticsRoutes from './routes/analytics';
import translateRoutes from './routes/translate';
import liveInsightsRoutes from './routes/live-insights';
import medicationAssistRoutes from './routes/medication-assist';
import messagesRoutes from './routes/messages';
import ttsRoutes from './routes/tts';
import realtimeRoutes from './routes/realtime';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser or same-origin requests.
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/triage', triageRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/ai-assist', aiAssistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/live-insights', liveInsightsRoutes);
app.use('/api/medication-assist', medicationAssistRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/realtime', realtimeRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    db: process.env.DATA_STORE_MODE === 'postgres' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);

  // Report to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

async function startServer() {
  await initStorage();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Vitali Backend running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    if (allowedOrigins.length > 0) {
      console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`);
    }
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await flushStorage();
    } catch (error) {
      console.error('Error flushing storage during shutdown:', error);
    }

    server.close((err) => {
      if (err) {
        console.error('Error during HTTP server close:', err);
        process.exit(1);
      }
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default app;
