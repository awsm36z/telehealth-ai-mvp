import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { patientBiometrics, triageSessions } from '../storage';
// import Anthropic from '@anthropic-ai/sdk'; // Alternative LLM

const router = express.Router();

// Initialize OpenAI (or Anthropic)
const apiKey = process.env.OPENAI_API_KEY || '';
console.log('🔑 OpenAI API Key loaded:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');

const openai = new OpenAI({
  apiKey: apiKey,
});

/**
 * Format biometric data for AI analysis
 */
function formatBiometrics(biometrics: any): string {
  const lines: string[] = [];

  // Vital Signs
  if (biometrics.bloodPressureSystolic && biometrics.bloodPressureDiastolic) {
    lines.push(`- Blood Pressure: ${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic} mmHg`);
  }
  if (biometrics.heartRate) {
    lines.push(`- Heart Rate: ${biometrics.heartRate} bpm`);
  }
  if (biometrics.temperature) {
    const unit = biometrics.temperatureUnit === 'C' ? '°C' : '°F';
    lines.push(`- Temperature: ${biometrics.temperature}${unit}`);
  }
  if (biometrics.respiratoryRate) {
    lines.push(`- Respiratory Rate: ${biometrics.respiratoryRate} breaths/min`);
  }
  if (biometrics.bloodOxygen) {
    lines.push(`- Blood Oxygen (SpO2): ${biometrics.bloodOxygen}%`);
  }

  // Physical Measurements
  if (biometrics.weight) {
    const unit = biometrics.weightUnit || 'lbs';
    lines.push(`- Weight: ${biometrics.weight} ${unit}`);
  }
  if (biometrics.height) {
    const unit = biometrics.heightUnit || 'cm';
    lines.push(`- Height: ${biometrics.height} ${unit}`);
  }

  // Additional Metrics
  if (biometrics.bloodSugar) {
    const context = biometrics.bloodSugarContext || 'random';
    lines.push(`- Blood Sugar: ${biometrics.bloodSugar} mg/dL (${context})`);
  }
  if (biometrics.painLevel) {
    lines.push(`- Pain Level: ${biometrics.painLevel}/10`);
  }

  // Notes
  if (biometrics.notes) {
    lines.push(`- Patient Notes: "${biometrics.notes}"`);
  }

  return lines.join('\n');
}

/**
 * POST /api/triage/chat
 * Continue triage conversation with LLM
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, sessionId, patientId } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: 'Messages are required' });
    }

    // Check if this is an initial greeting request
    const isInitialGreeting = messages.length === 1 && messages[0].content === '__INITIAL_GREETING__';

    // Check if this is the first real user message (start of conversation)
    const isFirstMessage = messages.length === 1 && messages[0].role === 'user' && !isInitialGreeting;

    // Handle initial greeting with biometric analysis
    if (isInitialGreeting && patientId) {
      const biometrics = patientBiometrics[patientId];

      if (biometrics && Object.keys(biometrics).length > 0) {
        // Format biometrics for AI analysis
        const biometricData = formatBiometrics(biometrics);

        const greetingPrompt = `You are a medical triage assistant. A patient has just entered biometric data before starting their consultation. Analyze their vital signs and provide a professional greeting.

PATIENT BIOMETRICS:
${biometricData}

Generate a response that:
1. Greets the patient warmly
2. Briefly acknowledges their biometric readings (1-2 sentences)
3. Notes any concerning values if present (elevated temperature, abnormal heart rate, high pain level, etc.)
4. Then asks "What brings you here today?"

Keep it concise, empathetic, and professional. Do not diagnose or provide medical advice.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: greetingPrompt }],
          temperature: 0.7,
          max_tokens: 300,
        });

        const greeting = completion.choices[0].message.content || "Hello! What brings you here today?";

        return res.json({
          message: greeting,
          complete: false,
          sessionId: Date.now().toString(),
        });
      } else {
        // No biometrics available, return standard greeting
        return res.json({
          message: "Hello! I'm here to help understand your symptoms. Let's start with a simple question: What brings you here today?",
          complete: false,
          sessionId: Date.now().toString(),
        });
      }
    }

    // Fetch patient biometrics if available and this is the first message
    let biometricAnalysis = '';
    if (isFirstMessage && patientId) {
      const biometrics = patientBiometrics[patientId];

      if (biometrics && Object.keys(biometrics).length > 0) {
        // Format biometrics for AI analysis
        const biometricData = formatBiometrics(biometrics);
        biometricAnalysis = `\n\nPATIENT BIOMETRICS (Recently Recorded):
${biometricData}

IMPORTANT: Before asking what brings them here today, first analyze and evaluate these biometric readings as a medical professional would. Provide a brief clinical assessment of the vital signs (1-2 sentences), noting any abnormal values or concerns. Then, proceed to ask what brings them here today.`;
      }
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
${biometricAnalysis}

Previous conversation:
${JSON.stringify(messages.slice(-5))} // Last 5 messages for context

Generate the next triage question or conclude if sufficient information is gathered. When you've gathered enough information (8-12 questions answered), you MUST end your final message with the exact tag [TRIAGE_COMPLETE] on its own line. Before that tag, thank the patient and let them know you'll connect them with a doctor.`;

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

    // Detect triage completion - check for various patterns the AI might use
    const responseUpper = aiResponse.toUpperCase();
    const isComplete =
      responseUpper.includes('TRIAGE_COMPLETE') ||
      responseUpper.includes('END_TRIAGE') ||
      responseUpper.includes('[TRIAGE_COMPLETE]') ||
      responseUpper.includes('TRIAGE COMPLETE');

    // Clean the AI response - remove the completion tag from visible text
    const cleanResponse = aiResponse
      .replace(/\[?TRIAGE_COMPLETE\]?/gi, '')
      .replace(/\[?END_TRIAGE\]?/gi, '')
      .replace(/\[?TRIAGE COMPLETE\]?/gi, '')
      .trim();

    // Store session
    const sessionKey = sessionId || Date.now().toString();
    triageSessions[sessionKey] = {
      messages: [...messages, { role: 'ai', content: cleanResponse }],
      complete: isComplete,
      timestamp: new Date().toISOString(),
    };

    if (isComplete) {
      // Generate insights
      const insights = await generateInsights(messages);

      const completeMessage = cleanResponse ||
        "Thank you for answering these questions. I'm now connecting you with a doctor who will review your information.";

      return res.json({
        message: completeMessage,
        complete: true,
        triageData: triageSessions[sessionKey],
        insights,
      });
    }

    res.json({
      message: cleanResponse,
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
