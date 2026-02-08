import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text, IconButton, Surface, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

// Note: Daily.co video will be integrated here
// For now, we'll create the UI structure

export default function VideoCallScreen({ route, navigation }: any) {
  const { roomName, patientId } = route.params;

  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const callStartTime = useRef<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    joinCall();

    return () => {
      // Cleanup on unmount
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const joinCall = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get token to join the room
      const response = await api.joinVideoRoom(
        roomName,
        patientId,
        'Patient',
        'patient'
      );

      if (response.error) {
        throw new Error(response.error);
      }

      // TODO: Initialize Daily.co call with token
      // const { token, roomUrl } = response.data;
      // await dailyCall.join({ url: roomUrl, token });

      // Simulate successful connection for now
      setTimeout(() => {
        setIsConnecting(false);
        setIsConnected(true);
        startCallTimer();
      }, 2000);

      console.log('✅ Joined video call:', roomName);
    } catch (error: any) {
      console.error('Failed to join call:', error);
      setError(error.message || 'Failed to join video call');
      setIsConnecting(false);

      Alert.alert(
        'Connection Failed',
        'Unable to connect to the video call. Please try again.',
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute toggle with Daily.co
    // dailyCall.setLocalAudio(!isMuted);
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // TODO: Implement actual video toggle with Daily.co
    // dailyCall.setLocalVideo(isVideoOff);
  };

  const endCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Leave Daily.co call
              // await dailyCall.leave();

              // Notify backend
              await api.endVideoCall(roomName);

              // Stop timer
              if (timerInterval.current) {
                clearInterval(timerInterval.current);
              }

              // Navigate back
              navigation.navigate('PatientHome');
            } catch (error: any) {
              console.error('Error ending call:', error);
              navigation.navigate('PatientHome');
            }
          },
        },
      ]
    );
  };

  if (isConnecting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Connecting to doctor...</Text>
          <Text style={styles.loadingSubtext}>Please wait</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={() => navigation.goBack()} style={styles.errorButton}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Video Container */}
      <View style={styles.videoContainer}>
        {/* Remote Video (Doctor) */}
        <View style={styles.remoteVideoContainer}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.placeholderVideoContent}>
            <MaterialCommunityIcons name="account" size={100} color="rgba(255,255,255,0.5)" />
            <Text style={styles.placeholderText}>Waiting for doctor...</Text>
          </View>
        </View>

        {/* Local Video (Self) - Picture in Picture */}
        <Surface style={[styles.localVideoContainer, shadows.large]}>
          <LinearGradient
            colors={['#34495e', '#2c3e50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.localVideoContent}>
            <MaterialCommunityIcons name="account" size={40} color="rgba(255,255,255,0.7)" />
            <Text style={styles.localVideoText}>You</Text>
          </View>
        </Surface>

        {/* Call Info Overlay */}
        <View style={styles.callInfoOverlay}>
          <Surface style={[styles.callInfoBadge, shadows.medium]}>
            <MaterialCommunityIcons name="circle" size={8} color="#4CAF50" />
            <Text style={styles.callDuration}>{formatDuration(callDuration)}</Text>
          </Surface>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <Surface style={[styles.controlsPanel, shadows.large]}>
          {/* Mute Button */}
          <View style={styles.controlButton}>
            <IconButton
              icon={isMuted ? 'microphone-off' : 'microphone'}
              size={28}
              iconColor="#FFFFFF"
              style={[
                styles.iconButton,
                isMuted ? styles.iconButtonMuted : styles.iconButtonActive,
              ]}
              onPress={toggleMute}
            />
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </View>

          {/* End Call Button */}
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

          {/* Video Button */}
          <View style={styles.controlButton}>
            <IconButton
              icon={isVideoOff ? 'video-off' : 'video'}
              size={28}
              iconColor="#FFFFFF"
              style={[
                styles.iconButton,
                isVideoOff ? styles.iconButtonMuted : styles.iconButtonActive,
              ]}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  loadingSubtext: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.lg,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: spacing.xl,
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
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
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
