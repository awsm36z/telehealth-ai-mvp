import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { patientBiometrics, patientProfiles, triageSessions, patientInsights, patientTriageData } from '../storage';
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

// Medical disclaimer appended to AI responses
const MEDICAL_DISCLAIMER = '\n\n_This information helps your doctor understand your symptoms. It is NOT a medical diagnosis. Only a licensed healthcare provider can diagnose and treat medical conditions._';

// Emergency keywords for fallback detection (Issue #2)
const EMERGENCY_KEYWORDS = [
  'chest pain', 'chest hurts', 'chest tightness', 'heart attack',
  'can\'t breathe', 'cant breathe', 'difficulty breathing', 'hard to breathe',
  'struggling to breathe', 'shortness of breath', 'choking',
  'suicidal', 'suicide', 'kill myself', 'end my life', 'want to die', 'self-harm',
  'lost consciousness', 'passed out', 'fainted', 'unconscious',
  'severe bleeding', 'won\'t stop bleeding', 'hemorrhaging',
  'stroke', 'face drooping', 'slurred speech', 'sudden numbness',
  'overdose', 'poisoning',
];

const EMERGENCY_RESPONSE = `I'm very concerned about what you're describing. This sounds like it could be a medical emergency.

**Please call 911 or go to the nearest emergency room immediately.**

If you are having thoughts of self-harm or suicide, please call the 988 Suicide & Crisis Lifeline (call or text 988) right now.

Your safety is the top priority. A video consultation is not appropriate for emergency symptoms — you need in-person emergency care right away.`;

/**
 * Check if a message contains emergency keywords (fallback detection)
 */
function detectEmergency(message: string): boolean {
  const lower = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => lower.includes(keyword));
}

function isValidMessageArray(messages: any): boolean {
  if (!Array.isArray(messages) || messages.length === 0) {
    return false;
  }

  return messages.every(
    (message) =>
      message &&
      typeof message === 'object' &&
      typeof message.role === 'string' &&
      ['user', 'assistant', 'ai', 'system'].includes(message.role) &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0
  );
}

