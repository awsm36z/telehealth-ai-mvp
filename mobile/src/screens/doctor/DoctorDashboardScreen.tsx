import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Avatar, Chip, FAB, Surface, Searchbar, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

export default function DoctorDashboardScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch patients and active calls when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPatients();
      fetchActiveCalls();
      const interval = setInterval(() => {
        fetchPatients();
        fetchActiveCalls();
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
        insights,
        biometrics,
        triageTranscript,
      });
    } else {
      Alert.alert(
        'No Active Call',
        'This patient does not have an active video call waiting. They need to complete triage first.',
        [{ text: 'OK' }]
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
              <Text style={styles.greeting}>Dr. Martinez</Text>
              <Text style={styles.subtitle}>{patientsForDisplay.length} patients waiting</Text>
            </View>
            <Avatar.Text
              size={56}
              label="DM"
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
            label="Waiting"
            color={theme.colors.warning}
          />
          <StatCard icon="check-circle" value="8" label="Today" color={theme.colors.success} />
          <StatCard icon="clock" value="24m" label="Avg Time" color={theme.colors.info} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search patients..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
        </View>

        {/* Patient Queue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient Queue</Text>
          {!loading && patientsForDisplay.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>No patients in queue</Text>
                <Text style={styles.emptySubtext}>Patients will appear here after completing triage</Text>
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
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ icon, value, label, color }: any) {
  return (
    <Surface style={[styles.statCard, shadows.medium]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Surface>
  );
}

function PatientCard({ patient, navigation, hasActiveCall, onStartCall }: any) {
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
              AI Insights Ready
            </Chip>
          </View>

          {/* Start Call Button */}
          {hasActiveCall && (
            <Button
              mode="contained"
              icon="video"
              onPress={onStartCall}
              style={styles.startCallButton}
              labelStyle={styles.startCallLabel}
            >
              Start Video Consultation
            </Button>
          )}
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
    marginTop: spacing.md,
    backgroundColor: '#4CAF50',
    borderRadius: theme.roundness,
  },
  startCallLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
});
