import express, { Request, Response } from 'express';
import {
  consultationNotes,
  consultationHistory,
  patientBiometrics,
  patientInsights,
  patientTriageData,
  patientProfiles,
} from '../storage';

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
    const { roomName, doctorName, doctorLanguage, patientLanguage } = req.body;

    const patientNotes = consultationNotes[patientId];
    // Only attach notes for the same room to avoid leaking stale notes from prior consultations.
    const notes =
      patientNotes && (!roomName || !patientNotes.roomName || patientNotes.roomName === roomName)
        ? patientNotes.notes || ''
        : '';
    const insights = patientInsights[patientId] || null;
    const triageData = patientTriageData[patientId] || null;
    const biometrics = patientBiometrics[patientId] || null;

    const consultation = {
      id: `consultation-${Date.now()}`,
      patientId,
      roomName,
      doctorName: doctorName || 'Doctor',
      doctorLanguage: doctorLanguage || 'en',
      patientLanguage: patientLanguage || patientProfiles[patientId]?.language || 'en',
      notes,
      doctorNotes: notes,
      summary: insights?.summary || triageData?.chiefComplaint || 'General consultation',
      chiefComplaint: insights?.chiefComplaint || triageData?.chiefComplaint || null,
      urgency: insights?.urgency || triageData?.urgency || null,
      recommendation: insights?.recommendation || null,
      nextSteps: insights?.nextSteps || [],
      possibleConditions: insights?.possibleConditions || [],
      triageCompletedAt: triageData?.completedAt || null,
      triageTranscript: triageData?.messages || [],
      insightsSnapshot: insights,
      biometricsSnapshot: biometrics,
      completedAt: new Date().toISOString(),
    };

    if (!consultationHistory[patientId]) {
      consultationHistory[patientId] = [];
    }
    consultationHistory[patientId].push(consultation);

    console.log(`📋 Consultation recorded for patient ${patientId}, total: ${consultationHistory[patientId].length}`);
    res.json({ message: 'Consultation recorded', data: consultation });
  } catch (error: any) {
    console.error('Complete consultation error:', error);
    res.status(500).json({ message: 'Failed to record consultation', error: error.message });
  }
});

/**
 * GET /api/consultations/all
 * Get all consultations across all patients (doctor-side history view, #91)
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const all: any[] = [];
    for (const patientId of Object.keys(consultationHistory)) {
      const entries = consultationHistory[patientId] || [];
      for (const entry of entries) {
        const profile = patientProfiles[patientId];
        all.push({
          ...entry,
          patientName: profile?.name || `Patient ${patientId.slice(0, 6)}`,
          patientAvatar: profile?.avatar || null,
        });
      }
    }
    // Newest first
    all.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    res.json(all);
  } catch (error: any) {
    console.error('Get all consultations error:', error);
    res.status(500).json({ message: 'Failed to retrieve consultations', error: error.message });
  }
});

/**
 * PATCH /api/consultations/:patientId/report
 * Update the report text on the latest consultation (editable until signed, #99)
 */
router.patch('/:patientId/report', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { report } = req.body;

    if (!report || typeof report !== 'string') {
      return res.status(400).json({ message: 'Report text is required' });
    }

    const history = consultationHistory[patientId];
    if (!history || history.length === 0) {
      return res.status(404).json({ message: 'No consultation found for this patient' });
    }

    const latest = history[history.length - 1];
    if (latest.reportStatus === 'signed_final') {
      return res.status(409).json({ message: 'Report is signed and immutable — create an addendum instead' });
    }

    latest.report = report;
    latest.reportStatus = 'draft_ready';
    latest.reportUpdatedAt = new Date().toISOString();

    res.json({ message: 'Report updated', data: latest });
  } catch (error: any) {
    console.error('Update report error:', error);
    res.status(500).json({ message: 'Failed to update report', error: error.message });
  }
});

/**
 * POST /api/consultations/:patientId/report/sign
 * Sign and finalize the consultation report (#99)
 * After signing the report is immutable.
 */
router.post('/:patientId/report/sign', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { report, signerName, signatureMethod } = req.body;

    if (!signerName || typeof signerName !== 'string' || !signerName.trim()) {
      return res.status(400).json({ message: 'Signer name is required' });
    }

    const history = consultationHistory[patientId];
    if (!history || history.length === 0) {
      return res.status(404).json({ message: 'No consultation found for this patient' });
    }

    const latest = history[history.length - 1];
    if (latest.reportStatus === 'signed_final') {
      return res.status(409).json({ message: 'Report is already signed' });
    }

    // Store the final (possibly edited) report content
    if (report && typeof report === 'string') {
      latest.report = report;
    }

    const signedAt = new Date().toISOString();
    latest.reportStatus = 'signed_final';
    latest.signedAt = signedAt;
    latest.signature = {
      signerName: signerName.trim(),
      signedAt,
      signatureMethod: signatureMethod || 'typed_name',
    };

    console.log(`✍️  Consultation ${latest.id} signed by ${signerName.trim()}`);
    res.json({ message: 'Report signed and finalized', data: latest });
  } catch (error: any) {
    console.error('Sign report error:', error);
    res.status(500).json({ message: 'Failed to sign report', error: error.message });
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
