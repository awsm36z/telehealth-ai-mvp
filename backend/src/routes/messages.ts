import express, { Request, Response } from 'express';
import { consultationMessages } from '../storage';

const router = express.Router();

/**
 * GET /api/messages/:patientId
 * Fetch asynchronous doctor/patient message thread.
 */
router.get('/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const thread = consultationMessages[patientId] || [];
  res.json(thread);
});

/**
 * POST /api/messages/:patientId
 * Add message to doctor/patient thread.
 */
router.post('/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { senderType, senderName, senderLanguage, message } = req.body;

  if (!senderType || !message) {
    return res.status(400).json({ message: 'senderType and message are required' });
  }

  if (senderType !== 'patient' && senderType !== 'doctor') {
    return res.status(400).json({ message: 'senderType must be patient or doctor' });
  }

  const entry = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    patientId,
    senderType,
    senderName: senderName || (senderType === 'doctor' ? 'Doctor Office' : 'Patient'),
    senderLanguage: ['en', 'fr', 'ar'].includes(senderLanguage) ? senderLanguage : 'en',
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  };

  if (!entry.message) {
    return res.status(400).json({ message: 'message cannot be empty' });
  }

  if (!consultationMessages[patientId]) {
    consultationMessages[patientId] = [];
  }
  consultationMessages[patientId].push(entry);

  return res.status(201).json({
    message: 'Thread message posted',
    data: entry,
  });
});

export default router;
