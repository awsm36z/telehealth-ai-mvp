import express, { Request, Response } from 'express';
import OpenAI from 'openai';

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  ar: 'Moroccan Darija (Arabic dialect)',
};

/**
 * POST /api/translate
 * Translate text from one language to another using AI
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, from, to } = req.body;

    if (!text || !from || !to) {
      return res.status(400).json({ message: 'text, from, and to language codes are required' });
    }

    if (from === to) {
      return res.json({ translated: text, from, to });
    }

    const fromName = LANGUAGE_NAMES[from] || from;
    const toName = LANGUAGE_NAMES[to] || to;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a medical translator. Translate the following text from ${fromName} to ${toName}. Preserve medical terminology accurately. Return ONLY the translated text, nothing else.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const translated = completion.choices[0].message.content || text;

    res.json({ translated, from, to });
  } catch (error: any) {
    console.error('Translation error:', error);
    res.status(500).json({
      message: 'Translation failed',
      error: error.message,
    });
  }
});

/**
 * POST /api/translate/batch
 * Translate multiple texts at once
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { texts, from, to } = req.body;

    if (!texts || !Array.isArray(texts) || !from || !to) {
      return res.status(400).json({ message: 'texts (array), from, and to language codes are required' });
    }

    if (from === to) {
      return res.json({ translations: texts, from, to });
    }

    const fromName = LANGUAGE_NAMES[from] || from;
    const toName = LANGUAGE_NAMES[to] || to;

    const numbered = texts.map((t: string, i: number) => `[${i}] ${t}`).join('\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a medical translator. Translate each numbered line from ${fromName} to ${toName}. Preserve medical terminology accurately. Return ONLY the translated lines in the same numbered format [0], [1], etc. Keep each translation on its own line.`,
        },
        { role: 'user', content: numbered },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    const result = completion.choices[0].message.content || '';
    const translations = texts.map((_: string, i: number) => {
      const regex = new RegExp(`\\[${i}\\]\\s*(.+?)(?=\\n\\[|$)`, 's');
      const match = result.match(regex);
      return match ? match[1].trim() : texts[i];
    });

    res.json({ translations, from, to });
  } catch (error: any) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      message: 'Batch translation failed',
      error: error.message,
    });
  }
});

export default router;
