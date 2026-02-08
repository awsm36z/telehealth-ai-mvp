import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

export default function WaitingRoomScreen({ route, navigation }: any) {
  const { triageData, insights } = route.params || {};

  const [waitTime, setWaitTime] = useState(0);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [status, setStatus] = useState<'creating' | 'waiting' | 'doctor_joined' | 'error'>('creating');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    createRoom();
    startPulseAnimation();
  }, []);

  // Update wait time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setWaitTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Poll for doctor joining
  useEffect(() => {
    if (!roomName) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await api.getActiveCalls();
        if (response.data) {
          const call = response.data.find((c: any) => c.roomName === roomName);
          if (call && call.status === 'active') {
            setStatus('doctor_joined');
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [roomName]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const createRoom = async () => {
    try {
      // TODO: Replace '1' with actual authenticated patient ID
      const response = await api.createVideoRoom('1');

      if (response.error) {
        throw new Error(response.error);
      }

      setRoomName(response.data.roomName);
      setStatus('waiting');
      console.log('Created room:', response.data.roomName);
    } catch (error: any) {
      console.error('Failed to create room:', error);
      setStatus('error');
    }
  };

  const joinCall = () => {
    if (roomName) {
      navigation.navigate('VideoCall', {
        roomName,
        patientId: '1', // TODO: Replace with actual patient ID
      });
    }
  };

  const cancelWaiting = () => {
    if (roomName) {
      api.endVideoCall(roomName);
    }
    navigation.navigate('PatientHome');
  };

  const formatWaitTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Top Section */}
        <View style={styles.topSection}>
          <Text style={styles.title}>Waiting Room</Text>
          <Text style={styles.subtitle}>
            Your triage is complete. A doctor will be with you shortly.
          </Text>
        </View>

        {/* Center Animation */}
        <View style={styles.centerSection}>
          <Animated.View style={[styles.pulseCircleOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.pulseCircleInner}>
              <MaterialCommunityIcons
                name={status === 'doctor_joined' ? 'check-circle' : 'doctor'}
                size={64}
                color="#FFFFFF"
              />
            </View>
          </Animated.View>

          <Text style={styles.statusText}>
            {status === 'creating' && 'Setting up your consultation...'}
            {status === 'waiting' && 'Waiting for a doctor...'}
            {status === 'doctor_joined' && 'Doctor is ready!'}
            {status === 'error' && 'Something went wrong'}
          </Text>

          <Surface style={[styles.timerBadge, shadows.medium]}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.timerText}>Wait time: {formatWaitTime(waitTime)}</Text>
          </Surface>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          {insights && (
            <Surface style={[styles.infoCard, shadows.medium]}>
              <View style={styles.infoCardHeader}>
                <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
                <Text style={styles.infoCardTitle}>AI Insights Ready</Text>
              </View>
              <Text style={styles.infoCardText}>
                Your symptoms have been analyzed. The doctor will review your AI-generated health insights before the consultation.
              </Text>
            </Surface>
          )}

          <Surface style={[styles.infoCard, shadows.medium]}>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.success} />
              <Text style={styles.infoCardTitle}>Secure Connection</Text>
            </View>
            <Text style={styles.infoCardText}>
              Your video consultation is end-to-end encrypted and HIPAA compliant.
            </Text>
          </Surface>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          {status === 'doctor_joined' ? (
            <Button
              mode="contained"
              onPress={joinCall}
              style={styles.joinButton}
              labelStyle={styles.joinButtonLabel}
              icon="video"
            >
              Join Video Call
            </Button>
          ) : (
            <Button
              mode="outlined"
              onPress={cancelWaiting}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
              icon="close"
            >
              Leave Waiting Room
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  topSection: {
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircleOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  pulseCircleInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: spacing.lg,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: theme.roundness * 3,
    backgroundColor: '#FFFFFF',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  infoSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoCard: {
    padding: spacing.lg,
    borderRadius: theme.roundness * 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  infoCardText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  bottomSection: {
    paddingBottom: spacing.xl,
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: spacing.sm,
    borderRadius: theme.roundness * 2,
  },
  joinButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: spacing.sm,
    borderRadius: theme.roundness * 2,
  },
  cancelButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
