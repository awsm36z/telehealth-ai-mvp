import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, Divider, ActivityIndicator, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, spacing } from '../../theme';
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
            <Text style={styles.sectionTitle}>Patient Information</Text>
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
                  <Text style={styles.value}>{patient.age || 'N/A'}</Text>
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
          </Card.Content>
        </Card>

        {/* Biometrics Card */}
        {biometrics && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Latest Biometrics</Text>
              <Divider style={styles.divider} />

              {biometrics.length > 0 ? (
                biometrics.slice(-1).map((bio: any, index: number) => (
                  <View key={index}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Heart Rate:</Text>
                      <Text style={styles.value}>{bio.heartRate || 'N/A'} bpm</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Blood Pressure:</Text>
                      <Text style={styles.value}>
                        {bio.bloodPressureSystolic || 'N/A'}/{bio.bloodPressureDiastolic || 'N/A'} mmHg
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Temperature:</Text>
                      <Text style={styles.value}>{bio.temperature || 'N/A'}°{bio.temperatureUnit || 'F'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Oxygen Saturation:</Text>
                      <Text style={styles.value}>{bio.bloodOxygen || 'N/A'}%</Text>
                    </View>
                    {bio.respiratoryRate && (
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Respiratory Rate:</Text>
                        <Text style={styles.value}>{bio.respiratoryRate} breaths/min</Text>
                      </View>
                    )}
                    {bio.painLevel && (
                      <View style={styles.infoRow}>
                        <Text style={styles.label}>Pain Level:</Text>
                        <Text style={styles.value}>{bio.painLevel}/10</Text>
                      </View>
                    )}
                  </View>
                ))
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
              <Text style={styles.sectionTitle}>Triage Assessment</Text>
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
                  {triageData.messages.slice(-4).map((msg: any, idx: number) => (
                    <View key={idx} style={styles.triageMessage}>
                      <Text style={styles.triageRole}>
                        {msg.role === 'user' ? 'Patient' : 'AI'}:
                      </Text>
                      <Text style={styles.triageContent}>{msg.content}</Text>
                    </View>
                  ))}
                  {triageData.messages.length > 4 && (
                    <Text style={styles.noDataText}>
                      ...and {triageData.messages.length - 4} more messages
                    </Text>
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
              <Text style={styles.sectionTitle}>AI Insights</Text>
              <Divider style={styles.divider} />

              {typeof insights === 'object' && Object.keys(insights).length > 0 ? (
                <>
                  {insights.summary && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Summary:</Text>
                      <Text style={styles.value}>{insights.summary}</Text>
                    </View>
                  )}
                  {insights.keyFindings && insights.keyFindings.length > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Key Findings:</Text>
                      <Text style={styles.value}>
                        {insights.keyFindings.join(', ')}
                      </Text>
                    </View>
                  )}
                  {insights.possibleConditions && insights.possibleConditions.length > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Possible Conditions:</Text>
                      <Text style={styles.value}>
                        {insights.possibleConditions.map((c: any) =>
                          `${c.name} (${c.confidence})`
                        ).join(', ')}
                      </Text>
                    </View>
                  )}
                  {insights.nextSteps && insights.nextSteps.length > 0 && (
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Next Steps:</Text>
                      <Text style={styles.value}>
                        {insights.nextSteps.join(', ')}
                      </Text>
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
              // Generate a unique room name for this consultation
              const roomName = `consultation-${patientId}-${Date.now()}`;
              
              // Navigate to video call with all required data
              navigation.navigate('DoctorVideoCall', {
                roomName,
                patientId,
                patientName: patient?.name || 'Unknown Patient',
                insights,
                biometrics,
                triageTranscript: triageData,
              });
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
  triageMessages: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  triageMessage: {
    paddingVertical: spacing.xs,
  },
  triageRole: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  triageContent: {
    fontSize: 13,
    color: theme.colors.onSurface,
    lineHeight: 18,
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
