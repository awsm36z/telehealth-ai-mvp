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

// Enhanced data structure for live transcripts
interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

interface LiveTranscriptData {
  entries: TranscriptEntry[];
  lastInsight: string;
  runningSummary: string;
  lastAnalysisTime: number;
  lastAnalyzedIndex: number;
}

interface SSEConnection {
  res: Response;
  roomName: string;
  lastPingTime: number;
}

// In-memory store for live transcripts per room
const liveTranscripts: Record<string, LiveTranscriptData> = {};

// Store active SSE connections per room
const sseConnections: Map<string, SSEConnection[]> = new Map();

// Store analysis intervals per room
const analysisIntervals: Map<string, NodeJS.Timeout> = new Map();

// Emergency keyword patterns
const EMERGENCY_KEYWORDS = [
  /chest pain|heart attack/i,
  /can't breathe|can not breathe|cannot breathe|difficulty breathing|shortness of breath/i,
  /suicide|suicidal|kill myself|end my life|want to die/i,
  /severe bleeding|bleeding heavily|blood everywhere/i,
  /stroke|can't move.*arm|can't move.*leg|cannot move.*arm|cannot move.*leg/i,
  /unconscious|passed out|loss of consciousness|fainted/i,
];

/**
 * Detect emergency keywords in text
 */
function detectEmergency(text: string): boolean {
  return EMERGENCY_KEYWORDS.some((pattern) => pattern.test(text));
}

/**
 * Calculate confidence based on transcript entry count
 */
function calculateConfidence(entryCount: number): 'low' | 'medium' | 'high' {
  if (entryCount < 5) return 'low';
  if (entryCount < 15) return 'medium';
  return 'high';
}

/**
 * Emit event to all SSE clients for a room
 */
function emitToSSEClients(roomName: string, event: any) {
  const connections = sseConnections.get(roomName);
  if (!connections || connections.length === 0) return;

  const eventData = `data: ${JSON.stringify(event)}\n\n`;

  for (const connection of connections) {
    try {
      connection.res.write(eventData);
    } catch (error) {
      console.error(`Failed to send SSE event to client:`, error);
    }
  }
}

/**
 * Compress older transcript entries into a running summary
 */
