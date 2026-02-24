import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

export default function WaitingRoomScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const { triageData, insights, roomName: existingRoomName } = route.params || {};

  const [waitTime, setWaitTime] = useState(0);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [status, setStatus] = useState<'creating' | 'waiting' | 'doctor_joined' | 'error'>('creating');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeRoom();
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

  const initializeRoom = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setStatus('error');
        return;
      }
      setPatientId(userId);

      if (existingRoomName) {
        setRoomName(existingRoomName);
        setStatus('waiting');
        return;
      }

      await createRoom(userId);
    } catch (error) {
      console.error('Initialize room error:', error);
      setStatus('error');
    }
  };

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

  const createRoom = async (resolvedPatientId: string) => {
    try {
      const userName = await AsyncStorage.getItem('userName');
      const response = await api.createVideoRoom(resolvedPatientId, undefined, userName || undefined);

      if (response.error) {
        throw new Error(response.error);
      }

      setRoomName(response.data.roomName);
      setStatus('waiting');
      console.log('Created/reused room:', response.data.roomName, response.data.message || '');
    } catch (error: any) {
      console.error('Failed to create room:', error);
      setStatus('error');
    }
  };

  const joinCall = async () => {
    if (roomName && patientId) {
      // Clear saved insights since consultation is now active
      await AsyncStorage.removeItem('savedInsights').catch(() => {});
      navigation.navigate('VideoCall', {
        roomName,
        patientId,
      });
    }
  };

  const reviewInsights = () => {
    navigation.navigate('InsightsScreen', {
      insights,
      triageData,
      fromWaitingRoom: true,
      roomName,
    });
  };

  const cancelWaiting = () => {
    // Don't end the video call — keep the room alive so the patient
    // can resume from the home screen "Continue Consultation" button.
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
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>3/3</Text>
          </View>
          <Text style={styles.title}>{t('waitingRoom.title')}</Text>
          <Text style={styles.subtitle}>
            {t('waitingRoom.subtitle')}
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
            {status === 'creating' && t('waitingRoom.settingUp')}
            {status === 'waiting' && t('waitingRoom.waitingForDoctor')}
            {status === 'doctor_joined' && t('waitingRoom.doctorReady')}
            {status === 'error' && t('waitingRoom.somethingWrong')}
          </Text>

          <Surface style={[styles.timerBadge, shadows.medium]}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.timerText}>{t('waitingRoom.waitTime')}: {formatWaitTime(waitTime)}</Text>
          </Surface>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          {insights && (
            <Surface style={[styles.infoCard, shadows.medium]}>
              <View style={styles.infoCardHeader}>
                <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
                <Text style={styles.infoCardTitle}>{t('waitingRoom.aiInsightsReady')}</Text>
              </View>
              <Text style={styles.infoCardText}>
                {t('waitingRoom.insightsDescription')}
              </Text>
              <Button
                mode="text"
                icon="file-document-outline"
                onPress={reviewInsights}
                style={styles.reviewInsightsButton}
              >
                Review AI Insights
              </Button>
            </Surface>
          )}

          <Surface style={[styles.infoCard, shadows.medium]}>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons name="shield-check" size={20} color={theme.colors.success} />
              <Text style={styles.infoCardTitle}>{t('waitingRoom.secureConnection')}</Text>
            </View>
            <Text style={styles.infoCardText}>
              {t('waitingRoom.secureDescription')}
            </Text>
          </Surface>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          {status === 'doctor_joined' && (
            <Button
              mode="contained"
              onPress={joinCall}
              style={styles.joinButton}
              labelStyle={styles.joinButtonLabel}
              icon="video"
            >
              {t('waitingRoom.joinVideoCall')}
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={cancelWaiting}
            style={styles.cancelButton}
            labelStyle={styles.cancelButtonLabel}
            icon="close"
          >
            {t('waitingRoom.leaveWaitingRoom')}
          </Button>
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
  stepBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  reviewInsightsButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginLeft: -6,
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
