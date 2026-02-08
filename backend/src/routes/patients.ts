import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/patients/queue
 * Get doctor's patient queue
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    // Mock patient queue (replace with database query)
    const patients = [
      {
        id: '1',
        name: 'Sarah Johnson',
        age: 32,
        chiefComplaint: 'Sore throat and fever',
        triageCompleted: '15 min ago',
        status: 'waiting',
        severity: 'medium',
      },
    ];

    res.json(patients);
  } catch (error: any) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Failed to retrieve patient queue', error: error.message });
  }
});

export default router;
