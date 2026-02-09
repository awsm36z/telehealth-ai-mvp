import express, { Request, Response } from 'express';
import { patientInsights, patientTriageData } from '../storage';

const router = express.Router();

/**
 * GET /api/insights/:patientId
 * Get AI-generated insights for a patient
 */
router.get('/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const insights = patientInsights[patientId];

    if (!insights) {
      return res.status(404).json({
        message: 'No insights available for this patient. Triage may not be completed yet.',
      });
    }

    res.json({
      patientId,
      ...insights,
    });
  } catch (error: any) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Failed to retrieve insights', error: error.message });
  }
});

/**
 * GET /api/insights/:patientId/triage
 * Get triage conversation data for a patient
 */
router.get('/:patientId/triage', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const triageData = patientTriageData[patientId];

    if (!triageData) {
      return res.status(404).json({
        message: 'No triage data available for this patient.',
      });
    }

    res.json({
      patientId,
      ...triageData,
    });
  } catch (error: any) {
    console.error('Get triage data error:', error);
    res.status(500).json({ message: 'Failed to retrieve triage data', error: error.message });
  }
});

export default router;
