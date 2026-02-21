import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { patientInsights, patientBiometrics } from '../storage';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const MEDICATION_DISCLAIMER =
  'AI assist only. This is not a prescription. Doctor must verify all facts before prescribing.';

const MOROCCO_MEDICATIONS = ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Azithromycin', 'Omeprazole'];

// In-memory store for live transcripts per room
const liveTranscripts: Record<string, { entries: { speaker: string; text: string; timestamp: string }[]; lastInsight: string }> = {};

/**
 * POST /api/live-insights/transcript
 * Add a transcript entry from the live call
 */
router.post('/transcript', async (req: Request, res: Response) => {
  try {
    const { roomName, speaker, text } = req.body;

    if (!roomName || !text) {
      return res.status(400).json({ message: 'roomName and text are required' });
    }

    if (!liveTranscripts[roomName]) {
      liveTranscripts[roomName] = { entries: [], lastInsight: '' };
    }

    liveTranscripts[roomName].entries.push({
      speaker: speaker || 'Unknown',
      text,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Transcript entry added', total: liveTranscripts[roomName].entries.length });
  } catch (error: any) {
    console.error('Live transcript error:', error);
    res.status(500).json({ message: 'Failed to add transcript entry', error: error.message });
  }
});

/**
 * GET /api/live-insights/transcript/:roomName
 * Get the live transcript for a room
 */
router.get('/transcript/:roomName', async (req: Request, res: Response) => {
  try {
    const { roomName } = req.params;
    const transcript = liveTranscripts[roomName];

    res.json({
      entries: transcript?.entries || [],
      total: transcript?.entries.length || 0,
    });
  } catch (error: any) {
    console.error('Get transcript error:', error);
    res.status(500).json({ message: 'Failed to get transcript', error: error.message });
  }
});

/**
 * POST /api/live-insights/analyze
 * Generate real-time AI insights from the ongoing conversation
 */
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { roomName, patientId, locale } = req.body;

    if (!roomName) {
      return res.status(400).json({ message: 'roomName is required' });
    }

    const transcript = liveTranscripts[roomName];
    if (!transcript || transcript.entries.length === 0) {
      return res.json({ insight: 'No conversation recorded yet.', entries: 0 });
    }

    // Build context
    let patientContext = '';
    if (patientId) {
      const insights = patientInsights[patientId];
      if (insights?.summary) {
        patientContext = `\nPATIENT TRIAGE SUMMARY: ${insights.summary}`;
      }
      const biometrics = patientBiometrics[patientId];
      if (biometrics) {
        const vitals: string[] = [];
        if (biometrics.bloodPressureSystolic) vitals.push(`BP: ${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic}`);
        if (biometrics.heartRate) vitals.push(`HR: ${biometrics.heartRate}`);
        if (biometrics.temperature) vitals.push(`Temp: ${biometrics.temperature}`);
        if (vitals.length) patientContext += `\nVITALS: ${vitals.join(', ')}`;
      }
    }

    const conversationText = transcript.entries
      .slice(-20) // Last 20 entries
      .map((e) => `${e.speaker}: ${e.text}`)
      .join('\n');

    const isMorocco = String(locale || '').toUpperCase().startsWith('MA');

    if (!process.env.OPENAI_API_KEY) {
      const fallbackMedication = isMorocco
        ? MOROCCO_MEDICATIONS.slice(0, 3).map((name) => ({
            name,
            rationale: 'Potential locally available option; requires diagnosis and contraindication review.',
            confidence: 'low',
            market: 'Morocco catalog',
          }))
        : [];

      return res.json({
        insight: `LIVE SUMMARY: Conversation in progress.\n\nINSIGHTS:\n- Continue focused history and symptom clarification.\n\nWARNING: ${MEDICATION_DISCLAIMER}`,
        liveSummary: 'Conversation in progress.',
        insights: ['Continue focused history and symptom clarification.'],
        suggestedQuestions: ['Any red-flag symptoms since onset?', 'Any current medications or allergies?'],
        possibleDiagnostics: [],
        possibleMedication: fallbackMedication,
        medicationDisclaimer: MEDICATION_DISCLAIMER,
        provenance: 'Rule-based fallback (AI unavailable)',
        confidence: 'low',
        warning: MEDICATION_DISCLAIMER,
        entries: transcript.entries.length,
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            `You are a real-time clinical assistant for doctors. Analyze ongoing conversation and return strict JSON with keys: liveSummary, insights, suggestedQuestions, possibleDiagnostics, possibleMedication, provenance, confidence, warning. ${patientContext} ` +
            `possibleDiagnostics should be an array of {name, description, confidence} where confidence is "High", "Medium", or "Low". These are possible diagnoses the doctor may consider based on the conversation so far. ` +
            `possibleMedication should be an array of {name, rationale, confidence, market}. Never prescribe. Never diagnose. Keep uncertainty explicit. ` +
            (isMorocco
              ? `When suggesting medication, prioritize products present in Morocco such as ${MOROCCO_MEDICATIONS.join(', ')}.`
              : ''),
        },
        { role: 'user', content: `Analyze this ongoing conversation:\n\n${conversationText}` },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });
    const raw = completion.choices[0].message.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const liveSummary = parsed.liveSummary || 'Live summary unavailable.';
    const insights = Array.isArray(parsed.insights) ? parsed.insights : [];
    const suggestedQuestions = Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : [];
    const possibleDiagnostics = Array.isArray(parsed.possibleDiagnostics) ? parsed.possibleDiagnostics : [];
    const possibleMedication = Array.isArray(parsed.possibleMedication)
      ? parsed.possibleMedication
      : isMorocco
      ? MOROCCO_MEDICATIONS.slice(0, 3).map((name) => ({
          name,
          rationale: 'Potential local option to validate against diagnosis/contraindications.',
          confidence: 'low',
          market: 'Morocco catalog',
        }))
      : [];

    const insight = [
      `LIVE SUMMARY: ${liveSummary}`,
      insights.length ? `INSIGHTS:\n- ${insights.join('\n- ')}` : null,
      suggestedQuestions.length ? `SUGGESTED QUESTIONS:\n- ${suggestedQuestions.join('\n- ')}` : null,
      possibleDiagnostics.length
        ? `POSSIBLE DIAGNOSTICS:\n- ${possibleDiagnostics
            .map((d: any) => `${d.name} [${d.confidence}] — ${d.description || ''}`)
            .join('\n- ')}`
        : null,
      possibleMedication.length
        ? `POSSIBLE MEDICATION:\n- ${possibleMedication
            .map((m: any) => `${m.name} (${m.rationale || 'validate clinical fit'})`)
            .join('\n- ')}`
        : null,
      `WARNING: ${MEDICATION_DISCLAIMER}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    transcript.lastInsight = insight;

    res.json({
      insight,
      liveSummary,
      insights,
      suggestedQuestions,
      possibleDiagnostics,
      possibleMedication,
      medicationDisclaimer: MEDICATION_DISCLAIMER,
      provenance: parsed.provenance || 'OpenAI model synthesis',
      confidence: parsed.confidence || 'medium',
      warning: parsed.warning || MEDICATION_DISCLAIMER,
      entries: transcript.entries.length,
    });
  } catch (error: any) {
    console.error('Live insights error:', error);
    res.status(500).json({ message: 'Failed to generate insights', error: error.message });
  }
});

/**
 * DELETE /api/live-insights/transcript/:roomName
 * Clear transcript when call ends
 */
router.delete('/transcript/:roomName', async (req: Request, res: Response) => {
  const { roomName } = req.params;
  delete liveTranscripts[roomName];
  res.json({ message: 'Transcript cleared' });
});

export default router;
