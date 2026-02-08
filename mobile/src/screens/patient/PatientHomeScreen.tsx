import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, Button, Avatar, Surface, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, spacing, shadows } from '../../theme';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function PatientHomeScreen() {
  const navigation = useNavigation();
  const [userName] = useState('Sarah'); // Would come from context/state

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
              onPress={() => navigation.navigate('TriageFlow' as never)}
            />
            <QuickActionCard
              icon="heart-pulse"
              title="Log Biometrics"
              description="Record your vitals"
              color={theme.colors.secondary}
              onPress={() => navigation.navigate('BiometricEntry' as never)}
            />
          </View>
        </View>

        {/* Health Status Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Health Status</Text>
          <HealthMetricCard
            icon="heart"
            label="Heart Rate"
            value="72"
            unit="BPM"
            status="normal"
            timestamp="2 hours ago"
          />
          <HealthMetricCard
            icon="thermometer"
            label="Temperature"
            value="98.6"
            unit="°F"
            status="normal"
            timestamp="Today"
          />
          <HealthMetricCard
            icon="blood-bag"
            label="Blood Pressure"
            value="120/80"
            unit="mmHg"
            status="normal"
            timestamp="Yesterday"
          />
        </View>

        {/* Recent Consultations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Consultations</Text>
            <Button mode="text" compact onPress={() => navigation.navigate('History' as never)}>
              View All
            </Button>
          </View>
          <ConsultationCard
            doctorName="Dr. Martinez"
            date="Jan 28, 2026"
            diagnosis="Common Cold"
            status="completed"
          />
          <ConsultationCard
            doctorName="Dr. Chen"
            date="Jan 15, 2026"
            diagnosis="Annual Checkup"
            status="completed"
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        label="New Consultation"
        style={styles.fab}
        onPress={() => navigation.navigate('TriageFlow' as never)}
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
    bottom: spacing.xl + 70, // Account for tab bar
    backgroundColor: theme.colors.primary,
  },
});
