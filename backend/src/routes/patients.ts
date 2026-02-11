import express, { Request, Response } from 'express';
import { patientBiometrics, patientProfiles, patientInsights, patientTriageData } from '../storage';

const router = express.Router();

/**
 * GET /api/patients/queue
 * Get doctor's patient queue
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    // Get patients from storage who have completed triage
    const patients = Object.values(patientProfiles).map((profile: any) => ({
      id: profile.id,
      name: profile.name,
      age: profile.age,
      chiefComplaint: profile.triageData?.chiefComplaint || 'General consultation',
      triageCompletedAt: profile.triageData?.completedAt || new Date().toISOString(),
      status: 'waiting',
      severity: profile.triageData?.urgency || 'low',
    }));

    console.log(`📋 Retrieved ${patients.length} patients from queue`);

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
    if (!biometrics || Object.keys(biometrics).length === 0) {
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
    const biometrics = patientBiometrics[id] ?? null;
    const insights = patientInsights[id] ?? null;
    const triageData = patientTriageData[id] ?? null;

    if (!profile) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      profile,
      biometrics,
      insights,
      chatTranscript: triageData?.messages || null,
      triageData,
    });
  } catch (error: any) {
    console.error('Get patient error:', error);
    res.status(500).json({ message: 'Failed to retrieve patient data', error: error.message });
  }
});

export default router;
