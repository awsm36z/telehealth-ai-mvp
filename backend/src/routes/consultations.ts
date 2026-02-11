import express, { Request, Response } from 'express';
import { consultationNotes, consultationHistory, patientInsights, patientTriageData } from '../storage';

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

/**
 * POST /api/consultations/:patientId/complete
 * Record a completed consultation in history
 */
router.post('/:patientId/complete', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { roomName, doctorName } = req.body;

    const notes = consultationNotes[patientId]?.notes || '';
    const insights = patientInsights[patientId] || null;
    const triageData = patientTriageData[patientId] || null;

    const consultation = {
      id: `consultation-${Date.now()}`,
      patientId,
      roomName,
      doctorName: doctorName || 'Doctor',
      notes,
      summary: insights?.summary || triageData?.chiefComplaint || 'General consultation',
      completedAt: new Date().toISOString(),
    };

    if (!consultationHistory[patientId]) {
      consultationHistory[patientId] = [];
    }
    consultationHistory[patientId].push(consultation);

    res.json({ message: 'Consultation recorded', data: consultation });
  } catch (error: any) {
    console.error('Complete consultation error:', error);
    res.status(500).json({ message: 'Failed to record consultation', error: error.message });
  }
});

/**
 * GET /api/consultations/:patientId/history
 * Get consultation history for a patient
 */
router.get('/:patientId/history', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const history = consultationHistory[patientId] || [];
    res.json(history);
  } catch (error: any) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Failed to retrieve history', error: error.message });
  }
});

export default router;
