import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, IconButton, Surface, Button, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

export default function DoctorVideoCallScreen({ route, navigation }: any) {
  const { roomName, patientId, patientName, insights } = route.params;

  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const callStartTime = useRef<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    joinCall();

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const joinCall = async () => {
    try {
      setIsConnecting(true);

      // Get token to join the room as doctor
      const response = await api.joinVideoRoom(
        roomName,
        'doctor-1', // TODO: Replace with actual doctor ID
        'Dr. Martinez',
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
              await api.endVideoCall(roomName);
              if (timerInterval.current) clearInterval(timerInterval.current);
              navigation.navigate('Dashboard');
            } catch (error) {
              console.error('Error ending call:', error);
              navigation.navigate('Dashboard');
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

        {/* AI Insights Toggle */}
        <View style={styles.insightsToggle}>
          <IconButton
            icon="brain"
            size={24}
            iconColor="#FFFFFF"
            style={[styles.insightsButton, showNotes && styles.insightsButtonActive]}
            onPress={() => setShowNotes(!showNotes)}
          />
        </View>
      </View>

      {/* AI Insights Panel (Slide up) */}
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
  insightsToggle: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
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
});
