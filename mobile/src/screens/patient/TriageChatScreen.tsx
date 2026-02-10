import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Text, TextInput, IconButton, Surface, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

const CONSULTATION_STATE_KEY = 'consultationState';

interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

export default function TriageChatScreen({ navigation }: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0.1);
  const [questionCount, setQuestionCount] = useState(1);
  const [patientId, setPatientId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Resolve user ID before starting triage
  useEffect(() => {
    initializeTriage();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const restored = await restoreConsultationState(storedUserId);
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

      // Send initial message to trigger biometric analysis
      const response = await api.triageChat({
        messages: [{ role: 'user', content: '__INITIAL_GREETING__' }],
        patientId: resolvedPatientId,
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
      } else {
        // Fallback to default greeting if API fails
        const fallbackMessage: Message = {
          id: '1',
          role: 'ai',
          content: "Hello! I'm here to help understand your symptoms. Let's start with a simple question: What brings you here today?",
          timestamp: new Date(),
        };
        const nextMessages = [fallbackMessage];
        setMessages(nextMessages);
        await persistInProgressState(nextMessages, resolvedPatientId, 1, 0.1);
      }
    } catch (error) {
      console.error('Error fetching initial greeting:', error);
      // Fallback to default greeting
      const fallbackMessage: Message = {
        id: '1',
        role: 'ai',
        content: "Hello! I'm here to help understand your symptoms. Let's start with a simple question: What brings you here today?",
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

  const sendMessage = async () => {
    if (!inputText.trim() || !patientId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Call backend API for next triage question
      const response = await api.triageChat({
        messages: [...messages, userMessage],
        patientId,
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

      // Update progress
      const nextQuestionCount = questionCount + 1;
      const nextProgress = Math.min(nextQuestionCount / 10, 1); // Assume 10 questions max
      setQuestionCount(nextQuestionCount);
      setProgress(nextProgress);

      // Always show the AI message
      const nextMessages = [...messages, userMessage, aiMessage];
      setMessages(nextMessages);
      await persistInProgressState(nextMessages, patientId, nextQuestionCount, nextProgress);

      // Check if triage is complete
      if (response.data.complete) {
        api.trackEvent('triage_completed', { questionCount: nextQuestionCount });
        await persistCompletedState(patientId, response.data.triageData, response.data.insights);
        // Show the final message, then navigate to insights after a delay
        setTimeout(() => {
          navigation.navigate('InsightsScreen', {
            triageData: response.data.triageData,
            insights: response.data.insights,
          });
        }, 2500);
      }

      // Track emergency detection
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

  return (
    <SafeAreaView style={styles.container}>
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
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.headerSubtitle}>Question {questionCount} of ~10</Text>
          </View>
          <View style={{ width: 40 }} />
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
          Not a diagnosis. Your doctor will review this information.
        </Text>
      </View>

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
              <Text style={styles.loadingText}>Analyzing your health data...</Text>
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {isTyping && (
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { animationDelay: '0ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '200ms' }]} />
                <View style={[styles.typingDot, { animationDelay: '400ms' }]} />
              </View>
            </View>
          )}

          <View style={{ height: spacing.xl }} />
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Surface style={[styles.inputSurface, shadows.medium]}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your answer..."
              multiline
              maxLength={500}
              style={styles.textInput}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              onSubmitEditing={sendMessage}
            />
            <IconButton
              icon="send"
              size={24}
              iconColor={inputText.trim() ? theme.colors.primary : theme.colors.onSurfaceVariant}
              onPress={sendMessage}
              disabled={!inputText.trim() || isTyping}
              style={styles.sendButton}
            />
          </Surface>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isAI = message.role === 'ai';

  return (
    <View style={[styles.messageBubble, isAI ? styles.aiMessage : styles.userMessage]}>
      {isAI && (
        <View style={styles.aiIcon}>
          <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} />
        </View>
      )}
      <Surface style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble, shadows.small]}>
        <Text style={[styles.messageText, isAI ? styles.aiText : styles.userText]}>
          {message.content}
        </Text>
        <Text style={[styles.timestamp, isAI ? styles.aiTimestamp : styles.userTimestamp]}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
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
});
