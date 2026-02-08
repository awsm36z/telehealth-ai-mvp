import express, { Request, Response } from 'express';
import OpenAI from 'openai';
// import Anthropic from '@anthropic-ai/sdk'; // Alternative LLM

const router = express.Router();

// Initialize OpenAI (or Anthropic)
const apiKey = process.env.OPENAI_API_KEY || '';
console.log('🔑 OpenAI API Key loaded:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

const openai = new OpenAI({
  apiKey: apiKey,
});

// In-memory storage for triage sessions (replace with database)
const triageSessions: any = {};

/**
 * POST /api/triage/chat
 * Continue triage conversation with LLM
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, sessionId } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: 'Messages are required' });
    }

    // System prompt for medical triage
    const systemPrompt = `You are a medical triage assistant helping gather information from a patient before their video consultation with a doctor.

YOUR ROLE:
- Ask clear, concise questions to understand the patient's symptoms and concerns
- Ask follow-up questions based on their responses
- Use plain language that patients can understand
- Be empathetic and professional

GUIDELINES:
- Start with "What brings you here today?"
- Ask about symptom onset, duration, severity, location, character
- Ask about aggravating and relieving factors
- Ask about associated symptoms
- Identify any red flags requiring emergency care
- Limit to 10-12 questions maximum
- Adapt questions based on responses

IMPORTANT:
- Do NOT provide diagnoses or medical advice
- Do NOT recommend medications or treatments
- If patient describes emergency symptoms (chest pain, difficulty breathing, severe bleeding), immediately advise them to seek emergency care

EMERGENCY RED FLAGS:
- Chest pain with radiation
- Severe difficulty breathing
- Loss of consciousness
- Severe bleeding
- Sudden severe headache
- Suicidal thoughts

Previous conversation:
${JSON.stringify(messages.slice(-5))} // Last 5 messages for context

Generate the next triage question or conclude if sufficient information is gathered. If you've gathered enough information (8-12 questions answered), respond with: "TRIAGE_COMPLETE"`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const aiResponse = completion.choices[0].message.content || '';
    const isComplete = aiResponse.includes('TRIAGE_COMPLETE');

    // Store session
    const sessionKey = sessionId || Date.now().toString();
    triageSessions[sessionKey] = {
      messages: [...messages, { role: 'ai', content: aiResponse }],
      complete: isComplete,
      timestamp: new Date().toISOString(),
    };

    if (isComplete) {
      // Generate insights
      const insights = await generateInsights(messages);

      return res.json({
        message: "Thank you for answering these questions. I'm now generating health insights for your doctor.",
        complete: true,
        triageData: triageSessions[sessionKey],
        insights,
      });
    }

    res.json({
      message: aiResponse,
      complete: false,
      sessionId: sessionKey,
    });
  } catch (error: any) {
    console.error('Triage chat error:', error);
    res.status(500).json({
      message: 'Failed to process triage request',
      error: error.message,
    });
  }
});

/**
 * Generate AI insights from triage data
 */
async function generateInsights(messages: any[]) {
  try {
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'Patient' : 'AI'}: ${m.content}`)
      .join('\n');

    const insightsPrompt = `You are a clinical decision support AI generating insights for a doctor reviewing a patient case before a video consultation.

TRIAGE CONVERSATION:
${conversationText}

Generate structured clinical insights in the following JSON format:
{
  "summary": "2-3 sentence overview of patient presentation",
  "keyFindings": ["finding 1", "finding 2", ...],
  "possibleConditions": [
    {
      "name": "Condition name",
      "description": "Brief rationale",
      "confidence": "High/Medium/Low"
    }
  ],
  "nextSteps": ["step 1", "step 2", ...]
}

IMPORTANT:
- Use probabilistic language ("may indicate," "consider," "possible")
- Do NOT provide definitive diagnoses
- Highlight missing information that would be helpful
- Include confidence levels for each differential diagnosis`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: insightsPrompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const insightsText = completion.choices[0].message.content || '{}';
    return JSON.parse(insightsText);
  } catch (error) {
    console.error('Error generating insights:', error);
    return {
      summary: 'Unable to generate insights at this time.',
      keyFindings: [],
      possibleConditions: [],
      nextSteps: ['Schedule video consultation with doctor'],
    };
  }
}

export default router;
