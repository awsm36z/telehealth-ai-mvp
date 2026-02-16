import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';
import api from '../../utils/api';

interface PatientDetailsScreenProps {
  route: any;
  navigation: any;
}

export default function PatientDetailsScreen({ route, navigation }: PatientDetailsScreenProps) {
  const { patientId } = route.params;
  const [patient, setPatient] = useState<any>(null);
  const [biometrics, setBiometrics] = useState<any>(null);
  const [triageData, setTriageData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatientDetails();
  }, [patientId]);

  const loadPatientDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load patient info (includes profile, biometrics, insights, triageData)
      const patientRes = await api.getPatient(patientId);
      if (patientRes.error) {
        setError(patientRes.error);
        setLoading(false);
        return;
      }

      const data = patientRes.data;
      
      // Extract all data from the response
      if (data.profile) {
        setPatient(data.profile);
      }
      if (data.biometrics) {
        setBiometrics(Array.isArray(data.biometrics) ? data.biometrics : [data.biometrics]);
      }
      if (data.insights) {
        setInsights(data.insights);
      }
      if (data.triageData) {
        setTriageData(data.triageData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load patient details');
    } finally {
      setLoading(false);
    }
  };

  const parseDateOfBirth = (dateOfBirth: string): Date | null => {
    if (!dateOfBirth) return null;

    // Supports MM/DD/YYYY and ISO-compatible date formats.
    if (dateOfBirth.includes('/')) {
      const parts = dateOfBirth.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
          return new Date(year, month - 1, day);
        }
      }
    }

    const parsed = new Date(dateOfBirth);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const calculateAge = (dateOfBirth: string): string => {
    const dob = parseDateOfBirth(dateOfBirth);
    if (!dob) return 'N/A';

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    const hasHadBirthdayThisYear =
      monthDiff > 0 || (monthDiff === 0 && today.getDate() >= dob.getDate());

    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }

    return age >= 0 ? String(age) : 'N/A';
  };

  const latestBiometric = biometrics && biometrics.length > 0
    ? biometrics[biometrics.length - 1]
    : null;

  const getWeightDisplay = () => {
    if (!latestBiometric?.weight) return 'N/A';
    const unit = latestBiometric.weightUnit || 'lbs';
    return `${latestBiometric.weight} ${unit}`;
  };

  const getHeightDisplay = () => {
    if (!latestBiometric?.height) return 'N/A';
    const unit = (latestBiometric.heightUnit || 'cm').toLowerCase();
    const rawHeight = Number(latestBiometric.height);

    if (unit === 'in' && !Number.isNaN(rawHeight) && rawHeight > 0) {
      const totalInches = Math.round(rawHeight);
      const feet = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      return `${feet} ft ${inches} in`;
    }

    return `${latestBiometric.height} ${latestBiometric.heightUnit || 'cm'}`;
  };

  const ageDisplay = patient?.dateOfBirth
    ? calculateAge(patient.dateOfBirth)
    : (patient?.age ? String(patient.age) : 'N/A');

  const openFullAssessment = () => {
    if (!triageData?.messages?.length) return;

    navigation.navigate('TriageAssessment', {
      patientName: patient?.name || 'Patient',
      completedAt: triageData.completedAt,
      messages: triageData.messages,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading patient details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Button mode="contained" onPress={loadPatientDetails} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Patient Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Patient Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Patient Information</Text>
            </View>
            <Divider style={styles.divider} />

            {patient && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{patient.name || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{patient.email || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Age:</Text>
                  <Text style={styles.value}>{ageDisplay}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Weight:</Text>
                  <Text style={styles.value}>{getWeightDisplay()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Height:</Text>
                  <Text style={styles.value}>{getHeightDisplay()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Gender:</Text>
                  <Text style={styles.value}>{patient.gender || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Phone:</Text>
                  <Text style={styles.value}>{patient.phone || 'N/A'}</Text>
                </View>
              </>
            )}

            <View style={styles.quickActions}>
              <Button
                mode="contained"
                icon="pill"
                onPress={() =>
                  navigation.navigate('DoctorMedicationAssist', {
                    patientId,
                    patientName: patient?.name,
                    locale: patient?.language === 'ar' ? 'MA' : undefined,
                  })
                }
                style={styles.quickButton}
              >
                Medication AI
              </Button>
              <Button
                mode="outlined"
                icon="message-outline"
                onPress={() =>
                  navigation.navigate('AsyncMessages', {
                    patientId,
                    senderType: 'doctor',
                    title: 'Patient Follow-up Messages',
                  })
                }
                style={styles.quickButton}
              >
                Messages
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Biometrics Card */}
        {biometrics && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="heart-pulse" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Latest Biometrics</Text>
              </View>
              <Divider style={styles.divider} />

              {biometrics.length > 0 ? (
                <View style={styles.biometricsGrid}>
                  {latestBiometric?.heartRate != null && (
                    <View style={styles.bioMetricTile}>
                      <MaterialCommunityIcons name="heart" size={22} color="#E53935" />
                      <Text style={styles.bioMetricValue}>{latestBiometric.heartRate}</Text>
                      <Text style={styles.bioMetricUnit}>BPM</Text>
                      <Text style={styles.bioMetricLabel}>Heart Rate</Text>
                    </View>
                  )}
                  {(latestBiometric?.bloodPressureSystolic != null || latestBiometric?.bloodPressureDiastolic != null) && (
                    <View style={styles.bioMetricTile}>
                      <MaterialCommunityIcons name="blood-bag" size={22} color="#D32F2F" />
                      <Text style={styles.bioMetricValue}>
                        {latestBiometric.bloodPressureSystolic || '—'}/{latestBiometric.bloodPressureDiastolic || '—'}
                      </Text>
                      <Text style={styles.bioMetricUnit}>mmHg</Text>
                      <Text style={styles.bioMetricLabel}>Blood Pressure</Text>
                    </View>
                  )}
                  {latestBiometric?.temperature != null && (
                    <View style={styles.bioMetricTile}>
                      <MaterialCommunityIcons name="thermometer" size={22} color="#FF9800" />
                      <Text style={styles.bioMetricValue}>{latestBiometric.temperature}°{latestBiometric.temperatureUnit || 'F'}</Text>
                      <Text style={styles.bioMetricUnit}> </Text>
                      <Text style={styles.bioMetricLabel}>Temperature</Text>
                    </View>
                  )}
                  {latestBiometric?.bloodOxygen != null && (
                    <View style={styles.bioMetricTile}>
                      <MaterialCommunityIcons name="water-percent" size={22} color="#1976D2" />
                      <Text style={styles.bioMetricValue}>{latestBiometric.bloodOxygen}%</Text>
                      <Text style={styles.bioMetricUnit}>SpO2</Text>
                      <Text style={styles.bioMetricLabel}>Oxygen</Text>
                    </View>
                  )}
                  {latestBiometric?.respiratoryRate != null && (
                    <View style={styles.bioMetricTile}>
                      <MaterialCommunityIcons name="lungs" size={22} color="#00897B" />
                      <Text style={styles.bioMetricValue}>{latestBiometric.respiratoryRate}</Text>
                      <Text style={styles.bioMetricUnit}>br/min</Text>
                      <Text style={styles.bioMetricLabel}>Resp. Rate</Text>
                    </View>
                  )}
                  {latestBiometric?.painLevel != null && (
                    <View style={styles.bioMetricTile}>
                      <MaterialCommunityIcons name="alert-circle" size={22} color={Number(latestBiometric.painLevel) >= 7 ? '#D32F2F' : '#FFA000'} />
                      <Text style={styles.bioMetricValue}>{latestBiometric.painLevel}/10</Text>
                      <Text style={styles.bioMetricUnit}> </Text>
                      <Text style={styles.bioMetricLabel}>Pain Level</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.noDataText}>No biometric data available</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Triage Data Card */}
        {triageData && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="clipboard-text" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Triage Assessment</Text>
              </View>
              <Divider style={styles.divider} />

              {triageData.completedAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Completed:</Text>
                  <Text style={styles.value}>
                    {new Date(triageData.completedAt).toLocaleString()}
                  </Text>
                </View>
              )}
              {triageData.messages && triageData.messages.length > 0 ? (
                <View style={styles.triageMessages}>
                  {triageData.messages.slice(-4).map((msg: any, idx: number) => {
                    const isPatient = msg.role === 'user';
                    return (
                      <View key={idx} style={[styles.triageBubble, isPatient ? styles.triageBubblePatient : styles.triageBubbleAI]}>
                        <Text style={[styles.triageRole, isPatient ? styles.triageRolePatient : styles.triageRoleAI]}>
                          {isPatient ? 'Patient' : 'AI Nurse'}
                        </Text>
                        <Text style={styles.triageContent}>{msg.content}</Text>
                      </View>
                    );
                  })}
                  {triageData.messages.length > 4 && (
                    <TouchableOpacity onPress={openFullAssessment} activeOpacity={0.7}>
                      <Text style={styles.triageLinkText}>
                        ...and {triageData.messages.length - 4} more messages (tap to view full assessment)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={styles.noDataText}>No triage conversation available</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Insights Card */}
        {insights && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>AI Insights</Text>
              </View>
              <Divider style={styles.divider} />

              {typeof insights === 'object' && Object.keys(insights).length > 0 ? (
                <>
                  {insights.summary && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightSectionLabel}>Summary</Text>
                      <Text style={styles.insightText}>{insights.summary}</Text>
                    </View>
                  )}
                  {insights.keyFindings && insights.keyFindings.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightSectionLabel}>Key Findings</Text>
                      {insights.keyFindings.map((finding: string, idx: number) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{finding}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {insights.possibleConditions && insights.possibleConditions.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightSectionLabel}>Possible Conditions</Text>
                      {insights.possibleConditions.map((c: any, idx: number) => (
                        <View key={idx} style={styles.conditionRow}>
                          <Text style={styles.conditionName}>{c.name}</Text>
                          <View style={[
                            styles.confidenceBadge,
                            { backgroundColor: c.confidence === 'High' ? '#FFCDD2' : c.confidence === 'Medium' ? '#FFF9C4' : '#C8E6C9' },
                          ]}>
                            <Text style={[
                              styles.confidenceText,
                              { color: c.confidence === 'High' ? '#C62828' : c.confidence === 'Medium' ? '#F57F17' : '#2E7D32' },
                            ]}>{c.confidence}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  {insights.nextSteps && insights.nextSteps.length > 0 && (
                    <View style={styles.insightSection}>
                      <Text style={styles.insightSectionLabel}>Recommended Next Steps</Text>
                      {insights.nextSteps.map((step: string, idx: number) => (
                        <View key={idx} style={styles.bulletRow}>
                          <Text style={styles.bulletDot}>{idx + 1}.</Text>
                          <Text style={styles.bulletText}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.noDataText}>No insights available yet. Patient may need to complete triage first.</Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={async () => {
              try {
                const callsResponse = await api.getActiveCalls();
                const existingCall = callsResponse.data?.find(
                  (call: any) =>
                    String(call.patientId) === String(patientId) &&
                    (call.status === 'waiting' || call.status === 'active')
                );

                if (!existingCall?.roomName) {
                  Alert.alert(
                    'No Active Call',
                    'This patient does not have an active waiting room. Ask the patient to start/rejoin consultation first.'
                  );
                  return;
                }

                navigation.navigate('DoctorVideoCall', {
                  roomName: existingCall.roomName,
                  patientId,
                  patientName: patient?.name || 'Unknown Patient',
                  patientLanguage: patient?.language || 'en',
                  insights,
                  biometrics,
                  triageTranscript: triageData,
                });
              } catch (error) {
                console.error('Failed to fetch active call:', error);
                Alert.alert('Error', 'Unable to load active call information.');
              }
            }}
            style={styles.button}
            icon="video"
          >
            Start Video Call
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              Alert.alert('Insights', 'View detailed insights for this patient');
            }}
            style={styles.button}
            icon="chart-line"
          >
            View Insights
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.md,
  },
  noDataText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  quickActions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
  },
  biometricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  bioMetricTile: {
    width: '30%',
    backgroundColor: `${theme.colors.primary}08`,
    borderRadius: theme.roundness,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  bioMetricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  bioMetricUnit: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  bioMetricLabel: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  insightSection: {
    marginBottom: spacing.md,
  },
  insightSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingLeft: spacing.xs,
    marginBottom: 4,
    gap: spacing.xs,
  },
  bulletDot: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    flex: 1,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
  },
  conditionName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.roundness,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  triageMessages: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  triageBubble: {
    padding: spacing.sm,
    borderRadius: theme.roundness,
    maxWidth: '90%',
  },
  triageBubblePatient: {
    backgroundColor: `${theme.colors.primary}12`,
    alignSelf: 'flex-end',
  },
  triageBubbleAI: {
    backgroundColor: `${theme.colors.onSurface}08`,
    alignSelf: 'flex-start',
  },
  triageRole: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  triageRolePatient: {
    color: theme.colors.primary,
  },
  triageRoleAI: {
    color: theme.colors.onSurfaceVariant,
  },
  triageContent: {
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  triageLinkText: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
    marginTop: spacing.xs,
  },
  actionButtons: {
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  button: {
    paddingVertical: spacing.sm,
  },
});
