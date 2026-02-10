import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { Text, IconButton, Surface, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

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
  const { roomName, patientId, patientName, insights, biometrics, triageTranscript } = route.params;

  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showBiometrics, setShowBiometrics] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showAskAI, setShowAskAI] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const callStartTime = useRef<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const notesRef = useRef(doctorNotes);

  // Keep ref in sync with state
  useEffect(() => {
    notesRef.current = doctorNotes;
  }, [doctorNotes]);

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

      // TODO: Initialize Daily.co call with token
      // const { token, roomUrl } = response.data;
      // await dailyCall.join({ url: roomUrl, token });

      // Simulate successful connection
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        startCallTimer();
      }, 1500);

      console.log('Doctor joined video call:', roomName);
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
    callStartTime.current = Date.now();
    timerInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);

  const endCall = async () => {
    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
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
              await api.endVideoCall(roomName);
              if (timerInterval.current) clearInterval(timerInterval.current);
              if (autoSaveInterval.current) clearInterval(autoSaveInterval.current);
              navigation.popToTop();
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
        {/* Remote Video (Patient) */}
        <View style={styles.remoteVideoContainer}>
          <LinearGradient
            colors={['#2c3e50', '#34495e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.placeholderVideoContent}>
            <MaterialCommunityIcons name="account" size={100} color="rgba(255,255,255,0.5)" />
            <Text style={styles.placeholderText}>{patientName || 'Patient'}</Text>
          </View>
        </View>

        {/* Local Video (Doctor) - PiP */}
        <Surface style={[styles.localVideoContainer, shadows.large]}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.localVideoContent}>
            <MaterialCommunityIcons name="doctor" size={36} color="rgba(255,255,255,0.9)" />
            <Text style={styles.localVideoText}>You</Text>
          </View>
        </Surface>

        {/* Call Info */}
        <View style={styles.callInfoOverlay}>
          <Surface style={[styles.callInfoBadge, shadows.medium]}>
            <MaterialCommunityIcons name="circle" size={8} color="#4CAF50" />
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          </Surface>
        </View>

        {/* Panel Toggle Buttons */}
        <View style={styles.panelToggles}>
          <IconButton
            icon="chat-processing"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showTranscript && styles.insightsButtonActive]}
            onPress={() => { setShowTranscript(!showTranscript); if (!showTranscript) { setShowNotes(false); setShowBiometrics(false); setShowNotesPanel(false); setShowAskAI(false); } }}
          />
          <IconButton
            icon="heart-pulse"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showBiometrics && styles.insightsButtonActive]}
            onPress={() => { setShowBiometrics(!showBiometrics); if (!showBiometrics) { setShowNotes(false); setShowTranscript(false); setShowNotesPanel(false); setShowAskAI(false); } }}
          />
          <IconButton
            icon="brain"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showNotes && styles.insightsButtonActive]}
            onPress={() => { setShowNotes(!showNotes); if (!showNotes) { setShowBiometrics(false); setShowTranscript(false); setShowNotesPanel(false); setShowAskAI(false); } }}
          />
          <IconButton
            icon="note-edit"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showNotesPanel && styles.insightsButtonActive]}
            onPress={() => { setShowNotesPanel(!showNotesPanel); if (!showNotesPanel) { setShowNotes(false); setShowBiometrics(false); setShowTranscript(false); setShowAskAI(false); } }}
          />
          <IconButton
            icon="robot"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showAskAI && styles.insightsButtonActive]}
            onPress={() => { setShowAskAI(!showAskAI); if (!showAskAI) { setShowNotes(false); setShowBiometrics(false); setShowTranscript(false); setShowNotesPanel(false); } }}
          />
        </View>
      </View>

      {/* Chat Transcript Panel (Slide up) */}
      {showTranscript && (
        <View style={styles.insightsPanel}>
          <ScrollView style={styles.insightsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.insightsPanelHeader}>
              <MaterialCommunityIcons name="chat-processing" size={20} color={theme.colors.secondary} />
              <Text style={styles.insightsPanelTitle}>Triage Transcript</Text>
              <IconButton
                icon="close"
                size={18}
                onPress={() => setShowTranscript(false)}
                style={styles.closeInsights}
              />
            </View>

            {!triageTranscript?.messages || triageTranscript.messages.length === 0 ? (
              <Text style={styles.insightText}>No triage transcript available for this patient.</Text>
            ) : (
              triageTranscript.messages.map((msg: any, index: number) => (
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
                      {msg.role === 'ai' ? 'AI Triage' : 'Patient'}
                    </Text>
                  </View>
                  <Text style={styles.transcriptMessage}>{msg.content}</Text>
                </View>
              ))
            )}

            {triageTranscript?.completedAt && (
              <Text style={styles.transcriptTimestamp}>
                Completed: {new Date(triageTranscript.completedAt).toLocaleString()}
              </Text>
            )}
          </ScrollView>
        </View>
      )}

      {/* Biometrics Panel (Slide up) */}
      {showBiometrics && (
        <View style={styles.insightsPanel}>
          <ScrollView style={styles.insightsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.insightsPanelHeader}>
              <MaterialCommunityIcons name="heart-pulse" size={20} color={theme.colors.error} />
              <Text style={styles.insightsPanelTitle}>Patient Vitals</Text>
              <IconButton
                icon="close"
                size={18}
                onPress={() => setShowBiometrics(false)}
                style={styles.closeInsights}
              />
            </View>

            {!biometrics ? (
              <Text style={styles.insightText}>No biometric data available for this patient.</Text>
            ) : (
              <View>
                {/* Blood Pressure */}
                {biometrics.bloodPressureSystolic && biometrics.bloodPressureDiastolic && (
                  <BiometricRow
                    icon="blood-bag"
                    label="Blood Pressure"
                    value={`${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic} mmHg`}
                    status={checkBiometricStatus('bloodPressureSystolic', biometrics.bloodPressureSystolic)}
                  />
                )}

                {/* Heart Rate */}
                {biometrics.heartRate && (
                  <BiometricRow
                    icon="heart-pulse"
                    label="Heart Rate"
                    value={`${biometrics.heartRate} bpm`}
                    status={checkBiometricStatus('heartRate', biometrics.heartRate)}
                  />
                )}

                {/* Temperature */}
                {biometrics.temperature && (
                  <BiometricRow
                    icon="thermometer"
                    label="Temperature"
                    value={`${biometrics.temperature}${biometrics.temperatureUnit === 'C' ? '°C' : '°F'}`}
                    status={checkBiometricStatus('temperature', biometrics.temperature, biometrics)}
                  />
                )}

                {/* Blood Oxygen */}
                {biometrics.bloodOxygen && (
                  <BiometricRow
                    icon="lungs"
                    label="SpO2"
                    value={`${biometrics.bloodOxygen}%`}
                    status={checkBiometricStatus('bloodOxygen', biometrics.bloodOxygen)}
                  />
                )}

                {/* Respiratory Rate */}
                {biometrics.respiratoryRate && (
                  <BiometricRow
                    icon="weather-windy"
                    label="Respiratory Rate"
                    value={`${biometrics.respiratoryRate} breaths/min`}
                    status={checkBiometricStatus('respiratoryRate', biometrics.respiratoryRate)}
                  />
                )}

                {/* Blood Sugar */}
                {biometrics.bloodSugar && (
                  <BiometricRow
                    icon="water"
                    label="Blood Sugar"
                    value={`${biometrics.bloodSugar} mg/dL${biometrics.bloodSugarContext ? ` (${biometrics.bloodSugarContext})` : ''}`}
                    status={checkBiometricStatus('bloodSugar', biometrics.bloodSugar)}
                  />
                )}

                {/* Pain Level */}
                {biometrics.painLevel && (
                  <BiometricRow
                    icon="alert-circle"
                    label="Pain Level"
                    value={`${biometrics.painLevel}/10`}
                    status={checkBiometricStatus('painLevel', biometrics.painLevel)}
                  />
                )}

                {/* Weight & Height */}
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

                {/* Notes */}
                {biometrics.notes && (
                  <View style={styles.bioNotesContainer}>
                    <Text style={styles.insightLabel}>Patient Notes</Text>
                    <Text style={styles.insightText}>{biometrics.notes}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* AI Insights Panel (Slide up) */}
      {showNotes && !insights && (
        <View style={styles.insightsPanel}>
          <View style={[styles.insightsScroll, { padding: spacing.lg }]}>
            <View style={styles.insightsPanelHeader}>
              <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
              <Text style={styles.insightsPanelTitle}>AI Insights</Text>
              <IconButton
                icon="close"
                size={18}
                onPress={() => setShowNotes(false)}
                style={styles.closeInsights}
              />
            </View>
            <Text style={styles.insightText}>No AI insights available for this patient. Triage may not have been completed.</Text>
          </View>
        </View>
      )}
      {showNotes && insights && (
        <View style={styles.insightsPanel}>
          <ScrollView style={styles.insightsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.insightsPanelHeader}>
              <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
              <Text style={styles.insightsPanelTitle}>AI Insights</Text>
              <IconButton
                icon="close"
                size={18}
                onPress={() => setShowNotes(false)}
                style={styles.closeInsights}
              />
            </View>

            {insights.summary && (
              <View style={styles.insightSection}>
                <Text style={styles.insightLabel}>Summary</Text>
                <Text style={styles.insightText}>{insights.summary}</Text>
              </View>
            )}

            {insights.keyFindings && insights.keyFindings.length > 0 && (
              <View style={styles.insightSection}>
                <Text style={styles.insightLabel}>Key Findings</Text>
                {insights.keyFindings.map((finding: string, index: number) => (
                  <View key={index} style={styles.findingRow}>
                    <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.primary} />
                    <Text style={styles.findingText}>{finding}</Text>
                  </View>
                ))}
              </View>
            )}

            {insights.possibleConditions && insights.possibleConditions.length > 0 && (
              <View style={styles.insightSection}>
                <Text style={styles.insightLabel}>Possible Conditions</Text>
                {insights.possibleConditions.map((condition: any, index: number) => (
                  <View key={index} style={styles.conditionRow}>
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
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Doctor Notes Panel */}
      {showNotesPanel && (
        <View style={styles.notesPanel}>
          <View style={styles.insightsPanelHeader}>
            <MaterialCommunityIcons name="note-edit" size={20} color={theme.colors.primary} />
            <Text style={styles.insightsPanelTitle}>Consultation Notes</Text>
            {notesSaved && (
              <View style={styles.savedBadge}>
                <MaterialCommunityIcons name="check" size={12} color={theme.colors.success} />
                <Text style={styles.savedText}>Saved</Text>
              </View>
            )}
            <IconButton
              icon="content-save"
              size={18}
              onPress={() => saveNotes(doctorNotes)}
              style={styles.closeInsights}
            />
            <IconButton
              icon="close"
              size={18}
              onPress={() => setShowNotesPanel(false)}
              style={styles.closeInsights}
            />
          </View>
          <TextInput
            style={styles.notesInput}
            multiline
            placeholder="Type your consultation notes here..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={doctorNotes}
            onChangeText={setDoctorNotes}
            textAlignVertical="top"
          />
          <Text style={styles.autoSaveHint}>Auto-saves every 30 seconds</Text>
        </View>
      )}

      {/* Ask AI Panel */}
      {showAskAI && (
        <View style={styles.notesPanel}>
          <View style={styles.insightsPanelHeader}>
            <MaterialCommunityIcons name="robot" size={20} color={theme.colors.secondary} />
            <Text style={styles.insightsPanelTitle}>Ask AI</Text>
            <IconButton
              icon="close"
              size={18}
              onPress={() => setShowAskAI(false)}
              style={styles.closeInsights}
            />
          </View>
          <View style={styles.askAiInputRow}>
            <TextInput
              style={styles.askAiInput}
              placeholder="Ask about conditions, treatments, guidelines..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={aiQuestion}
              onChangeText={setAiQuestion}
              onSubmitEditing={handleAskAI}
              returnKeyType="send"
            />
            <IconButton
              icon="send"
              size={22}
              iconColor="#FFFFFF"
              style={styles.askAiSend}
              onPress={handleAskAI}
              disabled={aiLoading || !aiQuestion.trim()}
            />
          </View>
          {aiLoading && (
            <Text style={styles.askAiLoading}>Thinking...</Text>
          )}
          {aiAnswer ? (
            <ScrollView style={styles.askAiAnswer} showsVerticalScrollIndicator={false}>
              <Text style={styles.insightText}>{aiAnswer}</Text>
            </ScrollView>
          ) : null}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <Surface style={[styles.controlsPanel, shadows.large]}>
          <View style={styles.controlButton}>
            <IconButton
              icon={isMuted ? 'microphone-off' : 'microphone'}
              size={28}
              iconColor="#FFFFFF"
              style={[styles.iconButton, isMuted ? styles.iconButtonMuted : styles.iconButtonActive]}
              onPress={toggleMute}
            />
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
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
              icon={isVideoOff ? 'video-off' : 'video'}
              size={28}
              iconColor="#FFFFFF"
              style={[styles.iconButton, isVideoOff ? styles.iconButtonMuted : styles.iconButtonActive]}
              onPress={toggleVideo}
            />
            <Text style={styles.controlLabel}>{isVideoOff ? 'Turn On' : 'Turn Off'}</Text>
          </View>
        </Surface>
      </View>
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
  },
  insightsButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  insightsButtonActive: {
    backgroundColor: theme.colors.primary,
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
  controlsContainer: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  controlsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: theme.roundness * 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
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
  notesInput: {
    flex: 1,
    minHeight: 150,
    maxHeight: 180,
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    padding: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: theme.roundness,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
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
});
