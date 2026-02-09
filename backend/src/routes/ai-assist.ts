import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { patientInsights, patientTriageData, patientBiometrics } from '../storage';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * POST /api/ai-assist/ask
 * Doctor asks AI a clinical question during consultation
 */
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, patientId } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    // Gather patient context
    let patientContext = '';

    const insights = patientInsights[patientId];
    if (insights) {
      patientContext += `\nPATIENT TRIAGE INSIGHTS:\n- Summary: ${insights.summary || 'N/A'}`;
      if (insights.keyFindings?.length) {
        patientContext += `\n- Key Findings: ${insights.keyFindings.join('; ')}`;
      }
      if (insights.possibleConditions?.length) {
        patientContext += `\n- Possible Conditions: ${insights.possibleConditions.map((c: any) => `${c.name} (${c.confidence})`).join(', ')}`;
      }
    }

    const biometrics = patientBiometrics[patientId];
    if (biometrics) {
      const vitals: string[] = [];
      if (biometrics.bloodPressureSystolic) vitals.push(`BP: ${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic} mmHg`);
      if (biometrics.heartRate) vitals.push(`HR: ${biometrics.heartRate} bpm`);
      if (biometrics.temperature) vitals.push(`Temp: ${biometrics.temperature}${biometrics.temperatureUnit === 'C' ? '°C' : '°F'}`);
      if (biometrics.bloodOxygen) vitals.push(`SpO2: ${biometrics.bloodOxygen}%`);
      if (vitals.length) patientContext += `\n\nVITAL SIGNS: ${vitals.join(', ')}`;
    }

    const systemPrompt = `You are a clinical decision support AI assisting a doctor during a live video consultation. The doctor is asking you a question while speaking with their patient.

${patientContext ? `PATIENT CONTEXT:${patientContext}` : 'No patient context available.'}

GUIDELINES:
- Provide evidence-based clinical information
- Use professional medical terminology appropriate for a physician
- Be concise — the doctor is in a live consultation
- Include relevant differentials, complications, or treatment considerations when applicable
- Always note when clinical guidelines vary or when specialist referral may be warranted
- NEVER provide definitive treatment plans — only suggestions for the doctor to consider
- Cite relevant guidelines (e.g., CDC, AHA, AAP) when applicable`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const answer = completion.choices[0].message.content || 'Unable to generate a response.';

    res.json({ answer });
  } catch (error: any) {
    console.error('AI assist error:', error);
    res.status(500).json({
      message: 'Failed to get AI response',
      error: error.message,
    });
  }
});

export default router;
