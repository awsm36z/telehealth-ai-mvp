import express, { Request, Response } from 'express';

const router = express.Router();

// In-memory storage for patient data (replace with database)
const patientBiometrics: any = {};
const patientProfiles: any = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    age: 32,
    email: 'l7aja@gmail.com',
  },
};

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

/**
 * POST /api/patients/:id/biometrics
 * Save patient biometric data
 */
router.post('/:id/biometrics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const biometrics = req.body;

    // Validate required fields
    if (!biometrics) {
      return res.status(400).json({ message: 'Biometrics data is required' });
    }

    // Store biometrics (in production, save to database)
    patientBiometrics[id] = {
      ...biometrics,
      timestamp: new Date().toISOString(),
      patientId: id,
    };

    console.log(`✅ Saved biometrics for patient ${id}:`, biometrics);

    res.json({
      message: 'Biometrics saved successfully',
      data: patientBiometrics[id],
    });
  } catch (error: any) {
    console.error('Save biometrics error:', error);
    res.status(500).json({ message: 'Failed to save biometrics', error: error.message });
  }
});

/**
 * GET /api/patients/:id/biometrics
 * Get patient biometric data
 */
router.get('/:id/biometrics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const biometrics = patientBiometrics[id] || null;

    res.json(biometrics);
  } catch (error: any) {
    console.error('Get biometrics error:', error);
    res.status(500).json({ message: 'Failed to retrieve biometrics', error: error.message });
  }
});

/**
 * GET /api/patients/:id
 * Get complete patient data (for doctor view)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const profile = patientProfiles[id];
    const biometrics = patientBiometrics[id];

    if (!profile) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // In production, also fetch:
    // - AI insights
    // - Chat transcript
    // - Medical history
    // - Medications
    // - Allergies

    res.json({
      profile,
      biometrics,
      insights: null, // Will be populated from triage session
      chatTranscript: [], // Will be populated from triage session
    });
  } catch (error: any) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Failed to retrieve patient data', error: error.message });
  }
});

export default router;
