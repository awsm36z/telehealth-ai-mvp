import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Available OpenAI TTS voices
const VALID_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
type Voice = typeof VALID_VOICES[number];

/**
 * POST /api/tts
 * Convert text to speech using OpenAI TTS API.
 * Body: { text: string, voice?: string }
 * Returns: audio/mpeg binary
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'nova' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (text.length > 4096) {
      return res.status(400).json({ error: 'Text too long (max 4096 characters)' });
    }

    const selectedVoice: Voice = VALID_VOICES.includes(voice as Voice) ? (voice as Voice) : 'nova';

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: selectedVoice,
      input: text.trim(),
      response_format: 'mp3',
      speed: 1.0,
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=3600',
    });

    res.send(buffer);
  } catch (error: any) {
    console.error('TTS error:', error?.message || error);
    res.status(500).json({ error: 'Text-to-speech generation failed' });
  }
});

/**
 * GET /api/tts/voices
 * List available voice options.
 */
router.get('/voices', (_req: Request, res: Response) => {
  res.json({
    voices: VALID_VOICES.map((v) => ({
      id: v,
      description:
        v === 'nova' ? 'Warm, conversational (default)' :
        v === 'shimmer' ? 'Expressive, clear' :
        v === 'alloy' ? 'Neutral, balanced' :
        v === 'echo' ? 'Warm, smooth' :
        v === 'fable' ? 'Expressive, British' :
        v === 'onyx' ? 'Deep, authoritative' : v,
    })),
    default: 'nova',
  });
});

export default router;
