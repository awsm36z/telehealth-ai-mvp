import express, { Request, Response } from 'express';
import { activeCalls, patientBiometrics, patientProfiles, patientInsights, patientTriageData } from '../storage';

const router = express.Router();

/**
 * GET /api/patients/queue
 * Get doctor's patient queue
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    // Build queue from currently active/waiting calls to avoid stale profile-only entries.
    const queueCalls = Object.values(activeCalls)
      .filter((call: any) => call.status === 'waiting' || call.status === 'active')
      .sort((a: any, b: any) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return aTime - bTime;
      });

    const callsByPatient = new Map<string, any>();
    for (const call of queueCalls) {
      const patientId = String(call.patientId);
      // Keep the latest call for a patient in case duplicates exist.
      callsByPatient.set(patientId, call);
    }

    let patients = Array.from(callsByPatient.entries()).map(([patientId, call]) => {
      const profile = patientProfiles[patientId] || null;
      const triageData = patientTriageData[patientId] || profile?.triageData || null;
      const insights = patientInsights[patientId] || null;

      return {
        id: patientId,
        name: profile?.name || `Patient ${patientId}`,
        age: profile?.age ?? 0,
        language: profile?.language || 'en',
        chiefComplaint: insights?.chiefComplaint || triageData?.chiefComplaint || 'General consultation',
        triageCompletedAt: triageData?.completedAt || call.createdAt || new Date().toISOString(),
        status: call.status === 'active' ? 'active' : 'waiting',
        severity: insights?.urgency || triageData?.urgency || 'low',
        roomName: call.roomName,
      };
    });

    // Backward compatibility for test/dev flows that expect queue entries
    // even before a call room has been created.
    if (patients.length === 0) {
      patients = Object.values(patientProfiles).map((profile: any) => {
        const patientId = String(profile.id);
        const triageData = patientTriageData[patientId] || profile?.triageData || null;
        const insights = patientInsights[patientId] || null;

        return {
          id: patientId,
          name: profile?.name || `Patient ${patientId}`,
          age: profile?.age ?? 0,
          language: profile?.language || 'en',
          chiefComplaint: insights?.chiefComplaint || triageData?.chiefComplaint || 'General consultation',
          triageCompletedAt: triageData?.completedAt || profile?.createdAt || new Date().toISOString(),
          status: 'waiting',
          severity: insights?.urgency || triageData?.urgency || 'low',
          roomName: null,
        };
      });
    }

    console.log(`📋 Retrieved ${patients.length} patients from active queue`);

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
      language: profile?.language || 'en',
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
