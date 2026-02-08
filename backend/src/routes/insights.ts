import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/insights/:patientId
 * Get AI-generated insights for a patient
 */
router.get('/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    // Mock insights (replace with database query)
    const insights = {
      patientId,
      summary: "Patient presents with acute symptoms requiring evaluation.",
      keyFindings: [
        "Primary complaint documented",
        "Vital signs within normal limits",
      ],
      possibleConditions: [
        {
          name: "Condition A",
          description: "Common presentation",
          confidence: "Medium",
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    res.json(insights);
  } catch (error: any) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Failed to retrieve insights', error: error.message });
  }
});

export default router;
