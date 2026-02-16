import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { patientBiometrics, patientInsights, patientProfiles, patientTriageData } from '../storage';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const DISCLAIMER =
  'AI assist only. This is not a prescription. Doctor must independently verify all facts before prescribing medication.';

const MEDICATION_CATALOG: Record<string, string[]> = {
  MA: [
    'Paracetamol',
    'Ibuprofen',
    'Amoxicillin',
    'Azithromycin',
    'Omeprazole',
    'Metformin',
    'Amlodipine',
  ],
  GLOBAL: ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Omeprazole', 'Metformin'],
};

function getMedicationCatalog(locale?: string): string[] {
  if ((locale || '').toUpperCase().startsWith('MA')) {
    return MEDICATION_CATALOG.MA;
  }
  return MEDICATION_CATALOG.GLOBAL;
}

function buildPatientContext(patientId?: string) {
  if (!patientId) return null;
  const profile = patientProfiles[patientId];
  const insights = patientInsights[patientId];
  const triage = patientTriageData[patientId];
  const biometrics = patientBiometrics[patientId];

  return {
    profile: profile
      ? {
          name: profile.name || null,
          age: profile.age || null,
          sex: profile.gender || null,
          language: profile.language || 'en',
          dateOfBirth: profile.dateOfBirth || null,
        }
      : null,
    triageSummary: insights?.summary || triage?.chiefComplaint || null,
    chiefComplaint: insights?.chiefComplaint || triage?.chiefComplaint || null,
    knownConditions: insights?.possibleConditions || [],
    vitals: biometrics || null,
  };
}

function fallbackInsight(patientId?: string, locale?: string) {
  const context = buildPatientContext(patientId);
  const meds = getMedicationCatalog(locale);
  const complaint = context?.chiefComplaint || context?.triageSummary || 'general complaint';
  return {
    summary: `Patient context reviewed for ${complaint}.`,
    insights: [
      'Review allergies and renal/hepatic history before finalizing any medication.',
      'Cross-check interactions with current meds and chronic conditions.',
    ],
    suggestedQuestions: [
      'Do you have any known drug allergies?',
      'Have you taken similar medication recently and how did you respond?',
    ],
    possibleMedication: meds.slice(0, 4).map((name) => ({
      name,
      rationale: 'Commonly used option; suitability depends on diagnosis and contraindications.',
      confidence: 'low',
      market: (locale || '').toUpperCase().startsWith('MA') ? 'Morocco catalog' : 'General catalog',
    })),
    considerations: [
      'Verify dosage based on age, weight, and comorbidities.',
      'Confirm pregnancy/breastfeeding status when relevant.',
    ],
    contraindications: ['Unknown allergies', 'Drug-drug interactions not yet validated'],
    provenance: 'Rule-based fallback (AI unavailable)',
    confidence: 'low',
    disclaimer: DISCLAIMER,
  };
}

async function generateAiInsight(patientId?: string, locale?: string, conversationSummary?: string) {
  const context = buildPatientContext(patientId);
  const catalog = getMedicationCatalog(locale);
  const localeName = (locale || '').toUpperCase().startsWith('MA') ? 'Morocco' : 'global';

  if (!process.env.OPENAI_API_KEY) {
    return fallbackInsight(patientId, locale);
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          `You are a clinical copilot for licensed physicians. Never prescribe. Output strict JSON with keys: summary, insights, suggestedQuestions, possibleMedication, considerations, contraindications, provenance, confidence. ` +
          `possibleMedication must be an array of objects with keys: name, rationale, confidence, market. ` +
          `If locale is Morocco, prioritize medications from this catalog first: ${catalog.join(', ')}. ` +
          `Always keep uncertainty explicit.`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          locale: localeName,
          patientContext: context,
          conversationSummary: conversationSummary || null,
        }),
      },
    ],
    max_tokens: 700,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    return fallbackInsight(patientId, locale);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallbackInsight(patientId, locale);
  }

  return {
    summary: parsed.summary || 'No summary available.',
    insights: Array.isArray(parsed.insights) ? parsed.insights : [],
    suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : [],
    possibleMedication: Array.isArray(parsed.possibleMedication) ? parsed.possibleMedication : [],
    considerations: Array.isArray(parsed.considerations) ? parsed.considerations : [],
    contraindications: Array.isArray(parsed.contraindications) ? parsed.contraindications : [],
    provenance: parsed.provenance || 'OpenAI model synthesis',
    confidence: parsed.confidence || 'medium',
    disclaimer: DISCLAIMER,
  };
}

router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { patientId, locale, conversationSummary } = req.body;
    const data = await generateAiInsight(patientId, locale, conversationSummary);
    return res.json(data);
  } catch (error: any) {
    console.error('Medication insight error:', error);
    return res.status(500).json({
      message: 'Failed to generate medication insights',
      data: fallbackInsight(req.body?.patientId, req.body?.locale),
      error: error.message,
    });
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { patientId, locale, question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ message: 'question is required' });
    }

    const context = buildPatientContext(patientId);
    const meds = getMedicationCatalog(locale);

    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        answer:
          `Potential references to review: ${meds.slice(0, 5).join(', ')}. ` +
          'Validate indication, interactions, allergies, and local availability before any prescription.',
        disclaimer: DISCLAIMER,
        confidence: 'low',
        provenance: 'Rule-based fallback (AI unavailable)',
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content:
            'You are a physician copilot for medication research. Never prescribe. Keep concise and safety-first. Always include uncertainty and suggest doctor verification.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            question,
            locale,
            knownMedicationCatalog: meds,
            patientContext: context,
          }),
        },
      ],
      max_tokens: 350,
    });

    return res.json({
      answer: completion.choices[0]?.message?.content || 'No answer generated.',
      disclaimer: DISCLAIMER,
      confidence: 'medium',
      provenance: 'OpenAI model synthesis',
    });
  } catch (error: any) {
    console.error('Medication chat error:', error);
    return res.status(500).json({
      message: 'Failed to answer medication question',
      error: error.message,
      disclaimer: DISCLAIMER,
    });
  }
});

export default router;
