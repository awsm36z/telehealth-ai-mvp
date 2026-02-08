import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, Chip, FAB, Surface, Searchbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';

export default function DoctorDashboardScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock patient queue data
  const patients = [
    {
      id: '1',
      name: 'Sarah Johnson',
      age: 32,
      chiefComplaint: 'Sore throat and fever',
      triageCompleted: '15 min ago',
      status: 'waiting',
      severity: 'medium',
    },
    {
      id: '2',
      name: 'Michael Chen',
      age: 45,
      chiefComplaint: 'Chest pain and shortness of breath',
      triageCompleted: '5 min ago',
      status: 'urgent',
      severity: 'high',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      age: 28,
      chiefComplaint: 'Headache and nausea',
      triageCompleted: '30 min ago',
      status: 'waiting',
      severity: 'low',
    },
  ];

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
              <Text style={styles.subtitle}>{patients.length} patients waiting</Text>
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
          <StatCard icon="account-clock" value="3" label="Waiting" color={theme.colors.warning} />
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
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} navigation={navigation} />
          ))}
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

function PatientCard({ patient, navigation }: any) {
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
              <Avatar.Text size={48} label={patient.name.split(' ').map(n => n[0]).join('')} />
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
});