function hasBiometricData(biometrics: any): boolean {
  if (!biometrics || typeof biometrics !== 'object') return false;

  const biometricKeys = [
    'bloodPressureSystolic',
    'bloodPressureDiastolic',
    'heartRate',
    'temperature',
    'weight',
    'height',
    'respiratoryRate',
    'painLevel',
    'bloodOxygen',
    'bloodSugar',
    'notes',
  ];

  return biometricKeys.some((key) => {
    const value = biometrics[key];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
}

/**
 * POST /api/triage/chat
 * Continue triage conversation with LLM
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, sessionId, patientId, biometrics: requestBiometrics } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: 'Messages are required' });
    }

    if (!isValidMessageArray(messages)) {
      return res.status(400).json({ message: 'Invalid message format' });
    }

    const hasIncomingBiometrics = hasBiometricData(requestBiometrics);
    const resolvedBiometrics = hasIncomingBiometrics
      ? requestBiometrics
      : (patientId && hasBiometricData(patientBiometrics[patientId]) ? patientBiometrics[patientId] : null);

    // Keep server-side state aligned when mobile sends biometrics directly with triage.
    if (patientId && hasIncomingBiometrics) {
      patientBiometrics[patientId] = {
        ...patientBiometrics[patientId],
        ...requestBiometrics,
        patientId,
        timestamp: new Date().toISOString(),
      };
    }

    // Check if this is an initial greeting request
    const isInitialGreeting = messages.length === 1 && messages[0].content === '__INITIAL_GREETING__';

    // Check if this is the first real user message (start of conversation)
    const isFirstMessage = messages.length === 1 && messages[0].role === 'user' && !isInitialGreeting;

    // Emergency keyword fallback detection (Issue #2)
    // Check the latest user message for emergency keywords before calling LLM
    const latestUserMessage = messages.filter((m: any) => m.role === 'user').pop();
    if (latestUserMessage && !isInitialGreeting && detectEmergency(latestUserMessage.content)) {
      const sessionKey = sessionId || Date.now().toString();
      triageSessions[sessionKey] = {
        messages: [...messages, { role: 'ai', content: EMERGENCY_RESPONSE }],
        complete: false,
        emergency: true,
        timestamp: new Date().toISOString(),
      };

      return res.json({
        message: EMERGENCY_RESPONSE,
        complete: false,
        emergency: true,
        sessionId: sessionKey,
      });
    }

    // Handle initial greeting with biometric analysis
    if (isInitialGreeting && patientId) {
      const biometrics = resolvedBiometrics;

      if (biometrics && Object.keys(biometrics).length > 0) {
        // Format biometrics for AI analysis
        const biometricData = formatBiometrics(biometrics);

        const greetingPrompt = `You are a caring, empathetic medical triage assistant. A patient has just entered biometric data before starting their consultation. Analyze their vital signs and provide a warm, reassuring greeting.

PATIENT BIOMETRICS:
${biometricData}

Generate a response that:
1. Greets the patient warmly and with empathy (e.g., "Hello! I'm glad you're here. I'm going to help gather some information for your doctor.")
2. Briefly acknowledges their biometric readings (1-2 sentences)
3. Notes any concerning values if present (elevated temperature, abnormal heart rate, high pain level, etc.)
4. Then asks "What brings you here today?"

TONE: Warm, empathetic, reassuring. Acknowledge that visiting a doctor can be stressful.
Do NOT diagnose or provide medical advice.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: greetingPrompt }],
          temperature: 0.7,
          max_tokens: 300,
        });

        const greeting = completion.choices[0].message.content || "Hello! I'm glad you're here. What brings you here today?";

        return res.json({
          message: greeting,
          complete: false,
          sessionId: Date.now().toString(),
        });
      } else {
        // No biometrics available, return standard greeting
        return res.json({
          message: "Hello! I'm glad you're here, and I want you to know you're in good hands. I'm going to ask you a few questions to help your doctor understand your situation better. What brings you here today?",
          complete: false,
          sessionId: Date.now().toString(),
        });
      }
    }

    // Fetch patient biometrics if available and this is the first message
    let biometricAnalysis = '';
    if (isFirstMessage && patientId) {
      const biometrics = resolvedBiometrics;

      if (biometrics && Object.keys(biometrics).length > 0) {
        // Format biometrics for AI analysis
        const biometricData = formatBiometrics(biometrics);
        biometricAnalysis = `\n\nPATIENT BIOMETRICS (Recently Recorded):
${biometricData}

IMPORTANT: Before asking what brings them here today, first analyze and evaluate these biometric readings as a medical professional would. Provide a brief clinical assessment of the vital signs (1-2 sentences), noting any abnormal values or concerns. Then, proceed to ask what brings them here today.`;
      }
    }

    // System prompt for medical triage (Issues #2, #3, #4, #6)
    const systemPrompt = `You are a compassionate, empathetic medical triage assistant helping gather information from a patient before their video consultation with a doctor.

YOUR ROLE:
- Ask clear, concise questions to understand the patient's symptoms and concerns
- Ask follow-up questions based on their responses
- Use plain, non-medical language that patients can understand
- Be warm, empathetic, and reassuring throughout the conversation
- Acknowledge the patient's discomfort and validate their concerns

EMPATHY GUIDELINES (CRITICAL):
- Always acknowledge the patient's feelings before asking questions
- Examples of empathetic responses:
  * "I'm sorry you're going through this. Let me ask a few more questions to help your doctor."
  * "That sounds really uncomfortable. I want to make sure we get you the right help."
  * "Thank you for sharing that. I understand this can be worrying."
  * "I appreciate you telling me about this. Your doctor will review everything carefully."
- If the patient expresses pain: "I'm sorry you're in pain. On a scale of 1 to 10, how would you rate it?"
- If the patient expresses anxiety: "I understand this can be stressful. You're doing the right thing by seeking care."
- NEVER be abrupt or clinical in tone

TRIAGE FRAMEWORK (OPQRST):
Follow the OPQRST medical assessment framework systematically:
- **O**nset: "When did this first start?" / "Was the onset sudden or gradual?"
- **P**rovocation/Palliation: "What makes it worse?" / "What makes it better or provides relief?"
- **Q**uality: "Can you describe what it feels like?" (e.g., sharp, dull, burning, throbbing)
- **R**adiation: "Does it spread or move to other areas?"
- **S**everity: "On a scale of 1 to 10, with 10 being the worst, how would you rate it?"
- **T**ime/Duration: "How long does it last?" / "Is it constant or does it come and go?"

Also ask about:
- Associated symptoms (fever, nausea, fatigue, etc.)
- Medical history relevant to the complaint
- Any medications currently being taken
- Allergies

QUESTION GUIDELINES:
- Ask ONE question at a time (do not combine multiple questions)
- Adapt questions based on patient responses
- Limit to 8-12 questions total
- Always ask about severity (1-10 scale)
- Always ask about duration/onset

EMERGENCY DETECTION (CRITICAL - PATIENT SAFETY):
IF the patient mentions ANY of the following, you MUST IMMEDIATELY stop the triage and respond with the emergency message below. Do NOT ask any more questions. Do NOT continue normal triage.

EMERGENCY SYMPTOMS:
- Chest pain, especially with radiation to arm, jaw, or back
- Severe difficulty breathing or inability to breathe
- Suicidal thoughts, self-harm ideation, or wanting to die
- Loss of consciousness or fainting
- Severe or uncontrollable bleeding
- Sudden severe headache ("worst headache of my life")
- Signs of stroke (face drooping, arm weakness, speech difficulty)
- Overdose or poisoning
- Severe allergic reaction (anaphylaxis)

EMERGENCY RESPONSE (use this EXACT format):
"I'm very concerned about what you're describing. This sounds like it could be a medical emergency. Please call 911 or go to the nearest emergency room immediately. If you are having thoughts of self-harm, please call the 988 Suicide & Crisis Lifeline (call or text 988). Your safety is the top priority."

MEDICAL DISCLAIMER (IMPORTANT):
- You are NOT a doctor and cannot diagnose conditions
- Do NOT provide diagnoses, medical advice, or treatment recommendations
- Do NOT recommend medications
- Use language like "I'll share this with your doctor" rather than suggesting what it might be
- Remind the patient that a licensed doctor will review their information

SAFETY LANGUAGE:
- NEVER say "you have" or "it sounds like you have" — say "your doctor will evaluate this"
- NEVER recommend specific treatments or medications
- ALWAYS remind patients their information will be reviewed by a real doctor
${biometricAnalysis}

Previous conversation:
${JSON.stringify(messages.slice(-5))} // Last 5 messages for context

Generate the next triage question or conclude if sufficient information is gathered. When you've gathered enough information (8-12 questions answered), you MUST end your final message with the exact tag [TRIAGE_COMPLETE] on its own line. Before that tag, thank the patient warmly, reassure them, and let them know you'll connect them with a doctor who will review all their information.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({
          role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    let aiResponse = completion.choices[0].message.content || '';

    // Double-check: LLM-level emergency detection as fallback
    const responseUpper = aiResponse.toUpperCase();
    const looksLikeEmergency =
      responseUpper.includes('CALL 911') ||
      responseUpper.includes('EMERGENCY ROOM') ||
      responseUpper.includes('SEEK IMMEDIATE') ||
      responseUpper.includes('MEDICAL EMERGENCY');

    // Detect triage completion
    const isComplete =
      responseUpper.includes('TRIAGE_COMPLETE') ||
      responseUpper.includes('END_TRIAGE') ||
      responseUpper.includes('[TRIAGE_COMPLETE]') ||
      responseUpper.includes('TRIAGE COMPLETE');

    // Clean the AI response - remove the completion tag from visible text
    let cleanResponse = aiResponse
      .replace(/\[?TRIAGE_COMPLETE\]?/gi, '')
      .replace(/\[?END_TRIAGE\]?/gi, '')
      .replace(/\[?TRIAGE COMPLETE\]?/gi, '')
      .trim();

    // Store session
    const sessionKey = sessionId || Date.now().toString();
    triageSessions[sessionKey] = {
      messages: [...messages, { role: 'ai', content: cleanResponse }],
      complete: isComplete,
      emergency: looksLikeEmergency,
      timestamp: new Date().toISOString(),
    };

    if (looksLikeEmergency) {
      return res.json({
        message: cleanResponse,
        complete: false,
        emergency: true,
        sessionId: sessionKey,
      });
    }

    if (isComplete) {
      // Generate insights
      const insights = await generateInsights(messages);

      // Store insights and triage data for doctor access
      if (patientId) {
        // Ensure patient profile exists so the doctor queue can display this patient
        if (!patientProfiles[patientId]) {
          patientProfiles[patientId] = {
            id: patientId,
            name: `Patient ${patientId}`,
            email: '',
            createdAt: new Date().toISOString(),
          };
          console.log(`📝 Created minimal profile for patient ${patientId} during triage completion`);
        }

        // Store chief complaint from insights into the triage data for the queue
        const chiefComplaint = insights?.chiefComplaint || insights?.summary || 'General consultation';

        patientInsights[patientId] = {
          ...insights,
          chiefComplaint,
          generatedAt: new Date().toISOString(),
        };
        patientTriageData[patientId] = {
          messages: triageSessions[sessionKey].messages,
          chiefComplaint,
          completedAt: new Date().toISOString(),
        };
        console.log(`✅ Stored insights for patient ${patientId}`);
      }

      const completeMessage = cleanResponse ||
        "Thank you so much for answering these questions. I'm now connecting you with a doctor who will carefully review all of your information. You're in good hands.";

      return res.json({
        message: completeMessage + MEDICAL_DISCLAIMER,
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
 * POST /api/triage/insights
 * Generate AI insights from triage conversation
 */
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ message: 'Messages are required' });
    }

    if (!isValidMessageArray(messages)) {
      return res.status(400).json({ message: 'Invalid message format' });
    }

    const insights = await generateInsights(messages);
    res.json(insights);
  } catch (error: any) {
    console.error('Generate insights error:', error);
    res.status(500).json({
      message: 'Failed to generate insights',
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

    const insightsPrompt = `You are a clinical decision support AI generating insights for a DOCTOR (not a patient) reviewing a case before a video consultation. This is a physician-facing tool.

TRIAGE CONVERSATION:
${conversationText}

Generate structured clinical insights in the following JSON format:
{
  "summary": "2-3 sentence overview of patient presentation using clinical language",
  "keyFindings": ["finding 1", "finding 2", ...],
  "possibleConditions": [
    {
      "name": "Condition name",
      "description": "Brief clinical rationale using probabilistic language",
      "confidence": "High/Medium/Low"
    }
  ],
  "nextSteps": ["step 1", "step 2", ...],
  "recommendedQuestions": ["question for the doctor to ask during consultation", ...],
  "missingInformation": ["info that was not gathered during triage and may be clinically relevant", ...],
  "disclaimer": "AI-generated clinical decision support. Not a substitute for clinical judgment."
}

CRITICAL REQUIREMENTS:
1. PROBABILISTIC LANGUAGE ONLY:
   - Use "may indicate," "consider," "suggests possible," "consistent with"
   - NEVER use "diagnosed with," "definitely," "certainly," "is"
   - Example: "Symptoms are consistent with possible streptococcal pharyngitis" NOT "Patient has strep throat"

2. RECOMMENDED DOCTOR QUESTIONS:
   - Include 3-5 specific questions the doctor should ask during the video consultation
   - Focus on questions that would help differentiate between possible conditions
   - Example: "Has the patient been exposed to anyone with strep recently?"

3. MISSING INFORMATION:
   - Highlight any clinically relevant information that was not gathered during triage
   - Example: "Medication allergies not discussed," "Family history of cardiac conditions not assessed"

4. CONFIDENCE LEVELS:
   - High: Strong clinical correlation with reported symptoms
   - Medium: Possible but additional assessment needed
   - Low: Cannot rule out, worth considering

5. Always include at least 2-3 possible conditions with rationale
6. Next steps should be actionable for the consulting physician`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: insightsPrompt }],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const insightsText = completion.choices[0].message.content || '{}';
    try {
      return JSON.parse(insightsText);
    } catch (parseError) {
      // LLM sometimes wraps JSON in markdown code blocks
      const jsonMatch = insightsText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          // Fall through to default
        }
      }
      console.error('Failed to parse insights JSON:', parseError);
      return {
        summary: insightsText.slice(0, 200),
        keyFindings: [],
        possibleConditions: [],
        nextSteps: ['Schedule video consultation with doctor'],
      };
    }
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
