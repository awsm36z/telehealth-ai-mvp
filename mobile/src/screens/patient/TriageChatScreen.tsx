import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, TextInput, IconButton, Surface, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { theme, spacing, shadows } from '../../theme';
import { getCurrentLanguage } from '../../i18n';
import api from '../../utils/api';
import RealtimeVoiceView, { RealtimeVoiceHandle } from '../../components/RealtimeVoiceView';

// Try to import speech recognition (requires dev build)
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: any = null;
try {
  const speechRecognition = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechRecognition.useSpeechRecognitionEvent;
} catch (e) {
  // expo-speech-recognition not available (e.g., running in Expo Go)
  console.log('Speech recognition not available - voice input will fall back to text mode');
}

const CONSULTATION_STATE_KEY = 'consultationState';

// Known female voice names for TTS
const PREFERRED_FEMALE_VOICES = [
  'Samantha', 'Karen', 'Kate', 'Moira', 'Martha', 'Flo',
  'Sandy', 'Shelley', 'Catherine', 'Tessa', 'Zoe', 'Nicky',
];

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export default function TriageChatScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const startFresh = !!route?.params?.startFresh;
  const consultationBiometrics = route?.params?.consultationBiometrics || null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0.1);
  const [questionCount, setQuestionCount] = useState(1);
  const [patientId, setPatientId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>(undefined);
  const [sttAvailable, setSttAvailable] = useState(false);
  const currentSoundRef = useRef<Audio.Sound | null>(null);

  // Realtime voice state
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const realtimeRef = useRef<RealtimeVoiceHandle>(null);

  // Pulse animation for mic button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Initialize TTS voice selection
  useEffect(() => {
    initializeVoice();
  }, []);

  // Set up STT event listeners via hooks (only if available)
  // We need to handle this carefully since useSpeechRecognitionEvent is a hook
  // but may not be available. We'll use a wrapper component pattern.

  // Resolve user ID before starting triage
  useEffect(() => {
    initializeTriage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Pulse animation for active listening
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isListening]);

  // Clean up TTS and realtime on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
      currentSoundRef.current?.unloadAsync().catch(() => {});
      realtimeRef.current?.endSession();
    };
  }, []);

  // Set up STT event listeners
  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) return;

    const handleResult = (event: any) => {
      const text = event?.results?.[0]?.transcript || '';
      setTranscript(text);
      if (event?.isFinal && text.trim()) {
        setIsListening(false);
        setIsTranscribing(true);
        setTimeout(() => {
          handleVoiceResult(text);
          setIsTranscribing(false);
          setTranscript('');
        }, 500);
      }
    };

    const handleEnd = () => {
      // When speech recognition ends naturally (user stops talking),
      // process any accumulated transcript that wasn't sent via isFinal
      setIsListening((wasListening) => {
        if (wasListening) {
          setTranscript((currentTranscript) => {
            if (currentTranscript.trim()) {
              setIsTranscribing(true);
              setTimeout(() => {
                handleVoiceResult(currentTranscript);
                setIsTranscribing(false);
                setTranscript('');
              }, 500);
            }
            return currentTranscript;
          });
        }
        return false;
      });
    };

    const handleError = (event: any) => {
      console.error('Speech recognition error:', event?.error, event?.message);
      setIsListening(false);
    };

    const resultSub = ExpoSpeechRecognitionModule.addListener?.('result', handleResult);
    const endSub = ExpoSpeechRecognitionModule.addListener?.('end', handleEnd);
    const errorSub = ExpoSpeechRecognitionModule.addListener?.('error', handleError);

    return () => {
      resultSub?.remove?.();
      endSub?.remove?.();
      errorSub?.remove?.();
    };
  }, []);

  const initializeVoice = async () => {
    try {
      // Configure audio session for playback (fixes iOS audio not working until mic is activated)
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      // Find a female voice for TTS
      const voices = await Speech.getAvailableVoicesAsync();
      const englishVoices = voices.filter((v) => v.language.startsWith('en'));

      // Try to find a preferred female voice (enhanced quality first)
      let femaleVoice = englishVoices.find(
        (v) => v.quality === 'Enhanced' && PREFERRED_FEMALE_VOICES.some((name) => v.name.includes(name))
      );
      if (!femaleVoice) {
        femaleVoice = englishVoices.find(
          (v) => PREFERRED_FEMALE_VOICES.some((name) => v.name.includes(name))
        );
      }

      if (femaleVoice) {
        setSelectedVoice(femaleVoice.identifier);
        console.log('Selected TTS voice:', femaleVoice.name, femaleVoice.identifier);
      } else {
        console.log('No preferred female voice found, using system default');
      }

      // Check if STT is available
      if (ExpoSpeechRecognitionModule) {
        try {
          const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
          setSttAvailable(available);
          if (!available) {
            console.log('Speech recognition not available on this device');
          }
        } catch {
          setSttAvailable(false);
        }
      }
    } catch (error) {
      console.error('Error initializing voice:', error);
    }
  };

  const stopCurrentAudio = useCallback(async () => {
    Speech.stop();
    if (currentSoundRef.current) {
      try {
        await currentSoundRef.current.stopAsync();
        await currentSoundRef.current.unloadAsync();
      } catch {}
      currentSoundRef.current = null;
    }
  }, []);

  const speakWithOpenAI = useCallback(async (text: string, onDone?: () => void): Promise<boolean> => {
    try {
      const response = await api.fetchTtsAudio(text, 'nova');
      if (!response.data) return false;

      // Convert ArrayBuffer to base64 for expo-av
      const bytes = new Uint8Array(response.data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mpeg;base64,${base64}` },
        { shouldPlay: true }
      );
      currentSoundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsSpeaking(false);
          sound.unloadAsync().catch(() => {});
          currentSoundRef.current = null;
          onDone?.();
        }
      });

      return true;
    } catch {
      return false;
    }
  }, []);

  const speakWithFallback = useCallback((text: string, onDone?: () => void) => {
    const lang = getCurrentLanguage();
    const speechLang = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-SA' : 'en-US';
    Speech.speak(text, {
      language: speechLang,
      pitch: 1.1,
      rate: 0.9,
      voice: lang === 'en' ? selectedVoice : undefined,
      onDone: () => { setIsSpeaking(false); onDone?.(); },
      onStopped: () => { setIsSpeaking(false); },
      onError: () => { setIsSpeaking(false); },
    });
  }, [selectedVoice]);

  const speakMessage = useCallback(async (text: string, onDone?: () => void) => {
    await stopCurrentAudio();
    setIsSpeaking(true);

    // Try OpenAI TTS first, fall back to device TTS
    const success = await speakWithOpenAI(text, onDone);
    if (!success) {
      speakWithFallback(text, onDone);
    }
  }, [stopCurrentAudio, speakWithOpenAI, speakWithFallback]);

  const startListening = async () => {
    if (isRealtimeActive || isListening) return;

    if (!ExpoSpeechRecognitionModule || !sttAvailable) {
      Alert.alert(
        t('triage.voiceUnavailable'),
        t('triage.voiceUnavailableMessage'),
      );
      return;
    }

    if (isSpeaking) {
      stopCurrentAudio();
    }

    try {
      const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!result.granted) {
        Alert.alert(
          t('triage.micPermissionRequired'),
          t('triage.micPermissionMessage'),
        );
        return;
      }

      setTranscript('');
      setIsListening(true);

      const lang = getCurrentLanguage();
      const sttLang = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-MA' : 'en-US';

      ExpoSpeechRecognitionModule.start({
        lang: sttLang,
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (ExpoSpeechRecognitionModule) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  };

  const handleBackPress = () => {
    stopCurrentAudio();
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('PatientHome');
  };

  const handleSkipTriage = () => {
    Alert.alert(
      t('triage.skipTitle'),
      t('triage.skipMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('triage.skipConfirm'),
          onPress: async () => {
            stopCurrentAudio();
            if (isRealtimeActive) stopRealtimeSession();
            if (isListening) stopListening();

            // Build partial triage data from whatever conversation has occurred
            const conversationSummary = messages
              .map((m) => `${m.role === 'user' ? 'Patient' : 'Nurse'}: ${m.content}`)
              .join('\n');

            const partialTriageData = {
              summary: conversationSummary || 'Patient chose to skip triage.',
              skipped: true,
            };

            await AsyncStorage.setItem(
              CONSULTATION_STATE_KEY,
              JSON.stringify({
                status: 'triage_complete',
                patientId,
                triageData: partialTriageData,
                insights: null,
                updatedAt: new Date().toISOString(),
              })
            );

            api.trackEvent('triage_skipped', { questionsAnswered: questionCount - 1 });

            navigation.navigate('WaitingRoom', {
              triageData: partialTriageData,
              insights: null,
            });
          },
        },
      ]
    );
  };

  // --- Realtime Voice Handlers ---
  const startRealtimeSession = useCallback(() => {
    if (!patientId) return;
    setIsRealtimeActive(true);
    api.trackEvent('realtime_voice_started');
  }, [patientId]);

  const stopRealtimeSession = useCallback(() => {
    realtimeRef.current?.endSession();
    setIsRealtimeActive(false);
    setIsRealtimeConnected(false);
    setIsUserSpeaking(false);
  }, []);

  const handleRealtimeTranscript = useCallback(
    (msg: { role: 'ai' | 'user'; content: string }) => {
      if (!msg.content.trim()) return;

      // Check for triage completion in AI messages
      const isComplete =
        msg.role === 'ai' &&
        msg.content.toLowerCase().includes('triage complete');

      const cleanContent = msg.content
        .replace(/\[?triage[_ ]?complete\]?/gi, '')
        .trim();

      if (!cleanContent) return;

      const newMessage: Message = {
        id: `${Date.now()}-${msg.role}`,
        role: msg.role === 'ai' ? 'ai' : 'user',
        content: cleanContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newMessage]);

      if (msg.role === 'user') {
        const nextQ = questionCount + 1;
        setQuestionCount(nextQ);
        setProgress(Math.min(nextQ / 10, 1));
      }

      if (isComplete && patientId) {
        // End realtime session and generate insights via the text endpoint
        stopRealtimeSession();
        api.trackEvent('triage_completed_realtime', { questionCount });

        // Call the triage chat endpoint with all messages to generate insights
        (async () => {
          try {
            setIsTyping(true);
            const allMessages = [...messages, newMessage].map((m) => ({
              role: m.role,
              content: m.content,
            }));

            // Force completion by adding a flag message
            const response = await api.triageChat({
              messages: allMessages,
              patientId,
              language: getCurrentLanguage(),
            });

            if (response.data?.triageData && response.data?.insights) {
              await persistCompletedState(patientId, response.data.triageData, response.data.insights);
              setTimeout(() => {
                navigation.navigate('InsightsScreen', {
                  triageData: response.data.triageData,
                  insights: response.data.insights,
                  fromTriageComplete: true,
                });
              }, 1500);
            } else {
              // Fallback: navigate to waiting room with conversation summary
              const conversationSummary = [...messages, newMessage]
                .map((m) => `${m.role === 'user' ? 'Patient' : 'Nurse'}: ${m.content}`)
                .join('\n');
              const triageData = { summary: conversationSummary };
              await persistCompletedState(patientId, triageData, null);
              setTimeout(() => {
                navigation.navigate('WaitingRoom', { triageData, insights: null });
              }, 1500);
            }
          } catch (error) {
            console.error('Error generating insights after realtime triage:', error);
            navigation.navigate('WaitingRoom', { triageData: { summary: 'Triage completed via voice.' }, insights: null });
          } finally {
            setIsTyping(false);
          }
        })();
      }
    },
    [messages, patientId, questionCount, stopRealtimeSession, navigation]
  );

  const handleRealtimeError = useCallback(
    (error: string) => {
      console.error('Realtime error:', error);
      setIsRealtimeActive(false);
      setIsRealtimeConnected(false);
      // Fall back to legacy voice mode
      Alert.alert(
        t('triage.voiceError', { defaultValue: 'Voice Error' }),
        t('triage.voiceErrorMessage', { defaultValue: 'Real-time voice is unavailable. Switching to standard voice mode.' }),
      );
    },
    [t]
  );

  const initializeTriage = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        setIsLoading(false);
        setMessages([{
          id: '1',
          role: 'ai',
          content: "I couldn't verify your account. Please log in again to continue.",
          timestamp: new Date(),
        }]);
        return;
      }

      setPatientId(storedUserId);
      if (startFresh) {
        await AsyncStorage.removeItem(CONSULTATION_STATE_KEY);
      }

      const restored = startFresh ? false : await restoreConsultationState(storedUserId);
      if (!restored) {
        await fetchInitialGreeting(storedUserId);
      }
      api.trackEvent('triage_started');
    } catch (error) {
      console.error('Error initializing triage:', error);
      setIsLoading(false);
    }
  };

  const restoreConsultationState = async (resolvedPatientId: string): Promise<boolean> => {
    try {
      const raw = await AsyncStorage.getItem(CONSULTATION_STATE_KEY);
      if (!raw) return false;

      const saved = JSON.parse(raw);
      if (
        saved?.patientId !== resolvedPatientId ||
        saved?.status !== 'in_progress' ||
        !Array.isArray(saved?.messages) ||
        saved.messages.length === 0
      ) {
        return false;
      }

      const restoredMessages: Message[] = saved.messages.map((m: any, idx: number) => ({
        id: m.id || `${Date.now()}-${idx}`,
        role: m.role === 'user' ? 'user' : 'ai',
        content: m.content || '',
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      }));

      setMessages(restoredMessages);
      setQuestionCount(saved.questionCount || 1);
      setProgress(saved.progress || 0.1);
      setIsLoading(false);

      // Speak the last AI message on restore if in voice mode
      const lastAiMessage = [...restoredMessages].reverse().find((m) => m.role === 'ai');
      if (lastAiMessage && isRealtimeActive) {
        setTimeout(() => speakMessage(lastAiMessage.content), 500);
      }

      return true;
    } catch (error) {
      console.error('Error restoring consultation state:', error);
      return false;
    }
  };

  const persistInProgressState = async (nextMessages: Message[], resolvedPatientId: string, nextQuestionCount: number, nextProgress: number) => {
    try {
      await AsyncStorage.setItem(
        CONSULTATION_STATE_KEY,
        JSON.stringify({
          status: 'in_progress',
          patientId: resolvedPatientId,
          messages: nextMessages,
          questionCount: nextQuestionCount,
          progress: nextProgress,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Error saving consultation state:', error);
    }
  };

  const persistCompletedState = async (resolvedPatientId: string, triageData: any, insights: any) => {
    try {
      await AsyncStorage.setItem(
        CONSULTATION_STATE_KEY,
        JSON.stringify({
          status: 'triage_complete',
          patientId: resolvedPatientId,
          triageData,
          insights,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Error saving completed consultation state:', error);
    }
  };

  const fetchInitialGreeting = async (resolvedPatientId: string) => {
    try {
      setIsLoading(true);

      const response = await api.triageChat({
        messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
        patientId: resolvedPatientId,
        biometrics: consultationBiometrics || undefined,
        language: getCurrentLanguage(),
      });

      if (response.data && !response.error) {
        const aiMessage: Message = {
          id: '1',
          role: 'ai',
          content: response.data.message,
          timestamp: new Date(),
        };
        const nextMessages = [aiMessage];
        setMessages(nextMessages);
        await persistInProgressState(nextMessages, resolvedPatientId, 1, 0.1);

        // Speak the initial greeting
      } else {
        const fallbackMessage: Message = {
          id: '1',
          role: 'ai',
          content: "Hello! I'm Nurse Sarah, your AI health assistant. I'm here to help understand your symptoms. What brings you here today?",
          timestamp: new Date(),
        };
        const nextMessages = [fallbackMessage];
        setMessages(nextMessages);
        await persistInProgressState(nextMessages, resolvedPatientId, 1, 0.1);
      }
    } catch (error) {
      console.error('Error fetching initial greeting:', error);
      const fallbackMessage: Message = {
        id: '1',
        role: 'ai',
        content: "Hello! I'm Nurse Sarah, your AI health assistant. I'm here to help understand your symptoms. What brings you here today?",
        timestamp: new Date(),
      };
      setMessages([fallbackMessage]);

    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessageWithText = async (text: string) => {
    if (!text.trim() || !patientId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setTranscript('');
    setIsTyping(true);

    try {
      const response = await api.triageChat({
        messages: [...messages, userMessage],
        patientId,
        biometrics: consultationBiometrics || undefined,
        language: getCurrentLanguage(),
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.data.message,
        timestamp: new Date(),
      };

      const nextQuestionCount = questionCount + 1;
      const nextProgress = Math.min(nextQuestionCount / 10, 1);
      setQuestionCount(nextQuestionCount);
      setProgress(nextProgress);

      const nextMessages = [...messages, userMessage, aiMessage];
      setMessages(nextMessages);
      await persistInProgressState(nextMessages, patientId, nextQuestionCount, nextProgress);


      if (response.data.complete) {
        api.trackEvent('triage_completed', { questionCount: nextQuestionCount });
        await persistCompletedState(patientId, response.data.triageData, response.data.insights);

        // Wait for TTS to finish before navigating to patient-facing AI insights.
        const delay = 2500;
        setTimeout(() => {
          stopCurrentAudio();
          navigation.navigate('InsightsScreen', {
            triageData: response.data.triageData,
            insights: response.data.insights,
            fromTriageComplete: true,
          });
        }, delay);
      }

      if (response.data.emergency) {
        api.trackEvent('emergency_detected');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm sorry, I'm having trouble right now. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = () => {
    sendMessageWithText(inputText);
  };

  const handleVoiceResult = (finalTranscript: string) => {
    if (finalTranscript.trim()) {
      sendMessageWithText(finalTranscript);
    }
  };

  const toggleSpeaker = () => {
    if (isSpeaking) {
      stopCurrentAudio();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden Realtime Voice WebView */}
      <RealtimeVoiceView
        ref={realtimeRef}
        visible={isRealtimeActive}
        patientId={patientId || ''}
        language={getCurrentLanguage()}
        onTranscript={handleRealtimeTranscript}
        onConnected={() => setIsRealtimeConnected(true)}
        onDisconnected={() => {
          setIsRealtimeConnected(false);
          setIsRealtimeActive(false);
        }}
        onUserSpeaking={setIsUserSpeaking}
        onError={handleRealtimeError}
        onEnd={() => {
          setIsRealtimeActive(false);
          setIsRealtimeConnected(false);
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor="#FFFFFF"
            size={24}
            onPress={handleBackPress}
          />
          <View style={styles.headerCenter}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2/3</Text>
            </View>
            <Text style={styles.headerTitle}>{t('triage.title')}</Text>
            <Text style={styles.headerSubtitle}>
              {t('triage.questionOf', { current: questionCount })}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {/* Skip to Doctor button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkipTriage}>
              <Text style={styles.skipButtonText}>{t('triage.skipButton')}</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        <ProgressBar
          progress={progress}
          color="rgba(255, 255, 255, 0.8)"
          style={styles.progressBar}
        />
      </View>

      {/* Medical Disclaimer */}
      <View style={styles.disclaimerBar}>
        <MaterialCommunityIcons name="shield-check" size={14} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.disclaimerBarText}>
          {t('triage.disclaimer')}
        </Text>
      </View>

      {/* Speaking / Realtime indicator */}
      {isRealtimeActive && isRealtimeConnected ? (
        <TouchableOpacity style={styles.realtimeBar} onPress={stopRealtimeSession} activeOpacity={0.7}>
          <MaterialCommunityIcons name="microphone" size={16} color="#FFFFFF" />
          <Text style={styles.realtimeBarText}>
            {isUserSpeaking ? t('triage.listening', { defaultValue: 'Listening...' }) : t('triage.liveConversation', { defaultValue: 'Live voice — tap to end' })}
          </Text>
          <MaterialCommunityIcons name="stop-circle" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : isSpeaking ? (
        <TouchableOpacity style={styles.speakingBar} onPress={toggleSpeaker} activeOpacity={0.7}>
          <MaterialCommunityIcons name="volume-high" size={16} color={theme.colors.primary} />
          <Text style={styles.speakingText}>{t('triage.nurseSpeaking')}</Text>
          <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      ) : null}

      {/* Messages */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{t('triage.analyzing')}</Text>
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSpeakPress={message.role === 'ai' ? () => speakMessage(message.content) : undefined}
              />
            ))
          )}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          )}

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        {/* Input Area — ChatGPT-style */}
        <View style={styles.inputContainer}>
          {isListening ? (
            /* Recording state — show waveform bars + stop button */
            <View style={styles.recordingContainer}>
              <View style={styles.recordingBars}>
                {[...Array(12)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.recordingBar,
                      {
                        height: 8 + Math.random() * 24,
                        opacity: glowAnim.interpolate({
                          inputRange: [0, 0.3, 1],
                          outputRange: [0.4, 0.7, 1],
                        }),
                      },
                    ]}
                  />
                ))}
              </View>
              {transcript ? (
                <Text style={styles.recordingTranscript} numberOfLines={1}>{transcript}</Text>
              ) : (
                <Text style={styles.recordingHint}>{t('triage.listening', { defaultValue: 'Listening...' })}</Text>
              )}
              <TouchableOpacity
                style={styles.stopRecordingButton}
                onPress={() => {
                  stopListening();
                  if (transcript.trim()) {
                    setIsTranscribing(true);
                    setTimeout(() => {
                      handleVoiceResult(transcript);
                      setIsTranscribing(false);
                      setTranscript('');
                    }, 500);
                  }
                }}
              >
                <MaterialCommunityIcons name="stop" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : isTranscribing ? (
            /* Transcribing state */
            <View style={styles.transcribingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.transcribingText}>{t('triage.transcribing', { defaultValue: 'Transcribing...' })}</Text>
            </View>
          ) : (
            /* Default text input with mic + realtime buttons */
            <Surface style={[styles.inputSurface, shadows.medium]}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={t('triage.inputPlaceholder')}
                multiline
                maxLength={500}
                style={styles.textInput}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                onSubmitEditing={sendMessage}
                disabled={isTyping}
              />
              {inputText.trim() ? (
                /* Send button when there's text */
                <IconButton
                  icon="send"
                  size={24}
                  iconColor={theme.colors.primary}
                  onPress={sendMessage}
                  disabled={isTyping}
                  style={styles.sendButton}
                />
              ) : (
                /* Mic + Realtime buttons when no text */
                <View style={styles.inputActions}>
                  {/* Microphone transcription button */}
                  <IconButton
                    icon="microphone-outline"
                    size={22}
                    iconColor={theme.colors.onSurfaceVariant}
                    onPress={startListening}
                    disabled={isTyping || isRealtimeActive}
                    style={styles.micInputButton}
                  />
                  {/* Realtime voice conversation button */}
                  <TouchableOpacity
                    style={[
                      styles.realtimeButton,
                      isRealtimeActive && styles.realtimeButtonActive,
                    ]}
                    onPress={() => {
                      if (isRealtimeActive) {
                        stopRealtimeSession();
                      } else {
                        startRealtimeSession();
                      }
                    }}
                    disabled={isTyping}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={isRealtimeActive ? 'stop' : 'waveform'}
                      size={18}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </Surface>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  message,
  onSpeakPress,
}: {
  message: Message;
  onSpeakPress?: () => void;
}) {
  const isAI = message.role === 'ai';

  return (
    <View style={[styles.messageBubble, isAI ? styles.aiMessage : styles.userMessage]}>
      {isAI && (
        <View style={styles.aiIcon}>
          <MaterialCommunityIcons name="account-heart" size={20} color={theme.colors.primary} />
        </View>
      )}
      <Surface style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble, shadows.small]}>
        <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
          {message.content}
        </Text>
        <View style={styles.bubbleFooter}>
          <Text style={[styles.timestamp, isAI ? styles.aiTimestamp : styles.userTimestamp]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isAI && onSpeakPress && (
            <TouchableOpacity onPress={onSpeakPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="volume-high" size={14} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.xs,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs / 2,
  },
  headerActions: {
    alignItems: 'center',
    gap: 2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  disclaimerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  disclaimerBarText: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  speakingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: `${theme.colors.primary}10`,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.primary}20`,
  },
  speakingText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
  },
  realtimeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: theme.colors.primary,
  },
  realtimeBarText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  messageBubble: {
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: theme.roundness * 1.5,
    flex: 1,
  },
  aiBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: spacing.xs,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: spacing.xs,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  aiText: {
    color: theme.colors.onSurface,
  },
  userText: {
    color: '#FFFFFF',
  },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
  },
  aiTimestamp: {
    color: theme.colors.onSurfaceVariant,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingIndicator: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.md,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.onSurfaceVariant,
  },
  inputContainer: {
    padding: spacing.lg,
    backgroundColor: theme.colors.background,
  },
  inputSurface: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: theme.roundness * 2,
    backgroundColor: theme.colors.surface,
    paddingLeft: spacing.md,
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  sendButton: {
    margin: 0,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  micInputButton: {
    margin: 0,
  },
  realtimeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  realtimeButtonActive: {
    backgroundColor: theme.colors.error,
  },
  // Recording state styles
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.medium,
  },
  recordingBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    height: 32,
  },
  recordingBar: {
    width: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  recordingTranscript: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    fontStyle: 'italic',
  },
  recordingHint: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  stopRecordingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Transcribing state
  transcribingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 2,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.medium,
  },
  transcribingText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
});
