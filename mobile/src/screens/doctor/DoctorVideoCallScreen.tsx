import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Platform, Modal } from 'react-native';
import { Text, IconButton, Surface, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { theme, spacing, shadows } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

// Optional speech recognition (requires dev build)
let ExpoSpeechRecognitionModule: any = null;
try {
  const speechRecognition = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechRecognition.ExpoSpeechRecognitionModule;
} catch {
  // expo-speech-recognition not available
}

const LANGUAGE_LABELS: Record<string, string> = { en: 'English', fr: 'Fran\u00e7ais', ar: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' };

/**
 * Check if a biometric value is abnormal and return status
 */
function checkBiometricStatus(key: string, value: any, context?: any): { status: 'normal' | 'warning' | 'critical'; label: string } {
  switch (key) {
    case 'heartRate':
      if (value < 50 || value > 120) return { status: 'critical', label: 'Abnormal' };
      if (value < 60 || value > 100) return { status: 'warning', label: 'Borderline' };
      return { status: 'normal', label: 'Normal' };
    case 'bloodPressureSystolic':
      if (value >= 180 || value < 80) return { status: 'critical', label: 'Abnormal' };
      if (value >= 140 || value < 90) return { status: 'warning', label: 'Elevated' };
      return { status: 'normal', label: 'Normal' };
    case 'bloodPressureDiastolic':
      if (value >= 120 || value < 50) return { status: 'critical', label: 'Abnormal' };
      if (value >= 90 || value < 60) return { status: 'warning', label: 'Elevated' };
      return { status: 'normal', label: 'Normal' };
    case 'temperature':
      const tempF = context?.temperatureUnit === 'C' ? value * 9 / 5 + 32 : value;
      if (tempF >= 103 || tempF < 95) return { status: 'critical', label: 'Abnormal' };
      if (tempF >= 100.4) return { status: 'warning', label: 'Elevated' };
      return { status: 'normal', label: 'Normal' };
    case 'bloodOxygen':
      if (value < 90) return { status: 'critical', label: 'Low' };
      if (value < 95) return { status: 'warning', label: 'Borderline' };
      return { status: 'normal', label: 'Normal' };
    case 'respiratoryRate':
      if (value < 8 || value > 25) return { status: 'critical', label: 'Abnormal' };
      if (value < 12 || value > 20) return { status: 'warning', label: 'Borderline' };
      return { status: 'normal', label: 'Normal' };
    case 'bloodSugar':
      if (value > 300 || value < 54) return { status: 'critical', label: 'Abnormal' };
      if (value > 180 || value < 70) return { status: 'warning', label: 'Borderline' };
      return { status: 'normal', label: 'Normal' };
    case 'painLevel':
      if (value >= 8) return { status: 'critical', label: 'Severe' };
      if (value >= 5) return { status: 'warning', label: 'Moderate' };
      return { status: 'normal', label: 'Mild' };
    default:
      return { status: 'normal', label: '' };
  }
}

function getStatusColor(status: 'normal' | 'warning' | 'critical'): string {
  switch (status) {
    case 'critical': return theme.colors.error;
    case 'warning': return theme.colors.warning;
    default: return theme.colors.success;
  }
}

export default function DoctorVideoCallScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { roomName, patientId, patientName, patientLanguage, insights, biometrics, triageTranscript } = route.params;
  const { isTablet, height } = useResponsive();
  const nativeSttSupportedInCall = Platform.OS !== 'ios';
  const assistPaneHeight = isTablet
    ? Math.min(560, Math.max(360, Math.round(height * 0.36)))
    : Math.min(460, Math.max(280, Math.round(height * 0.34)));

  const [isConnecting, setIsConnecting] = useState(true);
  const [dailyJoinUrl, setDailyJoinUrl] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showLiveAssist, setShowLiveAssist] = useState(true);
  // Clinical Assist tab structure (#88)
  const [assistTab, setAssistTab] = useState<'dx' | 'meds' | 'context' | 'notes'>('dx');
  const [contextSubtab, setContextSubtab] = useState<'vitals' | 'transcript' | 'insights' | 'history'>('vitals');
  // Full-screen expand for Clinical Assist (#87)
  const [assistFullscreen, setAssistFullscreen] = useState(false);
  // Auto-report generation state (#90)
  const [autoReportStatus, setAutoReportStatus] = useState<'idle' | 'generating' | 'ready' | 'failed'>('idle');
  // Prescription list built from AI medication suggestions
  const [prescriptions, setPrescriptions] = useState<{ name: string; dosage?: string; rationale?: string }[]>([]);
  // Diagnostics added from AI insights
  const [diagnostics, setDiagnostics] = useState<string[]>([]);
  // Structured notes fields (#92)
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [consultationHistoryData, setConsultationHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [reportPrescriptions, setReportPrescriptions] = useState('');
  const [reportInstructions, setReportInstructions] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [showFloatingControls, setShowFloatingControls] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Translation state
  const [doctorLanguage, setDoctorLanguage] = useState('en');
  const [showTranslated, setShowTranslated] = useState(false);
  const [translatedTranscript, setTranslatedTranscript] = useState<string[]>([]);
  const [translatedInsights, setTranslatedInsights] = useState<any>(null);
  const [translatedHistory, setTranslatedHistory] = useState<Record<string, { summary?: string; doctorNotes?: string }>>({});
  const [translating, setTranslating] = useState(false);
  const languageMismatch = patientLanguage && doctorLanguage && patientLanguage !== doctorLanguage;

  // Live transcript state
  const [liveTranscriptEntries, setLiveTranscriptEntries] = useState<{ speaker: string; text: string; timestamp: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [liveInsight, setLiveInsight] = useState('');
  const [liveInsightLoading, setLiveInsightLoading] = useState(false);
  const [manualTranscriptInput, setManualTranscriptInput] = useState('');
  const [sttAvailable, setSttAvailable] = useState(false);
  const liveTranscriptScrollRef = useRef<ScrollView>(null);
  // Seed live assist with triage insights' possible conditions as initial diagnostics
  const [liveAssistData, setLiveAssistData] = useState<any>(() => {
    if (insights?.possibleConditions?.length) {
      return {
        possibleDiagnostics: insights.possibleConditions.map((c: any) => ({
          name: c.name,
          description: c.description || '',
          confidence: c.confidence || 'Medium',
        })),
      };
    }
    return null;
  });
  const [liveAssistLoading, setLiveAssistLoading] = useState(false);
  const [medQuestion, setMedQuestion] = useState('');
  const [medAnswer, setMedAnswer] = useState('');
  const [medAnswerLoading, setMedAnswerLoading] = useState(false);

  // Prescription modal state
  const [rxModalVisible, setRxModalVisible] = useState(false);
  const [rxModalMed, setRxModalMed] = useState<{ name: string; dosage?: string; rationale?: string } | null>(null);
  const [rxDose, setRxDose] = useState('');
  const [rxNotes, setRxNotes] = useState('');
  const [rxDoseLoading, setRxDoseLoading] = useState(false);

  // #98: Inline medication suggestions per diagnosis in Dx tab
  const [diagMedSuggestions, setDiagMedSuggestions] = useState<Record<string, any[]>>({});
  const [diagMedLoading, setDiagMedLoading] = useState<Record<string, boolean>>({});

  // #99: Mandatory post-call report review + signature flow
  const [postCallStep, setPostCallStep] = useState<'idle' | 'generating' | 'reviewing' | 'signing' | 'signed' | 'failed'>('idle');
  const [reportDraft, setReportDraft] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [completedConsultationId, setCompletedConsultationId] = useState<string | null>(null);

  // Auto-transcription state
  const [autoTranscribing, setAutoTranscribing] = useState(false);
  const autoTranscribeRef = useRef(false);
  const pendingTranscriptBuffer = useRef('');

  // SSE streaming state
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const transcriptBatchBuffer = useRef<Array<{ speaker: string; text: string }>>([]);
  // Ref to control SSE reconnection without stale closure issues (#89)
  const sseActiveRef = useRef(false);

  const callStartTime = useRef<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const notesRef = useRef(doctorNotes);

  // Keep ref in sync with state
  useEffect(() => {
    notesRef.current = doctorNotes;
  }, [doctorNotes]);

  // Load doctor's language preference
  useEffect(() => {
    AsyncStorage.getItem('userLanguage').then((lang) => {
      if (lang) setDoctorLanguage(lang);
    });
  }, []);

  useEffect(() => {
    if (languageMismatch) {
      setShowTranslated(true);
    }
  }, [languageMismatch]);

  // Auto-translate when language mismatch is detected and panels are opened
  const translateContent = async () => {
    if (!languageMismatch || translating) return;
    setTranslating(true);

    try {
      // Translate transcript messages
      if (triageTranscript?.messages?.length > 0 && translatedTranscript.length === 0) {
        const texts = triageTranscript.messages.map((msg: any) => msg.content);
        const result = await api.translateBatch(texts, patientLanguage, doctorLanguage);
        if (result.data?.translations) {
          setTranslatedTranscript(result.data.translations);
        }
      }

      // Translate insights
      if (insights && !translatedInsights) {
        const textsToTranslate: string[] = [];
        const keys: string[] = [];

        if (insights.summary) { textsToTranslate.push(insights.summary); keys.push('summary'); }
        if (insights.keyFindings?.length) {
          insights.keyFindings.forEach((f: string, i: number) => {
            textsToTranslate.push(f);
            keys.push(`finding_${i}`);
          });
        }
        if (insights.possibleConditions?.length) {
          insights.possibleConditions.forEach((c: any, i: number) => {
            textsToTranslate.push(c.name);
            keys.push(`cond_name_${i}`);
            if (c.description) {
              textsToTranslate.push(c.description);
              keys.push(`cond_desc_${i}`);
            }
          });
        }

        if (textsToTranslate.length > 0) {
          const result = await api.translateBatch(textsToTranslate, patientLanguage, doctorLanguage);
          if (result.data?.translations) {
            const t = result.data.translations;
            const translated: any = {};
            let idx = 0;

            if (insights.summary) { translated.summary = t[idx++]; }
            if (insights.keyFindings?.length) {
              translated.keyFindings = insights.keyFindings.map(() => t[idx++]);
            }
            if (insights.possibleConditions?.length) {
              translated.possibleConditions = insights.possibleConditions.map((c: any) => ({
                ...c,
                name: t[idx++],
                description: c.description ? t[idx++] : c.description,
              }));
            }
            setTranslatedInsights(translated);
          }
        }
      }

      // Translate consultation history summary + notes
      if (consultationHistoryData.length > 0 && assistTab === 'context' && contextSubtab === 'history') {
        const untranslated = consultationHistoryData.filter((c: any) => {
          const key = String(c.id || c.completedAt || '');
          return key && !translatedHistory[key] && (c.summary || c.doctorNotes);
        });

        for (const consultation of untranslated) {
          const parts: string[] = [];
          if (consultation.summary) parts.push(consultation.summary);
          if (consultation.doctorNotes) parts.push(consultation.doctorNotes);
          if (!parts.length) continue;

          const result = await api.translateBatch(parts, patientLanguage, doctorLanguage);
          if (result.data?.translations) {
            const key = String(consultation.id || consultation.completedAt || '');
            setTranslatedHistory((prev) => ({
              ...prev,
              [key]: {
                summary: consultation.summary ? result.data.translations[0] : undefined,
                doctorNotes: consultation.doctorNotes
                  ? result.data.translations[consultation.summary ? 1 : 0]
                  : undefined,
              },
            }));
          }
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
    }

    setTranslating(false);
  };

  useEffect(() => {
    if (languageMismatch && showTranslated && showLiveAssist) {
      translateContent();
    }
  }, [showTranslated, showLiveAssist, assistTab, contextSubtab, consultationHistoryData]);

  // Load consultation history when panel is opened
  const loadHistory = async () => {
    if (consultationHistoryData.length > 0 || historyLoading) return;
    setHistoryLoading(true);
    try {
      const response = await api.getConsultationHistory(patientId);
      if (response.data) {
        setConsultationHistoryData(response.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (assistTab === 'context' && contextSubtab === 'history') loadHistory();
  }, [assistTab, contextSubtab]);

  const handleGenerateReport = async () => {
    setReportLoading(true);
    setGeneratedReport('');
    try {
      const docName = await AsyncStorage.getItem('userName');
      const response = await api.generateReport(
        patientId,
        docName || 'Doctor',
        reportPrescriptions.trim() || undefined,
        reportInstructions.trim() || undefined,
      );
      if (response.data?.report) {
        setGeneratedReport(response.data.report);
      } else {
        setGeneratedReport(response.error || 'Failed to generate report.');
      }
    } catch (error) {
      setGeneratedReport('Failed to connect to AI service.');
    }
    setReportLoading(false);
  };

  // #99: Post-call report generation — transitions postCallStep state
  const autoGenerateReportForPostCall = async () => {
    try {
      const docName = await AsyncStorage.getItem('userName');
      const rxText = prescriptions
        .map((p) => `${p.name}${p.dosage ? ` - ${p.dosage}` : ''}`)
        .join('\n');
      const response = await api.generateReport(
        patientId,
        docName || 'Doctor',
        rxText || undefined,
        undefined,
      );
      if (response.data?.report) {
        setGeneratedReport(response.data.report);
        setReportDraft(response.data.report);
        setAutoReportStatus('ready');
        setPostCallStep('reviewing');
      } else {
        setAutoReportStatus('failed');
        setPostCallStep('failed');
      }
    } catch {
      setAutoReportStatus('failed');
      setPostCallStep('failed');
    }
  };

  // #98: Fetch AI-suggested medications for a specific diagnosis card
  const fetchDiagnosisMeds = useCallback(async (diagName: string) => {
    setDiagMedLoading((prev) => ({ ...prev, [diagName]: true }));
    try {
      const locale = patientLanguage === 'ar' ? 'MA' : undefined;
      const response = await api.getMedicationInsights({
        patientId,
        locale,
        conversationSummary: `Condition: ${diagName}. Chief complaint: ${insights?.chiefComplaint || 'not specified'}.`,
      });
      const meds = (
        response.data?.possibleMedication ||
        response.data?.medication?.possibleMedication ||
        []
      ).slice(0, 3);
      setDiagMedSuggestions((prev) => ({ ...prev, [diagName]: meds }));
    } catch {
      setDiagMedSuggestions((prev) => ({ ...prev, [diagName]: [] }));
    }
    setDiagMedLoading((prev) => ({ ...prev, [diagName]: false }));
  }, [patientId, patientLanguage, insights]);

  // #99: Sign the finalized report and navigate away
  const handleSignReport = async () => {
    const name = signatureName.trim();
    if (!name) return;
    try {
      await api.signConsultationReport(patientId, {
        report: reportDraft,
        signerName: name,
        signatureMethod: 'typed_name',
      });
    } catch {
      // Non-critical: signature stored locally even if backend is unreachable
    }
    setPostCallStep('signed');
  };

  const closeConsultationAfterSign = () => {
    navigation.popToTop();
  };

  // Check STT availability on mount
  useEffect(() => {
    if (!nativeSttSupportedInCall) {
      // iOS call + native speech recognition can crash AudioUnit initialization in simulator/dev builds.
      setSttAvailable(false);
      return;
    }
    if (ExpoSpeechRecognitionModule) {
      try {
        const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
        setSttAvailable(!!available);
      } catch {
        setSttAvailable(false);
      }
    }
  }, [nativeSttSupportedInCall]);

  // Speech recognition event listeners
  useEffect(() => {
    if (!ExpoSpeechRecognitionModule || !sttAvailable) return;

    const shouldRestart = () => isListening || autoTranscribeRef.current;

    const handleResult = (event: any) => {
      const transcript = event?.results?.[0]?.transcript || event?.value?.[0] || '';
      if (transcript.trim()) {
        addTranscriptEntry('Doctor', transcript.trim());
      }
    };

    const handleEnd = () => {
      // Restart if still in listening or auto-transcribe mode
      if (shouldRestart()) {
        try {
          ExpoSpeechRecognitionModule.start({
            lang: doctorLanguage === 'ar' ? 'ar-MA' : doctorLanguage === 'fr' ? 'fr-FR' : 'en-US',
            interimResults: false,
            continuous: true,
          });
        } catch {
          if (!autoTranscribeRef.current) setIsListening(false);
        }
      }
    };

    const handleError = () => {
      // Ignore errors and try to restart
      if (shouldRestart()) {
        setTimeout(() => {
          try {
            ExpoSpeechRecognitionModule.start({
              lang: doctorLanguage === 'ar' ? 'ar-MA' : doctorLanguage === 'fr' ? 'fr-FR' : 'en-US',
              interimResults: false,
              continuous: true,
            });
          } catch {
            if (!autoTranscribeRef.current) setIsListening(false);
          }
        }, 1000);
      }
    };

    const resultSub = ExpoSpeechRecognitionModule.addListener?.('result', handleResult);
    const endSub = ExpoSpeechRecognitionModule.addListener?.('end', handleEnd);
    const errorSub = ExpoSpeechRecognitionModule.addListener?.('error', handleError);

    return () => {
      resultSub?.remove?.();
      endSub?.remove?.();
      errorSub?.remove?.();
    };
  }, [isListening, sttAvailable, doctorLanguage]);

  const addTranscriptEntry = useCallback(async (speaker: string, text: string) => {
    const entry = { speaker, text, timestamp: new Date().toISOString() };
    setLiveTranscriptEntries((prev) => [...prev, entry]);

    // Add to batch buffer instead of sending immediately
    transcriptBatchBuffer.current.push({ speaker, text });

    // Auto-flush if buffer reaches 5 entries
    if (transcriptBatchBuffer.current.length >= 5) {
      flushTranscriptBatch();
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      liveTranscriptScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [roomName]);

  // Flush transcript batch to backend
  const flushTranscriptBatch = useCallback(async () => {
    if (transcriptBatchBuffer.current.length === 0) return;

    const batch = [...transcriptBatchBuffer.current];
    transcriptBatchBuffer.current = [];

    try {
      await api.addLiveTranscriptBatch(roomName, batch, patientId, doctorLanguage);
    } catch (error) {
      console.error('Failed to relay transcript batch:', error);
    }
  }, [roomName, patientId, doctorLanguage]);

  const startListening = async () => {
    if (!nativeSttSupportedInCall) {
      Alert.alert(
        'Manual Transcript Mode',
        'Live speech recognition is disabled during iOS video calls for stability. Use manual transcript entry.'
      );
      return;
    }

    if (!ExpoSpeechRecognitionModule || !sttAvailable) {
      Alert.alert(
        'Speech Recognition Unavailable',
        'Speech recognition requires a development build. You can type entries manually.'
      );
      return;
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed for live transcription.');
        return;
      }

      ExpoSpeechRecognitionModule.start({
        lang: doctorLanguage === 'ar' ? 'ar-MA' : doctorLanguage === 'fr' ? 'fr-FR' : 'en-US',
        interimResults: false,
        continuous: true,
      });
      setIsListening(true);
    } catch {
      Alert.alert('Error', 'Failed to start speech recognition.');
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (ExpoSpeechRecognitionModule) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // Ignore
      }
    }
  };

  // Auto-transcription: automatically start STT when call connects
  const startAutoTranscribe = useCallback(async () => {
    if (!nativeSttSupportedInCall) return;
    if (!ExpoSpeechRecognitionModule || !sttAvailable || autoTranscribeRef.current) return;

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) return;

      autoTranscribeRef.current = true;
      setAutoTranscribing(true);

      ExpoSpeechRecognitionModule.start({
        lang: doctorLanguage === 'ar' ? 'ar-MA' : doctorLanguage === 'fr' ? 'fr-FR' : 'en-US',
        interimResults: false,
        continuous: true,
      });
    } catch {
      autoTranscribeRef.current = false;
      setAutoTranscribing(false);
    }
  }, [nativeSttSupportedInCall, sttAvailable, doctorLanguage]);

  const stopAutoTranscribe = useCallback(() => {
    autoTranscribeRef.current = false;
    setAutoTranscribing(false);
    if (!isListening && ExpoSpeechRecognitionModule) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        // Ignore
      }
    }
  }, [isListening]);

  // Connect to SSE stream for real-time insights
  const connectToLiveStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Guard: only attempt if EventSource is available in this environment (#89)
    if (typeof EventSource === 'undefined') {
      console.warn('[SSE] EventSource not available in this environment');
      setSseConnected(false);
      return;
    }

    const API_BASE = api.getBaseURL();
    const streamUrl = `${API_BASE}/live-insights/stream?roomName=${encodeURIComponent(roomName)}`;

    console.log('[SSE] Connecting to stream:', streamUrl);

    try {
      const eventSource = new EventSource(streamUrl);

      eventSource.onopen = () => {
        console.log('[SSE] Connection established');
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connected':
              console.log('[SSE] Connected to room:', data.roomName);
              break;

            case 'transcript':
              // Transcript already added locally, no need to duplicate
              break;

            case 'insight':
              setLiveAssistData(data.data);
              setLiveAssistLoading(false);
              break;

            case 'emergency':
              // Show emergency as an in-UI banner rather than a blocking Alert (#89)
              console.warn('[SSE] Emergency detected:', data.transcript?.text);
              Alert.alert(
                'Clinical Alert',
                data.message || 'Potential urgent finding — review immediately.',
                [{ text: 'Review', style: 'destructive' }]
              );
              break;
          }
        } catch (error) {
          console.error('[SSE] Failed to parse event:', error);
        }
      };

      eventSource.onerror = () => {
        setSseConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        // Use ref instead of showLiveAssist to avoid stale closure (#89)
        setTimeout(() => {
          if (sseActiveRef.current) {
            console.log('[SSE] Attempting to reconnect...');
            connectToLiveStream();
          }
        }, 3000);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      setSseConnected(false);
    }
  }, [roomName]);

  // Open prescription modal with AI-recommended dose
  const openPrescriptionModal = async (med: { name: string; dosage?: string; rationale?: string }) => {
    setRxModalMed(med);
    setRxDose(med.dosage || '');
    setRxNotes('');
    setRxModalVisible(true);

    // Auto-fetch AI recommended dose if not already provided
    if (!med.dosage) {
      setRxDoseLoading(true);
      try {
        const locale = patientLanguage === 'ar' ? 'MA' : undefined;
        const response = await api.askMedicationAI({
          patientId,
          locale,
          question: `What is the recommended dosage and frequency for ${med.name} for this patient? Give a concise answer like "500mg twice daily for 7 days".`,
        });
        const suggestedDose = response.data?.answer || '';
        // Extract just the dose line (first line or sentence)
        const doseLine = suggestedDose.split('\n')[0].replace(/^[\s\-•]+/, '').trim();
        if (doseLine && doseLine.length < 100) {
          setRxDose(doseLine);
        }
      } catch {
        // Non-critical
      }
      setRxDoseLoading(false);
    }
  };

  const confirmPrescription = () => {
    if (!rxModalMed) return;
    const med = rxModalMed;
    const dose = rxDose.trim();
    const notes = rxNotes.trim();

    // Build the prescription line for notes
    const rxLine = `Rx: ${med.name}` +
      (dose ? ` | Dose: ${dose}` : '') +
      (med.rationale ? ` | For: ${med.rationale}` : '') +
      (notes ? ` | Notes: ${notes}` : '');

    // Check if already prescribed
    const existingIndex = prescriptions.findIndex((p) => p.name === med.name);

    if (existingIndex >= 0) {
      setPrescriptions((prev) => {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], dosage: dose, rationale: med.rationale };
        return updated;
      });
    } else {
      setPrescriptions((prev) => [...prev, { name: med.name, dosage: dose, rationale: med.rationale }]);
    }

    // Update report prescriptions
    setReportPrescriptions((prev) => {
      const line = `${med.name}${dose ? ` - ${dose}` : ''}`;
      const lines = prev.split('\n').filter((l) => !l.startsWith(med.name));
      lines.push(line);
      return lines.filter(Boolean).join('\n');
    });

    // Update doctor notes — use direct state setter with computed value to avoid stale closure
    const currentNotes = notesRef.current;
    const noteLines = currentNotes.split('\n');
    const existingRxIndex = noteLines.findIndex((l) => l.startsWith(`Rx: ${med.name}`));
    let updatedNotes: string;
    if (existingRxIndex >= 0) {
      noteLines[existingRxIndex] = rxLine;
      updatedNotes = noteLines.join('\n');
    } else {
      updatedNotes = currentNotes ? `${currentNotes}\n${rxLine}` : rxLine;
    }
    setDoctorNotes(updatedNotes);

    // Close modal
    setRxModalVisible(false);
    setRxModalMed(null);
  };

  // Issue #64: Look up drug facts
  const lookupDrugFacts = async (medName: string) => {
    setMedQuestion(`What are the drug facts, contraindications, and interactions for ${medName}?`);
    // Auto-ask
    setMedAnswerLoading(true);
    setMedAnswer('');
    try {
      const locale = patientLanguage === 'ar' ? 'MA' : undefined;
      const response = await api.askMedicationAI({
        patientId,
        locale,
        question: `What are the drug facts, contraindications, side effects, and interactions for ${medName}?`,
      });
      setMedAnswer(response.data?.answer || response.error || 'Unable to get drug facts.');
    } catch {
      setMedAnswer('Unable to get drug facts.');
    }
    setMedAnswerLoading(false);
  };

  // Add condition to doctor notes as diagnostic
  const addDiagnostic = (conditionName: string) => {
    if (diagnostics.includes(conditionName)) {
      Alert.alert('Already Added', `${conditionName} is already in diagnostics.`);
      return;
    }
    setDiagnostics((prev) => [...prev, conditionName]);
    // Add to doctor notes using ref for latest value
    const currentNotes = notesRef.current;
    const line = `Dx: ${conditionName}`;
    const updatedNotes = currentNotes ? `${currentNotes}\n${line}` : line;
    setDoctorNotes(updatedNotes);
    Alert.alert('Added to Notes', `${conditionName} added as a diagnostic to your notes.`);
  };

  const handleManualTranscriptEntry = () => {
    const text = manualTranscriptInput.trim();
    if (!text) return;
    addTranscriptEntry('Doctor', text);
    setManualTranscriptInput('');
  };

  const handleAnalyzeConversation = async () => {
    setLiveInsightLoading(true);
    setLiveInsight('');
    try {
      const response = await api.analyzeLiveConversation(
        roomName,
        patientId,
        patientLanguage === 'ar' ? 'MA' : undefined
      );
      if (response.data?.insight) {
        setLiveInsight(response.data.insight);
      } else {
        setLiveInsight(response.error || 'Unable to analyze conversation.');
      }
    } catch {
      setLiveInsight('Failed to connect to AI service.');
    }
    setLiveInsightLoading(false);
  };

  const refreshLiveAssist = useCallback(async () => {
    setLiveAssistLoading(true);
    try {
      const locale = patientLanguage === 'ar' ? 'MA' : undefined;
      const conversationSummary = liveTranscriptEntries
        .slice(-10)
        .map((entry) => `${entry.speaker}: ${entry.text}`)
        .join('\n');

      const [liveResponse, medResponse] = await Promise.all([
        api.analyzeLiveConversation(roomName, patientId, locale),
        api.getMedicationInsights({ patientId, locale, conversationSummary }),
      ]);

      const liveData = liveResponse.data || {};

      // Merge possibleDiagnostics: use API response if available, otherwise preserve
      // seeded triage diagnostics so they aren't lost on refresh
      setLiveAssistData((prev: any) => {
        const apiDiagnostics = Array.isArray(liveData.possibleDiagnostics) && liveData.possibleDiagnostics.length > 0
          ? liveData.possibleDiagnostics
          : null;
        const prevDiagnostics = prev?.possibleDiagnostics || [];

        // If API returned diagnostics, merge with any existing ones (dedup by name)
        let mergedDiagnostics = prevDiagnostics;
        if (apiDiagnostics) {
          const existingNames = new Set(apiDiagnostics.map((d: any) => d.name));
          const uniquePrev = prevDiagnostics.filter((d: any) => !existingNames.has(d.name));
          mergedDiagnostics = [...apiDiagnostics, ...uniquePrev];
        }

        return {
          ...liveData,
          possibleDiagnostics: mergedDiagnostics,
          medication: medResponse.data || null,
        };
      });
    } catch (error) {
      console.error('Failed to refresh live assist:', error);
    }
    setLiveAssistLoading(false);
  }, [roomName, patientId, patientLanguage, liveTranscriptEntries]);

  const askMedicationInCall = async () => {
    const question = medQuestion.trim();
    if (!question) return;
    setMedAnswerLoading(true);
    setMedAnswer('');
    try {
      const locale = patientLanguage === 'ar' ? 'MA' : undefined;
      const response = await api.askMedicationAI({ patientId, locale, question });
      setMedAnswer(response.data?.answer || response.error || 'Unable to answer medication question.');
    } catch (error) {
      setMedAnswer('Unable to answer medication question.');
    }
    setMedAnswerLoading(false);
  };

  // SSE connection for live insights (replaces polling)
  useEffect(() => {
    if (!showLiveAssist) {
      sseActiveRef.current = false;
      return;
    }

    sseActiveRef.current = true;
    connectToLiveStream();

    return () => {
      sseActiveRef.current = false;
      if (eventSourceRef.current) {
        console.log('[SSE] Closing connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setSseConnected(false);
      }
    };
  }, [showLiveAssist, connectToLiveStream]);

  // Flush transcript batch every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      flushTranscriptBatch();
    }, 2000);

    return () => clearInterval(interval);
  }, [flushTranscriptBatch]);

  useEffect(() => {
    joinCall();

    // Auto-save notes every 30 seconds
    autoSaveInterval.current = setInterval(() => {
      if (notesRef.current.trim()) {
        saveNotes(notesRef.current);
      }
    }, 30000);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
      // Save notes on unmount
      if (notesRef.current.trim()) {
        saveNotes(notesRef.current);
      }
      // Stop listening and auto-transcription on unmount
      autoTranscribeRef.current = false;
      if (ExpoSpeechRecognitionModule) {
        try { ExpoSpeechRecognitionModule.stop(); } catch {}
      }
      // Flush any remaining transcript batch
      if (transcriptBatchBuffer.current.length > 0) {
        flushTranscriptBatch();
      }
      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const saveNotes = async (notes: string) => {
    try {
      await api.saveConsultationNotes(patientId, notes, roomName);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;
    setAiLoading(true);
    setAiAnswer('');
    try {
      const response = await api.askAI(aiQuestion.trim(), patientId);
      if (response.data?.answer) {
        setAiAnswer(response.data.answer);
      } else {
        setAiAnswer(response.error || 'Unable to get a response. Please try again.');
      }
    } catch (error) {
      setAiAnswer('Failed to connect to AI service.');
    }
    setAiLoading(false);
  };

  const joinCall = async () => {
    try {
      setIsConnecting(true);

      // Get logged-in doctor's credentials from AsyncStorage
      const [doctorId, doctorName] = await Promise.all([
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('userName'),
      ]);

      if (!doctorId || !doctorName) {
        throw new Error('Doctor credentials not found. Please log in again.');
      }

      // Get token to join the room as doctor
      const response = await api.joinVideoRoom(
        roomName,
        doctorId,
        doctorName,
        'doctor'
      );

      if (response.error) {
        throw new Error(response.error);
      }

      const roomUrl = response.data?.roomUrl;
      const token = response.data?.token;
      if (!roomUrl || !token) {
        throw new Error('Video room token is missing. Please try again.');
      }

      const separator = roomUrl.includes('?') ? '&' : '?';
      const joinUrl = `${roomUrl}${separator}t=${encodeURIComponent(token)}`;
      setDailyJoinUrl(joinUrl);
      setIsConnecting(false);

      console.log('Doctor joined video call:', roomName);

      // Check if patient has joined yet (Bug #26 item 4)
      try {
        const callsResponse = await api.getActiveCalls();
        if (callsResponse.data) {
          const thisCall = callsResponse.data.find((c: any) => c.roomName === roomName);
          if (thisCall && !thisCall.patientJoined) {
            Alert.alert(
              'Patient Status',
              'Patient not in room yet. They will appear once they connect.'
            );
          }
        }
      } catch {
        // Non-critical, ignore
      }
    } catch (error: any) {
      console.error('Failed to join call:', error);
      setIsConnecting(false);

      Alert.alert(
        'Connection Failed',
        'Unable to connect to the video call.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const startCallTimer = () => {
    if (callStartTime.current) return;
    callStartTime.current = Date.now();
    timerInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);

    // Auto-start transcription when call connects
    startAutoTranscribe();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showDailyControlsHint = () => {
    Alert.alert('Daily controls', 'Use the in-call controls inside the Daily video window for mic and camera.');
  };

  const endCall = async () => {
    Alert.alert(
      'End Consultation',
      'You will review and sign the consultation report before closing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              // Save notes before ending
              if (notesRef.current.trim()) {
                await saveNotes(notesRef.current);
              }
              // Record consultation in history
              const doctorName = await AsyncStorage.getItem('userName');
              const completeResult = await api.completeConsultation(
                patientId,
                roomName,
                doctorName || 'Doctor',
                doctorLanguage as any,
                (patientLanguage || 'en') as any
              );
              if (completeResult.error) {
                console.error('Failed to record consultation:', completeResult.error);
              } else {
                setCompletedConsultationId(completeResult.data?.id || null);
              }
              await api.endVideoCall(roomName);
              // Cleanup
              stopListening();
              stopAutoTranscribe();
              sseActiveRef.current = false;
              api.clearLiveTranscript(roomName).catch(() => {});
              if (timerInterval.current) clearInterval(timerInterval.current);
              if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
              // Enter mandatory post-call report flow (#99)
              setPostCallStep('generating');
              autoGenerateReportForPostCall();
            } catch (error) {
              console.error('Error ending call:', error);
              navigation.popToTop();
            }
          },
        },
      ]
    );
  };

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.connectingContainer}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <MaterialCommunityIcons name="video" size={64} color="rgba(255,255,255,0.8)" />
          <Text style={styles.connectingText}>Joining consultation...</Text>
          <Text style={styles.connectingSubtext}>Patient: {patientName || 'Patient'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Container */}
      <View style={styles.videoContainer}>
        {dailyJoinUrl ? (
          <WebView
            source={{ uri: dailyJoinUrl }}
            style={styles.webview}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            onLoadEnd={startCallTimer}
            onError={(webError) => {
              console.error('Doctor Daily webview error:', webError.nativeEvent);
              Alert.alert('Video Error', 'Video call failed to load. Please rejoin the consultation.');
            }}
            onHttpError={(syntheticEvent) => {
              const { statusCode } = syntheticEvent.nativeEvent;
              console.error(`Doctor WebView HTTP error: ${statusCode}`);
              if (statusCode >= 400) {
                Alert.alert('Video Error', `Video room returned error ${statusCode}. Please try again.`);
              }
            }}
          />
        ) : (
          <View style={styles.remoteVideoContainer}>
            <View style={styles.placeholderVideoContent}>
              <MaterialCommunityIcons name="alert-circle" size={72} color="rgba(255,255,255,0.6)" />
              <Text style={styles.placeholderText}>Unable to load video room</Text>
            </View>
          </View>
        )}

        {/* Call Info */}
        <View style={styles.callInfoOverlay}>
          <Surface style={[styles.callInfoBadge, shadows.medium]}>
            <MaterialCommunityIcons name="circle" size={8} color="#4CAF50" />
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          </Surface>
          {languageMismatch && (
            <TouchableOpacity
              style={[styles.translateBadge, showTranslated && styles.translateBadgeActive]}
              onPress={() => setShowTranslated(!showTranslated)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="translate" size={14} color="#FFFFFF" />
              <Text style={styles.translateBadgeText}>
                {showTranslated ? LANGUAGE_LABELS[doctorLanguage] || doctorLanguage : LANGUAGE_LABELS[patientLanguage] || patientLanguage}
              </Text>
              {translating && <ActivityIndicator size={12} color="#FFFFFF" />}
            </TouchableOpacity>
          )}
        </View>

        {/* Video tap zone for toggling floating call controls.
            Excludes right-side panel toggle area (stethoscope etc.). */}
        <TouchableOpacity
          activeOpacity={1}
          style={styles.videoTapZone}
          onPress={() => setShowFloatingControls((prev) => !prev)}
        />

        {/* Panel Toggle Buttons */}
        <View style={styles.panelToggles}>
          <IconButton
            icon="stethoscope"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showLiveAssist && styles.insightsButtonActive]}
            onPress={() => { setShowLiveAssist((v) => !v); setShowReport(false); }}
          />
          <IconButton
            icon="file-document-edit"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showReport && styles.insightsButtonActive]}
            onPress={() => { setShowReport((v) => !v); setShowLiveAssist(false); }}
          />
        </View>
      </View>

      {/* Clinical Assist + Notes Pane (default open) */}
      {showLiveAssist && (
        <View style={[styles.assistPane, { height: assistFullscreen ? height - (isTablet ? 120 : 100) : assistPaneHeight }]}>
          {/* Header */}
          <View style={styles.assistPaneHeader}>
            <View style={styles.assistPaneHeaderLeft}>
              <MaterialCommunityIcons name="stethoscope" size={18} color={theme.colors.primary} />
              <Text style={styles.assistPaneTitle}>{t('doctor.clinicalAssist')}</Text>
              {liveAssistLoading && <ActivityIndicator size={12} color={theme.colors.primary} />}
              {/* SSE Connection Status */}
              <View style={styles.connectionStatus}>
                <View style={[styles.statusDot, { backgroundColor: sseConnected ? '#4CAF50' : '#FFC107' }]} />
                <Text style={styles.statusText}>{sseConnected ? t('doctor.live') : t('doctor.connecting')}</Text>
              </View>
            </View>
            <View style={styles.assistPaneHeaderRight}>
              <TouchableOpacity onPress={refreshLiveAssist} style={styles.assistHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="refresh" size={16} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAssistFullscreen((v) => !v)} style={styles.assistHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name={assistFullscreen ? 'chevron-down' : 'chevron-up'} size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowLiveAssist(false)} style={styles.assistHeaderBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={18} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Bar */}
          <View style={styles.assistTabBar}>
            {(['dx', 'meds', 'context', 'notes'] as const).map((tab) => {
              const labels: Record<string, string> = {
                dx: t('doctor.dxShort'),
                meds: t('doctor.medsShort'),
                context: t('doctor.context'),
                notes: t('doctor.notesAndRx'),
              };
              const isActive = assistTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.assistTabItem, isActive && styles.assistTabItemActive]}
                  onPress={() => setAssistTab(tab)}
                >
                  <Text style={[styles.assistTabText, isActive && styles.assistTabTextActive]}>{labels[tab]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.assistPaneScroll}>
            {/* STT controls — always visible at top */}
            <View style={[styles.assistSection, { paddingBottom: 0 }]}>
              <View style={styles.sttControls}>
                {sttAvailable ? (
                  <TouchableOpacity
                    style={[styles.sttButton, (autoTranscribing || isListening) && styles.sttButtonActive]}
                    onPress={autoTranscribing ? stopAutoTranscribe : isListening ? stopListening : startAutoTranscribe}
                  >
                    <MaterialCommunityIcons name={(autoTranscribing || isListening) ? 'stop' : 'microphone'} size={14} color={(autoTranscribing || isListening) ? '#FFFFFF' : theme.colors.primary} />
                    <Text style={[styles.sttButtonText, (autoTranscribing || isListening) && { color: '#FFFFFF' }]}>
                      {autoTranscribing ? t('doctor.autoTranscribing') : isListening ? t('doctor.stopListening') : t('doctor.autoTranscribe')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.manualEntryRow}>
                    <TextInput
                      style={styles.manualEntryInput}
                      placeholder={t('doctor.typePatientSpeech')}
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={manualTranscriptInput}
                      onChangeText={setManualTranscriptInput}
                      onSubmitEditing={handleManualTranscriptEntry}
                      returnKeyType="send"
                    />
                    <TouchableOpacity onPress={handleManualTranscriptEntry} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <MaterialCommunityIcons name="send" size={16} color={manualTranscriptInput.trim() ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                  </View>
                )}
                {liveTranscriptEntries.length > 0 && (
                  <View style={styles.liveTranscriptIndicator}>
                    <MaterialCommunityIcons name="microphone-message" size={12} color={theme.colors.secondary} />
                    <Text style={styles.liveTranscriptIndicatorText}>
                      {liveTranscriptEntries.length} entries
                    </Text>
                    {(autoTranscribing || isListening) && <View style={styles.listeningDot} />}
                  </View>
                )}
              </View>
            </View>

            {/* Dx Tab */}
            {assistTab === 'dx' && (
              <View style={styles.assistSection}>
                {/* Live Summary */}
                <View style={styles.assistCard}>
                  <Text style={styles.assistCardLabel}>{t('doctor.liveSummary')}</Text>
                  <Text style={styles.assistCardText}>{liveAssistData?.liveSummary || t('doctor.waitingForCallInsights')}</Text>
                </View>

                {/* Insights */}
                {(liveAssistData?.insights || []).length > 0 && (
                  <View style={styles.assistCard}>
                    <Text style={styles.assistCardLabel}>{t('doctor.insights')}</Text>
                    {liveAssistData.insights.map((item: string, index: number) => (
                      <View key={`live-insight-${index}`} style={styles.findingRow}>
                        <MaterialCommunityIcons name="check-circle" size={13} color={theme.colors.primary} />
                        <Text style={styles.findingText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Suggested Questions */}
                {(liveAssistData?.suggestedQuestions || []).length > 0 && (
                  <View style={styles.assistCard}>
                    <Text style={styles.assistCardLabel}>{t('doctor.suggestedQuestions')}</Text>
                    {liveAssistData.suggestedQuestions.map((item: string, index: number) => (
                      <Text key={`question-${index}`} style={styles.findingText}>{'\u2022'} {item}</Text>
                    ))}
                  </View>
                )}

                {/* Possible Diagnostics */}
                {(liveAssistData?.possibleDiagnostics || []).length > 0 && (
                  <View style={styles.assistCard}>
                    <Text style={styles.assistCardLabel}>{t('doctor.possibleDiagnostics')}</Text>
                    {liveAssistData.possibleDiagnostics.map((diag: any, index: number) => (
                      <View key={`diag-${index}`} style={styles.liveDiagnosticItem}>
                        <View style={styles.diagnosticItemHeader}>
                          <Text style={styles.conditionName}>{diag.name}</Text>
                          <Chip
                            mode="flat"
                            style={[
                              styles.confidenceChip,
                              {
                                backgroundColor:
                                  diag.confidence === 'High'
                                    ? `${theme.colors.error}15`
                                    : diag.confidence === 'Medium'
                                    ? `${theme.colors.warning}15`
                                    : `${theme.colors.success}15`,
                              },
                            ]}
                            textStyle={[
                              styles.confidenceText,
                              {
                                color:
                                  diag.confidence === 'High'
                                    ? theme.colors.error
                                    : diag.confidence === 'Medium'
                                    ? theme.colors.warning
                                    : theme.colors.success,
                              },
                            ]}
                          >
                            {diag.confidence}
                          </Chip>
                        </View>
                        {diag.description && (
                          <Text style={styles.conditionDesc}>{diag.description}</Text>
                        )}
                        <View style={styles.medActions}>
                          <TouchableOpacity style={styles.medActionButton} onPress={() => addDiagnostic(diag.name)}>
                            <MaterialCommunityIcons name="clipboard-check" size={13} color={theme.colors.primary} />
                            <Text style={styles.medActionText}>{t('doctor.useAsDx')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.medActionButton, { borderColor: theme.colors.secondary }]}
                            onPress={() => {
                              const currentNotes = notesRef.current;
                              const line = `Possible Dx: ${diag.name} (${diag.confidence} confidence)${diag.description ? ' — ' + diag.description : ''}`;
                              const updatedNotes = currentNotes ? `${currentNotes}\n${line}` : line;
                              setDoctorNotes(updatedNotes);
                              Alert.alert(t('doctor.addedToNotesTitle'), t('doctor.dxAddedToNotes', { diagnosis: diag.name }));
                            }}
                          >
                            <MaterialCommunityIcons name="note-plus" size={13} color={theme.colors.secondary} />
                            <Text style={[styles.medActionText, { color: theme.colors.secondary }]}>{t('doctor.addToNotes')}</Text>
                          </TouchableOpacity>
                        </View>

                        {/* #98: Inline Recommended Medications under each diagnosis */}
                        <View style={styles.diagMedSection}>
                          <View style={styles.diagMedHeader}>
                            <MaterialCommunityIcons name="pill" size={12} color={theme.colors.primary} />
                            <Text style={styles.diagMedLabel}>{t('doctor.recommendedMeds', { defaultValue: 'Recommended Medications' })}</Text>
                            {diagMedLoading[diag.name] && <ActivityIndicator size={10} color={theme.colors.primary} />}
                            {!diagMedSuggestions[diag.name] && !diagMedLoading[diag.name] && (
                              <TouchableOpacity onPress={() => fetchDiagnosisMeds(diag.name)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                                <Text style={styles.diagMedFetchText}>{t('doctor.load', { defaultValue: 'Load' })}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {(diagMedSuggestions[diag.name] || []).length === 0 && !diagMedLoading[diag.name] && diagMedSuggestions[diag.name] && (
                            <Text style={styles.diagMedEmpty}>{t('doctor.noMedicationSuggestions')}</Text>
                          )}
                          {(diagMedSuggestions[diag.name] || []).map((med: any, mi: number) => {
                            const isPrescribed = prescriptions.some((p) => p.name === med.name);
                            return (
                              <View key={`diagmed-${mi}`} style={styles.diagMedItem}>
                                <View style={styles.diagMedInfo}>
                                  <Text style={styles.diagMedName}>{med.name}</Text>
                                  {med.dosage && <Text style={styles.diagMedDose}>{med.dosage}</Text>}
                                </View>
                                {isPrescribed ? (
                                  <TouchableOpacity
                                    style={styles.prescribedChip}
                                    onPress={() => openPrescriptionModal({ name: med.name, dosage: med.dosage, rationale: `For ${diag.name}` })}
                                  >
                                    <MaterialCommunityIcons name="check-circle" size={11} color={theme.colors.success} />
                                    <Text style={styles.prescribedChipText}>{t('doctor.prescribed', { defaultValue: 'Prescribed' })}</Text>
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.prescribeBtn}
                                    onPress={() => openPrescriptionModal({ name: med.name, dosage: med.dosage, rationale: `For ${diag.name}` })}
                                  >
                                    <Text style={styles.prescribeBtnText}>{t('doctor.prescribe', { defaultValue: 'Prescribe' })}</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Ask AI */}
                <View style={styles.assistCard}>
                  <Text style={styles.assistCardLabel}>{t('doctor.askAi')}</Text>
                  <View style={styles.aiChatRow}>
                    <TextInput
                      style={styles.aiChatInput}
                      placeholder={t('doctor.askConditionsPlaceholder')}
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={aiQuestion}
                      onChangeText={setAiQuestion}
                      onSubmitEditing={handleAskAI}
                      returnKeyType="send"
                    />
                    <TouchableOpacity
                      onPress={handleAskAI}
                      disabled={aiLoading || !aiQuestion.trim()}
                      style={styles.aiChatSend}
                    >
                      <MaterialCommunityIcons name="send" size={18} color={aiQuestion.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
                    </TouchableOpacity>
                  </View>
                  {aiLoading && <Text style={styles.askAiLoading}>{t('doctor.thinking')}</Text>}
                  {aiAnswer ? <Text style={styles.aiChatAnswer}>{aiAnswer}</Text> : null}
                </View>
              </View>
            )}

            {/* Meds Tab */}
            {assistTab === 'meds' && (
              <View style={styles.assistSection}>
                {/* AI Warning */}
                <View style={styles.aiWarningBanner}>
                  <MaterialCommunityIcons name="alert" size={14} color={theme.colors.warning} />
                  <Text style={styles.aiWarningText}>
                    {t('doctor.aiMedicationWarning')}
                  </Text>
                </View>

                {/* Medication Cards */}
                {(liveAssistData?.medication?.possibleMedication || liveAssistData?.possibleMedication || []).length > 0 ? (
                  <>
                    {(liveAssistData?.medication?.possibleMedication || liveAssistData?.possibleMedication || []).map((item: any, index: number) => (
                      <View key={`med-${index}`} style={styles.assistCard}>
                        <View style={styles.diagnosticItemHeader}>
                          <Text style={styles.conditionName}>{item.name || t('doctor.medicationOption')}</Text>
                          {item.confidence && (
                            <Chip
                              mode="flat"
                              style={[
                                styles.confidenceChip,
                                {
                                  backgroundColor:
                                    item.confidence === 'High'
                                      ? `${theme.colors.error}15`
                                      : item.confidence === 'Medium'
                                      ? `${theme.colors.warning}15`
                                      : `${theme.colors.success}15`,
                                },
                              ]}
                              textStyle={[
                                styles.confidenceText,
                                {
                                  color:
                                    item.confidence === 'High'
                                      ? theme.colors.error
                                      : item.confidence === 'Medium'
                                      ? theme.colors.warning
                                      : theme.colors.success,
                                },
                              ]}
                            >
                              {item.confidence}
                            </Chip>
                          )}
                        </View>
                        {item.indication && (
                          <Text style={styles.conditionDesc}>{item.indication}</Text>
                        )}
                        {item.rationale && (
                          <Text style={styles.assistCardText}>{item.rationale}</Text>
                        )}
                        {item.safetyFlags && item.safetyFlags.length > 0 && item.safetyFlags.map((flag: string, fi: number) => (
                          <View key={`flag-${fi}`} style={styles.safetyFlagRow}>
                            <MaterialCommunityIcons name="alert-circle" size={12} color={theme.colors.error} />
                            <Text style={styles.safetyFlagText}>{flag}</Text>
                          </View>
                        ))}
                        <View style={styles.medActions}>
                          <TouchableOpacity style={styles.medActionButton} onPress={() => openPrescriptionModal({ name: item.name, dosage: item.dosage, rationale: item.rationale })}>
                            <MaterialCommunityIcons name="plus-circle" size={13} color={theme.colors.primary} />
                            <Text style={styles.medActionText}>{t('doctor.useForRx')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.medActionButton, { borderColor: theme.colors.secondary }]}
                            onPress={() => {
                              const currentNotes = notesRef.current;
                              const line = `Med consideration: ${item.name}${item.rationale ? ' — ' + item.rationale : ''}`;
                              const updatedNotes = currentNotes ? `${currentNotes}\n${line}` : line;
                              setDoctorNotes(updatedNotes);
                              Alert.alert(t('doctor.addedToNotesTitle'), t('doctor.medAddedToNotes', { medication: item.name }));
                            }}
                          >
                            <MaterialCommunityIcons name="note-plus" size={13} color={theme.colors.secondary} />
                            <Text style={[styles.medActionText, { color: theme.colors.secondary }]}>{t('doctor.addToNotes')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.medActionButton, { borderColor: theme.colors.onSurfaceVariant }]} onPress={() => lookupDrugFacts(item.name)}>
                            <MaterialCommunityIcons name="information" size={13} color={theme.colors.onSurfaceVariant} />
                            <Text style={[styles.medActionText, { color: theme.colors.onSurfaceVariant }]}>{t('doctor.drugFacts')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </>
                ) : (
                  <View style={styles.assistCard}>
                    <Text style={styles.assistCardText}>{t('doctor.noMedicationSuggestions')}</Text>
                  </View>
                )}

                {/* Medication Q&A */}
                <View style={styles.assistCard}>
                  <Text style={styles.assistCardLabel}>{t('doctor.medicationQna')}</Text>
                  <View style={styles.aiChatRow}>
                    <TextInput
                      style={styles.aiChatInput}
                      placeholder={t('doctor.askMedicationPlaceholder')}
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      value={medQuestion}
                      onChangeText={setMedQuestion}
                      onSubmitEditing={askMedicationInCall}
                      returnKeyType="send"
                    />
                    <TouchableOpacity
                      onPress={askMedicationInCall}
                      disabled={medAnswerLoading || !medQuestion.trim()}
                      style={styles.aiChatSend}
                    >
                      <MaterialCommunityIcons name="send" size={18} color={medQuestion.trim() ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
                    </TouchableOpacity>
                  </View>
                  {medAnswerLoading && <Text style={styles.askAiLoading}>{t('doctor.thinking')}</Text>}
                  {medAnswer ? <Text style={styles.aiChatAnswer}>{medAnswer}</Text> : null}
                </View>
              </View>
            )}

            {/* Context Tab */}
            {assistTab === 'context' && (
              <View style={styles.assistSection}>
                {/* Sub-tab bar */}
                <View style={styles.contextSubTabBar}>
                  {(['vitals', 'transcript', 'insights', 'history'] as const).map((sub) => {
                    const subLabels: Record<string, string> = {
                      vitals: t('doctor.vitals'),
                      transcript: t('doctor.triageChat'),
                      insights: t('doctor.aiInsights'),
                      history: t('doctor.history'),
                    };
                    const isSubActive = contextSubtab === sub;
                    return (
                      <TouchableOpacity
                        key={sub}
                        style={[styles.contextSubTabItem, isSubActive && styles.contextSubTabItemActive]}
                        onPress={() => setContextSubtab(sub)}
                      >
                        <Text style={[styles.contextSubTabText, isSubActive && styles.contextSubTabTextActive]}>{subLabels[sub]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Vitals sub-tab */}
                {contextSubtab === 'vitals' && (
                  !biometrics ? (
                    <Text style={styles.insightText}>{t('doctor.noBiometricData')}</Text>
                  ) : (
                    <View>
                      {biometrics.bloodPressureSystolic && biometrics.bloodPressureDiastolic && (
                        <BiometricRow
                          icon="blood-bag"
                          label="Blood Pressure"
                          value={`${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic} mmHg`}
                          status={checkBiometricStatus('bloodPressureSystolic', biometrics.bloodPressureSystolic)}
                        />
                      )}
                      {biometrics.heartRate && (
                        <BiometricRow
                          icon="heart-pulse"
                          label="Heart Rate"
                          value={`${biometrics.heartRate} bpm`}
                          status={checkBiometricStatus('heartRate', biometrics.heartRate)}
                        />
                      )}
                      {biometrics.temperature && (
                        <BiometricRow
                          icon="thermometer"
                          label="Temperature"
                          value={`${biometrics.temperature}${biometrics.temperatureUnit === 'C' ? '°C' : '°F'}`}
                          status={checkBiometricStatus('temperature', biometrics.temperature, biometrics)}
                        />
                      )}
                      {biometrics.bloodOxygen && (
                        <BiometricRow
                          icon="lungs"
                          label="SpO2"
                          value={`${biometrics.bloodOxygen}%`}
                          status={checkBiometricStatus('bloodOxygen', biometrics.bloodOxygen)}
                        />
                      )}
                      {biometrics.respiratoryRate && (
                        <BiometricRow
                          icon="weather-windy"
                          label="Respiratory Rate"
                          value={`${biometrics.respiratoryRate} breaths/min`}
                          status={checkBiometricStatus('respiratoryRate', biometrics.respiratoryRate)}
                        />
                      )}
                      {biometrics.bloodSugar && (
                        <BiometricRow
                          icon="water"
                          label="Blood Sugar"
                          value={`${biometrics.bloodSugar} mg/dL${biometrics.bloodSugarContext ? ` (${biometrics.bloodSugarContext})` : ''}`}
                          status={checkBiometricStatus('bloodSugar', biometrics.bloodSugar)}
                        />
                      )}
                      {biometrics.painLevel && (
                        <BiometricRow
                          icon="alert-circle"
                          label="Pain Level"
                          value={`${biometrics.painLevel}/10`}
                          status={checkBiometricStatus('painLevel', biometrics.painLevel)}
                        />
                      )}
                      {biometrics.weight && (
                        <BiometricRow
                          icon="scale-bathroom"
                          label="Weight"
                          value={`${biometrics.weight} ${biometrics.weightUnit || 'lbs'}`}
                          status={{ status: 'normal', label: '' }}
                        />
                      )}
                      {biometrics.height && (
                        <BiometricRow
                          icon="human-male-height"
                          label="Height"
                          value={`${biometrics.height} ${biometrics.heightUnit || 'cm'}`}
                          status={{ status: 'normal', label: '' }}
                        />
                      )}
                      {biometrics.notes && (
                        <View style={styles.bioNotesContainer}>
                          <Text style={styles.insightLabel}>{t('doctor.patientNotes')}</Text>
                          <Text style={styles.insightText}>{biometrics.notes}</Text>
                        </View>
                      )}
                    </View>
                  )
                )}

                {/* Triage Chat sub-tab */}
                {contextSubtab === 'transcript' && (
                  <View>
                    {languageMismatch && (
                      <TouchableOpacity
                        style={[styles.translateToggle, showTranslated && styles.translateToggleActive, { marginBottom: 8 }]}
                        onPress={() => setShowTranslated(!showTranslated)}
                      >
                        <MaterialCommunityIcons name="translate" size={14} color={showTranslated ? '#FFFFFF' : theme.colors.primary} />
                        <Text style={[styles.translateToggleText, showTranslated && { color: '#FFFFFF' }]}>
                          {showTranslated ? t('doctor.translated') : t('doctor.translate')}
                        </Text>
                        {translating && <ActivityIndicator size={10} color={showTranslated ? '#FFFFFF' : theme.colors.primary} />}
                      </TouchableOpacity>
                    )}
                    {!triageTranscript?.messages || triageTranscript.messages.length === 0 ? (
                      <Text style={styles.insightText}>{t('doctor.noTriageTranscript')}</Text>
                    ) : (
                      triageTranscript.messages.map((msg: any, index: number) => {
                        const content = showTranslated && translatedTranscript[index]
                          ? translatedTranscript[index]
                          : msg.content;
                        return (
                          <View
                            key={index}
                            style={[
                              styles.transcriptBubble,
                              msg.role === 'ai' ? styles.transcriptAi : styles.transcriptPatient,
                            ]}
                          >
                            <View style={styles.transcriptHeader}>
                              <MaterialCommunityIcons
                                name={msg.role === 'ai' ? 'robot' : 'account'}
                                size={14}
                                color={msg.role === 'ai' ? theme.colors.primary : theme.colors.secondary}
                              />
                              <Text style={[
                                styles.transcriptRole,
                                { color: msg.role === 'ai' ? theme.colors.primary : theme.colors.secondary },
                              ]}>
                                {msg.role === 'ai' ? t('doctor.aiTriage') : t('doctor.patient')}
                              </Text>
                              {showTranslated && translatedTranscript[index] && (
                                <MaterialCommunityIcons name="translate" size={10} color={theme.colors.onSurfaceVariant} />
                              )}
                            </View>
                            <Text style={styles.transcriptMessage}>{content}</Text>
                          </View>
                        );
                      })
                    )}
                    {triageTranscript?.completedAt && (
                      <Text style={styles.transcriptTimestamp}>
                        {t('doctor.completedAt')}: {new Date(triageTranscript.completedAt).toLocaleString()}
                      </Text>
                    )}
                  </View>
                )}

                {/* AI Insights sub-tab */}
                {contextSubtab === 'insights' && (() => {
                  const displayInsights = showTranslated && translatedInsights ? { ...insights, ...translatedInsights } : insights;
                  return (
                    <View>
                      {languageMismatch && (
                        <TouchableOpacity
                          style={[styles.translateToggle, showTranslated && styles.translateToggleActive, { marginBottom: 8 }]}
                          onPress={() => setShowTranslated(!showTranslated)}
                        >
                          <MaterialCommunityIcons name="translate" size={14} color={showTranslated ? '#FFFFFF' : theme.colors.primary} />
                          <Text style={[styles.translateToggleText, showTranslated && { color: '#FFFFFF' }]}>
                            {showTranslated ? t('doctor.translated') : t('doctor.translate')}
                          </Text>
                          {translating && <ActivityIndicator size={10} color={showTranslated ? '#FFFFFF' : theme.colors.primary} />}
                        </TouchableOpacity>
                      )}
                      {!insights ? (
                        <Text style={styles.insightText}>{t('doctor.noAiInsights')}</Text>
                      ) : (
                        <>
                          {displayInsights?.summary && (
                            <View style={styles.insightSection}>
                              <Text style={styles.insightLabel}>{t('doctor.summary')}</Text>
                              <Text style={styles.insightText}>{displayInsights.summary}</Text>
                            </View>
                          )}
                          {displayInsights?.keyFindings && displayInsights.keyFindings.length > 0 && (
                            <View style={styles.insightSection}>
                              <Text style={styles.insightLabel}>{t('doctor.keyFindings')}</Text>
                              {displayInsights.keyFindings.map((finding: string, index: number) => (
                                <View key={index} style={styles.findingRow}>
                                  <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.primary} />
                                  <Text style={styles.findingText}>{finding}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          {displayInsights?.possibleConditions && displayInsights.possibleConditions.length > 0 && (
                            <View style={styles.insightSection}>
                              <Text style={styles.insightLabel}>{t('doctor.possibleConditions')}</Text>
                              {displayInsights.possibleConditions.map((condition: any, index: number) => (
                                <TouchableOpacity key={index} style={styles.conditionRow} onPress={() => addDiagnostic(condition.name)} activeOpacity={0.7}>
                                  <Chip
                                    mode="flat"
                                    style={[
                                      styles.confidenceChip,
                                      {
                                        backgroundColor:
                                          condition.confidence === 'High'
                                            ? `${theme.colors.error}15`
                                            : condition.confidence === 'Medium'
                                            ? `${theme.colors.warning}15`
                                            : `${theme.colors.success}15`,
                                      },
                                    ]}
                                    textStyle={[
                                      styles.confidenceText,
                                      {
                                        color:
                                          condition.confidence === 'High'
                                            ? theme.colors.error
                                            : condition.confidence === 'Medium'
                                            ? theme.colors.warning
                                            : theme.colors.success,
                                      },
                                    ]}
                                  >
                                    {condition.confidence}
                                  </Chip>
                                  <View style={styles.conditionInfo}>
                                    <Text style={styles.conditionName}>{condition.name}</Text>
                                    <Text style={styles.conditionDesc}>{condition.description}</Text>
                                  </View>
                                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color={theme.colors.primary} />
                                </TouchableOpacity>
                              ))}
                              <Text style={styles.tapHint}>{t('doctor.tapConditionHint')}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  );
                })()}

                {/* History sub-tab */}
                {contextSubtab === 'history' && (
                  <View>
                    {languageMismatch && (
                      <TouchableOpacity
                        style={[styles.translateToggle, showTranslated && styles.translateToggleActive, { marginBottom: 8 }]}
                        onPress={() => setShowTranslated(!showTranslated)}
                      >
                        <MaterialCommunityIcons name="translate" size={14} color={showTranslated ? '#FFFFFF' : theme.colors.primary} />
                        <Text style={[styles.translateToggleText, showTranslated && { color: '#FFFFFF' }]}>
                          {showTranslated ? t('doctor.translated') : t('doctor.translate')}
                        </Text>
                        {translating && <ActivityIndicator size={10} color={showTranslated ? '#FFFFFF' : theme.colors.primary} />}
                      </TouchableOpacity>
                    )}
                    {historyLoading ? (
                      <View style={styles.historyLoading}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={styles.insightText}>{t('doctor.historyLoading')}</Text>
                      </View>
                    ) : consultationHistoryData.length === 0 ? (
                      <Text style={styles.insightText}>{t('doctor.noPreviousConsultations')}</Text>
                    ) : (
                      consultationHistoryData.map((consultation: any, index: number) => (
                        <View key={consultation.id || index} style={styles.historyCard}>
                          <View style={styles.historyCardHeader}>
                            <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.primary} />
                            <Text style={styles.historyDate}>
                              {new Date(consultation.completedAt).toLocaleDateString()}
                            </Text>
                            {consultation.doctorName && (
                              <Text style={styles.historyDoctor}>Dr. {consultation.doctorName}</Text>
                            )}
                          </View>
                          {consultation.summary && (
                            <Text style={styles.historySummary}>
                              {(showTranslated && translatedHistory[String(consultation.id || consultation.completedAt || '')]?.summary) ||
                                consultation.summary}
                            </Text>
                          )}
                          {consultation.possibleConditions?.length > 0 && (
                            <View style={styles.historyConditions}>
                              {consultation.possibleConditions.slice(0, 3).map((c: any, ci: number) => (
                                <Chip key={ci} mode="flat" style={styles.historyChip} textStyle={styles.historyChipText}>
                                  {c.name}
                                </Chip>
                              ))}
                            </View>
                          )}
                          {consultation.doctorNotes && (
                            <View style={styles.historyNotes}>
                              <Text style={styles.insightLabel}>{t('doctor.doctorNotes')}</Text>
                              <Text style={styles.historyNotesText}>
                                {(showTranslated && translatedHistory[String(consultation.id || consultation.completedAt || '')]?.doctorNotes) ||
                                  consultation.doctorNotes}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Notes & Rx Tab — 4-section structured layout (#92) */}
            {assistTab === 'notes' && (
              <View style={styles.assistSection}>
                {/* Header with save indicator */}
                <View style={styles.notesSectionHeader}>
                  <MaterialCommunityIcons name="note-edit" size={16} color={theme.colors.primary} />
                  <Text style={styles.assistCardLabel}>{t('doctor.notesAndRx')}</Text>
                  {notesSaved && (
                    <View style={styles.savedBadge}>
                      <MaterialCommunityIcons name="check" size={10} color={theme.colors.success} />
                      <Text style={styles.savedText}>{t('common.saved', { defaultValue: 'Saved' })}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => saveNotes(
                      [doctorNotes, additionalNotes].filter(Boolean).join('\n\n---\n\n')
                    )}
                    style={styles.saveNowButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="content-save" size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>

                {/* Section 1: General Notes */}
                <View style={styles.notesFieldBlock}>
                  <Text style={styles.notesFieldLabel}>{t('doctor.generalNotes')}</Text>
                  <TextInput
                    style={styles.notesTextarea}
                    multiline
                    placeholder={t('doctor.generalNotesPlaceholder')}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={doctorNotes}
                    onChangeText={setDoctorNotes}
                    textAlignVertical="top"
                  />
                </View>

                {/* Section 2: Diagnosed Cause / Diagnostics */}
                <View style={styles.notesFieldBlock}>
                  <Text style={styles.notesFieldLabel}>{t('doctor.diagnosedCause')}</Text>
                  {diagnostics.length > 0 && (
                    <View style={styles.diagnosticsList}>
                      {diagnostics.map((dx, index) => (
                        <View key={index} style={styles.diagnosticChip}>
                          <Text style={styles.diagnosticText}>{dx}</Text>
                          <TouchableOpacity
                            onPress={() => setDiagnostics((prev) => prev.filter((_, i) => i !== index))}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <MaterialCommunityIcons name="close-circle" size={12} color={theme.colors.onSurfaceVariant} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                  {diagnostics.length === 0 && (
                    <Text style={styles.notesEmptyHint}>{t('doctor.useDxHint')}</Text>
                  )}
                </View>

                {/* Section 3: Medication / Prescription Plan */}
                <View style={styles.notesFieldBlock}>
                  <Text style={styles.notesFieldLabel}>{t('doctor.medicationPlan')}</Text>
                  {prescriptions.length > 0 ? (
                    prescriptions.map((rx, index) => (
                      <View key={index} style={styles.rxListItem}>
                        <View style={styles.rxListInfo}>
                          <Text style={styles.rxListName}>{rx.name}</Text>
                          {rx.dosage && <Text style={styles.rxListDose}>{rx.dosage}</Text>}
                        </View>
                        <TouchableOpacity
                          onPress={() => setPrescriptions((prev) => prev.filter((_, i) => i !== index))}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.notesEmptyHint}>{t('doctor.useRxHint')}</Text>
                  )}
                </View>

                {/* Section 4: Additional Clinical Note */}
                <View style={styles.notesFieldBlock}>
                  <Text style={styles.notesFieldLabel}>{t('doctor.additionalClinicalNote')}</Text>
                  <TextInput
                    style={styles.notesTextarea}
                    multiline
                    placeholder={t('doctor.additionalNotesPlaceholder')}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={additionalNotes}
                    onChangeText={setAdditionalNotes}
                    textAlignVertical="top"
                  />
                </View>

                <Text style={styles.autoSaveHint}>{t('doctor.autosaveHint')}</Text>

                {/* Auto-report status banner */}
                {autoReportStatus !== 'idle' && (
                  <View style={[styles.aiWarningBanner, {
                    backgroundColor: autoReportStatus === 'ready'
                      ? `${theme.colors.success}12`
                      : autoReportStatus === 'failed'
                      ? `${theme.colors.error}12`
                      : `${theme.colors.primary}12`,
                  }]}>
                    {autoReportStatus === 'generating' && <ActivityIndicator size={12} color={theme.colors.primary} />}
                    {autoReportStatus === 'ready' && <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.success} />}
                    {autoReportStatus === 'failed' && <MaterialCommunityIcons name="alert-circle" size={14} color={theme.colors.error} />}
                    <Text style={[styles.aiWarningText, {
                      color: autoReportStatus === 'ready'
                        ? theme.colors.success
                        : autoReportStatus === 'failed'
                        ? theme.colors.error
                        : theme.colors.primary,
                    }]}>
                      {autoReportStatus === 'generating' && t('doctor.generatingReport')}
                      {autoReportStatus === 'ready' && t('doctor.reportReady')}
                      {autoReportStatus === 'failed' && t('doctor.reportFailed')}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Report Generation Panel */}
      {showReport && (
        <View style={[styles.notesPanel, isTablet && { maxHeight: 500 }]}>
          <View style={styles.insightsPanelHeader}>
            <MaterialCommunityIcons name="file-document-edit" size={20} color={theme.colors.primary} />
            <Text style={styles.insightsPanelTitle}>Generate Report</Text>
            <IconButton
              icon="close"
              size={18}
              onPress={() => setShowReport(false)}
              style={styles.closeInsights}
            />
          </View>

          {!generatedReport ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              <Text style={styles.reportLabel}>Prescriptions (optional)</Text>
              <TextInput
                style={styles.reportInput}
                multiline
                placeholder="e.g., Amoxicillin 500mg TID x 7 days..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={reportPrescriptions}
                onChangeText={setReportPrescriptions}
                textAlignVertical="top"
              />
              <Text style={styles.reportLabel}>Instructions for patient (optional)</Text>
              <TextInput
                style={styles.reportInput}
                multiline
                placeholder="e.g., Rest for 48 hours, increase fluids..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={reportInstructions}
                onChangeText={setReportInstructions}
                textAlignVertical="top"
              />
              <Button
                mode="contained"
                onPress={handleGenerateReport}
                loading={reportLoading}
                disabled={reportLoading}
                icon="file-document"
                style={styles.reportButton}
              >
                {reportLoading ? 'Generating...' : 'Generate Report'}
              </Button>
              <Text style={styles.reportHint}>
                Report will include vitals, triage insights, your notes, and AI analysis.
              </Text>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              <Text style={styles.insightText}>{generatedReport}</Text>
              <View style={styles.reportActions}>
                <Button
                  mode="outlined"
                  onPress={() => setGeneratedReport('')}
                  icon="refresh"
                  compact
                  style={styles.reportActionButton}
                >
                  Regenerate
                </Button>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Live Transcript panel is now integrated into the AI Assist tab */}

      {/* Prescription Modal */}
      <Modal visible={rxModalVisible} transparent animationType="fade" onRequestClose={() => setRxModalVisible(false)}>
        <View style={styles.rxModalOverlay}>
          <View style={styles.rxModalContainer}>
            <View style={styles.rxModalHeader}>
              <MaterialCommunityIcons name="pill" size={22} color={theme.colors.primary} />
              <Text style={styles.rxModalTitle}>Add to Prescription</Text>
              <TouchableOpacity onPress={() => setRxModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.rxModalDrugName}>{rxModalMed?.name}</Text>
            {rxModalMed?.rationale && (
              <Text style={styles.rxModalRationale}>{rxModalMed.rationale}</Text>
            )}

            <Text style={styles.rxModalLabel}>Dose & Frequency</Text>
            {rxDoseLoading ? (
              <View style={styles.rxDoseLoading}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.rxDoseLoadingText}>Getting AI recommendation...</Text>
              </View>
            ) : (
              <TextInput
                style={styles.rxModalInput}
                value={rxDose}
                onChangeText={setRxDose}
                placeholder="e.g., 500mg twice daily for 7 days"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            )}

            <Text style={styles.rxModalLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.rxModalInput, styles.rxModalTextarea]}
              value={rxNotes}
              onChangeText={setRxNotes}
              placeholder="Any additional instructions..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              multiline
              textAlignVertical="top"
            />

            <Button
              mode="contained"
              icon="clipboard-check"
              onPress={confirmPrescription}
              style={styles.rxModalButton}
              disabled={rxDoseLoading}
            >
              Add to Prescription
            </Button>
          </View>
        </View>
      </Modal>

      {/* #99: Mandatory Post-Call Report Review + Signature Flow */}
      {postCallStep !== 'idle' && (
        <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => {}}>
          <SafeAreaView style={styles.postCallContainer}>
            {/* Header */}
            <View style={styles.postCallHeader}>
              <MaterialCommunityIcons
                name={postCallStep === 'signed' ? 'check-decagram' : 'file-document-edit'}
                size={22}
                color={postCallStep === 'signed' ? theme.colors.success : theme.colors.primary}
              />
              <Text style={styles.postCallTitle}>
                {postCallStep === 'generating' ? t('doctor.generatingReport', { defaultValue: 'Generating Report…' })
                  : postCallStep === 'reviewing' ? t('doctor.reviewAndSign', { defaultValue: 'Review & Sign' })
                  : postCallStep === 'signing' ? t('doctor.signatureTitle', { defaultValue: 'Sign Report' })
                  : postCallStep === 'signed' ? t('doctor.reportSigned', { defaultValue: 'Signed ✓' })
                  : t('doctor.reportFailed')}
              </Text>
              {postCallStep !== 'generating' && postCallStep !== 'signed' && (
                <Chip mode="flat" style={styles.draftChip} textStyle={styles.draftChipText}>
                  {t('doctor.reportDraft', { defaultValue: 'Draft' })}
                </Chip>
              )}
              {postCallStep === 'signed' && (
                <Chip mode="flat" style={styles.signedChip} textStyle={styles.signedChipText}>
                  {t('doctor.reportSigned', { defaultValue: 'Signed Final' })}
                </Chip>
              )}
            </View>

            {/* Generating state */}
            {postCallStep === 'generating' && (
              <View style={styles.postCallCenter}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.postCallGeneratingText}>
                  {t('doctor.generatingPleaseWait', { defaultValue: 'Generating your consultation report…' })}
                </Text>
                <Text style={styles.postCallGeneratingHint}>
                  {t('doctor.reportHintWait', { defaultValue: 'This usually takes 10–20 seconds.' })}
                </Text>
              </View>
            )}

            {/* Failed state */}
            {postCallStep === 'failed' && (
              <View style={styles.postCallCenter}>
                <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
                <Text style={styles.postCallGeneratingText}>{t('doctor.reportFailed')}</Text>
                <Button mode="contained" onPress={() => { setPostCallStep('generating'); autoGenerateReportForPostCall(); }} style={{ marginTop: spacing.lg }}>
                  {t('doctor.retryGeneration', { defaultValue: 'Retry' })}
                </Button>
                <Button mode="text" onPress={closeConsultationAfterSign} style={{ marginTop: spacing.sm }}>
                  {t('doctor.skipAndClose', { defaultValue: 'Skip & Close' })}
                </Button>
              </View>
            )}

            {/* Reviewing state */}
            {postCallStep === 'reviewing' && (
              <>
                <ScrollView style={styles.postCallScroll} contentContainerStyle={styles.postCallScrollContent}>
                  <View style={styles.aiWarningBanner}>
                    <MaterialCommunityIcons name="information" size={14} color={theme.colors.primary} />
                    <Text style={styles.aiWarningText}>
                      {t('doctor.aiSuggestionOnly', { defaultValue: 'AI-generated draft. Review and edit before signing.' })}
                    </Text>
                  </View>
                  <Text style={styles.reportSectionLabel}>{t('doctor.consultationReport', { defaultValue: 'Consultation Report' })}</Text>
                  <TextInput
                    style={styles.reportDraftInput}
                    multiline
                    value={reportDraft}
                    onChangeText={setReportDraft}
                    textAlignVertical="top"
                    placeholder={t('doctor.reportPlaceholder', { defaultValue: 'Report content…' })}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </ScrollView>
                <View style={styles.postCallFooter}>
                  <Button
                    mode="contained"
                    icon="pen"
                    onPress={() => setPostCallStep('signing')}
                    style={styles.postCallPrimaryBtn}
                    disabled={!reportDraft.trim()}
                  >
                    {t('doctor.signAndFinalize', { defaultValue: 'Sign & Finalize' })}
                  </Button>
                </View>
              </>
            )}

            {/* Signing state */}
            {postCallStep === 'signing' && (
              <>
                <ScrollView style={styles.postCallScroll} contentContainerStyle={styles.postCallScrollContent}>
                  <Surface style={styles.signatureCard}>
                    <MaterialCommunityIcons name="draw-pen" size={32} color={theme.colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.md }} />
                    <Text style={styles.signatureStatement}>
                      {t('doctor.signatureStatement', { defaultValue: 'I certify that this consultation report is accurate and complete to the best of my clinical knowledge.' })}
                    </Text>
                    <Text style={styles.signatureInputLabel}>
                      {t('doctor.signatureName', { defaultValue: 'Full Name (typed signature)' })}
                    </Text>
                    <TextInput
                      style={styles.signatureInput}
                      value={signatureName}
                      onChangeText={setSignatureName}
                      placeholder={t('doctor.signatureNamePlaceholder', { defaultValue: 'Dr. Your Name' })}
                      placeholderTextColor={theme.colors.onSurfaceVariant}
                      autoCapitalize="words"
                    />
                  </Surface>
                </ScrollView>
                <View style={styles.postCallFooter}>
                  <Button mode="outlined" onPress={() => setPostCallStep('reviewing')} style={styles.postCallSecondaryBtn}>
                    {t('common.back', { defaultValue: 'Back' })}
                  </Button>
                  <Button
                    mode="contained"
                    icon="check-decagram"
                    onPress={handleSignReport}
                    style={styles.postCallPrimaryBtn}
                    disabled={!signatureName.trim()}
                  >
                    {t('doctor.confirmSignature', { defaultValue: 'Confirm Signature' })}
                  </Button>
                </View>
              </>
            )}

            {/* Signed (success) state */}
            {postCallStep === 'signed' && (
              <View style={styles.postCallCenter}>
                <MaterialCommunityIcons name="check-decagram" size={64} color={theme.colors.success} />
                <Text style={styles.signedSuccessTitle}>{t('doctor.reportFinalized', { defaultValue: 'Report Finalized' })}</Text>
                <Text style={styles.signedSuccessBody}>
                  {t('doctor.reportFinalizedBody', { defaultValue: 'Your consultation report has been signed and saved.' })}
                </Text>
                {signatureName ? (
                  <View style={styles.signedByRow}>
                    <MaterialCommunityIcons name="draw-pen" size={14} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.signedByText}>
                      {t('doctor.signedBy', { defaultValue: `Signed by ${signatureName}`, signerName: signatureName })}
                    </Text>
                  </View>
                ) : null}
                <Button
                  mode="contained"
                  icon="check"
                  onPress={closeConsultationAfterSign}
                  style={[styles.postCallPrimaryBtn, { marginTop: spacing.xl, minWidth: 220 }]}
                >
                  {t('doctor.closeConsultation', { defaultValue: 'Close & Save Consultation' })}
                </Button>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      )}

      {/* Floating call controls plane */}
      {postCallStep === 'idle' && showFloatingControls && (
        <View style={styles.floatingControlsOverlay} pointerEvents="box-none">
          <View style={styles.controlsContainer}>
            <Surface style={[styles.controlsPanel, shadows.large]}>
              <View style={styles.controlButton}>
                <IconButton
                  icon="microphone"
                  size={28}
                  iconColor="#FFFFFF"
                  style={[styles.iconButton, styles.iconButtonActive]}
                  onPress={showDailyControlsHint}
                />
                <Text style={styles.controlLabel}>Mic</Text>
              </View>

              <View style={styles.controlButton}>
                <IconButton
                  icon="phone-hangup"
                  size={32}
                  iconColor="#FFFFFF"
                  style={[styles.iconButton, styles.iconButtonEnd]}
                  onPress={endCall}
                />
                <Text style={styles.controlLabel}>End</Text>
              </View>

              <View style={styles.controlButton}>
                <IconButton
                  icon="video"
                  size={28}
                  iconColor="#FFFFFF"
                  style={[styles.iconButton, styles.iconButtonActive]}
                  onPress={showDailyControlsHint}
                />
                <Text style={styles.controlLabel}>Camera</Text>
              </View>
            </Surface>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function BiometricRow({ icon, label, value, status }: {
  icon: string;
  label: string;
  value: string;
  status: { status: 'normal' | 'warning' | 'critical'; label: string };
}) {
  const color = getStatusColor(status.status);
  return (
    <View style={styles.bioRow}>
      <View style={[styles.bioIconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.bioInfo}>
        <Text style={styles.bioLabel}>{label}</Text>
        <Text style={[styles.bioValue, status.status !== 'normal' && { color }]}>{value}</Text>
      </View>
      {status.label ? (
        <Chip
          mode="flat"
          style={[styles.bioStatusChip, { backgroundColor: `${color}15` }]}
          textStyle={[styles.bioStatusText, { color }]}
        >
          {status.label}
        </Chip>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingText: {
    marginTop: spacing.lg,
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectingSubtext: {
    marginTop: spacing.sm,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  placeholderVideoContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: spacing.md,
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  localVideoContainer: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 120,
    height: 160,
    borderRadius: theme.roundness * 2,
    overflow: 'hidden',
  },
  localVideoContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  localVideoText: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  callInfoOverlay: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
  },
  callInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: theme.roundness * 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    gap: spacing.sm,
  },
  callDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  panelToggles: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 15,
    elevation: 15,
  },
  insightsButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  insightsButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  videoTapZone: {
    position: 'absolute',
    left: 0,
    right: 96,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  insightsPanel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    zIndex: 10,
    elevation: 10,
  },
  insightsScroll: {
    padding: spacing.lg,
  },
  insightsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  insightsPanelTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  closeInsights: {
    margin: 0,
  },
  insightSection: {
    marginBottom: spacing.md,
  },
  aiWarningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: `${theme.colors.warning}12`,
    padding: spacing.sm,
    borderRadius: theme.roundness,
    marginBottom: spacing.md,
  },
  aiWarningText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.onSurface,
    lineHeight: 17,
  },
  insightLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  findingText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  confidenceChip: {
    height: 24,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  conditionInfo: {
    flex: 1,
  },
  conditionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  conditionDesc: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 16,
  },
  liveDiagnosticItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.outline,
  },
  diagnosticItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  liveMedicationItem: {
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.outline,
  },
  medActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  medActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  medActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  tapHint: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  diagnosticsSection: {
    marginBottom: spacing.sm,
  },
  diagnosticsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  diagnosticChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.primary}10`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.roundness,
  },
  diagnosticText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  saveNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto' as any,
  },
  sttControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  sttButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  sttButtonActive: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  sttButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  manualEntryRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  manualEntryInput: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.onSurface,
    paddingVertical: 0,
  },
  liveTranscriptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: `${theme.colors.secondary}10`,
    padding: spacing.sm,
    borderRadius: theme.roundness,
    marginBottom: spacing.sm,
  },
  liveTranscriptIndicatorText: {
    fontSize: 11,
    color: theme.colors.secondary,
    fontWeight: '500',
  },
  assistPane: {
    height: 300,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  assistPaneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  assistPaneHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assistPaneTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  assistPaneHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assistHeaderBtn: {
    padding: 4,
  },
  assistPaneScroll: {
    flex: 1,
  },
  assistSection: {
    padding: spacing.md,
  },
  assistCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  assistCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  assistCardText: {
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  assistDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: spacing.md,
  },
  aiChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  aiChatInput: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.onSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  aiChatSend: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 6,
  },
  aiChatAnswer: {
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  notesTextarea: {
    minHeight: 80,
    maxHeight: 120,
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
    padding: spacing.sm,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  floatingControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 40,
    elevation: 40,
  },
  controlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  controlsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: theme.roundness * 2,
    backgroundColor: 'rgba(20,20,20,0.72)',
  },
  controlButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    margin: 0,
  },
  iconButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  iconButtonMuted: {
    backgroundColor: theme.colors.onSurfaceVariant,
  },
  iconButtonEnd: {
    backgroundColor: theme.colors.error,
  },
  controlLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: spacing.sm,
  },
  bioIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioInfo: {
    flex: 1,
  },
  bioLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bioValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  bioStatusChip: {
    height: 24,
  },
  bioStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  bioNotesContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: theme.roundness,
  },
  transcriptBubble: {
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginBottom: spacing.sm,
  },
  transcriptAi: {
    backgroundColor: `${theme.colors.primary}10`,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  transcriptPatient: {
    backgroundColor: `${theme.colors.secondary}10`,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  transcriptRole: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  transcriptMessage: {
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  transcriptTimestamp: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  notesPanel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: theme.roundness * 2,
    borderTopRightRadius: theme.roundness * 2,
    padding: spacing.lg,
    zIndex: 10,
    elevation: 10,
  },
  autoSaveHint: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.roundness,
  },
  savedText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '600',
  },
  askAiInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  askAiInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  askAiSend: {
    backgroundColor: theme.colors.secondary,
    margin: 0,
  },
  askAiLoading: {
    fontSize: 13,
    color: theme.colors.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  askAiAnswer: {
    maxHeight: 120,
    backgroundColor: `${theme.colors.secondary}08`,
    padding: spacing.md,
    borderRadius: theme.roundness,
  },
  translateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: theme.roundness * 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  translateBadgeActive: {
    backgroundColor: theme.colors.primary,
  },
  translateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  translateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  translateToggleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  translateToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  historyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  historyCard: {
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: theme.roundness,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  historyDoctor: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 'auto' as any,
  },
  historySummary: {
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  historyConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.xs,
  },
  historyChip: {
    height: 22,
    backgroundColor: `${theme.colors.primary}10`,
  },
  historyChipText: {
    fontSize: 10,
    color: theme.colors.primary,
  },
  historyNotes: {
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: theme.roundness,
  },
  historyNotesText: {
    fontSize: 12,
    color: theme.colors.onSurface,
    lineHeight: 16,
  },
  reportLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  reportInput: {
    minHeight: 60,
    maxHeight: 80,
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    marginBottom: spacing.sm,
  },
  reportButton: {
    marginTop: spacing.sm,
    borderRadius: theme.roundness,
  },
  reportHint: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  reportActionButton: {
    borderRadius: theme.roundness,
  },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${theme.colors.error}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.roundness,
  },
  listeningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  listeningText: {
    fontSize: 11,
    color: theme.colors.error,
    fontWeight: '600',
  },
  liveTranscriptScroll: {
    maxHeight: 160,
    marginBottom: spacing.sm,
  },
  liveTimestamp: {
    fontSize: 9,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 'auto' as any,
  },
  liveInsightBox: {
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginBottom: spacing.sm,
    backgroundColor: `${theme.colors.warning}10`,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  liveTranscriptActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  liveActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  liveActionButtonActive: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  liveActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  rxModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  rxModalContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.lg,
  },
  rxModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  rxModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  rxModalDrugName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  rxModalRationale: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  rxModalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  rxModalInput: {
    fontSize: 14,
    color: theme.colors.onSurface,
    padding: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  rxModalTextarea: {
    minHeight: 70,
    maxHeight: 100,
  },
  rxDoseLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: theme.roundness,
  },
  rxDoseLoadingText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  rxModalButton: {
    marginTop: spacing.lg,
    borderRadius: theme.roundness,
  },
  assistTabBar: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  assistTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  assistTabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  assistTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  assistTabTextActive: {
    color: theme.colors.primary,
  },
  contextSubTabBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  contextSubTabItem: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: 'transparent',
  },
  contextSubTabItemActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  contextSubTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  contextSubTabTextActive: {
    color: '#FFFFFF',
  },
  rxListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  rxListInfo: {
    flex: 1,
  },
  rxListName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  rxListDose: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  safetyFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  safetyFlagText: {
    fontSize: 11,
    color: theme.colors.error,
    flex: 1,
  },
  // Structured notes sections (#92)
  notesFieldBlock: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  notesFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  notesEmptyHint: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    paddingVertical: spacing.xs,
  },

  // #98: Inline diagnosis medication suggestions
  diagMedSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  diagMedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  diagMedLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  diagMedFetchText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  diagMedEmpty: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  diagMedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    gap: spacing.sm,
  },
  diagMedInfo: {
    flex: 1,
  },
  diagMedName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  diagMedDose: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  prescribedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  prescribedChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.success,
  },
  prescribeBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  prescribeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // #99: Post-call mandatory report flow
  postCallContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  postCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  postCallTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  draftChip: {
    backgroundColor: `${theme.colors.warning}18`,
    height: 24,
  },
  draftChipText: {
    fontSize: 11,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  signedChip: {
    backgroundColor: `${theme.colors.success}18`,
    height: 24,
  },
  signedChipText: {
    fontSize: 11,
    color: theme.colors.success,
    fontWeight: '600',
  },
  postCallCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  postCallGeneratingText: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  postCallGeneratingHint: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  postCallScroll: {
    flex: 1,
  },
  postCallScrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  reportSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  reportDraftInput: {
    minHeight: 320,
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 22,
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    textAlignVertical: 'top',
  },
  postCallFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  postCallPrimaryBtn: {
    flex: 1,
    borderRadius: theme.roundness,
  },
  postCallSecondaryBtn: {
    borderRadius: theme.roundness,
  },
  signatureCard: {
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    gap: spacing.md,
  },
  signatureStatement: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 21,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  signatureInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  signatureInput: {
    fontSize: 16,
    color: theme.colors.onSurface,
    padding: spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    fontWeight: '500',
  },
  signedSuccessTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  signedSuccessBody: {
    fontSize: 15,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  signedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  signedByText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
});
