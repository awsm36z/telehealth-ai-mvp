import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Avatar, Chip, FAB, Surface, Searchbar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { theme, spacing, shadows } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import api from '../../utils/api';

export default function DoctorDashboardScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { contentContainerStyle, isTablet } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [doctorName, setDoctorName] = useState('Doctor');
  const [recentConsultations, setRecentConsultations] = useState<any[]>([]);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [avgDurationLabel, setAvgDurationLabel] = useState('0m');

  useEffect(() => {
    AsyncStorage.getItem('userName').then((name) => {
      if (name?.trim()) setDoctorName(name.trim());
    });
  }, []);

  // Fetch patients and active calls when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPatients();
      fetchActiveCalls();
      fetchConsultationStats();
      const interval = setInterval(() => {
        fetchPatients();
        fetchActiveCalls();
        fetchConsultationStats();
      }, 5000);
      return () => clearInterval(interval);
    }, [])
  );

  const fetchPatients = async () => {
    try {
      const response = await api.getPatientQueue();
      if (response.data) {
        // Map backend data to UI format
        const formattedPatients = response.data.map((patient: any) => ({
          id: patient.id || patient._id,
          name: patient.name || 'Unknown',
          age: patient.age || 0,
          language: patient.language || 'en',
          chiefComplaint: patient.chiefComplaint || 'General consultation',
          triageCompleted: new Date(patient.triageCompletedAt).toLocaleString() || 'Pending',
          status: patient.status || 'waiting',
          severity: patient.severity || 'low',
        }));
        setPatients(formattedPatients);
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveCalls = async () => {
    try {
      const response = await api.getActiveCalls();
      if (response.data) {
        setActiveCalls(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch active calls:', error);
    }
  };

  const fetchConsultationStats = async () => {
    try {
      const response = await api.getAllConsultations();
      const consultations = response.data || [];
      const now = new Date();
      const isToday = (iso: string) => {
        const d = new Date(iso);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      };
      const normalized = consultations
        .map((item: any, index: number) => {
          const completedAt = item?.completedAt || item?.endedAt || item?.updatedAt || new Date().toISOString();
          const startedAt = item?.startedAt || item?.createdAt || completedAt;
          const durationMinutes =
            typeof item?.durationMinutes === 'number'
              ? item.durationMinutes
              : Math.max(1, Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000));
          return {
            id: String(item?.id || item?._id || `c-${index}`),
            patientName: item?.patientName || item?.patient?.name || t('common.unknown', { defaultValue: 'Unknown' }),
            completedAt,
            durationMinutes,
            primaryDiagnosis:
              item?.primaryDiagnosis ||
              (Array.isArray(item?.possibleConditions) && item.possibleConditions[0]
                ? (typeof item.possibleConditions[0] === 'string' ? item.possibleConditions[0] : item.possibleConditions[0]?.name)
                : ''),
            reportStatus: item?.reportStatus || 'ready',
          };
        })
        .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      const todayItems = normalized.filter((item: any) => isToday(item.completedAt));
      setTodayCompletedCount(todayItems.length);
      setRecentConsultations(normalized.slice(0, 3));

      const avg = todayItems.length
        ? Math.round(todayItems.reduce((sum: number, item: any) => sum + (item.durationMinutes || 0), 0) / todayItems.length)
        : 0;
      setAvgDurationLabel(`${avg}m`);
    } catch (error) {
      console.error('Failed to fetch consultation stats:', error);
    }
  };

  const startConsultation = async (patient: any) => {
    // Find active call for this patient
    const call = activeCalls.find(
      (c) =>
        String(c.patientId) === String(patient.id) &&
        (c.status === 'waiting' || c.status === 'active')
    );

    if (call) {
      // Fetch real insights, biometrics, and triage transcript from backend
      let insights = null;
      let biometrics = null;
      let triageTranscript = null;
      try {
        const [insightsRes, biometricsRes, triageRes] = await Promise.all([
          api.getInsights(patient.id),
          api.getBiometrics(patient.id),
          api.getTriageData(patient.id),
        ]);
        if (insightsRes.data) insights = insightsRes.data;
        if (biometricsRes.data) biometrics = biometricsRes.data;
        if (triageRes.data) triageTranscript = triageRes.data;
      } catch (error) {
        console.error('Failed to fetch patient data:', error);
      }

      navigation.navigate('DoctorVideoCall', {
        roomName: call.roomName,
        patientId: patient.id,
        patientName: patient.name,
        patientLanguage: patient.language || 'en',
        insights,
        biometrics,
        triageTranscript,
      });
    } else {
      Alert.alert(
        t('doctor.noActiveCall'),
        t('doctor.noActiveCallMessage'),
        [{ text: t('common.ok') }]
      );
    }
  };

  // Show only patients who currently have an active waiting/active call.
  const activePatientIds = new Set(
    activeCalls
      .filter((call: any) => call.status === 'waiting' || call.status === 'active')
      .map((call: any) => String(call.patientId))
  );

  const patientsForDisplay = patients
    .filter((patient) => activePatientIds.has(String(patient.id)))
    .filter((patient) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        patient.name.toLowerCase().includes(q) ||
        patient.chiefComplaint.toLowerCase().includes(q) ||
        String(patient.id).includes(q)
      );
    });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, contentContainerStyle]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Dr. {doctorName.split(' ').pop() || doctorName}</Text>
              <Text style={styles.subtitle}>{t('doctor.patientsWaiting', { count: patientsForDisplay.length })}</Text>
            </View>
            <Avatar.Text
              size={56}
              label={doctorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="account-clock"
            value={String(patientsForDisplay.length)}
            label={t('doctor.waiting')}
            color={theme.colors.warning}
          />
          <StatCard
            icon="check-circle"
            value={String(todayCompletedCount)}
            label={t('doctor.todayCompleted', { defaultValue: 'Completed Today' })}
            color={theme.colors.success}
            onPress={() => navigation.navigate('History', { todayOnly: true })}
          />
          <StatCard icon="clock" value={avgDurationLabel} label={t('doctor.avgTime')} color={theme.colors.info} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder={t('doctor.searchPatients')}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        {/* Patient Queue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('doctor.patientQueue')}</Text>
          {!loading && patientsForDisplay.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>{t('doctor.noPatients')}</Text>
                <Text style={styles.emptySubtext}>{t('doctor.noPatientsSubtext')}</Text>
              </Card.Content>
            </Card>
          ) : (
            patientsForDisplay.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                navigation={navigation}
                hasActiveCall={activeCalls.some(
                  (c) =>
                    String(c.patientId) === String(patient.id) &&
                    (c.status === 'waiting' || c.status === 'active')
                )}
                onStartCall={() => startConsultation(patient)}
                onOpenMedication={() =>
                  navigation.navigate('DoctorMedicationAssist', {
                    patientId: patient.id,
                    patientName: patient.name,
                    locale: patient.language === 'ar' ? 'MA' : undefined,
                  })
                }
                t={t}
                isTablet={isTablet}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.lastConsultationsHeader}>
            <Text style={styles.sectionTitle}>
              {t('doctor.lastConsultations', { defaultValue: 'Last Consultations' })}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('History', { todayOnly: false, openConsultationId: null })}>
              <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {recentConsultations.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  {t('doctor.noRecentConsultations', { defaultValue: 'No recent completed consultations' })}
                </Text>
              </Card.Content>
            </Card>
          ) : (
            recentConsultations.map((consultation) => (
              <TouchableOpacity
                key={consultation.id}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('History', { todayOnly: false, openConsultationId: consultation.id })}
              >
                <Card style={[styles.recentConsultationCard, shadows.small]}>
                  <Card.Content style={styles.recentConsultationContent}>
                    <View>
                      <Text style={styles.recentConsultationName}>{consultation.patientName}</Text>
                      <Text style={styles.recentConsultationMeta}>
                        {new Date(consultation.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {consultation.durationMinutes}m
                      </Text>
                    </View>
                    <View style={styles.recentConsultationRight}>
                      <Chip compact style={styles.completedChip}>
                        {t('history.completed')}
                      </Chip>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                    </View>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} disabled={!onPress}>
      <Surface style={[styles.statCard, shadows.medium]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      </Surface>
    </TouchableOpacity>
  );
}

function PatientCard({ patient, navigation, hasActiveCall, onStartCall, onOpenMedication, t, isTablet }: any) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.success;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => navigation.navigate('PatientDetails', { patientId: patient.id })}
    >
      <Card style={[styles.patientCard, shadows.small]}>
        <Card.Content>
          <View style={styles.patientHeader}>
            <View style={styles.patientInfo}>
              <Avatar.Text size={48} label={patient.name.split(' ').map((n: string) => n[0]).join('')} />
              <View style={styles.patientDetails}>
                <View style={styles.patientNameRow}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  {patient.status === 'urgent' && (
                    <Chip
                      mode="flat"
                      style={styles.urgentChip}
                      textStyle={styles.urgentText}
                      icon="alert"
                    >
                      URGENT
                    </Chip>
                  )}
                </View>
                <Text style={styles.patientAge}>{patient.age} years old</Text>
              </View>
            </View>
            <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(patient.severity) }]} />
          </View>

          <View style={styles.complaintContainer}>
            <MaterialCommunityIcons
              name="clipboard-text"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={styles.complaintText}>{patient.chiefComplaint}</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.triageTime}>
              <MaterialCommunityIcons name="clock" size={14} />
              {' '}Completed {patient.triageCompleted}
            </Text>
            <Chip
              mode="flat"
              style={styles.aiChip}
              textStyle={styles.aiChipText}
              icon="brain"
            >
              {t('doctor.aiInsightsReady')}
            </Chip>
          </View>

          {/* Start Call Button */}
          <View style={[styles.actionRow, isTablet && styles.actionRowTablet]}>
            {hasActiveCall && (
              <Button
                mode="contained"
                icon="video"
                onPress={onStartCall}
                style={[styles.startCallButton, isTablet && styles.actionButtonTablet]}
                labelStyle={styles.startCallLabel}
              >
                {t('doctor.startVideoConsultation')}
              </Button>
            )}
            <Button
              mode={hasActiveCall ? 'outlined' : 'contained'}
              icon="pill"
              onPress={onOpenMedication}
              style={[styles.medicationButton, isTablet && styles.actionButtonTablet]}
            >
              Medication AI
            </Button>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.lg * 2,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness * 1.5,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs / 2,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  lastConsultationsHeader: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  searchbar: {
    backgroundColor: theme.colors.surface,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: spacing.md,
  },
  patientCard: {
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surface,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  patientDetails: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs / 2,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  urgentChip: {
    height: 24,
    backgroundColor: `${theme.colors.error}15`,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.error,
  },
  patientAge: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  severityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  complaintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: `${theme.colors.primary}08`,
    padding: spacing.md,
    borderRadius: theme.roundness,
    marginBottom: spacing.md,
  },
  complaintText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  triageTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  aiChip: {
    height: 28,
    backgroundColor: `${theme.colors.secondary}15`,
  },
  aiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  startCallButton: {
    backgroundColor: '#4CAF50',
    borderRadius: theme.roundness,
    flex: 1,
  },
  startCallLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionRowTablet: {
    gap: spacing.md,
  },
  actionButtonTablet: {
    minHeight: 48,
  },
  medicationButton: {
    flex: 1,
    borderRadius: theme.roundness,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  recentConsultationCard: {
    marginBottom: spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  recentConsultationContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentConsultationName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  recentConsultationMeta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  recentConsultationRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  completedChip: {
    backgroundColor: `${theme.colors.success}18`,
  },
});
