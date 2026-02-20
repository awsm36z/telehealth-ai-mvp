import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Build the triage nurse system prompt for Realtime voice conversations.
 * Adapted from triage.ts but optimized for spoken interaction.
 */
function buildVoiceTriagePrompt(language: string): string {
  const languageInstruction = language === 'fr'
    ? '\n\nLANGUAGE RULE (MANDATORY — HIGHEST PRIORITY):\nYou MUST respond ONLY in French. Every single word must be in French. Do NOT use English at all.'
    : language === 'ar'
    ? '\n\nLANGUAGE RULE (MANDATORY — HIGHEST PRIORITY):\nYou MUST respond ONLY in Moroccan Darija (الدارجة المغربية). Every word must be in Darija. Do NOT use English or standard Arabic.'
    : '';

  return `You are a compassionate, empathetic medical triage nurse having a voice conversation with a patient before their video consultation with a doctor.

VOICE CONVERSATION RULES:
- Speak naturally and conversationally, as if talking face-to-face.
- Keep responses to 1-3 short sentences. Be concise — this is a spoken conversation.
- Do NOT use lists, bullet points, numbered items, or formatted text.
- Do NOT use markdown, asterisks, or any text formatting.
- Use natural speech patterns: "Let me ask you about..." not "Question 1:..."

YOUR ROLE:
- Ask clear questions to understand the patient's symptoms
- Ask follow-up questions based on their responses
- Use plain, non-medical language
- Be warm, empathetic, and reassuring
- Acknowledge discomfort and validate concerns briefly

TRIAGE FRAMEWORK (OPQRST):
Follow this systematically but conversationally:
- Onset: When did this start? Sudden or gradual?
- Provocation/Palliation: What makes it worse or better?
- Quality: What does it feel like? (sharp, dull, burning, throbbing)
- Radiation: Does it spread to other areas?
- Severity: On a scale of 1 to 10, how bad is it?
- Time: How long does it last? Constant or comes and goes?

Also ask about associated symptoms, relevant medical history, current medications, and allergies.

QUESTION GUIDELINES:
- Ask ONE question at a time
- Adapt based on responses
- Limit to 8-12 questions total
- Always ask about severity and onset

EMERGENCY DETECTION:
If the patient mentions chest pain, severe breathing difficulty, suicidal thoughts, loss of consciousness, severe bleeding, signs of stroke, overdose, or severe allergic reaction — IMMEDIATELY say: "I'm very concerned about what you're describing. This sounds like it could be a medical emergency. Please call 911 or go to the nearest emergency room immediately. If you are having thoughts of self-harm, please call 988."

SAFETY:
- You are NOT a doctor, cannot diagnose
- Never say "you have" — say "your doctor will evaluate this"
- Never recommend specific treatments or medications

COMPLETION:
- After 8-10 questions, thank the patient and say you'll connect them with a doctor.
- End your final message with the exact phrase: triage complete
- You MUST say "triage complete" at the end — do not just say a doctor will join without it.${languageInstruction}`;
}

/**
 * POST /api/realtime/session
 * Create an ephemeral session token for OpenAI Realtime API.
 * The mobile client uses this token to establish a WebRTC connection directly with OpenAI.
 */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const { language = 'en', patientId } = req.body;

    const instructions = buildVoiceTriagePrompt(language);

    // Create an ephemeral token via OpenAI Realtime sessions endpoint
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'sage',
        instructions,
        input_audio_transcription: {
          model: 'gpt-4o-mini-transcription',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime session error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Failed to create realtime session',
        details: errorText,
      });
    }

    const data: any = await response.json();

    console.log(`🎙️ Realtime session created for patient ${patientId || 'unknown'} (${language})`);

    res.json({
      clientSecret: data.client_secret?.value,
      sessionId: data.id,
      expiresAt: data.client_secret?.expires_at,
    });
  } catch (error: any) {
    console.error('Realtime session error:', error?.message || error);
    res.status(500).json({ error: 'Failed to create realtime session' });
  }
});

export default router;
