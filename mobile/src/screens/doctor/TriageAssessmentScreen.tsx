import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, spacing, shadows } from '../../theme';

interface TriageAssessmentScreenProps {
  route: any;
  navigation: any;
}

export default function TriageAssessmentScreen({ route, navigation }: TriageAssessmentScreenProps) {
  const { patientName, completedAt, messages = [] } = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => navigation.goBack()} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Full Triage Assessment</Text>
          <Text style={styles.headerSubtitle}>{patientName || 'Patient'}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {completedAt && (
          <Surface style={[styles.metaCard, shadows.small]}>
            <Text style={styles.metaLabel}>Completed</Text>
            <Text style={styles.metaValue}>{new Date(completedAt).toLocaleString()}</Text>
          </Surface>
        )}

        {messages.length > 0 ? (
          messages.map((msg: any, index: number) => {
            const isPatient = msg.role === 'user';
            return (
              <Card key={`${msg.role}-${index}`} style={[styles.messageCard, shadows.small]}>
                <Card.Content>
                  <Text style={[styles.role, isPatient ? styles.patientRole : styles.aiRole]}>
                    {isPatient ? 'Patient' : 'AI Assistant'}
                  </Text>
                  <Text style={styles.messageText}>{msg.content}</Text>
                </Card.Content>
              </Card>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No triage assessment data available.</Text>
        )}
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  metaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  metaLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs / 2,
  },
  metaValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  messageCard: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.sm,
  },
  role: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  patientRole: {
    color: theme.colors.primary,
  },
  aiRole: {
    color: theme.colors.secondary,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
