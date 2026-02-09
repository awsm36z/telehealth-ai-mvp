import express, { Request, Response } from 'express';
import { consultationNotes } from '../storage';

const router = express.Router();

/**
 * PUT /api/consultations/:patientId/notes
 * Save or update doctor's consultation notes
 */
router.put('/:patientId/notes', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { notes, roomName } = req.body;

    if (notes === undefined) {
      return res.status(400).json({ message: 'Notes content is required' });
    }

    consultationNotes[patientId] = {
      notes,
      roomName,
      updatedAt: new Date().toISOString(),
      patientId,
    };

    res.json({
      message: 'Notes saved',
      data: consultationNotes[patientId],
    });
  } catch (error: any) {
    console.error('Save notes error:', error);
    res.status(500).json({ message: 'Failed to save notes', error: error.message });
  }
});

/**
 * GET /api/consultations/:patientId/notes
 * Get doctor's consultation notes for a patient
 */
router.get('/:patientId/notes', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const data = consultationNotes[patientId];

    if (!data) {
      return res.status(404).json({ message: 'No notes found for this patient' });
    }

    res.json(data);
  } catch (error: any) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: 'Failed to retrieve notes', error: error.message });
  }
});

export default router;