async function compressSummary(
  entries: TranscriptEntry[],
  previousSummary: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return previousSummary || 'Conversation in progress.';
  }

  const text = entries.map((e) => `${e.speaker}: ${e.text}`).join('\n');

  const prompt = previousSummary
    ? `Previous summary: ${previousSummary}\n\nNew conversation:\n${text}\n\nProvide a concise summary (max 100 words) combining both.`
    : `Summarize this conversation concisely (max 100 words):\n${text}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.3,
    });

    return completion.choices[0].message.content || previousSummary || 'Conversation in progress.';
  } catch (error) {
    console.error('Summary compression error:', error);
    return previousSummary || 'Conversation in progress.';
  }
}

/**
 * Analyze rolling window of transcript entries
 */
async function analyzeRollingWindow(roomName: string, patientId?: string, locale?: string) {
  const data = liveTranscripts[roomName];
  if (!data) return;

  const now = Date.now();
  const timeSinceLastAnalysis = now - data.lastAnalysisTime;

  // Debounce: don't analyze more than once per 8 seconds
  if (timeSinceLastAnalysis < 8000) return;

  // Check if there are new entries since last analysis
  const newEntries = data.entries.slice(data.lastAnalyzedIndex);
  if (newEntries.length === 0) return;

  console.log(`[Rolling Analysis] Room ${roomName}: ${newEntries.length} new entries, analyzing...`);

  // Update analysis metadata
  data.lastAnalysisTime = now;
  data.lastAnalyzedIndex = data.entries.length;

  // Get sliding window (last 40 entries or ~2 minutes)
  const windowEntries = data.entries.slice(-40);

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
      if (biometrics.bloodPressureSystolic)
        vitals.push(`BP: ${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic}`);
      if (biometrics.heartRate) vitals.push(`HR: ${biometrics.heartRate}`);
      if (biometrics.temperature) vitals.push(`Temp: ${biometrics.temperature}`);
      if (vitals.length) patientContext += `\nVITALS: ${vitals.join(', ')}`;
    }
  }

  const conversationText = windowEntries.map((e) => `${e.speaker}: ${e.text}`).join('\n');

  const contextPrompt = data.runningSummary
    ? `PREVIOUS CONVERSATION SUMMARY:\n${data.runningSummary}\n\nRECENT CONVERSATION:\n${conversationText}${patientContext}`
    : `CONVERSATION:\n${conversationText}${patientContext}`;

  const isMorocco = String(locale || '').toUpperCase().startsWith('MA');

  // Fallback if no API key
  if (!process.env.OPENAI_API_KEY) {
    const fallbackResult = {
      liveSummary: 'Conversation in progress.',
      insights: ['Continue focused history and symptom clarification.'],
      suggestedQuestions: ['Any red-flag symptoms?', 'Any current medications or allergies?'],
      possibleDiagnostics: [],
      possibleMedication: isMorocco
        ? MOROCCO_MEDICATIONS.slice(0, 3).map((name) => ({
            name,
            rationale: 'Potential locally available option; requires diagnosis and contraindication review.',
            confidence: 'low',
          }))
        : [],
      provenance: {
        model: 'rule-based-fallback',
        timestamp: new Date().toISOString(),
        transcriptChunkIds: windowEntries.map((_, i) => String(data.lastAnalyzedIndex - windowEntries.length + i)),
        analysisVersion: '1.0',
        confidence: calculateConfidence(windowEntries.length),
      },
      medicationDisclaimer: MEDICATION_DISCLAIMER,
      confidence: calculateConfidence(windowEntries.length),
      warning: MEDICATION_DISCLAIMER,
      entries: data.entries.length,
    };

    emitToSSEClients(roomName, {
      type: 'insight',
      data: fallbackResult,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // Call AI for analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            `You are a real-time clinical assistant for doctors. Analyze ongoing conversation and return strict JSON with keys: liveSummary, insights, suggestedQuestions, possibleDiagnostics, possibleMedication. ` +
            `possibleDiagnostics should be an array of {name, description, confidence} where confidence is "High", "Medium", or "Low". ` +
            `possibleMedication should be an array of {name, rationale, dosage, confidence}. Never prescribe. Never diagnose. Keep uncertainty explicit. ` +
            (isMorocco
              ? `When suggesting medication, prioritize products present in Morocco such as ${MOROCCO_MEDICATIONS.join(', ')}.`
              : ''),
        },
        { role: 'user', content: `Analyze this ongoing conversation:\n\n${contextPrompt}` },
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

    const result = {
      liveSummary: parsed.liveSummary || 'Live summary unavailable.',
      insights: Array.isArray(parsed.insights) ? parsed.insights : [],
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : [],
      possibleDiagnostics: Array.isArray(parsed.possibleDiagnostics) ? parsed.possibleDiagnostics : [],
      possibleMedication: Array.isArray(parsed.possibleMedication)
        ? parsed.possibleMedication
        : isMorocco
        ? MOROCCO_MEDICATIONS.slice(0, 3).map((name) => ({
            name,
            rationale: 'Potential local option to validate against diagnosis/contraindications.',
            confidence: 'low',
          }))
        : [],
      provenance: {
        model: 'gpt-4o-mini',
        timestamp: new Date().toISOString(),
        transcriptChunkIds: windowEntries.map((_, i) => String(data.lastAnalyzedIndex - windowEntries.length + i)),
        analysisVersion: '1.0',
        confidence: calculateConfidence(windowEntries.length),
      },
      medicationDisclaimer: MEDICATION_DISCLAIMER,
      confidence: calculateConfidence(windowEntries.length),
      warning: MEDICATION_DISCLAIMER,
      entries: data.entries.length,
    };

    // Emit result via SSE
    emitToSSEClients(roomName, {
      type: 'insight',
      data: result,
      timestamp: new Date().toISOString(),
    });

    // Update running summary every 20 new entries
    if (newEntries.length >= 20 && data.entries.length >= 40) {
      const summaryWindow = data.entries.slice(-60, -20);
      data.runningSummary = await compressSummary(summaryWindow, data.runningSummary);
      console.log(`[Running Summary] Room ${roomName}: Updated summary`);
    }
  } catch (error) {
    console.error('Rolling window analysis error:', error);
  }
}

/**
 * Start analysis loop for a room
 */
function startAnalysisLoop(roomName: string, patientId?: string, locale?: string) {
  if (analysisIntervals.has(roomName)) return;

  const interval = setInterval(async () => {
    try {
      await analyzeRollingWindow(roomName, patientId, locale);
    } catch (error) {
      console.error(`Analysis loop error for room ${roomName}:`, error);
    }
  }, 5000); // Run every 5 seconds

  analysisIntervals.set(roomName, interval);
  console.log(`[Analysis Loop] Started for room ${roomName}`);
}

/**
 * Stop analysis loop for a room
 */
function stopAnalysisLoop(roomName: string) {
  const interval = analysisIntervals.get(roomName);
  if (interval) {
    clearInterval(interval);
    analysisIntervals.delete(roomName);
    console.log(`[Analysis Loop] Stopped for room ${roomName}`);
  }
}

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
      liveTranscripts[roomName] = {
        entries: [],
        lastInsight: '',
        runningSummary: '',
        lastAnalysisTime: 0,
        lastAnalyzedIndex: 0,
      };
    }

    const entry: TranscriptEntry = {
      speaker: speaker || 'Unknown',
      text,
      timestamp: new Date().toISOString(),
    };

    liveTranscripts[roomName].entries.push(entry);

    // Check for emergency keywords
    if (detectEmergency(text)) {
      console.log(`[Emergency] Detected in room ${roomName}: "${text}"`);
      emitToSSEClients(roomName, {
        type: 'emergency',
        priority: 'high',
        message: 'Emergency keyword detected: immediate review recommended',
        transcript: entry,
        timestamp: new Date().toISOString(),
      });
    }

    // Emit transcript update to SSE clients
    emitToSSEClients(roomName, {
      type: 'transcript',
      entry,
      total: liveTranscripts[roomName].entries.length,
    });

    res.json({ message: 'Transcript entry added', total: liveTranscripts[roomName].entries.length });
  } catch (error: any) {
    console.error('Live transcript error:', error);
    res.status(500).json({ message: 'Failed to add transcript entry', error: error.message });
  }
});

/**
 * POST /api/live-insights/transcript-batch
 * Add multiple transcript entries at once (for batched relay from client)
 */
router.post('/transcript-batch', async (req: Request, res: Response) => {
  try {
    const { roomName, entries, patientId, locale } = req.body;

    if (!roomName || !Array.isArray(entries)) {
      return res.status(400).json({ message: 'roomName and entries array are required' });
    }

    if (!liveTranscripts[roomName]) {
      liveTranscripts[roomName] = {
        entries: [],
        lastInsight: '',
        runningSummary: '',
        lastAnalysisTime: 0,
        lastAnalyzedIndex: 0,
      };
      // Start analysis loop for this room
      startAnalysisLoop(roomName, patientId, locale);
    }

    let emergencyDetected = false;

    // Process each entry
    for (const { speaker, text } of entries) {
      if (!text) continue;

      const entry: TranscriptEntry = {
        speaker: speaker || 'Unknown',
        text,
        timestamp: new Date().toISOString(),
      };

      liveTranscripts[roomName].entries.push(entry);

      // Check for emergency keywords
      if (detectEmergency(text)) {
        emergencyDetected = true;
        console.log(`[Emergency] Detected in room ${roomName}: "${text}"`);
        emitToSSEClients(roomName, {
          type: 'emergency',
          priority: 'high',
          message: 'Emergency keyword detected: immediate review recommended',
          transcript: entry,
          timestamp: new Date().toISOString(),
        });
      }

      // Emit to SSE clients
      emitToSSEClients(roomName, {
        type: 'transcript',
        entry,
        total: liveTranscripts[roomName].entries.length,
      });
    }

    res.json({
      message: 'Transcript batch added',
      total: liveTranscripts[roomName].entries.length,
      processed: entries.length,
      emergencyDetected,
    });
  } catch (error: any) {
    console.error('Transcript batch error:', error);
    res.status(500).json({ message: 'Failed to add transcript batch', error: error.message });
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
 * GET /api/live-insights/stream?roomName=...
 * Establish SSE connection for real-time insights
 */
router.get('/stream', async (req: Request, res: Response) => {
  const { roomName } = req.query;

  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ message: 'roomName is required' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', roomName })}\n\n`);

  // Register connection
  if (!sseConnections.has(roomName)) {
    sseConnections.set(roomName, []);
  }

  const connection: SSEConnection = {
    res,
    roomName,
    lastPingTime: Date.now(),
  };

  sseConnections.get(roomName)!.push(connection);
  console.log(
    `[SSE] Connection established for room ${roomName} (${sseConnections.get(roomName)!.length} total)`
  );

  // Send keepalive ping every 30 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(`: keepalive\n\n`);
      connection.lastPingTime = Date.now();
    } catch (error) {
      clearInterval(pingInterval);
    }
  }, 30000);

  // Cleanup on client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);

    const connections = sseConnections.get(roomName);
    if (connections) {
      const index = connections.indexOf(connection);
      if (index !== -1) {
        connections.splice(index, 1);
      }

      if (connections.length === 0) {
        sseConnections.delete(roomName);
      }
    }

    console.log(`[SSE] Connection closed for room ${roomName}`);
  });
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

  // Stop analysis loop
  stopAnalysisLoop(roomName);

  // Delete transcript data
  delete liveTranscripts[roomName];

  // Close all SSE connections for this room
  const connections = sseConnections.get(roomName);
  if (connections) {
    connections.forEach((conn) => {
      try {
        conn.res.end();
      } catch (error) {
        console.error('Error closing SSE connection:', error);
      }
    });
    sseConnections.delete(roomName);
    console.log(`[SSE] Closed all connections for room ${roomName}`);
  }

  res.json({ message: 'Transcript cleared and connections closed' });
});

export default router;
