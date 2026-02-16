import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { patientInsights, patientTriageData, patientBiometrics, consultationHistory, consultationNotes, patientProfiles } from '../storage';

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

    // Include triage transcript
    const triageData = patientTriageData[patientId];
    if (triageData?.messages?.length) {
      const transcript = triageData.messages
        .map((m: any) => `${m.role === 'ai' ? 'Nurse' : 'Patient'}: ${m.content}`)
        .slice(-10) // Last 10 messages to keep context manageable
        .join('\n');
      patientContext += `\n\nTRIAGE TRANSCRIPT (recent):\n${transcript}`;
    }

    // Include consultation history
    const history = consultationHistory[patientId];
    if (history?.length) {
      const recentConsultations = history.slice(-3).map((c: any) => {
        let entry = `- ${new Date(c.completedAt).toLocaleDateString()}: ${c.summary || 'General consultation'}`;
        if (c.doctorNotes) entry += ` | Doctor notes: ${c.doctorNotes.substring(0, 200)}`;
        if (c.possibleConditions?.length) {
          entry += ` | Conditions: ${c.possibleConditions.map((pc: any) => pc.name).join(', ')}`;
        }
        return entry;
      });
      patientContext += `\n\nCONSULTATION HISTORY (recent ${recentConsultations.length}):\n${recentConsultations.join('\n')}`;
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

/**
 * POST /api/ai-assist/generate-report
 * Generate a patient consultation report with doctor notes and prescriptions
 */
router.post('/generate-report', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorName, prescriptions, instructions } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient ID is required' });
    }

    // Gather all patient data
    const profile = patientProfiles[patientId];
    const insights = patientInsights[patientId];
    const triageData = patientTriageData[patientId];
    const biometrics = patientBiometrics[patientId];
    const notes = consultationNotes[patientId];
    const history = consultationHistory[patientId];

    let context = '';

    // Patient info
    if (profile) {
      context += `PATIENT: ${profile.name || 'Unknown'}`;
      if (profile.age) context += `, Age: ${profile.age}`;
      if (profile.dateOfBirth) context += `, DOB: ${profile.dateOfBirth}`;
      context += '\n';
    }

    // Vitals
    if (biometrics) {
      const vitals: string[] = [];
      if (biometrics.bloodPressureSystolic) vitals.push(`BP: ${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic} mmHg`);
      if (biometrics.heartRate) vitals.push(`HR: ${biometrics.heartRate} bpm`);
      if (biometrics.temperature) vitals.push(`Temp: ${biometrics.temperature}${biometrics.temperatureUnit === 'C' ? '°C' : '°F'}`);
      if (biometrics.bloodOxygen) vitals.push(`SpO2: ${biometrics.bloodOxygen}%`);
      if (biometrics.weight) vitals.push(`Weight: ${biometrics.weight} ${biometrics.weightUnit || 'lbs'}`);
      if (vitals.length) context += `\nVITAL SIGNS: ${vitals.join(', ')}\n`;
    }

    // AI Insights
    if (insights) {
      context += `\nAI TRIAGE INSIGHTS:\n- Summary: ${insights.summary || 'N/A'}`;
      if (insights.keyFindings?.length) {
        context += `\n- Key Findings: ${insights.keyFindings.join('; ')}`;
      }
      if (insights.possibleConditions?.length) {
        context += `\n- Possible Conditions: ${insights.possibleConditions.map((c: any) => `${c.name} (${c.confidence})`).join(', ')}`;
      }
      context += '\n';
    }

    // Doctor notes
    if (notes?.notes) {
      context += `\nDOCTOR CONSULTATION NOTES:\n${notes.notes}\n`;
    }

    // Prescriptions & instructions from doctor
    if (prescriptions) {
      context += `\nPRESCRIPTIONS:\n${prescriptions}\n`;
    }
    if (instructions) {
      context += `\nADDITIONAL INSTRUCTIONS:\n${instructions}\n`;
    }

    // Previous consultation history
    if (history?.length) {
      const prev = history.slice(-3).map((c: any) =>
        `- ${new Date(c.completedAt).toLocaleDateString()}: ${c.summary || 'Consultation'}`
      ).join('\n');
      context += `\nPREVIOUS CONSULTATIONS:\n${prev}\n`;
    }

    const systemPrompt = `You are a medical report generator. Create a professional, comprehensive patient consultation report based on the provided data.

The report should include these sections:
1. **Patient Information** - Name, demographics
2. **Chief Complaint** - Reason for visit
3. **Vital Signs** - All recorded vitals
4. **Assessment** - Summary of findings from triage and consultation
5. **Diagnosis** - Based on AI insights and doctor assessment
6. **Treatment Plan** - Including any prescriptions
7. **Patient Instructions** - Follow-up care, lifestyle changes
8. **Follow-up** - When to return, warning signs

Format the report professionally. Use clear medical language but make patient instructions understandable. Include today's date. Doctor: ${doctorName || 'Doctor'}.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a consultation report based on this data:\n\n${context}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const report = completion.choices[0].message.content || 'Unable to generate report.';

    res.json({ report });
  } catch (error: any) {
    console.error('Report generation error:', error);
    res.status(500).json({
      message: 'Failed to generate report',
      error: error.message,
    });
  }
});

export default router;
