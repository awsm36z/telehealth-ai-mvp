import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, Avatar, Surface, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing, shadows } from '../../theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../utils/api';

const { width } = Dimensions.get('window');
const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;

export default function PatientHomeScreen() {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('Patient');
  const [biometrics, setBiometrics] = useState<any>(null);
  const [recentCompletedTriage, setRecentCompletedTriage] = useState<any>(null);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);
  const [recentConsultations, setRecentConsultations] = useState<any[]>([]);

  useEffect(() => {
    loadUserName();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBiometrics();
      refreshConsultationResumeState();
      loadRecentConsultations();
    }, [])
  );

  const loadRecentConsultations = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const response = await api.getConsultationHistory(userId);
      if (response.data && Array.isArray(response.data)) {
        setRecentConsultations(response.data.slice(-3).reverse());
      }
    } catch (error) {
      console.error('Error loading consultations:', error);
    }
  };

  const isWithinLast7Days = (completedAt: string): boolean => {
    const completedDate = new Date(completedAt);
    if (Number.isNaN(completedDate.getTime())) return false;

    const now = Date.now();
    const completedTime = completedDate.getTime();
    return completedTime <= now && now - completedTime <= SEVEN_DAYS_IN_MS;
  };

  const refreshConsultationResumeState = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setRecentCompletedTriage(null);
        setActiveConsultation(null);
        return;
      }

      const [patientResponse, callsResponse] = await Promise.all([
        api.getPatient(userId),
        api.getActiveCalls(),
      ]);

      const triageData = patientResponse.data?.triageData;
      const insights = patientResponse.data?.insights;
      const completedAt = triageData?.completedAt;
      const existingCall = callsResponse.data?.find(
        (call: any) =>
          String(call.patientId) === String(userId) &&
          (call.status === 'waiting' || call.status === 'active')
      );

      if (triageData && insights && completedAt && isWithinLast7Days(completedAt)) {
        setRecentCompletedTriage({ triageData, insights });
      } else {
        setRecentCompletedTriage(null);
      }

      if (existingCall?.roomName) {
        setActiveConsultation({
          roomName: existingCall.roomName,
          status: existingCall.status,
          triageData: triageData || null,
          insights: insights || null,
        });
      } else {
        setActiveConsultation(null);
      }
    } catch (error) {
      console.error('Error checking consultation resume state:', error);
      setRecentCompletedTriage(null);
      setActiveConsultation(null);
    }
  };

  const handleRejoinConsultation = async () => {
    if (!activeConsultation?.roomName) return;

    const userId = await AsyncStorage.getItem('userId');
    if (activeConsultation.status === 'active' && userId) {
      (navigation as any).navigate('VideoCall', {
        roomName: activeConsultation.roomName,
        patientId: userId,
      });
      return;
    }

    (navigation as any).navigate('WaitingRoom', {
      triageData: activeConsultation.triageData || recentCompletedTriage?.triageData,
      insights: activeConsultation.insights || recentCompletedTriage?.insights,
      roomName: activeConsultation.roomName,
    });
  };

  const startConsultationFlow = () => {
    if (activeConsultation?.roomName) {
      handleRejoinConsultation();
      return;
    }

    (navigation as any).navigate('BiometricEntry', {
      mode: 'consultation_start',
      nextScreen: 'TriageFlow',
    });
  };

  const loadUserName = async () => {
    try {
      const nameFromStorage = await AsyncStorage.getItem('userName');
      if (nameFromStorage?.trim()) {
        const firstName = nameFromStorage.trim().split(/\s+/)[0];
        setUserName(firstName || 'Patient');
        return;
      }

      // Backward-compatible fallback for users created before userName was persisted
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const patientResponse = await api.getPatient(userId);
        const backendName = patientResponse.data?.profile?.name;
        if (backendName?.trim()) {
          const firstName = backendName.trim().split(/\s+/)[0];
          setUserName(firstName || 'Patient');
          await AsyncStorage.setItem('userName', backendName.trim());
          return;
        }
      }

      // Last-resort fallback to avoid generic "Patient" when email exists
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail?.trim()) {
        const localPart = userEmail.split('@')[0]?.trim();
        if (localPart) {
          const fallbackName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
          setUserName(fallbackName);
          await AsyncStorage.setItem('userName', fallbackName);
        }
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const hasBiometricData = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    const biometricKeys = [
      'bloodPressureSystolic',
      'bloodPressureDiastolic',
      'heartRate',
      'temperature',
      'weight',
      'height',
      'respiratoryRate',
      'painLevel',
      'bloodOxygen',
      'bloodSugar',
    ];

    return biometricKeys.some((key) => {
      const value = data[key];
      return value !== undefined && value !== null && String(value).trim() !== '';
    });
  };

  const loadBiometrics = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;

      const response = await api.getBiometrics(userId);
      const latestBiometrics = response.data;

      if (response.error || !hasBiometricData(latestBiometrics)) {
        setBiometrics(null);
        return;
      }

      setBiometrics(latestBiometrics);
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  };

  const getMetricValue = (key: string, fallback = 'N/A') => {
    const value = biometrics?.[key];
    if (value === undefined || value === null || String(value).trim() === '') return fallback;
    return String(value);
  };

  const getBiometricTimestamp = () => {
    if (!biometrics?.timestamp) return 'No data';
    return new Date(biometrics.timestamp).toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {userName} 👋</Text>
              <Text style={styles.subtitle}>How are you feeling today?</Text>
            </View>
            <Avatar.Text
              size={56}
              label={userName[0]}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="chat-processing"
              title="Start Consultation"
              description="Get diagnosed by AI & doctor"
              color={theme.colors.primary}
              onPress={startConsultationFlow}
            />
            <QuickActionCard
              icon="heart-pulse"
              title="Log Biometrics"
              description="Record your vitals"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('BiometricEntry' as never)}
            />
          </View>
          {activeConsultation?.roomName && (
            <Button
              mode="contained"
              icon="play-circle"
              onPress={handleRejoinConsultation}
              style={styles.continueButton}
              contentStyle={styles.continueButtonContent}
            >
              {activeConsultation.status === 'active' ? 'Join Consultation' : 'Continue Consultation'}
            </Button>
          )}
        </View>

        {/* Health Status Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Health Status</Text>
          {biometrics ? (
            <>
              <HealthMetricCard
                icon="heart"
                label="Heart Rate"
                value={getMetricValue('heartRate')}
                unit="BPM"
                status="logged"
                timestamp={getBiometricTimestamp()}
              />
              <HealthMetricCard
                icon="thermometer"
                label="Temperature"
                value={getMetricValue('temperature')}
                unit={`°${getMetricValue('temperatureUnit', 'F')}`}
                status="logged"
                timestamp={getBiometricTimestamp()}
              />
              <HealthMetricCard
                icon="blood-bag"
                label="Blood Pressure"
                value={`${getMetricValue('bloodPressureSystolic')}/${getMetricValue('bloodPressureDiastolic')}`}
                unit="mmHg"
                status="logged"
                timestamp={getBiometricTimestamp()}
              />
            </>
          ) : (
            <Card style={[styles.consultationCard, shadows.small]}>
              <Card.Content>
                <View style={styles.emptyStateContent}>
                  <MaterialCommunityIcons
                    name="heart-pulse"
                    size={48}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyTitle}>No Biometrics Logged</Text>
                  <Text style={styles.emptySubtext}>
                    Add your biometric data to personalize triage and doctor insights.
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate('BiometricEntry' as never)}
                    style={styles.emptyActionButton}
                  >
                    Log Biometrics
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>

        {/* Recent Consultations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Consultations</Text>
            <Button mode="text" compact onPress={() => navigation.navigate('History' as never)}>
              View All
            </Button>
          </View>
          {recentConsultations.length > 0 ? (
            recentConsultations.map((consultation: any) => (
              <Card key={consultation.id} style={[styles.consultationCard, shadows.small]}>
                <Card.Content style={styles.consultationContent}>
                  <View style={styles.consultationLeft}>
                    <Avatar.Text
                      size={48}
                      label={consultation.doctorName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'Dr'}
                    />
                    <View style={styles.consultationInfo}>
                      <Text style={styles.consultationDoctor}>{consultation.doctorName || 'Doctor'}</Text>
                      <Text style={styles.consultationDate}>
                        {new Date(consultation.completedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.consultationRight}>
                    <Text style={styles.consultationDiagnosis} numberOfLines={1}>
                      {consultation.summary || 'Consultation'}
                    </Text>
                    <View style={styles.consultationStatusBadge}>
                      <Text style={styles.consultationStatus}>Completed</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))
          ) : (
            <Card style={[styles.consultationCard, shadows.small]}>
              <Card.Content>
                <View style={styles.emptyStateContent}>
                  <MaterialCommunityIcons
                    name="history"
                    size={48}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyTitle}>No Consultations Yet</Text>
                  <Text style={styles.emptySubtext}>
                    Start a consultation to get diagnosed by our AI and doctors
                  </Text>
                  <Button
                    mode="contained"
                    onPress={startConsultationFlow}
                    style={styles.emptyActionButton}
                  >
                    Start First Consultation
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        label="New Consultation"
        style={styles.fab}
        onPress={startConsultationFlow}
      />
    </SafeAreaView>
  );
}

function QuickActionCard({ icon, title, description, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.7}>
      <Surface style={[styles.quickActionSurface, shadows.medium]}>
        <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons name={icon} size={32} color={color} />
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </Surface>
    </TouchableOpacity>
  );
}

function HealthMetricCard({ icon, label, value, unit, status, timestamp }: any) {
  const statusColor = status === 'normal' ? theme.colors.success : theme.colors.error;

  return (
    <Card style={[styles.healthCard, shadows.small]}>
      <Card.Content style={styles.healthCardContent}>
        <View style={styles.healthCardLeft}>
          <View style={[styles.healthIcon, { backgroundColor: `${statusColor}15` }]}>
            <MaterialCommunityIcons name={icon} size={24} color={statusColor} />
          </View>
          <View>
            <Text style={styles.healthLabel}>{label}</Text>
            <Text style={styles.healthTimestamp}>{timestamp}</Text>
          </View>
        </View>
        <View style={styles.healthCardRight}>
          <Text style={styles.healthValue}>
            {value}
            <Text style={styles.healthUnit}> {unit}</Text>
          </Text>
          <View style={[styles.healthStatus, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.healthStatusText, { color: statusColor }]}>
              {status}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

function ConsultationCard({ doctorName, date, diagnosis, status }: any) {
  return (
    <Card style={[styles.consultationCard, shadows.small]}>
      <Card.Content style={styles.consultationContent}>
        <View style={styles.consultationLeft}>
          <Avatar.Text size={48} label={doctorName.split(' ')[1][0]} />
          <View style={styles.consultationInfo}>
            <Text style={styles.consultationDoctor}>{doctorName}</Text>
            <Text style={styles.consultationDate}>{date}</Text>
          </View>
        </View>
        <View style={styles.consultationRight}>
          <Text style={styles.consultationDiagnosis}>{diagnosis}</Text>
          <View style={styles.consultationStatusBadge}>
            <Text style={styles.consultationStatus}>✓ {status}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomLeftRadius: spacing.lg * 2,
    borderBottomRightRadius: spacing.lg * 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  avatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  continueButton: {
    marginTop: spacing.md,
    borderRadius: theme.roundness,
  },
  continueButtonContent: {
    height: 48,
  },
  quickActionCard: {
    flex: 1,
  },
  quickActionSurface: {
    padding: spacing.lg,
    borderRadius: theme.roundness * 1.5,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  healthCard: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  healthCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  healthIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs / 2,
  },
  healthTimestamp: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  healthCardRight: {
    alignItems: 'flex-end',
  },
  healthValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  healthUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.onSurfaceVariant,
  },
  healthStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: theme.roundness,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  consultationCard: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  consultationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  consultationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  consultationInfo: {
    flex: 1,
  },
  consultationDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs / 2,
  },
  consultationDate: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  consultationRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  consultationDiagnosis: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  consultationStatusBadge: {
    backgroundColor: `${theme.colors.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: theme.roundness,
  },
  consultationStatus: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  emptyStateContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyActionButton: {
    marginTop: spacing.md,
  },
});
